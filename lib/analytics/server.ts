import "server-only";
import { PostHog } from "posthog-node";

declare global {
  var __dealdesk_posthog__: PostHog | undefined;
}

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://eu.i.posthog.com";

function getClient(): PostHog | null {
  if (!key) return null;
  if (!globalThis.__dealdesk_posthog__) {
    globalThis.__dealdesk_posthog__ = new PostHog(key, {
      host,
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return globalThis.__dealdesk_posthog__;
}

// Brief §13: 8 named events.
export type AnalyticsEvent =
  | "signup"
  | "checkout_started"
  | "checkout_succeeded"
  | "property_pasted"
  | "watchlist_added"
  | "deal_analysed"
  | "filter_saved"
  | "plan_changed";

export async function track(
  distinctId: string,
  event: AnalyticsEvent,
  properties: Record<string, unknown> = {},
): Promise<void> {
  const client = getClient();
  if (!client) return;
  client.capture({ distinctId, event, properties });
  // Best-effort flush; never throw out of an analytics call.
  try {
    await client.flush();
  } catch {
    // ignore
  }
}
