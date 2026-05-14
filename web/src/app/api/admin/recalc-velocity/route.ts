import { NextResponse } from "next/server";
import { recalcAllVelocities } from "@/server/services/recalc-velocity";
import { requireAdminKey } from "@/lib/admin-auth";

// POST /api/admin/recalc-velocity — backfill TrendStat from articles and recompute velocity
export async function POST(req: Request) {
  if (!requireAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await recalcAllVelocities();
  return NextResponse.json({ data: result });
}
