import { LogOut, RotateCcw, Trophy, Users } from 'lucide-react';
import type { FinalResult, RoomState } from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Leaderboard } from '../components/Leaderboard';
import { PlayerAvatar } from '../components/PlayerAvatar';

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
  // Use the final snapshot so players who left mid-game still appear in the rankings.
  const entries = final.rankings.map((r) => ({
    id: r.playerId,
    name: r.name,
    score: r.score,
    connected: room.players.find((p) => p.id === r.playerId)?.connected ?? false,
  }));

  return (
    <PageShell width="medium">
      <section className="relative flex animate-pop-in flex-col items-center gap-3 overflow-hidden rounded-[2rem] bg-gradient-to-br from-sun via-pink to-violet p-8 text-center text-on-bright sm:p-10">
        <Trophy className="size-16 animate-float sm:size-20" strokeWidth={2.2} aria-hidden />
        <p className="font-display text-lg font-extrabold tracking-[0.25em]">{tie ? 'IT’S A TIE!' : 'WINNER'}</p>
        <ul className="flex flex-wrap justify-center gap-6">
          {winners.map((w) => (
            <li key={w.playerId} className="flex max-w-48 flex-col items-center gap-2">
              <PlayerAvatar id={w.playerId} name={w.name} size="xl" ring />
              <span className="max-w-full truncate font-display text-3xl font-extrabold">{w.name}</span>
            </li>
          ))}
        </ul>
        <p className="font-display text-xl font-bold">{winners[0]?.score ?? 0} points</p>
        {youWon ? <p className="font-bold">That’s you! 🎉</p> : null}
      </section>

      <Card title="Final rankings">
        <Leaderboard players={entries} selfId={selfId} />
      </Card>

      <div className="mx-auto flex w-full max-w-md flex-col gap-3">
        {isHost ? (
          <>
            <Button onClick={onPlayAgain} loading={busy} icon={<RotateCcw className="size-5" aria-hidden />}>
              Play Again
            </Button>
            <Button variant="teal" onClick={onReturnToLobby} disabled={busy} icon={<Users className="size-5" aria-hidden />}>
              Return to Lobby
            </Button>
          </>
        ) : (
          <p className="rounded-3xl border border-line bg-glass p-4 text-center font-bold text-fg-muted" role="status">
            Waiting for the host to play again or return to the lobby…
          </p>
        )}
        <Button variant="danger" size="md" onClick={onLeave} icon={<LogOut className="size-5" aria-hidden />}>
          Leave Room
        </Button>
      </div>
    </PageShell>
  );
}
