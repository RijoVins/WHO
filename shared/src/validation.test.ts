import { describe, expect, it } from 'vitest';
import { normalizeRoomCode, validateGuess, validatePlayerName, validateRoomCode } from './validation.ts';
import { rankPlayers } from './ranking.ts';

describe('validatePlayerName', () => {
  it('trims and collapses whitespace', () => {
    expect(validatePlayerName('  Rijo   Vins ')).toEqual({ ok: true, value: 'Rijo Vins' });
  });
  it('rejects empty, non-string and too-long names', () => {
    expect(validatePlayerName('   ').ok).toBe(false);
    expect(validatePlayerName(42).ok).toBe(false);
    expect(validatePlayerName('x'.repeat(21)).ok).toBe(false);
  });
  it('strips control characters', () => {
    expect(validatePlayerName('Sa\u0000m')).toEqual({ ok: true, value: 'Sam' });
  });
});

describe('validateRoomCode', () => {
  it('normalizes case, spaces and dashes', () => {
    expect(normalizeRoomCode(' k7q-x4m ')).toBe('K7QX4M');
    expect(validateRoomCode('k7qx4m')).toEqual({ ok: true, value: 'K7QX4M' });
  });
  it('rejects wrong length', () => {
    expect(validateRoomCode('ABC')).toEqual({ ok: false, error: 'Room codes are 6 characters long.' });
  });
  it('rejects look-alike characters', () => {
    const r = validateRoomCode('ABCDE0');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toContain('"0"');
  });
});

describe('validateGuess', () => {
  it('accepts normal guesses and rejects blank or long ones', () => {
    expect(validateGuess(' Morgan  Freeman ')).toEqual({ ok: true, value: 'Morgan Freeman' });
    expect(validateGuess('').ok).toBe(false);
    expect(validateGuess('a'.repeat(61)).ok).toBe(false);
  });
});

describe('rankPlayers', () => {
  it('gives tied players the same rank and skips the next', () => {
    const r = rankPlayers([
      { id: 'a', name: 'Ana', score: 100 },
      { id: 'b', name: 'Ben', score: 300 },
      { id: 'c', name: 'Cal', score: 100 },
      { id: 'd', name: 'Dee', score: 50 },
    ]);
    expect(r.map((x) => [x.name, x.rank])).toEqual([
      ['Ben', 1],
      ['Ana', 2],
      ['Cal', 2],
      ['Dee', 4],
    ]);
  });
});
