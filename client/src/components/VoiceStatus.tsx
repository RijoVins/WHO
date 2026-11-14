import type { ReactNode } from 'react';
import { AlertCircle, Hourglass, Mic, MicOff, Radio, RefreshCw, WifiOff } from 'lucide-react';
import type { MicStatus, VoiceStatus as VoiceState } from '../types/voice';
import { cn } from '../utils/cn';

type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'live';

const toneClass: Record<Tone, string> = {
  good: 'border-ok/70 text-ok',
  warn: 'border-warn/70 text-warn',
  bad: 'border-bad/70 text-bad',
  neutral: 'border-line text-fg-muted',
  live: 'border-pink bg-pink/15 text-pink animate-live-ring',
};

export function StatusPill({ icon, label, tone }: { icon: ReactNode; label: string; tone: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-9 items-center gap-1.5 rounded-full border-2 bg-ink-950/40 px-3 text-sm font-bold',
        toneClass[tone],
      )}
    >
      {icon}
      {label}
    </span>
  );
}

const i = 'size-4';

const mic: Record<MicStatus, { label: string; tone: Tone; icon: ReactNode }> = {
  off: { label: 'Mic off', tone: 'neutral', icon: <MicOff className={i} aria-hidden /> },
  requesting: { label: 'Allow the mic…', tone: 'warn', icon: <Hourglass className={i} aria-hidden /> },
  live: { label: 'Mic live', tone: 'live', icon: <Mic className={i} aria-hidden /> },
  denied: { label: 'Mic blocked', tone: 'bad', icon: <AlertCircle className={i} aria-hidden /> },
  unavailable: { label: 'No mic found', tone: 'bad', icon: <AlertCircle className={i} aria-hidden /> },
};

const voice: Record<VoiceState, { label: string; tone: Tone; icon: ReactNode }> = {
  connected: { label: 'Voice connected', tone: 'good', icon: <Radio className={i} aria-hidden /> },
  connecting: { label: 'Connecting voice…', tone: 'warn', icon: <RefreshCw className={cn(i, 'animate-spin')} aria-hidden /> },
  reconnecting: { label: 'Reconnecting…', tone: 'warn', icon: <RefreshCw className={cn(i, 'animate-spin')} aria-hidden /> },
  disconnected: { label: 'Voice off', tone: 'neutral', icon: <WifiOff className={i} aria-hidden /> },
  failed: { label: 'Voice failed', tone: 'bad', icon: <AlertCircle className={i} aria-hidden /> },
};

/** Voice connection + microphone status, announced to screen readers when it changes. */
export function VoiceStatusBar({ micStatus, voiceStatus }: { micStatus: MicStatus; voiceStatus: VoiceState }) {
  const v = voice[voiceStatus];
  const m = mic[micStatus];
  return (
    <div className="flex flex-wrap gap-2" aria-live="polite">
      <StatusPill {...v} />
      <StatusPill {...m} />
    </div>
  );
}
