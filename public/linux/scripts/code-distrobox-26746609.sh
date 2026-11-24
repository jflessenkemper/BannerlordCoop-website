#!/usr/bin/env bash
# Bazzite and SteamOS have a read-only root. Do not run dnf, rpm-ostree, or pacman on the host.
# Install the tools inside a container, then use them there.
set -euo pipefail
command -v distrobox >/dev/null 2>&1 || { printf '%s\n' 'distrobox is not installed.' >&2; exit 1; }
if ! distrobox list --no-header 2>/dev/null | awk '{ print $1 }' | grep -qx coop-tools; then
  distrobox create -n coop-tools -i docker.io/library/debian:trixie
fi
printf '%s\n' 'Enter the container and install only the tools that are missing:'
printf '%s\n' '  distrobox enter coop-tools'
printf '%s\n' '  sudo apt-get update && sudo apt-get install -y curl ca-certificates p7zip-full iproute2 python3'
