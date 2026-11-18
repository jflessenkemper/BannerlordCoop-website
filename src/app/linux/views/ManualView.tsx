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
            <div className={`${pageFrame} py-8 sm:py-10`}>
                {active && !focused && (
                    <h1 id="manual-title" className={titleClass}>{t("ui.fullChecklist")}</h1>
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
