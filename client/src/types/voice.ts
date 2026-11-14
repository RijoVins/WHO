/** This device's microphone state. */
export type MicStatus =
  | 'off' // not performing; mic not captured
  | 'requesting' // waiting for the browser permission prompt
  | 'live' // performing and publishing audio
  | 'denied' // the user or browser blocked the mic
  | 'unavailable'; // no mic found, or the page isn't on HTTPS/localhost

/** Connection to the voice room. */
export type VoiceStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed';
