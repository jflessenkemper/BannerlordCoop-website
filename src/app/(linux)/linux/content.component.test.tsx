import { expect, it } from "vitest";
import { assertDictionaryParity } from "@/app/lib/localization/integrity";
import type { Dictionary } from "@/app/lib/localization/types";
import de from "@/app/lib/localization/dictionaries/de/linux.json";
import en from "@/app/lib/localization/dictionaries/en/linux.json";
import es from "@/app/lib/localization/dictionaries/es/linux.json";
import fr from "@/app/lib/localization/dictionaries/fr/linux.json";
import ja from "@/app/lib/localization/dictionaries/ja/linux.json";
import ko from "@/app/lib/localization/dictionaries/ko/linux.json";
import ptBR from "@/app/lib/localization/dictionaries/pt-BR/linux.json";
import ptPT from "@/app/lib/localization/dictionaries/pt-PT/linux.json";
import ru from "@/app/lib/localization/dictionaries/ru/linux.json";
import tr from "@/app/lib/localization/dictionaries/tr/linux.json";
import zhCN from "@/app/lib/localization/dictionaries/zh-CN/linux.json";
import expected from "./content/expected-copies.json";
import distros from "./content/distros.json";
import { renderLinuxGuideMarkdown } from "./render-markdown";
import { englishCodeGroups, withoutEnglishNotes } from "./english-code";
import { scriptText } from "./script-text";
import { sections, type Block, type Inline } from "./guide-model";

const packs: Record<string, Dictionary> = {
    de: de as Dictionary,
    es: es as Dictionary,
    fr: fr as Dictionary,
    ja: ja as Dictionary,
    ko: ko as Dictionary,
    "pt-BR": ptBR as Dictionary,
    "pt-PT": ptPT as Dictionary,
    ru: ru as Dictionary,
    tr: tr as Dictionary,
    "zh-CN": zhCN as Dictionary,
};

const english = en as Dictionary;

function collectKeys(value: unknown, keys: Set<string>) {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
        value.forEach((item) => collectKeys(item, keys));
        return;
    }
    for (const [name, child] of Object.entries(value)) {
        if ((name === "k" || name.endsWith("Key")) && typeof child === "string" && child) keys.add(child);
        else collectKeys(child, keys);
    }
}

function collectCodeIds(blocks: Block[], ids: Set<string>) {
    for (const block of blocks) {
        switch (block.type) {
            case "code":
                ids.add(block.id);
                break;
            case "callout":
            case "details":
                collectCodeIds(block.blocks, ids);
                break;
            case "tabs":
                block.tabs.forEach((tab) => collectCodeIds(tab.blocks, ids));
                break;
            case "columns":
                block.columns.forEach((column) => collectCodeIds(column.blocks, ids));
                break;
            case "sectionRefs":
                block.ids.forEach((id) => {
                    const section = sections.find((item) => item.id === id);
                    if (!section) throw new Error(`Missing folded section: ${id}`);
                    collectCodeIds(section.blocks, ids);
                });
                break;
            default:
                break;
        }
    }
}

it("keeps linux dictionary keys and tokens aligned in every locale", () => {
    for (const [locale, dictionary] of Object.entries(packs)) {
        assertDictionaryParity(english, dictionary, `${locale}.linux`);
        expect(dictionary["distro.other.name"], locale).not.toBe(english["distro.other.name"]);
    }
});

it("resolves every content key and every copied script id", () => {
    const keys = new Set<string>();
    collectKeys(sections, keys);
    collectKeys(distros, keys);
    for (const key of keys) expect(english[key], key).toEqual(expect.any(String));
    const ids = new Set<string>();
    for (const section of sections) collectCodeIds(section.blocks, ids);
    for (const id of ids) expect(scriptText(id).length, id).toBeGreaterThan(0);
});

it("keeps every copied script byte-identical to the guide source", () => {
    const copies = expected as Record<string, string>;
    for (const [id, text] of Object.entries(copies)) {
        expect(scriptText(id)).toBe(text);
    }
    const markdown = renderLinuxGuideMarkdown();
    for (const [id, text] of Object.entries(copies)) {
        if (!id.startsWith("code-oneshot-") && id !== "ai-prompt-pre") continue;
        expect(markdown.includes(text.trimEnd()), id).toBe(true);
    }
});

it("adds English notes without changing the commands", () => {
    const ids = [
        "code-oneshot-ubuntu",
        "code-oneshot-nix",
        "code-resolve-latest-client-server-preferred-87734510",
        "code-install-a-new-isolated-user-service-43365780",
    ];
    for (const id of ids) {
        const groups = englishCodeGroups(id);
        expect(groups, id).not.toBeNull();
        const shown = groups!.map((group) => group.body).join("\n");
        expect(shown, id).toContain("# Why:");
        expect(withoutEnglishNotes(shown), id).toBe(scriptText(id));
    }
    expect(englishCodeGroups("code-apt-60837352")).toBeNull();
});

function walkInline(nodes: Inline[], visit: (node: Inline) => void) {
    for (const node of nodes) {
        visit(node);
        if (node.t === "strong" || node.t === "em" || node.t === "a") walkInline(node.c, visit);
    }
}

it("does not leave raw markup in linux messages", () => {
    for (const value of Object.values(english)) {
        if (typeof value === "string") expect(value).not.toMatch(/<\/?[a-z]/);
    }
    const seen = new Set<Inline>();
    function visit(node: Inline) {
        if (seen.has(node)) return;
        seen.add(node);
        if (node.t === "code" && node.v) expect(node.v).not.toMatch(/<script/i);
    }
    for (const section of sections) {
        const scan = (blocks: Block[]) => {
            for (const block of blocks) {
                if (block.type === "p" || block.type === "h3") block.c.forEach(visit);
                if (block.type === "code") block.title.forEach(visit);
                if ("blocks" in block && block.blocks) scan(block.blocks);
                if (block.type === "tabs") block.tabs.forEach((tab) => scan(tab.blocks));
                if (block.type === "columns") block.columns.forEach((column) => scan(column.blocks));
                if (block.type === "ul" || block.type === "ol") block.items.forEach((item) => item.forEach((node) => walkInline([node], visit)));
            }
        };
        scan(section.blocks);
    }
});
