import { useState } from 'react';
import { User } from 'lucide-react';
import { cn } from '../utils/cn';

interface CelebrityPhotoProps {
  src: string | null | undefined;
  name: string;
  credit?: string;
  className?: string;
  /** Load immediately (the secret card) instead of lazily. */
  eager?: boolean;
}

/** Framed portrait. If the photo can't load, a styled placeholder with the name shows instead. */
export function CelebrityPhoto({ src, name, credit, className, eager }: CelebrityPhotoProps) {
  const [failed, setFailed] = useState(false);
  const showImg = src && !failed;
  return (
    <figure className={cn('flex flex-col items-center gap-1', className)}>
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border-[3px] border-ink bg-night-800 shadow-[0_6px_0_var(--color-ink)]">
        {showImg ? (
          <img
            src={src}
            alt={`Photo of ${name}`}
            loading={eager ? 'eager' : 'lazy'}
            decoding="async"
            draggable={false}
            onError={() => setFailed(true)}
            className="size-full object-cover object-top"
          />
        ) : (
          <div className="grid size-full place-items-center bg-[linear-gradient(160deg,var(--color-celeb),var(--color-night-800))] p-3 text-center">
            <User className="size-16 text-fg/60" strokeWidth={2} aria-hidden />
            <span className="font-title text-xl text-fg text-outline-thin">{name}</span>
          </div>
        )}
      </div>
      {credit && showImg ? <figcaption className="max-w-full truncate text-[10px] font-semibold opacity-60">Photo: {credit}</figcaption> : null}
    </figure>
  );
}
