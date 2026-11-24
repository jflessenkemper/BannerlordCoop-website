import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import sections from "./content/sections.json";
import manifest from "./content/scripts-manifest.json";
import { scriptText } from "./script-text";

type Json = { type?: string; id?: string; langKey?: string; [key: string]: unknown };

const root = join(process.cwd(), "public/linux/scripts");
const manifestPath = join(process.cwd(), "src/app/(linux)/linux/content/scripts-manifest.json");
const publishedManifestPath = join(root, "scripts-manifest.json");

function bashIds(node: unknown, found: Set<string>) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
        for (const item of node) bashIds(item, found);
        return;
    }
    const block = node as Json;
    if (block.type === "code" && block.langKey === "code.lang.Bash" && typeof block.id === "string") found.add(block.id);
    for (const value of Object.values(block)) bashIds(value, found);
}

function publishedScripts() {
    const found = new Set<string>();
    bashIds(sections, found);
    return [...found].sort().map((id) => {
        const body = scriptText(id);
        return {
            id,
            file: `${id}.sh`,
            body,
            sha256: createHash("sha256").update(body).digest("hex"),
            bytes: Buffer.byteLength(body),
        };
    });
}

it("publishes each runnable script unchanged and keeps the manifest on those hashes", () => {
    const scripts = publishedScripts();
    expect(scripts.length).toBeGreaterThan(10);
    if (process.env.UPDATE_LINUX_SCRIPTS === "1") {
        mkdirSync(root, { recursive: true });
        const prior = new Map(manifest.scripts.map((entry) => [entry.id, entry]));
        const next = scripts.map((script) => {
            const previous = prior.get(script.id);
            const same = previous?.sha256 === script.sha256;
            return {
                id: script.id,
                file: script.file,
                sha256: script.sha256,
                bytes: script.bytes,
                attestationUrl: same ? (previous?.attestationUrl ?? null) : null,
                virusTotalUrl: `https://www.virustotal.com/gui/file/${script.sha256}`,
                detections: same ? (previous?.detections ?? null) : null,
                analysed: same ? (previous?.analysed ?? null) : null,
            };
        });
        const hashesChanged = next.some((entry) => entry.attestationUrl === null && prior.has(entry.id));
        const document = {
            repository: manifest.repository,
            upstreamRepository: manifest.upstreamRepository,
            attestationUrl: hashesChanged ? null : manifest.attestationUrl,
            scripts: next,
        };
        const json = JSON.stringify(document, null, 2) + "\n";
        writeFileSync(manifestPath, json);
        writeFileSync(publishedManifestPath, json);
        for (const script of scripts) writeFileSync(join(root, script.file), script.body);
        const sums = scripts.map((script) => `${script.sha256}  ${script.file}`).join("\n") + "\n";
        writeFileSync(join(root, "SHA256SUMS"), sums);
        for (const name of readdirSync(root)) {
            if (name.endsWith(".sh") && !scripts.some((script) => script.file === name)) unlinkSync(join(root, name));
        }
    }

    const recorded = JSON.parse(readFileSync(manifestPath, "utf8")) as typeof manifest;
    const published = JSON.parse(readFileSync(publishedManifestPath, "utf8")) as typeof manifest;
    expect(published).toEqual(recorded);
    expect(recorded.scripts.map((entry) => entry.id)).toEqual(scripts.map((script) => script.id));
    const sums = readFileSync(join(root, "SHA256SUMS"), "utf8");
    for (const script of scripts) {
        const file = readFileSync(join(root, script.file));
        expect(file.toString(), script.id).toBe(script.body);
        const entry = recorded.scripts.find((item) => item.id === script.id);
        expect(entry, script.id).toBeTruthy();
        expect(entry?.sha256, script.id).toBe(script.sha256);
        expect(entry?.bytes, script.id).toBe(script.bytes);
        expect(entry?.virusTotalUrl, script.id).toBe(`https://www.virustotal.com/gui/file/${script.sha256}`);
        if (entry?.detections != null) {
            expect(entry.detections, script.id).toBe("0/74");
            expect(entry.analysed, script.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
        } else {
            expect(entry?.analysed ?? null, script.id).toBeNull();
        }
        expect(sums).toContain(`${script.sha256}  ${script.file}`);
    }
});
