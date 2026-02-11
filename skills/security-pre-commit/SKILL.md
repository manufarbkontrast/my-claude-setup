---
name: security-pre-commit
description: Automated security checklist before commits. Scans for hardcoded secrets, SQL injection, XSS, CSRF issues, and OWASP Top 10 vulnerabilities. Use before any commit to ensure code security compliance.
version: 1.0.0
disable-model-invocation: true
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - security
    - pre-commit
    - secrets
    - sql injection
    - xss
    - csrf
    - owasp
    - vulnerability
    - scan
    - audit
---

# Security Pre-Commit Check

Automated security audit based on the mandatory security checklist. Scans staged changes for vulnerabilities before committing.

## When to Use

Invoke before any commit: `/security-pre-commit [path]`

- `path` (optional): Specific directory or file to scan. Defaults to staged git changes.

## Security Checklist

The following checks run automatically:

### 1. Hardcoded Secrets Detection

**Grep patterns to scan for:**
```
# API Keys & Tokens
(api[_-]?key|apikey|api[_-]?secret)\s*[:=]\s*['"][A-Za-z0-9]
(token|bearer|jwt)\s*[:=]\s*['"][A-Za-z0-9]
(access[_-]?key|secret[_-]?key)\s*[:=]\s*['"][A-Za-z0-9]

# Passwords
(password|passwd|pwd)\s*[:=]\s*['"][^'"]+['"]
(db[_-]?pass|database[_-]?password)\s*[:=]\s*['"]

# Connection Strings
(postgres|mysql|mongodb|redis)://[^'"{\s]+:[^'"{\s]+@
(DATABASE_URL|REDIS_URL|MONGO_URI)\s*[:=]\s*['"][^'"]*://

# Cloud Provider Keys
AKIA[0-9A-Z]{16}                    # AWS Access Key
(ghp_|gho_|ghu_|ghs_|ghr_)[A-Za-z0-9_]{36}  # GitHub Token
sk-[A-Za-z0-9]{48}                  # OpenAI Key
sk_live_[A-Za-z0-9]+                # Stripe Key

# Private Keys
-----BEGIN (RSA |EC |DSA )?PRIVATE KEY-----
-----BEGIN OPENSSH PRIVATE KEY-----
```

**Severity: CRITICAL** — Block commit if found.

### 2. SQL Injection Detection

**Patterns indicating unsafe queries:**
```
# String concatenation in queries
(query|execute|raw)\(.*\+.*\)
(query|execute|raw)\(.*\$\{.*\}.*\)
f"(SELECT|INSERT|UPDATE|DELETE|DROP).*\{

# Missing parameterization
\.query\(`[^`]*(SELECT|INSERT|UPDATE|DELETE).*\$\{
\.execute\(f"(SELECT|INSERT|UPDATE|DELETE)
```

**Safe alternatives:**
```typescript
// WRONG: string interpolation
db.query(`SELECT * FROM users WHERE id = '${userId}'`);

// CORRECT: parameterized query
db.query("SELECT * FROM users WHERE id = $1", [userId]);
```

**Severity: CRITICAL**

### 3. XSS Prevention

**Patterns indicating unsafe HTML rendering:**
```
# React
dangerouslySetInnerHTML
innerHTML\s*=

# Template engines
\{\{\{.*\}\}\}          # Handlebars unescaped
\|safe                  # Django/Jinja2 safe filter
<%- .*%>                # EJS unescaped

# DOM manipulation
\.innerHTML\s*=
document\.write\(
```

**Severity: HIGH**

### 4. CSRF Protection

**Check for missing CSRF tokens in forms and state-changing endpoints:**
```
# Forms without CSRF
<form.*method=["']post["'](?!.*csrf)
<form.*method=["']POST["'](?!.*_token)

# State-changing routes without CSRF middleware
\.(post|put|patch|delete)\(.*(?!csrf|csrfProtection)
```

**Severity: HIGH**

### 5. Authentication & Authorization

**Patterns to check:**
```
# Endpoints without auth middleware
router\.(get|post|put|delete)\((?!.*auth)(?!.*protect)(?!.*middleware)

# JWT without verification
jwt\.decode\((?!.*verify)
JSON\.parse\(.*token

# Hardcoded roles/permissions
(role|permission)\s*===?\s*['"]admin['"]
```

**Severity: MEDIUM** (context-dependent)

### 6. Rate Limiting

**Check endpoints for rate limiting:**
```
# Express routes without rate limiter
app\.(get|post|put|delete)\((?!.*rateLimit)(?!.*throttle)
router\.(get|post|put|delete)\((?!.*rateLimit)
```

**Severity: MEDIUM**

### 7. Error Message Leakage

**Patterns that leak sensitive info in errors:**
```
# Stack traces in responses
res\.(json|send)\(.*err\.(stack|message)
return.*error:.*err\.(stack|message)

# Detailed error exposure
catch.*\{[\s\S]*res\.status\(\d+\)\.json\(\{.*error:.*err

# SQL errors exposed
catch.*\{[\s\S]*sql|query|table|column
```

**Severity: MEDIUM**

### 8. Input Validation

**Check for missing validation at boundaries:**
```
# Direct use of req.body/req.params without validation
req\.body\.\w+(?!.*schema|.*validate|.*parse|.*zod)
req\.params\.\w+(?!.*validate|.*parseInt|.*parse)
req\.query\.\w+(?!.*validate|.*sanitize)
```

**Severity: MEDIUM**

## Report Format

```
SECURITY PRE-COMMIT REPORT
==========================

[CRITICAL] 2 issues found
  1. Hardcoded API key at src/config.ts:15
     → Move to environment variable
  2. SQL injection risk at src/db/users.ts:42
     → Use parameterized query

[HIGH] 1 issue found
  1. XSS via dangerouslySetInnerHTML at src/components/Comment.tsx:28
     → Use DOMPurify to sanitize

[MEDIUM] 3 issues found
  1. Missing rate limiting on POST /api/login at src/routes/auth.ts:12
  2. Error stack trace exposed at src/middleware/error.ts:8
  3. Missing input validation at src/routes/users.ts:25

RESULT: BLOCKED (2 CRITICAL issues must be fixed)
```

## Decision Logic

```
CRITICAL issues found?
  YES → BLOCK commit, show fixes
  NO ↓

HIGH issues found?
  YES → WARN, recommend fixing before commit
  NO ↓

MEDIUM issues found?
  YES → INFO, log for future attention
  NO → PASS ✓
```

## Best Practices

1. **Run on staged changes only** — avoid noise from unrelated files
2. **Use with `security-reviewer` agent** — for deeper analysis beyond regex patterns
3. **Integrate with git hooks** — automate via pre-commit hook
4. **Maintain allowlist** — known false positives (e.g., test fixtures with fake keys)
5. **Never commit with CRITICAL issues** — no exceptions

## Common Pitfalls

- **False positives on test files** — test fixtures may contain fake secrets
- **Regex limitations** — these patterns catch common cases, not all vulnerabilities
- **Context-dependent findings** — some "missing auth" findings may be intentional (public endpoints)
- **Not a replacement for SAST** — use proper SAST tools for comprehensive scanning

## When to Load References

- For OWASP Top 10 detailed patterns → `references/owasp-patterns.md`
