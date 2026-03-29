import OpenAI from "openai";
import { getEnv } from "@/lib/env";

export function getOpenAIClient() {
  const env = getEnv();
  if (!env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: env.OPENAI_API_KEY });
}
