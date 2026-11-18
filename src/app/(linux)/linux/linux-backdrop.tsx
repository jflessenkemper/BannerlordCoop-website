"use client";

import { useEffect, useRef } from "react";

/** Loads the artwork after the title has painted, so the photo is not on the critical path. */
export function LinuxBackdrop() {
    const imageRef = useRef<HTMLImageElement>(null);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            imageRef.current?.setAttribute("src", "/images/linux/backdrop.webp");
        }, 400);
        return () => window.clearTimeout(timer);
    }, []);
    return (
        // The original artwork, not a resized derivative.
        // eslint-disable-next-line @next/next/no-img-element
        <img ref={imageRef} className="linux-backdrop" alt="" width={1600} height={900} decoding="async" fetchPriority="low" />
    );
}
