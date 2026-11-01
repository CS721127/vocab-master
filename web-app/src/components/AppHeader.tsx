import Link from "next/link";
import { BookOpen, LogOut } from "lucide-react";
import { signOut } from "@/app/actions";
export default function AppHeader({
  email,
  demo = false,
}: {
  email?: string;
  demo?: boolean;
}) {
  return (
    <header className="app-header">
      <Link href="/" className="brand">
        <BookOpen size={24} />
        Vocab Master
      </Link>
      <div className="flex items-center gap-4">
        {demo ? (
          <>
            <span className="text-xs text-muted hidden sm:block">Demo</span>
            <Link href="/signup" className="button primary compact">
              Sign up <span aria-hidden="true">→</span>
            </Link>
          </>
        ) : (
          <>
            <span className="text-xs text-muted hidden sm:block">{email}</span>
            <form action={signOut}>
              <button
                className="icon-button"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut size={19} />
              </button>
            </form>
          </>
        )}
      </div>
    </header>
  );
}
