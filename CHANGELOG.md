# Changelog

## 1.0.0 — pi-forge inaugural

### Slash-controlled discipline

- **New name:** `pi-forge` — slash-controlled discipline, not auto-nag.
- **Commands:** `/forge <task>` (start), `/forge status`, `/forge clear`, plus `/forge-status` alias.
- **No auto hooks:** guidance via `skill` + tool `promptGuidelines` only when you invoke `/forge`.
- **Skill:** `skills/forge/SKILL.md` auto-loaded; drives `intent→plan→intel→edits→check→done` only on slash.

### State

- Durable keys: `pi-forge:memo`, `pi-forge:deliberation`, `pi-forge:plan`, `pi-forge:focus`, `pi-forge:intel`
- Globals: `__pi_forge_*` for compaction durability.
- Focus prefix: `[pi-forge focus]`.

### Tool polish (5 contracts)

- `intent`/`plan` descriptions say “via /forge”.
- `intel` cache key uses `__pi_forge_intel` with mtime invalidation.
- `check` OS-aware, 64KB trunc, 600s cap.

### Product quality

- `package.json` adds `skills` field, lighter keywords, repo `Danu28/pi-forge`.
- CI slimmed to single `node 20` job, size gate `200KB`, no `ts-next` matrix.
- README for slash usage, command table.

### Core

- 5 tools, TF-IDF memo (100 LRU), DAG plan (3-10, depends+refs+check), cached intel, OS-aware check, 64KB trunc, coverage `80/70/70/80`.
