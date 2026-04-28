import { currentUser } from "@clerk/nextjs/server";
import { UserButton } from "@clerk/nextjs";

export default async function SettingsPage() {
  const user = await currentUser();
  return (
    <main className="p-8">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-light">Settings</h1>
        <UserButton />
      </header>
      <section className="space-y-2 text-neutral-700">
        <div>
          <span className="text-sm text-neutral-500">Email · </span>
          <span>{user?.emailAddresses[0]?.emailAddress ?? "—"}</span>
        </div>
        <div>
          <span className="text-sm text-neutral-500">Name · </span>
          <span>{user?.fullName ?? "—"}</span>
        </div>
        <div>
          <span className="text-sm text-neutral-500">User ID · </span>
          <code className="font-mono text-xs">{user?.id ?? "—"}</code>
        </div>
      </section>
      <p className="mt-6 text-sm text-neutral-500">
        Account email, password, 2FA, and delete-account flows ship by week 12.
      </p>
    </main>
  );
}
