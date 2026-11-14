import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { LobbyPage } from './LobbyPage';
import { startBlocker } from '../utils/room';
import { makeRoom, SELF_ID } from '../dev/fixtures';
import { renderWithRouter } from '../test/render';

const handlers = {
  onChangeMode: vi.fn(),
  onChangeRounds: vi.fn(),
  onStart: vi.fn(),
  onLeave: vi.fn(),
};

describe('startBlocker', () => {
  it('needs 3 connected players and a mode', () => {
    const two = makeRoom({ players: 2, selfIsHost: true, selfIsPerformer: false, mode: 'celebrity', phase: 'lobby' });
    expect(startBlocker(two)).toMatch(/1 more player/);
    const noMode = makeRoom({ players: 3, selfIsHost: true, selfIsPerformer: false, mode: null, phase: 'lobby' });
    expect(startBlocker(noMode)).toMatch(/Choose a game mode/);
    const ready = makeRoom({ players: 3, selfIsHost: true, selfIsPerformer: false, mode: 'friends', phase: 'lobby' });
    expect(startBlocker(ready)).toBeNull();
  });

  it('does not count disconnected players', () => {
    // In fixtures, player index 7 is disconnected; 8 players → 7 connected.
    const room = makeRoom({ players: 8, selfIsHost: true, selfIsPerformer: false, mode: 'celebrity', phase: 'lobby' });
    room.players = room.players.slice(0, 3).map((p, i) => ({ ...p, connected: i < 2 }));
    expect(startBlocker(room)).toMatch(/1 more player/);
  });
});

describe('LobbyPage', () => {
  it('lets the host start only when ready', () => {
    const room = makeRoom({ players: 2, selfIsHost: true, selfIsPerformer: false, mode: 'celebrity', phase: 'lobby' });
    renderWithRouter(<LobbyPage room={room} selfId={SELF_ID} {...handlers} />);
    expect(screen.getByRole('button', { name: /start game/i })).toBeDisabled();
    expect(screen.getByText(/1 more player/)).toBeInTheDocument();
  });

  it('shows guests a waiting message instead of Start', () => {
    const room = makeRoom({ players: 5, selfIsHost: false, selfIsPerformer: false, mode: 'celebrity', phase: 'lobby' });
    renderWithRouter(<LobbyPage room={room} selfId={SELF_ID} {...handlers} />);
    expect(screen.queryByRole('button', { name: /start game/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('radio', { name: /friends/i })).not.toBeInTheDocument();
    expect(screen.getByText(/Waiting for Priya to start/)).toBeInTheDocument();
  });
});
