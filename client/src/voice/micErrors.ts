import { MediaDeviceFailure } from 'livekit-client';
import type { MicStatus } from '../types/voice';

/** Turn a getUserMedia / LiveKit device error into a mic state and a message people understand. */
export function describeMicError(error: unknown): { mic: MicStatus; message: string } {
  if (typeof window !== 'undefined' && (!window.isSecureContext || !navigator.mediaDevices)) {
    return {
      mic: 'unavailable',
      message: 'Microphones only work on a secure page. Open the game over HTTPS (or on localhost).',
    };
  }
  switch (MediaDeviceFailure.getFailure(error)) {
    case MediaDeviceFailure.PermissionDenied:
      return {
        mic: 'denied',
        message: 'Microphone blocked. Allow it from the lock/site icon in your address bar, then tap the mic again.',
      };
    case MediaDeviceFailure.NotFound:
      return { mic: 'unavailable', message: 'No microphone found. Plug one in or switch devices, then tap the mic.' };
    case MediaDeviceFailure.DeviceInUse:
      return { mic: 'unavailable', message: 'Your microphone is busy in another app. Close it there, then tap the mic.' };
    default:
      return { mic: 'unavailable', message: "Couldn't start your microphone. Tap the mic to try again." };
  }
}
