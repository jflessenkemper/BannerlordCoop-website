/* eslint-disable @next/next/no-html-link-for-pages -- anchors keep the client link runtime off these pages */
import { LocaleFlag } from "@/app/components/layout/LocaleFlag";
import { accountDisplayName } from "@/app/lib/auth/account-display";
import { hasAdminAccess } from "@/app/lib/auth/access";
import { getEnabledLocales } from "@/app/lib/localization/registry";
import type { Locale, Translator } from "@/app/lib/localization/types";
import { getSupabaseServerClient } from "@/app/lib/supabase/server";
import { Icon } from "./icons";

type Translate = Translator["t"];

const navigationLinkClassName = "inline-flex min-h-10 items-center px-2 font-label text-sm font-semibold uppercase leading-none tracking-[0.16em] text-foreground-muted transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background";
const summaryReset = "linux-menu-summary cursor-pointer list-none [&::-webkit-details-marker]:hidden";
const downloadSources = [
    { name: "download.installer.name", description: "download.installer.description", href: "https://bannerlordcoop-nightly-gateway.garrett-luskey.workers.dev/", recommended: true, supporterOnly: true },
    { name: "download.steam.name", description: "download.steam.description", href: "https://steamcommunity.com/sharedfiles/filedetails/?id=3770450698" },
    { name: "download.nexus.name", description: "download.nexus.description", href: "https://www.nexusmods.com/mountandblade2bannerlord/mods/2387" },
    { name: "download.moddb.name", description: "download.moddb.description", href: "https://www.moddb.com/mods/bannerlord-coop" },
] as const;
const footerLinks = [
    ["footer.features", "/#features"],
    ["footer.videos", "/#media"],
    ["footer.about", "/#about"],
    ["download.trigger", "/#download"],
    ["nav.hosting", "/hosting"],
    ["nav.cheats", "/cheats"],
    ["nav.linux", "/linux"],
    ["nav.changelog", "/changelog"],
] as const;
const mobileLinks = [
    ["nav.home", "/"],
    ["nav.servers", "/servers"],
    ["nav.hosting", "/hosting"],
    ["nav.cheats", "/cheats"],
    ["nav.linux", "/linux"],
    ["nav.changelog", "/changelog"],
    ["nav.support", "/support"],
] as const;

/** Closed navigation that matches the site header, without loading its client bundle. */
export async function LinuxHeader({ t, locale, path }: { t: Translate; locale: Locale; path: string }) {
    let isAuthenticated = false;
    let isAdmin = false;
    let accountName = t("account.defaultName");
    try {
        const { user } = (await (await getSupabaseServerClient()).auth.getUser()).data;
        isAuthenticated = user !== null;
        if (user) accountName = accountDisplayName(user, t("account.defaultName"));
        isAdmin = user ? hasAdminAccess(user) : false;
    } catch {
        isAuthenticated = false;
    }
    return (
        <header className="relative z-50 border-b border-white/10 bg-background">
            <div className="site-container relative flex h-16 items-center justify-between gap-4">
                <a href="/" className="flex shrink-0 items-center gap-2 sm:gap-3" aria-label={t("nav.homeLabel")}>
                    <Icon name="swords" className="size-6 text-gold" strokeWidth={3} />
                    <span className="font-display text-sm font-black uppercase tracking-[0.06em] text-foreground transition-colors duration-300 hover:text-gold min-[380px]:text-base min-[380px]:tracking-[0.08em] sm:text-lg sm:tracking-[0.14em]">
                        Bannerlord Co-op
                    </span>
                </a>
                <nav aria-label={t("nav.primary")} className="hidden xl:block">
                    <ul className="flex min-h-10 items-center gap-3 xl:gap-5">
                        <li className="flex items-center"><a href="/" className={navigationLinkClassName}>{t("nav.home")}</a></li>
                        <li className="flex items-center">
                            <a href="/servers" className={`${navigationLinkClassName} gap-2`}>
                                <Icon name="server" className="size-4 shrink-0" />
                                {t("nav.servers")}
                            </a>
                        </li>
                        <li className="flex items-center"><a href="/hosting" className={navigationLinkClassName}>{t("nav.hosting")}</a></li>
                        <li className="flex items-center">
                            <a href="/cheats" className={`${navigationLinkClassName} gap-2`}>
                                <Icon name="terminal" className="size-4 shrink-0" />
                                {t("nav.cheats")}
                            </a>
                        </li>
                        <li className="relative flex items-center">
                            <CommunityMenu t={t} />
                        </li>
                    </ul>
                </nav>
                <div className="hidden shrink-0 items-center gap-3 xl:flex">
                    <LocaleMenu t={t} locale={locale} path={path} variant="desktop" />
                    <DownloadMenu t={t} />
                    <span aria-hidden="true" className="h-9 w-0.5 shrink-0 bg-foreground-muted/20" />
                    {isAuthenticated ? <ProfileMenu t={t} accountName={accountName} isAdmin={isAdmin} /> : (
                        <a href="/login" className="inline-flex min-h-10 items-center rounded-sm bg-background/70 px-2.5 font-label text-sm font-semibold uppercase leading-none tracking-[0.16em] text-foreground transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                            {t("nav.signIn")}
                        </a>
                    )}
                </div>
                <div className="flex items-center gap-2 xl:hidden">
                    {isAuthenticated && <ProfileMenu t={t} accountName={accountName} isAdmin={isAdmin} />}
                    <MobileMenu t={t} locale={locale} path={path} isAdmin={isAdmin} isAuthenticated={isAuthenticated} />
                </div>
            </div>
        </header>
    );
}

/** Site footer, drawn with anchors so the guide does not load the link runtime. */
export function LinuxFooter({ t, year }: { t: Translator; year: string }) {
    return (
        <footer className="border-t border-white/10 bg-background">
            <div className="site-container">
                <div className="grid grid-cols-2 gap-x-6 gap-y-10 py-12 sm:gap-x-12 sm:py-14 lg:grid-cols-12 lg:items-start lg:py-16">
                    <div className="col-span-2 lg:col-span-6">
                        <a href="/" aria-label={t.t("nav.homeLabel")} className="inline-flex max-w-full items-center gap-1 text-foreground transition-colors duration-300 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background">
                            <span className="flex size-10 items-center justify-center text-gold">
                                <Icon name="swords" className="size-6" strokeWidth={1.5} />
                            </span>
                            <span className="font-display text-xl font-semibold uppercase tracking-[0.04em] sm:text-2xl">Bannerlord Co-op</span>
                        </a>
                        <p className="mt-5 max-w-md font-sans text-sm leading-6 text-foreground-muted">{t.t("metadata.description")}</p>
                    </div>
                    <nav className="lg:col-span-3" aria-label={t.t("footer.navigation")}>
                        <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-gold">{t.t("footer.explore")}</p>
                        <ul className="mt-5 space-y-3">
                            {footerLinks.map(([label, href]) => (
                                <li key={label}>
                                    <a href={href} className="inline-flex min-h-6 items-center font-sans text-sm text-foreground-muted transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background">{t.t(label)}</a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                    <nav className="lg:col-span-3" aria-label={t.t("footer.communityLinks")}>
                        <p className="font-label text-xs font-semibold uppercase tracking-[0.2em] text-gold">{t.t("nav.community")}</p>
                        <ul className="mt-5 space-y-3">
                            <li>
                                <a href="https://discord.gg/bannerlordcoop" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-2 font-sans text-sm text-foreground-muted transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background">Discord</a>
                            </li>
                            <li>
                                <a href="https://github.com/Bannerlord-Coop-Team/BannerlordCoop" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-6 items-center gap-2 font-sans text-sm text-foreground-muted transition-colors duration-300 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-4 focus-visible:ring-offset-background">
                                    GitHub
                                    <Icon name="pr" className="size-3.5" strokeWidth={1.5} />
                                </a>
                            </li>
                        </ul>
                    </nav>
                </div>
                <div className="flex flex-col gap-4 border-t border-white/10 py-6 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-sans text-xs leading-5 text-foreground-dim">{t.t("footer.copyright", { year })}</p>
                    <p className="max-w-xl font-sans text-xs leading-5 text-foreground-dim sm:text-right">{t.t("footer.disclaimer")}</p>
                </div>
            </div>
        </footer>
    );
}

/** Language list. Choosing one posts back to this guide page. */
function LocaleMenu({ t, locale, path, variant }: { t: Translate; locale: Locale; path: string; variant: "desktop" | "mobile" }) {
    const current = getEnabledLocales().find((option) => option.locale === locale) ?? { locale, name: locale };
    const trigger = variant === "desktop"
        ? "inline-flex min-h-10 max-w-52 items-center gap-2 rounded-sm border border-white/20 bg-background px-2.5 text-sm text-foreground"
        : "flex min-h-12 w-full items-center gap-3 rounded-sm border border-white/20 bg-background px-4 text-sm text-foreground";
    const panel = variant === "desktop" ? "absolute right-0 top-full z-70 w-60 pt-2" : "absolute inset-x-0 bottom-full z-70 pb-2";
    return (
        <details className={`linux-menu relative min-w-0 ${variant === "desktop" ? "" : "w-full"}`}>
            <summary className={`${summaryReset} ${trigger}`}>
                <span className="sr-only">{t("locale.label")}</span>
                <LocaleFlag locale={current.locale} />
                <span lang={current.locale} className="min-w-0 flex-1 truncate text-left">{current.name}</span>
                <Icon name="chevron" className="size-3.5 shrink-0" />
            </summary>
            <div className={panel}>
                <ul className="rounded-sm border border-white/10 bg-surface-raised p-1 shadow-2xl">
                    {getEnabledLocales().map((option) => (
                        <li key={option.locale}>
                            <form method="post" action="/linux/locale">
                                <input type="hidden" name="locale" value={option.locale} />
                                <input type="hidden" name="next" value={path} />
                                <button type="submit" lang={option.locale} aria-current={option.locale === locale || undefined} className="flex w-full items-center gap-3 rounded-sm px-3 py-2.5 text-left text-sm text-foreground-muted transition-colors hover:bg-white/5 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold aria-[current=true]:text-foreground">
                                    <LocaleFlag locale={option.locale} />
                                    <span className="min-w-0 flex-1">{option.name}</span>
                                    {option.locale === locale && <Icon name="check" className="size-4 shrink-0 text-gold" />}
                                </button>
                            </form>
                        </li>
                    ))}
                </ul>
            </div>
        </details>
    );
}

/** Community destinations, closed until the summary is chosen. */
function CommunityMenu({ t }: { t: Translate }) {
    const itemClassName = "group/item flex items-center gap-3 rounded-sm px-4 py-3 font-label text-sm font-semibold uppercase tracking-[0.12em] text-foreground-muted transition-colors hover:bg-white/5 hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold";
    return (
        <details className="linux-menu relative">
            <summary className={`${summaryReset} inline-flex min-h-10 items-center gap-1.5 px-2 font-label text-sm font-semibold uppercase leading-none tracking-[0.16em] text-foreground-muted`}>
                {t("nav.community")}
                <Icon name="chevron" className="size-3.5" />
            </summary>
            <div className="absolute left-1/2 top-full z-70 w-48 -translate-x-1/2 pt-2">
                <div className="rounded-sm border border-white/10 bg-surface-raised p-1 shadow-2xl">
                    <a href="https://discord.gg/bannerlordcoop" target="_blank" rel="noopener noreferrer" className={itemClassName}>Discord</a>
                    <a href="/changelog" className={itemClassName}><Icon name="history" className="size-4.5 shrink-0" />{t("nav.changelog")}</a>
                    <a href="/support" className={itemClassName}><Icon name="help" className="size-4.5 shrink-0" />{t("nav.support")}</a>
                </div>
            </div>
        </details>
    );
}

/** Download choices in the top layer. The button matches the site trigger. */
function DownloadMenu({ t }: { t: Translate }) {
    return (
        <>
            <button type="button" className="inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-crimson/30 bg-crimson/30 px-2.5 py-1.5 font-label text-sm uppercase leading-none tracking-[0.16em] text-white transition-colors hover:border-crimson-hover hover:bg-crimson-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-crimson focus-visible:ring-offset-2 focus-visible:ring-offset-background xl:px-3" popoverTarget="linux-download" aria-haspopup="dialog">
                <Icon name="download" className="size-3.5 shrink-0" strokeWidth={1.75} />
                {t("download.trigger")}
            </button>
            <div id="linux-download" popover="auto" role="dialog" aria-labelledby="download-modal-heading" className="fixed inset-0 z-50 m-0 h-full max-h-none w-full max-w-none border-0 bg-transparent p-0">
                <div className="flex h-full items-center justify-center bg-black/80 p-3 sm:p-6">
                    <div className="relative max-h-[calc(100svh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-sm border border-white/10 bg-surface-raised shadow-2xl">
                        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-px bg-gold/60" />
                        <div className="relative p-5 sm:p-9">
                            <button type="button" className="absolute top-4 right-4 flex size-10 cursor-pointer items-center justify-center rounded-sm border border-white/15 text-foreground-muted" popoverTarget="linux-download" popoverTargetAction="hide" aria-label={t("download.close")}>
                                <Icon name="x" className="size-5" />
                            </button>
                            <p className="pr-12 font-label text-xs font-semibold uppercase tracking-[0.16em] text-gold sm:pr-14 sm:tracking-[0.2em]">{t("download.options")}</p>
                            <h3 id="download-modal-heading" className="mt-3 pr-12 font-display text-3xl font-semibold uppercase leading-none text-foreground min-[380px]:text-4xl sm:pr-14 sm:text-5xl">{t("download.heading")}</h3>
                            <p className="mt-4 max-w-xl font-sans text-sm leading-6 text-foreground-muted sm:text-base">{t("download.description")}</p>
                            <div className="mt-6 grid gap-3 sm:mt-8">
                                {downloadSources.map((source) => (
                                    <a key={source.name} href={source.href} target="_blank" rel="noopener noreferrer" className="group flex items-start justify-between gap-3 rounded-sm border border-white/10 bg-background/60 p-4 text-left sm:items-center sm:gap-6 sm:p-6">
                                        <span>
                                            <span className="flex flex-wrap items-center gap-2 sm:gap-3">
                                                <span className="font-display text-xl font-semibold text-foreground sm:text-2xl">{t(source.name)}</span>
                                                {"recommended" in source && source.recommended && <span className="rounded-sm border border-crimson/60 px-2 py-1 font-label text-[0.65rem] font-semibold uppercase tracking-widest text-crimson-hover sm:text-xs sm:tracking-[0.12em]">{t("download.recommended")}</span>}
                                                {"supporterOnly" in source && source.supporterOnly && <span className="rounded-sm border border-[#ff8181]/60 px-2 py-1 font-label text-[0.65rem] font-semibold uppercase tracking-widest text-[#ff8181] sm:text-xs sm:tracking-[0.12em]">{t("download.supporterOnly")}</span>}
                                            </span>
                                            <span className="mt-2 block font-sans text-sm leading-5 text-foreground-muted">{t(source.description)}</span>
                                        </span>
                                        <Icon name="external" className="size-5 shrink-0 text-foreground-dim" />
                                    </a>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

/** Signed-in account menu. Sign-out posts to a route so this page stays a server render. */
function ProfileMenu({ t, accountName, isAdmin }: { t: Translate; accountName: string; isAdmin: boolean }) {
    const itemClassName = "block w-full rounded-sm px-4 py-3 text-left font-sans text-sm text-foreground transition-colors hover:bg-white/5 hover:text-gold";
    return (
        <details className="linux-menu relative">
            <summary aria-label={t("account.menu", { name: accountName })} className={`${summaryReset} flex min-h-10 items-center justify-center gap-2 rounded-lg px-2.5 text-foreground lg:px-3`}>
                <Icon name="user" className="size-5 shrink-0" />
                <span className="hidden max-w-28 truncate font-label text-sm leading-none uppercase tracking-widest lg:block">{accountName}</span>
                <Icon name="chevron" className="hidden size-3.5 lg:block" />
            </summary>
            <div className="absolute right-0 top-full z-70 mt-3 w-52 rounded-sm border border-white/10 bg-surface-raised p-1 shadow-2xl">
                <p className="truncate border-b border-white/10 px-4 py-3 text-sm font-semibold text-gold" title={accountName}>{accountName}</p>
                <a href="/account" className={itemClassName}>{t("account.account")}</a>
                <a href="/servers" className={itemClassName}>{t("account.servers")}</a>
                {isAdmin && <a href="/admin" className="flex w-full items-center gap-2 rounded-sm px-4 py-3 text-left font-sans text-sm text-gold"><Icon name="shield" className="size-4 shrink-0" />Admin</a>}
                <hr className="my-1 border-white/10" />
                <form method="post" action="/linux/sign-out">
                    <button type="submit" className={itemClassName}>{t("account.signOut")}</button>
                </form>
            </div>
        </details>
    );
}

/** Phone drawer. Closed, only the round button is on screen. */
function MobileMenu({ t, locale, path, isAdmin, isAuthenticated }: { t: Translate; locale: Locale; path: string; isAdmin: boolean; isAuthenticated: boolean }) {
    return (
        <details className="linux-menu">
            <summary className={`${summaryReset} relative z-60 flex size-10 items-center justify-center rounded-full border border-white/20 text-foreground`} aria-label={t("nav.open")}>
                <span aria-hidden="true" className="relative block size-5">
                    <span className="absolute top-1 left-0 h-px w-5 bg-current" />
                    <span className="absolute top-2.5 left-0 h-px w-5 bg-current" />
                    <span className="absolute top-4 left-0 h-px w-5 bg-current" />
                </span>
            </summary>
            <div className="mobile-nav-overlay fixed inset-0 z-50 bg-black/80">
                <div id="mobile-navigation" className="mobile-nav-panel ml-auto flex h-full w-full max-w-sm flex-col border-l border-white/10 bg-surface-raised p-6 shadow-2xl sm:p-8">
                    <div className="border-b border-white/10 pb-5 pr-12">
                        <p className="font-display text-xl font-semibold uppercase tracking-[0.08em] text-foreground">Bannerlord Co-op</p>
                    </div>
                    <nav className="mt-8" aria-label={t("nav.mobile")}>
                        <ul className="space-y-1">
                            {mobileLinks.map(([label, href]) => (
                                <li key={href}><a href={href} className="block border-b border-white/10 py-4 font-display text-3xl font-semibold uppercase text-foreground">{t(label)}</a></li>
                            ))}
                            {isAdmin && <li><a href="/admin" className="block border-b border-white/10 py-4 font-display text-3xl font-semibold uppercase text-gold">Admin</a></li>}
                        </ul>
                    </nav>
                    <div className="mt-auto grid gap-3 pt-8">
                        <LocaleMenu t={t} locale={locale} path={path} variant="mobile" />
                        <a href="https://discord.gg/bannerlordcoop" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-white/20 font-label text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Discord</a>
                        {!isAuthenticated && <a href="/login" className="inline-flex min-h-12 items-center justify-center rounded-sm border border-crimson bg-transparent font-label text-sm font-semibold uppercase tracking-[0.14em] text-foreground">{t("nav.signIn")}</a>}
                    </div>
                </div>
            </div>
        </details>
    );
}
