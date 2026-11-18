"use client";

import { useEffect } from "react";
import { useLinuxText } from "../hooks/useLinuxText";
import { GuideSection } from "../Blocks";
import { goldButton, pageFrame, primaryButton } from "../guide-styles";
import { sectionsById, TROUBLESHOOTING_SECTION, wizardNeighbors, type GuideRoute, type WizardStep } from "../guide-model";

/** One wizard step, with the same next and previous routes as the arrow keys. */
export function WizardView({
    step,
    progress,
    nextLabel,
    onGo,
}: {
    step: WizardStep;
    progress: string;
    nextLabel: string;
    onGo: (route: GuideRoute) => void;
}) {
    const { t } = useLinuxText();
    const section = sectionsById.get(step);
    const neighbors = wizardNeighbors(step);
    if (!section) throw new Error(`Missing wizard section: ${step}`);

    useEffect(() => {
        const keys = wizardNeighbors(step);
        function onKey(event: KeyboardEvent) {
            const target = event.target as HTMLElement | null;
            if (target?.closest("input, textarea, select, pre, [role='tablist']")) return;
            if (event.key === "ArrowRight") {
                event.preventDefault();
                onGo(keys.next);
            }
            if (event.key === "ArrowLeft" && keys.previous) {
                event.preventDefault();
                onGo(keys.previous);
            }
        }
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onGo, step]);

    return (
        <section aria-labelledby="wizard-live">
            <h1 id="wizard-live" className="sr-only">{progress}: {t(section.titleKey)}</h1>
            <div className={`${pageFrame} py-8 sm:py-10`}>
                <GuideSection section={section} wizard alone />
            </div>
            <div className="sticky bottom-0 flex flex-wrap justify-center gap-2 bg-gradient-to-b from-transparent to-background px-4 py-4">
                {neighbors.previous && (
                    <button type="button" className={goldButton} onClick={() => { const previous = wizardNeighbors(step).previous; if (previous) onGo(previous); }}>{t("ui.previous")}</button>
                )}
                <button type="button" className={goldButton} onClick={() => onGo({ view: "manual", section: TROUBLESHOOTING_SECTION })}>{t("ui.help")}</button>
                <button type="button" className={primaryButton} onClick={() => onGo(neighbors.next)}>{nextLabel}</button>
            </div>
        </section>
    );
}
