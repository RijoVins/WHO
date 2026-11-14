import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isCorrectGuess, normalize, resolveGuess } from './answers.ts';
import type { Candidate } from './answers.ts';
import { CELEBRITIES } from '../prompts/celebrities.ts';
import { PLAYABLE_CELEBRITIES } from './GameEngine.ts';

const PUBLIC_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../client/public');
const candidates: Candidate[] = CELEBRITIES.map((c) => ({ id: c.id, names: [c.name, c.displayName, ...c.aliases] }));
const ok = (guess: string, id: string) => isCorrectGuess(guess, id, candidates);

describe('celebrity database', () => {
  it('has all 60 Tamil heroes and heroines with unique ids', () => {
    expect(CELEBRITIES).toHaveLength(60);
    expect(new Set(CELEBRITIES.map((c) => c.id)).size).toBe(60);
    expect(CELEBRITIES.filter((c) => c.category === 'Hero')).toHaveLength(30);
    expect(CELEBRITIES.filter((c) => c.category === 'Heroine')).toHaveLength(30);
  });

  it('every photo exists on disk, is a real JPEG, and no two celebrities share one', () => {
    const hashes = new Set<string>();
    for (const c of CELEBRITIES.filter((x) => x.image)) {
      const file = path.join(PUBLIC_DIR, c.image!);
      expect(existsSync(file), `${c.id} photo missing`).toBe(true);
      const buf = readFileSync(file);
      expect(buf.subarray(0, 3).toString('hex'), `${c.id} is not a JPEG`).toBe('ffd8ff');
      expect(buf.length).toBeLessThan(120_000);
      hashes.add(createHash('sha1').update(buf).digest('hex'));
      expect(c.credit?.license, `${c.id} has no license`).toBeTruthy();
    }
    expect(hashes.size).toBe(PLAYABLE_CELEBRITIES.length);
    expect(PLAYABLE_CELEBRITIES.length).toBe(56);
  });

  it('every name and alias resolves to its own celebrity only', () => {
    for (const c of CELEBRITIES) {
      for (const alias of [c.name, c.displayName, ...c.aliases]) {
        expect(resolveGuess(alias, candidates), `"${alias}" should mean ${c.id}`).toBe(c.id);
      }
    }
  });
});

describe('answer matching', () => {
  it('accepts aliases, case, punctuation and spacing', () => {
    expect(ok('Vijay', 'vijay')).toBe(true);
    expect(ok('thalapathy vijay', 'vijay')).toBe(true);
    expect(ok('ILAYATHALAPATHY', 'vijay')).toBe(true);
    expect(ok('Simbu', 'silambarasan')).toBe(true);
    expect(ok('S.T.R', 'silambarasan')).toBe(true);
    expect(ok('mgr', 'mgr')).toBe(true);
    expect(ok('vijaysethupathi', 'vijay-sethupathi')).toBe(true);
    expect(ok("genelia d'souza", 'genelia')).toBe(true);
    expect(ok('Ravi Mohan', 'jayam-ravi')).toBe(true);
  });

  it('forgives small typos on longer names', () => {
    expect(ok('Rajinikant', 'rajinikanth')).toBe(true);
    expect(ok('Sivakarthikeyen', 'sivakarthikeyan')).toBe(true);
    expect(ok('Nayantara', 'nayanthara')).toBe(true);
    expect(ok('Keerthi Suresh', 'keerthy-suresh')).toBe(true);
  });

  it('strips honorifics people add', () => {
    expect(ok('Thalapathy', 'vijay')).toBe(true);
    expect(ok('Actor Suriya', 'suriya')).toBe(true);
  });

  it('never confuses different celebrities', () => {
    expect(ok('Vijay', 'vijay-sethupathi')).toBe(false);
    expect(ok('Vijay Sethupathi', 'vijay')).toBe(false);
    expect(ok('Vishal', 'vishnu-vishal')).toBe(false);
    expect(ok('Arun Vijay', 'vijay')).toBe(false);
    expect(ok('Kamal Haasan', 'shruti-haasan')).toBe(false);
    expect(ok('Arya', 'arjun')).toBe(false);
    expect(ok('Sai Pallavi', 'sai-tamhankar')).toBe(false);
    expect(ok('Ajith', 'vijay')).toBe(false);
    expect(ok('', 'vijay')).toBe(false);
  });

  it('matches friends by name but not a different friend with a similar name', () => {
    const players: Candidate[] = [
      { id: 'a', names: ['Sam'] },
      { id: 'b', names: ['Sim'] },
      { id: 'c', names: ['Priyanka'] },
    ];
    expect(isCorrectGuess('sam', 'a', players)).toBe(true);
    expect(isCorrectGuess('Sim', 'a', players)).toBe(false);
    expect(isCorrectGuess('Priyanca', 'c', players)).toBe(true);
    expect(normalize('  Ráj-ini  ')).toBe('raj ini');
  });
});
