#!/usr/bin/env bash
# Arch, EndeavourOS and CachyOS. Enables multilib when it is still commented out.
# Does not upgrade the whole system. SteamOS must not run pacman.
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
if ! grep -q '^\[multilib\]' /etc/pacman.conf; then
  sudo sed -i '/^#\[multilib\]/{s/^#//;n;s/^#//}' /etc/pacman.conf
  grep -q '^\[multilib\]' /etc/pacman.conf || printf '\n[multilib]\nInclude = /etc/pacman.d/mirrorlist\n' | sudo tee -a /etc/pacman.conf >/dev/null
fi
sudo pacman -S --needed steam
