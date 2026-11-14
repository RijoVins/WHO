import { cn } from '../utils/cn';

/** Round pips: done, current (bouncing), upcoming. */
export function RoundProgress({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={total}
      aria-valuenow={current}
      aria-label={`Round ${current} of ${total}`}
    >
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            'rounded-full border-[2.5px] border-ink',
            i + 1 < current && 'size-3.5 bg-lime',
            i + 1 === current && 'size-5 animate-bob bg-gold',
            i + 1 > current && 'size-3.5 bg-night-600',
          )}
        />
      ))}
    </div>
  );
}
