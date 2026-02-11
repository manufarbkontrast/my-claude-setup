---
name: multi-agent-review-custom
description: Orchestrate parallel code reviews from Security, Performance, and Architecture perspectives. Launches 3 review agents simultaneously and combines findings into a unified report with severity levels. Use after writing or modifying code for comprehensive quality assurance.
version: 1.0.0
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - code review
    - multi-agent
    - parallel review
    - security review
    - performance review
    - architecture review
    - quality assurance
    - comprehensive review
---

# Multi-Agent Review

Orchestrate parallel code reviews from three perspectives: **Security**, **Performance**, and **Architecture**. Launches specialized agents simultaneously and combines findings into a unified, deduplicated report.

## When to Use

- After implementing a new feature (especially before committing)
- After significant code modifications
- Before merging pull requests
- When Claude auto-detects: complex changes touching 3+ files

## Workflow

### Step 1: Identify Changed Files

Determine the scope of review:
```bash
# From staged changes
git diff --cached --name-only

# From recent commits
git diff main...HEAD --name-only
```

### Step 2: Launch 3 Parallel Agents

Launch all three review agents simultaneously using the Task tool:

**Agent 1: Security Reviewer**
- Subagent type: `security-reviewer`
- Focus: OWASP Top 10, secrets, injection, auth/authz, input validation
- References: `security-pre-commit` skill patterns

**Agent 2: Performance Reviewer**
- Subagent type: `team-reviewer`
- Dimension: Performance
- Focus: N+1 queries, unnecessary re-renders, memory leaks, inefficient algorithms, missing caching, bundle size

**Agent 3: Architecture Reviewer**
- Subagent type: `architect`
- Focus: SOLID principles, immutability compliance, separation of concerns, dependency direction, API design, file organization

### Step 3: Collect & Merge Results

Each agent returns findings in this format:

```
Finding {
  severity: CRITICAL | HIGH | MEDIUM | LOW
  category: Security | Performance | Architecture
  location: file:line
  title: Short description
  description: Detailed explanation
  fix: Suggested fix
}
```

### Step 4: Deduplicate & Prioritize

- Merge findings from all 3 agents
- Remove duplicates (same file:line, same issue)
- Sort by severity: CRITICAL → HIGH → MEDIUM → LOW
- Group by file for easier navigation

## Unified Report Format

```
MULTI-AGENT CODE REVIEW REPORT
================================

Files Reviewed: 5
Total Findings: 12

SUMMARY
┌──────────┬──────────┬─────────────┬──────────────┐
│ Severity │ Security │ Performance │ Architecture │
├──────────┼──────────┼─────────────┼──────────────┤
│ CRITICAL │    1     │      0      │      0       │
│ HIGH     │    2     │      1      │      1       │
│ MEDIUM   │    1     │      2      │      2       │
│ LOW      │    0     │      1      │      1       │
├──────────┼──────────┼─────────────┼──────────────┤
│ Total    │    4     │      4      │      4       │
└──────────┴──────────┴─────────────┴──────────────┘

CRITICAL FINDINGS (must fix)
─────────────────────────────
[SEC-1] SQL Injection in user query
  File: src/db/users.ts:42
  Issue: String interpolation in SQL query
  Fix: Use parameterized query with $1 placeholders

HIGH FINDINGS (should fix)
──────────────────────────
[SEC-2] Missing rate limiting on login endpoint
  File: src/routes/auth.ts:15
  Issue: No rate limiter on POST /api/login
  Fix: Add rate limiting middleware (e.g., 5 req/min)

[SEC-3] Error stack trace exposed to client
  File: src/middleware/error.ts:28
  Issue: err.stack sent in response body
  Fix: Log stack server-side, send generic message to client

[PERF-1] N+1 query in user list
  File: src/services/user-service.ts:34
  Issue: Loading roles individually per user in loop
  Fix: Use JOIN or batch query to load all roles at once

[ARCH-1] Mutable state in service layer
  File: src/services/cart-service.ts:22
  Issue: Direct mutation of cart items array
  Fix: Return new array with spread operator

MEDIUM FINDINGS (consider fixing)
─────────────────────────────────
[SEC-4] Missing input validation on email field
  File: src/routes/users.ts:18

[PERF-2] Unnecessary re-computation in render loop
  File: src/components/ProductList.tsx:45

[PERF-3] Missing cache for frequently accessed data
  File: src/services/config-service.ts:12

[ARCH-2] File exceeds 800 line limit (923 lines)
  File: src/services/order-service.ts

[ARCH-3] Mixed concerns: validation + business logic
  File: src/services/payment-service.ts:55

LOW FINDINGS (nice to have)
───────────────────────────
[PERF-4] Unused import adds to bundle size
  File: src/utils/helpers.ts:3

[ARCH-4] Magic number without named constant
  File: src/services/pricing.ts:88

VERDICT: BLOCKED (1 CRITICAL finding must be resolved)
```

## Severity Definitions

| Severity | Definition | Action Required |
|----------|-----------|-----------------|
| **CRITICAL** | Security vulnerability, data loss risk, production breakage | Must fix before commit |
| **HIGH** | Significant quality issue, performance degradation, design violation | Should fix before commit |
| **MEDIUM** | Code smell, minor inefficiency, could-be-better pattern | Fix when practical |
| **LOW** | Style issue, minor suggestion, nice-to-have improvement | Optional |

## Review Dimensions Checklist

### Security Agent Checks
- [ ] No hardcoded secrets (API keys, passwords, tokens)
- [ ] All user inputs validated
- [ ] SQL queries parameterized
- [ ] HTML output sanitized (XSS prevention)
- [ ] CSRF protection on state-changing endpoints
- [ ] Authentication on protected routes
- [ ] Authorization (ownership/role) checks
- [ ] Rate limiting on public endpoints
- [ ] Error messages don't leak internals

### Performance Agent Checks
- [ ] No N+1 queries
- [ ] Database queries have appropriate indexes
- [ ] No unnecessary re-renders (React: useMemo/useCallback)
- [ ] No memory leaks (unclosed connections, unbounded caches)
- [ ] Efficient algorithms (no O(n^2) where O(n) possible)
- [ ] Appropriate caching for expensive operations
- [ ] Lazy loading for large datasets
- [ ] Bundle size impact considered

### Architecture Agent Checks
- [ ] Immutable data patterns (no mutation)
- [ ] Files under 800 lines
- [ ] Functions under 50 lines
- [ ] No deep nesting (>4 levels)
- [ ] Single responsibility per module
- [ ] Proper error handling at every level
- [ ] Dependencies flow inward (clean architecture)
- [ ] No hardcoded values (use constants/config)
- [ ] Consistent naming conventions

## Decision Logic

```
CRITICAL findings exist?
  YES → BLOCKED — must fix all CRITICAL before commit
  NO ↓

HIGH findings > 3?
  YES → NEEDS WORK — fix HIGH findings before commit
  NO ↓

Only MEDIUM/LOW findings?
  YES → APPROVED WITH NOTES — commit allowed, consider fixing
  NO → APPROVED ✓
```

## Best Practices

1. **Run after every feature** — don't batch reviews
2. **Fix CRITICAL immediately** — never defer security issues
3. **Track MEDIUM/LOW** — create tickets for deferred items
4. **Share findings with team** — patterns of issues indicate training needs
5. **Automate what you can** — use linters for LOW-severity checks

## Common Pitfalls

- **Review fatigue** — too many LOW findings dilute attention from CRITICAL ones
- **Ignoring architecture** — performance and security get attention, architecture doesn't
- **False positives** — always verify findings; not every pattern match is a real issue
- **Missing context** — agents review code, not business requirements; supplement with domain knowledge
