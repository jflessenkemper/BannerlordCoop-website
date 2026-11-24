#!/usr/bin/env bash
# NixOS firewall rules are declarative. This prints the line; it does not edit the file.
set -euo pipefail
cat <<'NIX'
networking.firewall.allowedUDPPortRanges = [ { from = 4200; to = 4201; } ];
NIX
printf '%s\n' 'Add that line to /etc/nixos/configuration.nix, then run: sudo nixos-rebuild switch'
