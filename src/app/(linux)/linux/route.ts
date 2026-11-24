import { guideCopy, linuxDocument, pageLocale } from "./static-document";
import { renderStaticLinux } from "./static-guide";

const PAGE_PATH = "/linux";

/** Opening menu. The response is the document itself, with no framework scripts. */
export async function GET(request: Request) {
    const locale = pageLocale(request);
    const { title, description } = await guideCopy("metadata.title", locale);
    const body = await renderStaticLinux("start", PAGE_PATH, title, description, { locale });
    return linuxDocument(PAGE_PATH, title, description, body, { locale });
}
