import { guideCopy, linuxDocument, pageLocale } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/distro";

/** A return path is accepted only when it stays inside the guide. */
function safeResume(value: string | null): string | null {
    if (!value || value.includes("//") || value.includes("\\") || value.includes("..")) return null;
    if (value.startsWith("/linux")) return value;
    if (/^\/[a-z]{2}(?:-[A-Z]{2})?\/linux(?:\/|$)/.test(value)) return value;
    return null;
}

/** Distro picker document, without the shared client runtime. */
export async function GET(request: Request) {
    const locale = pageLocale(request);
    const resume = safeResume(new URL(request.url).searchParams.get("resume"));
    const { title, description } = await guideCopy("nav.dTitle", locale);
    const body = await renderStaticLinux("distro", PAGE_PATH, title, description, { resume, locale });
    return linuxDocument(PAGE_PATH, title, description, body, { locale });
}
