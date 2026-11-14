import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import express from 'express';
import { Server } from 'socket.io';
import { RoomStore } from './rooms/RoomStore.ts';
import { VoiceService } from './livekit/voice.ts';
import { registerHandlers } from './sockets/registerHandlers.ts';
import type { GameServer } from './sockets/registerHandlers.ts';
import { healthRouter } from './routes/health.ts';
import type { ServerConfig } from './config.ts';
import type { Timings } from './game/GameEngine.ts';

const CLIENT_DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');

/** Build the HTTP + Socket.IO server. Used by index.ts and by the tests. */
export function createGameServer(config: ServerConfig, opts: { timings?: Partial<Timings> } = {}) {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', true);

  const store = new RoomStore({ maxRooms: config.maxRooms, graceMs: config.graceMs, timings: opts.timings });
  app.use('/api', healthRouter(store));

  // Production: serve the built website from the same origin as the socket server.
  if (config.production && existsSync(CLIENT_DIST)) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '1h' }));
    app.get('/{*splat}', (_req, res) => res.sendFile(path.join(CLIENT_DIST, 'index.html')));
  }

  const httpServer = createServer(app);
  const io: GameServer = new Server(httpServer, {
    // Payloads are tiny; refuse anything big.
    maxHttpBufferSize: 16 * 1024,
    cors: config.clientOrigins.length ? { origin: config.clientOrigins } : undefined,
    connectionStateRecovery: undefined,
  });
  const voice = config.voice ? new VoiceService(config.voice) : null;
  registerHandlers(io, store, { trustProxy: config.trustProxy, roomCreateBurst: config.roomCreateBurst, voice });

  return {
    app,
    io,
    store,
    httpServer,
    listen(): Promise<AddressInfo> {
      return new Promise((resolve) => {
        httpServer.listen(config.port, config.host, () => resolve(httpServer.address() as AddressInfo));
      });
    },
    async close() {
      store.dispose();
      await io.close();
    },
  };
}
