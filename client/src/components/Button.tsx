import type { ComponentProps, ReactNode } from 'react';
import { Link } from 'react-router';
import { LoaderCircle } from 'lucide-react';
import { cn } from '../utils/cn';

type Variant = 'primary' | 'teal' | 'sun' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-display font-bold select-none ' +
  'transition duration-150 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-45';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-r from-pink to-violet text-fg shadow-lg shadow-pink/25 hover:brightness-110 hover:shadow-pink/40',
  teal: 'bg-teal text-on-bright shadow-lg shadow-teal/20 hover:brightness-110',
  sun: 'bg-sun text-on-bright shadow-lg shadow-sun/20 hover:brightness-105',
  ghost: 'border-2 border-line bg-glass text-fg hover:bg-glass-strong',
  danger: 'border-2 border-bad/70 text-bad hover:bg-bad/10',
};

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-base',
  lg: 'min-h-14 px-7 text-lg',
};

interface CommonProps {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  fullWidth?: boolean;
}

function buttonClass({ variant = 'primary', size = 'lg', fullWidth }: CommonProps, extra?: string) {
  return cn(base, variants[variant], sizes[size], fullWidth && 'w-full', extra);
}

interface ButtonProps extends CommonProps, Omit<ComponentProps<'button'>, 'className'> {
  loading?: boolean;
  className?: string;
}

export function Button({ variant, size, icon, fullWidth, loading, children, className, disabled, type, ...rest }: ButtonProps) {
  return (
    <button
      type={type ?? 'button'}
      className={buttonClass({ variant, size, fullWidth }, className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : icon}
      {children}
    </button>
  );
}

interface ButtonLinkProps extends CommonProps, Omit<ComponentProps<typeof Link>, 'className'> {
  className?: string;
}

export function ButtonLink({ variant, size, icon, fullWidth, children, className, ...rest }: ButtonLinkProps) {
  return (
    <Link className={buttonClass({ variant, size, fullWidth }, className)} {...rest}>
      {icon}
      {children}
    </Link>
  );
}
