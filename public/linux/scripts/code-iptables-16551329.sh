#!/usr/bin/env bash
# Last resort when the machine has neither ufw nor firewalld. The rule is not saved across reboot.
set -euo pipefail
if ! command -v iptables >/dev/null 2>&1; then
  printf '%s\n' 'iptables is not installed, so nothing was opened.' >&2
  exit 1
fi
sudo iptables -I INPUT 1 -p udp --dport 4200:4201 -j ACCEPT
sudo iptables -L INPUT -n --line-numbers | head -n 5
printf '%s\n' 'Allowed UDP 4200-4201 until reboot. Persist it with your distro iptables-save flow.'
