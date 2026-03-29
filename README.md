# SignalAI — AI Trend Intelligence Platform (v2)

SignalAI is an **AI decision intelligence system** that aggregates updates across the AI ecosystem, filters noise, extracts structured insights, and detects emerging trends.

This repo upgrades the original MVP (feed + summaries) into a **multi-source intelligence system** with:
- **Next.js (App Router) + Tailwind** dashboard UI
- **PostgreSQL + Prisma** (articles + trends + stats)
- **OpenAI** summarization/classification + **embeddings**
- **Multi-source ingestion** via a centralized **Source Registry** (RSS, arXiv, GitHub, Reddit, Hacker News, Product Hunt, Hugging Face)
- **Trend engine**: embeddings + cosine similarity clustering + **velocity** (last 7d vs previous 7d)

---

## Folder structure (key)

```
SignalAI/
  web/
    prisma/schema.prisma
    scripts/
      cron.ts                    # node-cron ingestion worker
    src/
      app/
        api/
          ingest/route.ts         # POST /api/ingest
          articles/route.ts       # GET /api/articles
          trends/route.ts         # GET /api/trends
          report/weekly/route.ts  # GET /api/report/weekly
          user/preferences/route.ts
      server/
        services/                 # AI + ingestion pipeline + scoring + trend engine
        sources/                  # registry + per-source handlers + normalization
```

---

## Core features

### Feed (`/`)
- High-signal feed cards with:
  - TL;DR, why it matters, use case
  - impact level, target persona, actionable takeaway
  - final score (hybrid scoring)

### Trends (`/trends`)
- Trend cards from real clustering:
  - name + summary (LLM-generated per cluster)
  - article count
  - velocity % (last 7 days vs previous 7 days)

### Filters
- Category
- Minimum relevance
- **Layer** (builder/research/community/etc.)
- **Source type** (rss/github/reddit/arxiv/hn/etc.)

---

## API

### Articles
- `GET /api/articles?category=Agents&min_relevance=3&source_type=github&layer=builder&limit=50`

### Trends
- `GET /api/trends`

Returns:
```json
[
  {
    "name": "AI Agents for Workflow Automation",
    "summary": "...",
    "article_count": 12,
    "velocity": "+35%",
    "category": "Agents"
  }
]
```

### Ingestion
- `POST /api/ingest`

**Backward-compatible RSS mode** (existing MVP behavior):
- If `RSS_FEEDS` is set → ingests RSS feeds
- Or pass body: `{ "feeds": ["..."], "limit": 10 }`

**Multi-source registry mode**:
- `{ "use_registry": true, "limit": 10 }`
- Optional: `{ "use_registry": true, "source_names": ["GitHub AI Trending", "arXiv AI"], "limit": 10 }`

### Weekly report
- `GET /api/report/weekly`

### User preferences (light personalization)
- `GET /api/user/preferences` (uses header `x-user-id`, defaults to `demo`)
- `PUT /api/user/preferences`

---

## Source Registry

Central config lives in:
- `web/src/server/sources/registry.ts`

Each source defines:
- `name`, `type`, `url`, `weight` (1–5), `layer`

---

## Scoring

Hybrid scoring:
```
final_score =
  0.5 * llm_score +
  0.3 * source_weight +
  0.2 * engagement_score
```

Engagement is derived from stars/upvotes/comments when available.

---

## Run locally

### 1) Setup env
```bash
cd web
cp .env.example .env
```

Required:
- `DATABASE_URL`

Optional:
- `OPENAI_API_KEY` (enables real summaries + embeddings)
- `OPENAI_MODEL` (default: `gpt-4.1-mini`)
- `OPENAI_EMBEDDING_MODEL` (default: `text-embedding-3-small`)
- `RSS_FEEDS` (comma-separated RSS URLs)
- `GITHUB_TOKEN` (recommended to avoid rate limits)

### 2) Install deps
```bash
cd web
npm install
```

### 3) Migrate DB
```bash
npm run db:migrate
```

### 4) Seed / ingest
```bash
curl -X POST http://localhost:3000/api/seed
curl -X POST http://localhost:3000/api/ingest
# or
curl -X POST http://localhost:3000/api/ingest -H 'content-type: application/json' -d '{"use_registry":true,"limit":10}'
```

### 5) Start web
```bash
npm run dev
```

### 6) (Optional) Run scheduled ingestion worker
```bash
npm run worker:ingest
# runs immediately + then every 6h (configurable via INGEST_CRON)
```

---

## Notes
- Product Hunt + Hugging Face ingestion is best-effort HTML parsing (no stable unauth public API). For production reliability, swap to official APIs / authenticated endpoints.
- For scale, upgrade embeddings storage to pgvector (index + SQL cosine similarity).
