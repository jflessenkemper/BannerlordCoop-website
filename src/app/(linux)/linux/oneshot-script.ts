import parts from "./content/oneshot-parts.json";

type DistroSpec = {
    title: string;
    step1: string;
    step4: string;
    checks: string;
    tools: string;
    seven: string;
    firewall: string;
    summary: string;
};

const distros = parts.distros as Record<string, DistroSpec>;

/** Joins the shared oneshot body with one distro's header, packages, and firewall. */
export function oneshotScript(distroId: string): string {
    const spec = distros[distroId];
    if (!spec) throw new Error(`Unknown oneshot distro: ${distroId}`);
    const header = parts.headerTemplate
        .replace("@@TITLE@@", spec.title)
        .replace("@@STEP1@@", spec.step1)
        .replace("@@STEP4@@", spec.step4);
    const checks = part(parts.checks, spec.checks, "checks");
    const tools = part(parts.tools, spec.tools, "tools");
    const seven = part(parts.seven, spec.seven, "seven");
    const firewall = part(parts.firewall, spec.firewall, "firewall");
    const summary = part(parts.summary, spec.summary, "summary");
    return header + checks + tools + seven + parts.resolve + parts.unpack + parts.launcher + firewall + summary;
}

/** Reads one named fragment and refuses a missing piece instead of emitting a hole. */
function part(group: Record<string, string>, name: string, label: string): string {
    const text = group[name];
    if (!text) throw new Error(`Missing oneshot ${label} fragment: ${name}`);
    return text;
}
