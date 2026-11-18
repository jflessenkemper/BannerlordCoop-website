"use client";

import { createContext } from "react";
import type { Distro } from "./guide-model";

export type GuideContextValue = {
    distro: Distro | null;
    alone: boolean;
    openId?: string;
    openTermKey: string | null;
    onStatus: (message: string) => void;
    onTerm: (key: string, title: string, body: string, trigger: HTMLButtonElement) => void;
};

export const GuideContext = createContext<GuideContextValue | null>(null);
