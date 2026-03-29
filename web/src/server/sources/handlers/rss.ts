import Parser from "rss-parser";
import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { stripHtml, truncate } from "@/lib/text";

export async function ingestRSS(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const parser = new Parser();
  const feed = await parser.parseURL(source.url);

  const items = (feed.items ?? []).slice(0, limit);
  return items
    .map((item) => {
      const url = item.link;
      const title = item.title;
      if (!url || !title) return null;

      const it = item as unknown as {
        contentSnippet?: string;
        content?: string;
        summary?: string;
        pubDate?: string;
      };

      const rawContent = it.contentSnippet || it.content || it.summary || "";
      const content = truncate(stripHtml(String(rawContent)), 8000);
      const createdAt = it.pubDate ? new Date(it.pubDate) : new Date();

      return {
        title,
        content,
        source: source.name,
        source_type: source.type,
        layer: source.layer,
        url,
        created_at: createdAt,
        engagement: {},
      } satisfies NormalizedItem;
    })
    .filter((x): x is NormalizedItem => Boolean(x));
}
