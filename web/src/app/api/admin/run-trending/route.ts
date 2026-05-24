import { NextResponse } from "next/server";
import { runTrendingScrape } from "@/server/services/trending";
import { requireAdminKey } from "@/lib/admin-auth";

// POST /api/admin/run-trending — manually trigger the GitHub trending scrape
export async function POST(req: Request) {
  if (!requireAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runTrendingScrape();
  return NextResponse.json({ data: result });
}
