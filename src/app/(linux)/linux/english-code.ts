import { scriptText } from "./script-text";

export type CodeGroup = { title: string; body: string };

const WHY = "# Why: ";

/** Drops the English notes so the remaining lines are the original commands. */
export function withoutEnglishNotes(text: string): string {
    const kept = text.split("\n").filter((line) => !line.startsWith(WHY));
    return kept.join("\n");
}

/** Steam listings that share a family panel. Only the selected distro's block stays. */
const STEAM_DISTRO: Record<string, string> = {
    "code-steam-ubuntu": "ubuntu",
    "code-steam-debian": "debian",
    "code-steam-fedora": "fedora",
    "code-steam-arch": "arch",
    "code-steam-manjaro": "manjaro",
    "code-steam-suse": "suse",
    "code-steam-immutable": "bazzite",
    "code-steamos-inspection-55952700": "deck",
    "code-steam-nix": "nix",
    "code-steam-flatpak": "other",
};

/** Mint uses the Ubuntu Steam commands. Every other id is shown for every distro. */
export function codeMatchesDistro(id: string, distroId: string): boolean {
    const owner = STEAM_DISTRO[id];
    if (!owner) return true;
    if (owner === distroId) return true;
    return distroId === "mint" && owner === "ubuntu";
}

export const HAND_SECTIONS = new Set(["deps", "steam", "download"]);
export const SKIP_IF_SCRIPT = "Skip this if you ran the script.";
export const IF_IT_STOPS = "If it stops";
export const IF_IT_STOPS_BODY = "Read the last lines in the terminal. Fix that step, then run the script again. Finished steps are skipped.";
export const HAND_SUMMARY = "Set it up by hand";
export const OPTIONAL_TIME = "Optional, about 10 min";
export const OPTIONAL_CODES = new Set([
    "code-dockerfile-wine-11-0-validated-outline-71121604",
    "code-compose-wine-11-0-rootless-podman-outlin-74440469",
]);

/** English pages explain long scripts in place. Other locales keep the original bytes. */
export function englishCodeGroups(id: string): CodeGroup[] | null {
    if (id.startsWith("code-oneshot-")) return [{ title: "", body: annotateOneshot(scriptText(id)) }];
    if (id === "code-resolve-latest-client-server-preferred-87734510") return splitResolve(scriptText(id));
    if (id === "code-install-a-new-isolated-user-service-43365780") return splitService(scriptText(id));
    return null;
}

function annotateOneshot(source: string): string {
    const notes: [string, string][] = [
        ["set -euo pipefail", "Stop at the first error, so a later step cannot run against a half-finished install."],
        ["# ---- 1. checks", "Refuse the wrong distro, a tiny disk, or a machine that cannot reach GitHub, before anything is installed."],
        ["# ---- tools + Steam", "Install curl, 7-Zip and Steam with this distro's package manager. Tools that are already there are left alone."],
        ["# ---- 2. 7-Zip", "The dedicated-server archive is 7z. This finds 7-Zip, or installs a user-only copy when the distro has no package."],
        ["# ---- 3. resolve + download + verify", "Ask GitHub for the client and the Windows server from the same release, then refuse a file whose SHA-256 does not match."],
        ["# ---- 4. unpack", "Unpack only when the folder is missing, so running the script again does not wipe a server you already configured."],
        ["# ---- 5. launcher", "Write start-server.sh. The first run still waits for you to read the EULA; this script does not answer it."],
        ["# ---- 6. firewall", "Open UDP 4200-4201 only when a firewall is already active. A router or cloud firewall is still your step."],
        ["# ---- 7. summary", "Print the steps the script cannot do: Steam login, enabling the mod, and forwarding the port."],
    ];
    let text = source;
    for (const [header, note] of notes) {
        text = insertAfter(text, header, `${WHY}${note}`);
    }
    return text;
}

function insertAfter(source: string, header: string, comment: string): string {
    const lines = source.split("\n");
    const index = lines.findIndex((line) => line === header || line.startsWith(`${header} `) || line.startsWith(header));
    if (index < 0) throw new Error(`Oneshot is missing the section ${header}`);
    lines.splice(index + 1, 0, comment);
    return lines.join("\n");
}

function splitResolve(source: string): CodeGroup[] {
    return slice(source, [
        { title: "Check curl and 7-Zip, and name the release", at: 0, why: "The download is refused up front when curl or 7-Zip is missing, unless you asked to skip the download." },
        { title: "Read the GitHub release into file names and checksums", atLine: "  RESOLVE_PY=\"$TMPDIR_RES/resolve.py\"", why: "The client module and the Windows server must come from the same release, with the published SHA-256." },
        { title: "Download the two archives and unpack the server", atLine: "  STAGE=\"${COOP_STAGE:-$HOME/Games/coop-staging-${TAG}}\"", why: "Files land in a staging folder. A download that fails its checksum is deleted instead of being unpacked." },
        { title: "Unpack the client and compare its version with the server", atLine: "  # Client module extract (same resolved release as the server).", why: "Players and the host have to run the same Co-op release. This warns when the module version does not match." },
        { title: "What a finished download does not prove", atLine: "# Configure data path and port BEFORE starting Proton.", why: "An unpacked server is not running yet. The port and a real SERVING line still have to be checked." },
    ]);
}

function splitService(source: string): CodeGroup[] {
    return slice(source, [
        { title: "Check the paths and that you already accepted the EULA", at: 0, why: "A service must not be the first start. You accept the EULA yourself, in a terminal, before this installs anything." },
        { title: "Write the start and stop scripts", atLine: "  UNIT=\"$HOME/.config/systemd/user/$UNIT_NAME\"", why: "run.sh starts the server under Proton. stop.sh asks that prefix's wineserver to quit, so a stop does not leave the process behind." },
        { title: "Install the user service, then start it yourself", atLine: "  cat > \"$UNIT\" <<UNIT", why: "The unit is only written and checked. Starting it is a separate command, after you have read the config." },
    ]);
}

function slice(source: string, groups: { title: string; at?: number; atLine?: string; why: string }[]): CodeGroup[] {
    const lines = source.split("\n");
    const starts = groups.map((group) => {
        if (group.at !== undefined) return group.at;
        const index = lines.findIndex((line) => line === group.atLine);
        if (index < 0) throw new Error(`Missing split point: ${group.atLine}`);
        return index;
    });
    return groups.map((group, index) => {
        const end = starts[index + 1] ?? lines.length;
        const body = [`${WHY}${group.why}`, ...lines.slice(starts[index], end)].join("\n");
        return { title: group.title, body };
    });
}
