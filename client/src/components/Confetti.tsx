/** Lightweight CSS confetti for the winner screen. Hidden from assistive tech. */
const COLORS = ['#ffc83d', '#ff3d8b', '#2ee6ff', '#9bea2e', '#8b3dff', '#ff7a1a'];

export function Confetti({ count = 40 }: { count?: number }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {Array.from({ length: count }, (_, i) => {
        const left = (i * 37) % 100;
        const delay = -((i * 0.73) % 3.2);
        const duration = 2.6 + ((i * 0.41) % 1.8);
        const size = 8 + (i % 4) * 3;
        return (
          <span
            key={i}
            className="absolute top-0 animate-confetti rounded-sm border-2 border-ink"
            style={{
              left: `${left}%`,
              width: size,
              height: size * (i % 2 ? 1.6 : 1),
              background: COLORS[i % COLORS.length],
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
            }}
          />
        );
      })}
    </div>
  );
}
