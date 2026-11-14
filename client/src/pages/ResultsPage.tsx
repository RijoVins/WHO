import { LogOut, Mic, SkipForward } from 'lucide-react';
import type { RoomState, RoundResult } from '@ib/shared';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { GameButton, IconButton } from '../components/GameButton';
import { Leaderboard } from '../components/Leaderboard';
import { Character } from '../components/Character';
import { Rays } from '../components/Rays';
import { useCountdown } from '../hooks/useCountdown';
import { playerName } from '../utils/players';
import { roundDeltas } from '../utils/room';

interface ResultsPageProps {
  room: RoomState;
  selfId: string;
  result: RoundResult;
  serverOffsetMs?: number;
  /** Host only: skip the wait. */
  onNext: () => void;
  onLeave: () => void;
}

export function ResultsPage({ room, selfId, result, serverOffsetMs, onNext, onLeave }: ResultsPageProps) {
  const isHost = room.hostId === selfId;
  const isLast = result.roundNumber >= result.totalRounds;
  const performer = playerName(room.players, result.performerId);
  const deltas = roundDeltas(result);
  const mine = deltas[selfId] ?? 0;
  const secondsLeft = useCountdown(result.nextAt, serverOffsetMs);

  return (
    <Screen width="wide" right={<IconButton label="Leave game" color="danger" onClick={onLeave} icon={<LogOut className="size-5" strokeWidth={3} />} />}>
      {/* The reveal */}
      <section className="relative isolate flex flex-col items-center gap-3 py-4 text-center">
        <Rays />
        <p className="animate-rise font-display text-xl tracking-[0.2em] text-fg-muted uppercase">
          Round {result.roundNumber} · The answer was…
        </p>
        <h1
          className="animate-stamp rounded-[1.75rem] border-[3px] border-ink bg-gold px-6 py-3 font-title text-[clamp(2.4rem,10vw,5rem)] leading-none break-words text-on-bright shadow-[inset_0_-7px_0_var(--color-gold-deep),0_9px_0_var(--color-ink)] [animation-delay:250ms]"
        >
          {result.answer}
        </h1>
        {result.category ? (
          <span className="animate-rise rounded-lg border-[2.5px] border-ink bg-celeb px-3 font-display uppercase [animation-delay:500ms]">
            {result.category}
          </span>
        ) : null}
        <p className="flex animate-rise items-center gap-2 font-display text-xl uppercase [animation-delay:600ms]">
          <Character id={result.performerId} size={40} />
          performed by {result.performerId === selfId ? 'you' : performer}
        </p>
        {mine > 0 ? (
          <p className="animate-pop-in rounded-2xl border-[3px] border-ink bg-lime px-5 py-2 font-title text-3xl text-on-bright shadow-[0_5px_0_var(--color-ink)] [animation-delay:800ms]">
            +{mine} FOR YOU!
          </p>
        ) : null}
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        <Panel label="Got it right" labelColor="lime">
          {result.awards.length === 0 ? (
            <p className="py-2 font-display text-xl text-fg-muted uppercase">Nobody got it this time!</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {result.awards.map((a, i) => {
                const name = playerName(room.players, a.playerId);
                return (
                  <li
                    key={a.playerId}
                    style={{ animationDelay: `${Math.min(i, 12) * 60}ms` }}
                    className="flex animate-rise items-center gap-3 rounded-2xl border-[3px] border-ink bg-night-600 py-1.5 pr-3 pl-1.5 shadow-[0_4px_0_var(--color-ink)]"
                  >
                    <span className="w-7 text-center font-title text-xl text-fg-faint">{i + 1}</span>
                    <Character id={a.playerId} size={36} />
                    <span className="min-w-0 flex-1 truncate font-display text-lg">
                      {name}
                      {a.playerId === selfId ? <span className="ml-1 text-sm text-cyan">(you)</span> : null}
                    </span>
                    {a.firstCorrect ? (
                      <span className="-rotate-3 rounded-lg border-2 border-ink bg-pink px-1.5 font-display text-xs text-fg uppercase">First!</span>
                    ) : null}
                    <span className="font-title text-xl text-gold text-outline-thin">+{a.points}</span>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border-[3px] border-ink bg-pink/80 py-2 pr-3 pl-3 shadow-[0_4px_0_var(--color-ink)]">
            <Mic className="size-6" strokeWidth={3} aria-hidden />
            <span className="min-w-0 flex-1 truncate font-display text-lg">Performer: {performer}</span>
            {result.everyoneGuessed ? (
              <span className="rounded-lg border-2 border-ink bg-gold px-1.5 font-display text-xs text-on-bright uppercase">Everyone!</span>
            ) : null}
            <span className="font-title text-xl text-fg text-outline-thin">+{result.performerPoints}</span>
          </div>
        </Panel>

        <Panel label="Scores" labelColor="gold">
          <Leaderboard players={room.players} selfId={selfId} deltas={deltas} limit={10} />
        </Panel>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-3">
        {secondsLeft !== null ? (
          <p className="font-display text-xl text-fg-muted uppercase" aria-live="polite">
            {isLast ? 'Final results' : 'Next round'} in <span className="font-title text-2xl text-gold">{secondsLeft}</span>
          </p>
        ) : null}
        {isHost ? (
          <GameButton color="gold" fullWidth onClick={onNext} icon={<SkipForward className="size-6" strokeWidth={3} aria-hidden />}>
            {isLast ? 'Show winner now' : 'Next round now'}
          </GameButton>
        ) : null}
      </div>
    </Screen>
  );
}
