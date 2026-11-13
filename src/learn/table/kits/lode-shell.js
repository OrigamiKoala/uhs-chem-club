/**
 * kits/lode-shell.js — Lodestone's electron instruments (unit12, q1-dblock and q2-charges).
 *
 *   dshell   an energy ladder of one fourth-row atom's outer orbitals: one 4s orbital and the five of 3d, each a box that holds up to two
 *            electrons. In `build` mode a tap adds an electron (a third tap empties the box); in `remove` mode a tap takes one away and
 *            the two levels glide with the charge the player has made (3d drops below 4s once the atom is an ion); in `show` mode it only
 *            shows the element card laid on it and, with `ions`, that element's common ions. "Test Energy" shows which electrons could
 *            sit lower and where they would go (`lodedata.testEnergy`).
 *   iestrip  successive ionization energies, one bar per electron removed by "Remove an Electron", coloured by the subshell it left
 *            (shown leaving the small ladder beside the bars); a tap on the gap between two bars marks where the cost jumps.
 *   lchoice  the answer a player gives by tapping an instrument (`props.pick` on the instrument): a hidden dial and its words.
 *
 * Pure painters of the table state and `b.clock`. Every number is `lodedata.js`'s.
 */

import { registerFixture, registerPiece } from './lode-registry.js';
import { C, frameOf, say, title, orbital, glide, since, paintPick, fixed, ionName, signed } from './lode-draw.js';
import { ELEMENTS, IE, COMMON_IONS, ionOf, removalOrder, shellLevels, PAIR_ATOM, testEnergy, fillLevel, unpaired, total } from '../../engine/lodedata.js';

/* ================================================================== dshell */

const BOXES = 6; // b0 = 4s, b1..b5 = 3d
const LEVELS_OF = [0, 1, 1, 1, 1, 1];

/** The occupation of a fourth-row atom as measured (4s, then the 3d boxes filled one each, then pairs). */
const cap = t => `${t[0].toUpperCase()}${t.slice(1)}`;
export const atomOcc = el => { const e = ELEMENTS[el]; return [e.s, ...fillLevel(5, e.d)]; };

/**
 * The ladder. `mode` 'build' | 'remove' | 'show'; `el` the element (or null until a card is laid on it, with `load`); `test` adds the
 * "Test Energy" key; `ions` (show mode) lists the element's common ions beside it; `hideCount` hides the count line.
 * Returns `{ fixture, slot }` (`slot` only with `load`: a card laid in it loads that atom).
 */
export function dshellFixture(id, at, { mode = 'build', el = null, start = null, test = false, load = false, ions = false, title: ttl = 'Energy ladder', w = null, h = 52, hideCount = false, slotAt = null } = {}) {
  const width = w ?? (100 + (ions ? 40 : 0));
  const occ = start || (el && mode !== 'build' ? atomOcc(el) : new Array(BOXES).fill(0));
  const dials = {};
  for (let i = 0; i < BOXES; i++) dials[`b${i}`] = { min: 0, max: 2, step: 1, value: occ[i], label: i ? `3d ${i}` : '4s' };
  const slotId = `${id}.card`;
  const x0 = at.x - width / 2; const y0 = at.y - h / 2;
  const fixture = {
    id, kind: 'dshell', label: ttl, at: { ...at }, size: { w: width, h }, dials,
    ...(test ? { runLabel: 'Test Energy' } : { noRun: true }),
    props: { mode, el, hidden: Object.keys(dials), load: load ? slotId : null, ions, hideCount, test: null, loadedFrom: null, startOcc: occ.slice() }
  };
  return { fixture, slot: load ? { id: slotId, label: 'Load an atom', at: slotAt ? { ...slotAt } : { x: x0 - 11, y: y0 + h / 2 + 2 }, size: { w: 18, h: 13 } } : null, slotId: load ? slotId : null };
}

const occOf = f => Array.from({ length: BOXES }, (_, i) => Math.round(f.dials[`b${i}`]?.value ?? 0));
const seated = (state, slot) => (slot ? Object.values(state.pieces).find(p => !p.hidden && p.zone === `slot:${slot}`) || null : null);

/** What the ladder holds: its element, the boxes, the counts, the charge it stands at. */
export function dshellRead(state, id) {
  const f = state.fixtures[id];
  const occ = occOf(f);
  const el = f.props.el;
  const n = total(occ);
  const full = el ? ELEMENTS[el].s + ELEMENTS[el].d : null;
  return { el, occ, s: occ[0], d: occ.slice(1).reduce((a, b) => a + b, 0), n, charge: full == null ? null : full - n, unpaired: unpaired(occ), test: f.props.test };
}

const levelsAt = (f, charge) => (f.props.mode === 'remove' ? shellLevels(charge) : shellLevels(0, { fixed: 0 }));

function geometry(f) {
  const lx = 2;
  const k = Math.min(1.45, Math.max(1, (f.size.w - (f.props.ions ? 40 : 0)) / 76));
  const top = 6.5 * k;
  const bottom = f.size.h - (f.props.test || f.props.mode === 'remove' ? 10 : 7);
  const bx = lx + 9 * k; const bw = 8 * k; const gap = 1.6 * k; const bh = 6.5 * k;
  const eY = e => bottom - bh - ((e + 0.8) / 2.0) * (bottom - bh - top);
  return { k, lx, top, bottom, bx, bw, gap, bh, eY, boxX: i => (i === 0 ? bx : bx + 14 * k + (i - 1) * (bw + gap)) };
}

function paintDshell(ctx, f, state, b) {
  const F = frameOf(b);
  const r = dshellRead(state, f.id);
  const g = geometry(f);
  title(ctx, f, F, b);
  if (!r.el && f.props.load) {
    say(ctx, 'No atom loaded', F.x(g.bx), F.y(f.size.h / 2), F.size(2.1, 6.5), { color: C.dim });
    return;
  }
  const charge = r.charge ?? 0;
  const shownCharge = glide(`${f.id}:q`, b, charge, f.props.mode === 'remove' ? charge : 0, 1.2);
  const L = levelsAt(f, shownCharge);
  // The energy arrow up the left side.
  ctx.strokeStyle = C.steel; ctx.fillStyle = C.steel;
  const ax = F.x(g.lx + 1.4);
  ctx.beginPath(); ctx.moveTo(ax, F.y(g.bottom)); ctx.lineTo(ax, F.y(g.top)); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ax, F.y(g.top) - 3); ctx.lineTo(ax - 3, F.y(g.top) + 3); ctx.lineTo(ax + 3, F.y(g.top) + 3); ctx.closePath(); ctx.fill();
  say(ctx, 'Energy', F.x(g.lx + 2.6), F.y(g.top + 0.8), F.size(1.9 * g.k, 6.5), { color: C.steel, weight: 600 });
  const test = f.props.test && f.props.test.key === r.occ.join() ? f.props.test : null;
  for (let i = 0; i < BOXES; i++) {
    const lv = L[LEVELS_OF[i]];
    const y = g.eY(lv.e);
    orbital(ctx, F, g.boxX(i), y, g.bw, g.bh, r.occ[i], { colour: i ? C.d3 : C.s4, lit: Boolean(test && test.moves.some(m => m.from === i || m.to === i)) });
  }
  // Level names, left of their first box.
  say(ctx, '4s', F.x(g.bx - 1), F.y(g.eY(L[0].e) + g.bh / 2), F.size(2.4 * g.k, 7), { align: 'right', color: C.s4, weight: 700 });
  say(ctx, '3d', F.x(g.boxX(1) - 1), F.y(g.eY(L[1].e) + g.bh / 2), F.size(2.4 * g.k, 7), { align: 'right', color: C.d3, weight: 700 });
  // The moves Test Energy found: an electron that could sit lower, drawn travelling from its box to where it would go.
  if (test && !test.lowest) {
    const ph = ((b.clock || 0) % 1.6) / 1.6;
    for (const m of test.moves) {
      const a = { x: g.boxX(m.from) + g.bw / 2, y: g.eY(L[LEVELS_OF[m.from]].e) + g.bh / 2 };
      const z = { x: g.boxX(m.to) + g.bw / 2, y: g.eY(L[LEVELS_OF[m.to]].e) + g.bh / 2 };
      ctx.strokeStyle = C.amber; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(F.x(a.x), F.y(a.y)); ctx.quadraticCurveTo(F.x((a.x + z.x) / 2), F.y(Math.min(a.y, z.y) - 3), F.x(z.x), F.y(z.y)); ctx.stroke();
      ctx.setLineDash([]); ctx.lineWidth = 1;
      const t = ph; const mx = (1 - t) * (1 - t) * a.x + 2 * (1 - t) * t * ((a.x + z.x) / 2) + t * t * z.x;
      const my = (1 - t) * (1 - t) * a.y + 2 * (1 - t) * t * (Math.min(a.y, z.y) - 3) + t * t * z.y;
      ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.x(mx), F.y(my), Math.max(2, F.len(0.6)), 0, Math.PI * 2); ctx.fill();
    }
  }
  // The count line (top right): what the player has made.
  const right = F.x(f.size.w - 2.2);
  if (!f.props.hideCount) {
    const nm = cap(ELEMENTS[r.el].name);
    const line = f.props.mode === 'remove' ? `${nm}: charge ${signed(charge)}` : f.props.mode === 'build' ? `Electrons: ${r.n} of ${ELEMENTS[r.el].s + ELEMENTS[r.el].d}` : `${nm}${ELEMENTS[r.el].exception ? ' (an exception)' : ''}`;
    say(ctx, line, right, F.y(3.2), F.size(2.6, 8), { align: 'right', color: C.text, weight: 600, maxW: F.len(f.size.w * 0.45) });
  }
  // The result of the last test, while the boxes are as they were tested.
  if (test) {
    const words = test.lowest ? 'Lowest energy' : `${test.moves.length} electron${test.moves.length > 1 ? 's' : ''} can move lower`;
    const runW = Math.max(9, 'Test Energy'.length * 1.9 + 3);
    say(ctx, words, F.x(g.lx + 1), F.y(f.size.h - 3.6), F.size(2.0, 6.5), { color: test.lowest ? C.phosphor : C.amber, weight: 600, maxW: F.len(f.size.w - runW - 6 - g.lx) });
  }
  if (f.props.ions && r.el) paintIons(ctx, f, F, r.el);
}

/** The common ions of the element on the ladder, one row each: its 4s box and five 3d boxes, as measured. */
function paintIons(ctx, f, F, el) {
  const x0 = f.size.w - 40; const qs = COMMON_IONS[el] || [];
  say(ctx, 'Its ions', F.x(x0), F.y(8), F.size(1.9, 6.2), { color: C.dust, weight: 600 });
  qs.forEach((q, k) => {
    const io = ionOf(el, q);
    const y = 11.5 + k * 10.5;
    say(ctx, ionName(el, q), F.x(x0), F.y(y + 2.2), F.size(2.2, 7), { color: C.text, weight: 700, sans: true });
    orbital(ctx, F, x0 + 8, y, 4, 4.4, io.s, { colour: C.s4 });
    fillLevel(5, io.d).forEach((n, i) => orbital(ctx, F, x0 + 13.5 + i * 4.6, y, 4, 4.4, n, { colour: C.d3 }));
    if (k === qs.length - 1) {
      say(ctx, '4s', F.x(x0 + 10), F.y(y + 6.6), F.size(1.7, 5.5), { align: 'center', color: C.s4 });
      say(ctx, '3d', F.x(x0 + 24.5), F.y(y + 6.6), F.size(1.7, 5.5), { align: 'center', color: C.d3 });
    }
  });
}

function dshellTaps(f, state) {
  if (f.props.mode === 'show') return [];
  if (f.props.load && !f.props.el) return [];
  const g = geometry(f);
  const out = [];
  for (let i = 0; i < BOXES; i++) {
    // A whole column is the box's place to tap: the levels glide with the charge, the columns never move.
    const x = g.boxX(i);
    if (f.props.mode === 'remove') out.push({ x0: x - 0.4, x1: x + g.bw + 0.4, y0: g.top - 1, y1: g.bottom + 0.5, dial: `b${i}`, step: -1 });
    else out.push({ x0: x - 0.4, x1: x + g.bw + 0.4, y0: g.top - 1, y1: g.bottom + 0.5, dial: `b${i}`, step: 1, wrap: true });
  }
  return out;
}

function runDshell(state, fid) {
  const f = state.fixtures[fid];
  const r = dshellRead(state, fid);
  if (!r.el) return null;
  const t = testEnergy(levelsAt(f, r.charge ?? 0), r.occ, PAIR_ATOM);
  f.props.test = { key: r.occ.join(), lowest: t.lowest, moves: t.moves, seq: (f.props.test?.seq || 0) + 1 };
  return { stamp: {} };
}

/** A card laid in the ladder's slot loads its atom (once per card); a ladder whose card is taken away empties. */
function settleDshell(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'dshell' || !f.props.load) continue;
    const card = seated(state, f.props.load);
    const id = card?.id || null;
    if (id === f.props.loadedFrom) continue;
    f.props.loadedFrom = id;
    f.props.el = card ? card.props.el : null;
    const occ = card ? atomOcc(card.props.el) : new Array(BOXES).fill(0);
    occ.forEach((v, i) => { f.dials[`b${i}`].value = v; });
    f.props.test = null;
  }
}

registerFixture('dshell', { paint: paintDshell, run: runDshell, tapZones: dshellTaps, settle: settleDshell, live: () => true });

/* ================================================================== iestrip */

/**
 * The strip. `el` and `q0` (the charge it starts at); `n` electrons it can remove; `sealed` hides the element's name; `scale` the top of the
 * bars (kJ/mol); `mark` adds the taps between bars that mark where the cost jumps.
 */
export function iestripFixture(id, at, { el, q0 = 0, n = 8, sealed = false, scale = 20000, mark = true, title: ttl = null, w = 78, h = 40 } = {}) {
  const dials = mark ? { mark: { min: 0, max: n - 1, step: 1, value: 0, label: 'Jump' } } : {};
  return {
    id, kind: 'iestrip', label: ttl || (sealed ? 'Sealed strip' : `${ELEMENTS[el].name[0].toUpperCase()}${ELEMENTS[el].name.slice(1)}${q0 ? `, starting as ${ionName(el, q0)}` : ''}`),
    at: { ...at }, size: { w, h }, dials, runLabel: 'Remove an Electron',
    props: { el, q0, n, sealed, scale, hidden: Object.keys(dials), removed: 0 }
  };
}

export function iestripRead(state, id) {
  const f = state.fixtures[id];
  const p = f.props;
  const costs = IE[p.el].slice(p.q0, p.q0 + p.removed);
  return { el: p.el, removed: p.removed, costs, mark: Math.round(f.dials.mark?.value ?? 0), from: removalOrder(p.el, p.q0, p.n).slice(0, p.removed) };
}

const stripGeom = f => {
  const lk = Math.min(1.5, Math.max(1, f.size.h / 36));
  const top = 8; const bottom = f.size.h - 9;
  const bx0 = 6 + 22 * lk; const bx1 = f.size.w - 2.5;
  const bw = (bx1 - bx0) / f.props.n;
  return { lk, top, bottom, bx0, bx1, bw };
};

/** The small ladder: 3p (three boxes, inner), 4s, 3d, with the electrons left after `removed`. Pairs go first from 3d. */
function ladderLeft(el, q0, removed) {
  const e = ELEMENTS[el];
  let s = e.s; const d = fillLevel(5, e.d); const p = [2, 2, 2];
  const take = () => {
    if (s) { s--; return; }
    const pair = d.findIndex(v => v === 2);
    if (pair >= 0) { d[pair]--; return; }
    for (let i = 4; i >= 0; i--) if (d[i]) { d[i]--; return; }
    for (let i = 2; i >= 0; i--) if (p[i]) { p[i]--; return; }
  };
  for (let i = 0; i < q0 + removed; i++) take();
  return { s, d, p };
}

function paintStrip(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = iestripRead(state, f.id);
  const g = stripGeom(f);
  title(ctx, f, F, b);
  // The small ladder: what is left in the atom or ion.
  const left = ladderLeft(p.el, p.q0, p.removed);
  const lx = 2.5; const lk = g.lk; const bs = 3.1 * lk; const pitch = 3.6 * lk; const bhh = 3.8 * lk;
  const yD = 9 * lk; const yS = yD + 7 * lk; const yP = f.size.h - 15;
  // A sealed strip shows no ladder: the atom's own electrons would name it.
  if (p.sealed) {
    say(ctx, 'The atom is sealed:', F.x(lx), F.y(yS - 2), F.size(1.9, 6), { color: C.dim });
    say(ctx, 'only the costs are shown', F.x(lx), F.y(yS + 2), F.size(1.9, 6), { color: C.dim });
  } else {
    say(ctx, '3d', F.x(lx), F.y(yD + bhh / 2), F.size(2.1 * lk, 6.5), { color: C.d3, weight: 700 });
    left.d.forEach((v, i) => orbital(ctx, F, lx + 4.2 * lk + i * pitch, yD, bs, bhh, v, { colour: C.d3 }));
    say(ctx, '4s', F.x(lx), F.y(yS + bhh / 2), F.size(2.1 * lk, 6.5), { color: C.s4, weight: 700 });
    orbital(ctx, F, lx + 4.2 * lk, yS, bs, bhh, left.s, { colour: C.s4 });
    say(ctx, '3p', F.x(lx), F.y(yP + bhh / 2), F.size(2.1 * lk, 6.5), { color: C.p3, weight: 700 });
    left.p.forEach((v, i) => orbital(ctx, F, lx + 4.2 * lk + i * pitch, yP, bs, bhh, v, { colour: C.p3 }));
    say(ctx, 'inner shell', F.x(lx), F.y(yP + bhh + 2.2), F.size(1.8, 6), { color: C.p3 });
  }
  // The electron just removed, rising out of the ladder.
  glide(`${f.id}:rm`, b, 0, p.removed, 0.8);
  const k = since(`${f.id}:rm`, b);
  if (p.removed && k < 1.2 && !p.sealed) {
    const sub = r.from[p.removed - 1];
    const y0 = sub === '3d' ? yD : sub === '4s' ? yS : yP;
    const t = Math.min(1, k / 1.2);
    ctx.globalAlpha = 1 - t;
    ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(F.x(lx + 12 * lk + t * 8), F.y(y0 - t * 6), Math.max(2.2, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }
  // The axis and the bars.
  ctx.strokeStyle = C.steel;
  ctx.beginPath(); ctx.moveTo(F.x(g.bx0 - 1), F.y(g.top)); ctx.lineTo(F.x(g.bx0 - 1), F.y(g.bottom)); ctx.lineTo(F.x(g.bx1), F.y(g.bottom)); ctx.stroke();
  say(ctx, 'kJ/mol', F.x(g.bx0 - 1.5), F.y(g.top - 2.4), F.size(1.9, 6), { color: C.steel });
  const H = g.bottom - g.top - 3;
  r.costs.forEach((v, i) => {
    const sub = r.from[i];
    const hh = Math.max(0.6, (v / p.scale) * H);
    const x = g.bx0 + i * g.bw + g.bw * 0.15;
    const grow = i === p.removed - 1 ? Math.min(1, k / 0.6) : 1;
    ctx.fillStyle = p.sealed ? C.dust : sub === '3p' ? C.p3 : sub === '4s' ? C.s4 : C.d3;
    ctx.fillRect(F.x(x), F.y(g.bottom - hh * grow), F.len(g.bw * 0.7), F.len(hh * grow));
    if (grow >= 1) say(ctx, Math.round(v).toLocaleString('en-US'), F.x(x + g.bw * 0.35), F.y(g.bottom - hh - 1.6), F.size(Math.min(2.2, g.bw * 0.24), 5.5), { align: 'center', color: C.text, maxW: F.len(g.bw * 1.0) });
    say(ctx, String(i + 1), F.x(x + g.bw * 0.35), F.y(g.bottom + 2), F.size(2, 6), { align: 'center', color: C.dust });
  });
  say(ctx, 'electron removed', F.x(g.bx0), F.y(g.bottom + 5), F.size(1.9, 6), { color: C.dust });
  if (!r.removed) say(ctx, 'Press "Remove an Electron"', F.x((g.bx0 + g.bx1) / 2), F.y((g.top + g.bottom) / 2), F.size(1.9, 6.2), { align: 'center', color: C.dim });
  // The mark: where the player says the cost jumps.
  if (r.mark > 0) {
    const x = g.bx0 + r.mark * g.bw;
    ctx.strokeStyle = C.amber; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
    ctx.beginPath(); ctx.moveTo(F.x(x), F.y(g.top)); ctx.lineTo(F.x(x), F.y(g.bottom)); ctx.stroke();
    ctx.setLineDash([]); ctx.lineWidth = 1;
    say(ctx, 'jump', F.x(x), F.y(g.top - 1.6), F.size(1.6, 6), { align: 'center', color: C.amber, weight: 700 });
  }
  paintPick(ctx, f, state, b);
}

function stripTaps(f) {
  if (!f.dials.mark) return [];
  const g = stripGeom(f);
  const out = [];
  for (let k = 1; k < f.props.n; k++) {
    const x = g.bx0 + k * g.bw;
    out.push({ x0: x - g.bw * 0.5, x1: x + g.bw * 0.5, y0: g.top, y1: g.bottom, dial: 'mark', value: k });
  }
  return out;
}

function runStrip(state, fid) {
  const f = state.fixtures[fid];
  if (f.props.removed >= f.props.n) return { noop: 'Every electron this strip can take has been removed.' };
  f.props.removed += 1;
  return { stamp: {} };
}

registerFixture('iestrip', { paint: paintStrip, run: runStrip, tapZones: stripTaps, live: () => true });

/* ================================================================== lchoice */

/** The answer given by tapping an instrument: a hidden dial (`value`), its options' words, and a blank start. */
export function lchoiceFixture(id, label, at, { options, w = 44, list = false } = {}) {
  const h = list ? 7 + options.length * 7 : 9;
  // A list is tapped where it stands: each option is a row that sets the answer.
  const taps = list ? options.map((_, i) => ({ x0: 1, x1: w - 1, y0: 5.5 + i * 7, y1: 11.5 + i * 7, dial: 'value', value: i + 1 })) : undefined;
  return {
    id, kind: 'lchoice', label, at: { ...at }, size: { w, h }, noRun: true,
    dials: { value: { min: 0, max: options.length, step: 1, value: 0, label: 'Chosen' } },
    props: { options, hidden: ['value'], list, ...(taps ? { taps } : {}) }
  };
}
export const chosen = (state, id) => { const v = Math.round(state.fixtures[id]?.dials?.value?.value ?? 0); return v ? state.fixtures[id].props.options[v - 1] : null; };
export const pickOf = (fx, value, target = 'pick') => ({ ...fx, props: { ...fx.props, pick: { fixture: target, dial: 'value', value } } });

function paintChoice(ctx, f, state, b) {
  const F = frameOf(b);
  const text = chosen(state, f.id);
  if (f.props.list) {
    say(ctx, f.label, F.x(2), F.y(3), F.size(2.1, 6.5), { color: C.dust, weight: 600, maxW: F.len(f.size.w - 4) });
    f.props.options.forEach((o, i) => {
      const on = o === text;
      ctx.strokeStyle = on ? C.amber : C.steel; ctx.lineWidth = on ? 2 : 1;
      ctx.strokeRect(Math.round(F.x(1.2)) + 0.5, Math.round(F.y(5.8 + i * 7)) + 0.5, Math.round(F.len(f.size.w - 2.4)), Math.round(F.len(5.6)));
      ctx.lineWidth = 1;
      say(ctx, o, F.x(2.6), F.y(8.6 + i * 7), F.size(2.2, 7), { color: on ? C.amber : C.text, weight: on ? 700 : 500, maxW: F.len(f.size.w - 5) });
    });
    return;
  }
  say(ctx, f.label, F.x(2), F.y(2.8), F.size(1.9, 6.2), { color: C.dust, maxW: F.len(f.size.w - 4) });
  say(ctx, text || 'Tap your choice', F.x(2), F.y(6.4), F.size(2.3, 7), { color: text ? C.amber : C.dim, weight: 700, maxW: F.len(f.size.w - 4) });
}
registerFixture('lchoice', { paint: paintChoice });

/* ================================================================== element cards */

export const ELEM_RECT = Object.freeze({ hw: 6.2, hh: 5 });
export const elemCard = (id, el, at, extra = {}) => ({ id, kind: 'elem', label: el, at: { ...at }, props: { el }, ...extra });

registerPiece('elem', {
  kind: { r: 6.2, rect: ELEM_RECT },
  paint(ctx, p, state, o) {
    const { x, y, sc, lit } = o;
    const w = ELEM_RECT.hw * 2 * sc; const h = ELEM_RECT.hh * 2 * sc;
    ctx.fillStyle = '#2a2620'; ctx.fillRect(x - w / 2, y - h / 2, w, h);
    ctx.strokeStyle = lit ? C.amber : C.dust; ctx.lineWidth = lit ? 2 : 1; ctx.strokeRect(x - w / 2 + 0.5, y - h / 2 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
    say(ctx, p.props.el, x, y - h * 0.12, Math.max(9, 4.2 * sc), { align: 'center', weight: 700, sans: true });
    say(ctx, ELEMENTS[p.props.el].name, x, y + h * 0.3, Math.max(6, 1.7 * sc), { align: 'center', color: C.dust, maxW: w - 4 });
  },
  faceKey: p => `elem:${p.props.el}`,
  printed: p => p.props.el
});

export { fixed };
