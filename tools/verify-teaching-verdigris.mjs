#!/usr/bin/env node
/**
 * verify:teaching:verdigris — the teaching standard of `docs/general-problems.md`, held for Verdigris (unit09). Same checks as the Brinewire
 * section of `verify-teaching.mjs` (numbers are the fix prompt's section 7):
 *   1+4 banned vague words and fiction names in play text and the bank   3 no glossary term used before its stage
 *   5   every declared need names a primer that runs                     6 the particle windows move, hold the planner's count, respond to the flask
 *   7   frame cost: cells per window under a cap                         9 static ratio (ratchet)   8 predict lead-ins (ratchet)   10 reading load (ratchet)
 * Ratchets live in `tools/teaching-ratchet.json` under "verdigris". `--strict` fails them; `--update` writes them.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const memory = new Map(); const noop = () => {};
globalThis.localStorage = { getItem: k => (memory.has(k) ? memory.get(k) : null), setItem: (k, v) => memory.set(k, String(v)), removeItem: k => memory.delete(k), clear: () => memory.clear() };
globalThis.window = globalThis.window || { addEventListener: noop, removeEventListener: noop, matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }), location: { hash: '' }, devicePixelRatio: 1 };
globalThis.document = globalThis.document || { addEventListener: noop, removeEventListener: noop, getElementById: () => null, querySelector: () => null, querySelectorAll: () => [], createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop }, appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [], getContext: () => null, setAttribute: noop }) };

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict'); const update = process.argv.includes('--update');
let failures = 0;
const ok = m => console.log(`  ok   ${m}`); const fail = m => { failures++; console.log(`  FAIL ${m}`); }; const warn = m => console.log(`  warn ${m}`);
const imp = p => import(pathToFileURL(join(root, p)));

const G = await imp('src/learn/glossary/verdigris.js');
await imp('src/learn/table/kits/ph.js');
const REG = await imp('src/learn/table/kits/ph-registry.js');
const M = await imp('src/learn/engine/phmotion.js');
const READ = await imp('src/learn/table/kits/ph-read.js');
const ratchetFile = join(root, 'tools/teaching-ratchet.json');
const all = existsSync(ratchetFile) ? JSON.parse(readFileSync(ratchetFile, 'utf8')) : {};
const ratchet = all.verdigris || {}; const measured = {};

const strings = (v, out = [], key = '') => {
  if (typeof v === 'string') { if (/^(label|title|text|caption|note|body|prompt|msg|legend|name|short)$/.test(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach(x => strings(x, out, key));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, out, k);
  return out;
};
const quests = [];
for (const id of G.QUESTS) { const mod = await imp(`src/learn/quests/unit09/${id}.js`); quests.push({ id, stages: mod.STAGES }); }
const stageText = st => {
  const t = [st.title, st.prompt, ...(st.hints || [])];
  try { const r = st.reward; if (r) t.push(r.title, r.body, r.log); } catch { /* getter needing a table */ }
  t.push(...strings(st.table));
  return t.filter(Boolean);
};

console.log('Verdigris teaching standard\n');

{ // 1 + 4
  let n = 0;
  for (const q of quests) {
    if (q.id === 'boss-leach') continue;
    q.stages.forEach((st, i) => { for (const t of stageText(st)) for (const b of G.BANNED) if (b.re.test(t) && !(b.skip && b.skip.test(t))) { n++; fail(`${q.id} stage ${i + 1}: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}" (${b.why}); say ${b.use}`); } });
  }
  if (!n) ok('no banned vague word or fiction name in any play text');
}
{ // 3
  let n = 0; const order = G.QUESTS;
  for (const term of G.TERMS) {
    const qi = order.indexOf(term.quest);
    for (const q of quests) {
      if (q.id === 'boss-leach') continue;
      const qj = order.indexOf(q.id);
      q.stages.forEach((st, i) => {
        const used = [st.title, st.prompt, ...(st.hints || [])].filter(Boolean).some(t => term.re.test(t));
        if (used && (qj < qi || (qj === qi && i + 1 < term.stage))) { n++; fail(`${q.id} stage ${i + 1} uses "${term.term}" before ${term.quest} stage ${term.stage}, where the glossary defines it`); }
      });
    }
  }
  if (!n) ok('no glossary term is used before the stage that glosses it');
}
{ // 5
  const { PRIMERS } = await imp('src/learn/engine/primers.js'); let n = 0;
  for (const [key, ids] of Object.entries(G.NEEDS)) {
    const [qid, no] = key.split(':'); const q = quests.find(x => x.id === qid);
    if (!q || !q.stages[Number(no) - 1]) { n++; fail(`NEEDS ${key}: no such stage`); continue; }
    for (const id of ids) {
      const p = PRIMERS[id]; if (!p) { n++; fail(`NEEDS ${key}: no primer "${id}"`); continue; }
      const els = new Map();
      const el = id2 => { if (!els.has(id2)) els.set(id2, { value: (p.html.match(new RegExp(`id="${id2}"[^>]*value="([^"]*)"`)) || [])[1] ?? '0', textContent: '', innerHTML: '', addEventListener() {} }); return els.get(id2); };
      try { p.wire({ querySelector: sel => el(sel.slice(1)) }); } catch (e) { n++; fail(`primer ${id} throws: ${e.message}`); continue; }
      if (/NaN|undefined|Infinity/.test([...els.values()].map(e => e.innerHTML).join(' '))) { n++; fail(`primer ${id} prints a bad number`); }
    }
  }
  if (!n) ok(`prerequisite map: ${Object.keys(G.NEEDS).length} stages declare needs and every primer runs`);
}
{ // bank
  const bank = JSON.parse(readFileSync(join(root, 'src/learn/bank/unit09.json'), 'utf8')); const texts = [];
  const walk = v => { if (typeof v === 'string') texts.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(bank); let n = 0;
  for (const t of texts) for (const b of G.BANNED) if (b.re.test(t) && !(b.skip && b.skip.test(t))) { n++; fail(`bank: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}"; say ${b.use}`); }
  if (!n) ok('bank: no banned word');
}
{ // 6 + 7: the particle window
  const seed = 11; const cap = 200;
  let moved = false; let held = true; let swaps = false; let strongStill = true; let weakStill = true; let max = 0;
  for (const [units, ionized] of [[200, 3], [200, 60], [200, 200], [200, 0]]) {
    let prev = M.windowSignature(units, ionized, seed, 0);
    const seen = new Set();
    for (let f = 1; f <= 300; f++) {
      const t = f / 30; const cells = M.windowAt(units, ionized, seed, t);
      max = Math.max(max, cells.length);
      if (M.ionCount(cells) !== ionized) held = false;
      const sig = M.windowSignature(units, ionized, seed, t); if (sig !== prev) moved = true; prev = sig;
      seen.add(cells.map(c => (c.ion ? 1 : 0)).join(''));
    }
    if ((ionized === 3 || ionized === 60) && seen.size > 1) swaps = true;
    if (ionized === 200 && seen.size > 1) strongStill = false;
    if (ionized === 0 && seen.size > 1) weakStill = false;
  }
  moved ? ok('particle window: wobbles and keeps moving over 300 frames') : fail('particle window is frozen');
  held ? ok('particle window: the number of ionized units is the planner\'s at every frame') : fail('particle window: the ionized count drifts from the planner\'s');
  swaps ? ok('particle window: in a weak solution the ionized units change while their count stays') : fail('particle window: no hand-over and take-back in a weak solution');
  strongStill && weakStill ? ok('particle window: a fully ionized or untouched solution does not swap') : fail('particle window swaps units that cannot');
  const a = READ.windowOf({ solute: { id: 'acetic', c: 0.1 } }); const b = READ.windowOf({ solute: { id: 'acetic', c: 0.001 } });
  a.ionized !== b.ionized ? ok(`particle window: dilution changes the picture (${a.ionized} → ${b.ionized} of 200)`) : fail('particle window ignores the concentration');
  max <= cap ? ok(`frame cost: at most ${max} particles per window`) : fail(`frame cost: ${max} cells`);
}


{ // 3D: the spheres the dress stands up are the ones the painter draws
  const { recordBalls, FRAME_SCALE } = await imp('src/learn/table/kits/ph-3d.js');
  const kit = await imp('src/learn/table/kits/ph.js');
  const K = kit.PH_KIT;
  const box = { x0: 10, y0: 10, x1: 70, y1: 90 };
  const at = (f, state, t) => recordBalls((c, ff, st, b) => REG.fixtureHandler(ff.kind).paint(c, ff, st, b), f, state, box, t);
  const mk = (solute, extra = {}) => kit.flaskFixture('f', { x: 40, y: 50 }, { solute, meter: false, ...extra }).fixture;
  const st = f => ({ fixtures: { [f.id]: f }, pieces: {}, recorder: { rows: [] } });
  let n3 = 0;
  const weak = mk({ id: 'acetic', c: 0.1 }); const strong = mk({ id: 'hcl', c: 0.1 });
  const a = at(weak, st(weak), 0); const b2 = at(weak, st(weak), 1.7); const c2 = at(strong, st(strong), 0);
  if (a.length < 200) { n3++; fail(`3D window records ${a.length} spheres for 200 units`); }
  if (JSON.stringify(a) === JSON.stringify(b2)) { n3++; fail('3D window: the spheres do not move between two clock times'); }
  if (c2.length <= a.length) { n3++; fail('3D window: a strong acid (all handed over) should have more spheres than a weak one'); }
  for (const r of a) if (!(r[2] / FRAME_SCALE < 3)) { n3++; fail('3D window: a sphere is larger than 3 table units'); break; }
  if (!n3) ok(`3D: the window records ${a.length} spheres, they move with the clock, and a strong acid shows ${c2.length}`);
}


{ // a miss replays its cause; the Tour plays the tool
  const kit = await imp('src/learn/table/kits/ph.js');
  const RP = await imp('src/learn/table/kits/ph-replay.js');
  const { createTable } = await imp('src/learn/table/model.js');
  const Q2 = await imp('src/learn/quests/unit09/q2-scale.js');
  const table = Q2.stateFor(0, [{ run: 'f1' }, { run: 'f1' }, { run: 'f1' }]).table;
  let n = 0;
  kit.PH_KIT.onMiss(table);
  const f = table.fixtures.f1;
  if (!f.props.replay || f.props.replay.n !== 3) { n++; fail('a miss does not mark a diluted flask for replay'); }
  else {
    const seen = new Set();
    for (const t of [0, 1.2, 2.3, 3.4]) { const v = RP.replayView(f, t, 'check'); seen.add(v.f.dials.steps.value + (v.replaying ? 'r' : '')); }
    if (seen.size < 4) { n++; fail(`replay: expected the dilutions 0, 1, 2 and then the table as it stands; got ${[...seen]}`); }
  }
  const clip = new Set();
  for (const t of [0, 1.5, 3, 4.5]) clip.add(kit.PH_KIT.demoOf(f, t).dials.steps.value);
  if (clip.size < 3) { n++; fail('the Tour clip of the dilute flask does not step through the dilutions'); }
  const { PH_KIT } = kit;
  if (typeof PH_KIT.onMiss !== 'function') { n++; fail('the ph kit has no onMiss'); }
  void createTable;
  if (!n) ok('a miss replays the dilutions step by step, and the Tour clip of a flask steps through them');
}


{ // the Tour is short
  const { createTable } = await imp('src/learn/table/model.js');
  const { tourSteps } = await imp('src/learn/table/tour.js');
  let n = 0; let steps = 0; let longest = 0;
  for (const q of quests) q.stages.forEach((st, i) => {
    let t; try { t = createTable(st.table); } catch { return; }
    for (const step of tourSteps(t)) {
      steps++;
      const w = step.desc.trim().split(/\s+/).length; longest = Math.max(longest, w);
      if (w > 16) { n++; fail(`${q.id} stage ${i + 1}: Tour step "${step.name}" is ${w} words`); }
    }
  });
  if (!n) ok(`Tour: ${steps} steps, none over 16 words (longest ${longest})`);
}


{ // real particle answers: the proton bench is graded on where the proton goes
  const Q1 = await imp('src/learn/quests/unit09/q1-handover.js');
  const { transferRead } = await imp('src/learn/table/kits/ph-transfer.js');
  const { recordBalls } = await imp('src/learn/table/kits/ph-3d.js');
  const carry = (a, b) => ({ place: { piece: `bench.h.${a}`, to: `slot:bench.take.${b}` } });
  let n = 0;
  const t0 = Q1.stateFor(0, []).table; const t1 = Q1.stateFor(0, [carry('hcl', 'h2o')]).table; const t2 = Q1.stateFor(0, [carry('h2o', 'hcl')]).table;
  if (transferRead(t0, 'bench').moved || !transferRead(t1, 'bench').right || transferRead(t2, 'bench').right) { n++; fail('the proton bench does not read where the proton was carried'); }
  const box = { x0: 100, y0: 10, x1: 160, y1: 70 };
  const h = REG.fixtureHandler('phtransfer');
  const rec = (t, c) => recordBalls((cx, f, st, b) => h.paint(cx, f, st, b), t.fixtures.bench, t, box, c);
  if (JSON.stringify(rec(t0, 0)) === JSON.stringify(rec(t0, 1.3))) { n++; fail('the proton bench is frozen'); }
  const before = rec(t0, 0).length; const after = rec(t1, 0).length;
  if (before !== after) { n++; fail(`the bench's spheres change in number when a proton moves (${before} to ${after}); only their colour should`); }
  if (JSON.stringify(rec(t0, 0).map(r => r[3])) === JSON.stringify(rec(t1, 0).map(r => r[3]))) { n++; fail('moving the proton does not change what the bench draws'); }
  const stagesWithBench = quests.flatMap(q => q.stages.map((st, i) => (st.table?.fixtures || []).some(f => f.kind === 'phtransfer') ? `${q.id}:${i + 1}` : null)).filter(Boolean);
  if (!n) ok(`particle answers: ${stagesWithBench.length} stages (${stagesWithBench.join(', ')}) are graded on where a proton is carried`);
}

const liveKinds = new Set(['phflask', 'phpour', 'phtransfer']);
const isLive = st => (st.table?.fixtures || []).some(f => liveKinds.has(f.kind) || REG.fixtureHandler(f.kind)?.live);
{ // 9
  let total = 0; let dyn = 0;
  for (const q of quests) q.stages.forEach(st => { total++; if (isLive(st)) dyn++; });
  measured.static = total - dyn; const allowed = Math.floor(total / 6);
  console.log(`\n  static ratio: ${dyn} of ${total} stages carry a mechanism view; ${total - dyn} static (target at most ${allowed})`);
  const prior = ratchet.static ?? total;
  if (total - dyn > prior) fail(`more static stages than the ratchet allows (${total - dyn} > ${prior})`);
  else if (total - dyn > allowed) (strict ? fail : warn)(`static ratio above the target by ${total - dyn - allowed} stages`);
  else ok('static ratio within target');
}
{ // 8
  const preds = []; let withIn = 0;
  for (const q of quests) q.stages.forEach((st, i) => { if (st.predict) { preds.push(`${q.id}:${i + 1}`); if (st.leadIn) withIn++; } });
  measured.noLeadIn = preds.length - withIn; const prior = ratchet.noLeadIn ?? preds.length;
  if (preds.length - withIn > prior) fail('a predict stage lost its lead-in'); else (strict && preds.length - withIn ? fail : warn)(`predict lead-ins: ${withIn} of ${preds.length}`);
}
{ // 10
  const words = s => String(s).trim().split(/\s+/).filter(Boolean).length;
  const sentences = s => (String(s).match(/[.!?](\s|$)/g) || []).length || 1; let over = 0;
  for (const q of quests) q.stages.forEach(st => {
    if (st.prompt && words(st.prompt) > 25) over++;
    try { const r = st.reward; if (r && (words(r.body) > 40 || sentences(r.body) > 2)) over++; } catch { /* getter */ }
    for (const h of st.hints || []) if (sentences(h) > 1) over++;
  });
  measured.load = over; const prior = ratchet.load ?? over;
  if (over > prior) fail(`reading load grew (${over} > ${prior})`); else (strict && over ? fail : warn)(`reading load: ${over} prompt/reward/hint item(s) over the limit`);
}
if (update) { all.verdigris = measured; writeFileSync(ratchetFile, JSON.stringify(all, null, 2) + '\n'); console.log('\n  ratchet written'); }
console.log(failures ? `\nVERDIGRIS TEACHING FAILED (${failures})` : '\nVERDIGRIS TEACHING OK');
process.exit(failures ? 1 : 0);
