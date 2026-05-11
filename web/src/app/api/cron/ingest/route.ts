import { NextResponse } from "next/server";
import { runIngestion } from "@/server/services/ingest";

// Called by Vercel Cron every 6 hours (see vercel.json).
// Guard with CRON_SECRET to prevent unauthorized triggers.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await runIngestion();
  return NextResponse.json({ data: result });
}
