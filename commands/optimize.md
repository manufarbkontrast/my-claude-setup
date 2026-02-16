---
description: Optimize a prompt by finding relevant skills, agents, commands and rules from the setup repository.
---

# Prompt Optimizer

Analyze the user's prompt and enrich it with relevant context from the my-claude-setup repository.

## How to Use

The user provides a prompt as the argument to `/optimize`. Your job:

1. **Run the optimizer tool** to find relevant skills, agents, commands and rules:
   ```bash
   node ~/my-claude-setup/dist/optimize-prompt.js "<USER_PROMPT>"
   ```

2. **Present the results** to the user in a clear, structured format showing:
   - Detected technologies and task type
   - Top matched skills with file paths
   - Recommended agents for the task
   - Relevant commands they can use
   - Applicable rules

3. **Generate the optimized prompt** that the user can copy and use directly.

## If registry.json is missing

Run the build first:
```bash
cd ~/my-claude-setup && npm run setup
```

## Example

```
/optimize Build a real-time chat app with Next.js and Supabase
```

This will find skills for Next.js, Supabase, WebSocket, real-time, frontend patterns, and suggest the appropriate agents and commands.
