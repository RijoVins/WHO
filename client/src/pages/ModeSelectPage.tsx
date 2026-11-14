import type { GameMode } from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { ModeCard } from '../components/ModeCard';

interface ModeSelectPageProps {
  selected: GameMode | null;
  onSelect: (mode: GameMode) => void;
  onBack: () => void;
}

export function ModeSelectPage({ selected, onSelect, onBack }: ModeSelectPageProps) {
  return (
    <PageShell
      width="medium"
      title="Pick a game mode"
      subtitle="Everyone plays the same mode. You can change it any time before the game starts."
      back={{ onClick: onBack, label: 'Back to lobby' }}
    >
      <div role="radiogroup" aria-label="Game mode" className="flex flex-col gap-5 sm:flex-row">
        <ModeCard mode="celebrity" selected={selected === 'celebrity'} onSelect={() => onSelect('celebrity')} />
        <ModeCard mode="friends" selected={selected === 'friends'} onSelect={() => onSelect('friends')} />
      </div>
    </PageShell>
  );
}
