import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type { Ack, GameMode, MyGuessState, PrivatePrompt, RoomState, SessionGrant } from '@ib/shared';
import { request, socket } from '../services/socket';
import { clearSession, loadSession, saveSession } from '../services/session';
import { GameContext } from './game';
import type { ConnectionStatus, GameSession } from './game';
import type { ActionResult } from '../types/actions';

const toResult = (r: Ack): ActionResult => (r.ok ? { ok: true } : { ok: false, error: r.error, code: r.code });

/**
 * Owns the live connection and this tab's seat. The server is the source of
 * truth: room state here is only ever replaced by what the server sends.
 */
export function GameProvider({ children }: { children: ReactNode }) {
  const [connection, setConnection] = useState<ConnectionStatus>(() => (loadSession() ? 'connecting' : 'idle'));
  const [room, setRoom] = useState<RoomState | null>(null);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [pendingCode, setPendingCode] = useState<string | null>(() => loadSession()?.code ?? null);
  const [ended, setEnded] = useState<string | null>(null);
  // Round-scoped secrets and guess state, tagged with the round they belong to.
  const [prompt, setPrompt] = useState<PrivatePrompt | null>(null);
  const [guessState, setGuessState] = useState<{ round: number; state: MyGuessState } | null>(null);
  const [serverOffsetMs, setServerOffsetMs] = useState(0);
  const resuming = useRef(false);

  const adopt = useCallback((g: SessionGrant) => {
    saveSession({ code: g.room.code, playerId: g.playerId, token: g.token });
    setSelfId(g.playerId);
    setRoom(g.room);
    setServerOffsetMs(g.serverNow - Date.now());
    setPrompt(g.prompt);
    setGuessState(g.myGuess && g.room.round ? { round: g.room.round.number, state: g.myGuess } : null);
    setPendingCode(null);
    setEnded(null);
  }, []);

  const forget = useCallback((reason: string | null) => {
    clearSession();
    setRoom(null);
    setSelfId(null);
    setPrompt(null);
    setGuessState(null);
    setPendingCode(null);
    setEnded(reason);
  }, []);

  /** Reclaim the stored seat (page load, or after the connection comes back). */
  const resume = useCallback(async () => {
    const s = loadSession();
    if (!s || resuming.current) return;
    resuming.current = true;
    try {
      const r = await request('resume_session', { code: s.code, token: s.token });
      if (r.ok) adopt(r);
      else if (r.code === 'SESSION_EXPIRED' || r.code === 'INVALID_INPUT') {
        forget('Your seat in that room has expired. Join again with the room code.');
      }
      // Network failures keep the session; the socket keeps retrying and resume runs again on connect.
    } finally {
      resuming.current = false;
    }
  }, [adopt, forget]);

  useEffect(() => {
    const onConnect = () => {
      setConnection('connected');
      void resume();
    };
    const onDisconnect = () => setConnection(loadSession() ? 'reconnecting' : 'idle');
    const onConnectError = () => setConnection((c) => (c === 'connected' || c === 'reconnecting' ? 'reconnecting' : 'connecting'));
    const onRoom = (r: RoomState) => {
      setRoom((cur) => (cur && cur.code !== r.code ? cur : r));
      setServerOffsetMs(r.serverNow - Date.now());
    };
    const onPrompt = (p: PrivatePrompt) => setPrompt(p);
    const onEnded = ({ reason }: { reason: 'replaced' | 'removed' | 'room_closed' }) => {
      forget(
        reason === 'replaced'
          ? 'You opened this game in another tab or window, so this one was disconnected.'
          : 'You were removed from the room because you were away too long.',
      );
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    socket.on('room_updated', onRoom);
    socket.on('session_ended', onEnded);
    socket.on('private_prompt', onPrompt);
    // Returning to a tab that holds a seat: reconnect straight away.
    if (loadSession() && !socket.connected) socket.connect();
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      socket.off('room_updated', onRoom);
      socket.off('session_ended', onEnded);
      socket.off('private_prompt', onPrompt);
    };
  }, [resume, forget]);

  // A secret or guess state from an earlier round is never shown in a later one.
  const roundNo = room?.round?.number ?? null;
  const livePrompt = prompt && roundNo === prompt.roundNumber ? prompt : null;
  const liveGuess = guessState && roundNo === guessState.round ? guessState.state : null;

  const value = useMemo<GameSession>(
    () => ({
      connection,
      room,
      selfId,
      pendingCode,
      ended,
      prompt: livePrompt,
      myGuess: liveGuess,
      serverOffsetMs,
      async createRoom(name: string, mode: GameMode) {
        const r = await request('create_room', { name, mode });
        if (!r.ok) return { ok: false, error: r.error };
        adopt(r);
        return { ok: true, code: r.room.code };
      },
      async joinRoom(name: string, code: string) {
        const r = await request('join_room', { name, code });
        if (!r.ok) return { ok: false, error: r.error };
        adopt(r);
        return { ok: true, code: r.room.code };
      },
      async leaveRoom() {
        if (socket.connected) await request('leave_room');
        forget(null);
        socket.disconnect();
        setConnection('idle');
      },
      selectMode: async (mode: GameMode) => toResult(await request('select_mode', { mode })),
      setRounds: async (totalRounds: number) => toResult(await request('update_settings', { totalRounds })),
      startGame: async () => toResult(await request('start_game')),
      async submitGuess(guess: string) {
        const round = room?.round?.number;
        const r = await request('submit_guess', { guess });
        if (!r.ok) return { ok: false, error: r.error, code: r.code };
        if (round !== undefined) setGuessState({ round, state: { ...r.guess, lastGuess: guess } });
        return { ok: true, correct: r.correct };
      },
      nextRound: async () => toResult(await request('next_round')),
      playAgain: async () => toResult(await request('play_again')),
      returnToLobby: async () => toResult(await request('return_to_lobby')),
      dismissEnded: () => setEnded(null),
    }),
    [connection, room, selfId, pendingCode, ended, livePrompt, liveGuess, serverOffsetMs, adopt, forget],
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}
