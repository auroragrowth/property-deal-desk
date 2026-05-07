import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "Sign in · DealDesk" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const userId = await getUserIdOrNull();
  if (userId) redirect("/dashboard");
  const sp = await searchParams;

  return (
    <main
      id="main"
      className="bg-bg-page mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"
    >
      <header className="mb-8 text-center">
        <p className="text-text-tertiary mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          Welcome back
        </p>
        <h1 className="text-text-primary font-serif text-3xl">
          Sign in to <em className="text-text-accent">DealDesk</em>
        </h1>
      </header>

      {sp.error && (
        <p
          role="alert"
          className="border-fail-border bg-fail-bg text-fail-fg mb-6 rounded-md border-[0.5px] p-3 text-sm"
        >
          {sp.error}
        </p>
      )}

      <AuthForm mode="signin" />

      <p className="text-text-tertiary mt-8 text-center text-sm">
        New here?{" "}
        <Link
          href="/sign-up"
          className="text-text-accent underline underline-offset-2"
        >
          Create an account
        </Link>
      </p>
    </main>
  );
}
