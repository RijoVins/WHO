import { cn } from '../utils/cn';

/** The IMPERSONATION BATTLE logo: outlined cartoon lettering with a mic badge. */
export function GameTitle({ size = 'hero' }: { size?: 'hero' | 'compact' }) {
  const hero = size === 'hero';
  return (
    <div
      role="img"
      aria-label="Impersonation Battle"
      className={cn('relative inline-flex select-none flex-col items-center leading-none', hero ? 'gap-0' : 'gap-0')}
    >
      <span
        className={cn(
          'font-title text-fg text-outline',
          hero ? 'text-[clamp(1.9rem,8.5vw,4.6rem)] tracking-[0.04em]' : 'text-lg tracking-[0.05em]',
        )}
        style={{ textShadow: hero ? '0 6px 0 var(--color-ink)' : '0 3px 0 var(--color-ink)' }}
      >
        IMPERSONATION
      </span>
      <span className={cn('relative flex items-center', hero ? '-mt-1 gap-2 sm:gap-3' : '-mt-0.5 gap-1')}>
        <MicBadge hero={hero} />
        <span
          className={cn(
            'font-title text-gold text-outline',
            hero ? 'animate-wiggle text-[clamp(3.2rem,15vw,8rem)] tracking-[0.06em]' : 'text-[1.9rem] tracking-[0.06em]',
          )}
          style={{
            textShadow: hero
              ? '0 7px 0 var(--color-pink-deep), 0 12px 0 var(--color-ink)'
              : '0 3px 0 var(--color-pink-deep), 0 5px 0 var(--color-ink)',
          }}
        >
          BATTLE
        </span>
      </span>
    </div>
  );
}

function MicBadge({ hero }: { hero: boolean }) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden
      className={cn('shrink-0 -rotate-12', hero ? 'size-[clamp(2.6rem,10vw,5.2rem)] animate-bob' : 'size-7')}
    >
      <circle cx="32" cy="32" r="29" fill="var(--color-pink)" stroke="var(--color-ink)" strokeWidth="4" />
      <rect x="24" y="12" width="16" height="26" rx="8" fill="#fff" stroke="var(--color-ink)" strokeWidth="3.5" />
      <path d="M18 31a14 14 0 0 0 28 0" fill="none" stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 45v7M25 52h14" stroke="var(--color-ink)" strokeWidth="4" strokeLinecap="round" />
      <path d="M27 17v8" stroke="var(--color-pink)" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}
