---
name: skeleton-finder
description: Search for and evaluate battle-tested skeleton/boilerplate projects as foundation for new features. Parallel evaluation of security, extensibility, and relevance. Use when starting new projects or adding major features that benefit from proven scaffolding.
version: 1.0.0
disable-model-invocation: true
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - skeleton project
    - boilerplate
    - template
    - scaffold
    - starter
    - foundation
    - project setup
    - best practices
---

# Skeleton Finder

Search for battle-tested skeleton projects, evaluate them from multiple perspectives, and clone the best match as a foundation for new development.

## When to Use

Invoke with: `/skeleton-finder <technology> <purpose>`

Examples:
```
/skeleton-finder typescript rest-api
/skeleton-finder python fastapi-microservice
/skeleton-finder go grpc-service
/skeleton-finder react dashboard-app
/skeleton-finder nextjs saas-starter
```

## Workflow

### Step 1: Define Requirements

Before searching, clarify:
- **Technology stack**: Language, framework, runtime
- **Purpose**: API, web app, CLI tool, library, microservice
- **Must-haves**: Auth, database, testing, CI/CD, Docker
- **Nice-to-haves**: Monitoring, logging, documentation

### Step 2: Search Strategy

Search multiple sources in parallel:

| Source | Search Query | What to Look For |
|--------|-------------|-----------------|
| **GitHub** | `{tech} starter template` | Stars, recent activity, issues |
| **GitHub Topics** | `topic:{tech}-boilerplate` | Curated community projects |
| **Awesome Lists** | `awesome-{tech}` → starters section | Community-vetted options |
| **Framework Docs** | Official starter templates | Maintained by framework team |
| **npm/pypi/pkg.go** | `create-{tech}-app` | CLI scaffold tools |

### Step 3: Parallel Evaluation

Launch 3 evaluation agents simultaneously:

**Agent 1: Security Assessment**
- Dependency audit (known vulnerabilities)
- Secret management approach
- Auth implementation quality
- Input validation patterns
- CORS/CSP configuration

**Agent 2: Extensibility Analysis**
- Code organization / architecture pattern
- Modularity (easy to add/remove features)
- Configuration approach (env vars, config files)
- Testing setup (framework, coverage config)
- CI/CD pipeline included

**Agent 3: Relevance Scoring**
- Technology match (exact versions, compatible deps)
- Feature coverage (how many must-haves included)
- Community health (stars, contributors, recent commits)
- Documentation quality
- License compatibility

### Step 4: Scoring Matrix

Score each candidate on a 1-5 scale:

```
SKELETON EVALUATION MATRIX
===========================

Candidate: awesome-ts-api-starter
GitHub: github.com/example/awesome-ts-api-starter
Stars: 2.4k | Last commit: 2 weeks ago | License: MIT

┌─────────────────────┬───────┬────────────────────────────────┐
│ Criterion           │ Score │ Notes                          │
├─────────────────────┼───────┼────────────────────────────────┤
│ Security            │ 4/5   │ Helmet, CORS, rate limiting    │
│ Extensibility       │ 5/5   │ Clean architecture, modular    │
│ Tech Match          │ 5/5   │ TS 5.x, Node 20, ESM          │
│ Feature Coverage    │ 4/5   │ Missing WebSocket support      │
│ Community Health    │ 4/5   │ Active, 15 contributors        │
│ Documentation       │ 3/5   │ README only, no API docs       │
│ Test Setup          │ 5/5   │ Jest + supertest, 85% coverage │
│ CI/CD               │ 4/5   │ GitHub Actions, Docker         │
├─────────────────────┼───────┼────────────────────────────────┤
│ TOTAL               │ 34/40 │ RECOMMENDED ✓                  │
└─────────────────────┴───────┴────────────────────────────────┘
```

### Step 5: Decision

```
Top score >= 30/40?
  YES → RECOMMEND this skeleton
  NO ↓

Top score >= 25/40?
  YES → RECOMMEND with modifications noted
  NO ↓

Top score < 25/40?
  → RECOMMEND building from scratch with framework defaults
```

### Step 6: Clone & Customize

Once a skeleton is selected:

1. **Clone** the repository
2. **Remove** unnecessary features (avoid bloat)
3. **Update** dependencies to latest versions
4. **Configure** project-specific settings (name, env vars)
5. **Verify** tests pass with the customized setup
6. **Apply** coding style rules (immutability, file organization)

## Evaluation Criteria Detail

### Security (Weight: High)
- Are dependencies up to date?
- Is there a vulnerability scanning setup?
- How are secrets handled? (env vars, not hardcoded)
- Is auth implemented securely? (bcrypt, JWT with expiry)
- Are common attacks mitigated? (XSS, CSRF, injection)

### Extensibility (Weight: High)
- Is the code modular and well-organized?
- Can features be added without modifying core?
- Is there dependency injection or similar pattern?
- Are there clear extension points?
- Is the configuration externalized?

### Community Health (Weight: Medium)
- Stars and forks (social proof)
- Last commit date (active maintenance)
- Open issues / PRs (responsiveness)
- Number of contributors (bus factor)
- Release history (versioned and tagged)

### Documentation (Weight: Medium)
- README with clear setup instructions
- API documentation
- Architecture overview
- Contributing guide
- Example usage

## Red Flags (Automatic Disqualification)

- Last commit > 1 year ago
- Known security vulnerabilities (unpatched)
- No tests whatsoever
- License incompatible with project needs
- Hardcoded secrets in the repository
- No .gitignore (committing node_modules, __pycache__, etc.)

## Best Practices

1. **Don't over-customize** — keep the skeleton's patterns where they work
2. **Update dependencies first** — skeletons may have outdated versions
3. **Remove what you don't need** — dead code is a liability
4. **Preserve the test setup** — the skeleton's test infrastructure is valuable
5. **Document your deviations** — note where you diverged from the skeleton

## Common Pitfalls

- **Feature bloat** — choosing a skeleton with too many features you won't use
- **Version lock-in** — skeleton uses old framework versions with breaking changes ahead
- **Opinionated choices** — skeleton forces patterns that conflict with your coding style
- **Abandoned projects** — skeleton looks great but is unmaintained
- **License issues** — GPL skeleton in a proprietary project
