"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { showsDistroChip, wizardFlowFor, wizardSteps, type Distro, type GuideRoute } from "../guide-model";
import { pageFrame } from "../guide-styles";
import { scopeSvg } from "./svg";

/** Relative luminance for an 8-bit sRGB channel. */
function channel(value: number): number {
    const scaled = value / 255;
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

/** Contrast of two sRGB triples. */
function contrast(foreground: [number, number, number], background: [number, number, number]): number {
    const light = (rgb: [number, number, number]) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    const a = light(foreground);
    const b = light(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

/** Same hue, lightened until the name clears 4.5:1 on the frosted sub-navbar. */
function readableNameTint(color: string): string {
    const parts = color.split(",").map((part) => Number(part.trim()));
    const [r, g, b] = parts;
    const background: [number, number, number] = [32, 30, 26];
    for (let step = 0; step <= 20; step += 1) {
        const mix = step / 20;
        const next: [number, number, number] = [
            Math.round(r + (255 - r) * mix),
            Math.round(g + (246 - g) * mix),
            Math.round(b + (228 - b) * mix),
        ];
        if (contrast(next, background) >= 4.5) return `rgb(${next[0]}, ${next[1]}, ${next[2]})`;
    }
    return "rgb(255, 246, 228)";
}

/** Strips a trailing colon so the group label is not read twice. */
function withoutTrailingColon(label: string): string {
    return label.replace(/[:：]\s*$/, "");
}

/** Back control, current view, and the chosen distro. Hidden on the opening menu. */
export function GuideSubnav({
    route,
    distro,
    here: _here,
    shortHere: _shortHere,
    progress,
    onMenu,
    onChangeDistro,
}: {
    route: GuideRoute;
    distro: Distro | null;
    here: string;
    shortHere: string;
    progress: string;
    onMenu: () => void;
    onChangeDistro: () => void;
}) {
    const { t } = useLinuxText();
    const showDistro = showsDistroChip(route, distro?.id ?? null);
    return (
        <nav className={`linux-subnav sticky top-0 z-30 border-b border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[8px]${showDistro ? " has-distro" : ""}`} aria-label={t("ui.guide")}>
            <div className={`${pageFrame} grid min-h-12 items-center gap-2 ${showDistro && distro ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1"}`}>
                <div className="subnav-crumb flex min-w-0 items-center gap-2 overflow-hidden">
                    <button type="button" className="inline-flex min-h-12 shrink-0 cursor-pointer items-center gap-1 border-0 bg-transparent px-1 font-label text-base text-foreground hover:text-gold" onClick={onMenu}>
                        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <span>{t("ui.menu")}</span>
                    </button>
                    <span className="subnav-sep" aria-hidden="true" />
                </div>
                {showDistro && distro ? (
                    <div className="flex min-w-0 max-w-full items-center justify-self-end" role="group" aria-label={withoutTrailingColon(t("nav.dYour"))} style={{ ["--d" as string]: distro.color, ["--ig" as string]: distro.glyph }}>
                        <button type="button" className="subnav-distro inline-flex min-h-12 cursor-pointer items-center gap-2 border-0 border-l border-white/15 bg-transparent px-2 no-underline" onClick={onChangeDistro} aria-label={`${t(distro.nameKey)} — change distro`}>
                            <span className={`subnav-mark inline-grid h-6 w-6 place-items-center ${distro.art ? "is-art overflow-hidden" : ""}`} style={distro.art ? undefined : { backgroundColor: `rgb(${distro.color})` }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: scopeSvg(distro.svg, "subnav") }} />
                            <strong className="subnav-distro-name max-w-44 truncate font-label text-base font-semibold" style={{ color: readableNameTint(distro.color) }}>{t(distro.nameKey)}</strong>
                        </button>
                    </div>
                ) : null}
            </div>
            {route.view === "wizard" && (
                <div className="h-1 bg-transparent" role="progressbar" aria-label={progress} aria-valuemin={1} aria-valuemax={wizardSteps(wizardFlowFor(route.step)).length} aria-valuenow={wizardSteps(wizardFlowFor(route.step)).indexOf(route.step) + 1} aria-valuetext={progress}>
                    <span className="block h-full bg-gold" style={{ width: `${((wizardSteps(wizardFlowFor(route.step)).indexOf(route.step) + 1) / wizardSteps(wizardFlowFor(route.step)).length) * 100}%` }} />
                </div>
            )}
        </nav>
    );
}
