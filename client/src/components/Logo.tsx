import { Mic, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn';

export function Logo({ size = 'lg' }: { size?: 'sm' | 'lg' }) {
  const big = size === 'lg';
  return (
    <div className={cn('flex items-center', big ? 'flex-col gap-4 text-center' : 'gap-2.5')}>
      <div
        className={cn(
          'relative grid place-items-center rounded-full bg-gradient-to-br from-pink to-violet shadow-xl shadow-pink/30',
          big ? 'size-24 animate-float sm:size-28' : 'size-10',
        )}
      >
        <Mic className={cn('text-fg', big ? 'size-12 sm:size-14' : 'size-5')} strokeWidth={2.5} aria-hidden />
        <Sparkles
          className={cn('absolute text-sun', big ? '-top-1 -right-1 size-7' : '-top-1 -right-1 size-4')}
          fill="currentColor"
          aria-hidden
        />
      </div>
      <div className="font-display leading-none">
        <span
          className={cn(
            'block font-extrabold tracking-[0.12em] text-fg',
            big ? 'text-2xl sm:text-4xl' : 'text-[13px]',
          )}
        >
          IMPERSONATION
        </span>
        <span
          className={cn(
            'block bg-gradient-to-r from-sun via-pink to-violet bg-clip-text font-extrabold tracking-[0.2em] text-transparent',
            big ? 'mt-1 text-5xl sm:text-7xl' : 'text-lg',
          )}
        >
          BATTLE
        </span>
      </div>
    </div>
  );
}
