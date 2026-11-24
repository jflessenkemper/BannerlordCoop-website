#!/usr/bin/env bash
# NixOS enables Steam in configuration.nix. This prints the line; it does not edit the file.
set -euo pipefail
cat <<'NIX'
programs.steam.enable = true;
NIX
printf '%s\n' 'Add that line to /etc/nixos/configuration.nix, then run: sudo nixos-rebuild switch'
