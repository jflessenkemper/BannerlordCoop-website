# example inside a Debian distrobox
distrobox create -n coop-tools -i docker.io/library/debian:trixie
distrobox enter coop-tools
sudo apt update && sudo apt install -y curl ca-certificates p7zip-full iproute2 python3