import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/config";

export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured()) {
    return request.nextUrl.pathname.startsWith("/dashboard")
      ? NextResponse.redirect(new URL("/login", request.url))
      : NextResponse.next();
  }
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookies) {
          cookies.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookies.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  if (
    (!user && path.startsWith("/dashboard")) ||
    (user && ["/login", "/signup"].includes(path))
  ) {
    const redirect = NextResponse.redirect(
      new URL(user ? "/dashboard" : "/login", request.url),
    );
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  }
  return response;
}
export const config = { matcher: ["/dashboard/:path*", "/login", "/signup"] };
