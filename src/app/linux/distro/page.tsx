import { getLocale, getTranslations } from "@/app/lib/localization/server";
import type { Metadata } from "next";
import { linuxMetadata, renderLinux } from "../linux-document";

const PAGE_PATH = "/linux/distro";

/** Distro picker route. */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return linuxMetadata(PAGE_PATH, t("nav.dTitle"), t("metadata.description"));
}

/** Choose the Linux distribution the guide should follow. */
export default async function LinuxDistroPage() {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return renderLinux(PAGE_PATH, t("nav.dTitle"), t("metadata.description"));
}
