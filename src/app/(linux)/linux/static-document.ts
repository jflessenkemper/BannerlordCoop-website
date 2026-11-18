import { fontClassName } from "@/app/fonts";
import { getLocale, getTranslations } from "@/app/lib/localization/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import { linuxMetadata } from "./linux-metadata";

const SITE = "https://bannerlordcoop.com";

/** Stylesheets and the title font, read from the build so the hashes can change. */
function documentAssets(): { styles: string[]; criticalCss: string } {
    const dir = join(process.cwd(), ".next/static/chunks");
    const styles: string[] = [];
    const critical: string[] = [];
    for (const file of readdirSync(dir)) {
        if (!file.endsWith(".css")) continue;
        const text = readFileSync(join(dir, file), "utf8");
        if (!text.includes(".linux-guide") && !text.includes(".site-container") && !text.includes("@font-face")) continue;
        styles.push(`/_next/static/chunks/${file}`);
        for (const rule of text.matchAll(/[^{}]+\{[^}]*--font-[^}]+\}/g)) critical.push(rule[0]);
        for (const face of text.matchAll(/@font-face\{[^}]*Fallback[^}]*\}/g)) critical.push(face[0]);
    }
    return { styles, criticalCss: critical.join("") };
}

/** A full document with no framework scripts. The guide pages that must paint first use this. */
export async function linuxDocument(path: string, title: string, description: string, body: ReactElement) {
    const locale = await getLocale();
    const metadata = await linuxMetadata(path, title, description);
    const openGraph = metadata.openGraph;
    const image = `${SITE}/images/banner.png`;
    const assets = documentAssets();
    const { renderToStaticMarkup } = await import("react-dom/server");
    const markup = renderToStaticMarkup(body);
    const links = [
        ...assets.styles.map((href) => `<link rel="stylesheet" href="${href}" media="print" onload="this.media='all'"/><noscript><link rel="stylesheet" href="${href}"/></noscript>`),
        `<link rel="canonical" href="${SITE}${path}"/>`,
        `<link rel="icon" href="/favicon.ico" sizes="any"/>`,
    ].filter(Boolean);
    const critical = `<style>${assets.criticalCss}html,body{background:#070806;color:#e8e4da}body{margin:0}.site-container{width:min(calc(100% - 2rem),1280px);margin-inline:auto}h1{font-family:var(--font-cormorant),Georgia,serif;font-weight:600;line-height:1;letter-spacing:-.03em;font-size:clamp(2.4rem,5vw,4.25rem);margin:0}</style>`;
    const metas = [
        `<meta charSet="utf-8"/>`,
        `<meta name="viewport" content="width=device-width, initial-scale=1"/>`,
        `<meta name="description" content="${escapeAttribute(description)}"/>`,
        `<meta property="og:type" content="article"/>`,
        `<meta property="og:locale" content="${escapeAttribute(String(openGraph?.locale ?? "en_US"))}"/>`,
        `<meta property="og:site_name" content="Bannerlord Co-op"/>`,
        `<meta property="og:title" content="${escapeAttribute(title)}"/>`,
        `<meta property="og:description" content="${escapeAttribute(description)}"/>`,
        `<meta property="og:url" content="${SITE}${path}"/>`,
        `<meta property="og:image" content="${image}"/>`,
        `<meta name="twitter:card" content="summary_large_image"/>`,
        `<meta name="twitter:title" content="${escapeAttribute(title)}"/>`,
        `<meta name="twitter:description" content="${escapeAttribute(description)}"/>`,
        `<meta name="twitter:image" content="${image}"/>`,
    ];
    const html = `<!DOCTYPE html><html lang="${escapeAttribute(locale)}" class="${fontClassName}"><head><title>${escapeText(title)}</title>${critical}${metas.join("")}${links.join("")}</head><body class="min-h-full flex flex-col">${markup}</body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

/** Loads the guide copy for one of the measured routes. */
export async function guideCopy(titleKey: string) {
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    return { title: t(titleKey), description: t("metadata.description") };
}

function escapeAttribute(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeText(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}
