import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";
import { ingestRSS } from "@/server/sources/handlers/rss";
import { ingestGitHub } from "@/server/sources/handlers/github";
import { ingestReddit } from "@/server/sources/handlers/reddit";
import { ingestArxiv } from "@/server/sources/handlers/arxiv";
import { ingestHN } from "@/server/sources/handlers/hn";
import { ingestProductHunt } from "@/server/sources/handlers/producthunt";
import { ingestHuggingFace } from "@/server/sources/handlers/huggingface";

export async function ingestSource(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  switch (source.type) {
    case "rss":
      return ingestRSS(source, limit);
    case "github":
      return ingestGitHub(source, limit);
    case "reddit":
      return ingestReddit(source, limit);
    case "arxiv":
      return ingestArxiv(source, limit);
    case "hn":
      return ingestHN(source, Math.min(limit, 15));
    case "producthunt":
      return ingestProductHunt(source, limit);
    case "huggingface":
      return ingestHuggingFace(source, limit);
    default:
      return [];
  }
}
