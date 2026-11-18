import { getLocale, getTranslations } from "@/app/lib/localization/server";
import type { Metadata } from "next";
import { linuxMetadata, renderLinux } from "./linux-document";

const PAGE_PATH = "/linux";

/** Search title and description follow the site locale. */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return linuxMetadata(PAGE_PATH, t("metadata.title"), t("metadata.description"));
}

/** Opening menu for the Linux setup guide. */
export default async function LinuxPage() {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return renderLinux(PAGE_PATH, t("metadata.title"), t("metadata.description"));
}
