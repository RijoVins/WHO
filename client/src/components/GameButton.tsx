import type { ComponentProps, CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../utils/cn';

export type ButtonColor = 'gold' | 'celeb' | 'friend' | 'pink' | 'lime' | 'cyan' | 'night' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'xl';

const colors: Record<ButtonColor, CSSProperties> = {
  gold: { '--face': 'var(--color-gold)', '--lip': 'var(--color-gold-deep)' } as CSSProperties,
  celeb: { '--face': 'var(--color-celeb)', '--lip': 'var(--color-celeb-deep)', '--label': '#fff' } as CSSProperties,
  friend: { '--face': 'var(--color-friend)', '--lip': 'var(--color-friend-deep)' } as CSSProperties,
  pink: { '--face': 'var(--color-pink)', '--lip': 'var(--color-pink-deep)', '--label': '#fff' } as CSSProperties,
  lime: { '--face': 'var(--color-lime)', '--lip': 'var(--color-lime-deep)' } as CSSProperties,
  cyan: { '--face': 'var(--color-cyan)', '--lip': 'var(--color-cyan-deep)' } as CSSProperties,
  night: { '--face': 'var(--color-night-600)', '--lip': 'var(--color-night-800)', '--label': '#fff' } as CSSProperties,
  danger: { '--face': 'var(--color-bad)', '--lip': '#b3122a', '--label': '#fff' } as CSSProperties,
};

const sizes: Record<Size, string> = {
  sm: 'min-h-11 px-4 text-base rounded-2xl',
  md: 'min-h-13 px-5 text-lg',
  lg: 'min-h-16 px-7 text-2xl',
  xl: 'min-h-20 px-8 text-3xl',
};

interface Common {
  color?: ButtonColor;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
  /** Sweeping shine to draw the eye (e.g. the main call to action). */
  shine?: boolean;
  className?: string;
}

function inner(icon: ReactNode, children: ReactNode, shine?: boolean, loading?: boolean) {
  return (
    <>
      {shine ? (
        <span aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-1/3 animate-shine bg-white/35" />
      ) : null}
      {loading ? <LoaderCircle className="size-6 animate-spin" aria-hidden /> : icon}
      <span className="relative">{children}</span>
    </>
  );
}

interface GameButtonProps extends Common, Omit<ComponentProps<'button'>, 'className' | 'color'> {
  loading?: boolean;
}

export function GameButton({
  color = 'gold',
  size = 'lg',
  icon,
  fullWidth,
  shine,
  loading,
  className,
  children,
  disabled,
  type,
  style,
  ...rest
}: GameButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn('btn-3d', sizes[size], fullWidth && 'w-full', className)}
      style={{ ...colors[color], ...style }}
      {...rest}
    >
      {inner(icon, children, shine && !disabled, loading)}
    </button>
  );
}

interface GameLinkProps extends Common, Omit<ComponentProps<typeof Link>, 'className' | 'color'> {}

export function GameLink({ color = 'gold', size = 'lg', icon, fullWidth, shine, className, children, style, ...rest }: GameLinkProps) {
  return (
    <Link
      className={cn('btn-3d', sizes[size], fullWidth && 'w-full', className)}
      style={{ ...colors[color], ...(style as CSSProperties) }}
      {...rest}
    >
      {inner(icon, children as ReactNode, shine)}
    </Link>
  );
}

/** Round 3D icon button (back, leave, copy...). */
export function IconButton({
  label,
  icon,
  color = 'night',
  onClick,
}: {
  label: string;
  icon: ReactNode;
  color?: ButtonColor;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="btn-3d size-12 shrink-0 rounded-full p-0"
      style={colors[color]}
    >
      {icon}
    </button>
  );
}
