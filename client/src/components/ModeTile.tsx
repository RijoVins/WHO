import { Check } from 'lucide-react';
import type { GameMode } from '@ib/shared';
import { CelebrityArt, FriendsArt } from './ModeArt';
import { MODE_INFO } from './modeInfo';
import { cn } from '../utils/cn';

interface ModeTileProps {
  mode: GameMode;
  selected: boolean;
  onSelect: () => void;
  delay?: number;
  /** Another mode is selected: fade this one back. */
  faded?: boolean;
}

const look: Record<GameMode, { bg: string; lip: string; glow: string }> = {
  celebrity: {
    bg: 'bg-[linear-gradient(160deg,#a65cff_0%,#6a22e0_55%,#4a10b0_100%)]',
    lip: '#3a0a8f',
    glow: 'shadow-[inset_0_0_0_5px_var(--color-gold),inset_0_0_36px_6px_rgb(255_200_61/0.6)]',
  },
  friends: {
    bg: 'bg-[linear-gradient(160deg,#ffa043_0%,#ff6a2a_45%,#ff3d8b_100%)]',
    lip: '#a8124f',
    glow: 'shadow-[inset_0_0_0_5px_var(--color-fg),inset_0_0_36px_6px_rgb(255_255_255/0.5)]',
  },
};

/** Big selectable mode card for the game menu. Use inside role="radiogroup". */
export function ModeTile({ mode, selected, onSelect, delay = 0, faded }: ModeTileProps) {
  const info = MODE_INFO[mode];
  const l = look[mode];
  const Art = mode === 'celebrity' ? CelebrityArt : FriendsArt;
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={`${info.title}: ${info.tagline}`}
      onClick={onSelect}
      style={{ animationDelay: `${delay}ms`, boxShadow: `inset 0 -8px 0 ${l.lip}, 0 8px 0 var(--color-ink)` }}
      className={cn(
        'group relative isolate flex animate-pop-in overflow-hidden rounded-[1.75rem] border-[3px] border-ink text-left transition-transform duration-150',
        'hover:-translate-y-1 hover:-rotate-1 active:translate-y-1 active:rotate-0',
        l.bg,
        selected && 'z-10 scale-[1.02]',
        faded && 'opacity-70 saturate-[0.6] hover:opacity-100 hover:saturate-100',
        // Phones: compact horizontal tile. sm+: tall card.
        'min-h-28 flex-row items-center gap-1 pr-4 sm:min-h-[19rem] sm:flex-col sm:items-stretch sm:gap-0 sm:pr-0',
      )}
    >
      {/* selection glow sits on a wrapper so it doesn't fight the 3D shadow */}
      <span
        aria-hidden
        className={cn('pointer-events-none absolute inset-0 rounded-[1.6rem] transition-opacity', l.glow, selected ? 'opacity-100' : 'opacity-0')}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_1px_1px,rgb(255_255_255/0.18)_1.2px,transparent_0)] bg-[length:12px_12px] opacity-60"
      />
      <Art
        className={cn(
          'shrink-0 transition-transform duration-300 group-hover:scale-105',
          'h-24 w-32 sm:mx-auto sm:mt-3 sm:h-44 sm:w-full sm:max-w-64',
        )}
      />
      <span className="relative flex min-w-0 flex-1 flex-col sm:flex-none sm:px-5 sm:pb-6 sm:text-center">
        <span
          className="font-title text-[1.7rem] leading-none text-fg text-outline sm:text-[2.8rem]"
          style={{ textShadow: '0 4px 0 var(--color-ink)' }}
        >
          {mode === 'celebrity' ? 'CELEBRITY' : 'FRIENDS'}
        </span>
        <span
          className="font-display text-sm tracking-[0.2em] text-fg/90 uppercase sm:text-lg"
        >
          Mode
        </span>
        <span className="text-sm leading-tight font-bold text-fg/90 sm:mt-1 sm:text-base">
          {info.tagline}
        </span>
      </span>
      {selected ? (
        <span className="absolute top-2 right-2 flex animate-pop-in items-center gap-1 rounded-full border-[3px] border-ink bg-gold p-1 font-display text-sm text-on-bright uppercase shadow-[0_3px_0_var(--color-ink)] sm:top-3 sm:right-auto sm:left-3 sm:px-2.5 sm:py-0.5">
          <Check className="size-4" strokeWidth={4} aria-hidden />
          <span className="hidden sm:inline">Selected</span>
        </span>
      ) : null}
    </button>
  );
}
