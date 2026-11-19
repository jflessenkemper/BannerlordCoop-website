import type { ReactNode } from "react";
import type { Translator } from "@/app/lib/localization/types";
import { FAQ_SECTION, sectionsById, type Block, type Distro, type GuideTab, type Inline, type Section } from "./guide-model";
import { COPY_RESET_MS, cx, glassCard, goldButton, PARAGRAPH_ROLE_CLASS, primaryButton, sectionTitleClass } from "./guide-styles";
import { codeMatchesDistro, englishCodeGroups, HAND_SECTIONS, HAND_SUMMARY, OPTIONAL_CODES, OPTIONAL_TIME, SKIP_IF_SCRIPT } from "./english-code";
import { highlight } from "./highlight";
import { inlineVisible, isPunctuationJoin, needsBoundarySpace } from "./inline-flow";
import { scriptText } from "./script-text";

type Translate = Translator["t"];

/** Renders the FAQ answers without a client component. */
export function StaticSection({ section, t, annotate = false }: { section: Section; t: Translate; annotate?: boolean }) {
    return (
        <div className="border-b border-white/10 py-6" id={`sec-${section.id}`}>
            <h1 className={sectionTitleClass} id="manual-title" tabIndex={-1}>{t(section.titleKey)}</h1>
            <div className={annotate ? "linux-flow mt-4" : "mt-4"}>
                <StaticBlocks blocks={hoistWarnings(section.blocks)} t={t} annotate={annotate} />
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

/** Ordered instructions. English pages use the same numbered glass card for every list. */
function StepCards({ items, t }: { items: Inline[][]; t: Translate }) {
    return (
        <ol className="step-cards my-0 grid gap-2 p-0">
            {items.map((item, itemIndex) => (
                <li key={itemIndex} className={`${glassCard} relative min-h-12 py-3 pl-14 pr-3`}>
                    <StaticInline nodes={item} t={t} />
                </li>
            ))}
        </ol>
    );
}

/** Renders guide blocks without a client component. */
function StaticBlocks({ blocks, t, distro = null, alone = false, annotate = false, flat = false }: { blocks: Block[]; t: Translate; distro?: Distro | null; alone?: boolean; annotate?: boolean; flat?: boolean }) {
    return (
        <>
            {blocks.map((block, index) => {
                switch (block.type) {
                    case "p":
                        return <p key={index} className={cx("leading-relaxed", block.role && PARAGRAPH_ROLE_CLASS[block.role])}><StaticInline nodes={block.c} t={t} /></p>;
                    case "h3": {
                        const Heading = alone ? "h2" : "h3";
                        return <Heading key={index} className="font-label text-sm font-semibold uppercase tracking-[0.22em] text-gold"><StaticInline nodes={block.c} t={t} /></Heading>;
                    }
                    case "ul":
                    case "ol":
                        if (flat) return <div key={index} className="grid gap-2">{block.items.map((item, itemIndex) => <p key={itemIndex} className="m-0 leading-relaxed"><StaticInline nodes={item} t={t} /></p>)}</div>;
                        if (annotate || block.className === "step-cards") return <StepCards key={index} items={block.items} t={t} />;
                        return block.type === "ul"
                            ? <ul key={index} className="list-disc space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}><StaticInline nodes={item} t={t} /></li>)}</ul>
                            : <ol key={index} className="list-decimal space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}><StaticInline nodes={item} t={t} /></li>)}</ol>;
                    case "callout": {
                        if (annotate) {
                            return (
                                <div key={index} id={block.id} className="linux-note">
                                    <p className="linux-note-label">{t(block.titleKey)}</p>
                                    <StaticBlocks blocks={block.blocks} t={t} distro={distro} alone={alone} annotate={annotate} flat />
                                </div>
                            );
                        }
                        return (
                            <div key={index} id={block.id} className="my-4 border border-white/20 bg-surface px-4 py-3 text-foreground">
                                <p className={cx("mb-1 font-label text-sm font-semibold uppercase tracking-[0.08em]", calloutTone(block.kind))}>{t(block.titleKey)}</p>
                                <StaticBlocks blocks={block.blocks} t={t} distro={distro} alone={alone} annotate={annotate} />
                            </div>
                        );
                    }
                    case "tabs":
                        return <StaticTabs key={index} block={block} t={t} distro={distro} alone={alone} annotate={annotate} />;
                    case "details":
                        return (
                            <details key={index} id={block.id} className={cx(glassCard, "my-2 px-4")}>
                                <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold">
                                    <StaticInline nodes={block.summary} t={t} />
                                    {annotate && block.id === "faq-ai-assistant" ? <span className="font-normal text-foreground-muted">· {OPTIONAL_TIME}</span> : null}
                                </summary>
                                <div className="pb-3"><StaticBlocks blocks={block.blocks} t={t} distro={distro} alone={alone} annotate={annotate} /></div>
                            </details>
                        );
                    case "sectionRefs":
                        if (block.when === "alone" && !alone) return null;
                        return (
                            <details key={index} className={`${glassCard} my-2 px-4`}>
                                <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold">{annotate ? HAND_SUMMARY : <StaticInline nodes={block.summary} t={t} />}</summary>
                                {block.ids.map((id) => {
                                    const section = sectionsById.get(id);
                                    if (!section) throw new Error(`Missing folded section: ${id}`);
                                    return (
                                        <section key={id} className="mt-4 border-t border-white/10 pt-3">
                                            <h3 className="font-label text-sm font-semibold uppercase tracking-[0.08em] text-gold">{t(section.titleKey)}</h3>
                                            {annotate && HAND_SECTIONS.has(id) ? <p className="mb-3 text-foreground-muted">{SKIP_IF_SCRIPT}</p> : null}
                                            <StaticBlocks blocks={hoistWarnings(section.blocks)} t={t} distro={distro} alone={alone} annotate={annotate} />
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
                        if (annotate) {
                            return (
                                <div key={index} className="linux-columns">
                                    {block.columns.map((column, columnIndex) => (
                                        <div key={columnIndex} className="linux-note"><StaticBlocks blocks={column.blocks} t={t} distro={distro} alone={alone} annotate={annotate} flat /></div>
                                    ))}
                                </div>
                            );
                        }
                        return (
                            <div key={index} className="grid gap-3 sm:grid-cols-2">
                                {block.columns.map((column, columnIndex) => (
                                    <div key={columnIndex} className={`${glassCard} rounded-sm px-4 py-3`}><StaticBlocks blocks={column.blocks} t={t} distro={distro} alone={alone} annotate={annotate} /></div>
                                ))}
                            </div>
                        );
                    case "code":
                        if (annotate && distro && !codeMatchesDistro(block.id, distro.id)) return null;
                        if (annotate && OPTIONAL_CODES.has(block.id)) {
                            return (
                                <details key={index} className={cx(glassCard, "my-2 px-4")}>
                                    <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold">
                                        <span><StaticInline nodes={block.title} t={t} /></span>
                                        <span className="font-normal text-foreground-muted">· {OPTIONAL_TIME}</span>
                                    </summary>
                                    <div className="pb-3"><StaticCode block={block} t={t} annotate={annotate} /></div>
                                </details>
                            );
                        }
                        return <StaticCode key={index} block={block} t={t} annotate={annotate} />;
                    default: {
                        const unreachable: never = block;
                        throw new Error(`Unknown block: ${(unreachable as { type?: string }).type ?? "missing"}`);
                    }
                }
            })}
        </>
    );
}

/** Inline FAQ prose. Spaces between pieces are kept, and a slash stays with its terms. */
function StaticInline({ nodes, t }: { nodes: Inline[]; t: Translate }): ReactNode {
    return <>{renderInlineNodes(nodes, t)}</>;
}

function renderInlineNodes(nodes: Inline[], t: Translate): ReactNode[] {
    const out: ReactNode[] = [];
    let previous = "";
    let index = 0;
    while (index < nodes.length) {
        const join = nodes[index + 1]?.t === "text" && nodes[index + 2]?.t === "term"
            && isPunctuationJoin(inlineVisible(nodes[index + 1], t));
        const group = nodes[index].t === "term" && join ? nodes.slice(index, index + 3) : [nodes[index]];
        const visible = group.map((node) => inlineVisible(node, t)).join("");
        if (needsBoundarySpace(previous, visible)) out.push(" ");
        const body = group.map((node, offset) => renderInlineNode(node, t, `${index}-${offset}`));
        out.push(group.length > 1 ? <span key={`keep-${index}`} className="linux-keep">{body}</span> : body[0]);
        previous += `${needsBoundarySpace(previous, visible) ? " " : ""}${visible}`;
        index += group.length;
    }
    return out;
}

function renderInlineNode(node: Inline, t: Translate, key: string): ReactNode {
    switch (node.t) {
        case "text":
            return node.k ? t(node.k) : null;
        case "br":
            return <br key={key} />;
        case "code":
            return <code key={key} className="rounded bg-[#0d0e0b] font-mono text-[0.92em] text-foreground">{node.k ? t(node.k) : node.v}</code>;
        case "strong":
            return <strong key={key}>{renderInlineNodes(node.c, t)}</strong>;
        case "em":
            return <em key={key}>{renderInlineNodes(node.c, t)}</em>;
        case "a": {
            const external = node.href.startsWith("http");
            return <a key={key} href={node.href} className="text-gold underline decoration-1 underline-offset-4" target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>{renderInlineNodes(node.c, t)}</a>;
        }
        case "term": {
            const id = `${node.termKey}:${node.defKey}`.replace(/[^a-zA-Z0-9_-]/g, "-");
            const popoverId = `linux-term-${termSerial += 1}-${id}`;
            return (
                <span key={key}>
                    <button
                        type="button"
                        id={`linux-term-btn-${id}`}
                        className="linux-term-btn cursor-help border-0 bg-transparent p-0 font-inherit text-inherit underline decoration-dotted decoration-gold underline-offset-[3px]"
                        aria-controls={popoverId}
                        aria-expanded="false"
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
                        className="linux-term fixed z-40 max-w-[min(22rem,calc(100vw-1rem))] rounded-lg border border-gold/45 bg-[#11120e] p-3 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_10px_28px_rgba(0,0,0,0.4)]"
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
}

/** A script listing with a copy button the page script wires up. */
function StaticCode({ block, t, annotate = false }: { block: Extract<Block, { type: "code" }>; t: Translate; annotate?: boolean }) {
    const source = scriptText(block.id);
    const groups = annotate ? englishCodeGroups(block.id) : null;
    const shown = groups ?? [{ title: "", body: source }];
    const copyClass = block.oneshot ? primaryButton : goldButton;
    return shown.map((group, groupIndex) => (
        <CodeFigure key={`${block.id}-${groupIndex}`} id={groupIndex === 0 ? block.id : `${block.id}-part-${groupIndex + 1}`} title={group.title ? [{ t: "text" as const, k: "" }] : block.title} plainTitle={group.title} source={group.body} t={t} copyClass={copyClass} oneshot={block.oneshot} download={groupIndex === 0 ? block.download : undefined} langKey={block.langKey} />
    ));
}

function CodeFigure({ id, title, plainTitle, source, t, copyClass, oneshot, download, langKey }: { id: string; title: Inline[]; plainTitle: string; source: string; t: Translate; copyClass: string; oneshot?: boolean; download?: Extract<Block, { type: "code" }>["download"]; langKey: string }) {
    return (
        <figure className={cx(glassCard, "my-4 overflow-hidden", oneshot && "border-gold/45")}>
            <figcaption className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span>{plainTitle || <StaticInline nodes={title} t={t} />}</span>
                    <span className="code-lang font-label text-xs font-semibold uppercase tracking-[0.08em] text-foreground-muted">{t(langKey)}</span>
                </span>
                <span className="ml-auto flex flex-wrap gap-2">
                    <button type="button" className={copyClass} data-copy={id} data-label={t("ui.copy")} data-copied={t("ui.copied")} data-failed={t("ui.copyFailed")} data-reset-ok={COPY_RESET_MS.copied} data-reset-fail={COPY_RESET_MS.failed}>{t("ui.copy")}</button>
                    {download && (
                        <a className={goldButton} href={download.href} download={download.filename} title={t(download.titleKey)}>{t(download.labelKey)}</a>
                    )}
                </span>
            </figcaption>
            <pre id={id} tabIndex={0} data-raw={source} className={cx("linux-code m-0 overflow-x-hidden bg-surface p-4 font-mono text-[0.92rem] leading-normal text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold", oneshot && "max-h-[min(24rem,60dvh)] overflow-y-auto overscroll-auto")}>
                <code>{highlight(source, t(langKey)).map((token, index) => <span key={index} className={`tok-${token.kind}`}>{token.text}</span>)}</code>
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

let tabGroupSerial = 0;
let termSerial = 0;

/** Starts tab and glossary ids at zero for one page render. */
export function resetGuideIds() {
    tabGroupSerial = 0;
    termSerial = 0;
}

/** Distro-scoped tabs show only the matching panel. Other sets use radio buttons, so no script is required. */
function StaticTabs({ block, t, distro, alone, annotate = false }: { block: Extract<Block, { type: "tabs" }>; t: Translate; distro: Distro | null; alone: boolean; annotate?: boolean; id?: string }) {
    const id = `tabg-${tabGroupSerial += 1}`;
    const selective = block.tabs.some((tab) => tab.script || tab.families);
    if (selective) {
        return (
            <div>
                {block.tabs.map((tab) => {
                    const token = [tab.script ? `script-${tab.script}` : "", ...(tab.families ?? []).map((family) => `family-${family}`)].filter(Boolean).join(" ");
                    return (
                        <div key={tab.labelKey} className="distro-panel" data-for={token || "all"} role="group" aria-label={t(tab.labelKey)}>
                            <StaticBlocks blocks={tab.blocks} t={t} distro={distro} alone={alone} annotate={annotate} />
                        </div>
                    );
                })}
            </div>
        );
    }
    const visible = block.tabs.filter((tab) => tabMatches(tab, distro, false));
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
                        <StaticBlocks blocks={tab.blocks} t={t} distro={distro} alone={alone} annotate={annotate} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/** One guide section. The wizard and a focused manual page use the page heading. Checklist stages are numbered disclosures. */
export function StaticGuideSection({ section, t, distro = null, wizard = false, alone = false, annotate = false, stageIndex = null }: { section: Section; t: Translate; distro?: Distro | null; wizard?: boolean; alone?: boolean; annotate?: boolean; stageIndex?: number | null }) {
    const pageHeading = wizard || alone;
    const Heading = pageHeading ? "h1" : "h2";
    const body = (
        <>
            {annotate && HAND_SECTIONS.has(section.id) ? <p className="mb-3 text-foreground-muted">{SKIP_IF_SCRIPT}</p> : null}
            {annotate && section.id === "service" ? (
                <details className={cx(glassCard, "my-2 px-4")}>
                    <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold"><span>{t(section.titleKey)}</span><span className="font-normal text-foreground-muted">· {OPTIONAL_TIME}</span></summary>
                    <div className="pb-3"><StaticBlocks blocks={hoistWarnings(section.blocks)} t={t} distro={distro} alone={alone || wizard} annotate={annotate} /></div>
                </details>
            ) : (
                <StaticBlocks blocks={hoistWarnings(section.blocks)} t={t} distro={distro} alone={alone || wizard} annotate={annotate} />
            )}
        </>
    );
    if (stageIndex != null) {
        return (
            <details id={`sec-${section.id}`} className="linux-stage border-b border-white/10" open={stageIndex === 0}>
                <summary>
                    <span className="linux-stage-num">{stageIndex + 1}</span>
                    <Heading className={sectionTitleClass}>{t(section.titleKey)}</Heading>
                </summary>
                <div className={annotate ? "linux-flow linux-stage-body mt-2" : "linux-stage-body mt-2"}>{body}</div>
            </details>
        );
    }
    return (
        <div className={wizard ? undefined : "border-b border-white/10 py-6"} id={wizard ? undefined : `sec-${section.id}`}>
            <Heading className={sectionTitleClass} id={wizard ? "wizard-title" : alone ? "manual-title" : undefined} tabIndex={pageHeading ? -1 : undefined}>{t(section.titleKey)}</Heading>
            <div className={annotate ? "linux-flow mt-4" : "mt-4"}>{body}</div>
        </div>
    );
}

/** The FAQ section, or nothing if the content file dropped it. */
export function faqSection(): Section {
    const section = sectionsById.get(FAQ_SECTION);
    if (!section) throw new Error(`Missing section: ${FAQ_SECTION}`);
    return section;
}
