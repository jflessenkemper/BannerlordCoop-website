import { Footer } from "@/app/components/layout/Footer";
import { Navbar } from "@/app/components/layout/Navbar";
import { LocalizationProvider } from "@/app/lib/localization/client";
import { getLocale, getMessages, getOpenGraphLocale, getTranslations } from "@/app/lib/localization/server";
import { JsonLd, SITE_URL, organizationNode } from "@/app/lib/structured-data";
import type { Metadata } from "next";
import { LinuxGuide } from "./LinuxGuide";

const PAGE_PATH = "/linux";

/** Search title and description follow the site locale. Artwork stays the site banner. */
export async function generateMetadata(): Promise<Metadata> {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    const title = t("metadata.title");
    const description = t("metadata.description");
    return {
        title: { absolute: title },
        description,
        alternates: { canonical: PAGE_PATH },
        openGraph: {
            type: "article",
            locale: await getOpenGraphLocale(),
            url: PAGE_PATH,
            siteName: "Bannerlord Co-op",
            title,
            description,
            images: [{ url: "/images/banner.png", width: 1200, height: 630, alt: "Bannerlord Co-op" }],
        },
        twitter: { card: "summary_large_image", title, description, images: ["/images/banner.png"] },
    };
}

/** Linux setup guide, inside the site header and footer. */
export default async function LinuxPage() {
    const locale = await getLocale();
    const messages = await getMessages(["linux"], locale);
    const { t } = await getTranslations("linux", locale);
    return (
        <LocalizationProvider locale={locale} messages={messages}>
            <JsonLd
                data={{
                    "@graph": [
                        organizationNode,
                        {
                            "@type": "TechArticle",
                            "@id": `${SITE_URL}${PAGE_PATH}#guide`,
                            headline: t("metadata.title"),
                            description: t("metadata.description"),
                            inLanguage: locale,
                            url: `${SITE_URL}${PAGE_PATH}`,
                            about: "Mount & Blade II: Bannerlord Co-op mod",
                            isPartOf: { "@id": `${SITE_URL}/#organization` },
                        },
                    ],
                }}
            />
            <Navbar />
            <LinuxGuide />
            <Footer />
        </LocalizationProvider>
    );
}
