import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq } from "drizzle-orm";
import { renderToBuffer } from "@react-pdf/renderer";
import { getUserIdOrNull } from "@/lib/auth/server";
import { db } from "@/lib/db/client";
import { dealResults, deals } from "@/lib/db/schema";
import { getViewing, signPhotoUrls } from "@/features/viewings/queries";
import {
  ViewingPdf,
  type ViewingPdfData,
} from "@/features/viewings/pdf/document";

// Render-and-stream a branded PDF for a viewing.
//
// Pulls the latest deal_result for any deal linked to this viewing's
// property so the analyser numbers show up on page 2. Photos use the
// same 1-hour signed Storage URLs the web page uses — react-pdf
// fetches them server-side during render.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = await getUserIdOrNull();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "auth", message: "Unauthorised" } },
      { status: 401 },
    );
  }
  const { id } = await params;

  const viewing = await getViewing(userId, id);
  if (!viewing) {
    return NextResponse.json(
      { error: { code: "not_found", message: "Viewing not found" } },
      { status: 404 },
    );
  }

  const allPaths = viewing.rooms.flatMap((r) =>
    r.photos.map((p) => p.storagePath),
  );
  const signed = await signPhotoUrls(allPaths);

  let dealForPdf: ViewingPdfData["deal"] = null;
  if (viewing.propertyId) {
    const linkedDeal = await db.query.deals.findFirst({
      where: and(
        eq(deals.userId, userId),
        eq(deals.propertyId, viewing.propertyId),
      ),
    });
    if (linkedDeal) {
      const [latest] = await db
        .select()
        .from(dealResults)
        .where(eq(dealResults.dealId, linkedDeal.id))
        .orderBy(desc(dealResults.calculatedAt))
        .limit(1);
      if (latest) {
        const o = latest.outputs as Record<string, number | null | undefined>;
        dealForPdf = {
          pass: latest.pass,
          grossYield: (o.gross_yield as number) ?? null,
          netYield: (o.net_yield as number) ?? null,
          grossRoce: (o.gross_roce as number) ?? null,
          netRoce: (o.net_roce as number) ?? null,
          moneyLeftIn: (o.money_left_in as number) ?? null,
          allMoneyOutOffer: (o.all_money_out_offer as number) ?? null,
          monthlyCashflow: (o.monthly_cashflow as number) ?? null,
          monthlyMortgage: (o.monthly_mortgage as number) ?? null,
          stampDuty: (o.stamp_duty as number) ?? null,
          refinanceBudget: (o.refinance_budget as number) ?? null,
          passReasons: latest.passReasons ?? [],
          failReasons: latest.failReasons ?? [],
        };
      }
    }
  }

  const data: ViewingPdfData = {
    generatedAtIso: new Date().toISOString(),
    viewing: {
      visitedAt: viewing.visitedAt ? viewing.visitedAt.toISOString() : null,
      propertyAddress: viewing.propertyAddress,
      propertyPostcode: viewing.propertyPostcode,
      propertyPricePence: viewing.propertyPricePence,
      propertyBedrooms: viewing.propertyBedrooms,
      propertyRentPcmPence: viewing.propertyRentPcmPence,
      propertyUrl: viewing.propertyUrl,
      overallNotes: viewing.overallNotes,
    },
    rooms: viewing.rooms.map((r) => ({
      id: r.id,
      name: r.name,
      notes: r.notes,
      photos: r.photos
        .map((p) => ({ id: p.id, signedUrl: signed[p.storagePath] ?? "" }))
        .filter((p) => p.signedUrl),
    })),
    deal: dealForPdf,
  };

  const buffer = await renderToBuffer(<ViewingPdf data={data} />);
  // Copy into a fresh Uint8Array<ArrayBuffer> so Blob's BlobPart type
  // accepts it. Node's Buffer.buffer is ArrayBufferLike which can
  // include SharedArrayBuffer; Blob only wants real ArrayBuffer.
  const ab = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(ab).set(buffer);
  const blob = new Blob([ab], { type: "application/pdf" });

  const slug = (viewing.propertyAddress ?? "viewing")
    .replace(/[^a-zA-Z0-9-]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 50);
  const filename = `dealdesk-viewing-${slug || "report"}.pdf`;

  return new NextResponse(blob, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
