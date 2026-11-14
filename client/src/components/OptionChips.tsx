import { cn } from '../utils/cn';

interface OptionChipsProps<T extends string | number> {
  label: string;
  options: readonly T[];
  value: T;
  onChange?: (value: T) => void;
  format?: (value: T) => string;
}

/** Single-choice chunky chips. Read-only when onChange is missing. */
export function OptionChips<T extends string | number>({ label, options, value, onChange, format = String }: OptionChipsProps<T>) {
  const readOnly = !onChange;
  return (
    <div className="flex flex-col gap-2">
      <span className="font-display text-lg tracking-wide uppercase" id={`opt-${label}`}>
        {label}
      </span>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby={`opt-${label}`}>
        {options.map((opt) => {
          const selected = opt === value;
          return (
            <button
              key={String(opt)}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={readOnly}
              onClick={() => onChange?.(opt)}
              className={cn(
                'min-h-12 min-w-14 rounded-2xl border-[3px] border-ink px-4 font-display text-xl transition',
                selected
                  ? 'translate-y-0.5 bg-cyan text-on-bright shadow-[0_2px_0_var(--color-ink)]'
                  : 'bg-night-600 text-fg shadow-[0_5px_0_var(--color-ink)] hover:-translate-y-0.5',
                readOnly && !selected && 'opacity-40',
                readOnly && 'cursor-default hover:translate-y-0',
              )}
            >
              {format(opt)}
            </button>
          );
        })}
      </div>
    </div>
  );
}
