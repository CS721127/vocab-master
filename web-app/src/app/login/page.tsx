import AuthPage from "@/components/AuthPage";
export const metadata = { title: "Sign in" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  return <AuthPage signup={false} {...await searchParams} />;
}
