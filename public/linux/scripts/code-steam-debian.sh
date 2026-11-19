# Debian: steam-installer is in "contrib" (its libraries need "non-free"), plus 32-bit support.
sudo dpkg --add-architecture i386
# Add "contrib non-free" after "main" in /etc/apt/sources.list or /etc/apt/sources.list.d/*.sources, then:
sudo apt update
sudo apt install -y steam-installer