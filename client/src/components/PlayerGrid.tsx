import { Check, Crown, Mic, WifiOff } from 'lucide-react';
import type { PlayerPublic } from '@ib/shared';
import { Character } from './Character';
import { cn } from '../utils/cn';

interface PlayerGridProps {
  players: PlayerPublic[];
  selfId?: string | null;
  performerId?: string | null;
  /** Players who guessed correctly this round. */
  correctIds?: string[];
  showScores?: boolean;
  /** Narrow single-column-ish tiles for sidebars. */
  dense?: boolean;
}

/** Player roster. Tiles pop in one after another, like players dropping into a lobby. */
export function PlayerGrid({ players, selfId, performerId, correctIds = [], showScores, dense }: PlayerGridProps) {
  return (
    <ul
      className={cn(
        'grid gap-2.5',
        dense ? 'grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]' : 'grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]',
      )}
    >
      {players.map((p, i) => {
        const performing = p.id === performerId;
        const correct = correctIds.includes(p.id);
        const me = p.id === selfId;
        return (
          <li
            key={p.id}
            style={{ animationDelay: `${Math.min(i, 24) * 35}ms` }}
            className={cn(
              'relative flex min-h-16 animate-pop-in items-center gap-2.5 rounded-2xl border-[3px] border-ink p-2 pr-3 shadow-[0_4px_0_var(--color-ink)]',
              performing ? 'bg-pink' : correct ? 'bg-[#1f5a3f]' : 'bg-night-600',
              me && !performing && 'ring-[3px] ring-cyan ring-offset-2 ring-offset-night-800',
            )}
          >
            <span className="relative">
              <Character id={p.id} size={46} dimmed={!p.connected} />
              {p.isHost ? (
                <Crown
                  className="absolute -top-3 -left-1.5 size-6 -rotate-12 fill-gold text-ink"
                  strokeWidth={2.5}
                  aria-label="Host"
                />
              ) : null}
            </span>
            <div className="min-w-0 flex-1">
              <p className={cn('truncate font-display text-lg leading-tight', !p.connected && 'text-fg-faint')}>
                {p.name}
                {me ? <span className="ml-1 text-sm text-cyan">(you)</span> : null}
              </p>
              <p className="flex gap-1.5 overflow-hidden font-display text-xs tracking-wide whitespace-nowrap uppercase">
                {p.isHost ? <span className="text-gold">Host</span> : null}
                {performing ? (
                  <span className="inline-flex items-center gap-0.5 text-fg">
                    <Mic className="size-3.5" strokeWidth={3} aria-hidden /> On the mic
                  </span>
                ) : null}
                {correct ? (
                  <span className="inline-flex items-center gap-0.5 text-lime">
                    <Check className="size-3.5" strokeWidth={4} aria-hidden /> Got it
                  </span>
                ) : null}
                {!p.connected ? (
                  <span className="inline-flex items-center gap-0.5 text-fg-faint">
                    <WifiOff className="size-3.5" strokeWidth={3} aria-hidden /> Reconnecting
                  </span>
                ) : null}
              </p>
            </div>
            {showScores ? (
              <span className="font-title text-xl text-gold tabular-nums text-outline-thin">{p.score}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
