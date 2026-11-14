import { useId } from 'react';
import type { ComponentProps } from 'react';
import { cn } from '../utils/cn';

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'className'> {
  label: string;
  error?: string | null;
  hint?: string;
  /** Large, letter-spaced input for room codes. */
  variant?: 'default' | 'code';
}

export function TextField({ label, error, hint, variant = 'default', id, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-sm font-bold tracking-wide text-fg-muted">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? msgId : undefined}
        className={cn(
          'min-h-13 w-full rounded-2xl border-2 bg-glass px-4 text-lg text-fg placeholder:text-fg-faint',
          'transition outline-none focus:border-sun focus:bg-glass-strong',
          error ? 'border-bad animate-shake' : 'border-line',
          variant === 'code' &&
            'text-center font-display text-3xl font-extrabold tracking-[0.4em] uppercase placeholder:text-fg/20',
        )}
        {...rest}
      />
      {error ? (
        <p id={msgId} role="alert" className="text-sm font-semibold text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-sm text-fg-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
