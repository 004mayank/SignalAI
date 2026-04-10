# SignalAI

AI trend intelligence platform that ingests content from 13 sources across the AI ecosystem, extracts structured insights via LLM, clusters articles by semantic similarity, and surfaces trending topics with velocity metrics.

---

## Stack

- **Next.js 16 (App Router)** + React 19 + Tailwind 4
- **PostgreSQL + Prisma 6** — articles, clusters, trends, time-series stats
- **OpenAI** — structured article analysis (`gpt-4.1-mini`) + embeddings (`text-embedding-3-small`)
- **node-cron + tsx** — scheduled ingestion worker

---

## Architecture

```
web/
├── prisma/schema.prisma          # Article, TrendCluster, Trend, TrendStat, User
├── scripts/
│   └── cron.ts                   # Ingestion worker (runs every 6h)
└── src/
    ├── app/
    │   ├── page.tsx              # Feed (/)
    │   ├── trends/page.tsx       # Trends (/trends)
    │   └── api/
    │       ├── ingest/           # POST /api/ingest
    │       ├── articles/         # GET  /api/articles
    │       ├── trends/           # GET  /api/trends
    │       ├── report/weekly/    # GET  /api/report/weekly
    │       ├── user/preferences/ # GET/PUT /api/user/preferences
    │       └── seed/             # POST /api/seed
    └── server/
        ├── services/
        │   ├── ingest.ts         # Orchestrator
        │   ├── embeddings.ts     # OpenAI embeddings (with pseudo-embedding fallback)
        │   ├── similarity.ts     # Cosine similarity + mean vector
        │   ├── scoring.ts        # Hybrid scoring
        │   ├── trend-engine.ts   # Cluster assignment + trend upsert + LLM naming
        │   └── trend-stats.ts    # Velocity: last 7d vs previous 7d
        └── sources/
            ├── registry.ts       # 13 configured sources
            ├── ingest.ts         # Source dispatcher
            ├── normalized.ts     # NormalizedItem shape
            └── handlers/
                ├── rss.ts        # Generic RSS (rss-parser)
                ├── arxiv.ts      # arXiv XML feed
                ├── github.ts     # GitHub Search API
                ├── reddit.ts     # Reddit JSON API
                ├── hn.ts         # Hacker News Firebase API
                ├── producthunt.ts # HTML scrape (__NEXT_DATA__)
                └── huggingface.ts # HTML scrape (cheerio)
```

---

## Ingestion pipeline

For each article:

1. **Fetch + normalize** from source handler → `NormalizedItem`
2. **Dedup by URL** — skip if already in DB
3. **LLM analysis** — extract: `tldr`, `what_happened`, `why_it_matters`, `use_case`, `category`, `relevance_score` (1–5), `impact_level`, `target_persona`, `actionable_takeaway`
4. **Embed** — `text-embedding-3-small` (or deterministic pseudo-embedding if no API key)
5. **Semantic dedup** — cosine similarity ≥ 0.9 against last 300 articles → mark `duplicateOfId`, skip clustering
6. **Cluster** — cosine similarity ≥ 0.8 against existing cluster centroids in same category → assign or create cluster
7. **Score** — `0.5 × llm_score + 0.3 × source_weight + 0.2 × engagement_score`
8. **Trend upsert** — create/update `Trend` for cluster; regenerate LLM name + summary every 5 new articles
9. **Velocity** — upsert daily `TrendStat`; compute last 7d vs previous 7d growth

---

## Source registry

13 sources across 6 layers with configurable weights (1–5):

| Layer        | Sources                                                      |
|--------------|--------------------------------------------------------------|
| Research     | arXiv AI                                                     |
| Labs         | OpenAI Blog, DeepMind Blog, Anthropic Blog                   |
| Builder      | GitHub AI Trending, Hugging Face Models                      |
| Community    | r/MachineLearning, r/LocalLLaMA, r/artificial, Hacker News   |
| Startup      | Product Hunt                                                 |
| Distribution | Microsoft AI Blog, Google AI Blog, Notion Blog               |

---

## Database schema

| Model          | Purpose                                                        |
|----------------|----------------------------------------------------------------|
| `Article`      | Ingested content with LLM fields, score, embedding, cluster ID |
| `TrendCluster` | Mean centroid embedding per category cluster                   |
| `Trend`        | LLM-named trend derived from a cluster                         |
| `TrendStat`    | Daily article count per trend (powers velocity)                |
| `User`         | Liked/ignored categories for light personalization             |

Enums: `ArticleCategory` (Agents/LLMs/Infra/UX/Other), `ImpactLevel`, `TargetPersona`, `SourceType`, `SourceLayer`

---

## API

### `POST /api/ingest`

```jsonc
// RSS mode (backward compat — also works via RSS_FEEDS env var)
{ "feeds": ["https://..."], "limit": 15 }

// Registry mode
{ "use_registry": true, "limit": 15 }

// Specific sources only
{ "use_registry": true, "source_names": ["GitHub AI Trending", "arXiv AI"], "limit": 10 }
```

Returns: `{ sources, fetched, created, skipped, errors }`

### `GET /api/articles`

```
?category=Agents&source_type=github&layer=builder&min_relevance=3&limit=50
```

Excludes duplicates. Respects user `ignored_categories` via `x-user-id` header.

### `GET /api/trends`

Top 50 trends ordered by velocity + article count.

```json
[{ "name": "...", "summary": "...", "article_count": 12, "velocity": "+35%", "category": "Agents" }]
```

### `GET /api/report/weekly`

Top 5 trends + key insights + LLM-generated recommended actions.

### `GET /PUT /api/user/preferences`

```json
{ "liked_categories": ["Agents"], "ignored_categories": ["UX"] }
```

Header: `x-user-id` (defaults to `"demo"`)

### `POST /api/seed`

Loads 3 sample articles (OpenAI, OSS agents, GPU infra) with embeddings and scores — useful for local dev without running a full ingest.

---

## Setup

### 1. Environment

```bash
cd web
cp .env.example .env
```

| Variable                 | Required | Default                  | Notes                            |
|--------------------------|----------|--------------------------|----------------------------------|
| `DATABASE_URL`           | Yes      | —                        | PostgreSQL connection string      |
| `OPENAI_API_KEY`         | No       | —                        | Enables real LLM + embeddings    |
| `OPENAI_MODEL`           | No       | `gpt-4.1-mini`           | Used for analysis + trend naming |
| `OPENAI_EMBEDDING_MODEL` | No       | `text-embedding-3-small` |                                  |
| `RSS_FEEDS`              | No       | —                        | Comma-separated RSS URLs         |
| `GITHUB_TOKEN`           | No       | —                        | Avoids GitHub rate limits        |
| `INGEST_CRON`            | No       | `0 */6 * * *`            | Cron schedule for worker         |
| `LOG_LEVEL`              | No       | `info`                   | Pino log level                   |

Without `OPENAI_API_KEY`, the app falls back to deterministic pseudo-embeddings and mocked LLM responses — all features work locally without any API keys.

### 2. Install & migrate

```bash
cd web
npm install
npm run db:migrate
```

### 3. Seed (optional)

```bash
curl -X POST http://localhost:3000/api/seed
```

### 4. Run

```bash
# Web app
npm run dev

# Background ingestion worker (runs immediately + every 6h)
npm run worker:ingest
```

### 5. Ingest manually

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H 'content-type: application/json' \
  -d '{"use_registry":true,"limit":10}'
```

---

## UI

### Feed (`/`)

- **Trending grid** — top 5 articles by final score
- **Article cards** — TL;DR, why it matters, use case, impact level, target persona, actionable takeaway, score
- **Sidebar filters** — category, layer, source type, min relevance slider

### Trends (`/trends`)

- Grid of trend cards: name, summary, article count, velocity badge (+/-%)

---

## Scripts

```bash
npm run dev            # Next.js dev server (port 3000)
npm run build          # Production build
npm run start          # Production server
npm run worker:ingest  # Scheduled ingestion worker
npm run db:migrate     # Run Prisma migrations
npm run db:studio      # Prisma Studio (DB GUI)
npm run db:generate    # Regenerate Prisma client
```

---

## Known limitations

- **Product Hunt** ingestion scrapes `__NEXT_DATA__` — fragile, may break on site updates. Swap to official API for production.
- **Hugging Face** handler has no publish date (uses current timestamp).
- **Search bar** is UI-only, not yet implemented.
- **Settings button** is non-functional.
- **User preference controls** — API exists, no frontend UI yet.
- **Vector storage** uses `Float[]` arrays. For production scale, migrate to native pgvector with an index.
