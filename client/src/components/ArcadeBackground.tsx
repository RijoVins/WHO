import type { ReactNode } from 'react';

/**
 * Fixed, decorative game backdrop: a slowly turning sunburst, a halftone glow
 * and floating doodles. Transform-only animations keep it cheap on phones.
 */
export function ArcadeBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-night-900">
      {/* Sunburst */}
      <div className="absolute top-1/2 left-1/2 size-[220vmax] -translate-x-1/2 -translate-y-1/2 opacity-[0.07]">
        <div
          className="size-full animate-spin-slow"
          style={{ background: 'repeating-conic-gradient(from 0deg, #fff 0deg 7deg, transparent 7deg 18deg)' }}
        />
      </div>
      {/* Color glows */}
      <div className="absolute -top-[20vmax] -left-[15vmax] size-[60vmax] rounded-full bg-celeb/25 blur-[80px]" />
      <div className="absolute -right-[15vmax] -bottom-[25vmax] size-[60vmax] rounded-full bg-pink/20 blur-[80px]" />
      <div className="absolute top-[30%] right-[10%] size-[30vmax] rounded-full bg-cyan/10 blur-[90px]" />
      {/* Halftone dots, fading toward the center */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'radial-gradient(rgb(255 255 255 / 0.09) 1.4px, transparent 1.6px)',
          backgroundSize: '18px 18px',
          maskImage: 'radial-gradient(ellipse at center, transparent 30%, black 85%)',
          WebkitMaskImage: 'radial-gradient(ellipse at center, transparent 30%, black 85%)',
        }}
      />
      {/* Floating doodles */}
      <Doodle className="top-[8%] left-[6%] text-gold" delay={0}>
        <Star />
      </Doodle>
      <Doodle className="top-[14%] right-[8%] text-pink" delay={-3}>
        <Bubble />
      </Doodle>
      <Doodle className="top-[55%] left-[3%] text-cyan" delay={-6}>
        <Note />
      </Doodle>
      <Doodle className="right-[5%] bottom-[18%] text-lime" delay={-9}>
        <Bolt />
      </Doodle>
      <Doodle className="bottom-[6%] left-[22%] text-friend" delay={-4}>
        <MicDoodle />
      </Doodle>
      <Doodle className="top-[40%] right-[22%] hidden text-gold lg:block" delay={-11}>
        <Star />
      </Doodle>
      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgb(5_1_12/0.7))]" />
    </div>
  );
}

function Doodle({ className, delay, children }: { className: string; delay: number; children: ReactNode }) {
  return (
    <div className={`absolute size-10 animate-drift opacity-40 sm:size-14 ${className}`} style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}

const stroke = { stroke: 'var(--color-ink)', strokeWidth: 3, strokeLinejoin: 'round' as const };

function Star() {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <path d="M24 4l5.9 12.6 13.6 1.6-10 9.4 2.7 13.5L24 34.4l-12.2 6.7 2.7-13.5-10-9.4 13.6-1.6z" fill="currentColor" {...stroke} />
    </svg>
  );
}
function Bubble() {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <path d="M6 10h36a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-10 8v-8H6a4 4 0 0 1-4-4V14a4 4 0 0 1 4-4z" fill="currentColor" {...stroke} />
      <circle cx="15" cy="22" r="2.5" fill="var(--color-ink)" />
      <circle cx="24" cy="22" r="2.5" fill="var(--color-ink)" />
      <circle cx="33" cy="22" r="2.5" fill="var(--color-ink)" />
    </svg>
  );
}
function Note() {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <path d="M18 34V10l22-5v24" fill="none" {...stroke} stroke="currentColor" strokeWidth={5} />
      <ellipse cx="13" cy="35" rx="7" ry="5.5" fill="currentColor" {...stroke} />
      <ellipse cx="35" cy="30" rx="7" ry="5.5" fill="currentColor" {...stroke} />
    </svg>
  );
}
function Bolt() {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <path d="M27 3L9 27h13l-3 18 20-26H25z" fill="currentColor" {...stroke} />
    </svg>
  );
}
function MicDoodle() {
  return (
    <svg viewBox="0 0 48 48" className="size-full">
      <rect x="16" y="4" width="16" height="26" rx="8" fill="currentColor" {...stroke} />
      <path d="M10 22a14 14 0 0 0 28 0M24 36v8M16 44h16" fill="none" {...stroke} stroke="currentColor" strokeWidth={4} />
    </svg>
  );
}
