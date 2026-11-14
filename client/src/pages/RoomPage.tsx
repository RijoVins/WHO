import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router';
import { Home, LogIn } from 'lucide-react';
import { normalizeRoomCode } from '@ib/shared';
import type { GameMode } from '@ib/shared';
import { useGame } from '../context/game';
import { LobbyPage } from './LobbyPage';
import { GameplayPage } from './GameplayPage';
import type { GuessFeedback } from './GameplayPage';
import { ResultsPage } from './ResultsPage';
import { FinalResultsPage } from './FinalResultsPage';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { GameLink } from '../components/GameButton';
import { Character } from '../components/Character';

/**
 * /room/:code. Which screen shows is decided by the server's room state,
 * never by the URL alone.
 */
export function RoomPage() {
  const params = useParams();
  const code = normalizeRoomCode(params.code ?? '');
  const game = useGame();

  if (game.room && game.selfId && game.room.code === code) {
    return <InRoom />;
  }
  if (game.ended) {
    return <SeatLost code={code} message={game.ended} />;
  }
  if (game.pendingCode === code) {
    return <Rejoining code={code} />;
  }
  // Opened a room link without a seat in it: go and join.
  return <Navigate to={`/join?code=${code}`} replace />;
}

function InRoom() {
  const game = useGame();
  const navigate = useNavigate();
  const location = useLocation();
  const room = game.room!;
  const [justCreated] = useState(() => Boolean((location.state as { justCreated?: boolean } | null)?.justCreated));
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [feedback, setFeedback] = useState<GuessFeedback>(null);
  const [submitting, setSubmitting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [feedbackRound, setFeedbackRound] = useState<number | null>(null);

  const handle = async (p: Promise<{ ok: boolean; error?: string; code?: string }>) => {
    setError(null);
    const r = await p;
    if (!r.ok) {
      if (r.code === 'NOT_IMPLEMENTED') setNotice(r.error ?? null);
      else setError(r.error ?? 'Something went wrong.');
    }
  };

  const leave = async () => {
    await game.leaveRoom();
    navigate('/', { replace: true });
  };

  switch (room.phase) {
    case 'lobby':
      return (
        <LobbyPage
          room={room}
          selfId={game.selfId!}
          justCreated={justCreated}
          starting={starting}
          error={error}
          notice={notice}
          reconnecting={game.connection === 'reconnecting' || game.connection === 'connecting'}
          onChangeMode={(mode: GameMode) => void handle(game.selectMode(mode))}
          onChangeRounds={(n) => void handle(game.setRounds(n))}
          onStart={async () => {
            setError(null);
            setNotice(null);
            setStarting(true);
            await handle(game.startGame());
            setStarting(false);
          }}
          onLeave={leave}
        />
      );
    case 'performing':
    case 'guessing': {
      const roundNo = room.round?.number ?? null;
      return (
        <GameplayPage
          room={room}
          selfId={game.selfId!}
          prompt={game.prompt}
          myGuess={game.myGuess}
          feedback={feedbackRound === roundNo ? feedback : null}
          submitting={submitting}
          serverOffsetMs={game.serverOffsetMs}
          // Voice chat is the next milestone.
          voiceEnabled={false}
          micStatus="off"
          micMuted={false}
          voiceStatus="disconnected"
          audioBlocked={false}
          onToggleMute={() => {}}
          onRetryMic={() => {}}
          onRetryVoice={() => {}}
          onEnableAudio={() => {}}
          onSubmitGuess={async (text) => {
            setSubmitting(true);
            const r = await game.submitGuess(text);
            setSubmitting(false);
            setFeedbackRound(roundNo);
            if (!r.ok) setFeedback({ kind: 'error', message: r.error });
            else setFeedback(r.correct ? null : { kind: 'wrong', guess: text });
          }}
          onLeave={leave}
        />
      );
    }
    case 'round_results':
      return room.lastResult ? (
        <ResultsPage
          room={room}
          selfId={game.selfId!}
          result={room.lastResult}
          serverOffsetMs={game.serverOffsetMs}
          onNext={() => void handle(game.nextRound())}
          onLeave={leave}
        />
      ) : (
        <Rejoining code={room.code} text="Loading results…" />
      );
    case 'finished':
      return room.finalResult ? (
        <FinalResultsPage
          room={room}
          selfId={game.selfId!}
          final={room.finalResult}
          busy={busy}
          error={error}
          onPlayAgain={async () => {
            setBusy(true);
            await handle(game.playAgain());
            setBusy(false);
          }}
          onReturnToLobby={async () => {
            setBusy(true);
            await handle(game.returnToLobby());
            setBusy(false);
          }}
          onLeave={leave}
        />
      ) : (
        <Rejoining code={room.code} text="Loading final results…" />
      );
  }
}

function Rejoining({ code, text = 'Rejoining room…' }: { code: string; text?: string }) {
  return (
    <Screen heading={code}>
      <Panel className="flex flex-col items-center gap-4 py-8 text-center">
        <Character id={code} size={96} className="animate-bob" />
        <p role="status" className="font-display text-2xl uppercase">
          {text}
        </p>
        <span className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="size-3 animate-bob rounded-full border-2 border-ink bg-gold" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }} />
          ))}
        </span>
      </Panel>
      <GameLink to="/" color="night" size="md" fullWidth icon={<Home className="size-5" strokeWidth={3} aria-hidden />}>
        Main menu
      </GameLink>
    </Screen>
  );
}

function SeatLost({ code, message }: { code: string; message: string }) {
  const game = useGame();
  return (
    <Screen heading="Oops!">
      <Panel label="Disconnected" labelColor="pink">
        <p className="font-bold text-fg-muted">{message}</p>
      </Panel>
      <GameLink to={`/join?code=${code}`} color="cyan" fullWidth onClick={game.dismissEnded} icon={<LogIn className="size-6" strokeWidth={3.5} aria-hidden />}>
        Join again
      </GameLink>
      <GameLink to="/" color="night" size="md" fullWidth onClick={game.dismissEnded} icon={<Home className="size-5" strokeWidth={3} aria-hidden />}>
        Main menu
      </GameLink>
    </Screen>
  );
}
