"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="max-w-lg mx-auto px-6 py-24">
      <h1 className="text-3xl font-semibold mb-4">
        We couldn’t load this page.
      </h1>
      <p className="text-muted mb-8">
        Please try again. If the problem continues, check that your connection
        is available and the cloud database has been configured.
      </p>
      <div className="flex gap-3">
        <button onClick={reset} className="button primary">
          Try again
        </button>
        <Link href="/" className="button secondary">
          Back to home
        </Link>
      </div>
    </main>
  );
}
