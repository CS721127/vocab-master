"use client";
import { useFormStatus } from "react-dom";
import { authenticate } from "@/app/actions";
import Link from "next/link";

function Submit({ signup }: { signup: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button className="button primary w-full justify-center" disabled={pending}>
      {pending ? "Please wait…" : signup ? "Create account" : "Sign in"}{" "}
      <span aria-hidden="true">→</span>
    </button>
  );
}

export default function AuthForm({
  signup,
  configured,
  error,
  message,
}: {
  signup: boolean;
  configured: boolean;
  error?: string;
  message?: string;
}) {
  return (
    <form action={authenticate} className="grid gap-5">
      <input type="hidden" name="mode" value={signup ? "signup" : "login"} />
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {message && (
        <p role="status" className="notice">
          {message}
        </p>
      )}
      {!configured && (
        <p className="notice">
          Cloud accounts are awaiting setup.{" "}
          <Link className="underline" href="/demo">
            Try the demo
          </Link>{" "}
          in the meantime.
        </p>
      )}
      <label className="field">
        Email
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          maxLength={254}
          required
        />
      </label>
      <label className="field">
        Password
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={signup ? "new-password" : "current-password"}
          minLength={6}
          maxLength={128}
          placeholder={signup ? "At least 6 characters" : "Your password"}
          required
        />
      </label>
      <Submit signup={signup} />
      <p className="text-center text-sm text-muted">
        {signup ? "Already have an account? " : "New to Vocab Master? "}
        <Link
          className="font-semibold text-accent"
          href={signup ? "/login" : "/signup"}
        >
          {signup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
