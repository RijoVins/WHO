import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface PanelProps {
  /** Sticker-style label stuck to the top edge. */
  label?: string;
  labelColor?: 'gold' | 'pink' | 'cyan' | 'lime' | 'celeb' | 'friend';
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

const stickers = {
  gold: 'bg-gold text-on-bright',
  pink: 'bg-pink text-fg',
  cyan: 'bg-cyan text-on-bright',
  lime: 'bg-lime text-on-bright',
  celeb: 'bg-celeb text-fg',
  friend: 'bg-friend text-on-bright',
};

export function Panel({ label, labelColor = 'gold', action, children, className }: PanelProps) {
  return (
    <section className={cn('panel p-4 sm:p-5', label && 'mt-4 pt-7 sm:pt-8', className)}>
      {label ? (
        <h2
          className={cn(
            'absolute -top-4 left-4 -rotate-2 rounded-xl border-3 border-ink px-3 py-1 font-display text-base tracking-wider uppercase shadow-[0_4px_0_var(--color-ink)]',
            stickers[labelColor],
          )}
        >
          {label}
        </h2>
      ) : null}
      {action ? <div className="absolute -top-4 right-4">{action}</div> : null}
      {children}
    </section>
  );
}
