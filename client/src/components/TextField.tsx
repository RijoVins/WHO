import { useId } from 'react';
import type { ComponentProps } from 'react';
import { cn } from '../utils/cn';

interface TextFieldProps extends Omit<ComponentProps<'input'>, 'className'> {
  label: string;
  error?: string | null;
  hint?: string;
  /** Big arcade-style input for room codes. */
  variant?: 'default' | 'code';
}

export function TextField({ label, error, hint, variant = 'default', id, ...rest }: TextFieldProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const msgId = `${inputId}-msg`;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="font-display text-lg tracking-wide text-fg uppercase">
        {label}
      </label>
      <input
        id={inputId}
        aria-invalid={!!error || undefined}
        aria-describedby={error || hint ? msgId : undefined}
        className={cn(
          'min-h-14 w-full rounded-2xl border-[3px] bg-night-950 px-4 placeholder:text-fg-faint',
          'shadow-[inset_0_4px_0_rgb(0_0_0/0.35)] transition outline-none focus:border-cyan focus:shadow-[inset_0_4px_0_rgb(0_0_0/0.35),0_0_0_4px_rgb(46_230_255/0.25)]',
          error ? 'animate-shake border-bad' : 'border-ink',
          variant === 'code'
            ? 'min-h-18 text-center font-title text-4xl tracking-[0.35em] text-gold uppercase placeholder:text-fg/15'
            : 'text-lg font-bold text-fg placeholder:font-semibold',
        )}
        {...rest}
      />
      {error ? (
        <p id={msgId} role="alert" className="font-bold text-bad">
          {error}
        </p>
      ) : hint ? (
        <p id={msgId} className="text-sm font-semibold text-fg-faint">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
