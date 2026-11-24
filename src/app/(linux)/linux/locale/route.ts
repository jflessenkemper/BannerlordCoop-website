import { resolveLocale } from "@/app/lib/localization/registry";
import { localeCookie, localeCookieOptions } from "@/app/lib/localization/types";
import { NextResponse } from "next/server";

/** Saves a guide language and returns to the same Linux page. */
export async function POST(request: Request) {
    const form = await request.formData();
    const locale = resolveLocale(String(form.get("locale") ?? ""));
    const next = String(form.get("next") ?? "/linux");
    const safe = next.startsWith("/linux") && !next.startsWith("//") ? next : "/linux";
    const response = NextResponse.redirect(new URL(safe, request.url), 303);
    response.cookies.set(localeCookie, locale, localeCookieOptions);
    return response;
}
