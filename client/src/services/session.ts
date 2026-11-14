/**
 * The seat this browser tab holds: room code, player id and the secret token
 * that reclaims it after a reload or network drop. Stored per tab
 * (sessionStorage), so several tabs can be separate players when testing.
 */
export interface StoredSession {
  code: string;
  playerId: string;
  token: string;
}

const KEY = 'ib:session';

export function loadSession(): StoredSession | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<StoredSession>;
    return typeof s.code === 'string' && typeof s.playerId === 'string' && typeof s.token === 'string'
      ? { code: s.code, playerId: s.playerId, token: s.token }
      : null;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* storage unavailable: the session lasts until the tab reloads */
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
