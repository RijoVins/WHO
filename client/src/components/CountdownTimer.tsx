import { useCountdown } from '../hooks/useCountdown';
import { cn } from '../utils/cn';

interface CountdownTimerProps {
  /** Server epoch ms when this stage ends. */
  endsAt: number;
  totalSeconds: number;
  label: string;
  serverOffsetMs?: number;
}

const R = 42;
const CIRC = 2 * Math.PI * R;

/** Arcade countdown: the number punches in every second and shakes in the last five. Display only. */
export function CountdownTimer({ endsAt, totalSeconds, label, serverOffsetMs }: CountdownTimerProps) {
  const left = useCountdown(endsAt, serverOffsetMs) ?? 0;
  const fraction = totalSeconds > 0 ? Math.min(1, left / totalSeconds) : 0;
  const color = left <= 5 ? 'var(--color-bad)' : left <= 10 ? 'var(--color-warn)' : 'var(--color-lime)';

  return (
    <div className="flex flex-col items-center" role="timer" aria-label={`${label}: ${left} seconds left`}>
      <div className={cn('relative size-24 sm:size-28', left <= 5 && left > 0 && 'animate-shake')}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r="47" fill="var(--color-night-950)" stroke="var(--color-ink)" strokeWidth="5" />
          <circle cx="50" cy="50" r={R} fill="none" stroke="var(--color-night-600)" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fraction)}
            className="transition-[stroke-dashoffset,stroke] duration-300 ease-linear"
          />
        </svg>
        <span
          key={left}
          className="absolute inset-0 grid animate-count place-items-center font-title text-[2.6rem] text-outline-thin sm:text-5xl"
          style={{ color }}
        >
          {left}
        </span>
      </div>
      <span className="-mt-2 rounded-lg border-[2.5px] border-ink bg-night-950 px-2 font-display text-xs tracking-[0.15em] uppercase">
        {label}
      </span>
    </div>
  );
}
