import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
import { checkSupabaseReadiness } from "@/lib/readiness";

export const dynamic = "force-dynamic";
export async function GET() {
  const configured = isSupabaseConfigured();
  let accounts = false;
  if (configured) {
    accounts = await checkSupabaseReadiness({
      baseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    });
  }
  return NextResponse.json(
    { status: accounts ? "ok" : configured ? "unavailable" : "configuration_required", services: { accounts, ai: Boolean(process.env.GEMMA_API_KEY) } },
    { status: accounts ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
