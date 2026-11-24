#!/usr/bin/env bash
# Yes when the newest server log shows SERVING and UDP 4200 is listening. Exact port, real exit code.
set -euo pipefail
DATA_DIR="${DATA_DIR:-$HOME/Games/BannerlordCoop/server-data}"
command -v ss >/dev/null 2>&1 || { printf '%s\n' 'No: ss is not installed, so UDP 4200 cannot be checked.' >&2; exit 1; }
LOG=""
if [ -d "$DATA_DIR/logs" ]; then
  LOG="$(find "$DATA_DIR/logs" -name 'coop-server-*.log' -printf '%T@ %p\n' 2>/dev/null | sort -nr | awk 'NR==1 { print $2 }')"
fi
if [ -z "$LOG" ] || ! grep -F -q '[DedicatedServer] SERVING' "$LOG"; then
  printf '%s\n' "No: no [DedicatedServer] SERVING line in ${LOG:-$DATA_DIR/logs}." >&2
  exit 1
fi
if ! ss -ulnH | awk '$4 ~ /:4200$/ || $5 ~ /:4200$/ { found=1 } END { exit found ? 0 : 1 }'; then
  printf '%s\n' "No: $LOG shows SERVING, but UDP port 4200 is not listening." >&2
  exit 1
fi
printf '%s\n' "Yes: $LOG shows SERVING and UDP 4200 is listening."
