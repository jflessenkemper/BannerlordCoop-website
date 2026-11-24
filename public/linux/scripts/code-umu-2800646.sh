#!/usr/bin/env bash
set -euo pipefail
SERVER_DIR="${SERVER_DIR:-$HOME/Games/BannerlordCoop/server}"
DATA_DIR="${DATA_DIR:-$HOME/Games/BannerlordCoop/server-data}"
command -v umu-run >/dev/null 2>&1 || { printf '%s\n' 'umu-run is not installed.' >&2; exit 1; }
mkdir -p "$DATA_DIR"
cd "$SERVER_DIR"
exec umu-run "$SERVER_DIR/BannerlordCoopServer.exe" --data-dir "Z:$DATA_DIR" --no-watchdog "$@"
