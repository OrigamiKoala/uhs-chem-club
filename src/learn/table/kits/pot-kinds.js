/**
 * kits/pot-kinds.js — the instruments and pieces of Kettle's q8-kinds, registered on the pot kit (`pot-registry.js`).
 *
 *   THE WINDOW (fixture `kwindow`)     one reaction at a time, drawn as the atoms each side holds. Four modes, one per idea:
 *                                        pieces     what joins and what splits (synthesis, decomposition)
 *                                        proton     the hydrogen ion that passes from one molecule to another, if one does (acid-base)
 *                                        electrons  the electrons that leave one atom and arrive at another (oxidation, reduction)
 *                                        numbers    a species' atoms with the oxidation number each carries, worked from the rules
 *   THE BURNER (fixture `burner`)      a fuel jar in, a gas jar under it; "Burn" fills the jar with what burning leaves.
 *   THE GAS RIG (fixture `gasrig`)     a gas jar on a seat and four tests (glowing splint, lit splint, limewater, cold glass).
 *   THE KINDS BOARD (fixture `kboard`) reaction cards (`rxn`, tapped to light) and a "Look for" dial: the board prints, beside each
 *                                        card, the reading that kind needs (pieces in and out, oxygen, the proton, the oxidation numbers).
 *   PIECES  `rxn` a reaction card (its equation, tapped to light for the kind the dial is on), `gjar` a gas jar.
 *
 * Every reading is a planner's answer (`engine/reactdata-kinds.js`, `engine/reactdata.js`): a painter prints it and decides nothing.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { addTourText } from '../tour.js';
import { registerFixture, registerPiece } from './pot-registry.js';
import { frameOf, topOf, say, slab } from './pot-draw.js';
import { seatedIn, dialAt } from './pot-read.js';
import { contentTop } from './heat-draw.js';
import { parseEquation, parseFormula, pretty, chargeText, equationText } from '../../engine/reactdata.js';
import {
  KINDS, KIND_LABEL, GAS_TEST_ORDER, GAS_TESTS, oxNumbers, electronFlow, protonTransfer, kindsFull, oxygenOf, gasTest, burnPlan
} from '../../engine/reactdata-kinds.js';

const AMBER = PLATE_COLORS.amber;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const TEXT = PLATE_COLORS.text;

const EQ = new Map();
export const equationOf = text => { if (!EQ.has(text)) EQ.set(text, parseEquation(text)); return EQ.get(text); };
const sgn = v => (v > 0 ? `+${v}` : String(v).replace('-', '−'));

/* ------------------------------------------------------------------
   ATOMS AS DRAWN: a species is a small cluster of discs
   ------------------------------------------------------------------ */

const ATOM_INK = { H: '#d8d2c4', C: '#4a4640', O: '#a0522d', N: '#6f8fb0', Cl: '#c9b66a', Na: '#b4ab97', Mg: '#8b8576', Ca: '#cfc8b8', S: '#c9b66a', Zn: '#8a9aa6', Cu: '#b0703a', Fe: '#9aa0a6', Mn: '#8a5f8a', Ag: '#b0b6bc' };
const ATOM_R = { H: 0.5, O: 0.68, N: 0.68, C: 0.7, Cl: 0.78, Na: 0.8, Mg: 0.8, Ca: 0.85, S: 0.78, Zn: 0.8, Cu: 0.8, Fe: 0.8, Mn: 0.8, Ag: 0.85 };
const inkOfAtom = el => ATOM_INK[el] || '#b8afa0';

/** Positions (in atom spacings) of the atoms of the small molecules the bench draws; every other species is a packed cluster. */
const SKETCH = {
  H2: [['H', -0.5, 0], ['H', 0.5, 0]], O2: [['O', -0.5, 0], ['O', 0.5, 0]], N2: [['N', -0.5, 0], ['N', 0.5, 0]], Cl2: [['Cl', -0.55, 0], ['Cl', 0.55, 0]],
  HCl: [['H', -0.5, 0], ['Cl', 0.55, 0]], NaCl: [['Na', -0.55, 0], ['Cl', 0.55, 0]], CO: [['C', -0.5, 0], ['O', 0.5, 0]],
  H2O: [['O', 0, -0.35], ['H', -0.85, 0.45], ['H', 0.85, 0.45]],
  NH3: [['N', 0, -0.4], ['H', -0.95, 0.4], ['H', 0, 0.75], ['H', 0.95, 0.4]],
  CH4: [['C', 0, 0], ['H', -0.9, -0.8], ['H', 0.9, -0.8], ['H', -0.9, 0.8], ['H', 0.9, 0.8]],
  CO2: [['O', -1.1, 0], ['C', 0, 0], ['O', 1.1, 0]],
  NaOH: [['Na', -1.0, 0], ['O', 0.1, 0], ['H', 0.95, 0]],
  NH4Cl: [['N', -0.6, 0], ['H', -1.4, -0.85], ['H', -1.4, 0.85], ['H', 0.15, -1.0], ['H', 0.15, 1.0], ['Cl', 1.55, 0]]
};
const HEX = [[0, 0], [1, 0], [-1, 0], [0.5, 0.87], [-0.5, 0.87], [0.5, -0.87], [-0.5, -0.87], [1.5, 0.87], [-1.5, 0.87], [1.5, -0.87]];

/** The atoms of a species as `[element, dx, dy]` in spacings; an unlisted species is a packed cluster, atoms of one element side by side. */
export function sketchOf(formula) {
  if (SKETCH[formula]) return SKETCH[formula];
  const atoms = [];
  for (const [el, n] of Object.entries(parseFormula(formula))) for (let i = 0; i < n; i++) atoms.push(el);
  const pos = atoms.map((el, i) => [el, ...(HEX[i] || [i * 0.9, 0])]);
  const cx = pos.reduce((s, a) => s + a[1], 0) / pos.length;
  const cy = pos.reduce((s, a) => s + a[2], 0) / pos.length;
  return pos.map(([el, x, y]) => [el, x - cx, y - cy]);
}

/** Draw one species centred on (cx, cy) with `u` pixels per atom spacing. `ring` outlines the atom at that index in amber (the proton). */
function drawSpecies(ctx, formula, cx, cy, u, ring = -1) {
  const atoms = sketchOf(formula);
  atoms.forEach(([el, dx, dy], i) => {
    const r = ATOM_R[el] ? ATOM_R[el] * u * 0.62 : u * 0.45;
    ctx.fillStyle = inkOfAtom(el);
    ctx.strokeStyle = '#2e2a26';
    ctx.beginPath(); ctx.arc(cx + dx * u, cy + dy * u, r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (i === ring) {
      ctx.strokeStyle = AMBER; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(cx + dx * u, cy + dy * u, r + 2, 0, Math.PI * 2); ctx.stroke();
      ctx.lineWidth = 1;
    }
  });
}

/** Half the width a species takes, in spacings. */
const halfWidth = formula => Math.max(...sketchOf(formula).map(a => Math.abs(a[1]) + (ATOM_R[a[0]] || 0.5) * 0.62)) + 0.1;

/* ------------------------------------------------------------------
   THE WINDOW
   ------------------------------------------------------------------ */

/**
 * The window. `mode`: 'pieces' | 'proton' | 'electrons' | 'numbers'. `cases` is `[{ name, eq }]`: the dial picks one (`dialLabel` names it);
 * numbers mode uses `{ name, species, charge }` instead and has no key.
 */
export function windowFixture(id, at, { mode, cases, dialLabel = 'Pot', title = 'Window', w = 84, runLabel = 'Run', picture = 27 } = {}) {
  const dials = { pot: { min: 1, max: cases.length, step: 1, value: 1, label: dialLabel, labels: cases.map(c => c.name) } };
  const top = contentTop(1);
  const h = Math.round((top + picture + 7.5) * 10) / 10;
  return {
    id, kind: 'kwindow', label: title, at: { ...at }, size: { w, h }, dials, ...(mode === 'numbers' ? { noRun: true } : { runLabel }),
    props: { backdrop: true, mode, cases, picture, top }
  };
}

/** What the window reads for the case its dial is on. `ran` is whether Run has been pressed for it. */
export function windowRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const idx = dialAt(state, fid, 'pot') - 1;
  const c = p.cases[idx];
  const sig = `${fid}|${idx}`;
  const ran = p.mode === 'numbers' || state.recorder.rows.some(r => r.label === sig);
  if (p.mode === 'numbers') return { f, idx, c, sig, ran, numbers: oxNumbers(c.species, c.charge || 0) };
  const eq = equationOf(c.eq);
  return { f, idx, c, sig, ran, eq, proton: p.mode === 'proton' ? protonTransfer(eq) : null, flow: p.mode === 'electrons' ? electronFlow(eq) : null };
}

const runWindow = (state, fid) => { const r = windowRead(state, fid); return { x: r.idx + 1, y: 1, label: r.sig }; };

/** Draw one side of a reaction: each species `n` times side by side, a "+" between species. */
function drawSide(ctx, F, side, x0, x1, cy, mark) {
  const hws = side.map(s => halfWidth(s.f));
  let total = 0;
  side.forEach((s, i) => { total += s.n * (2 * hws[i] + 0.5) + 1.1; });
  total -= 1.1;
  const px = F.len(x1 - x0);
  const u = Math.min(F.len(2.7), px / Math.max(total, 1));
  let x = F.x(x0) + (px - total * u) / 2;
  side.forEach((s, i) => {
    const hw = hws[i];
    const groupW = s.n * (2 * hw + 0.5) * u;
    for (let k = 0; k < s.n; k++) {
      const ring = mark && mark.f === s.f && k === mark.copy ? mark.atom : -1;
      drawSpecies(ctx, s.f, x + hw * u, F.y(cy), u, ring);
      x += (2 * hw + 0.5) * u;
    }
    say(ctx, `${s.n > 1 ? `${s.n} ` : ''}${pretty(s.f)}`, x - groupW / 2 - 0.25 * u, F.y(cy + 7.2), F.size(2.1, 6.2), { align: 'center', color: DUST, weight: 600, maxW: F.len(18) });
    if (i < side.length - 1) { say(ctx, '+', x + 0.3 * u, F.y(cy), F.size(2.6, 7), { align: 'center', color: DIM }); x += 1.1 * u; }
  });
}

/** The hydrogen that moves: the first H of the donor, the last H of the product it joins. */
const donorAtom = f => sketchOf(f).findIndex(a => a[0] === 'H');
const arrivedAtom = f => { const a = sketchOf(f); for (let i = a.length - 1; i >= 0; i--) if (a[i][0] === 'H') return i; return -1; };

function paintWindow(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = windowRead(state, f.id);
  const top = topOf(f, b.lay);
  const pw = f.size.w - 5; const ph = p.picture; const px = 2.5;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(px), F.y(top), F.len(pw), F.len(ph));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(top)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  const mid = px + pw / 2;
  const cy = top + ph * 0.46;
  if (p.mode === 'numbers') { paintNumbers(ctx, F, r, px, top, pw, ph); return; }
  ctx.strokeStyle = STEEL; ctx.beginPath(); ctx.moveTo(F.x(mid), F.y(top + 1)); ctx.lineTo(F.x(mid), F.y(top + ph - 1)); ctx.stroke();
  say(ctx, 'BEFORE', F.x(px + 1.5), F.y(top + 2.2), F.size(2, 6), { color: DIM });
  say(ctx, 'AFTER', F.x(mid + 1.5), F.y(top + 2.2), F.size(2, 6), { color: DIM });
  if (p.mode === 'electrons') { paintElectrons(ctx, F, r, px, mid, pw, top, ph); return; }
  const tr = r.proton;
  const markL = tr ? { f: tr.donor, copy: 0, atom: donorAtom(tr.donor) } : null;
  const markR = tr ? { f: tr.product, copy: 0, atom: arrivedAtom(tr.product) } : null;
  drawSide(ctx, F, r.eq.lhs, px + 1, mid - 1, cy, markL);
  if (r.ran) drawSide(ctx, F, r.eq.rhs, mid + 1, px + pw - 1, cy, markR);
  else say(ctx, 'press Run', F.x(mid + pw / 4), F.y(cy), F.size(2.2, 6), { align: 'center', color: DIM });
  if (p.mode === 'proton' && r.ran && tr) say(ctx, 'amber ring: H⁺', F.x(mid), F.y(top + ph - 2.2), F.size(2.2, 6.2), { align: 'center', color: AMBER, weight: 700 });
}

function paintElectrons(ctx, F, r, px, mid, pw, top, ph) {
  const cy = top + ph * 0.46;
  const flow = r.flow;
  if (!flow) { say(ctx, 'no electrons move', F.x(mid), F.y(cy), F.size(2.4, 6.5), { align: 'center', color: DIM }); return; }
  const rows = [...flow.lost.map(x => ({ ...x, lost: true })), ...flow.gained.map(x => ({ ...x, lost: false }))];
  const slotW = (pw / 2 - 2) / rows.length;
  const dots = (x, y, n) => {
    ctx.fillStyle = AMBER;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath(); ctx.arc(x + Math.cos(a) * F.len(3.9), y + Math.sin(a) * F.len(3.9), Math.max(2, F.len(0.62)), 0, Math.PI * 2); ctx.fill();
    }
  };
  const atom = (el, charge, side, i, withDots, n) => {
    const x0 = side === 'L' ? px + 1 : mid + 1;
    const cx = F.x(x0 + slotW * (i + 0.5));
    const y = F.y(cy);
    ctx.fillStyle = inkOfAtom(el); ctx.strokeStyle = '#2e2a26';
    ctx.beginPath(); ctx.arc(cx, y, F.len(2.2), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (withDots) dots(cx, y, n);
    say(ctx, `${el}${charge ? chargeText(charge) : ''}`, cx, F.y(cy + 7.2), F.size(2.4, 6.5), { align: 'center', color: DUST, weight: 700 });
  };
  rows.forEach((x, i) => {
    if (x.lost) { atom(x.el, 0, 'L', i, true, x.electrons); if (r.ran) atom(x.el, x.toNumber, 'R', i, false, 0); }
    else { atom(x.el, x.fromNumber, 'L', i, false, 0); if (r.ran) atom(x.el, 0, 'R', i, true, x.electrons); }
  });
  if (!r.ran) say(ctx, 'press Run', F.x(mid + pw / 4), F.y(cy), F.size(2.2, 6), { align: 'center', color: DIM });
  else say(ctx, `${flow.total} electrons moved`, F.x(mid), F.y(top + ph - 2.2), F.size(2.2, 6.2), { align: 'center', color: AMBER, weight: 700 });
}

/** The numbers worked out for a species: one row per element, then what all of them add up to beside the species' charge. */
export function workedRows(species, charge = 0) {
  const nums = oxNumbers(species, charge);
  const rows = Object.entries(parseFormula(species)).map(([el, n]) => ({ el, n, on: nums[el], sum: nums[el] * n }));
  return { rows, total: rows.reduce((s, r) => s + r.sum, 0), charge };
}

function paintNumbers(ctx, F, r, px, top, pw, ph) {
  const c = r.c;
  const q = c.charge || 0;
  const wr = workedRows(c.species, q);
  drawSpecies(ctx, c.species, F.x(px + 14), F.y(top + ph * 0.42), F.len(3.2));
  say(ctx, `${pretty(c.species)}${q ? chargeText(q) : ''}`, F.x(px + 14), F.y(top + ph - 3), F.size(2.6, 7), { align: 'center', color: TEXT, weight: 700 });
  let y = top + 5;
  for (const row of wr.rows) {
    say(ctx, `${row.el}   ${row.n} × (${sgn(row.on)}) = ${sgn(row.sum)}`, F.x(px + 30), F.y(y), F.size(2.5, 6.5), { color: DUST, weight: 600, maxW: F.len(pw - 33) });
    y += 5.2;
  }
  say(ctx, `all together   ${sgn(wr.total)}`, F.x(px + 30), F.y(y + 0.8), F.size(2.6, 7), { color: AMBER, weight: 700, maxW: F.len(pw - 33) });
  say(ctx, `charge of the species   ${sgn(q)}`, F.x(px + 30), F.y(y + 6.2), F.size(2.2, 6), { color: DIM, maxW: F.len(pw - 33) });
}

registerFixture('kwindow', { paint: paintWindow, run: runWindow });

/* ------------------------------------------------------------------
   THE GAS JAR, THE BURNER AND THE RIG
   ------------------------------------------------------------------ */

export const GJAR_RECT = Object.freeze({ hw: 8.5, hh: 6.6 });

/** A jar of gas. `gas` is the formulas it holds (kept off the face); `label` is what the jar says ("Sample A"); an empty jar fills when the burner is run. */
export const gjar = (id, label, at, { gas = [], empty = false } = {}, extra = {}) => ({
  id, kind: 'gjar', label, at, props: { gas: [...gas], ...(empty ? { empty: true } : { filled: true }) }, ...extra
});

function paintGjar(ctx, p, state, o) {
  const box = slab(ctx, o, GJAR_RECT, '#1d1a16');
  const sc = o.sc;
  const bx = o.x - 3.4 * sc; const by = box.y0 + 1.6 * sc; const bw = 6.8 * sc; const bh = 4.4 * sc;
  ctx.strokeStyle = DUST; ctx.lineWidth = 1;
  ctx.strokeRect(Math.round(bx) + 0.5, Math.round(by) + 0.5, Math.round(bw), Math.round(bh));
  if (p.props.filled) { ctx.fillStyle = '#8a948a'; ctx.globalAlpha = 0.28; ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2); ctx.globalAlpha = 1; }
  ctx.fillStyle = STEEL; ctx.fillRect(bx - 0.4 * sc, by - 0.9 * sc, bw + 0.8 * sc, 0.9 * sc);
  say(ctx, p.label, o.x, box.y0 + box.h - 5.1 * sc, Math.max(6.2, 1.95 * sc), { align: 'center', weight: 700, maxW: box.w - 1.4 * sc });
  say(ctx, p.props.empty ? 'empty' : 'gas', o.x, box.y0 + box.h - 2.6 * sc, Math.max(5.8, 1.8 * sc), { align: 'center', color: DUST, maxW: box.w - 1.4 * sc });
}

registerPiece('gjar', {
  kind: { r: 7, rect: GJAR_RECT, nojoin: true },
  paint: paintGjar,
  faceKey: p => `gjar|${p.label}|${p.props.filled ? 1 : 0}|${p.props.empty ? 1 : 0}`,
  printed: p => String(p.label)
});

const SEAT = { w: 18, h: 13 };

/** The burner: a seat for the fuel jar, a seat for an empty gas jar, and a key that burns the fuel in plenty of oxygen. */
export function burnerFixture(id, at, { title = 'Burner', runLabel = 'Burn', w = 54 } = {}) {
  const h = 34;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const fuel = `${id}.fuel`; const out = `${id}.out`;
  return {
    fixture: { id, kind: 'burner', label: title, at: { ...at }, size: { w, h }, dials: {}, runLabel, props: { backdrop: true, fuel, out } },
    slots: [
      { id: fuel, label: ' ', at: { x: x0 + 12, y: y0 + 11 }, size: { ...SEAT } },
      { id: out, label: ' ', at: { x: x0 + w - 12, y: y0 + 11 }, size: { ...SEAT } }
    ],
    fuelSlot: fuel, outSlot: out, size: { w, h }
  };
}

/** The burner's reading: the fuel and the gas jar on it, what burning that fuel makes, and whether the jar has been filled by this fuel. */
export function burnerRead(state, fid) {
  const p = state.fixtures[fid].props;
  const fuel = seatedIn(state, p.fuel);
  const out = seatedIn(state, p.out);
  const plan = fuel?.props.species ? burnPlan(fuel.props.species) : null;
  const ran = Boolean(out && out.props.filled && fuel && out.props.burntFrom === fuel.id);
  return { fuel, out, plan, ran };
}

function paintBurner(ctx, f, state, b) {
  const F = frameOf(b);
  const r = burnerRead(state, f.id);
  const w = f.size.w;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(2.5), F.y(20), F.len(w - 5), F.len(7));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(2.5)) + 0.5, Math.round(F.y(20)) + 0.5, Math.round(F.len(w - 5)), Math.round(F.len(7)));
  say(ctx, r.ran ? 'BURNT' : r.fuel ? 'READY' : 'NO FUEL', F.x(w / 2), F.y(23.5), F.size(2.8, 7), { align: 'center', color: r.ran ? AMBER : DIM, weight: 700 });
  say(ctx, 'SUPPLIED: oxygen', F.x(3.5), F.y(f.size.h - 7.2), F.size(1.9, 5.8), { color: DIM });
}

function runBurner(state, fid) {
  const r = burnerRead(state, fid);
  if (!r.fuel) return { noop: 'Put a fuel jar on the burner first.' };
  if (!r.out || !r.out.props.empty) return { noop: 'Put an empty gas jar on the right-hand seat to catch what is made.' };
  return { x: 1, y: 1, label: `${fid}|${r.fuel.id}`, stamp: { [r.out.id]: { gas: r.plan.gases.slice(), filled: true, empty: false, burntFrom: r.fuel.id } } };
}

registerFixture('burner', { paint: paintBurner, run: runBurner });

/** The gas rig: a seat for a gas jar, a "Test" dial over the four tests, and a key that runs the test the dial is on. */
export function gasrigFixture(id, at, { title = 'Gas tests', runLabel = 'Test', w = 62 } = {}) {
  const dials = { test: { min: 1, max: GAS_TEST_ORDER.length, step: 1, value: 1, label: 'Test', labels: GAS_TEST_ORDER.map(k => GAS_TESTS[k].label) } };
  const top = contentTop(1);
  const h = Math.round((top + 26 + 7.5) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const seat = `${id}.seat`;
  return {
    fixture: { id, kind: 'gasrig', label: title, at: { ...at }, size: { w, h }, dials, runLabel, props: { backdrop: true, seat, top } },
    slot: { id: seat, label: ' ', at: { x: x0 + 12, y: y0 + top + 9 }, size: { ...SEAT } },
    slotId: seat, size: { w, h }
  };
}

/** What each test has shown for the jar on the rig: `shown[test]` is the result once that test was run on this jar, else null. */
export function rigRead(state, fid) {
  const f = state.fixtures[fid];
  const jar = seatedIn(state, f.props.seat);
  const testKey = GAS_TEST_ORDER[dialAt(state, fid, 'test') - 1];
  const shown = {};
  for (const t of GAS_TEST_ORDER) {
    const done = jar && state.recorder.rows.some(r => r.label === `${fid}|${jar.id}|${t}`);
    shown[t] = done ? gasTest(jar.props.gas, t) : null;
  }
  return { f, jar, testKey, shown };
}

function paintRig(ctx, f, state, b) {
  const F = frameOf(b);
  const r = rigRead(state, f.id);
  const top = topOf(f, b.lay);
  const w = f.size.w;
  let y = top + 4.2;
  for (const t of GAS_TEST_ORDER) {
    const cur = t === r.testKey;
    const res = r.shown[t];
    say(ctx, GAS_TESTS[t].label, F.x(25), F.y(y), F.size(2.1, 6.2), { color: cur ? TEXT : DUST, weight: cur ? 700 : 500 });
    say(ctx, res ? res.text : '—', F.x(w - 2.5), F.y(y), F.size(2.1, 6.2), { align: 'right', color: res ? AMBER : DIM, weight: 700, maxW: F.len(14) });
    y += 5.6;
  }
}

function runRig(state, fid) {
  const r = rigRead(state, fid);
  if (!r.jar) return { noop: 'Put a gas jar on the seat first.' };
  if (r.jar.props.empty) return { noop: 'The jar is empty: burn something into it first.' };
  return { x: dialAt(state, fid, 'test'), y: 1, label: `${fid}|${r.jar.id}|${r.testKey}` };
}

registerFixture('gasrig', { paint: paintRig, run: runRig });

/* ------------------------------------------------------------------
   REACTION CARDS AND THE KINDS BOARD
   ------------------------------------------------------------------ */

export const RXN_RECT = Object.freeze({ hw: 25.5, hh: 2.95 });

/** A reaction card: its equation (states and all). Tapped, it lights for the kind the board's dial is on. */
export const rxn = (id, eqText, at, extra = {}) => ({
  id, kind: 'rxn', label: equationText(equationOf(eqText)), at, props: { eq: eqText, markable: true, marks: {} }, ...extra
});

function paintRxn(ctx, p, state, o) {
  const lit = Boolean(p.props.flipped);
  const box = slab(ctx, { ...o, lit }, RXN_RECT, lit ? '#33290f' : '#2a2620');
  say(ctx, p.label, o.x, o.y, Math.max(6, 1.95 * o.sc), { align: 'center', weight: 600, maxW: box.w - 2.4 * o.sc, color: lit ? AMBER : TEXT });
}

registerPiece('rxn', {
  kind: { r: 7, rect: RXN_RECT, nojoin: true },
  paint: paintRxn,
  faceKey: p => `rxn|${p.label}|${p.props.flipped ? 1 : 0}`,
  printed: p => String(p.label)
});

/** The kinds board: a "Look for" dial over the five kinds, and a reading printed beside each card for the kind the dial is on. `rows` is `[{card, y}]`. */
export function kboardFixture(id, at, { rows, title = 'Kinds board', w = 62, h = 60 } = {}) {
  const dials = { look: { min: 1, max: KINDS.length, step: 1, value: 1, label: 'Look for', labels: KINDS.map(k => KIND_LABEL[k]) } };
  return { id, kind: 'kboard', label: title, at: { ...at }, size: { w, h }, dials, noRun: true, props: { backdrop: true, rows: rows.map(r => ({ ...r })) } };
}

/** The kind the board is looking for, and each card's marks (kind: bool), reconciled with the card's light as it stands. */
export function boardRead(state) {
  const f = Object.values(state.fixtures).find(x => x.kind === 'kboard');
  if (!f) return null;
  const look = KINDS[dialAt(state, f.id, 'look') - 1];
  const cards = Object.values(state.pieces).filter(p => p.kind === 'rxn');
  const marks = {};
  for (const c of cards) marks[c.id] = { ...(c.props.marks || {}), ...(c.props.atKind === look ? { [look]: Boolean(c.props.flipped) } : {}) };
  return { f, look, cards, marks };
}

/** The reading the board prints for a kind beside one reaction (raw: counts, the oxygen, the hydrogen ion, the oxidation numbers). */
export function readingFor(kind, eq) {
  if (kind === 'synthesis' || kind === 'decomposition') return `${eq.lhs.length} in, ${eq.rhs.length} out`;
  if (kind === 'combustion') { const o = oxygenOf(eq); return o === 'used' ? 'O₂ goes in' : o === 'made' ? 'O₂ comes out' : 'no O₂'; }
  if (kind === 'acid-base') { const t = protonTransfer(eq); return t ? `H⁺: ${pretty(t.donor)} to ${pretty(t.acceptor)}` : 'no H⁺ moves'; }
  const seen = [];
  for (const s of [...eq.lhs, ...eq.rhs]) for (const el of Object.keys(oxNumbers(s.f) || {})) if (!seen.includes(el)) seen.push(el);
  return seen.map(el => {
    const side = list => [...new Set(list.map(s => oxNumbers(s.f)?.[el]).filter(v => v != null))].map(sgn).join('/');
    return `${el} ${side(eq.lhs)}→${side(eq.rhs)}`;
  }).join('  ');
}

function paintBoard(ctx, f, state, b) {
  const F = frameOf(b);
  const bd = boardRead(state);
  const top = f.at.y - f.size.h / 2;
  const w = f.size.w;
  for (const row of f.props.rows) {
    const d = row.y - top;
    ctx.fillStyle = '#100f0c';
    ctx.fillRect(F.x(1.5), F.y(d - 2.95), F.len(w - 3), F.len(5.9));
    const eq = equationOf(state.pieces[row.card].props.eq);
    const lit = bd.marks[row.card]?.[bd.look];
    say(ctx, readingFor(bd.look, eq), F.x(3), F.y(d), F.size(2.1, 6.2), { color: lit ? AMBER : DUST, weight: 600, maxW: F.len(w - 6) });
  }
}

/** Keep what is lit for each kind: the board's dial and the cards' light stay in step (`flip` only knows one light per card). */
function settleKinds(state) {
  const board = Object.values(state.fixtures).find(x => x.kind === 'kboard');
  if (!board) return;
  const look = KINDS[dialAt(state, board.id, 'look') - 1];
  for (const c of Object.values(state.pieces)) {
    if (c.kind !== 'rxn') continue;
    const marks = c.props.marks || (c.props.marks = {});
    if (c.props.atKind === look) marks[look] = Boolean(c.props.flipped);
    else { c.props.atKind = look; c.props.flipped = Boolean(marks[look]); }
  }
}

registerFixture('kboard', { paint: paintBoard, settle: settleKinds });

/* ------------------------------------------------------------------
   ANSWERS: what the table says, read by the quest
   ------------------------------------------------------------------ */

/** The kinds the player lit on each card: `{ cardId: Set(kinds) }`. */
export function filedKinds(state) {
  const bd = boardRead(state);
  const out = {};
  if (!bd) return out;
  for (const c of bd.cards) out[c.id] = new Set(Object.entries(bd.marks[c.id]).filter(([, v]) => v).map(([k]) => k));
  return out;
}

/** The kinds a card truly belongs to, from the planner. */
export const kindsOfCard = card => kindsFull(equationOf(card.props.eq));

export { KINDS, KIND_LABEL };

/* ------------------------------------------------------------------
   TOUR WORDS
   ------------------------------------------------------------------ */

const WINDOW_TEXT = {
  pieces: 'The "{dial}" dial picks which pot to look at. Press "{run}" and the atoms are shown as they stand before the reaction on the left and after it on the right. A name under each group says which substance it is, and a number in front says how many of them there are.',
  proton: 'The "{dial}" dial picks which pot to look at. Press "{run}" and the atoms are shown before the reaction on the left and after it on the right. A hydrogen ion is a hydrogen atom that has lost its electron: when one passes from a molecule to another, the window rings it in amber.',
  electrons: 'The "{dial}" dial picks which pot to look at. Press "{run}" and the atoms are shown before the reaction on the left and after it on the right. Amber dots are electrons, and a charge printed after a symbol is what that atom holds.',
  numbers: 'The "{dial}" dial picks a species that has already been worked out. The window draws its atoms, shows the number each kind of atom carries, and adds them up beside the charge of the species.'
};

addTourText({
  'pot:kwindow': {
    title: 'Window', dials: false,
    text: f => WINDOW_TEXT[f.props.mode].replace('{dial}', f.dials.pot.label).replace('{run}', f.runLabel || 'Run')
  },
  'pot:burner': { title: 'Burner', dials: false, text: 'Put the fuel jar on the left seat and an empty gas jar on the right seat. Press "Burn" to burn the fuel in oxygen that the burner supplies. The gas jar fills with whatever the burning leaves.' },
  'pot:gasrig': {
    title: 'Gas tests', dials: false,
    text: 'Put a gas jar on the seat. The "Test" dial picks glowing splint, lit splint, limewater or cold glass; press "Test" to try it in the jar. The result stays printed beside the test, so you can compare all four.'
  },
  'pot:kboard': {
    title: 'Kinds board', dials: false,
    text: 'The "Look for" dial picks a kind of reaction. Beside each reaction card, the board prints the reading that kind depends on. Tap a card to light it when its reaction belongs to the kind the dial is on; the board remembers which cards are lit for each kind.'
  }
}, {
  rxn: ['Reaction cards', 'Each card is one reaction written as an equation, with the state of each substance in brackets: (s) solid, (l) liquid, (g) gas, (aq) dissolved in water. Tap a card to light it, and tap again to put the light out.'],
  gjar: ['Gas jars', 'Each jar holds a gas. A jar that says "empty" fills when the burner is run over it. Drag a jar onto the gas test seat to try a test in it.']
});
