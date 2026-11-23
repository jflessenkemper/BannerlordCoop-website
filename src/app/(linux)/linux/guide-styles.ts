/** Shared Tailwind class groups so the guide views stay readable. */
export const glassCard = "linux-glass rounded-xl border border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_22px_rgba(0,0,0,0.28)]";

export const choiceCard = `${glassCard} relative flex min-h-44 w-full cursor-pointer flex-col items-start px-4 py-5 text-left font-inherit text-inherit backdrop-blur-[8px] transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold`;

export const pageFrame = "site-container";

export const titleClass = "max-w-4xl font-display text-5xl font-semibold leading-[0.95] text-foreground sm:text-6xl lg:text-7xl";

export const sectionTitleClass = "font-display text-3xl font-semibold leading-tight text-foreground sm:text-4xl";

export const goldButton = "inline-flex min-h-12 cursor-pointer items-center justify-center rounded border border-gold/55 bg-gold/10 px-4 font-label text-sm font-semibold uppercase tracking-[0.22em] text-gold no-underline transition-colors hover:bg-gold/20 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export const primaryButton = "inline-flex min-h-12 cursor-pointer items-center justify-center rounded border border-crimson bg-crimson px-4 font-label text-sm font-semibold uppercase tracking-[0.22em] text-white transition-colors hover:border-crimson-hover hover:bg-crimson-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

/** How long a copy result stays on the button before the label returns. */
export const COPY_RESET_MS = { copied: 2200, failed: 4000 } as const;

/** Paragraph roles the content file can set. Unknown roles add no class. */
export const PARAGRAPH_ROLE_CLASS: Record<string, string> = {
    lead: "mb-4 mt-3",
};

/** Joins class names and drops the empty ones. */
export function cx(...parts: Array<string | false | undefined>): string {
    return parts.filter(Boolean).join(" ");
}
