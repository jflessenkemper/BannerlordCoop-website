import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import english from "@/app/lib/localization/dictionaries/en/linux.json";
import russian from "@/app/lib/localization/dictionaries/ru/linux.json";
import { scriptText } from "./script-text";

const request = vi.hoisted(() => ({ locale: undefined as string | undefined }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => ({ value: request.locale }) }) }));
vi.mock("@/app/components/layout/Navbar", () => ({ Navbar: () => null }));
vi.mock("@/app/components/layout/Footer", () => ({ Footer: () => null }));
import LinuxPage, { generateMetadata } from "./page";
import sitemap from "@/app/sitemap";

afterEach(() => { request.locale = undefined; });

async function render() {
    const root = document.createElement("div");
    root.innerHTML = renderToStaticMarkup(await LinuxPage());
    return root;
}

const ubuntu = scriptText("code-oneshot-ubuntu");

describe("linux setup guide", () => {
    it("publishes a locale-specific title on the site banner", async () => {
        const metadata = await generateMetadata();
        expect(metadata.title).toEqual({ absolute: english["metadata.title"] });
        expect(metadata.description).toBe(english["metadata.description"]);
        expect(metadata.alternates).toEqual({ canonical: "/linux" });
        expect(metadata.openGraph).toMatchObject({ url: "/linux", images: [{ url: "/images/banner.png" }] });
        expect(JSON.stringify(metadata)).not.toContain("ship.place");
    });

    it("renders the menu without the checklist until that view is opened", async () => {
        const root = await render();
        expect(root.querySelector("#start-title")?.textContent).toBe(english["ui.startTitle"]);
        expect(root.querySelector("#sec-terminal")).toBeNull();
        expect(ubuntu).toContain("#!/usr/bin/env bash");
        expect(sitemap().map((entry) => entry.url)).toContain("https://bannerlordcoop.com/linux");
    });

    it("uses the site locale for guide prose and leaves the script unchanged", async () => {
        request.locale = "ru";
        const metadata = await generateMetadata();
        expect(metadata.title).toEqual({ absolute: russian["metadata.title"] });
        const root = await render();
        expect(root.querySelector("#start-title")?.textContent).toBe(russian["ui.startTitle"]);
        expect(ubuntu).not.toContain(russian["ui.startTitle"]);
    });
});
