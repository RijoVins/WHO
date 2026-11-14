import { AlertCircle, Hourglass, LoaderCircle, Mic, MicOff, Radio, RefreshCw, Volume2, WifiOff } from 'lucide-react';
import type { MicStatus, VoiceStatus } from '../types/voice';
import { MicMeter } from './MicMeter';
import { cn } from '../utils/cn';

export interface VoiceDockProps {
  status: VoiceStatus;
  mic: MicStatus;
  message: string | null;
  audioBlocked: boolean;
  /** This player is speaking right now (shows on the mic button). */
  selfSpeaking: boolean;
  onToggleMic: () => void;
  onEnableAudio: () => void;
  onRetry: () => void;
}

const statusLook: Record<VoiceStatus, { label: string; cls: string; icon: React.ReactNode }> = {
  connected: { label: 'Voice on', cls: 'bg-ok text-on-bright', icon: <Radio className="size-4" strokeWidth={3} aria-hidden /> },
  connecting: { label: 'Joining voice…', cls: 'bg-warn text-on-bright', icon: <LoaderCircle className="size-4 animate-spin" strokeWidth={3} aria-hidden /> },
  reconnecting: { label: 'Reconnecting…', cls: 'bg-warn text-on-bright', icon: <RefreshCw className="size-4 animate-spin" strokeWidth={3} aria-hidden /> },
  disconnected: { label: 'Voice off', cls: 'bg-night-600 text-fg-muted', icon: <WifiOff className="size-4" strokeWidth={3} aria-hidden /> },
  failed: { label: 'No voice', cls: 'bg-bad text-fg', icon: <AlertCircle className="size-4" strokeWidth={3} aria-hidden /> },
};

/**
 * Voice controls pinned to the bottom of every in-room screen: connection
 * status, "tap to hear" when the browser blocks audio, and the mic button.
 */
export function VoiceDock({ status, mic, message, audioBlocked, selfSpeaking, onToggleMic, onEnableAudio, onRetry }: VoiceDockProps) {
  const s = statusLook[status];
  const ready = status === 'connected';
  const micLabel =
    mic === 'live' ? 'Mute' : mic === 'requesting' ? 'Allow mic…' : mic === 'denied' || mic === 'unavailable' ? 'Try mic again' : 'Turn on mic';
  const micColor = mic === 'live' ? 'lime' : mic === 'requesting' ? 'gold' : mic === 'denied' || mic === 'unavailable' ? 'danger' : 'night';
  const faces: Record<string, React.CSSProperties> = {
    lime: { ['--face' as string]: 'var(--color-lime)', ['--lip' as string]: 'var(--color-lime-deep)' },
    gold: { ['--face' as string]: 'var(--color-gold)', ['--lip' as string]: 'var(--color-gold-deep)' },
    danger: { ['--face' as string]: 'var(--color-bad)', ['--lip' as string]: '#b3122a', ['--label' as string]: '#fff' },
    night: { ['--face' as string]: 'var(--color-night-600)', ['--lip' as string]: 'var(--color-night-800)', ['--label' as string]: '#fff' },
  };

  return (
    <>
      {/* Keeps page content clear of the dock. */}
      <div aria-hidden className="h-32 sm:h-28" />
      <aside
        aria-label="Voice chat"
        className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:inset-x-auto sm:right-5 sm:bottom-5 sm:px-0 sm:pb-0"
      >
        <div className="panel mx-auto flex w-full max-w-md flex-col gap-2 p-2.5 sm:w-[26rem]">
          {message ? (
            <p role="status" className="px-1 text-sm leading-snug font-bold text-fg-muted">
              {message}
            </p>
          ) : null}
          <div className="flex items-center gap-2">
            <span
              aria-live="polite"
              className={cn('inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-full border-[2.5px] border-ink px-3 font-display text-sm uppercase', s.cls)}
            >
              {s.icon}
              {s.label}
            </span>
            {status === 'failed' ? (
              <button type="button" onClick={onRetry} className="btn-3d min-h-9 rounded-full px-3 text-sm" style={faces.gold}>
                <RefreshCw className="size-4" strokeWidth={3} aria-hidden /> Retry
              </button>
            ) : null}
            {audioBlocked && ready ? (
              <button type="button" onClick={onEnableAudio} className="btn-3d min-h-9 animate-pulse rounded-full px-3 text-sm" style={faces.gold}>
                <Volume2 className="size-4" strokeWidth={3} aria-hidden /> Tap to hear
              </button>
            ) : null}
            <button
              type="button"
              onClick={onToggleMic}
              disabled={!ready || mic === 'requesting'}
              aria-pressed={mic === 'live'}
              className={cn('btn-3d ml-auto min-h-12 shrink-0 rounded-2xl px-4 text-base', selfSpeaking && mic === 'live' && 'ring-4 ring-lime/60')}
              style={faces[micColor]}
            >
              {mic === 'live' ? (
                <>
                  <MicMeter active={selfSpeaking} className="h-5" />
                  <Mic className="size-5" strokeWidth={3} aria-hidden />
                </>
              ) : mic === 'requesting' ? (
                <Hourglass className="size-5" strokeWidth={3} aria-hidden />
              ) : (
                <MicOff className="size-5" strokeWidth={3} aria-hidden />
              )}
              {micLabel}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
