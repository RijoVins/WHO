import { randomInt } from 'node:crypto';

export function shuffle<T>(items: readonly T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Draw items in random order without repeats until every item has been used,
 * then reshuffle. `eligible` filters items that can't be used right now
 * (e.g. disconnected players) without losing their place.
 */
export class Deck<T> {
  private pile: T[] = [];
  private last: T | null = null;
  private readonly source: () => readonly T[];

  constructor(source: () => readonly T[]) {
    this.source = source;
  }

  draw(eligible: (item: T) => boolean = () => true): T | null {
    let idx = this.pile.findLastIndex(eligible);
    if (idx === -1) {
      const fresh = shuffle(this.source().filter(eligible));
      if (!fresh.length) return null;
      // The end of the pile is drawn first: don't start a new cycle with the item we just used.
      const end = fresh.length - 1;
      if (end > 0 && fresh[end] === this.last) [fresh[0], fresh[end]] = [fresh[end], fresh[0]];
      this.pile = fresh;
      idx = end;
    }
    const [pick] = this.pile.splice(idx, 1);
    this.last = pick;
    return pick;
  }
}
