import type { SourceConfig } from "@/server/sources/registry";
import type { NormalizedItem } from "@/server/sources/normalized";

interface HFModel {
  id: string;
  modelId?: string;
  createdAt?: string;
  lastModified?: string;
  downloads?: number;
  likes?: number;
  pipeline_tag?: string;
  tags?: string[];
  author?: string;
}

export async function ingestHuggingFace(source: SourceConfig, limit = 20): Promise<NormalizedItem[]> {
  const url = `https://huggingface.co/api/models?sort=trending&limit=${limit}`;
  const resp = await fetch(url, {
    headers: { "User-Agent": "SignalAI/1.0 (+https://signalai.app)" },
  });
  if (!resp.ok) throw new Error(`Hugging Face API fetch failed: ${resp.status}`);

  let models: HFModel[];
  try {
    models = await resp.json();
  } catch {
    throw new Error("Hugging Face API returned non-JSON response");
  }

  return models
    .filter((model) => !!(model.id ?? model.modelId))
    .slice(0, limit)
    .map((model) => {
      const modelId = (model.id ?? model.modelId)!;
      const slashIdx = modelId.indexOf("/");
      const [org, name] =
        slashIdx >= 0
          ? [modelId.slice(0, slashIdx), modelId.slice(slashIdx + 1)]
          : ["huggingface", modelId];
      const title = `${name} by ${org}`;
      const modelUrl = `https://huggingface.co/${modelId}`;
      const pipelineInfo = model.pipeline_tag ? ` Pipeline: ${model.pipeline_tag}.` : "";
      const tagsInfo = model.tags?.length ? ` Tags: ${model.tags.slice(0, 5).join(", ")}.` : "";
      const content = `Trending model on Hugging Face: ${modelId}.${pipelineInfo} Downloads: ${model.downloads ?? 0}, Likes: ${model.likes ?? 0}.${tagsInfo}`;
      return {
        title,
        content,
        source: source.name,
        source_type: source.type,
        layer: source.layer,
        url: modelUrl,
        created_at: model.createdAt ? new Date(model.createdAt) : model.lastModified ? new Date(model.lastModified) : new Date(),
        engagement: {
          stars: model.likes,
        },
      } satisfies NormalizedItem;
    });
}
