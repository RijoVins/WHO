import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RECONNECT_GRACE_SECONDS } from '@ib/shared';
import type { VoiceConfig } from './livekit/voice.ts';
import { toHttpUrl } from './livekit/voice.ts';

/** Load the project's .env file if there is one (real environment variables win). */
export function loadDotEnv(): void {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env');
  try {
    const before = { ...process.env };
    process.loadEnvFile(file);
    for (const [k, v] of Object.entries(before)) process.env[k] = v;
  } catch {
    /* no .env: fine */
  }
}

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
  /** LiveKit settings, or null when voice chat is switched off. */
  voice: VoiceConfig | null;
}

/**
 * Local development: LiveKit's built-in dev keys (`livekit-server --dev`). The browser
 * reaches it through the Vite dev server at /livekit, so phones and tunnels work too.
 * Never used in production.
 */
const DEV_LIVEKIT = { url: '/livekit', apiUrl: 'http://localhost:7880', apiKey: 'devkey', apiSecret: 'secret' };

function loadVoice(production: boolean): VoiceConfig | null {
  const url = process.env.LIVEKIT_URL?.trim();
  if (url === 'off') return null;
  const apiKey = process.env.LIVEKIT_API_KEY?.trim();
  const apiSecret = process.env.LIVEKIT_API_SECRET?.trim();
  if (url && apiKey && apiSecret) {
    const apiUrl = process.env.LIVEKIT_API_URL?.trim() || (url.startsWith('/') ? '' : toHttpUrl(url));
    if (!apiUrl) throw new Error('LIVEKIT_URL is a path, so also set LIVEKIT_API_URL (e.g. http://localhost:7880).');
    return { url, apiKey, apiSecret, apiUrl };
  }
  if (url || apiKey || apiSecret) {
    throw new Error('Set all three of LIVEKIT_URL, LIVEKIT_API_KEY and LIVEKIT_API_SECRET (or none of them).');
  }
  // Nothing configured: local dev talks to `npm run voice:dev`; production has no voice until configured.
  return production ? null : { ...DEV_LIVEKIT };
}

export function loadConfig(): ServerConfig {
  const production = process.env.NODE_ENV === 'production';
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
    production,
    voice: loadVoice(production),
  };
}
