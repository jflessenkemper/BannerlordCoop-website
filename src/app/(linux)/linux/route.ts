import { guideCopy, linuxDocument } from "./static-document";
import { renderStaticLinux } from "./static-guide";

const PAGE_PATH = "/linux";

/** Opening menu. The response is the document itself, with no framework scripts. */
export async function GET() {
    const { title, description } = await guideCopy("metadata.title");
    const body = await renderStaticLinux("start", PAGE_PATH, title, description);
    return linuxDocument(PAGE_PATH, title, description, body);
}
