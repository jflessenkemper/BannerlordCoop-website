"use client";

import { createContext } from "react";
import type { Distro } from "./guide-model";

export type GuideContextValue = {
    distro: Distro | null;
    alone: boolean;
    openId?: string;
    onStatus: (message: string) => void;
    onTerm: (title: string, body: string, rect: DOMRect) => void;
};

export const GuideContext = createContext<GuideContextValue | null>(null);
