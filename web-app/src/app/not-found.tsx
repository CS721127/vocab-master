import Link from "next/link";
export default function NotFound() {
  return (
    <main className="max-w-lg mx-auto px-6 py-24">
      <p className="eyebrow">404</p>
      <h1 className="text-3xl font-semibold my-4">
        This page isn’t in our collection.
      </h1>
      <Link href="/" className="button primary mt-4">
        Back to home
      </Link>
    </main>
  );
}
