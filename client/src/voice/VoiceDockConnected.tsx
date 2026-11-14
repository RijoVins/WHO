import { useGame } from '../context/game';
import { VoiceDock } from '../components/VoiceDock';
import { useVoice } from './voice';

/** The voice dock wired to the live voice connection. */
export function VoiceDockConnected() {
  const v = useVoice();
  const { selfId } = useGame();
  return (
    <VoiceDock
      status={v.status}
      mic={v.mic}
      message={v.message}
      audioBlocked={v.audioBlocked}
      selfSpeaking={!!selfId && v.speaking.has(selfId)}
      onToggleMic={() => void v.toggleMic()}
      onEnableAudio={() => void v.enableAudio()}
      onRetry={v.retry}
    />
  );
}
