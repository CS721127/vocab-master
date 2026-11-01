import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";

export const dynamic = "force-dynamic";
export async function GET() {
  const configured = isSupabaseConfigured();
  let accounts = false;
  if (configured) {
    try {
      const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      const responses = await Promise.all(
        ["/auth/v1/settings", "/rest/v1/lists?select=id&limit=0", "/rest/v1/words?select=id&limit=0"].map(path =>
          fetch(new URL(path, base), {
            headers: { apikey: key, Authorization: `Bearer ${key}` },
            cache: "no-store", signal: AbortSignal.timeout(3000),
          }),
        ),
      );
      accounts = responses.every(response => response.ok);
    } catch { /* Report failed readiness without exposing connection details. */ }
  }
  return NextResponse.json(
    { status: accounts ? "ok" : configured ? "unavailable" : "configuration_required", services: { accounts, ai: Boolean(process.env.GEMMA_API_KEY) } },
    { status: accounts ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
