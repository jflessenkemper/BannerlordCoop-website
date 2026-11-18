import { renderLinuxGuideMarkdown } from "../render-markdown";

/** Downloadable English copy of the guide, built from the same sections and scripts as the page. */
export function GET() {
    return new Response(renderLinuxGuideMarkdown(), {
        headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Content-Disposition": 'attachment; filename="LINUX.md"',
        },
    });
}
