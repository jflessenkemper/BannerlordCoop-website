import english from "@/app/lib/localization/dictionaries/en/linux.json";
import { sections, type Block, type Inline, type Section } from "./guide-model";
import { scriptText } from "./script-text";

const messages = english as Record<string, string>;

/** English text for a dictionary key. Missing keys fail here the same way the page does. */
function text(key: string): string {
    const value = messages[key];
    if (value == null) throw new Error(`Missing translation: en.${key}`);
    return value;
}

/** Flattens inline nodes, including glossary labels, into markdown text. */
function inline(nodes: Inline[]): string {
    return nodes.map((node) => {
        switch (node.t) {
            case "text":
                return text(node.k);
            case "br":
                return "\n";
            case "code":
                return `\`${node.k ? text(node.k) : node.v ?? ""}\``;
            case "strong":
                return `**${inline(node.c)}**`;
            case "em":
                return `*${inline(node.c)}*`;
            case "a":
                return `[${inline(node.c)}](${node.href})`;
            case "term":
                return text(node.labelKey ?? node.termKey);
            default: {
                const unreachable: never = node;
                throw new Error(`Unknown inline: ${JSON.stringify(unreachable)}`);
            }
        }
    }).join("");
}

/** Renders one content block, embedding scripts byte for byte. */
function block(value: Block, alone: boolean): string[] {
    switch (value.type) {
        case "p":
            return [inline(value.c), ""];
        case "h3":
            return [`### ${inline(value.c)}`, ""];
        case "ul":
            return [...value.items.map((item) => `- ${inline(item)}`), ""];
        case "ol":
            return [...value.items.map((item, index) => `${index + 1}. ${inline(item)}`), ""];
        case "callout":
            return [`**${text(value.titleKey)}**`, "", ...value.blocks.flatMap((child) => block(child, alone))];
        case "tabs":
            return value.tabs.flatMap((tab) => [`#### ${text(tab.labelKey)}`, "", ...tab.blocks.flatMap((child) => block(child, alone))]);
        case "code":
            return [`**${inline(value.title)}**`, "", "```", scriptText(value.id).replace(/\n$/, ""), "```", ""];
        case "details":
            return [`### ${inline(value.summary)}`, "", ...value.blocks.flatMap((child) => block(child, alone))];
        case "sectionRefs":
            if (value.when === "alone" && !alone) return [];
            return value.ids.flatMap((id) => {
                const section = sections.find((item) => item.id === id);
                if (!section) throw new Error(`Missing folded section: ${id}`);
                return sectionBlocks(section, false);
            });
        case "table":
            return ["", ...value.rows.map((row) => row.cells.map((cell) => inline(cell)).join(" | ")), ""];
        case "dl":
            return value.items.flatMap((item) => [`- ${inline(item.dt)}: ${inline(item.dd)}`, ""]);
        case "field":
            return [inline(value.label), ""];
        case "columns":
            return value.columns.flatMap((column) => column.blocks.flatMap((child) => block(child, alone)));
        default: {
            const unreachable: never = value;
            throw new Error(`Unknown block: ${JSON.stringify(unreachable)}`);
        }
    }
}

/** Renders one section's heading and body. */
function sectionBlocks(section: Section, alone: boolean): string[] {
    const lines = [`## ${text(section.titleKey)}`, "", ...section.blocks.flatMap((child) => block(child, alone))];
    return lines;
}

/** Builds the downloadable English reference from the same sections and scripts as the page. */
export function renderLinuxGuideMarkdown(): string {
    const lines = [`# ${text("metadata.title")}`, "", text("metadata.description"), ""];
    for (const section of sections) lines.push(...sectionBlocks(section, true));
    return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}
