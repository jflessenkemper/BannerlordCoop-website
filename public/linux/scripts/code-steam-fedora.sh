#!/usr/bin/env bash
# Fedora and Nobara. Steam comes from RPM Fusion. Immutable images must not run dnf.
set -euo pipefail
if [ -r /etc/os-release ]; then . /etc/os-release; fi
if [ "${ID:-}" = bazzite ] || [ -f /run/ostree-booted ]; then
  printf '%s\n' 'This system is immutable. Do not run dnf. Use the Bazzite instructions.' >&2
  exit 1
fi
if command -v steam >/dev/null 2>&1 || { command -v flatpak >/dev/null 2>&1 && flatpak info com.valvesoftware.Steam >/dev/null 2>&1; }; then
  printf '%s\n' 'Steam is already installed.'
  exit 0
fi
sudo dnf install -y "https://mirrors.rpmfusion.org/free/fedora/rpmfusion-free-release-$(rpm -E %fedora).noarch.rpm" \
  "https://mirrors.rpmfusion.org/nonfree/fedora/rpmfusion-nonfree-release-$(rpm -E %fedora).noarch.rpm"
sudo dnf install -y steam
