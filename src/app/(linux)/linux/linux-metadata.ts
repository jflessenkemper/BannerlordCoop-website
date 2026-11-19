import { getOpenGraphLocale } from "@/app/lib/localization/server";
import { localeDefinitions } from "@/app/lib/localization/registry";
import type { Locale } from "@/app/lib/localization/types";
import type { Metadata } from "next";

/** Search title for one Linux guide route. Artwork stays the site banner. */
export async function linuxMetadata(path: string, title: string, description: string, locale?: string): Promise<Metadata> {
    const openGraphLocale = locale && locale in localeDefinitions ? localeDefinitions[locale as Locale].openGraphLocale : await getOpenGraphLocale();
    return {
        title: { absolute: title },
        description,
        alternates: { canonical: path },
        openGraph: {
            type: "article",
            locale: openGraphLocale,
            url: path,
            siteName: "Bannerlord Co-op",
            title,
            description,
            images: [{ url: "/images/banner.png", width: 1200, height: 630, alt: "Bannerlord Co-op" }],
        },
        twitter: { card: "summary_large_image", title, description, images: ["/images/banner.png"] },
    };
}
