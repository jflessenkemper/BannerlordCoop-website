import { guideCopy, linuxDocument } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/faq";

/** FAQ document, without the shared client runtime. */
export async function GET() {
    const { title, description } = await guideCopy("section.faq.title");
    const body = await renderStaticLinux("faq", PAGE_PATH, title, description);
    return linuxDocument(PAGE_PATH, title, description, body);
}
