export type GameMode = 'celebrity' | 'friends';

export type CelebrityCategory = 'Hero' | 'Heroine';

/**
 * Where a room is in the game. Only the server changes this.
 * - performing: performer's mic is live; guesses are open.
 * - guessing:   mic is closed; last chance to guess.
 */
export type RoomPhase = 'lobby' | 'performing' | 'guessing' | 'round_results' | 'finished';

export interface PlayerPublic {
  id: string;
  name: string;
  isHost: boolean;
  /** False while the player's connection is lost; they keep their seat for a grace period. */
  connected: boolean;
  score: number;
}

export interface RoomSettings {
  mode: GameMode | null;
  totalRounds: number;
}

/** Round info every player may see. Never contains the secret prompt. */
export interface RoundPublic {
  number: number;
  totalRounds: number;
  performerId: string;
  /** Kept even if the performer leaves mid-round. */
  performerName: string;
  /** Server epoch ms. Clients display these; the server decides when stages end. */
  performEndsAt: number;
  guessEndsAt: number;
  /** Players who have guessed correctly so far (never the answer text). */
  correctPlayerIds: string[];
  /** Players allowed to guess this round: everyone except the performer. */
  guesserIds: string[];
}

/** Sent only to the performer. */
export interface PrivatePrompt {
  roundNumber: number;
  mode: GameMode;
  /** Celebrity display name, or the display name of the player to imitate. */
  target: string;
  /** Celebrity Mode: "Hero" / "Heroine". */
  category?: string;
  hint?: string;
  /** Celebrity Mode: photo URL. */
  image?: string | null;
  /** Celebrity Mode: photo credit line (author, license). */
  imageCredit?: string;
  /** Friends Mode: the player to imitate (their avatar is their profile picture). */
  targetPlayerId?: string;
}

/** What one player knows about their own guesses this round. */
export interface MyGuessState {
  attempts: number;
  remaining: number;
  correct: boolean;
  lastGuess: string | null;
}

export interface RoundAward {
  playerId: string;
  name: string;
  points: number;
  firstCorrect: boolean;
}

export interface RoundResult {
  roundNumber: number;
  totalRounds: number;
  mode: GameMode;
  performerId: string;
  performerName: string;
  answer: string;
  category?: string;
  /** Celebrity Mode: revealed photo. */
  answerImage?: string | null;
  answerImageCredit?: string;
  /** Friends Mode: the imitated player. */
  answerPlayerId?: string;
  /** Round ended before time because the performer left. */
  performerLeft?: boolean;
  /** Correct guessers in the order they got it. */
  awards: RoundAward[];
  performerPoints: number;
  everyoneGuessed: boolean;
  /** Server epoch ms when the next round (or final results) begins. */
  nextAt: number;
}

export interface FinalRanking {
  playerId: string;
  name: string;
  score: number;
  /** Competition ranking: ties share a rank (1, 2, 2, 4). */
  rank: number;
}

export interface FinalResult {
  rankings: FinalRanking[];
  winnerIds: string[];
}

export interface RoomState {
  code: string;
  hostId: string;
  phase: RoomPhase;
  settings: RoomSettings;
  players: PlayerPublic[];
  round: RoundPublic | null;
  lastResult: RoundResult | null;
  finalResult: FinalResult | null;
  /** Server clock when this snapshot was sent, for countdown sync. */
  serverNow: number;
}

export interface ScoringConfig {
  correctGuess: number;
  firstCorrectBonus: number;
  /** Performer bonus when every eligible guesser gets it right. */
  performerEveryoneBonus: number;
}

export const DEFAULT_SCORING: ScoringConfig = {
  correctGuess: 100,
  firstCorrectBonus: 50,
  performerEveryoneBonus: 100,
};
