import { createContext, useContext } from 'react';
import type { MicStatus, VoiceStatus } from '../types/voice';

export interface VoiceState {
  /** Connection to this room's voice chat. */
  status: VoiceStatus;
  /** This device's microphone. */
  mic: MicStatus;
  /** A readable explanation when something needs the player's attention. */
  message: string | null;
  /** The browser is blocking playback until the player taps something. */
  audioBlocked: boolean;
  /** Player ids currently speaking (from LiveKit audio levels). */
  speaking: ReadonlySet<string>;
  /** Player ids whose microphone is on. */
  micOn: ReadonlySet<string>;
  /** Turn this device's microphone on or off. */
  toggleMic: () => Promise<void>;
  /** Unlock audio playback after a browser block (must run from a tap). */
  enableAudio: () => Promise<void>;
  /** Try connecting to voice again after a failure. */
  retry: () => void;
}

export const VoiceContext = createContext<VoiceState | null>(null);

export function useVoice(): VoiceState {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error('useVoice must be used inside <VoiceProvider>');
  return ctx;
}
