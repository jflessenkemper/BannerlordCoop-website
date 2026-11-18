"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { choiceCard, pageFrame, titleClass } from "../guide-styles";

/** Opening choices: one step at a time, one script, the full checklist, or the FAQ. */
export function StartMenu({
    onWizard,
    onScript,
    onChecklist,
    onFaq,
}: {
    onWizard: () => void;
    onScript: () => void;
    onChecklist: () => void;
    onFaq: () => void;
}) {
    const { t } = useLinuxText();
    return (
        <section className={`${pageFrame} py-10 sm:py-14`} aria-labelledby="start-title">
            <h1 id="start-title" className={titleClass}>{t("ui.startTitle")}</h1>
            <div className="guide-choices guide-choices-4">
                <button type="button" className={`${choiceCard} min-h-28`} onClick={onWizard}>
                    <strong className="block font-display text-2xl font-semibold">{t("ui.stepByStep")}</strong>
                </button>
                <button type="button" className={`${choiceCard} min-h-28`} onClick={onScript}>
                    <strong className="block font-display text-2xl font-semibold">{t("ui.oneScript")}</strong>
                </button>
                <button type="button" className={`${choiceCard} min-h-28`} onClick={onChecklist}>
                    <strong className="block font-display text-2xl font-semibold">{t("ui.fullChecklist")}</strong>
                </button>
                <button type="button" className={`${choiceCard} min-h-28`} onClick={onFaq}>
                    <strong className="block font-display text-2xl font-semibold">{t("ui.faq")}</strong>
                </button>
            </div>
        </section>
    );
}
