export STEAMROOT="$HOME/.local/share/Steam"
export STEAM_COMPAT_CLIENT_INSTALL_PATH="$STEAMROOT"
export STEAM_COMPAT_DATA_PATH="$STEAMROOT/steamapps/compatdata/261550"
export STEAM_COMPAT_APP_ID=261550 SteamAppId=261550 SteamGameId=261550
export PROTON="$STEAMROOT/compatibilitytools.d/<ProtonGE-version>/proton"
cd "$SERVER_DIR"
"$PROTON" run "$SERVER_DIR/BannerlordCoopServer.exe" --no-watchdog