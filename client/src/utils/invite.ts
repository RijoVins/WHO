/** Shareable link that opens the Join page with the room code filled in. */
export function inviteLink(code: string): string {
  return `${window.location.origin}/join?code=${code}`;
}
