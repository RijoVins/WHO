import type { PlayerPublic } from '@ib/shared';

export function playerName(players: PlayerPublic[], id: string | null | undefined): string {
  if (!id) return 'Unknown';
  return players.find((p) => p.id === id)?.name ?? 'A player who left';
}
