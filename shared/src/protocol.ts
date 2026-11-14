/**
 * The Socket.IO contract between client and server. Both sides import these
 * types, so a renamed field or event is a compile error on both.
 */
import type { GameMode, PlayerPublic, RoomState } from './types.ts';

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
  | 'NOT_IMPLEMENTED';

export type Ack<T = object> = ({ ok: true } & T) | { ok: false; code: ErrorCode; error: string };

/** Returned to the one player who created/joined/resumed. The token is their secret. */
export interface SessionGrant {
  playerId: string;
  /** Secret used to reclaim the seat after a disconnect. Never broadcast. */
  token: string;
  room: RoomState;
  /** Server clock, so clients can correct countdowns for clock drift. */
  serverNow: number;
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
}

export interface ServerToClientEvents {
  /** Full public room snapshot. Sent to everyone in the room on every change. */
  room_updated: (room: RoomState) => void;
  player_disconnected: (p: { player: PlayerPublic }) => void;
  player_reconnected: (p: { player: PlayerPublic }) => void;
  /** This socket's seat was taken over by another tab or removed. */
  session_ended: (p: { reason: 'replaced' | 'removed' | 'room_closed' }) => void;
}
