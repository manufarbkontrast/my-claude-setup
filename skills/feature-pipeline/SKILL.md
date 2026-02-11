---
name: feature-pipeline
description: Orchestrate the complete feature implementation workflow from planning through deployment. Executes 5 phases - Plan, TDD, Implement, Review, Commit - using specialized agents at each stage. Use when implementing new features end-to-end.
version: 1.0.0
disable-model-invocation: true
metadata:
  author: Custom
  last_updated: 2025-02-11
  keywords:
    - feature implementation
    - workflow
    - pipeline
    - plan
    - tdd
    - code review
    - commit
    - end to end
    - orchestration
---

# Feature Pipeline

Orchestrate the complete feature implementation workflow through 5 phases, each using specialized agents. Ensures every feature follows the established quality process.

## When to Use

Invoke with: `/feature-pipeline <feature-description>`

Examples:
```
/feature-pipeline Add user registration with email verification
/feature-pipeline Implement shopping cart with quantity limits
/feature-pipeline Add role-based access control to admin endpoints
```

## Pipeline Overview

```
┌─────────┐   ┌─────────┐   ┌───────────┐   ┌────────┐   ┌────────┐
│  PLAN   │──▶│   TDD   │──▶│ IMPLEMENT │──▶│ REVIEW │──▶│ COMMIT │
│         │   │         │   │           │   │        │   │        │
│ planner │   │tdd-guide│   │ code +    │   │ multi- │   │ git    │
│ agent   │   │ agent   │   │ tdd-guide │   │ agent  │   │ commit │
│         │   │         │   │           │   │ review │   │        │
└─────────┘   └─────────┘   └───────────┘   └────────┘   └────────┘
     │              │              │              │             │
  Gate 1         Gate 2        Gate 3         Gate 4       Gate 5
  Plan OK?     Tests RED?   Tests GREEN?   No CRITICAL?  Committed?
```

## Phase 1: Plan

**Agent**: `planner`
**Goal**: Create a detailed implementation plan

**Actions:**
1. Analyze the feature request
2. Identify affected files and modules
3. Break down into implementable tasks
4. Identify dependencies and risks
5. Estimate scope (number of files, complexity)

**Output:**
- Task breakdown with clear acceptance criteria
- List of files to create/modify
- Dependency map
- Risk assessment

**Gate 1**: User reviews and approves the plan before proceeding.

## Phase 2: TDD (Tests First)

**Agent**: `tdd-guide` + `tdd-bootstrapper` skill
**Goal**: Write all tests before any implementation

**Actions:**
1. Create test file structure
2. Write unit tests for all identified functions
3. Write integration tests for API endpoints
4. Write E2E test stubs for critical flows
5. Run tests — all must FAIL (RED)

**Output:**
- Test files with comprehensive test cases
- All tests confirmed failing (RED status)
- Coverage baseline established

**Gate 2**: All tests written and confirmed RED.

## Phase 3: Implement

**Agent**: Developer (main agent) with `tdd-guide` support
**Goal**: Write minimal code to pass all tests

**Actions:**
1. Implement feature following the plan from Phase 1
2. After each function/module, run tests
3. Ensure tests go GREEN incrementally
4. Apply immutable patterns (per `coding-style.md` rules)
5. Keep files under 800 lines (use `file-splitter` if needed)
6. Handle errors comprehensively
7. Validate inputs at boundaries

**Output:**
- Working implementation passing all tests
- All tests GREEN
- Code follows immutable patterns

**Gate 3**: All tests pass (GREEN). Coverage >= 80%.

## Phase 4: Review

**Agent**: `multi-agent-review-custom` skill
**Goal**: Multi-perspective code review

**Actions:**
1. Launch 3 parallel review agents:
   - Security: OWASP, secrets, auth, validation
   - Performance: N+1, caching, algorithms, memory
   - Architecture: SOLID, immutability, file size, coupling
2. Collect and merge findings
3. Present unified report

**Decision logic:**
```
CRITICAL findings?
  YES → Return to Phase 3, fix, re-review
  NO ↓

HIGH findings > 3?
  YES → Fix HIGH findings, re-review
  NO ↓

Proceed to Phase 5
```

**Gate 4**: No CRITICAL findings. HIGH findings addressed.

## Phase 5: Commit

**Agent**: Git workflow (per `git-workflow.md` rules)
**Goal**: Create a clean commit

**Actions:**
1. Stage only relevant files (no `git add -A`)
2. Draft commit message following conventional commits:
   ```
   feat: add user registration with email verification

   - Implement registration endpoint with input validation
   - Add email verification flow with token expiry
   - Include rate limiting on registration endpoint
   - Add comprehensive test suite (87% coverage)
   ```
3. Run pre-commit checks (if configured)
4. Create the commit

**Gate 5**: Commit created successfully. Pre-commit hooks pass.

## Abort Criteria

The pipeline stops immediately if:

| Condition | Phase | Action |
|-----------|-------|--------|
| User rejects plan | Phase 1 | Revise plan based on feedback |
| Tests can't be written (unclear requirements) | Phase 2 | Return to Phase 1 for clarification |
| Implementation complexity exceeds estimate | Phase 3 | Pause, re-plan with user |
| CRITICAL security finding | Phase 4 | Must fix before proceeding |
| Pre-commit hook fails | Phase 5 | Fix issues, re-commit |

## TodoWrite Integration

Track progress with TodoWrite throughout the pipeline:

```
1. [completed] Phase 1: Create implementation plan
2. [completed] Phase 2: Write failing tests (RED)
3. [in_progress] Phase 3: Implement feature (GREEN)
4. [pending] Phase 4: Multi-agent code review
5. [pending] Phase 5: Commit with conventional message
```

Update status in real-time as each phase completes.

## Phase Transitions

### Phase 1 → Phase 2
- Plan approved by user
- TodoWrite updated

### Phase 2 → Phase 3
- All test files created
- Tests confirmed RED (failing)
- No tests accidentally passing

### Phase 3 → Phase 4
- All tests GREEN (passing)
- Coverage >= 80%
- Code compiles without errors

### Phase 4 → Phase 5
- No CRITICAL findings
- HIGH findings resolved
- Review report generated

### Phase 5 → Done
- Commit created
- Pre-commit hooks pass
- TodoWrite shows all complete

## Agent Configuration

| Phase | Agent | Model Preference |
|-------|-------|-----------------|
| Plan | `planner` | Sonnet (good balance) |
| TDD | `tdd-guide` | Sonnet (coding focus) |
| Implement | Main agent | Sonnet (coding focus) |
| Review | 3x parallel agents | Haiku (lightweight, parallel) |
| Commit | Git tools | N/A |

## Best Practices

1. **Never skip phases** — especially TDD (Phase 2) and Review (Phase 4)
2. **Keep phases atomic** — complete one before starting the next
3. **Gate strictly** — don't proceed with failing gates
4. **Document decisions** — log why plan deviations were made
5. **Iterate quickly** — small features through the pipeline > large batches

## Common Pitfalls

- **Skipping TDD** — "I'll write tests later" → tests never get written
- **Ignoring review findings** — "It works, ship it" → technical debt
- **Over-planning** — spending too long in Phase 1 for simple features
- **Under-planning** — jumping to Phase 3 for complex features
- **Batch commits** — committing multiple features together obscures history
