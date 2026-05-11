# Deferred Work

## From spec-pipeline-fixes (2026-05-12)

- **user_id auth — unauthenticated user ID enumeration**: Any caller can pass an arbitrary `user_id` to `/api/articles` and infer whether a user ID exists. Spec-sanctioned at MVP (no auth). Revisit in Phase 2 when Stripe/session auth is added.

- **requireDatabaseUrl() in CI builds**: Calling `requireDatabaseUrl()` at module import time means CI builds without `DATABASE_URL` set will fail at runtime rather than with a clear type/build error. Acceptable for a solo-operated project; revisit if CI pipelines need to run without a DB connection.

- **minRelevance === 0 skipped**: `if (minRelevance)` in `/api/articles/route.ts` evaluates falsy when `min_relevance=0`, silently skipping the filter. Pre-existing bug not introduced by this change. Fix in a future articles-route cleanup pass.

## Deferred Goals from Goal 1 split (2026-05-11)

- Goal 2: Newsletter system (Beehiiv client, subscribe/unsubscribe APIs, newsletter script, HTML template, cron routes)
- Goal 3: Admin APIs (source health, manual ingest trigger, newsletter preview)
- Goal 4: Source expansion (X/Twitter handler, Meta AI / Mistral / Cohere / LangChain / W&B RSS sources)
- Goal 5: Freemium gate UI + freemium banner component
- Goal 6: Newsletter subscribe component
- Goal 7: Infrastructure (vercel.json cron config, .env.example)
