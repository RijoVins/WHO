import { createContext, useContext } from 'react';
import type { GameMode, RoomState } from '@ib/shared';
import type { ActionResult } from '../types/actions';

export type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'reconnecting';

export interface GameSession {
  connection: ConnectionStatus;
  room: RoomState | null;
  selfId: string | null;
  /** Code of the room this tab is (re)joining, from storage, before the server confirms. */
  pendingCode: string | null;
  /** Why the seat was lost (expired, opened elsewhere...), if it was. */
  ended: string | null;
  createRoom: (name: string, mode: GameMode) => Promise<ActionResult & { code?: string }>;
  joinRoom: (name: string, code: string) => Promise<ActionResult & { code?: string }>;
  leaveRoom: () => Promise<void>;
  selectMode: (mode: GameMode) => Promise<ActionResult>;
  setRounds: (rounds: number) => Promise<ActionResult>;
  startGame: () => Promise<ActionResult>;
  dismissEnded: () => void;
}

export const GameContext = createContext<GameSession | null>(null);

export function useGame(): GameSession {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside <GameProvider>');
  return ctx;
}
