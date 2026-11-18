/* eslint-disable @next/next/no-html-link-for-pages -- anchors keep the client link runtime off these pages */
import { JsonLd, SITE_URL, organizationNode } from "@/app/lib/structured-data";
import { getLocale, getTranslations } from "@/app/lib/localization/server";
import { cookies } from "next/headers";
import distroData from "./content/distros.json";
import { resolveLocale } from "@/app/lib/localization/registry";
import { ONESHOT_SECTION, routeLabels, routePath, sections, sectionsById, showsDistroChip, WIZARD_STEPS, wizardNeighbors, type Distro, type GuideRoute, type WizardStep } from "./guide-model";
import { choiceCard, goldButton, pageFrame, primaryButton, titleClass } from "./guide-styles";
import { LinuxFooter, LinuxHeader } from "./linux-chrome";
import "./linux-guide.css";
import { faqSection, resetGuideIds, StaticGuideSection, StaticSection } from "./static-blocks";

/** English stays at /linux. Every other language is a real path a static host can serve. */
export function guideHref(locale: string, path: string): string {
    return locale === "en" ? path : `/${locale}${path}`;
}

function channel(value: number): number {
    const scaled = value / 255;
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function contrast(foreground: [number, number, number], background: [number, number, number]): number {
    const light = (rgb: [number, number, number]) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    const a = light(foreground);
    const b = light(background);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

function readableNameTint(color: string): string {
    const [r, g, b] = color.split(",").map((part) => Number(part.trim()));
    const background: [number, number, number] = [32, 30, 26];
    for (let step = 0; step <= 20; step += 1) {
        const mix = step / 20;
        const next: [number, number, number] = [
            Math.round(r + (255 - r) * mix),
            Math.round(g + (246 - g) * mix),
            Math.round(b + (228 - b) * mix),
        ];
        if (contrast(next, background) >= 4.5) return `rgb(${next[0]}, ${next[1]}, ${next[2]})`;
    }
    return "rgb(255, 246, 228)";
}
import { scopeSvg } from "./views/svg";

const distros = distroData as Distro[];

/** A stored id is used only when it is one of the guide's distros. */
function known(id: string | null): string | null {
    if (!id) return null;
    return distros.some((distro) => distro.id === id) ? id : null;
}

/** Server render of the three pages that must paint before the client runtime loads. */
export async function renderStaticLinux(view: "start" | "faq" | "distro" | "checklist" | "script" | "done" | "step", path: string, title: string, description: string, options?: { step?: WizardStep; resume?: string | null; locale?: string }) {
    const locale = resolveLocale(options?.locale ?? await getLocale());
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
    const canDistro = showsDistroChip(route, selectedId ?? "pending");
    const herePath = guideHref(locale, path);
    resetGuideIds();
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
                    <nav className={`linux-subnav sticky top-0 z-30 border-b border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-[18px]${canDistro ? " can-distro has-distro" : ""}`} aria-label={t("ui.guide")}>
                        <div className={`${pageFrame} grid min-h-12 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2`}>
                            <div className="subnav-crumb flex min-w-0 items-center gap-2 justify-self-start overflow-hidden">
                                <a href={guideHref(locale, "/linux")} className="inline-flex min-h-12 shrink-0 items-center gap-1 border-0 bg-transparent px-1 font-label text-base text-foreground no-underline hover:text-gold">
                                    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="m15 5-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                                    <span>{t("ui.menu")}</span>
                                </a>
                                <span className="subnav-sep text-white/40" aria-hidden="true">/</span>
                                <span className="subnav-here min-w-0 truncate font-semibold text-[#f4f1ea]" aria-current="page">{labels.here}</span>
                            </div>
                            {canDistro ? (
                                <div className="flex min-w-0 max-w-full items-center justify-self-center" role="group" aria-label={t("nav.dYour").replace(/[:：]\s*$/, "")}>
                                    {distros.map((distro) => (
                                        <span key={distro.id} className="distro-chip items-center gap-2" data-for={distro.id} style={{ ["--d" as string]: distro.color, ["--ig" as string]: distro.glyph }}>
                                            <span className={`subnav-mark inline-grid h-6 w-6 place-items-center ${distro.art ? "is-art overflow-hidden" : ""}`} style={distro.art ? undefined : { backgroundColor: `rgb(${distro.color})` }} aria-hidden="true" dangerouslySetInnerHTML={{ __html: scopeSvg(distro.svg, "subnav") }} />
                                            <strong className="subnav-distro-name max-w-44 truncate font-label text-base font-semibold" style={{ color: readableNameTint(distro.color) }}>{t(distro.nameKey)}</strong>
                                            <a data-short={t("nav.dChangeShort")} className="subnav-change inline-flex min-h-12 items-center border-0 border-l border-white/15 bg-transparent px-2 font-label text-sm font-semibold uppercase tracking-[0.22em] text-gold no-underline" href={`${guideHref(locale, "/linux/distro")}?resume=${encodeURIComponent(herePath)}`}>{t("nav.dChange")}</a>
                                        </span>
                                    ))}
                                </div>
                            ) : <span />}
                            <span aria-hidden="true" />
                        </div>
                        {route.view === "wizard" && (
                            <div className="h-0.5 bg-transparent" role="progressbar" aria-label={labels.progress} aria-valuemin={1} aria-valuemax={WIZARD_STEPS.length} aria-valuenow={WIZARD_STEPS.indexOf(route.step) + 1} aria-valuetext={labels.progress}>
                                <span className="block h-full bg-gold" style={{ width: `${((WIZARD_STEPS.indexOf(route.step) + 1) / WIZARD_STEPS.length) * 100}%` }} />
                            </div>
                        )}
                    </nav>
                )}
                {view === "start" && <StaticStart t={t} locale={locale} />}
                {view === "distro" && <StaticDistro t={t} locale={locale} selectedId={selectedId} resume={options?.resume ?? null} />}
                {view === "checklist" && <StaticChecklist t={t} distro={selected} />}
                {view === "script" && sectionsById.get(ONESHOT_SECTION) && (
                    <section aria-labelledby="manual-title">
                        <div className={`${pageFrame} py-8 sm:py-10`}>
                            <StaticGuideSection section={sectionsById.get(ONESHOT_SECTION)!} t={t} distro={selected} alone />
                        </div>
                    </section>
                )}
                {view === "step" && step && <StaticStep t={t} locale={locale} step={step} distro={selected} nextLabel={labels.nextLabel} />}
                {view === "done" && <StaticDone t={t} locale={locale} />}
                {view === "faq" && (
                    <section aria-labelledby="manual-title">
                        <div className={`${pageFrame} py-8 sm:py-10`}>
                            <StaticSection section={faqSection()} t={t} />
                        </div>
                    </section>
                )}
            </main>
            <LinuxFooter t={common} locale={locale} year={common.number(new Date().getUTCFullYear(), { useGrouping: false })} />
            <script
                dangerouslySetInnerHTML={{
                    __html: `addEventListener("load",function(){setTimeout(function(){var n=document.getElementById("linux-backdrop");if(n&&!n.getAttribute("src"))n.setAttribute("src","/images/linux/backdrop.webp")},2000)});var picked=document.documentElement.getAttribute("data-distro");if(picked){document.querySelectorAll("[data-pick]").forEach(function(form){var button=form.querySelector("button");if(button)button.setAttribute("aria-pressed",form.getAttribute("data-pick")===picked?"true":"false")})}var resumeNow=new URLSearchParams(location.search).get("resume")||"";if(resumeNow.charAt(0)==="/"&&resumeNow.indexOf("//")<0){document.querySelectorAll("form.distro-choice").forEach(function(form){if(form.querySelector("input[name=resume]"))return;var input=document.createElement("input");input.type="hidden";input.name="resume";input.value=resumeNow;form.appendChild(input)})}document.addEventListener("click",function(e){var b=e.target&&e.target.closest?e.target.closest("[data-copy]"):null;if(!b)return;var pre=document.getElementById(b.getAttribute("data-copy"));var text=pre?pre.innerText:"";var ok=b.getAttribute("data-copied");var fail=b.getAttribute("data-failed");function done(label,reset){b.textContent=label;setTimeout(function(){b.textContent=b.getAttribute("data-label")},reset)}if(!text||!navigator.clipboard){done(fail,Number(b.getAttribute("data-reset-fail"))||4000);return}navigator.clipboard.writeText(text).then(function(){done(ok,Number(b.getAttribute("data-reset-ok"))||2200)},function(){done(fail,Number(b.getAttribute("data-reset-fail"))||4000)})});function termButton(node){return node&&node.closest?node.closest("[data-term]"):null}function termPop(button){return document.getElementById(button.getAttribute("aria-controls")||"")}function openTerm(button){var pop=termPop(button);if(pop&&pop.showPopover&&!pop.matches(":popover-open"))pop.showPopover();button.setAttribute("aria-expanded","true")}var termHover=false;document.addEventListener("pointerover",function(e){if(e.pointerType&&e.pointerType!=="mouse")return;var b=termButton(e.target);if(!b)return;openTerm(b);termHover=true});document.addEventListener("focusin",function(e){var b=termButton(e.target);if(b)openTerm(b)});document.addEventListener("click",function(e){var b=termButton(e.target);if(!b||!termHover)return;termHover=false;if(e.pointerType==="touch"||e.pointerType==="pen")return;e.preventDefault()},true);document.addEventListener("toggle",function(e){var pop=e.target;if(!pop||!pop.matches||!pop.matches("[popover]")||!pop.id)return;var open=pop.matches(":popover-open");var btn=document.querySelector('[aria-controls="'+pop.id+'"]');if(btn)btn.setAttribute("aria-expanded",open?"true":"false")},true);document.addEventListener("keydown",function(e){if(e.key!=="Escape")return;var open=document.querySelector("[popover]:popover-open");if(!open||!open.id)return;var id=open.id;if(open.hidePopover)open.hidePopover();var btn=document.querySelector('[aria-controls="'+id+'"]');if(btn&&btn.focus)btn.focus()});`,
                }}
            />
        </>
    );
}

/** Opening choices. Each one is a real address, so a missing distro is handled by that page. */
function StaticStart({ t, locale }: { t: (key: string) => string; locale: string }) {
    return (
        <section className="guide-stage" aria-labelledby="start-title">
            <div className={pageFrame}>
                <h1 id="start-title" tabIndex={-1} className={titleClass}>{t("ui.startTitle")}</h1>
                <div className="guide-choices guide-choices-4 mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <a className={`${choiceCard} choice-recommended border-gold/60 no-underline`} href={guideHref(locale, "/linux/step/overview")}>
                        <span className="font-label text-xs font-bold uppercase tracking-[0.08em] text-gold">{t("ui.recommended")}</span>
                        <strong className="mt-1 block font-display text-2xl font-semibold">{t("ui.stepByStep")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.walk")}</span>
                    </a>
                    <a className={`${choiceCard} no-underline`} href={guideHref(locale, "/linux/script")}>
                        <strong className="block font-display text-2xl font-semibold">{t("ui.oneScript")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.oneScriptSub")}</span>
                    </a>
                    <a className={`${choiceCard} no-underline`} href={guideHref(locale, "/linux/checklist")}>
                        <strong className="block font-display text-2xl font-semibold">{t("ui.fullChecklist")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.checklistSub")}</span>
                    </a>
                    <a className={`${choiceCard} no-underline`} href={guideHref(locale, "/linux/faq")}>
                        <strong className="block font-display text-2xl font-semibold">{t("ui.faq")}</strong>
                        <span className="mt-2 text-foreground-muted">{t("ui.faqSub")}</span>
                    </a>
                </div>
            </div>
        </section>
    );
}

/** Distro cards. The choice is stored before the browser leaves this page. */
function StaticDistro({ t, locale, selectedId, resume }: { t: (key: string) => string; locale: string; selectedId: string | null; resume: string | null }) {
    return (
        <section className="guide-stage" aria-labelledby="distro-title">
            <div className={pageFrame}>
                <h1 id="distro-title" tabIndex={-1} className={titleClass}>{t("nav.dTitle")}</h1>
                <div className="guide-choices guide-choices-2 mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label={t("nav.dGroup")}>
                    {distros.map((distro) => {
                        const selected = distro.id === selectedId;
                        return (
                            <form key={distro.id} method="get" action={guideHref(locale, "/linux/distro")} className="distro-choice block min-w-0" data-pick={distro.id}>
                                <input type="hidden" name="pick" value={distro.id} />
                                {resume && <input type="hidden" name="resume" value={resume} />}
                                <button
                                    type="submit"
                                    className={`${choiceCard} grid min-h-[7.5rem] grid-cols-[48px_minmax(0,1fr)] grid-rows-[auto_1fr] gap-x-3 ${selected ? "border-gold" : ""}`}
                                    style={{ ["--d" as string]: distro.color, ["--ig" as string]: distro.glyph }}
                                    aria-pressed={selected}
                                >
                                    <svg className="distro-picked absolute top-3 right-3 text-gold" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
                                        <path d="m5 13 4 4L19 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
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

function StaticStep({ t, locale, step, distro, nextLabel }: { t: (key: string) => string; locale: string; step: WizardStep; distro: Distro | null; nextLabel: string }) {
    const section = sectionsById.get(step);
    if (!section) return null;
    const neighbors = wizardNeighbors(step);
    return (
        <section aria-labelledby="wizard-title">
            <div className={`${pageFrame} wizard-copy py-8 pb-28 sm:py-10`}>
                <StaticGuideSection section={section} t={t} distro={distro} wizard alone />
            </div>
            <div className="linux-wizard-bar sticky bottom-0 z-20 flex flex-nowrap items-stretch justify-center gap-2 px-3 py-3">
                {neighbors.previous && <a className={`${goldButton} min-w-0 flex-1 px-2 text-xs no-underline sm:flex-none sm:px-4 sm:text-sm`} href={guideHref(locale, routePath(neighbors.previous))}>{t("ui.previous")}</a>}
                <a className={`${goldButton} min-w-0 flex-1 px-2 text-xs no-underline sm:flex-none sm:px-4 sm:text-sm`} href={`${guideHref(locale, "/linux/checklist")}#sec-troubleshooting`}>{t("ui.help")}</a>
                <a className={`${primaryButton} min-w-0 flex-1 px-2 text-xs no-underline sm:flex-none sm:px-4 sm:text-sm`} href={guideHref(locale, routePath(neighbors.next))}>{nextLabel}</a>
            </div>
        </section>
    );
}

function StaticDone({ t, locale }: { t: (key: string) => string; locale: string }) {
    return (
        <section className="guide-stage" aria-labelledby="done-title">
            <div className={pageFrame}>
                <h1 id="done-title" tabIndex={-1} className={titleClass}>{t("ui.doneTitle")}</h1>
                <p className="mt-4 max-w-xl text-foreground">{t("ui.doneBody")}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                    <a className={`${goldButton} no-underline`} href={`${guideHref(locale, "/linux/checklist")}#sec-troubleshooting`}>{t("section.troubleshooting.title")}</a>
                    <a className={`${primaryButton} no-underline`} href={guideHref(locale, "/linux/faq")}>{t("section.faq.title")}</a>
                </div>
            </div>
        </section>
    );
}
