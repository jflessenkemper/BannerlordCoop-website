import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { guideCopy, linuxDocument } from "../static-document";
import { renderStaticLinux } from "../static-guide";

const PAGE_PATH = "/linux/checklist";

/** Full checklist. A missing distro goes to the picker and comes back. */
export async function GET(request: Request) {
    const distro = (await cookies()).get("blc-distro-v1")?.value;
    if (!distro) return NextResponse.redirect(new URL(`/linux/distro?resume=${encodeURIComponent(PAGE_PATH)}`, request.url), 303);
    const { title, description } = await guideCopy("ui.fullChecklist");
    const body = await renderStaticLinux("checklist", PAGE_PATH, title, description);
    return linuxDocument(PAGE_PATH, title, description, body);
}
