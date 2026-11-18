"use client";

import { useContext, useId, useRef, useState } from "react";
import { GuideContext, type GuideContextValue } from "./guide-context";
import { useLinuxText } from "./hooks/useLinuxText";
import { sectionsById, type Block, type Distro, type GuideTab, type Inline, type Section } from "./guide-model";
import { COPY_RESET_MS, cx, glassCard, goldButton, PARAGRAPH_ROLE_CLASS, primaryButton, sectionTitleClass } from "./guide-styles";
import { scriptText } from "./script-text";

const COPY_STATES = {
    "": { labelKey: "ui.copy", className: "" },
    copied: { labelKey: "ui.copied", className: "border-emerald-300/70 bg-emerald-400/15 text-emerald-200" },
    failed: { labelKey: "ui.copyFailed", className: "border-amber-300/60 bg-amber-300/10 text-amber-200" },
} as const;

/** Reads the guide render context. Blocks are only mounted under LinuxGuide. */
function useGuide(): GuideContextValue {
    const value = useContext(GuideContext);
    if (!value) throw new Error("Guide blocks rendered outside the guide");
    return value;
}

/** Moves the tab selection and wraps at either end. */
function nextTabPosition(key: string, position: number, count: number): number | null {
    switch (key) {
        case "ArrowRight":
            return (position + 1) % count;
        case "ArrowLeft":
            return (position - 1 + count) % count;
        case "Home":
            return 0;
        case "End":
            return count - 1;
        default:
            return null;
    }
}

/** Renders inline content. Glossary buttons report their own rectangle. */
function InlineText({ nodes }: { nodes: Inline[] }) {
    const { t } = useLinuxText();
    const { onTerm, openTermKey } = useGuide();
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
                        return <strong key={index}><InlineText nodes={node.c} /></strong>;
                    case "em":
                        return <em key={index}><InlineText nodes={node.c} /></em>;
                    case "a": {
                        const external = node.href.startsWith("http");
                        return (
                            <a key={index} href={node.href} className="text-gold underline decoration-1 underline-offset-4 hover:text-foreground" target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined}>
                                <InlineText nodes={node.c} />
                            </a>
                        );
                    }
                    case "term": {
                        const key = `${node.termKey}:${node.defKey}`;
                        const open = openTermKey === key;
                        return (
                            <button
                                key={index}
                                type="button"
                                id={`linux-term-btn-${key.replace(/[^a-zA-Z0-9_-]/g, "-")}`}
                                className="cursor-help border-0 bg-transparent p-0 font-inherit text-inherit underline decoration-dotted decoration-gold underline-offset-[3px]"
                                aria-expanded={open}
                                aria-controls="linux-term"
                                popoverTarget="linux-term"
                                popoverTargetAction="show"
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onTerm(key, t(node.termKey), t(node.defKey), event.currentTarget);
                                }}
                            >
                                {t(node.labelKey ?? node.termKey)}
                            </button>
                        );
                    }
                    default: {
                        const unreachable: never = node;
                        throw new Error(`Unknown inline: ${JSON.stringify(unreachable)}`);
                    }
                }
            })}
        </>
    );
}

/** Copies one script. An empty body is a failure and is never announced as copied. */
function CodeBlock({ block }: { block: Extract<Block, { type: "code" }> }) {
    const { t } = useLinuxText();
    const { onStatus } = useGuide();
    const preRef = useRef<HTMLPreElement>(null);
    const [state, setState] = useState<keyof typeof COPY_STATES>("");
    const source = scriptText(block.id);
    const appearance = COPY_STATES[state];

    function finish(next: keyof typeof COPY_STATES) {
        setState(next);
        onStatus(t(COPY_STATES[next].labelKey));
        if (next === "") return;
        window.setTimeout(() => setState(""), COPY_RESET_MS[next]);
    }

    async function copySource() {
        if (!source) {
            finish("failed");
            return;
        }
        try {
            await navigator.clipboard.writeText(source);
            finish("copied");
        } catch {
            const node = preRef.current;
            if (node) {
                const range = document.createRange();
                range.selectNodeContents(node);
                const selection = window.getSelection();
                selection?.removeAllRanges();
                selection?.addRange(range);
            }
            finish("failed");
        }
    }

    const pre = (
        <pre ref={preRef} data-code-id={block.id} tabIndex={0} className={cx("linux-code m-0 overflow-x-hidden bg-[#0c0d0b] p-4 font-mono text-[0.92rem] leading-normal text-[#e8e4da] focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gold", block.oneshot && "max-h-[min(24rem,60dvh)] overflow-y-auto overscroll-auto")}>
            <code>{source}</code>
        </pre>
    );
    if (block.bare) return pre;
    const copyClass = block.oneshot ? primaryButton : goldButton;
    return (
        <figure className={cx(glassCard, "my-4 overflow-hidden", block.oneshot && "border-gold/45")}>
            <figcaption className="flex flex-wrap items-center gap-2 border-b border-white/10 bg-white/5 px-3 py-2">
                <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                    <span><InlineText nodes={block.title} /></span>
                    <span className="code-lang font-label text-xs font-semibold uppercase tracking-[0.08em] text-foreground-muted">{t(block.langKey)}</span>
                </span>
                <span className="ml-auto flex flex-wrap gap-2">
                    <button type="button" className={cx(copyClass, appearance.className)} onClick={copySource}>{t(appearance.labelKey)}</button>
                    {block.download && (
                        <a className={goldButton} href={block.download.href} download={block.download.filename} title={t(block.download.titleKey)}>
                            {t(block.download.labelKey)}
                        </a>
                    )}
                </span>
            </figcaption>
            {pre}
        </figure>
    );
}

/** Shows every panel for the chosen distro, or a normal tab set when no distro applies. */
function Tabs({ block }: { block: Extract<Block, { type: "tabs" }> }) {
    const { t } = useLinuxText();
    const { distro } = useGuide();
    const baseId = useId();
    const [active, setActive] = useState(0);
    const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
    const scoped = Boolean(distro) && block.tabs.some((tab) => tab.script || tab.families);
    const visible = block.tabs.filter((tab) => tabMatches(tab, distro, scoped));
    if (scoped) {
        return (
            <div>
                {visible.map((tab) => (
                    <div key={tab.labelKey} role="group" aria-label={t(tab.labelKey)}>
                        <Blocks blocks={tab.blocks} />
                    </div>
                ))}
            </div>
        );
    }
    const selectedPosition = Math.min(active, Math.max(visible.length - 1, 0));
    const selected = visible[selectedPosition];
    return (
        <div>
            <div role="tablist" aria-label={t(block.labelKey)} className="mb-3 flex flex-wrap gap-1 border-b border-white/10">
                {visible.map((tab, position) => {
                    const on = position === selectedPosition;
                    return (
                        <button
                            key={tab.labelKey}
                            type="button"
                            role="tab"
                            id={`${baseId}-tab-${position}`}
                            ref={(node) => { tabRefs.current[position] = node; }}
                            className={cx("min-h-12 cursor-pointer border-0 border-b-2 bg-transparent px-3 font-inherit text-foreground", on ? "border-gold" : "border-transparent")}
                            aria-selected={on}
                            aria-controls={`${baseId}-panel-${position}`}
                            tabIndex={on ? 0 : -1}
                            onClick={() => setActive(position)}
                            onKeyDown={(event) => {
                                const next = nextTabPosition(event.key, position, visible.length);
                                if (next == null) return;
                                event.preventDefault();
                                setActive(next);
                                tabRefs.current[next]?.focus();
                            }}
                        >
                            {t(tab.labelKey)}
                        </button>
                    );
                })}
            </div>
            {selected && (
                <div role="tabpanel" id={`${baseId}-panel-${selectedPosition}`} aria-labelledby={`${baseId}-tab-${selectedPosition}`} tabIndex={0}>
                    <Blocks blocks={selected.blocks} />
                </div>
            )}
        </div>
    );
}

/** A distro-scoped tab is visible when its script or family list matches. */
function tabMatches(tab: GuideTab, distro: Distro | null, scoped: boolean): boolean {
    if (!scoped || !distro) return true;
    if (tab.script) return tab.script === distro.id;
    if (tab.families) return tab.families.includes(distro.family);
    return true;
}

/** Renders the sections named by a sectionRefs block. Missing ids throw. */
function SectionRefs({ block }: { block: Extract<Block, { type: "sectionRefs" }> }) {
    const { t } = useLinuxText();
    const { alone } = useGuide();
    if (block.when === "alone" && !alone) return null;
    return (
        <details className={`${glassCard} my-2 px-4`}>
            <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold"><InlineText nodes={block.summary} /></summary>
            {block.ids.map((id) => {
                const section = sectionsById.get(id);
                if (!section) throw new Error(`Missing folded section: ${id}`);
                return (
                    <section key={id} className="mt-4 border-t border-white/10 pt-3">
                        <h3 className="font-label text-sm font-semibold uppercase tracking-[0.08em] text-gold">{t(section.titleKey)}</h3>
                        <Blocks blocks={hoistWarnings(section.blocks)} />
                    </section>
                );
            })}
        </details>
    );
}

/** Puts warning callouts ahead of the other blocks in a step. */
function hoistWarnings(blocks: Block[]): Block[] {
    const warnings = blocks.filter((block) => block.type === "callout" && block.kind === "warn");
    const rest = blocks.filter((block) => !(block.type === "callout" && block.kind === "warn"));
    return [...warnings, ...rest];
}

/** Renders a heterogeneous list of guide blocks. Unknown types throw. */
function Blocks({ blocks }: { blocks: Block[] }) {
    const { t } = useLinuxText();
    const { openId, alone } = useGuide();
    return (
        <>
            {blocks.map((block, index) => {
                switch (block.type) {
                    case "p":
                        return <p key={index} className={cx("leading-relaxed", block.role && PARAGRAPH_ROLE_CLASS[block.role])}><InlineText nodes={block.c} /></p>;
                    case "h3": {
                        const Heading = alone ? "h2" : "h3";
                        return <Heading key={index} className="font-label text-sm font-semibold uppercase tracking-[0.22em] text-gold"><InlineText nodes={block.c} /></Heading>;
                    }
                    case "ul":
                        return <ul key={index} className="list-disc space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}><InlineText nodes={item} /></li>)}</ul>;
                    case "ol":
                        return (
                            <ol key={index} className={block.className === "step-cards" ? "step-cards my-4 grid gap-2 p-0" : "list-decimal space-y-1 pl-5"}>
                                {block.items.map((item, itemIndex) => (
                                    <li key={itemIndex} className={block.className === "step-cards" ? `${glassCard} relative min-h-12 py-3 pl-14 pr-3` : undefined}>
                                        <InlineText nodes={item} />
                                    </li>
                                ))}
                            </ol>
                        );
                    case "callout":
                        return (
                            <div key={index} id={block.id} className="my-4 border border-white/20 bg-surface px-4 py-3 text-foreground">
                                <p className={cx("mb-1 font-label text-sm font-semibold uppercase tracking-[0.08em]", calloutTone(block.kind))}>{t(block.titleKey)}</p>
                                <Blocks blocks={block.blocks} />
                            </div>
                        );
                    case "tabs":
                        return <Tabs key={index} block={block} />;
                    case "code":
                        return <CodeBlock key={index} block={block} />;
                    case "details":
                        return (
                            <details key={index} id={block.id} open={block.id && block.id === openId ? true : undefined} className={cx(glassCard, "my-2 px-4", block.className === "ai-optional" && "bg-transparent shadow-none")}>
                                <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold"><InlineText nodes={block.summary} /></summary>
                                <div className="pb-3"><Blocks blocks={block.blocks} /></div>
                            </details>
                        );
                    case "sectionRefs":
                        return <SectionRefs key={index} block={block} />;
                    case "table":
                        return <GuideTable key={index} block={block} />;
                    case "dl":
                        return (
                            <dl key={index} className="my-4 grid gap-2">
                                {block.items.map((item, itemIndex) => (
                                    <div key={itemIndex} className="grid gap-1 sm:grid-cols-[minmax(8rem,auto)_1fr] sm:gap-4">
                                        <dt className="font-semibold"><InlineText nodes={item.dt} /></dt>
                                        <dd className="m-0 text-foreground"><InlineText nodes={item.dd} /></dd>
                                    </div>
                                ))}
                            </dl>
                        );
                    case "field":
                        return (
                            <label key={index} className="my-3 grid gap-2">
                                <InlineText nodes={block.label} />
                                <input className="min-h-11 w-full max-w-md rounded border border-white/15 bg-surface px-3 text-foreground" type="text" placeholder={block.placeholder} autoComplete="off" />
                            </label>
                        );
                    case "columns":
                        return (
                            <div key={index} className="grid gap-3 sm:grid-cols-2">
                                {block.columns.map((column, columnIndex) => (
                                    <div key={columnIndex} className={`${glassCard} rounded-sm px-4 py-3`}><Blocks blocks={column.blocks} /></div>
                                ))}
                            </div>
                        );
                    default: {
                        const unreachable: never = block;
                        throw new Error(`Unknown block: ${JSON.stringify(unreachable)}`);
                    }
                }
            })}
        </>
    );
}

/** Title color for a callout. The panel itself stays a flat square border. */
function calloutTone(kind: "warn" | "info" | "ok"): string {
    switch (kind) {
        case "warn":
            return "text-[#ffd236]";
        case "ok":
            return "text-[#5ee9b5]";
        case "info":
            return "text-[#c9b676]";
    }
}

/** Symptom table. Narrow screens repeat the column name on each cell. */
function GuideTable({ block }: { block: Extract<Block, { type: "table" }> }) {
    const { t } = useLinuxText();
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
                            <td key={cellIndex} data-label={headers[cellIndex] || ""} className="border-b border-white/10 px-2 py-2 align-top"><InlineText nodes={cell} /></td>
                        ))}
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

/** One guide section. `alone` reveals the folded steps that the full checklist already lists below. */
export function GuideSection({ section, wizard = false, alone = false }: { section: Section; wizard?: boolean; alone?: boolean }) {
    const { t } = useLinuxText();
    const guide = useGuide();
    const pageHeading = wizard || alone;
    const Heading = pageHeading ? "h1" : "h2";
    return (
        <div className={wizard ? undefined : "border-b border-white/10 py-6"} id={wizard ? undefined : `sec-${section.id}`}>
            <Heading className={sectionTitleClass} id={wizard ? "wizard-title" : alone ? "manual-title" : undefined} tabIndex={pageHeading ? -1 : undefined}>{t(section.titleKey)}</Heading>
            <div className="mt-4">
                <GuideContext.Provider value={{ ...guide, alone }}>
                    <Blocks blocks={hoistWarnings(section.blocks)} />
                </GuideContext.Provider>
            </div>
        </div>
    );
}
