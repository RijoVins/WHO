/** Token bucket: `capacity` actions, refilled at `perSecond`. */
export class TokenBucket {
  private tokens: number;
  private last: number;
  private readonly capacity: number;
  private readonly perSecond: number;
  private readonly now: () => number;

  constructor(capacity: number, perSecond: number, now: () => number = Date.now) {
    this.capacity = capacity;
    this.perSecond = perSecond;
    this.now = now;
    this.tokens = capacity;
    this.last = now();
  }

  take(): boolean {
    const t = this.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((t - this.last) / 1000) * this.perSecond);
    this.last = t;
    if (this.tokens < 1) return false;
    this.tokens -= 1;
    return true;
  }
}

/** Per-key buckets (e.g. per IP), with idle keys swept so memory stays bounded. */
export class KeyedLimiter {
  private buckets = new Map<string, { bucket: TokenBucket; seen: number }>();
  private readonly capacity: number;
  private readonly perSecond: number;

  constructor(capacity: number, perSecond: number) {
    this.capacity = capacity;
    this.perSecond = perSecond;
  }

  take(key: string): boolean {
    const now = Date.now();
    let entry = this.buckets.get(key);
    if (!entry) {
      if (this.buckets.size > 10_000) this.sweep(now);
      entry = { bucket: new TokenBucket(this.capacity, this.perSecond), seen: now };
      this.buckets.set(key, entry);
    }
    entry.seen = now;
    return entry.bucket.take();
  }

  private sweep(now: number) {
    for (const [k, v] of this.buckets) if (now - v.seen > 10 * 60_000) this.buckets.delete(k);
  }
}
