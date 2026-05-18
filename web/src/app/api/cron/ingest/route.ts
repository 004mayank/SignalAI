import { NextResponse } from "next/server";
import { after } from "next/server";
import { runIngestion } from "@/server/services/ingest";

// Allow up to 300s for the background processing task.
export const maxDuration = 300;

// Called by Vercel Cron every 6 hours (see vercel.json).
// Guard with CRON_SECRET to prevent unauthorized triggers.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Return 200 immediately so Vercel cron marks the job as successful.
  // The actual ingestion runs in the background via after(), staying alive
  // up to maxDuration seconds. A 55s wall-clock cutoff inside the ingest
  // ensures it exits gracefully before the function is forcibly killed.
  const deadline = Date.now() + 55_000;
  after(async () => {
    try {
      const result = await runIngestion({ limitPerSource: 5, deadlineMs: deadline });
      console.log("[cron/ingest] completed", result);
    } catch (err) {
      console.error("[cron/ingest] error", err);
    }
  });

  return NextResponse.json({ status: "started" });
}
