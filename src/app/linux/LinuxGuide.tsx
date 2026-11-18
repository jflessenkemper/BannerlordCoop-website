"use client";

import { useState } from "react";
import { useLinuxText } from "./hooks/useLinuxText";
import { GuideContext } from "./Blocks";
import { AI_FAQ_ID, FAQ_SECTION, ONESHOT_SECTION, resolveRoute, routeLabels, WIZARD_STEPS, type GuideRoute } from "./guide-model";
import { useGuideRoute } from "./hooks/useGuideRoute";
import { useStoredDistro } from "./hooks/useStoredDistro";
import { DistroPicker } from "./views/DistroPicker";
import { GuideSubnav } from "./views/GuideSubnav";
import { ManualView } from "./views/ManualView";
import { StartMenu } from "./views/StartMenu";
import { WizardView } from "./views/WizardView";
import "./linux-guide.css";

/** Popover width matches the 20rem panel, plus the page gutter and the gap under the term. */
const POPOVER_WIDTH_PX = 320;
const POPOVER_GUTTER_PX = 16;
const POPOVER_OFFSET_PX = 10;

/** Linux setup guide: menu, distro picker, wizard, and checklist. */
export function LinuxGuide() {
    const { t } = useLinuxText();
    const { requested, go } = useGuideRoute();
    const { distroId, distro, distros, chooseDistro } = useStoredDistro();
    const route = resolveRoute(requested, distroId);
    const [pending, setPending] = useState<GuideRoute | null>(null);
    const [status, setStatus] = useState("");
    const [term, setTerm] = useState<{ title: string; body: string; left: number; top: number } | null>(null);
    const labels = routeLabels(route, t);
    const isManual = route.view === "manual";
    const manualSection = isManual ? route.section : undefined;

    function pickDistro(id: string) {
        chooseDistro(id);
        const resume = pending;
        setPending(null);
        if (resume) go(resume, "replace");
        else {
            try { window.scrollTo({ top: 0, behavior: "auto" }); } catch { /* scrolling is optional */ }
        }
        const chosen = distros.find((item) => item.id === id);
        setStatus(chosen ? t(chosen.nameKey) : id);
    }

    function changeDistro() {
        setPending(route);
        go({ view: "distro" });
    }

    const context = {
        distro,
        alone: false,
        openId: isManual && route.openAi ? AI_FAQ_ID : undefined,
        onStatus: setStatus,
        onTerm(title: string, body: string, rect: DOMRect) {
            setTerm({
                title,
                body,
                left: Math.max(POPOVER_GUTTER_PX, Math.min(rect.left, window.innerWidth - POPOVER_WIDTH_PX - POPOVER_GUTTER_PX)),
                top: rect.bottom + POPOVER_OFFSET_PX,
            });
        },
    };

    return (
        <GuideContext.Provider value={context}>
            <main id="linux-guide" className="linux-guide relative isolate flex-1 text-foreground" aria-label={t("ui.guideContent")} onClick={() => setTerm(null)}>
                <p className="sr-only" role="status">{status}</p>
                {route.view !== "start" && (
                    <GuideSubnav
                        route={route}
                        distro={distro}
                        here={labels.here}
                        shortHere={labels.shortHere}
                        progress={labels.progress}
                        onMenu={() => go({ view: "start" })}
                        onChangeDistro={changeDistro}
                    />
                )}
                {route.view === "start" && (
                    <StartMenu
                        onWizard={() => go({ view: "wizard", step: WIZARD_STEPS[0] })}
                        onScript={() => go({ view: "manual", section: ONESHOT_SECTION })}
                        onChecklist={() => go({ view: "manual" })}
                        onFaq={() => go({ view: "manual", section: FAQ_SECTION })}
                    />
                )}
                {route.view === "distro" && (
                    <DistroPicker
                        distros={distros}
                        selectedId={distroId}
                        canKeep={Boolean(pending)}
                        onChoose={pickDistro}
                        onKeep={() => { if (distroId) pickDistro(distroId); }}
                    />
                )}
                {route.view === "wizard" && (
                    <WizardView step={route.step} progress={labels.progress} nextLabel={labels.nextLabel} onGo={go} />
                )}
                {(route.view === "start" || isManual) && (
                    <ManualView active={isManual} sectionId={manualSection} />
                )}
                {term && (
                    <div className="fixed z-40 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-gold/45 bg-[#11120e]/95 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_28px_rgba(0,0,0,0.4)]" role="tooltip" style={{ left: term.left, top: term.top }} onClick={(event) => event.stopPropagation()}>
                        <p className="mb-1 font-label font-semibold text-gold">{term.title}</p>
                        <p className="m-0">{term.body}</p>
                    </div>
                )}
            </main>
        </GuideContext.Provider>
    );
}
