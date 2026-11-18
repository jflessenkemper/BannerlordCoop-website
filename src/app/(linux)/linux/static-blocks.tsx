import type { ReactNode } from "react";
import type { Translator } from "@/app/lib/localization/types";
import { sectionsById, type Block, type Distro, type GuideTab, type Inline, type Section } from "./guide-model";
import { cx, glassCard, goldButton, primaryButton, sectionTitleClass } from "./guide-styles";
import { scriptText } from "./script-text";

type Translate = Translator["t"];

/** Renders the FAQ answers without a client component. */
export function StaticSection({ section, t }: { section: Section; t: Translate }) {
    return (
        <div className="border-b border-white/10 py-6" id={`sec-${section.id}`}>
            <h1 className={sectionTitleClass} id="manual-title" tabIndex={-1}>{t(section.titleKey)}</h1>
            <div className="mt-4">
                <StaticBlocks blocks={hoistWarnings(section.blocks)} t={t} />
            </div>
        </div>
    );
}

/** Puts warning callouts ahead of the other blocks in a step. */
function hoistWarnings(blocks: Block[]): Block[] {
    const warnings = blocks.filter((block) => block.type === "callout" && block.kind === "warn");
    const rest = blocks.filter((block) => !(block.type === "callout" && block.kind === "warn"));
    return [...warnings, ...rest];
}

/** Renders guide blocks without a client component. */
function StaticBlocks({ blocks, t, distro = null, alone = false }: { blocks: Block[]; t: Translate; distro?: Distro | null; alone?: boolean }) {
    return (
        <>
            {blocks.map((block, index) => {
                switch (block.type) {
                    case "p":
                        return <p key={index} className={cx("leading-relaxed", block.role === "lead" && "mb-4 mt-3")}><StaticInline nodes={block.c} t={t} /></p>;
                    case "h3": {
                        const Heading = alone ? "h2" : "h3";
                        return <Heading key={index} className="font-label text-sm font-semibold uppercase tracking-[0.22em] text-gold"><StaticInline nodes={block.c} t={t} /></Heading>;
                    }
                    case "ul":
                        return <ul key={index} className="list-disc space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}><StaticInline nodes={item} t={t} /></li>)}</ul>;
                    case "ol":
                        return (
                            <ol key={index} className={block.className === "step-cards" ? "step-cards my-4 grid gap-2 p-0" : "list-decimal space-y-1 pl-5"}>
                                {block.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className={block.className === "step-cards" ? `${glassCard} relative min-h-12 py-3 pl-14 pr-3` : undefined}>
                                        <StaticInline nodes={item} t={t} />
                                    </li>
                                ))}
                            </ol>
                        );
                    case "callout":
                        return (
                            <div key={index} id={block.id} className="my-4 border border-white/20 bg-surface px-4 py-3 text-foreground">
                                <p className={cx("mb-1 font-label text-sm font-semibold uppercase tracking-[0.08em]", calloutTone(block.kind))}>{t(block.titleKey)}</p>
                                <StaticBlocks blocks={block.blocks} t={t} distro={distro} alone={alone} />
                            </div>
                        );
                    case "tabs":
                        return <StaticTabs key={index} block={block} t={t} distro={distro} alone={alone} id={`tabs-${index}`} />;
                    case "details":
                        return (
                            <details key={index} id={block.id} className={cx(glassCard, "my-2 px-4")}>
                                <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold"><StaticInline nodes={block.summary} t={t} /></summary>
                                <div className="pb-3"><StaticBlocks blocks={block.blocks} t={t} distro={distro} alone={alone} /></div>
                            </details>
                        );
                    case "sectionRefs":
                        if (block.when === "alone" && !alone) return null;
                        return (
                            <details key={index} className={`${glassCard} my-2 px-4`}>
                                <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold"><StaticInline nodes={block.summary} t={t} /></summary>
                                {block.ids.map((id) => {
                                    const section = sectionsById.get(id);
                                    if (!section) throw new Error(`Missing folded section: ${id}`);
                                    return (
                                        <section key={id} className="mt-4 border-t border-white/10 pt-3">
                                            <h3 className="font-label text-sm font-semibold uppercase tracking-[0.08em] text-gold">{t(section.titleKey)}</h3>
                                            <StaticBlocks blocks={hoistWarnings(section.blocks)} t={t} distro={distro} alone={alone} />
                                        </section>
                                    );
                                })}
                            </details>
                        );
                    case "table":
                        return <StaticTable key={index} block={block} t={t} />;
                    case "dl":
                        return (
                            <dl key={index} className="my-4 grid gap-2">
                                {block.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="grid gap-1 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-4">
                                        <dt className="font-semibold"><StaticInline nodes={item.dt} t={t} /></dt>
                                        <dd className="m-0 text-foreground"><StaticInline nodes={item.dd} t={t} /></dd>
                                    </div>
                                ))}
                            </dl>
                        );
                    case "field":
                        return (
                            <label key={index} className="my-3 grid gap-2">
                                <StaticInline nodes={block.label} t={t} />
                                <input className="min-h-11 w-full max-w-md rounded border border-white/15 bg-surface px-3 text-foreground" type="text" placeholder={block.placeholder} autoComplete="off" />
                            </label>
                        );
                    case "columns":
                        return (
                            <div key={index} className="grid gap-3 sm:grid-cols-2">
                                {block.columns.map((column, columnIndex) => (
                                    <div key={columnIndex} className={`${glassCard} rounded-sm px-4 py-3`}><StaticBlocks blocks={column.blocks} t={t} distro={distro} alone={alone} /></div>
                                ))}
                            </div>
                        );
                    case "code":
                        return <StaticCode key={index} block={block} t={t} />;
                    default:
                        return null;
                }
            })}
        </>
    );
}

/** Inline FAQ prose. Each glossary term owns its own popover. */
function StaticInline({ nodes, t }: { nodes: Inline[]; t: Translate }): ReactNode {
    return (
        <>
            {nodes.map((node, index) => {
                switch (node.t) {
                    case "text":
                        return <span key={index}>{t(node.k)}</span>;
                    case "br":
                        return <br key={index} />;
                    case "code":
                        return <code key={index} className="rounded bg-[#0d0e0b] px-1 py-0.5 font-mono text-[0.92em] text-foreground">{node.k ? t(node.k) : node.v}</code>;
                    case "strong":
                        return <strong key={index}><StaticInline nodes={node.c} t={t} /></strong>;
                    case "em":
                        return <em key={index}><StaticInline nodes={node.c} t={t} /></em>;
                    case "term": {
                        const key = `${node.termKey}:${node.defKey}`.replace(/[^a-zA-Z0-9_-]/g, "-");
                        const popoverId = `linux-term-${key}`;
                        return (
                            <span key={index}>
                                <button
                                    type="button"
                                    id={`linux-term-btn-${key}`}
                                    className="cursor-help border-0 bg-transparent p-0 font-inherit text-inherit underline decoration-dotted decoration-gold underline-offset-[3px]"
                                    aria-controls={popoverId}
                                    popoverTarget={popoverId}
                                    popoverTargetAction="toggle"
                                    data-term=""
                                >
                                    {t(node.labelKey ?? node.termKey)}
                                </button>
                                <div
                                    id={popoverId}
                                    popover="auto"
                                    role="dialog"
                                    tabIndex={-1}
                                    aria-labelledby={`${popoverId}-title`}
                                    className="linux-term fixed z-40 max-w-[calc(100vw-2rem)] rounded-lg border border-gold/45 bg-[#11120e] p-3 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_28px_rgba(0,0,0,0.4)]"
                                >
                                    <p id={`${popoverId}-title`} className="mb-1 font-label text-sm font-semibold uppercase tracking-[0.22em] text-gold">{t(node.termKey)}</p>
                                    <p className="m-0">{t(node.defKey)}</p>
                                </div>
                            </span>
                        );
                    }
                    default:
                        return null;
                }
            })}
        </>
    );
}

/** A script listing with a copy button the page script wires up. */
function StaticCode({ block, t }: { block: Extract<Block, { type: "code" }>; t: Translate }) {
    const source = scriptText(block.id);
    const copyClass = block.oneshot ? primaryButton : goldButton;
    return (
        <figure className={cx(glassCard, "my-4 overflow-hidden", block.oneshot && "border-gold/45")}>
            <figcaption className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span><StaticInline nodes={block.title} t={t} /></span>
                    <span className="code-lang font-label text-xs font-semibold uppercase tracking-[0.08em] text-foreground-muted">{t(block.langKey)}</span>
                </span>
                <button type="button" className={copyClass} data-copy={block.id} data-label={t("ui.copy")} data-copied={t("ui.copied")} data-failed={t("ui.copyFailed")}>{t("ui.copy")}</button>
            </figcaption>
            <pre id={block.id} tabIndex={0} className={cx("linux-code m-0 overflow-x-hidden bg-[#0c0d0b] p-4 font-mono text-[0.92rem] leading-normal text-[#e8e4da] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold", block.oneshot && "max-h-[min(24rem,60dvh)] overflow-y-auto overscroll-auto")}>
                <code>{source}</code>
            </pre>
        </figure>
    );
}

function calloutTone(kind: "warn" | "info" | "ok"): string {
    if (kind === "warn") return "text-[#ffd236]";
    if (kind === "ok") return "text-[#5ee9b5]";
    return "text-[#c9b676]";
}

function tabMatches(tab: GuideTab, distro: Distro | null, scoped: boolean): boolean {
    if (!scoped || !distro) return true;
    if (tab.script) return tab.script === distro.id;
    if (tab.families) return tab.families.includes(distro.family);
    return true;
}

function StaticTable({ block, t }: { block: Extract<Block, { type: "table" }>; t: Translate }) {
    const headers = block.headerKeys.map((key) => t(key));
    return (
        <table id={block.id} className="my-4 w-full border-collapse text-left">
            <thead>
                <tr>{headers.map((header) => <th key={header} scope="col" className="border-b border-white/10 bg-[#0d0e0b] px-2 py-2 font-label text-sm font-semibold uppercase tracking-[0.22em] text-foreground">{header}</th>)}</tr>
            </thead>
            <tbody>
                {block.rows.map((row, rowIndex) => (
                    <tr key={row.id || rowIndex} id={row.id}>
                        {row.cells.map((cell, cellIndex) => (
                            <td key={cellIndex} data-label={headers[cellIndex] || ""} className="border-b border-white/10 px-2 py-2 align-top"><StaticInline nodes={cell} t={t} /></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/** Distro-scoped tabs show only the matching panel. Other sets use radio buttons, so no script is required. */
function StaticTabs({ block, t, distro, alone, id }: { block: Extract<Block, { type: "tabs" }>; t: Translate; distro: Distro | null; alone: boolean; id: string }) {
    const scoped = Boolean(distro) && block.tabs.some((tab) => tab.script || tab.families);
    const visible = block.tabs.filter((tab) => tabMatches(tab, distro, scoped));
    if (scoped) {
        return (
            <div>
                {visible.map((tab) => (
                    <div key={tab.labelKey} role="group" aria-label={t(tab.labelKey)}>
                        <StaticBlocks blocks={tab.blocks} t={t} distro={distro} alone={alone} />
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="linux-tabs">
            {visible.map((tab, position) => (
                <input key={tab.labelKey} className="linux-tab-input" type="radio" name={id} id={`${id}-${position}`} defaultChecked={position === 0} />
            ))}
            <div aria-label={t(block.labelKey)} className="linux-tablist mb-3 flex flex-wrap gap-1 border-b border-white/10">
                {visible.map((tab, position) => (
                    <label key={tab.labelKey} htmlFor={`${id}-${position}`} className="min-h-12 cursor-pointer border-0 border-b-2 border-transparent px-3 text-foreground">{t(tab.labelKey)}</label>
                ))}
            </div>
            <div className="linux-tab-panels">
                {visible.map((tab, position) => (
                    <div key={tab.labelKey} id={`${id}-panel-${position}`}>
                        <StaticBlocks blocks={tab.blocks} t={t} distro={distro} alone={alone} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** One guide section. The wizard and a focused manual page use the page heading. */
export function StaticGuideSection({ section, t, distro = null, wizard = false, alone = false }: { section: Section; t: Translate; distro?: Distro | null; wizard?: boolean; alone?: boolean }) {
    const pageHeading = wizard || alone;
    const Heading = pageHeading ? "h1" : "h2";
    return (
        <div className={wizard ? undefined : "border-b border-white/10 py-6"} id={wizard ? undefined : `sec-${section.id}`}>
            <Heading className={sectionTitleClass} id={wizard ? "wizard-title" : alone ? "manual-title" : undefined} tabIndex={pageHeading ? -1 : undefined}>{t(section.titleKey)}</Heading>
            <div className="mt-4">
                <StaticBlocks blocks={hoistWarnings(section.blocks)} t={t} distro={distro} alone={alone || wizard} />
            </div>
        </div>
    );
}

/** The FAQ section, or nothing if the content file dropped it. */
export function faqSection(): Section {
    const section = sectionsById.get("faq");
    if (!section) throw new Error("Missing section: faq");
    return section;
}
