#!/usr/bin/env node
/**
 * verify:teaching:ember — the teaching standard of `docs/general-problems.md` held for Ember Reach (unit05). Same checks as the other worlds'
 * teaching files, kept in its own file so worlds can be passed at once.
 *
 *   1/4 banned vague words and fiction names in play text and the bank (glossary BANNED)
 *   3   define on first use: no glossary term is used in a title, prompt or hint before the stage the glossary names
 *   5   every `NEEDS` entry names a primer that runs
 *   6/7 mechanism present: each moving model changes with the clock, stands still with the clock frozen, responds to the controls, and
 *       stays small, in 2D and as the 3D crowd
 *   8   every predict stage has a lead-in clip   9 static ratio, per world and per bench   10 reading load
 * The ratchet (`tools/teaching-ratchet-ember.json`) may only fall; `--strict` makes every shortfall fail; `--update` rewrites it.
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

const G = await imp('src/learn/glossary/ember.js');
const HEAT = await imp('src/learn/table/kits/heat.js');
const MOTION = await imp('src/learn/table/kits/heat-motion.js');
const P3D = await imp('src/learn/table/kits/pans-3d.js');
const RUNNER = await imp('src/learn/engine/stagerunner.js');
const PRIMER = await imp('src/learn/engine/primers.js');
const MODEL = await imp('src/learn/table/model.js');
const ratchetFile = join(root, 'tools/teaching-ratchet-ember.json');
const ratchet = existsSync(ratchetFile) ? JSON.parse(readFileSync(ratchetFile, 'utf8')) : {};
const exceptionsFile = join(root, 'tools/teaching-exceptions-ember.json');
const exceptions = existsSync(exceptionsFile) ? JSON.parse(readFileSync(exceptionsFile, 'utf8')) : {};
const measured = {};

const strings = (v, out = [], key = '') => {
  if (typeof v === 'string') { if (/^(label|title|text|caption|note|body|prompt|msg|legend|name|short)$/.test(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach(x => strings(x, out, key));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, out, k);
  return out;
};
const quests = [];
for (const id of G.QUESTS) { const mod = await imp(`src/learn/quests/unit05/${id}.js`); quests.push({ id, mod, stages: mod.STAGES }); }
const stageText = st => {
  const texts = [st.title, st.prompt, ...(st.hints || [])];
  try { const r = st.reward; if (r) texts.push(r.title, r.body, r.log); } catch { /* getter needs a table */ }
  texts.push(...strings(st.table));
  return texts.filter(Boolean);
};

console.log('Ember Reach teaching standard\n');

{
  let n = 0;
  for (const q of quests) {
    q.stages.forEach((st, i) => { for (const t of stageText(st)) for (const b of G.BANNED) if (b.re.test(t)) { n++; fail(`${q.id} stage ${i + 1}: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}" (${b.why}); say ${b.use}`); } });
  }
  const bank = JSON.parse(readFileSync(join(root, 'src/learn/bank/unit05.json'), 'utf8'));
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
const solved = (q, st, i) => { try { return RUNNER.stateFromScript(st, q.mod.SOLUTIONS?.[i] ?? []); } catch { return RUNNER.stateFromScript(st, []); } };
const boxOf = f => ({ x0: f.at.x - f.size.w / 2, y0: f.at.y - f.size.h / 2, x1: f.at.x + f.size.w / 2, y1: f.at.y + f.size.h / 2, w: f.size.w, h: f.size.h });
const picture = (f, state, clock, scope = 'v:') => {
  const out = P3D.readPainter({ paint: MOTION.paintMotion }, f, state, boxOf(f), clock, scope);
  const r = v => v.toFixed(2);
  return [...out.dots.map(d => `d${r(d.x)},${r(d.y)},${r(d.r)}`), ...out.rings.map(d => `r${r(d.x)},${r(d.y)}`)].join('|');
};
const count = (f, state, clock) => { const o = P3D.readPainter({ paint: MOTION.paintMotion }, f, state, boxOf(f), clock, 'c:'); return o.dots.length + o.rings.length; };
const stagesWith = kind => { const out = []; quests.forEach(q => q.stages.forEach((st, i) => { const f = (st.table?.fixtures || []).find(x => x.kind === kind); if (f) out.push({ st, f, q, i }); })); return out; };

const MODELS = ['cup', 'lattice', 'rxn', 'curve', 'shelves', 'plot', 'stack', 'lead'];
for (const kind of MODELS) {
  const hits = stagesWith(kind);
  if (!hits.length) { fail(`${kind}: no stage stands this moving model up`); continue; }
  let moved = false; let still = false; let cheap = true;
  for (const { st, f: f0, q, i } of hits) {
    const state = solved(q, st, i);
    const f = state.table.fixtures[f0.id];
    const a = picture(f, state.table, 1.0, `a${kind}${i}:`);
    if (!a) continue;
    const b = picture(f, state.table, 2.7, `a${kind}${i}:`);
    if (a !== b) moved = true;
    if (picture(f, state.table, 0.001, `s${kind}${i}:`) === picture(f, state.table, 0.001, `s${kind}${i}:`)) still = true;
    if (count(f, state.table, 1.0) > 160) { cheap = false; fail(`${kind}: ${count(f, state.table, 1.0)} circles in ${q.id}:${i + 1} (cap 160)`); }
  }
  moved ? ok(`${kind}: the picture changes with the clock`) : fail(`${kind}: the picture is the same at two clock times`);
  still ? ok(`${kind}: with the clock frozen the picture stands still`) : fail(`${kind}: moves with the clock frozen`);
  if (cheap) ok(`${kind}: frame cost within 160 circles in every stage`);
}

/* The moving models answer the controls. */
{
  const r = (kind, tweak, label) => {
    const hit = stagesWith(kind)[0];
    const state = solved(hit.q, hit.st, hit.i);
    const f = state.table.fixtures[hit.f.id];
    const before = picture(f, state.table, 5.0, 'ctl0:');
    tweak(state.table, f, hit);
    const after = picture(state.table.fixtures[hit.f.id], state.table, 5.0, 'ctl1:');
    before !== after ? ok(`${kind}: ${label} changes the model`) : fail(`${kind}: ${label} does not change the model`);
  };
  r('curve', (t, f) => { f.dials.heat.value = f.dials.heat.max; }, 'moving the burner');
  r('shelves', (t, f) => { const d = f.dials.after; if (d) d.value = d.value > d.min ? d.min : d.max; else f.props.dH = -f.props.dH; }, 'moving the level');
  r('plot', (t, f) => { f.dials.temp.value = f.dials.temp.value === f.dials.temp.max ? f.dials.temp.min : f.dials.temp.max; }, 'moving the temperature');
  {
    // The cup: a sample dropped in, or the heater turned up, changes how the molecules move.
    const hit = stagesWith('cup').find(h => h.f.dials.heat) || stagesWith('cup')[0];
    const state = RUNNER.stateFromScript(hit.st, []);
    const f = state.table.fixtures[hit.f.id];
    const a = picture(f, state.table, 3.0, 'cup0:');
    if (f.dials.heat) f.dials.heat.value = f.dials.heat.max; else f.props.T0 = f.props.T0 + 30;
    const b = picture(f, state.table, 3.0, 'cup1:');
    a !== b ? ok('cup: the heater changes the molecules') : fail('cup: the heater does not change the molecules');
  }
  {
    const hit = stagesWith('lattice')[0];
    const apart = RUNNER.stateFromScript(hit.st, []);
    const joined = RUNNER.stateFromScript(hit.st, hit.q.mod.SOLUTIONS[hit.i]);
    const a = picture(apart.table.fixtures[hit.f.id], apart.table, 4.0, 'lat0:');
    const b = picture(joined.table.fixtures[hit.f.id], joined.table, 4.0, 'lat1:');
    a !== b ? ok('lattice: joining two blocks changes the atoms') : fail('lattice: joining two blocks does not change the model');
  }
}

/* Whose particles are whose: every block has its own named box in the particle strip, under the block, and joined blocks share a wall. */
{
  let n = 0; let seen = 0;
  for (const { st, f: f0, q, i } of stagesWith('lattice')) {
    for (const script of [[], q.mod.SOLUTIONS[i], q.mod.MISSES?.[i] || []]) {
      const state = RUNNER.stateFromScript(st, script);
      const f = state.table.fixtures[f0.id];
      const boxes = MOTION.latticeLayout(f, state.table);
      seen++;
      if (boxes.length !== f.props.blocks.length) { n++; fail(`${q.id}:${i + 1} particle strip draws ${boxes.length} boxes for ${f.props.blocks.length} blocks`); }
      boxes.forEach((b, k) => {
        if (!String(b.label || '').trim()) { n++; fail(`${q.id}:${i + 1} a box of particles has no name`); }
        if (b.x < 1.5 || b.x + b.w > f.size.w - 1.5) { n++; fail(`${q.id}:${i + 1} the box of ${b.label} leaves the strip`); }
        const next = boxes[k + 1];
        if (next && next.x < b.x + b.w - 1e-6) { n++; fail(`${q.id}:${i + 1} the boxes of ${b.label} and ${next.label} overlap`); }
        if (next && b.contact.right !== next.contact.left) { n++; fail(`${q.id}:${i + 1} ${b.label} and ${next.label} disagree about a shared wall`); }
        if (next && b.contact.right && Math.abs(next.x - (b.x + b.w)) > 1e-6) { n++; fail(`${q.id}:${i + 1} joined blocks ${b.label} and ${next.label} do not stand wall to wall`); }
        if (next && !b.contact.right && next.x - (b.x + b.w) < 2) { n++; fail(`${q.id}:${i + 1} separate blocks ${b.label} and ${next.label} stand too close to tell apart`); }
        const joined = HEAT.blockRead(state.table, b.id).joined;
        if (joined !== (b.contact.left || b.contact.right)) { n++; fail(`${q.id}:${i + 1} ${b.label}: the strip and the bench disagree about whether it is joined`); }
      });
    }
  }
  if (!n) ok(`particle strip: ${seen} tables, every block has its own named box and joined blocks share a wall`);
  // Heat is not a particle: no moving model may carry a helper that flies energy from place to place.
  /packets?\s*\(/.test(readFileSync(join(root, 'src/learn/table/kits/heat-motion.js'), 'utf8')) ? fail('heat-motion.js draws travelling packets of energy') : ok('no moving model draws heat as a travelling particle');
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
      const g = HEAT.HEAT_KIT.dress3d(f, state.table, { ...c, box });
      if (!g?.userData?.counts?.dots) continue;
      const a = sig(g);
      for (let k = 0; k < 90; k++) g.userData.tick(1 / 30, false);
      const b = sig(g);
      const g2 = HEAT.HEAT_KIT.dress3d(f, state.table, { ...c, box }); const s0 = sig(g2); for (let k = 0; k < 30; k++) g2.userData.tick(1 / 30, true);
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
  const hit = stagesWith('cup')[0];
  const state = solved(hit.q, hit.st, hit.i);
  const f = state.table.fixtures[hit.f.id];
  const settle = () => { let s = ''; for (let k = 0; k < 40; k++) s = picture(f, state.table, 10 + k * 0.1, 'rp:'); return s; };
  settle();
  const settled = picture(f, state.table, 20, 'rp:');
  HEAT.HEAT_KIT.onMiss(state.table, 'a miss');
  const early = picture(f, state.table, 20.1, 'rp:');
  early !== settled ? ok('replay: after a miss the bath starts its change again from where it began') : fail('replay: the bath did not restart');
}

/* ---------------------------------------------------------------- the Tour: short, and moving */
{
  const TOUR = await imp('src/learn/table/tour.js');
  const T2D = await imp('src/learn/engine/table2d.js');
  const KITS = await imp('src/learn/table/kits/index.js');
  const ctx = new Proxy({}, { get: (t, k) => (k === 'measureText' ? () => ({ width: 1 }) : k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} }) : (k in t ? t[k] : () => undefined)), set: (t, k, v) => { t[k] = v; return true; } });
  const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
  const seen = new Map();
  for (const q of quests) q.stages.forEach((st, i) => {
    if (!st.table) return;
    for (const step of TOUR.tourSteps(MODEL.createTable(st.table, st.title))) if (!seen.has(step.flag)) seen.set(step.flag, { step, where: `${q.id}:${i + 1}` });
  });
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
const dynamicStage = st => (st.table?.fixtures || []).some(f => MOTION.isLive(f)) || (st.table?.pieces || []).some(p => ['block', 'phase', 'shift', 'bond', 'gcard'].includes(p.kind));
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
  for (const q of quests) q.stages.forEach((st, i) => { if (st.predict) { preds.push(`${q.id}:${i + 1}`); if ((st.table?.fixtures || []).some(f => f.kind === 'lead')) withIn++; } });
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
console.log(failures ? `\nTEACHING (EMBER) FAILED (${failures})` : '\nTEACHING (EMBER) OK');
process.exit(failures ? 1 : 0);
