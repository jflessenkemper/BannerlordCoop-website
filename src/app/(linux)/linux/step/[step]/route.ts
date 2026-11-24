import { cookies } from "next/headers";
import { isWizardStep, wizardFlowFor, sectionsById } from "../../guide-model";
import { resolveLocale } from "@/app/lib/localization/registry";
import { getTranslations } from "@/app/lib/localization/server";
import { linuxDocument, pageLocale } from "../../static-document";
import { renderStaticLinux } from "../../static-guide";

/** One setup step. The document script sends a missing distro to the picker. */
export async function GET(request: Request, context: { params: Promise<{ step: string }> }) {
    const { step } = await context.params;
    if (!isWizardStep(step)) return new Response("Not found", { status: 404 });
    const locale = pageLocale(request);
    const path = `/linux/step/${step}`;
    const distro = (await cookies()).get("blc-distro-v1")?.value ?? null;
    const { t } = await getTranslations("linux", resolveLocale(locale));
    const title = t(sectionsById.get(step)?.titleKey ?? "metadata.title");
    const description = t("metadata.description");
    const flow = wizardFlowFor(step, new URL(request.url).searchParams.get("flow"));
    const body = await renderStaticLinux("step", path, title, description, { step, locale, flow });
    return linuxDocument(path, title, description, body, { locale, distroId: distro, needsDistro: true });
}
