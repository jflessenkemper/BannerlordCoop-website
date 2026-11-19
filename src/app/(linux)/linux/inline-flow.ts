import type { Inline } from "./guide-model";

/** Visible prose of one inline node. Glossary definitions are not part of the sentence. */
export function inlineVisible(node: Inline, text: (key: string) => string): string {
    switch (node.t) {
        case "text":
            return text(node.k);
        case "br":
            return "\n";
        case "code":
            return node.k ? text(node.k) : node.v ?? "";
        case "strong":
        case "em":
        case "a":
            return node.c.map((child) => inlineVisible(child, text)).join("");
        case "term":
            return text(node.labelKey ?? node.termKey);
        default: {
            const unreachable: never = node;
            return unreachable;
        }
    }
}

/** A letter or digit running into the next inline piece, as in "UDP" + "4200". Punctuation and slashes stay attached. */
export function needsBoundarySpace(previous: string, next: string): boolean {
    if (/^\s*[^\sA-Za-z0-9]/.test(next)) return false;
    return /[A-Za-z0-9]$/.test(previous) && /^[A-Za-z0-9]/.test(next);
}

/** A slash or similar mark sitting between two terms, which must not wrap away from them. */
export function isPunctuationJoin(value: string): boolean {
    return value.length > 0 && value.length <= 4 && /^\s*[^\sA-Za-z0-9]+\s*$/.test(value);
}
