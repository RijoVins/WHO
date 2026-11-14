import { useEffect, useState } from 'react';

/**
 * Whole seconds left until `endsAt` (server epoch ms), or null when there's no deadline.
 * `serverOffsetMs` is serverNow − clientNow, so every device shows the same time.
 * Display only: the server decides when a stage ends.
 */
export function useCountdown(endsAt: number | null, serverOffsetMs = 0): number | null {
  const compute = () =>
    endsAt === null ? null : Math.max(0, Math.ceil((endsAt - (Date.now() + serverOffsetMs)) / 1000));
  const [left, setLeft] = useState(compute);

  useEffect(() => {
    setLeft(compute());
    if (endsAt === null) return;
    const id = window.setInterval(() => setLeft(compute()), 250);
    return () => window.clearInterval(id);
    // compute only depends on these two values
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endsAt, serverOffsetMs]);

  return left;
}
