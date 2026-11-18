import { getLocale, getTranslations } from "@/app/lib/localization/server";
import type { Metadata } from "next";
import { linuxMetadata, renderLinux } from "../linux-document";

const PAGE_PATH = "/linux/checklist";

/** Full checklist route. */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return linuxMetadata(PAGE_PATH, t("ui.fullChecklist"), t("metadata.description"));
}

/** Every Linux setup section on one page. */
export default async function LinuxChecklistPage() {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return renderLinux(PAGE_PATH, t("ui.fullChecklist"), t("metadata.description"));
}
