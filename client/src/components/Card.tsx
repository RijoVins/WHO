import type { ReactNode } from 'react';
import { cn } from '../utils/cn';

interface CardProps {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, action, children, className }: CardProps) {
  return (
    <section className={cn('rounded-3xl border border-line bg-glass p-4 backdrop-blur-sm sm:p-5', className)}>
      {title || action ? (
        <header className="mb-3 flex items-center justify-between gap-3">
          {title ? (
            <h2 className="text-xs font-extrabold tracking-[0.15em] text-fg-muted uppercase">{title}</h2>
          ) : (
            <span />
          )}
          {action}
        </header>
      ) : null}
      {children}
    </section>
  );
}
