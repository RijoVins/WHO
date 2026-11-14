/** Helpers for socket-level tests: a real server and real Socket.IO clients. */
import { io as connect } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, GameMode, PrivatePrompt, RoomState, ServerToClientEvents, SessionGrant } from '@ib/shared';
import { createGameServer } from '../app.ts';
import type { ServerConfig } from '../config.ts';
import type { Timings } from '../game/GameEngine.ts';

export type Client = Socket<ServerToClientEvents, ClientToServerEvents> & {
  /** Every payload this client received, in order (to prove secrets never leak). */
  received: { event: string; data: unknown }[];
  prompts: PrivatePrompt[];
  last: RoomState | null;
};

export async function startServer(timings: Partial<Timings>, extra: Partial<ServerConfig> = {}) {
  const server = createGameServer(
    {
      port: 0,
      host: '127.0.0.1',
      clientOrigins: [],
      trustProxy: false,
      maxRooms: 1000,
      graceMs: 400,
      roomCreateBurst: 1000,
      production: false,
      ...extra,
    },
    { timings },
  );
  const addr = await server.listen();
  const url = `http://127.0.0.1:${addr.port}`;
  const clients: Client[] = [];

  async function client(): Promise<Client> {
    const c = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false }) as Client;
    c.received = [];
    c.prompts = [];
    c.last = null;
    c.onAny((event, data) => c.received.push({ event, data }));
    c.on('room_updated', (r) => (c.last = r));
    c.on('private_prompt', (p) => c.prompts.push(p));
    clients.push(c);
    await new Promise<void>((res, rej) => {
      c.once('connect', () => res());
      c.once('connect_error', rej);
    });
    return c;
  }

  return {
    server,
    client,
    async close() {
      for (const c of clients) c.disconnect();
      await server.close();
    },
  };
}

export function emit<T extends object>(c: Client, event: string, ...args: unknown[]): Promise<Ack<T>> {
  return new Promise((res) => (c.emit as (...a: unknown[]) => void)(event, ...args, res));
}

export function must<T extends object>(r: Ack<T>): T {
  if (!r.ok) throw new Error(`${r.code}: ${r.error}`);
  return r;
}

export function until(c: Client, pred: (r: RoomState) => boolean, timeoutMs = 4000): Promise<RoomState> {
  if (c.last && pred(c.last)) return Promise.resolve(c.last);
  return new Promise((res, rej) => {
    const t = setTimeout(() => {
      c.off('room_updated', h);
      rej(new Error(`timed out; last phase=${c.last?.phase}`));
    }, timeoutMs);
    const h = (r: RoomState) => {
      if (pred(r)) {
        clearTimeout(t);
        c.off('room_updated', h);
        res(r);
      }
    };
    c.on('room_updated', h);
  });
}

/** Host + guests seated in one room, ready to start. */
export async function makeRoom(kit: Awaited<ReturnType<typeof startServer>>, names: string[], mode: GameMode, rounds = 3) {
  const host = await kit.client();
  const hg = must(await emit<SessionGrant>(host, 'create_room', { name: names[0], mode }));
  const code = hg.room.code;
  const players = [{ c: host, id: hg.playerId, token: hg.token, name: names[0] }];
  for (const n of names.slice(1)) {
    const c = await kit.client();
    const g = must(await emit<SessionGrant>(c, 'join_room', { name: n, code }));
    players.push({ c, id: g.playerId, token: g.token, name: n });
  }
  must(await emit(host, 'update_settings', { totalRounds: rounds }));
  await until(host, (r) => r.players.length === names.length && r.settings.totalRounds === rounds);
  return { code, players, host };
}
