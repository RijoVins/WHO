/** Rotating light rays behind a reveal. Decorative. */
export function Rays({ color = '#ffc83d', className = '' }: { color?: string; className?: string }) {
  return (
    <span aria-hidden className={`pointer-events-none absolute top-1/2 left-1/2 -z-10 size-[160%] -translate-x-1/2 -translate-y-1/2 ${className}`}>
      <span
        className="block size-full animate-spin-slow rounded-full opacity-30 [animation-duration:24s]"
        style={{
          background: `repeating-conic-gradient(${color} 0deg 10deg, transparent 10deg 24deg)`,
          maskImage: 'radial-gradient(circle, black 20%, transparent 70%)',
          WebkitMaskImage: 'radial-gradient(circle, black 20%, transparent 70%)',
        }}
      />
    </span>
  );
}
