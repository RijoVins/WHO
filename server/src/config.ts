import { RECONNECT_GRACE_SECONDS } from '@ib/shared';

function int(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) throw new Error(`${name} must be a non-negative integer, got "${raw}"`);
  return n;
}

export interface ServerConfig {
  port: number;
  host: string;
  /** Extra browser origins allowed to connect (only needed when the client is hosted elsewhere). */
  clientOrigins: string[];
  /** Behind a reverse proxy, read the client IP from X-Forwarded-For. */
  trustProxy: boolean;
  maxRooms: number;
  graceMs: number;
  /** Rooms one IP may create in a burst (refills one every 6 seconds). */
  roomCreateBurst: number;
  production: boolean;
}

export function loadConfig(): ServerConfig {
  return {
    port: int('PORT', 3001),
    host: process.env.HOST || '0.0.0.0',
    clientOrigins: (process.env.CLIENT_ORIGIN ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    trustProxy: process.env.TRUST_PROXY === 'true',
    maxRooms: int('MAX_ROOMS', 2000),
    graceMs: int('RECONNECT_GRACE_SECONDS', RECONNECT_GRACE_SECONDS) * 1000,
    roomCreateBurst: int('ROOM_CREATE_BURST', 10),
    production: process.env.NODE_ENV === 'production',
  };
}
