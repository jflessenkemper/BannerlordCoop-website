"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useLinuxText } from "./hooks/useLinuxText";
import { GuideContext } from "./guide-context";
import { AI_FAQ_ID, FAQ_SECTION, ONESHOT_SECTION, parseRoute, resolveRoute, routeLabels, routePath, WIZARD_STEPS, type GuideRoute } from "./guide-model";
import { useGuideRoute } from "./hooks/useGuideRoute";
import { useStoredDistro } from "./hooks/useStoredDistro";
import { DistroPicker } from "./views/DistroPicker";
import { GuideSubnav } from "./views/GuideSubnav";
import { StartMenu } from "./views/StartMenu";
import "./linux-guide.css";

const ManualView = dynamic(() => import("./views/ManualView").then((module) => module.ManualView));
const WizardView = dynamic(() => import("./views/WizardView").then((module) => module.WizardView));
const DoneView = dynamic(() => import("./views/DoneView").then((module) => module.DoneView));

const POPOVER_WIDTH_PX = 320;
const POPOVER_GUTTER_PX = 16;
const POPOVER_OFFSET_PX = 8;

type OpenTerm = { key: string; title: string; body: string; trigger: HTMLButtonElement };

/** Keeps the glossary panel inside the viewport, beside the word that opened it. */
function placePopover(node: HTMLElement, trigger: DOMRect) {
    const width = Math.min(POPOVER_WIDTH_PX, window.innerWidth - POPOVER_GUTTER_PX * 2);
    node.style.width = `${width}px`;
    const height = node.offsetHeight;
    const left = Math.min(Math.max(trigger.left, POPOVER_GUTTER_PX), window.innerWidth - width - POPOVER_GUTTER_PX);
    let top = trigger.bottom + POPOVER_OFFSET_PX;
    if (top + height > window.innerHeight - POPOVER_GUTTER_PX) {
        top = Math.max(POPOVER_GUTTER_PX, trigger.top - height - POPOVER_OFFSET_PX);
    }
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
}

/** Linux setup guide: menu, distro picker, wizard, and checklist. */
export function LinuxGuide({ path = "/linux", initialDistro = null }: { path?: string; initialDistro?: string | null }) {
    const { t } = useLinuxText();
    const { requested, go } = useGuideRoute(path);
    const { distroId, distro, distros, chooseDistro } = useStoredDistro(initialDistro);
    const route = resolveRoute(requested, distroId);
    const [pending, setPending] = useState<GuideRoute | null>(null);
    const [status, setStatus] = useState("");
    const [term, setTerm] = useState<OpenTerm | null>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const opened = useRef(false);
    const labels = routeLabels(route, t);
    const isManual = route.view === "manual";
    const manualSection = isManual ? route.section : undefined;
    const routeKey = `${route.view}:${route.view === "wizard" ? route.step : route.view === "manual" ? `${route.section ?? ""}:${route.openAi ? "ai" : ""}` : ""}`;

    useEffect(() => {
        const hash = window.location.hash;
        if (!hash || hash === "#") return;
        const next = routePath(parseRoute(hash));
        if (`${window.location.pathname}${window.location.hash}` === next) return;
        window.history.replaceState(null, "", next);
        window.dispatchEvent(new PopStateEvent("popstate"));
    }, []);

    useEffect(() => {
        const heading = document.querySelector<HTMLElement>("#linux-guide h1");
        if (!heading) return;
        if (!opened.current) {
            opened.current = true;
            return;
        }
        heading.tabIndex = -1;
        heading.focus({ preventScroll: true });
    }, [routeKey]);

    useEffect(() => {
        const node = popoverRef.current;
        if (!term || !node) return;
        placePopover(node, term.trigger.getBoundingClientRect());
        if (typeof node.showPopover === "function" && !node.matches(":popover-open")) node.showPopover();
        function close(restore: boolean) {
            const trigger = term?.trigger;
            setTerm(null);
            if (restore) trigger?.focus();
        }
        function onKey(event: KeyboardEvent) {
            if (event.key !== "Escape") return;
            event.preventDefault();
            event.stopPropagation();
            close(true);
        }
        function place() {
            if (term) placePopover(node!, term.trigger.getBoundingClientRect());
        }
        document.addEventListener("keydown", onKey);
        window.addEventListener("resize", place);
        return () => {
            document.removeEventListener("keydown", onKey);
            window.removeEventListener("resize", place);
            if (typeof node.hidePopover === "function" && node.matches(":popover-open")) node.hidePopover();
        };
    }, [term]);

    function travel(next: GuideRoute, mode: "push" | "replace" = "push") {
        go(next, mode);
        const label = routeLabels(next, t).here;
        setStatus(label || t("ui.startTitle"));
    }

    function pickDistro(id: string) {
        chooseDistro(id);
        const resume = pending;
        setPending(null);
        if (resume) travel(resume, "replace");
        else if (requested.view !== "distro") travel(requested, "replace");
        const chosen = distros.find((item) => item.id === id);
        setStatus(chosen ? t(chosen.nameKey) : id);
    }

    function changeDistro() {
        setPending(route);
        travel({ view: "distro" });
    }

    const context = {
        distro,
        alone: false,
        openId: isManual && route.openAi ? AI_FAQ_ID : undefined,
        openTermKey: term?.key ?? null,
        onStatus: setStatus,
        onTerm(key: string, title: string, body: string, trigger: HTMLButtonElement) {
            setTerm((current) => current?.key === key ? null : { key, title, body, trigger });
        },
    };

    return (
        <GuideContext.Provider value={context}>
            <main id="linux-guide" className="linux-guide relative isolate w-full min-w-0 flex-1 text-foreground" aria-label={t("ui.guideContent")}>
                <p className="sr-only" role="status">{status}</p>
                {route.view !== "start" && (
                    <GuideSubnav
                        route={route}
                        distro={distro}
                        here={labels.here}
                        shortHere={labels.shortHere}
                        progress={labels.progress}
                        onMenu={() => travel({ view: "start" })}
                        onChangeDistro={changeDistro}
                    />
                )}
                {route.view === "start" && (
                    <StartMenu
                        onWizard={() => travel({ view: "wizard", step: WIZARD_STEPS[0] })}
                        onScript={() => travel({ view: "manual", section: ONESHOT_SECTION })}
                        onChecklist={() => travel({ view: "manual" })}
                        onFaq={() => travel({ view: "manual", section: FAQ_SECTION })}
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
                {route.view === "done" && <DoneView />}
                {route.view === "wizard" && (
                    <WizardView step={route.step} nextLabel={labels.nextLabel} onGo={travel} />
                )}
                {isManual && (
                    <ManualView active sectionId={manualSection} />
                )}
                <div
                    ref={popoverRef}
                    id="linux-term"
                    popover="auto"
                    role="dialog"
                    aria-labelledby="linux-term-title"
                    className="linux-term fixed z-40 max-w-[calc(100vw-2rem)] rounded-lg border border-gold/45 bg-[#11120e] p-3 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_28px_rgba(0,0,0,0.4)] backdrop-blur-[16px]"
                >
                    <p id="linux-term-title" className="mb-1 font-label text-sm font-semibold uppercase tracking-[0.22em] text-gold">{term?.title}</p>
                    <p className="m-0">{term?.body}</p>
                </div>
            </main>
        </GuideContext.Provider>
    );
}
