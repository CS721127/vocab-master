import AuthPage from "@/components/AuthPage";
export const metadata = { title: "Create account" };
export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  return <AuthPage signup {...await searchParams} />;
}
