import { Footer } from "@/app/components/layout/Footer";
import { Navbar } from "@/app/components/layout/Navbar";
import { LocalizationProvider } from "@/app/lib/localization/client";
import { getLocale, getMessages, getOpenGraphLocale } from "@/app/lib/localization/server";
import { cookies } from "next/headers";
import type { Locale, Messages } from "@/app/lib/localization/types";
import { JsonLd, SITE_URL, organizationNode } from "@/app/lib/structured-data";
import type { Metadata } from "next";
import { LinuxBackdrop } from "./linux-backdrop";
import { LinuxGuide } from "./LinuxGuide";

/** Search title for one Linux guide route. Artwork stays the site banner. */
export async function linuxMetadata(path: string, title: string, description: string): Promise<Metadata> {
    return {
        title: { absolute: title },
        description,
        alternates: { canonical: path },
        openGraph: {
            type: "article",
            locale: await getOpenGraphLocale(),
            url: path,
            siteName: "Bannerlord Co-op",
            title,
            description,
            images: [{ url: "/images/banner.png", width: 1200, height: 630, alt: "Bannerlord Co-op" }],
        },
        twitter: { card: "summary_large_image", title, description, images: ["/images/banner.png"] },
    };
}

/** Loads locale, messages, and the distro cookie, then returns the guide shell. */
export async function renderLinux(path: string, title: string, description: string) {
    const locale = await getLocale();
    const messages = await getMessages(["linux"], locale);
    const initialDistro = (await cookies()).get("blc-distro-v1")?.value ?? null;
    return <LinuxDocument path={path} title={title} description={description} locale={locale} messages={messages} initialDistro={initialDistro} />;
}

/** Shared chrome for every Linux guide route. */
export function LinuxDocument({ path, title, description, locale, messages, initialDistro }: { path: string; title: string; description: string; locale: Locale; messages: Messages; initialDistro: string | null }) {
    return (
        <>
            <LinuxBackdrop />
            <LocalizationProvider locale={locale} messages={messages}>
                <JsonLd
                    data={{
                        "@graph": [
                            organizationNode,
                            {
                                "@type": "TechArticle",
                                "@id": `${SITE_URL}${path}#guide`,
                                headline: title,
                                description,
                                inLanguage: locale,
                                url: `${SITE_URL}${path}`,
                                about: "Mount & Blade II: Bannerlord Co-op mod",
                                isPartOf: { "@id": `${SITE_URL}/#organization` },
                            },
                        ],
                    }}
                />
                <Navbar />
                <LinuxGuide path={path} initialDistro={initialDistro} />
                <Footer />
            </LocalizationProvider>
        </>
    );
}
