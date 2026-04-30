import "server-only";
import { db } from "@/lib/db/client";
import { auditLog } from "@/lib/db/schema";

// Brief §13 acceptance: audit log captures every state change to subscriptions,
// watchlist, and deals. Server-side Drizzle bypasses RLS by design, so we log
// these mutations explicitly from API routes and webhook handlers.

export type AuditEntity =
  | "subscription"
  | "watchlist"
  | "saved_filter"
  | "deal"
  | "deal_result";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "trial_started"
  | "trial_ended"
  | "payment_failed"
  | "payment_succeeded"
  | "plan_changed";

export type AuditEntry = {
  actorUserId: string | null;
  action: AuditAction;
  entity: AuditEntity;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
};

export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await db.insert(auditLog).values({
      actorUserId: entry.actorUserId,
      action: entry.action,
      entity: entry.entity,
      entityId: entry.entityId ?? null,
      before:
        entry.before === undefined
          ? null
          : (entry.before as Record<string, unknown>),
      after:
        entry.after === undefined
          ? null
          : (entry.after as Record<string, unknown>),
      ip: entry.ip ?? null,
    });
  } catch (err) {
    // Audit must never break a user-facing request.
    console.error("[audit] insert failed", err);
  }
}
