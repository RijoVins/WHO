import { randomBytes, randomInt } from 'node:crypto';
import { ROOM_CODE_ALPHABET, ROOM_CODE_LENGTH } from '@ib/shared';

/** Random room code from the unambiguous alphabet, using a cryptographic RNG. */
export function randomRoomCode(): string {
  let code = '';
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) code += ROOM_CODE_ALPHABET[randomInt(ROOM_CODE_ALPHABET.length)];
  return code;
}

/** Unguessable secret for reclaiming a seat. */
export function randomToken(): string {
  return randomBytes(24).toString('base64url');
}

/** Public player id. Not secret, but unique. */
export function randomPlayerId(): string {
  return 'p_' + randomBytes(9).toString('base64url');
}
