import { Check } from 'lucide-react';
import type { GameMode } from '@ib/shared';
import { cn } from '../utils/cn';
import { MODE_INFO } from './modeInfo';

interface ModeCardProps {
  mode: GameMode;
  selected: boolean;
  onSelect: () => void;
}

/** A radio-style card. Wrap several in an element with role="radiogroup". */
export function ModeCard({ mode, selected, onSelect }: ModeCardProps) {
  const info = MODE_INFO[mode];
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'group relative flex min-h-56 flex-1 animate-rise flex-col items-start gap-1 overflow-hidden rounded-[2rem] bg-gradient-to-br p-6 text-left',
        'shadow-xl transition duration-200 hover:-translate-y-1 hover:shadow-2xl active:scale-[0.98]',
        info.gradient,
        selected ? 'ring-4 ring-sun ring-offset-4 ring-offset-ink-900' : 'ring-0',
      )}
    >
      <span className="pointer-events-none absolute -right-8 -bottom-10 size-40 rounded-full bg-fg/10 transition group-hover:scale-110" />
      <span className="mb-4 grid size-16 place-items-center rounded-2xl bg-fg/20 text-fg">{info.icon}</span>
      <span className="text-xs font-extrabold tracking-[0.15em] text-fg/80 uppercase">{info.tagline}</span>
      <span className="font-display text-3xl font-extrabold">{info.title}</span>
      <span className="text-base leading-relaxed text-fg/90">{info.description}</span>
      {selected ? (
        <span className="absolute top-5 right-5 grid size-9 animate-pop-in place-items-center rounded-full bg-sun text-on-bright">
          <Check className="size-5" strokeWidth={3} aria-hidden />
        </span>
      ) : null}
    </button>
  );
}
