import { cn } from '../utils/cn';

export function RoundProgress({ current, total }: { current: number; total: number }) {
  return (
    <div
      className="flex w-full max-w-sm gap-1"
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
            'h-2 flex-1 rounded-full transition-all',
            i + 1 < current && 'bg-teal',
            i + 1 === current && 'flex-[2] bg-sun',
            i + 1 > current && 'bg-glass-strong',
          )}
        />
      ))}
    </div>
  );
}
