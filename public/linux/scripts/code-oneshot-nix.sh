cat > "$HOME/coop-setup.sh" <<'COOP_SETUP_EOF'
#!/usr/bin/env bash
# ==============================
# Bannerlord Co-op on Linux - one-script setup for NixOS
# Read it first, then run it. Safe to re-run: finished steps are skipped.
#
# It will:
#   1. Fetch curl, 7-Zip, python3 and iproute2 with nix-shell (nothing installed system-wide).
#   2. Download the latest Co-op client + Windows dedicated server from the
#      official GitHub release and verify their SHA-256 checksums (~4.5 GB).
#   3. Unpack them under ~/Games/BannerlordCoop and write start-server.sh.
#   4. Print the declarative firewall + Steam options to add to configuration.nix.
# It will NOT: log in to Steam, buy/install Bannerlord, accept the EULA for you,
# enable the mod, touch your router, or start the server.
#
# Options (environment variables):
#   COOP_VERSION=v0.1.7   pin a release (default: latest)
#   COOP_DIR=/path        install folder (default: ~/Games/BannerlordCoop)
#   COOP_YES=1            do not ask for confirmation
# ==============================
set -euo pipefail

COOP_DIR="${COOP_DIR:-$HOME/Games/BannerlordCoop}"
SERVER_DIR="$COOP_DIR/server"
say()  { printf '\n==> %s\n' "$*"; }
note() { printf '    %s\n' "$*"; }
die()  { printf '\nERROR: %s\n' "$*" >&2; exit 1; }
have() { command -v "$1" >/dev/null 2>&1; }
confirm() {
  [ "${COOP_YES:-0}" = 1 ] && return 0
  [ -r /dev/tty ] || die "No terminal to ask on. Re-run with COOP_YES=1 to continue without asking."
  local a; read -r -p "$1 [y/N] " a </dev/tty; case "$a" in y|Y|yes|YES) return 0 ;; *) return 1 ;; esac
}
# sudo only for the few steps that change the system
as_root() { if [ "$(id -u)" -eq 0 ]; then "$@"; elif have sudo; then sudo "$@"; else die "sudo is required for: $*"; fi; }

# ---- 1. checks --------------------------------------------------------------
if [ "$(id -u)" -eq 0 ] && [ "${COOP_ALLOW_ROOT:-0}" != 1 ]; then
  die "Run this as your normal user (it uses sudo only where needed). Steam and Proton must not run as root."
fi
[ -r /etc/os-release ] && . /etc/os-release
case " ${ID:-} ${ID_LIKE:-} " in *" nixos "*) ;; *)
  note "This script is written for NixOS but this looks like: ${PRETTY_NAME:-unknown}."
  confirm "Run it anyway?" || die "Cancelled. Nothing was changed."
  ;; esac
if command -v curl >/dev/null 2>&1; then
  curl -fsSI --max-time 15 https://api.github.com >/dev/null 2>&1 || die "Cannot reach api.github.com. Check your network and try again."
fi
mkdir -p "$COOP_DIR"
read -r _ _ _ FREE_KB _ < <(df -Pk "$COOP_DIR" | tail -n 1)
if [ "${FREE_KB:-0}" -lt 15000000 ]; then
  note "Only $((FREE_KB / 1048576)) GB free in $COOP_DIR; the server archive needs about 15 GB while unpacking."
  confirm "Continue anyway?" || die "Not enough free disk space."
fi
echo "Detected: ${PRETTY_NAME:-unknown Linux}."
echo "Install folder: $COOP_DIR"
note "No system changes: tools come from nix-shell; Steam and firewall are declared in configuration.nix (printed at the end)."
confirm "Continue?" || die "Cancelled. Nothing was changed."

# ---- tools + Steam -----------------------------------------------------------
if [ -z "${COOP_IN_NIX:-}" ]; then
  have nix-shell || die "nix-shell not found."
  say "Re-running inside nix-shell (curl, 7zz, python3, iproute2)"
  COOP_IN_NIX=1 COOP_YES=1 exec nix-shell -p curl _7zz python3 iproute2 coreutils gnugrep findutils --run "bash '$0'"
fi
have steam || note "Steam is not installed. Add  programs.steam.enable = true;  to configuration.nix, then: sudo nixos-rebuild switch"

# ---- 2. 7-Zip (needed for the server archive) -------------------------------
SEVENZ=""
find_7z() { SEVENZ=""; for c in 7zz 7z 7za; do if have "$c"; then SEVENZ="$c"; return 0; fi; done; return 1; }
find_7z || die "7zz is missing."
# ---- 3. resolve + download + verify ----------------------------------------
say "Finding the Co-op release"
RESOLVED="$(python3 - "${COOP_VERSION:-}" <<'PY'
import json, re, sys, urllib.request, urllib.error
want = sys.argv[1].strip()
API = "https://api.github.com/repos/Bannerlord-Coop-Team/BannerlordCoop/releases/"
OK_HOST = re.compile(r"^https://([a-z0-9.-]+\.)?(github\.com|githubusercontent\.com|r2\.dev)/")
def get(url):
    req = urllib.request.Request(url, headers={"User-Agent": "coop-linux-guide", "Accept": "application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.load(r)
try:
    rel = get(API + ("tags/v" + want.lstrip("v") if want else "latest"))
except urllib.error.HTTPError as e:
    sys.exit("GitHub answered HTTP %s (rate limit, or that release does not exist)." % e.code)
tag, body, assets = rel.get("tag_name", ""), rel.get("body") or "", rel.get("assets") or []
found = {}
man_url = next((a["browser_download_url"] for a in assets if a["name"] == "manifest.json"), "")
if not man_url:
    m = re.search(r"https://[^\s)\"]+/manifest\.json", body)
    man_url = m.group(0) if m else ""
if man_url:
    try:
        man = get(man_url)
        for key, slot in (("client", "client"), ("windows", "server")):
            if man.get(key):
                found[slot] = (man[key]["name"], man[key]["url"], man[key].get("sha256", ""))
        tag = man.get("tag") or tag
    except Exception:
        pass
for name, url, sha in re.findall(r"\[Download ([^\]]+)\]\((https://[^)]+)\)\s*Size: \d+ bytes\. SHA-256: `([0-9a-f]{64})`", body):
    found.setdefault("server" if "DedicatedServer" in name else "client", (name, url, sha))
for slot in ("client", "server"):
    if slot not in found:
        sys.exit("Could not find the %s download in release %s." % (slot, tag))
    name, url, sha = found[slot]
    if not OK_HOST.match(url) or not re.fullmatch(r"[A-Za-z0-9._-]+", name) or not re.fullmatch(r"[0-9a-f]{64}", sha or ""):
        sys.exit("Refusing the %s download: unexpected host, file name or missing SHA-256." % slot)
print("\t".join([tag, *found["client"], *found["server"]]))
PY
)" || die "Could not resolve the Co-op release."
IFS=$'\t' read -r TAG CLIENT_NAME CLIENT_URL CLIENT_SHA SERVER_NAME SERVER_URL SERVER_SHA <<<"$RESOLVED"
say "Co-op release $TAG"
mkdir -p "$COOP_DIR/downloads"
fetch() {  # fetch NAME URL SHA  (resumes, verifies, skips when already good)
  local f="$COOP_DIR/downloads/$1"
  if [ -f "$f" ] && printf '%s  %s\n' "$3" "$f" | sha256sum --check --status; then note "$1 already downloaded and verified."; return 0; fi
  note "Downloading $1 ..."
  curl -fL --retry 3 -C - --progress-bar -o "$f.part" "$2"
  mv -f "$f.part" "$f"
  printf '%s  %s\n' "$3" "$f" | sha256sum --check --status || { rm -f "$f"; die "Checksum mismatch for $1. The file was deleted; run the script again."; }
  note "$1 verified (SHA-256)."
}
fetch "$CLIENT_NAME" "$CLIENT_URL" "$CLIENT_SHA"
if [ "${COOP_SKIP_SERVER:-0}" != 1 ]; then fetch "$SERVER_NAME" "$SERVER_URL" "$SERVER_SHA"; fi

# ---- 4. unpack ---------------------------------------------------------------
say "Unpacking into $COOP_DIR"
if [ ! -f "$COOP_DIR/client-module/Coop/SubModule.xml" ]; then
  python3 - "$COOP_DIR/downloads/$CLIENT_NAME" "$COOP_DIR" <<'PY' || die "The client archive is not what we expected."
import os, shutil, sys, zipfile
zpath, root = sys.argv[1], sys.argv[2]
tmp, dest = os.path.join(root, "client-module.tmp"), os.path.join(root, "client-module", "Coop")
shutil.rmtree(tmp, ignore_errors=True)
zipfile.ZipFile(zpath).extractall(tmp)
hits = [d for d, _, files in os.walk(tmp) if "SubModule.xml" in files]
if not hits:
    sys.exit("no SubModule.xml in the client archive")
shutil.rmtree(os.path.join(root, "client-module"), ignore_errors=True)
shutil.copytree(sorted(hits, key=len)[0], dest)
shutil.rmtree(tmp, ignore_errors=True)
PY
fi
note "Client module: $COOP_DIR/client-module/Coop"
if [ "${COOP_SKIP_SERVER:-0}" = 1 ]; then
  note "COOP_SKIP_SERVER=1: server archive skipped."
elif [ ! -f "$SERVER_DIR/BannerlordCoopServer.exe" ]; then
  find_7z || die "7-Zip is missing."
  rm -rf "$SERVER_DIR.tmp"; mkdir -p "$SERVER_DIR.tmp"
  "$SEVENZ" x -y -bso0 -bsp0 "-o$SERVER_DIR.tmp" "$COOP_DIR/downloads/$SERVER_NAME"
  [ -f "$SERVER_DIR.tmp/BannerlordCoopServer.exe" ] || die "BannerlordCoopServer.exe not found after unpacking."
  rm -rf "$SERVER_DIR"; mv "$SERVER_DIR.tmp" "$SERVER_DIR"
fi
[ -f "$SERVER_DIR/BannerlordCoopServer.exe" ] && note "Server: $SERVER_DIR" || true
printf '%s\n' "$TAG" > "$COOP_DIR/RESOLVED_VERSION.txt"

# ---- 5. launcher (finds Steam + Proton when you run it) ------------------------
cat > "$COOP_DIR/start-server.sh" <<'LAUNCH'
#!/usr/bin/env bash
# Starts the Co-op dedicated server under Proton. Run it from a terminal: the first start asks you to accept the EULA.
set -euo pipefail
COOP_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$COOP_HOME/server"
DATA_DIR="$COOP_HOME/server-data"   # config, saves and logs live here (not inside the Proton prefix)
for d in "$HOME/.local/share/Steam" "$HOME/.steam/steam" "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"; do
  [ -d "$d/steamapps" ] && STEAMROOT="$d" && break
done
: "${STEAMROOT:?Steam library not found. Start Steam once and install Bannerlord, then try again.}"
PROTON="${PROTON:-$(ls -d "$STEAMROOT"/compatibilitytools.d/*/proton "$STEAMROOT"/steamapps/common/Proton*/proton 2>/dev/null | sort -V | tail -n 1 || true)}"
: "${PROTON:?No Proton found. In Steam: Settings > Compatibility (or install Proton-GE), or set PROTON=/path/to/proton.}"
export STEAM_COMPAT_CLIENT_INSTALL_PATH="$STEAMROOT" STEAM_COMPAT_DATA_PATH="$STEAMROOT/steamapps/compatdata/261550"
export STEAM_COMPAT_APP_ID=261550 SteamAppId=261550 SteamGameId=261550
unset PROTON_ENABLE_WAYLAND
mkdir -p "$STEAM_COMPAT_DATA_PATH" "$DATA_DIR"
cd "$SERVER_DIR"
exec "$PROTON" run "$SERVER_DIR/BannerlordCoopServer.exe" --data-dir "Z:$DATA_DIR" --no-watchdog "$@"
LAUNCH
chmod +x "$COOP_DIR/start-server.sh"
note "Launcher: $COOP_DIR/start-server.sh"

# ---- 6. firewall ---------------------------------------------------------------
say "Firewall"
note "NixOS firewall rules are declarative. Add this to configuration.nix, then run: sudo nixos-rebuild switch"
note '  networking.firewall.allowedUDPPortRanges = [ { from = 4200; to = 4201; } ];'

# ---- 7. summary -----------------------------------------------------------------
GAME_MODULES=""
for d in "$HOME/.local/share/Steam" "$HOME/.steam/steam" "$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"; do
  [ -d "$d/steamapps/common/Mount & Blade II Bannerlord/Modules" ] && GAME_MODULES="$d/steamapps/common/Mount & Blade II Bannerlord/Modules" && break
done
say "Done. Co-op $TAG is ready in $COOP_DIR"
cat <<SUMMARY

Still to do by hand (the script cannot do these for you):
  1. Steam: log in, own Bannerlord, install it, and run it once so Proton creates its prefix.
  2. Mod: enable Co-op in the Bannerlord launcher - subscribe on the Steam Workshop (official), or copy
     $COOP_DIR/client-module/Coop into ${GAME_MODULES:-"<Bannerlord folder>/Modules"}/ (same release $TAG for every player).
  3. First server start: run  $COOP_DIR/start-server.sh  in a terminal, read the EULA and answer yourself.
     Then stop it, edit $COOP_DIR/server-data/server-config.json (port, password, saveName) and start it again.
  4. Router: forward UDP 4200-4201 to this PC if players join over the internet (CGNAT can block this).
  5. Check the log shows a "[DedicatedServer] SERVING" line - an open port alone is not proof.
  (NixOS: add  programs.steam.enable = true;  to configuration.nix if Steam is missing. Proton needs Steam's FHS environment, so start the server with:  steam-run "$COOP_DIR/start-server.sh"  (nix-shell -p steam-run).)
SUMMARY
COOP_SETUP_EOF
bash "$HOME/coop-setup.sh"
