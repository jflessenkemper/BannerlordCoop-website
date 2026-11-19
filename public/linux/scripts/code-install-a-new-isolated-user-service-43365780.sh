#!/usr/bin/env bash
# Bash: export these four absolute paths from your verified manual launch first:
# SERVER_DIR, PROTON, COOP_PREFIX (dedicated prefix), COOP_DATA_DIR.
# COOP_SERVICE_UNIT and COOP_SERVICE_CONFIG can select isolated test names.
(
  set -euo pipefail
  : "${SERVER_DIR:?Set the verified server folder}"
  : "${PROTON:?Set the verified proton executable}"
  : "${COOP_PREFIX:?Set a dedicated Proton prefix}"
  : "${COOP_DATA_DIR:?Set the intended server data folder}"
  UNIT_NAME="${COOP_SERVICE_UNIT:-coop-server.service}"
  CONFIG_DIR="${COOP_SERVICE_CONFIG:-$HOME/.config/coop-server}"
  case "$UNIT_NAME" in
    coop-server.service|coop-server-*.service) ;;
    *) printf '%s\n' 'Use coop-server.service or a new coop-server-*.service unit name.'; exit 1 ;;
  esac
  case "$UNIT_NAME" in *[!a-zA-Z0-9_.-]*) exit 1 ;; esac
  for path in "$SERVER_DIR" "$PROTON" "$COOP_PREFIX" "$COOP_DATA_DIR" "$CONFIG_DIR"; do
    case "$path" in /*) ;; *) printf '%s\n' 'All paths must be absolute.'; exit 1 ;; esac
  done
  WINE_SERVER="${COOP_WINESERVER:-${PROTON%/*}/files/bin/wineserver}"
  test -x "$WINE_SERVER"
  command -v script >/dev/null
  test -x "$PROTON"
  test -f "$SERVER_DIR/BannerlordCoopServer.exe"
  if [ ! -f "$COOP_DATA_DIR/eula.txt" ] || ! awk '
    tolower($0) ~ /^[[:space:]]*eula[[:space:]]*=[[:space:]]*true([[:space:]]|$)/ {ok=1}
    END {exit !ok}
  ' "$COOP_DATA_DIR/eula.txt"; then
    printf '%s\n' 'EULA consent required: review bundled EULA.md and LICENSE.txt.'
    printf '%s\n' 'Run the server interactively and decide yourself before installing a service.'
    printf '%s\n' 'Do not automate acceptance or copy a different server acceptance file.'
    exit 1
  fi
  UNIT="$HOME/.config/systemd/user/$UNIT_NAME"
  test ! -e "$UNIT" || { printf '%s\n' 'Unit already exists: refusing overwrite.'; exit 1; }
  test ! -e "$CONFIG_DIR" || { printf '%s\n' 'Config folder exists: refusing overwrite.'; exit 1; }
  mkdir -p "$HOME/.config/systemd/user" "$CONFIG_DIR" "$COOP_PREFIX" "$COOP_DATA_DIR"
  {
    printf '#!/usr/bin/env bash\nset -euo pipefail\n'
    printf 'export STEAM_COMPAT_CLIENT_INSTALL_PATH=%q\n' "${STEAMROOT:-$HOME/.local/share/Steam}"
    printf 'export STEAM_COMPAT_DATA_PATH=%q\n' "$COOP_PREFIX"
    printf 'export STEAM_COMPAT_APP_ID=261550 SteamAppId=261550 SteamGameId=261550\n'
    printf 'unset PROTON_ENABLE_WAYLAND\n'
    printf 'cd %q\n' "$SERVER_DIR"
    printf 'export SHELL=/usr/bin/bash\n'
    printf -v LAUNCH '%q run %q --data-dir %q --no-watchdog' "$PROTON" "$SERVER_DIR/BannerlordCoopServer.exe" "Z:$COOP_DATA_DIR"
    printf 'exec script --quiet --return --flush --command %q /dev/null\n' "$LAUNCH"
  } > "$CONFIG_DIR/run.sh"
  chmod 700 "$CONFIG_DIR/run.sh"
  {
    printf '#!/usr/bin/env bash\nset -euo pipefail\n'
    printf 'export WINEPREFIX=%q\n' "$COOP_PREFIX/pfx"
    printf 'exec %q -k\n' "$WINE_SERVER"
  } > "$CONFIG_DIR/stop.sh"
  chmod 700 "$CONFIG_DIR/stop.sh"
  cat > "$UNIT" <<UNIT
[Unit]
Description=Bannerlord Co-op dedicated server
After=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/bash "$CONFIG_DIR/run.sh"
ExecStop=/usr/bin/bash "$CONFIG_DIR/stop.sh"
KillMode=control-group
TimeoutStopSec=30
TimeoutStopFailureMode=kill
Restart=no

[Install]
WantedBy=default.target
UNIT
  systemd-analyze --user verify "$UNIT"
  systemctl --user daemon-reload
  printf 'Installed %s. Review its data configuration before starting it.\n' "$UNIT_NAME"
)
# Run separately after reviewing configuration (substitute your unit name):
# systemctl --user start coop-server.service
# systemctl --user status coop-server.service --no-pager
# journalctl --user -u coop-server.service --no-pager -n 40
# systemctl --user stop coop-server.service
# systemctl --user restart coop-server.service
# Before stopping a real server, save safely using its console.
# Prefix-scoped Wine cleanup is not a substitute for saving.
# Never share this dedicated prefix with another server.
# Stop only this new unit before deleting its own unit/config files.
