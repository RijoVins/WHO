import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { ChevronLeft } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '../utils/cn';

interface PageShellProps {
  children: ReactNode;
  /** Page heading shown under the top bar. */
  title?: string;
  subtitle?: string;
  back?: { to: string; label: string } | { onClick: () => void; label: string };
  /** Content width: form pages are narrow, game pages wide. */
  width?: 'narrow' | 'medium' | 'wide';
  /** Hide the small logo bar (the home page shows the big logo instead). */
  bare?: boolean;
  /** Extra content on the right of the top bar. */
  topRight?: ReactNode;
}

const widths = { narrow: 'max-w-lg', medium: 'max-w-3xl', wide: 'max-w-6xl' };

export function PageShell({ children, title, subtitle, back, width = 'narrow', bare, topRight }: PageShellProps) {
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      {!bare ? (
        <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 pt-4 sm:px-6">
          <Link to="/" aria-label="Impersonation Battle home" className="rounded-xl">
            <Logo size="sm" />
          </Link>
          {topRight}
        </header>
      ) : null}
      <main className={cn('mx-auto flex w-full flex-1 flex-col gap-5 px-4 py-5 sm:px-6 sm:py-8', widths[width])}>
        {back ? <BackLink back={back} /> : null}
        {title ? (
          <div className="animate-rise">
            <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
            {subtitle ? <p className="mt-2 text-base leading-relaxed text-fg-muted">{subtitle}</p> : null}
          </div>
        ) : null}
        {children}
      </main>
    </div>
  );
}

function BackLink({ back }: { back: NonNullable<PageShellProps['back']> }) {
  const cls =
    '-ml-1 inline-flex min-h-11 items-center gap-1 self-start rounded-xl pr-2 font-semibold text-fg-muted hover:text-fg';
  const inner = (
    <>
      <ChevronLeft className="size-5" aria-hidden />
      {back.label}
    </>
  );
  return 'to' in back ? (
    <Link to={back.to} className={cls}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={back.onClick} className={cls}>
      {inner}
    </button>
  );
}
