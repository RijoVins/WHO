import { useState } from 'react';
import type { FormEvent } from 'react';
import { CheckCircle2, LogOut, Mic, MicOff, RefreshCw, Send, Volume2, XCircle } from 'lucide-react';
import { GUESS_MAX_LENGTH, GUESS_SECONDS, PERFORM_SECONDS, validateGuess } from '@ib/shared';
import type { MyGuessState, PrivatePrompt, RoomState } from '@ib/shared';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { GameButton, IconButton } from '../components/GameButton';
import { Banner } from '../components/Banner';
import { TextField } from '../components/TextField';
import { PlayerGrid } from '../components/PlayerGrid';
import { Character } from '../components/Character';
import { CountdownTimer } from '../components/CountdownTimer';
import { RoundProgress } from '../components/RoundProgress';
import { VoiceStatusBar } from '../components/VoiceStatus';
import { MicMeter } from '../components/MicMeter';
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
  const { room, selfId, voiceStatus, micStatus, micMuted, serverOffsetMs, audioBlocked, onEnableAudio, onRetryVoice, onLeave } = props;
  const round = room.round;
  if (!round || (room.phase !== 'performing' && room.phase !== 'guessing')) return null;

  const performing = room.phase === 'performing';
  const isPerformer = round.performerId === selfId;
  const performer = playerName(room.players, round.performerId);
  const mode = room.settings.mode ?? 'celebrity';
  // Show the performer as "live" to everyone while the stage is open.
  const live = performing && (!isPerformer || (micStatus === 'live' && !micMuted));

  return (
    <Screen width="wide" right={<IconButton label="Leave game" color="danger" onClick={onLeave} icon={<LogOut className="size-5" strokeWidth={3} />} />}>
      {/* HUD */}
      <section className="panel flex items-center gap-3 p-3 sm:gap-5 sm:p-4">
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-title text-2xl leading-none text-outline-thin sm:text-3xl">
              ROUND {round.number}
              <span className="text-fg-faint">/{round.totalRounds}</span>
            </span>
            <span
              className={cn(
                'rounded-lg border-[2.5px] border-ink px-2 font-display text-sm uppercase',
                mode === 'celebrity' ? 'bg-celeb text-fg' : 'bg-friend text-on-bright',
              )}
            >
              {MODE_INFO[mode].short}
            </span>
          </div>
          <RoundProgress current={round.number} total={round.totalRounds} />
          <p className={cn('font-display text-lg uppercase sm:text-xl', performing ? 'text-lime' : 'animate-pulse text-warn')}>
            {performing ? 'Listen up!' : 'Final guesses!'}
          </p>
        </div>
        <CountdownTimer
          key={room.phase}
          endsAt={performing ? round.performEndsAt : round.guessEndsAt}
          totalSeconds={performing ? PERFORM_SECONDS : GUESS_SECONDS}
          label={performing ? 'On stage' : 'Guess!'}
          serverOffsetMs={serverOffsetMs}
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="flex flex-col gap-6">
          {/* Spotlight stage */}
          <section
            className="panel relative flex items-center gap-4 overflow-hidden p-4 sm:p-5"
            style={isPerformer ? { background: 'linear-gradient(135deg, var(--color-pink), var(--color-celeb))' } : undefined}
            aria-label="Performer"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -top-10 left-2 h-56 w-40 bg-[linear-gradient(180deg,rgb(255_233_160/0.45),transparent)] [clip-path:polygon(35%_0,65%_0,100%_100%,0_100%)]"
            />
            <span className={cn('relative shrink-0 rounded-full', live && 'animate-pulse-ring')}>
              <Character id={round.performerId} size={92} className={cn(live && 'animate-bob')} />
            </span>
            <div className="relative min-w-0 flex-1">
              <p className="font-display text-sm tracking-[0.15em] text-fg/85 uppercase">
                {isPerformer ? (performing ? 'Your turn!' : 'Mic closed') : performing ? 'On the mic' : 'Performed by'}
              </p>
              <p className="truncate font-title text-3xl leading-tight text-outline-thin sm:text-4xl">
                {isPerformer ? (performing ? 'Perform now!' : 'Time’s up!') : performer}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <MicMeter active={live && voiceStatus === 'connected' && !audioBlocked} />
                <span className="font-display text-sm tracking-wide text-fg/80 uppercase">
                  {live ? (isPerformer ? 'Everyone can hear you' : 'Live') : 'Quiet'}
                </span>
              </div>
            </div>
          </section>

          {!isPerformer && audioBlocked ? (
            <Banner
              kind="warning"
              action={
                <GameButton size="sm" color="gold" onClick={onEnableAudio} icon={<Volume2 className="size-5" strokeWidth={3} aria-hidden />}>
                  Tap to hear
                </GameButton>
              }
            >
              Your browser paused the sound. Tap to hear the performer.
            </Banner>
          ) : null}

          {isPerformer ? <PerformerPanel {...props} /> : <GuessPanel key={round.number} {...props} />}

          <div className="flex flex-col gap-3">
            <VoiceStatusBar micStatus={isPerformer ? micStatus : 'off'} voiceStatus={voiceStatus} />
            {voiceStatus === 'failed' ? (
              <Banner
                kind="warning"
                action={
                  <GameButton size="sm" color="night" onClick={onRetryVoice} icon={<RefreshCw className="size-4" strokeWidth={3} aria-hidden />}>
                    Retry
                  </GameButton>
                }
              >
                Voice couldn't connect. You can keep guessing while you retry.
              </Banner>
            ) : null}
          </div>
        </div>

        <Panel
          label="Players"
          labelColor="pink"
          action={
            <span className="rounded-xl border-[3px] border-ink bg-lime px-2.5 py-0.5 font-display text-on-bright shadow-[0_4px_0_var(--color-ink)]">
              {round.correctPlayerIds.length}/{round.guesserIds.length} got it
            </span>
          }
          className="lg:sticky lg:top-5"
        >
          <PlayerGrid players={room.players} selfId={selfId} performerId={round.performerId} correctIds={round.correctPlayerIds} showScores dense />
        </Panel>
      </div>
    </Screen>
  );
}

function PerformerPanel({ room, prompt, micStatus, micMuted, onToggleMute, onRetryMic }: GameplayPageProps) {
  const round = room.round!;
  const performing = room.phase === 'performing';
  return (
    <>
      <section
        aria-label="Your secret prompt"
        className="relative flex animate-pop-in flex-col items-center gap-2 rounded-[1.75rem] border-[3px] border-ink bg-[#fff4d6] p-6 pt-9 text-center text-on-bright shadow-[inset_0_-7px_0_#e8cf8f,0_8px_0_var(--color-ink)] sm:p-8 sm:pt-10"
      >
        <span className="absolute -top-5 -rotate-3 rounded-xl border-[3px] border-ink bg-bad px-4 py-1 font-title text-xl tracking-[0.15em] text-fg shadow-[0_4px_0_var(--color-ink)]">
          TOP SECRET
        </span>
        <p className="font-display text-lg uppercase opacity-70">
          {prompt?.mode === 'friends' ? 'Impersonate this player' : 'Impersonate this celebrity'}
        </p>
        {prompt ? (
          <>
            <p className="font-title text-[clamp(2.2rem,9vw,3.6rem)] leading-none break-words text-celeb-deep">{prompt.target}</p>
            {prompt.category ? (
              <span className="rounded-lg border-[2.5px] border-ink bg-gold px-3 font-display uppercase">{prompt.category}</span>
            ) : null}
            {prompt.hint ? <p className="mt-1 text-lg font-bold">Tip: {prompt.hint}</p> : null}
            <p className="font-bold opacity-60">Don't say the name! Voice, catchphrases and style only.</p>
          </>
        ) : (
          <p className="font-display text-xl">Unsealing your secret…</p>
        )}
        <p className="mt-1 rounded-xl border-[2.5px] border-ink bg-lime px-3 py-0.5 font-display uppercase">
          {round.correctPlayerIds.length} of {round.guesserIds.length} guessed it
        </p>
      </section>

      {performing ? (
        <div className="flex flex-col gap-3">
          {micStatus === 'live' ? (
            <GameButton
              color={micMuted ? 'danger' : 'night'}
              fullWidth
              onClick={onToggleMute}
              aria-pressed={micMuted}
              icon={micMuted ? <MicOff className="size-7" strokeWidth={3} aria-hidden /> : <Mic className="size-7" strokeWidth={3} aria-hidden />}
            >
              {micMuted ? 'Muted — tap to unmute' : 'Mute mic'}
            </GameButton>
          ) : null}
          {micStatus === 'requesting' ? <Banner kind="info">Your browser is asking for the microphone. Tap “Allow”.</Banner> : null}
          {micStatus === 'denied' || micStatus === 'unavailable' ? (
            <Banner
              kind="error"
              action={
                <GameButton size="sm" color="gold" onClick={onRetryMic} icon={<RefreshCw className="size-4" strokeWidth={3} aria-hidden />}>
                  Retry
                </GameButton>
              }
            >
              {micStatus === 'denied'
                ? 'Mic blocked, so nobody can hear you. Allow it from the lock icon in the address bar, then retry.'
                : 'No microphone found. Plug one in, or open the game over HTTPS.'}
            </Banner>
          ) : null}
        </div>
      ) : (
        <Banner kind="info">Time's up — your mic is off. Everyone is locking in final guesses.</Banner>
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
      <section className="panel flex animate-pop-in flex-col items-center gap-2 bg-[#1f5a3f] p-6 text-center">
        <CheckCircle2 className="size-16 fill-lime text-ink" strokeWidth={2.5} aria-hidden />
        <p className="font-title text-4xl text-lime text-outline-thin">YOU GOT IT!</p>
        <p className="font-bold text-fg-muted">Locked in. Points land when the round ends.</p>
      </section>
    );
  }
  if (myGuess && myGuess.remaining <= 0) {
    return (
      <section className="panel flex flex-col items-center gap-2 p-6 text-center">
        <XCircle className="size-16 fill-bad text-ink" strokeWidth={2.5} aria-hidden />
        <p className="font-title text-4xl text-bad text-outline-thin">OUT OF GUESSES</p>
        <p className="font-bold text-fg-muted">Enjoy the show — the answer is revealed soon.</p>
      </section>
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
  const chips = showAll ? candidates : query ? candidates.filter((p) => p.name.toLowerCase().includes(query)).slice(0, MAX_NAME_CHIPS) : [];

  return (
    <Panel label={isFriends ? 'Which friend?' : 'Who is it?'} labelColor="cyan">
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
          <p className="font-bold text-fg-faint">{query ? 'No player matches that.' : 'Start typing to see matching names.'}</p>
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
                  'flex min-h-11 items-center gap-1.5 rounded-xl border-[3px] border-ink py-1 pr-3 pl-1 font-display text-base transition',
                  text === p.name
                    ? 'translate-y-0.5 bg-cyan text-on-bright shadow-[0_1px_0_var(--color-ink)]'
                    : 'bg-night-600 shadow-[0_4px_0_var(--color-ink)] hover:-translate-y-0.5',
                )}
              >
                <Character id={p.id} size={28} />
                {p.name}
                {p.id === selfId ? ' (me)' : ''}
              </button>
            ))}
          </div>
        ) : null}
        <GameButton type="submit" color="pink" fullWidth loading={submitting} icon={<Send className="size-6" strokeWidth={3} aria-hidden />}>
          Submit Guess
        </GameButton>
        <div className="flex flex-wrap items-center justify-between gap-2" aria-live="polite">
          {feedback?.kind === 'wrong' ? (
            <span key={feedback.guess} className="animate-shake font-display text-lg text-bad uppercase">
              Nope! “{feedback.guess}” isn’t it
            </span>
          ) : (
            <span />
          )}
          {myGuess ? (
            <span className="flex items-center gap-1 font-display text-fg-muted uppercase" aria-label={`${myGuess.remaining} guesses left`}>
              {Array.from({ length: myGuess.attempts + myGuess.remaining }, (_, i) => (
                <span key={i} aria-hidden className={cn('size-3 rounded-full border-2 border-ink', i < myGuess.remaining ? 'bg-gold' : 'bg-night-950')} />
              ))}
              <span className="ml-1">{myGuess.remaining} left</span>
            </span>
          ) : null}
        </div>
      </form>
    </Panel>
  );
}
