"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { GuideSection } from "../Blocks";
import { goldButton, pageFrame, primaryButton } from "../guide-styles";
import { sectionsById, TROUBLESHOOTING_SECTION, wizardNeighbors, type GuideRoute, type WizardStep } from "../guide-model";

/** One wizard step. Previous and Next are the only way to change steps. */
export function WizardView({
    step,
    nextLabel,
    onGo,
}: {
    step: WizardStep;
    nextLabel: string;
    onGo: (route: GuideRoute) => void;
}) {
    const { t } = useLinuxText();
    const section = sectionsById.get(step);
    const neighbors = wizardNeighbors(step);
    if (!section) throw new Error(`Missing wizard section: ${step}`);

    return (
        <section aria-labelledby="wizard-title">
            <div className={`${pageFrame} wizard-copy py-8 pb-28 sm:py-10`}>
                <GuideSection section={section} wizard alone />
            </div>
            <div className="linux-wizard-bar sticky bottom-0 z-20 flex flex-nowrap items-stretch justify-center gap-2 px-3 py-3">
                {neighbors.previous && (
                    <button type="button" className={`${goldButton} min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-4 sm:text-sm`} onClick={() => { const previous = wizardNeighbors(step).previous; if (previous) onGo(previous); }}>{t("ui.previous")}</button>
                )}
                <button type="button" className={`${goldButton} min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-4 sm:text-sm`} onClick={() => onGo({ view: "manual", section: TROUBLESHOOTING_SECTION })}>{t("ui.help")}</button>
                <button type="button" className={`${primaryButton} min-w-0 flex-1 px-2 text-xs sm:flex-none sm:px-4 sm:text-sm`} onClick={() => onGo(neighbors.next)}>{nextLabel}</button>
            </div>
        </section>
    );
}
