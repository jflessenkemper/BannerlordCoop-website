"use client";

import { useCallback, useSyncExternalStore } from "react";
import { parsePathname, parseRoute, routePath, type GuideRoute } from "../guide-model";

/** Subscribes to back/forward and to the history events `go` dispatches after pushState. */
function subscribeHistory(onChange: () => void) {
    window.addEventListener("hashchange", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
        window.removeEventListener("hashchange", onChange);
        window.removeEventListener("popstate", onChange);
    };
}

/** Path plus hash, so a legacy hash and a real route both wake the guide. */
function readLocation() {
    return `${window.location.pathname}${window.location.hash}`;
}

/** A legacy hash wins until the redirect replaces it. A bare path uses the real route. */
function routeFromLocation(value: string): GuideRoute {
    const hashIndex = value.indexOf("#");
    const hash = hashIndex >= 0 ? value.slice(hashIndex) : "";
    if (hash && hash !== "#") return parseRoute(hash);
    const path = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
    return parsePathname(path);
}

/** Scrolls to the top without smooth motion. */
function scrollToTop() {
    try {
        window.scrollTo({ top: 0, behavior: "instant" });
    } catch {
        // The choice still changes the route when scrolling is unavailable.
    }
}

/** Path routing for the guide. `pushState` does not emit popstate, so `go` dispatches it. */
export function useGuideRoute(initialPath: string) {
    const locationValue = useSyncExternalStore(subscribeHistory, readLocation, () => initialPath);
    const requested = routeFromLocation(locationValue);
    const go = useCallback((next: GuideRoute, mode: "push" | "replace" = "push") => {
        const nextPath = routePath(next);
        if (mode === "replace") window.history.replaceState(null, "", nextPath);
        else window.history.pushState(null, "", nextPath);
        window.dispatchEvent(new PopStateEvent("popstate"));
        scrollToTop();
    }, []);
    return { requested, go };
}
