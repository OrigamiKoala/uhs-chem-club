/**
 * kits/cell-supply.js — the supply bench, registered on the cell kit (`cell-registry.js`). Brinewire's `q6-electrolysis`.
 *
 *   SUPPLY   one fixture kind, `cellsupply`, with a `scene` for each cell the bench drives:
 *              zncu     the zinc–copper cell wired to a supply (a voltage setting and where the supply pushes electrons)
 *              melt     molten sodium chloride between two electrodes, each under a collector
 *              plate    a plating cell with a balance under the plate: a run (current and time) and the mass the plate gained;
 *                       with `counter` a coulomb counter, with `half` the half-reaction printed under the cell
 *              water    water with a little sulfuric acid driven by cell packs seated in series; the collectors show gas once the
 *                       chain's voltage is enough
 *              compare  water and brine on one supply, four collectors, a seat under each for a gas card
 *              weigh    a plated cell and a balance with a seat for the sealed plate (no Run key)
 *   PACK     a zinc–copper cell on a bar, seated in the chain (`cellsupplypack`)
 *   PLATE    a plate on a bar, seated on the balance (`cellsupplyplate`)
 *
 * A THIN WRAPPER over `engine/celldata.js` and `engine/celldata-electrolysis.js`: a painter decides nothing. The key records which
 * settings have been run in a hidden bitmask (`seen`) and the last one (`last`); every reading is recomputed from the planner for the
 * settings it names. Flat, like the board; each beaker stands in a low glass dish at `3D On`.
 */

import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { roundedSlab } from '../../engine/table-props.js';
import { registerFixture, registerPiece } from './cell-registry.js';
import { frameOf, topOf } from './matter-draw.js';
import { seatedIn } from './heat-read.js';
import { METALS, WATER_BACK_VOLTAGE, cellE0, fmt } from '../../engine/celldata.js';
import { driveZnCu, platingRun, waterRun, compareRun, MELT_BACK_VOLTAGE, RUN_SECONDS } from '../../engine/celldata-electrolysis.js';
import { put, METAL_INK } from './cell-board.js';
import { voltText } from './cell-read.js';
import './cell-supply-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;
const GREEN = '#78a142';

const mg = g => `${fmt(g * 1000, 1)} mg`;
const A = v => `${fmt(v, 2)} A`;

/* ------------------------------------------------------------------ what the bench reads */

/** The combination of settings a scene is at now (an index into `props.combos`), or -1 when there is nothing to run. */
export function comboNow(state, f) {
  const p = f.props;
  const d = n => Math.round(f.dials[n]?.value ?? 1);
  switch (p.scene) {
    case 'zncu': return (d('v') - 1) * 2 + (d('dir') - 1);
    case 'melt': return d('dir') - 1;
    case 'plate': return p.runs ? d('sel') - 1 : (d('cur') - 1) * p.times.length + (d('time') - 1);
    case 'water': return packsIn(state, f).length;
    case 'compare': return 0;
    default: return -1;
  }
}

/** The cell packs seated in a water scene's chain, in seat order. */
export const packsIn = (state, f) => (f.props.chain || []).map(id => seatedIn(state, id)).filter(Boolean);

/** What the scene gives for a combination (the planner's answer). */
export function resultOf(f, c) {
  const p = f.props;
  const x = p.combos?.[c];
  switch (p.scene) {
    case 'zncu': return { ...driveZnCu(x.Vs, x.dir), ...x };
    case 'melt': return { ...x, goes: p.Vs > MELT_BACK_VOLTAGE };
    case 'plate': return { ...x, ...platingRun(p.metal, x.I, x.t) };
    case 'water': return waterRun(c);
    case 'compare': return compareRun(p.I, p.t);
    default: return null;
  }
}

/** The bench's state: every setting run so far (each a row with its result) and the last one. */
export function supplyRead(state, fid) {
  const f = state.fixtures[fid];
  const seen = Math.round(f.dials.seen?.value ?? 0);
  const last = Math.round(f.dials.last?.value ?? 0);
  const rows = [];
  const n = f.props.scene === 'water' ? 4 : (f.props.combos || []).length;
  for (let c = 0; c < n; c++) if (seen & (1 << c)) rows.push({ c, ...resultOf(f, c) });
  const now = last ? { c: last - 1, ...resultOf(f, last - 1) } : null;
  return { f, scene: f.props.scene, rows, now, packs: f.props.scene === 'water' ? packsIn(state, f).length : null, plate: f.props.scene === 'weigh' ? seatedIn(state, f.props.seat) : null };
}

/** The mass change of the plate on a `weigh` bench, in grams (the planner's answer for the cell and the time printed on it). */
export function weighGrams(f) { return platingRun(f.props.metal, f.props.I, f.props.t).g; }

/* ------------------------------------------------------------------ small drawing helpers */

function cup(ctx, F, x, y, w, h, liquid) {
  ctx.fillStyle = liquid; ctx.fillRect(F.x(x + 0.5), F.y(y + h * 0.3), F.len(w - 1), F.len(h * 0.7 - 0.5));
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y)); ctx.stroke();
  ctx.lineWidth = 1;
}
function bar(ctx, F, x, y, w, h, ink) { ctx.fillStyle = ink; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h)); }
function wire(ctx, F, pts) {
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.2, F.len(0.3)); ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(F.x(x), F.y(y)) : ctx.moveTo(F.x(x), F.y(y)))); ctx.stroke(); ctx.lineWidth = 1;
}
function panel(ctx, F, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(h)));
}
/** A collector tube standing over an electrode: a glass tube, with gas filling it from the top down to `frac` of its length. */
function tube(ctx, F, x, y, w, h, frac, ink) {
  if (frac > 0) { ctx.fillStyle = ink; ctx.fillRect(F.x(x + 0.4), F.y(y + 0.4), F.len(w - 0.8), F.len((h - 0.4) * Math.min(1, frac))); }
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.2, F.len(0.3));
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y + h)); ctx.lineTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x + w), F.y(y)); ctx.lineTo(F.x(x + w), F.y(y + h)); ctx.stroke();
  ctx.lineWidth = 1;
}
const size = (F, k, min) => F.size(k, min);

/* ------------------------------------------------------------------ the scenes */

function paintZnCu(ctx, f, state, b, F, r, T) {
  const p = f.props; const w = f.size.w;
  const cy = T + 14; const cw = 12; const ch = 12;
  const lx = 6; const rx = w - 6 - cw;
  cup(ctx, F, lx, cy, cw, ch, '#2f4a47'); cup(ctx, F, rx, cy, cw, ch, '#2f4a47');
  bar(ctx, F, lx + cw / 2 - 1.2, cy - 5, 2.4, ch * 0.9 + 5, METAL_INK.zn);
  bar(ctx, F, rx + cw / 2 - 1.2, cy - 5, 2.4, ch * 0.9 + 5, METAL_INK.cu);
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(2, F.len(0.9));
  ctx.beginPath(); ctx.moveTo(F.x(lx + cw - 2), F.y(cy + ch * 0.5)); ctx.lineTo(F.x(lx + cw - 2), F.y(cy - 1)); ctx.lineTo(F.x(rx + 2), F.y(cy - 1)); ctx.lineTo(F.x(rx + 2), F.y(cy + ch * 0.5)); ctx.stroke(); ctx.lineWidth = 1;
  const bx = w / 2 - 13; const by = T + 1.5; const bw = 26; const bh = 9;
  wire(ctx, F, [[lx + cw / 2, cy - 5], [lx + cw / 2, by + bh / 2], [bx, by + bh / 2]]);
  wire(ctx, F, [[rx + cw / 2, cy - 5], [rx + cw / 2, by + bh / 2], [bx + bw, by + bh / 2]]);
  panel(ctx, F, bx, by, bw, bh);
  put(ctx, 'Supply, current', F.x(bx + bw / 2), F.y(by + 2.4), size(F, 1.9, 5.6), { color: DUST });
  put(ctx, r.now ? A(r.now.I) : '—', F.x(bx + bw / 2), F.y(by + 6.2), size(F, 3.4, 8), { color: r.now ? AMBER : DIM, weight: 700, maxW: F.len(bw - 2) });
  put(ctx, 'Zn', F.x(lx + cw / 2), F.y(cy + ch + 2.6), size(F, 2.8, 7), { color: TEXT, weight: 700 });
  put(ctx, 'Cu', F.x(rx + cw / 2), F.y(cy + ch + 2.6), size(F, 2.8, 7), { color: TEXT, weight: 700 });
  put(ctx, 'Zn²⁺ 1.00 M', F.x(lx + cw / 2), F.y(cy + ch + 5.8), size(F, 1.9, 5.6), { color: DUST, maxW: F.len(cw + 10) });
  put(ctx, 'Cu²⁺ 1.00 M', F.x(rx + cw / 2), F.y(cy + ch + 5.8), size(F, 1.9, 5.6), { color: DUST, maxW: F.len(cw + 10) });
  if (r.now) {
    const word = x => (x < 0 ? `lost ${mg(-x)}` : `gained ${mg(x)}`);
    put(ctx, `Zinc strip ${word(r.now.zn)}`, F.x(lx), F.y(cy + ch + 11), size(F, 2.3, 6.4), { align: 'left', color: AMBER, weight: 700 });
    put(ctx, `Copper strip ${word(r.now.cu)}`, F.x(w - 4), F.y(cy + ch + 11), size(F, 2.3, 6.4), { align: 'right', color: AMBER, weight: 700 });
  }
  put(ctx, `Each run lasts ${RUN_SECONDS} s`, F.x(3), F.y(f.size.h - 3.6), size(F, 2.1, 6), { align: 'left', color: DUST });
}

function paintMelt(ctx, f, state, b, F, r, T) {
  const w = f.size.w; const c = w / 2;
  const sodiumLeft = r.now?.into === 'left';
  const top = T + 22;
  ctx.fillStyle = '#6a4a2c';
  ctx.beginPath(); ctx.moveTo(F.x(c - 22), F.y(top)); ctx.lineTo(F.x(c + 22), F.y(top)); ctx.lineTo(F.x(c + 15), F.y(T + 36)); ctx.lineTo(F.x(c - 15), F.y(T + 36)); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.6, F.len(0.5));
  ctx.beginPath(); ctx.moveTo(F.x(c - 23), F.y(top - 2)); ctx.lineTo(F.x(c - 15), F.y(T + 37)); ctx.lineTo(F.x(c + 15), F.y(T + 37)); ctx.lineTo(F.x(c + 23), F.y(top - 2)); ctx.stroke(); ctx.lineWidth = 1;
  put(ctx, 'Molten sodium chloride', F.x(c), F.y(T + 30), size(F, 2.0, 5.8), { color: '#e8d9c0', maxW: F.len(36) });
  [['left', c - 12], ['right', c + 12]].forEach(([side, x]) => {
    bar(ctx, F, x - 1.2, T + 3, 2.4, 29, '#8f8b84');
    const chlorine = r.now && r.now.goes && (sodiumLeft ? side === 'right' : side === 'left');
    tube(ctx, F, x - 4.5, T + 4, 9, 17, chlorine ? 1 : 0, '#9fb04a');
    if (r.now && r.now.goes && !chlorine) {
      for (let i = 0; i < 5; i++) { ctx.fillStyle = '#d9d6cf'; ctx.beginPath(); ctx.arc(F.x(x - 5 + i * 2.5), F.y(top + 0.4 + (i % 2) * 1.6), Math.max(1.5, F.len(0.9)), 0, Math.PI * 2); ctx.fill(); }
    }
  });
  put(ctx, 'Left electrode', F.x(4), F.y(T + 41), size(F, 2.3, 6.4), { align: 'left', color: TEXT, weight: 700 });
  put(ctx, 'Right electrode', F.x(w - 4), F.y(T + 41), size(F, 2.3, 6.4), { align: 'right', color: TEXT, weight: 700 });
  if (r.now) {
    const what = side => (!r.now.goes ? 'nothing forms' : ((r.now.into === side) ? 'silvery liquid' : 'pale green gas'));
    put(ctx, what('left'), F.x(4), F.y(T + 45), size(F, 2.3, 6.4), { align: 'left', color: AMBER, weight: 700 });
    put(ctx, what('right'), F.x(w - 4), F.y(T + 45), size(F, 2.3, 6.4), { align: 'right', color: AMBER, weight: 700 });
  }
  put(ctx, `Supply ${fmt(f.props.Vs, 1)} V`, F.x(3), F.y(f.size.h - 3.6), size(F, 2.3, 6.4), { align: 'left', color: DUST });
}

function paintPlate(ctx, f, state, b, F, r, T) {
  const p = f.props; const w = f.size.w; const m = METALS[p.metal];
  const by = T + 5;
  cup(ctx, F, 6, by, 30, 16, '#3a4a55');
  bar(ctx, F, 13, by - 4, 3.6, 18, METAL_INK[p.metal]);
  bar(ctx, F, 27, by - 4, 3.6, 18, '#8a8780');
  put(ctx, `${m.name[0].toUpperCase()}${m.name.slice(1)} bar`, F.x(14.8), F.y(by + 20), size(F, 1.9, 5.6), { color: TEXT, maxW: F.len(15) });
  put(ctx, 'Plate', F.x(28.8), F.y(by + 20), size(F, 1.9, 5.6), { color: TEXT });
  put(ctx, p.solution, F.x(21), F.y(by + 24), size(F, 1.9, 5.6), { color: DUST, maxW: F.len(40) });
  if (p.half) put(ctx, p.half, F.x(21), F.y(by + 28), size(F, 2.3, 6.4), { color: DUST, maxW: F.len(40) });
  const x0 = 48;
  put(ctx, 'Plate gained', F.x(x0), F.y(T + 3), size(F, 2.3, 6.4), { align: 'left', color: DUST, weight: 700 });
  r.rows.forEach((row, i) => {
    const y = T + 8 + i * 3.8;
    put(ctx, row.label, F.x(x0), F.y(y), size(F, 2.3, 6.4), { align: 'left', color: TEXT });
    put(ctx, mg(row.g), F.x(w - 3), F.y(y), size(F, 2.5, 6.8), { align: 'right', color: AMBER, weight: 700 });
  });
  if (p.counter) {
    put(ctx, 'Charge passed', F.x(x0), F.y(T + 8 + (p.combos.length) * 3.8 + 2), size(F, 2.3, 6.4), { align: 'left', color: DUST, weight: 700 });
    put(ctx, r.now ? `${fmt(r.now.q, 0)} C` : '—', F.x(w - 3), F.y(T + 8 + (p.combos.length) * 3.8 + 2), size(F, 2.5, 6.8), { align: 'right', color: r.now ? AMBER : DIM, weight: 700 });
  }
}

function paintWater(ctx, f, state, b, F, r, T) {
  const p = f.props; const w = f.size.w;
  put(ctx, `Chain ${r.packs ? `${voltText(r.packs * cellE0('cu', 'zn'))} V` : '—'}`, F.x(4), F.y(T + 19), size(F, 3.0, 7.5), { align: 'left', color: r.packs ? AMBER : DIM, weight: 700 });
  if (r.now && r.now.goes) put(ctx, `Current ${A(r.now.I)}`, F.x(36), F.y(T + 19), size(F, 2.5, 6.8), { align: 'left', color: AMBER, weight: 700 });
  const bx = w - 38;
  cup(ctx, F, bx, T + 14, 26, 14, '#3a4a55');
  [[bx + 7, 'h2'], [bx + 19, 'o2']].forEach(([x, key]) => {
    bar(ctx, F, x - 1, T + 5, 2, 20, '#8f8b84');
    const mL = r.now && r.now.goes ? r.now[key] : 0;
    tube(ctx, F, x - 3.2, T + 4, 6.4, 13, mL / 10, '#c9c3b4');
    put(ctx, r.now ? `${fmt(mL, 1)} mL` : '', F.x(x), F.y(T + 31), size(F, 2.2, 6.2), { color: AMBER, weight: 700, maxW: F.len(13) });
  });
  put(ctx, 'Model: gas forms once the voltage is high enough', F.x(4), F.y(f.size.h - 7.8), size(F, 1.9, 5.6), { align: 'left', color: DUST, maxW: F.len(bx - 8) });
  put(ctx, 'Cell: water with a little sulfuric acid', F.x(4), F.y(f.size.h - 3.6), size(F, 1.9, 5.6), { align: 'left', color: DUST, maxW: F.len(bx - 8) });
}

const GAS_LOOK = { 'H₂': ['#c9c3b4', 'burns with a pop'], 'O₂': ['#c9c3b4', 'relights a splint'], 'Cl₂': ['#9fb04a', 'pale green, bleaches'] };

function paintCompare(ctx, f, state, b, F, r, T) {
  const p = f.props;
  const cells = [['water', 3, 'Water with a little sulfuric acid'], ['brine', 62, 'Brine (sodium chloride solution)']];
  cells.forEach(([key, ox, title]) => {
    put(ctx, title, F.x(ox), F.y(T + 5), size(F, 2.1, 6), { align: 'left', color: DUST, weight: 700, maxW: F.len(56) });
    cup(ctx, F, ox + 2, T + 22, 50, 12, key === 'water' ? '#3a4a55' : '#34494a');
    ['cathode', 'anode'].forEach((role, i) => {
      const x = ox + 14 + i * 26;
      bar(ctx, F, x - 1, T + 12, 2, 20, '#8f8b84');
      const g = r.now ? r.now[key][role] : null;
      const look = g ? GAS_LOOK[g.gas] : null;
      tube(ctx, F, x - 4, T + 9, 8, 13, g ? Math.min(1, g.mL / 8) : 0, look ? look[0] : '#c9c3b4');
      if (g) {
        put(ctx, `${fmt(g.mL, 1)} mL`, F.x(x), F.y(T + 39), size(F, 2.3, 6.4), { color: AMBER, weight: 700, maxW: F.len(24) });
        put(ctx, look[1], F.x(x), F.y(T + 43), size(F, 1.9, 5.6), { color: DUST, maxW: F.len(25) });
      }
    });
  });
  put(ctx, `Supply 3.0 V, ${fmt(p.I, 2)} A, ${p.t} s`, F.x(3), F.y(f.size.h - 3.6), size(F, 2.1, 6), { align: 'left', color: DUST });
}

function paintWeigh(ctx, f, state, b, F, r, T) {
  const p = f.props; const w = f.size.w; const m = METALS[p.metal];
  // The balance: a pan under the seat and a reading that exists only while a plate stands on it.
  ctx.fillStyle = '#4a463e'; ctx.fillRect(F.x(8), F.y(T + 28), F.len(34), F.len(2.4));
  put(ctx, 'Balance', F.x(8), F.y(T + 4), size(F, 2.3, 6.4), { align: 'left', color: DUST, weight: 700 });
  panel(ctx, F, 8, T + 33, 34, 10);
  put(ctx, 'Mass gained', F.x(10), F.y(T + 36), size(F, 1.9, 5.6), { align: 'left', color: DUST });
  put(ctx, r.plate ? `${fmt(weighGrams(f), 3)} g` : '—', F.x(25), F.y(T + 40), size(F, 3.6, 8.5), { color: r.plate ? AMBER : DIM, weight: 700, maxW: F.len(30) });
  // The cell the plate was plated in, and the time it was plated for.
  cup(ctx, F, 56, T + 8, 30, 16, '#3a4a55');
  bar(ctx, F, 63, T + 4, 3.6, 18, METAL_INK[p.metal]);
  bar(ctx, F, 77, T + 4, 3.6, 18, '#8a8780');
  put(ctx, `${m.name[0].toUpperCase()}${m.name.slice(1)} bar`, F.x(64.8), F.y(T + 28), size(F, 1.9, 5.6), { color: TEXT });
  put(ctx, 'Plate X', F.x(78.8), F.y(T + 28), size(F, 1.9, 5.6), { color: TEXT });
  put(ctx, p.solution, F.x(71), F.y(T + 32), size(F, 1.9, 5.6), { color: DUST, maxW: F.len(42) });
  put(ctx, p.half, F.x(71), F.y(T + 36), size(F, 2.3, 6.4), { color: DUST, maxW: F.len(42) });
  panel(ctx, F, 54, T + 39, 36, 6);
  put(ctx, `Plated for ${fmt(p.t / 60, 1)} min`, F.x(72), F.y(T + 42), size(F, 2.4, 6.6), { color: AMBER, weight: 700, maxW: F.len(34) });
}

function paintSupply(ctx, f, state, b) {
  const F = frameOf(b);
  const r = supplyRead(state, f.id);
  const T = topOf(f, b.lay);
  ({ zncu: paintZnCu, melt: paintMelt, plate: paintPlate, water: paintWater, compare: paintCompare, weigh: paintWeigh })[f.props.scene](ctx, f, state, b, F, r, T);
}

/* ------------------------------------------------------------------ the key */

/** The key records the settings that were run and the last one; the reading is the planner's, so it is the same for the same settings. */
function run(state, fid) {
  const f = state.fixtures[fid];
  const c = comboNow(state, f);
  if (c < 0) return null;
  if (f.props.scene === 'water' && c === 0) return { noop: 'no cell is seated in the chain' };
  const r = resultOf(f, c);
  const seen = Math.round(f.dials.seen?.value ?? 0) | (1 << c);
  return { x: c + 1, y: Math.round((r.g ?? r.I ?? r.q ?? 0) * 1000) / 1000, label: fid, dials: { [fid]: { last: c + 1, seen } } };
}

/* ------------------------------------------------------------------ 3D: low glass dishes round the beakers */

function dressSupply(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const group = new T.Group();
  const H = 0.026; const t = 0.005;
  const wall = (cx, cy, lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  for (const cp of f.props.cups || []) {
    const w = cp.w * s; const d = cp.h * s;
    const cx = box.x0 + cp.x + cp.w / 2; const cy = box.y0 + cp.y + cp.h / 2;
    wall(cx, cy, w + 2 * t, t, 0, -d / 2 - t / 2);
    wall(cx, cy, w + 2 * t, t, 0, d / 2 + t / 2);
    wall(cx, cy, t, d, -w / 2 - t / 2, 0);
    wall(cx, cy, t, d, w / 2 + t / 2, 0);
  }
  return group;
}

registerFixture('cellsupply', { paint: paintSupply, run, dress3d: dressSupply });

/* ------------------------------------------------------------------ the builder */

const dial = (label, labels) => ({ min: 1, max: labels.length, step: 1, value: 1, label, labels });
const HIDDEN = { last: { min: 0, max: 8, step: 1, value: 0, label: 'Last run' }, seen: { min: 0, max: 255, step: 1, value: 0, label: 'Runs' } };
const r1 = v => Math.round(v * 10) / 10;

/**
 * A supply bench. `scene` is one of 'zncu', 'melt', 'plate', 'water', 'compare', 'weigh'. Options by scene:
 *   plate    metal ('ag'|'cu'), solution (text), runs ([{I,t}] on one dial) or currents + times (two dials), counter, half
 *   weigh    metal, solution, half, I and t (the cell and the time the sealed plate was plated for)
 *   melt     Vs (the supply voltage)
 *   water    cells (the seats in the chain)
 *   compare  I, t
 * Returns `{ fixture, slots, size }`; the stage adds the `slots` to its zones.
 */
export function supplyFixture(id, at, scene, o = {}) {
  let w; let h; let dials = {}; let props = {}; let combos = []; const slots = []; let noRun = false; let cups = [];
  const label = o.title ?? 'Supply bench';
  if (scene === 'zncu') {
    w = 104; h = 70;
    dials = { v: dial('Supply voltage', ['0.5 V', '1.5 V']), dir: dial('Electrons sent into', ['zinc strip', 'copper strip']) };
    combos = [{ Vs: 0.5, dir: 'zn' }, { Vs: 0.5, dir: 'cu' }, { Vs: 1.5, dir: 'zn' }, { Vs: 1.5, dir: 'cu' }];
    const cy = 18.2 + 14;
    cups = [{ x: 6, y: cy, w: 12, h: 12 }, { x: w - 18, y: cy, w: 12, h: 12 }];
  } else if (scene === 'melt') {
    w = 100; h = 66;
    dials = { dir: dial('Electrons sent into', ['left electrode', 'right electrode']) };
    combos = [{ into: 'left' }, { into: 'right' }];
    props = { Vs: o.Vs ?? 6 };
    cups = [{ x: w / 2 - 22, y: 13.2 + 22, w: 44, h: 14 }];
  } else if (scene === 'plate') {
    const two = !o.runs;
    w = 100; h = two ? 62 : 55;
    if (o.runs) {
      dials = { sel: dial('Run', o.runs.map(r => `${r.I} A for ${r.t} s`)) };
      combos = o.runs.map(r => ({ I: r.I, t: r.t, label: `${r.I} A, ${r.t} s` }));
    } else {
      dials = { cur: dial('Current', o.currents.map(v => A(v))), time: dial('Time', o.times.map(t => `${t} s`)) };
      for (const I of o.currents) for (const t of o.times) combos.push({ I, t, label: `${A(I)}, ${t} s` });
    }
    props = { metal: o.metal, solution: o.solution, half: o.half || null, counter: !!o.counter, runs: !!o.runs, times: o.times || null };
    cups = [{ x: 6, y: (two ? 18.2 : 13.2) + 5, w: 30, h: 16 }];
  } else if (scene === 'water') {
    w = 116; h = 52;
    const n = o.cells ?? 3;
    const x0 = at.x - w / 2; const y0 = at.y - h / 2;
    for (let i = 1; i <= n; i++) slots.push({ id: `${id}.k${i}`, label: ' ', at: { x: x0 + 14 + (i - 1) * 22, y: y0 + 19 }, size: { w: 20, h: 9 } });
    props = { chain: slots.map(s => s.id) };
    combos = Array.from({ length: n + 1 }, (_, k) => ({ k }));
    cups = [{ x: w - 38, y: 24, w: 26, h: 14 }];
  } else if (scene === 'compare') {
    w = 120; h = 76;
    const x0 = at.x - w / 2; const y0 = at.y - h / 2;
    [17, 43, 76, 102].forEach((cx, i) => slots.push({ id: `${id}.t${i + 1}`, label: ' ', at: { x: x0 + cx, y: y0 + 63 }, size: { w: 22, h: 8 } }));
    props = { I: o.I ?? 0.5, t: o.t ?? 60 };
    combos = [{}];
    cups = [{ x: 5, y: 32, w: 50, h: 12 }, { x: 64, y: 32, w: 50, h: 12 }];
  } else if (scene === 'weigh') {
    w = 100; h = 56; noRun = true;
    const x0 = at.x - w / 2; const y0 = at.y - h / 2;
    const seat = { id: `${id}.pan`, label: ' ', at: { x: x0 + 25, y: y0 + 10 + 22 }, size: { w: 26, h: 10 } };
    slots.push(seat);
    props = { seat: seat.id, metal: o.metal, solution: o.solution, half: o.half, I: o.I, t: o.t };
    cups = [{ x: 56, y: 18, w: 30, h: 16 }];
  } else throw new Error(`supplyFixture: unknown scene ${scene}`);
  return {
    fixture: {
      id, kind: 'cellsupply', label, at: { ...at }, size: { w, h }, ...(noRun ? { noRun: true } : { runLabel: 'Run' }),
      dials: noRun ? { ...HIDDEN } : { ...dials, ...HIDDEN },
      props: { hidden: ['last', 'seen'], backdrop: true, scene, combos, cups, ...props, ...(o.extra || {}) }
    },
    slots,
    size: { w, h }
  };
}

/* ------------------------------------------------------------------ the pieces */

const BAR = { hw: 8.6, hh: 3.7 };
function paintBarPiece(ctx, p, state, o) {
  const sc = o.sc;
  const x0 = o.x - BAR.hw * sc; const y0 = o.y - BAR.hh * sc; const w = BAR.hw * 2 * sc; const h = BAR.hh * 2 * sc;
  ctx.fillStyle = p.props.ink; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : STEEL; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  put(ctx, p.label, o.x, o.y, Math.max(8, Math.min(3.0 * sc, (w - 1.4 * sc) / (Math.max(2, p.label.length) * 0.6))), { color: '#16140f', weight: 700, maxW: w - 1.2 * sc });
}
const INK_MATS = new WeakMap();
function inkMaterial(mats, ink) {
  let byInk = INK_MATS.get(mats);
  if (!byInk) { byInk = new Map(); INK_MATS.set(mats, byInk); }
  if (!byInk.has(ink)) { const m = mats.labSteel.clone(); m.color = new THREE.Color(ink); byInk.set(ink, m); }
  return byInk.get(ink);
}
function pieceBar3d(p, state, c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const H = 0.018;
  const body = new THREE.Mesh(roundedSlab(hw * 2, hh * 2, H, Math.min(hw, hh) * 0.2, 0.002), inkMaterial(m, p.props.ink));
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.92, hh * 2 * 0.8), c.face());
  face.rotation.x = -Math.PI / 2; face.position.y = H + 0.0012; face.receiveShadow = true; g.add(face);
  g.userData.height = H + 0.002;
  return g;
}
for (const kind of ['cellsupplypack', 'cellsupplyplate']) {
  registerPiece(kind, {
    kind: { r: 8.6, rect: BAR, nojoin: true },
    paint: paintBarPiece,
    faceKey: p => `${kind}|${p.label}|${p.props.ink}`,
    piece3d: pieceBar3d,
    printed: p => p.label
  });
}

/** A zinc–copper cell on a bar, to seat in the chain. */
export const packPiece = (id, at) => ({ id, kind: 'cellsupplypack', label: `Zn–Cu ${voltText(cellE0('cu', 'zn'))} V`, at, props: { ink: '#a8a08c' }, caption: 'Seat it in the chain.' });
/** The sealed plate, to lay on the balance. */
export const platePiece = (id, at, { label = 'Plate X' } = {}) => ({ id, kind: 'cellsupplyplate', label, at, props: { ink: '#8a8780' }, caption: 'Lay it on the balance.' });

export { WATER_BACK_VOLTAGE };
