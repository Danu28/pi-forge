---
name: forge
description: Slash-controlled discipline for pi — 5 tools (intent/plan/memo/intel/check) via /forge. Opt-in workflow, not auto-nag.
---

# pi-forge — Slash-Controlled Discipline

> **Rule:** Better input beats better models. Discipline via `/forge`, not hard blocks.

This skill is activated only when the user runs `/forge <task>` (or `/forge status`). It does **not** auto-trigger.

## Workflow (happy path)

```
/forge <task>
  → memo recall?  (optional, load context)
  → intent {goal, hypotheses:["A | risk:2","B | risk:5"], files, acceptance}
  → plan {goal, tasks:["t1 | refs:src/a.ts","t2 | refs:src/a.ts check:npm test","t3 | depends:0"]} (3-10 tasks)
  → intel  (once, get testCmd + OS + suggested check)
  → batch exec: read → edit per task
  → check {command:"npm test", timeout:30}  → PASS
  → plan {id:"plan:...", done:[0,1,2]}
  → memo {action:"remember", cue, summary, tags, refs}
  → commit
```

## Commands

- `/forge <task>` — start disciplined run for that task (injects workflow instruction)
- `/forge status` — show intent/plan/memo/focus/budget (also `/forge` alone)
- `/forge clear` — reset durable state (memos, plans, focus)
- `/forge-status` — alias for status

## Tools (slash-gated)

| # | Tool | Params | Purpose |
|---|------|--------|---------|
| 1 | intent | goal, hypotheses:[A,B] each `| risk:N`, files?, acceptance?, conclusion? | Deliberate, pick winner (lower risk), set focus `[pi-forge focus]` |
| 2 | plan | goal?, tasks? `title \| refs:src/a.ts check:cmd depends:0,1`, id?, done? | DAG 3-10 tasks, refs/check/depends, blocked until deps done |
| 3 | memo | action=remember\|recall, cue/summary/detail/query/tags/refs/limit | TF-IDF memory (MAX 100 LRU), cue×2+summary×1+detail×0.75 + recency |
| 4 | intel | refresh?, projectPath? | Cached lang/scripts/test/lint/build + OS/shell profile |
| 5 | check | command, cwd?, timeout? | spawn {shell:true}, 64KB trunc, PASS/FAIL/TIMEOUT + budget% |

Guidelines surface via tool `promptSnippet`/`promptGuidelines` — no `before_agent_start` injection.

## Prompt quality (see docs/prompt-templates.md)

- intent: verb-led goal ≥10ch, 2 hypotheses with `| risk:N`, files[1-3], acceptance
- plan: 3-10 tasks, each `refs:`, ≥1 `check:`, no out-of-range `depends`
- check: prefer `read` for files; if bash, always `timeout:10` (file) / `30-60` (test), quote spaces

Lint warnings (`⚠️ input lint`, `✂️ truncated`) fire inline — fix input, don't burn edits.

## State

- Durable keys: `pi-forge:memo`, `pi-forge:deliberation`, `pi-forge:plan`, `pi-forge:focus`, `pi-forge:intel`
- In-memory: `deliberations` (20 cap), `plans` (Map), `memos` (100 LRU), `focusLine`, `intelCache`

## When to use

- User wants discipline without nag → `/forge`
- Task needs verifiable plan + PASS gate → `/forge`
