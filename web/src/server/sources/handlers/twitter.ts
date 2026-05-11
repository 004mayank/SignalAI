import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";

// Twitter ingestion via Nitter RSS — no API key required at MVP.
// Each source.url should be a Nitter RSS endpoint, e.g.:
//   https://nitter.net/sama/rss
//   https://nitter.net/search/rss?q=AI+LLM
export async function ingestTwitter(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const resp = await fetch(source.url, {
    headers: { "User-Agent": "SignalAI/1.0 (+https://signalai.app)" },
  });
  if (!resp.ok) throw new Error(`Twitter/Nitter fetch failed: ${resp.status}`);

  const xml = await resp.text();
  const items = parseRssItems(xml);

  return items.slice(0, limit).map((item) => ({
    title: item.title.slice(0, 280),
    content: item.description || item.title,
    source: source.name,
    source_type: source.type,
    layer: source.layer,
    url: item.link,
    created_at: item.pubDate ? new Date(item.pubDate) : new Date(),
    engagement: {},
  })) satisfies NormalizedItem[];
}

type RssItem = { title: string; link: string; description: string; pubDate?: string };

function parseRssItems(xml: string): RssItem[] {
  const items: RssItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = extractTag(block, "title");
    const link = extractTag(block, "link");
    const description = extractTag(block, "description");
    const pubDate = extractTag(block, "pubDate");
    if (title && link) items.push({ title, link, description, pubDate });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const m = xml.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
  return (m?.[1] ?? m?.[2] ?? "").trim();
}
