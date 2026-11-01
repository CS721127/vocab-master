import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";
export function GET() {
  const configured = isSupabaseConfigured();
  return NextResponse.json(
    {
      status: configured ? "ok" : "configuration_required",
      services: {
        accounts: configured,
        ai: Boolean(process.env.GEMMA_API_KEY),
      },
    },
    {
      status: configured ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    },
  );
}
