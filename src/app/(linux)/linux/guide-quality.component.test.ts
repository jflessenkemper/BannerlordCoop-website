import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { highlight, tokensToText } from "./highlight";
import { scriptText } from "./script-text";
import snippets from "./content/snippets.json";

const languages = ["Bash", "JSON", "YAML", "Nix", "Dockerfile", "Text", "INI"];

describe("code highlighting", () => {
    it("keeps every script byte-identical", () => {
        for (const id of Object.keys(snippets as Record<string, string>)) {
            const source = scriptText(id);
            for (const language of languages) {
                expect(tokensToText(highlight(source, language)), `${id} ${language}`).toBe(source);
            }
        }
    });

    it("wraps a bash script in token spans", () => {
        const tokens = highlight("echo \"hi\" # note\n", "Bash");
        expect(tokens.some((token) => token.kind === "string")).toBe(true);
        expect(tokens.some((token) => token.kind === "comment")).toBe(true);
        expect(tokensToText(tokens)).toBe("echo \"hi\" # note\n");
    });
});

describe("guide presentation", () => {
    const css = readFileSync(new URL("./linux-guide.css", import.meta.url), "utf8");
    const document = readFileSync(new URL("./static-document.ts", import.meta.url), "utf8");

    it("pins the step bar and keeps the tint on the viewport", () => {
        expect(css).toContain("position: fixed;");
        expect(css).toMatch(/\.linux-wizard-bar \{[\s\S]*position: fixed;[\s\S]*bottom: 0;/);
        expect(css).toMatch(/\.linux-guide::before \{[\s\S]*position: fixed;/);
        expect(css).not.toMatch(/0 0 28px rgba\(170, 151, 96, 0\.72\)/);
        expect(css).toContain("rgba(170, 151, 96, 0.36)");
    });

    it("blocks on the preloaded webfonts", () => {
        expect(document).toContain('font-display:block');
        expect(document).toContain('rel="preload" as="font"');
        expect(document).toContain('crossorigin="anonymous"');
        expect(document).toContain('const fontScript = "";');
    });
});
