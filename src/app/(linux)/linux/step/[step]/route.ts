import { getTranslations } from "@/app/lib/localization/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { isWizardStep, sectionsById } from "../../guide-model";
import { getLocale } from "@/app/lib/localization/server";
import { linuxDocument } from "../../static-document";
import { renderStaticLinux } from "../../static-guide";

/** One setup step. A missing distro goes to the picker and comes back. */
export async function GET(request: Request, context: { params: Promise<{ step: string }> }) {
    const { step } = await context.params;
    if (!isWizardStep(step)) return new Response("Not found", { status: 404 });
    const path = `/linux/step/${step}`;
    const distro = (await cookies()).get("blc-distro-v1")?.value;
    if (!distro) return NextResponse.redirect(new URL(`/linux/distro?resume=${encodeURIComponent(path)}`, request.url), 303);
    const locale = await getLocale();
    const { t } = await getTranslations("linux", locale);
    const title = t(sectionsById.get(step)?.titleKey ?? "metadata.title");
    const description = t("metadata.description");
    const body = await renderStaticLinux("step", path, title, description, { step });
    return linuxDocument(path, title, description, body);
}
