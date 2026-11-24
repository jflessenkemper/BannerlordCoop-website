#!/usr/bin/env bash
# Ubuntu, Linux Mint and Pop!_OS. Skips the install when Steam is already present.
set -euo pipefail
if command -v steam >/dev/null 2>&1 || { command -v flatpak >/dev/null 2>&1 && flatpak info com.valvesoftware.Steam >/dev/null 2>&1; } || [ -d "$HOME/snap/steam/common/.steam/steam/steamapps" ]; then
  printf '%s\n' 'Steam is already installed.'
  exit 0
fi
sudo dpkg --add-architecture i386
sudo apt-get install -y software-properties-common
sudo add-apt-repository -y multiverse
sudo apt-get update
sudo apt-get install -y steam-installer
