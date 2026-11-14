import { Trophy } from 'lucide-react';
import { rankPlayers } from '@ib/shared';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from '../utils/cn';

interface Entry {
  id: string;
  name: string;
  score: number;
  connected?: boolean;
}

interface LeaderboardProps {
  players: Entry[];
  selfId?: string | null;
  /** Points gained this round, shown as "+150". */
  deltas?: Record<string, number>;
  /** Show only the top N, plus you if you're further down. */
  limit?: number;
}

const medal = ['bg-sun text-on-bright', 'bg-[#dcdcec] text-on-bright', 'bg-[#e89b5e] text-on-bright'];

export function Leaderboard({ players, selfId, deltas = {}, limit }: LeaderboardProps) {
  const byId = new Map(players.map((p) => [p.id, p]));
  const all = rankPlayers(players);
  let rows = all;
  let appendedMe = false;
  if (limit && all.length > limit) {
    rows = all.slice(0, limit);
    const me = all.find((r) => r.playerId === selfId);
    if (me && !rows.includes(me)) {
      rows = [...rows, me];
      appendedMe = true;
    }
  }
  const hidden = all.length - rows.length;

  return (
    <ol className="flex flex-col gap-1.5">
      {rows.map((r, i) => {
        const delta = deltas[r.playerId] ?? 0;
        const mine = r.playerId === selfId;
        const gap = appendedMe && i === rows.length - 1;
        return (
          <li key={r.playerId} className="contents">
            {gap ? (
              <span className="py-0.5 text-center text-xs font-bold text-fg-faint" aria-hidden>
                ⋯
              </span>
            ) : null}
            <div
              className={cn(
                'flex animate-rise items-center gap-3 rounded-2xl bg-glass px-3 py-2',
                mine && 'ring-2 ring-teal',
              )}
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <span
                className={cn(
                  'grid size-8 shrink-0 place-items-center rounded-full font-display text-sm font-extrabold',
                  r.rank <= 3 ? medal[r.rank - 1] : 'bg-glass-strong',
                )}
                aria-label={`Rank ${r.rank}`}
              >
                {r.rank === 1 ? <Trophy className="size-4" aria-hidden /> : r.rank}
              </span>
              <PlayerAvatar id={r.playerId} name={r.name} size="sm" dimmed={byId.get(r.playerId)?.connected === false} />
              <span className="min-w-0 flex-1 truncate font-bold">
                {r.name}
                {mine ? <span className="font-normal text-fg-muted"> (you)</span> : null}
              </span>
              {delta > 0 ? <span className="text-sm font-extrabold text-ok">+{delta}</span> : null}
              <span className="min-w-14 text-right font-display text-lg font-extrabold tabular-nums text-sun">
                {r.score}
              </span>
            </div>
          </li>
        );
      })}
      {hidden > 0 ? (
        <li className="pt-1 text-center text-xs font-bold text-fg-faint">
          + {hidden} more player{hidden === 1 ? '' : 's'}
        </li>
      ) : null}
    </ol>
  );
}
