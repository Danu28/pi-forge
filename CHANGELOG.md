# Changelog

## 1.0.0 — pi-forge inaugural (fork of pi-essentials 1.3.1)

### Slash-controlled (breaking vs pi-essentials auto)

- **New name:** `pi-forge` — slash-controlled discipline, not auto-nag.
- **Commands:** `/forge <task>` (start), `/forge status`, `/forge clear`, `/forge strict|relaxed`, plus `/forge-status` and `/essentials` compat alias.
- **No auto hooks:** removed `before_agent_start` prompt injection, `tool_call` hard block, `tool_result` fail-counter gating, `session_before_compact` focus injection, `context` budget injection. Guidance now via `skill` + tool `promptGuidelines` only when you invoke `/forge`.
- **Skill:** `skills/forge/SKILL.md` auto-loaded; drives `intent→plan→intel→edits→check→done` only on slash.

### State & migration

- Durable keys renamed to `pi-forge:*` (`focus`, `deliberation`, `plan`, `memo`, `intel`); `hydrate()` migrates legacy `pi-ess:*` from pi-essentials automatically.
- Globals renamed to `__pi_forge_*` (mirrors legacy `__pi_ess_*` for compat).
- Focus prefix now `[pi-forge focus]` (was `[pi-essentials focus]`).

### Tool polish (same 5 contracts)

- `intent`/`plan` descriptions now say “via /forge” (no “REQUIRED before write” hard language).
- `check` prompt no longer mentions “after 2 fails need debug intent”.
- `intel` cache key uses `__pi_forge_intel` with fallback to `__pi_ess_intel`.

### Product quality

- `package.json` adds `skills` field, `check` alias (`tsc --noEmit`), lighter keywords, repo `Danu28/pi-forge`.
- CI slimmed to single `node 20` job, size gate `200KB`, no `ts-next` matrix.
- README rewritten for slash usage, migration guide, command table.
- `pi-essentials` project kept intact alongside (per task Note).

### Inherited (from 1.3.1)

- 5 tools, TF-IDF memo (100 LRU), DAG plan (3-10, depends+refs+check), cached intel, OS-aware check, 64KB trunc, coverage `80/70/70/80`.

## 1.3.1 (pi-essentials baseline)

- See `../pi-essentials/CHANGELOG.md`.
