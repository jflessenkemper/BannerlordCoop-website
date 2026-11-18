import { Footer } from "@/app/components/layout/Footer";
import { Navbar } from "@/app/components/layout/Navbar";
import { LocalizationProvider } from "@/app/lib/localization/client";
import { getLocale, getMessages } from "@/app/lib/localization/server";
import { cookies } from "next/headers";
import type { Locale, Messages } from "@/app/lib/localization/types";
import { JsonLd, SITE_URL, organizationNode } from "@/app/lib/structured-data";
import { LinuxBackdrop } from "./linux-backdrop";
import { LinuxGuide } from "./LinuxGuide";
import { linuxMetadata } from "./linux-metadata";

export { linuxMetadata };

/** Loads locale, messages, and the distro cookie, then returns the guide shell. */
export async function renderLinux(path: string, title: string, description: string) {
    const locale = await getLocale();
    const messages = await getMessages(["common", "linux"], locale);
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
