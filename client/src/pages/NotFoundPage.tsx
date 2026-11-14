import { Home } from 'lucide-react';
import { Screen } from '../components/Screen';
import { GameLink } from '../components/GameButton';

export function NotFoundPage() {
  return (
    <Screen heading="Lost?">
      <p className="text-center text-lg font-bold text-fg-muted">This screen doesn't exist. If you were joining a game, check the room code.</p>
      <GameLink to="/" color="gold" fullWidth icon={<Home className="size-6" strokeWidth={3} aria-hidden />}>
        Main menu
      </GameLink>
    </Screen>
  );
}
