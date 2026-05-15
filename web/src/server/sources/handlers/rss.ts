import Parser from "rss-parser";
import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { stripHtml, truncate } from "@/lib/text";

const RSS_TIMEOUT_MS = 10_000;

// Sanitize common XML spec violations found in real-world RSS feeds:
// 1. Unescaped bare & not part of a valid entity reference
// 2. Malformed XML comments containing -- inside (<!-- foo--bar --> is invalid)
// 3. Boolean HTML attributes with no value (e.g. <input selected>) — add =""
function sanitizeXml(xml: string): string {
  // Fix bare & not already part of &name; or &#123; or &#xAB;
  xml = xml.replace(/&(?![a-zA-Z#][a-zA-Z0-9#]*;)/g, "&amp;");
  // Fix malformed comments: -- inside <!-- ... --> is invalid XML
  xml = xml.replace(/<!--[\s\S]*?-->/g, (c) => c.replace(/--(?!>)/g, "- -"));
  // Fix boolean attributes: word followed by whitespace or > with no ="..."
  xml = xml.replace(/<[^>]+>/g, (tag) =>
    tag.replace(/(\s)([a-zA-Z][\w-]*)(?=[\s/>])/g, (m, sp, attr) =>
      m.includes("=") ? m : `${sp}${attr}=""`
    )
  );
  return xml;
}

export async function ingestRSS(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  // Fetch raw XML ourselves so we can sanitize it before parsing.
  // Some feeds (e.g. LangChain) contain unescaped & that break strict XML parsers.
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), RSS_TIMEOUT_MS);
  let xml: string;
  try {
    const resp = await fetch(source.url, {
      headers: { "User-Agent": "SignalAI/1.0 (+https://signalai.app)" },
      signal: controller.signal,
    });
    if (!resp.ok) throw new Error(`RSS fetch failed: ${resp.status} ${source.url}`);
    xml = await resp.text();
  } finally {
    clearTimeout(timer);
  }
  xml = sanitizeXml(xml);

  const parser = new Parser();
  const feed = await parser.parseString(xml);

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
