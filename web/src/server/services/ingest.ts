import { prisma } from "@/lib/db";
import { analyzeArticleWithLLM } from "@/lib/ai";
import { embedText } from "@/server/services/embeddings";
import { cosineSimilarity } from "@/server/services/similarity";
import { assignCluster, updateClusterCentroid, upsertTrendForCluster } from "@/server/services/trend-engine";
import { computeVelocityPercent, upsertTodayTrendStat } from "@/server/services/trend-stats";
import { engagementScore, finalRelevanceScore } from "@/server/services/scoring";
import { SOURCES, type SourceConfig } from "@/server/sources/registry";
import { ingestSource } from "@/server/sources/ingest";

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Pre-filter ────────────────────────────────────────────────────────────
// Cheap title-level gate that runs BEFORE any LLM or embedding call.
// Returns true when the item is obvious noise and should be dropped immediately.

// Patterns that disqualify any item regardless of source
const UNIVERSAL_NOISE: RegExp[] = [
  /visa (issue|problem|challenge|application)/i,
  /who('s| is) hiring|want(s| to) be hired|job (post|board)|hiring.*internship/i,
  /supply.chain (compromise|attack|hack)/i,
  /npm (supply|package|registry)/i,
  /soldering|gardening|stamp collecting/i,
  /book club|reading group/i,
  /screenshots? of old (desktop|ui|os)/i,
  /remembering .*(before github|before the internet)/i,
  /[\u4e00-\u9fff]{4,}/,            // blocks of Chinese text (Java guide etc.)
];

// Extra patterns applied only to noisy community sources (HN, Reddit)
const COMMUNITY_NOISE: RegExp[] = [
  /^\[D\]\s*(monthly|weekly|self-promotion|who's hiring|reading group|ama\b)/i,
  /\[D\]\s*(monthly who's|self-promotion thread|ama announcement)/i,
  /\[virtual\].*?(course|workshop|meetup|webinar|saturdays)/i,
  /ama (announcement|session|thread)/i,
  /phd students.*how many hours|how many hours.*work/i,
  /how can i check.*formatting|arr formatting/i,
  /are we finally getting to the point/i,   // vague opinion thread
  /^a hn post with/i,
  /what model (for|should|do) (coding|i use)/i,
  /^screenshots? of/i,
];

function isObviousNoise(title: string, sourceType: string): boolean {
  if (UNIVERSAL_NOISE.some((p) => p.test(title))) return true;
  if (
    (sourceType === "hn" || sourceType === "reddit") &&
    COMMUNITY_NOISE.some((p) => p.test(title))
  )
    return true;
  return false;
}

// Minimum LLM relevance score per source tier.
// Community sources are noisier so we hold them to a higher bar.
function minLlmScore(sourceType: string): number {
  if (sourceType === "hn" || sourceType === "reddit") return 3;
  return 2;
}

// Minimum final score (post-engagement weighting) before we persist anything.
const MIN_FINAL_SCORE = 2.5;

async function fetchWithRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(2 ** attempt * 1000);
    }
  }
  throw new Error("unreachable");
}

export async function runIngestion(params?: {
  // Backward compatible: RSS feeds list
  feeds?: string[];
  // New: restrict to certain registry source names
  sourceNames?: string[];
  limitPerSource?: number;
}) {
  const limit = params?.limitPerSource ?? 15;

  const sources: SourceConfig[] = params?.feeds?.length
    ? params.feeds.map((url) => ({
        name: new URL(url).hostname,
        type: "rss",
        url,
        weight: 4,
        layer: "distribution",
      }))
    : params?.sourceNames?.length
      ? SOURCES.filter((s) => params.sourceNames!.includes(s.name))
      : SOURCES;

  let fetched = 0;
  let created = 0;
  let skipped = 0;
  const errors: { source: string; error: string }[] = [];

  const affectedClusterIds = new Set<string>();

  for (const source of sources) {
    const runAt = new Date();
    try {
      const normalized = await fetchWithRetry(() => ingestSource(source, limit));
      fetched += normalized.length;

      for (const item of normalized) {
        const url = item.url;
        const title = item.title;
        const content = item.content;

        if (!url || !title || !content) {
          skipped++;
          continue;
        }

        // Gate 1 — cheap title pre-filter (no API call needed)
        if (isObviousNoise(title, source.type)) {
          skipped++;
          continue;
        }

        const exists = await prisma.article.findUnique({ where: { url } });
        if (exists) {
          skipped++;
          continue;
        }

        const ai = await analyzeArticleWithLLM({
          title,
          source: item.source,
          url,
          content,
        });

        // Gate 2 — LLM relevance flag + per-source score floor
        if (!ai.is_ai_relevant || ai.relevance_score < minLlmScore(source.type)) {
          skipped++;
          continue;
        }

        const embedding = await embedText(`${title}\n\n${content}`);

        // Dedup via embeddings (compare against recent items).
        const recent = await prisma.article.findMany({
          orderBy: { createdAt: "desc" },
          take: 300,
          select: { id: true, embedding: true },
        });
        const dup = recent
          .map((r) => ({ id: r.id, sim: cosineSimilarity(embedding, r.embedding) }))
          .sort((a, b) => b.sim - a.sim)[0];

        const engScore = engagementScore({
          stars: item.engagement.stars,
          upvotes: item.engagement.upvotes,
          comments: item.engagement.comments,
        });

        const finalScore = finalRelevanceScore({
          llmScore: ai.relevance_score,
          sourceWeight: source.weight,
          engagementScore: engScore,
        });

        // Gate 3 — final score floor (post-engagement weighting)
        if (finalScore < MIN_FINAL_SCORE) {
          skipped++;
          continue;
        }

        // If duplicate: store it but mark duplicateOfId, no clustering.
        // Threshold 0.82 catches same-story articles from different sources.
        if (dup && dup.sim >= 0.82) {
          await prisma.article.create({
            data: {
              title,
              url,
              source: item.source,
              sourceType: item.source_type,
              layer: item.layer,
              engagementStars: item.engagement.stars,
              engagementUpvotes: item.engagement.upvotes,
              engagementComments: item.engagement.comments,
              content,
              summary: ai.tldr,
              whatHappened: ai.what_happened,
              whyItMatters: ai.why_it_matters,
              useCase: ai.use_case,
              actionableTakeaway: ai.actionable_takeaway,
              impactLevel: ai.impact_level,
              targetPersona: ai.target_persona,
              category: ai.category,
              llmScore: ai.relevance_score,
              finalScore,
              embedding,
              duplicateOfId: dup.id,
              publishedAt: item.created_at,
            },
          });
          skipped++;
          continue;
        }

        const { clusterId } = await assignCluster({ category: ai.category, embedding, threshold: 0.8 });

        await prisma.article.create({
          data: {
            title,
            url,
            source: item.source,
            sourceType: item.source_type,
            layer: item.layer,
            engagementStars: item.engagement.stars,
            engagementUpvotes: item.engagement.upvotes,
            engagementComments: item.engagement.comments,
            content,
            summary: ai.tldr,
            whatHappened: ai.what_happened,
            whyItMatters: ai.why_it_matters,
            useCase: ai.use_case,
            actionableTakeaway: ai.actionable_takeaway,
            impactLevel: ai.impact_level,
            targetPersona: ai.target_persona,
            category: ai.category,
            llmScore: ai.relevance_score,
            finalScore,
            embedding,
            clusterId,
            publishedAt: item.created_at,
          },
        });

        await updateClusterCentroid(clusterId);
        await upsertTrendForCluster({ clusterId, category: ai.category });
        affectedClusterIds.add(clusterId);

        created++;
      }

      // Record successful source health
      await prisma.sourceHealth.upsert({
        where: { sourceName: source.name },
        create: { sourceName: source.name, lastRunAt: runAt, lastSuccessAt: runAt, errorCount: 0 },
        update: { lastRunAt: runAt, lastSuccessAt: runAt, errorCount: 0, lastError: null },
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push({ source: source.name, error: msg });

      // Record failed source health
      await prisma.sourceHealth.upsert({
        where: { sourceName: source.name },
        create: { sourceName: source.name, lastRunAt: runAt, errorCount: 1, lastError: msg },
        update: {
          lastRunAt: runAt,
          errorCount: { increment: 1 },
          lastError: msg,
        },
      }).catch(() => {}); // don't let health tracking crash the loop
    }
  }

  // Batch velocity update for all affected clusters
  for (const clusterId of affectedClusterIds) {
    const trend = await prisma.trend.findUnique({ where: { clusterId } });
    if (trend) {
      await upsertTodayTrendStat(trend.id, clusterId);
      const v = await computeVelocityPercent(trend.id);
      await prisma.trend.update({ where: { id: trend.id }, data: { velocity: v } });
    }
  }

  return { sources: sources.map((s) => s.name), fetched, created, skipped, errors };
}
