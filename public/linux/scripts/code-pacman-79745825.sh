#!/usr/bin/env bash
# Arch, Manjaro, EndeavourOS and CachyOS. Does not upgrade the whole system.
# SteamOS is read-only: do not run pacman there.
set -euo pipefail
if [ -r /etc/os-release ]; then . /etc/os-release; fi
if [ "${ID:-}" = steamos ] || [ -x /usr/bin/steamos-readonly ]; then
  printf '%s\n' 'SteamOS is read-only. Do not run pacman. Use the Steam Deck instructions.' >&2
  exit 1
fi
need=0
command -v curl >/dev/null 2>&1 || need=1
command -v python3 >/dev/null 2>&1 || need=1
command -v ss >/dev/null 2>&1 || need=1
command -v 7z >/dev/null 2>&1 || command -v 7zz >/dev/null 2>&1 || command -v 7za >/dev/null 2>&1 || need=1
if [ "$need" = 0 ]; then
  printf '%s\n' 'curl, 7-Zip, python3 and ss are already installed.'
  exit 0
fi
sudo pacman -S --needed curl 7zip python iproute2
