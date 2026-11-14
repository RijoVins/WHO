import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { NAME_MAX_LENGTH, validatePlayerName } from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { loadLastName, saveLastName } from '../utils/storage';

export type ActionResult = { ok: true } | { ok: false; error: string };

interface CreateRoomPageProps {
  /** Asks the server to create a room. On success the app navigates to the lobby, which shows the code. */
  createRoom: (name: string) => Promise<ActionResult>;
}

export function CreateRoomPage({ createRoom }: CreateRoomPageProps) {
  const [name, setName] = useState(loadLastName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validatePlayerName(name);
    if (!v.ok) {
      setNameError(v.error);
      return;
    }
    setNameError(null);
    setServerError(null);
    setBusy(true);
    saveLastName(v.value);
    const result = await createRoom(v.value);
    setBusy(false);
    if (!result.ok) setServerError(result.error);
  };

  return (
    <PageShell
      title="Create a room"
      subtitle="You'll be the host. You'll get a room code and invite link to share with your friends."
      back={{ to: '/', label: 'Home' }}
    >
      <form onSubmit={submit} noValidate className="flex animate-rise flex-col gap-5">
        <TextField
          label="Your display name"
          placeholder="e.g. Sam"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          maxLength={NAME_MAX_LENGTH}
          autoFocus
          autoComplete="nickname"
          autoCapitalize="words"
          enterKeyHint="go"
          error={nameError}
          hint="Other players see this name. In Friends Mode, it's the name they'll guess."
        />
        {serverError ? <Banner kind="error">{serverError}</Banner> : null}
        <Button type="submit" loading={busy} fullWidth icon={<Plus className="size-6" aria-hidden />}>
          Create Room
        </Button>
      </form>
    </PageShell>
  );
}
