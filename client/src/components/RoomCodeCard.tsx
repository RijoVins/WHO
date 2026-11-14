import type { ReactNode } from 'react';
import { Check, Copy, Link2, TriangleAlert } from 'lucide-react';
import { useCopy } from '../hooks/useCopy';
import type { CopyState } from '../hooks/useCopy';
import { inviteLink } from '../utils/invite';

/** Arcade ticket showing the room code as letter tiles, with copy actions. */
export function RoomCodeCard({ code }: { code: string }) {
  const [codeState, copyCode] = useCopy();
  const [linkState, copyLink] = useCopy();
  return (
    <section
      aria-label="Room code"
      className="relative flex flex-col items-center gap-3 rounded-[1.75rem] border-[3px] border-ink bg-gold p-4 text-on-bright shadow-[inset_0_-7px_0_var(--color-gold-deep),0_8px_0_var(--color-ink)] sm:p-5"
    >
      {/* ticket notches */}
      <span aria-hidden className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border-[3px] border-ink bg-night-800" />
      <span aria-hidden className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border-[3px] border-ink bg-night-800" />
      <p className="font-display text-lg tracking-[0.25em] uppercase">Room code</p>
      <p className="flex gap-1.5 sm:gap-2" aria-label={`Room code ${code.split('').join(' ')}`}>
        {code.split('').map((ch, i) => (
          <span
            key={i}
            aria-hidden
            style={{ animationDelay: `${i * 70}ms` }}
            className="grid h-14 w-11 animate-pop-in place-items-center rounded-xl border-[3px] border-ink bg-fg font-title text-4xl text-celeb-deep shadow-[0_4px_0_var(--color-ink)] sm:h-16 sm:w-13 sm:text-5xl"
          >
            {ch}
          </span>
        ))}
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        <CopyButton state={codeState} onClick={() => copyCode(code)} label="Copy code" icon={<Copy className="size-4" strokeWidth={3} />} />
        <CopyButton
          state={linkState}
          onClick={() => copyLink(inviteLink(code))}
          label="Copy invite link"
          icon={<Link2 className="size-4" strokeWidth={3} />}
        />
      </div>
    </section>
  );
}

function CopyButton({ state, onClick, label, icon }: { state: CopyState; onClick: () => void; label: string; icon: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="btn-3d min-h-11 rounded-full px-4 text-sm"
      style={{ ['--face' as string]: 'var(--color-night-700)', ['--lip' as string]: 'var(--color-night-900)', ['--label' as string]: '#fff' }}
    >
      {state === 'copied' ? (
        <Check className="size-4 text-lime" strokeWidth={4} />
      ) : state === 'failed' ? (
        <TriangleAlert className="size-4 text-bad" strokeWidth={3} />
      ) : (
        icon
      )}
      <span aria-live="polite">{state === 'copied' ? 'Copied!' : state === 'failed' ? 'Copy failed' : label}</span>
    </button>
  );
}
