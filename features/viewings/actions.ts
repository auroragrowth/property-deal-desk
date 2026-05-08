"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { getUserIdOrNull } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import {
  viewingPhotos,
  viewingRooms,
  viewings,
} from "@/lib/db/schema";
import {
  getSupabaseAdminClient,
  SupabaseAdminMissingError,
  VIEWING_PHOTOS_BUCKET,
} from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";

export type ActionResult =
  | { ok: true; id?: string }
  | { error: string };

// ─── Create + update + delete a viewing ─────────────────────────────

export async function createViewing(): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };

  const [row] = await db
    .insert(viewings)
    .values({ userId, visitedAt: new Date() })
    .returning({ id: viewings.id });

  await logAudit({
    actorUserId: userId,
    action: "create",
    entity: "deal", // 'viewing' not in current AuditEntity enum — re-use 'deal'
    entityId: row.id,
    after: { type: "viewing" },
  });

  redirect(`/viewings/${row.id}/edit`);
}

export async function updateViewingHeader(
  viewingId: string,
  patch: {
    propertyUrl?: string | null;
    propertyAddress?: string | null;
    propertyPostcode?: string | null;
    propertyPricePence?: number | null;
    overallNotes?: string | null;
  },
): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };

  const updateValues: Partial<typeof viewings.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (patch.propertyUrl !== undefined) updateValues.propertyUrl = patch.propertyUrl;
  if (patch.propertyAddress !== undefined)
    updateValues.propertyAddress = patch.propertyAddress;
  if (patch.propertyPostcode !== undefined)
    updateValues.propertyPostcode = patch.propertyPostcode
      ? patch.propertyPostcode.replace(/\s+/g, "").toUpperCase()
      : null;
  if (patch.propertyPricePence !== undefined)
    updateValues.propertyPricePence = patch.propertyPricePence;
  if (patch.overallNotes !== undefined)
    updateValues.overallNotes = patch.overallNotes;

  await db
    .update(viewings)
    .set(updateValues)
    .where(and(eq(viewings.id, viewingId), eq(viewings.userId, userId)));

  revalidatePath(`/viewings/${viewingId}/edit`);
  revalidatePath(`/viewings/${viewingId}`);
  return { ok: true };
}

export async function deleteViewing(viewingId: string): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };

  // Best-effort cleanup of photos in storage. Soft-fail: even if storage
  // wipe fails, the cascade delete keeps the DB consistent.
  try {
    const photos = await db
      .select({ storagePath: viewingPhotos.storagePath })
      .from(viewingPhotos)
      .where(eq(viewingPhotos.viewingId, viewingId));
    if (photos.length > 0) {
      const admin = getSupabaseAdminClient();
      await admin.storage
        .from(VIEWING_PHOTOS_BUCKET)
        .remove(photos.map((p) => p.storagePath));
    }
  } catch (err) {
    if (!(err instanceof SupabaseAdminMissingError)) {
      console.error("[viewings] storage cleanup failed", err);
    }
  }

  await db
    .delete(viewings)
    .where(and(eq(viewings.id, viewingId), eq(viewings.userId, userId)));

  await logAudit({
    actorUserId: userId,
    action: "delete",
    entity: "deal",
    entityId: viewingId,
    before: { type: "viewing" },
  });

  redirect("/viewings");
}

// ─── Rooms ──────────────────────────────────────────────────────────

export async function addRoom(
  viewingId: string,
  name: string,
): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };
  const trimmed = name.trim().slice(0, 80);
  if (!trimmed) return { error: "Room name required." };

  // Ensure the viewing belongs to this user — RLS would catch it
  // otherwise via the parent FK, but Drizzle bypasses RLS server-side.
  const owns = await db.query.viewings.findFirst({
    where: and(eq(viewings.id, viewingId), eq(viewings.userId, userId)),
  });
  if (!owns) return { error: "Viewing not found." };

  const last = await db
    .select({ position: viewingRooms.position })
    .from(viewingRooms)
    .where(eq(viewingRooms.viewingId, viewingId))
    .orderBy(desc(viewingRooms.position))
    .limit(1);
  const nextPos = (last[0]?.position ?? -1) + 1;

  const [row] = await db
    .insert(viewingRooms)
    .values({ viewingId, name: trimmed, position: nextPos })
    .returning({ id: viewingRooms.id });

  revalidatePath(`/viewings/${viewingId}/edit`);
  return { ok: true, id: row.id };
}

export async function updateRoom(
  viewingId: string,
  roomId: string,
  patch: { name?: string; notes?: string | null },
): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };

  const owns = await db.query.viewings.findFirst({
    where: and(eq(viewings.id, viewingId), eq(viewings.userId, userId)),
  });
  if (!owns) return { error: "Viewing not found." };

  const update: Partial<typeof viewingRooms.$inferInsert> = {};
  if (patch.name !== undefined) update.name = patch.name.trim().slice(0, 80);
  if (patch.notes !== undefined) update.notes = patch.notes;

  await db
    .update(viewingRooms)
    .set(update)
    .where(
      and(
        eq(viewingRooms.id, roomId),
        eq(viewingRooms.viewingId, viewingId),
      ),
    );

  revalidatePath(`/viewings/${viewingId}/edit`);
  return { ok: true };
}

export async function deleteRoom(
  viewingId: string,
  roomId: string,
): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };

  const owns = await db.query.viewings.findFirst({
    where: and(eq(viewings.id, viewingId), eq(viewings.userId, userId)),
  });
  if (!owns) return { error: "Viewing not found." };

  await db
    .delete(viewingRooms)
    .where(
      and(
        eq(viewingRooms.id, roomId),
        eq(viewingRooms.viewingId, viewingId),
      ),
    );

  revalidatePath(`/viewings/${viewingId}/edit`);
  return { ok: true };
}

// ─── Photo upload ───────────────────────────────────────────────────

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8 MB

export async function uploadPhoto(
  formData: FormData,
): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };

  const viewingId = String(formData.get("viewingId") ?? "");
  const roomId = String(formData.get("roomId") ?? "") || null;
  const file = formData.get("file");

  if (!viewingId) return { error: "viewingId required." };
  if (!(file instanceof File)) return { error: "No file uploaded." };
  if (file.size > MAX_PHOTO_BYTES)
    return {
      error: `Photo too big (max ${MAX_PHOTO_BYTES / 1024 / 1024} MB).`,
    };
  if (!file.type.startsWith("image/"))
    return { error: "File is not an image." };

  // Ownership check.
  const owns = await db.query.viewings.findFirst({
    where: and(eq(viewings.id, viewingId), eq(viewings.userId, userId)),
  });
  if (!owns) return { error: "Viewing not found." };

  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch {
    return {
      error:
        "Photo storage isn't configured (missing SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const photoId = randomUUID();
  const path = `${userId}/${viewingId}/${photoId}.${ext}`;

  const buf = Buffer.from(await file.arrayBuffer());
  const { error: upErr } = await admin.storage
    .from(VIEWING_PHOTOS_BUCKET)
    .upload(path, buf, { contentType: file.type, upsert: false });
  if (upErr) {
    return { error: `Storage upload failed: ${upErr.message}` };
  }

  // Position = max+1 in the same room (or in the viewing if unrooted).
  const positionScope = roomId
    ? eq(viewingPhotos.roomId, roomId)
    : eq(viewingPhotos.viewingId, viewingId);
  const last = await db
    .select({ position: viewingPhotos.position })
    .from(viewingPhotos)
    .where(positionScope)
    .orderBy(desc(viewingPhotos.position))
    .limit(1);
  const nextPos = (last[0]?.position ?? -1) + 1;

  const [row] = await db
    .insert(viewingPhotos)
    .values({
      id: photoId,
      viewingId,
      roomId,
      storagePath: path,
      position: nextPos,
    })
    .returning({ id: viewingPhotos.id });

  revalidatePath(`/viewings/${viewingId}/edit`);
  revalidatePath(`/viewings/${viewingId}`);
  return { ok: true, id: row.id };
}

export async function deletePhoto(
  viewingId: string,
  photoId: string,
): Promise<ActionResult> {
  const userId = await getUserIdOrNull();
  if (!userId) return { error: "Unauthorised" };

  const owns = await db.query.viewings.findFirst({
    where: and(eq(viewings.id, viewingId), eq(viewings.userId, userId)),
  });
  if (!owns) return { error: "Viewing not found." };

  const photo = await db.query.viewingPhotos.findFirst({
    where: and(
      eq(viewingPhotos.id, photoId),
      eq(viewingPhotos.viewingId, viewingId),
    ),
  });
  if (!photo) return { error: "Photo not found." };

  try {
    const admin = getSupabaseAdminClient();
    await admin.storage
      .from(VIEWING_PHOTOS_BUCKET)
      .remove([photo.storagePath]);
  } catch (err) {
    if (!(err instanceof SupabaseAdminMissingError)) {
      console.error("[viewings] photo storage delete failed", err);
    }
  }

  await db
    .delete(viewingPhotos)
    .where(
      and(
        eq(viewingPhotos.id, photoId),
        eq(viewingPhotos.viewingId, viewingId),
      ),
    );

  revalidatePath(`/viewings/${viewingId}/edit`);
  revalidatePath(`/viewings/${viewingId}`);
  return { ok: true };
}
