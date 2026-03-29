import { NextResponse } from "next/server";
import Parser from "rss-parser";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { analyzeArticleWithLLM } from "@/lib/ai";
import { getEnv } from "@/lib/env";
import { stripHtml, truncate } from "@/lib/text";

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

  const limit = body.data?.limit ?? 15;
  const parser = new Parser();

  let fetched = 0;
  let created = 0;
  let skipped = 0;

  for (const feedUrl of feeds) {
    const feed = await parser.parseURL(feedUrl);
    const items = (feed.items ?? []).slice(0, limit);

    for (const item of items) {
      fetched++;
      const url = item.link;
      const title = item.title;
      if (!url || !title) {
        skipped++;
        continue;
      }

      const exists = await prisma.article.findUnique({ where: { url } });
      if (exists) {
        skipped++;
        continue;
      }

      const source = feed.title || new URL(feedUrl).hostname;
      const it = item as unknown as {
        contentSnippet?: string;
        content?: string;
        summary?: string;
      };
      const rawContent = it.contentSnippet || it.content || it.summary || "";
      const content = truncate(stripHtml(String(rawContent)), 8000);

      const ai = await analyzeArticleWithLLM({
        title,
        source,
        url,
        content,
      });

      await prisma.article.create({
        data: {
          title,
          url,
          source,
          content,
          summary: ai.tldr,
          whatHappened: ai.what_happened,
          whyItMatters: ai.why_it_matters,
          useCase: ai.use_case,
          category: ai.category,
          relevanceScore: ai.relevance_score,
        },
      });

      created++;
    }
  }

  return NextResponse.json({ feeds, fetched, created, skipped });
}
