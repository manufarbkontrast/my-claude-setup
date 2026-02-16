import * as fs from "node:fs";
import * as path from "node:path";
import type {
  Registry,
  SkillEntry,
  AgentEntry,
  CommandEntry,
  RuleEntry,
  HookEntry,
} from "./types.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

// --- Parsing helpers ---

function parseFrontmatter(content: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    return { frontmatter: {}, body: content };
  }

  const raw = match[1] ?? "";
  const body = match[2] ?? "";
  const frontmatter: Record<string, string> = {};

  for (const line of raw.split("\n")) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value = line.slice(colonIdx + 1).trim();
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    frontmatter[key] = value;
  }

  return { frontmatter, body };
}

function extractKeywords(
  name: string,
  description: string,
  body: string
): readonly string[] {
  const text = `${name} ${description} ${body.slice(0, 2000)}`.toLowerCase();

  // Technology / framework keywords to detect
  const techPatterns = [
    "react",
    "next.js",
    "nextjs",
    "vue",
    "nuxt",
    "angular",
    "svelte",
    "solid",
    "astro",
    "remix",
    "gatsby",
    "node",
    "nodejs",
    "deno",
    "bun",
    "express",
    "fastapi",
    "django",
    "flask",
    "rails",
    "laravel",
    "spring",
    "nest",
    "hono",
    "elysia",
    "typescript",
    "javascript",
    "python",
    "rust",
    "go",
    "golang",
    "java",
    "kotlin",
    "swift",
    "c#",
    "csharp",
    "dotnet",
    ".net",
    "ruby",
    "php",
    "elixir",
    "scala",
    "haskell",
    "julia",
    "dart",
    "flutter",
    "c++",
    "cpp",
    "postgres",
    "postgresql",
    "mysql",
    "mongodb",
    "redis",
    "sqlite",
    "supabase",
    "firebase",
    "prisma",
    "drizzle",
    "d1",
    "neon",
    "planetscale",
    "shopify",
    "stripe",
    "paypal",
    "woocommerce",
    "magento",
    "aws",
    "azure",
    "gcp",
    "cloudflare",
    "vercel",
    "netlify",
    "docker",
    "kubernetes",
    "k8s",
    "terraform",
    "helm",
    "github",
    "gitlab",
    "ci/cd",
    "cicd",
    "graphql",
    "rest",
    "grpc",
    "websocket",
    "sse",
    "oauth",
    "jwt",
    "auth",
    "authentication",
    "authorization",
    "rbac",
    "security",
    "testing",
    "jest",
    "vitest",
    "playwright",
    "cypress",
    "selenium",
    "tdd",
    "bdd",
    "seo",
    "accessibility",
    "a11y",
    "wcag",
    "performance",
    "optimization",
    "caching",
    "cdn",
    "rag",
    "llm",
    "ai",
    "ml",
    "embedding",
    "vector",
    "langchain",
    "openai",
    "anthropic",
    "claude",
    "tailwind",
    "css",
    "sass",
    "styled",
    "design-system",
    "ui",
    "ux",
    "responsive",
    "mobile",
    "ios",
    "android",
    "react-native",
    "pwa",
    "api",
    "microservices",
    "monorepo",
    "turborepo",
    "nx",
    "webpack",
    "vite",
    "esbuild",
    "rollup",
    "bundler",
    "blockchain",
    "web3",
    "solidity",
    "nft",
    "defi",
    "automation",
    "workflow",
    "temporal",
    "durable-objects",
    "workers",
    "edge",
    "serverless",
    "lambda",
    "mcp",
    "prompt",
    "agent",
    "debugging",
    "refactoring",
    "migration",
    "deployment",
    "monitoring",
    "observability",
    "logging",
    "tracing",
    "incident",
    "devops",
    "sre",
    "data-pipeline",
    "etl",
    "spark",
    "airflow",
    "dbt",
    "analytics",
    "dashboard",
    "report",
    "e-commerce",
    "checkout",
    "payment",
    "billing",
    "subscription",
    "content",
    "cms",
    "markdown",
    "documentation",
    "openapi",
    "swagger",
    "schema",
    "validation",
    "zod",
    "pydantic",
    "form",
    "upload",
    "image",
    "media",
    "video",
    "threejs",
    "3d",
    "animation",
    "motion",
    "canvas",
    "game",
    "unity",
    "godot",
    "firmware",
    "embedded",
    "iot",
    "arm",
    "cortex",
  ];

  const found = new Set<string>();
  for (const kw of techPatterns) {
    if (text.includes(kw)) {
      found.add(kw);
    }
  }

  // Add the name segments as keywords
  const nameSegments = name
    .split(/[-_./\\]/)
    .filter((s) => s.length > 2)
    .map((s) => s.toLowerCase());
  for (const seg of nameSegments) {
    found.add(seg);
  }

  return Object.freeze([...found]);
}

function summarize(body: string, maxLen = 200): string {
  // Take the first meaningful paragraph after the title
  const lines = body.split("\n").filter((l) => l.trim().length > 0);
  let summary = "";
  for (const line of lines) {
    const trimmed = line.trim();
    // Skip headings and code fences
    if (trimmed.startsWith("#") || trimmed.startsWith("```")) continue;
    // Skip frontmatter-like lines
    if (trimmed.startsWith("---")) continue;
    summary = trimmed;
    break;
  }
  if (summary.length > maxLen) {
    return summary.slice(0, maxLen - 3) + "...";
  }
  return summary || "No summary available";
}

function deriveCategory(dirPath: string): string {
  const dirName = path.basename(dirPath).toLowerCase();

  const categoryMap: Record<string, readonly string[]> = {
    "e-commerce": [
      "shopify",
      "woocommerce",
      "stripe",
      "paypal",
      "payment",
      "billing",
      "checkout",
    ],
    frontend: [
      "react",
      "vue",
      "angular",
      "svelte",
      "nextjs",
      "nuxt",
      "frontend",
      "css",
      "tailwind",
      "ui",
      "design",
      "responsive",
      "accessibility",
      "motion",
      "canvas",
      "threejs",
    ],
    backend: [
      "express",
      "fastapi",
      "django",
      "flask",
      "nest",
      "hono",
      "rails",
      "spring",
      "backend",
      "api",
      "rest",
      "graphql",
      "grpc",
      "websocket",
    ],
    database: [
      "postgres",
      "mysql",
      "mongo",
      "redis",
      "sqlite",
      "supabase",
      "prisma",
      "drizzle",
      "database",
      "sql",
      "migration",
      "schema",
    ],
    devops: [
      "docker",
      "kubernetes",
      "k8s",
      "terraform",
      "helm",
      "ci",
      "cd",
      "github-actions",
      "gitlab",
      "deploy",
      "monitor",
      "observability",
      "logging",
    ],
    security: [
      "security",
      "auth",
      "oauth",
      "jwt",
      "rbac",
      "csrf",
      "xss",
      "sast",
      "vulnerability",
      "secrets",
      "compliance",
    ],
    testing: [
      "test",
      "jest",
      "vitest",
      "playwright",
      "cypress",
      "tdd",
      "bdd",
      "e2e",
      "coverage",
      "mutation",
    ],
    ai: [
      "ai",
      "ml",
      "llm",
      "rag",
      "embedding",
      "vector",
      "langchain",
      "prompt",
      "agent",
      "model",
    ],
    cloud: [
      "aws",
      "azure",
      "gcp",
      "cloudflare",
      "workers",
      "serverless",
      "lambda",
      "edge",
      "durable",
    ],
    mobile: [
      "mobile",
      "ios",
      "android",
      "react-native",
      "flutter",
      "swift",
      "kotlin",
      "pwa",
      "app-store",
    ],
    data: [
      "data",
      "pipeline",
      "etl",
      "spark",
      "airflow",
      "dbt",
      "analytics",
      "dashboard",
    ],
    content: ["seo", "content", "cms", "markdown", "documentation", "doc"],
    architecture: [
      "architecture",
      "pattern",
      "microservices",
      "monorepo",
      "event",
      "cqrs",
      "saga",
      "ddd",
    ],
    language: [
      "typescript",
      "javascript",
      "python",
      "rust",
      "go",
      "golang",
      "java",
      "ruby",
      "php",
      "elixir",
      "scala",
      "haskell",
      "julia",
      "cpp",
      "csharp",
      "swift",
      "dart",
      "bash",
    ],
    blockchain: [
      "blockchain",
      "web3",
      "solidity",
      "nft",
      "defi",
      "smart-contract",
    ],
    automation: [
      "automation",
      "workflow",
      "temporal",
      "hook",
      "script",
      "shell",
    ],
    gaming: ["game", "unity", "godot", "3d", "ecs"],
    embedded: ["firmware", "embedded", "iot", "arm", "cortex"],
  };

  for (const [category, patterns] of Object.entries(categoryMap)) {
    for (const pat of patterns) {
      if (dirName.includes(pat)) {
        return category;
      }
    }
  }

  return "general";
}

// --- Scanners ---

function scanSkills(): readonly SkillEntry[] {
  const skillsDir = path.join(REPO_ROOT, "skills");
  if (!fs.existsSync(skillsDir)) return [];

  const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
  const skills: SkillEntry[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const skillDir = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillDir, "SKILL.md");

    if (!fs.existsSync(skillFile)) continue;

    const content = fs.readFileSync(skillFile, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    const id = entry.name;
    const name = frontmatter.name || entry.name;
    const description = frontmatter.description || "";
    const keywords = extractKeywords(name, description, body);
    const category = deriveCategory(skillDir);
    const contentSummary = summarize(body);

    skills.push(
      Object.freeze({
        id,
        name,
        description,
        keywords,
        category,
        path: `skills/${entry.name}/SKILL.md`,
        contentSummary,
      })
    );
  }

  return Object.freeze(skills);
}

function scanAgents(): readonly AgentEntry[] {
  const agentsDir = path.join(REPO_ROOT, "agents");
  if (!fs.existsSync(agentsDir)) return [];

  const files = fs.readdirSync(agentsDir).filter((f) => f.endsWith(".md"));
  const agents: AgentEntry[] = [];

  for (const file of files) {
    const filePath = path.join(agentsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    const id = file.replace(".md", "");
    const name = frontmatter.name || id;
    const description = frontmatter.description || "";
    const role = body.split("\n").find((l) => l.startsWith("You are"))?.trim() || "";

    // Parse tools array from frontmatter
    let tools: string[] = [];
    if (frontmatter.tools) {
      try {
        tools = JSON.parse(frontmatter.tools);
      } catch {
        tools = frontmatter.tools.split(",").map((t: string) => t.trim());
      }
    }

    const model = frontmatter.model || "sonnet";
    const contentSummary = summarize(body);

    agents.push(
      Object.freeze({
        id,
        name,
        description,
        role,
        tools: Object.freeze(tools),
        model,
        path: `agents/${file}`,
        contentSummary,
      })
    );
  }

  return Object.freeze(agents);
}

function scanCommands(): readonly CommandEntry[] {
  const commandsDir = path.join(REPO_ROOT, "commands");
  if (!fs.existsSync(commandsDir)) return [];

  const files = fs.readdirSync(commandsDir).filter((f) => f.endsWith(".md"));
  const commands: CommandEntry[] = [];

  for (const file of files) {
    const filePath = path.join(commandsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(content);

    const id = file.replace(".md", "");
    const name = id;
    const description = frontmatter.description || "";

    // Try to find usage from body
    const usageMatch = body.match(/## Usage\n([\s\S]*?)(?=\n##|\n$)/);
    const usage = usageMatch ? (usageMatch[1] ?? "").trim().slice(0, 200) : "";

    // Find related skills by scanning body for skill references
    const relatedSkills: string[] = [];
    const skillRefPattern = /skills\/([a-z0-9-]+)/gi;
    let skillMatch;
    while ((skillMatch = skillRefPattern.exec(body)) !== null) {
      if (skillMatch[1]) relatedSkills.push(skillMatch[1]);
    }

    const contentSummary = summarize(body);

    commands.push(
      Object.freeze({
        id,
        name,
        description,
        usage,
        relatedSkills: Object.freeze(relatedSkills),
        path: `commands/${file}`,
        contentSummary,
      })
    );
  }

  return Object.freeze(commands);
}

function scanRules(): readonly RuleEntry[] {
  const rulesDir = path.join(REPO_ROOT, "rules");
  if (!fs.existsSync(rulesDir)) return [];

  const files = fs.readdirSync(rulesDir).filter((f) => f.endsWith(".md"));
  const rules: RuleEntry[] = [];

  for (const file of files) {
    const filePath = path.join(rulesDir, file);
    const content = fs.readFileSync(filePath, "utf-8");
    const { body } = parseFrontmatter(content);

    const id = file.replace(".md", "");
    const name = id
      .split("-")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");

    // First heading or first paragraph as description
    const firstHeading = body.match(/^#\s+(.+)$/m);
    const description = (firstHeading ? firstHeading[1] : name) ?? name;
    const contentSummary = summarize(body);

    rules.push(
      Object.freeze({
        id,
        name,
        description,
        path: `rules/${file}`,
        contentSummary,
      })
    );
  }

  return Object.freeze(rules);
}

function scanHooks(): readonly HookEntry[] {
  const settingsFile = path.join(REPO_ROOT, "settings.json");
  if (!fs.existsSync(settingsFile)) return [];

  const settings = JSON.parse(fs.readFileSync(settingsFile, "utf-8"));
  const hooksConfig = settings.hooks;
  if (!hooksConfig) return [];

  const hooks: HookEntry[] = [];
  let idx = 0;

  for (const [hookType, hookList] of Object.entries(hooksConfig)) {
    if (!Array.isArray(hookList)) continue;
    for (const entry of hookList) {
      const hookEntry = entry as {
        matcher?: string;
        description?: string;
        hooks?: Array<{ type?: string; command?: string }>;
      };
      hooks.push(
        Object.freeze({
          id: `hook-${idx++}`,
          type: hookType,
          matcher: hookEntry.matcher || "",
          description: hookEntry.description || "",
        })
      );
    }
  }

  return Object.freeze(hooks);
}

// --- Main ---

function buildRegistry(): Registry {
  console.log("Scanning skills...");
  const skills = scanSkills();
  console.log(`  Found ${skills.length} skills`);

  console.log("Scanning agents...");
  const agents = scanAgents();
  console.log(`  Found ${agents.length} agents`);

  console.log("Scanning commands...");
  const commands = scanCommands();
  console.log(`  Found ${commands.length} commands`);

  console.log("Scanning rules...");
  const rules = scanRules();
  console.log(`  Found ${rules.length} rules`);

  console.log("Scanning hooks...");
  const hooks = scanHooks();
  console.log(`  Found ${hooks.length} hooks`);

  const registry: Registry = Object.freeze({
    skills,
    agents,
    commands,
    rules,
    hooks,
    metadata: Object.freeze({
      generatedAt: new Date().toISOString(),
      skillCount: skills.length,
      agentCount: agents.length,
      commandCount: commands.length,
      ruleCount: rules.length,
      hookCount: hooks.length,
    }),
  });

  return registry;
}

const registry = buildRegistry();
const outputPath = path.join(REPO_ROOT, "registry.json");
fs.writeFileSync(outputPath, JSON.stringify(registry, null, 2), "utf-8");

console.log(`\nRegistry written to ${outputPath}`);
console.log(
  `Total: ${registry.metadata.skillCount} skills, ${registry.metadata.agentCount} agents, ${registry.metadata.commandCount} commands, ${registry.metadata.ruleCount} rules, ${registry.metadata.hookCount} hooks`
);
