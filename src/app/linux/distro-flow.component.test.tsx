import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, expect, it } from "vitest";
import { LocalizationProvider } from "@/app/lib/localization/client";
import english from "@/app/lib/localization/dictionaries/en/linux.json";
import type { Dictionary } from "@/app/lib/localization/types";
import { LinuxGuide } from "./LinuxGuide";
import { clearGuideDistroMemory } from "./hooks/useStoredDistro";
import { scriptText } from "./script-text";

const dictionary = english as Dictionary;
let root: Root | undefined;
let container: HTMLDivElement | undefined;

afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = undefined;
    container = undefined;
    localStorage.clear();
    clearGuideDistroMemory();
    window.history.replaceState(null, "", "/linux");
});

it("opens the distro picker for a checklist link and resumes that section after a choice", async () => {
    window.scrollTo = () => undefined;
    window.history.replaceState(null, "", "/linux#manual/terminal");
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    await act(async () => {
        root?.render(
            <LocalizationProvider locale="en" messages={{ linux: dictionary }}>
                <LinuxGuide />
            </LocalizationProvider>,
        );
    });
    expect(container.querySelector("#distro-title")?.textContent).toBe(dictionary["nav.dTitle"]);
    const fedora = [...container.querySelectorAll("button")].find((button) => button.textContent?.startsWith("Fedora"));
    expect(fedora).toBeTruthy();
    await act(async () => { fedora?.click(); });
    expect(window.location.hash).toBe("#manual/terminal");
    const oneshots = [...container.querySelectorAll("[data-code-id]")].map((node) => node.getAttribute("data-code-id")).filter((id) => id?.startsWith("code-oneshot-"));
    expect(oneshots).toEqual(["code-oneshot-fedora"]);
    expect(container.querySelector("[data-code-id='code-oneshot-fedora'] code")?.textContent).toBe(scriptText("code-oneshot-fedora"));
});
