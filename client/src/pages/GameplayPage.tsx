import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, Lock, LogOut, Mic, MicOff, RefreshCw, Send, Volume2, VolumeX, XCircle } from 'lucide-react';
import { GUESS_MAX_LENGTH, GUESS_SECONDS, PERFORM_SECONDS, validateGuess } from '@ib/shared';
import type { MyGuessState, PrivatePrompt, RoomState } from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { TextField } from '../components/TextField';
import { PlayerGrid } from '../components/PlayerGrid';
import { PlayerAvatar } from '../components/PlayerAvatar';
import { CountdownTimer } from '../components/CountdownTimer';
import { RoundProgress } from '../components/RoundProgress';
import { VoiceStatusBar } from '../components/VoiceStatus';
import { MODE_INFO } from '../components/modeInfo';
import type { MicStatus, VoiceStatus } from '../types/voice';
import { playerName } from '../utils/players';
import { cn } from '../utils/cn';

/** Friends Mode shows every name as a quick-pick chip up to this many; bigger rooms filter by what's typed. */
export const MAX_NAME_CHIPS = 12;

export type GuessFeedback = { kind: 'wrong'; guess: string } | { kind: 'error'; message: string } | null;

export interface GameplayPageProps {
  room: RoomState;
  selfId: string;
  /** Only ever set on the performer's device. */
  prompt: PrivatePrompt | null;
  myGuess: MyGuessState | null;
  feedback?: GuessFeedback;
  submitting?: boolean;
  micStatus: MicStatus;
  micMuted: boolean;
  voiceStatus: VoiceStatus;
  /** Browsers block audio playback until the user interacts with the page. */
  audioBlocked: boolean;
  serverOffsetMs?: number;
  onSubmitGuess: (guess: string) => void;
  onToggleMute: () => void;
  onRetryMic: () => void;
  onRetryVoice: () => void;
  onEnableAudio: () => void;
  onLeave: () => void;
}

export function GameplayPage(props: GameplayPageProps) {
  const { room, selfId, voiceStatus, serverOffsetMs, audioBlocked, onEnableAudio, onRetryVoice, onLeave } = props;
  const round = room.round;
  if (!round || (room.phase !== 'performing' && room.phase !== 'guessing')) return null;

  const performing = room.phase === 'performing';
  const isPerformer = round.performerId === selfId;
  const performer = playerName(room.players, round.performerId);
  const mode = room.settings.mode ?? 'celebrity';

  return (
    <PageShell
      width="wide"
      topRight={
        <Button variant="danger" size="md" onClick={onLeave} icon={<LogOut className="size-5" aria-hidden />}>
          <span className="max-sm:sr-only">Leave</span>
        </Button>
      }
    >
      {/* Round header */}
      <section className="flex items-center gap-4 rounded-3xl border border-line bg-glass p-4 sm:p-5">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <p className="text-xs font-extrabold tracking-[0.15em] text-fg-muted uppercase">
            Round {round.number} of {round.totalRounds} · {MODE_INFO[mode].title}
          </p>
          <RoundProgress current={round.number} total={round.totalRounds} />
          <p className="font-display text-lg font-bold sm:text-xl">
            {performing ? 'Performance in progress' : 'Final guesses!'}
          </p>
        </div>
        <CountdownTimer
          key={room.phase}
          endsAt={performing ? round.performEndsAt : round.guessEndsAt}
          totalSeconds={performing ? PERFORM_SECONDS : GUESS_SECONDS}
          label={performing ? 'Performing' : 'Guessing'}
          serverOffsetMs={serverOffsetMs}
        />
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-5">
          {/* Performer banner */}
          <section
            className={cn(
              'flex items-center gap-4 rounded-3xl p-4 sm:p-5',
              isPerformer ? 'bg-gradient-to-r from-pink to-violet' : 'border border-pink/40 bg-pink/10',
            )}
          >
            {/* The pulse lives on a wrapper: it animates box-shadow, which would erase the avatar's ring. */}
            <span className={cn('shrink-0 rounded-full', performing && 'animate-live-ring')}>
              <PlayerAvatar id={round.performerId} name={performer} size="lg" ring={isPerformer} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-extrabold tracking-[0.15em] text-fg/80 uppercase">
                {isPerformer ? (performing ? 'Your turn' : 'Mic closed') : performing ? 'Now performing' : 'Performed by'}
              </p>
              <p className="truncate font-display text-2xl font-extrabold">{isPerformer ? (performing ? 'Perform now!' : 'Time’s up!') : performer}</p>
            </div>
            {voiceStatus === 'connected' && !audioBlocked ? (
              <Volume2 className={cn('size-7 shrink-0', performing && 'animate-pulse')} aria-label="Audio on" />
            ) : (
              <VolumeX className="size-7 shrink-0 text-fg-muted" aria-label="Audio off" />
            )}
          </section>

          {!isPerformer && audioBlocked ? (
            <Banner
              kind="warning"
              action={
                <Button size="md" variant="sun" onClick={onEnableAudio} icon={<Volume2 className="size-5" aria-hidden />}>
                  Tap to hear
                </Button>
              }
            >
              Your browser paused the sound. Tap the button to hear the performer.
            </Banner>
          ) : null}

          {isPerformer ? <PerformerPanel {...props} /> : <GuessPanel key={round.number} {...props} />}

          <section className="flex flex-col gap-3">
            <VoiceStatusBar micStatus={isPerformer ? props.micStatus : 'off'} voiceStatus={voiceStatus} />
            {voiceStatus === 'failed' ? (
              <Banner
                kind="warning"
                action={
                  <Button size="md" variant="ghost" onClick={onRetryVoice} icon={<RefreshCw className="size-4" aria-hidden />}>
                    Retry
                  </Button>
                }
              >
                Voice couldn't connect. You can keep guessing while you retry.
              </Banner>
            ) : null}
          </section>
        </div>

        <Card
          title="Players"
          action={
            <span className="text-sm font-bold text-ok">
              {round.correctPlayerIds.length}/{round.guesserIds.length} got it
            </span>
          }
          className="lg:sticky lg:top-5"
        >
          <PlayerGrid
            players={room.players}
            selfId={selfId}
            performerId={round.performerId}
            correctIds={round.correctPlayerIds}
            showScores
            dense
          />
        </Card>
      </div>
    </PageShell>
  );
}

function PerformerPanel({ room, prompt, micStatus, micMuted, onToggleMute, onRetryMic }: GameplayPageProps) {
  const round = room.round!;
  const performing = room.phase === 'performing';
  return (
    <>
      <section
        className="flex animate-pop-in flex-col items-center gap-2 rounded-3xl border-2 border-sun bg-sun/[0.08] p-6 text-center sm:p-8"
        aria-label="Your secret prompt"
      >
        <p className="inline-flex items-center gap-1.5 text-xs font-extrabold tracking-[0.15em] text-sun">
          <Lock className="size-3.5" aria-hidden /> SECRET — ONLY YOU CAN SEE THIS
        </p>
        {prompt ? (
          <>
            <p className="text-fg-muted">
              {prompt.mode === 'celebrity' ? 'Impersonate this celebrity:' : 'Impersonate this player:'}
            </p>
            <p className="font-display text-4xl font-extrabold break-words sm:text-5xl">{prompt.target}</p>
            {prompt.category ? (
              <span className="rounded-full bg-sun px-3 py-0.5 text-sm font-bold text-on-bright">{prompt.category}</span>
            ) : null}
            {prompt.hint ? <p className="mt-2 text-lg">Tip: {prompt.hint}</p> : null}
            <p className="text-sm text-fg-faint">Don't say the name! Use their voice, catchphrases and style.</p>
          </>
        ) : (
          <p className="text-fg-muted">Getting your secret prompt…</p>
        )}
        <p className="mt-2 font-bold text-ok">
          {round.correctPlayerIds.length} of {round.guesserIds.length} players have guessed it
        </p>
      </section>

      {performing ? (
        <Card title="Your microphone">
          <div className="flex flex-col gap-3">
            {micStatus === 'live' ? (
              <Button
                variant={micMuted ? 'sun' : 'ghost'}
                onClick={onToggleMute}
                fullWidth
                aria-pressed={micMuted}
                icon={micMuted ? <MicOff className="size-6" aria-hidden /> : <Mic className="size-6" aria-hidden />}
              >
                {micMuted ? 'Unmute — they can’t hear you' : 'Mute mic'}
              </Button>
            ) : null}
            {micStatus === 'requesting' ? (
              <Banner kind="info">Your browser is asking for microphone access. Choose “Allow”.</Banner>
            ) : null}
            {micStatus === 'denied' ? (
              <Banner
                kind="error"
                action={
                  <Button size="md" variant="sun" onClick={onRetryMic} icon={<RefreshCw className="size-4" aria-hidden />}>
                    Retry
                  </Button>
                }
              >
                The microphone is blocked, so nobody can hear you. Allow it from the lock icon in your address bar, then
                tap Retry.
              </Banner>
            ) : null}
            {micStatus === 'unavailable' ? (
              <Banner
                kind="error"
                action={
                  <Button size="md" variant="sun" onClick={onRetryMic} icon={<RefreshCw className="size-4" aria-hidden />}>
                    Retry
                  </Button>
                }
              >
                No microphone found. Connect one, or check that this site is opened over HTTPS.
              </Banner>
            ) : null}
          </div>
        </Card>
      ) : (
        <Banner kind="info">Time's up — your mic is off. Players are locking in their final guesses.</Banner>
      )}
    </>
  );
}

function GuessPanel({ room, selfId, myGuess, feedback, submitting, onSubmitGuess }: GameplayPageProps) {
  const [text, setText] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const round = room.round!;
  const isFriends = room.settings.mode === 'friends';

  if (myGuess?.correct) {
    return (
      <Card className="flex animate-pop-in flex-col items-center gap-2 py-8 text-center">
        <CheckCircle2 className="size-12 text-ok" aria-hidden />
        <p className="font-display text-2xl font-extrabold">You got it!</p>
        <p className="text-fg-muted">Your answer is locked in. Points are revealed when the round ends.</p>
      </Card>
    );
  }
  if (myGuess && myGuess.remaining <= 0) {
    return (
      <Card className="flex flex-col items-center gap-2 py-8 text-center">
        <XCircle className="size-12 text-bad" aria-hidden />
        <p className="font-display text-2xl font-extrabold">Out of guesses</p>
        <p className="text-fg-muted">Enjoy the show — the answer is revealed when time runs out.</p>
      </Card>
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const v = validateGuess(text);
    if (!v.ok) {
      setLocalError(v.error);
      return;
    }
    setLocalError(null);
    onSubmitGuess(v.value);
    setText('');
  };

  // Friends Mode: anyone except the performer could be the target — including you.
  const candidates = isFriends ? room.players.filter((p) => p.id !== round.performerId) : [];
  const query = text.trim().toLowerCase();
  const showAll = candidates.length <= MAX_NAME_CHIPS;
  const chips = showAll
    ? candidates
    : query
      ? candidates.filter((p) => p.name.toLowerCase().includes(query)).slice(0, MAX_NAME_CHIPS)
      : [];

  return (
    <Card title={isFriends ? 'Which friend is it?' : 'Who is it?'}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-4">
        <TextField
          label="Your guess"
          placeholder={isFriends ? 'Type a player’s name' : 'Type a celebrity’s name'}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setLocalError(null);
          }}
          maxLength={GUESS_MAX_LENGTH}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="send"
          error={localError ?? (feedback?.kind === 'error' ? feedback.message : null)}
        />
        {isFriends && !showAll && chips.length === 0 ? (
          <p className="text-sm text-fg-faint">
            {query ? 'No player matches that.' : 'Start typing to see matching player names.'}
          </p>
        ) : null}
        {chips.length > 0 ? (
          <div className="flex flex-wrap gap-2" aria-label="Player names">
            {chips.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setText(p.name)}
                aria-pressed={text === p.name}
                className={cn(
                  'min-h-10 rounded-full border-2 px-3.5 text-sm font-semibold transition',
                  text === p.name ? 'border-teal bg-teal font-bold text-on-bright' : 'border-line hover:bg-glass-strong',
                )}
              >
                {p.name}
                {p.id === selfId ? ' (me)' : ''}
              </button>
            ))}
          </div>
        ) : null}
        <Button type="submit" loading={submitting} fullWidth icon={<Send className="size-5" aria-hidden />}>
          Submit Guess
        </Button>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm" aria-live="polite">
          {feedback?.kind === 'wrong' ? (
            <span className="font-bold text-bad">“{feedback.guess}” isn’t it.</span>
          ) : (
            <span />
          )}
          {myGuess ? (
            <span className="text-fg-faint">
              {myGuess.remaining} guess{myGuess.remaining === 1 ? '' : 'es'} left
            </span>
          ) : null}
        </div>
      </form>
    </Card>
  );
}
