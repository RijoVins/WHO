import { useState } from 'react';
import type { FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { NAME_MAX_LENGTH, validatePlayerName } from '@ib/shared';
import type { GameMode } from '@ib/shared';
import { Screen } from '../components/Screen';
import { Panel } from '../components/Panel';
import { TextField } from '../components/TextField';
import { GameButton } from '../components/GameButton';
import { Banner } from '../components/Banner';
import { ModeSwitch } from '../components/ModeSwitch';
import { useModeChoice } from '../context/mode';
import { loadLastName, saveLastName } from '../utils/storage';
import type { ActionResult } from '../types/actions';

interface CreateRoomPageProps {
  /** Asks the server to create a room; on success the app moves to the lobby, which shows the code. */
  createRoom: (name: string, mode: GameMode) => Promise<ActionResult>;
}

export function CreateRoomPage({ createRoom }: CreateRoomPageProps) {
  const { mode, setMode } = useModeChoice();
  const [name, setName] = useState(loadLastName);
  const [nameError, setNameError] = useState<string | null>(null);
  const [modeError, setModeError] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const v = validatePlayerName(name);
    setNameError(v.ok ? null : v.error);
    setModeError(!mode);
    if (!v.ok || !mode) return;
    setServerError(null);
    setBusy(true);
    saveLastName(v.value);
    const result = await createRoom(v.value, mode);
    setBusy(false);
    if (!result.ok) setServerError(result.error);
  };

  return (
    <Screen heading="Create Room" backTo="/">
      <Panel label="You're the host" labelColor="lime">
        <form onSubmit={submit} noValidate className="flex flex-col gap-5">
          <ModeSwitch
            value={mode}
            onChange={(m) => {
              setMode(m);
              setModeError(false);
            }}
            invalid={modeError}
          />
          {modeError ? (
            <p role="alert" className="-mt-3 font-bold text-bad">
              Pick a mode first.
            </p>
          ) : null}
          <TextField
            label="Your name"
            placeholder="e.g. Sam"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setNameError(null);
            }}
            maxLength={NAME_MAX_LENGTH}
            autoFocus={!name}
            autoComplete="nickname"
            autoCapitalize="words"
            enterKeyHint="go"
            error={nameError}
          />
          {serverError ? <Banner kind="error">{serverError}</Banner> : null}
          <GameButton type="submit" color="lime" size="lg" fullWidth shine loading={busy} icon={<Plus className="size-7" strokeWidth={4} aria-hidden />}>
            Create Room
          </GameButton>
        </form>
      </Panel>
    </Screen>
  );
}
