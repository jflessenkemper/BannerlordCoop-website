import { createElement } from "react";

type Node = [string, Record<string, string>];

/** The icons the guide chrome draws. Same paths as the site icons, without the client icon package. */
const icons = {
    swords: [
        ["polyline", { points: "14.5 17.5 3 6 3 3 6 3 17.5 14.5" }],
        ["line", { x1: "13", x2: "19", y1: "19", y2: "13" }],
        ["line", { x1: "16", x2: "20", y1: "16", y2: "20" }],
        ["line", { x1: "19", x2: "21", y1: "21", y2: "19" }],
        ["polyline", { points: "14.5 6.5 18 3 21 3 21 6 17.5 9.5" }],
        ["line", { x1: "5", x2: "9", y1: "14", y2: "18" }],
        ["line", { x1: "7", x2: "4", y1: "17", y2: "20" }],
        ["line", { x1: "3", x2: "5", y1: "19", y2: "21" }],
    ],
    server: [
        ["rect", { width: "20", height: "8", x: "2", y: "2", rx: "2", ry: "2" }],
        ["rect", { width: "20", height: "8", x: "2", y: "14", rx: "2", ry: "2" }],
        ["line", { x1: "6", x2: "6.01", y1: "6", y2: "6" }],
        ["line", { x1: "6", x2: "6.01", y1: "18", y2: "18" }],
    ],
    terminal: [
        ["path", { d: "m7 11 2-2-2-2" }],
        ["path", { d: "M11 13h4" }],
        ["rect", { width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }],
    ],
    chevron: [["path", { d: "m6 9 6 6 6-6" }]],
    download: [
        ["path", { d: "M12 15V3" }],
        ["path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }],
        ["path", { d: "m7 10 5 5 5-5" }],
    ],
    check: [["path", { d: "M20 6 9 17l-5-5" }]],
    history: [
        ["path", { d: "M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" }],
        ["path", { d: "M3 3v5h5" }],
        ["path", { d: "M12 7v5l4 2" }],
    ],
    help: [
        ["circle", { cx: "12", cy: "12", r: "10" }],
        ["path", { d: "M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" }],
        ["path", { d: "M12 17h.01" }],
    ],
    external: [
        ["path", { d: "M15 3h6v6" }],
        ["path", { d: "M10 14 21 3" }],
        ["path", { d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }],
    ],
    pr: [
        ["circle", { cx: "5", cy: "6", r: "3" }],
        ["path", { d: "M5 9v12" }],
        ["circle", { cx: "19", cy: "18", r: "3" }],
        ["path", { d: "m15 9-3-3 3-3" }],
        ["path", { d: "M12 6h5a2 2 0 0 1 2 2v7" }],
    ],
    user: [
        ["circle", { cx: "12", cy: "8", r: "5" }],
        ["path", { d: "M20 21a8 8 0 0 0-16 0" }],
    ],
    shield: [
        ["path", { d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" }],
        ["path", { d: "m9 12 2 2 4-4" }],
    ],
    x: [
        ["path", { d: "M18 6 6 18" }],
        ["path", { d: "m6 6 12 12" }],
    ],
} satisfies Record<string, Node[]>;

/** Draws one chrome icon with the same stroke as the site set. */
export function Icon({ name, className, strokeWidth = 2 }: { name: keyof typeof icons; className?: string; strokeWidth?: number }) {
    return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
            {icons[name].map(([tag, attrs], index) => createElement(tag, { ...attrs, key: index }))}
        </svg>
    );
}
