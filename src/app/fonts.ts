import { Barlow_Condensed, Cormorant_Garamond, Inter } from "next/font/google";

export const inter = Inter({
    variable: "--font-inter",
    subsets: ["latin"],
    display: "swap",
    preload: false,
    adjustFontFallback: true,
});

export const cormorantGaramond = Cormorant_Garamond({
    variable: "--font-cormorant",
    subsets: ["latin"],
    weight: "600",
    display: "swap",
    preload: true,
    adjustFontFallback: true,
});

export const cormorantHeavy = Cormorant_Garamond({
    variable: "--font-cormorant-heavy",
    subsets: ["latin"],
    weight: "700",
    display: "swap",
    preload: false,
    adjustFontFallback: true,
});

export const barlowCondensed = Barlow_Condensed({
    variable: "--font-barlow",
    subsets: ["latin"],
    weight: ["500", "600", "700"],
    display: "swap",
    preload: false,
    adjustFontFallback: true,
});

/** The same font classes the root document puts on `<html>`. */
export const fontClassName = `${inter.variable} ${cormorantGaramond.variable} ${cormorantHeavy.variable} ${barlowCondensed.variable} h-full antialiased`;
