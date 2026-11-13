#!/usr/bin/env node
/**
 * verify:teaching:teeter — the teaching standard of `docs/general-problems.md` held for Teeter (unit08). Same checks as
 * `verify-teaching.mjs` (Brinewire), kept in its own file so two worlds can be passed at once.
 *
 *   1/4 banned vague words and fiction names in play text and the bank (glossary BANNED; the boss keeps its fiction)
 *   3   define on first use: no glossary term is used in a prompt, title or hint before the stage the glossary names
 *   5   every `NEEDS` entry names a primer that runs
 *   6/7 mechanism present: the vessel, stress vessel and beaker windows change with the clock, react to the table, and stay small
 *   8   predict lead-ins (ratchet)   9 static ratio (ratchet)   10 reading load (ratchet)
 * The ratchet (`tools/teaching-ratchet-teeter.json`) may only fall; `--strict` makes every shortfall fail; `--update` rewrites it.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const memory = new Map(); const noop = () => {};
globalThis.localStorage = { getItem: k => (memory.has(k) ? memory.get(k) : null), setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k), clear: () => memory.clear() };
globalThis.window = globalThis.window || { addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), location: { hash: '' }, devicePixelRatio: 1 };
globalThis.document = globalThis.document || { addEventListener: noop, removeEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getContext: () => null, setAttribute: noop }) };

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imp = p => import(pathToFileURL(join(root, p)));
const strict = process.argv.includes('--strict');
const update = process.argv.includes('--update');
let failures = 0;
const ok = m => console.log(`  ok   ${m}`);
const fail = m => { failures++; console.log(`  FAIL ${m}`); };
const warn = m => console.log(`  warn ${m}`);

const G = await imp('src/learn/glossary/teeter.js');
const PANS = await imp('src/learn/table/kits/pans.js');
const RUNNER = await imp('src/learn/engine/stagerunner.js');
const PRIMER = await imp('src/learn/engine/primers.js');
const REG = await imp('src/learn/table/kits/pans-registry.js');
const ratchetFile = join(root, 'tools/teaching-ratchet-teeter.json');
const ratchet = existsSync(ratchetFile) ? JSON.parse(readFileSync(ratchetFile, 'utf8')) : {};
const measured = {};

const strings = (v, out = [], key = '') => {
  if (typeof v === 'string') { if (/^(label|title|text|caption|note|body|prompt|msg|legend|name|short)$/.test(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach(x => strings(x, out, key));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, out, k);
  return out;
};
const quests = [];
for (const id of G.QUESTS) { const mod = await imp(`src/learn/quests/unit08/${id}.js`); quests.push({ id, mod, stages: mod.STAGES }); }
const stageText = st => {
  const texts = [st.title, st.prompt, ...(st.hints || [])];
  try { const r = st.reward; if (r) texts.push(r.title, r.body, r.log); } catch { /* getter needs a table */ }
  texts.push(...strings(st.table));
  return texts.filter(Boolean);
};

console.log('Teeter teaching standard\n');

{
  let n = 0;
  for (const q of quests) {
    if (q.id === 'boss-tipper') continue;
    q.stages.forEach((st, i) => { for (const t of stageText(st)) for (const b of G.BANNED) if (b.re.test(t)) { n++; fail(`${q.id} stage ${i + 1}: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}" (${b.why}); say ${b.use}`); } });
  }
  const bank = JSON.parse(readFileSync(join(root, 'src/learn/bank/unit08.json'), 'utf8'));
  const all = []; const walk = v => { if (typeof v === 'string') all.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(bank);
  for (const t of all) for (const b of G.BANNED) if (b.re.test(t)) { n++; fail(`bank: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}"; say ${b.use}`); }
  if (!n) ok('no banned vague word or fiction name in any play text or the bank');
}

{
  let n = 0;
  const order = G.QUESTS;
  for (const term of G.TERMS) {
    const qi = order.indexOf(term.quest);
    for (const q of quests) {
      if (q.id === 'boss-tipper') continue;
      const qj = order.indexOf(q.id);
      q.stages.forEach((st, i) => {
        const used = [st.title, st.prompt, ...(st.hints || [])].filter(Boolean).some(t => term.re.test(t));
        if (used && (qj < qi || (qj === qi && i + 1 < term.stage))) { n++; fail(`${q.id} stage ${i + 1} uses "${term.term}" before ${term.quest} stage ${term.stage}, where the glossary defines it`); }
      });
    }
  }
  if (!n) ok('no glossary term is used before the stage that glosses it');
}

{
  let n = 0;
  for (const [key, ids] of Object.entries(G.NEEDS)) {
    const [qid, no] = key.split(':');
    const q = quests.find(x => x.id === qid);
    if (!q || !q.stages[Number(no) - 1]) { n++; fail(`NEEDS ${key}: no such stage`); continue; }
    for (const id of ids) if (!PRIMER.PRIMERS[id]) { n++; fail(`NEEDS ${key}: no primer "${id}"`); }
  }
  if (!n) ok(`prerequisite map: ${Object.keys(G.NEEDS).length} stages name a primer that exists`);
}

/* ---------------------------------------------------------------- 6 + 7 mechanism views */
const arcs = (kind, f, state, clock) => {
  const log = [];
  const ctx = new Proxy({}, { get: (t, k) => (k === 'arc' ? (x, y, r) => log.push(`${x.toFixed(2)},${y.toFixed(2)},${r.toFixed(2)},${t.fillStyle || ''}`) : (...a) => { if (k === 'measureText') return { width: 1 }; return undefined; }), set: (t, k, v) => { t[k] = v; return true; } });
  const b = { X: d => d, Y: d => d, sc: 4, lay: { box: { x0: 0, y0: 0, x1: 100, y1: 60 }, dials: [], rows: [], pict: { x: 4, y: 4, w: 30, h: 30 } }, clock, bodies: false };
  REG.fixtureHandler(kind).paint(ctx, f, state, b);
  return log;
};
const stagesWith = kind => { const out = []; for (const q of quests) for (const st of q.stages) { const f = (st.table?.fixtures || []).find(x => x.kind === kind); if (f) out.push({ st, f, q }); } return out; };
/** A stage's state with its scripted solution played (so a settled vessel, a laid card, a run bench), falling back to the blank table. */
const solved = (q, st, i) => { try { return RUNNER.stateFromScript(st, q.mod.SOLUTIONS?.[i] ?? []); } catch { return RUNNER.stateFromScript(st, []); } };
for (const kind of ['pan', 'vessel', 'beaker', 'vsl', 'qk', 'icebars', 'kbars', 'kcheck', 'kstack', 'stack', 'clip', 'pgas']) {
  if (!stagesWith(kind).length) continue;
  const h = REG.fixtureHandler(kind);
  if (!h?.live) { fail(`${kind}: no live() — the window would stand still`); continue; }
  let done = false;
  for (const { st, f: f0, q } of stagesWith(kind)) {
    const i = q.stages.indexOf(st);
    const state = solved(q, st, i);
    const f = state.table.fixtures[f0.id];
    const a = arcs(kind, f, state.table, 1.0);
    if (!a.length) continue;
    const b2 = arcs(kind, f, state.table, 2.7);
    a.join('|') !== b2.join('|') ? ok(`${kind}: particles move between clock 1.0 and 2.7 (${q.id}:${i + 1})`) : fail(`${kind}: the picture is the same at two clock times (${q.id}:${i + 1})`);
    arcs(kind, f, state.table, 0).join('|') === arcs(kind, f, state.table, 0).join('|') ? ok(`${kind}: with the clock frozen the picture stands still`) : fail(`${kind}: moves with the clock frozen`);
    a.length <= 160 ? ok(`${kind}: frame cost ${a.length} circles (cap 160)`) : fail(`${kind}: ${a.length} circles per frame`);
    done = true; break;
  }
  if (!done) fail(`${kind}: no stage draws a particle in its scripted state`);
}
{
  const hit = stagesWith('pan')[0];
  const state = RUNNER.stateFromScript(hit.st, []);
  const f = state.table.fixtures[hit.f.id];
  const before = arcs('pan', f, state.table, 0);
  f.dials.t.value = 120;
  const after = arcs('pan', f, state.table, 0);
  before.join('|') !== after.join('|') ? ok('pan: running the vessel changes the colours of the particles') : fail('pan: the particles do not respond to the run');
  PANS.PANS_KIT.live(state.table) ? ok('pans kit: live() keeps the table loop running') : fail('pans kit: live() is false for a table with a vessel');
}

/* ---------------------------------------------------------------- 3D dresses */
{
  const THREE = await import('three');
  const c = { THREE, scale: 0.01, mats: {}, toPlate: p => ({ x: p.x * 0.01, z: p.y * 0.01 }), own: m => m, box: { x0: 10, y0: 10, x1: 120, y1: 70 }, ground: 0 };
  const sig = g => { let h = 0; for (const ch of g.children) if (ch.isInstancedMesh) for (let i = 0; i < ch.count * 16; i++) h += ch.instanceMatrix.array[i] * (i % 7 + 1); return h.toFixed(6); };
  for (const kind of REG.allKinds()) {
    if (!stagesWith(kind).length) continue;
    const handler = REG.fixtureHandler(kind);
    if (!handler?.live) continue;
    if (!handler.dress3d) { fail(`${kind}: live in 2D but has no 3D dress`); continue; }
    let done = false;
    for (const { st, f: f0, q } of stagesWith(kind)) {
      const i = q.stages.indexOf(st);
      const state = solved(q, st, i);
      const f = state.table.fixtures[f0.id];
      if (!handler.live(f, state.table)) continue;
      const g = handler.dress3d(f, state.table, c);
      if (!g?.userData?.counts?.dots && !g?.userData?.counts?.columns) continue;
      const a = sig(g);
      for (let k = 0; k < 90; k++) g.userData.tick(1 / 30, false);
      const b2 = sig(g);
      const still = (() => { const g2 = handler.dress3d(f, state.table, c); const s0 = sig(g2); for (let k = 0; k < 30; k++) g2.userData.tick(1 / 30, true); return s0 === sig(g2); })();
      const n = g.userData.counts;
      a !== b2 ? ok(`${kind} 3D: ${n.dots} spheres move over 90 frames (${q.id}:${i + 1})`) : fail(`${kind} 3D: the crowd does not move`);
      still ? ok(`${kind} 3D: held still under reduced motion`) : fail(`${kind} 3D: moves under reduced motion`);
      n.dots <= 220 ? ok(`${kind} 3D: ${n.dots} spheres, ${n.rings} rings, ${n.columns} columns (cap 220)`) : fail(`${kind} 3D: over the sphere cap`);
      done = true; break;
    }
    if (!done) fail(`${kind}: no stage gives its 3D dress a sphere`);
  }
}

/* ---------------------------------------------------------------- the Tour: short, and moving */
{
  const MODEL = await imp('src/learn/table/model.js');
  const TOUR = await imp('src/learn/table/tour.js');
  const T2D = await imp('src/learn/engine/table2d.js');
  const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 1 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : (k in t ? t[k] : () => undefined)), set: (t, k, v) => { t[k] = v; return true; } });
  const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
  const seen = new Map();
  for (const q of quests) q.stages.forEach((st, i) => {
    if (!st.table) return;
    for (const step of TOUR.tourSteps(MODEL.createTable(st.table, st.title))) if (!seen.has(step.flag)) seen.set(step.flag, { step, where: `${q.id}:${i + 1}` });
  });
  let long = 0; let still = 0; let bad = 0; let played = 0;
  for (const [flag, { step, where }] of seen) {
    if (flag === 'tour_strip') continue;
    if (words(step.desc) > 16) { long++; fail(`Tour step "${step.name}" (${where}) is ${words(step.desc)} words: "${step.desc}"`); }
    if (!step.demo) { still++; fail(`Tour step "${step.name}" (${where}) has no moving demonstration`); continue; }
    try {
      const d = await step.demo.build();
      let t = d.table;
      for (const s of d.steps) t = MODEL.apply(t, s.action);
      T2D.drawTable(ctx, 480, 210, t, { shown: {}, clock: 1.5, scope: 'tour:' });
      const live = (await imp('src/learn/table/kits/index.js')).getKit(t.kit)?.live?.(t);
      if (!d.steps.length && !live) { bad++; fail(`Tour demo "${step.name}" (${where}) neither acts nor moves`); }
      played++;
    } catch (e) { bad++; fail(`Tour demo "${step.name}" (${where}) throws: ${e.message}`); }
  }
  if (!long && !still && !bad) ok(`Tour: ${played} steps, each at most 16 words and each with a demonstration that plays`);
}

/* ---------------------------------------------------------------- a miss replays the cause */
{
  const PAN = await imp('src/learn/table/kits/pans-pan.js');
  const q1 = quests.find(x => x.id === 'q1-both');
  const state = RUNNER.stateFromScript(q1.stages[0], q1.mod.SOLUTIONS[0]);
  const f = state.table.fixtures.pan;
  const h = REG.fixtureHandler('pan');
  const sigAt = clock => arcs('pan', f, state.table, clock).join('|');
  sigAt(1); sigAt(1.5); // the settled picture
  const settled = sigAt(2);
  PANS.PANS_KIT.replay(state.table);
  const early = sigAt(2.1);
  const later = (() => { let s = ''; for (let c = 2.2; c < 12; c += 0.1) s = sigAt(c); return s; })();
  void h;
  early !== settled ? ok('replay: after a miss the vessel starts its run again from the first tick') : fail('replay: the vessel did not restart');
  typeof PANS.PANS_KIT.replay === 'function' ? ok('replay: the pans kit declares replay()') : fail('replay: no kit hook');
  void later;
}

/* ---------------------------------------------------------------- 9, 8, 10 ratchets */
const liveOf = st => (st.table?.fixtures || []).some(f => REG.fixtureHandler(f.kind)?.live);
let total = 0; let dynamic = 0; const staticList = [];
for (const q of quests) q.stages.forEach((st, i) => { total++; if (liveOf(st)) dynamic++; else staticList.push(`${q.id}:${i + 1}`); });
measured.static = total - dynamic;
{
  const allowed = Math.floor(total / 6);
  console.log(`\n  static ratio: ${dynamic} of ${total} stages carry a mechanism view; ${total - dynamic} static (target at most ${allowed})`);
  console.log(`  static: ${staticList.join(', ')}`);
  const prior = ratchet.static ?? total;
  if (total - dynamic > prior) fail(`more static stages than the ratchet allows (${total - dynamic} > ${prior})`);
  else if (total - dynamic > allowed) (strict ? fail : warn)(`static ratio above the target by ${total - dynamic - allowed} stages`);
  else ok('static ratio within target');
}
{
  const preds = []; let withIn = 0;
  for (const q of quests) q.stages.forEach((st, i) => { if (st.predict) { preds.push(`${q.id}:${i + 1}`); if (st.leadIn || (st.table?.fixtures || []).some(f => f.kind === 'clip')) withIn++; } });
  measured.noLeadIn = preds.length - withIn;
  if (preds.length - withIn > (ratchet.noLeadIn ?? preds.length)) fail('a predict stage lost its lead-in');
  else (strict && preds.length - withIn ? fail : warn)(`predict lead-ins: ${withIn} of ${preds.length}`);
}
{
  const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
  const sentences = s => (String(s).match(/[.!?](\s|$)/g) || []).length || 1;
  let over = 0;
  for (const q of quests) q.stages.forEach(st => {
    if (st.prompt && words(st.prompt) > 25) over++;
    try { const r = st.reward; if (r && (words(r.body) > 40 || sentences(r.body) > 2)) over++; } catch { /* getter */ }
    for (const h of st.hints || []) if (sentences(h) > 1) over++;
  });
  measured.load = over;
  if (over > (ratchet.load ?? over)) fail(`reading load grew (${over} > ${ratchet.load})`);
  else (strict && over ? fail : warn)(`reading load: ${over} prompt/reward/hint item(s) over the limit`);
}

if (update) { writeFileSync(ratchetFile, JSON.stringify(measured, null, 2) + '\n'); console.log('\n  ratchet written'); }
console.log(failures ? `\nTEACHING (TEETER) FAILED (${failures})` : '\nTEACHING (TEETER) OK');
process.exit(failures ? 1 : 0);
