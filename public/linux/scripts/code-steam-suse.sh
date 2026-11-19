# Tumbleweed: Steam is in the non-OSS repository.
sudo zypper modifyrepo --enable repo-non-oss
sudo zypper refresh
sudo zypper install steam
# Leap 16.0 has no "steam" package: use the Flatpak commands under "Other distros".