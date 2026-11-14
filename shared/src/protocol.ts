/**
 * The Socket.IO contract between client and server. Both sides import these
 * types, so a renamed field or event is a compile error on both.
 */
import type { GameMode, MyGuessState, PlayerPublic, PrivatePrompt, RoomState } from './types.ts';

/** Machine-readable reasons a request was refused. */
export type ErrorCode =
  | 'INVALID_INPUT'
  | 'ROOM_NOT_FOUND'
  | 'ROOM_FULL'
  | 'NAME_TAKEN'
  | 'GAME_IN_PROGRESS'
  | 'NOT_IN_ROOM'
  | 'NOT_HOST'
  | 'NOT_ENOUGH_PLAYERS'
  | 'NO_MODE'
  | 'SESSION_EXPIRED'
  | 'RATE_LIMITED'
  | 'SERVER_BUSY'
  | 'NOT_IMPLEMENTED'
  | 'WRONG_PHASE'
  | 'PERFORMER_CANNOT_GUESS'
  | 'NOT_A_GUESSER'
  | 'ALREADY_CORRECT'
  | 'DUPLICATE_GUESS'
  | 'NO_GUESSES_LEFT'
  | 'VOICE_UNAVAILABLE';

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: ErrorCode; error: string };

/** Returned to the one player who created/joined/resumed. The token is their secret. */
export interface SessionGrant {
  playerId: string;
  /** Secret used to reclaim the seat after a disconnect. Never broadcast. */
  token: string;
  room: RoomState;
  /** Server clock, so clients can correct countdowns for clock drift. */
  serverNow: number;
  /** Set when this player is the current performer (e.g. after a reconnect). */
  prompt: PrivatePrompt | null;
  /** This player's guesses in the current round, if any. */
  myGuess: MyGuessState | null;
}

/** Everything a browser needs to join its room's voice chat. Never contains the API secret. */
export interface VoiceAccess {
  /** LiveKit WebSocket URL (wss:// in production), or a same-origin path such as /livekit. */
  url: string;
  /** Short-lived access token for this player in this room's voice room only. */
  token: string;
  /** The voice room name (derived from the game room). */
  roomName: string;
  /** This player's voice identity: their player id. */
  identity: string;
}

export interface GuessResult {
  correct: boolean;
  guess: MyGuessState;
}

export interface CreateRoomPayload {
  name: string;
  mode: GameMode;
}
export interface JoinRoomPayload {
  name: string;
  code: string;
}
export interface ResumePayload {
  code: string;
  token: string;
}

export interface ClientToServerEvents {
  create_room: (p: CreateRoomPayload, ack: (r: Ack<SessionGrant>) => void) => void;
  join_room: (p: JoinRoomPayload, ack: (r: Ack<SessionGrant>) => void) => void;
  /** Reattach this socket to an existing seat after a reconnect or page reload. */
  resume_session: (p: ResumePayload, ack: (r: Ack<SessionGrant>) => void) => void;
  leave_room: (ack: (r: Ack) => void) => void;
  select_mode: (p: { mode: GameMode }, ack: (r: Ack) => void) => void;
  update_settings: (p: { totalRounds: number }, ack: (r: Ack) => void) => void;
  start_game: (ack: (r: Ack) => void) => void;
  submit_guess: (p: { guess: string }, ack: (r: Ack<GuessResult>) => void) => void;
  /** Host: skip the round-results wait. */
  next_round: (ack: (r: Ack) => void) => void;
  /** Host, after the final results: same players, scores reset. */
  play_again: (ack: (r: Ack) => void) => void;
  /** Host, after the final results: back to the lobby. */
  return_to_lobby: (ack: (r: Ack) => void) => void;
  /** Ask for a voice token for the room this connection is seated in. */
  voice_token: (ack: (r: Ack<VoiceAccess>) => void) => void;
}

export interface ServerToClientEvents {
  /** Full public room snapshot. Sent to everyone in the room on every change. */
  room_updated: (room: RoomState) => void;
  player_disconnected: (p: { player: PlayerPublic }) => void;
  player_reconnected: (p: { player: PlayerPublic }) => void;
  /** Sent only to the performer's socket. Never broadcast. */
  private_prompt: (p: PrivatePrompt) => void;
  /** This socket's seat was taken over by another tab or removed. */
  session_ended: (p: { reason: 'replaced' | 'removed' | 'room_closed' }) => void;
}
