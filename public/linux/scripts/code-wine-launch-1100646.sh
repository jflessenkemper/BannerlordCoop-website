#!/usr/bin/env bash
# Starts the dedicated server with Wine.
# WineHQ Wine 11.0 reached SERVING in this guide's tests. Debian's stock Wine 8 did not.
# Wine 9 and 10 were not tested, so 11.0 is the version that worked here, not a proven minimum.
set -euo pipefail
SERVER_DIR="${SERVER_DIR:-$HOME/Games/BannerlordCoop/server}"
DATA_DIR="${DATA_DIR:-$HOME/Games/BannerlordCoop/server-data}"
if [ -n "${WINE:-}" ]; then
  WINE_BIN="$WINE"
elif command -v wine >/dev/null 2>&1; then
  WINE_BIN="$(command -v wine)"
elif command -v wine64 >/dev/null 2>&1; then
  WINE_BIN="$(command -v wine64)"
else
  printf '%s\n' 'wine is not installed. WineHQ Wine 11.0 reached SERVING here. Debian stock Wine 8 did not.' >&2
  exit 1
fi
if [ ! -f "$SERVER_DIR/BannerlordCoopServer.exe" ]; then
  printf '%s\n' "Server executable not found: $SERVER_DIR/BannerlordCoopServer.exe" >&2
  exit 1
fi
mkdir -p "$DATA_DIR"
cd "$SERVER_DIR"
exec "$WINE_BIN" "$SERVER_DIR/BannerlordCoopServer.exe" --data-dir "Z:$DATA_DIR" --no-watchdog "$@"
