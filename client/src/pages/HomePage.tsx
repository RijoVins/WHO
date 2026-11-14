import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { EyeOff, Globe, LogIn, Mic, Plus, Star, Trophy, Users } from 'lucide-react';
import { MAX_PLAYERS, MIN_PLAYERS, PERFORM_SECONDS, GUESS_SECONDS } from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { Logo } from '../components/Logo';
import { ButtonLink } from '../components/Button';
import { Card } from '../components/Card';

const steps: { icon: ReactNode; title: string; body: string }[] = [
  {
    icon: <Users className="size-6" aria-hidden />,
    title: 'Gather your crew',
    body: `Create a room and share the code or invite link. ${MIN_PLAYERS} to ${MAX_PLAYERS} players, anywhere in the world.`,
  },
  {
    icon: <EyeOff className="size-6" aria-hidden />,
    title: 'Get a secret',
    body: 'Each round one player becomes the performer and secretly gets a celebrity — or a friend in the room.',
  },
  {
    icon: <Mic className="size-6" aria-hidden />,
    title: 'Do the voice',
    body: `The performer gets ${PERFORM_SECONDS} seconds on the mic. Everyone else just listens. No camera, ever.`,
  },
  {
    icon: <Trophy className="size-6" aria-hidden />,
    title: 'Guess & score',
    body: `Type your guess while they perform, plus ${GUESS_SECONDS} more seconds after. First correct guess earns a bonus.`,
  },
];

export function HomePage() {
  return (
    <PageShell bare width="wide">
      <section className="flex flex-col items-center gap-6 pt-6 pb-4 text-center sm:pt-14 sm:pb-8">
        <Logo />
        <p className="max-w-xl animate-rise text-lg leading-relaxed text-fg-muted sm:text-xl">
          The voice-only party game. Do impressions, guess who — right in your browser.
        </p>
        <div className="flex w-full max-w-md animate-rise flex-col gap-3 sm:max-w-xl sm:flex-row">
          <ButtonLink to="/create" fullWidth icon={<Plus className="size-6" aria-hidden />}>
            Create Room
          </ButtonLink>
          <ButtonLink to="/join" variant="teal" fullWidth icon={<LogIn className="size-6" aria-hidden />}>
            Join Room
          </ButtonLink>
        </div>
        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm font-semibold text-fg-faint">
          <li>
            {MIN_PLAYERS}–{MAX_PLAYERS} players
          </li>
          <li aria-hidden>·</li>
          <li>Voice only</li>
          <li aria-hidden>·</li>
          <li>No app to install</li>
          <li aria-hidden>·</li>
          <li>Free</li>
        </ul>
      </section>

      <Card title="How to play">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="flex animate-rise gap-3 lg:flex-col" style={{ animationDelay: `${i * 70}ms` }}>
              <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-sun text-on-bright">{s.icon}</span>
              <div>
                <h3 className="font-display text-lg font-bold">
                  <span className="text-sun">{i + 1}.</span> {s.title}
                </h3>
                <p className="mt-1 text-[15px] leading-relaxed text-fg-muted">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2">
        <ModeBlurb
          icon={<Star className="size-7 text-pink" fill="currentColor" aria-hidden />}
          title="Celebrity Mode"
          body="Impersonate a famous person. Everyone guesses the celebrity."
          border="border-pink/50"
        />
        <ModeBlurb
          icon={<Users className="size-7 text-teal" aria-hidden />}
          title="Friends Mode"
          body="Impersonate someone in the room. Everyone guesses the friend."
          border="border-teal/50"
        />
      </div>

      <Card title="What you need">
        <ul className="grid gap-3 text-[15px] text-fg-muted sm:grid-cols-3">
          <li className="flex gap-2">
            <Globe className="mt-0.5 size-5 shrink-0 text-sky" aria-hidden />A modern browser — Chrome, Safari, Firefox or Edge,
            on phone or computer.
          </li>
          <li className="flex gap-2">
            <Mic className="mt-0.5 size-5 shrink-0 text-pink" aria-hidden />A microphone for your turn. You'll be asked for
            permission only when you perform.
          </li>
          <li className="flex gap-2">
            <Users className="mt-0.5 size-5 shrink-0 text-teal" aria-hidden />
            Friends on any network — home Wi-Fi, mobile data, another country.
          </li>
        </ul>
      </Card>

      <footer className="flex flex-col items-center gap-2 py-4 text-sm text-fg-faint">
        {import.meta.env.DEV ? (
          <Link to="/dev/gallery" className="font-semibold underline underline-offset-4 hover:text-fg">
            Screen gallery (development only)
          </Link>
        ) : null}
      </footer>
    </PageShell>
  );
}

function ModeBlurb({ icon, title, body, border }: { icon: ReactNode; title: string; body: string; border: string }) {
  return (
    <div className={`flex items-center gap-4 rounded-3xl border-2 bg-glass p-4 sm:p-5 ${border}`}>
      {icon}
      <div>
        <h3 className="font-display text-lg font-bold">{title}</h3>
        <p className="text-[15px] text-fg-muted">{body}</p>
      </div>
    </div>
  );
}
