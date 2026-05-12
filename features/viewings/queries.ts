import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import {
  viewingPhotos,
  viewingRooms,
  viewings,
} from "@/lib/db/schema";
import {
  getSupabaseAdminClient,
  VIEWING_PHOTOS_BUCKET,
  SupabaseAdminMissingError,
} from "@/lib/supabase/admin";

export type ViewingListItem = {
  id: string;
  visitedAt: Date | null;
  propertyAddress: string | null;
  propertyPostcode: string | null;
  propertyPricePence: number | null;
  propertyUrl: string | null;
  roomsCount: number;
  photosCount: number;
  thumbnailPath: string | null;
};

export type ViewingDetail = {
  id: string;
  userId: string;
  propertyId: string | null;
  propertyUrl: string | null;
  propertyAddress: string | null;
  propertyPostcode: string | null;
  propertyPricePence: number | null;
  propertyBedrooms: number | null;
  overallNotes: string | null;
  visitedAt: Date | null;
  rooms: {
    id: string;
    name: string;
    notes: string | null;
    position: number;
    photos: {
      id: string;
      storagePath: string;
      caption: string | null;
      position: number;
    }[];
  }[];
};

export async function listViewings(
  userId: string,
): Promise<ViewingListItem[]> {
  const rows = await db
    .select({
      id: viewings.id,
      visitedAt: viewings.visitedAt,
      propertyAddress: viewings.propertyAddress,
      propertyPostcode: viewings.propertyPostcode,
      propertyPricePence: viewings.propertyPricePence,
      propertyUrl: viewings.propertyUrl,
    })
    .from(viewings)
    .where(eq(viewings.userId, userId))
    .orderBy(desc(viewings.visitedAt));

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);

  // Pull rooms + photos counts and a thumbnail per viewing in one go.
  const [allRooms, allPhotos] = await Promise.all([
    db
      .select({
        viewingId: viewingRooms.viewingId,
        id: viewingRooms.id,
      })
      .from(viewingRooms)
      .where(inArray(viewingRooms.viewingId, ids)),
    db
      .select({
        viewingId: viewingPhotos.viewingId,
        storagePath: viewingPhotos.storagePath,
        position: viewingPhotos.position,
      })
      .from(viewingPhotos)
      .where(inArray(viewingPhotos.viewingId, ids))
      .orderBy(asc(viewingPhotos.position)),
  ]);

  const roomCounts = new Map<string, number>();
  for (const r of allRooms)
    roomCounts.set(r.viewingId, (roomCounts.get(r.viewingId) ?? 0) + 1);
  const photoCounts = new Map<string, number>();
  const thumbs = new Map<string, string>();
  for (const p of allPhotos) {
    photoCounts.set(p.viewingId, (photoCounts.get(p.viewingId) ?? 0) + 1);
    if (!thumbs.has(p.viewingId)) thumbs.set(p.viewingId, p.storagePath);
  }

  return rows.map((r) => ({
    ...r,
    roomsCount: roomCounts.get(r.id) ?? 0,
    photosCount: photoCounts.get(r.id) ?? 0,
    thumbnailPath: thumbs.get(r.id) ?? null,
  }));
}

export async function getViewing(
  userId: string,
  viewingId: string,
): Promise<ViewingDetail | null> {
  const row = await db.query.viewings.findFirst({
    where: and(eq(viewings.id, viewingId), eq(viewings.userId, userId)),
  });
  if (!row) return null;

  const [rooms, photos] = await Promise.all([
    db
      .select()
      .from(viewingRooms)
      .where(eq(viewingRooms.viewingId, viewingId))
      .orderBy(asc(viewingRooms.position)),
    db
      .select()
      .from(viewingPhotos)
      .where(eq(viewingPhotos.viewingId, viewingId))
      .orderBy(asc(viewingPhotos.position)),
  ]);

  const photosByRoom = new Map<string | null, typeof photos>();
  for (const p of photos) {
    const key = p.roomId ?? null;
    const list = photosByRoom.get(key) ?? [];
    list.push(p);
    photosByRoom.set(key, list);
  }

  return {
    id: row.id,
    userId: row.userId,
    propertyId: row.propertyId,
    propertyUrl: row.propertyUrl,
    propertyAddress: row.propertyAddress,
    propertyPostcode: row.propertyPostcode,
    propertyPricePence: row.propertyPricePence,
    propertyBedrooms: row.propertyBedrooms,
    overallNotes: row.overallNotes,
    visitedAt: row.visitedAt,
    rooms: rooms.map((r) => ({
      id: r.id,
      name: r.name,
      notes: r.notes,
      position: r.position,
      photos: (photosByRoom.get(r.id) ?? []).map((p) => ({
        id: p.id,
        storagePath: p.storagePath,
        caption: p.caption,
        position: p.position,
      })),
    })),
  };
}

// Generate signed URLs for a list of storage paths (1-hour lifetime).
// Pages that show photos use force-dynamic so URLs are regenerated on
// every visit — the 1 hour cushions long-session navigation. Errors
// are logged so we can spot bucket / service-role config issues.
export async function signPhotoUrls(
  paths: string[],
): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  let admin;
  try {
    admin = getSupabaseAdminClient();
  } catch (err) {
    if (err instanceof SupabaseAdminMissingError) {
      console.warn(
        "[viewings] photos not visible: SUPABASE_SERVICE_ROLE_KEY missing",
      );
      return {};
    }
    throw err;
  }

  const { data, error } = await admin.storage
    .from(VIEWING_PHOTOS_BUCKET)
    .createSignedUrls(paths, 60 * 60);
  if (error || !data) {
    console.error(
      "[viewings] createSignedUrls failed",
      error?.message ?? "no data",
    );
    return {};
  }

  const out: Record<string, string> = {};
  for (const item of data) {
    if (item.path && item.signedUrl) out[item.path] = item.signedUrl;
  }
  return out;
}
