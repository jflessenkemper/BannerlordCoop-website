"use client";

import { useLinuxText } from "../hooks/useLinuxText";
import { GuideSection } from "../Blocks";
import { subClass, titleClass } from "../guide-styles";
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
            <div className="mx-auto w-[min(100%-2rem,72rem)] py-8">
                {active && !focused && (
                    <div>
                        <h1 id="manual-title" className={titleClass}>{t("ui.fullChecklist")}</h1>
                        <p className={subClass}>{t("ui.allStages")}</p>
                    </div>
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
