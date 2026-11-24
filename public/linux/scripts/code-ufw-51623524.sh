#!/usr/bin/env bash
# Ubuntu, Debian, Linux Mint, Pop!_OS and Arch when ufw is the firewall you actually run.
set -euo pipefail
if ! command -v ufw >/dev/null 2>&1; then
  printf '%s\n' 'ufw is not installed, so nothing was opened. Fedora, openSUSE and Bazzite use firewalld instead.' >&2
  exit 1
fi
if ! sudo ufw status | grep -q '^Status: active'; then
  printf '%s\n' 'ufw is installed but not active, so no port was opened. Enable it only if you want a firewall: sudo ufw enable'
  exit 0
fi
sudo ufw allow 4200:4201/udp comment "Bannerlord Co-op"
sudo ufw status
