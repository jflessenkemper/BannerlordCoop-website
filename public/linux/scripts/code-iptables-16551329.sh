# Insert before any REJECT/DROP rule (check: sudo iptables -L INPUT -n --line-numbers)
sudo iptables -I INPUT 1 -p udp --dport 4200:4201 -j ACCEPT
# Persist with your distro iptables-save flow