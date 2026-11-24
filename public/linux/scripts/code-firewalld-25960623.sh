#!/usr/bin/env bash
# Fedora, Nobara, openSUSE and Bazzite. Also Arch if you run firewalld.
set -euo pipefail
if ! command -v firewall-cmd >/dev/null 2>&1; then
  printf '%s\n' 'firewall-cmd is not installed, so nothing was opened. Ubuntu and Linux Mint usually use ufw.' >&2
  exit 1
fi
if ! sudo firewall-cmd --state >/dev/null 2>&1; then
  printf '%s\n' 'firewalld is not running, so no port was opened. Start it only if this machine uses firewalld: sudo systemctl enable --now firewalld'
  exit 0
fi
sudo firewall-cmd --permanent --add-port=4200-4201/udp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports
