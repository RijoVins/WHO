import { Router } from 'express';
import type { RoomStore } from '../rooms/RoomStore.ts';

/** GET /api/health: liveness check for deployments and the dev setup. */
export function healthRouter(store: RoomStore) {
  const router = Router();
  router.get('/health', (_req, res) => {
    res.json({ ok: true, rooms: store.roomCount, time: Date.now() });
  });
  return router;
}
