import { NextResponse } from "next/server";
import { z } from "zod";
import { runIngestion } from "@/server/services/ingest";
import { requireAdminKey } from "@/lib/admin-auth";

const BodySchema = z
  .object({
    source_names: z.array(z.string()).optional(),
    limit: z.number().int().min(1).max(50).optional(),
  })
  .optional();

// POST /api/admin/ingest — manually trigger ingestion for all or specific sources
export async function POST(req: Request) {
  if (!requireAdminKey(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = BodySchema.safeParse(await req.json().catch(() => undefined));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const result = await runIngestion({
    sourceNames: body.data?.source_names,
    limitPerSource: body.data?.limit ?? 10,
  });

  return NextResponse.json({ data: result });
}
