import { afterEach, describe, expect, it } from 'vitest';
import { TokenVerifier } from 'livekit-server-sdk';
import type { SessionGrant, VoiceAccess } from '@ib/shared';
import { emit, makeRoom, must, startServer } from '../sockets/testkit.ts';
import { voiceRoomName } from './voice.ts';

const KEY = 'testkey';
const SECRET = 'test-secret-that-is-long-enough-for-hs256';
const voice = { url: 'wss://voice.example.test', apiUrl: 'http://127.0.0.1:9', apiKey: KEY, apiSecret: SECRET };

let kit: Awaited<ReturnType<typeof startServer>>;
afterEach(() => kit?.close());

describe('voice tokens', () => {
  it('only seated players get a token, scoped to their own room, identity and microphone', async () => {
    kit = await startServer({}, { voice });
    const outsider = await kit.client();
    expect(await emit(outsider, 'voice_token')).toMatchObject({ ok: false, code: 'NOT_IN_ROOM' });

    const { code, players } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity');
    const room = kit.server.store.get(code)!;
    const access = must(await emit<VoiceAccess>(players[1].c, 'voice_token'));
    expect(access.url).toBe(voice.url);
    expect(access.identity).toBe(players[1].id);
    expect(access.roomName).toBe(voiceRoomName(code, room.createdAt));
    expect(JSON.stringify(access)).not.toContain(SECRET);

    const claims = await new TokenVerifier(KEY, SECRET).verify(access.token);
    expect(claims.sub).toBe(players[1].id);
    expect(claims.name).toBe('Bea');
    expect(claims.video).toMatchObject({
      room: access.roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: false,
      canPublishSources: ['microphone'],
    });
    // A token signed with another secret is rejected.
    await expect(new TokenVerifier(KEY, 'some-other-secret-value-xxxxxxxxxxxx').verify(access.token)).rejects.toThrow();
  });

  it('different game rooms get different voice rooms; a player cannot ask for another room', async () => {
    kit = await startServer({}, { voice });
    const a = await makeRoom(kit, ['A1', 'A2', 'A3'], 'celebrity');
    const b = await makeRoom(kit, ['B1', 'B2', 'B3'], 'friends');
    const ta = must(await emit<VoiceAccess>(a.players[0].c, 'voice_token'));
    // The event takes no room argument: anything sent is ignored, the seat decides.
    const tb = must(await emit<VoiceAccess>(b.players[0].c, 'voice_token', { code: a.code }));
    expect(ta.roomName).not.toBe(tb.roomName);
    expect(tb.roomName).toContain(b.code);
  });

  it('a player who left can no longer get a token; a reconnected player can', async () => {
    kit = await startServer({}, { voice });
    const { code, players } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity');
    must(await emit(players[2].c, 'leave_room'));
    expect(await emit(players[2].c, 'voice_token')).toMatchObject({ ok: false, code: 'NOT_IN_ROOM' });

    players[1].c.disconnect();
    const back = await kit.client();
    must(await emit<SessionGrant>(back, 'resume_session', { code, token: players[1].token }));
    const access = must(await emit<VoiceAccess>(back, 'voice_token'));
    expect(access.identity).toBe(players[1].id); // same identity: LiveKit replaces, never duplicates
  });

  it('reports voice as unavailable when LiveKit is not configured', async () => {
    kit = await startServer({});
    const { players } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity');
    expect(await emit(players[0].c, 'voice_token')).toMatchObject({ ok: false, code: 'VOICE_UNAVAILABLE' });
  });
});
