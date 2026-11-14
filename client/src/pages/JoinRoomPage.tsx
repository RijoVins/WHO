import { useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { useSearchParams } from 'react-router';
import { LogIn } from 'lucide-react';
import { NAME_MAX_LENGTH, ROOM_CODE_LENGTH, normalizeRoomCode, validatePlayerName, validateRoomCode } from '@ib/shared';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { GameButton } from '../components/GameButton';
import { Banner } from '../components/Banner';
import { loadLastName, saveLastName } from '../utils/storage';
import type { ActionResult } from '../types/actions';

interface JoinRoomPageProps {
  /** Asks the server to join. Errors include: room not found, room full (60), game already running. */
  joinRoom: (name: string, code: string) => Promise<ActionResult>;
}

export function JoinRoomPage({ joinRoom }: JoinRoomPageProps) {
  const [params] = useSearchParams();
  // Invite links look like /join?code=K7QX4M
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
    <Screen heading="Join Room" backTo="/">
      <Panel label={invited ? `Invited to ${invited}` : 'Got a code?'} labelColor="cyan">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <TextField
            label="Your name"
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
            enterKeyHint="go"
            error={codeError}
          />
          {serverError ? <Banner kind="error">{serverError}</Banner> : null}
          <GameButton type="submit" color="cyan" size="lg" fullWidth loading={busy} icon={<LogIn className="size-7" strokeWidth={3.5} aria-hidden />}>
            Join Room
          </GameButton>
        </form>
      </Panel>
    </Screen>
  );
}
