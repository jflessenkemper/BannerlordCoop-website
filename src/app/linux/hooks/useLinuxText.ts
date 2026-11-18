"use client";

import { useTranslations } from "@/app/lib/localization/client";
import type { TranslationParams } from "@/app/lib/localization/types";

/** Literal braces in log paths are not interpolation tokens. */
const LITERAL_BRACES: TranslationParams = { date: "{date}", time: "{time}" };

/** Site translator for the linux namespace, preserving `{date}` and `{time}` in prose. */
export function useLinuxText() {
    const translator = useTranslations("linux");
    return {
        ...translator,
        t(key: string, params: TranslationParams = {}) {
            return translator.t(key, { ...LITERAL_BRACES, ...params });
        },
    };
}
