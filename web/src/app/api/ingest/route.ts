import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { runIngestion } from "@/server/services/ingest";

const BodySchema = z
  .object({
    // Backward compatible RSS-only ingestion
    feeds: z.array(z.string().url()).optional(),

    // New: run the built-in source registry
    use_registry: z.boolean().optional(),
    source_names: z.array(z.string()).optional(),

    limit: z.number().int().min(1).max(50).optional(),
  })
  .optional();

export async function POST(req: Request) {
  const body = BodySchema.safeParse(await req.json().catch(() => undefined));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const env = getEnv();
  const feedsFromEnv = env.RSS_FEEDS?.split(",").map((s) => s.trim()).filter(Boolean);

  const wantRegistry = body.data?.use_registry === true;

  const feeds = body.data?.feeds ?? (wantRegistry ? undefined : feedsFromEnv);
  const sourceNames = body.data?.source_names;

  if (!wantRegistry && (!feeds || feeds.length === 0)) {
    return NextResponse.json(
      { error: "No feeds configured. Set RSS_FEEDS or pass {feeds:[...]}" },
      { status: 400 },
    );
  }

  const result = await runIngestion({
    feeds,
    sourceNames,
    limitPerSource: body.data?.limit ?? 15,
  });

  return NextResponse.json(result);
}
