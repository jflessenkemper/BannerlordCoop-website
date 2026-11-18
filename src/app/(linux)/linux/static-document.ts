import { fontClassName } from "@/app/fonts";
import { resolveLocale } from "@/app/lib/localization/registry";
import { getLocale, getTranslations } from "@/app/lib/localization/server";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { ReactElement } from "react";
import { linuxMetadata } from "./linux-metadata";

const SITE = "https://bannerlordcoop.com";

const SHELL_CLASSES = ["h-full", "antialiased", "min-h-full", "flex", "flex-col"];

type BuiltSheets = { site: string; guide: string; fonts: string; preload: string | null };

/** The built styles, read once. Hashes change only when the server is rebuilt. */
function readSheets(): BuiltSheets {
    const dir = join(process.cwd(), ".next/static/chunks");
    const sheets: BuiltSheets = { site: "", guide: "", fonts: "", preload: null };
    for (const file of readdirSync(dir)) {
        if (!file.endsWith(".css")) continue;
        const text = readFileSync(join(dir, file), "utf8").replaceAll("url(../media/", "url(/_next/static/media/");
        if (text.includes("@font-face")) {
            sheets.fonts = text;
            const latin = text.match(/font-family:Cormorant Garamond;font-style:normal;font-weight:600;[^}]*url\((\/_next\/static\/media\/[^)]+\.p\.[^)]+\.woff2)\)/);
            if (latin) sheets.preload = latin[1];
        } else if (text.includes(".site-container{") || text.includes(".site-container {")) sheets.site = text;
    }
    sheets.guide = readFileSync(join(process.cwd(), "src/app/(linux)/linux/linux-guide.css"), "utf8");
    return sheets;
}

let cachedSheets: BuiltSheets | null = null;
const purged = new Map<string, string>();

/** Keeps the site rules these pages use, then inlines them with the font and guide sheets. */
/** The webfont files are in the first stylesheet and block rendering until they load. */
/** Latin is the subset that starts with the basic range and lists U+0131. */
function isLatinFace(face: string): boolean {
    return /unicode-range:U\+[^,]*,U\+131,U\+152-153/.test(face);
}

/** Extra subsets a language actually draws. English needs none of them. */
function isLocaleFace(face: string, locale: string): boolean {
    if (["de", "es", "fr", "pt-BR", "pt-PT", "tr"].includes(locale) && face.includes("U+100-2BA")) return true;
    if (locale === "ru" && (face.includes("U+400-45F") || face.includes("U+100-2BA"))) return true;
    return false;
}

/** Heading, body, and label faces that are on screen at the first paint. */
function isCriticalFace(face: string): boolean {
    if (!isLatinFace(face)) return false;
    if (face.includes("font-family:Inter")) return true;
    if (face.includes("font-family:Cormorant Garamond") && /font-weight:(600|700)/.test(face)) return true;
    if (face.includes("font-family:Barlow Condensed") && /font-weight:(500|600|700)/.test(face)) return true;
    return false;
}

function splitFontFaces(css: string, locale: string): { initial: string; delayed: string; preloads: string[] } {
    const delayed: string[] = [];
    const preloads: string[] = [];
    const initial = css.replace(/@font-face\{[^}]+\}/g, (face) => {
        if (!face.includes("url(")) return "";
        const critical = isCriticalFace(face) || isLocaleFace(face, locale);
        if (!critical) {
            delayed.push(face);
            return "";
        }
        // Block, with the file preloaded, so the first paint is the webfont and nothing swaps after it.
        const shown = face.replaceAll("font-display:swap", "font-display:block");
        const url = shown.match(/url\((\/_next\/static\/media\/[^)]+\.woff2)\)/);
        if (url && !preloads.includes(url[1])) preloads.push(url[1]);
        return shown;
    });
    return { initial, delayed: delayed.join(""), preloads };
}

function inlineCss(markup: string, locale: string): { css: string; preloads: string[]; delayed: string } {
    if (!cachedSheets) cachedSheets = readSheets();
    const used = new Set(SHELL_CLASSES);
    for (const match of markup.matchAll(/class="([^"]*)"/g)) {
        for (const name of match[1].split(/\s+/)) if (name) used.add(name);
    }
    const key = [...used].sort().join(" ");
    let site = purged.get(key);
    if (!site) {
        site = purgeUtilities(cachedSheets.site, used);
        purged.set(key, site);
    }
    const { initial, delayed, preloads } = splitFontFaces(cachedSheets.fonts, locale);
    return { css: `${initial}${site}${cachedSheets.guide}`, preloads, delayed };
}

/** Drops Tailwind utilities whose classes are not in the rendered document. */
function purgeUtilities(css: string, used: Set<string>): string {
    const marker = "@layer utilities{";
    const start = css.indexOf(marker);
    if (start < 0) return css;
    const open = start + marker.length - 1;
    const close = matchingClose(css, open);
    const kept = filterBlock(css.slice(open + 1, close), used);
    return css.slice(0, start) + marker + kept + "}" + css.slice(close + 1);
}

function matchingClose(css: string, openBrace: number): number {
    let depth = 0;
    for (let index = openBrace; index < css.length; index += 1) {
        if (css[index] === "{") depth += 1;
        else if (css[index] === "}") {
            depth -= 1;
            if (depth === 0) return index;
        }
    }
    return css.length - 1;
}

function filterBlock(body: string, used: Set<string>): string {
    let out = "";
    let index = 0;
    while (index < body.length) {
        const open = body.indexOf("{", index);
        if (open < 0) break;
        const prelude = body.slice(index, open).trim();
        let depth = 1;
        let cursor = open + 1;
        while (cursor < body.length && depth) {
            if (body[cursor] === "{") depth += 1;
            else if (body[cursor] === "}") depth -= 1;
            cursor += 1;
        }
        const inner = body.slice(open + 1, cursor - 1);
        if (prelude.startsWith("@")) {
            const child = filterBlock(inner, used);
            if (child.trim()) out += `${prelude}{${child}}`;
        } else {
            const kept = splitCommas(prelude).filter((selector) => {
                const names = classesIn(selector);
                if (names.length === 0) return /:root|:host|(?:^|[\s>+~])(?:html|body|\*)\b/.test(selector);
                return names.every((name) => used.has(name));
            });
            if (kept.length) out += `${kept.join(",")}{${inner}}`;
        }
        index = cursor;
    }
    return out;
}

function splitCommas(selector: string): string[] {
    const parts: string[] = [];
    let depth = 0;
    let start = 0;
    for (let index = 0; index < selector.length; index += 1) {
        const char = selector[index];
        if (char === "(" || char === "[") depth += 1;
        else if (char === ")" || char === "]") depth -= 1;
        else if (char === "," && depth === 0) {
            parts.push(selector.slice(start, index).trim());
            start = index + 1;
        }
    }
    parts.push(selector.slice(start).trim());
    return parts.filter(Boolean);
}

function classesIn(selector: string): string[] {
    const names: string[] = [];
    for (const match of selector.matchAll(/\.((?:\\.|[^\s,{>+~:[\]])+)/g)) {
        names.push(match[1].replace(/\\(.)/g, "$1"));
    }
    return names;
}

const FAMILIES: Record<string, string> = { ubuntu: "debian", debian: "debian", mint: "debian", fedora: "fedora", arch: "arch", manjaro: "arch", suse: "suse", bazzite: "immutable", deck: "deck", nix: "nix", other: "other" };

const BOOT = `(function(){var K="blc-distro-v1",F=${JSON.stringify(FAMILIES)};function known(id){return id&&F[id]?id:""}var mem="";function read(){var m=document.cookie.match(/(?:^|; )blc-distro-v1=([^;]*)/);var id=known(m?decodeURIComponent(m[1]):"");if(id)return id;try{id=localStorage.getItem(K)||""}catch(e){id=""}return known(id)||known(mem)}function write(id){mem=id;try{document.cookie=K+"="+encodeURIComponent(id)+"; Path=/; Max-Age=31536000; SameSite=Lax"}catch(e){}try{localStorage.setItem(K,id)}catch(e){}}var q=new URLSearchParams(location.search),pick=known(q.get("pick")||""),id=pick||read(),root=document.documentElement,page=root.getAttribute("data-distro-page")||"/linux/distro";if(id){write(id);root.setAttribute("data-distro",id);root.setAttribute("data-family",F[id])}var resume=q.get("resume")||"";if(pick&&resume.charAt(0)==="/"&&resume.indexOf("//")<0&&resume.indexOf("\\\\")<0&&resume.indexOf("/linux")>=0){location.replace(resume);return}if(!id&&root.getAttribute("data-needs-distro")==="1")location.replace(page+"?resume="+encodeURIComponent(location.pathname+location.search+location.hash))})();`;

/** A full document with no framework scripts. The guide pages that must paint first use this. */
export async function linuxDocument(path: string, title: string, description: string, body: ReactElement, options?: { locale?: string; distroId?: string | null; needsDistro?: boolean }) {
    const locale = resolveLocale(options?.locale ?? await getLocale());
    const metadata = await linuxMetadata(path, title, description, locale);
    const openGraph = metadata.openGraph;
    const image = `${SITE}/images/banner.png`;
    const { renderToStaticMarkup } = await import("react-dom/server");
    const markup = renderToStaticMarkup(body);
    const { css, preloads } = inlineCss(markup, locale);
    const links = [
        `<link rel="canonical" href="${SITE}${path}"/>`,
        `<link rel="icon" href="/favicon.ico" sizes="any"/>`,
        `<link rel="preload" as="image" href="/images/linux/backdrop.webp" fetchpriority="low"/>`,
        ...preloads.map((href) => `<link rel="preload" as="font" type="font/woff2" href="${href}" crossorigin="anonymous"/>`),
    ];
    // Faces are preloaded with font-display:block, so the first paint already uses them.
    const fontScript = "";
    const distroId = options?.distroId && FAMILIES[options.distroId] ? options.distroId : "";
    const htmlAttrs = [
        `lang="${escapeAttribute(locale)}"`,
        `class="${fontClassName}"`,
        `data-distro-page="${escapeAttribute(locale === "en" ? "/linux/distro" : `/${locale}/linux/distro`)}"`,
        options?.needsDistro ? `data-needs-distro="1"` : "",
        distroId ? `data-distro="${distroId}" data-family="${FAMILIES[distroId]}"` : "",
    ].filter(Boolean).join(" ");
    const metas = [
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
    const html = `<!DOCTYPE html><html ${htmlAttrs}><head><meta charset="utf-8"><script>${BOOT}</script><title>${escapeText(title)}</title>${metas.join("")}${links.join("")}<style>${css}</style></head><body class="min-h-full flex flex-col">${markup}${fontScript}</body></html>`;
    return new Response(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

const PATH_LOCALES = new Set(["de", "es", "fr", "ja", "ko", "ru", "tr", "zh-CN", "pt-BR", "pt-PT"]);

/** Locale carried by a language path or its rewrite. Absent means the cookie locale. */
export function pageLocale(request: Request): string | undefined {
    const url = new URL(request.url);
    const query = url.searchParams.get("lang");
    if (query && PATH_LOCALES.has(query)) return query;
    const head = url.pathname.split("/").filter(Boolean)[0];
    if (head && PATH_LOCALES.has(head)) return head;
    const rewritten = request.headers.get("x-middleware-rewrite") ?? request.headers.get("next-url") ?? "";
    const fromHeader = new URL(rewritten || "http://localhost/", "http://localhost").searchParams.get("lang");
    return fromHeader && PATH_LOCALES.has(fromHeader) ? fromHeader : undefined;
}

/** Loads the guide copy for one of the measured routes. */
export async function guideCopy(titleKey: string, localeOverride?: string) {
    const locale = resolveLocale(localeOverride ?? await getLocale());
    const { t } = await getTranslations("linux", locale);
    return { title: t(titleKey), description: t("metadata.description") };
}

function escapeAttribute(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");
}

function escapeText(value: string): string {
    return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;");
}
