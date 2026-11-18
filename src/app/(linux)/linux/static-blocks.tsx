import type { ReactNode } from "react";
import type { Translator } from "@/app/lib/localization/types";
import { sectionsById, type Block, type Inline, type Section } from "./guide-model";
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

/** Renders the block types the FAQ page actually uses. */
function StaticBlocks({ blocks, t }: { blocks: Block[]; t: Translate }) {
    return (
        <>
            {blocks.map((block, index) => {
                switch (block.type) {
                    case "p":
                        return <p key={index} className="leading-relaxed"><StaticInline nodes={block.c} t={t} /></p>;
                    case "ul":
                        return <ul key={index} className="list-disc space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}><StaticInline nodes={item} t={t} /></li>)}</ul>;
                    case "ol":
                        return <ol key={index} className="list-decimal space-y-1 pl-5">{block.items.map((item, itemIndex) => <li key={itemIndex}><StaticInline nodes={item} t={t} /></li>)}</ol>;
                    case "details":
                        return (
                            <details key={index} id={block.id} className={cx(glassCard, "my-2 px-4")}>
                                <summary className="flex min-h-12 cursor-pointer items-center gap-2 py-2 font-semibold"><StaticInline nodes={block.summary} t={t} /></summary>
                                <div className="pb-3"><StaticBlocks blocks={block.blocks} t={t} /></div>
                            </details>
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

/** The FAQ section, or nothing if the content file dropped it. */
export function faqSection(): Section {
    const section = sectionsById.get("faq");
    if (!section) throw new Error("Missing section: faq");
    return section;
}
