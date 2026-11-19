import { IMPERSONATION_COOKIE } from "@/app/lib/auth/impersonation-cookie";
import { stopImpersonation } from "@/app/(site)/admin/impersonation-actions";
import { createSupabaseServerClient } from "@/app/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

/** Ends the session and returns home. The guide page posts here instead of calling an action. */
export async function POST(request: Request) {
    if ((await cookies()).has(IMPERSONATION_COOKIE)) return stopImpersonation();
    const supabase = await createSupabaseServerClient();
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/", request.url), 303);
}
