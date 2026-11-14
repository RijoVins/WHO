import { rankPlayers } from '@ib/shared';
import { Character } from './Character';
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

const medal = ['bg-gold', 'bg-[#dfe3f0]', 'bg-[#f0a46a]'];

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
    <ol className="flex flex-col gap-2">
      {rows.map((r, i) => {
        const delta = deltas[r.playerId] ?? 0;
        const mine = r.playerId === selfId;
        return (
          <li key={r.playerId} className="contents">
            {appendedMe && i === rows.length - 1 ? (
              <span className="text-center font-display text-fg-faint" aria-hidden>
                • • •
              </span>
            ) : null}
            <div
              className={cn(
                'flex animate-rise items-center gap-3 rounded-2xl border-[3px] border-ink bg-night-600 py-1.5 pr-3 pl-1.5 shadow-[0_4px_0_var(--color-ink)]',
                mine && 'bg-celeb-deep',
              )}
              style={{ animationDelay: `${Math.min(i, 12) * 45}ms` }}
            >
              <span
                className={cn(
                  'grid size-10 shrink-0 place-items-center rounded-xl border-[3px] border-ink font-title text-xl',
                  r.rank <= 3 ? `${medal[r.rank - 1]} text-on-bright` : 'bg-night-900 text-fg',
                )}
                aria-label={`Rank ${r.rank}`}
              >
                {r.rank}
              </span>
              <Character id={r.playerId} size={38} dimmed={byId.get(r.playerId)?.connected === false} />
              <span className="min-w-0 flex-1 truncate font-display text-lg">
                {r.name}
                {mine ? <span className="ml-1 text-sm text-cyan">(you)</span> : null}
              </span>
              {delta > 0 ? (
                <span className="animate-pop-in rounded-lg border-2 border-ink bg-lime px-1.5 font-display text-sm text-on-bright">
                  +{delta}
                </span>
              ) : null}
              <span className="min-w-14 text-right font-title text-2xl text-gold tabular-nums text-outline-thin">{r.score}</span>
            </div>
          </li>
        );
      })}
      {hidden > 0 ? (
        <li className="pt-1 text-center font-display text-fg-faint">
          + {hidden} more player{hidden === 1 ? '' : 's'}
        </li>
      ) : null}
    </ol>
  );
}
