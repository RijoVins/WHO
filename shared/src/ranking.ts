import type { FinalRanking } from './types.ts';

/**
 * Sort players best-first and assign competition ranks (1, 2, 2, 4).
 * Equal scores are ordered by name so the list never jumps around.
 */
export function rankPlayers(players: { id: string; name: string; score: number }[]): FinalRanking[] {
  const sorted = [...players].sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const out: FinalRanking[] = [];
  sorted.forEach((p, i) => {
    const rank = i > 0 && p.score === sorted[i - 1].score ? out[i - 1].rank : i + 1;
    out.push({ playerId: p.id, name: p.name, score: p.score, rank });
  });
  return out;
}
