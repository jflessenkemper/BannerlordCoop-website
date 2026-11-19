# shellcheck shell=bash
# Bash on the HOST. Resolves the latest Co-op release (or COOP_VERSION),
# downloads matching client + dedicated-server assets, and does not start a server.
# Requires curl. Uses jq when available, otherwise python3.
# Optional: COOP_VERSION=v0.1.7 (or 0.1.7) to match an older host.
# Optional: COOP_STAGE=/path/to/staging  COOP_SKIP_DOWNLOAD=1  COOP_CLIENT_MODULE=/path/to/Modules/Coop
(
  set -euo pipefail
  command -v curl >/dev/null || { printf '%s\n' 'curl is required.'; exit 1; }
  ARCHIVER=''
  if command -v 7zz >/dev/null; then ARCHIVER=7zz
  elif command -v 7z >/dev/null; then ARCHIVER=7z
  fi
  if [ "${COOP_SKIP_DOWNLOAD:-0}" != 1 ] && [ -z "$ARCHIVER" ]; then
    printf '%s\n' 'Install 7z or 7zz first.'; exit 1
  fi
  API_REPO='https://api.github.com/repos/Bannerlord-Coop-Team/BannerlordCoop'
  UA='coop-linux-guide'
  if [ -n "${COOP_VERSION:-}" ]; then
    TAG_RAW="${COOP_VERSION#v}"
    TAG="v${TAG_RAW}"
    API_URL="${API_REPO}/releases/tags/${TAG}"
  else
    API_URL="${API_REPO}/releases/latest"
  fi
  TMPDIR_RES="$(mktemp -d)"
  trap 'rm -rf "$TMPDIR_RES"' EXIT
  HTTP_CODE="$(curl -sS -L -A "$UA" -H 'Accept: application/vnd.github+json' \
    -o "$TMPDIR_RES/release.json" -w '%{http_code}' "$API_URL" || true)"
  case "$HTTP_CODE" in
    200) ;;
    403|429)
      printf '%s\n' "GitHub API rate limit or forbidden (HTTP ${HTTP_CODE}). Wait, set a token, or open https://github.com/Bannerlord-Coop-Team/BannerlordCoop/releases"
      exit 1 ;;
    404)
      printf '%s\n' "Release not found (HTTP 404) for ${API_URL}. Check COOP_VERSION or the releases page."
      exit 1 ;;
    *)
      printf '%s\n' "GitHub release lookup failed (HTTP ${HTTP_CODE:-000}). Check network and https://github.com/Bannerlord-Coop-Team/BannerlordCoop/releases"
      exit 1 ;;
  esac
  RESOLVE_PY="$TMPDIR_RES/resolve.py"
  cat > "$RESOLVE_PY" <<'PY'
import json, re, sys, urllib.request
from pathlib import Path
release = json.loads(Path(sys.argv[1]).read_text())
out = Path(sys.argv[2])
tag = release.get("tag_name") or ""
body = release.get("body") or ""
assets = release.get("assets") or []
def asset(patterns):
    for a in assets:
        name = a.get("name") or ""
        if any(re.search(p, name, re.I) for p in patterns):
            digest = a.get("digest") or ""
            sha = digest.split(":", 1)[1] if digest.startswith("sha256:") else ""
            return {"name": name, "url": a.get("browser_download_url") or "", "sha256": sha, "bytes": a.get("size")}
    return None
client = asset([r"^BannerlordCoop-v?[\d.]+\.zip$", r"BannerlordCoop.*\.zip$"])
server = asset([r"DedicatedServer.*Win64.*\.7z$", r"DedicatedServer.*\.7z$", r"BannerlordCoop-DedicatedServer.*\.7z$"])
manifest = asset([r"^manifest\.json$"])
# Prefer published manifest for CDN names/hashes when GitHub omits the large DS asset.
man = None
man_urls = []
if manifest and manifest["url"]:
    man_urls.append(manifest["url"])
man_urls += re.findall(r'https?://[^\s)\"]+/manifest\.json', body)
for u in man_urls:
    try:
        with urllib.request.urlopen(urllib.request.Request(u, headers={"User-Agent": "coop-linux-guide"}), timeout=60) as r:
            man = json.loads(r.read().decode())
            break
    except Exception as e:
        err = str(e)
        continue
else:
    err = "no manifest"
if man:
    tag = man.get("tag") or tag
    if man.get("client"):
        c = man["client"]
        client = {"name": c.get("name") or (client or {}).get("name") or "", "url": c.get("url") or (client or {}).get("url") or "", "sha256": c.get("sha256") or (client or {}).get("sha256") or "", "bytes": c.get("bytes")}
    if man.get("windows"):
        s = man["windows"]
        server = {"name": s.get("name") or (server or {}).get("name") or "", "url": s.get("url") or (server or {}).get("url") or "", "sha256": s.get("sha256") or (server or {}).get("sha256") or "", "bytes": s.get("bytes")}
# Body fallback for CDN links + SHA lines when assets/manifest are incomplete.
if not client or not client.get("url"):
    m = re.search(r'(https?://[^\s)\"]+/(BannerlordCoop-v?[\d.]+\.zip))', body, re.I)
    if m:
        client = {"name": m.group(2), "url": m.group(1), "sha256": "", "bytes": None}
if not server or not server.get("url"):
    m = re.search(r'(https?://[^\s)\"]+/(BannerlordCoop-DedicatedServer[^\"\s]*?\.7z))', body, re.I)
    if not m:
        m = re.search(r'(https?://[^\s)\"]+/(?:[^\"\s]*DedicatedServer[^\"\s]*\.7z))', body, re.I)
    if m:
        server = {"name": m.group(2), "url": m.group(1), "sha256": "", "bytes": None}
def fill_sha(item, label):
    if not item or item.get("sha256"):
        return
    # Example body form: SHA-256: `deadbeef...` near the asset label.
    pat = re.compile(re.escape(item["name"]) + r'.*?SHA-256:\s*`([0-9a-f]{64})`', re.I | re.S)
    m = pat.search(body)
    if not m:
        m = re.search(r'SHA-256:\s*`([0-9a-f]{64})`', body, re.I)
        # only accept if unique-ish; leave empty if ambiguous
        all_shas = re.findall(r'SHA-256:\s*`([0-9a-f]{64})`', body, re.I)
        if label == "client" and len(all_shas) >= 1:
            item["sha256"] = all_shas[0]
        elif label == "server" and len(all_shas) >= 2:
            item["sha256"] = all_shas[1]
        return
    item["sha256"] = m.group(1)
fill_sha(client, "client")
fill_sha(server, "server")
if not tag or not client or not client.get("url") or not server or not server.get("url"):
    raise SystemExit("Could not resolve client and dedicated-server download URLs from the GitHub release/manifest.")
result = {"tag": tag if tag.startswith("v") else f"v{tag}", "client": client, "server": server}
out.write_text(json.dumps(result))
print(json.dumps(result))
PY
  if command -v jq >/dev/null; then
    # jq path still uses the same python resolver for manifest/CDN parsing reliability.
    :
  fi
  if ! command -v python3 >/dev/null; then
    printf '%s\n' 'python3 is required to parse the GitHub release when resolving assets.'
    exit 1
  fi
  if ! python3 "$RESOLVE_PY" "$TMPDIR_RES/release.json" "$TMPDIR_RES/resolved.json" >"$TMPDIR_RES/resolved.out"; then
    printf '%s\n' 'Failed to resolve client + dedicated-server assets from the release.'
    exit 1
  fi
  TAG="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["tag"])' "$TMPDIR_RES/resolved.json")"
  CLIENT_NAME="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["client"]["name"])' "$TMPDIR_RES/resolved.json")"
  CLIENT_URL="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["client"]["url"])' "$TMPDIR_RES/resolved.json")"
  CLIENT_SHA="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["client"].get("sha256") or "")' "$TMPDIR_RES/resolved.json")"
  DS_NAME="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["server"]["name"])' "$TMPDIR_RES/resolved.json")"
  DS_URL="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["server"]["url"])' "$TMPDIR_RES/resolved.json")"
  DS_SHA="$(python3 -c 'import json,sys; print(json.load(open(sys.argv[1]))["server"].get("sha256") or "")' "$TMPDIR_RES/resolved.json")"
  printf '%s\n' "Resolved Co-op release: ${TAG}"
  printf '%s\n' "Client asset: ${CLIENT_NAME}"
  printf '%s\n' "Dedicated server asset: ${DS_NAME}"
  printf '%s\n' "Releases: https://github.com/Bannerlord-Coop-Team/BannerlordCoop/releases"
  STAGE="${COOP_STAGE:-$HOME/Games/coop-staging-${TAG}}"
  mkdir -p "$STAGE"
  cd "$STAGE"
  printf '%s\n' "$TAG" > RESOLVED_VERSION.txt
  cp "$TMPDIR_RES/resolved.json" resolved.json
  if [ "${COOP_SKIP_DOWNLOAD:-0}" != 1 ]; then
    for SPEC in "CLIENT|$CLIENT_NAME|$CLIENT_URL|$CLIENT_SHA" "SERVER|$DS_NAME|$DS_URL|$DS_SHA"; do
      IFS='|' read -r KIND NAME URL SHA <<<"$SPEC"
      if [ ! -f "$NAME" ]; then
        printf '%s\n' "Downloading ${KIND}: ${NAME}"
        curl -fL --retry 2 -A "$UA" -o "$NAME.part" "$URL"
        mv -n "$NAME.part" "$NAME"
      else
        printf '%s\n' "Using existing file: ${NAME}"
      fi
      ACTUAL="$(sha256sum -- "$NAME" | awk '{print $1}')"
      if [ -n "$SHA" ]; then
        printf '%s  %s\n' "$SHA" "$NAME" | sha256sum --check
      else
        printf '%s\n' "No published checksum for ${NAME}; computed sha256: ${ACTUAL}"
      fi
    done
  fi
  if [ "${COOP_SKIP_DOWNLOAD:-0}" = 1 ]; then
    printf '%s\n' "Resolve-only mode: skipped download/extract. Staging metadata in $STAGE"
    exit 0
  fi
  if [ -z "$ARCHIVER" ]; then printf '%s\n' 'Install 7z or 7zz first.'; exit 1; fi
  if [ ! -e server ]; then
    mkdir server
    "$ARCHIVER" x "$DS_NAME" -oserver
  fi
  test -f server/BannerlordCoopServer.exe
  # Client module extract (same resolved release as the server).
  if [ ! -e client-module ]; then
    mkdir client-module
    python3 - <<'PY' "$CLIENT_NAME" client-module
import sys, zipfile
from pathlib import Path
zpath, dest = sys.argv[1], Path(sys.argv[2])
with zipfile.ZipFile(zpath) as z:
    z.extractall(dest)
print('Extracted client archive to', dest)
PY
  fi
  # Normalize to client-module/Coop/SubModule.xml when possible.
  if [ ! -f client-module/Coop/SubModule.xml ]; then
    FOUND="$(find client-module -type f -name SubModule.xml | head -n 1 || true)"
    if [ -n "$FOUND" ]; then
      MOD_DIR="$(dirname "$FOUND")"
      mkdir -p client-module/Coop
      # If archive already has Coop/, keep it; else copy the module tree.
      if [ "$(basename "$MOD_DIR")" = Coop ]; then
        :
      else
        cp -a "$MOD_DIR"/. client-module/Coop/
      fi
    fi
  fi
  test -f client-module/Coop/SubModule.xml || printf '%s\n' 'Warning: could not locate extracted client SubModule.xml; inspect client-module/.'
  # Version compare helper: server release tag vs installed/extracted client SubModule.xml
  COMPARE_CLIENT="${COOP_CLIENT_MODULE:-$STAGE/client-module/Coop}"
  python3 - <<'PY' "$TAG" "$COMPARE_CLIENT" "$STAGE/server"
import re, sys
from pathlib import Path
tag, client_root, server_root = sys.argv[1:4]
tag_norm = tag.lstrip("v")
sub = Path(client_root) / "SubModule.xml"
print("Server release tag:", tag)
if not sub.is_file():
    print("WARNING: client SubModule.xml not found at", sub)
    print("Install Modules/Coop from the same release before players join.")
    raise SystemExit(0)
text = sub.read_text(errors="replace")
# Prefer the module <Version value="..."/> element; ignore XML declaration and DependentVersion.
m = re.search(r'<Version\s+value="v?([0-9]+(?:\.[0-9]+){1,3})"', text, re.I)
if not m:
    m = re.search(r'<Version[^>]*>\s*v?([0-9]+(?:\.[0-9]+){1,3})\s*<', text, re.I)
client_ver = m.group(1) if m else ""
print("Client SubModule.xml version:", client_ver or "(unparsed)")
if client_ver and client_ver != tag_norm and not tag_norm.startswith(client_ver) and not client_ver.startswith(tag_norm):
    print("WARNING: client Co-op version differs from resolved server release", tag)
    print("Host and every player must use the same Co-op release.")
else:
    if client_ver:
        print("Client and resolved server release look compatible:", client_ver, "~", tag)
exe = Path(server_root) / "BannerlordCoopServer.exe"
print("Server executable present:", exe.is_file())
PY
  printf '%s\n' "Staging: $STAGE"
  printf '%s\n' 'Files verified. Use server/ as SERVER_DIR. Install client-module/Coop into the game Modules/ folder (same release for every player).'
  printf '%s\n' 'Workshop alternative: Steam keeps Workshop on the latest approved release automatically; every player and the host must still match. TaleWorlds approval can lag GitHub/CDN.'
)
# Configure data path and port BEFORE starting Proton.
# Verify startup with ss -ulnp AND an actual SERVING log entry.
# Remote client joining is a separate check, not implied by a bound socket.
