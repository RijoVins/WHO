import { avatarColor, initials } from '../utils/players';
import { cn } from '../utils/cn';

interface PlayerAvatarProps {
  id: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  dimmed?: boolean;
  /** White ring for avatars on colored backgrounds. */
  ring?: boolean;
  className?: string;
}

const sizes = {
  sm: 'size-8 text-xs',
  md: 'size-10 text-sm',
  lg: 'size-14 text-lg',
  xl: 'size-20 text-2xl',
};

export function PlayerAvatar({ id, name, size = 'md', dimmed, ring, className }: PlayerAvatarProps) {
  return (
    <span
      aria-hidden
      style={{ backgroundColor: avatarColor(id) }}
      className={cn(
        'grid shrink-0 place-items-center rounded-full font-display font-extrabold text-on-bright',
        sizes[size],
        dimmed && 'opacity-35 grayscale',
        ring && 'ring-4 ring-fg',
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
