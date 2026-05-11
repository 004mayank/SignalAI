import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SOURCES } from "@/server/sources/registry";

function requireAdminKey(req: Request): boolean {
  const key = process.env.ADMIN_API_KEY;
  if (!key) return true; // not configured — allow in dev
  return req.headers.get("x-admin-key") === key;
}

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
