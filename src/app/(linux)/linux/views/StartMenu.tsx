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
        <section className="guide-stage" aria-labelledby="start-title">
            <div className={pageFrame}>
                <h1 id="start-title" tabIndex={-1} className={titleClass}>{t("ui.startTitle")}</h1>
                <div className="guide-choices guide-choices-4 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <button type="button" className={`${choiceCard} choice-recommended border-gold/60`} onClick={onWizard}>
                    <span className="font-label text-xs font-bold uppercase tracking-[0.08em] text-gold">{t("ui.recommended")}</span>
                    <strong className="mt-1 block font-display text-2xl font-semibold">{t("ui.stepByStep")}</strong>
                    <span className="mt-2 text-foreground-muted">{t("ui.walk")}</span>
                </button>
                <button type="button" className={choiceCard} onClick={onScript}>
                    <strong className="block font-display text-2xl font-semibold">{t("ui.oneScript")}</strong>
                    <span className="mt-2 text-foreground-muted">{t("ui.oneScriptSub")}</span>
                </button>
                <button type="button" className={choiceCard} onClick={onChecklist}>
                    <strong className="block font-display text-2xl font-semibold">{t("ui.fullChecklist")}</strong>
                    <span className="mt-2 text-foreground-muted">{t("ui.checklistSub")}</span>
                </button>
                <button type="button" className={choiceCard} onClick={onFaq}>
                    <strong className="block font-display text-2xl font-semibold">{t("ui.faq")}</strong>
                    <span className="mt-2 text-foreground-muted">{t("ui.faqSub")}</span>
                </button>
                </div>
            </div>
        </section>
    );
}
