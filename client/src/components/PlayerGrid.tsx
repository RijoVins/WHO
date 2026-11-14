import { CheckCircle2, Crown, Mic, WifiOff } from 'lucide-react';
import type { PlayerPublic } from '@ib/shared';
import { PlayerAvatar } from './PlayerAvatar';
import { cn } from '../utils/cn';

interface PlayerGridProps {
  players: PlayerPublic[];
  selfId?: string | null;
  performerId?: string | null;
  /** Players who guessed correctly this round. */
  correctIds?: string[];
  showScores?: boolean;
  /** Narrower tiles for sidebars. */
  dense?: boolean;
}

/** Responsive player grid: as many columns as fit, from 1 on small phones up to 4+ on desktop. */
export function PlayerGrid({ players, selfId, performerId, correctIds = [], showScores, dense }: PlayerGridProps) {
  return (
    <ul
      className={cn(
        'grid gap-2',
        dense
          ? 'grid-cols-[repeat(auto-fill,minmax(14rem,1fr))]'
          : 'grid-cols-[repeat(auto-fill,minmax(9.5rem,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(11rem,1fr))]',
      )}
    >
      {players.map((p) => {
        const performing = p.id === performerId;
        const correct = correctIds.includes(p.id);
        const me = p.id === selfId;
        return (
          <li
            key={p.id}
            className={cn(
              'flex min-h-14 animate-pop-in items-center gap-2.5 rounded-2xl border-2 bg-glass p-2 pr-3 transition-colors',
              performing ? 'border-pink bg-pink/15' : correct ? 'border-ok/80 bg-ok/10' : 'border-transparent',
            )}
          >
            <PlayerAvatar id={p.id} name={p.name} dimmed={!p.connected} />
            <div className="min-w-0 flex-1">
              <p className={cn('flex items-center gap-1.5 font-bold', !p.connected && 'text-fg-faint')}>
                <span className="truncate">{p.name}</span>
                {me ? (
                  <span className="shrink-0 rounded-md bg-teal px-1.5 text-[10px] font-extrabold text-on-bright">
                    YOU
                  </span>
                ) : null}
              </p>
              <p className="flex gap-x-2 overflow-hidden text-xs font-bold whitespace-nowrap">
                {p.isHost ? (
                  <span className="inline-flex items-center gap-0.5 text-sun">
                    <Crown className="size-3" aria-hidden /> Host
                  </span>
                ) : null}
                {performing ? (
                  <span className="inline-flex items-center gap-0.5 text-pink">
                    <Mic className="size-3" aria-hidden /> Performing
                  </span>
                ) : null}
                {correct ? (
                  <span className="inline-flex items-center gap-0.5 text-ok">
                    <CheckCircle2 className="size-3" aria-hidden /> Got it
                  </span>
                ) : null}
                {!p.connected ? (
                  <span className="inline-flex items-center gap-0.5 text-fg-faint">
                    <WifiOff className="size-3" aria-hidden /> Reconnecting
                  </span>
                ) : null}
              </p>
            </div>
            {showScores ? (
              <span className="font-display text-lg font-extrabold tabular-nums text-sun">{p.score}</span>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
