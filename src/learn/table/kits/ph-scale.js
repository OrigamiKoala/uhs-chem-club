/**
 * kits/ph-scale.js — the scale flask and the two meters, registered on the ph kit (`ph-registry.js`). Verdigris's second bench (`q2-scale`).
 *
 *   SCALE FLASK  a flask of a strong acid, a strong base or pure water, with a window of 200 formula units drawn as spheres (hydronium and the
 *                leftover of the acid; the metal ion and one or two hydroxides; whole water molecules, which never come apart in 200). A flask
 *                may carry a temperature dial of two settings and a counting lens that prints the measured H₃O⁺ and OH⁻ in mol/L, may be
 *                sealed (its name and strength not printed), and may have no seat (no meter can read it).
 *   METERS       the pH meter and the pOH meter (`phmeter2`, props.scale): laid in a seat, each reads that flask to two places; a lifted meter
 *                leaves its last reading printed in the seat.
 *
 * A THIN WRAPPER over `engine/phdata.js` `scaleSolution`: every figure is the planner's, at the temperature the dial stands on.
 */

import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { roundedSlab } from '../../engine/table-props.js';
import { registerFixture, registerPiece } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { put, ball, dot, H_INK, OH_INK, ACID_INK, BASE_INK, ionText } from './ph-flask.js';
import { pieceIn, cellGrid, ionizedCells, UNITS } from './ph-read.js';
import { scaleSolution, STRONG_BASES, ACIDS, fmt, sci } from '../../engine/phdata.js';
import { withDial } from './ph-replay.js';
import { windowAt, shuffle, scratch, wobble } from '../../engine/phmotion.js';
import { WATER_INK } from './ph-pour.js';
import './ph-scale-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;
const WIN_TOP = 11;
const CATION_INK = '#8c8376';

/** A strength as the flask prints it: 0.10 M, or 3.2 × 10⁻⁴ M below a thousandth. */
export const strengthText = c => (c < 1e-3 ? `${sci(c, 2)} M` : `${Number(c).toPrecision(2)} M`);

/** The flask's solute at the temperature its dial stands on. */
export function liveSolute(f) {
  const p = f.props;
  const T = p.temps ? p.temps[Math.round(f.dials.T.value) - 1] ?? p.temps[0] : p.solute.T ?? 25;
  // A flask that can be diluted: each step adds water to make the concentration a tenth.
  const steps = p.dilute ? Math.round(f.dials.steps.value) : 0;
  return { ...p.solute, c: p.solute.c * Math.pow(0.1, steps), T };
}
export const scaleRead = f => scaleSolution(liveSolute(f));

const CACHE = new Map();
function solOf(f) {
  const s = liveSolute(f);
  const k = `${s.id}|${s.c}|${s.T}`;
  let r = CACHE.get(k);
  if (!r) { r = scaleSolution(s); CACHE.set(k, r); }
  return r;
}

/** The window's counts: of 200 units, how many have come apart. */
export function scaleWindow(f) {
  const sol = solOf(f);
  const units = f.props.units;
  const ionized = Math.round(units * (sol.ionized > 1 ? 1 : sol.ionized));
  return { units, ionized, whole: units - ionized, sol };
}

function speciesOfScale(f) {
  const id = f.props.solute.id;
  if (id === 'water') return { whole: { ink: WATER_INK, name: 'H₂O' }, parts: [{ ink: H_INK, name: 'H₃O⁺' }, { ink: OH_INK, name: 'OH⁻' }], n: 1 };
  const sb = STRONG_BASES[id];
  if (sb) return { whole: { ink: CATION_INK, name: sb.formula }, parts: [{ ink: CATION_INK, name: sb.cation }, { ink: OH_INK, name: 'OH⁻' }], n: sb.n };
  const a = ACIDS[id];
  return { whole: { ink: ACID_INK, name: a.formula }, parts: [{ ink: H_INK, name: 'H₃O⁺' }, { ink: BASE_INK, name: a.base }], n: 1 };
}

/* ------------------------------------------------------------------ the meters */

const RECT_METER = { hw: 9.5, hh: 5.4 };
const seatFlask = (p, state) => {
  const m = /^slot:(.+)\.seat$/.exec(p.zone || '');
  return m && state.fixtures[m[1]]?.kind === 'phscale' ? state.fixtures[m[1]] : null;
};
const valueOf = (meter, fl) => { const s = solOf(fl); return meter.props.scale === 'pOH' ? s.pOH : s.pH; };
const nameOf = meter => (meter.props.scale === 'pOH' ? 'pOH meter' : 'pH meter');

/** The meter laid in a scale flask's seat and what it reads. */
export function scaleMeterRead(state, fid) {
  const f = state.fixtures[fid];
  const m = f.props.seat ? pieceIn(state, f.props.seat) : null;
  const meter = m && m.kind === 'phmeter2' ? m : null;
  return { meter, value: meter ? valueOf(meter, f) : null, scale: meter?.props.scale ?? null };
}

function paintMeter(ctx, p, state, o) {
  const sc = o.sc;
  const x0 = o.x - RECT_METER.hw * sc; const y0 = o.y - RECT_METER.hh * sc; const w = RECT_METER.hw * 2 * sc; const h = RECT_METER.hh * 2 * sc;
  ctx.fillStyle = '#2a2620'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : DUST; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  put(ctx, nameOf(p), o.x, y0 + 2.1 * sc, Math.max(6.4, 1.9 * sc), { color: DUST, weight: 700, maxW: w - 1.6 * sc });
  const fl = seatFlask(p, state);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x0 + 1.2 * sc, y0 + 3.9 * sc, w - 2.4 * sc, h - 5.1 * sc);
  put(ctx, fl ? fmt(valueOf(p, fl), 2) : '—', o.x, y0 + 7.4 * sc, Math.max(9, 3.8 * sc), { color: fl ? AMBER : DIM, weight: 700, maxW: w - 3.4 * sc });
}

function pieceMeter3d(p, state, c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const H = 0.03;
  const body = new THREE.Mesh(roundedSlab(hw * 2, hh * 2, H, Math.min(hw, hh) * 0.2, 0.003), m.labCast);
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const rim = new THREE.Mesh(roundedSlab(hw * 2 * 0.97, hh * 2 * 0.94, 0.006, Math.min(hw, hh) * 0.18, 0.002), m.labBrass);
  rim.position.y = H; rim.castShadow = true; g.add(rim);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.9, hh * 2 * 0.84), c.face());
  face.rotation.x = -Math.PI / 2; face.position.y = H + 0.0068; face.receiveShadow = true; g.add(face);
  const probe = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, hw * 1.1, 10), m.labBrass);
  probe.rotation.z = Math.PI / 2; probe.position.set(-hw - hw * 0.5, 0.008, 0); probe.castShadow = true; g.add(probe);
  g.userData.height = H + 0.007;
  return g;
}

registerPiece('phmeter2', {
  kind: { r: 8, rect: RECT_METER, nojoin: true },
  paint: paintMeter,
  faceKey: (p, state) => { const fl = seatFlask(p, state); return `phmeter2|${p.props.scale}|${fl ? fmt(valueOf(p, fl), 2) : '-'}`; },
  piece3d: pieceMeter3d,
  printed: p => nameOf(p)
});

/** A pH meter (`scale: 'pH'`) or a pOH meter (`'pOH'`), loose on the table at `at`. */
export const scaleMeter = (id, at, scale = 'pH', extra = {}) => ({
  id, kind: 'phmeter2', label: scale === 'pOH' ? 'pOH meter' : 'pH meter', at, props: { scale },
  caption: scale === 'pOH' ? 'Lay it on a flask to read its pOH.' : 'Lay it on a flask to read its pH.', ...extra
});

/* ------------------------------------------------------------------ the flask */

const SAMPLE_H = 17;
const SAMPLE_DOTS = 1000;

/** H₃O⁺ in a fixed small sample of the flask: 1000 at the start, then in proportion to the hydronium the planner gives, so each tenfold dilution shows a tenth as many. */
export function sampleCount(f) {
  const h = solOf(f).h;
  const h0 = scaleSolution({ ...f.props.solute, T: liveSolute(f).T }).h;
  return Math.round((SAMPLE_DOTS * h) / h0);
}

function paintSample(ctx, F, f, x, y, w, clock) {
  const n = sampleCount(f);
  const hh = 12;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(w), F.len(hh));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(hh)));
  ctx.fillStyle = H_INK;
  const cols = 50; const rows = SAMPLE_DOTS / cols;
  for (let i = 0; i < n; i++) {
    // The dots occupy the grid by a fixed shuffle of its sites, so the same ones stay when the count falls.
    const site = (i * 389) % SAMPLE_DOTS;
    const m = wobble(site, clock);
    const gx = x + 0.5 + ((site % cols) + 0.5 + m.wx) * ((w - 1) / cols); const gy = y + 0.5 + ((Math.floor(site / cols) + 0.5 + m.wy) * ((hh - 1) / rows));
    dot(ctx, F.x(gx), F.y(gy), Math.max(0.7, F.len(0.28)), H_INK);
  }
  put(ctx, `H₃O⁺ in a fixed sample: ${n}`, F.x(x), F.y(y + hh + 2.4), F.size(1.9, 5.8), { align: 'left', color: DUST, weight: 700 });
}

function paintScale(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const w = f.size.w;
  put(ctx, p.sealed ? 'concentration hidden' : strengthText(liveSolute(f).c ?? 0), F.x(2), F.y(8.2), F.size(p.solute.id === 'water' ? 2.3 : 2.5, 6.4), { align: 'left', color: p.sealed ? DIM : TEXT, weight: 700, maxW: F.len(w - 4) });
  const win = scaleWindow(f);
  const sp = speciesOfScale(f);
  const x = 2; const y = WIN_TOP; const ww = w - 4; const wh = p.wh;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x), F.y(y), F.len(ww), F.len(wh));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
  const cells = cellGrid(win.units, p.cols, x + 0.6, y + 0.6, ww - 1.2, wh - 1.2);
  const seed = 17 + Math.round((p.solute.c ?? 1) * 1000);
  const now = windowAt(win.units, win.ionized, seed, b.clock || 0, (scratch(f).order ||= shuffle(win.units, seed)));
  cells.forEach((c, i) => {
    const m = now[i];
    const cx = c.x + m.wx * c.cw * 0.5; const cy = c.y + m.wy * c.ch * 0.5;
    const R = Math.min(c.cw, c.ch) * 0.44;
    const sep = m.dir === 1 ? m.p : m.dir === -1 ? 1 - m.p : (m.ion ? 1 : 0);
    if (sep <= 0.001) { ball(ctx, F.x(cx), F.y(cy), Math.max(1.4, F.len(R)), sp.whole.ink); return; }
    const full = sp.n === 2 ? 0.46 : 0.62;
    const r = Math.max(1.2, F.len(R * (1 - (1 - full) * sep)));
    const gap = r * (sp.n === 2 ? 1.9 : 0.95) * sep;
    ball(ctx, F.x(cx) - gap, F.y(cy), r, sep > 0.5 ? sp.parts[0].ink : sp.whole.ink);
    for (let k = 0; k < sp.n; k++) ball(ctx, F.x(cx) + (sp.n === 2 ? k * 1.9 * r * sep : gap), F.y(cy), r, sep > 0.5 ? sp.parts[1].ink : sp.whole.ink);
  });
  // The names of the colours under the window.
  let ly = WIN_TOP + wh + 3;
  if (p.dilute) paintSample(ctx, F, f, 2, WIN_TOP + wh + 3 + (p.legend ? (w >= 40 ? 3.6 : 6.6) : 0), w - 4, b.clock || 0);
  if (p.legend) {
    const items = win.ionized > 0 ? [sp.parts[0], sp.parts[1]] : [];
    if (win.whole > 0) items.push(sp.whole);
    const size = F.size(1.9, 5.8); const sw = F.len(1.7); const u = F.len(1);
    let cx = 2; let cy = ly;
    for (const it of items) {
      const name = ionText(it.name);
      ctx.font = `500 ${size}px "Quantico", "JetBrains Mono", sans-serif`;
      const tu = (ctx.measureText(name).width + sw + F.len(2.4)) / u;
      if (cx + tu > 2 + ww && cx > 2) { cx = 2; cy += 3.3; }
      ctx.fillStyle = it.ink; ctx.beginPath(); ctx.arc(F.x(cx) + sw / 2, F.y(cy), sw / 2, 0, Math.PI * 2); ctx.fill();
      put(ctx, name, F.x(cx) + sw + F.len(0.6), F.y(cy), size, { align: 'left', color: DUST });
      cx += tu;
    }
    ly += w >= 40 ? 3.6 : 6.6;
  }
  if (p.dilute) ly += SAMPLE_H;
  if (p.lens) {
    const s = win.sol;
    put(ctx, `H₃O⁺ ${sci(s.h, 2)} M`, F.x(2), F.y(ly + 1.5), F.size(2.2, 6), { align: 'left', color: AMBER, weight: 700, maxW: F.len(ww) });
    put(ctx, `OH⁻ ${sci(s.oh, 2)} M`, F.x(2), F.y(ly + 5), F.size(2.2, 6), { align: 'left', color: AMBER, weight: 700, maxW: F.len(ww) });
  }
  if (p.seat) {
    const m = scaleMeterRead(state, f.id);
    if (!m.meter) {
      const n = p.noted || {};
      const lines = ['pH', 'pOH'].filter(k => n[k] != null);
      lines.forEach((k, i) => put(ctx, `${k} ${fmt(n[k], 2)}`, F.x(p.seatRel.x), F.y(p.seatRel.y + (i - (lines.length - 1) / 2) * 3.8), F.size(2.8, 6.8), { color: DUST, weight: 700 }));
    }
  }
}

function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'phscale' || !f.props.seat) continue;
    const m = scaleMeterRead(state, f.id);
    if (m.meter) f.props.noted = { ...(f.props.noted || {}), [m.scale]: Math.round(m.value * 100) / 100 };
  }
}

/** Dilute: one press adds water, a tenth the concentration; the row it records is the pH now. */
function run(state, fid) {
  const f = state.fixtures[fid];
  if (!f.props.dilute) return null;
  const n = Math.round(f.dials.steps.value);
  if (n >= f.dials.steps.max) return { noop: 'No more water can be added.' };
  const next = { ...f, dials: { ...f.dials, steps: { ...f.dials.steps, value: n + 1 } } };
  return { x: n + 1, y: Math.round(scaleSolution(liveSolute(next)).pH * 100) / 100, label: fid, dials: { [fid]: { steps: n + 1 } } };
}

const stepsReplay = { count: f => (f.props.dilute ? Math.round(f.dials.steps.value) : 0), at: (f, i) => withDial(f, 'steps', i) };
registerFixture('phscale', { replay: stepsReplay, demo: (f, t) => (f.props.dilute ? { dials: { steps: Math.floor(t / 1.4) % (f.dials.steps.max + 1) } } : null), bodies3d: true, paint: paintScale, settle, run, dress3d: dressScale, live: () => true });

function dressScale(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const group = new T.Group();
  const w = f.size.w - 4; const h = f.props.wh;
  const cx = box.x0 + 2 + w / 2; const cy = box.y0 + WIN_TOP + h / 2;
  const t = 0.005; const H = 0.024;
  const wall = (lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    group.add(m);
  };
  wall(w * s + 2 * t, t, 0, -(h * s) / 2 - t / 2);
  wall(w * s + 2 * t, t, 0, (h * s) / 2 + t / 2);
  wall(t, h * s, -(w * s) / 2 - t / 2, 0);
  wall(t, h * s, (w * s) / 2 + t / 2, 0);
  return group;
}

/**
 * A scale flask. `solute`: `{ id: 'hcl' | 'naoh' | 'baoh2' | 'water', c }`. Options: `label`, `w`, `window` (height), `meter: false` (no seat),
 * `legend: false`, `temps: [25, 50]` (a temperature dial of those settings), `lens` (print the measured H₃O⁺ and OH⁻), `sealed` (name and
 * strength not printed). Returns `{ fixture, slot, size }`.
 */
export function scaleFlask(id, at, { solute, label, w = 44, window = 16, meter = true, legend = true, temps = null, lens = false, sealed = false, dilute = 0, units = UNITS, cols = 20 } = {}) {
  const wh = window;
  const legendRows = legend ? (w >= 40 ? 3.6 : 6.6) : 0;
  const lensRows = (lens ? 8.6 : 0) + (dilute ? SAMPLE_H : 0);
  const dialTop = temps ? WIN_TOP + wh + 3 + legendRows + lensRows + 6 : null;
  const seatH = meter ? 12.5 : 0;
  const belowDial = temps ? dialTop + 3 : WIN_TOP + wh + 3 + legendRows + lensRows;
  const h = Math.round((belowDial + (meter ? 2 + seatH : 1.5)) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const seatRel = { x: w / 2, y: h - 1 - seatH / 2, w: Math.min(22, w - 4), h: seatH };
  const slot = meter ? { id: `${id}.seat`, label: ' ', at: { x: x0 + seatRel.x, y: y0 + seatRel.y }, size: { w: seatRel.w, h: seatRel.h } } : null;
  const dials = temps
    ? { T: { min: 1, max: temps.length, step: 1, value: 1, label: 'Temperature', labels: temps.map(t => `${t} °C`) } }
    : dilute ? { steps: { min: 0, max: dilute, step: 1, value: 0, label: 'Dilutions' } } : { x: { min: 0, max: 1, step: 1, value: 0, label: 'Flask' } };
  return {
    fixture: {
      id, kind: 'phscale', label: sealed ? 'Sealed flask' : (label ?? solute.id), at: { ...at }, size: { w, h }, ...(dilute ? { runLabel: 'Dilute' } : { noRun: true }), dials,
      props: { ...(temps ? { top: dialTop } : { hidden: [dilute ? 'steps' : 'x'] }), dilute: dilute || 0, backdrop: true, solute: { ...solute }, units, cols, wh, legend, lens, sealed, temps, seat: slot ? slot.id : null, seatRel, noted: null }
    },
    slot,
    size: { w, h }
  };
}
