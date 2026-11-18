import { getLocale, getTranslations } from "@/app/lib/localization/server";
import type { Metadata } from "next";
import { linuxMetadata, renderLinux } from "../linux-document";

const PAGE_PATH = "/linux/done";

/** Completion route at the end of the setup wizard. */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return linuxMetadata(PAGE_PATH, t("ui.doneTitle"), t("metadata.description"));
}

/** Short confirmation after the last setup step. */
export default async function LinuxDonePage() {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return renderLinux(PAGE_PATH, t("ui.doneTitle"), t("metadata.description"));
}
