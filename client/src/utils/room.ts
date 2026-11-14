import { MIN_PLAYERS } from '@ib/shared';
import type { RoomState, RoundResult } from '@ib/shared';

/** Why the host can't start yet, or null. The server runs the same checks. */
export function startBlocker(room: RoomState): string | null {
  const connected = room.players.filter((p) => p.connected).length;
  if (connected < MIN_PLAYERS) {
    const missing = MIN_PLAYERS - connected;
    return `Waiting for ${missing} more player${missing === 1 ? '' : 's'} — you need at least ${MIN_PLAYERS}.`;
  }
  if (!room.settings.mode) return 'Choose a game mode to start.';
  return null;
}

/** Points each player gained this round, including the performer. */
export function roundDeltas(result: RoundResult): Record<string, number> {
  const d: Record<string, number> = {};
  for (const a of result.awards) d[a.playerId] = (d[a.playerId] ?? 0) + a.points;
  if (result.performerPoints > 0) d[result.performerId] = (d[result.performerId] ?? 0) + result.performerPoints;
  return d;
}
