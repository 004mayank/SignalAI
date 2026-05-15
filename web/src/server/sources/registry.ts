export type SourceType =
  | "rss"
  | "arxiv"
  | "github"
  | "huggingface"
  | "reddit"
  | "hn"
  | "producthunt"
  | "twitter";

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
  // Research — focused on LLMs, agents, and practical ML
  {
    name: "arXiv LLMs",
    type: "arxiv",
    url: "http://export.arxiv.org/api/query?search_query=cat:cs.CL+AND+(ti:LLM+OR+ti:language+model+OR+ti:agent+OR+ti:reasoning+OR+ti:instruction+OR+ti:RLHF+OR+ti:alignment)&sortBy=submittedDate&sortOrder=descending",
    weight: 4,
    layer: "research",
  },
  {
    name: "arXiv Agents",
    type: "arxiv",
    url: "http://export.arxiv.org/api/query?search_query=cat:cs.AI+AND+(ti:agent+OR+ti:agentic+OR+ti:autonomous+OR+ti:multi-agent+OR+ti:tool+use)&sortBy=submittedDate&sortOrder=descending",
    weight: 4,
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
    url: "https://deepmind.google/blog/rss.xml",
    weight: 5,
    layer: "labs",
  },
  {
    name: "Meta AI Blog",
    type: "rss",
    url: "https://engineering.fb.com/category/ml-applications/feed/",
    weight: 4,
    layer: "labs",
  },
  {
    name: "Google AI Blog",
    type: "rss",
    url: "https://blog.google/innovation-and-ai/technology/ai/rss/",
    weight: 4,
    layer: "distribution",
  },
  {
    name: "Microsoft AI Blog",
    type: "rss",
    url: "https://blogs.microsoft.com/ai/feed/",
    weight: 4,
    layer: "distribution",
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
    url: "https://huggingface.co/api/models",
    weight: 5,
    layer: "builder",
  },
  {
    name: "LangChain Blog",
    type: "rss",
    url: "https://blog.langchain.dev/rss/",
    weight: 4,
    layer: "builder",
  },

  // Community
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
];
