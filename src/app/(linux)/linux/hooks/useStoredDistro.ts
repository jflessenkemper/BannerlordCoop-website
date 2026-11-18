"use client";

import { useCallback, useSyncExternalStore } from "react";
import distroData from "../content/distros.json";
import type { Distro } from "../guide-model";

const DISTRO_KEY = "blc-distro-v1";
const distros = distroData as Distro[];
const listeners = new Set<() => void>();

/** Choice kept for this visit when storage rejects the write. */
let memoryDistro: string | null = null;

/** Notifies subscribers after a choice or a storage event from another tab. */
function emitDistro() {
    listeners.forEach((listener) => listener());
}

/** Subscribes to distro changes, including writes from other tabs. */
function subscribeDistro(onChange: () => void) {
    listeners.add(onChange);
    const onStorage = (event: StorageEvent) => {
        if (event.key === DISTRO_KEY) onChange();
    };
    window.addEventListener("storage", onStorage);
    return () => {
        listeners.delete(onChange);
        window.removeEventListener("storage", onStorage);
    };
}

/** A stored id is used only when it is one of the guide's distros. */
function known(id: string | null): string | null {
    if (!id) return null;
    return distros.some((distro) => distro.id === id) ? id : null;
}

/** Prefers storage, and falls back to the in-memory choice when storage is empty or throws. */
function readDistro(): string | null {
    try {
        const stored = known(localStorage.getItem(DISTRO_KEY));
        if (stored) return stored;
    } catch {
        return known(memoryDistro);
    }
    return known(memoryDistro);
}

/** Clears the in-memory choice. Tests use this so one visit cannot leak into the next. */
export function clearGuideDistroMemory() {
    memoryDistro = null;
}

/** Mirrors the choice into a cookie so the next full page load can render the right view. */
function writeDistroCookie(id: string) {
    try {
        document.cookie = `${DISTRO_KEY}=${encodeURIComponent(id)}; Path=/; Max-Age=31536000; SameSite=Lax`;
    } catch {
        // The in-memory choice still covers this visit.
    }
}

/** The chosen distro. The in-memory copy survives a blocked `localStorage.setItem`. */
export function useStoredDistro(initialId: string | null = null) {
    const distroId = useSyncExternalStore(subscribeDistro, readDistro, () => known(initialId));
    const chooseDistro = useCallback((id: string) => {
        memoryDistro = id;
        try {
            localStorage.setItem(DISTRO_KEY, id);
        } catch {
            // memoryDistro already holds the choice for this visit.
        }
        writeDistroCookie(id);
        emitDistro();
    }, []);
    const distro = distros.find((item) => item.id === distroId) ?? null;
    return { distroId, distro, distros, chooseDistro };
}
