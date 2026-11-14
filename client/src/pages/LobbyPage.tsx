import { HelpCircle, Hourglass, LogOut, Play } from 'lucide-react';
import { MAX_PLAYERS, MIN_PLAYERS, ROUND_COUNT_OPTIONS, PERFORM_SECONDS, GUESS_SECONDS } from '@ib/shared';
import type { RoomState } from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { PlayerGrid } from '../components/PlayerGrid';
import { RoomCodeCard } from '../components/RoomCodeCard';
import { OptionChips } from '../components/OptionChips';
import { MODE_INFO } from '../components/modeInfo';
import { playerName } from '../utils/players';
import { startBlocker } from '../utils/room';
import { cn } from '../utils/cn';

interface LobbyPageProps {
  room: RoomState;
  selfId: string;
  /** Show the "room created" confirmation to the host right after creating it. */
  justCreated?: boolean;
  starting?: boolean;
  error?: string | null;
  onChooseMode: () => void;
  onChangeRounds: (rounds: number) => void;
  onStart: () => void;
  onLeave: () => void;
}

export function LobbyPage({
  room,
  selfId,
  justCreated,
  starting,
  error,
  onChooseMode,
  onChangeRounds,
  onStart,
  onLeave,
}: LobbyPageProps) {
  const isHost = room.hostId === selfId;
  const connected = room.players.filter((p) => p.connected).length;
  const blocker = startBlocker(room);
  const mode = room.settings.mode ? MODE_INFO[room.settings.mode] : null;

  return (
    <PageShell width="wide">
      {justCreated && isHost ? (
        <Banner kind="success">
          <strong>Room created!</strong> Share the code or invite link so friends can join from any device.
        </Banner>
      ) : null}
      {error ? <Banner kind="error">{error}</Banner> : null}

      {/* Phone order: code → setup/start → players, so Start is reachable without scrolling past 60 players. */}
      <div className="grid items-start gap-5 lg:grid-cols-[3fr_2fr]">
        <div className="lg:col-start-1 lg:row-start-1">
          <RoomCodeCard code={room.code} />
        </div>
        <div className="flex flex-col gap-5 lg:sticky lg:top-5 lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Card title="Game setup">
            <div className="flex flex-col gap-5">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'grid size-14 shrink-0 place-items-center rounded-2xl',
                    mode ? `bg-gradient-to-br ${mode.gradient}` : 'bg-glass-strong',
                  )}
                >
                  {mode ? mode.icon : <HelpCircle className="size-7 text-fg-muted" aria-hidden />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-fg-faint">Game mode</p>
                  <p className="font-display text-xl font-extrabold">{mode ? mode.title : 'Not chosen yet'}</p>
                </div>
                {isHost ? (
                  <Button size="md" variant={mode ? 'ghost' : 'sun'} onClick={onChooseMode}>
                    {mode ? 'Change' : 'Choose'}
                  </Button>
                ) : null}
              </div>
              <OptionChips
                label="Rounds"
                options={ROUND_COUNT_OPTIONS}
                value={room.settings.totalRounds as (typeof ROUND_COUNT_OPTIONS)[number]}
                onChange={isHost ? onChangeRounds : undefined}
              />
              <p className="text-sm text-fg-faint">
                Each round: {PERFORM_SECONDS}s performance, then {GUESS_SECONDS}s of final guesses.
                {isHost ? '' : ' Only the host can change the setup.'}
              </p>
            </div>
          </Card>

          <div className="flex flex-col gap-3">
            {isHost ? (
              <>
                <Button
                  onClick={onStart}
                  disabled={!!blocker}
                  loading={starting}
                  fullWidth
                  icon={<Play className="size-6" fill="currentColor" aria-hidden />}
                  aria-describedby={blocker ? 'start-blocker' : undefined}
                >
                  Start Game
                </Button>
                {blocker ? (
                  <p id="start-blocker" className="text-center text-sm font-semibold text-warn">
                    {blocker}
                  </p>
                ) : null}
              </>
            ) : (
              <div
                role="status"
                className="flex items-center justify-center gap-2 rounded-3xl border border-line bg-glass p-4 text-center font-bold"
              >
                <Hourglass className="size-5 shrink-0 animate-pulse text-sun" aria-hidden />
                {connected < MIN_PLAYERS
                  ? `Waiting for more players (${connected}/${MIN_PLAYERS} minimum)…`
                  : `Waiting for ${playerName(room.players, room.hostId)} to start the game…`}
              </div>
            )}
            <Button variant="danger" size="md" onClick={onLeave} icon={<LogOut className="size-5" aria-hidden />}>
              Leave Room
            </Button>
          </div>
        </div>
        <Card
          title="Players"
          action={
            <span className="font-bold text-fg-muted" aria-label={`${connected} of ${MAX_PLAYERS} players`}>
              <span className="font-display text-xl font-extrabold text-fg">{connected}</span> / {MAX_PLAYERS}
            </span>
          }
          className="lg:col-start-1 lg:row-start-2"
        >
          <PlayerGrid players={room.players} selfId={selfId} />
        </Card>
      </div>
    </PageShell>
  );
}
