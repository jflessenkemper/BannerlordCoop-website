import { getLocale, getTranslations } from "@/app/lib/localization/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { sectionsById, WIZARD_STEPS, isWizardStep } from "../../guide-model";
import { linuxMetadata, renderLinux } from "../../linux-document";

/** One static page per setup step. */
export function generateStaticParams() {
    return WIZARD_STEPS.map((step) => ({ step }));
}

export const dynamicParams = false;

/** Step title follows the site locale. */
export async function generateMetadata({ params }: { params: Promise<{ step: string }> }): Promise<Metadata> {
    const { step } = await params;
    if (!isWizardStep(step)) notFound();
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    const title = t(sectionsById.get(step)?.titleKey ?? "metadata.title");
    return linuxMetadata(`/linux/step/${step}`, title, t("metadata.description"));
}

/** One setup step, rendered on its own URL. */
export default async function LinuxStepPage({ params }: { params: Promise<{ step: string }> }) {
    const { step } = await params;
    if (!isWizardStep(step)) notFound();
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    const title = t(sectionsById.get(step)?.titleKey ?? "metadata.title");
    return renderLinux(`/linux/step/${step}`, title, t("metadata.description"));
}
