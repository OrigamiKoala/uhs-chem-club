#!/usr/bin/env node
/**
 * verify:teaching — the teaching standard of `docs/general-problems.md`, held per world (today: Brinewire, unit10).
 *
 *   1  banned vague words and fiction names in play text (glossary BANNED)
 *   3  define on first use: no glossary term is used before the stage that glosses it; every term is in the glossary
 *   4  one word per concept (same list as 1: the banned entries are the synonyms)
 *   6  mechanism present: the electron-transfer model changes when the ledger changes and stays in motion (steps 300 frames, two settings)
 *   7  frame cost: particles per frame stay under a cap
 *   9  static ratio: stages whose table holds a live fixture (a mechanism view); at most 1 in 6 may be static
 *  10  reading load: prompt <= 25 words, reward <= 2 sentences and 40 words, hints one sentence
 *
 * Checks 8 (predict lead-in) and 5 (prerequisite map by `needs`) are reported as counts. Checks 9, 10 and 8 are held by a RATCHET
 * (`tools/teaching-ratchet.json`): the world may not get worse, and the shortfall is printed every run. Pass --strict to make the ratchet
 * itself fail (the target is zero).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const memory = new Map();
globalThis.localStorage = {
  getItem: k => (memory.has(k) ? memory.get(k) : null),
  setItem: (k, v) => memory.set(k, String(v)),
  removeItem: k => memory.delete(k),
  clear: () => memory.clear()
};
const noop = () => {};
globalThis.window = globalThis.window || {
  addEventListener: noop, removeEventListener: noop,
  matchMedia: () => ({ matches: false, addEventListener: noop, removeEventListener: noop }),
  location: { hash: '' },
  devicePixelRatio: 1
};
globalThis.document = globalThis.document || {
  addEventListener: noop, removeEventListener: noop,
  getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
  createElement: () => ({ style: {}, classList: { add: noop, remove: noop, toggle: noop },
    appendChild: noop, addEventListener: noop, querySelector: () => null, querySelectorAll: () => [],
    getContext: () => null, setAttribute: noop })
};

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const strict = process.argv.includes('--strict');
const update = process.argv.includes('--update');
let failures = 0;
const ok = m => console.log(`  ok   ${m}`);
const fail = m => { failures++; console.log(`  FAIL ${m}`); };
const warn = m => console.log(`  warn ${m}`);

const G = await import(pathToFileURL(join(root, 'src/learn/glossary/brinewire.js')));
await import(pathToFileURL(join(root, 'src/learn/table/kits/index.js')));
const KITS = await import(pathToFileURL(join(root, 'src/learn/table/kits/cell-registry.js')));
const SCENE = await import(pathToFileURL(join(root, 'src/learn/engine/cellscene.js')));

const ratchetFile = join(root, 'tools/teaching-ratchet.json');
const ratchet = existsSync(ratchetFile) ? JSON.parse(readFileSync(ratchetFile, 'utf8')) : {};
const measured = {};

/* ---------------------------------------------------------------- collect the play text of every stage */

const strings = (v, out = [], key = '') => {
  if (typeof v === 'string') { if (/^(label|title|text|caption|note|body|prompt|msg|legend|name|short)$/.test(key)) out.push(v); }
  else if (Array.isArray(v)) v.forEach(x => strings(x, out, key));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) strings(x, out, k);
  return out;
};

const quests = [];
for (const id of G.QUESTS) {
  const mod = await import(pathToFileURL(join(root, `src/learn/quests/unit10/${id}.js`)));
  quests.push({ id, mod, stages: mod.STAGES });
}

const stageText = st => {
  const texts = [st.title, st.prompt, ...(st.hints || [])];
  try { const r = st.reward; if (r) texts.push(r.title, r.body, r.log); } catch { /* a getter that needs a table */ }
  texts.push(...strings(st.table));
  return texts.filter(Boolean);
};

console.log('Brinewire teaching standard\n');

/* ---------------------------------------------------------------- 1 + 4 banned words */
{
  let n = 0;
  for (const q of quests) {
    if (q.id === 'boss-clamp') continue; // bosses and story keep their fiction names
    q.stages.forEach((st, i) => {
      for (const t of stageText(st)) for (const b of G.BANNED) if (b.re.test(t)) { n++; fail(`${q.id} stage ${i + 1}: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}" (${b.why}); say ${b.use}`); }
    });
  }
  if (!n) ok('no banned vague word or fiction name in any play text');
}

/* ---------------------------------------------------------------- 3 define on first use */
{
  let n = 0;
  const order = G.QUESTS;
  for (const term of G.TERMS) {
    const qi = order.indexOf(term.quest);
    for (const q of quests) {
      if (q.id === 'boss-clamp') continue;
      const qj = order.indexOf(q.id);
      q.stages.forEach((st, i) => {
        // Only prompts and titles and hints count as use; the reward may be the card that defines the term.
        const used = [st.title, st.prompt, ...(st.hints || [])].filter(Boolean).some(t => term.re.test(t));
        const before = qj < qi || (qj === qi && i + 1 < term.stage);
        if (used && before) { n++; fail(`${q.id} stage ${i + 1} uses "${term.term}" before ${term.quest} stage ${term.stage}, where the glossary defines it`); }
      });
    }
  }
  if (!n) ok('no glossary term is used before the stage that glosses it');
}


/* ---------------------------------------------------------------- 5 prerequisite map: every need names a primer that runs */
{
  const { PRIMERS } = await import(pathToFileURL(join(root, 'src/learn/engine/primers.js')));
  let n = 0;
  for (const [key, ids] of Object.entries(G.NEEDS)) {
    const [qid, no] = key.split(':');
    const q = quests.find(x => x.id === qid);
    if (!q || !q.stages[Number(no) - 1]) { n++; fail(`NEEDS ${key}: no such stage`); continue; }
    for (const id of ids) {
      const p = PRIMERS[id];
      if (!p) { n++; fail(`NEEDS ${key}: no primer "${id}"`); continue; }
      // run the primer against a stand-in page and read what it prints
      const els = new Map();
      const el = id2 => { if (!els.has(id2)) els.set(id2, { value: (p.html.match(new RegExp(`id="${id2}"[^>]*value="([^"]*)"`)) || [])[1] ?? '0', textContent: '', innerHTML: '', addEventListener() {} }); return els.get(id2); };
      try { p.wire({ querySelector: sel => el(sel.slice(1)) }); } catch (e) { n++; fail(`primer ${id} throws: ${e.message}`); continue; }
      const printed = [...els.values()].map(e => e.innerHTML).join(' ');
      if (/NaN|undefined|Infinity/.test(printed)) { n++; fail(`primer ${id} prints a bad number`); }
    }
  }
  const stagesWithMath = ['q4-potential:7', 'q5-load:6', 'q6-electrolysis:4'];
  for (const k of stagesWithMath) if (!G.NEEDS[k]) { n++; fail(`${k} uses maths but declares no need`); }
  if (!n) ok(`prerequisite map: ${Object.keys(G.NEEDS).length} stages declare needs and every primer runs`);
}

/* ---------------------------------------------------------------- bank words */
{
  const bank = JSON.parse(readFileSync(join(root, 'src/learn/bank/unit10.json'), 'utf8'));
  const all = []; const walk = v => { if (typeof v === 'string') all.push(v); else if (Array.isArray(v)) v.forEach(walk); else if (v && typeof v === 'object') Object.values(v).forEach(walk); };
  walk(bank);
  let n = 0;
  for (const t of all) for (const b of G.BANNED) if (b.re.test(t)) { n++; fail(`bank: "${t.match(b.re)[0]}" in "${t.slice(0, 70)}"; say ${b.use}`); }
  if (!n) ok('bank: no banned word');
}

/* ---------------------------------------------------------------- 6 mechanism present, 7 frame cost */
const SCENES = await import(pathToFileURL(join(root, 'src/learn/table/kits/cell-scenes.js')));
{
  const run = SCENES.demoSpec('running'); const off = SCENES.demoSpec('unwired');
  let moved = false; let differs = false; let idle = true; let maxPrims = 0;
  let prev = SCENE.sceneSignature(run, 0);
  for (let f = 1; f <= 300; f++) {
    const s = SCENE.sceneSignature(run, f / 30);
    if (s !== prev) moved = true;
    prev = s;
    if (s !== SCENE.sceneSignature(off, f / 30)) differs = true;
    const q = SCENE.sceneAt(off, f / 30);
    if (q.balls.some(b => b.kind === 'e')) idle = false;
    const m = SCENE.sceneAt(run, f / 30);
    maxPrims = Math.max(maxPrims, m.balls.length + m.boxes.length + m.lines.length);
  }
  moved ? ok('mechanism view: the model keeps moving over 300 frames') : fail('mechanism view is frozen');
  differs ? ok('mechanism view: a closed circuit and an open one give different pictures') : fail('mechanism view ignores the circuit');
  idle ? ok('mechanism view: no electron moves in an open circuit') : fail('mechanism view moves electrons in an open circuit');
  maxPrims <= 80 ? ok(`frame cost: at most ${maxPrims} primitives per frame`) : fail(`frame cost: ${maxPrims} primitives per frame`);
}

/* ---------------------------------------------------------------- 9 static ratio */
const dynamicKinds = new Set(['cellscene']);
await import(pathToFileURL(join(root, 'src/learn/table/kits/cell-scene.js')));
const liveOf = st => {
  const fx = st.table?.fixtures || [];
  return fx.some(f => dynamicKinds.has(f.kind) || KITS.fixtureHandler(f.kind)?.live);
};
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


/* ---------------------------------------------------------------- 11 the answer is given to the particles; 12 the Tour shows and is short; 13 a miss replays its cause */
{
  const visibleDials = f => Object.keys(f.dials || {}).filter(d => !f.props?.hidden?.includes(d));
  // A stage is answered on a dial or a card when it has a selector or ledger dial in view, a tray, or name cards (tags) to place.
  const byCardOrDial = st => {
    const t = st.table; if (!t || st.predict) return false;
    const fx = t.fixtures || [];
    if (fx.some(f => (f.kind === 'selector' || f.kind === 'cellledger') && visibleDials(f).length)) return true;
    if ((t.zones?.trays || []).length) return true;
    if ((t.pieces || []).some(p => p.kind === 'tag' && (t.zones?.rail || (t.zones?.trays || []).length || (t.zones?.slots || []).length))) return true;
    return false;
  };
  const converted = ['q1-halves:1', 'q1-halves:3', 'q1-halves:4', 'q1-halves:7', 'q2-activity:1', 'q2-activity:2', 'q2-activity:5', 'q2-activity:6', 'q2-activity:7', 'q2-activity:8', 'boss-clamp:1', 'q1-halves:5', 'q1-halves:8', 'q3-galvanic:4', 'q3-galvanic:5', 'q3-galvanic:6', 'q4-potential:1', 'q4-potential:3', 'q5-load:2', 'q5-load:5', 'q5-load:7', 'q5-load:8', 'q6-electrolysis:2', 'q6-electrolysis:7', 'boss-clamp:2', 'boss-clamp:4'];
  let n = 0; let left = 0; const leftList = [];
  for (const q of quests) q.stages.forEach((st, i) => {
    const key = `${q.id}:${i + 1}`;
    if (converted.includes(key) && byCardOrDial(st)) { n++; fail(`${key} was converted to particle answers but still has a dial, tray or name card to answer on`); }
    if (byCardOrDial(st)) { left++; leftList.push(key); }
  });
  if (!n) ok(`particle answers: ${converted.length} stages are answered on particles, strips or beakers, none on a dial, tray or card`);
  console.log(`  answered on a dial, tray or card: ${left} stages (${leftList.join(', ')})`);
  measured.cardOrDial = left;
  const prior = ratchet.cardOrDial ?? left;
  if (left > prior) fail(`more stages answered on a dial or a card than the ratchet allows (${left} > ${prior})`);

  // the Tour: every Brinewire tool has a clip that builds, and its words are short
  const { demoFor } = await import(pathToFileURL(join(root, 'src/learn/table/tour-demo.js')));
  const { tourSteps } = await import(pathToFileURL(join(root, 'src/learn/table/tour.js')));
  const { createTable } = await import(pathToFileURL(join(root, 'src/learn/table/model.js')));
  let bad = 0; let steps = 0; let clips = 0;
  for (const q of quests) for (const st of q.stages) {
    if (!st.table) continue;
    for (const step of tourSteps(createTable(st.table, st.title))) {
      if (!step.flag.startsWith('tour_cell_')) continue;
      steps++;
      const words = step.desc.trim().split(/\s+/).length;
      if (words > 12) { bad++; fail(`Tour step "${step.name}" has ${words} words; the limit is 12`); }
      if (step.demo) {
        clips++;
        try { const d = await step.demo.build(); if (!(d.loop > 0) || !d.table) throw new Error('no loop or table'); } catch (e) { bad++; fail(`Tour clip of "${step.name}" does not build: ${e.message}`); }
      } else if (/_fx_/.test(step.flag) && !/plaque|plate/.test(step.flag)) { bad++; fail(`Tour step "${step.name}" has no clip`); }
    }
  }
  if (!bad) ok(`Tour: ${steps} Brinewire steps, each at most 12 words; ${clips} play a clip of the tool in use`);

  // a miss replays the cause: the model restarts, and what does not add up is ringed
  const CELL = await import(pathToFileURL(join(root, 'src/learn/table/kits/cell-scene.js')));
  CELL.noteMiss('test');
  CELL.replaying() ? ok('a miss starts a replay of the model') : fail('a miss does not start a replay');
  const lq = quests[0]; const st3 = lq.stages[2];
  const tbl = createTable(st3.table, st3.title);
  const sc = tbl.fixtures.scene;
  const spec = SCENES.specFor(tbl, sc);
  // one electron out of the zinc strip and none taken: an electron is left waiting, and it is ringed
  const t2 = JSON.parse(JSON.stringify(tbl)); t2.fixtures.hz.dials.eR.value = 1;
  const m = SCENE.sceneAt(SCENES.specFor(t2, t2.fixtures.scene), 1);
  m.balls.some(b => b.prob) ? ok('replay: an electron with nowhere to go is flagged in the model') : fail('replay: nothing in the model marks the unmatched electron');
  void spec;
}


/* ---------------------------------------------------------------- 14 a sealed bench stays sealed in the model */
{
  const sealedStages = [['q2-activity', 6], ['q3-galvanic', 7], ['q4-potential', 7], ['q6-electrolysis', 7]];
  let n = 0;
  for (const [id, i] of sealedStages) {
    const q = quests.find(x => x.id === id);
    const state = q.mod.stateFor(i, q.mod.SOLUTIONS[i]);
    // a rig that draws the model inside its own beakers has no scene fixture: read it through the rig
    const scene = state.table.fixtures.scene || { props: { watch: Object.values(state.table.fixtures).filter(f => SCENES.hasBuilder(f.kind)).map(f => f.id) } };
    const spec = SCENES.specFor(state.table, scene);
    const labels = [...(spec.strips || []).map(x => x.label), ...(spec.ions || []).map(x => x.label)].filter(Boolean);
    const metals = labels.filter(l => /^(Mg|Al|Zn|Fe|Ni|Sn|Pb|Cu|Ag|Au)/.test(l));
    // a dip rack names the solutions it holds; only the sealed strip and the sealed bench may not be named
    if (id !== 'q2-activity' && metals.length) { n++; fail(`${id}:${i + 1} the model names a sealed metal: ${metals.join(', ')}`); }
    if (id === 'q2-activity' && (spec.strips || []).some(x => /^(Mg|Al|Zn|Fe|Ni|Sn|Pb|Cu|Ag|Au)/.test(x.label || ''))) { n++; fail('q2-activity:7 the model names the sealed strip'); }
  }
  // a sealed concentration cell draws equal crowds in both beakers
  const q5 = quests.find(x => x.id === 'q5-load');
  const st5 = q5.mod.stateFor(7, q5.mod.SOLUTIONS[7]);
  const sp5 = SCENES.specFor(st5.table, st5.table.fixtures.scene);
  const counts = (sp5.ions || []).map(g => g.n);
  if (new Set(counts).size > 1) { n++; fail(`q5-load:8 the sealed cell draws unequal crowds: ${counts.join(', ')}`); }
  if (!n) ok('sealed benches: the model names no sealed metal and shows no sealed concentration');
}

/* ---------------------------------------------------------------- 8 predict lead-in */
{
  const preds = []; let withIn = 0;
  for (const q of quests) q.stages.forEach((st, i) => { if (st.predict) { preds.push(`${q.id}:${i + 1}`); if (st.leadIn) withIn++; } });
  measured.noLeadIn = preds.length - withIn;
  const prior = ratchet.noLeadIn ?? preds.length;
  if (preds.length - withIn > prior) fail('a predict stage lost its lead-in');
  else (strict && preds.length - withIn ? fail : warn)(`predict lead-ins: ${withIn} of ${preds.length}`);
}

/* ---------------------------------------------------------------- 10 reading load */
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
  const prior = ratchet.load ?? over;
  if (over > prior) fail(`reading load grew (${over} > ${prior})`);
  else (strict && over ? fail : warn)(`reading load: ${over} prompt/reward/hint item(s) over the limit`);
}

if (update) { writeFileSync(ratchetFile, JSON.stringify(measured, null, 2) + '\n'); console.log('\n  ratchet written'); }
console.log(failures ? `\nTEACHING FAILED (${failures})` : '\nTEACHING OK');
process.exit(failures ? 1 : 0);
