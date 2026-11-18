import { guideCopy, linuxDocument } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/distro";

/** A return path is accepted only when it stays inside the guide. */
function safeResume(value: string | null): string | null {
    if (!value || !value.startsWith("/linux/") || value.includes("//") || value.includes("\\")) return null;
    return value;
}

/** Distro picker document, without the shared client runtime. */
export async function GET(request: Request) {
    const resume = safeResume(new URL(request.url).searchParams.get("resume"));
    const { title, description } = await guideCopy("nav.dTitle");
    const body = await renderStaticLinux("distro", PAGE_PATH, title, description, { resume });
    return linuxDocument(PAGE_PATH, title, description, body);
}
