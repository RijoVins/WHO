import { LogOut, Play } from 'lucide-react';
import { MAX_PLAYERS, MIN_PLAYERS, PERFORM_SECONDS, GUESS_SECONDS, ROUND_COUNT_OPTIONS } from '@ib/shared';
import type { GameMode, RoomState } from '@ib/shared';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { GameButton, IconButton } from '../components/GameButton';
import { Banner } from '../components/Banner';
import { PlayerGrid } from '../components/PlayerGrid';
import { RoomCodeCard } from '../components/RoomCodeCard';
import { OptionChips } from '../components/OptionChips';
import { ModeSwitch } from '../components/ModeSwitch';
import { Character } from '../components/Character';
import { CelebrityArt, FriendsArt } from '../components/ModeArt';
import { MODE_INFO } from '../components/modeInfo';
import { playerName } from '../utils/players';
import { startBlocker } from '../utils/room';
import { cn } from '../utils/cn';

interface LobbyPageProps {
  room: RoomState;
  selfId: string;
  /** Show "room created" to the host right after creating it. */
  justCreated?: boolean;
  starting?: boolean;
  error?: string | null;
  /** Friendly, non-error message (e.g. what happens next). */
  notice?: string | null;
  /** Connection to the game server dropped; it is retrying. */
  reconnecting?: boolean;
  onChangeMode: (mode: GameMode) => void;
  onChangeRounds: (rounds: number) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function LobbyPage({ room, selfId, justCreated, starting, error, notice, reconnecting, onChangeMode, onChangeRounds, onStart, onLeave }: LobbyPageProps) {
  const isHost = room.hostId === selfId;
  const connected = room.players.filter((p) => p.connected).length;
  const blocker = startBlocker(room);
  const mode = room.settings.mode;

  return (
    <Screen
      width="wide"
      right={<IconButton label="Leave room" color="danger" onClick={onLeave} icon={<LogOut className="size-5" strokeWidth={3} />} />}
    >
      {justCreated && isHost ? <Banner kind="success">Room created! Share the code so your friends can jump in.</Banner> : null}
      {reconnecting ? <Banner kind="warning">Connection lost — reconnecting you to the room…</Banner> : null}
      {error ? <Banner kind="error">{error}</Banner> : null}
      {notice ? <Banner kind="info">{notice}</Banner> : null}

      {/* Phone order: code → game setup / start → players. Desktop: two columns. */}
      <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          <RoomCodeCard code={room.code} />
        </div>

        <div className="flex flex-col gap-6 lg:sticky lg:top-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Panel label="Game" labelColor={mode ? MODE_INFO[mode].sticker : 'gold'}>
            <div className="flex flex-col gap-5">
              {isHost ? (
                <ModeSwitch value={mode} onChange={onChangeMode} label="Mode" />
              ) : (
                <ModeBadge mode={mode} />
              )}
              <OptionChips
                label="Rounds"
                options={ROUND_COUNT_OPTIONS}
                value={room.settings.totalRounds as (typeof ROUND_COUNT_OPTIONS)[number]}
                onChange={isHost ? onChangeRounds : undefined}
              />
              <p className="text-sm font-bold text-fg-faint">
                Each round: {PERFORM_SECONDS}s on the mic, then {GUESS_SECONDS}s of final guesses.
              </p>
            </div>
          </Panel>

          {isHost ? (
            <div className="flex flex-col gap-2">
              <GameButton
                color="gold"
                size="xl"
                fullWidth
                shine={!blocker}
                onClick={onStart}
                disabled={!!blocker}
                loading={starting}
                aria-describedby={blocker ? 'start-blocker' : undefined}
                icon={<Play className="size-8 fill-current" strokeWidth={3} aria-hidden />}
              >
                Start Game
              </GameButton>
              {blocker ? (
                <p id="start-blocker" className="text-center font-bold text-warn">
                  {blocker}
                </p>
              ) : null}
            </div>
          ) : (
            <WaitingCard text={connected < MIN_PLAYERS ? `Waiting for more players…` : `Waiting for ${playerName(room.players, room.hostId)} to start…`} hostId={room.hostId} />
          )}
        </div>

        <Panel
          label="Players"
          labelColor="pink"
          className="lg:col-start-1 lg:row-start-2"
          action={
            <span
              className="rounded-xl border-[3px] border-ink bg-night-950 px-3 py-0.5 font-title text-xl shadow-[0_4px_0_var(--color-ink)]"
              aria-label={`${connected} of ${MAX_PLAYERS} players`}
            >
              <span className="text-gold">{connected}</span>
              <span className="text-fg-faint">/{MAX_PLAYERS}</span>
            </span>
          }
        >
          {connected < MIN_PLAYERS ? <MinPlayersMeter connected={connected} /> : null}
          <PlayerGrid players={room.players} selfId={selfId} />
        </Panel>
      </div>
    </Screen>
  );
}

function ModeBadge({ mode }: { mode: GameMode | null }) {
  if (!mode) return <p className="font-display text-xl text-fg-muted uppercase">Host is picking a mode…</p>;
  const Art = mode === 'celebrity' ? CelebrityArt : FriendsArt;
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-2xl border-[3px] border-ink pr-4 shadow-[0_5px_0_var(--color-ink)]',
        mode === 'celebrity' ? 'bg-celeb' : 'bg-friend',
      )}
    >
      <Art className="h-20 w-28 shrink-0" />
      <span className="font-title text-2xl leading-none text-outline-thin">{MODE_INFO[mode].title.toUpperCase()}</span>
    </div>
  );
}

/** Three slots that fill as players arrive, until the minimum is reached. */
function MinPlayersMeter({ connected }: { connected: number }) {
  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-2xl border-[3px] border-dashed border-warn/70 p-3">
      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: MIN_PLAYERS }, (_, i) => (
          <span
            key={i}
            className={cn(
              'grid size-9 place-items-center rounded-full border-[3px] border-ink font-title',
              i < connected ? 'bg-lime text-on-bright' : 'animate-pulse bg-night-950 text-fg-faint',
            )}
          >
            {i < connected ? '✓' : '?'}
          </span>
        ))}
      </div>
      <p className="font-display tracking-wide text-warn uppercase">
        Need {MIN_PLAYERS - connected} more to start
      </p>
    </div>
  );
}

function WaitingCard({ text, hostId }: { text: string; hostId: string }) {
  return (
    <div role="status" className="panel flex items-center gap-4 p-4">
      <Character id={hostId} size={64} className="animate-bob" />
      <p className="font-display text-xl leading-tight uppercase">
        {text}
        <span className="ml-1 inline-flex gap-1" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="inline-block size-2 animate-bob rounded-full bg-gold" style={{ animationDelay: `${i * 0.15}s`, animationDuration: '0.9s' }} />
          ))}
        </span>
      </p>
    </div>
  );
}
