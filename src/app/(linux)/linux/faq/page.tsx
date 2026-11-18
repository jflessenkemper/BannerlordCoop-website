import { getLocale, getTranslations } from "@/app/lib/localization/server";
import type { Metadata } from "next";
import { linuxMetadata, renderLinux } from "../linux-document";

const PAGE_PATH = "/linux/faq";

/** FAQ route, so the answers are in the first HTML response. */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return linuxMetadata(PAGE_PATH, t("section.faq.title"), t("metadata.description"));
}

/** Frequently asked questions for the Linux guide. */
export default async function LinuxFaqPage() {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return renderLinux(PAGE_PATH, t("section.faq.title"), t("metadata.description"));
}
