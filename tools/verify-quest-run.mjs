#!/usr/bin/env node
/**
 * verify-quest-run.mjs — Every stage-runner quest MOUNTS, and every stage RUNS.
 *
 * `verify:learn` grades a quest's table and draws its plates, but nothing in it
 * ever calls `mount()`: the code that loads a stage, paints a dial, wires a key
 * and answers a tap lives in a closure that only a browser reached. The first
 * run of this found that `createRunner` loaded stage one before the quest had
 * been handed its runner, so every quest with a dial faulted on its first
 * stage and would have shown a blank bench.
 *
 * HOW. A universal stub stands in for the DOM (every property is another stub,
 * `querySelectorAll` is empty, `getContext` is the recording context from
 * `lib/ctx-stub.mjs`). Each quest is mounted for real, and for every stage the
 * harness loads it, presses every key the stage's handler knows (and a few it
 * does not, which must be refused quietly), taps every hit on every plate
 * through the bench's own `pressAt`, and renders the answer widget. A throw
 * anywhere is a fault a player would have met.
 *
 * It is deliberately lenient about the DOM and strict about the code: it proves
 * nothing about layout, and everything about whether the quest runs.
 */

const memory = new Map();
globalThis.localStorage = { getItem: k => memory.get(k) ?? null, setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k), clear: () => memory.clear() };
const noop = () => {};
function stub() {
  const f = function () { return stub(); };
  return new Proxy(f, {
    get(t, p) {
      if (p === Symbol.toPrimitive) return () => '';
      if (typeof p === 'symbol') return undefined;
      if (p === 'then') return undefined;
      if (p === 'length') return 0;
      if (p === 'querySelectorAll' || p === 'getElementsByClassName' || p === 'children' || p === 'childNodes') return () => [];
      if (p === 'getBoundingClientRect') return () => ({ left: 0, top: 0, width: 420, height: 260 });
      if (p === 'dataset') return {};
      if (p === 'classList') return { add: noop, remove: noop, toggle: noop, contains: () => false };
      if (p === 'style') return {};
      if (p === 'getContext') return () => ctxStub();
      if (p === 'hasAttribute') return () => false;
      if (p === 'matches' || p === 'closest') return () => null;
      return stub();
    },
    set() { return true; },
    apply() { return stub(); }
  });
}
const { makeCtx } = await import('./lib/ctx-stub.mjs');
function ctxStub() { return makeCtx(420, 260); }
globalThis.window = { addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), location: { hash: '' }, devicePixelRatio: 1, innerWidth: 1200, innerHeight: 800 };
globalThis.document = new Proxy({ body: stub(), documentElement: stub(), createElement: () => stub(), getElementById: () => stub(), querySelector: () => stub(), querySelectorAll: () => [], addEventListener: noop, removeEventListener: noop }, { get: (t, p) => (p in t ? t[p] : stub()) });
globalThis.requestAnimationFrame = () => 0;
globalThis.cancelAnimationFrame = noop;
globalThis.performance ??= { now: () => Date.now() };
Object.defineProperty(globalThis, 'navigator', { value: { userAgent: 'node' }, configurable: true });

const hooks = { tools: [], runners: [], benches: [] };
globalThis.__LQ_TEST__ = { tool: f => { hooks.tools.length = 0; hooks.tools.push(f); }, runner: r => hooks.runners.push(r), bench: b => hooks.benches.push(b) };

const { allQuests } = await import('../src/learn/curriculum.js');
let failed = 0;
let ran = 0;
for (const q of allQuests().filter(x => x.status === 'live')) {
  const id = q.key;
  const mod = await q.module();
  hooks.runners.length = 0; hooks.benches.length = 0;
  const ctx = { world: {}, quest: {}, stagesCleared: 0, isComplete: true, reportStage: noop, reportComplete: noop, exit: noop };
  try {
    const m = mod.mount(stub(), ctx);
    // Only the quests built on the shared stage loop expose a runner to drive.
    if (!hooks.runners.length) { m?.dispose?.(); continue; }
    ran++;
    const runner = hooks.runners[0];
    const bench = hooks.benches[0];
    for (let i = 0; i < mod.STAGES.length; i++) {
      runner.loadStage(i);
      // Press every tool the stage offers, and every probe the bench can make.
      const stage = mod.STAGES[i];
      const tool = hooks.tools[0];
      const toolIds = [];
      for (const c of (stage.controls || [])) {
        toolIds.push(c, `${c}:1`);
      }
      toolIds.push('fire:1', 'fire:50', 'fire:500', 'clear', 'slice', 'track', 'fire', 'hand:u', 'hand:d', 'hand:x', 'core', 'magnet-sample', 'magnet-rack', 'region:infrared', 'path:2', 'strip', 'add', 'reset');
      for (const t of toolIds) { try { tool?.(t); } catch (e) { throw new Error(`stage ${i + 1} tool "${t}": ${e.stack || e.message}`); } }
      // Taps on every plate's hit list.
      for (const pl of bench?.plates || []) {
        pl.w = 420; pl.h = 260;
        bench.drawAll();
        for (const hit of pl.hits || []) {
          const px = hit.r !== undefined ? hit.x : (hit.x0 + hit.x1) / 2;
          const py = hit.r !== undefined ? hit.y : (hit.y0 + hit.y1) / 2;
          try { bench.pressAt(pl.item, px, py, pl.hits, pl); } catch (e) { throw new Error(`stage ${i + 1} press ${pl.item.id}/${hit.key}: ${e.stack || e.message}`); }
        }
      }
      // The answer widget, as a player would set it.
      runner.renderWidget();
    }
    m.dispose();
    console.log(`  ok   ${id}: mounted, ${mod.STAGES.length} stages loaded, tools and probes pressed`);
  } catch (e) {
    failed++;
    console.log(`  FAIL ${id}: ${e.stack?.split('\n').slice(0, 6).join('\n       ') || e}`);
  }
}
console.log(`\n${failed ? failed + ' QUEST(S) FAILED TO RUN' : `QUESTS RUN OK (${ran} quests on the shared stage loop)`}`);
process.exit(failed ? 1 : 0);
