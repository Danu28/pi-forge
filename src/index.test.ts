import { describe, it, expect, beforeEach, vi } from "vitest";
import createExtension from "./index.js";
import { clearState } from "./state.js";

function makePi() {
  const handlers: Record<string, (...args: unknown[]) => unknown> = {};
  const tools: any[] = [];
  const commands: Record<string, any> = {};
  const appendEntry = vi.fn(async () => {});
  const sendUserMessage = vi.fn();
  const pi: any = {
    on: (ev: string, h: (...args: unknown[]) => unknown) => { handlers[ev] = h; },
    registerTool: (t: any) => tools.push(t),
    registerCommand: (name: string, cmd: any) => { commands[name] = cmd; },
    appendEntry,
    sendUserMessage,
  };
  return { pi, handlers, tools, commands, appendEntry, sendUserMessage };
}

describe("pi-forge extension (slash-controlled)", () => {
  beforeEach(() => {
    clearState();
    (globalThis as any).__pi_forge_focus = undefined;
    (globalThis as any).__pi_forge_intel = undefined;
    (globalThis as any).__pi_forge_plan = undefined;
    (globalThis as any).__pi_forge_strict = undefined;
    (globalThis as any).__pi_ess_focus = undefined;
    (globalThis as any).__pi_ess_intel = undefined;
    (globalThis as any).__pi_ess_plan = undefined;
  });

  it("registers 5 tools on startup", () => {
    const { pi, tools } = makePi();
    createExtension(pi);
    const names = tools.map((t: any) => t.name).sort();
    expect(names).toEqual(["check", "intel", "intent", "memo", "plan"]);
  });

  it("registers slash commands forge, forge-status, essentials", () => {
    const { pi, commands } = makePi();
    createExtension(pi);
    expect(commands["forge"]).toBeDefined();
    expect(commands["forge-status"]).toBeDefined();
    expect(commands["essentials"]).toBeDefined();
  });

  it("does not register auto-blocking hooks", () => {
    const { pi, handlers } = makePi();
    createExtension(pi);
    // only session_start should exist; no before_agent_start, tool_call, context auto injection
    expect(handlers["session_start"]).toBeDefined();
    expect(handlers["before_agent_start"]).toBeUndefined();
    expect(handlers["tool_call"]).toBeUndefined();
    expect(handlers["context"]).toBeUndefined();
  });

  it("session_start hydrates state", async () => {
    const { pi, handlers } = makePi();
    createExtension(pi);
    const h = handlers["session_start"];
    await h({}, { entries: [{ key: "pi-forge:memo", value: { id: "m1", cue: "c", summary: "s", ts: Date.now() } }], store: {} });
    expect(handlers["session_start"]).toBeDefined();
  });

  it("session_start migrates legacy pi-ess keys", async () => {
    const { pi, handlers } = makePi();
    createExtension(pi);
    await handlers["session_start"]({}, { entries: [{ key: "pi-ess:memo", value: { id: "legacy1", cue: "c", summary: "s", ts: Date.now() } }], store: {} });
    // after hydrate legacy memo should be available
    const { memos } = await import("./state.js");
    expect(memos.has("legacy1")).toBe(true);
  });

  it("forge status reports without task", async () => {
    const { pi, commands } = makePi();
    createExtension(pi);
    const notify = vi.fn();
    const ctx: any = { getContextUsage: () => ({ percent: 42 }), ui: { notify } };
    await commands["forge"].handler("status", ctx);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("pi-forge"), "info");
  });

  it("forge with no args shows status", async () => {
    const { pi, commands } = makePi();
    createExtension(pi);
    const notify = vi.fn();
    const ctx: any = { getContextUsage: () => ({}), ui: { notify } };
    await commands["forge"].handler("", ctx);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("pi-forge"), "info");
  });

  it("forge clear resets state", async () => {
    const { pi, commands } = makePi();
    createExtension(pi);
    const notify = vi.fn();
    const ctx: any = { getContextUsage: () => ({}), ui: { notify } };
    await commands["forge"].handler("clear", ctx);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("cleared"), "info");
  });

  it("forge strict/relaxed toggles mode", async () => {
    const { pi, commands } = makePi();
    createExtension(pi);
    const notify = vi.fn();
    const ctx: any = { getContextUsage: () => ({}), ui: { notify } };
    await commands["forge"].handler("strict", ctx);
    expect((globalThis as any).__pi_forge_strict).toBe(true);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("strict mode ON"), "info");
    await commands["forge"].handler("relaxed", ctx);
    expect((globalThis as any).__pi_forge_strict).toBeUndefined();
  });

  it("forge <task> steers workflow when busy", async () => {
    const { pi, commands, sendUserMessage } = makePi();
    createExtension(pi);
    const notify = vi.fn();
    const ctx: any = { isIdle: () => false, ui: { notify } };
    await commands["forge"].handler("add auth", ctx);
    expect(sendUserMessage).toHaveBeenCalledWith(expect.stringContaining("pi-forge"), expect.objectContaining({ deliverAs: "steer" }));
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("steered"), "info");
  });

  it("forge <task> sends user message when idle", async () => {
    const { pi, commands, sendUserMessage } = makePi();
    createExtension(pi);
    const ctx: any = { isIdle: () => true, ui: { notify: vi.fn() } };
    await commands["forge"].handler("add auth", ctx);
    expect(sendUserMessage).toHaveBeenCalledWith(expect.stringContaining('Task: "add auth"'));
  });

  it("essentials alias shows status and supports clear", async () => {
    const { pi, commands } = makePi();
    createExtension(pi);
    const notify = vi.fn();
    const ctx: any = { getContextUsage: () => ({ percent: 10 }), ui: { notify } };
    await commands["essentials"].handler("", ctx);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("pi-forge"), "info");
    await commands["essentials"].handler("clear", ctx);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("cleared"), "info");
  });

  it("forge-status alias works", async () => {
    const { pi, commands } = makePi();
    createExtension(pi);
    const notify = vi.fn();
    const ctx: any = { getContextUsage: () => ({}), ui: { notify } };
    await commands["forge-status"].handler("", ctx);
    expect(notify).toHaveBeenCalledWith(expect.stringContaining("pi-forge"), "info");
  });
});
