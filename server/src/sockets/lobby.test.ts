import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { io as connect } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { Ack, ClientToServerEvents, RoomState, ServerToClientEvents, SessionGrant } from '@ib/shared';
import { createGameServer } from '../app.ts';

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;

let server: ReturnType<typeof createGameServer>;
let url = '';
const clients: Client[] = [];

const testConfig = {
  port: 0,
  host: '127.0.0.1',
  clientOrigins: [],
  trustProxy: false,
  maxRooms: 1000,
  graceMs: 400,
  // Every test client shares one IP; the per-IP limit has its own test below.
  roomCreateBurst: 1000,
  production: false,
};

beforeAll(async () => {
  server = createGameServer(testConfig);
  const addr = await server.listen();
  url = `http://127.0.0.1:${addr.port}`;
});
afterAll(() => server.close());
afterEach(() => {
  for (const c of clients.splice(0)) c.disconnect();
});

async function client(): Promise<Client> {
  const c: Client = connect(url, { transports: ['websocket'], forceNew: true, reconnection: false });
  clients.push(c);
  await new Promise<void>((res, rej) => {
    c.once('connect', () => res());
    c.once('connect_error', rej);
  });
  return c;
}

function emit<T extends object>(c: Client, event: string, ...args: unknown[]): Promise<Ack<T>> {
  return new Promise((res) => (c.emit as (...a: unknown[]) => void)(event, ...args, res));
}

function nextUpdate(c: Client, pred: (r: RoomState) => boolean = () => true): Promise<RoomState> {
  return new Promise((res) => {
    const h = (r: RoomState) => {
      if (pred(r)) {
        c.off('room_updated', h);
        res(r);
      }
    };
    c.on('room_updated', h);
  });
}

function must<T extends object>(r: Ack<T>): T {
  if (!r.ok) throw new Error(`${r.code}: ${r.error}`);
  return r;
}

async function hostRoom(name = 'Host', mode: 'celebrity' | 'friends' = 'celebrity') {
  const c = await client();
  const g = must(await emit<SessionGrant>(c, 'create_room', { name, mode }));
  return { c, g };
}

async function joiner(code: string, name: string) {
  const c = await client();
  const g = must(await emit<SessionGrant>(c, 'join_room', { name, code }));
  return { c, g };
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

describe('room lobby over Socket.IO', () => {
  it('creates a room and lets others join; everyone sees joins live', async () => {
    const host = await hostRoom('Sam', 'friends');
    expect(host.g.room.code).toMatch(/^[A-Z2-9]{6}$/);
    expect(host.g.room.hostId).toBe(host.g.playerId);
    expect(host.g.room.settings.mode).toBe('friends');

    const seen = nextUpdate(host.c, (r) => r.players.length === 2);
    const bea = await joiner(host.g.room.code.toLowerCase(), 'Bea');
    expect((await seen).players.map((p) => p.name)).toEqual(['Sam', 'Bea']);
    expect(bea.g.room.settings.mode).toBe('friends'); // joiner sees the host's mode
    expect(bea.g.playerId).not.toBe(host.g.playerId);
  });

  it('removes a player who leaves, for everyone, immediately', async () => {
    const host = await hostRoom();
    const bea = await joiner(host.g.room.code, 'Bea');
    const seen = nextUpdate(host.c, (r) => r.players.length === 1);
    must(await emit(bea.c, 'leave_room'));
    expect((await seen).players.map((p) => p.name)).toEqual(['Host']);
  });

  it('rejects bad and unknown codes, full rooms and taken names', async () => {
    const c = await client();
    expect(await emit(c, 'join_room', { name: 'A', code: 'NOPE' })).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
    expect(await emit(c, 'join_room', { name: 'A', code: 'ZZZZZZ' })).toMatchObject({ ok: false, code: 'ROOM_NOT_FOUND' });
    expect(await emit(c, 'join_room', { name: '   ', code: 'ZZZZZZ' })).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
    expect(await emit(c, 'join_room', 'garbage')).toMatchObject({ ok: false, code: 'INVALID_INPUT' });

    const host = await hostRoom('Taken');
    expect(await emit(c, 'join_room', { name: 'taken', code: host.g.room.code })).toMatchObject({ ok: false, code: 'NAME_TAKEN' });
  });

  it('enforces 60 players with real connections', async () => {
    const host = await hostRoom('P0');
    const code = host.g.room.code;
    const joins = await Promise.all(Array.from({ length: 59 }, (_, i) => client().then((c) => emit<SessionGrant>(c, 'join_room', { name: `P${i + 1}`, code }))));
    expect(joins.every((r) => r.ok)).toBe(true);
    const late = await client();
    expect(await emit(late, 'join_room', { name: 'P60', code })).toMatchObject({ ok: false, code: 'ROOM_FULL' });
    expect(server.store.get(code)!.players.size).toBe(60);
  }, 20_000);

  it('lets only the host change the mode and start; mode changes reach everyone', async () => {
    const host = await hostRoom('Host', 'celebrity');
    const bea = await joiner(host.g.room.code, 'Bea');
    expect(await emit(bea.c, 'select_mode', { mode: 'friends' })).toMatchObject({ ok: false, code: 'NOT_HOST' });
    expect(await emit(bea.c, 'start_game')).toMatchObject({ ok: false, code: 'NOT_HOST' });
    expect(await emit(bea.c, 'update_settings', { totalRounds: 10 })).toMatchObject({ ok: false, code: 'NOT_HOST' });

    const seen = nextUpdate(bea.c, (r) => r.settings.mode === 'friends');
    must(await emit(host.c, 'select_mode', { mode: 'friends' }));
    expect((await seen).settings.mode).toBe('friends');
    expect(await emit(host.c, 'select_mode', { mode: 'karaoke' })).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
    expect(await emit(host.c, 'update_settings', { totalRounds: 7 })).toMatchObject({ ok: false, code: 'INVALID_INPUT' });

    // Two players is not enough.
    expect(await emit(host.c, 'start_game')).toMatchObject({ ok: false, code: 'NOT_ENOUGH_PLAYERS' });
    await joiner(host.g.room.code, 'Cal');
    // All checks pass: the game starts and nobody can join any more.
    expect(await emit(host.c, 'start_game')).toEqual({ ok: true });
    expect(server.store.get(host.g.room.code)!.phase).toBe('performing');
    expect(await emit(await client(), 'join_room', { name: 'Late', code: host.g.room.code })).toMatchObject({ ok: false, code: 'GAME_IN_PROGRESS' });
  });

  it('keeps rooms isolated', async () => {
    const a = await hostRoom('A-host');
    const b = await hostRoom('B-host');
    let leaked = false;
    b.c.on('room_updated', (r) => {
      if (r.code === a.g.room.code) leaked = true;
    });
    await joiner(a.g.room.code, 'A-guest');
    await wait(100);
    expect(leaked).toBe(false);
    // Acting on room B while seated in room A is impossible: actions apply to your own seat only.
    must(await emit(a.c, 'select_mode', { mode: 'friends' }));
    expect(server.store.get(b.g.room.code)!.settings.mode).toBe('celebrity');
  });

  it('marks a dropped player as reconnecting, then restores them with their token', async () => {
    const host = await hostRoom();
    const bea = await joiner(host.g.room.code, 'Bea');
    const dropped = nextUpdate(host.c, (r) => r.players.some((p) => p.name === 'Bea' && !p.connected));
    bea.c.disconnect();
    await dropped;

    const back = await client();
    const restored = nextUpdate(host.c, (r) => r.players.some((p) => p.name === 'Bea' && p.connected));
    const g = must(await emit<SessionGrant>(back, 'resume_session', { code: host.g.room.code, token: bea.g.token }));
    expect(g.playerId).toBe(bea.g.playerId);
    expect((await restored).players.filter((p) => p.name === 'Bea')).toHaveLength(1);
  });

  it('frees the seat after the grace period and passes host on', async () => {
    const host = await hostRoom('Host');
    const bea = await joiner(host.g.room.code, 'Bea');
    const handedOver = nextUpdate(bea.c, (r) => r.hostId === bea.g.playerId);
    host.c.disconnect();
    const r = await handedOver;
    expect(r.players.map((p) => p.name)).toEqual(['Bea']);
    expect(await emit(await client(), 'resume_session', { code: host.g.room.code, token: host.g.token })).toMatchObject({
      ok: false,
      code: 'SESSION_EXPIRED',
    });
  });

  it('never creates a duplicate entry for the same player', async () => {
    const host = await hostRoom();
    // Same tab opened twice: the newest connection takes the seat, the old one is told.
    const second = await client();
    const ended = new Promise((res) => host.c.once('session_ended', res));
    must(await emit(second, 'resume_session', { code: host.g.room.code, token: host.g.token }));
    expect(await ended).toEqual({ reason: 'replaced' });
    expect(server.store.get(host.g.room.code)!.players.size).toBe(1);

    // Joining the same room twice on one connection returns the same seat.
    const bea = await joiner(host.g.room.code, 'Bea');
    const again = must(await emit<SessionGrant>(bea.c, 'join_room', { name: 'Bea 2', code: host.g.room.code }));
    expect(again.playerId).toBe(bea.g.playerId);
    expect(server.store.get(host.g.room.code)!.players.size).toBe(2);
  });

  it('rejects a forged or wrong-room token', async () => {
    const a = await hostRoom('A');
    const b = await hostRoom('B');
    const c = await client();
    expect(await emit(c, 'resume_session', { code: b.g.room.code, token: a.g.token })).toMatchObject({ ok: false, code: 'SESSION_EXPIRED' });
    expect(await emit(c, 'resume_session', { code: a.g.room.code, token: 'x'.repeat(32) })).toMatchObject({ ok: false, code: 'SESSION_EXPIRED' });
  });

  it('limits how many rooms one IP can create', async () => {
    const strict = createGameServer({ ...testConfig, roomCreateBurst: 3 });
    const addr = await strict.listen();
    const c: Client = connect(`http://127.0.0.1:${addr.port}`, { transports: ['websocket'], forceNew: true, reconnection: false });
    clients.push(c);
    await new Promise((r) => c.once('connect', () => r(null)));
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await emit(c, 'create_room', { name: `H${i}`, mode: 'celebrity' }));
    expect(results.slice(0, 3).every((r) => r.ok)).toBe(true);
    expect(results[3]).toMatchObject({ ok: false, code: 'RATE_LIMITED' });
    c.disconnect();
    await strict.close();
  });

  it('rate-limits floods', async () => {
    const c = await client();
    const results = await Promise.all(Array.from({ length: 40 }, () => emit(c, 'select_mode', { mode: 'friends' })));
    expect(results.some((r) => !r.ok && r.code === 'RATE_LIMITED')).toBe(true);
  });
});
