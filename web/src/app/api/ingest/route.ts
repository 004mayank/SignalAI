import { NextResponse } from "next/server";
import { z } from "zod";
import { getEnv } from "@/lib/env";
import { runIngestion } from "@/server/services/ingest";

const BodySchema = z
  .object({
    feeds: z.array(z.string().url()).optional(),
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
  const feeds = body.data?.feeds ?? feedsFromEnv ?? [];

  if (feeds.length === 0) {
    return NextResponse.json(
      { error: "No feeds configured. Set RSS_FEEDS or pass {feeds:[...]}" },
      { status: 400 },
    );
  }

  const result = await runIngestion({
    feeds,
    limitPerFeed: body.data?.limit ?? 15,
  });

  return NextResponse.json(result);
}
