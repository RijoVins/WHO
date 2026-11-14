import { useState } from 'react';
import type { ReactNode } from 'react';
import type { GameMode } from '@ib/shared';
import { ModeContext } from './mode';

const KEY = 'ib:mode';

function load(): GameMode | null {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'celebrity' || v === 'friends' ? v : null;
  } catch {
    return null;
  }
}

/** Remembers the mode chosen on the main menu (also across visits on this device). */
export function ModeProvider({ children, initial }: { children: ReactNode; initial?: GameMode | null }) {
  const [mode, setModeState] = useState<GameMode | null>(() => (initial !== undefined ? initial : load()));
  const setMode = (m: GameMode) => {
    setModeState(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* storage unavailable: keep it in memory only */
    }
  };
  return <ModeContext.Provider value={{ mode, setMode }}>{children}</ModeContext.Provider>;
}
