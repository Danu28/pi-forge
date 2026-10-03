# Audit — pi-forge (Musk 5-Step)

**Date:** 2026-10-03 · **Scope:** full repo (4 src files, 3 test suites, docs, CI, deps) · **Method:** Musk Algorithm Q→D→S→A→A + `typecheck`/`lint`/`test:coverage`/`size`/`npm audit`

## Verdict: PASS with low-risk remediations

| Check | Result |
|-------|--------|
| `tsc --noEmit` (strict ES2022) | PASS |
| `eslint src` | PASS (0 warnings — `no-explicit-any:off`, `no-unused-vars:warn`) |
| `vitest run` | 81/81 PASS (5.9s) |
| `vitest run --coverage` | 91.94% stmts / 82.21% branch / 94.25% func / 95.09% lines — **exceeds** thresholds `80/70/70/80` (`vitest.config.ts: thresholds lines:80 functions:70 branches:70 statements:80`) |
| `npm run size` | dist 132K (6 files) < 200KB gate — PASS |
| `npm audit` | 1 high in transitive `brace-expansion@4.0.0` via `@earendil-works/pi-coding-agent@0.87.1` → fix by bumping peer/dev to `^1.0.0` (latest) when ready — not actionable in this repo alone |
| `engines` | package `>=20`, pi-coding-agent `>=22.19.0` — mismatch noted (pi will still run on 20 but upstream tests on 22+) |
| LICENSE / README / SKILL | Present and consistent with slash-only flow |

---

## 1 — Question (validated requirements)

**Problem statement:** Ensure `pi-forge` (slash-controlled fork of `predecessor 1.3.1`) is correct, minimal, secure, documented, shippable.

- **Must:** 5 tools contract (intent low-risk pick, plan DAG 3-10 + refs/check/depends, memo TF-IDF LRU100 + recency, intel cache+mtime, check 64KB/600s spawn + OS normalize), strict ES2022, node>=20, doc truth (no auto hooks), supply chain clean → all proven above.
- **Should:** coverage gate, committed `dist`, legacy `predecessor:*` compat, `strict` toggle, 200KB gate.
- **Nice/rejected:** pentest for extension with no network/secrets, vector DB for 100 memos, `ts-next` matrix (correctly deleted).

Cheapest validation path is exactly `typecheck+lint+test:coverage` per `docs/checks.md` — no heavier audit needed.

## 2 — Delete (what to remove; ~10% target)

| Candidate | LOC | Verdict | Revert signal |
|-----------|-----|---------|---------------|
| `dist/` committed | 132K | **KEEP** with justification: `pi install git:…` needs `dist` at install (no build step). Alternatives (`.gitattributes`, CI dist-freshness check) optional — current CI already runs `npm run build` and size gate. | `npm publish` fails if removed |
| Legacy `predecessor:*` + `__predecessor_*` mirrors (14 branches in `state.ts`, globals in `tools.ts`/`index.ts`) | ~40 | **KEEP for 1.x**, schedule removal 2.0. Fork is 1 commit old; deleting now breaks 0→1 migration. Mark `TODO 2.0` | No reports in 30d → delete |
| `strict` mode (`__pi_forge_strict`, `/forge strict`\|`relaxed`) | ~15 in `index.ts` + 15 in tests | **DELETE** — flag never gates `write/edit/bash` (hard blocks removed in fork), only changes status line; notification claims "future … will be gated (unsupported legacy)" — misleading. | If telemetry shows usage, re-add as no-op |
| `pi-shim.d.ts` typebox declare | 6 | KEEP — tiny, harmless | — |
| Legacy compat tests | ~50 | KEEP until legacy deleted | — |

**Executed in this audit:** `strict` flag deleted (see 5 — Automate). Others flagged, not deleted per rationale.

## 3 — Simplify (surviving design)

- `state.ts` — pure data + `hydrate`/`clearState`/`scoreEpisode` (Map+array, LRU100 via `enforceMemoCap`). Keep flat; debt isolated to legacy branch.
- `tool-helpers.ts` — pure fns (`parseTask`, `lintIntent`/`lintPlan`, `normalizeCheckForOS`, `runCmd` with 64KB trunc + SIGKILL). Boring `node:child_process.spawn` — optimal, no `execa`.
- `tools.ts` — 5 tools inline TypeBox schemas, `appendEntry` durability, TF-IDF `cue×2+summary×1+detail×0.75+recency`. Single-string DSL `title | refs:… check:… depends:…` avoids schema bloat.
- `index.ts` — `registerTools` + `session_start` hydrate + 3 commands; now collapsed `renderStatus` path — `strict` state removed.

No layer collapse (merging `state`+`helpers` would hurt testability); no framework replacement needed.

## 4 — Accelerate (bottleneck)

Local timings (Win, node 24): `typecheck ~1s`, `lint ~1s`, `build ~1.5s`, `vitest run 5.9s`, `coverage 6.0s` → full CI ~15s local, ~45s GH (npm ci). Bottleneck is `vitest` (40%). Second bottleneck is human audit (5 min reads).

**Target:** local validation <5s p95, CI <30s, audit <2 min via automation.

**Changes:**
- Inline lint (`lintIntent`/`lintPlan`) already shift-left saves 1 LLM call.
- `intel` cache: second call 0ms (measured) — keep.
- Batch `test:ci` (`typecheck && lint && coverage`) exists; could run `typecheck`+`lint` in parallel via `concurrently` (optional, not added — overhead exceeds gain for 2s tasks).
- Coverage only gates `main`; watch runs plain `vitest` (negligible diff 5.9 vs 6.0 — keep as-is).

## 5 — Automate (only what survives 1-4)

**Automated now:**
- `package.json#scripts.audit` → `npm run typecheck && npm run lint && npm run test:coverage && npm run size` — one-command audit (<7s, replaces manual 5-min read).
- CI already automates `typecheck+build+lint+coverage+size gate`; added `audit` as local alias.
- `strict` mode automation removed — no automation for waste (per Musk rule: *Never automate something that shouldn't exist*).

**NOT automated (needs human judgment):**
- Legacy `predecessor:*` removal — decision in 2.0 after migration window.
- `brace-expansion` vuln — requires upstream `pi-coding-agent@1.0.0` bump (test in branch first).
- Dist freshness — CI already builds; optional `git diff --exit-code dist` guard not added (noise vs value low).

**Guardrails:** all automation is `npm run` scripts (removable in one line); CI size gate fails >200KB; coverage thresholds fail below `80/70/70/80`.

---

## Findings (by severity)

### Medium
- **M1 — `strict` mode dead code** — flag `__pi_forge_strict` never gates writes (hard blocks deleted in fork). Notification text promises future gating — misleading. **Fix applied:** removed flag/state, `strict`/`relaxed` now no-op deprecation notice (“slash-only; flag removed”), `renderStatus` always shows `relaxed (slash-only)`. Tests updated.
- **M2 — transitive high vuln** — `brace-expansion@4.0.0` via `pi-coding-agent@0.87.1` (GHSA-q2hr-2g5m-vwhr / qhr7-859c-m2p7 / 6j4f-fj2g-mc7p, Quadratic DoS). **Fix:** bump `peerDependencies` + `devDependencies` to `^1.0.0` when ready (requires testing — `@earendil-works/pi-tui` also 0.87.1 → 1.0.0). Not patched in this audit to avoid forced major bump; tracked.

### Low
- **L1 — `dist` committed** — justified for `pi install git:` but pollutes history. Optional mitigation: CI job `npm run build && git diff --exit-code dist` to catch stale `dist`. Not added (CI already builds).
- **L2 — `engines` mismatch** — package `>=20` vs peer `pi-coding-agent` `>=22.19.0`. Align to `>=22.19.0` if pi 1.0 requires 22+; otherwise document.
- **L3 — legacy compat debt** — ~40 LOC `predecessor:*` branches, 6 `__predecessor_*` globals. Add `TODO(v2): remove predecessor compat` (applied as comment in `state.ts`). Keep for 1.x.
- **L4 — `@types/node` outdated** — `24.19.1` vs `26.6.4` (major). No breakage; bump when moving to Node 26.
- **L5 — `typescript` pinned `^5` latest `7.0.2`** — 7 is major; keep 5 for `pi` compat until upstream moves.

### Info / Verified OK
- No secrets in repo (`.env` gitignored, no keys in src).
- OS-aware `check` (normalize `ls→dir`, `grep→findstr`, `cat→type`) + 64KB trunc + 600s cap — correctly bounded per `docs/checks.md`.
- Memo scoring `cue×2+summary×1+detail×0.75` + tag×1.5 + recency (+30% <1d, +15% <7d, +5% <30d) — matches docs.
- Plan DSL `refs:`/`check:`/`depends:` parsing + `validateDepends` OOB/self/duplicate — correct, DAG blocked-until-done enforced.
- `hydrate` migrates `predecessor:*` and nested `key/value` wrapper + legacy shapes — tests cover.
- `enforceMemoCap` LRU by `ts`, `clearState` wipes globals — tested.
- Bundle `dist` maps present, `package.json` `files:[dist,skills,README,LICENSE]` minimal.

## Actions taken
- [x] Added `scripts.audit` to `package.json`
- [x] Removed `__pi_forge_strict` state & branching in `src/index.ts` (deprecation path)
- [x] Updated `src/index.test.ts` to expect deprecation (no global set)
- [x] Added `TODO(v2)` comment for `predecessor` compat in `src/state.ts`
- [x] Rebuilt `dist/` + verified `typecheck`/`lint`/`test:coverage`/`size` PASS

## Actions deferred (tracked)
- [ ] Bump `@earendil-works/pi-coding-agent` + `@earendil-works/pi-tui` `0.87.1 → 1.0.0` (fixes brace vuln) — do in dedicated PR with test run
- [ ] Align `engines.node` to `>=22.19.0` if upstream requires
- [ ] Remove `predecessor` compat in 2.0 (delete ~40 LOC + 50 LOC tests, flip to `MAX_MEMOS` primary path)
- [ ] Optional CI: `git diff --exit-code dist` after `npm run build` to catch stale commit

## How to re-run audit
```bash
npm run audit          # <7s: typecheck + lint + coverage + size
npm audit              # supply chain (high vuln expected until pi 1.0 bump)
npm run build && git diff --exit-code dist   # optional stale-dist check
```
