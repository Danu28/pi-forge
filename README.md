# pi-forge — Slash-Controlled Discipline for pi

**5 high-signal tools via `/forge` — disciplined, not nagging. Faster + Cheaper + Reliable + Durable.**

Slash-controlled discipline for pi — you run `/forge <task>` when you want structure. No auto-blocking hooks.

## Install

```bash
# one session
pi -e ./

# persist (local)
pi install git:github.com/Danu28/pi-forge

# from npm (after publish)
pi install pi-forge
```

Verify:

```bash
pi packages:list   # → pi-forge
pi tools:list      # → intent, plan, memo, intel, check
pi --help          # → /forge, /forge-status
```

## Quick start

```bash
pi
> /forge add JWT auth to /api/login with 15m expiry
# agent now runs:
> intent {goal:"add JWT auth", hypotheses:["jwt via jose | risk:2","session redis | risk:5"], files:["src/auth.ts"], acceptance:"check npm test PASS"}
> plan {goal:"add JWT auth", tasks:["design token | refs:src/auth.ts","impl login | refs:src/auth.ts check:npx vitest run","wire middleware | refs:src/middleware/auth.ts depends:1"]}
> intel   # once
> # ... reads/edits ...
> check {command:"npx vitest run", timeout:30}
> plan {id:"plan:...", done:[0,1,2]}
> memo {action:"remember", cue:"auth-jwt", summary:"jwt via jose 15m", tags:["auth"], refs:["src/auth.ts"]}
```

Without `/forge`, tools still exist but don't nag — you can work freeform.

## Tools

| # | Tool | Purpose |
|---|------|---------|
| 1 | **intent** | `goal + 2 hypotheses (| risk:N)` → picks winner, sets `[pi-forge focus]` surviving compaction |
| 2 | **plan** | DAG 3-10 tasks `title \| refs:src/a.ts check:cmd depends:0,1` |
| 3 | **memo** | `action=remember\|recall` TF-IDF (MAX 100 LRU) `cue×2+summary×1+detail×0.75` + recency |
| 4 | **intel** | Cached `lang/scripts/test/lint/build` + OS/shell, auto-invalidates on `package.json` mtime |
| 5 | **check** | `spawn {shell:true}` 64KB trunc, `PASS/FAIL/TIMEOUT` + `budget%` |

Coverage: `88%+ stmts` (`npm run test:coverage`, thresholds `80/70/70/80`).

Docs: [`docs/prompt-templates.md`](./docs/prompt-templates.md) · [`docs/checks.md`](./docs/checks.md)

## Commands

- `/forge <task>` — start disciplined run
- `/forge status` — show intent/plan/memos/focus/budget
- `/forge clear` — reset durable state
- `/forge-status` — alias for status

## Flow (opt-in)

```
happy:   /forge → intent → plan → intel → edits → check PASS → plan done → memo remember
freeform: no /forge → tools available, no gates — you choose
```

## Bundle size

```bash
npm run size
# dist: ~132K (index + state + tools + helpers + maps)
```

## Design principles

- **Slash, not nag:** skill + command control, zero `before_agent_start` injection
- **KV-cache friendly:** 5 tools registered upfront
- **Branch-durable:** `appendEntry` + `globalThis` rebuild on `session_start`
- **Minimal:** 4 src files + 1 skill, no vector DB

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

## License

MIT
