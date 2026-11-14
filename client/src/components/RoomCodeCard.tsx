import { Check, Copy, Link2, TriangleAlert } from 'lucide-react';
import { useCopy } from '../hooks/useCopy';
import type { CopyState } from '../hooks/useCopy';
import { inviteLink } from '../utils/invite';

export function RoomCodeCard({ code }: { code: string }) {
  const [codeState, copyCode] = useCopy();
  const [linkState, copyLink] = useCopy();
  return (
    <section
      aria-label="Room code"
      className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-dashed border-sun/80 bg-sun/[0.07] p-4 sm:p-5"
    >
      <div>
        <p className="text-xs font-extrabold tracking-[0.2em] text-sun">ROOM CODE</p>
        <p
          className="font-display text-4xl font-extrabold tracking-[0.25em] sm:text-5xl"
          aria-label={`Room code ${code.split('').join(' ')}`}
        >
          {code}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <CopyButton state={codeState} onClick={() => copyCode(code)} label="Copy code" icon={<Copy className="size-4" />} />
        <CopyButton
          state={linkState}
          onClick={() => copyLink(inviteLink(code))}
          label="Copy invite link"
          icon={<Link2 className="size-4" />}
        />
      </div>
    </section>
  );
}

function CopyButton({
  state,
  onClick,
  label,
  icon,
}: {
  state: CopyState;
  onClick: () => void;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-sun px-4 text-sm font-bold text-on-bright transition hover:brightness-105 active:scale-95"
    >
      {state === 'copied' ? <Check className="size-4" /> : state === 'failed' ? <TriangleAlert className="size-4" /> : icon}
      <span aria-live="polite">{state === 'copied' ? 'Copied!' : state === 'failed' ? 'Copy failed' : label}</span>
    </button>
  );
}
