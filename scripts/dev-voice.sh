#!/usr/bin/env bash
# Local LiveKit for development (used by `npm run dev`). Downloads it on first run.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BIN="$ROOT/.tools/livekit-server"
if [ ! -x "$BIN" ]; then
  echo "[voice] LiveKit server not found; downloading it into .tools/ (one time)..."
  bash "$ROOT/scripts/get-livekit.sh"
fi
# --dev: built-in keys (devkey / secret), single node, no config file needed.
# Browsers reach it through the Vite dev server at /livekit; audio flows over UDP/TCP directly.
exec "$BIN" --dev --bind "${VOICE_BIND:-127.0.0.1}"
