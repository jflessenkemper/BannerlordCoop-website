sudo firewall-cmd --permanent --add-port=4200-4201/udp
sudo firewall-cmd --reload
sudo firewall-cmd --list-ports