#!/usr/bin/env bash
# Bazzite ships Steam. Do not install a second copy, and do not run dnf or rpm-ostree.
set -euo pipefail
if command -v steam >/dev/null 2>&1 || { command -v flatpak >/dev/null 2>&1 && flatpak info com.valvesoftware.Steam >/dev/null 2>&1; }; then
  printf '%s\n' 'Steam is already installed. Not installing a second copy.'
  exit 0
fi
if ! command -v flatpak >/dev/null 2>&1; then
  printf '%s\n' 'Flatpak is missing. Install Steam from the Bazzite store. Do not run dnf or rpm-ostree.' >&2
  exit 1
fi
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install --user -y flathub com.valvesoftware.Steam
