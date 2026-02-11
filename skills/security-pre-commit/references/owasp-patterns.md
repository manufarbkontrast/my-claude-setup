# OWASP Top 10 Detection Patterns

## A01: Broken Access Control

```
# Missing authorization checks
@(app\.route|router\.(get|post|put|delete))\(.*(?!.*@(login_required|requires_auth|auth))
# Direct object reference without ownership check
findById\(.*req\.(params|query)\.id(?!.*userId|.*ownerId|.*createdBy)
# Missing CORS configuration
Access-Control-Allow-Origin:\s*\*
```

## A02: Cryptographic Failures

```
# Weak hashing algorithms
(md5|sha1)\(
hashlib\.(md5|sha1)\(
# Hardcoded encryption keys
(encrypt|cipher|aes|des).*key.*=.*['"][A-Za-z0-9+/=]+['"]
# HTTP instead of HTTPS
http://(?!localhost|127\.0\.0\.1|0\.0\.0\.0)
```

## A03: Injection

```
# SQL Injection
(query|execute|raw)\(.*(\+|`.*\$\{|f").*\)
# Command Injection
(exec|system|spawn|popen)\(.*(\+|`.*\$\{|f")
# LDAP Injection
(ldap|search)\(.*(\+|`.*\$\{|f")
# NoSQL Injection
\$where.*req\.(body|query|params)
\.find\(\{.*req\.(body|query|params)
```

## A04: Insecure Design

```
# Missing rate limiting on auth endpoints
\.(post|put)\(.*(login|auth|register|password|reset)(?!.*rateLimit|.*throttle)
# Missing CAPTCHA on public forms
<form.*action=.*(register|signup|contact)(?!.*captcha|.*recaptcha)
# Predictable resource IDs
(auto_increment|serial|SERIAL|IDENTITY).*id
```

## A05: Security Misconfiguration

```
# Debug mode in production
DEBUG\s*=\s*(True|true|1|"1")
NODE_ENV.*(?!production)
# Default credentials
(admin|root|test|demo):(admin|root|test|password|123456)
# Verbose error responses
(stack|stackTrace|traceback)\s*[:=]
# Missing security headers
(?!.*helmet|.*security-headers|.*X-Content-Type|.*X-Frame-Options)
```

## A06: Vulnerable Components

```
# Check package.json/requirements.txt for known vulnerable versions
# This requires cross-referencing with vulnerability databases
# Flag: any dependency without a lock file entry
```

## A07: Auth Failures

```
# Weak password requirements
(password|passwd).*\.length\s*[<>]=?\s*[0-6]
(minlength|min_length).*[0-6]
# Missing MFA
(?!.*mfa|.*2fa|.*totp|.*two.factor).*login
# Session fixation
session\.id\s*=.*req\.(body|query|params|cookies)
# Missing session expiry
(maxAge|expires|ttl)\s*[:=]\s*(?!.*\d+)
```

## A08: Software and Data Integrity Failures

```
# Missing integrity checks on downloads
(fetch|axios|http)\.(get|post)\(.*(?!.*integrity|.*checksum|.*hash)
# Deserialization of untrusted data
(pickle\.load|yaml\.load\((?!.*Loader)|unserialize|JSON\.parse.*req\.)
# Missing signature verification
jwt\.decode\((?!.*verify|.*algorithms)
```

## A09: Logging Failures

```
# Missing logging on auth events
(login|logout|register|password)(?!.*log|.*audit|.*track)
# Logging sensitive data
(log|console|print|logger)\..*(password|secret|token|key|credit.card|ssn)
# Missing log injection prevention
(log|console)\..*(req\.body|req\.query|req\.params|user_input)(?!.*sanitize|.*escape)
```

## A10: Server-Side Request Forgery (SSRF)

```
# User-controlled URLs in server requests
(fetch|axios|http|request)\(.*req\.(body|query|params)\.\w*(url|uri|link|href)
# Missing URL validation
(?!.*allowlist|.*whitelist|.*validate.*url).*fetch\(.*\$\{
# Internal network access patterns
(fetch|axios)\(.*\.(internal|local|private|10\.|172\.|192\.168)
```

## Severity Classification

| Finding | Default Severity |
|---------|-----------------|
| SQL/Command Injection | CRITICAL |
| Hardcoded secrets | CRITICAL |
| Missing auth on endpoints | HIGH |
| XSS vulnerabilities | HIGH |
| Weak cryptography | HIGH |
| Missing rate limiting | MEDIUM |
| Debug mode enabled | MEDIUM |
| Missing security headers | MEDIUM |
| Verbose error messages | LOW |
| Missing logging | LOW |
