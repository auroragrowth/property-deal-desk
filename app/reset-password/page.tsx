import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { ResetPasswordForm } from "@/features/auth/reset-password-form";

export const metadata = { title: "Set a new password · DealDesk" };

// Reached via the link in the password-reset email. Supabase signs the
// user in automatically when they click the link (via /auth/callback),
// so the user is authed by the time they land here. If they're not
// authed, the link expired or was reused — bounce them back to sign-in.

export default async function ResetPasswordPage() {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/sign-in?error=Reset+link+expired+or+invalid.");

  return (
    <main
      id="main"
      className="bg-bg-page mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 py-12"
    >
      <header className="mb-8 text-center">
        <p className="text-text-tertiary mb-2 font-mono text-xs tracking-[0.18em] uppercase">
          Almost there
        </p>
        <h1 className="text-text-primary font-serif text-3xl">
          Set a <em className="text-text-accent">new password</em>
        </h1>
        <p className="text-text-secondary mt-2 text-sm">
          8+ characters. You&apos;ll be signed in straight after.
        </p>
      </header>

      <ResetPasswordForm />
    </main>
  );
}
