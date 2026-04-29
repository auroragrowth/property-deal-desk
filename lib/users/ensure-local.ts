import { currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

// Lazily creates the local users row if it doesn't already exist.
// The Clerk webhook (app/api/clerk/webhook) is the canonical source of
// truth for this, but until ngrok is wired in dev (or a public webhook
// endpoint in prod) we self-heal on first authed write so FK constraints
// don't fail.
//
// Idempotent — safe to call from any authed route.

export async function ensureLocalUser(clerkUserId: string): Promise<void> {
  const user = await currentUser();
  if (!user || user.id !== clerkUserId) return;
  const email = user.emailAddresses[0]?.emailAddress;
  if (!email) return;
  await db
    .insert(users)
    .values({
      clerkId: clerkUserId,
      email,
      fullName:
        [user.firstName, user.lastName].filter(Boolean).join(" ") || null,
      role: "user",
    })
    .onConflictDoNothing({ target: users.clerkId });
}
