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
  // Can be a function so date-relative queries are always current at ingest time.
  url: string | (() => string);
  weight: number; // 1..5
  layer: SourceLayer;
};

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Base GitHub search URL helper.
function gh(q: string, sort: "updated" | "stars" = "updated", perPage = 20): string {
  return `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=${sort}&order=desc&per_page=${perPage}`;
}

export const SOURCES: SourceConfig[] = [
  // ── Research ────────────────────────────────────────────────────────────────
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

  // ── Labs ────────────────────────────────────────────────────────────────────
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

  // ── Builder: GitHub — established active repos ───────────────────────────────
  {
    name: "GitHub AI Agents",
    type: "github",
    url: gh("topic:ai-agents topic:llm"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub MCP Servers",
    type: "github",
    url: gh("topic:mcp-server"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Model Context Protocol",
    type: "github",
    url: gh("topic:model-context-protocol"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Autonomous Agents",
    type: "github",
    url: gh("topic:ai-agent"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub LLM Tools",
    type: "github",
    url: gh("topic:llm"),
    weight: 4,
    layer: "builder",
  },
  {
    name: "GitHub Claude Tools",
    type: "github",
    url: gh("claude agent OR claude mcp OR claude-code"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub AI Workflows",
    type: "github",
    url: gh("topic:github-actions topic:llm"),
    weight: 4,
    layer: "builder",
  },

  // RAG and retrieval
  {
    name: "GitHub RAG Systems",
    type: "github",
    url: gh("topic:rag topic:llm"),
    weight: 5,
    layer: "builder",
  },

  // Fine-tuning and LoRA
  {
    name: "GitHub Fine-Tuning LLMs",
    type: "github",
    url: gh("topic:fine-tuning topic:llm"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub LoRA Training",
    type: "github",
    url: gh("topic:lora topic:llm"),
    weight: 4,
    layer: "builder",
  },

  // Inference and serving
  {
    name: "GitHub LLM Serving",
    type: "github",
    url: gh("topic:llm-inference"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Ollama Ecosystem",
    type: "github",
    url: gh("topic:ollama"),
    weight: 5,
    layer: "builder",
  },

  // Frameworks
  {
    name: "GitHub LangChain Ecosystem",
    type: "github",
    url: gh("topic:langchain"),
    weight: 4,
    layer: "builder",
  },
  {
    name: "GitHub LlamaIndex Ecosystem",
    type: "github",
    url: gh("topic:llamaindex"),
    weight: 4,
    layer: "builder",
  },

  // Multimodal and vision
  {
    name: "GitHub Multimodal AI",
    type: "github",
    url: gh("topic:multimodal topic:llm"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Vision AI",
    type: "github",
    url: gh("topic:computer-vision topic:llm"),
    weight: 4,
    layer: "builder",
  },

  // Code AI
  {
    name: "GitHub Code AI",
    type: "github",
    url: gh("topic:code-generation topic:llm"),
    weight: 5,
    layer: "builder",
  },

  // Evaluation and benchmarks
  {
    name: "GitHub LLM Evaluation",
    type: "github",
    url: gh("topic:llm-evaluation"),
    weight: 4,
    layer: "research",
  },

  // Embeddings and vector search
  {
    name: "GitHub Embeddings",
    type: "github",
    url: gh("topic:embeddings topic:llm"),
    weight: 4,
    layer: "builder",
  },
  {
    name: "GitHub Vector Databases",
    type: "github",
    url: gh("topic:vector-database"),
    weight: 4,
    layer: "builder",
  },

  // Prompt engineering
  {
    name: "GitHub Prompt Engineering",
    type: "github",
    url: gh("topic:prompt-engineering"),
    weight: 4,
    layer: "builder",
  },

  // AI safety and alignment
  {
    name: "GitHub AI Safety",
    type: "github",
    url: gh("topic:ai-safety"),
    weight: 4,
    layer: "research",
  },

  // ── Emerging AI categories ──────────────────────────────────────────────────
  {
    name: "GitHub Browser Agents",
    type: "github",
    url: gh("topic:browser-use topic:llm"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Computer Use Agents",
    type: "github",
    url: gh("computer-use agent llm stars:>30"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub AI Coding Assistants",
    type: "github",
    url: gh("topic:coding-assistant topic:llm"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Multi-Agent Systems",
    type: "github",
    url: gh("topic:multi-agent topic:llm"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Voice AI",
    type: "github",
    url: gh("topic:voice-ai OR topic:tts topic:llm"),
    weight: 4,
    layer: "builder",
  },
  {
    name: "GitHub OpenAI Compatible",
    type: "github",
    url: gh("topic:openai-compatible"),
    weight: 4,
    layer: "builder",
  },
  {
    name: "GitHub Reasoning Models",
    type: "github",
    url: gh("topic:chain-of-thought topic:llm"),
    weight: 5,
    layer: "research",
  },
  {
    name: "GitHub AI Memory Systems",
    type: "github",
    url: gh("topic:memory topic:llm-agent"),
    weight: 4,
    layer: "builder",
  },
  {
    name: "GitHub Agentic Frameworks",
    type: "github",
    url: gh("topic:agentic-ai"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Local LLMs",
    type: "github",
    url: gh("topic:local-llm"),
    weight: 4,
    layer: "builder",
  },

  // ── Viral / Early trend detection ────────────────────────────────────────────
  // New repos (created last 60 days) with star traction, sorted by stars.
  // Function URLs so the date is always current at ingest time.
  {
    name: "GitHub Viral AI Agents",
    type: "github",
    url: () => gh(`topic:llm-agents created:>${daysAgo(60)} stars:>10`, "stars"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Viral LLMs",
    type: "github",
    url: () => gh(`topic:llm created:>${daysAgo(60)} stars:>10`, "stars"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Rising AI Tools",
    type: "github",
    url: () => gh(`topic:ai-tools created:>${daysAgo(90)} stars:>5`, "stars"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Trending AI",
    type: "github",
    // Broadly AI-relevant repos pushed in the last 7 days with momentum.
    url: () => gh(`topic:artificial-intelligence pushed:>${daysAgo(7)} stars:>50`, "stars"),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub New MCP Tools",
    type: "github",
    url: () => gh(`topic:mcp-server created:>${daysAgo(60)}`, "stars"),
    weight: 5,
    layer: "builder",
  },
  // Flash-viral: repos < 7 days old already gaining stars — earliest possible signal.
  {
    name: "GitHub Flash Viral AI",
    type: "github",
    url: () => gh(`topic:llm created:>${daysAgo(7)} stars:>5`, "stars", 30),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Flash Viral Agents",
    type: "github",
    url: () => gh(`topic:ai-agent created:>${daysAgo(7)} stars:>3`, "stars", 30),
    weight: 5,
    layer: "builder",
  },
  {
    name: "GitHub Flash New MCP",
    type: "github",
    url: () => gh(`topic:mcp created:>${daysAgo(14)} stars:>5`, "stars", 20),
    weight: 5,
    layer: "builder",
  },
  // Repos with extreme recent star velocity: any AI topic, pushed last 3 days, 100+ stars.
  {
    name: "GitHub Surging AI",
    type: "github",
    url: () => gh(`topic:artificial-intelligence pushed:>${daysAgo(3)} stars:>100`, "stars", 30),
    weight: 5,
    layer: "builder",
  },

  // ── Community / HuggingFace ─────────────────────────────────────────────────
  {
    name: "Hugging Face Models",
    type: "huggingface",
    url: "https://huggingface.co/api/models",
    weight: 5,
    layer: "builder",
  },
  {
    name: "Hacker News",
    type: "hn",
    url: "https://hacker-news.firebaseio.com/v0/topstories.json",
    weight: 3,
    layer: "community",
  },

  // ── Startups ────────────────────────────────────────────────────────────────
  {
    name: "Product Hunt AI",
    type: "producthunt",
    url: "https://www.producthunt.com/topics/artificial-intelligence",
    weight: 4,
    layer: "startup",
  },
];
