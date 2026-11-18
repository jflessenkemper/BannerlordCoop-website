"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { goldButton, pageFrame, primaryButton, titleClass } from "../guide-styles";

/** The end of the setup wizard. Troubleshooting and the FAQ stay one click away. */
export function DoneView() {
    const { t } = useLinuxText();
    return (
        <section className="guide-stage" aria-labelledby="done-title">
            <div className={pageFrame}>
                <h1 id="done-title" tabIndex={-1} className={titleClass}>{t("ui.doneTitle")}</h1>
                <p className="mt-4 max-w-xl text-foreground">{t("ui.doneBody")}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <a className={goldButton} href="/linux/checklist#sec-troubleshooting">{t("section.troubleshooting.title")}</a>
                    <a className={primaryButton} href="/linux/faq">{t("section.faq.title")}</a>
                </div>
            </div>
        </section>
    );
}
