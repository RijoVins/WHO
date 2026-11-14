import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, ServerToClientEvents } from '@ib/shared';

export type GameSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

/** How long to wait for the server before calling it a connection failure. */
const CONNECT_TIMEOUT_MS = 7000;
const ACK_TIMEOUT_MS = 8000;

export const CONNECTION_ERROR = "Can't reach the game server. Check your internet connection and try again.";

/** One shared connection to the game server (same origin; Vite proxies it in development). */
export const socket: GameSocket = io({
  autoConnect: false,
  transports: ['websocket', 'polling'],
  reconnectionDelay: 500,
  reconnectionDelayMax: 4000,
});

/** Connect if needed and wait until connected, or fail after a timeout. */
export function ensureConnected(): Promise<boolean> {
  if (socket.connected) return Promise.resolve(true);
  return new Promise((resolve) => {
    const done = (ok: boolean) => {
      clearTimeout(timer);
      socket.off('connect', onConnect);
      resolve(ok);
    };
    const onConnect = () => done(true);
    const timer = setTimeout(() => done(false), CONNECT_TIMEOUT_MS);
    socket.on('connect', onConnect);
    socket.connect();
  });
}

type AckOf<E extends keyof ClientToServerEvents> = Parameters<ClientToServerEvents[E]> extends [...unknown[], (r: infer R) => void] ? R : never;
type PayloadOf<E extends keyof ClientToServerEvents> = Parameters<ClientToServerEvents[E]> extends [infer P, (r: never) => void] ? [P] : [];

/** Emit and wait for the server's answer. Network problems become a normal error result. */
export async function request<E extends keyof ClientToServerEvents>(event: E, ...payload: PayloadOf<E>): Promise<AckOf<E>> {
  const failed = { ok: false, code: 'SERVER_BUSY', error: CONNECTION_ERROR } as Ack as AckOf<E>;
  if (!(await ensureConnected())) return failed;
  try {
    // Call as a method: emitWithAck needs `this` bound to the socket.
    const timed = socket.timeout(ACK_TIMEOUT_MS) as unknown as { emitWithAck: (ev: string, ...args: unknown[]) => Promise<unknown> };
    return (await timed.emitWithAck(event, ...payload)) as AckOf<E>;
  } catch {
    return failed;
  }
}
