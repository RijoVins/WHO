import type { ReactNode } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft } from 'lucide-react';
import { GameTitle } from './GameTitle';
import { IconButton } from './GameButton';
import { cn } from '../utils/cn';

interface ScreenProps {
  children: ReactNode;
  /** Big outlined screen heading, e.g. "CREATE ROOM". */
  heading?: string;
  /** Where the round back button goes; omit for no back button. */
  backTo?: string;
  onBack?: () => void;
  /** Right side of the top bar (leave button, room code chip...). */
  right?: ReactNode;
  width?: 'narrow' | 'wide';
}

/** Common frame for every screen after the main menu. */
export function Screen({ children, heading, backTo, onBack, right, width = 'narrow' }: ScreenProps) {
  const navigate = useNavigate();
  const back = onBack ?? (backTo ? () => navigate(backTo) : undefined);
  return (
    <div className="flex min-h-dvh flex-col pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]">
      <header className="mx-auto flex w-full max-w-6xl items-center gap-3 px-4 pt-4 sm:px-6">
        {back ? <IconButton label="Back" onClick={back} icon={<ArrowLeft className="size-6" strokeWidth={3} />} /> : null}
        <Link to="/" aria-label="Main menu" className="rounded-xl">
          <GameTitle size="compact" />
        </Link>
        <div className="ml-auto flex items-center gap-2">{right}</div>
      </header>
      <main
        className={cn(
          'mx-auto flex w-full flex-1 animate-screen-in flex-col gap-5 px-4 pt-6 pb-10 sm:px-6',
          width === 'narrow' ? 'max-w-lg' : 'max-w-6xl',
        )}
      >
        {heading ? (
          <h1
            className="text-center font-title text-[clamp(2.4rem,9vw,3.6rem)] leading-none text-fg text-outline"
            style={{ textShadow: '0 5px 0 var(--color-ink)' }}
          >
            {heading}
          </h1>
        ) : null}
        {children}
      </main>
    </div>
  );
}
