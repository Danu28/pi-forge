import { registerTools } from "./tools.js";
import { hydrate, memos, deliberations, plans, focusLine, clearState } from "./state.js";
function getFocus() {
    return globalThis.__pi_forge_focus ?? focusLine ?? null;
}
export default function (pi) {
    registerTools(pi);
    pi.on("session_start", async (_ev, ctx) => {
        const entries = ctx.entries ?? ctx.store?.entries ?? [];
        const combined = Array.isArray(entries) ? entries : [];
        try {
            hydrate(combined);
        }
        catch { }
        if (focusLine)
            globalThis.__pi_forge_focus = focusLine;
    });
    // Shared status renderer
    const renderStatus = (ctx) => {
        const hasIntent = deliberations.length > 0;
        const hasPlan = plans.size > 0;
        let pct = "n/a";
        try {
            const u = ctx.getContextUsage?.();
            if (u) {
                const v = u.percent ?? null;
                pct = typeof v === "number" && Number.isFinite(v) ? `${v}%` : "unknown";
            }
        }
        catch { }
        const strict = globalThis.__pi_forge_strict ? "strict" : "relaxed (slash-only)";
        const lines = ["pi-forge — slash-controlled discipline (5 tools)"];
        lines.push(`mode: ${strict}`);
        lines.push(`intent: ${hasIntent ? "done" : "need intent{goal, hypotheses:[A,B]} (via /forge)"}`);
        lines.push(`plan: ${hasPlan ? "done" : "need plan{goal,tasks[3-10]}"}`);
        lines.push(`budget: ${pct}`);
        lines.push(`memos: ${memos.size}`);
        lines.push(`focus: ${getFocus() ?? "none"}`);
        lines.push(`hint: /forge <task> to start — intent → plan → intel → edits → check → done`);
        return lines.join("\n");
    };
    pi.registerCommand("forge", {
        description: "pi-forge — slash-controlled discipline. Usage: /forge <task> | /forge status | /forge clear | /forge strict",
        handler: async (args, ctx) => {
            const raw = args.trim();
            const cmd = raw.toLowerCase();
            if (cmd === "clear") {
                clearState();
                try {
                    delete globalThis.__pi_forge_strict;
                }
                catch { }
                ctx.ui?.notify?.("pi-forge state cleared", "info");
                return;
            }
            if (cmd === "status" || cmd === "") {
                ctx.ui?.notify?.(renderStatus(ctx), "info");
                return;
            }
            if (cmd === "strict" || cmd === "strict on" || cmd === "strict enable") {
                globalThis.__pi_forge_strict = true;
                ctx.ui?.notify?.("pi-forge strict mode ON — future write/edit/bash will be gated (unsupported legacy). Use relaxed by default.\n" + renderStatus(ctx), "info");
                return;
            }
            if (cmd === "relaxed" || cmd === "strict off" || cmd === "strict disable") {
                try {
                    delete globalThis.__pi_forge_strict;
                }
                catch { }
                ctx.ui?.notify?.("pi-forge relaxed mode — slash-only, no hard blocks\n" + renderStatus(ctx), "info");
                return;
            }
            // Treat remaining args as task → drive workflow like Musk-Algorithm
            const task = raw;
            const instruction = [
                `[pi-forge] Task: "${task}"`,
                "",
                "Execute pi-forge discipline (slash-controlled):",
                "  1. intent {goal, hypotheses:[\"A | risk:2\",\"B | risk:5\"], files, acceptance} — pick winner, set focus",
                "  2. plan {goal, tasks:[\"t1 | refs:src/a.ts\",\"t2 | refs:src/a.ts check:npm test\",\"t3 | refs:src/a.ts depends:0\"]} (3-10 tasks)",
                "  3. intel — once, get test/lint/build + OS-aware check template",
                "  4. batch exec (read → edit) per plan tasks",
                "  5. check {command:\"<testCmd>\", timeout:30} — until PASS",
                "  6. plan {id:\"plan:...\", done:[...]} → memo {action:\"remember\", cue, summary, tags, refs}",
                "Flow is opt-in via /forge — no hard blocks. Lint warnings guide quality, not gates.",
            ].join("\n");
            if (ctx.isIdle?.()) {
                pi.sendUserMessage(instruction);
            }
            else {
                pi.sendUserMessage(instruction, { deliverAs: "steer" });
                ctx.ui?.notify?.("pi-forge workflow steered into current turn — run intent → plan → intel", "info");
            }
        },
    });
    // Back-compat alias — old users typing /essentials
    pi.registerCommand("essentials", {
        description: "Alias for /forge status (pi-forge, formerly pi-essentials)",
        handler: async (args, ctx) => {
            if (args.trim().toLowerCase() === "clear") {
                clearState();
                ctx.ui?.notify?.("pi-forge state cleared (via /essentials)", "info");
                return;
            }
            ctx.ui?.notify?.(renderStatus(ctx) + "\n(alias: use /forge <task> to start)", "info");
        },
    });
    // Dedicated status command for discoverability
    pi.registerCommand("forge-status", {
        description: "pi-forge status (alias for /forge status)",
        handler: async (_args, ctx) => {
            ctx.ui?.notify?.(renderStatus(ctx), "info");
        },
    });
}
//# sourceMappingURL=index.js.map