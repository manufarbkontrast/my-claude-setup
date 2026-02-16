# Prompt Optimizer

CLI tool that analyzes a raw prompt and enriches it by identifying relevant skills, agents, and commands from the my-claude-setup repository.

## Installation (neuer Rechner)

### Schnell-Installation

```bash
git clone https://github.com/manufarbkontrast/my-claude-setup.git ~/my-claude-setup
cd ~/my-claude-setup
./install.sh
```

Das Script:
1. Prueft Node.js >= 20
2. Installiert Dependencies
3. Kompiliert TypeScript
4. Baut die Registry (444 Skills, 182 Agents, 183 Commands)
5. Registriert `prompt-optimizer` und `po` als globale CLI-Befehle

### Manuelle Installation

```bash
git clone https://github.com/manufarbkontrast/my-claude-setup.git ~/my-claude-setup
cd ~/my-claude-setup
npm install
npm run setup
npm link
```

### Voraussetzungen

- Node.js >= 20
- Git

## Usage

### Globaler CLI-Befehl (nach `npm link`)

```bash
prompt-optimizer "Build a Shopify store with Next.js"
po "Build a Shopify store with Next.js"           # Kurzform
po --stats                                         # Registry-Statistiken
po --build                                         # Registry neu bauen
po --help                                          # Hilfe
```

### Output in Zwischenablage (macOS)

```bash
po "Dein Prompt" 2>/dev/null | pbcopy
# Dann Cmd+V in Claude Code
```

### Claude Code Command

```
/optimize Build a real-time chat app with Next.js and Supabase
```

### Rebuild nach neuen Skills/Agents

```bash
cd ~/my-claude-setup && git pull && po --build
```

## How It Works

1. **Registry Build** (`src/build-registry.ts`): Scans all 444 skills, 182 agents, 183 commands, 8 rules, and 9 hooks. Extracts name, description, keywords, category, and content summary into `registry.json`.

2. **Prompt Analysis** (`src/optimize-prompt.ts`): Detects task type (feature-development, debugging, refactoring, etc.) and technologies (React, Shopify, Supabase, etc.) from the input prompt.

3. **Matching** (`src/matcher.ts`): Uses a three-pass matching strategy:
   - **Keyword match**: Tokenizes prompt and matches against skill keywords, names, descriptions
   - **Direct name boost**: Skills whose name appears directly in the prompt get a significant score boost
   - **Fuse.js fuzzy search**: Catches semantic matches that keyword matching misses

4. **Output**: Generates a structured optimized prompt with skill references, agent recommendations, commands, and applicable rules.

## Architecture

```
src/
  cli.ts             - CLI entry point (prompt-optimizer / po)
  types.ts           - TypeScript interfaces for registry entries
  build-registry.ts  - Scans repo and generates registry.json
  matcher.ts         - Keyword + fuzzy matching logic
  optimize-prompt.ts - Prompt analysis and output assembly
```

## Example

Input:
```
Erstelle einen Shopify-Shop mit Next.js Frontend, Supabase Backend und automatisierter Produktsynchronisation
```

Output includes:
- Skills: shopify, backend-patterns, frontend-patterns, frontend-design, frontend-dev-guidelines
- Agent: backend-architect
- Commands: /frontend-dev, /multi-backend, /multi-frontend
- Rules: hooks, git-workflow, performance
