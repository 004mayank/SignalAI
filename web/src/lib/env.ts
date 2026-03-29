import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  // Comma-separated RSS feed URLs (optional). If omitted, the app can run with seed data.
  RSS_FEEDS: z.string().optional(),
});

type Env = z.infer<typeof EnvSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  cached = EnvSchema.parse({
    DATABASE_URL: process.env.DATABASE_URL,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_MODEL: process.env.OPENAI_MODEL,
    RSS_FEEDS: process.env.RSS_FEEDS,
  });
  return cached;
}

export function requireDatabaseUrl(): string {
  const env = getEnv();
  if (!env.DATABASE_URL) {
    throw new Error(
      "Missing DATABASE_URL. Copy web/.env.example to web/.env and set a PostgreSQL connection string.",
    );
  }
  return env.DATABASE_URL;
}
