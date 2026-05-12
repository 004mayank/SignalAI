import { NextResponse } from "next/server";
import { recalcAllVelocities } from "@/server/services/recalc-velocity";

function requireAdminKey(req: Request): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return true;
  return req.headers.get("x-admin-key") === key;
}

// POST /api/admin/recalc-velocity — backfill TrendStat from articles and recompute velocity
export async function POST(req: Request) {
  if (!requireAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await recalcAllVelocities();
  return NextResponse.json({ data: result });
}
