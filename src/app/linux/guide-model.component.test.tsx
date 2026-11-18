import { expect, it } from "vitest";
import { FAQ_SECTION, parseRoute, resolveRoute, routeHash, sectionIds, wizardNeighbors, WIZARD_STEPS, type GuideRoute } from "./guide-model";

const routes: GuideRoute[] = [
    { view: "start" },
    { view: "distro" },
    { view: "wizard", step: "overview" },
    { view: "wizard", step: "agents" },
    { view: "manual" },
    { view: "manual", section: FAQ_SECTION },
    { view: "manual", section: "terminal" },
    { view: "manual", section: FAQ_SECTION, openAi: true },
];

it.each([
    ["", { view: "start" }],
    ["#start", { view: "start" }],
    ["#distro", { view: "distro" }],
    ["#wizard/overview", { view: "wizard", step: "overview" }],
    ["#wizard/bogus", { view: "wizard", step: "overview" }],
    ["#wizard", { view: "wizard", step: "overview" }],
    ["#manual", { view: "manual" }],
    ["#manual/faq", { view: "manual", section: "faq" }],
    ["#manual/missing", { view: "manual" }],
    ["#sec/terminal", { view: "manual", section: "terminal" }],
    ["#sec/missing", { view: "start" }],
    ["#faq", { view: "manual", section: "faq" }],
    ["#ai", { view: "manual", section: FAQ_SECTION, openAi: true }],
    ["#manual/%E0%A4%A", { view: "manual" }],
    ["#nope", { view: "start" }],
] as const)("parseRoute(%s)", (hash, expected) => {
    expect(parseRoute(hash, sectionIds)).toEqual(expected);
});

it("round-trips every guide view through the hash", () => {
    for (const route of routes) {
        const parsed = parseRoute(routeHash(route), sectionIds);
        if (route.view === "manual" && route.openAi) {
            expect(parsed).toEqual({ view: "manual", section: route.section });
            continue;
        }
        expect(parsed).toEqual(route);
    }
});

it("walks wizard steps from the overview back to the menu", () => {
    expect(wizardNeighbors(WIZARD_STEPS[0]).previous).toBeNull();
    expect(wizardNeighbors(WIZARD_STEPS[0]).next).toEqual({ view: "wizard", step: WIZARD_STEPS[1] });
    expect(wizardNeighbors(WIZARD_STEPS[WIZARD_STEPS.length - 1]).next).toEqual({ view: "start" });
});

it("keeps the FAQ on its route and sends the checklist to the picker", () => {
    expect(resolveRoute({ view: "manual", section: FAQ_SECTION }, null)).toEqual({ view: "manual", section: FAQ_SECTION });
    expect(resolveRoute({ view: "manual", section: FAQ_SECTION, openAi: true }, null).view).toBe("manual");
    expect(resolveRoute({ view: "manual", section: "terminal" }, null)).toEqual({ view: "distro" });
    expect(resolveRoute({ view: "wizard", step: "overview" }, "fedora").view).toBe("wizard");
});
