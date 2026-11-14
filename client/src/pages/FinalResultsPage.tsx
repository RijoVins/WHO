import { LogOut, RotateCcw, Users } from 'lucide-react';
import type { FinalRanking, FinalResult, RoomState } from '@ib/shared';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { GameButton, IconButton } from '../components/GameButton';
import { Leaderboard } from '../components/Leaderboard';
import { Character } from '../components/Character';
import { Confetti } from '../components/Confetti';
import { Rays } from '../components/Rays';
import { cn } from '../utils/cn';

interface FinalResultsPageProps {
  room: RoomState;
  selfId: string;
  final: FinalResult;
  busy?: boolean;
  onPlayAgain: () => void;
  onReturnToLobby: () => void;
  onLeave: () => void;
}

export function FinalResultsPage({ room, selfId, final, busy, onPlayAgain, onReturnToLobby, onLeave }: FinalResultsPageProps) {
  const isHost = room.hostId === selfId;
  const winners = final.rankings.filter((r) => final.winnerIds.includes(r.playerId));
  const tie = winners.length > 1;
  const youWon = final.winnerIds.includes(selfId);
  // Use the final snapshot so players who left mid-game still appear.
  const entries = final.rankings.map((r) => ({
    id: r.playerId,
    name: r.name,
    score: r.score,
    connected: room.players.find((p) => p.id === r.playerId)?.connected ?? false,
  }));
  const podium = final.rankings.slice(0, 3);

  return (
    <>
      <Confetti />
      <Screen width="wide" right={<IconButton label="Leave room" color="danger" onClick={onLeave} icon={<LogOut className="size-5" strokeWidth={3} />} />}>
        <section className="relative isolate flex flex-col items-center gap-2 text-center">
          <Rays color="#ff3d8b" />
          <h1
            className="animate-stamp font-title text-[clamp(3rem,13vw,6.5rem)] leading-none text-gold text-outline"
            style={{ textShadow: '0 6px 0 var(--color-pink-deep), 0 11px 0 var(--color-ink)' }}
          >
            {tie ? 'IT’S A TIE!' : 'WINNER!'}
          </h1>
          <p className="animate-rise font-display text-2xl uppercase [animation-delay:300ms]">
            {winners.map((w) => w.name).join(' & ')}
            {youWon ? <span className="text-lime"> — that’s you!</span> : null}
          </p>
        </section>

        <Podium podium={podium} winnerIds={final.winnerIds} />

        <div className="grid items-start gap-6 lg:grid-cols-[3fr_2fr]">
          <Panel label="Final rankings" labelColor="gold">
            <Leaderboard players={entries} selfId={selfId} />
          </Panel>
          <div className="flex flex-col gap-4 lg:sticky lg:top-5">
            {isHost ? (
              <>
                <GameButton color="lime" size="xl" fullWidth shine onClick={onPlayAgain} loading={busy} icon={<RotateCcw className="size-7" strokeWidth={3.5} aria-hidden />}>
                  Play Again
                </GameButton>
                <GameButton color="cyan" fullWidth onClick={onReturnToLobby} disabled={busy} icon={<Users className="size-6" strokeWidth={3} aria-hidden />}>
                  Return to Lobby
                </GameButton>
              </>
            ) : (
              <p role="status" className="panel p-4 text-center font-display text-xl uppercase">
                Waiting for the host to play again…
              </p>
            )}
          </div>
        </div>
      </Screen>
    </>
  );
}

/** 2nd · 1st · 3rd blocks with the characters standing on top. */
function Podium({ podium, winnerIds }: { podium: FinalRanking[]; winnerIds: string[] }) {
  const order = [podium[1], podium[0], podium[2]].filter(Boolean) as FinalRanking[];
  const height = (r: FinalRanking) => (r.rank === 1 ? 'h-32 sm:h-40' : r.rank === 2 ? 'h-24 sm:h-28' : 'h-16 sm:h-20');
  const color = (r: FinalRanking) => (r.rank === 1 ? 'bg-gold' : r.rank === 2 ? 'bg-[#dfe3f0]' : 'bg-[#f0a46a]');
  return (
    <div className="mx-auto flex w-full max-w-xl items-end justify-center gap-2 sm:gap-4" aria-label="Podium">
      {order.map((r, i) => (
        <div key={r.playerId} className="flex min-w-0 flex-1 animate-rise flex-col items-center" style={{ animationDelay: `${400 + i * 150}ms` }}>
          <Character id={r.playerId} size={r.rank === 1 ? 92 : 68} className={cn(winnerIds.includes(r.playerId) && 'animate-bob')} />
          <span className="mt-1 max-w-full truncate font-display text-lg">{r.name}</span>
          <span className="font-title text-xl text-gold text-outline-thin">{r.score}</span>
          <div
            className={cn(
              'mt-1 grid w-full place-items-center rounded-t-2xl border-[3px] border-b-0 border-ink font-title text-4xl text-on-bright shadow-[inset_0_-10px_0_rgb(0_0_0/0.15)]',
              height(r),
              color(r),
            )}
          >
            {r.rank}
          </div>
        </div>
      ))}
    </div>
  );
}
