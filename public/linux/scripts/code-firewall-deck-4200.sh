#!/usr/bin/env bash
# SteamOS has no firewall by default. This does not run ufw, firewall-cmd, or pacman.
set -euo pipefail
printf '%s\n' 'SteamOS has no firewall by default. Nothing was changed.'
printf '%s\n' 'Do not run ufw, firewall-cmd, or pacman on the read-only system.'
printf '%s\n' 'If you added a firewall yourself, allow UDP 4200-4201 there.'
