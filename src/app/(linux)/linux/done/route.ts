import { guideCopy, linuxDocument } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/done";

/** Completion screen, without the shared client runtime. */
export async function GET() {
    const { title, description } = await guideCopy("ui.doneTitle");
    const body = await renderStaticLinux("done", PAGE_PATH, title, description);
    return linuxDocument(PAGE_PATH, title, description, body);
}
