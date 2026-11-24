#!/usr/bin/env bash
# Fedora and Nobara. 7zip is the package on Fedora 41+. Older releases use p7zip.
# Immutable images (Bazzite, Silverblue, Kinoite) must not run dnf.
set -euo pipefail
if [ -r /etc/os-release ]; then . /etc/os-release; fi
if [ "${ID:-}" = bazzite ] || [ -f /run/ostree-booted ]; then
  printf '%s\n' 'This system is immutable. Do not run dnf or rpm-ostree. Use the Bazzite instructions.' >&2
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
sudo dnf install -y curl python3 iproute
sudo dnf install -y 7zip || sudo dnf install -y p7zip p7zip-plugins
