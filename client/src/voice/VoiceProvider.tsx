import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ConnectionState, DisconnectReason, Room, RoomEvent, Track, TrackEvent } from 'livekit-client';
import type { LocalTrackPublication, Participant, RemoteTrack } from 'livekit-client';
import { useGame } from '../context/game';
import { request } from '../services/socket';
import { VoiceContext } from './voice';
import type { VoiceState } from './voice';
import type { MicStatus, VoiceStatus } from '../types/voice';
import { describeMicError } from './micErrors';
import { resolveVoiceUrl } from './url';

const RETRY_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];


/**
 * Keeps this tab in its game room's voice chat. One LiveKit connection lives
 * for as long as the player holds a seat — across lobby, rounds, results and
 * Play Again — and is closed when they leave. Audio only: no camera, ever.
 */
export function VoiceProvider({ children }: { children: ReactNode }) {
  const game = useGame();
  // Voice follows the seat: a room code + player id the server has confirmed.
  const seat = game.room && game.selfId ? `${game.room.code}:${game.selfId}` : null;

  const [status, setStatus] = useState<VoiceStatus>('disconnected');
  const [mic, setMic] = useState<MicStatus>('off');
  const [message, setMessage] = useState<string | null>(null);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [speaking, setSpeaking] = useState<ReadonlySet<string>>(new Set());
  const [micOn, setMicOn] = useState<ReadonlySet<string>>(new Set());
  const [attempt, setAttempt] = useState(0);

  const roomRef = useRef<Room | null>(null);
  const audioHost = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!seat) return;
    let cancelled = false;
    let retryTimer: number | undefined;
    let failures = 0;

    const room = new Room({
      adaptiveStream: false,
      dynacast: false,
      audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      // Muting releases the microphone, so the browser's "mic in use" light goes off.
      publishDefaults: { stopMicTrackOnMute: true, dtx: true, red: true },
      disconnectOnPageLeave: true,
    });
    roomRef.current = room;

    const refreshMicOn = () => {
      const ids = new Set<string>();
      const all: Participant[] = [room.localParticipant, ...room.remoteParticipants.values()];
      for (const p of all) if (p.isMicrophoneEnabled) ids.add(p.identity);
      setMicOn(ids);
    };
    const host = () => {
      if (!audioHost.current) {
        const div = document.createElement('div');
        div.hidden = true;
        div.dataset.voiceAudio = '';
        document.body.appendChild(div);
        audioHost.current = div;
      }
      return audioHost.current;
    };

    room
      .on(RoomEvent.ConnectionStateChanged, (s) => {
        if (s === ConnectionState.Connected) setStatus('connected');
        else if (s === ConnectionState.Reconnecting || s === ConnectionState.SignalReconnecting) setStatus('reconnecting');
        else if (s === ConnectionState.Connecting) setStatus('connecting');
      })
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => setSpeaking(new Set(speakers.map((p) => p.identity))))
      .on(RoomEvent.AudioPlaybackStatusChanged, () => setAudioBlocked(!room.canPlaybackAudio))
      .on(RoomEvent.TrackSubscribed, (track: RemoteTrack) => {
        if (track.kind === Track.Kind.Audio) host().appendChild(track.attach());
        refreshMicOn();
      })
      .on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack) => {
        track.detach().forEach((el) => el.remove());
        refreshMicOn();
      })
      .on(RoomEvent.TrackMuted, refreshMicOn)
      .on(RoomEvent.TrackUnmuted, refreshMicOn)
      .on(RoomEvent.TrackPublished, refreshMicOn)
      .on(RoomEvent.TrackUnpublished, refreshMicOn)
      .on(RoomEvent.ParticipantConnected, refreshMicOn)
      .on(RoomEvent.ParticipantDisconnected, refreshMicOn)
      .on(RoomEvent.LocalTrackPublished, (pub: LocalTrackPublication) => {
        refreshMicOn();
        // Mic unplugged or taken away by the OS: show it instead of failing silently.
        pub.track?.once(TrackEvent.Ended, () => {
          setMic('off');
          setMessage('Your microphone disconnected. Plug it back in and tap the mic.');
          void room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
          refreshMicOn();
        });
      })
      .on(RoomEvent.LocalTrackUnpublished, refreshMicOn)
      .on(RoomEvent.Disconnected, (reason) => {
        setSpeaking(new Set());
        setMicOn(new Set());
        setMic('off');
        if (cancelled || reason === DisconnectReason.CLIENT_INITIATED) return;
        if (reason === DisconnectReason.DUPLICATE_IDENTITY) {
          // The same player joined voice from another tab; that tab keeps the voice.
          setStatus('disconnected');
          setMessage('Voice moved to your other tab or window.');
          return;
        }
        scheduleRetry('Voice chat dropped. Reconnecting…');
      });

    const scheduleRetry = (why: string) => {
      if (cancelled) return;
      const delay = RETRY_DELAYS_MS[Math.min(failures, RETRY_DELAYS_MS.length - 1)];
      failures += 1;
      setStatus(failures > 2 ? 'failed' : 'reconnecting');
      setMessage(why);
      retryTimer = window.setTimeout(() => void connect(), delay);
    };

    const connect = async () => {
      if (cancelled) return;
      setStatus('connecting');
      const access = await request('voice_token');
      if (cancelled) return;
      if (!access.ok) {
        if (access.code === 'VOICE_UNAVAILABLE') {
          setStatus('failed');
          setMessage(access.error);
          return; // not configured: retrying won't help
        }
        return scheduleRetry(access.error);
      }
      try {
        await room.connect(resolveVoiceUrl(access.url), access.token, { autoSubscribe: true });
        if (cancelled) return;
        failures = 0;
        setMessage(null);
        setStatus('connected');
        setAudioBlocked(!room.canPlaybackAudio);
        refreshMicOn();
      } catch {
        if (!cancelled) scheduleRetry("Can't reach the voice server. Retrying…");
      }
    };

    void connect();
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
      roomRef.current = null;
      void room.disconnect();
      audioHost.current?.replaceChildren();
      setStatus('disconnected');
      setMic('off');
      setSpeaking(new Set());
      setMicOn(new Set());
      setAudioBlocked(false);
      setMessage(null);
    };
  }, [seat, attempt]);

  // Tidy up the hidden audio element container when the app unmounts.
  useEffect(() => () => audioHost.current?.remove(), []);

  const toggleMic = useCallback(async () => {
    const room = roomRef.current;
    if (!room || room.state !== ConnectionState.Connected) {
      setMessage('Voice is still connecting. Try again in a moment.');
      return;
    }
    const turnOn = !room.localParticipant.isMicrophoneEnabled;
    // A tap is also the gesture browsers need before they allow audio playback.
    if (!room.canPlaybackAudio) await room.startAudio().catch(() => {});
    if (!turnOn) {
      await room.localParticipant.setMicrophoneEnabled(false).catch(() => {});
      setMic('off');
      return;
    }
    setMic('requesting');
    setMessage(null);
    try {
      await room.localParticipant.setMicrophoneEnabled(true);
      setMic('live');
    } catch (e) {
      const d = describeMicError(e);
      setMic(d.mic);
      setMessage(d.message);
    }
  }, []);

  const enableAudio = useCallback(async () => {
    const room = roomRef.current;
    if (!room) return;
    await room.startAudio().catch(() => {});
    setAudioBlocked(!room.canPlaybackAudio);
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo<VoiceState>(
    () => ({ status, mic, message, audioBlocked, speaking, micOn, toggleMic, enableAudio, retry }),
    [status, mic, message, audioBlocked, speaking, micOn, toggleMic, enableAudio, retry],
  );
  return <VoiceContext.Provider value={value}>{children}</VoiceContext.Provider>;
}
