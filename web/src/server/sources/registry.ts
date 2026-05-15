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
  // Research — focused on LLMs, agents, and practical ML (cs.AI + cs.LG + cs.CL)
  // with keyword filter to avoid niche fringe papers
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

  // Community — Reddit via RSS (JSON API returns 403 from server environments)
  {
    name: "Reddit MachineLearning",
    type: "rss",
    url: "https://www.reddit.com/r/MachineLearning/.rss",
    weight: 3,
    layer: "community",
  },
  {
    name: "Reddit LocalLLaMA",
    type: "rss",
    url: "https://www.reddit.com/r/LocalLLaMA/.rss",
    weight: 3,
    layer: "community",
  },
  {
    name: "Reddit Artificial",
    type: "rss",
    url: "https://www.reddit.com/r/artificial/.rss",
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
    url: "https://blog.google/innovation-and-ai/technology/ai/rss/",
    weight: 4,
    layer: "distribution",
  },

  // Additional Labs
  {
    name: "Meta AI Blog",
    type: "rss",
    url: "https://engineering.fb.com/category/ml-applications/feed/",
    weight: 4,
    layer: "labs",
  },
  {
    name: "Mistral Blog",
    type: "rss",
    url: "https://mistral.ai/news/rss.xml",
    weight: 4,
    layer: "labs",
  },

  // Additional Builder signals
  {
    name: "LangChain Blog",
    type: "rss",
    url: "https://blog.langchain.dev/rss/",
    weight: 4,
    layer: "builder",
  },
  {
    name: "Weights & Biases",
    type: "rss",
    url: "https://wandb.ai/fully-connected/feed",
    weight: 3,
    layer: "builder",
  },

  // X / Twitter via Nitter RSS — use a more reliable public instance
  {
    name: "X: Sam Altman",
    type: "twitter",
    url: "https://nitter.poast.org/sama/rss",
    weight: 4,
    layer: "community",
  },
  {
    name: "X: Andrej Karpathy",
    type: "twitter",
    url: "https://nitter.poast.org/karpathy/rss",
    weight: 4,
    layer: "community",
  },
  {
    name: "X: Yann LeCun",
    type: "twitter",
    url: "https://nitter.poast.org/ylecun/rss",
    weight: 4,
    layer: "community",
  },
];
