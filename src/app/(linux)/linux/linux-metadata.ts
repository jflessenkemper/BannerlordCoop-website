import { getOpenGraphLocale } from "@/app/lib/localization/server";
import type { Metadata } from "next";

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
