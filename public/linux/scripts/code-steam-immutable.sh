# Bazzite ships Steam. Check first; do not install a second copy.
command -v steam || flatpak list --app | grep -i steam
# Not installed? Flatpak Steam, for your user only:
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install --user -y flathub com.valvesoftware.Steam