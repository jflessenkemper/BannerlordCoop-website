"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { showsDistroChip, WIZARD_STEPS, type Distro, type GuideRoute } from "../guide-model";
import { pageFrame } from "../guide-styles";
import { scopeSvg } from "./svg";

/** Strips a trailing colon so the group label is not read twice. */
function withoutTrailingColon(label: string): string {
    return label.replace(/[:：]\s*$/, "");
}

/** Back control, current view, and the chosen distro. Hidden on the opening menu. */
export function GuideSubnav({
    route,
    distro,
    here,
    shortHere,
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
        <nav className="sticky top-0 z-30 border-b border-white/15 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(255,255,255,0.025)),rgba(11,12,9,0.9)] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[18px]" aria-label={t("ui.guide")}>
            <div className={`${pageFrame} flex min-h-12 items-center gap-2`}>
                <button type="button" className="inline-flex min-h-8 cursor-pointer items-center gap-1 border-0 bg-transparent px-1 font-label text-base text-foreground-muted hover:text-gold" onClick={onMenu}>
                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    <span>{t("ui.menu")}</span>
                </button>
                <span className="text-white/40" aria-hidden="true">/</span>
                <span className="subnav-here min-w-0 flex-1 truncate font-semibold text-[#f4f1ea]" aria-current="page" data-short={shortHere || undefined}>{here}</span>
                {showDistro && distro && (
                    <div className="ml-auto flex items-center gap-2" role="group" aria-label={withoutTrailingColon(t("nav.dYour"))} style={{ ["--d" as string]: distro.color, ["--ig" as string]: distro.glyph }}>
                        <span className={`subnav-mark inline-grid h-6 w-6 place-items-center ${distro.art ? "is-art overflow-hidden" : ""}`} style={distro.art ? undefined : { backgroundColor: `rgb(${distro.color})` }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: scopeSvg(distro.svg, "subnav") }} />
                        <strong className="subnav-distro-name max-w-44 truncate font-label text-base font-semibold" style={{ color: `rgb(${distro.color})` }}>{t(distro.nameKey)}</strong>
                        <button type="button" data-short={t("nav.dChangeShort")} className="subnav-change min-h-8 cursor-pointer border-0 border-l border-white/15 bg-transparent px-2 font-label text-sm font-semibold uppercase tracking-[0.08em] text-gold" onClick={onChangeDistro}>
                            {t("nav.dChange")}
                        </button>
                    </div>
                )}
                {route.view === "wizard" && <p className="sr-only">{progress}</p>}
            </div>
            {route.view === "wizard" && (
                <div className="h-0.5 bg-transparent" role="progressbar" aria-label={progress} aria-valuemin={1} aria-valuemax={WIZARD_STEPS.length} aria-valuenow={WIZARD_STEPS.indexOf(route.step) + 1} aria-valuetext={progress}>
                    <span className="block h-full bg-gold" style={{ width: `${((WIZARD_STEPS.indexOf(route.step) + 1) / WIZARD_STEPS.length) * 100}%` }} />
                </div>
            )}
        </nav>
    );
}
