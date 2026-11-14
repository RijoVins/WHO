import type { ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';
import { cn } from '../utils/cn';

type Kind = 'info' | 'success' | 'warning' | 'error';

const styles: Record<Kind, { box: string; icon: ReactNode }> = {
  info: { box: 'border-sky/60 bg-sky/10', icon: <Info className="size-5 shrink-0 text-sky" aria-hidden /> },
  success: { box: 'border-ok/60 bg-ok/10', icon: <CheckCircle2 className="size-5 shrink-0 text-ok" aria-hidden /> },
  warning: { box: 'border-warn/60 bg-warn/10', icon: <AlertTriangle className="size-5 shrink-0 text-warn" aria-hidden /> },
  error: { box: 'border-bad/60 bg-bad/10', icon: <XCircle className="size-5 shrink-0 text-bad" aria-hidden /> },
};

export function Banner({ kind = 'info', children, action }: { kind?: Kind; children: ReactNode; action?: ReactNode }) {
  const s = styles[kind];
  return (
    <div
      role={kind === 'error' ? 'alert' : 'status'}
      className={cn('flex animate-rise flex-wrap items-start gap-3 rounded-2xl border-2 p-3.5', s.box)}
    >
      {s.icon}
      <div className="min-w-[min(100%,14rem)] flex-1 text-[15px] leading-relaxed">{children}</div>
      {action}
    </div>
  );
}
