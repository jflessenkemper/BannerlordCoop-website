#!/usr/bin/env bash
# openSUSE Tumbleweed and Leap. Tumbleweed has the 7zip package; older Leap has p7zip.
set -euo pipefail
need=0
command -v curl >/dev/null 2>&1 || need=1
command -v python3 >/dev/null 2>&1 || need=1
command -v ss >/dev/null 2>&1 || need=1
command -v 7z >/dev/null 2>&1 || command -v 7zz >/dev/null 2>&1 || command -v 7za >/dev/null 2>&1 || need=1
if [ "$need" = 0 ]; then
  printf '%s\n' 'curl, 7-Zip, python3 and ss are already installed.'
  exit 0
fi
sudo zypper --non-interactive install curl python3 iproute2
sudo zypper --non-interactive install 7zip || sudo zypper --non-interactive install p7zip
