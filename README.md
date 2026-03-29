# SignalAI — AI Trend Intelligence Platform (MVP)

SignalAI aggregates, filters, and analyzes updates across the AI ecosystem and converts them into **actionable insights**.

This repo contains a production-ready MVP:
- **Next.js (App Router) + Tailwind** dashboard UI
- **PostgreSQL + Prisma** data model
- **OpenAI-powered** summarization + classification (with safe fallback when no key is set)
- Basic **trend detection** (category aggregation)

---

## Folder structure

```
SignalAI/
  web/                  # Next.js app (UI + API routes)
    prisma/             # Prisma schema + migrations
    src/
      app/
        api/            # /api/articles, /api/trends, /api/ingest, /api/seed
        trends/         # /trends page
      components/       # UI building blocks
      lib/              # db, env, ai helpers
```

---

## Core MVP features

### 1) AI Feed (`/`)
Shows a card-based feed:
- Title, source, category
- TL;DR
- Why it matters
- Use case
- Relevance score (1–5)

### 2) Filtering
- Filter by category
- Filter by minimum relevance

### 3) Trends (`/trends`)
- Counts and highlights by category (last 7 days)

### 4) Ingestion (mock or real)
- `POST /api/seed` → inserts sample records
- `POST /api/ingest` → pulls RSS feeds, summarizes/classifies, stores into Postgres

---

## API endpoints

- `GET /api/articles?category=Agents&min_relevance=3&limit=50`
- `GET /api/trends`
- `POST /api/seed`
- `POST /api/ingest` (reads `RSS_FEEDS` or accepts `{ feeds: [...], limit?: number }`)

---

## Database schema

Table: `articles`
- `id`
- `title`
- `content`
- `summary`
- `what_happened`
- `why_it_matters`
- `use_case`
- `category`
- `relevance_score`
- `source`
- `url`
- `created_at`

---

## Run locally

### 1) Setup env

```bash
cd web
cp .env.example .env
```

Update `DATABASE_URL` to your local Postgres.

Optional (for real AI processing):
- set `OPENAI_API_KEY`
- optionally set `OPENAI_MODEL` (default: `gpt-4.1-mini`)

### 2) Install deps

```bash
cd web
npm install
```

### 3) Migrate DB

```bash
npm run db:migrate
```

### 4) Seed data (optional)

```bash
curl -X POST http://localhost:3000/api/seed
```

### 5) Start

```bash
npm run dev
```

Open:
- http://localhost:3000 (Feed)
- http://localhost:3000/trends (Trends)

---

## Notes / next steps

- Trend detection can evolve from category aggregation → topic clustering via embeddings + vector DB.
- Ingestion can move from manual endpoint to a scheduled job (cron/queue).
- Add auth + personalization once the core signal quality is validated.
