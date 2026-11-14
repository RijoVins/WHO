import { cn } from '../utils/cn';

interface OptionChipsProps<T extends string | number> {
  label: string;
  options: readonly T[];
  value: T;
  onChange?: (value: T) => void;
  format?: (value: T) => string;
}

/** Single-choice chips. Read-only when onChange is missing (e.g. for non-hosts). */
export function OptionChips<T extends string | number>({ label, options, value, onChange, format = String }: OptionChipsProps<T>) {
  const readOnly = !onChange;
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-sm font-bold text-fg-muted">{label}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={label}>
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
                'min-h-11 min-w-14 rounded-full border-2 px-4 font-bold transition',
                selected ? 'border-teal bg-teal text-on-bright' : 'border-line text-fg hover:bg-glass-strong',
                readOnly && !selected && 'opacity-45',
                readOnly && 'cursor-default',
              )}
            >
              {format(opt)}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
