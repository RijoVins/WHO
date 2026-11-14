import { LogIn, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { GameTitle } from '../components/GameTitle';
import { GameLink } from '../components/GameButton';
import { ModeTile } from '../components/ModeTile';
import { useModeChoice } from '../context/mode';

/** The game menu: two modes, Create Room, Join Room. Nothing else. */
export function HomePage() {
  const { mode, setMode } = useModeChoice();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-5 px-4 pt-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:gap-8 sm:px-6">
      <header className="animate-screen-in">
        <h1>
          <GameTitle />
        </h1>
      </header>

      <main className="flex w-full max-w-4xl flex-col gap-4 sm:gap-7">
        <div role="radiogroup" aria-label="Game mode" className="grid gap-3 sm:grid-cols-2 sm:gap-6">
          <ModeTile mode="celebrity" faded={mode === 'friends'} selected={mode === 'celebrity'} onSelect={() => setMode('celebrity')} delay={80} />
          <ModeTile mode="friends" faded={mode === 'celebrity'} selected={mode === 'friends'} onSelect={() => setMode('friends')} delay={160} />
        </div>

        <nav aria-label="Play" className="grid animate-rise gap-3 [animation-delay:240ms] sm:grid-cols-2 sm:gap-6">
          <GameLink to="/create" color="lime" size="xl" fullWidth shine={!!mode} icon={<Plus className="size-8" strokeWidth={4} aria-hidden />}>
            Create Room
          </GameLink>
          <GameLink to="/join" color="cyan" size="xl" fullWidth icon={<LogIn className="size-8" strokeWidth={3.5} aria-hidden />}>
            Join Room
          </GameLink>
        </nav>
      </main>

      {import.meta.env.DEV ? (
        <Link to="/dev/gallery" className="font-display text-sm tracking-wide text-fg-faint uppercase hover:text-fg">
          Dev: screen gallery
        </Link>
      ) : null}
    </div>
  );
}
