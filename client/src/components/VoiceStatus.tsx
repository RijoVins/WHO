import type { ReactNode } from 'react';
import { AlertCircle, Hourglass, Mic, MicOff, Radio, RefreshCw, WifiOff } from 'lucide-react';
import type { MicStatus, VoiceStatus as VoiceState } from '../types/voice';
import { MicMeter } from './MicMeter';
import { cn } from '../utils/cn';

type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'live';

const toneClass: Record<Tone, string> = {
  good: 'bg-ok text-on-bright',
  warn: 'bg-warn text-on-bright',
  bad: 'bg-bad text-fg',
  neutral: 'bg-night-600 text-fg-muted',
  live: 'bg-pink text-fg',
};

function Pill({ icon, label, tone, extra }: { icon: ReactNode; label: string; tone: Tone; extra?: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex min-h-10 items-center gap-2 rounded-full border-[3px] border-ink px-3.5 font-display text-base tracking-wide uppercase shadow-[0_4px_0_var(--color-ink)]',
        toneClass[tone],
      )}
    >
      {icon}
      {label}
      {extra}
    </span>
  );
}

const i = 'size-5';

const mic: Record<MicStatus, { label: string; tone: Tone; icon: ReactNode }> = {
  off: { label: 'Mic off', tone: 'neutral', icon: <MicOff className={i} strokeWidth={2.75} aria-hidden /> },
  requesting: { label: 'Allow mic…', tone: 'warn', icon: <Hourglass className={i} strokeWidth={2.75} aria-hidden /> },
  live: { label: 'Mic live', tone: 'live', icon: <Mic className={i} strokeWidth={2.75} aria-hidden /> },
  denied: { label: 'Mic blocked', tone: 'bad', icon: <AlertCircle className={i} strokeWidth={2.75} aria-hidden /> },
  unavailable: { label: 'No mic', tone: 'bad', icon: <AlertCircle className={i} strokeWidth={2.75} aria-hidden /> },
};

const voice: Record<VoiceState, { label: string; tone: Tone; icon: ReactNode }> = {
  connected: { label: 'Voice on', tone: 'good', icon: <Radio className={i} strokeWidth={2.75} aria-hidden /> },
  connecting: { label: 'Connecting…', tone: 'warn', icon: <RefreshCw className={cn(i, 'animate-spin')} strokeWidth={2.75} aria-hidden /> },
  reconnecting: { label: 'Reconnecting…', tone: 'warn', icon: <RefreshCw className={cn(i, 'animate-spin')} strokeWidth={2.75} aria-hidden /> },
  disconnected: { label: 'Voice off', tone: 'neutral', icon: <WifiOff className={i} strokeWidth={2.75} aria-hidden /> },
  failed: { label: 'Voice failed', tone: 'bad', icon: <AlertCircle className={i} strokeWidth={2.75} aria-hidden /> },
};

/** Voice connection + mic status; changes are announced to screen readers. */
export function VoiceStatusBar({ micStatus, voiceStatus }: { micStatus: MicStatus; voiceStatus: VoiceState }) {
  const m = mic[micStatus];
  return (
    <div className="flex flex-wrap gap-2" aria-live="polite">
      <Pill {...voice[voiceStatus]} />
      <Pill {...m} extra={micStatus === 'live' ? <MicMeter active className="h-5" /> : undefined} />
    </div>
  );
}
