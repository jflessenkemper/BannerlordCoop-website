import { guideCopy, linuxDocument } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/distro";

/** Distro picker document, without the shared client runtime. */
export async function GET() {
    const { title, description } = await guideCopy("nav.dTitle");
    const body = await renderStaticLinux("distro", PAGE_PATH, title, description);
    return linuxDocument(PAGE_PATH, title, description, body);
}
