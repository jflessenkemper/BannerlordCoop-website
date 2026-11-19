/**
 * Live checks from src/app/(linux)/linux/checks.md.
 * Usage: node scripts/linux-guide-checks.mjs [baseUrl]
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const { chromium } = createRequire(new URL("../package.json", import.meta.url))("playwright");
const base = process.argv[2] || "http://127.0.0.1:3458";
const locales = ["", "de", "es", "fr", "ja", "ko", "ru", "tr", "zh-CN", "pt-BR", "pt-PT"];
const routes = ["", "/faq", "/distro", "/checklist", "/script", "/done", "/step/overview", "/step/terminal", "/step/configure", "/step/launch", "/step/firewall", "/step/service", "/step/client", "/step/backups"];
const widths = [390, 768, 1024, 1440];
const steps = new Set(["/step/overview", "/step/terminal", "/step/configure", "/step/launch", "/step/firewall", "/step/service", "/step/client", "/step/backups"]);
const failures = [];

function fail(check, detail) {
    failures.push(`${check}: ${detail}`);
    console.log("FAIL", check, detail);
}

const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const context = await browser.newContext();
await context.addCookies([{ name: "blc-distro-v1", value: "ubuntu", url: base }]);
const page = await context.newPage();

for (const locale of locales) {
    for (const route of routes) {
        const path = `${locale ? `/${locale}` : ""}/linux${route}`;
        for (const width of widths) {
            const height = width < 800 ? 844 : 900;
            await page.setViewportSize({ width, height });
            const response = await page.goto(`${base}${path}`, { waitUntil: "domcontentloaded", timeout: 30000 });
            if (!response || response.status() >= 400) {
                fail("load", `${path} ${width} status ${response && response.status()}`);
                continue;
            }
            await page.waitForSelector("h1");
            const label = `${path} @${width}`;

            await page.evaluate(() => { document.documentElement.style.scrollBehavior = "auto"; });
            const total = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
            for (const y of [Math.round(total / 2), total]) {
                await page.evaluate((yy) => scrollTo(0, yy), y);
                const bars = await page.evaluate(() => {
                    const header = document.querySelector("header");
                    const sub = document.querySelector(".linux-subnav");
                    const hr = header.getBoundingClientRect();
                    const sr = sub ? sub.getBoundingClientRect() : null;
                    const shown = (node, rect) => !!node && rect.height > 8 && getComputedStyle(node).visibility !== "hidden";
                    return { headerTop: hr.top, headerShown: shown(header, hr), headerBottom: hr.bottom, subTop: sr && sr.top, subShown: sr ? shown(sub, sr) : null };
                });
                if (Math.abs(bars.headerTop) > 1 || !bars.headerShown) fail("9 navbar", `${label} y=${y} top ${bars.headerTop}`);
                if (bars.subTop != null && (Math.abs(bars.subTop - bars.headerBottom) > 2 || !bars.subShown)) fail("9 subnav", `${label} y=${y} sub ${bars.subTop} header ${bars.headerBottom}`);
            }
            const clearance = await page.evaluate(() => {
                scrollTo(0, 0);
                const heading = document.querySelector("h1").getBoundingClientRect();
                const sub = document.querySelector(".linux-subnav");
                const bar = sub ? sub.getBoundingClientRect().bottom : document.querySelector("header").getBoundingClientRect().bottom;
                let anchor = null;
                const target = document.querySelector("#sec-agents h2");
                if (target) {
                    target.scrollIntoView({ block: "start" });
                    anchor = { top: target.getBoundingClientRect().top, bar: document.querySelector(".linux-subnav").getBoundingClientRect().bottom };
                    scrollTo(0, 0);
                }
                return { top: heading.top, bar, anchor };
            });
            if (clearance.top < clearance.bar - 2) fail("9 heading", `${label} h1 ${clearance.top} bar ${clearance.bar}`);
            if (clearance.anchor && clearance.anchor.top < clearance.anchor.bar - 2) fail("9 anchor", `${label} heading ${clearance.anchor.top} bar ${clearance.anchor.bar}`);

            const bareSummary = await page.evaluate(() => [...document.querySelectorAll("#linux-guide summary")].filter((node) => getComputedStyle(node).display !== "none" && node.getClientRects().length).map((node) => node.textContent.replace(/\s+/g, " ").trim()).filter((text) => {
                const rest = text.replace(/optional, about \d+ min/ig, "").replace(/[·•|–—-]/g, "").trim();
                return rest.length < 3;
            }));
            if (bareSummary.length) fail("9 summary", `${label} ${bareSummary.join(" | ")}`);

            const codeGap = await page.evaluate(() => {
                const bad = [];
                for (const code of document.querySelectorAll("p code, li code, dd code, summary code")) {
                    const next = code.nextSibling;
                    const text = next && next.nodeType === 3 ? next.textContent : "";
                    if (/^\s+[/\\.,:;!?…)\]}>"'«»]/.test(text)) bad.push(`${code.textContent}${text.slice(0, 8)}`);
                }
                return bad.slice(0, 3);
            });
            if (codeGap.length) fail("2 code space", `${label} ${codeGap.join(" ; ")}`);

            if (route === "") {
                const glow = await page.evaluate(() => getComputedStyle(document.querySelector(".choice-recommended")).boxShadow);
                if (glow.includes("0.72") || /28px/.test(glow.split("rgba(170, 151, 96")[1] || "")) fail("6 glow", `${label} ${glow.slice(0, 180)}`);
            }

            const chip = await page.$(".distro-chip");
            if (chip && await chip.evaluate((node) => getComputedStyle(node).display !== "none")) {
                const box = await page.evaluate(() => {
                    const chip = [...document.querySelectorAll(".distro-chip")].find((node) => getComputedStyle(node).display !== "none");
                    const crumb = document.querySelector(".subnav-crumb");
                    const frame = chip.closest(".site-container") || chip.parentElement;
                    const c = chip.getBoundingClientRect();
                    const f = frame.getBoundingClientRect();
                    const b = crumb.getBoundingClientRect();
                    return { chipRight: c.right, frameRight: f.right, chipLeft: c.left, crumbRight: b.right, overflow: document.documentElement.scrollWidth > window.innerWidth + 1 };
                });
                if (Math.abs(box.chipRight - box.frameRight) > 2) fail("4 chip edge", `${label} chip ${box.chipRight} frame ${box.frameRight}`);
                if (box.chipLeft < box.crumbRight - 1) fail("4 chip overlap", `${label} chip ${box.chipLeft} crumb ${box.crumbRight}`);
                if (box.overflow) fail("4 chip overflow", label);
            }

            if (steps.has(route)) {
                const bar = await page.evaluate(() => {
                    const node = document.querySelector(".linux-wizard-bar");
                    if (!node) return null;
                    const rect = node.getBoundingClientRect();
                    const copy = document.querySelector(".wizard-copy");
                    const pad = copy ? parseFloat(getComputedStyle(copy).paddingBottom) : 0;
                    return { bottom: rect.bottom, height: rect.height, inner: window.innerHeight, pad, position: getComputedStyle(node).position };
                });
                if (!bar) fail("3 bar missing", label);
                else {
                    if (bar.position !== "fixed") fail("3 bar position", `${label} ${bar.position}`);
                    if (Math.abs(bar.bottom - bar.inner) > 1.5) fail("3 bar bottom", `${label} bottom ${bar.bottom} viewport ${bar.inner}`);
                    if (bar.pad < bar.height - 1) fail("3 bar padding", `${label} pad ${bar.pad} bar ${bar.height}`);
                }
            }

            const glued = await page.evaluate(() => {
                const problems = [];
                for (const block of document.querySelectorAll("#linux-guide p, #linux-guide li, #linux-guide dd, #linux-guide summary, #linux-guide h1, #linux-guide h2, #linux-guide h3")) {
                    const parts = [];
                    function walk(node) {
                        if (node.nodeType === 1) {
                            if (node.matches("[popover], pre, .linux-code")) return;
                            node.childNodes.forEach(walk);
                            return;
                        }
                        if (node.nodeType === 3 && node.textContent) parts.push(node.textContent);
                    }
                    walk(block);
                    for (let i = 0; i < parts.length - 1; i += 1) {
                        if (/[A-Za-z0-9]$/.test(parts[i]) && /^[A-Za-z0-9]/.test(parts[i + 1])) problems.push(`${parts[i].slice(-12)}|${parts[i + 1].slice(0, 12)}`);
                    }
                }
                return problems.slice(0, 3);
            });
            if (glued.length) fail("2 spacing", `${label} ${glued.join(" ; ")}`);

            const split = await page.evaluate(() => {
                const bad = [];
                for (const button of document.querySelectorAll("[data-term]")) {
                    const next = button.nextSibling;
                    const text = next && next.nodeType === 3 ? next.textContent : "";
                    if (!text || !/^\s*[^\sA-Za-z0-9]/.test(text)) continue;
                    const buttonBox = button.getClientRects()[0];
                    const range = document.createRange();
                    range.setStart(next, 0);
                    range.setEnd(next, Math.min(text.length, 1));
                    const textBox = range.getClientRects()[0];
                    if (buttonBox && textBox && textBox.top > buttonBox.bottom - 2) bad.push(text.slice(0, 8));
                }
                return bad.slice(0, 3);
            });
            if (split.length) fail("2 line split", `${label} ${split.join(" ")}`);

            const code = await page.evaluate(() => {
                const bad = [];
                for (const pre of document.querySelectorAll("pre[data-raw]")) {
                    const raw = pre.getAttribute("data-raw") || "";
                    const shown = pre.querySelector("code") ? pre.querySelector("code").textContent : pre.textContent;
                    if (shown !== raw) bad.push("mismatch");
                    if (!pre.querySelector("code span")) bad.push("no spans");
                }
                return bad;
            });
            if (code.length) fail("7 highlight", `${label} ${code.join(" ")}`);

            const term = page.locator("#linux-guide [data-term]").locator("visible=true").first();
            if (await term.count()) {
                await term.scrollIntoViewIfNeeded();
                await page.evaluate(() => scrollBy(0, 80));
                await term.click({ force: true });
                await page.waitForTimeout(40);
                const pop = await page.evaluate(() => {
                    const open = document.querySelector("[popover]:popover-open");
                    const button = open && document.querySelector(`[aria-controls="${open.id}"]`);
                    if (!open || !button) return null;
                    const a = open.getBoundingClientRect();
                    const b = button.getBoundingClientRect();
                    const gap = Math.max(0, a.top - b.bottom, b.top - a.bottom, a.left - b.right, b.left - a.right);
                    const inside = a.top >= -1 && a.left >= -1 && a.bottom <= window.innerHeight + 1 && a.right <= window.innerWidth + 1;
                    return { gap, inside, top: a.top, left: a.left };
                });
                if (!pop) fail("1 popover", `${label} did not open`);
                else {
                    if (!pop.inside) fail("1 popover inside", `${label} top ${pop.top} left ${pop.left}`);
                    if (pop.gap > 16) fail("1 popover gap", `${label} ${pop.gap}`);
                }
                await page.keyboard.press("Escape");
            }
        }
    }
}

for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await page.goto(`${base}/linux/checklist`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("h1");
    const total = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
    const shots = [];
    for (const [name, y] of [["top", 0], ["middle", Math.round(total / 2)], ["bottom", total]]) {
        await page.evaluate((yy) => {
            document.documentElement.style.scrollBehavior = "auto";
            for (const node of document.querySelectorAll("#linux-guide > :not(.linux-subnav), footer")) node.style.visibility = "hidden";
            scrollTo(0, yy);
        }, y);
        const file = `/tmp/bg-check-${width}-${name}.png`;
        await page.screenshot({ path: file });
        shots.push(file);
    }
    const probe = spawnSync("python3", ["-c", `
from PIL import Image
def avg(path):
    im = Image.open(path).convert("RGB")
    px = im.load()
    r=g=b=n=0
    for y in range(140, im.size[1]-40, 4):
        for x in range(6, 22):
            R,G,B = px[x,y]
            r+=R; g+=G; b+=B; n+=1
    return (r/n, g/n, b/n)
cols = [avg(p) for p in ${JSON.stringify(shots)}]
drift = 0
for i,c in enumerate(cols):
    for d in cols[i+1:]:
        drift = max(drift, max(abs(c[k]-d[k]) for k in range(3)))
print(drift)
print("|".join(",".join(f"{v:.1f}" for v in c) for c in cols))
`]);
    const drift = Number(String(probe.stdout).trim().split("\n")[0]);
    console.log("backdrop", width, String(probe.stdout).trim().split("\n")[1], "drift", drift);
    if (!Number.isFinite(drift) || drift > 8) fail("5 backdrop", `${width} drift ${drift}`);
}

const fontPage = await context.newPage();
await fontPage.addInitScript(() => {
    window.__fcp = new Promise((resolve) => {
        new PerformanceObserver((list) => {
            if (list.getEntries().length) resolve(performance.now());
        }).observe({ type: "paint", buffered: true });
    });
});
await fontPage.setViewportSize({ width: 1280, height: 900 });
await fontPage.goto(`${base}/linux`, { waitUntil: "commit" });
const font = await fontPage.evaluate(async () => {
    await window.__fcp;
    const h1 = document.querySelector("h1");
    const before = h1 ? h1.getBoundingClientRect().width : 0;
    const family = h1 ? getComputedStyle(h1).fontFamily : "";
    const ready = document.fonts.check('600 32px "Cormorant Garamond"') && document.fonts.check('16px Inter');
    await new Promise((resolve) => setTimeout(resolve, 800));
    const after = h1 ? h1.getBoundingClientRect().width : 0;
    return { family, ready, delta: Math.abs(after - before) };
});
console.log("font", JSON.stringify(font));
if (!font.ready) fail("8 font", "webfont was not ready at first contentful paint");
if (!font.family.includes("Cormorant")) fail("8 font family", font.family);
if (font.delta > 1) fail("8 font shift", `title width changed by ${font.delta}`);
await fontPage.close();

await browser.close();
if (failures.length) {
    console.log(`\n${failures.length} failed`);
    process.exit(1);
}
console.log("\nall guide checks passed");
