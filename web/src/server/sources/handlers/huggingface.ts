import * as cheerio from "cheerio";
import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";

export async function ingestHuggingFace(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const resp = await fetch(source.url, {
    headers: { "User-Agent": "SignalAI/1.0" },
  });
  if (!resp.ok) throw new Error(`Hugging Face fetch failed: ${resp.status}`);

  const html = await resp.text();
  const $ = cheerio.load(html);

  const links = new Set<string>();
  $("a[href^='/' ]").each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    // model pages look like /org/model
    if (/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(href)) links.add(href);
  });

  return Array.from(links)
    .slice(0, limit)
    .map((href) => {
      const url = `https://huggingface.co${href}`;
      const title = `Hugging Face model: ${href.slice(1)}`;
      return {
        title,
        content: title,
        source: source.name,
        source_type: source.type,
        layer: source.layer,
        url,
        created_at: new Date(),
        engagement: {},
      } satisfies NormalizedItem;
    });
}
