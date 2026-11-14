import type { PlayerPublic } from '@ib/shared';

const AVATAR_COLORS = [
  '#ff4d8d', '#2ec4b6', '#ffd23f', '#a78bfa', '#ff8a3d',
  '#3ddc97', '#4cc9f0', '#f472b6', '#b5e48c', '#f4a261',
];

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Stable color per player id, so a player keeps the same color all game. */
export function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export function playerName(players: PlayerPublic[], id: string | null | undefined): string {
  if (!id) return 'Unknown';
  return players.find((p) => p.id === id)?.name ?? 'A player who left';
}
