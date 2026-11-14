/** Room size limits — enforced by the server, mirrored in the UI. */
export const MIN_PLAYERS = 3;
export const MAX_PLAYERS = 60;

/** Display names. */
export const NAME_MAX_LENGTH = 20;

/**
 * Room codes avoid look-alike characters (no 0/O, 1/I/L) so they are easy
 * to read aloud and type on a phone keyboard.
 */
export const ROOM_CODE_LENGTH = 6;
export const ROOM_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Round timing (seconds). The server owns these timers; clients only display them. */
export const PERFORM_SECONDS = 45;
export const GUESS_SECONDS = 20;
/** How long the round results stay on screen before the next round starts. */
export const RESULTS_SECONDS = 10;

/** Guess limits. */
export const GUESS_MAX_LENGTH = 60;
/** Wrong guesses allowed per player per round. */
export const MAX_GUESSES_PER_ROUND = 5;

/** Game length options the host can choose from. */
export const ROUND_COUNT_OPTIONS = [3, 5, 10, 15] as const;
export const DEFAULT_ROUND_COUNT = 5;

/** How long a disconnected player keeps their seat before being removed. */
export const RECONNECT_GRACE_SECONDS = 60;
