#!/usr/bin/env bash
# Finds Steam (native, Flatpak, or Snap) and Proton, then starts the server.
set -euo pipefail
SERVER_DIR="${SERVER_DIR:-$HOME/Games/BannerlordCoop/server}"
DATA_DIR="${DATA_DIR:-$HOME/Games/BannerlordCoop/server-data}"
for d in "$HOME/.local/share/Steam" "$HOME/.steam/steam" "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam" "$HOME/snap/steam/common/.local/share/Steam" "$HOME/snap/steam/common/.steam/steam"; do
  [ -d "$d/steamapps" ] && STEAMROOT="$d" && break
done
: "${STEAMROOT:?Steam library not found. Start Steam once and install Bannerlord, then try again.}"
PROTON="${PROTON:-$(ls -d "$STEAMROOT"/compatibilitytools.d/*/proton "$STEAMROOT"/steamapps/common/Proton*/proton 2>/dev/null | sort -V | tail -n 1 || true)}"
: "${PROTON:?No Proton found. In Steam: Settings > Compatibility, or set PROTON=/path/to/proton.}"
export STEAM_COMPAT_CLIENT_INSTALL_PATH="$STEAMROOT"
export STEAM_COMPAT_DATA_PATH="$STEAMROOT/steamapps/compatdata/261550"
export STEAM_COMPAT_APP_ID=261550 SteamAppId=261550 SteamGameId=261550
unset PROTON_ENABLE_WAYLAND
mkdir -p "$STEAM_COMPAT_DATA_PATH" "$DATA_DIR"
cd "$SERVER_DIR"
exec "$PROTON" run "$SERVER_DIR/BannerlordCoopServer.exe" --data-dir "Z:$DATA_DIR" --no-watchdog "$@"
