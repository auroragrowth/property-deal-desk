import { getUserIdOrNull } from "@/lib/auth/server";
import { NextRequest, NextResponse } from "next/server";
import { analyseProperty } from "@/features/deals/analyse";
import { logAudit } from "@/lib/audit";
import { track } from "@/lib/analytics/server";

export async function POST(req: NextRequest) {
  try {
    const userId = await getUserIdOrNull();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "auth", message: "Unauthorized" } },
        { status: 401 },
      );
    }

    const body = (await req.json().catch(() => ({}))) as {
      propertyId?: unknown;
      strategy?: unknown;
    };
    const propertyId =
      typeof body.propertyId === "string" ? body.propertyId : "";
    const strategy =
      typeof body.strategy === "string" ? body.strategy : "btl";
    if (!propertyId) {
      return NextResponse.json(
        { error: { code: "validation", message: "propertyId required" } },
        { status: 400 },
      );
    }

    const { deal, result } = await analyseProperty(userId, propertyId, {
      strategy,
    });

    await logAudit({
      actorUserId: userId,
      action: "create",
      entity: "deal_result",
      entityId: result.id,
      after: { dealId: deal.id, pass: result.pass, strategy },
    });
    await track(userId, "deal_analysed", {
      dealId: deal.id,
      pass: result.pass,
      strategy,
    });

    return NextResponse.json({ dealId: deal.id, resultId: result.id });
  } catch (err) {
    console.error("[deals POST]", err);
    return NextResponse.json(
      {
        error: {
          code: "server",
          message: (err as Error).message ?? "Server error",
        },
      },
      { status: 500 },
    );
  }
}
