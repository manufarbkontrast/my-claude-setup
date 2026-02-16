import Fuse from "fuse.js";
import type {
  Registry,
  SkillEntry,
  AgentEntry,
  CommandEntry,
  RuleEntry,
} from "./types.js";

interface ScoredItem<T> {
  readonly item: T;
  readonly score: number;
  readonly matchType: "keyword" | "fuzzy" | "category";
}

// --- Tokenizer ---

function tokenize(text: string): readonly string[] {
  return Object.freeze(
    text
      .toLowerCase()
      .replace(/[^a-z0-9äöüß\s.-]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 1)
  );
}

// --- Keyword Matching ---

function keywordScore(
  tokens: readonly string[],
  keywords: readonly string[]
): number {
  let hits = 0;
  for (const kw of keywords) {
    for (const token of tokens) {
      if (token.includes(kw) || kw.includes(token)) {
        hits++;
        break;
      }
    }
  }
  return keywords.length > 0 ? hits / keywords.length : 0;
}

// --- Skill Matching ---

export function matchSkills(
  prompt: string,
  registry: Registry,
  limit = 10
): readonly ScoredItem<SkillEntry>[] {
  const tokens = tokenize(prompt);
  const results: ScoredItem<SkillEntry>[] = [];

  const lowerPrompt = prompt.toLowerCase();

  // Pass 1: Keyword matching with direct name boost
  for (const skill of registry.skills) {
    const kwScore = keywordScore(tokens, skill.keywords);
    // Also check if skill name or description words appear in prompt
    const nameTokens = tokenize(skill.name);
    const descTokens = tokenize(skill.description).slice(0, 20);
    const nameHits = nameTokens.filter((nt) =>
      tokens.some((t) => t.includes(nt) || nt.includes(t))
    ).length;
    const descHits = descTokens.filter((dt) =>
      tokens.some((t) => t.includes(dt) || dt.includes(t))
    ).length;

    const nameScore = nameTokens.length > 0 ? nameHits / nameTokens.length : 0;
    const descScore = descTokens.length > 0 ? descHits / descTokens.length : 0;

    let combinedScore = kwScore * 0.5 + nameScore * 0.3 + descScore * 0.2;

    // Direct name match boost: if the skill ID or name appears directly in the prompt
    const skillName = skill.name.toLowerCase();
    const skillId = skill.id.toLowerCase();
    if (lowerPrompt.includes(skillName) || lowerPrompt.includes(skillId)) {
      combinedScore += 0.6;
    }
    // Partial name match: require segment >= 5 chars to reduce false positives
    const segments = skillId.split("-");
    const matchingSegments = segments.filter(
      (seg) => seg.length >= 5 && lowerPrompt.includes(seg)
    );
    if (matchingSegments.length > 0) {
      combinedScore += 0.1 * matchingSegments.length;
    }

    if (combinedScore > 0.05) {
      results.push({ item: skill, score: combinedScore, matchType: "keyword" });
    }
  }

  // Pass 2: Fuse.js fuzzy search for anything we might have missed
  const fuse = new Fuse(registry.skills as SkillEntry[], {
    keys: [
      { name: "name", weight: 0.4 },
      { name: "description", weight: 0.4 },
      { name: "keywords", weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const fuseResults = fuse.search(prompt);
  const existingIds = new Set(results.map((r) => r.item.id));

  for (const fr of fuseResults) {
    if (!existingIds.has(fr.item.id)) {
      results.push({
        item: fr.item,
        score: 1 - (fr.score ?? 0.5),
        matchType: "fuzzy",
      });
    }
  }

  // Sort by score descending and take top N
  results.sort((a, b) => b.score - a.score);
  return Object.freeze(results.slice(0, limit));
}

// --- Agent Matching ---

export function matchAgents(
  prompt: string,
  registry: Registry,
  limit = 3
): readonly ScoredItem<AgentEntry>[] {
  const tokens = tokenize(prompt);
  const results: ScoredItem<AgentEntry>[] = [];

  // Task-type detection
  const taskSignals: Record<string, readonly string[]> = {
    planner: ["plan", "feature", "implement", "build", "create", "develop", "design"],
    architect: ["architecture", "design", "system", "scalability", "microservice", "pattern"],
    "tdd-guide": ["test", "tdd", "testing", "coverage", "unit", "integration"],
    "code-reviewer": ["review", "quality", "refactor", "code review"],
    "security-reviewer": ["security", "vulnerability", "auth", "csrf", "xss", "injection"],
    "build-error-resolver": ["build", "error", "compile", "fix", "broken"],
    "e2e-runner": ["e2e", "end-to-end", "playwright", "cypress", "browser test"],
    "refactor-cleaner": ["refactor", "cleanup", "dead code", "unused", "consolidate"],
    "doc-updater": ["documentation", "docs", "readme", "update docs"],
    "frontend-developer": ["react", "vue", "frontend", "component", "ui", "css", "tailwind", "responsive"],
    "backend-architect": ["api", "backend", "server", "endpoint", "rest", "graphql"],
    "database-architect": ["database", "schema", "migration", "sql", "postgres", "supabase"],
    "ai-engineer": ["ai", "llm", "rag", "embedding", "vector", "langchain", "chatbot", "agent"],
    "cloud-architect": ["aws", "azure", "gcp", "cloud", "infrastructure", "terraform"],
    "mobile-developer": ["mobile", "ios", "android", "react native", "flutter"],
    "devops-troubleshooter": ["devops", "ci/cd", "deploy", "docker", "kubernetes"],
    "performance-engineer": ["performance", "optimization", "slow", "latency", "cache"],
    "data-engineer": ["pipeline", "etl", "data", "spark", "airflow", "dbt"],
  };

  const lowerPrompt = prompt.toLowerCase();

  for (const agent of registry.agents) {
    let score = 0;

    // Check task signals
    const signals = taskSignals[agent.id];
    if (signals) {
      const signalHits = signals.filter((s) =>
        tokens.some((t) => t.includes(s) || s.includes(t))
      ).length;
      score = signals.length > 0 ? signalHits / signals.length : 0;
    }

    // Also check description match
    const descTokens = tokenize(agent.description).slice(0, 30);
    const descHits = descTokens.filter((dt) =>
      tokens.some((t) => t.includes(dt) || dt.includes(t))
    ).length;
    const descScore = descTokens.length > 0 ? descHits / descTokens.length : 0;

    score = Math.max(score, descScore);

    // Boost if agent name directly matches a prompt term
    const agentName = agent.id.toLowerCase();
    for (const segment of agentName.split("-")) {
      if (segment.length > 3 && lowerPrompt.includes(segment)) {
        score += 0.15;
        break;
      }
    }

    if (score > 0.05) {
      results.push({ item: agent, score, matchType: "keyword" });
    }
  }

  // Fuzzy fallback
  const fuse = new Fuse(registry.agents as AgentEntry[], {
    keys: [
      { name: "name", weight: 0.3 },
      { name: "description", weight: 0.5 },
      { name: "role", weight: 0.2 },
    ],
    threshold: 0.4,
    includeScore: true,
  });

  const fuseResults = fuse.search(prompt);
  const existingIds = new Set(results.map((r) => r.item.id));

  for (const fr of fuseResults) {
    if (!existingIds.has(fr.item.id)) {
      results.push({
        item: fr.item,
        score: 1 - (fr.score ?? 0.5),
        matchType: "fuzzy",
      });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return Object.freeze(results.slice(0, limit));
}

// --- Command Matching ---

export function matchCommands(
  prompt: string,
  registry: Registry,
  matchedSkillIds: readonly string[],
  limit = 5
): readonly ScoredItem<CommandEntry>[] {
  const tokens = tokenize(prompt);
  const results: ScoredItem<CommandEntry>[] = [];

  for (const cmd of registry.commands) {
    let score = 0;

    // Check name match
    const nameTokens = tokenize(cmd.name);
    const nameHits = nameTokens.filter((nt) =>
      tokens.some((t) => t.includes(nt) || nt.includes(t))
    ).length;
    score = nameTokens.length > 0 ? nameHits / nameTokens.length : 0;

    // Check description match
    const descTokens = tokenize(cmd.description).slice(0, 20);
    const descHits = descTokens.filter((dt) =>
      tokens.some((t) => t.includes(dt) || dt.includes(t))
    ).length;
    const descScore = descTokens.length > 0 ? descHits / descTokens.length : 0;

    score = Math.max(score, descScore);

    // Bonus if command relates to matched skills
    if (cmd.relatedSkills.some((rs) => matchedSkillIds.includes(rs))) {
      score += 0.3;
    }

    // Content summary match (weighted lower to reduce noise)
    const summaryTokens = tokenize(cmd.contentSummary).slice(0, 20);
    const summaryHits = summaryTokens.filter((st) =>
      tokens.some((t) => t.includes(st) || st.includes(t))
    ).length;
    const summaryScore = summaryTokens.length > 0 ? summaryHits / summaryTokens.length : 0;
    score = Math.max(score, summaryScore * 0.7);

    // Higher threshold for commands to reduce false positives
    if (score > 0.15) {
      results.push({ item: cmd, score, matchType: "keyword" });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return Object.freeze(results.slice(0, limit));
}

// --- Rule Matching ---

export function matchRules(
  prompt: string,
  registry: Registry
): readonly ScoredItem<RuleEntry>[] {
  const tokens = tokenize(prompt);
  const results: ScoredItem<RuleEntry>[] = [];

  // Rules are generally always applicable, but we can rank them
  const ruleRelevance: Record<string, readonly string[]> = {
    "coding-style": ["code", "style", "format", "implement", "build", "create", "develop"],
    "git-workflow": ["git", "commit", "pr", "push", "branch", "merge"],
    testing: ["test", "tdd", "coverage", "unit", "integration", "e2e"],
    security: ["security", "auth", "secret", "vulnerability", "injection"],
    performance: ["performance", "optimize", "fast", "slow", "cache", "bundle"],
    patterns: ["pattern", "architecture", "design", "repository", "api"],
    hooks: ["hook", "automation", "pre-commit", "post-commit", "format"],
    agents: ["agent", "parallel", "orchestrate", "multi-agent", "delegate"],
  };

  for (const rule of registry.rules) {
    const signals = ruleRelevance[rule.id] ?? [];
    const hits = signals.filter((s) =>
      tokens.some((t) => t.includes(s) || s.includes(t))
    ).length;
    const score = signals.length > 0 ? hits / signals.length : 0;

    if (score > 0) {
      results.push({ item: rule, score, matchType: "keyword" });
    }
  }

  results.sort((a, b) => b.score - a.score);
  return Object.freeze(results);
}
