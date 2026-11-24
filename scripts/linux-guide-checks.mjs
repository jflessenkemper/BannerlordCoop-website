/**
 * Live checks from src/app/(linux)/linux/checks.md.
 * Usage: node scripts/linux-guide-checks.mjs [baseUrl]
 */
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const { chromium } = createRequire(new URL("../package.json", import.meta.url))("playwright");
const base = process.argv[2] || "http://127.0.0.1:3458";
const locales = ["", "de", "es", "fr", "ja", "ko", "ru", "tr", "zh-CN", "pt-BR", "pt-PT"];
const routes = ["", "/faq", "/distro", "/checklist", "/script", "/done", "/step/overview", "/step/terminal", "/step/deps", "/step/steam", "/step/download", "/step/configure", "/step/launch", "/step/firewall", "/step/service", "/step/client", "/step/backups"];
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
            await page.waitForFunction(() => document.documentElement.classList.contains("linux-ready")).catch(() => {});
            await page.waitForTimeout(220);
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

            const order = await page.evaluate(() => {
                const problems = [];
                const regions = [...document.querySelectorAll("#linux-guide .linux-stage-body, #linux-guide .linux-flow-steps, #linux-guide details")];
                for (const region of regions) {
                    const lists = [...region.querySelectorAll("ol.step-cards")].filter((list) => {
                        const closer = list.parentElement?.closest(".linux-stage-body, .linux-flow-steps, details");
                        return closer === region;
                    });
                    if (lists.length > 1) problems.push(`restart ${region.id || region.className}`);
                    for (const list of lists) {
                        if ([...list.children].some((child) => child.tagName !== "LI")) problems.push(`between ${region.id || region.className}`);
                        for (const item of list.querySelectorAll(":scope > li")) {
                            const heading = item.querySelector("h1, h2, h3, h4, h5, h6");
                            const nested = item.querySelector("ul, ol");
                            const notes = [...item.children].filter((child) => child.matches("p"));
                            if (heading) problems.push(`heading ${heading.textContent.replace(/\s+/g, " ").trim().slice(0, 40)}`);
                            if (nested) problems.push(`nested ${nested.tagName.toLowerCase()}`);
                            if (notes.length > 1) problems.push(`notes ${notes.length}`);
                        }
                    }
                    const kids = [...region.children];
                    for (let index = 0; index < kids.length; index += 1) {
                        if (kids[index].tagName !== "OL") continue;
                        const later = kids.slice(index + 1);
                        const gap = later.findIndex((child) => child.tagName === "OL");
                        if (gap > 0 && later.slice(0, gap).some((child) => child.matches("p, .linux-note"))) problems.push(`subtext ${region.id || region.className}`);
                    }
                }
                return problems.slice(0, 4);
            });
            if (order.length) fail("25 order", `${label} ${order.join(" | ")}`);

            const divider = await page.evaluate(() => {
                const sep = document.querySelector(".subnav-sep");
                if (!sep || !sep.getClientRects().length) return null;
                const change = [...document.querySelectorAll(".subnav-change")].find((node) => node.getClientRects().length);
                const sepBox = sep.getBoundingClientRect();
                const changeBox = change ? change.getBoundingClientRect() : null;
                return {
                    text: sep.textContent.trim(),
                    color: getComputedStyle(sep).backgroundColor,
                    line: change ? getComputedStyle(change).borderLeftColor : "",
                    sepHeight: sepBox.height,
                    lineHeight: changeBox ? changeBox.height : 0,
                };
            });
            if (divider) {
                if (divider.text) fail("9 divider", `${label} separator is "${divider.text}"`);
                if (divider.line) {
                    const same = await page.evaluate(({ color, line }) => {
                        const canvas = document.createElement("canvas");
                        canvas.width = canvas.height = 1;
                        const context = canvas.getContext("2d", { willReadFrequently: true });
                        function pixel(value) {
                            context.clearRect(0, 0, 1, 1);
                            context.fillStyle = value;
                            context.fillRect(0, 0, 1, 1);
                            return [...context.getImageData(0, 0, 1, 1).data].join(",");
                        }
                        return pixel(color) === pixel(line);
                    }, divider);
                    if (!same) fail("9 divider color", `${label} ${divider.color} vs ${divider.line}`);
                }
                if (divider.line && Math.abs(divider.sepHeight - divider.lineHeight) > 2) fail("9 divider height", `${label} sep ${divider.sepHeight} line ${divider.lineHeight}`);
            }

            if (route === "/checklist") {
                const stages = await page.evaluate((english) => {
                    const list = [...document.querySelectorAll("details.linux-stage")];
                    const bad = [];
                    list.forEach((stage, index) => {
                        const num = stage.querySelector(":scope > summary .linux-stage-num");
                        const title = stage.querySelector(":scope > summary h2");
                        if (!num || !title || num.textContent.trim() !== String(index + 1) || !title.textContent.trim()) bad.push(stage.id || String(index));
                    });
                    const closed = list.filter((stage) => !stage.open);
                    return {
                        toc: !!document.querySelector("#linux-guide nav ol a[href^='#sec-']"),
                        count: list.length,
                        bad: bad.slice(0, 3),
                        firstOpen: !!list[0] && list[0].open,
                        restClosed: list.slice(1).every((stage) => !stage.open),
                        closedCopy: closed.some((stage) => stage.querySelector("pre[data-raw]") && stage.querySelector("[data-copy]")),
                        target: (closed.find((stage) => stage.id) || {}).id || "",
                        expand: english ? (document.querySelector(".linux-fold")?.textContent || "") : "skip",
                    };
                }, locale === "");
                if (stages.toc || stages.count < 2 || stages.bad.length || !stages.firstOpen || !stages.restClosed || !stages.closedCopy) {
                    fail("10 stages", `${label} toc ${stages.toc} count ${stages.count} bad ${stages.bad.join(",")} first ${stages.firstOpen} rest ${stages.restClosed} copy ${stages.closedCopy}`);
                }
                if (stages.expand !== "skip" && stages.expand !== "Expand all") fail("10 expand", `${label} ${stages.expand}`);
                if (stages.target) {
                    await page.goto(`${base}${path}#${stages.target}`, { waitUntil: "domcontentloaded" });
                    await page.waitForFunction((id) => {
                        const el = document.getElementById(id);
                        return !!(el && el.open);
                    }, stages.target);
                    const landed = await page.evaluate((id) => {
                        const el = document.getElementById(id);
                        const sub = document.querySelector(".linux-subnav");
                        const bar = sub ? sub.getBoundingClientRect().bottom : document.querySelector("header").getBoundingClientRect().bottom;
                        return { top: Math.round(el.getBoundingClientRect().top), bar: Math.round(bar) };
                    }, stages.target);
                    if (landed.top < landed.bar - 2) fail("10 link", `${label} #${stages.target} top ${landed.top} bar ${landed.bar}`);
                }
            }

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
                            if (node.matches("[popover], pre, .linux-code, .linux-stage-num, button, figcaption, .linux-tablist, label")) return;
                            const display = getComputedStyle(node).display;
                            const separated = node.tagName !== "LI" && !["inline", "inline-block", "contents"].includes(display);
                            if (separated) parts.push(" ");
                            node.childNodes.forEach(walk);
                            if (separated) parts.push(" ");
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
                    if (pre.hasAttribute("data-src")) continue;
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
await fontPage.goto(`${base}/linux`, { waitUntil: "domcontentloaded" });
await fontPage.waitForFunction(() => document.documentElement.classList.contains("linux-ready"));
const font = await fontPage.evaluate(async () => {
    const h1 = document.querySelector("h1");
    const before = h1 ? h1.getBoundingClientRect().width : 0;
    const family = h1 ? getComputedStyle(h1).fontFamily : "";
    const ready = document.fonts.check('600 32px "Cormorant Garamond"') && document.fonts.check('16px Inter');
    await new Promise((resolve) => setTimeout(resolve, 800));
    const after = h1 ? h1.getBoundingClientRect().width : 0;
    return { family, ready, delta: Math.abs(after - before) };
});
console.log("font", JSON.stringify(font));
if (!font.ready) fail("8 font", "webfont was not ready when the page was revealed");
if (!font.family.includes("Cormorant")) fail("8 font family", font.family);
if (font.delta > 1) fail("8 font shift", `title width changed by ${font.delta}`);
await fontPage.close();

const speedRoutes = ["", "/distro", "/checklist", "/step/terminal", "/faq"];
const speedProbes = [
    [".guide-choices a", true],
    ["form.distro-choice button", true],
    [".linux-wizard-bar a[rel=prefetch]", true],
    ["a.subnav-change", true],
    [".subnav-crumb a", true],
    [".linux-tablist label", false],
    ["[data-copy]", false],
    [".code-trust-mark", false],
    [".linux-fold", false],
    ["details.linux-stage > summary", false],
    ["details:not(.linux-stage):not(.linux-menu) > summary", false],
    ["[data-term]", false],
    ["details.linux-menu summary:has(.sr-only)", false],
    ["button[popovertarget='linux-download']", false],
];
for (const profile of ["desktop", "mobile"]) {
    const speed = await context.newPage();
    await speed.setViewportSize(profile === "mobile" ? { width: 390, height: 844 } : { width: 1440, height: 900 });
    if (profile === "mobile") {
        const session = await context.newCDPSession(speed);
        await session.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    }
    for (const route of speedRoutes) {
        await speed.goto(`${base}/linux${route}`, { waitUntil: "domcontentloaded" });
        await speed.waitForFunction(() => document.documentElement.classList.contains("linux-ready")).catch(() => {});
        for (const [selector, navigates] of speedProbes) {
            const present = await speed.evaluate((sel) => {
                const el = document.querySelector(sel);
                return !!(el && el.getClientRects().length);
            }, selector);
            if (!present) continue;
            if (!navigates) {
                const paint = await speed.evaluate((sel) => new Promise((resolve) => {
                    const el = document.querySelector(sel);
                    const start = performance.now();
                    el.click();
                    requestAnimationFrame(() => requestAnimationFrame(() => resolve(Math.round(performance.now() - start))));
                }), selector);
                console.log("11", profile, route || "/", selector, `${paint}ms`);
                if (profile === "desktop" && paint >= 100) fail("11 response", `${route || "/"} ${selector} ${paint}ms`);
                await speed.keyboard.press("Escape").catch(() => {});
                continue;
            }
            const href = await speed.evaluate((sel) => {
                const el = document.querySelector(sel);
                return el.href || el.closest("form")?.action || "";
            }, selector);
            if (!href.startsWith(base)) continue;
            const from = speed.url();
            const started = Date.now();
            await speed.evaluate((sel) => document.querySelector(sel).click(), selector);
            await speed.waitForLoadState("domcontentloaded", { timeout: 8000 }).catch(() => {});
            await speed.waitForSelector("h1", { timeout: 8000 }).catch(() => {});
            await speed.waitForFunction(() => document.documentElement.classList.contains("linux-ready"), { timeout: 4000 }).catch(() => {});
            const routeMs = Date.now() - started;
            console.log("11", profile, route || "/", selector, `route ${routeMs}ms`);
            if (profile === "desktop" && routeMs >= 1000) fail("11 route", `${route || "/"} ${selector} ${routeMs}ms`);
            if (speed.url() !== from) {
                await speed.goto(`${base}/linux${route}`, { waitUntil: "domcontentloaded" });
                await speed.waitForFunction(() => document.documentElement.classList.contains("linux-ready")).catch(() => {});
            }
        }
    }
    await speed.close();
}

const film = await context.newPage();
await film.setViewportSize({ width: 1024, height: 700 });
const filmClient = await context.newCDPSession(film);
const filmFrames = [];
filmClient.on("Page.screencastFrame", (frame) => {
    filmFrames.push(frame.data);
    filmClient.send("Page.screencastFrameAck", { sessionId: frame.sessionId }).catch(() => {});
});
await filmClient.send("Page.startScreencast", { format: "png", quality: 40, everyNthFrame: 1, maxWidth: 480, maxHeight: 320 });
await film.goto(`${base}/linux`, { waitUntil: "domcontentloaded" });
await film.waitForFunction(() => document.documentElement.classList.contains("linux-ready"));
await film.waitForFunction(() => document.querySelector(".linux-backdrop-veil")?.classList.contains("is-shown")).catch(() => {});
await film.waitForTimeout(500);
await filmClient.send("Page.stopScreencast");
const filmDir = "/tmp/linux-film";
await import("node:fs").then((fs) => fs.mkdirSync(filmDir, { recursive: true }));
const { writeFileSync } = await import("node:fs");
filmFrames.forEach((data, index) => writeFileSync(`${filmDir}/${String(index).padStart(3, "0")}.png`, Buffer.from(data, "base64")));
const filmProbe = spawnSync("python3", ["-c", `
from PIL import Image
import glob
rows=[]
for path in sorted(glob.glob("${filmDir}/*.png")):
    im=Image.open(path).convert("RGB")
    px=list(im.resize((32,20)).getdata())
    avg=sum(sum(p) for p in px)/(3*len(px))
    bright=sum(1 for p in px if max(p)>80)
    rows.append((round(avg,1), bright))
print(",".join(f"{a}/{b}" for a,b in rows))
usable=[row for row in rows if row[0]<200]
black_index=next((i for i,(avg,bright) in enumerate(usable) if avg<20 and bright==0), None)
tail=usable[black_index:] if black_index is not None else []
black=black_index is not None
shown=any(avg>24 or bright>8 for avg,bright in tail[1:])
black_before=black and shown and tail[0][1]==0
print("black", black, "shown", shown, "black_before", black_before)
`]);
console.log("12 film", filmProbe.stdout.toString().trim());
const filmLines = filmProbe.stdout.toString().trim().split("\n");
if (!filmLines.some((line) => line.includes("black_before True"))) fail("12 reveal", filmLines.join(" | "));
await film.close();

const underlineRoutes = ["", "/faq", "/distro", "/checklist", "/script", "/done", "/step/overview", "/step/terminal", "/step/configure", "/step/launch", "/step/firewall", "/step/service", "/step/client", "/step/backups"];
const underlineWidths = [320, 390, 1024, 1440];
const underlinePage = await context.newPage();
for (const width of underlineWidths) {
    await underlinePage.setViewportSize({ width, height: width < 800 ? 844 : 900 });
    for (const route of underlineRoutes) {
        await underlinePage.goto(`${base}/linux${route}`, { waitUntil: "domcontentloaded" });
        await underlinePage.waitForFunction(() => document.documentElement.classList.contains("linux-ready")).catch(() => {});
        const resting = await underlinePage.evaluate(() => {
            const nodes = [...document.querySelectorAll("button, summary, a.no-underline, .guide-choices a, .linux-wizard-bar a, header button, header summary")];
            return nodes.filter((el) => !el.classList.contains("linux-term-btn") && el.getClientRects().length && getComputedStyle(el).textDecorationLine.includes("underline")).slice(0, 3).map((el) => (el.innerText || "").replace(/\s+/g, " ").trim().slice(0, 40));
        });
        if (resting.length) fail("13 underline", `${route || "/"} @${width} ${resting.join(" | ")}`);
    }
    await underlinePage.goto(`${base}/linux/step/terminal`, { waitUntil: "domcontentloaded" });
    await underlinePage.waitForFunction(() => document.documentElement.classList.contains("linux-ready")).catch(() => {});
    for (const selector of ["a.no-underline:not(.linux-skip)", "button:not(.linux-term-btn)", "summary"]) {
        const control = underlinePage.locator(selector).locator("visible=true").first();
        if (!await control.count()) continue;
        await control.scrollIntoViewIfNeeded();
        for (const state of ["hover", "focus", "active"]) {
            if (state === "hover") await control.hover();
            if (state === "focus") await control.focus();
            if (state === "active") await underlinePage.mouse.down();
            const line = await control.evaluate((el) => getComputedStyle(el).textDecorationLine);
            if (state === "active") await underlinePage.mouse.up();
            if (line.includes("underline")) fail("13 underline", `terminal @${width} ${selector} ${state} ${line}`);
        }
    }
    const kept = await underlinePage.evaluate(() => {
        const term = document.querySelector(".linux-term-btn");
        const prose = document.querySelector(".linux-guide a.text-gold:not(.no-underline)");
        const visited = [...document.styleSheets].some((sheet) => {
            let rules = [];
            try { rules = [...sheet.cssRules]; } catch { return false; }
            return rules.some((rule) => rule.selectorText && rule.selectorText.includes(":visited") && rule.style && rule.style.textDecorationLine === "none");
        });
        return {
            term: term ? getComputedStyle(term).textDecorationLine : "skip",
            prose: prose ? getComputedStyle(prose).textDecorationLine : "skip",
            visited,
        };
    });
    if (kept.term !== "skip" && !kept.term.includes("underline")) fail("13 glossary", `terminal @${width} ${kept.term}`);
    if (kept.prose !== "skip" && !kept.prose.includes("underline")) fail("13 prose", `terminal @${width} ${kept.prose}`);
    if (!kept.visited) fail("13 visited", `@${width} missing visited none rule`);
}
await underlinePage.close();

const signingManifest = JSON.parse(readFileSync(join(process.cwd(), "src/app/(linux)/linux/content/scripts-manifest.json"), "utf8"));
const signingPage = await context.newPage();
await signingPage.setViewportSize({ width: 1024, height: 900 });
await signingPage.goto(`${base}/linux/step/deps`, { waitUntil: "domcontentloaded" });
await signingPage.waitForFunction(() => document.documentElement.classList.contains("linux-ready")).catch(() => {});
const marks = await signingPage.evaluate(() => [...document.querySelectorAll(".code-trust-mark")].map((node) => {
    const pop = document.getElementById(node.getAttribute("aria-controls") || "");
    return {
        id: node.getAttribute("data-script-id"),
        sha: node.getAttribute("data-sha256"),
        attestation: pop?.querySelector("[data-attestation]")?.getAttribute("href") || "",
        virusTotal: pop?.querySelector("[data-virustotal]")?.getAttribute("href") || "",
        command: pop?.querySelector(".code-trust-cmd")?.textContent || "",
    };
}));
const byId = new Map(signingManifest.scripts.map((entry) => [entry.id, entry]));
const reported = signingManifest.scripts.filter((entry) => entry.detections && entry.analysed);
if (!reported.length) fail("14 reports", "no VirusTotal reports in the manifest");
for (const entry of reported) {
    const file = readFileSync(join(process.cwd(), "public/linux/scripts", entry.file));
    const digest = createHash("sha256").update(file).digest("hex");
    if (digest !== entry.sha256) fail("14 file", `${entry.id} ${digest} != ${entry.sha256}`);
    if (!entry.virusTotalUrl.endsWith(entry.sha256)) fail("14 url", entry.id);
}
if (!marks.length) fail("14 marks", "English deps page has no verified badge");
for (const mark of marks) {
    const entry = byId.get(mark.id);
    if (!entry) fail("14 missing", mark.id || "no id");
    else if (mark.sha !== entry.sha256) fail("14 sha", `${mark.id} ${mark.sha} != ${entry.sha256}`);
    else if (!mark.virusTotal.includes(entry.sha256)) fail("14 virustotal", mark.id);
    else if (signingManifest.attestationUrl) {
        if (mark.attestation !== signingManifest.attestationUrl) fail("14 attestation", mark.id);
        if (!mark.command.includes("gh attestation verify")) fail("14 command", mark.id);
    } else if (mark.attestation || mark.command.includes("gh attestation")) fail("14 unsigned", mark.id);
}
await signingPage.close();

await browser.close();
if (failures.length) {
    console.log(`\n${failures.length} failed`);
    process.exit(1);
}
console.log("\nall guide checks passed");
