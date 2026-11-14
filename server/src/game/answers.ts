/**
 * Guess matching. Forgiving about case, accents, punctuation, spacing and small
 * typos — but a typo only counts if the guess isn't an equally good match for
 * someone else (so "Vishal" never matches "Vishnu Vishal").
 */

/** Lowercase, strip accents and punctuation, collapse spaces. */
export function normalize(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’`]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

/** Same as normalize, but also without spaces ("vijay sethupathi" == "vijaysethupathi"). */
const compact = (s: string) => normalize(s).replace(/ /g, '');

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

/** Typos allowed for an answer of this length (on the compact form). */
export function typoAllowance(len: number): number {
  if (len <= 4) return 0;
  if (len <= 8) return 1;
  return 2;
}

export interface Candidate {
  id: string;
  /** Every accepted spelling for this candidate. */
  names: string[];
}

/**
 * Which candidate (if any) does this guess name? Exact (normalized) matches win
 * outright; otherwise the single closest candidate within the typo allowance.
 * Returns null when nothing is close or two candidates tie.
 */
export function resolveGuess(guess: string, candidates: Candidate[]): string | null {
  const g = compact(guess);
  if (!g) return null;
  let best: { id: string; dist: number } | null = null;
  let tie = false;
  for (const c of candidates) {
    for (const name of c.names) {
      const n = compact(name);
      if (!n) continue;
      if (n === g) return c.id;
      const d = levenshtein(g, n);
      if (d > typoAllowance(n.length)) continue;
      if (!best || d < best.dist) {
        best = { id: c.id, dist: d };
        tie = false;
      } else if (d === best.dist && best.id !== c.id) {
        tie = true;
      }
    }
  }
  return best && !tie ? best.id : null;
}

/** Common honorifics people type in front of a name. Stripped as a second try. */
const HONORIFICS = /^(thalapathy|thala|superstar|chiyaan|chiyan|actor|actress|action king|lady superstar|makkal selvan|dr|mr|ms|mrs)\s+/;

/** Does the guess name the target? `candidates` must include the target. */
export function isCorrectGuess(guess: string, targetId: string, candidates: Candidate[]): boolean {
  const first = resolveGuess(guess, candidates);
  if (first) return first === targetId;
  const stripped = normalize(guess).replace(HONORIFICS, '');
  return stripped !== normalize(guess) && resolveGuess(stripped, candidates) === targetId;
}
