#!/usr/bin/env bash
# Manjaro. Multilib is enabled by default. Does not upgrade the whole system.
set -euo pipefail
if [ -r /etc/os-release ]; then . /etc/os-release; fi
if [ "${ID:-}" = steamos ] || [ -x /usr/bin/steamos-readonly ]; then
  printf '%s\n' 'SteamOS is read-only. Do not run pacman. Use the Steam Deck instructions.' >&2
  exit 1
fi
if command -v steam >/dev/null 2>&1 || { command -v flatpak >/dev/null 2>&1 && flatpak info com.valvesoftware.Steam >/dev/null 2>&1; }; then
  printf '%s\n' 'Steam is already installed.'
  exit 0
fi
sudo pacman -S --needed steam
