import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SOURCES } from "@/server/sources/registry";
import { requireAdminKey } from "@/lib/admin-auth";

// GET /api/admin/sources — source health overview
export async function GET(req: Request) {
  if (!requireAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const health = await prisma.sourceHealth.findMany({ orderBy: { sourceName: "asc" } });
  const healthMap = new Map(health.map((h) => [h.sourceName, h]));

  const sources = SOURCES.map((s) => ({
    name: s.name,
    type: s.type,
    layer: s.layer,
    weight: s.weight,
    health: healthMap.get(s.name) ?? null,
  }));

  return NextResponse.json({ data: sources });
}
