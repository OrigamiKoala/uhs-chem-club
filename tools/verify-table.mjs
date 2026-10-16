#!/usr/bin/env node
/**
 * verify-table.mjs — The tabletop and the rails, proved without a browser.
 *
 * Run with `npm run verify:table`. It holds four things.
 *
 * 1. THE PIPELINE, on one throwaway stage (`tools/lib/table-fixture.mjs`, NOT
 *    shipped to any quest and not reachable in the app). Every table stage,
 *    that one today and each converted quest's tomorrow, is held to the same
 *    rules (`checkTableStage`):
 *      - its SOLUTION script replays through the reducer to a table its
 *        `check` passes, by direct actions, by DRAG (a `place` at a point) and
 *        by TWO TAPS (`pick`, then `place` to a named target), and all three
 *        end in the same table (`signature`);
 *      - the drawn tabletop's own gestures (`Table2D`: press, move, release)
 *        reach that table too;
 *      - every MISSES script fails `check`, with a reason;
 *      - nothing authors a join: no outcome key in the declaration, and every
 *        join in the final table was a `kit.planJoin` that held;
 *      - no piece, tray, slot or token label contains the stage's answer;
 *      - every tool the stage lists, every dial and every Run changes the
 *        table (the "control that does nothing" rule);
 *      - the table is laid out (nothing off the table, zones apart), is
 *        sound after every action, and DRAWS at phone and bench size.
 * 2. THE ORDER RAILS. All 14 `order` stages in the built quests: the rail
 *    starts in a fixed shuffle that is never the answer, its ends carry plain
 *    labels, and dragging and two taps both reach the answer through the same
 *    `RailController`, writing the `state.order` every `check()` reads.
 * 3. THE CATALOGUE STRIP: a card dropped on a filled slot pushes the row along,
 *    by drag and by tap, and both write the same `placed`.
 * 4. THE LEGACY RATCHET (`tools/table-legacy.json`): a quest listed there is
 *    not yet converted to a tabletop; one that is not listed is, and may keep
 *    at most a quarter of its stages as `choice`, each an unbuildable reading.
 *    A new quest gets no line.
 */

import { readFileSync } from 'node:fs';
import { installUiStub, stub } from './lib/ui-stub.mjs';
import { makeCtx } from './lib/ctx-stub.mjs';

installUiStub();

const { allQuests } = await import('../src/learn/curriculum.js');
const MODEL = await import('../src/learn/table/model.js');
const SNAP = await import('../src/learn/table/snap.js');
const RAIL = await import('../src/learn/table/rail.js');
const REC = await import('../src/learn/table/recorder.js');
const TOOLS = await import('../src/learn/table/tools.js');
const REG = await import('../src/learn/table/kits/registry.js');
const RUNNER = await import('../src/learn/engine/stagerunner.js');
const { Table2D, drawTable, fixtureLayout } = await import('../src/learn/engine/table2d.js');
const RAILVIEW = await import('../src/learn/engine/railview.js');
const CATALOGUE = await import('../src/learn/engine/catalogue.js');
const FIX = await import('./lib/table-fixture.mjs');

let failures = 0;
const fail = msg => { console.log(`  FAIL ${msg}`); failures++; };
const ok = msg => console.log(`  ok   ${msg}`);
/** Deep equality that ignores key order. */
const canon = v => (Array.isArray(v) ? v.map(canon) : v && typeof v === 'object'
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, canon(v[k])])) : v);
const same = (a, b) => JSON.stringify(canon(a)) === JSON.stringify(canon(b));

/* ------------------------------------------------------------------
   1. THE PIPELINE
   ------------------------------------------------------------------ */

/** Keys a declaration may never carry: a join's outcome is the kit's planner, not data. */
const AUTHORED_OUTCOME = /^(joins?|joined|outcomes?|holds|bonds?|links?|results?)$/i;

function authoredKeys(node, path = 'table') {
  const out = [];
  if (Array.isArray(node)) node.forEach((x, i) => out.push(...authoredKeys(x, `${path}[${i}]`)));
  else if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (AUTHORED_OUTCOME.test(k)) out.push(`${path}.${k}`);
      out.push(...authoredKeys(v, `${path}.${k}`));
    }
  }
  return out;
}

const wordsOf = t => String(t).toLowerCase().match(/[a-z0-9]+(?:[.'-][a-z0-9]+)*/g) || [];
/** Does `text` carry `needle` as whole words (a label holding "Pairs" holds "pairs")? */
function carries(text, needle) {
  const n = wordsOf(needle);
  const t = wordsOf(text);
  if (!n.length) return false;
  for (let i = 0; i + n.length <= t.length; i++) if (n.every((w, k) => t[i + k] === w)) return true;
  return false;
}

/** Replay a script through the reducer. `spy` records every planJoin the run asked for. */
function replay(table, script, mode, spy = null) {
  const kit = REG.getKit(table.kit);
  const real = kit.planJoin;
  if (spy) {
    kit.planJoin = (a, b, s) => {
      const r = real.call(kit, a, b, s);
      spy.push({ key: SNAP.linkKey(a.id, b.id), holds: Boolean(r.holds) });
      return r;
    };
  }
  try {
    return MODEL.runScript(table, script, { mode, strict: true });
  } finally {
    kit.planJoin = real;
  }
}

/** The labels an answer must not be readable from, and the answer's own words. */
function leakTokens(stage, end) {
  const t = end;
  const tokens = [];
  const kit = REG.getKit(t.kit);
  for (const p of Object.values(t.pieces)) {
    if (p.token) continue;
    const key = p.zone && p.zone !== 'rail' ? SNAP.parseKey(p.zone) : null;
    const zone = key && (key.kind === 'tray' ? t.zones.trays[key.id] : key.kind === 'slot' ? t.zones.slots[key.id] : t.zones.containers[key.id]);
    if (zone?.label) tokens.push({ from: `${p.id} ends in "${zone.label}"`, text: zone.label, only: p.id });
  }
  for (const c of MODEL.clusters(t)) {
    const formula = kit.formulaOf(c, t);
    if (formula && c.length > 1) tokens.push({ from: `the cluster ${c.join('+')} is "${formula}"`, text: formula });
  }
  const win = t.prediction?.token;
  if (win) tokens.push({ from: `the winning prediction "${t.pieces[win].label}"`, text: t.pieces[win].label, notOn: win });
  for (const row of t.recorder.rows) tokens.push({ from: `a recorded reading ${row.y}`, text: String(row.y), digits: true });
  return tokens;
}

function checkTableStage(label, stage, solution, misses) {
  const before = failures;
  const spec = stage.table;
  const kit = REG.getKit(spec.kit);
  let t0;
  try {
    t0 = MODEL.createTable(spec, stage.title);
  } catch (e) {
    fail(`${label}: the declaration does not build a table (${e.message})`);
    return;
  }

  // Deterministic and plain JSON.
  if (!same(t0, MODEL.createTable(spec, stage.title))) fail(`${label}: building the table twice gives two tables`);
  if (!same(t0, JSON.parse(JSON.stringify(t0)))) fail(`${label}: the table is not plain JSON`);
  const bad0 = MODEL.checkInvariants(t0);
  if (bad0.length) fail(`${label}: the starting table is unsound — ${bad0[0]}`);

  // Authored outcomes.
  for (const k of authoredKeys(spec)) fail(`${label}: the declaration authors an outcome at ${k}; a join is the kit's planner, never data`);

  // Layout: on the table, zones apart.
  const { w, h } = t0.bounds;
  for (const p of Object.values(t0.pieces)) {
    const r = REG.radiusOf(kit, p);
    if (p.at.x - r < 0 || p.at.y - r < 0 || p.at.x + r > w || p.at.y + r > h) fail(`${label}: piece ${p.id} starts off the table`);
    if (p.hidden && !t0.fetch[p.fetchFrom]) fail(`${label}: piece ${p.id} is hidden and nothing can fetch it`);
  }
  const rects = [
    ...Object.values(t0.zones.trays).map(z => [`tray ${z.id}`, SNAP.rectOf(z, SNAP.SIZES.tray)]),
    ...Object.values(t0.zones.slots).map(z => [`slot ${z.id}`, SNAP.rectOf(z, SNAP.SIZES.slot)]),
    ...Object.values(t0.zones.containers).map(z => [`container ${z.id}`, SNAP.rectOf(z, SNAP.SIZES.container)]),
    ...(t0.zones.rail ? [['the rail', SNAP.rectOf(t0.zones.rail, SNAP.SIZES.rail)]] : []),
    ['the recorder strip', SNAP.rectOf(t0.recorder.box, { w: 30, h: 18 })],
    ...Object.values(t0.fixtures).map(z => [`fixture ${z.id}`, SNAP.rectOf(z, SNAP.SIZES.fixture)])
  ];
  // A piece that starts loose starts on open table: clear of every zone and of its neighbours.
  const loose = Object.values(t0.pieces).filter(p => !p.zone);
  for (const p of loose) {
    for (const [name, r] of rects) {
      if (p.at.x > r.x0 && p.at.x < r.x1 && p.at.y > r.y0 && p.at.y < r.y1) fail(`${label}: loose piece ${p.id} starts inside ${name}`);
    }
  }
  for (let i = 0; i < loose.length; i++) {
    for (let j = i + 1; j < loose.length; j++) {
      const a = loose[i];
      const b = loose[j];
      if (Math.hypot(a.at.x - b.at.x, a.at.y - b.at.y) < REG.radiusOf(kit, a) + REG.radiusOf(kit, b)) fail(`${label}: pieces ${a.id} and ${b.id} start on top of each other`);
    }
  }
  for (const [name, r] of rects) {
    if (r.x0 < 0 || r.y0 < 0 || r.x1 > w || r.y1 > h) fail(`${label}: ${name} is not wholly on the table`);
  }
  for (let i = 0; i < rects.length; i++) {
    for (let j = i + 1; j < rects.length; j++) {
      const [na, a] = rects[i];
      const [nb, b] = rects[j];
      if (a.x0 < b.x1 && b.x0 < a.x1 && a.y0 < b.y1 && b.y0 < a.y1) fail(`${label}: ${na} overlaps ${nb}`);
    }
  }

  // The solution, three ways, every step taking, every state sound.
  const spy = [];
  const ends = {};
  for (const mode of ['direct', 'drag', 'tap']) {
    try {
      ends[mode] = replay(t0, solution, mode, mode === 'direct' ? spy : null);
    } catch (e) {
      fail(`${label}: the solution by ${mode} — ${e.message}`);
      return;
    }
    const bad = MODEL.checkInvariants(ends[mode]);
    if (bad.length) fail(`${label}: after the solution by ${mode} the table is unsound — ${bad[0]}`);
  }
  const sig = m => JSON.stringify(MODEL.signature(ends[m]));
  if (sig('drag') !== sig('direct')) fail(`${label}: dragging the solution does not reach the table the script names`);
  if (sig('tap') !== sig('direct')) fail(`${label}: tapping the solution does not reach the table the script names`);

  // The drawn tabletop's own gestures.
  try {
    const viaView = { drag: driveView(t0, solution, 'drag'), tap: driveView(t0, solution, 'tap') };
    for (const m of ['drag', 'tap']) {
      if (JSON.stringify(MODEL.signature(viaView[m])) !== sig('direct')) {
        const a = MODEL.signature(viaView[m]);
        const d = JSON.parse(sig('direct'));
        const keys = Object.keys(d).filter(k => JSON.stringify(a[k]) !== JSON.stringify(d[k]));
        fail(`${label}: the drawn tabletop, by ${m} gestures, does not reach the solution (differs in ${keys.map(k => `${k}: ${JSON.stringify(a[k])} vs ${JSON.stringify(d[k])}`).join("; ")})`);
      }
    }
  } catch (e) {
    fail(`${label}: the drawn tabletop faulted — ${e.stack?.split('\n').slice(0, 2).join(' ')}`);
  }

  // Determinism and purity: the same script twice, and the start untouched.
  const frozen = JSON.stringify(t0);
  const again = replay(t0, solution, 'direct');
  if (!same(again, ends.direct)) fail(`${label}: the same script twice gives two tables`);
  if (JSON.stringify(t0) !== frozen) fail(`${label}: applying actions changed the table it was given`);

  // Graded by check().
  const solved = stage.check(RUNNER.stateFromScript(stage, solution));
  if (!solved?.ok) fail(`${label}: the solution does not pass check (${solved?.msg || 'no reason'})`);
  const blank = stage.check(RUNNER.blankAnswer(stage));
  if (blank?.ok) fail(`${label}: an untouched table passes check`);
  else if (!blank?.msg) fail(`${label}: an untouched table is refused without a reason`);

  // Every join in the end table was the planner's, and held.
  const held = new Set(spy.filter(s => s.holds).map(s => s.key));
  for (const key of Object.keys(ends.direct.links)) {
    if (!held.has(key)) fail(`${label}: join ${key} stands but no kit.planJoin said it holds`);
  }

  // Misses fail, with a reason, and reveal no answer.
  const leaks = leakTokens(stage, ends.direct);
  misses.forEach((miss, i) => {
    try { replay(t0, miss.script, 'direct'); } catch (e) { fail(`${label}: miss ${i + 1} — ${e.message}`); return; }
    const r = stage.check(RUNNER.stateFromScript(stage, miss.script));
    if (r?.ok) fail(`${label}: miss ${i + 1} passes check`);
    else if (!r?.msg) fail(`${label}: miss ${i + 1} is refused with no reason`);
    else if (miss.says && !miss.says.test(r.msg)) fail(`${label}: miss ${i + 1} is refused for the wrong reason ("${r.msg}")`);
    else for (const tok of leaks) {
      if (!tok.digits && carries(r.msg, tok.text) && tok.text.length > 2 && !tok.only) fail(`${label}: miss ${i + 1}'s reason carries ${tok.from}`);
    }
  });

  // Labels give nothing away.
  const labelled = Object.values(t0.pieces).map(p => ({ id: p.id, text: p.label }));
  for (const tok of leaks) {
    for (const l of labelled) {
      if (tok.only && tok.only !== l.id) continue;
      if (tok.notOn === l.id) continue;
      if (tok.digits ? new RegExp(`(^|[^0-9.])${tok.text}($|[^0-9])`).test(l.text) : carries(l.text, tok.text)) {
        fail(`${label}: the label "${l.text}" gives away ${tok.from}`);
      }
    }
    if (!tok.only) {
      for (const text of MODEL.labelsOf(spec)) {
        if (!tok.digits && tok.text.length > 2 && carries(text, tok.text) && !labelled.some(l => l.text === text && tok.notOn === l.id)) {
          fail(`${label}: the label "${text}" gives away ${tok.from}`);
        }
      }
    }
  }
  for (const [id, p] of Object.entries(t0.pieces)) {
    if (!p.label) fail(`${label}: piece ${id} has no label`);
  }

  // Controls that do nothing.
  for (const id of spec.tools || []) {
    const def = TOOLS.toolDef(kit, id);
    if (!def) { fail(`${label}: tool "${id}" is not a tool the table knows`); continue; }
    try {
      const after = MODEL.runScript(t0, def.probe(t0), { strict: true });
      if (same(MODEL.signature(after), MODEL.signature(t0))) fail(`${label}: tool "${id}" changes nothing`);
      const pressed = def.press(after);
      if (id === 'straightedge' && !pressed) fail(`${label}: tool "${id}" cannot be pressed once it has something to lay on`);
    } catch (e) {
      fail(`${label}: tool "${id}" — ${e.message}`);
    }
  }
  for (const f of Object.values(t0.fixtures)) {
    const row = kit.run(t0, f.id);
    if (!row) fail(`${label}: fixture ${f.id} reads nothing when run`);
    for (const [name, d] of Object.entries(f.dials)) {
      if (!(d.max > d.min)) { fail(`${label}: dial ${f.id}.${name} has no range`); continue; }
      const moved = MODEL.apply(t0, { setDial: { fixture: f.id, dial: name, value: d.value === d.max ? d.min : d.max } });
      if (!moved.last.ok || moved.fixtures[f.id].dials[name].value === d.value) fail(`${label}: dial ${f.id}.${name} does not turn`);
    }
  }

  // A prediction can be made and unmade.
  if (t0.prediction) {
    const first = t0.prediction.tokens[0];
    const made = MODEL.apply(t0, { predict: first });
    if (made.prediction.token !== first) fail(`${label}: a prediction token cannot be placed`);
    if (MODEL.apply(made, { predict: null }).prediction.token !== null) fail(`${label}: a prediction cannot be taken back`);
  }

  // The picture draws, at phone size and at bench size, start and end.
  for (const [w2, h2] of [[340, 204], [667, 375]]) {
    for (const [name, st] of [['start', t0], ['end', ends.direct]]) {
      const ctx = makeCtx(w2, h2);
      drawTable(ctx, w2, h2, st, { shown: Object.fromEntries(Object.values(st.pieces).map(p => [p.id, p.at])) });
      if (!ctx.stats.calls) fail(`${label}: the ${name} table draws nothing at ${w2}x${h2}`);
      if (ctx.stats.nan) fail(`${label}: the ${name} table draws NaN at ${w2}x${h2}`);
      if (ctx.stats.maxX > w2 + 2 || ctx.stats.maxY > h2 + 2) fail(`${label}: the ${name} table draws off the plate at ${w2}x${h2}`);
      for (const p of Object.values(st.pieces).filter(q => !q.hidden)) {
        if (!ctx.stats.text.includes(String(p.label))) fail(`${label}: piece "${p.label}" is not drawn at ${w2}x${h2}`);
      }
    }
  }
  // A piece must be big enough to hit with a finger at the smallest plate.
  for (const p of Object.values(t0.pieces)) {
    const px = REG.radiusOf(kit, p) * 2 * (340 / w);
    if (px < 28) fail(`${label}: piece ${p.id} is ${px.toFixed(0)} px across at 340 px, under 28`);
  }

  if (failures === before) ok(`${label}: solved by script, drag, two taps and the drawn tabletop's gestures; ${misses.length} miss(es) refused with a reason; no authored outcomes; every control moves the table`);
}

/** Drive the REAL drawn tabletop (`Table2D`) with pointer gestures through a script. */
function driveView(table, script, mode) {
  let state = table;
  const view = new Table2D(stub(), {
    tools: table.tools,
    onAction: a => { state = MODEL.apply(state, a); view.setState(state); view.settle(); }
  });
  view.setState(state);
  view.settle();
  const kit = REG.getKit(table.kit);
  const tap = p => { view.pointerDown(p); view.pointerUp(p); };
  for (const step of script) {
    const verb = Object.keys(step)[0];
    const arg = step[verb];
    let piece = null;
    let to = null;
    if (verb === 'place' && arg.to !== undefined) { piece = arg.piece ?? state.carry.held; to = arg.to; }
    else if (verb === 'join') { piece = arg[0]; to = `piece:${arg[1]}`; }
    else if (verb === 'predict' && arg) { piece = arg; to = `slot:${state.prediction.slot}`; }

    if (piece) {
      const c = { ...state.pieces[piece].at };
      const p = SNAP.pointFor(state, kit, to, piece);
      if (mode === 'drag') {
        view.pointerDown(c);
        view.pointerMove({ x: (c.x + p.x) / 2, y: (c.y + p.y) / 2 });
        view.pointerMove(p);
        view.pointerUp(p);
      } else {
        tap(c);
        tap(p);
      }
    } else if (verb === 'setDial') {
      const lay = Object.values(state.fixtures).find(f => f.id === arg.fixture);
      const d = dialTrack(lay, arg.dial);
      const frac = (arg.value - d.def.min) / (d.def.max - d.def.min);
      const x = d.track.x0 + frac * (d.track.x1 - d.track.x0);
      view.pointerDown({ x, y: d.track.y });
      view.pointerUp({ x, y: d.track.y });
    } else if (verb === 'run') {
      const lay = fixtureRun(state.fixtures[typeof arg === 'string' ? arg : arg.fixture]);
      const mid = { x: (lay.x0 + lay.x1) / 2, y: (lay.y0 + lay.y1) / 2 };
      view.pointerDown(mid);
      view.pointerUp(mid);
    } else {
      view.onAction(step);
    }
  }
  return state;
}

function dialTrack(fixture, name) {
  const lay = fixtureLayout(fixture);
  return { track: lay.dials.find(x => x.name === name), def: fixture.dials[name] };
}
function fixtureRun(fixture) { return fixtureLayout(fixture).run; }

console.log('Tabletop — the pipeline on its throwaway stage\n');
FIX.registerTestKit();
try {
  checkTableStage('throwaway', FIX.TEST_STAGE, FIX.TEST_SOLUTION, FIX.TEST_MISSES);
} catch (e) {
  fail(`throwaway: ${e.stack}`);
}

// The stage runner hosts a table stage: widget `table`, `runner.act`, `state.table`, `state.choice`.
{
  const before = failures;
  try {
    const stage = FIX.TEST_STAGE;
    const ctx = { world: {}, quest: {}, stagesCleared: 0, isComplete: false, reportStage() {}, reportComplete() {}, exit() {} };
    const runner = RUNNER.createRunner(stub(), ctx, { STAGES: [stage], DEBRIEF: {}, blankState: () => ({}), onLoad() {} });
    runner.start();
    if (!runner.state.table) fail('the runner built no table for a table stage');
    if (!runner.tabletop) fail('the runner built no tabletop for a table stage');
    if (stage.check(runner.state).ok) fail('the runner starts a table stage already solved');
    for (const step of FIX.TEST_SOLUTION) {
      for (const action of MODEL.expandStep(runner.state.table, step, 'tap')) runner.act(action);
    }
    if (JSON.stringify(MODEL.signature(runner.state.table)) !== JSON.stringify(MODEL.signature(replay(MODEL.createTable(stage.table, stage.title), FIX.TEST_SOLUTION, 'direct')))) fail('the runner reaches a different table than the script');
    if (runner.state.choice !== 't-up') fail('state.choice does not mirror the prediction token');
    if (!stage.check(runner.state).ok) fail('the runner\'s own table fails check after the solution');
    if (runner.tabletop.state !== runner.state.table) fail('the tabletop is not showing the runner\'s table');
    runner.dispose();
  } catch (e) {
    fail(`the stage runner and a table stage: ${e.stack?.split('\n').slice(0, 3).join(' ')}`);
  }
  if (failures === before) ok('the stage runner builds the table, applies actions, mirrors the prediction as the choice, and grades state.table');
}

// A rail's gestures, a recorder's straightedge, and a script that cannot take, on the same table.
{
  const t0 = MODEL.createTable(FIX.TEST_TABLE, 'x');
  const noop = MODEL.apply(t0, { place: { piece: 'b1', to: 'tray:nowhere' } });
  if (noop.last.ok) fail('placing in a tray that does not exist took');
  if (JSON.stringify(MODEL.signature(noop)) !== JSON.stringify(MODEL.signature(t0))) fail('a refused action changed the table');
  if (MODEL.apply(t0, { bogus: 1 }).last.ok) fail('an unknown action took');
  const poured = MODEL.apply(t0, { pour: { from: 'A', to: 'B', what: 'water', amount: 99 } });
  if (poured.zones.containers.B.contents.water !== 6) fail('a pour is not clamped to what the jar holds');
  const unlike = MODEL.apply(t0, { join: ['b1', 'b3'] });
  if (unlike.last.joined !== false || Object.keys(unlike.links).length) fail('like ends joined');
  if (!unlike.last.reason) fail('a join that does not hold gives no reason');
  const split = MODEL.apply(MODEL.apply(t0, { join: ['b1', 'b2'] }), { split: 'b1' });
  if (Object.keys(split.links).length || MODEL.checkInvariants(split).length) fail('splitting a join leaves it standing');
  // Straightedge data.
  let rec = REC.emptyRecorder();
  rec = REC.append(rec, { x: 0, y: 1, label: 'a' });
  rec = REC.append(rec, { x: 2, y: 5, label: 'b' });
  rec = REC.append(rec, { x: NaN, y: 1 });
  rec = REC.lay(rec, { kind: 'straightedge', through: [0, 1] });
  const line = REC.lineOf(rec);
  if (rec.rows.length !== 2 || line.slope !== 2 || line.intercept !== 1 || REC.readX(line, 0) !== -0.5) fail('the recorder or its straightedge reads wrongly');
  else ok('refusals change nothing, a pour is clamped, a join that fails says why, a split undoes a join, the straightedge reads a line');
}

/**
 * Drive `bindRail` (the order widget's DOM) on a hand-made DOM, as a player
 * would: a press, moves and a release for a drag; a click on a piece and a click
 * on a gap for the twin. The rail is repainted into `track.innerHTML`, which is
 * read back for the gaps it offers.
 */
function driveRailWidget(w, start, want, hand) {
  const handlers = {};
  const el = (id, i) => ({
    dataset: { railPiece: id },
    rect: { left: i * 100, top: 0, width: 90, height: 46 },
    style: {}, classList: { add() {}, remove() {} },
    before() {}, setPointerCapture() {}, releasePointerCapture() {},
    getBoundingClientRect() { return this.rect; }
  });
  let pieces = start.map(el);
  const track = {
    classList: { toggle() {} }, appendChild() {},
    querySelectorAll: () => pieces,
    set innerHTML(html) {
      this.html = html;
      pieces = [...html.matchAll(/data-rail-piece="([^"]+)"/g)].map((m, i) => el(m[1], i));
    },
    get innerHTML() { return this.html; }
  };
  const root = {
    addEventListener(type, fn) { handlers[type] = fn; }, removeEventListener() {},
    querySelector: () => track
  };
  let order = start.slice();
  let moves = 0;
  const bound = RAILVIEW.bindRail(root, { items: w.items, order: start, onOrder: o => { order = o; }, onMoved: () => { moves++; } });
  const target = p => ({ closest: sel => (sel === '[data-rail-piece]' ? p : null) });
  for (let k = 0; k < want.length; k++) {
    const cur = bound.controller.order;
    if (cur[k] === want[k]) continue;
    const at = cur.indexOf(want[k]);
    if (hand === 'drag') {
      const p = pieces[at];
      handlers.pointerdown({ target: target(p), clientX: at * 100 + 10, clientY: 10, pointerId: 1, button: 0 });
      handlers.pointermove({ clientX: at * 100 + 60, clientY: 12, pointerId: 1 });
      handlers.pointermove({ clientX: k * 100, clientY: 12, pointerId: 1 });
      handlers.pointerup({ clientX: k * 100, clientY: 12, pointerId: 1 });
    } else {
      handlers.click({ target: target(pieces[at]) });
      const gaps = [...(track.html || '').matchAll(/data-rail-gap="(\d+)"/g)].map(m => Number(m[1]));
      if (!same(gaps, RAIL.gapsFor(cur, want[k]))) return { order: ['gaps offered: ' + gaps.join()], moves: 0 };
      handlers.click({ target: { closest: sel => (sel === '[data-rail-gap]' ? { dataset: { railGap: String(k) } } : null) } });
    }
  }
  bound.dispose();
  return { order, moves };
}

// The gestures T0a deferred, in the shared gesture layer both views use: pour, flip, scale, fetch, and a straightedge laid by hand.
{
  const before = failures;
  const GEST = await import('../src/learn/table/gestures.js');
  const kit = REG.getKit('bars');
  const make = () => {
    let state = MODEL.createTable(FIX.TEST_TABLE, 'gest');
    const view = new Table2D(stub(), { tools: state.tools, onAction: a => { state = MODEL.apply(state, a); view.setState(state); view.settle(); } });
    view.setState(state);
    view.settle();
    return { view, get state() { return state; } };
  };
  try {
    // POUR: a drag from one jar to the other, and a tap on one then the other, each pour one step.
    for (const how of ['drag', 'tap']) {
      const t = make();
      const A = t.state.zones.containers.A.at;
      const B = t.state.zones.containers.B.at;
      if (how === 'drag') { t.view.pointerDown(A); t.view.pointerMove({ x: (A.x + B.x) / 2, y: A.y }); t.view.pointerMove(B); t.view.pointerUp(B); }
      else { for (const p of [A, B]) { t.view.pointerDown(p); t.view.pointerUp(p); } }
      const a = t.state.zones.containers.A.contents.water;
      const b = t.state.zones.containers.B.contents.water;
      if (a !== 5 || b !== 1) fail(`pour by ${how}: jars hold ${a} and ${b}, not 5 and 1`);
    }
    const none = GEST.pourAction(make().state, kit, 'B', 'A');
    if (none) fail('a pour from an empty jar made an action');

    // FLIP and SCALE: a card in the hand offers the keys, and two quick taps turn it over.
    const f = make();
    f.view.dispatch({ place: { piece: 'c1', at: { x: 30, y: 52 } } });
    f.view.dispatch({ pick: 'c1' });
    const keys = GEST.contextKeys(f.state, kit);
    const names = keys.map(k => k.label).join();
    if (names !== 'Flip,Smaller,Larger,Shelf') fail(`a held card offers the keys "${names}", not "Flip,Smaller,Larger,Shelf"`);
    if (keys.find(k => k.id === 'smaller').enabled) fail('a card at its smallest offers Smaller');
    f.view.dispatch(keys.find(k => k.id === 'larger').action);
    if (f.state.pieces.c1.props.scale !== 2) fail('the Larger key did not double a card');
    f.view.dispatch(keys.find(k => k.id === 'flip').action);
    if (!f.state.pieces.c1.props.flipped) fail('the Flip key did not turn the card over');
    // Tapping the held card again puts it down (it is not a flip).
    const g = make();
    const at = g.state.pieces.c2.at;
    g.view.pointerDown(at); g.view.pointerUp(at);
    g.view.pointerDown(at); g.view.pointerUp(at);
    if (g.state.carry.held || g.state.pieces.c2.props.flipped) fail('tapping a held card again did not simply put it down');
    const face = (await import('../src/learn/engine/table2d.js')).faceOf(kit, f.state.pieces.c1, f.state);
    if (!face.flipped || face.badge !== 'x2') fail('a flipped, doubled card does not show it on its face');

    // FETCH: the stage's field item is a key where no world has the point, and the table gains the piece.
    const h = make();
    const fk = GEST.contextKeys(h.state, kit).find(k => k.id === 'fetch:shelf');
    if (!fk) fail('a pending fetch offers no key');
    else {
      if (!h.state.pieces.w1.hidden) fail('the fetched piece is on the table before it is fetched');
      h.view.dispatch(fk.action);
      if (h.state.pieces.w1.hidden) fail('fetching put nothing on the table');
      if (GEST.contextKeys(h.state, kit).some(k => k.id === 'fetch:shelf')) fail('a fetched item still offers its key');
    }

    // THE STRAIGHTEDGE, laid by hand on the strip: drag from one reading to another; tap the strip to lift it.
    const r = make();
    for (const v of [2, 6]) { r.view.dispatch({ setDial: { fixture: 'meter', dial: 'turns', value: v } }); r.view.dispatch({ run: 'meter' }); }
    const rows = r.view.sheetRows();
    if (rows.length !== 2) fail('the strip does not locate its readings');
    else {
      r.view.pointerDown(rows[0].u); r.view.pointerMove({ x: (rows[0].u.x + rows[1].u.x) / 2, y: (rows[0].u.y + rows[1].u.y) / 2 }); r.view.pointerMove(rows[1].u); r.view.pointerUp(rows[1].u);
      if (!r.state.recorder.tool || r.state.recorder.tool.through.join() !== '0,1') fail('dragging across two readings did not lay the straightedge through them');
      const empty = { x: r.state.recorder.box.at.x - 13, y: r.state.recorder.box.at.y - 7 };
      r.view.pointerDown(empty); r.view.pointerUp(empty);
      if (r.state.recorder.tool) fail('tapping the strip did not lift the straightedge');
    }
  } catch (e) {
    fail(`the view gestures faulted — ${e.stack?.split('\n').slice(0, 3).join(' ')}`);
  }
  if (failures === before) ok('pour (drag and two taps), flip (key), scale, fetch and a hand-laid straightedge reach the reducer through the shared gestures');
}

// The frame's table mode, the carry chip and the table's CSS.
{
  const before = failures;
  try {
    const ctx = { world: {}, quest: {}, stagesCleared: 0, isComplete: false, reportStage() {}, reportComplete() {}, exit() {} };
    const runner = RUNNER.createRunner(stub(), ctx, { STAGES: [FIX.TEST_STAGE], DEBRIEF: {}, blankState: () => ({}), onLoad() {} });
    runner.start();
    const fr = runner.frame;
    fr.setTableMode(true, { onStand() {}, onLean() {} });
    if (!fr.tableMode) fail('setTableMode(true) did not enter table mode');
    fr.setLeaning(false);
    fr.setCarry('Sample Shelf');
    fr.setCarry(null);
    fr.setTableMode(false);
    if (fr.tableMode) fail('setTableMode(false) did not leave table mode');
    runner.dispose();
  } catch (e) {
    fail(`the frame's table mode faulted — ${e.stack?.split('\n').slice(0, 3).join(' ')}`);
  }
  const css = readFileSync(new URL('../src/styles/learn.css', import.meta.url), 'utf8');
  const sect = css.slice(css.indexOf('TABLE MODE')).replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [...sect.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(m => ({ sel: m[1].trim(), body: m[2] }));
  const mine = rules.filter(r => /lq-t(strip|dock|msg|keys)|lq-carry|lq-stand/.test(r.sel));
  if (mine.length < 8) fail('the table-mode rules are missing from learn.css');
  for (const r of mine) {
    if (/border-radius\s*:\s*(?!0|var\(--radius-sm\))/.test(r.body)) fail(`table-mode rule "${r.sel}" rounds a corner`);
    if (/box-shadow\s*:[^;]*0 0 \d+px/.test(r.body)) fail(`table-mode rule "${r.sel}" glows`);
    if (/backdrop-filter\s*:\s*blur/.test(r.body)) fail(`table-mode rule "${r.sel}" blurs the glass`);
  }
  for (const sel of ['.lq-tstrip', '.lq-tdock', '.lq-tmsg']) {
    const hit = mine.find(r => r.sel.split(',').map(x => x.trim()).includes(sel) || r.sel.split(',').some(x => x.trim() === sel));
    const joined = mine.filter(r => r.sel.split(',').map(x => x.trim()).includes(sel)).map(r => r.body).join(' ');
    if (!hit || !/pointer-events\s*:\s*auto/.test(joined) && !/pointer-events\s*:\s*auto/.test(mine.filter(r => /\.lq-tstrip,\s*\.lq-tdock/.test(r.sel)).map(r => r.body).join(' '))) fail(`${sel} must take presses (pointer-events: auto)`);
  }
  if (failures === before) ok('the frame enters and leaves table mode (prompt strip, foot dock, carry chip); its CSS has no radius, glow or blur, and the bars take presses');
}

/* ------------------------------------------------------------------
   2. THE ORDER RAILS
   ------------------------------------------------------------------ */

console.log('\nOrder rails — drag into place, never tap in sequence\n');
const quests = allQuests();
const live = quests.filter(q => q.status === 'live');
const mods = new Map();
for (const q of live) mods.set(q.key, await q.module());

let rails = 0;
for (const q of live) {
  const mod = mods.get(q.key);
  (mod.STAGES || []).forEach((st, i) => {
    if (st.widget?.type !== 'order') return;
    rails++;
    const label = `${q.key} stage ${i + 1}`;
    const w = st.widget;
    const ids = w.items.map(o => o.id);
    const want = mod.SOLUTIONS[i].order;
    const before = failures;

    if (!same(ids.slice().sort(), want.slice().sort())) fail(`${label}: the solution is not an arrangement of the rail's pieces`);

    // Ends: plain, distinct, naming the direction, giving nothing away.
    const { first, last } = w.rail || {};
    if (!first || !last) fail(`${label}: the rail has no end labels (widget.rail.first / .last)`);
    else {
      if (first === last) fail(`${label}: both ends of the rail say "${first}"`);
      for (const text of [first, last]) {
        if (text.split(/\s+/).length > 4) fail(`${label}: the end label "${text}" is longer than four words`);
        if (/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}←-⇿➔⟶]/u.test(text)) fail(`${label}: the end label "${text}" carries a glyph`);
        for (const o of w.items) if (carries(text, o.label)) fail(`${label}: the end label "${text}" names the piece "${o.label}"`);
      }
      const prompt = wordsOf(st.prompt).join(' ');
      for (const text of [first, last]) {
        const core = wordsOf(text).filter(x => x.length > 3);
        if (core.length && !core.some(x => prompt.includes(x) || wordsOf(w.label).includes(x))) {
          fail(`${label}: the end label "${text}" shares no word with the prompt or the rail's caption, so it names something the prompt does not`);
        }
      }
    }

    // The start: a full arrangement, fixed, and never the answer.
    const blank = RUNNER.blankAnswer(st);
    if (!same(blank.order.slice().sort(), ids.slice().sort())) fail(`${label}: the rail starts with a different set of pieces than it has`);
    if (!same(blank.order, RUNNER.blankAnswer(st).order)) fail(`${label}: the rail's start is not fixed`);
    if (same(blank.order, want)) fail(`${label}: the rail STARTS as the answer`);
    if (same(blank.order, ids) && ids.length > 1) fail(`${label}: the rail starts in the declared order`);
    if (st.check(mod.stateFor(i, {})).ok) fail(`${label}: an untouched rail passes check`);

    // Markup carries every piece and both ends.
    const html = RAILVIEW.railMarkup(w, blank.order);
    for (const o of w.items) if (!html.includes(o.label.replace(/&/g, '&amp;'))) fail(`${label}: the rail does not show "${o.label}"`);
    if (first && !html.includes(first)) fail(`${label}: the rail does not show its first end`);

    // Both hands reach the answer, in the shape check() reads.
    for (const hand of ['drag', 'tap']) {
      const ctl = new RAIL.RailController(blank.order);
      let guard = 0;
      for (let k = 0; k < want.length && guard++ < 50; k++) {
        const id = want[k];
        if (ctl.order[k] === id) continue;
        if (hand === 'drag') {
          // Pieces sit 100 apart; the pointer is dropped on the boundary where gap k is.
          const others = ctl.order.filter(o => o !== id);
          const centres = others.map((_, n) => n * 100 + 50);
          ctl.dragStart(id);
          ctl.dragTo(RAIL.insertionIndex(centres, k * 100));
          ctl.dragEnd();
        } else {
          ctl.tap(id);
          if (!RAIL.gapsFor(ctl.order, id).includes(k)) { fail(`${label}: gap ${k} is not offered to a held piece`); break; }
          ctl.tapGap(k);
        }
      }
      if (!same(ctl.order, want)) fail(`${label}: by ${hand} the rail ends as ${ctl.order.join()} and not ${want.join()}`);
      const r = st.check(mod.stateFor(i, { order: ctl.order }));
      if (!r.ok) fail(`${label}: the arrangement reached by ${hand} fails check (${r.msg})`);
    }
    // The DOM widget itself, on a hand-made DOM: the same two hands, through bindRail.
    for (const hand of ['drag', 'tap']) {
      const got = driveRailWidget(w, blank.order, want, hand);
      if (!same(got.order, want)) fail(`${label}: the rail WIDGET, by ${hand}, ends as ${got.order.join()} and not ${want.join()}`);
      if (got.moves < 1) fail(`${label}: the rail widget heard no move by ${hand}`);
    }
    // Tapping the held piece again puts it down, and a no-op gap is not offered.
    {
      const ctl = new RAIL.RailController(blank.order);
      ctl.tap(ids[0]);
      ctl.tap(ids[0]);
      if (ctl.held) fail(`${label}: tapping the held piece does not put it down`);
      ctl.tap(blank.order[0]);
      if (RAIL.gapsFor(ctl.order, blank.order[0]).includes(0)) fail(`${label}: the gap a held piece already fills is offered`);
    }
    if (failures === before) ok(`${label}: starts shuffled, ends "${first}" / "${last}", dragging and two taps both reach the answer`);
  });
}
if (rails !== 14) fail(`expected 14 order stages across the built quests, found ${rails}`);
else ok(`${rails} order stages are rails`);

// The rail's pure rules.
{
  if (!same(RAIL.reorder(['a', 'b', 'c', 'd'], 'a', 2), ['b', 'c', 'a', 'd'])) fail('reorder: moving a piece to index 2 among the others');
  if (!same(RAIL.reorder(['a', 'b', 'c', 'd'], 'd', 0), ['d', 'a', 'b', 'c'])) fail('reorder: moving a piece to the front');
  if (!same(RAIL.reorder(['a', 'b'], 'a', 99), ['b', 'a'])) fail('reorder: an index past the end is the end');
  if (RAIL.insertionIndex([50, 150, 250], 120) !== 1) fail('insertionIndex');
  for (const n of [2, 3, 4, 5]) {
    const ids = Array.from({ length: n }, (_, i) => `p${i}`);
    for (const key of ['', 'x', 'y']) {
      const s = RAIL.startArrangement(ids, key);
      if (same(s, ids)) fail(`startArrangement: ${n} pieces keyed "${key}" start in declared order`);
      if (!same(s, RAIL.startArrangement(ids, key))) fail('startArrangement is not fixed');
    }
  }
  if (!failures) ok('the rail reorders, offers gaps, and always shuffles');
}

/* ------------------------------------------------------------------
   3. THE CATALOGUE STRIP
   ------------------------------------------------------------------ */

console.log('\nCatalogue board — drag filing, a strip pushes along\n');
{
  const before = failures;
  const strip = { strip: true, rows: [['#a', '#b', '#c', '#d']] };
  const file = (placed, drawer, slot, card, board = strip) => CATALOGUE.fileCard(board, placed, drawer, slot, card);
  const eq = (got, want, msg) => { if (!same(got, want)) fail(`${msg}: ${JSON.stringify(got)} != ${JSON.stringify(want)}`); };

  eq(file({ a: 'X', b: 'Y' }, ['Z'], 'b', 'Z').placed, { a: 'X', b: 'Z', c: 'Y' }, 'a card dropped on a filled slot pushes the row right');
  eq(file({ a: 'X', b: 'Y', c: 'W' }, ['Z'], 'a', 'Z').placed, { a: 'Z', b: 'X', c: 'Y', d: 'W' }, 'a drop at the head shifts the whole run');
  eq(file({ a: 'X', b: 'Y', c: 'W', d: 'V' }, ['Z'], 'c', 'Z'), { placed: { a: 'X', b: 'Y', c: 'Z', d: 'V' }, drawer: ['W'] }, 'a full strip sends the displaced card home');
  eq(file({ b: 'X', c: 'Y', d: 'W' }, ['Z'], 'd', 'Z').placed, { a: 'X', b: 'Y', c: 'W', d: 'Z' }, 'with no room to the right the row shifts left');
  eq(file({ a: 'X', b: 'Y', c: 'W' }, [], 'a', 'W').placed, { a: 'W', b: 'X', c: 'Y' }, 'a filed card dropped further along the strip is moved, not copied');
  eq(file({ a: 'X', b: 'Y' }, ['Z'], 'd', 'Z').placed, { a: 'X', b: 'Y', d: 'Z' }, 'an empty slot just takes the card');
  eq(file({ a: 'X', b: 'Y' }, ['Z'], 'b', 'Z', { rows: [['#a', '#b']] }), { placed: { a: 'X', b: 'Z' }, drawer: ['Y'] }, 'off a strip, a filled slot hands its card back to the drawer');
  eq(file({ a: 'X', b: 'Y' }, [], 'b', 'X', { rows: [['#a', '#b']] }).placed, { a: 'Y', b: 'X' }, 'off a strip, two filed cards swap');
  eq(CATALOGUE.rowSlots({ rows: [['f1', '#r1', null, '#r2'], ['#z']] }, 'r2'), ['r1', 'r2'], 'a row\'s slots, across a gap');
  // Cards are conserved.
  for (const [placed, drawer, slot, card] of [[{ a: 'X', b: 'Y', c: 'W', d: 'V' }, ['Z'], 'b', 'Z'], [{ a: 'X' }, ['Y', 'Z'], 'a', 'Y']]) {
    const r = file(placed, drawer, slot, card);
    const now = [...Object.values(r.placed), ...r.drawer].sort();
    const was = [...Object.values(placed), ...drawer].sort();
    if (!same(now, was)) fail(`filing lost or copied a card: ${now} vs ${was}`);
  }

  // The drawn board: a tap and a drag file the same cards, in the same places.
  const mod = mods.get('unit01/q3-catalogue');
  for (const [si, solved] of [[0, mod.SOLUTIONS[0].board], [2, mod.SOLUTIONS[2].board]]) {
    const st = mod.STAGES[si];
    if (!st.board.strip) fail(`unit01/q3-catalogue stage ${si + 1}: the filing strip is not declared a strip`);
    const cards = {};
    for (const id of st.drawer) cards[id] = { code: id, name: id };
    const make = () => {
      const host = { addEventListener() {}, removeEventListener() {}, set innerHTML(v) {}, querySelectorAll: () => [] };
      const b = new CATALOGUE.CatalogueBoard(host, {});
      b.setStage({ cards, board: st.board, drawer: st.drawer });
      return b;
    };
    const cell = (cat, o) => ({ dataset: { cat, ...o }, classList: { add() {}, remove() {} }, getBoundingClientRect: () => ({ left: 0, top: 0, width: 80, height: 50 }), cloneNode: () => ({ classList: { add() {} }, style: {}, remove() {} }) });
    const click = (b, el) => b.handleClick({ target: { closest: () => el } });
    const slots = Object.keys(solved);
    const want = JSON.stringify(Object.fromEntries(slots.map(s => [s, solved[s]])));

    // By tap: take the card, tap the slot.
    const byTap = make();
    for (const s of slots) { click(byTap, cell('drawer', { card: solved[s] })); click(byTap, cell('slot', { slot: s })); }
    // By drag: press the card, move past the slop, release over the slot.
    const byDrag = make();
    let under = null;
    globalThis.document.elementFromPoint = () => under;
    for (const s of slots) {
      const from = cell('drawer', { card: solved[s] });
      byDrag.dragDown({ target: { closest: () => from }, clientX: 0, clientY: 0, button: 0 });
      byDrag.dragMove({ clientX: 40, clientY: 40 });
      under = { closest: sel => (sel === '[data-slot]' ? cell('slot', { slot: s }) : null) };
      byDrag.dragUp({ type: 'pointerup', clientX: 80, clientY: 80 });
    }
    for (const [name, b] of [['tap', byTap], ['drag', byDrag]]) {
      if (JSON.stringify(Object.fromEntries(slots.map(s => [s, b.placements()[s]]))) !== want) fail(`unit01/q3-catalogue stage ${si + 1}: filing by ${name} does not reach the solution (${JSON.stringify(b.placements())})`);
      if (!st.check({ board: b.placements() }).ok) fail(`unit01/q3-catalogue stage ${si + 1}: filing by ${name} fails check`);
    }
    // A card dropped on a filled slot pushes along, by tap and by drag alike.
    const a = make();
    const b2 = make();
    const first = st.drawer[0];
    const second = st.drawer[1];
    const slot0 = slots[0];
    for (const bd of [a, b2]) { bd.held = first; bd.fileInto(slot0, first); }
    a.held = second;
    click(a, cell('slot', { slot: slot0, card: first }));
    const from2 = cell('drawer', { card: second });
    b2.dragDown({ target: { closest: () => from2 }, clientX: 0, clientY: 0, button: 0 });
    b2.dragMove({ clientX: 30, clientY: 30 });
    under = { closest: sel => (sel === '[data-slot]' ? cell('slot', { slot: slot0 }) : null) };
    b2.dragUp({ type: 'pointerup', clientX: 60, clientY: 60 });
    if (!same(a.placements(), b2.placements()) || a.placements()[slot0] !== second) fail(`unit01/q3-catalogue stage ${si + 1}: a drop on a filled slot is not the same by tap and by drag (${JSON.stringify(a.placements())} vs ${JSON.stringify(b2.placements())})`);
    if (Object.keys(a.placements()).length !== 2) fail(`unit01/q3-catalogue stage ${si + 1}: pushing the row lost a card`);
  }
  if (failures === before) ok('the strip pushes along, never loses a card, and a tap and a drag file alike');
}

/* ------------------------------------------------------------------
   4. THE LEGACY RATCHET
   ------------------------------------------------------------------ */

console.log('\nLegacy ratchet — tools/table-legacy.json\n');
{
  const before = failures;
  const legacy = JSON.parse(readFileSync(new URL('./table-legacy.json', import.meta.url), 'utf8'));
  const listed = new Set(legacy.quests);
  const built = new Set(live.map(q => q.key));
  for (const key of listed) if (!built.has(key)) fail(`table-legacy.json lists ${key}, which is not a built quest`);
  if (listed.size !== legacy.quests.length) fail('table-legacy.json lists a quest twice');
  if (JSON.stringify(legacy.quests) !== JSON.stringify(legacy.quests.slice().sort())) fail('table-legacy.json is not sorted');

  // Every table stage in every built quest is held to the pipeline's rules.
  let tables = 0;
  for (const q of live) {
    const mod = mods.get(q.key);
    const stages = mod.STAGES || [];
    const tableStages = stages.map((s, i) => [s, i]).filter(([s]) => s.widget?.type === 'table');
    for (const [st, i] of tableStages) {
      tables++;
      const misses = (mod.MISSES?.[i] ? [mod.MISSES[i]] : []).map(script => ({ script }));
      checkTableStage(`${q.key} stage ${i + 1}`, st, mod.SOLUTIONS[i], misses);
    }

    if (listed.has(q.key)) {
      if (stages.length && tableStages.length === stages.length) fail(`${q.key} is listed in table-legacy.json but every stage is a table: delete its line`);
      continue;
    }
    // Not listed: converted. At most a quarter of its stages may stay `choice`,
    // and each is a reading that cannot be built, declared as such.
    const choices = stages.filter(s => s.widget?.type === 'choice');
    const allowed = Math.floor(stages.length / 4);
    if (choices.length > allowed) fail(`${q.key} is not listed in table-legacy.json, so it is converted, but ${choices.length} of ${stages.length} stages are still choice (at most ${allowed})`);
    for (const s of choices) {
      if (s.widget.keep !== 'reading') fail(`${q.key} "${s.title}": a kept choice must be an unbuildable reading (widget.keep: 'reading'); a prediction is a table token`);
    }
    if (!tableStages.length) fail(`${q.key} is not listed in table-legacy.json but has no table stage: new quests get no line, and old ones keep theirs until converted`);
  }
  if (failures === before) ok(`${live.length} built quests: ${listed.size} unconverted (listed), ${live.length - listed.size} converted; ${tables} real table stage(s) checked`);
}

console.log(failures ? `\n${failures} PROBLEM(S) FOUND` : '\nTABLETOP OK');
process.exit(failures ? 1 : 0);
