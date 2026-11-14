import type { Server, Socket } from 'socket.io';
import type { Ack, ClientToServerEvents, ErrorCode, ServerToClientEvents, SessionGrant } from '@ib/shared';
import type { Player, Room, RoomStore } from '../rooms/RoomStore.ts';
import { KeyedLimiter, TokenBucket } from '../middleware/rateLimit.ts';
import type { VoiceService } from '../livekit/voice.ts';
import { parseCreate, parseJoin, parseMode, parseResume, parseRounds } from './validate.ts';

/** Per-socket data. Set only by the server, never trusted from the client. */
export interface SocketData {
  code: string | null;
  playerId: string | null;
  ip: string;
  limiter: TokenBucket;
}

export type GameServer = Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;
type GameSocket = Socket<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>;

const err = (code: ErrorCode, error: string) => ({ ok: false as const, code, error });

/** Wire Socket.IO events to the room store. */
export function registerHandlers(
  io: GameServer,
  store: RoomStore,
  opts: { trustProxy: boolean; roomCreateBurst: number; voice?: VoiceService | null },
) {
  const voice = opts.voice ?? null;
  // Room creation is the expensive action: a small burst per IP, refilling one every 6s.
  const createLimiter = new KeyedLimiter(opts.roomCreateBurst, 1 / 6);

  const broadcast = (code: string) => {
    const room = store.get(code);
    if (room) io.to(code).emit('room_updated', store.toPublic(room));
  };
  store.on('changed', broadcast);
  // Secret prompts go to one socket only — never to the room channel.
  store.on('prompt', (code, playerId, prompt) => {
    const player = store.get(code)?.players.get(playerId);
    if (player?.socketId) io.to(player.socketId).emit('private_prompt', prompt);
  });
  store.on('removed', (code, player) => {
    // If the removed player somehow still has a socket, tell it.
    if (player.socketId) io.to(player.socketId).emit('session_ended', { reason: 'removed' });
    const room = store.get(code);
    if (room && voice) void voice.kick(code, room.createdAt, player.id);
    broadcast(code);
  });
  store.on('closed', (code, createdAt) => {
    if (voice) void voice.closeRoom(code, createdAt);
  });

  io.on('connection', (socket: GameSocket) => {
    socket.data.code = null;
    socket.data.playerId = null;
    socket.data.ip = clientIp(socket, opts.trustProxy);
    // 30 actions burst, 5 per second sustained — plenty for a human, stops floods.
    socket.data.limiter = new TokenBucket(30, 5);

    /** Wrap a handler: rate limit, guarantee exactly one ack, and never let a throw kill the server. */
    const on = <E extends keyof ClientToServerEvents>(event: E, handler: (...args: unknown[]) => Ack<object> | Promise<Ack<object>>) => {
      socket.on(event, (async (...args: unknown[]) => {
        const ack = args.at(-1);
        const reply = typeof ack === 'function' ? (ack as (r: unknown) => void) : () => {};
        if (!socket.data.limiter.take()) return reply(err('RATE_LIMITED', 'Slow down a little and try again.'));
        try {
          reply(await handler(...args.slice(0, typeof ack === 'function' ? -1 : undefined)));
        } catch (e) {
          console.error(`[socket] ${event} failed`, e);
          reply(err('INVALID_INPUT', 'Something went wrong. Try again.'));
        }
      }) as never);
    };

    const grant = (room: Room, player: Player): Ack<SessionGrant> => ({
      ok: true,
      playerId: player.id,
      token: player.token,
      room: store.toPublic(room),
      serverNow: Date.now(),
      prompt: store.promptFor(room, player.id),
      myGuess: store.guessStateFor(room, player.id),
    });

    /** Put this socket into a seat, leaving any seat it held before (no duplicate entries). */
    const seat = (room: Room, player: Player) => {
      if (socket.data.code && (socket.data.code !== room.code || socket.data.playerId !== player.id)) leaveCurrent();
      const { replacedSocketId, wasDisconnected } = store.attach(room, player, socket.id);
      if (replacedSocketId) {
        // Same seat opened in another tab/connection: the newest one wins.
        const old = io.sockets.sockets.get(replacedSocketId);
        if (old) {
          old.emit('session_ended', { reason: 'replaced' });
          old.leave(room.code);
          old.data.code = null;
          old.data.playerId = null;
        }
      }
      socket.join(room.code);
      socket.data.code = room.code;
      socket.data.playerId = player.id;
      if (wasDisconnected) socket.to(room.code).emit('player_reconnected', { player: store.publicPlayer(room, player) });
    };

    const leaveCurrent = () => {
      const { code, playerId } = socket.data;
      if (!code || !playerId) return;
      const createdAt = store.get(code)?.createdAt;
      socket.leave(code);
      socket.data.code = null;
      socket.data.playerId = null;
      store.removePlayer(code, playerId);
      // Out of the game means out of its voice chat too.
      if (voice && createdAt !== undefined) void voice.kick(code, createdAt, playerId);
    };

    on('create_room', (payload) => {
      const p = parseCreate(payload);
      if (!p.ok) return err('INVALID_INPUT', p.error);
      if (!createLimiter.take(socket.data.ip)) return err('RATE_LIMITED', "You're creating rooms too fast. Wait a minute.");
      leaveCurrent();
      const r = store.createRoom(p.value.name, p.value.mode);
      if (!r.ok) return r;
      seat(r.value.room, r.value.player);
      return grant(r.value.room, r.value.player);
    });

    on('join_room', (payload) => {
      const p = parseJoin(payload);
      if (!p.ok) return err('INVALID_INPUT', p.error);
      // Already seated in this exact room on this connection: don't add a second copy.
      if (socket.data.code === p.value.code && socket.data.playerId) {
        const room = store.get(p.value.code);
        const me = room?.players.get(socket.data.playerId);
        if (room && me) return grant(room, me);
      }
      leaveCurrent();
      const r = store.joinRoom(p.value.code, p.value.name);
      if (!r.ok) return r;
      seat(r.value.room, r.value.player);
      return grant(r.value.room, r.value.player);
    });

    on('resume_session', (payload) => {
      const p = parseResume(payload);
      if (!p.ok) return err('INVALID_INPUT', p.error);
      const found = store.findByToken(p.value.code, p.value.token);
      if (!found) return err('SESSION_EXPIRED', 'That game session has ended.');
      seat(found.room, found.player);
      return grant(found.room, found.player);
    });

    on('leave_room', () => {
      leaveCurrent();
      return { ok: true };
    });

    const mine = () => (socket.data.code && socket.data.playerId ? { code: socket.data.code, playerId: socket.data.playerId } : null);

    on('select_mode', (payload) => {
      const me = mine();
      if (!me) return err('NOT_IN_ROOM', "You're not in a room.");
      const m = parseMode(payload);
      if (!m.ok) return err('INVALID_INPUT', m.error);
      const r = store.selectMode(me.code, me.playerId, m.value);
      return r.ok ? { ok: true } : r;
    });

    on('update_settings', (payload) => {
      const me = mine();
      if (!me) return err('NOT_IN_ROOM', "You're not in a room.");
      const n = parseRounds(payload);
      if (!n.ok) return err('INVALID_INPUT', n.error);
      const r = store.setRounds(me.code, me.playerId, n.value);
      return r.ok ? { ok: true } : r;
    });

    /** Host/game actions that take no payload and return a plain ok. */
    const simple = (event: 'start_game' | 'next_round' | 'play_again' | 'return_to_lobby', fn: (code: string, playerId: string) => { ok: boolean }) =>
      on(event, () => {
        const me = mine();
        if (!me) return err('NOT_IN_ROOM', "You're not in a room.");
        const r = fn(me.code, me.playerId) as Ack<object>;
        return r.ok ? { ok: true } : r;
      });
    simple('start_game', (c, p) => store.startGame(c, p));
    simple('next_round', (c, p) => store.nextRound(c, p));
    simple('play_again', (c, p) => store.playAgain(c, p));
    simple('return_to_lobby', (c, p) => store.returnToLobby(c, p));

    on('voice_token', async () => {
      const me = mine();
      if (!me) return err('NOT_IN_ROOM', "You're not in a room.");
      const room = store.get(me.code);
      const player = room?.players.get(me.playerId);
      if (!room || !player) return err('NOT_IN_ROOM', "You're not in this room anymore.");
      if (!voice) return err('VOICE_UNAVAILABLE', "Voice chat isn't set up on this server.");
      // Token is scoped to this room's voice room and this player's identity only.
      return { ok: true, ...(await voice.tokenFor({ code: room.code, createdAt: room.createdAt, playerId: player.id, name: player.name })) };
    });

    on('submit_guess', (payload) => {
      const me = mine();
      if (!me) return err('NOT_IN_ROOM', "You're not in a room.");
      const guess = typeof payload === 'object' && payload !== null ? (payload as { guess?: unknown }).guess : undefined;
      const r = store.submitGuess(me.code, me.playerId, guess);
      return r.ok ? { ok: true, ...r.value } : r;
    });

    socket.on('disconnect', () => {
      const { code, playerId } = socket.data;
      if (!code || !playerId) return;
      const player = store.markDisconnected(code, playerId, socket.id);
      const room = store.get(code);
      if (player && room) io.to(code).emit('player_disconnected', { player: store.publicPlayer(room, player) });
    });
  });
}

function clientIp(socket: GameSocket, trustProxy: boolean): string {
  if (trustProxy) {
    const fwd = socket.handshake.headers['x-forwarded-for'];
    const first = (Array.isArray(fwd) ? fwd[0] : fwd)?.split(',')[0]?.trim();
    if (first) return first;
  }
  return socket.handshake.address;
}
