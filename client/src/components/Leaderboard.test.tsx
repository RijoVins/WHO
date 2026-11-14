import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Leaderboard } from './Leaderboard';

const players = Array.from({ length: 15 }, (_, i) => ({ id: `p${i}`, name: `P${String(i).padStart(2, '0')}`, score: 1000 - i * 10 }));

describe('Leaderboard', () => {
  it('limits rows but keeps you visible and counts the rest', () => {
    render(<Leaderboard players={players} selfId="p14" limit={10} />);
    expect(screen.getByText('P14')).toBeInTheDocument();
    expect(screen.queryByText('P10')).not.toBeInTheDocument();
    expect(screen.getByText('+ 4 more players')).toBeInTheDocument();
  });

  it('shows round deltas', () => {
    render(<Leaderboard players={players.slice(0, 3)} deltas={{ p1: 150 }} />);
    expect(screen.getByText('+150')).toBeInTheDocument();
  });
});
