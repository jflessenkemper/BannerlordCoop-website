"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { GuideSection } from "../Blocks";
import { pageFrame, titleClass } from "../guide-styles";
import { sections, sectionsById, type Section } from "../guide-model";

/** Full checklist, or one section. While the menu is showing, the checklist stays in the document for the scripts. */
export function ManualView({
    active,
    sectionId,
}: {
    active: boolean;
    sectionId?: string;
}) {
    const { t } = useLinuxText();
    const visible: Section[] = sectionId ? [requiredSection(sectionId)] : sections;
    const focused = Boolean(sectionId);
    return (
        <section hidden={active ? undefined : true} aria-labelledby={active ? "manual-title" : undefined}>
            <div className={`${pageFrame} py-12 sm:py-16`}>
                {active && !focused && (
                    <>
                        <h1 id="manual-title" tabIndex={-1} className={titleClass}>{t("ui.fullChecklist")}</h1>
                        <nav aria-label={t("ui.contents")} className="mt-4">
                            <ol className="m-0 list-decimal space-y-1 pl-5 text-foreground">
                                {sections.map((section) => (
                                    <li key={section.id}>
                                        <a className="text-foreground underline decoration-gold/60 underline-offset-4" href={`#sec-${section.id}`}>{t(section.titleKey)}</a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </>
                )}
                {visible.map((section) => (
                    <GuideSection key={section.id} section={section} alone={focused} />
                ))}
            </div>
        </section>
    );
}

/** Looks up a section and fails if the route names one the content does not have. */
function requiredSection(id: string): Section {
    const section = sectionsById.get(id);
    if (!section) throw new Error(`Missing section: ${id}`);
    return section;
}
