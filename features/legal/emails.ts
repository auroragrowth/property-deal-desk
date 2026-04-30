import "server-only";
import type Stripe from "stripe";
import { Resend } from "resend";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL ?? "hello@dealdesk.com";
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://dealdesk.com";

function getResend(): Resend | null {
  if (!apiKey) return null;
  return new Resend(apiKey);
}

async function userEmail(clerkUserId: string): Promise<string | null> {
  const u = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkUserId),
  });
  return u?.email ?? null;
}

export async function sendTrialEndingEmail(
  clerkUserId: string,
  sub: Stripe.Subscription,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(
      `[email] trial_ending stub for user=${clerkUserId} sub=${sub.id} (no RESEND_API_KEY)`,
    );
    return;
  }
  const to = await userEmail(clerkUserId);
  if (!to) return;
  const trialEnd = sub.trial_end
    ? new Date(sub.trial_end * 1000).toLocaleDateString("en-GB")
    : "soon";
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "Your DealDesk trial ends soon",
      html: `
<p>Your free trial ends on <strong>${trialEnd}</strong>. After that, your card will be charged for the plan you picked at sign-up.</p>
<p>If you'd like to change plan or cancel, manage billing here:</p>
<p><a href="${appUrl}/settings">${appUrl}/settings</a></p>
<p>Thanks for trying DealDesk.</p>
      `,
    });
  } catch (err) {
    console.error("[email] trial_ending send failed", err);
  }
}

export async function sendDunningEmail(
  clerkUserId: string,
  invoice: Stripe.Invoice,
): Promise<void> {
  const resend = getResend();
  if (!resend) {
    console.log(
      `[email] dunning stub for user=${clerkUserId} invoice=${invoice.id} (no RESEND_API_KEY)`,
    );
    return;
  }
  const to = await userEmail(clerkUserId);
  if (!to) return;
  try {
    await resend.emails.send({
      from: fromEmail,
      to,
      subject: "We couldn't take payment for DealDesk",
      html: `
<p>We tried to charge your card for DealDesk and it didn't go through. Stripe will retry automatically over the next few days.</p>
<p>You can update your payment details now to avoid an interruption:</p>
<p><a href="${appUrl}/settings">${appUrl}/settings</a></p>
<p>If you've cancelled and ignore this email, your account will move to read-only at the end of the period.</p>
      `,
    });
  } catch (err) {
    console.error("[email] dunning send failed", err);
  }
}
