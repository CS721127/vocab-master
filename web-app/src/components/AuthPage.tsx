import Link from "next/link";
import { ArrowLeft, BookOpen } from "lucide-react";
import AuthForm from "./AuthForm";
import { isSupabaseConfigured } from "@/lib/config";

export default function AuthPage({
  signup,
  error,
  message,
}: {
  signup: boolean;
  error?: string;
  message?: string;
}) {
  return (
    <main className="auth-layout">
      <aside className="auth-story">
        <Link href="/" className="brand">
          <BookOpen size={26} /> Vocab Master
        </Link>
        <div>
          <h2>
            New words.
            <br />
            New possibilities.
          </h2>
          <p>
            Build a vocabulary that stays with you. Collect, connect, and
            practice at your own pace.
          </p>
        </div>
        <span className="text-sm opacity-70">
          Your personal space for learning.
        </span>
      </aside>
      <section className="auth-content">
        <Link
          className="inline-flex items-center gap-2 text-sm text-muted mb-12"
          href="/"
        >
          <ArrowLeft size={16} /> Back to home
        </Link>
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-semibold tracking-tight mt-3 mb-3">
            {signup ? "Make room for new words." : "Welcome back."}
          </h1>
          <p className="text-muted mb-8">
            {signup
              ? "Create your account and start your collection."
              : "Sign in to pick up where you left off."}
          </p>
          <AuthForm
            signup={signup}
            configured={isSupabaseConfigured()}
            error={error}
            message={message}
          />
        </div>
      </section>
    </main>
  );
}
