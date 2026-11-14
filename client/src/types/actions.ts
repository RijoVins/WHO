import type { ErrorCode } from '@ib/shared';

export type ActionResult = { ok: true } | { ok: false; error: string; code?: ErrorCode };
