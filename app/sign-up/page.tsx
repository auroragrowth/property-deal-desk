import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { AuthForm } from "@/features/auth/auth-form";

export const metadata = { title: "Sign up · DealDesk" };

export default async function SignUpPage() {
  const userId = await getUserIdOrNull();
  if (userId) redirect("/dashboard");

  return (
    <main
      id="main"
      className="bg-bg-page mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"
    >
      <header className="mb-8 text-center">
        <p className="text-text-tertiary mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          Start your trial
        </p>
        <h1 className="text-text-primary font-serif text-3xl">
          Create your <em className="text-text-accent">DealDesk</em> account
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          14-day trial. Card captured at checkout, not now.
        </p>
      </header>

      <AuthForm mode="signup" />

      <p className="text-text-tertiary mt-8 text-center text-sm">
        Already a member?{" "}
        <Link
          href="/sign-in"
          className="text-text-accent underline underline-offset-2"
        >
          Sign in
        </Link>
      </p>
      <p className="text-text-tertiary mt-4 text-center text-xs">
        By creating an account you agree to our{" "}
        <Link
          href="/terms"
          className="text-text-accent underline underline-offset-2"
        >
          terms
        </Link>{" "}
        and{" "}
        <Link
          href="/privacy"
          className="text-text-accent underline underline-offset-2"
        >
          privacy policy
        </Link>
        .
      </p>
    </main>
  );
}
