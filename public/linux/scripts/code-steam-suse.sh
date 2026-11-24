#!/usr/bin/env bash
# openSUSE. Tumbleweed has a steam package in the non-OSS repo. Leap often does not.
set -euo pipefail
if command -v steam >/dev/null 2>&1 || { command -v flatpak >/dev/null 2>&1 && flatpak info com.valvesoftware.Steam >/dev/null 2>&1; }; then
  printf '%s\n' 'Steam is already installed.'
  exit 0
fi
for repo in repo-non-oss openSUSE:repo-non-oss; do sudo zypper --non-interactive modifyrepo --enable "$repo" 2>/dev/null || true; done
sudo zypper --non-interactive refresh
if ! sudo zypper --non-interactive install steam; then
  printf '%s\n' 'No steam package for this openSUSE release. Installing Flatpak Steam for your user.'
  command -v flatpak >/dev/null 2>&1 || sudo zypper --non-interactive install flatpak
  flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
  flatpak install --user -y flathub com.valvesoftware.Steam
fi
