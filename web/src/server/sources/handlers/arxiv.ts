import { XMLParser } from "fast-xml-parser";
import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { truncate } from "@/lib/text";

export async function ingestArxiv(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const resp = await fetch(source.url);
  if (!resp.ok) throw new Error(`arXiv fetch failed: ${resp.status}`);
  const xml = await resp.text();

  const parser = new XMLParser({ ignoreAttributes: false });
  const parsed = parser.parse(xml) as unknown;

  const entries = (() => {
    const feed = (parsed as { feed?: unknown })?.feed;
    if (!feed || typeof feed !== "object") return [] as unknown[];
    const entry = (feed as { entry?: unknown })?.entry;
    if (!entry) return [] as unknown[];
    return Array.isArray(entry) ? entry : [entry];
  })();

  return entries.slice(0, limit).map((e0) => {
    const e = e0 as { title?: string; summary?: string; id?: string; published?: string };
    const title = String(e.title ?? "").replace(/\s+/g, " ").trim();
    const summary = String(e.summary ?? "").replace(/\s+/g, " ").trim();
    const id = String(e.id ?? "");
    const createdAt = e.published ? new Date(e.published) : new Date();

    return {
      title,
      content: truncate(summary, 8000),
      source: source.name,
      source_type: source.type,
      layer: source.layer,
      url: id,
      created_at: createdAt,
      engagement: {},
    } satisfies NormalizedItem;
  });
}
