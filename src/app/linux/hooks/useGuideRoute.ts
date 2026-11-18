"use client";

import { useCallback, useSyncExternalStore } from "react";
import { parseRoute, routeHash, type GuideRoute } from "../guide-model";

/** Subscribes to back/forward and to the hash events `go` dispatches after pushState. */
function subscribeHash(onChange: () => void) {
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
        window.removeEventListener("hashchange", onChange);
        window.removeEventListener("popstate", onChange);
    };
}

/** Scrolls to the top. Some test environments do not implement smooth scrolling. */
function scrollToTop() {
    try {
        window.scrollTo({ top: 0, behavior: "auto" });
    } catch {
        // The choice still changes the route when scrolling is unavailable.
    }
}

/** The current hash. Server rendering uses an empty hash and shows the menu. */
function readHash() {
    return window.location.hash;
}

/** Hash routing for the guide. `pushState` does not emit hashchange, so `go` dispatches it. */
export function useGuideRoute() {
    const hash = useSyncExternalStore(subscribeHash, readHash, () => "");
    const requested = parseRoute(hash);
    const go = useCallback((next: GuideRoute, mode: "push" | "replace" = "push") => {
        const nextHash = routeHash(next);
        if (mode === "replace") window.history.replaceState(null, "", nextHash);
        else window.history.pushState(null, "", nextHash);
        window.dispatchEvent(new Event("hashchange"));
        scrollToTop();
    }, []);
    return { requested, go };
}
