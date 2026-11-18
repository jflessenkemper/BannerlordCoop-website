/* eslint-disable @next/next/no-html-link-for-pages -- anchors keep the client link runtime off these pages */
import { JsonLd, SITE_URL, organizationNode } from "@/app/lib/structured-data";
import { getLocale, getTranslations } from "@/app/lib/localization/server";
import { cookies } from "next/headers";
import distroData from "./content/distros.json";
import { ONESHOT_SECTION, routeLabels, routePath, sections, sectionsById, WIZARD_STEPS, wizardNeighbors, type Distro, type GuideRoute, type WizardStep } from "./guide-model";
import { choiceCard, goldButton, pageFrame, primaryButton, titleClass } from "./guide-styles";
import { LinuxFooter, LinuxHeader } from "./linux-chrome";
import "./linux-guide.css";
import { faqSection, StaticGuideSection, StaticSection } from "./static-blocks";
import { scopeSvg } from "./views/svg";

const distros = distroData as Distro[];

/** A stored id is used only when it is one of the guide's distros. */
function known(id: string | null): string | null {
    if (!id) return null;
    return distros.some((distro) => distro.id === id) ? id : null;
}

/** Server render of the three pages that must paint before the client runtime loads. */
export async function renderStaticLinux(view: "start" | "faq" | "distro" | "checklist" | "script" | "done" | "step", path: string, title: string, description: string, options?: { step?: WizardStep; resume?: string | null }) {
    const locale = await getLocale();
    const common = await getTranslations("common", locale);
    const linux = await getTranslations("linux", locale);
    const t = (key: string, params: Record<string, string | number> = {}) => linux.t(key, { date: "{date}", time: "{time}", ...params });
    const selectedId = known((await cookies()).get("blc-distro-v1")?.value ?? null);
    const selected = distros.find((distro) => distro.id === selectedId) ?? null;
    const step = options?.step;
    const route: GuideRoute = view === "faq" ? { view: "manual", section: "faq" }
        : view === "script" ? { view: "manual", section: ONESHOT_SECTION }
        : view === "checklist" ? { view: "manual" }
        : view === "done" ? { view: "done" }
        : view === "step" && step ? { view: "wizard", step }
        : view === "distro" ? { view: "distro" }
        : { view: "start" };
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
                        {route.view === "wizard" && (
                            <div className="h-0.5 bg-transparent" role="progressbar" aria-label={labels.progress} aria-valuemin={1} aria-valuemax={WIZARD_STEPS.length} aria-valuenow={WIZARD_STEPS.indexOf(route.step) + 1} aria-valuetext={labels.progress}>
                                <span className="block h-full bg-gold" style={{ width: `${((WIZARD_STEPS.indexOf(route.step) + 1) / WIZARD_STEPS.length) * 100}%` }} />
                            </div>
                        )}
                    </nav>
                )}
                {view === "start" && <StaticStart t={t} />}
                {view === "distro" && <StaticDistro t={t} selectedId={selectedId} resume={options?.resume ?? null} />}
                {view === "checklist" && <StaticChecklist t={t} distro={selected} />}
                {view === "script" && sectionsById.get(ONESHOT_SECTION) && (
                    <section aria-labelledby="manual-title">
                        <div className={`${pageFrame} py-8 sm:py-10`}>
                            <StaticGuideSection section={sectionsById.get(ONESHOT_SECTION)!} t={t} distro={selected} alone />
                        </div>
                    </section>
                )}
                {view === "step" && step && <StaticStep t={t} step={step} distro={selected} nextLabel={labels.nextLabel} />}
                {view === "done" && <StaticDone t={t} />}
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
function StaticDistro({ t, selectedId, resume }: { t: (key: string) => string; selectedId: string | null; resume: string | null }) {
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
                                {resume && <input type="hidden" name="resume" value={resume} />}
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

function StaticChecklist({ t, distro }: { t: (key: string) => string; distro: Distro | null }) {
    return (
        <section aria-labelledby="manual-title">
            <div className={`${pageFrame} py-8 sm:py-10`}>
                <h1 id="manual-title" tabIndex={-1} className={titleClass}>{t("ui.fullChecklist")}</h1>
                <nav aria-label={t("ui.contents")} className="mt-4">
                    <ol className="m-0 list-decimal space-y-1 pl-5 text-foreground">
                        {sections.map((section) => (
                            <li key={section.id}><a className="text-foreground underline decoration-gold/60 underline-offset-4" href={`#sec-${section.id}`}>{t(section.titleKey)}</a></li>
                        ))}
                    </ol>
                </nav>
                {sections.map((section) => <StaticGuideSection key={section.id} section={section} t={t} distro={distro} />)}
            </div>
        </section>
    );
}

function StaticStep({ t, step, distro, nextLabel }: { t: (key: string) => string; step: WizardStep; distro: Distro | null; nextLabel: string }) {
    const section = sectionsById.get(step);
    if (!section) return null;
    const neighbors = wizardNeighbors(step);
    return (
        <section aria-labelledby="wizard-title">
            <div className={`${pageFrame} wizard-copy py-8 pb-28 sm:py-10`}>
                <StaticGuideSection section={section} t={t} distro={distro} wizard alone />
            </div>
            <div className="linux-wizard-bar sticky bottom-0 z-20 flex flex-nowrap items-stretch justify-center gap-2 px-3 py-3">
                {neighbors.previous && <a className={`${goldButton} min-w-0 flex-1 px-2 text-xs no-underline sm:flex-none sm:px-4 sm:text-sm`} href={routePath(neighbors.previous)}>{t("ui.previous")}</a>}
                <a className={`${goldButton} min-w-0 flex-1 px-2 text-xs no-underline sm:flex-none sm:px-4 sm:text-sm`} href="/linux/checklist#sec-troubleshooting">{t("ui.help")}</a>
                <a className={`${primaryButton} min-w-0 flex-1 px-2 text-xs no-underline sm:flex-none sm:px-4 sm:text-sm`} href={routePath(neighbors.next)}>{nextLabel}</a>
            </div>
        </section>
    );
}

function StaticDone({ t }: { t: (key: string) => string }) {
    return (
        <section className="guide-stage" aria-labelledby="done-title">
            <div className={pageFrame}>
                <h1 id="done-title" tabIndex={-1} className={titleClass}>{t("ui.doneTitle")}</h1>
                <p className="mt-4 max-w-xl text-foreground">{t("ui.doneBody")}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <a className={`${goldButton} no-underline`} href="/linux/checklist#sec-troubleshooting">{t("section.troubleshooting.title")}</a>
                    <a className={`${primaryButton} no-underline`} href="/linux/faq">{t("section.faq.title")}</a>
                </div>
            </div>
        </section>
    );
}
