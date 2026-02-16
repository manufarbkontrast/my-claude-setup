export interface SkillEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly keywords: readonly string[];
  readonly category: string;
  readonly path: string;
  readonly contentSummary: string;
}

export interface AgentEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly role: string;
  readonly tools: readonly string[];
  readonly model: string;
  readonly path: string;
  readonly contentSummary: string;
}

export interface CommandEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly usage: string;
  readonly relatedSkills: readonly string[];
  readonly path: string;
  readonly contentSummary: string;
}

export interface RuleEntry {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly path: string;
  readonly contentSummary: string;
}

export interface HookEntry {
  readonly id: string;
  readonly type: string;
  readonly matcher: string;
  readonly description: string;
}

export interface Registry {
  readonly skills: readonly SkillEntry[];
  readonly agents: readonly AgentEntry[];
  readonly commands: readonly CommandEntry[];
  readonly rules: readonly RuleEntry[];
  readonly hooks: readonly HookEntry[];
  readonly metadata: {
    readonly generatedAt: string;
    readonly skillCount: number;
    readonly agentCount: number;
    readonly commandCount: number;
    readonly ruleCount: number;
    readonly hookCount: number;
  };
}

export interface MatchResult {
  readonly item: SkillEntry | AgentEntry | CommandEntry | RuleEntry;
  readonly score: number;
  readonly matchType: "keyword" | "fuzzy" | "category";
}

export interface OptimizedPrompt {
  readonly originalPrompt: string;
  readonly skills: readonly SkillEntry[];
  readonly agents: readonly AgentEntry[];
  readonly commands: readonly CommandEntry[];
  readonly rules: readonly RuleEntry[];
  readonly optimizedText: string;
}
