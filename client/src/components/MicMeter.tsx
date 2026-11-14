import { cn } from '../utils/cn';

/** Bouncing equalizer bars: shows the mic is live. Static and dim when off. */
export function MicMeter({ active, className }: { active: boolean; className?: string }) {
  const bars = [0.55, 1, 0.75, 0.95, 0.6];
  return (
    <span aria-hidden className={cn('inline-flex h-7 items-end gap-1', className)}>
      {bars.map((h, i) => (
        <span
          key={i}
          className={cn('w-1.5 origin-bottom rounded-full border border-ink', active ? 'animate-eq bg-lime' : 'bg-fg/25')}
          style={{ height: `${h * 100}%`, animationDelay: `${-i * 0.17}s`, transform: active ? undefined : 'scaleY(0.3)' }}
        />
      ))}
    </span>
  );
}
