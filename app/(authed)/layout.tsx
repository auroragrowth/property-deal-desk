import { getUserIdOrNull } from "@/lib/auth/server";
import { redirect } from "next/navigation";
import { Topbar } from "@/features/auth/topbar";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/sign-in");
  return (
    <>
      <a
        href="#main"
        className="bg-bg-surface text-text-primary border-accent sr-only rounded-md border-[0.5px] px-3 py-2 text-sm font-medium focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:outline-none"
      >
        Skip to main content
      </a>
      <Topbar />
      {children}
    </>
  );
}
