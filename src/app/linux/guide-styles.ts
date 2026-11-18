/** Shared Tailwind class groups so the guide views stay readable. */
export const glassCard = "rounded-xl border border-white/15 bg-[linear-gradient(160deg,rgba(255,255,255,0.055),rgba(255,255,255,0.01)_60%),rgba(13,14,11,0.94)] shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_8px_22px_rgba(0,0,0,0.28)] backdrop-blur-[16px]";

export const choiceCard = `${glassCard} relative flex w-full cursor-pointer flex-col items-start justify-center px-4 py-5 text-left font-inherit text-inherit transition-colors hover:border-gold hover:bg-gold/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold`;

export const pageFrame = "site-container";

export const titleClass = "font-display text-[clamp(2.4rem,5vw,4.25rem)] font-semibold leading-none tracking-[-0.03em] text-foreground";

export const sectionTitleClass = "font-display text-[clamp(1.8rem,3vw,2.6rem)] font-semibold leading-tight text-foreground";

export const goldButton = "inline-flex min-h-11 cursor-pointer items-center justify-center rounded border border-gold/55 bg-gold/10 px-4 font-label text-sm font-semibold uppercase tracking-[0.12em] text-gold no-underline transition-colors hover:bg-gold/20 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

export const primaryButton = "inline-flex min-h-11 cursor-pointer items-center justify-center rounded border border-crimson bg-crimson px-4 font-label text-sm font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:border-crimson-hover hover:bg-crimson-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

/** Joins class names and drops the empty ones. */
export function cx(...parts: Array<string | false | undefined>): string {
    return parts.filter(Boolean).join(" ");
}
