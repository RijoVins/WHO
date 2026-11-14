import { AccessToken, RoomServiceClient, TrackSource } from 'livekit-server-sdk';
import type { VoiceAccess } from '@ib/shared';

export interface VoiceConfig {
  /** URL browsers connect to: wss://… in production, or a path like /livekit that the browser resolves against the page it's on. */
  url: string;
  /** URL this server uses for LiveKit's HTTP API; defaults to `url` with http(s). */
  apiUrl: string;
  apiKey: string;
  apiSecret: string;
}

/** Voice room for a game room. Includes the creation time so a reused room code never lands in an old voice room. */
export function voiceRoomName(code: string, createdAt: number): string {
  return `ib-${code}-${createdAt.toString(36)}`;
}

/**
 * Issues LiveKit tokens and cleans up voice rooms. The API secret stays here;
 * browsers only ever receive a signed, room-scoped, audio-only token.
 */
export class VoiceService {
  private readonly cfg: VoiceConfig;
  private readonly rooms: RoomServiceClient;

  constructor(cfg: VoiceConfig) {
    this.cfg = cfg;
    this.rooms = new RoomServiceClient(cfg.apiUrl, cfg.apiKey, cfg.apiSecret);
  }

  async tokenFor(args: { code: string; createdAt: number; playerId: string; name: string }): Promise<VoiceAccess> {
    const roomName = voiceRoomName(args.code, args.createdAt);
    const at = new AccessToken(this.cfg.apiKey, this.cfg.apiSecret, {
      identity: args.playerId,
      name: args.name,
      // Long enough for a game; reconnects inside a session reuse the connection,
      // and a fresh token is requested whenever the browser rejoins.
      ttl: '4h',
    });
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublish: true,
      // Voice only: the server refuses camera and screen-share tracks.
      canPublishSources: [TrackSource.MICROPHONE],
      canPublishData: false,
      canUpdateOwnMetadata: false,
    });
    return { url: this.cfg.url, token: await at.toJwt(), roomName, identity: args.playerId };
  }

  /** Remove a player who left the game from voice right away. Best effort. */
  async kick(code: string, createdAt: number, playerId: string): Promise<void> {
    await this.rooms.removeParticipant(voiceRoomName(code, createdAt), playerId).catch(() => {});
  }

  /** The game room closed: close its voice room too. Best effort. */
  async closeRoom(code: string, createdAt: number): Promise<void> {
    await this.rooms.deleteRoom(voiceRoomName(code, createdAt)).catch(() => {});
  }
}

/** http(s) form of a ws(s) URL, for LiveKit's server API. */
export function toHttpUrl(url: string): string {
  return url.replace(/^ws(s?):\/\//, 'http$1://');
}
