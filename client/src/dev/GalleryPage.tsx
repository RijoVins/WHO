/**
 * Development-only screen gallery: renders every in-room page with sample data so
 * layouts can be reviewed at any width before the server exists. Not in production builds.
 */
import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { DEFAULT_ROUND_COUNT, MAX_GUESSES_PER_ROUND } from '@ib/shared';
import type { GameMode, MyGuessState, RoomPhase } from '@ib/shared';
import { LobbyPage } from '../pages/LobbyPage';
import { GameplayPage } from '../pages/GameplayPage';
import type { GuessFeedback } from '../pages/GameplayPage';
import { ResultsPage } from '../pages/ResultsPage';
import { FinalResultsPage } from '../pages/FinalResultsPage';
import type { MicStatus, VoiceStatus } from '../types/voice';
import { cn } from '../utils/cn';
import { SELF_ID, galleryAnswer, makeFinal, makePrompt, makeRoom, makeRoundResult } from './fixtures';

type Screen = 'lobby' | 'performing' | 'guessing' | 'results' | 'final';
type VoiceCase = 'ok' | 'requesting' | 'denied' | 'unavailable' | 'failed' | 'blocked';

const SCREENS: [Screen, string][] = [
  ['lobby', 'Lobby'],
  ['performing', 'Performing'],
  ['guessing', 'Guessing'],
  ['results', 'Results'],
  ['final', 'Final'],
];
const VOICE_CASES: [VoiceCase, string][] = [
  ['ok', 'Voice OK'],
  ['requesting', 'Mic asking'],
  ['denied', 'Mic blocked'],
  ['unavailable', 'No mic'],
  ['failed', 'Voice failed'],
  ['blocked', 'Audio paused'],
];

const freshGuess = (): MyGuessState => ({ attempts: 0, remaining: MAX_GUESSES_PER_ROUND, correct: false, lastGuess: null });

export default function GalleryPage() {
  const [screen, setScreen] = useState<Screen>('lobby');
  const [count, setCount] = useState(10);
  const [mainRole, setMainRole] = useState(true);
  const [mode, setMode] = useState<GameMode>('celebrity');
  const [lobbyMode, setLobbyMode] = useState<GameMode | null>(null);
  const [rounds, setRounds] = useState(DEFAULT_ROUND_COUNT);
  const [voiceCase, setVoiceCase] = useState<VoiceCase>('ok');
  const [alt, setAlt] = useState(false);
  const [guess, setGuess] = useState(freshGuess);
  const [feedback, setFeedback] = useState<GuessFeedback>(null);
  const [muted, setMuted] = useState(false);
  const [nonce, setNonce] = useState(0);

  const inGame = screen === 'performing' || screen === 'guessing';
  const phase: RoomPhase =
    screen === 'lobby' ? 'lobby' : inGame ? screen : screen === 'results' ? 'round_results' : 'finished';

  const room = useMemo(
    () =>
      makeRoom({
        players: count,
        selfIsHost: inGame ? false : mainRole,
        selfIsPerformer: inGame && mainRole,
        mode: phase === 'lobby' ? lobbyMode : mode,
        phase,
        totalRounds: rounds,
      }),
    // nonce restarts timers
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [count, mainRole, mode, lobbyMode, phase, rounds, inGame, nonce],
  );

  const reset = () => {
    setGuess(freshGuess());
    setFeedback(null);
    setMuted(false);
    setNonce((n) => n + 1);
  };
  const go = (s: Screen) => {
    reset();
    setScreen(s);
  };

  const micStatus: MicStatus =
    voiceCase === 'requesting' || voiceCase === 'denied' || voiceCase === 'unavailable'
      ? voiceCase
      : screen === 'performing'
        ? 'live'
        : 'off';
  const voiceStatus: VoiceStatus = voiceCase === 'failed' ? 'failed' : 'connected';
  const roleLabels = inGame ? ['Performer', 'Guesser'] : ['Host', 'Guest'];

  let page: ReactNode = null;
  switch (screen) {
    case 'lobby':
      page = (
        <LobbyPage
          room={room}
          selfId={SELF_ID}
          justCreated
          onChangeMode={setLobbyMode}
          onChangeRounds={setRounds}
          onStart={() => {
            if (lobbyMode) setMode(lobbyMode);
            go('performing');
          }}
          onLeave={() => go('lobby')}
        />
      );
      break;
    case 'performing':
    case 'guessing':
      page = (
        <GameplayPage
          room={room}
          selfId={SELF_ID}
          prompt={mainRole ? makePrompt(mode, room) : null}
          myGuess={mainRole ? null : guess}
          feedback={feedback}
          micStatus={micStatus}
          micMuted={muted}
          voiceStatus={voiceStatus}
          audioBlocked={voiceCase === 'blocked'}
          onSubmitGuess={(g) => {
            // Gallery-only answer check; the real check runs on the server.
            const correct = g.toLowerCase() === galleryAnswer(mode, room).toLowerCase();
            setGuess((s) => ({
              attempts: s.attempts + 1,
              remaining: correct ? s.remaining : s.remaining - 1,
              correct,
              lastGuess: g,
            }));
            setFeedback(correct ? null : { kind: 'wrong', guess: g });
          }}
          onToggleMute={() => setMuted((m) => !m)}
          onRetryMic={() => setVoiceCase('ok')}
          onRetryVoice={() => setVoiceCase('ok')}
          onEnableAudio={() => setVoiceCase('ok')}
          onLeave={() => go('lobby')}
        />
      );
      break;
    case 'results':
      page = (
        <ResultsPage
          room={room}
          selfId={SELF_ID}
          result={makeRoundResult(room, mode, alt)}
          onNext={() => go('final')}
          onLeave={() => go('lobby')}
        />
      );
      break;
    case 'final':
      page = (
        <FinalResultsPage
          room={room}
          selfId={SELF_ID}
          final={makeFinal(room, alt)}
          onPlayAgain={() => go('performing')}
          onReturnToLobby={() => go('lobby')}
          onLeave={() => go('lobby')}
        />
      );
      break;
  }

  return (
    <>
      <nav
        aria-label="Gallery controls"
        className="sticky top-0 z-50 flex gap-1.5 overflow-x-auto border-b-[3px] border-ink bg-night-950/95 px-3 py-2 backdrop-blur [scrollbar-width:none]"
      >
        <Link to="/" className="shrink-0 rounded-full bg-night-600 px-3 py-1.5 text-xs font-bold">
          ✕ Exit
        </Link>
        <Sep />
        {SCREENS.map(([s, label]) => (
          <Chip key={s} active={screen === s} onClick={() => go(s)}>
            {label}
          </Chip>
        ))}
        <Sep />
        {[3, 10, 30, 60].map((n) => (
          <Chip key={n} active={count === n} onClick={() => setCount(n)}>
            {n}p
          </Chip>
        ))}
        <Sep />
        <Chip active={mainRole} onClick={() => (setMainRole(true), reset())}>
          {roleLabels[0]}
        </Chip>
        <Chip active={!mainRole} onClick={() => (setMainRole(false), reset())}>
          {roleLabels[1]}
        </Chip>
        <Sep />
        <Chip active={mode === 'celebrity'} onClick={() => (setMode('celebrity'), reset())}>
          Celebrity
        </Chip>
        <Chip active={mode === 'friends'} onClick={() => (setMode('friends'), reset())}>
          Friends
        </Chip>
        <Sep />
        {VOICE_CASES.map(([v, label]) => (
          <Chip key={v} active={voiceCase === v} onClick={() => setVoiceCase(v)}>
            {label}
          </Chip>
        ))}
        <Sep />
        <Chip active={alt} onClick={() => setAlt((a) => !a)}>
          Everyone guessed / Tie
        </Chip>
        <Chip onClick={reset}>↻ Reset</Chip>
      </nav>
      {page}
    </>
  );
}

function Chip({ active, onClick, children }: { active?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'shrink-0 rounded-full px-3 py-1.5 text-xs font-bold whitespace-nowrap',
        active ? 'bg-gold text-on-bright' : 'bg-night-700 hover:bg-night-600',
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="mx-1 w-px shrink-0 self-stretch bg-fg/15" aria-hidden />;
}
