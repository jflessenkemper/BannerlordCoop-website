import { guideCopy, linuxDocument, pageLocale } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/faq";

/** FAQ document, without the shared client runtime. */
export async function GET(request: Request) {
    const locale = pageLocale(request);
    const { title, description } = await guideCopy("section.faq.title", locale);
    const body = await renderStaticLinux("faq", PAGE_PATH, title, description, { locale });
    return linuxDocument(PAGE_PATH, title, description, body, { locale });
}
