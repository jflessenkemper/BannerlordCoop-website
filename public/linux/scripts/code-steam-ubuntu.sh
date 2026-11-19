# Ubuntu and Linux Mint: Steam is in the multiverse repository, with 32-bit support.
sudo dpkg --add-architecture i386
sudo apt install -y software-properties-common
sudo add-apt-repository -y multiverse
sudo apt update
sudo apt install -y steam-installer