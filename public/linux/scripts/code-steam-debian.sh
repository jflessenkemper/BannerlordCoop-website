#!/usr/bin/env bash
# Debian. steam-installer is in contrib; its libraries need non-free, plus i386.
set -euo pipefail
if command -v steam >/dev/null 2>&1 || { command -v flatpak >/dev/null 2>&1 && flatpak info com.valvesoftware.Steam >/dev/null 2>&1; }; then
  printf '%s\n' 'Steam is already installed.'
  exit 0
fi
sudo dpkg --add-architecture i386
if ! grep -rqsE '(^|[ :])contrib( |$)' /etc/apt/sources.list /etc/apt/sources.list.d/; then
  printf '%s\n' 'Add contrib and non-free after main in /etc/apt/sources.list or /etc/apt/sources.list.d/*.sources, then run this again.' >&2
  exit 1
fi
sudo apt-get update
sudo apt-get install -y steam-installer
