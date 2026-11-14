import { EventEmitter } from 'node:events';
import { DEFAULT_ROUND_COUNT, MAX_PLAYERS, MIN_PLAYERS, ROUND_COUNT_OPTIONS } from '@ib/shared';
import type { ErrorCode, FinalResult, GameMode, GuessResult, MyGuessState, PlayerPublic, PrivatePrompt, RoomPhase, RoomSettings, RoomState, RoundResult } from '@ib/shared';
import { randomPlayerId, randomRoomCode, randomToken } from './roomCode.ts';
import { GameEngine } from '../game/GameEngine.ts';
import type { GameRuntime, Timings } from '../game/GameEngine.ts';

export interface Player {
  id: string;
  name: string;
  /** Secret; only ever sent to this player. */
  token: string;
  socketId: string | null;
  connected: boolean;
  score: number;
  joinedAt: number;
  removeTimer: NodeJS.Timeout | null;
}

export interface Room {
  code: string;
  hostId: string;
  phase: RoomPhase;
  settings: RoomSettings;
  /** Insertion order = join order. */
  players: Map<string, Player>;
  createdAt: number;
  /** Server-only game state (secret target lives here). */
  game: GameRuntime | null;
  lastResult: RoundResult | null;
  finalResult: FinalResult | null;
}

export type StoreResult<T> = { ok: true; value: T } | { ok: false; code: ErrorCode; error: string };

const fail = (code: ErrorCode, error: string): { ok: false; code: ErrorCode; error: string } => ({ ok: false, code, error });

export interface StoreEvents {
  /** Something visible in the room changed: broadcast a fresh snapshot. */
  changed: [code: string];
  /** A player's seat was freed after the grace period. */
  removed: [code: string, player: Player];
  /** Last player gone; the room no longer exists. */
  closed: [code: string, createdAt: number];
  /** Secret prompt for exactly one player. */
  prompt: [code: string, playerId: string, prompt: PrivatePrompt];
}

interface StoreOptions {
  maxRooms: number;
  /** How long a disconnected player keeps their seat. */
  graceMs: number;
  /** Round timings (tests shorten these). */
  timings?: Partial<Timings>;
  now?: () => number;
}

/**
 * All room state lives here and every rule is enforced here. The socket layer
 * only translates events; it never mutates rooms directly.
 */
export class RoomStore extends EventEmitter<StoreEvents> {
  private rooms = new Map<string, Room>();
  private readonly opts: Required<Omit<StoreOptions, 'timings'>>;
  readonly engine: GameEngine;

  constructor(opts: StoreOptions) {
    super();
    const { timings, ...rest } = opts;
    this.opts = { now: Date.now, ...rest };
    this.engine = new GameEngine(
      {
        changed: (code) => this.emit('changed', code),
        prompt: (code, playerId, prompt) => this.emit('prompt', code, playerId, prompt),
      },
      { timings, now: this.opts.now },
    );
  }

  get roomCount(): number {
    return this.rooms.size;
  }

  get(code: string): Room | undefined {
    return this.rooms.get(code);
  }

  createRoom(name: string, mode: GameMode): StoreResult<{ room: Room; player: Player }> {
    if (this.rooms.size >= this.opts.maxRooms) {
      return fail('SERVER_BUSY', 'The server is full right now. Try again in a few minutes.');
    }
    let code = randomRoomCode();
    for (let i = 0; this.rooms.has(code); i++) {
      if (i > 50) return fail('SERVER_BUSY', 'Could not create a room. Try again.');
      code = randomRoomCode();
    }
    const player = this.newPlayer(name);
    const room: Room = {
      code,
      hostId: player.id,
      phase: 'lobby',
      settings: { mode, totalRounds: DEFAULT_ROUND_COUNT },
      players: new Map([[player.id, player]]),
      createdAt: this.opts.now(),
      game: null,
      lastResult: null,
      finalResult: null,
    };
    this.rooms.set(code, room);
    return { ok: true, value: { room, player } };
  }

  joinRoom(code: string, name: string): StoreResult<{ room: Room; player: Player }> {
    const room = this.rooms.get(code);
    if (!room) return fail('ROOM_NOT_FOUND', `There's no room with code ${code}. Check the code and try again.`);
    if (room.phase !== 'lobby') return fail('GAME_IN_PROGRESS', 'That game has already started. Ask the host to start a new one.');
    if (room.players.size >= MAX_PLAYERS) return fail('ROOM_FULL', `This room is full (${MAX_PLAYERS} players).`);
    const lower = name.toLocaleLowerCase();
    for (const p of room.players.values()) {
      if (p.name.toLocaleLowerCase() === lower) {
        return fail('NAME_TAKEN', `Someone in this room is already called "${p.name}". Pick another name.`);
      }
    }
    const player = this.newPlayer(name);
    room.players.set(player.id, player);
    this.emit('changed', code);
    return { ok: true, value: { room, player } };
  }

  /** Find the seat a token belongs to (for reconnects). */
  findByToken(code: string, token: string): { room: Room; player: Player } | null {
    const room = this.rooms.get(code);
    if (!room) return null;
    for (const p of room.players.values()) if (p.token === token) return { room, player: p };
    return null;
  }

  /** Attach a socket to a seat. Returns the socket it replaced, if any. */
  attach(room: Room, player: Player, socketId: string): { replacedSocketId: string | null; wasDisconnected: boolean } {
    const replacedSocketId = player.socketId && player.socketId !== socketId ? player.socketId : null;
    const wasDisconnected = !player.connected;
    player.socketId = socketId;
    player.connected = true;
    if (player.removeTimer) {
      clearTimeout(player.removeTimer);
      player.removeTimer = null;
    }
    if (wasDisconnected) this.emit('changed', room.code);
    return { replacedSocketId, wasDisconnected };
  }

  /** Socket dropped: keep the seat for the grace period, then free it. */
  markDisconnected(code: string, playerId: string, socketId: string): Player | null {
    const room = this.rooms.get(code);
    const player = room?.players.get(playerId);
    // Ignore stale sockets that were already replaced by a newer one.
    if (!room || !player || player.socketId !== socketId) return null;
    player.connected = false;
    player.socketId = null;
    player.removeTimer = setTimeout(() => {
      player.removeTimer = null;
      if (!player.connected) {
        this.removePlayer(code, playerId);
        this.emit('removed', code, player);
      }
    }, this.opts.graceMs);
    player.removeTimer.unref?.();
    this.emit('changed', code);
    this.engine.onDisconnected(room, playerId);
    return player;
  }

  /** Remove a player now (left on purpose, or grace period expired). */
  removePlayer(code: string, playerId: string): boolean {
    const room = this.rooms.get(code);
    const player = room?.players.get(playerId);
    if (!room || !player) return false;
    if (player.removeTimer) clearTimeout(player.removeTimer);
    room.players.delete(playerId);
    if (room.players.size === 0) {
      this.engine.dispose(room);
      this.rooms.delete(code);
      this.emit('closed', code, room.createdAt);
      return true;
    }
    if (room.hostId === playerId) room.hostId = this.pickNewHost(room).id;
    this.emit('changed', code);
    this.engine.onRemoved(room, playerId);
    return true;
  }

  selectMode(code: string, playerId: string, mode: GameMode): StoreResult<null> {
    const check = this.hostInLobby(code, playerId);
    if (!check.ok) return check;
    check.value.settings.mode = mode;
    this.emit('changed', code);
    return { ok: true, value: null };
  }

  setRounds(code: string, playerId: string, totalRounds: number): StoreResult<null> {
    const check = this.hostInLobby(code, playerId);
    if (!check.ok) return check;
    if (!(ROUND_COUNT_OPTIONS as readonly number[]).includes(totalRounds)) {
      return fail('INVALID_INPUT', `Rounds must be one of ${ROUND_COUNT_OPTIONS.join(', ')}.`);
    }
    check.value.settings.totalRounds = totalRounds;
    this.emit('changed', code);
    return { ok: true, value: null };
  }

  /** Host starts the game from the lobby. */
  startGame(code: string, playerId: string): StoreResult<null> {
    const check = this.hostInLobby(code, playerId);
    if (!check.ok) return check;
    return this.beginGame(check.value);
  }

  /** Host restarts after the final results: same players, scores reset. */
  playAgain(code: string, playerId: string): StoreResult<null> {
    const check = this.hostIn(code, playerId, 'finished');
    if (!check.ok) return check;
    return this.beginGame(check.value);
  }

  /** Host returns everyone to the lobby after the final results. */
  returnToLobby(code: string, playerId: string): StoreResult<null> {
    const check = this.hostIn(code, playerId, 'finished');
    if (!check.ok) return check;
    this.engine.toLobby(check.value);
    return { ok: true, value: null };
  }

  /** Host skips the round-results countdown. */
  nextRound(code: string, playerId: string): StoreResult<null> {
    const check = this.hostIn(code, playerId, 'round_results');
    if (!check.ok) return check;
    this.engine.skipResults(check.value);
    return { ok: true, value: null };
  }

  submitGuess(code: string, playerId: string, guess: unknown): StoreResult<GuessResult> {
    const room = this.rooms.get(code);
    if (!room || !room.players.has(playerId)) return fail('NOT_IN_ROOM', "You're not in this room anymore.");
    const r = this.engine.submitGuess(room, playerId, guess);
    return r.ok ? { ok: true, value: { correct: r.correct, guess: r.guess } } : r;
  }

  promptFor(room: Room, playerId: string): PrivatePrompt | null {
    return this.engine.promptFor(room, playerId);
  }

  guessStateFor(room: Room, playerId: string): MyGuessState | null {
    return this.engine.guessStateFor(room, playerId);
  }

  private beginGame(room: Room): StoreResult<null> {
    const connected = [...room.players.values()].filter((p) => p.connected).length;
    if (connected < MIN_PLAYERS) return fail('NOT_ENOUGH_PLAYERS', `You need at least ${MIN_PLAYERS} connected players to start.`);
    if (!room.settings.mode) return fail('NO_MODE', 'Pick a game mode first.');
    this.engine.start(room);
    return { ok: true, value: null };
  }

  /** The public snapshot. Never includes tokens or socket ids. */
  toPublic(room: Room): RoomState {
    const players: PlayerPublic[] = [...room.players.values()].map((p) => this.publicPlayer(room, p));
    return {
      code: room.code,
      hostId: room.hostId,
      phase: room.phase,
      settings: { ...room.settings },
      players,
      round: this.engine.publicRound(room),
      lastResult: room.phase === 'round_results' ? room.lastResult : null,
      finalResult: room.phase === 'finished' ? room.finalResult : null,
      serverNow: this.opts.now(),
    };
  }

  publicPlayer(room: Room, p: Player): PlayerPublic {
    return { id: p.id, name: p.name, isHost: p.id === room.hostId, connected: p.connected, score: p.score };
  }

  /** Stop all timers (tests, shutdown). */
  dispose(): void {
    for (const room of this.rooms.values()) {
      for (const p of room.players.values()) if (p.removeTimer) clearTimeout(p.removeTimer);
      this.engine.dispose(room);
    }
    this.rooms.clear();
  }

  private newPlayer(name: string): Player {
    return {
      id: randomPlayerId(),
      name,
      token: randomToken(),
      socketId: null,
      connected: false,
      score: 0,
      joinedAt: this.opts.now(),
      removeTimer: null,
    };
  }

  /** Longest-present connected player; if nobody is connected, longest-present player. */
  private pickNewHost(room: Room): Player {
    const all = [...room.players.values()];
    return all.find((p) => p.connected) ?? all[0];
  }

  private hostInLobby(code: string, playerId: string): StoreResult<Room> {
    const r = this.hostIn(code, playerId, 'lobby');
    if (!r.ok && r.code === 'WRONG_PHASE') return fail('GAME_IN_PROGRESS', 'The game has already started.');
    return r;
  }

  private hostIn(code: string, playerId: string, phase: RoomPhase): StoreResult<Room> {
    const room = this.rooms.get(code);
    if (!room || !room.players.has(playerId)) return fail('NOT_IN_ROOM', "You're not in this room anymore.");
    if (room.hostId !== playerId) return fail('NOT_HOST', 'Only the host can do that.');
    if (room.phase !== phase) return fail('WRONG_PHASE', "That can't be done right now.");
    return { ok: true, value: room };
  }
}
