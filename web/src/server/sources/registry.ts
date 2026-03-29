export type SourceType =
  | "rss"
  | "arxiv"
  | "github"
  | "huggingface"
  | "reddit"
  | "hn"
  | "producthunt";

export type SourceLayer =
  | "research"
  | "labs"
  | "builder"
  | "community"
  | "startup"
  | "distribution";

export type SourceConfig = {
  name: string;
  type: SourceType;
  url: string;
  weight: number; // 1..5
  layer: SourceLayer;
};

export const SOURCES: SourceConfig[] = [
  // Research
  {
    name: "arXiv AI",
    type: "arxiv",
    url: "http://export.arxiv.org/api/query?search_query=cat:cs.AI",
    weight: 3,
    layer: "research",
  },

  // Labs
  {
    name: "OpenAI Blog",
    type: "rss",
    url: "https://openai.com/blog/rss.xml",
    weight: 5,
    layer: "labs",
  },
  {
    name: "DeepMind Blog",
    type: "rss",
    url: "https://deepmind.google/discover/blog/rss.xml",
    weight: 5,
    layer: "labs",
  },
  {
    name: "Anthropic Blog",
    type: "rss",
    url: "https://www.anthropic.com/news/rss.xml",
    weight: 5,
    layer: "labs",
  },

  // Builder signals
  {
    name: "GitHub AI Trending",
    type: "github",
    url: "https://api.github.com/search/repositories?q=ai&sort=stars&order=desc",
    weight: 5,
    layer: "builder",
  },
  {
    name: "Hugging Face Models",
    type: "huggingface",
    url: "https://huggingface.co/models",
    weight: 5,
    layer: "builder",
  },

  // Community
  {
    name: "Reddit MachineLearning",
    type: "reddit",
    url: "https://www.reddit.com/r/MachineLearning.json",
    weight: 3,
    layer: "community",
  },
  {
    name: "Reddit LocalLLaMA",
    type: "reddit",
    url: "https://www.reddit.com/r/LocalLLaMA.json",
    weight: 3,
    layer: "community",
  },
  {
    name: "Reddit Artificial",
    type: "reddit",
    url: "https://www.reddit.com/r/artificial.json",
    weight: 3,
    layer: "community",
  },
  {
    name: "Hacker News",
    type: "hn",
    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    weight: 3,
    layer: "community",
  },

  // Startups
  {
    name: "Product Hunt AI",
    type: "producthunt",
    url: "https://www.producthunt.com/topics/artificial-intelligence",
    weight: 4,
    layer: "startup",
  },

  // Distribution
  {
    name: "Microsoft AI Blog",
    type: "rss",
    url: "https://blogs.microsoft.com/ai/feed/",
    weight: 4,
    layer: "distribution",
  },
  {
    name: "Google AI Blog",
    type: "rss",
    url: "https://ai.googleblog.com/feeds/posts/default",
    weight: 4,
    layer: "distribution",
  },
  {
    name: "Notion AI Updates",
    type: "rss",
    url: "https://www.notion.so/blog/rss.xml",
    weight: 4,
    layer: "distribution",
  },
];
