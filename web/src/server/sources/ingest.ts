import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { ingestRSS } from "@/server/sources/handlers/rss";
import { ingestGitHub } from "@/server/sources/handlers/github";
import { ingestReddit } from "@/server/sources/handlers/reddit";
import { ingestArxiv } from "@/server/sources/handlers/arxiv";
import { ingestHN } from "@/server/sources/handlers/hn";
import { ingestProductHunt } from "@/server/sources/handlers/producthunt";
import { ingestHuggingFace } from "@/server/sources/handlers/huggingface";
import { ingestTwitter } from "@/server/sources/handlers/twitter";

export async function ingestSource(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  // Resolve function URLs at ingest time so handlers always receive a plain string.
  const resolvedUrl = typeof source.url === "function" ? source.url() : source.url;
  const resolved = { ...source, url: resolvedUrl } satisfies SourceConfig;
  switch (resolved.type) {
    case "rss":
      return ingestRSS(resolved, limit);
    case "github":
      return ingestGitHub(resolved, limit);
    case "reddit":
      return ingestReddit(resolved, limit);
    case "arxiv":
      return ingestArxiv(resolved, limit);
    case "hn":
      return ingestHN(resolved, Math.min(limit, 15));
    case "producthunt":
      return ingestProductHunt(resolved, limit);
    case "huggingface":
      return ingestHuggingFace(resolved, limit);
    case "twitter":
      return ingestTwitter(resolved, limit);
    default:
      return [];
  }
}
