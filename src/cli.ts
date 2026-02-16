#!/usr/bin/env node

import * as path from "node:path";
import * as fs from "node:fs";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);

function printHelp(): void {
  console.log(`
prompt-optimizer - Optimize prompts using your Claude Code skills, agents & commands

Usage:
  prompt-optimizer <prompt>          Optimize a prompt
  prompt-optimizer --build           Build/rebuild the registry
  prompt-optimizer --setup           Full setup (compile + build registry)
  prompt-optimizer --stats           Show registry statistics
  prompt-optimizer --help            Show this help

Examples:
  prompt-optimizer "Build a Shopify store with Next.js"
  prompt-optimizer "Debug React performance issues"
  echo "my prompt" | prompt-optimizer

Environment:
  PROMPT_OPTIMIZER_ROOT   Override the repo root directory
                          Default: ${REPO_ROOT}
`);
}

function showStats(): void {
  const registryPath = path.join(REPO_ROOT, "registry.json");
  if (!fs.existsSync(registryPath)) {
    console.error("registry.json not found. Run: prompt-optimizer --build");
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(registryPath, "utf-8"));
  const meta = registry.metadata;

  console.log(`Prompt Optimizer Registry`);
  console.log(`========================`);
  console.log(`Generated: ${meta.generatedAt}`);
  console.log(`Skills:    ${meta.skillCount}`);
  console.log(`Agents:    ${meta.agentCount}`);
  console.log(`Commands:  ${meta.commandCount}`);
  console.log(`Rules:     ${meta.ruleCount}`);
  console.log(`Hooks:     ${meta.hookCount}`);
  console.log(`Total:     ${meta.skillCount + meta.agentCount + meta.commandCount + meta.ruleCount + meta.hookCount} entries`);
}

async function runBuildRegistry(): Promise<void> {
  console.log("Building registry...");
  const buildScript = path.join(REPO_ROOT, "dist", "build-registry.js");
  if (!fs.existsSync(buildScript)) {
    console.error("dist/build-registry.js not found. Run: prompt-optimizer --setup");
    process.exit(1);
  }
  await import(buildScript);
}

async function runOptimize(prompt: string): Promise<void> {
  const registryPath = path.join(REPO_ROOT, "registry.json");
  if (!fs.existsSync(registryPath)) {
    console.error("registry.json not found. Building registry first...");
    await runBuildRegistry();
  }

  // Dynamic import to avoid loading everything for --help
  const { default: optimizeModule } = await import(
    path.join(REPO_ROOT, "dist", "optimize-prompt.js")
  );
  // optimize-prompt.ts runs on import via main(), so we just need to set argv
  // But since we're already past argv parsing, we handle it differently:
  // Re-exec with the prompt as args
  const { execFileSync } = await import("node:child_process");
  execFileSync("node", [path.join(REPO_ROOT, "dist", "optimize-prompt.js"), prompt], {
    stdio: "inherit",
  });
}

async function main(): Promise<void> {
  const firstArg = args[0];

  if (!firstArg || firstArg === "--help" || firstArg === "-h") {
    printHelp();
    return;
  }

  if (firstArg === "--build") {
    await runBuildRegistry();
    return;
  }

  if (firstArg === "--setup") {
    const { execSync } = await import("node:child_process");
    console.log("Compiling TypeScript...");
    execSync("npx tsc", { cwd: REPO_ROOT, stdio: "inherit" });
    console.log("Building registry...");
    execSync("node dist/build-registry.js", { cwd: REPO_ROOT, stdio: "inherit" });
    console.log("\nSetup complete!");
    return;
  }

  if (firstArg === "--stats") {
    showStats();
    return;
  }

  // Everything else is treated as a prompt
  const prompt = args.join(" ");
  await runOptimize(prompt);
}

main().catch((err) => {
  console.error("Error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
