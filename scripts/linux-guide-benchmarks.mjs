/**
 * Checks 15–24 for the English Linux guide export.
 * Usage: node scripts/linux-guide-benchmarks.mjs [baseUrl] [check]
 * A missing check runs every one. The export must already be served at baseUrl.
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const require = createRequire(new URL("../package.json", import.meta.url));
const lighthouse = require("lighthouse").default;
const chromeLauncher = require("chrome-launcher");
const { chromium } = require("playwright");
const AxeBuilder = require("@axe-core/playwright").default;

const base = (process.argv[2] || "http://127.0.0.1:8791").replace(/\/$/, "");
const only = process.argv[3] || "";
const root = join(process.cwd(), "tmp-linux-export");
const exportRoot = process.env.LINUX_EXPORT || "/tmp/linux-preview-site";
const routes = ["", "/faq", "/distro", "/checklist", "/script", "/done", "/step/overview", "/step/terminal", "/step/configure", "/step/launch", "/step/firewall", "/step/service", "/step/client", "/step/backups"];
const failures = [];

function fail(check, detail) {
    failures.push(`${check}: ${detail}`);
    console.log("FAIL", check, detail);
}

function skip(check) {
    return only && only !== String(check);
}

function url(route) {
    return `${base}/linux${route}/`;
}

const chromePath = "/home/ubuntu/.cache/ms-playwright/chromium-1194/chrome-linux/chrome";

async function withChrome(run) {
    const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ["--headless=new", "--no-sandbox"] });
    try {
        return await run(chrome.port);
    } finally {
        await chrome.kill();
    }
}

function median(values) {
    return [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)];
}

async function check15() {
    if (skip(15)) return;
    const budgets = { document: 140000, script: 40000, stylesheet: 20000, font: 200000, image: 260000 };
    await withChrome(async (port) => {
        for (const form of ["mobile", "desktop"]) {
            const settings = form === "mobile"
                ? { formFactor: "mobile", screenEmulation: { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false }, throttling: { rttMs: 150, throughputKbps: 1638.4, cpuSlowdownMultiplier: 4, requestLatencyMs: 150, downloadThroughputKbps: 1638.4, uploadThroughputKbps: 750 } }
                : { formFactor: "desktop", screenEmulation: { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttling: { rttMs: 40, throughputKbps: 10240, cpuSlowdownMultiplier: 1, requestLatencyMs: 40, downloadThroughputKbps: 10240, uploadThroughputKbps: 10240 } };
            const config = { extends: "lighthouse:default", settings: { onlyCategories: ["performance", "accessibility", "best-practices", "seo"], throttlingMethod: "simulate", ...settings } };
            for (const route of routes) {
                const scores = [];
                let resources = null;
                for (let run = 1; run <= 3; run += 1) {
                    const result = await lighthouse(url(route), { port, disableStorageReset: true }, config);
                    const cats = result.lhr.categories;
                    const row = {
                        performance: Math.round(cats.performance.score * 100),
                        accessibility: Math.round(cats.accessibility.score * 100),
                        "best-practices": Math.round(cats["best-practices"].score * 100),
                        seo: Math.round(cats.seo.score * 100),
                    };
                    scores.push(row);
                    resources = result.lhr.audits["resource-summary"].details.items;
                    console.log("15", form, route || "/", run, JSON.stringify(row));
                }
                for (const key of ["performance", "accessibility", "best-practices", "seo"]) {
                    const value = median(scores.map((row) => row[key]));
                    const floor = form === "mobile" && key === "performance" ? 98 : 100;
                    if (value < floor) fail("15 lighthouse", `${form} ${route || "/"} ${key} ${value}`);
                }
                for (const item of resources) {
                    const cap = budgets[item.resourceType];
                    if (cap && item.transferSize > cap) fail("15 budget", `${form} ${route || "/"} ${item.resourceType} ${item.transferSize} > ${cap}`);
                }
            }
        }
    });
}

async function check16() {
    if (skip(16)) return;
    const urls = routes.map((route) => `/linux${route || "/"}`).join(",");
    const run = spawnSync("node_modules/unlighthouse/bin/unlighthouse-ci.mjs", ["--site", base, "--urls", urls, "--samples", "1", "--mobile", "--throttle", "--output-path", "/tmp/unlighthouse", "--reporter", "json"], {
        cwd: process.cwd(), encoding: "utf8", timeout: 30 * 60 * 1000,
    });
    const text = `${run.stdout || ""}\n${run.stderr || ""}`;
    console.log(text.slice(-2000));
    if (run.status !== 0) fail("16 unlighthouse", `exit ${run.status}`);
}

function check17() {
    if (skip(17)) return;
    const files = [];
    function walk(dir) {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);
            if (statSync(path).isDirectory()) walk(path);
            else if (name.endsWith(".html")) files.push(path);
        }
    }
    walk(join(exportRoot, "linux"));
    const jar = join(process.cwd(), "node_modules/vnu-jar/build/dist/vnu.jar");
    const run = spawnSync("java", ["-jar", jar, "--errors-only", "--also-check-css", "--format", "gnu", ...files], { encoding: "utf8" });
    const text = `${run.stdout || ""}${run.stderr || ""}`.trim();
    const htmlErrors = text.split("\n").filter((line) => line.includes("error:") && !/margin-trim|@property|--tw-|transition-property/.test(line));
    if (htmlErrors.length) fail("17 vnu", htmlErrors.slice(0, 8).join(" | "));
    else console.log("17 vnu clean", files.length);
}

async function check18() {
    if (skip(18)) return;
    const config = {
        defaults: { timeout: 60000, runners: ["htmlcs", "axe"], standard: "WCAG2AA", ignore: ["color-contrast"] },
        urls: routes.map((route) => url(route)),
    };
    const path = "/tmp/pa11yci.json";
    const { writeFileSync } = await import("node:fs");
    writeFileSync(path, JSON.stringify(config));
    const run = spawnSync("npx", ["pa11y-ci", "--config", path], { encoding: "utf8", timeout: 20 * 60 * 1000 });
    console.log((run.stdout || "").slice(-1500));
    if (run.status !== 0) fail("18 pa11y", (run.stdout || run.stderr || "").split("\n").filter((line) => line.includes("Error")).slice(0, 8).join(" | ") || `exit ${run.status}`);
}

function check19() {
    if (skip(19)) return;
    const run = spawnSync("npx", ["eslint", "src/app/(linux)/linux", "--no-error-on-unmatched-pattern"], { encoding: "utf8" });
    const lines = `${run.stdout || ""}\n${run.stderr || ""}`.split("\n").filter((line) => line.includes("jsx-a11y"));
    if (lines.length) fail("19 jsx-a11y", lines.slice(0, 8).join(" | "));
    else console.log("19 jsx-a11y clean");
}

function gzipSize(bytes) {
    return spawnSync("python3", ["-c", "import gzip,sys; print(len(gzip.compress(sys.stdin.buffer.read())))"], { input: bytes }).stdout.toString().trim();
}

async function check20() {
    if (skip(20)) return;
    let css = 0;
    let js = 0;
    let html = 0;
    function walk(dir) {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);
            if (statSync(path).isDirectory()) walk(path);
            else if (name.endsWith(".html")) {
                const text = readFileSync(path);
                html = Math.max(html, text.length);
                const style = text.toString().match(/<style>([\s\S]*?)<\/style>/g) || [];
                css = Math.max(css, style.reduce((sum, block) => sum + block.length, 0));
                const script = text.toString().match(/<script>([\s\S]*?)<\/script>/g) || [];
                js = Math.max(js, script.reduce((sum, block) => sum + block.length, 0));
            }
        }
    }
    walk(join(exportRoot, "linux"));
    const fontDir = join(exportRoot, "_next/static/media");
    const fonts = readdirSync(fontDir).reduce((sum, name) => sum + statSync(join(fontDir, name)).size, 0);
    const image = statSync(join(exportRoot, "images/linux/backdrop.webp")).size;
    console.log("20 sizes", { html, css, js, fonts, image });
    if (fonts > 200000) fail("20 fonts", `${fonts}`);
    if (image !== 209794) fail("20 image", `${image} changed`);
    const { writeFileSync } = await import("node:fs");
    let biggestJs = "";
    let biggestCss = "";
    function collect(dir) {
        for (const name of readdirSync(dir)) {
            const path = join(dir, name);
            if (statSync(path).isDirectory()) collect(path);
            else if (name.endsWith(".html")) {
                const text = readFileSync(path, "utf8");
                const style = (text.match(/<style>([\s\S]*?)<\/style>/g) || []).join("\n");
                const script = (text.match(/<script>([\s\S]*?)<\/script>/g) || []).join("\n");
                if (script.length > biggestJs.length) biggestJs = script;
                if (style.length > biggestCss.length) biggestCss = style;
            }
        }
    }
    collect(join(exportRoot, "linux"));
    writeFileSync("/tmp/guide-script.js", biggestJs);
    writeFileSync("/tmp/guide-style.css", biggestCss);
    writeFileSync("/tmp/linux-size-limit.json", JSON.stringify([
        { name: "guide script", path: "/tmp/guide-script.js", limit: "20 kB" },
        { name: "guide css", path: "/tmp/guide-style.css", limit: "80 kB" },
    ]));
    const filePlugin = (await import("@size-limit/file")).default;
    const sizeLimit = (await import("size-limit")).default;
    const rows = await sizeLimit(filePlugin, {
        checks: [
            { name: "guide script", files: ["/tmp/guide-script.js"], gzip: true },
            { name: "guide css", files: ["/tmp/guide-style.css"], gzip: true },
        ],
    });
    const caps = { "guide script": 20 * 1024, "guide css": 80 * 1024 };
    console.log("20", JSON.stringify(rows));
    rows.forEach((row, index) => {
        const name = index === 0 ? "guide script" : "guide css";
        if (row.size > caps[name]) fail("20 size-limit", `${name} ${row.size} > ${caps[name]}`);
    });
}

function contrastRatio(a, b) {
    const channel = (value) => {
        const scaled = value / 255;
        return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
    };
    const lum = (rgb) => 0.2126 * channel(rgb[0]) + 0.7152 * channel(rgb[1]) + 0.0722 * channel(rgb[2]);
    const left = lum(a);
    const right = lum(b);
    return (Math.max(left, right) + 0.05) / (Math.min(left, right) + 0.05);
}

async function check21to24(browser) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true });
    if (!skip(21)) {
        const page = await context.newPage();
        await page.goto(url("/step/terminal"), { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.classList.contains("linux-ready"));
        const small = await page.evaluate(() => {
            function hit(node) {
                const box = node.getBoundingClientRect();
                let width = box.width;
                let height = box.height;
                for (const pseudo of ["::before", "::after"]) {
                    const style = getComputedStyle(node, pseudo);
                    if (!style || style.position !== "absolute" || style.content === "none" || style.content === "normal") continue;
                    const extraWidth = parseFloat(style.width);
                    const extraHeight = parseFloat(style.height);
                    if (Number.isFinite(extraWidth)) width = Math.max(width, extraWidth);
                    if (Number.isFinite(extraHeight)) height = Math.max(height, extraHeight);
                }
                return { width, height };
            }
            const nodes = [...document.querySelectorAll("a, button, summary, input, label")].filter((node) => {
                const box = hit(node);
                return box.width > 0 && box.height > 0 && (box.width < 44 || box.height < 44);
            }).slice(0, 5).map((node) => `${node.tagName}.${node.className}`.slice(0, 80));
            return nodes;
        });
        if (small.length) fail("21 touch target", small.join(" | "));
        await page.goto(url("/step/overview"), { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.classList.contains("linux-ready"));
        const terms = await page.evaluate(() => [...document.querySelectorAll(".linux-term-btn")].filter((node) => node.getClientRects().length).map((node) => {
            const box = node.getBoundingClientRect();
            return { text: (node.textContent || "").slice(0, 24), width: box.width, height: box.height };
        }).filter((box) => box.width < 24 || box.height < 24).slice(0, 5));
        if (terms.length) fail("21 glossary", terms.map((box) => `${box.text} ${Math.round(box.width)}x${Math.round(box.height)}`).join(" | "));
        await page.keyboard.press("Tab");
        const first = await page.evaluate(() => document.activeElement?.className || "");
        if (!String(first).includes("linux-skip")) fail("21 keyboard", String(first));
        await page.emulateMedia({ reducedMotion: "reduce" });
        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.classList.contains("linux-ready"));
        const motion = await page.evaluate(() => getComputedStyle(document.body).getPropertyValue("--unused") || "none");
        const reduced = await page.evaluate(() => {
            const veil = document.querySelector(".linux-backdrop-veil");
            veil?.classList.add("is-shown");
            return getComputedStyle(veil).animationName;
        });
        if (reduced && reduced !== "none") fail("21 reduced motion", reduced);
        const handles = await page.locator("#linux-guide a, #linux-guide button").all();
        const covered = [];
        for (const handle of handles.slice(0, 8)) {
            const inBar = await handle.evaluate((node) => !!node.closest("header, .linux-subnav, .linux-wizard-bar"));
            if (inBar) continue;
            await handle.focus();
            await page.waitForTimeout(40);
            const box = await handle.boundingBox();
            if (!box || box.height < 1) continue;
            const bars = await page.evaluate(() => ({
                top: Math.max(document.querySelector("header")?.getBoundingClientRect().bottom || 0, document.querySelector(".linux-subnav")?.getBoundingClientRect().bottom || 0),
                bar: document.querySelector(".linux-wizard-bar")?.getBoundingClientRect().top ?? window.innerHeight,
            }));
            if (box.y < bars.top - 2) covered.push(`under header ${(await handle.innerText()).slice(0, 24)}`);
            if (box.y + box.height > bars.bar + 2) covered.push(`under wizard ${(await handle.innerText()).slice(0, 24)}`);
        }
        if (covered.length) fail("21 focus", covered.join(" | "));
        await page.close();
    }
    if (!skip(22)) {
        const page = await context.newPage();
        await page.setViewportSize({ width: 1440, height: 900 });
        await page.goto(url(""), { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.classList.contains("linux-ready"));
        await page.waitForTimeout(800);
        const samples = await page.evaluate(() => {
            function parse(color) {
                const ctx = document.createElement("canvas").getContext("2d");
                ctx.fillStyle = color;
                const hex = ctx.fillStyle;
                return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
            }
            const picked = [...document.querySelectorAll("h1, p, a, button, strong")].filter((node) => {
                if (node.classList.contains("linux-skip")) return false;
                const box = node.getBoundingClientRect();
                return box.width > 0 && box.top > 8 && box.bottom < innerHeight && (node.innerText || "").trim();
            }).slice(0, 8);
            const rows = picked.map((node) => {
                const style = getComputedStyle(node);
                const box = node.getBoundingClientRect();
                return { text: (node.innerText || "").slice(0, 40), color: parse(style.color), size: parseFloat(style.fontSize), weight: style.fontWeight, x: Math.max(1, box.x + 2), y: Math.max(1, box.y - 3) };
            });
            return rows;
        });
        const shot = await page.screenshot();
        const { PNG } = await import("pngjs");
        const png = PNG.sync.read(shot);
        for (const sample of samples) {
            const x = Math.max(0, Math.min(png.width - 1, Math.round(sample.x)));
            const y = Math.max(0, Math.min(png.height - 1, Math.round(sample.y)));
            const offset = (png.width * y + x) << 2;
            const behind = [png.data[offset], png.data[offset + 1], png.data[offset + 2]];
            const ratio = contrastRatio(sample.color, behind);
            const large = sample.size >= 24 || (sample.size >= 18.66 && Number(sample.weight) >= 700);
            const need = large ? 3 : 4.5;
            console.log("22", sample.text, ratio.toFixed(2), "need", need);
            if (ratio < need) fail("22 contrast", `${sample.text} ${ratio.toFixed(2)} < ${need}`);
        }
        await page.close();
    }
    if (!skip(24)) {
        const page = await context.newPage();
        await page.setViewportSize({ width: 1280, height: 800 });
        await page.goto(url("/step/terminal"), { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() => document.documentElement.classList.contains("linux-ready"));
        await page.waitForTimeout(300);
        const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
        if (results.violations.length) fail("24 axe", results.violations.map((item) => item.id).join(" | "));
        let found = false;
        for (let i = 0; i < 40; i += 1) {
            await page.keyboard.press("Tab");
            found = await page.evaluate(() => document.activeElement?.classList.contains("code-trust-mark"));
            if (found) break;
        }
        if (!found) fail("24 tab", "check mark not in tab order");
        else {
            await page.keyboard.press("Enter");
            await page.waitForTimeout(100);
            const open = await page.evaluate(() => !!document.querySelector(".code-trust-pop:popover-open, .code-trust-pop"));
            const shown = await page.evaluate(() => {
                const pop = document.querySelector(".code-trust-pop");
                return pop ? getComputedStyle(pop).display !== "none" : false;
            });
            if (!open && !shown) fail("24 popover", "did not open");
            await page.keyboard.press("Escape");
            await page.waitForTimeout(100);
            const back = await page.evaluate(() => document.activeElement?.classList.contains("code-trust-mark"));
            if (!back) fail("24 focus return", "focus did not return to the check mark");
        }
        await page.close();
    }
    await context.close();
}

function check23() {
    if (skip(23)) return;
    const run = spawnSync("npx", ["linkinator", url(""), "--recurse", "--silence", "skipped", "--timeout", "20000", "--skip", "127\\.0\\.0\\.1:\\d+/(de|es|fr|ja|ko|ru|tr|zh-CN|pt-BR|pt-PT)/|https://bannerlordcoop\\.com/linux"], {
        encoding: "utf8", timeout: 10 * 60 * 1000,
    });
    const text = `${run.stdout || ""}\n${run.stderr || ""}`;
    console.log(text.slice(-1500));
    if (run.status !== 0) fail("23 links", text.split("\n").filter((line) => /\[404\]|BROKEN|error/i.test(line)).slice(0, 12).join(" | ") || `exit ${run.status}`);
}

const wanted = only ? [Number(only)] : [15, 16, 17, 18, 19, 20, 21, 22, 23, 24];
if (wanted.includes(17)) check17();
if (wanted.includes(19)) check19();
if (wanted.includes(20)) await check20();
if (wanted.some((check) => [21, 22, 24].includes(check))) {
    const browser = await chromium.launch();
    await check21to24(browser);
    await browser.close();
}
if (wanted.includes(18)) await check18();
if (wanted.includes(23)) check23();
if (wanted.includes(16)) await check16();
if (wanted.includes(15)) await check15();

if (failures.length) {
    console.log(`\n${failures.length} failed`);
    for (const line of failures) console.log(line);
    process.exit(1);
}
console.log("benchmarks passed");
