/* eslint-disable @next/next/no-html-link-for-pages -- anchors keep the client link runtime off these pages */
import { JsonLd, SITE_URL, organizationNode } from "@/app/lib/structured-data";
import { getLocale, getTranslations } from "@/app/lib/localization/server";
import { cookies } from "next/headers";
import distroData from "./content/distros.json";
import { routeLabels, type Distro } from "./guide-model";
import { choiceCard, pageFrame, titleClass } from "./guide-styles";
import { LinuxFooter, LinuxHeader } from "./linux-chrome";
import "./linux-guide.css";
import { faqSection, StaticSection } from "./static-blocks";
import { scopeSvg } from "./views/svg";

const distros = distroData as Distro[];

/** A stored id is used only when it is one of the guide's distros. */
function known(id: string | null): string | null {
    if (!id) return null;
    return distros.some((distro) => distro.id === id) ? id : null;
}

/** Server render of the three pages that must paint before the client runtime loads. */
export async function renderStaticLinux(view: "start" | "faq" | "distro", path: string, title: string, description: string) {
    const locale = await getLocale();
    const common = await getTranslations("common", locale);
    const { t } = await getTranslations("linux", locale);
    const selectedId = known((await cookies()).get("blc-distro-v1")?.value ?? null);
    const route = view === "faq" ? { view: "manual" as const, section: "faq" } : view === "distro" ? { view: "distro" as const } : { view: "start" as const };
    const labels = routeLabels(route, t);
    return (
        <>
            {/* The original artwork, not a resized derivative. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img id="linux-backdrop" className="linux-backdrop" alt="" width={1600} height={900} decoding="async" fetchPriority="low" />
            <JsonLd
                data={{
                    "@graph": [
                        organizationNode,
                        {
                            "@type": "TechArticle",
                            "@id": `${SITE_URL}${path}#guide`,
                            headline: title,
                            description,
                            inLanguage: locale,
                            url: `${SITE_URL}${path}`,
                            about: "Mount & Blade II: Bannerlord Co-op mod",
                            isPartOf: { "@id": `${SITE_URL}/#organization` },
                        },
                    ],
                }}
            />
            {await LinuxHeader({ t: common.t, locale, path })}
            <main id="linux-guide" className="linux-guide relative isolate w-full min-w-0 flex-1 text-foreground" aria-label={t("ui.guideContent")}>
                {view !== "start" && (
                    <nav className="linux-subnav sticky top-0 z-30 border-b border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[18px]" aria-label={t("ui.guide")}>
                        <div className={`${pageFrame} grid min-h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2`}>
                            <div className="subnav-crumb flex min-w-0 items-center gap-2 justify-self-start overflow-hidden">
                                <a href="/linux" className="inline-flex min-h-12 shrink-0 items-center gap-1 border-0 bg-transparent px-1 font-label text-base text-foreground no-underline hover:text-gold">
                                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <span>{t("ui.menu")}</span>
                                </a>
                                <span className="subnav-sep text-white/40" aria-hidden="true">/</span>
                                <span className="subnav-here min-w-0 truncate font-semibold text-[#f4f1ea]" aria-current="page">{labels.here}</span>
                            </div>
                            <span />
                            <span aria-hidden="true" />
                        </div>
                    </nav>
                )}
                {view === "start" && <StaticStart t={t} />}
                {view === "distro" && <StaticDistro t={t} selectedId={selectedId} />}
                {view === "faq" && (
                    <section aria-labelledby="manual-title">
                        <div className={`${pageFrame} py-8 sm:py-10`}>
                            <StaticSection section={faqSection()} t={t} />
                        </div>
                    </section>
                )}
            </main>
            <LinuxFooter t={common} year={common.number(new Date().getUTCFullYear(), { useGrouping: false })} />
            <script
                dangerouslySetInnerHTML={{
                    __html: `setTimeout(function(){var n=document.getElementById("linux-backdrop");if(n)n.setAttribute("src","/images/linux/backdrop.webp")},1500);document.addEventListener("submit",function(e){var f=e.target;if(!f||!f.classList||!f.classList.contains("distro-choice"))return;try{localStorage.setItem("blc-distro-v1",new FormData(f).get("id"))}catch(x){}});document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("[data-copy]"):null;if(!b)return;var pre=document.getElementById(b.getAttribute("data-copy"));var text=pre?pre.innerText:"";var ok=b.getAttribute("data-copied");var fail=b.getAttribute("data-failed");function done(label){b.textContent=label;setTimeout(function(){b.textContent=b.getAttribute("data-label")},2200)}if(!text||!navigator.clipboard){done(fail);return}navigator.clipboard.writeText(text).then(function(){done(ok)},function(){done(fail)})});document.addEventListener("toggle",function(e){var pop=e.target;if(pop&&pop.matches&&pop.matches("[popover]")&&pop.matches(":popover-open"))pop.focus()},true);`,
                }}
            />
        </>
    );
}

/** Opening choices. Each one is a real address, so a missing distro is handled by that page. */
function StaticStart({ t }: { t: (key: string) => string }) {
    return (
        <section className="guide-stage" aria-labelledby="start-title">
            <div className={pageFrame}>
                <h1 id="start-title" tabIndex={-1} className={titleClass}>{t("ui.startTitle")}</h1>
                <div className="guide-choices guide-choices-4 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <a className={`${choiceCard} choice-recommended border-gold/60 no-underline`} href="/linux/step/overview">
                        <span className="font-label text-xs font-bold uppercase tracking-[0.08em] text-gold">{t("ui.recommended")}</span>
                        <strong className="mt-1 block font-display text-2xl font-semibold">{t("ui.stepByStep")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.walk")}</span>
                    </a>
                    <a className={`${choiceCard} no-underline`} href="/linux/script">
                        <strong className="block font-display text-2xl font-semibold">{t("ui.oneScript")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.oneScriptSub")}</span>
                    </a>
                    <a className={`${choiceCard} no-underline`} href="/linux/checklist">
                        <strong className="block font-display text-2xl font-semibold">{t("ui.fullChecklist")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.checklistSub")}</span>
                    </a>
                    <a className={`${choiceCard} no-underline`} href="/linux/faq">
                        <strong className="block font-display text-2xl font-semibold">{t("ui.faq")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.faqSub")}</span>
                    </a>
                </div>
            </div>
        </section>
    );
}

/** Distro cards. The choice is stored before the browser leaves this page. */
function StaticDistro({ t, selectedId }: { t: (key: string) => string; selectedId: string | null }) {
    return (
        <section className="guide-stage" aria-labelledby="distro-title">
            <div className={pageFrame}>
                <h1 id="distro-title" tabIndex={-1} className={titleClass}>{t("nav.dTitle")}</h1>
                <div className="guide-choices guide-choices-2 mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label={t("nav.dGroup")}>
                    {distros.map((distro) => {
                        const selected = distro.id === selectedId;
                        return (
                            <form key={distro.id} method="post" action="/linux/distro/choose" className="contents distro-choice">
                                <input type="hidden" name="id" value={distro.id} />
                                <button
                                    type="submit"
                                    className={`${choiceCard} grid min-h-[7.5rem] grid-cols-[48px_minmax(0,1fr)] grid-rows-[auto_1fr] gap-x-3 ${selected ? "border-gold" : ""}`}
                                    style={{ ["--d" as string]: distro.color, ["--ig" as string]: distro.glyph }}
                                    aria-pressed={selected}
                                >
                                    {selected && (
                                        <svg className="absolute top-3 right-3 text-gold" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                            <path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                    )}
                                    <span className={`distro-mark col-start-1 row-span-2 inline-grid h-12 w-12 place-items-center rounded-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.28)] ${distro.art ? "is-art overflow-hidden bg-[#111]" : "bg-[rgb(var(--d))]"}`} dangerouslySetInnerHTML={{ __html: scopeSvg(distro.svg, distro.id) }} />
                                    <strong className="col-start-2 font-display text-2xl font-semibold">{t(distro.nameKey)}</strong>
                                    <span className="distro-blurb col-start-2 text-foreground">{t(distro.blurbKey)}</span>
                                </button>
                            </form>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
