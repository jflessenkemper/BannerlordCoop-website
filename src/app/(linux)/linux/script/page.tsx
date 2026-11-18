import { getLocale, getTranslations } from "@/app/lib/localization/server";
import type { Metadata } from "next";
import { linuxMetadata, renderLinux } from "../linux-document";

const PAGE_PATH = "/linux/script";

/** One-script route. */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return linuxMetadata(PAGE_PATH, t("ui.oneScript"), t("metadata.description"));
}

/** The single copy-paste install script for the chosen distribution. */
export default async function LinuxScriptPage() {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return renderLinux(PAGE_PATH, t("ui.oneScript"), t("metadata.description"));
}
