import { XMLParser } from "fast-xml-parser";
import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { stripHtml, truncate } from "@/lib/text";

// Product Hunt AI topics via RSS feed (no auth required).
export async function ingestProductHunt(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const rssUrl = "https://www.producthunt.com/feed?category=artificial-intelligence";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  let xml: string;
  try {
    const resp = await fetch(rssUrl, {
      headers: { "User-Agent": "SignalAI/1.0 (+https://signalai.app)" },
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`Product Hunt RSS fetch failed: ${resp.status}`);
    xml = await resp.text();
  } finally {
    clearTimeout(timer);
  }

  // Use fast-xml-parser instead of hand-rolled regex so HTML entities and
  // CDATA sections are decoded correctly.
  const parser = new XMLParser({
    ignoreAttributes: false,
    cdataPropName: "__cdata",
    processEntities: true,
  });
  const parsed = parser.parse(xml) as unknown;

  const rawItems: unknown[] = (() => {
    const channel = (parsed as { rss?: { channel?: { item?: unknown } } })?.rss?.channel;
    if (!channel || typeof channel !== "object") return [];
    const item = (channel as { item?: unknown }).item;
    if (!item) return [];
    return Array.isArray(item) ? item : [item];
  })();

  return rawItems.slice(0, limit).flatMap((i0) => {
    const i = i0 as { title?: unknown; link?: unknown; description?: unknown; pubDate?: unknown };
    const title = extractText(i.title)?.trim();
    const link = extractText(i.link)?.trim();
    const description = extractText(i.description)?.trim() ?? "";

    if (!title || !link) return [];

    const content = truncate(stripHtml(description) || title, 8000);
    const pubDate = i.pubDate ? new Date(String(i.pubDate)) : null;
    const createdAt = pubDate && !isNaN(pubDate.getTime()) ? pubDate : new Date();

    return [{
      title,
      content,
      source: source.name,
      source_type: source.type,
      layer: source.layer,
      url: link,
      created_at: createdAt,
      engagement: {},
    } satisfies NormalizedItem];
  });
}

// fast-xml-parser wraps CDATA in a __cdata property; fall back to raw string.
function extractText(v: unknown): string | undefined {
  if (v == null) return undefined;
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    const obj = v as Record<string, unknown>;
    if (typeof obj.__cdata === "string") return obj.__cdata;
  }
  return String(v);
}
