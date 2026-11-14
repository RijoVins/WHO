import type { GameMode } from '@ib/shared';
import type { ActionResult } from '../types/actions';

/**
 * Room actions. There is no game server yet (next milestone), so these report
 * that honestly instead of pretending to succeed.
 */
const NO_SERVER: ActionResult = {
  ok: false,
  error: "Can't reach the game server. Online rooms are switched on in the next milestone.",
};

export async function createRoom(_name: string, _mode: GameMode): Promise<ActionResult> {
  return NO_SERVER;
}

export async function joinRoom(_name: string, _code: string): Promise<ActionResult> {
  return NO_SERVER;
}
