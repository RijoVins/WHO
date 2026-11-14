import type { ActionResult } from '../pages/CreateRoomPage';

/**
 * Room actions. Milestone 1 has no game server, so these report that honestly
 * instead of pretending to succeed. Milestone 2 replaces them with real calls.
 */
const NO_SERVER: ActionResult = {
  ok: false,
  error: "Can't reach the game server. The server is added in the next milestone, so rooms can't be created or joined yet.",
};

export async function createRoom(_name: string): Promise<ActionResult> {
  return NO_SERVER;
}

export async function joinRoom(_name: string, _code: string): Promise<ActionResult> {
  return NO_SERVER;
}
