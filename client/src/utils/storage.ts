/** Remembers the last display name on this device. Storage can be unavailable (private mode), so failures are ignored. */
const NAME_KEY = 'ib:lastName';

export function loadLastName(): string {
  try {
    return localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveLastName(name: string): void {
  try {
    localStorage.setItem(NAME_KEY, name);
  } catch {
    /* ignore */
  }
}
