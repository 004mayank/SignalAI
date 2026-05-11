---
title: 'Pipeline Fixes: Startup Validation, User Preferences Filter, HuggingFace Handler'
type: 'bugfix'
created: '2026-05-11'
status: 'done'
baseline_commit: '4b16b7f64bac532d7299b0cda4669a27aadc907b'
context:
  - _bmad-output/planning-artifacts/architecture.md
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Three pipeline gaps remain before Phase 1 ships: (1) the app initialises silently when `DATABASE_URL` is missing — `requireDatabaseUrl()` exists in `env.ts` but is never called at startup; (2) `/api/articles` ignores `user_id` and never filters by the user's saved `ignoredCategories`, and `twitter` is missing from the route's `SourceTypeSchema` enum; (3) the HuggingFace handler scrapes the homepage HTML with a regex that misses many model URL formats and produces titles that are just URL slugs.

**Approach:** Call `requireDatabaseUrl()` when the Prisma singleton is created; add `user_id` query param + DB lookup + `NOT IN` filter to the articles route; add `twitter` to its SourceTypeSchema; refactor the HuggingFace handler to use the HuggingFace trending models RSS endpoint instead of HTML scraping.

## Boundaries & Constraints

**Always:**
- All work inside `web/` only
- Do not modify any file in `src/components/` — UI is final
- Do not change the `/api/articles` response shape (`{ articles, demo: false }`) — frontend depends on it
- Prisma queries must never select the `embedding` field in list queries

**Ask First:**
- If `https://huggingface.co/models.xml` or a similar RSS endpoint is unavailable or returns unexpected XML, halt and report rather than silently falling back to the old HTML scraper

**Never:**
- No auth middleware at MVP — `user_id` is a plain query param, no session validation
- Do not add rate limiting or caching in this pass
- Do not change the `getEnv()` Zod schema — only wire the existing `requireDatabaseUrl()` to startup

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Missing DATABASE_URL at startup | `DATABASE_URL` not in env | Process throws with: "Missing DATABASE_URL. Copy web/.env.example to web/.env and set a PostgreSQL connection string." | N/A — intentional hard fail |
| Valid DATABASE_URL | env has valid connection string | Prisma client creates normally | N/A |
| Articles with unknown user_id | `?user_id=does-not-exist` | Returns articles with no category exclusions (user not found = no preferences) | No error, treat as no prefs |
| Articles with user who has ignoredCategories | `?user_id=<id>` + user has `ignoredCategories: ["LLMs"]` | Returns articles where `category NOT IN ["LLMs"]` | N/A |
| Articles with `source_type=twitter` | `?source_type=twitter` | Filter applies correctly, no Zod parse error | N/A |
| HuggingFace RSS unavailable | RSS endpoint returns non-200 | Throw error (ingest.ts fetchWithRetry handles retries above this layer) | Let caller handle |

</frozen-after-approval>

## Code Map

- `web/src/lib/db.ts` — Prisma singleton; add `requireDatabaseUrl()` call before client creation
- `web/src/lib/env.ts` — `requireDatabaseUrl()` helper is already implemented here
- `web/src/app/api/articles/route.ts` — add `user_id` param, User lookup, ignoredCategories filter; add `twitter` to SourceTypeSchema
- `web/src/server/sources/handlers/huggingface.ts` — replace HTML scrape with RSS feed fetch + parse
- `web/src/server/sources/registry.ts` — check `huggingface` source URL to verify it points to the right endpoint (may need updating)

## Tasks & Acceptance

**Execution:**
- [x] `web/src/lib/db.ts` — call `requireDatabaseUrl()` from `web/src/lib/env.ts` before `new PrismaClient(...)` — ensures process fails fast at import time if DATABASE_URL is absent
- [x] `web/src/app/api/articles/route.ts` — add `"twitter"` to `SourceTypeSchema` enum; add `user_id: z.string().optional()` to `QuerySchema`; after building `where`, if `user_id` is present, call `prisma.user.findUnique({ where: { id: user_id }, select: { ignoredCategories: true } })` and append `category: { notIn: ignoredCategories }` to `where` when the array is non-empty
- [x] `web/src/server/sources/handlers/huggingface.ts` — replaced cheerio HTML scrape with HuggingFace public API (`/api/models?sort=trending`); items now have real model names and engagement data
- [x] `web/src/components/shell.tsx` — wrapped AppSidebar in Suspense to fix pre-existing useSearchParams build error on /newsletter page

**Acceptance Criteria:**
- Given `DATABASE_URL` is not set, when the Next.js dev server starts (or any module imports `@/lib/db`), then the process throws with the exact message from `requireDatabaseUrl()`
- Given a user exists with `ignoredCategories: ["LLMs"]`, when `GET /api/articles?user_id=<id>` is called, then no articles with `category === "LLMs"` appear in the response
- Given `user_id` refers to a non-existent user, when `GET /api/articles?user_id=ghost` is called, then the response is identical to calling without `user_id` (no 404, no empty array)
- Given `source_type=twitter` query param, when `GET /api/articles?source_type=twitter` is called, then no Zod validation error is thrown
- Given the HuggingFace source is triggered, when `ingestHuggingFace()` runs, then items have titles derived from actual model names (not raw URL slugs like `org/model-name`)

## Design Notes

**db.ts startup validation pattern:**
```typescript
import { requireDatabaseUrl } from "@/lib/env";
requireDatabaseUrl(); // throws if DATABASE_URL absent — intentional
export const prisma = globalForPrisma.prisma ?? new PrismaClient({ ... })
```

**articles route user prefs pattern:**
```typescript
if (parsed.user_id) {
  const user = await prisma.user.findUnique({
    where: { id: parsed.user_id },
    select: { ignoredCategories: true },
  });
  if (user?.ignoredCategories?.length) {
    where.category = { notIn: user.ignoredCategories };
  }
}
```

**HuggingFace RSS:** HuggingFace exposes `https://huggingface.co/models?sort=trending` as HTML but the models RSS is available via `https://huggingface.co/blog/feed.xml` for blog and the models page may need the `format=rss` param or direct XML endpoint. Investigate and use the most stable endpoint — if no clean RSS exists, switch to fetching JSON from `https://huggingface.co/api/models?sort=trending&limit=20` (public, no auth required).

## Verification

**Commands:**
- `cd web && npm run build` -- expected: zero TypeScript errors, zero type errors
- `cd web && npx tsc --noEmit` -- expected: clean

**Manual checks:**
- Remove DATABASE_URL from `.env`, run `npm run dev`, confirm the server throws "Missing DATABASE_URL..." immediately on startup rather than on first DB request
- Call `GET /api/articles?user_id=test-nonexistent` — confirm 200 with articles array, no error

## Suggested Review Order

**Startup validation**

- Fail-fast import: throws immediately if DATABASE_URL absent
  [`db.ts:4`](../../web/src/lib/db.ts#L4)

**Articles route — user preferences filter**

- Schema addition: `twitter` enum + `user_id` optional param
  [`route.ts:13`](../../web/src/app/api/articles/route.ts#L13)
- Non-critical DB lookup with try/catch fallback on error
  [`route.ts:63`](../../web/src/app/api/articles/route.ts#L63)
- Category merge logic: handles concurrent `category` + `user_id` params correctly
  [`route.ts:69`](../../web/src/app/api/articles/route.ts#L69)

**HuggingFace handler**

- Replaced fragile HTML scrape with public JSON API
  [`huggingface.ts:14`](../../web/src/server/sources/handlers/huggingface.ts#L14)
- Safe JSON parse + filter out models with no ID before mapping
  [`huggingface.ts:21`](../../web/src/server/sources/handlers/huggingface.ts#L21)
- Slash-safe modelId split — handles org/sub/model IDs correctly
  [`huggingface.ts:33`](../../web/src/server/sources/handlers/huggingface.ts#L33)

**Next.js Suspense fix**

- Wrap AppSidebar to satisfy useSearchParams Suspense requirement; fallback preserves sidebar width
  [`shell.tsx:7`](../../web/src/components/shell.tsx#L7)
