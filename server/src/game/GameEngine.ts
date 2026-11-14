import {
  DEFAULT_SCORING,
  GUESS_SECONDS,
  MAX_GUESSES_PER_ROUND,
  PERFORM_SECONDS,
  RESULTS_SECONDS,
  rankPlayers,
  validateGuess,
} from '@ib/shared';
import type { ErrorCode, GuessResult, MyGuessState, PrivatePrompt, RoundAward, RoundPublic, ScoringConfig } from '@ib/shared';
import type { Room } from '../rooms/RoomStore.ts';
import { CELEBRITIES } from '../prompts/celebrities.ts';
import type { Celebrity } from '../prompts/celebrities.ts';
import { isCorrectGuess, normalize } from './answers.ts';
import type { Candidate } from './answers.ts';
import { Deck } from './deck.ts';

export interface Timings {
  performMs: number;
  guessMs: number;
  resultsMs: number;
}

export const DEFAULT_TIMINGS: Timings = {
  performMs: PERFORM_SECONDS * 1000,
  guessMs: GUESS_SECONDS * 1000,
  resultsMs: RESULTS_SECONDS * 1000,
};

type Target = { kind: 'celebrity'; celeb: Celebrity } | { kind: 'friend'; playerId: string; name: string };

interface GuessEntry {
  attempts: number;
  tried: Set<string>;
  correct: boolean;
}

interface ActiveRound {
  number: number;
  performerId: string;
  performerName: string;
  target: Target;
  performEndsAt: number;
  guessEndsAt: number;
  guesserIds: string[];
  guesses: Map<string, GuessEntry>;
  /** Correct guessers in arrival order. */
  correctOrder: string[];
  performerLeft: boolean;
}

/** Per-room game state. Never sent to clients as-is. */
export interface GameRuntime {
  roundNumber: number;
  round: ActiveRound | null;
  timer: NodeJS.Timeout | null;
  performers: Deck<string>;
  friendTargets: Deck<string>;
}

type Fail = { ok: false; code: ErrorCode; error: string };
const fail = (code: ErrorCode, error: string): Fail => ({ ok: false, code, error });

/** Celebrities that can be picked: only those with a photo. */
export const PLAYABLE_CELEBRITIES = CELEBRITIES.filter((c) => c.image);
const CELEB_CANDIDATES: Candidate[] = CELEBRITIES.map((c) => ({ id: c.id, names: [c.name, c.displayName, ...c.aliases] }));

export interface EngineHooks {
  /** Room state changed: broadcast a snapshot. */
  changed: (code: string) => void;
  /** Deliver a secret prompt to one player only. */
  prompt: (code: string, playerId: string, prompt: PrivatePrompt) => void;
}

/**
 * Runs rounds for every room. All decisions — performer, target, timers,
 * answer checks, scoring — happen here, on the server.
 */
export class GameEngine {
  private readonly hooks: EngineHooks;
  private readonly timings: Timings;
  private readonly scoring: ScoringConfig;
  private readonly now: () => number;
  /** Celebrity decks persist per room across Play Again, so repeats stay rare. */
  private celebDecks = new WeakMap<Room, Deck<string>>();

  constructor(hooks: EngineHooks, opts: { timings?: Partial<Timings>; scoring?: ScoringConfig; now?: () => number } = {}) {
    this.hooks = hooks;
    this.timings = { ...DEFAULT_TIMINGS, ...opts.timings };
    this.scoring = opts.scoring ?? DEFAULT_SCORING;
    this.now = opts.now ?? Date.now;
  }

  /** Start a new game. The caller has already checked host and player count. */
  start(room: Room): void {
    this.stopTimer(room);
    for (const p of room.players.values()) p.score = 0;
    room.lastResult = null;
    room.finalResult = null;
    const players = () => [...room.players.keys()];
    room.game = { roundNumber: 0, round: null, timer: null, performers: new Deck(players), friendTargets: new Deck(players) };
    this.startRound(room);
  }

  /** Back to the lobby with fresh scores. */
  toLobby(room: Room): void {
    this.stopTimer(room);
    room.game = null;
    room.phase = 'lobby';
    room.lastResult = null;
    room.finalResult = null;
    for (const p of room.players.values()) p.score = 0;
    this.hooks.changed(room.code);
  }

  /** Host skipped the results countdown. */
  skipResults(room: Room): void {
    if (room.phase === 'round_results') this.advance(room);
  }

  submitGuess(room: Room, playerId: string, text: unknown): ({ ok: true } & GuessResult) | Fail {
    const round = room.game?.round;
    if (!round || (room.phase !== 'performing' && room.phase !== 'guessing')) return fail('WRONG_PHASE', 'Guessing is closed right now.');
    if (playerId === round.performerId) return fail('PERFORMER_CANNOT_GUESS', "You're the performer — you can't guess this round.");
    const entry = round.guesses.get(playerId);
    const player = room.players.get(playerId);
    if (!entry || !player) return fail('NOT_A_GUESSER', "You joined after this round started. You can guess next round.");
    if (!player.connected) return fail('NOT_A_GUESSER', 'Reconnect to keep guessing.');
    if (entry.correct) return fail('ALREADY_CORRECT', 'You already got it!');
    if (entry.attempts >= MAX_GUESSES_PER_ROUND) return fail('NO_GUESSES_LEFT', "You're out of guesses for this round.");
    const v = validateGuess(text);
    if (!v.ok) return fail('INVALID_INPUT', v.error);
    const key = normalize(v.value);
    if (entry.tried.has(key)) return fail('DUPLICATE_GUESS', `You already tried "${v.value}".`);

    entry.tried.add(key);
    entry.attempts += 1;
    const correct = this.isCorrect(room, round, v.value);
    if (correct) {
      entry.correct = true;
      round.correctOrder.push(playerId);
    }
    const state = this.guessState(entry);
    // Let the ack go out first, then broadcast / maybe end the round early.
    queueMicrotask(() => {
      if (room.game?.round !== round) return;
      if (this.everyoneDone(room, round)) this.endRound(room);
      else if (correct) this.hooks.changed(room.code);
    });
    return { ok: true, correct, guess: state };
  }

  /** A player's socket dropped. */
  onDisconnected(room: Room, playerId: string): void {
    this.checkRound(room, playerId);
  }

  /** A player left for good (or their grace period expired). */
  onRemoved(room: Room, playerId: string): void {
    this.checkRound(room, playerId);
  }

  /** Room closed: stop its timers. */
  dispose(room: Room): void {
    this.stopTimer(room);
    room.game = null;
  }

  // ---------- what clients may see ----------

  publicRound(room: Room): RoundPublic | null {
    const r = room.game?.round;
    if (!r || (room.phase !== 'performing' && room.phase !== 'guessing')) return null;
    return {
      number: r.number,
      totalRounds: room.settings.totalRounds,
      performerId: r.performerId,
      performerName: r.performerName,
      performEndsAt: r.performEndsAt,
      guessEndsAt: r.guessEndsAt,
      correctPlayerIds: [...r.correctOrder],
      guesserIds: [...r.guesserIds],
    };
  }

  /** The secret prompt — only for the performer, only while the round runs. */
  promptFor(room: Room, playerId: string): PrivatePrompt | null {
    const r = room.game?.round;
    if (!r || r.performerId !== playerId || (room.phase !== 'performing' && room.phase !== 'guessing')) return null;
    if (r.target.kind === 'celebrity') {
      const c = r.target.celeb;
      return {
        roundNumber: r.number,
        mode: 'celebrity',
        target: c.displayName,
        category: c.category,
        image: c.image,
        imageCredit: c.credit ? `${c.credit.author} · ${c.credit.license}` : undefined,
        hint: c.displayName !== c.name ? `Also known as ${c.name}.` : undefined,
      };
    }
    return {
      roundNumber: r.number,
      mode: 'friends',
      target: r.target.name,
      targetPlayerId: r.target.playerId,
      hint: 'Copy how they talk: favourite phrases, laugh, accent.',
    };
  }

  guessStateFor(room: Room, playerId: string): MyGuessState | null {
    const r = room.game?.round;
    const entry = r?.guesses.get(playerId);
    return entry && (room.phase === 'performing' || room.phase === 'guessing') ? this.guessState(entry) : null;
  }

  // ---------- round flow ----------

  private startRound(room: Room): void {
    const game = room.game!;
    const connected = (id: string) => room.players.get(id)?.connected === true;
    const connectedCount = [...room.players.values()].filter((p) => p.connected).length;
    // A round needs a performer and at least one guesser.
    if (connectedCount < 2) return this.finish(room);

    const performerId = game.performers.draw(connected)!;
    const performer = room.players.get(performerId)!;
    const target = this.pickTarget(room, performerId);
    if (!target) return this.finish(room);

    const now = this.now();
    const guesserIds = [...room.players.values()].filter((p) => p.connected && p.id !== performerId).map((p) => p.id);
    game.roundNumber += 1;
    game.round = {
      number: game.roundNumber,
      performerId,
      performerName: performer.name,
      target,
      performEndsAt: now + this.timings.performMs,
      guessEndsAt: now + this.timings.performMs + this.timings.guessMs,
      guesserIds,
      guesses: new Map(guesserIds.map((id) => [id, { attempts: 0, tried: new Set<string>(), correct: false }])),
      correctOrder: [],
      performerLeft: false,
    };
    room.phase = 'performing';
    this.schedule(room, this.timings.performMs, () => this.toGuessing(room));
    this.hooks.changed(room.code);
    const prompt = this.promptFor(room, performerId);
    if (prompt) this.hooks.prompt(room.code, performerId, prompt);
  }

  private pickTarget(room: Room, performerId: string): Target | null {
    if (room.settings.mode === 'friends') {
      const game = room.game!;
      // Never the performer. Prefer players who are still here and connected.
      const id =
        game.friendTargets.draw((pid) => pid !== performerId && room.players.get(pid)?.connected === true) ??
        game.friendTargets.draw((pid) => pid !== performerId && room.players.has(pid));
      return id ? { kind: 'friend', playerId: id, name: room.players.get(id)!.name } : null;
    }
    let deck = this.celebDecks.get(room);
    if (!deck) {
      deck = new Deck(() => PLAYABLE_CELEBRITIES.map((c) => c.id));
      this.celebDecks.set(room, deck);
    }
    const id = deck.draw();
    const celeb = PLAYABLE_CELEBRITIES.find((c) => c.id === id);
    return celeb ? { kind: 'celebrity', celeb } : null;
  }

  private toGuessing(room: Room): void {
    const round = room.game?.round;
    if (!round || room.phase !== 'performing') return;
    room.phase = 'guessing';
    // If the stage was cut short (performer left), the guessing window starts now.
    const now = this.now();
    if (round.performEndsAt > now) {
      round.performEndsAt = now;
      round.guessEndsAt = now + this.timings.guessMs;
    }
    this.schedule(room, Math.max(0, round.guessEndsAt - now), () => this.endRound(room));
    this.hooks.changed(room.code);
  }

  private endRound(room: Room): void {
    const game = room.game;
    const round = game?.round;
    if (!game || !round || (room.phase !== 'performing' && room.phase !== 'guessing')) return;
    this.stopTimer(room);

    const s = this.scoring;
    const awards: RoundAward[] = round.correctOrder.map((id, i) => ({
      playerId: id,
      name: room.players.get(id)?.name ?? 'A player who left',
      points: s.correctGuess + (i === 0 ? s.firstCorrectBonus : 0),
      firstCorrect: i === 0,
    }));
    // Eligible = guessers still in the room and connected when the round ends.
    const eligible = round.guesserIds.filter((id) => room.players.get(id)?.connected);
    const everyoneGuessed = eligible.length > 0 && eligible.every((id) => round.guesses.get(id)?.correct);
    const performerPoints = everyoneGuessed ? s.performerEveryoneBonus : 0;

    // Apply each award exactly once.
    for (const a of awards) {
      const p = room.players.get(a.playerId);
      if (p) p.score += a.points;
    }
    const performer = room.players.get(round.performerId);
    if (performer) performer.score += performerPoints;

    const t = round.target;
    room.lastResult = {
      roundNumber: round.number,
      totalRounds: room.settings.totalRounds,
      mode: t.kind === 'celebrity' ? 'celebrity' : 'friends',
      performerId: round.performerId,
      performerName: round.performerName,
      answer: t.kind === 'celebrity' ? t.celeb.displayName : t.name,
      category: t.kind === 'celebrity' ? t.celeb.category : undefined,
      answerImage: t.kind === 'celebrity' ? t.celeb.image : undefined,
      answerImageCredit: t.kind === 'celebrity' && t.celeb.credit ? `${t.celeb.credit.author} · ${t.celeb.credit.license}` : undefined,
      answerPlayerId: t.kind === 'friend' ? t.playerId : undefined,
      awards,
      performerPoints,
      everyoneGuessed,
      performerLeft: round.performerLeft,
      nextAt: this.now() + this.timings.resultsMs,
    };
    game.round = null;
    room.phase = 'round_results';
    this.schedule(room, this.timings.resultsMs, () => this.advance(room));
    this.hooks.changed(room.code);
  }

  private advance(room: Room): void {
    const game = room.game;
    if (!game || room.phase !== 'round_results') return;
    this.stopTimer(room);
    if (game.roundNumber >= room.settings.totalRounds) this.finish(room);
    else this.startRound(room);
  }

  private finish(room: Room): void {
    this.stopTimer(room);
    if (room.game) room.game.round = null;
    const rankings = rankPlayers([...room.players.values()]);
    room.finalResult = {
      rankings,
      winnerIds: rankings.filter((r) => r.rank === 1).map((r) => r.playerId),
    };
    room.phase = 'finished';
    this.hooks.changed(room.code);
  }

  /** After someone drops or leaves: keep the round moving. */
  private checkRound(room: Room, playerId: string): void {
    const round = room.game?.round;
    if (!round || (room.phase !== 'performing' && room.phase !== 'guessing')) return;
    const connected = [...room.players.values()].filter((p) => p.connected).length;
    if (connected === 0) return this.endRound(room);
    if (playerId === round.performerId && room.phase === 'performing') {
      // Nobody left to perform: skip straight to final guesses.
      round.performerLeft = true;
      this.toGuessing(room);
      return;
    }
    if (this.everyoneDone(room, round)) this.endRound(room);
  }

  /** Every connected guesser has either got it or used all their guesses. */
  private everyoneDone(room: Room, round: ActiveRound): boolean {
    const active = round.guesserIds.filter((id) => room.players.get(id)?.connected);
    return active.every((id) => {
      const g = round.guesses.get(id)!;
      return g.correct || g.attempts >= MAX_GUESSES_PER_ROUND;
    });
  }

  private isCorrect(room: Room, round: ActiveRound, guess: string): boolean {
    const t = round.target;
    if (t.kind === 'celebrity') return isCorrectGuess(guess, t.celeb.id, CELEB_CANDIDATES);
    // Friends Mode: the target competes against every other player's name.
    const candidates: Candidate[] = [...room.players.values()].map((p) => ({ id: p.id, names: [p.name] }));
    if (!candidates.some((c) => c.id === t.playerId)) candidates.push({ id: t.playerId, names: [t.name] });
    return isCorrectGuess(guess, t.playerId, candidates);
  }

  private guessState(e: GuessEntry): MyGuessState {
    return {
      attempts: e.attempts,
      remaining: Math.max(0, MAX_GUESSES_PER_ROUND - e.attempts),
      correct: e.correct,
      lastGuess: null,
    };
  }

  private schedule(room: Room, ms: number, fn: () => void): void {
    this.stopTimer(room);
    if (!room.game) return;
    room.game.timer = setTimeout(fn, ms);
    room.game.timer.unref?.();
  }

  private stopTimer(room: Room): void {
    if (room.game?.timer) {
      clearTimeout(room.game.timer);
      room.game.timer = null;
    }
  }
}
