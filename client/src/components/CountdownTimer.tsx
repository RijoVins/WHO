import { useCountdown } from '../hooks/useCountdown';
import { cn } from '../utils/cn';

interface CountdownTimerProps {
  /** Server epoch ms when this stage ends. */
  endsAt: number;
  totalSeconds: number;
  label: string;
  serverOffsetMs?: number;
}

const R = 44;
const CIRC = 2 * Math.PI * R;

/** Circular countdown. Display only — the server ends each stage. */
export function CountdownTimer({ endsAt, totalSeconds, label, serverOffsetMs }: CountdownTimerProps) {
  const left = useCountdown(endsAt, serverOffsetMs) ?? 0;
  const fraction = totalSeconds > 0 ? Math.min(1, left / totalSeconds) : 0;
  const tone = left <= 5 ? 'text-bad' : left <= 10 ? 'text-warn' : 'text-teal';

  return (
    <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-3" role="timer" aria-label={`${label}: ${left} seconds left`}>
      <div className={cn('relative size-20 shrink-0 sm:size-24', tone, left <= 5 && left > 0 && 'animate-pulse')}>
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="9" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke="currentColor"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - fraction)}
            className="transition-[stroke-dashoffset] duration-300 ease-linear"
          />
        </svg>
        <span className="absolute inset-0 grid place-items-center font-display text-3xl font-extrabold tabular-nums sm:text-4xl">
          {left}
        </span>
      </div>
      <span className="text-[11px] font-extrabold tracking-[0.15em] text-fg-muted uppercase">{label}</span>
    </div>
  );
}
