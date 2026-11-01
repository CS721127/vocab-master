import AppHeader from "@/components/AppHeader";
import VocabDashboard from "@/components/VocabDashboard";
export const metadata = { title: "Explore the demo" };
export default function Demo() {
  return (
    <>
      <AppHeader demo />
      <main>
        <VocabDashboard demo serverWords={[]} serverLists={[]} userId="demo" />
      </main>
    </>
  );
}
