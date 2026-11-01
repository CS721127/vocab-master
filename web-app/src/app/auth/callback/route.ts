import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { safeNextPath } from "@/lib/vocabulary";

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const code = url.searchParams.get("code");
    const tokenHash = url.searchParams.get("token_hash");
    const result = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : tokenHash && url.searchParams.get("type") === "email"
        ? await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: "email",
          })
        : null;
    if (result && !result.error)
      return NextResponse.redirect(
        new URL(safeNextPath(url.searchParams.get("next")), url.origin),
      );
  }
  return NextResponse.redirect(
    new URL(
      "/login?error=The%20confirmation%20link%20is%20invalid%20or%20expired.%20Please%20try%20signing%20in%20or%20request%20a%20new%20confirmation%20email.",
      url.origin,
    ),
  );
}
