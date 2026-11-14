import { validatePlayerName, validateRoomCode } from '@ib/shared';
import type { CreateRoomPayload, GameMode, JoinRoomPayload, ResumePayload } from '@ib/shared';

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const isObject = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
export const isMode = (v: unknown): v is GameMode => v === 'celebrity' || v === 'friends';

export function parseCreate(p: unknown): Parsed<CreateRoomPayload> {
  if (!isObject(p)) return { ok: false, error: 'Bad request.' };
  const name = validatePlayerName(p.name);
  if (!name.ok) return name;
  if (!isMode(p.mode)) return { ok: false, error: 'Pick Celebrity Mode or Friends Mode.' };
  return { ok: true, value: { name: name.value, mode: p.mode } };
}

export function parseJoin(p: unknown): Parsed<JoinRoomPayload> {
  if (!isObject(p)) return { ok: false, error: 'Bad request.' };
  const name = validatePlayerName(p.name);
  if (!name.ok) return name;
  const code = validateRoomCode(p.code);
  if (!code.ok) return code;
  return { ok: true, value: { name: name.value, code: code.value } };
}

export function parseResume(p: unknown): Parsed<ResumePayload> {
  if (!isObject(p)) return { ok: false, error: 'Bad request.' };
  const code = validateRoomCode(p.code);
  if (!code.ok) return code;
  if (typeof p.token !== 'string' || p.token.length < 16 || p.token.length > 64) return { ok: false, error: 'Bad session.' };
  return { ok: true, value: { code: code.value, token: p.token } };
}

export function parseMode(p: unknown): Parsed<GameMode> {
  return isObject(p) && isMode(p.mode) ? { ok: true, value: p.mode } : { ok: false, error: 'Unknown game mode.' };
}

export function parseRounds(p: unknown): Parsed<number> {
  return isObject(p) && Number.isInteger(p.totalRounds) ? { ok: true, value: p.totalRounds as number } : { ok: false, error: 'Bad round count.' };
}

