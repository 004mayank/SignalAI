import { prisma } from "@/lib/db";
import { analyzeArticleWithLLM, type ArticleAIResult } from "@/lib/ai";
import { embedTexts } from "@/server/services/embeddings";
import { cosineSimilarity } from "@/server/services/similarity";
import { assignCluster, updateClusterCentroid, upsertTrendForCluster } from "@/server/services/trend-engine";
import { computeVelocityPercent, upsertTodayTrendStat } from "@/server/services/trend-stats";
import { engagementScore, finalRelevanceScore } from "@/server/services/scoring";
import { SOURCES, type SourceConfig } from "@/server/sources/registry";
import { ingestSource } from "@/server/sources/ingest";
import type { NormalizedItem } from "@/server/sources/normalized";

// Items that passed gates 1 + 2 and are ready for batch embedding
type PhaseAItem = {
  item: NormalizedItem;
  ai: ArticleAIResult;
  url: string;
  title: string;
  content: string;
};

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Module-level lock: prevents two overlapping runIngestion() calls in the same
// Node process (e.g. cron fires while a previous run is still in-flight).
let ingestionRunning = false;

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
  // Non-AI cybersecurity / crime / infra stories
  /wipe[sd]? \d+ (government|corporate|company) database/i,
  /minutes after being fired|fired.*deleted|deleted.*after.*fired/i,
  /ransomware|phishing attack|data breach|insider threat|database.*wiped/i,
  /arrested|indicted|charged|sentenced|convicted|pleaded guilty/i,
  /\b(sql injection|xss|csrf|buffer overflow|zero.?day exploit)\b(?!.*\b(AI|LLM|model)\b)/i,
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
  if (sourceType === "hn" || sourceType === "reddit") return 4;
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
  if (ingestionRunning) {
    console.warn("[ingest] Skipping run — previous ingestion still in progress.");
    return { sources: [], fetched: 0, created: 0, skipped: 0, errors: [], skippedReason: "concurrent" };
  }
  ingestionRunning = true;

  try {
  return await _runIngestion(params);
  } finally {
    ingestionRunning = false;
  }
}

async function _runIngestion(params?: {
  feeds?: string[];
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

      // ── Phase A: cheap filters + LLM gate ──────────────────────────────
      // Collect items that pass all pre-embedding gates. We batch-embed them
      // all at once in Phase B instead of one API call per article.
      const phaseA: PhaseAItem[] = [];
      // Dedup URLs within the current batch (catches reposts in the same feed).
      const batchUrls = new Set<string>();

      for (const item of normalized) {
        const url = item.url;
        const title = item.title;
        const content = item.content;

        if (!url || !title || !content) {
          console.debug("[ingest] skip: missing url/title/content", { source: source.name });
          skipped++;
          continue;
        }

        // Gate 1 — cheap title pre-filter (no API call needed)
        if (isObviousNoise(title, source.type)) {
          console.debug("[ingest] skip: noise filter", { title, source: source.name });
          skipped++;
          continue;
        }

        // Batch-level URL dedup — prevents unique-constraint violations if a
        // feed returns the same URL twice in one response.
        if (batchUrls.has(url)) {
          console.debug("[ingest] skip: duplicate url in batch", { url, source: source.name });
          skipped++;
          continue;
        }
        batchUrls.add(url);

        const exists = await prisma.article.findUnique({ where: { url } });
        if (exists) {
          console.debug("[ingest] skip: url already ingested", { url, source: source.name });
          skipped++;
          continue;
        }

        let ai: ArticleAIResult;
        try {
          ai = await analyzeArticleWithLLM({ title, source: item.source, url, content });
        } catch (err) {
          // LLM transient failure — skip this article, don't fail the whole source.
          console.warn("[ingest] LLM analysis failed, skipping article", { title, error: String(err) });
          skipped++;
          continue;
        }

        // Gate 2 — LLM relevance flag + per-source score floor
        if (!ai.is_ai_relevant || ai.relevance_score < minLlmScore(source.type)) {
          console.debug("[ingest] skip: llm rejected", { title, is_ai_relevant: ai.is_ai_relevant, score: ai.relevance_score, minScore: minLlmScore(source.type) });
          skipped++;
          continue;
        }

        phaseA.push({ item, ai, url, title, content });
      }

      // ── Phase B: batch embed all survivors in one API call ──────────────
      // Fetch recent articles once per source (not per article) for dedup.
      if (phaseA.length > 0) {
        // Truncate title + content separately before joining so both contribute
        // to the embedding rather than long content silently eating the title.
        const embeddings = await embedTexts(
          phaseA.map(({ title, content }) => `${title.slice(0, 200)}\n\n${content.slice(0, 7800)}`),
        );

        // Narrow dedup window to 48 hours — older articles shouldn't block new
        // coverage of a topic, and this cuts the comparison set dramatically.
        const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
        const recent = await prisma.article.findMany({
          where: { createdAt: { gte: twoDaysAgo } },
          orderBy: { createdAt: "desc" },
          select: { id: true, embedding: true },
        });

        // ── Phase C: dedup + score + persist ─────────────────────────────
        for (let i = 0; i < phaseA.length; i++) {
          const { item, ai, url, title, content } = phaseA[i];
          const embedding = embeddings[i];

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
            console.debug("[ingest] skip: final score below threshold", { title, finalScore, MIN_FINAL_SCORE });
            skipped++;
            continue;
          }

          // If duplicate: store it but mark duplicateOfId, no clustering.
          // Threshold 0.82 catches same-story articles from different sources.
          if (dup && dup.sim >= 0.82) {
            console.debug("[ingest] skip: semantic duplicate", { title, dupId: dup.id, sim: dup.sim.toFixed(3) });
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
