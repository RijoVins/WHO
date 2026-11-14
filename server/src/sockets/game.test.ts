import { afterEach, describe, expect, it } from 'vitest';
import type { GuessResult, RoomState, SessionGrant } from '@ib/shared';
import { emit, makeRoom, must, startServer, until } from './testkit.ts';
import type { Client } from './testkit.ts';
import { CELEBRITIES } from '../prompts/celebrities.ts';

let kit: Awaited<ReturnType<typeof startServer>>;
afterEach(() => kit?.close());

/** The secret answer, read straight from server memory (tests only). */
function secret(code: string) {
  const t = kit.server.store.get(code)!.game!.round!.target;
  return t.kind === 'celebrity' ? { kind: 'celebrity' as const, id: t.celeb.id, name: t.celeb.displayName, image: t.celeb.image! } : { kind: 'friend' as const, id: t.playerId, name: t.name };
}

const guess = (c: Client, g: string) => emit<GuessResult>(c, 'submit_guess', { guess: g });

describe('game engine over Socket.IO', () => {
  it('Celebrity Mode: performer gets the secret privately; nobody else sees it until the reveal', async () => {
    kit = await startServer({ performMs: 3000, guessMs: 3000, resultsMs: 3000 });
    const { code, players, host } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity');
    must(await emit(host, 'start_game'));
    const r = await until(host, (s) => s.phase === 'performing');
    expect(r.round!.number).toBe(1);
    expect(r.round!.performerName).toBe(players.find((p) => p.id === r.round!.performerId)!.name);

    const s = secret(code);
    const celeb = CELEBRITIES.find((c) => c.id === s.id)!;
    expect(celeb.image).toBe(s.image);
    const performer = players.find((p) => p.id === r.round!.performerId)!;
    const others = players.filter((p) => p !== performer);

    await until(performer.c, () => performer.c.prompts.length > 0);
    expect(performer.c.prompts[0]).toMatchObject({ mode: 'celebrity', target: celeb.displayName, image: celeb.image, category: celeb.category });

    // Nothing any other player received so far mentions the answer or its photo.
    for (const o of others) {
      expect(o.c.prompts).toHaveLength(0);
      const all = JSON.stringify(o.c.received);
      expect(all).not.toContain(celeb.image!);
      for (const n of [celeb.name, celeb.displayName]) expect(all.toLowerCase()).not.toContain(n.toLowerCase());
    }

    // Everyone guesses right -> round ends early with the reveal (name + photo) for all.
    for (const o of others) expect(must(await guess(o.c, celeb.aliases[0])).correct).toBe(true);
    const res = await until(others[0].c, (x) => x.phase === 'round_results');
    expect(res.lastResult).toMatchObject({ answer: celeb.displayName, answerImage: celeb.image, everyoneGuessed: true, performerPoints: 100 });
  });

  it('enforces guess rules and scores each correct guess once, with the first-correct bonus', async () => {
    kit = await startServer({ performMs: 3000, guessMs: 3000, resultsMs: 5000 });
    const { code, players, host } = await makeRoom(kit, ['Sam', 'Bea', 'Cal', 'Dev'], 'celebrity');
    must(await emit(host, 'start_game'));
    const r = await until(host, (s) => s.phase === 'performing');
    const s = secret(code);
    const performer = players.find((p) => p.id === r.round!.performerId)!;
    const [a, b, c] = players.filter((p) => p !== performer);
    const wrong = s.id === 'dhanush' ? 'Karthi' : 'Dhanush';

    expect(await guess(performer.c, s.name)).toMatchObject({ ok: false, code: 'PERFORMER_CANNOT_GUESS' });
    expect(await guess(a.c, '   ')).toMatchObject({ ok: false, code: 'INVALID_INPUT' });
    expect(must(await guess(a.c, wrong))).toMatchObject({ correct: false, guess: { attempts: 1, remaining: 4 } });
    expect(await guess(a.c, wrong.toUpperCase())).toMatchObject({ ok: false, code: 'DUPLICATE_GUESS' });
    expect(must(await guess(b.c, s.name)).correct).toBe(true); // first
    expect(must(await guess(a.c, s.name)).correct).toBe(true); // second
    expect(await guess(a.c, s.name)).toMatchObject({ ok: false, code: 'ALREADY_CORRECT' });
    // c never answers -> not everyone guessed -> no performer bonus. Wait for the timers.
    const res = await until(host, (x) => x.phase === 'round_results', 8000);
    const pts = Object.fromEntries(res.lastResult!.awards.map((w) => [w.playerId, w.points]));
    expect(pts[b.id]).toBe(150);
    expect(pts[a.id]).toBe(100);
    expect(pts[c.id]).toBeUndefined();
    expect(res.lastResult!.performerPoints).toBe(0);
    const score = Object.fromEntries(res.players.map((p) => [p.id, p.score]));
    expect(score).toMatchObject({ [b.id]: 150, [a.id]: 100, [c.id]: 0, [performer.id]: 0 });
    expect(await guess(c.c, s.name)).toMatchObject({ ok: false, code: 'WRONG_PHASE' });
  }, 15_000);

  it('Friends Mode: target is another player, revealed only at the end; the target may guess themselves', async () => {
    kit = await startServer({ performMs: 3000, guessMs: 3000, resultsMs: 100 });
    const { code, players, host } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'friends', 3);
    must(await emit(host, 'start_game'));
    for (let round = 1; round <= 3; round++) {
      const r = await until(host, (x) => x.phase === 'performing' && x.round!.number === round);
      const s = secret(code);
      expect(s.kind).toBe('friend');
      expect(s.id).not.toBe(r.round!.performerId);
      const performer = players.find((p) => p.id === r.round!.performerId)!;
      await until(performer.c, () => performer.c.prompts.some((p) => p.roundNumber === round));
      expect(performer.c.prompts.at(-1)).toMatchObject({ mode: 'friends', target: s.name, targetPlayerId: s.id });
      for (const o of players.filter((p) => p !== performer)) {
        expect(o.c.prompts.filter((p) => p.roundNumber === round)).toHaveLength(0);
        expect(JSON.stringify(o.c.received.filter((e) => e.event !== 'room_updated' || (e.data as RoomState).phase !== 'round_results'))).not.toContain(`"answerPlayerId"`);
        // Including the imitated player guessing their own name.
        expect(must(await guess(o.c, players.find((p) => p.id === s.id)!.name.toLowerCase())).correct).toBe(true);
      }
      const res = await until(host, (x) => x.phase !== 'performing' || x.round!.number !== round);
      if (res.phase === 'round_results') expect(res.lastResult).toMatchObject({ answer: s.name, answerPlayerId: s.id });
    }
  }, 20_000);

  it('rotates performers fairly, runs every round, finishes, and restarts cleanly', async () => {
    kit = await startServer({ performMs: 80, guessMs: 80, resultsMs: 60 });
    const { code, players, host } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity', 3);
    const performers: string[] = [];
    host.on('room_updated', (r) => {
      if (r.phase === 'performing' && r.round && performers.length < r.round.number) performers.push(r.round.performerId);
    });
    must(await emit(host, 'start_game'));
    const fin = await until(host, (x) => x.phase === 'finished', 5000);
    expect(new Set(performers).size).toBe(3); // everyone performed exactly once in 3 rounds
    expect(fin.finalResult!.rankings).toHaveLength(3);
    expect(fin.finalResult!.winnerIds.length).toBeGreaterThan(0);

    const bea = players[1];
    expect(await emit(bea.c, 'play_again')).toMatchObject({ ok: false, code: 'NOT_HOST' });
    must(await emit(host, 'play_again'));
    const again = await until(host, (x) => x.phase === 'performing');
    expect(again.round!.number).toBe(1);
    expect(again.players).toHaveLength(3);
    expect(again.players.every((p) => p.score === 0)).toBe(true);

    await until(host, (x) => x.phase === 'finished', 5000);
    must(await emit(host, 'return_to_lobby'));
    const lobby = await until(host, (x) => x.phase === 'lobby');
    expect(lobby.players).toHaveLength(3);
    expect(lobby.round).toBeNull();
    expect(kit.server.store.get(code)!.game).toBeNull();
  }, 15_000);

  it('host-only round controls; guests cannot skip', async () => {
    kit = await startServer({ performMs: 50, guessMs: 50, resultsMs: 10_000 });
    const { players, host } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity', 3);
    must(await emit(host, 'start_game'));
    await until(host, (x) => x.phase === 'round_results');
    expect(await emit(players[1].c, 'next_round')).toMatchObject({ ok: false, code: 'NOT_HOST' });
    must(await emit(host, 'next_round'));
    const r = await until(host, (x) => x.phase === 'performing');
    expect(r.round!.number).toBe(2);
  });

  it('survives the performer disconnecting, and restores the prompt when they come back', async () => {
    kit = await startServer({ performMs: 5000, guessMs: 1500, resultsMs: 5000 });
    const { code, players, host } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity', 3);
    must(await emit(host, 'start_game'));
    const r = await until(host, (x) => x.phase === 'performing');
    const performer = players.find((p) => p.id === r.round!.performerId)!;
    const watcher = players.find((p) => p !== performer)!;

    // A reconnect mid-round gets the prompt back from the grant.
    performer.c.disconnect();
    const back = await kit.client();
    const g = must(await emit<SessionGrant>(back, 'resume_session', { code, token: performer.token }));
    // Performer dropped during their stage, so the room moved on to final guesses.
    expect(g.room.phase).toBe('guessing');
    expect(g.prompt?.target).toBe(secret(code).name);

    const res = await until(watcher.c, (x) => x.phase === 'round_results', 5000);
    expect(res.lastResult!.performerLeft).toBe(true);
    expect(res.lastResult!.performerName).toBe(performer.name);
  }, 15_000);

  it('ends the game safely when too few players remain', async () => {
    kit = await startServer({ performMs: 2000, guessMs: 2000, resultsMs: 50 }, { graceMs: 100 });
    const { players, host } = await makeRoom(kit, ['Sam', 'Bea', 'Cal'], 'celebrity', 5);
    must(await emit(host, 'start_game'));
    await until(host, (x) => x.phase === 'performing');
    players[1].c.disconnect();
    players[2].c.disconnect();
    const fin = await until(host, (x) => x.phase === 'finished', 6000);
    expect(fin.finalResult!.rankings.map((x) => x.name)).toContain('Sam');
  }, 10_000);
});
