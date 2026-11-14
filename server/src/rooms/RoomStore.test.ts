import { afterEach, describe, expect, it, vi } from 'vitest';
import { MAX_PLAYERS } from '@ib/shared';
import { RoomStore } from './RoomStore.ts';

let store: RoomStore;
afterEach(() => store?.dispose());

function make(graceMs = 1000) {
  store = new RoomStore({ maxRooms: 100, graceMs });
  return store;
}

describe('RoomStore', () => {
  it('creates rooms with unique 6-character codes and makes the creator host', () => {
    const s = make();
    const codes = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const r = s.createRoom(`P${i}`, 'celebrity');
      if (!r.ok) throw new Error(r.error);
      expect(r.value.room.code).toMatch(/^[A-Z2-9]{6}$/);
      expect(r.value.room.hostId).toBe(r.value.player.id);
      codes.add(r.value.room.code);
    }
    expect(codes.size).toBe(100);
    expect(s.createRoom('Too many', 'friends')).toMatchObject({ ok: false, code: 'SERVER_BUSY' });
  });

  it('enforces the 60-player limit and unique names', () => {
    const s = make();
    const c = s.createRoom('Host', 'friends');
    if (!c.ok) throw new Error();
    const code = c.value.room.code;
    expect(s.joinRoom(code, 'host')).toMatchObject({ ok: false, code: 'NAME_TAKEN' });
    for (let i = 1; i < MAX_PLAYERS; i++) expect(s.joinRoom(code, `Player ${i}`).ok).toBe(true);
    expect(s.get(code)!.players.size).toBe(60);
    expect(s.joinRoom(code, 'Player 61')).toMatchObject({ ok: false, code: 'ROOM_FULL' });
  });

  it('never puts tokens or socket ids in the public snapshot', () => {
    const s = make();
    const c = s.createRoom('Host', 'friends');
    if (!c.ok) throw new Error();
    const json = JSON.stringify(s.toPublic(c.value.room));
    expect(json).not.toContain(c.value.player.token);
    expect(json).not.toContain('token');
    expect(json).not.toContain('socket');
  });

  it('frees a disconnected seat after the grace period and hands host to the next player', () => {
    vi.useFakeTimers();
    try {
      const s = make(1000);
      const c = s.createRoom('Host', 'celebrity');
      if (!c.ok) throw new Error();
      const { room, player: host } = c.value;
      s.attach(room, host, 'sock-host');
      const j = s.joinRoom(room.code, 'Bea');
      if (!j.ok) throw new Error();
      s.attach(room, j.value.player, 'sock-bea');

      s.markDisconnected(room.code, host.id, 'sock-host');
      expect(room.players.get(host.id)!.connected).toBe(false);
      expect(room.hostId).toBe(host.id); // still host during the grace period

      vi.advanceTimersByTime(1001);
      expect(room.players.has(host.id)).toBe(false);
      expect(room.hostId).toBe(j.value.player.id);
    } finally {
      vi.useRealTimers();
    }
  });

  it('keeps the seat if the player comes back in time', () => {
    vi.useFakeTimers();
    try {
      const s = make(1000);
      const c = s.createRoom('Host', 'celebrity');
      if (!c.ok) throw new Error();
      const { room, player } = c.value;
      s.attach(room, player, 'a');
      s.markDisconnected(room.code, player.id, 'a');
      vi.advanceTimersByTime(500);
      expect(s.attach(room, player, 'b').wasDisconnected).toBe(true);
      vi.advanceTimersByTime(2000);
      expect(room.players.get(player.id)?.connected).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it('ignores a stale disconnect from a socket that was already replaced', () => {
    const s = make();
    const c = s.createRoom('Host', 'celebrity');
    if (!c.ok) throw new Error();
    const { room, player } = c.value;
    s.attach(room, player, 'old');
    s.attach(room, player, 'new');
    expect(s.markDisconnected(room.code, player.id, 'old')).toBeNull();
    expect(player.connected).toBe(true);
  });

  it('closes the room when the last player leaves', () => {
    const s = make();
    const c = s.createRoom('Host', 'celebrity');
    if (!c.ok) throw new Error();
    const closed = vi.fn();
    s.on('closed', closed);
    s.removePlayer(c.value.room.code, c.value.player.id);
    expect(s.get(c.value.room.code)).toBeUndefined();
    expect(closed).toHaveBeenCalledWith(c.value.room.code);
  });
});
