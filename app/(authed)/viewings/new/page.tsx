import { redirect } from "next/navigation";
import { getUserIdOrNull } from "@/lib/auth/server";
import { createViewing } from "@/features/viewings/actions";

// Creates a fresh viewing and redirects to the capture page.
// Stays as a Server Component — no UI to render.
export default async function NewViewingPage() {
  const userId = await getUserIdOrNull();
  if (!userId) redirect("/sign-in?next=/viewings/new");

  await createViewing();
  // createViewing already redirects, but TS wants a return.
  redirect("/viewings");
}
