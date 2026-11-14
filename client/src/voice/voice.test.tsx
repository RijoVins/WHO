import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { resolveVoiceUrl } from './url';
import { describeMicError } from './micErrors';
import { VoiceDock } from '../components/VoiceDock';
import type { VoiceDockProps } from '../components/VoiceDock';

describe('resolveVoiceUrl', () => {
  it('keeps absolute URLs and turns paths into same-origin ws/wss URLs', () => {
    expect(resolveVoiceUrl('wss://voice.example.com', { protocol: 'https:', host: 'x' })).toBe('wss://voice.example.com');
    expect(resolveVoiceUrl('/livekit', { protocol: 'http:', host: '192.168.1.5:5173' })).toBe('ws://192.168.1.5:5173/livekit');
    expect(resolveVoiceUrl('/livekit', { protocol: 'https:', host: 'play.example.com' })).toBe('wss://play.example.com/livekit');
  });
});

describe('describeMicError', () => {
  const err = (name: string) => Object.assign(new Error(name), { name });
  it('asks for HTTPS on insecure pages', () => {
    expect(describeMicError(err('NotAllowedError'))).toMatchObject({ mic: 'unavailable', message: expect.stringMatching(/HTTPS/) });
  });
  it('explains denied, missing and busy microphones', () => {
    // Pretend to be a secure page with a microphone API (jsdom has neither).
    Object.defineProperty(window, 'isSecureContext', { value: true, configurable: true });
    Object.defineProperty(navigator, 'mediaDevices', { value: {}, configurable: true });
    expect(describeMicError(err('NotAllowedError'))).toMatchObject({ mic: 'denied' });
    expect(describeMicError(err('NotFoundError'))).toMatchObject({ mic: 'unavailable', message: expect.stringMatching(/no microphone/i) });
    expect(describeMicError(err('NotReadableError'))).toMatchObject({ mic: 'unavailable', message: expect.stringMatching(/another app/i) });
  });
});

function dock(over: Partial<VoiceDockProps> = {}) {
  const props: VoiceDockProps = {
    status: 'connected',
    mic: 'off',
    message: null,
    audioBlocked: false,
    selfSpeaking: false,
    onToggleMic: vi.fn(),
    onEnableAudio: vi.fn(),
    onRetry: vi.fn(),
    ...over,
  };
  render(<VoiceDock {...props} />);
  return props;
}

describe('VoiceDock', () => {
  it('offers to turn the mic on, then to mute it', async () => {
    const p = dock();
    await userEvent.click(screen.getByRole('button', { name: /turn on mic/i }));
    expect(p.onToggleMic).toHaveBeenCalled();
  });

  it('shows Mute while live', () => {
    dock({ mic: 'live' });
    expect(screen.getByRole('button', { name: /mute/i })).toHaveAttribute('aria-pressed', 'true');
  });

  it('disables the mic until voice is connected', () => {
    dock({ status: 'connecting' });
    expect(screen.getByRole('button', { name: /turn on mic/i })).toBeDisabled();
  });

  it('shows "tap to hear" when the browser blocks audio', async () => {
    const p = dock({ audioBlocked: true });
    await userEvent.click(screen.getByRole('button', { name: /tap to hear/i }));
    expect(p.onEnableAudio).toHaveBeenCalled();
  });

  it('shows the problem and a retry when voice failed', async () => {
    const p = dock({ status: 'failed', message: "Can't reach the voice server." });
    expect(screen.getByText("Can't reach the voice server.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /retry/i }));
    expect(p.onRetry).toHaveBeenCalled();
  });

  it('shows the permission problem with a way to try again', () => {
    dock({ mic: 'denied', message: 'Microphone blocked.' });
    expect(screen.getByRole('button', { name: /try mic again/i })).toBeInTheDocument();
  });
});
