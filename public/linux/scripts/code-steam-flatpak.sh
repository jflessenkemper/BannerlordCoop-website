# Needs Flatpak. Flathub is added for your user only (no root).
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
flatpak install --user -y flathub com.valvesoftware.Steam
flatpak run com.valvesoftware.Steam
# The library lives here (open Steam once so it exists):
export STEAMROOT="$HOME/.var/app/com.valvesoftware.Steam/.local/share/Steam"
ls "$STEAMROOT/steamapps"
# If the server lives outside ~/.var, grant that folder only:
#   flatpak override --user --filesystem="$HOME/Games/BannerlordCoop" com.valvesoftware.Steam
# Avoid --filesystem=home unless a narrower path fails.