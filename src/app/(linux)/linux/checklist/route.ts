import { cookies } from "next/headers";
import { guideCopy, linuxDocument, pageLocale } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/checklist";

/** Full checklist. The document script sends a missing distro to the picker. */
export async function GET(request: Request) {
    const locale = pageLocale(request);
    const distro = (await cookies()).get("blc-distro-v1")?.value ?? null;
    const { title, description } = await guideCopy("ui.fullChecklist", locale);
    const body = await renderStaticLinux("checklist", PAGE_PATH, title, description, { locale });
    return linuxDocument(PAGE_PATH, title, description, body, { locale, distroId: distro, needsDistro: true });
}
