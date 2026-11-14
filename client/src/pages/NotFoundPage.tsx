import { Home } from 'lucide-react';
import { PageShell } from '../components/PageShell';
import { ButtonLink } from '../components/Button';

export function NotFoundPage() {
  return (
    <PageShell title="Page not found" subtitle="That page doesn't exist. If you were joining a game, check the room code.">
      <ButtonLink to="/" icon={<Home className="size-5" aria-hidden />}>
        Back to home
      </ButtonLink>
    </PageShell>
  );
}
