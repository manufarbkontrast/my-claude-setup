import * as fs from "node:fs";
import * as path from "node:path";
import type { Registry, OptimizedPrompt } from "./types.js";
import { matchSkills, matchAgents, matchCommands, matchRules } from "./matcher.js";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

function loadRegistry(): Registry {
  const registryPath = path.join(REPO_ROOT, "registry.json");
  if (!fs.existsSync(registryPath)) {
    console.error(
      "registry.json not found. Run `node dist/build-registry.js` first."
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(registryPath, "utf-8")) as Registry;
}

function detectTaskType(prompt: string): string {
  const lower = prompt.toLowerCase();

  const taskPatterns: readonly (readonly [string, readonly string[]])[] = [
    ["feature-development", ["erstelle", "create", "build", "implement", "add", "develop", "baue", "mach"]],
    ["debugging", ["fix", "debug", "error", "bug", "broken", "failing", "repariere", "fehler"]],
    ["refactoring", ["refactor", "cleanup", "reorganize", "modernize", "migrate", "umstrukturieren"]],
    ["testing", ["test", "coverage", "tdd", "e2e", "unit test", "integration test"]],
    ["architecture", ["design", "architect", "plan", "structure", "entwerfe", "konzipiere"]],
    ["optimization", ["optimize", "performance", "speed", "cache", "bundle", "lazy", "optimiere"]],
    ["deployment", ["deploy", "ci/cd", "pipeline", "docker", "kubernetes", "release"]],
    ["documentation", ["document", "docs", "readme", "api docs", "dokumentiere"]],
    ["security-review", ["security", "audit", "vulnerability", "penetration", "sicherheit"]],
    ["data-work", ["data", "pipeline", "etl", "analytics", "dashboard", "report", "daten"]],
  ];

  for (const [taskType, keywords] of taskPatterns) {
    if (keywords.some((kw) => lower.includes(kw))) {
      return taskType;
    }
  }

  return "general";
}

function detectTechnologies(prompt: string): readonly string[] {
  const lower = prompt.toLowerCase();
  const techs: string[] = [];

  const techMap: Record<string, readonly string[]> = {
    "Next.js": ["next.js", "nextjs", "next js"],
    React: ["react"],
    Vue: ["vue", "vuejs"],
    Nuxt: ["nuxt"],
    Angular: ["angular"],
    Svelte: ["svelte", "sveltekit"],
    "Node.js": ["node.js", "nodejs", "node js"],
    Express: ["express"],
    FastAPI: ["fastapi", "fast api"],
    Django: ["django"],
    Flask: ["flask"],
    "Spring Boot": ["spring", "springboot", "spring boot"],
    Hono: ["hono"],
    TypeScript: ["typescript", "ts"],
    Python: ["python"],
    Rust: ["rust"],
    Go: ["go ", "golang"],
    Java: ["java "],
    Ruby: ["ruby", "rails"],
    PHP: ["php", "laravel"],
    PostgreSQL: ["postgres", "postgresql"],
    MySQL: ["mysql"],
    MongoDB: ["mongodb", "mongo"],
    Redis: ["redis"],
    SQLite: ["sqlite"],
    Supabase: ["supabase"],
    Firebase: ["firebase"],
    Prisma: ["prisma"],
    Drizzle: ["drizzle"],
    Shopify: ["shopify"],
    Stripe: ["stripe"],
    PayPal: ["paypal"],
    WooCommerce: ["woocommerce"],
    AWS: ["aws", "amazon web services"],
    Azure: ["azure"],
    GCP: ["gcp", "google cloud"],
    Cloudflare: ["cloudflare", "workers"],
    Vercel: ["vercel"],
    Docker: ["docker"],
    Kubernetes: ["kubernetes", "k8s"],
    Terraform: ["terraform"],
    "GitHub Actions": ["github actions"],
    GraphQL: ["graphql"],
    REST: ["rest api", "restful"],
    gRPC: ["grpc"],
    WebSocket: ["websocket"],
    Tailwind: ["tailwind"],
    "Shadcn/ui": ["shadcn"],
    Playwright: ["playwright"],
    Jest: ["jest"],
    Vitest: ["vitest"],
    LangChain: ["langchain"],
    "Claude API": ["claude", "anthropic"],
    OpenAI: ["openai", "gpt"],
    Flutter: ["flutter"],
    "React Native": ["react native"],
    Bun: ["bun"],
    Deno: ["deno"],
    "better-auth": ["better-auth", "better auth"],
    OAuth: ["oauth", "oauth2"],
    "Drizzle ORM": ["drizzle"],
    Zod: ["zod"],
  };

  for (const [tech, patterns] of Object.entries(techMap)) {
    if (patterns.some((p) => lower.includes(p))) {
      techs.push(tech);
    }
  }

  return Object.freeze(techs);
}

function formatOutput(result: OptimizedPrompt): string {
  const lines: string[] = [];

  lines.push("# Optimierter Prompt");
  lines.push("");
  lines.push("## Kontext");
  lines.push(result.originalPrompt);
  lines.push("");

  // Skills
  if (result.skills.length > 0) {
    lines.push("## Relevante Skills (automatisch erkannt)");
    lines.push("");

    const primary = result.skills.slice(0, 5);
    const secondary = result.skills.slice(5);

    lines.push("### Primaer");
    for (const skill of primary) {
      lines.push(
        `- **${skill.name}**: ${skill.description.slice(0, 120)}${skill.description.length > 120 ? "..." : ""}`
      );
      lines.push(`  Nutze: \`${skill.path}\``);
    }

    if (secondary.length > 0) {
      lines.push("");
      lines.push("### Sekundaer");
      for (const skill of secondary) {
        lines.push(
          `- **${skill.name}**: ${skill.contentSummary}`
        );
      }
    }
    lines.push("");
  }

  // Agents
  if (result.agents.length > 0) {
    lines.push("## Empfohlene Agents");
    lines.push("");
    for (const agent of result.agents) {
      lines.push(
        `- **${agent.name}** (${agent.model}): ${agent.description.slice(0, 150)}${agent.description.length > 150 ? "..." : ""}`
      );
      lines.push(`  Pfad: \`${agent.path}\``);
    }
    lines.push("");
  }

  // Commands
  if (result.commands.length > 0) {
    lines.push("## Empfohlene Commands");
    lines.push("");
    for (const cmd of result.commands) {
      const desc =
        cmd.description || cmd.contentSummary.slice(0, 100);
      lines.push(`- \`/${cmd.name}\` - ${desc}`);
    }
    lines.push("");
  }

  // Rules
  if (result.rules.length > 0) {
    lines.push("## Anwendbare Regeln");
    lines.push("");
    for (const rule of result.rules) {
      lines.push(`- **${rule.name}**: ${rule.description}`);
    }
    lines.push("");
  }

  // Optimized prompt
  lines.push("## Optimierter Prompt");
  lines.push("---");
  lines.push(result.optimizedText);
  lines.push("---");

  return lines.join("\n");
}

function buildOptimizedText(
  prompt: string,
  result: Omit<OptimizedPrompt, "optimizedText">
): string {
  const taskType = detectTaskType(prompt);
  const techs = detectTechnologies(prompt);

  const parts: string[] = [];

  parts.push(prompt);
  parts.push("");

  if (techs.length > 0) {
    parts.push(
      `Erkannte Technologien: ${techs.join(", ")}`
    );
    parts.push("");
  }

  parts.push(`Aufgabentyp: ${taskType}`);
  parts.push("");

  if (result.skills.length > 0) {
    parts.push("Nutze folgende Skills als Referenz:");
    for (const skill of result.skills.slice(0, 5)) {
      parts.push(`- ${skill.name} (${skill.path})`);
    }
    parts.push("");
  }

  if (result.agents.length > 0) {
    const primaryAgent = result.agents[0];
    if (primaryAgent) {
      parts.push(
        `Verwende den **${primaryAgent.name}** Agent fuer diese Aufgabe.`
      );
      parts.push("");
    }
  }

  if (result.commands.length > 0) {
    parts.push("Empfohlene Commands:");
    for (const cmd of result.commands.slice(0, 3)) {
      parts.push(`- /${cmd.name}`);
    }
    parts.push("");
  }

  if (result.rules.length > 0) {
    parts.push("Beachte diese Regeln:");
    for (const rule of result.rules) {
      parts.push(`- ${rule.name} (${rule.path})`);
    }
  }

  return parts.join("\n");
}

// --- Main ---

function main(): void {
  const prompt = process.argv.slice(2).join(" ");

  if (!prompt) {
    // Read from stdin if no args
    const chunks: Buffer[] = [];
    process.stdin.on("data", (chunk: Buffer) => chunks.push(chunk));
    process.stdin.on("end", () => {
      const stdinPrompt = Buffer.concat(chunks).toString("utf-8").trim();
      if (!stdinPrompt) {
        console.error("Usage: node optimize-prompt.js <prompt>");
        console.error('   or: echo "prompt" | node optimize-prompt.js');
        process.exit(1);
      }
      runOptimizer(stdinPrompt);
    });
    return;
  }

  runOptimizer(prompt);
}

function runOptimizer(prompt: string): void {
  const registry = loadRegistry();

  console.error(`Analyzing prompt: "${prompt.slice(0, 80)}..."`);
  console.error(`Task type: ${detectTaskType(prompt)}`);
  console.error(`Technologies: ${detectTechnologies(prompt).join(", ") || "none detected"}`);
  console.error("");

  // Match everything
  const skills = matchSkills(prompt, registry, 10);
  const agents = matchAgents(prompt, registry, 3);
  const matchedSkillIds = skills.map((s) => s.item.id);
  const commands = matchCommands(prompt, registry, matchedSkillIds, 5);
  const rules = matchRules(prompt, registry);

  console.error(`Matched: ${skills.length} skills, ${agents.length} agents, ${commands.length} commands, ${rules.length} rules`);
  console.error("");

  const partialResult = {
    originalPrompt: prompt,
    skills: skills.map((s) => s.item),
    agents: agents.map((a) => a.item),
    commands: commands.map((c) => c.item),
    rules: rules.map((r) => r.item),
  };

  const optimizedText = buildOptimizedText(prompt, partialResult);

  const result: OptimizedPrompt = {
    ...partialResult,
    optimizedText,
  };

  // Output formatted result to stdout
  console.log(formatOutput(result));
}

main();
