import { createContext, useContext } from 'react';
import type { GameMode } from '@ib/shared';

export interface ModeChoice {
  /** Mode picked on the main menu; used when creating a room. */
  mode: GameMode | null;
  setMode: (mode: GameMode) => void;
}

export const ModeContext = createContext<ModeChoice | null>(null);

export function useModeChoice(): ModeChoice {
  const ctx = useContext(ModeContext);
  if (!ctx) throw new Error('useModeChoice must be used inside <ModeProvider>');
  return ctx;
}
