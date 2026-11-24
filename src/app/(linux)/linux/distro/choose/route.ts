import { NextResponse } from "next/server";
import distroData from "../../content/distros.json";
import type { Distro } from "../../guide-model";

const distros = distroData as Distro[];

/** Remembers a distro for the next full page load and returns to the picker. */
export async function POST(request: Request) {
    const form = await request.formData();
    const id = String(form.get("id") ?? "");
    const known = distros.some((distro) => distro.id === id);
    const resume = String(form.get("resume") ?? "");
    const target = resume.startsWith("/linux/") && !resume.includes("//") && !resume.includes("\\") ? resume : "/linux/distro";
    const response = NextResponse.redirect(new URL(target, request.url), 303);
    if (known) response.cookies.set("blc-distro-v1", id, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return response;
}
