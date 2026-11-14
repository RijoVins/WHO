import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GameplayPage } from './GameplayPage';
import type { GameplayPageProps } from './GameplayPage';
import { makePrompt, makeRoom, SELF_ID } from '../dev/fixtures';
import { renderWithRouter } from '../test/render';

function props(over: Partial<GameplayPageProps> & Pick<GameplayPageProps, 'room'>): GameplayPageProps {
  return {
    selfId: SELF_ID,
    prompt: null,
    myGuess: { attempts: 0, remaining: 5, correct: false, lastGuess: null },
    micStatus: 'off',
    micMuted: false,
    voiceStatus: 'connected',
    audioBlocked: false,
    onSubmitGuess: vi.fn(),
    onToggleMute: vi.fn(),
    onRetryMic: vi.fn(),
    onRetryVoice: vi.fn(),
    onEnableAudio: vi.fn(),
    onLeave: vi.fn(),
    ...over,
  };
}

describe('GameplayPage', () => {
  it('shows the secret prompt to the performer', () => {
    const room = makeRoom({ players: 5, selfIsHost: true, selfIsPerformer: true, mode: 'celebrity', phase: 'performing' });
    renderWithRouter(<GameplayPage {...props({ room, prompt: makePrompt('celebrity', room), myGuess: null, micStatus: 'live' })} />);
    expect(screen.getByText('Thalapathy Vijay')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Photo of Thalapathy Vijay' })).toHaveAttribute('src', '/images/celebrities/vijay.jpg');
    expect(screen.queryByLabelText('Your guess')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /mute mic/i })).toBeInTheDocument();
  });

  it('shows guessers the guess form and no prompt or photo', async () => {
    const room = makeRoom({ players: 5, selfIsHost: false, selfIsPerformer: false, mode: 'celebrity', phase: 'performing' });
    const onSubmitGuess = vi.fn();
    renderWithRouter(<GameplayPage {...props({ room, onSubmitGuess })} />);
    expect(screen.queryByText(/top secret/i)).not.toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /photo of/i })).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Your guess'), '  tom   hanks ');
    await userEvent.click(screen.getByRole('button', { name: /submit guess/i }));
    expect(onSubmitGuess).toHaveBeenCalledWith('tom hanks');
  });

  it('blocks empty guesses locally', async () => {
    const room = makeRoom({ players: 5, selfIsHost: false, selfIsPerformer: false, mode: 'celebrity', phase: 'performing' });
    const onSubmitGuess = vi.fn();
    renderWithRouter(<GameplayPage {...props({ room, onSubmitGuess })} />);
    await userEvent.click(screen.getByRole('button', { name: /submit guess/i }));
    expect(screen.getByText('Type a guess first.')).toBeInTheDocument();
    expect(onSubmitGuess).not.toHaveBeenCalled();
  });

  it('in big Friends rooms, shows name chips only for what is typed', async () => {
    const room = makeRoom({ players: 60, selfIsHost: false, selfIsPerformer: false, mode: 'friends', phase: 'performing' });
    renderWithRouter(<GameplayPage {...props({ room })} />);
    const chips = () => screen.queryAllByRole('button', { pressed: false }).filter((b) => b.closest('[aria-label="Player names"]'));
    expect(chips()).toHaveLength(0);
    await userEvent.type(screen.getByLabelText('Your guess'), 'mei');
    expect(chips().map((c) => c.textContent)).toEqual(['Mei']);
  });

  it('lets the impersonated player pick themselves in Friends Mode', () => {
    const room = makeRoom({ players: 5, selfIsHost: false, selfIsPerformer: false, mode: 'friends', phase: 'performing' });
    renderWithRouter(<GameplayPage {...props({ room })} />);
    expect(screen.getByRole('button', { name: 'Sam (me)' })).toBeInTheDocument();
    // The performer (Diego) is never a candidate.
    expect(screen.queryByRole('button', { name: 'Diego' })).not.toBeInTheDocument();
  });

  it('shows the locked-in state after a correct guess', () => {
    const room = makeRoom({ players: 5, selfIsHost: false, selfIsPerformer: false, mode: 'celebrity', phase: 'guessing' });
    renderWithRouter(<GameplayPage {...props({ room, myGuess: { attempts: 1, remaining: 5, correct: true, lastGuess: 'x' } })} />);
    expect(screen.getByText('YOU GOT IT!')).toBeInTheDocument();
    expect(screen.queryByLabelText('Your guess')).not.toBeInTheDocument();
  });
});
