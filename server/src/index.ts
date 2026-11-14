import { loadConfig, loadDotEnv } from './config.ts';
import { createGameServer } from './app.ts';

loadDotEnv();
const config = loadConfig();
const server = createGameServer(config);
const addr = await server.listen();
console.log(`[server] Impersonation Battle game server on http://${addr.address}:${addr.port} (${config.production ? 'production' : 'development'})`);
console.log(config.voice ? `[server] Voice chat via LiveKit at ${config.voice.url}` : '[server] Voice chat is OFF (set LIVEKIT_URL, LIVEKIT_API_KEY, LIVEKIT_API_SECRET)');

const shutdown = async (signal: string) => {
  console.log(`[server] ${signal} received, shutting down`);
  await server.close();
  process.exit(0);
};
process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
