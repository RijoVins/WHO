import {
  GUESS_MAX_LENGTH,
  NAME_MAX_LENGTH,
  ROOM_CODE_ALPHABET,
  ROOM_CODE_LENGTH,
} from './constants.ts';

export type ValidationResult<T> = { ok: true; value: T } | { ok: false; error: string };

/** Strip control characters and collapse runs of whitespace. */
export function cleanText(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim();
}

export function validatePlayerName(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') return { ok: false, error: 'Enter your name.' };
  const name = cleanText(input);
  if (name.length === 0) return { ok: false, error: 'Enter your name.' };
  if (name.length > NAME_MAX_LENGTH) {
    return { ok: false, error: `Names can be at most ${NAME_MAX_LENGTH} characters.` };
  }
  return { ok: true, value: name };
}

/** Uppercase and drop spaces/dashes, so " k7q-x4m " becomes "K7QX4M". */
export function normalizeRoomCode(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, '');
}

export function validateRoomCode(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') return { ok: false, error: 'Enter a room code.' };
  const code = normalizeRoomCode(input);
  if (code.length === 0) return { ok: false, error: 'Enter a room code.' };
  if (code.length !== ROOM_CODE_LENGTH) {
    return { ok: false, error: `Room codes are ${ROOM_CODE_LENGTH} characters long.` };
  }
  for (const ch of code) {
    if (!ROOM_CODE_ALPHABET.includes(ch)) {
      return { ok: false, error: `Room codes never contain "${ch}". Check for a typo.` };
    }
  }
  return { ok: true, value: code };
}

export function validateGuess(input: unknown): ValidationResult<string> {
  if (typeof input !== 'string') return { ok: false, error: 'Type a guess first.' };
  const guess = cleanText(input);
  if (guess.length === 0) return { ok: false, error: 'Type a guess first.' };
  if (guess.length > GUESS_MAX_LENGTH) {
    return { ok: false, error: `Guesses can be at most ${GUESS_MAX_LENGTH} characters.` };
  }
  return { ok: true, value: guess };
}
