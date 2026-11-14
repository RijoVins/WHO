import { Star, Users } from 'lucide-react';
import type { GameMode } from '@ib/shared';
import { cn } from '../utils/cn';

interface ModeSwitchProps {
  value: GameMode | null;
  onChange: (mode: GameMode) => void;
  invalid?: boolean;
  label?: string;
}

/** Two chunky toggle buttons for picking the mode outside the main menu. */
export function ModeSwitch({ value, onChange, invalid, label = 'Game mode' }: ModeSwitchProps) {
  const opts: { mode: GameMode; text: string; icon: React.ReactNode; on: string }[] = [
    { mode: 'celebrity', text: 'Celebrity', icon: <Star className="size-6 fill-gold text-ink" strokeWidth={2.5} />, on: 'bg-celeb text-fg' },
    { mode: 'friends', text: 'Friends', icon: <Users className="size-6" strokeWidth={3} />, on: 'bg-friend text-on-bright' },
  ];
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-lg tracking-wide uppercase" id="mode-switch-label">
        {label}
      </span>
      <div role="radiogroup" aria-labelledby="mode-switch-label" className={cn('grid grid-cols-2 gap-3', invalid && 'animate-shake')}>
        {opts.map((o) => {
          const selected = value === o.mode;
          return (
            <button
              key={o.mode}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(o.mode)}
              className={cn(
                'flex min-h-14 items-center justify-center gap-2 rounded-2xl border-[3px] font-display text-xl uppercase transition',
                selected
                  ? `translate-y-1 border-ink shadow-[0_1px_0_var(--color-ink)] ${o.on}`
                  : cn('bg-night-600 text-fg shadow-[0_5px_0_var(--color-ink)] hover:-translate-y-0.5', invalid ? 'border-bad' : 'border-ink'),
              )}
            >
              {o.icon}
              {o.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
