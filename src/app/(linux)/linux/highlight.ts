/** Static token colours for the guide's dark code blocks. The spans carry no extra characters. */
export type Token = { kind: string; text: string };

const BASH_KEYWORDS = new Set("if then else elif fi for do done in while until case esac function select return exit break continue declare local export readonly unset shift eval exec source trap wait read getopts time coproc".split(" "));

/** Joins tokens back into the original source. Highlighting must not change a single character. */
export function tokensToText(tokens: Token[]): string {
    return tokens.map((token) => token.text).join("");
}

/** Paints a script with static spans. Unknown languages still wrap the text so every block is tokenised. */
export function highlight(source: string, language: string): Token[] {
    const name = language.toLowerCase();
    if (name.includes("json")) return scanJson(source);
    if (name.includes("yaml") || name.includes("yml")) return scanYaml(source);
    if (name.includes("nix")) return scanCode(source, { hash: true, keywords: new Set("let in inherit with import rec if then else assert or".split(" ")) });
    if (name.includes("docker")) return scanCode(source, { hash: true, keywords: new Set("from run cmd copy add env arg expose workdir user volume entrypoint healthcheck shell stop signal onbuild maintainer".split(" ")), wordsUpper: true });
    if (name.includes("ini") || name.includes("toml") || name.includes("conf")) return scanIni(source);
    if (name.includes("text") || name.trim() === "") return source ? [{ kind: "text", text: source }] : [];
    return scanCode(source, { hash: true, keywords: BASH_KEYWORDS });
}

function scanJson(source: string): Token[] {
    const out: Token[] = [];
    let i = 0;
    while (i < source.length) {
        const ch = source[i];
        if (ch === '"') {
            const end = endOfString(source, i, '"');
            const text = source.slice(i, end);
            const next = source.slice(end).match(/^\s*:/);
            out.push({ kind: next ? "key" : "string", text });
            i = end;
            continue;
        }
        if ("{}[],:".includes(ch)) {
            out.push({ kind: "punct", text: ch });
            i += 1;
            continue;
        }
        if (/[0-9-]/.test(ch) && (ch !== "-" || /[0-9]/.test(source[i + 1] ?? ""))) {
            const match = source.slice(i).match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
            if (match) {
                out.push({ kind: "number", text: match[0] });
                i += match[0].length;
                continue;
            }
        }
        const word = source.slice(i).match(/^(?:true|false|null)/);
        if (word && (i === 0 || !/[A-Za-z0-9_]/.test(source[i - 1]))) {
            out.push({ kind: "keyword", text: word[0] });
            i += word[0].length;
            continue;
        }
        out.push({ kind: "text", text: ch });
        i += 1;
    }
    return out;
}

function scanYaml(source: string): Token[] {
    const out: Token[] = [];
    const lines = source.split(/(\n)/);
    for (const line of lines) {
        if (line === "\n") {
            out.push({ kind: "text", text: line });
            continue;
        }
        const comment = line.match(/^(\s*)(#.*)$/);
        if (comment) {
            if (comment[1]) out.push({ kind: "text", text: comment[1] });
            out.push({ kind: "comment", text: comment[2] });
            continue;
        }
        const key = line.match(/^(\s*-?\s*)([^:#\n]+?)(\s*)(:)(.*)$/);
        if (key) {
            out.push({ kind: "text", text: key[1] });
            out.push({ kind: "key", text: key[2] });
            if (key[3]) out.push({ kind: "text", text: key[3] });
            out.push({ kind: "punct", text: key[4] });
            out.push(...scanCode(key[5], { hash: true, keywords: new Set(["true", "false", "null", "yes", "no"]) }));
            continue;
        }
        out.push(...scanCode(line, { hash: true, keywords: new Set(["true", "false", "null", "yes", "no"]) }));
    }
    return out;
}

function scanIni(source: string): Token[] {
    const out: Token[] = [];
    const lines = source.split(/(\n)/);
    for (const line of lines) {
        if (line === "\n") {
            out.push({ kind: "text", text: line });
            continue;
        }
        const comment = line.match(/^(\s*)([#;].*)$/);
        if (comment) {
            if (comment[1]) out.push({ kind: "text", text: comment[1] });
            out.push({ kind: "comment", text: comment[2] });
            continue;
        }
        const section = line.match(/^(\s*)(\[[^\]]*\])(.*)$/);
        if (section) {
            if (section[1]) out.push({ kind: "text", text: section[1] });
            out.push({ kind: "keyword", text: section[2] });
            if (section[3]) out.push({ kind: "text", text: section[3] });
            continue;
        }
        const key = line.match(/^(\s*)([^=\n]+?)(\s*)(=)(.*)$/);
        if (key) {
            out.push({ kind: "text", text: key[1] });
            out.push({ kind: "key", text: key[2] });
            if (key[3]) out.push({ kind: "text", text: key[3] });
            out.push({ kind: "punct", text: key[4] });
            out.push(...scanCode(key[5], { hash: false, keywords: new Set() }));
            continue;
        }
        out.push({ kind: "text", text: line });
    }
    return out;
}

function scanCode(source: string, options: { hash: boolean; keywords: Set<string>; wordsUpper?: boolean }): Token[] {
    const out: Token[] = [];
    let i = 0;
    while (i < source.length) {
        const ch = source[i];
        if (options.hash && ch === "#" && (i === 0 || /[\s;&|()]/.test(source[i - 1]))) {
            let j = i + 1;
            while (j < source.length && source[j] !== "\n") j += 1;
            out.push({ kind: "comment", text: source.slice(i, j) });
            i = j;
            continue;
        }
        if (ch === "'" || ch === '"') {
            const end = endOfString(source, i, ch);
            out.push({ kind: "string", text: source.slice(i, end) });
            i = end;
            continue;
        }
        if (ch === "$") {
            const match = source.slice(i).match(/^\$(\{[^{}\n]*\}|[A-Za-z_][A-Za-z0-9_]*|[#@*?!$\-0-9])/);
            if (match) {
                out.push({ kind: "var", text: match[0] });
                i += match[0].length;
                continue;
            }
        }
        if (ch === "-" && source[i + 1] === "-" && /[A-Za-z]/.test(source[i + 2] ?? "")) {
            const match = source.slice(i).match(/^--[A-Za-z0-9][A-Za-z0-9-]*/);
            if (match) {
                out.push({ kind: "flag", text: match[0] });
                i += match[0].length;
                continue;
            }
        }
        if (/[0-9]/.test(ch) && (i === 0 || !/[A-Za-z_]/.test(source[i - 1]))) {
            const match = source.slice(i).match(/^\d[\d._]*/);
            if (match) {
                out.push({ kind: "number", text: match[0] });
                i += match[0].length;
                continue;
            }
        }
        if (/[A-Za-z_]/.test(ch)) {
            let j = i + 1;
            while (j < source.length && /[A-Za-z0-9_-]/.test(source[j])) j += 1;
            const word = source.slice(i, j);
            const lookup = options.wordsUpper ? word.toLowerCase() : word;
            out.push({ kind: options.keywords.has(lookup) ? "keyword" : "text", text: word });
            i = j;
            continue;
        }
        out.push({ kind: "text", text: ch });
        i += 1;
    }
    return out;
}

function endOfString(source: string, start: number, quote: string): number {
    let i = start + 1;
    while (i < source.length) {
        if (source[i] === "\\") {
            i += 2;
            continue;
        }
        if (source[i] === quote) return i + 1;
        if (source[i] === "\n" && quote === "'") return i;
        i += 1;
    }
    return source.length;
}
