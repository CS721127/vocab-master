"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { signupErrorDestination } from "@/lib/auth-feedback";

const message = (page: string, error: string): never =>
  redirect(`${page}?error=${encodeURIComponent(error)}`);

export async function authenticate(formData: FormData) {
  const signup = formData.get("mode") === "signup";
  const page = signup ? "/signup" : "/login";
  if (!isSupabaseConfigured())
    message(
      page,
      "Cloud accounts are not configured yet. You can explore the demo while setup is completed.",
    );
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
    email.length > 254 ||
    password.length < 6 ||
    password.length > 128
  )
    message(
      page,
      "Enter a valid email and a password between 6 and 128 characters.",
    );
  const supabase = await createClient();
  if (signup) {
    const requestHeaders = await headers();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL || requestHeaders.get("origin");
    if (!siteUrl)
      message(
        page,
        "The site address is not configured. Please contact the site owner.",
      );
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${siteUrl}/auth/callback` },
    });
    if (error) redirect(signupErrorDestination(error.code));
    if (data.session) redirect("/dashboard");
    redirect(
      "/signup?message=Check%20your%20email%20to%20confirm%20your%20account.%20Open%20the%20link%20in%20this%20browser.",
    );
  }
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error)
    message(
      page,
      error.code === "email_not_confirmed"
        ? "Please confirm your email before signing in."
        : "Unable to sign in. Check your email and password and try again.",
    );
  redirect("/dashboard");
}

export async function signOut() {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error("Unable to sign out. Please try again.");
  redirect("/login");
}
