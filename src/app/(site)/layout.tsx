import { ImpersonationBanner } from "@/app/components/admin/ImpersonationBanner";
import { LocalizationProvider } from "@/app/lib/localization/client";
import { getEnabledLocales } from "@/app/lib/localization/registry";
import { getLocale, getMessages } from "@/app/lib/localization/server";

/** Shared client shell for every route except the Linux guide. */
export default async function SiteLayout({ children }: LayoutProps<"/">) {
    const locale = await getLocale();
    const messages = await getMessages(["common"], locale);
    return (
        <LocalizationProvider locale={locale} messages={messages} enabledLocales={getEnabledLocales()}>
            <ImpersonationBanner />
            {children}
        </LocalizationProvider>
    );
}
