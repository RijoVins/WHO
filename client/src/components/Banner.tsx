import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

type Kind = 'info' | 'success' | 'warning' | 'error';

const styles: Record<Kind, { box: string; icon: ReactNode }> = {
  info: { box: 'bg-cyan text-on-bright', icon: <Info className="size-6 shrink-0" strokeWidth={2.75} aria-hidden /> },
  success: { box: 'bg-lime text-on-bright', icon: <CheckCircle2 className="size-6 shrink-0" strokeWidth={2.75} aria-hidden /> },
  warning: { box: 'bg-warn text-on-bright', icon: <AlertTriangle className="size-6 shrink-0" strokeWidth={2.75} aria-hidden /> },
  error: { box: 'bg-bad text-fg', icon: <XCircle className="size-6 shrink-0" strokeWidth={2.75} aria-hidden /> },
};

/** Loud, game-style message strip. */
export function Banner({ kind = 'info', children, action }: { kind?: Kind; children: ReactNode; action?: ReactNode }) {
  const s = styles[kind];
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex animate-pop-in flex-wrap items-center gap-3 rounded-2xl border-[3px] border-ink p-3.5 font-bold shadow-[0_5px_0_var(--color-ink)]',
        s.box,
      )}
    >
      {s.icon}
      <div className="min-w-[min(100%,13rem)] flex-1 leading-snug">{children}</div>
      {action}
    </div>
  );
}
