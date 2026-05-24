import { NextResponse } from "next/server";
import { after } from "next/server";
import { runTrendingScrape } from "@/server/services/trending";

export const maxDuration = 60;

// Called by Vercel Cron once per day. Scrapes github.com/trending and
// persists ranked repos to RepoTrendingEntry for the repos page.
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

  after(async () => {
    try {
      const result = await runTrendingScrape();
      console.log("[cron/trending] completed", result);
    } catch (err) {
      console.error("[cron/trending] error", err);
    }
  });

  return NextResponse.json({ status: "started" });
}
