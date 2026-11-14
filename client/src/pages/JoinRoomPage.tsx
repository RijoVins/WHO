import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { LogIn } from 'lucide-react';
import {
  NAME_MAX_LENGTH,
  ROOM_CODE_LENGTH,
  normalizeRoomCode,
  validatePlayerName,
  validateRoomCode,
} from '@ib/shared';
import { PageShell } from '../components/PageShell';
import { TextField } from '../components/TextField';
import { Button } from '../components/Button';
import { Banner } from '../components/Banner';
import { loadLastName, saveLastName } from '../utils/storage';
import type { ActionResult } from './CreateRoomPage';

interface JoinRoomPageProps {
  /** Asks the server to join. Errors include: room not found, room full (60), game already running. */
  joinRoom: (name: string, code: string) => Promise<ActionResult>;
}

export function JoinRoomPage({ joinRoom }: JoinRoomPageProps) {
  const [params] = useSearchParams();
  // Invite links look like /join?code=K7QX4
  const invited = normalizeRoomCode(params.get('code') ?? '').slice(0, ROOM_CODE_LENGTH);
  const [name, setName] = useState(loadLastName);
  const [code, setCode] = useState(invited);
  const [nameError, setNameError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const codeRef = useRef<HTMLInputElement>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const n = validatePlayerName(name);
    const c = validateRoomCode(code);
    setNameError(n.ok ? null : n.error);
    setCodeError(c.ok ? null : c.error);
    if (!n.ok || !c.ok) return;
    setServerError(null);
    setBusy(true);
    saveLastName(n.value);
    const result = await joinRoom(n.value, c.value);
    setBusy(false);
    if (!result.ok) setServerError(result.error);
  };

  return (
    <PageShell
      title="Join a room"
      subtitle={
        invited
          ? `You've been invited to room ${invited}. Pick a name and jump in.`
          : `Ask the host for the ${ROOM_CODE_LENGTH}-character room code.`
      }
      back={{ to: '/', label: 'Home' }}
    >
      <form onSubmit={submit} noValidate className="flex animate-rise flex-col gap-5">
        <TextField
          label="Your display name"
          placeholder="e.g. Alex"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setNameError(null);
          }}
          maxLength={NAME_MAX_LENGTH}
          autoFocus={!name}
          autoComplete="nickname"
          autoCapitalize="words"
          enterKeyHint="next"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !code) {
              e.preventDefault();
              codeRef.current?.focus();
            }
          }}
          error={nameError}
        />
        <TextField
          ref={codeRef}
          label="Room code"
          variant="code"
          placeholder="•••••"
          value={code}
          onChange={(e) => {
            setCode(normalizeRoomCode(e.target.value).slice(0, ROOM_CODE_LENGTH));
            setCodeError(null);
          }}
          autoFocus={!!name && !invited}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          inputMode="text"
          enterKeyHint="go"
          error={codeError}
        />
        {serverError ? <Banner kind="error">{serverError}</Banner> : null}
        <Button type="submit" variant="teal" loading={busy} fullWidth icon={<LogIn className="size-6" aria-hidden />}>
          Join Room
        </Button>
      </form>
    </PageShell>
  );
}
