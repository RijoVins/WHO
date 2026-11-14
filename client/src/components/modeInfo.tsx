import { Star, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import type { GameMode } from '@ib/shared';

/** Display copy, icon and colors for each game mode. */
export const MODE_INFO: Record<
  GameMode,
  { title: string; tagline: string; description: string; icon: ReactNode; gradient: string; accent: string }
> = {
  celebrity: {
    title: 'Celebrity Mode',
    tagline: 'Channel the stars',
    description:
      'The performer secretly gets a famous name and does their best impression. Everyone else guesses who it is.',
    icon: <Star className="size-8" fill="currentColor" aria-hidden />,
    gradient: 'from-pink to-violet',
    accent: 'bg-pink',
  },
  friends: {
    title: 'Friends Mode',
    tagline: 'Roast your crew (nicely)',
    description:
      'The performer secretly gets a player in this room and copies how they talk. Guess the friend — even the one being imitated can guess.',
    icon: <Users className="size-8" aria-hidden />,
    gradient: 'from-teal to-[#4361ee]',
    accent: 'bg-teal',
  },
};
