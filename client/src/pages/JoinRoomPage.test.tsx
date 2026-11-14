import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { JoinRoomPage } from './JoinRoomPage';
import { CreateRoomPage } from './CreateRoomPage';
import { renderWithRouter } from '../test/render';

describe('JoinRoomPage', () => {
  it('shows validation errors and does not call the server', async () => {
    const joinRoom = vi.fn();
    renderWithRouter(<JoinRoomPage joinRoom={joinRoom} />, '/join');
    await userEvent.click(screen.getByRole('button', { name: /join room/i }));
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument();
    expect(screen.getByText('Enter a room code.')).toBeInTheDocument();
    expect(joinRoom).not.toHaveBeenCalled();
  });

  it('rejects codes with look-alike characters', async () => {
    renderWithRouter(<JoinRoomPage joinRoom={vi.fn()} />, '/join');
    await userEvent.type(screen.getByLabelText('Your name'), 'Ana');
    await userEvent.type(screen.getByLabelText('Room code'), 'abcd0');
    await userEvent.click(screen.getByRole('button', { name: /join room/i }));
    expect(await screen.findByText(/never contain "0"/)).toBeInTheDocument();
  });

  it('prefills the code from an invite link and sends normalized values', async () => {
    const joinRoom = vi.fn().mockResolvedValue({ ok: true });
    renderWithRouter(<JoinRoomPage joinRoom={joinRoom} />, '/join?code=k7qx4');
    expect(screen.getByLabelText('Room code')).toHaveValue('K7QX4');
    await userEvent.type(screen.getByLabelText('Your name'), '  Ana  ');
    await userEvent.click(screen.getByRole('button', { name: /join room/i }));
    expect(joinRoom).toHaveBeenCalledWith('Ana', 'K7QX4');
  });

  it('shows the server error', async () => {
    const joinRoom = vi.fn().mockResolvedValue({ ok: false, error: 'This room is full (60 players).' });
    renderWithRouter(<JoinRoomPage joinRoom={joinRoom} />, '/join?code=K7QX4');
    await userEvent.type(screen.getByLabelText('Your name'), 'Ana');
    await userEvent.click(screen.getByRole('button', { name: /join room/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This room is full (60 players).');
  });
});

describe('CreateRoomPage', () => {
  it('requires a mode before creating', async () => {
    const createRoom = vi.fn();
    renderWithRouter(<CreateRoomPage createRoom={createRoom} />, '/create');
    await userEvent.type(screen.getByLabelText('Your name'), 'Sam');
    await userEvent.click(screen.getByRole('button', { name: /create room/i }));
    expect(await screen.findByText('Pick a mode first.')).toBeInTheDocument();
    expect(createRoom).not.toHaveBeenCalled();
    await userEvent.click(screen.getByRole('radio', { name: /friends/i }));
    await userEvent.click(screen.getByRole('button', { name: /create room/i }));
    expect(createRoom).toHaveBeenCalledWith('Sam', 'friends');
  });

  it('uses the mode picked on the main menu, requires a name, then reports server errors', async () => {
    const createRoom = vi.fn().mockResolvedValue({ ok: false, error: "Can't reach the game server." });
    renderWithRouter(<CreateRoomPage createRoom={createRoom} />, '/create', 'celebrity');
    expect(screen.getByRole('radio', { name: /celebrity/i })).toHaveAttribute('aria-checked', 'true');
    const button = screen.getByRole('button', { name: /create room/i });
    await userEvent.click(button);
    expect(await screen.findByText('Enter your name.')).toBeInTheDocument();
    expect(createRoom).not.toHaveBeenCalled();

    await userEvent.type(screen.getByLabelText('Your name'), 'Sam');
    await userEvent.click(button);
    expect(createRoom).toHaveBeenCalledWith('Sam', 'celebrity');
    expect(await screen.findByRole('alert')).toHaveTextContent("Can't reach the game server.");
  });
});
