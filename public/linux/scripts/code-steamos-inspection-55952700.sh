#!/usr/bin/env bash
# SteamOS is read-only. These checks do not install anything and do not run pacman.
set -euo pipefail
printf '%s\n' 'SteamOS is read-only. Do not run pacman.'
command -v steam >/dev/null 2>&1 && printf '%s\n' 'Steam: yes' || printf '%s\n' 'Steam: not on PATH (Desktop Mode ships it)'
command -v flatpak >/dev/null 2>&1 && printf '%s\n' 'Flatpak: yes' || printf '%s\n' 'Flatpak: no'
command -v curl >/dev/null 2>&1 && printf '%s\n' 'curl: yes' || printf '%s\n' 'curl: missing (use a Distrobox, not pacman)'
command -v python3 >/dev/null 2>&1 && printf '%s\n' 'python3: yes' || printf '%s\n' 'python3: missing (use a Distrobox, not pacman)'
command -v ss >/dev/null 2>&1 && printf '%s\n' 'ss: yes' || printf '%s\n' 'ss: missing (use a Distrobox, not pacman)'
if command -v 7zz >/dev/null 2>&1 || command -v 7z >/dev/null 2>&1; then printf '%s\n' '7-Zip: yes'; else printf '%s\n' '7-Zip: missing (the one-script setup can fetch a user-space copy)'; fi
