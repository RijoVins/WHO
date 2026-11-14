/** Sample data for the development screen gallery only. */
import { DEFAULT_ROUND_COUNT, GUESS_SECONDS, PERFORM_SECONDS, RESULTS_SECONDS, rankPlayers } from '@ib/shared';
import type { FinalResult, GameMode, PlayerPublic, PrivatePrompt, RoomPhase, RoomState, RoundResult } from '@ib/shared';

const NAMES = [
  'Sam', 'Priya', 'Diego', 'Mei', 'Jordan', 'Aisha', 'Tomasz', 'Lena', 'Kwame', 'Sofia',
  'Ravi', 'Hana', 'Mateo', 'Zoe', 'Omar', 'Ingrid', 'Kenji', 'Amara', 'Luca', 'Nia',
  'Felix', 'Yara', 'Arjun', 'Chloe', 'Bilal', 'Freya', 'Hugo', 'Leila', 'Mason', 'Esi',
  'Noah', 'Rin', 'Elif', 'Theo', 'Ana', 'Kofi', 'Maya', 'Ivan', 'Sara', 'Jae',
  'Lucia', 'Ben', 'Asha', 'Pablo', 'Nora', 'Dev', 'Ola', 'Finn', 'Isla', 'Tariq',
  'Vera', 'Kai', 'Lola', 'Emeka', 'Ruby', 'Sven', 'Ines', 'Yusuf', 'Mila', 'Alexandria-Rose',
];

export const SELF_ID = 'p0';
export const PERFORMER_ID = 'p2';
/** In Friends Mode the gallery performer imitates this player. */
export const FRIEND_TARGET_INDEX = 3;

export function makePlayers(count: number, lobby: boolean): PlayerPublic[] {
  return NAMES.slice(0, count).map((name, i) => ({
    id: `p${i}`,
    name,
    isHost: i === 0,
    connected: i % 11 !== 7, // a few reconnecting players to show that state
    score: lobby ? 0 : Math.max(0, 900 - i * 70 - (i % 3) * 15),
  }));
}

export function makeRoom(opts: {
  players: number;
  selfIsHost: boolean;
  selfIsPerformer: boolean;
  mode: GameMode | null;
  phase: RoomPhase;
  totalRounds?: number;
}): RoomState {
  const players = makePlayers(opts.players, opts.phase === 'lobby');
  if (!opts.selfIsHost) {
    players[0].isHost = false;
    players[1].isHost = true;
  }
  const performerId = opts.selfIsPerformer ? SELF_ID : PERFORMER_ID;
  const guesserIds = players.filter((p) => p.id !== performerId).map((p) => p.id);
  const now = Date.now();
  // While guessing, the performance already ended.
  const performEndsAt = opts.phase === 'guessing' ? now : now + PERFORM_SECONDS * 1000;
  const totalRounds = opts.totalRounds ?? DEFAULT_ROUND_COUNT;
  return {
    code: 'K7QX4M',
    hostId: opts.selfIsHost ? SELF_ID : 'p1',
    phase: opts.phase,
    settings: { mode: opts.mode, totalRounds },
    players,
    round:
      opts.phase === 'performing' || opts.phase === 'guessing'
        ? {
            number: 2,
            totalRounds,
            performerId,
            performerName: players.find((p) => p.id === performerId)!.name,
            performEndsAt,
            guessEndsAt: performEndsAt + GUESS_SECONDS * 1000,
            correctPlayerIds: guesserIds.filter((id) => id !== SELF_ID).slice(0, Math.floor(guesserIds.length / 3)),
            guesserIds,
          }
        : null,
    lastResult: null,
    finalResult: null,
    serverNow: Date.now(),
  };
}

export function galleryAnswer(mode: GameMode, room: RoomState): string {
  return mode === 'celebrity' ? 'Vijay' : room.players[FRIEND_TARGET_INDEX]?.name ?? 'Mei';
}

export function makePrompt(mode: GameMode, room: RoomState): PrivatePrompt {
  return mode === 'celebrity'
    ? {
        roundNumber: 2,
        mode,
        target: 'Thalapathy Vijay',
        category: 'Hero',
        hint: 'Also known as Vijay.',
        image: '/images/celebrities/vijay.jpg',
        imageCredit: "Prime Minister's Office · GODL-India",
      }
    : {
        roundNumber: 2,
        mode,
        target: galleryAnswer(mode, room),
        targetPlayerId: room.players[FRIEND_TARGET_INDEX]?.id,
        hint: 'Copy how they talk: favourite phrases, laugh, accent.',
      };
}

export function makeRoundResult(room: RoomState, mode: GameMode, everyone: boolean): RoundResult {
  const eligible = room.players.filter((p) => p.id !== PERFORMER_ID);
  const correct = everyone ? eligible : eligible.slice(0, Math.max(1, Math.ceil(eligible.length / 2)));
  return {
    roundNumber: 2,
    totalRounds: room.settings.totalRounds,
    mode,
    performerId: PERFORMER_ID,
    performerName: room.players.find((p) => p.id === PERFORMER_ID)?.name ?? 'Diego',
    answer: mode === 'celebrity' ? 'Thalapathy Vijay' : galleryAnswer(mode, room),
    category: mode === 'celebrity' ? 'Hero' : undefined,
    answerImage: mode === 'celebrity' ? '/images/celebrities/vijay.jpg' : undefined,
    answerImageCredit: mode === 'celebrity' ? "Prime Minister's Office · GODL-India" : undefined,
    answerPlayerId: mode === 'friends' ? room.players[FRIEND_TARGET_INDEX]?.id : undefined,
    awards: correct.map((p, i) => ({ playerId: p.id, name: p.name, points: i === 0 ? 150 : 100, firstCorrect: i === 0 })),
    performerPoints: everyone ? 100 : 0,
    everyoneGuessed: everyone,
    nextAt: Date.now() + RESULTS_SECONDS * 1000,
  };
}

export function makeFinal(room: RoomState, tie: boolean): FinalResult {
  const players = room.players.map((p, i) => (tie && i === 1 ? { ...p, score: room.players[0].score } : p));
  const rankings = rankPlayers(players);
  return { rankings, winnerIds: rankings.filter((r) => r.rank === 1).map((r) => r.playerId) };
}
