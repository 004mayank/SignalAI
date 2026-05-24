import type { SourceLayer, SourceType } from "@/server/sources/registry";

export type NormalizedItem = {
  title: string;
  content: string;
  source: string;
  source_type: SourceType;
  layer: SourceLayer;
  url: string;
  created_at: Date;
  repo_created_at?: Date | null;
  engagement: {
    stars?: number;
    upvotes?: number;
    comments?: number;
  };
};
