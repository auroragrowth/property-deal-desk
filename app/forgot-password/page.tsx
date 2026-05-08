import Link from "next/link";
import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export const metadata = { title: "Reset your password · DealDesk" };

export default async function ForgotPasswordPage() {
  const userId = await getUserIdOrNull();
  if (userId) redirect("/dashboard");

  return (
    <main
      id="main"
      className="bg-bg-page mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"
    >
      <header className="mb-8 text-center">
        <p className="text-text-tertiary mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          Forgot it?
        </p>
        <h1 className="text-text-primary font-serif text-3xl">
          Reset your <em className="text-text-accent">password</em>
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          Enter the email you signed up with — we&apos;ll send a reset link.
        </p>
      </header>

      <ForgotPasswordForm />

      <p className="text-text-tertiary mt-8 text-center text-sm">
        Remembered it?{" "}
        <Link
          href="/sign-in"
          className="text-text-accent underline underline-offset-2"
        >
          Back to sign in
        </Link>
      </p>
    </main>
  );
}
