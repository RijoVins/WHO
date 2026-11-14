/** Illustrations for the two modes. Pure SVG so they stay crisp and light. */

const INK = 'var(--color-ink)';

/** Celebrity Mode: a superstar (literally) in shades, under two spotlights. */
export function CelebrityArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden>
      {/* spotlights */}
      <path d="M18 0L70 0 112 150 70 150z" fill="#ffe9a0" opacity="0.22" />
      <path d="M130 0L182 0 130 150 88 150z" fill="#ffe9a0" opacity="0.22" />
      <ellipse cx="100" cy="146" rx="62" ry="10" fill="#000" opacity="0.25" />
      {/* sparkles */}
      <g fill="#fff" className="animate-pulse">
        <path d="M30 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path d="M170 60l2.4 6 6 2.4-6 2.4-2.4 6-2.4-6-6-2.4 6-2.4z" />
        <path d="M160 18l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" />
      </g>
      {/* the star */}
      <g className="origin-bottom animate-bob">
        <path
          d="M100 22l17 34 37 5-27 26 7 37-34-18-34 18 7-37-27-26 37-5z"
          fill="var(--color-gold)"
          stroke={INK}
          strokeWidth="6"
          strokeLinejoin="round"
        />
        {/* shades */}
        <path d="M74 74h52" stroke={INK} strokeWidth="5" />
        <rect x="76" y="70" width="21" height="14" rx="5" fill={INK} />
        <rect x="103" y="70" width="21" height="14" rx="5" fill={INK} />
        <path d="M80 74h6M107 74h6" stroke="#fff" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
        {/* grin */}
        <path d="M88 94q12 10 24 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        {/* mic in hand */}
        <g transform="rotate(-25 150 104)">
          <rect x="143" y="84" width="14" height="22" rx="7" fill="#e8e8f0" stroke={INK} strokeWidth="4.5" />
          <path d="M150 106v20" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        </g>
        <path d="M128 104q12 4 18 -2" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
      </g>
    </svg>
  );
}

/** Friends Mode: one buddy doing a (bad) impression of the other. */
export function FriendsArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 160" className={className} aria-hidden>
      <ellipse cx="100" cy="148" rx="80" ry="9" fill="#000" opacity="0.25" />
      {/* Buddy 1: the original */}
      <g className="animate-bob" style={{ animationDelay: '-1.2s' }}>
        <ellipse cx="62" cy="104" rx="38" ry="40" fill="#7ee0c3" stroke={INK} strokeWidth="6" />
        <circle cx="50" cy="96" r="8" fill="#fff" stroke={INK} strokeWidth="4" />
        <circle cx="74" cy="96" r="8" fill="#fff" stroke={INK} strokeWidth="4" />
        <circle cx="52" cy="97" r="3.8" fill={INK} />
        <circle cx="72" cy="97" r="3.8" fill={INK} />
        <ellipse cx="62" cy="118" rx="6" ry="7" fill={INK} />
        <path d="M40 62q22-14 44 0" fill="none" stroke={INK} strokeWidth="6" strokeLinecap="round" />
      </g>
      {/* Buddy 2: the impersonator with a fake mustache + wig */}
      <g className="animate-bob">
        <ellipse cx="140" cy="100" rx="40" ry="42" fill="#ffb84d" stroke={INK} strokeWidth="6" />
        <path d="M100 82c4-30 76-30 80 0-12-10-22-4-30-12-6 8-20 2-26 10-8-6-16-4-24 2z" fill="#ff3d8b" stroke={INK} strokeWidth="5" strokeLinejoin="round" />
        <path d="M122 96q8-9 16 0M144 96q8-9 16 0" fill="none" stroke={INK} strokeWidth="5" strokeLinecap="round" />
        <path d="M140 112c-7-7-18-7-24 2 7 0 11 4 24 0 13 4 17 0 24 0-6-9-17-9-24-2z" fill={INK} />
        <path d="M128 122q12 12 24 0" fill="#fff" stroke={INK} strokeWidth="4" strokeLinejoin="round" />
      </g>
      {/* speech bubble */}
      <g className="animate-wiggle" style={{ transformOrigin: '150px 30px' }}>
        <path d="M118 6h72a8 8 0 0 1 8 8v22a8 8 0 0 1-8 8h-40l-12 12v-12h-20a8 8 0 0 1-8-8V14a8 8 0 0 1 8-8z" fill="#fff" stroke={INK} strokeWidth="4.5" strokeLinejoin="round" />
        <text x="154" y="32" textAnchor="middle" fontFamily="Lilita One, sans-serif" fontSize="17" fill={INK}>
          BLAH!
        </text>
      </g>
    </svg>
  );
}
