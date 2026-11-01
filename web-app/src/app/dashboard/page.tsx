import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/config";
import { redirect } from "next/navigation";
import VocabDashboard from "@/components/VocabDashboard";
import AppHeader from "@/components/AppHeader";
export const dynamic = "force-dynamic";
export const metadata = { title: "Your collection" };
export default async function Dashboard() {
  if (!isSupabaseConfigured()) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  async function loadWords() {
    const all = [];
    for (let offset = 0; ; offset += 1000) {
      const result = await supabase
        .from("words")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .order("id")
        .range(offset, offset + 999);
      if (result.error) return { data: [], error: result.error };
      all.push(...result.data);
      if (result.data.length < 1000) return { data: all, error: null };
    }
  }
  const [words, lists] = await Promise.all([
    loadWords(),
    supabase
      .from("lists")
      .select("id,name")
      .eq("user_id", user.id)
      .order("created_at"),
  ]);
  if (words.error || lists.error)
    throw new Error(
      "Unable to load your collection. Please check the database configuration and try again.",
    );
  return (
    <>
      <AppHeader email={user.email} />
      <main>
        <VocabDashboard
          serverWords={(words.data ?? []).map((w) => ({
            ...w,
            example: w.example ?? "",
            notes: w.notes ?? "",
          }))}
          serverLists={lists.data ?? []}
          userId={user.id}
        />
      </main>
    </>
  );
}
