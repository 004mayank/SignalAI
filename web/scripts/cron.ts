import "dotenv/config";
import cron from "node-cron";
import pino from "pino";
import { getEnv } from "../src/lib/env";
import { runIngestion } from "../src/server/services/ingest";

const log = pino({ level: process.env.LOG_LEVEL || "info" });

async function tick() {
  const env = getEnv();
  const feeds = env.RSS_FEEDS?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  if (feeds.length === 0) {
    log.warn("No RSS_FEEDS configured; skipping ingestion.");
    return;
  }

  log.info({ feeds: feeds.length }, "Starting ingestion run");
  const result = await runIngestion({ feeds, limitPerFeed: 15 });
  log.info(result, "Finished ingestion run");
}

// Every 6 hours by default.
const expr = process.env.INGEST_CRON || "0 */6 * * *";
log.info({ expr }, "SignalAI ingestion worker scheduled");

cron.schedule(expr, () => {
  tick().catch((err) => log.error({ err }, "Ingestion run failed"));
});

// Run once on start
void tick().catch((err) => log.error({ err }, "Initial ingestion run failed"));
