import { cn } from '../utils/cn';
import { characterTraits } from '../utils/character';

interface CharacterProps {
  id: string;
  /** Pixel size. */
  size?: number;
  dimmed?: boolean;
  className?: string;
}

const INK = 'var(--color-ink)';

/**
 * A cartoon face generated from the player id. The same id always gives the same
 * character, so players are easy to recognise across screens.
 */
export function Character({ id, size = 44, dimmed, className }: CharacterProps) {
  const t = characterTraits(id);
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      aria-hidden
      className={cn('shrink-0 overflow-visible', dimmed && 'opacity-40 grayscale', className)}
    >
      {/* Accessories drawn behind the head */}
      {t.accessory === 'headphones' ? (
        <path d="M14 56a36 36 0 0 1 72 0" fill="none" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      ) : null}

      {/* Head */}
      <ellipse cx="50" cy="58" rx="38" ry="36" fill={t.color} stroke={INK} strokeWidth="5" />
      <ellipse cx="38" cy="38" rx="12" ry="7" fill="#fff" opacity="0.28" transform="rotate(-25 38 38)" />

      {/* Cheeks */}
      <ellipse cx="25" cy="68" rx="7" ry="4.5" fill="#ff6b9a" opacity="0.55" />
      <ellipse cx="75" cy="68" rx="7" ry="4.5" fill="#ff6b9a" opacity="0.55" />

      {/* Eyes (blink together) */}
      <g className="animate-blink" style={{ transformBox: 'fill-box', transformOrigin: 'center', animationDelay: `${t.blinkDelay}s` }}>
        {t.eyes === 'round' ? (
          <>
            <circle cx="36" cy="52" r="9" fill="#fff" stroke={INK} strokeWidth="3.5" />
            <circle cx="64" cy="52" r="9" fill="#fff" stroke={INK} strokeWidth="3.5" />
            <circle cx="38" cy="53" r="4.5" fill={INK} />
            <circle cx="66" cy="53" r="4.5" fill={INK} />
          </>
        ) : t.eyes === 'happy' ? (
          <>
            <path d="M28 54q8-10 16 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
            <path d="M56 54q8-10 16 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
          </>
        ) : t.eyes === 'dots' ? (
          <>
            <circle cx="37" cy="52" r="5.5" fill={INK} />
            <circle cx="63" cy="52" r="5.5" fill={INK} />
          </>
        ) : (
          <>
            <ellipse cx="35" cy="51" rx="9" ry="11" fill="#fff" stroke={INK} strokeWidth="3.5" />
            <ellipse cx="65" cy="52" rx="7" ry="8" fill="#fff" stroke={INK} strokeWidth="3.5" />
            <circle cx="37" cy="49" r="3.5" fill={INK} />
            <circle cx="63" cy="54" r="3" fill={INK} />
          </>
        )}
      </g>

      {/* Mouth */}
      {t.mouth === 'smile' ? (
        <path d="M38 72q12 11 24 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      ) : t.mouth === 'open' ? (
        <>
          <path d="M36 70h28q-2 16-14 16t-14-16z" fill={INK} />
          <path d="M43 80q7-5 14 0q-2 5-7 5t-7-5z" fill="#ff6b8a" />
        </>
      ) : t.mouth === 'grin' ? (
        <>
          <path d="M34 69h32q-3 13-16 13t-16-13z" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M42 69v9M50 69v12M58 69v9" stroke={INK} strokeWidth="2.5" />
        </>
      ) : (
        <ellipse cx="50" cy="76" rx="6" ry="7" fill={INK} />
      )}

      {/* Accessories drawn on top */}
      {t.accessory === 'partyhat' ? (
        <>
          <path d="M50 2L34 30h32z" fill={t.accent} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <path d="M44 14h12M40 22h20" stroke="#fff" strokeWidth="3" opacity="0.7" />
          <circle cx="50" cy="4" r="5" fill="#fff" stroke={INK} strokeWidth="3" />
        </>
      ) : null}
      {t.accessory === 'shades' ? (
        <>
          <path d="M22 46h56" stroke={INK} strokeWidth="4" />
          <rect x="24" y="44" width="22" height="15" rx="6" fill={INK} />
          <rect x="54" y="44" width="22" height="15" rx="6" fill={INK} />
          <path d="M28 48l6 0M58 48l6 0" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
        </>
      ) : null}
      {t.accessory === 'mustache' ? (
        <path
          d="M50 66c-6-6-16-6-22 2 6 0 10 4 22 0 12 4 16 0 22 0-6-8-16-8-22-2z"
          fill={INK}
        />
      ) : null}
      {t.accessory === 'bow' ? (
        <>
          <path d="M50 22l-18-10v20zM50 22l18-10v20z" fill={t.accent} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <circle cx="50" cy="22" r="5" fill={t.accent} stroke={INK} strokeWidth="4" />
        </>
      ) : null}
      {t.accessory === 'headphones' ? (
        <>
          <rect x="4" y="48" width="16" height="24" rx="7" fill={t.accent} stroke={INK} strokeWidth="4" />
          <rect x="80" y="48" width="16" height="24" rx="7" fill={t.accent} stroke={INK} strokeWidth="4" />
        </>
      ) : null}
      {t.accessory === 'beanie' ? (
        <>
          <path d="M16 38a34 30 0 0 1 68 0z" fill={t.accent} stroke={INK} strokeWidth="4" strokeLinejoin="round" />
          <rect x="13" y="32" width="74" height="10" rx="5" fill={t.accent} stroke={INK} strokeWidth="4" />
          <circle cx="50" cy="8" r="6" fill="#fff" stroke={INK} strokeWidth="3.5" />
        </>
      ) : null}
    </svg>
  );
}
