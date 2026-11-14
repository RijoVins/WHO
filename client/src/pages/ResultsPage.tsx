import { LogOut, Mic, SkipForward, Sparkles } from 'lucide-react';
import type { RoomState, RoundResult } from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Leaderboard } from '../components/Leaderboard';
import { PlayerAvatar } from '../components/PlayerAvatar';
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
    <PageShell width="wide">
      <section className="relative flex animate-pop-in flex-col items-center gap-2 overflow-hidden rounded-[2rem] bg-gradient-to-br from-pink to-violet p-8 text-center sm:p-10">
        <span className="pointer-events-none absolute -top-16 -left-16 size-56 rounded-full bg-fg/10" />
        <p className="text-xs font-extrabold tracking-[0.15em] text-fg/85 uppercase">
          Round {result.roundNumber} of {result.totalRounds} · The answer was
        </p>
        <h1 className="font-display text-4xl font-extrabold break-words sm:text-6xl">{result.answer}</h1>
        {result.category ? (
          <span className="rounded-full bg-sun px-3 py-0.5 text-sm font-bold text-on-bright">{result.category}</span>
        ) : null}
        <p className="text-lg">performed by {result.performerId === selfId ? 'you' : performer}</p>
        {mine > 0 ? (
          <p className="mt-2 inline-flex animate-pop-in items-center gap-1.5 rounded-full bg-sun px-4 py-2 font-display text-lg font-extrabold text-on-bright">
            <Sparkles className="size-5" aria-hidden /> You earned +{mine}
          </p>
        ) : null}
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card title="Correct guessers">
          {result.awards.length === 0 ? (
            <p className="py-2 text-fg-muted">Nobody got it this time!</p>
          ) : (
            <ol className="flex flex-col gap-2">
              {result.awards.map((a, i) => {
                const name = playerName(room.players, a.playerId);
                return (
                  <li key={a.playerId} className="flex items-center gap-3">
                    <span className="w-5 text-right text-sm font-bold text-fg-faint">{i + 1}</span>
                    <PlayerAvatar id={a.playerId} name={name} size="sm" />
                    <span className="min-w-0 flex-1 truncate font-bold">
                      {name}
                      {a.playerId === selfId ? <span className="font-normal text-fg-muted"> (you)</span> : null}
                    </span>
                    {a.firstCorrect ? (
                      <span className="rounded-md bg-ok px-1.5 py-0.5 text-[10px] font-extrabold text-on-bright">FIRST!</span>
                    ) : null}
                    <span className="min-w-12 text-right font-display font-extrabold text-sun">+{a.points}</span>
                  </li>
                );
              })}
            </ol>
          )}
          <div className="mt-3 flex items-center gap-3 border-t border-line pt-3">
            <Mic className="size-5 text-pink" aria-hidden />
            <span className="min-w-0 flex-1 truncate font-bold">Performer: {performer}</span>
            {result.everyoneGuessed ? (
              <span className="rounded-md bg-ok px-1.5 py-0.5 text-[10px] font-extrabold text-on-bright">EVERYONE!</span>
            ) : null}
            <span className="min-w-12 text-right font-display font-extrabold text-sun">+{result.performerPoints}</span>
          </div>
        </Card>

        <Card title="Leaderboard">
          <Leaderboard players={room.players} selfId={selfId} deltas={deltas} limit={10} />
        </Card>
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {secondsLeft !== null ? (
          <p className="text-center font-bold text-fg-muted" aria-live="polite">
            {isLast ? 'Final results' : 'Next round'} in {secondsLeft}s…
          </p>
        ) : null}
        {isHost ? (
          <Button variant="sun" onClick={onNext} icon={<SkipForward className="size-5" aria-hidden />}>
            {isLast ? 'Show final results now' : 'Start next round now'}
          </Button>
        ) : null}
        <Button variant="danger" size="md" onClick={onLeave} icon={<LogOut className="size-5" aria-hidden />}>
          Leave game
        </Button>
      </div>
    </PageShell>
  );
}
