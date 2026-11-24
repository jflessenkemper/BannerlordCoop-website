#!/usr/bin/env bash
# Ubuntu, Debian, Linux Mint and Pop!_OS. Installs only what is missing.
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
sudo apt-get update
sudo apt-get install -y curl ca-certificates p7zip-full iproute2 python3
