#!/usr/bin/env bash
# Download the official LiveKit server binary for local development into .tools/
# (no sudo, nothing installed system-wide). Verifies the release checksum.
set -euo pipefail

VERSION="${LIVEKIT_VERSION:-1.13.11}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEST="$ROOT/.tools"
case "$(uname -s)-$(uname -m)" in
  Linux-x86_64) ARCH=linux_amd64 ;;
  Linux-aarch64 | Linux-arm64) ARCH=linux_arm64 ;;
  Darwin-x86_64) ARCH=darwin_amd64 ;;
  Darwin-arm64) ARCH=darwin_arm64 ;;
  *) echo "Unsupported platform $(uname -s)-$(uname -m). See https://docs.livekit.io/home/self-hosting/local/" >&2; exit 1 ;;
esac

FILE="livekit_${VERSION}_${ARCH}.tar.gz"
BASE="https://github.com/livekit/livekit/releases/download/v${VERSION}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "Downloading LiveKit server v${VERSION} (${ARCH})..."
curl -fsSL "$BASE/$FILE" -o "$TMP/$FILE"
curl -fsSL "$BASE/checksums.txt" -o "$TMP/checksums.txt"

echo "Verifying checksum..."
(cd "$TMP" && grep " ${FILE}\$" checksums.txt | sha256sum -c -)

mkdir -p "$DEST"
tar -xzf "$TMP/$FILE" -C "$TMP" livekit-server
install -m 0755 "$TMP/livekit-server" "$DEST/livekit-server"
echo "Installed $DEST/livekit-server ($("$DEST/livekit-server" --version 2>/dev/null || echo "v${VERSION}"))"
