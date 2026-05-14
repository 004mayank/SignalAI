import Parser from "rss-parser";
import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { stripHtml, truncate } from "@/lib/text";

const RSS_TIMEOUT_MS = 10_000;

export async function ingestRSS(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const parser = new Parser();
  // rss-parser's parseURL has no built-in timeout; race against a rejection.
  const feed = await Promise.race([
    parser.parseURL(source.url),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`RSS timeout: ${source.url}`)), RSS_TIMEOUT_MS),
    ),
  ]);

  const items = (feed.items ?? []).slice(0, limit);
  return items
    .flatMap((item) => {
      const url = item.link;
      const title = item.title;
      if (!url || !title) return [];

      const it = item as unknown as {
        contentSnippet?: string;
        content?: string;
        summary?: string;
        pubDate?: string;
      };

      const rawContent = (it.contentSnippet || it.content || it.summary || "").trim();
      // Skip items with no content at all — the LLM gets nothing useful.
      if (!rawContent) return [];

      const content = truncate(stripHtml(rawContent), 8000);
      const pubDate = it.pubDate ? new Date(it.pubDate) : null;
      const createdAt = pubDate && !isNaN(pubDate.getTime()) ? pubDate : new Date();

      return [{
        title,
        content,
        source: source.name,
        source_type: source.type,
        layer: source.layer,
        url,
        created_at: createdAt,
        engagement: {},
      } satisfies NormalizedItem];
    });
}
