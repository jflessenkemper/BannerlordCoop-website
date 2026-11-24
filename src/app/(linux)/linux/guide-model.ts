import sectionData from "./content/sections.json";
import type { TranslationParams } from "@/app/lib/localization/types";

/** Section ids the shell and the hash router share with the content file. */
export const FAQ_SECTION = "faq";
export const ONESHOT_SECTION = "terminal";
export const AI_FAQ_ID = "faq-ai-assistant";
export const TROUBLESHOOTING_SECTION = "troubleshooting";

/** Manual setup, one task per screen. The one-script path is a shorter list. */
export const MANUAL_STEPS = ["overview", "deps", "steam", "download", "launch", "configure", "firewall", "service", "client", "backups"] as const;
export const SCRIPT_STEPS = ["terminal", "launch", "configure", "client"] as const;
export const WIZARD_STEPS = MANUAL_STEPS;
export type WizardFlow = "manual" | "script";
export type WizardStep = (typeof MANUAL_STEPS)[number] | (typeof SCRIPT_STEPS)[number];

/** The step list for a path. Terminal belongs only to the one-script path. */
export function wizardSteps(flow: WizardFlow = "manual"): readonly WizardStep[] {
    return flow === "script" ? SCRIPT_STEPS : MANUAL_STEPS;
}

/** One-script pages stay on that path. A shared step follows the requested path. */
export function wizardFlowFor(step: string, requested?: string | null): WizardFlow {
    if (requested === "script") return "script";
    if ((SCRIPT_STEPS as readonly string[]).includes(step) && !(MANUAL_STEPS as readonly string[]).includes(step)) return "script";
    return "manual";
}

export type Inline =
    | { t: "text"; k: string }
    | { t: "br" }
    | { t: "code"; v?: string; k?: string }
    | { t: "strong" | "em"; c: Inline[] }
    | { t: "a"; href: string; c: Inline[] }
    | { t: "term"; termKey: string; defKey: string; labelKey?: string };

export type Block =
    | { type: "p"; c: Inline[]; role?: string }
    | { type: "h3"; c: Inline[] }
    | { type: "ul" | "ol"; className?: string; items: Inline[][] }
    | { type: "callout"; kind: "warn" | "info" | "ok"; titleKey: string; id?: string; blocks: Block[] }
    | { type: "tabs"; name: string; labelKey: string; tabs: GuideTab[] }
    | { type: "code"; id: string; title: Inline[]; langKey: string; oneshot?: boolean; bare?: boolean; download?: { href: string; filename: string; labelKey: string; titleKey: string } }
    | { type: "details"; id?: string; className?: string; summary: Inline[]; blocks: Block[] }
    | { type: "sectionRefs"; ids: string[]; summary: Inline[]; when?: "alone" }
    | { type: "table"; id?: string; headerKeys: string[]; rows: { id?: string; cells: Inline[][] }[] }
    | { type: "dl"; items: { dt: Inline[]; dd: Inline[] }[] }
    | { type: "field"; label: Inline[]; placeholder?: string }
    | { type: "columns"; columns: { blocks: Block[] }[] }
    | { type: "flow"; lead?: Inline[]; before?: Block[]; steps: { action: Inline[]; blocks?: Block[]; note?: Inline[] }[]; check?: Block[]; recover?: boolean | "script"; extra?: Block[] };

export type GuideTab = { labelKey: string; script?: string; scripts?: string[]; families?: string[]; blocks: Block[] };

export type Section = { id: string; kickerKey: string; titleKey: string; subKey: string; blocks: Block[] };

export type Distro = {
    id: string;
    family: string;
    color: string;
    glyph: string;
    art: boolean;
    nameKey: string;
    blurbKey: string;
    svg: string;
};

export type GuideRoute =
    | { view: "start" }
    | { view: "distro" }
    | { view: "done" }
    | { view: "wizard"; step: WizardStep }
    | { view: "manual"; section?: string; openAi?: boolean };

export const sections = (sectionData as { sections: Section[] }).sections;
export const sectionsById = new Map(sections.map((section) => [section.id, section]));

/** Checklist stages follow the manual task order, with the one-script page after the overview. */
export const CHECKLIST_IDS = ["overview", "terminal", "deps", "steam", "download", "launch", "configure", "firewall", "service", "client", "backups", "troubleshooting", "faq", "linux-notes", "agents"] as const;
export const checklistSections = CHECKLIST_IDS.map((id) => {
    const section = sectionsById.get(id);
    if (!section) throw new Error(`Missing checklist section: ${id}`);
    return section;
});
export const sectionIds = new Set(sections.map((section) => section.id));

/** Narrows a hash fragment to a step the wizard actually renders. */
export function isWizardStep(step: string): step is WizardStep {
    return (MANUAL_STEPS as readonly string[]).includes(step) || (SCRIPT_STEPS as readonly string[]).includes(step);
}

/** Previous step, or the completion screen after the last setup step. */
export function wizardNeighbors(step: string, flow: WizardFlow = "manual"): { previous: GuideRoute | null; next: GuideRoute } {
    const steps = wizardSteps(flow);
    const index = steps.indexOf(step as WizardStep);
    const at = index < 0 ? 0 : index;
    const previous = at > 0 ? { view: "wizard" as const, step: steps[at - 1] } : null;
    const next = at >= steps.length - 1 ? { view: "done" as const } : { view: "wizard" as const, step: steps[at + 1] };
    return { previous, next };
}

/** FAQ, the assistant alias, and the completion screen do not ask for a distro. */
export function skipsDistro(route: GuideRoute): boolean {
    if (route.view === "done") return true;
    return route.view === "manual" && (route.section === FAQ_SECTION || route.openAi === true);
}

/** Sends command routes to the picker until a distro is known. */
export function resolveRoute(requested: GuideRoute, distroId: string | null): GuideRoute {
    if (distroId || requested.view === "start" || requested.view === "distro" || skipsDistro(requested)) return requested;
    return { view: "distro" };
}

/** The distro chip is hidden on the menu, the picker, the FAQ, and the completion screen. */
export function showsDistroChip(route: GuideRoute, distroId: string | null): boolean {
    if (!distroId || skipsDistro(route)) return false;
    return route.view === "wizard" || route.view === "manual";
}

/** Canonical path for a route. Legacy hashes redirect here. */
export function routePath(route: GuideRoute): string {
    if (route.view === "start") return "/linux";
    if (route.view === "distro") return "/linux/distro";
    if (route.view === "done") return "/linux/done";
    if (route.view === "wizard") return `/linux/step/${route.step}`;
    if (route.section === FAQ_SECTION) return "/linux/faq";
    if (route.section === ONESHOT_SECTION) return "/linux/script";
    return "/linux/checklist";
}

/** Reads a pathname produced by `routePath`. Unknown paths are the menu. */
export function parsePathname(pathname: string): GuideRoute {
    const path = pathname.replace(/\/$/, "") || "/linux";
    if (path === "/linux/distro") return { view: "distro" };
    if (path === "/linux/done") return { view: "done" };
    if (path === "/linux/faq") return { view: "manual", section: FAQ_SECTION };
    if (path === "/linux/script") return { view: "manual", section: ONESHOT_SECTION };
    if (path === "/linux/checklist") return { view: "manual" };
    const stepMatch = /^\/linux\/step\/([^/]+)$/.exec(path);
    if (stepMatch) {
        let step = stepMatch[1];
        try { step = decodeURIComponent(step); } catch { /* keep the raw segment */ }
        if (isWizardStep(step)) return { view: "wizard", step };
    }
    return { view: "start" };
}

/** Hash for a route. The menu is `#start` so an empty URL can stay the canonical page. */
export function routeHash(route: GuideRoute): string {
    if (route.view === "start") return "#start";
    if (route.view === "distro") return "#distro";
    if (route.view === "done") return "#done";
    if (route.view === "wizard") return `#wizard/${encodeURIComponent(route.step)}`;
    if (route.section) return `#manual/${encodeURIComponent(route.section)}`;
    return "#manual";
}

/** Reads a location hash, including the old `#ai` and `#sec/<id>` aliases. */
export function parseRoute(hash: string, ids: ReadonlySet<string> = sectionIds): GuideRoute {
    const raw = hash.replace(/^#/, "");
    if (!raw || raw === "start") return { view: "start" };
    if (raw === "done") return { view: "done" };
    const parts = raw.split("/").map((part) => {
        try {
            return decodeURIComponent(part);
        } catch {
            return part;
        }
    });
    const view = parts[0];
    if (view === "ai") return { view: "manual", section: FAQ_SECTION, openAi: true };
    if (view === "sec" && parts[1] && ids.has(parts[1])) return { view: "manual", section: parts[1] };
    if (view === "distro") return { view: "distro" };
    if (view === "wizard") {
        const step = parts[1] ?? "";
        if (isWizardStep(step)) return { view: "wizard", step };
        if (ids.has(step)) return { view: "manual", section: step };
        return { view: "wizard", step: WIZARD_STEPS[0] };
    }
    if (view === "manual") {
        const section = parts[1];
        if (section && ids.has(section)) return { view: "manual", section };
        return { view: "manual" };
    }
    if (ids.has(view)) return { view: "manual", section: view };
    return { view: "start" };
}

type Translate = (key: string, params?: TranslationParams) => string;

/** Splits a wizard crumb into the path and the current step. Other pages stay one label. */
export function wizardCrumb(here: string): { trail: string; step: string } | null {
    const mark = " / ";
    const index = here.indexOf(mark);
    if (index < 0) return null;
    return { trail: here.slice(0, index), step: here.slice(index + mark.length) };
}

/** Labels for the subnav and the wizard footer, one branch per view. */
export function routeLabels(route: GuideRoute, t: Translate, flow: WizardFlow = "manual"): { here: string; shortHere: string; progress: string; nextLabel: string } {
    switch (route.view) {
        case "wizard": {
            const active = wizardFlowFor(route.step, flow);
            const steps = wizardSteps(active);
            const neighbors = wizardNeighbors(route.step, active);
            const index = Math.max(0, steps.indexOf(route.step));
            const progress = t("ui.stepOf", { n: index + 1, total: steps.length });
            const next = neighbors.next;
            const nextLabel = next.view === "wizard" ? t("ui.nextColon", { title: t(sectionsById.get(next.step)?.titleKey ?? "ui.finish") }) : t("ui.finish");
            const stepTitle = t(sectionsById.get(route.step)?.titleKey ?? "ui.stepByStep");
            return { here: `${t("ui.stepByStep")} / ${stepTitle}`, shortHere: "", progress, nextLabel };
        }
        case "distro":
            return { here: t("ui.chooseDistro"), shortHere: "", progress: "", nextLabel: "" };
        case "done":
            return { here: t("ui.doneTitle"), shortHere: "", progress: "", nextLabel: "" };
        case "manual": {
            const section = route.section ? sectionsById.get(route.section) : undefined;
            const here = section ? t(section.titleKey) : t("ui.fullChecklist");
            const shortHere = route.section ? (route.section === ONESHOT_SECTION ? t("nav.dCliShort") : "") : t("nav.dFullShort");
            return { here, shortHere, progress: "", nextLabel: "" };
        }
        case "start":
            return { here: "", shortHere: "", progress: "", nextLabel: "" };
    }
}
