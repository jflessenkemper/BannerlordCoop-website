# Detect STEAMROOT (native / Flatpak / Snap candidates). Do not invent paths.
for d in "$HOME/.local/share/Steam" "$HOME/.steam/steam"   "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"   "$HOME/snap/steam/common/.local/share/Steam"   "$HOME/snap/steam/common/.steam/steam"; do
  [ -d "$d/steamapps" ] && export STEAMROOT="$d" && break
done
: "${STEAMROOT:?Set STEAMROOT to your Steam library root}"
export STEAM_COMPAT_CLIENT_INSTALL_PATH="$STEAMROOT"
export STEAM_COMPAT_DATA_PATH="$STEAMROOT/steamapps/compatdata/261550"
export STEAM_COMPAT_APP_ID=261550 SteamAppId=261550 SteamGameId=261550
export SERVER_DIR="$HOME/Games/BannerlordCoop-DedicatedServer"
unset PROTON_ENABLE_WAYLAND