import type { GameMode } from '@ib/shared';
import type { ButtonColor } from './GameButton';

/** Copy and colors for the two modes. */
export const MODE_INFO: Record<
  GameMode,
  { title: string; short: string; tagline: string; button: ButtonColor; sticker: 'celeb' | 'friend'; text: string }
> = {
  celebrity: {
    title: 'Celebrity Mode',
    short: 'Celebrity',
    tagline: 'Impersonate the stars',
    button: 'celeb',
    sticker: 'celeb',
    text: 'text-gold',
  },
  friends: {
    title: 'Friends Mode',
    short: 'Friends',
    tagline: 'Impersonate your crew',
    button: 'friend',
    sticker: 'friend',
    text: 'text-friend',
  },
};
