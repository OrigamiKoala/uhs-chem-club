#!/usr/bin/env node
/**
 * verify:teaching:mirrowen — the teaching standard of `docs/general-problems.md` held for Mirrowen (unit06). Same checks as the other worlds'
 * teaching files, kept in its own file so worlds can be passed at once.
 *
 *   1/4 banned vague words and fiction names in play text and the bank (glossary BANNED)
 *   3   define on first use: no glossary term is used in a title, prompt or hint before the stage the glossary names
 *   5   every `NEEDS` entry names a primer that runs
 *   6/7 mechanism present: each moving fixture changes with the clock, stands still with the clock frozen, responds to the controls, and
 *       stays small, in 2D and as the 3D crowd; the piston's drag zone grades the dial; a miss restarts the glides
 *   8   every predict stage has a lead-in clip   9 static ratio, per world and per bench   10 reading load   Tour: short, and moving
 * The ratchet (`tools/teaching-ratchet-mirrowen.json`) may only fall; `--strict` makes every shortfall fail; `--update` rewrites it.
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

const G = await imp('src/learn/glossary/mirrowen.js');
const MATTER = await imp('src/learn/table/kits/matter.js');
const MOTION = await imp('src/learn/table/kits/matter-motion.js');
const HEATM = await imp('src/learn/table/kits/heat-motion.js');
const P3D = await imp('src/learn/table/kits/pans-3d.js');
const RUNNER = await imp('src/learn/engine/stagerunner.js');
const PRIMER = await imp('src/learn/engine/primers.js');
const MODEL = await imp('src/learn/table/model.js');
const ratchetFile = join(root, 'tools/teaching-ratchet-mirrowen.json');
const ratchet = existsSync(ratchetFile) ? JSON.parse(readFileSync(ratchetFile, 'utf8')) : {};
const exceptionsFile = join(root, 'tools/teaching-exceptions-mirrowen.json');
const exceptions = existsSync(exceptionsFile) ? JSON.parse(readFileSync(exceptionsFile, 'utf8')) : {};
const measured = {};

const strings = (v, out = [], key = '') => {
  if (typeof v === 'string') { if (/^(label|title|text|caption|note|body|prompt|msg|legend|name|short)$/.test(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach(x => strings(x, out, key));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, out, k);
  return out;
};
const quests = [];
for (const id of G.QUESTS) { const mod = await imp(`src/learn/quests/unit06/${id}.js`); quests.push({ id, mod, stages: mod.STAGES }); }
const stageText = st => {
  const texts = [st.title, st.prompt, ...(st.hints || [])];
  try { const r = st.reward; if (r) texts.push(r.title, r.body, r.log); } catch { /* getter needs a table */ }
  texts.push(...strings(st.table));
  return texts.filter(Boolean);
};

console.log('Mirrowen teaching standard\n');

/* ---------------------------------------------------------------- 1 + 4 banned words */
{
  let n = 0;
  for (const q of quests) {
    q.stages.forEach((st, i) => { for (const t of stageText(st)) for (const b of G.BANNED) if (b.re.test(t)) { n++; fail(`${q.id} stage ${i + 1}: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}" (${b.why}); say ${b.use}`); } });
  }
  const bank = JSON.parse(readFileSync(join(root, 'src/learn/bank/unit06.json'), 'utf8'));
  const all = []; const walk = v => { if (typeof v === 'string') all.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!['id', 'quest', 'kind', 'calc'].includes(k)) walk(x); };
  walk(bank);
  for (const t of all) for (const b of G.BANNED) if (b.re.test(t)) { n++; fail(`bank: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}"; say ${b.use}`); }
  if (!n) ok('no banned vague word or fiction name in any play text or the bank');
}

/* ---------------------------------------------------------------- 3 define on first use */
{
  let n = 0;
  const order = G.QUESTS;
  for (const term of G.TERMS) {
    const qi = order.indexOf(term.quest);
    for (const q of quests) {
      const qj = order.indexOf(q.id);
      q.stages.forEach((st, i) => {
        const used = [st.title, st.prompt, ...(st.hints || [])].filter(Boolean).some(t => term.re.test(t));
        if (used && (qj < qi || (qj === qi && i + 1 < term.stage))) { n++; fail(`${q.id} stage ${i + 1} uses "${term.term}" before ${term.quest} stage ${term.stage}, where the glossary defines it`); }
      });
    }
  }
  if (!n) ok('no glossary term is used before the stage that glosses it');
}

/* ---------------------------------------------------------------- 5 prerequisite map */
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
const solved = (q, st, i) => { try { return RUNNER.stateFromScript(st, q.mod.SOLUTIONS?.[i] ?? []); } catch { return RUNNER.stateFromScript(st, []); } };
const boxOf = f => ({ x0: f.at.x - f.size.w / 2, y0: f.at.y - f.size.h / 2, x1: f.at.x + f.size.w / 2, y1: f.at.y + f.size.h / 2, w: f.size.w, h: f.size.h });
const paintOf = (ctx, f, state, b) => MATTER.MATTER_KIT.paintFixture(ctx, f, state, { ...b, lay: { ...b.lay, dials: Object.keys(f.dials || {}).map((_, i) => ({ y: b.lay.box.y0 + 8 + i * 5 })) } });
const picture = (f, state, clock, scope = 'v:') => {
  // A glide starts when a reading first appears: look once at the start, so a later look sees it part-way or arrived.
  if (clock > 0.5) P3D.readPainter({ paint: paintOf }, f, state, boxOf(f), 0.01, scope);
  const out = P3D.readPainter({ paint: paintOf }, f, state, boxOf(f), clock, scope);
  const r = v => v.toFixed(2);
  return [...out.dots.map(d => `d${r(d.x)},${r(d.y)},${r(d.r)}`), ...out.rings.map(d => `r${r(d.x)},${r(d.y)}`), ...out.rects.map(d => `c${r(d.x)},${r(d.y)},${r(d.w)},${r(d.h)}`)].join('|');
};
const count = (f, state, clock) => { const o = P3D.readPainter({ paint: paintOf }, f, state, boxOf(f), clock, 'c:'); return o.dots.length + o.rings.length; };
/** The states a scripted solution passes through (after each action) in which the fixture draws something: a sample in its slot, a reading taken. */
const inked = (q, st, i, f0, scope) => {
  const sol = q.mod.SOLUTIONS?.[i] ?? [];
  const out = [];
  for (let k = 0; k <= sol.length; k++) {
    let state; try { state = RUNNER.stateFromScript(st, sol.slice(0, k)); } catch { continue; }
    const f = state.table.fixtures[f0.id];
    if (f && picture(f, state.table, 1.0, `${scope}${k}:`)) out.push({ state, f });
  }
  return out;
};
const stagesWith = kind => { const out = []; quests.forEach(q => q.stages.forEach((st, i) => { const f = (st.table?.fixtures || []).find(x => x.kind === kind); if (f) out.push({ st, f, q, i }); })); return out; };

const MODELS = ['press', 'window', 'probe', 'vapour', 'heatcurve', 'flask', 'solidtest', 'strip', 'mlead'];
// The flask draws every water molecule of its window as three circles; the 3D crowd is capped at 220 spheres whatever the flat bench draws.
const CAPS = { flask: 640 };
for (const kind of MODELS) {
  const hits = stagesWith(kind);
  if (!hits.length) { fail(`${kind}: no stage stands this moving model up`); continue; }
  let moved = false; let still = false; let cheap = true;
  const cap = CAPS[kind] || 220;
  for (const { st, f: f0, q, i } of hits) {
    for (const { state, f } of inked(q, st, i, f0, `k${kind}`)) {
      const a = picture(f, state.table, 1.0, `a${kind}${i}:`);
      const b = picture(f, state.table, 2.7, `a${kind}${i}:`);
      if (a !== b) moved = true;
      if (picture(f, state.table, 0.001, `s${kind}${i}:`) === picture(f, state.table, 0.001, `s${kind}${i}:`)) still = true;
      const n = count(f, state.table, 1.0);
      if (n > cap) { cheap = false; fail(`${kind}: ${n} circles in ${q.id}:${i + 1} (cap ${cap})`); }
    }
  }
  moved ? ok(`${kind}: the picture changes with the clock`) : fail(`${kind}: the picture is the same at two clock times`);
  still ? ok(`${kind}: with the clock frozen the picture stands still`) : fail(`${kind}: moves with the clock frozen`);
  if (cheap) ok(`${kind}: frame cost within the cap in every stage`);
}

/* The moving models answer the controls. */
{
  {
    // The piston: the same gas in less volume packs the same dots into less space.
    const hit = stagesWith('press')[0];
    const state = RUNNER.stateFromScript(hit.st, [{ place: { piece: 'b', to: 'slot:press.well' } }]);
    const f = state.table.fixtures[hit.f.id];
    const a = picture(f, state.table, 3.0, 'pr0:');
    f.dials.squeeze.value = f.dials.squeeze.max;
    const b = picture(f, state.table, 3.0, 'pr1:');
    a !== b ? ok('press: moving the piston changes where the gas molecules are') : fail('press: moving the piston does not change the model');
  }
  {
    const hit = stagesWith('window')[0];
    const state = solved(hit.q, hit.st, hit.i);
    const f = state.table.fixtures[hit.f.id];
    const a = picture(f, state.table, 3.0, 'wi0:');
    f.dials.heat.value = f.dials.heat.value === f.dials.heat.max ? f.dials.heat.min : f.dials.heat.max;
    const b = picture(f, state.table, 3.0, 'wi1:');
    a !== b ? ok('window: the heater changes the molecules') : fail('window: the heater does not change the molecules');
  }
  {
    const hit = stagesWith('heatcurve').find(h => h.f.props.window) || stagesWith('heatcurve')[0];
    const apart = RUNNER.stateFromScript(hit.st, []);
    const heated = solved(hit.q, hit.st, hit.i);
    const a = picture(apart.table.fixtures[hit.f.id], apart.table, 4.0, 'hc0:');
    const b = picture(heated.table.fixtures[hit.f.id], heated.table, 4.0, 'hc1:');
    a !== b ? ok('heatcurve: adding heat changes the molecules in the window') : fail('heatcurve: adding heat does not change the model');
  }
  {
    const hit = stagesWith('vapour')[0];
    const seq = inked(hit.q, hit.st, hit.i, hit.f, 'vseq').map(x => ({ ...x, n: count(x.f, x.state.table, 3.0) }));
    const before = seq.find(x => x.n > 5);
    const after = seq.reduce((m, x) => (x.n > m.n ? x : m), seq[0]);
    const a = picture(before.f, before.state.table, 4.0, 'va0:');
    const b = picture(after.f, after.state.table, 4.0, 'va1:');
    a !== b ? ok('vapour: settling a liquid fills the space above it with molecules') : fail('vapour: settling does not change the model');
  }
  {
    // The piston is a drag zone on the press, and it grades the same dial the two-tap twin sets.
    const hit = stagesWith('press')[0];
    const z = MATTER.MATTER_KIT.tapZones(hit.f);
    z.some(x => x.dial === 'squeeze' && x.drag?.invert) ? ok('press: the piston can be dragged, and sets the dial the stage grades') : fail('press: no piston drag zone');
  }
}

/* The trays of q1 stage 1 are pictures of what the poured sample did, in moving particles. */
{
  const q1 = quests.find(q => q.id === 'q1-states');
  const trays = Object.values(MODEL.createTable(q1.stages[0].table, 't').zones.trays);
  const views = trays.map(t => t.view).sort().join(',');
  const draw = (t, clock) => { const { ctx, out } = P3D.recorder(); MATTER.MATTER_KIT.paintTray(ctx, t, {}, { X: d => d * 4, Y: d => d * 4, sc: 4, r: { x0: t.at.x - t.size.w / 2, y0: t.at.y - t.size.h / 2, w: t.size.w, h: t.size.h }, clock }); return out.dots.map(d => `${d.x.toFixed(2)},${d.y.toFixed(2)}`).join('|'); };
  views === 'lump,pool,spread' ? ok('q1 stage 1: the three trays are pictures of a lump, a pool and a gas') : fail(`q1 stage 1: tray views are ${views}`);
  trays.every(t => draw(t, 1) && draw(t, 1) !== draw(t, 2.5)) ? ok('q1 stage 1: the particles in every tray move') : fail('q1 stage 1: a tray picture does not move');
}

/* The trays of q6 stage 1 are pictures too, and the analyzer rings the molecule it read. */
{
  const viewsOf = (id, no) => Object.values(MODEL.createTable(quests.find(q => q.id === id).stages[no].table, 't').zones.trays).map(t => t.view).sort().join(',');
  viewsOf('q6-solution', 0) === 'apart,together' ? ok('q6 stage 1: the trays are particles apart and particles together') : fail('q6 stage 1: tray views missing');
  const hit = stagesWith('window')[0];
  const seq = inked(hit.q, hit.st, hit.i, hit.f, 'ring');
  const rings = x => P3D.readPainter({ paint: paintOf }, x.f, x.state.table, boxOf(x.f), 1.0, 'rg').rings.length;
  Math.max(...seq.map(rings)) > Math.min(...seq.map(rings)) ? ok('window: reading a molecule rings the molecule examined') : fail('window: no ring after a reading');
}

/* The 3D crowd of the same models. */
{
  const THREE = await import('three');
  const c = { THREE, scale: 0.01, mats: {}, toPlate: p => ({ x: p.x * 0.01, z: p.y * 0.01 }), own: m => m, ground: 0 };
  const sig = g => { let h = 0; g.traverse(o => { if (o.isInstancedMesh) for (let i = 0; i < o.count * 16; i++) h += o.instanceMatrix.array[i] * (i % 7 + 1); }); return h.toFixed(6); };
  for (const kind of MODELS) {
    let done = false;
    for (const { st, f: f0, q, i } of stagesWith(kind)) {
      const state = solved(q, st, i);
      const f = state.table.fixtures[f0.id];
      const box = boxOf(f);
      const g = MATTER.MATTER_KIT.dress3d(f, state.table, { ...c, box });
      if (!g?.userData?.counts?.dots) continue;
      const a = sig(g);
      for (let k = 0; k < 90; k++) g.userData.tick(1 / 30, false);
      const b = sig(g);
      const g2 = MATTER.MATTER_KIT.dress3d(f, state.table, { ...c, box }); const s0 = sig(g2); for (let k = 0; k < 30; k++) g2.userData.tick(1 / 30, true);
      const n = g.userData.counts;
      a !== b ? ok(`${kind} 3D: ${n.dots} spheres move over 90 frames (${q.id}:${i + 1})`) : fail(`${kind} 3D: the crowd does not move`);
      s0 === sig(g2) ? ok(`${kind} 3D: held still under reduced motion`) : fail(`${kind} 3D: moves under reduced motion`);
      n.dots <= 220 ? ok(`${kind} 3D: ${n.dots} spheres, ${n.rings} rings (cap 220)`) : fail(`${kind} 3D: over the sphere cap`);
      done = true; break;
    }
    if (!done) fail(`${kind}: no stage gives its 3D dress a sphere`);
  }
}

/* A miss replays the cause. */
{
  const hit = stagesWith('probe')[0];
  const seq = inked(hit.q, hit.st, hit.i, hit.f, 'rseq');
  const { state, f } = seq[seq.length - 1];
  for (let k = 0; k < 40; k++) picture(f, state.table, 10 + k * 0.1, 'rp:');
  const settled = picture(f, state.table, 20, 'rp:');
  MATTER.MATTER_KIT.onMiss(state.table, 'a miss');
  const early = picture(f, state.table, 20.1, 'rp:');
  early !== settled ? ok('replay: after a miss the pulled molecules start from their places again') : fail('replay: the probe did not restart');
}

/* ---------------------------------------------------------------- the Tour: short, and moving */
{
  const TOUR = await imp('src/learn/table/tour.js');
  const T2D = await imp('src/learn/engine/table2d.js');
  const KITS = await imp('src/learn/table/kits/index.js');
  const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
  const seen = new Map();
  for (const q of quests) q.stages.forEach((st, i) => {
    if (!st.table) return;
    for (const step of TOUR.tourSteps(MODEL.createTable(st.table, st.title))) if (!seen.has(step.flag)) seen.set(step.flag, { step, where: `${q.id}:${i + 1}` });
  });
  const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 1 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : (k in t ? t[k] : () => undefined)), set: (t, k, v) => { t[k] = v; return true; } });
  let long = 0; let still = 0; let bad = 0; let played = 0;
  for (const [flag, { step, where }] of seen) {
    if (flag === 'tour_strip' || flag.startsWith('tour_bench_')) continue;
    if (words(step.desc) > 16) { long++; fail(`Tour step "${step.name}" (${where}) is ${words(step.desc)} words: "${step.desc}"`); }
    if (!step.demo) { still++; fail(`Tour step "${step.name}" (${where}) has no moving demonstration`); continue; }
    try {
      const d = await step.demo.build();
      let t = d.table;
      for (const s of d.steps) t = MODEL.apply(t, s.action);
      T2D.drawTable(ctx, 480, 210, t, { shown: {}, clock: 1.5, scope: 'tour:' });
      const live = KITS.getKit(t.kit)?.live?.(t);
      if (!d.steps.length && !live) { bad++; fail(`Tour demo "${step.name}" (${where}) neither acts nor moves`); }
      played++;
    } catch (e) { bad++; fail(`Tour demo "${step.name}" (${where}) throws: ${e.message}`); }
  }
  if (!long && !still && !bad) ok(`Tour: ${played} steps, each at most 16 words and each with a demonstration that plays`);
}

/* ---------------------------------------------------------------- 9, 8, 10 */
const PIECE_MOVES = new Set(['pbox']);
const dynamicStage = st => (st.table?.fixtures || []).some(f => MATTER.isMoving(f)) || (st.table?.pieces || []).some(p => PIECE_MOVES.has(p.kind));
let total = 0; let dynamic = 0; const staticList = [];
for (const q of quests) {
  let qs = 0;
  q.stages.forEach((st, i) => { total++; if (dynamicStage(st)) dynamic++; else { staticList.push(`${q.id}:${i + 1}`); qs++; } });
  if (qs === q.stages.length) fail(`${q.id}: the bench is wholly static`);
}
{
  const allowed = Math.floor(total / 6);
  const excused = staticList.filter(k => exceptions[k]);
  measured.static = staticList.length - excused.length;
  console.log(`\n  static ratio: ${dynamic} of ${total} stages carry a mechanism view; ${staticList.length} static (${excused.length} with a written exception; target at most ${allowed})`);
  if (staticList.length) console.log(`  static: ${staticList.join(', ')}`);
  if (staticList.length > allowed + excused.length) fail(`more static stages than one in six (${staticList.length} > ${allowed}) without a written exception`);
  else ok('static ratio within target');
}
{
  const preds = []; let withIn = 0;
  for (const q of quests) q.stages.forEach((st, i) => { if (st.predict) { preds.push(`${q.id}:${i + 1}`); if ((st.table?.fixtures || []).some(f => f.kind === 'lead' || f.kind === 'mlead')) withIn++; } });
  measured.noLeadIn = preds.length - withIn;
  preds.length === withIn ? ok(`every predict stage has a lead-in clip (${withIn} of ${preds.length})`) : fail(`predict lead-ins: ${withIn} of ${preds.length}`);
}
{
  const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
  const sentences = s => (String(s).match(/[.!?](\s|$)/g) || []).length || 1;
  let over = 0; const list = [];
  for (const q of quests) q.stages.forEach((st, i) => {
    if (st.prompt && words(st.prompt) > 25) { over++; list.push(`${q.id}:${i + 1} prompt`); }
    try { const r = st.reward; if (r && (words(r.body) > 40 || sentences(r.body) > 2) && !exceptions[`${q.id}:${i + 1}:reward`]) { over++; list.push(`${q.id}:${i + 1} reward`); } } catch { /* getter */ }
    for (const h of st.hints || []) if (sentences(h) > 1) { over++; list.push(`${q.id}:${i + 1} hint`); }
  });
  measured.load = over;
  if (over > (ratchet.load ?? over)) fail(`reading load grew (${over} > ${ratchet.load})`);
  else (strict && over ? fail : warn)(`reading load: ${over} prompt/reward/hint item(s) over the limit${list.length ? ` (${list.join(', ')})` : ''}`);
}

if (update) { writeFileSync(ratchetFile, JSON.stringify(measured, null, 2) + '\n'); console.log('\n  ratchet written'); }
console.log(failures ? `\nTEACHING (MIRROWEN) FAILED (${failures})` : '\nTEACHING (MIRROWEN) OK');
process.exit(failures ? 1 : 0);
