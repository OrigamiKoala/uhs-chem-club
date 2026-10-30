/**
 * kits/matter-curve.js — the instruments and pieces of Mirrowen's q5 bench (The Crossing), registered on the matter kit (`matter-registry.js`).
 *
 * THREE INSTRUMENTS, all reading `engine/matterdata-curve.js` and drawing what it says:
 *
 *   the HEAT RECORDER (`heatcurve`): a cup of water on a heater, a thermometer, and a pen that plots the sample's temperature against all
 *     the heat added. Each press adds the heat the "Heat per press" dial reads (a negative setting takes heat out); the pen draws the
 *     whole line between the old total and the new one, flats included, so a coarse dial never hides a corner. The heat added so far is
 *     not stored anywhere new: it is the last reading this recorder took (`state.recorder.rows`). `window` swaps the cup for a window of
 *     twelve of the sample's molecules; `cursor` names a marker fixture whose value is drawn as a line across the plot.
 *   the COOLER (`cooler`): a slot for a sample card. One press cools the card's sample from where it starts to body temperature, 37 °C,
 *     draws the way down, and keeps on the card the heat it gave to a hand.
 *   the PHASE MAP (`phasemap`, beyond the exam): the pressure dial picks one of six pressures and the key warms ice along that pressure
 *     from −40 °C to 400 °C, drawing the line and marking each place the state changes. Nothing is drawn but what the sweeps found.
 *
 * Pieces: `hsamp`, a small sample card (name, mass, and the heat it gave once it has been through the cooler).
 *
 * A painter is a pure function of the table state; it decides nothing. The flat picture is complete (3D Off draws the same thing).
 */

import { registerFixture, registerPiece } from './matter-registry.js';
import { say, slab, frameOf, topOf } from './matter-draw.js';
import { paintGlyph } from './matter-draw.js';
import { seatedIn, markerRead, fixed } from './heat-read.js';
import { addTourText } from '../tour.js';
import { PLATE_COLORS, mulberry32 } from '../../engine/plates.js';
import { PHASE_WATER } from '../../engine/matterdata.js';
import {
  startOf, planThermal, traceOf, crowdOfTwelve, heatBetween, BODY_T, sweepAt, SWEEP, WATER_TRIPLE
} from '../../engine/matterdata-curve.js';

const AMBER = PLATE_COLORS.amber;
const PHOS = PLATE_COLORS.phosphor;
const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const WARM = '#c0652b';
const COLD = '#6f8fb0';

/** The size of every recorder-like fixture on this bench, in table units. */
export const CURVE_BOX = Object.freeze({ w: 98, h: 49 });
/** A sample card is the size of the cooler's slot. */
export const HSAMP_RECT = Object.freeze({ hw: 10, hh: 7 });

const minus = s => String(s).replace('-', '−');
const round = (v, d) => { const k = 10 ** d; return Math.round(v * k) / k; };
const inkOf = T => (T > 45 ? WARM : T < 15 ? COLD : AMBER);
const sgn = v => (v > 0 ? `+${v}` : minus(v));

/* ------------------------------------------------------------------
   THE TWELVE MOLECULES OF THE WINDOW
   ------------------------------------------------------------------ */

/**
 * Where the window's twelve molecules stand in each state, as `[u, v]` across and down a unit box (v 0 at the top). Index 0 is the top of the
 * ice: the molecules that leave a state first. Seeded, so the picture never changes; the spacing is held in `tools/lib/mirrowen/q5-crossing.mjs`.
 */
function crowds() {
  const rnd = mulberry32(5521);
  const jit = k => (rnd() - 0.5) * k;
  const lattice = []; const liquid = []; const gas = [];
  for (let i = 0; i < 12; i++) {
    const c = i % 4; const r = Math.floor(i / 4); // r 0 is the top row
    lattice.push([(c + 0.5) / 4, 0.39 + r * 0.24]);
    liquid.push([(c + 0.5) / 4 + (r % 2 ? 0.04 : -0.04) + jit(0.04), 0.5 + r * 0.19 + jit(0.03)]);
    gas.push([(c + 0.5) / 4 + jit(0.08), (r + 0.5) / 3 + jit(0.1)]);
  }
  return { lattice, liquid, gas };
}
export const CROWDS = crowds();

/** How long a molecule's streak is for a temperature: the kit's own scale (`heat-parts.js` `phaseDots`), the same in every state. */
export const tailOf = T => Math.max(0.1, 0.22 + (T + 40) / 260);

/** The molecule `i` of twelve as drawn: its place and its state, for a crowd of `crowd.solid` still in the ice and `crowd.gas` flying. */
export function placeOfMolecule(i, crowd) {
  if (i < crowd.gas) return { at: CROWDS.gas[i], state: 'gas' };
  if (i >= 12 - crowd.solid) return { at: CROWDS.lattice[i], state: 'solid' };
  return { at: CROWDS.liquid[i], state: 'liquid' };
}

/* ------------------------------------------------------------------
   WHAT THE INSTRUMENTS READ
   ------------------------------------------------------------------ */

/** The recorder's readings for one fixture: its rows are labelled `<id>:...`. */
const rowsOf = (state, fid) => state.recorder.rows.filter(r => r.label.startsWith(`${fid}:`));

/** The heat recorder: the sample, the heat added so far (J), where that leaves it, and the line the pen has drawn. */
export function heatRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const rows = rowsOf(state, fid);
  const q = rows.length ? Math.round(rows[rows.length - 1].x * 1000) : 0;
  const start = startOf(p.T0, p.phase0);
  const plan = planThermal(p.grams, start, q);
  const k = Math.round(f.dials.heat.value) - 1;
  const pulse = p.pulses[k];
  return { f, p, rows, q, start, plan, pulse, crowd: crowdOfTwelve(plan), presses: rows.length, trace: traceOf(p.grams, start, 0, q) };
}

/** The cooler: the card in its slot, the heat it gave (kJ, once cooled) and the line it drew. */
export function coolRead(state, fid) {
  const f = state.fixtures[fid];
  const item = seatedIn(state, f.props.slot);
  const cooled = Boolean(item && item.props.gave != null);
  if (!item) return { f, item: null, cooled: false, gave: null, trace: [] };
  const start = startOf(item.props.T, item.props.phase);
  const qJ = heatBetween(item.props.grams, start, startOf(BODY_T, 'liquid'));
  return { f, item, cooled, gave: cooled ? item.props.gave : null, start, qJ, trace: cooled ? traceOf(item.props.grams, start, 0, qJ) : [] };
}

/** The phase map: the pressures swept so far (kPa, in order), the places a sweep found the state change, and the last sweep's path. */
export function mapRead(state, fid) {
  const f = state.fixtures[fid];
  const rows = rowsOf(state, fid);
  const swept = [];
  const changes = rows.map(r => { const [, P, kind] = r.label.split(':'); return { T: r.x, P: r.y, kind: kind || '' , label: `${P}` }; });
  for (const r of rows) if (!swept.includes(r.y)) swept.push(r.y);
  // A sweep with no change to mark (none exists today) would leave no row; the dial's pressure is what the key sweeps.
  const last = rows.length ? sweepAt(rows[rows.length - 1].y) : null;
  const k = Math.round(f.dials.pressure.value) - 1;
  return { f, rows, swept, changes, last, pressure: f.props.pressures[k] };
}

/** True when a sweep went straight from ice to vapour: the heat was run at a pressure below the triple point. */
export const sweptWithoutLiquid = (state, fid) => rowsOf(state, fid).some(r => r.label.includes(':solid>gas'));

/* ------------------------------------------------------------------
   THE FIXTURES
   ------------------------------------------------------------------ */

const kJ = v => `${sgn(round(v, 2))} kJ`;
export const pressureText = P => (P >= 1000 ? `${round(P / 1000, 1)} MPa` : `${round(P, P < 1 ? 1 : 0)} kPa`);

/**
 * The heat recorder. `T0` and `phase0` say what the sample is at the start ('solid' | 'liquid' | 'gas'); `pulses` are the settings of the
 * "Heat per press" dial in kJ (negative to cool); `plot` is `{ xMin, xMax, yMin, yMax, xStep, yStep }`.
 */
export function heatCurveFixture(id, at, o = {}) {
  const {
    grams = PHASE_WATER.M, T0 = -20, phase0 = 'solid', pulses = [1, 3, 8], pulseStart = 2, window = false, cursor = null, showHeat = true,
    title = 'Sample', runLabel = pulses[0] < 0 ? 'Cool' : 'Heat',
    plot = { xMin: 0, xMax: 10, yMin: -30, yMax: 30, xStep: 2, yStep: 10 }
  } = o;
  const dials = { heat: { min: 1, max: pulses.length, step: 1, value: pulseStart, label: 'Heat per press', labels: pulses.map(v => `${sgn(v)} kJ`) } };
  return {
    id, kind: 'heatcurve', label: title, at: { ...at }, size: { w: CURVE_BOX.w, h: CURVE_BOX.h }, dials, runLabel,
    props: { backdrop: true, grams, T0, phase0, pulses: pulses.slice(), plot: { ...plot }, window, showHeat, ...(cursor ? { cursor } : {}) }
  };
}

/** The cooler: a slot for one sample card, and the plot of its way down to body temperature. Returns the fixture and the slot. */
export function coolerFixture(id, at, o = {}) {
  const { title = 'Cooler: to 37 °C', plot = { xMin: -3, xMax: 0, yMin: 30, yMax: 130, xStep: 1, yStep: 20 }, runLabel = 'Cool' } = o;
  const slotId = `${id}.slot`;
  const x0 = at.x - CURVE_BOX.w / 2; const y0 = at.y - CURVE_BOX.h / 2;
  return {
    fixture: { id, kind: 'cooler', label: title, at: { ...at }, size: { w: CURVE_BOX.w, h: CURVE_BOX.h }, dials: {}, runLabel, props: { backdrop: true, slot: slotId, plot: { ...plot } } },
    slot: { id: slotId, label: ' ', at: { x: x0 + 13, y: y0 + 17.5 }, size: { w: 20, h: 14 } },
    slotId,
    size: { w: CURVE_BOX.w, h: CURVE_BOX.h }
  };
}

/** The phase map: `pressures` are the settings of the "Pressure" dial in kPa. */
export function phaseMapFixture(id, at, o = {}) {
  const { pressures = [0.1, 0.3, 1, 101.325, 30000, 100000], start = 4, title = 'Ice warmed at one pressure', runLabel = 'Heat' } = o;
  return {
    id, kind: 'phasemap', label: title, at: { ...at }, size: { w: CURVE_BOX.w, h: CURVE_BOX.h },
    dials: { pressure: { min: 1, max: pressures.length, step: 1, value: start, label: 'Pressure', labels: pressures.map(pressureText) } }, runLabel,
    props: { backdrop: true, pressures: pressures.slice() }
  };
}

/** A sample card for the cooler: its name, its mass in grams, its temperature and phase. */
export const sampleCard = (id, label, at, { grams = 1, T, phase }, extra = {}) => ({ id, kind: 'hsamp', label, at, props: { grams, T, phase }, ...extra });

/* ------------------------------------------------------------------
   THE PLOT, shared by the three instruments
   ------------------------------------------------------------------ */

/** Geometry of the plot inside a fixture, in units from its top-left corner: 54 by 22.4 units, clear of the dial rows and the key. */
const PLOT = Object.freeze({ px: 41, pw: 54, py: 13.8, ph: 22.4 });

function tickList(lo, hi, step) {
  const out = [];
  for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + 1e-9; v += step) out.push(round(v, 6));
  return out;
}

/** The axes: a dark well, faint grid, tick words and the two axis names. Returns the maps from data to pixels. */
function axes(ctx, F, a) {
  const { px, py, pw, ph } = PLOT;
  const X = v => F.x(px + a.mx(v) * pw);
  const Y = v => F.y(py + ph - a.my(v) * ph);
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(px), F.y(py), F.len(pw), F.len(ph));
  ctx.strokeStyle = DIM; ctx.globalAlpha = 0.45; ctx.lineWidth = 1;
  for (const t of a.xTicks) { ctx.beginPath(); ctx.moveTo(Math.round(X(t.v)) + 0.5, F.y(py)); ctx.lineTo(Math.round(X(t.v)) + 0.5, F.y(py + ph)); ctx.stroke(); }
  for (const t of a.yTicks) { ctx.beginPath(); ctx.moveTo(F.x(px), Math.round(Y(t.v)) + 0.5); ctx.lineTo(F.x(px + pw), Math.round(Y(t.v)) + 0.5); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.strokeStyle = STEEL;
  ctx.strokeRect(Math.round(F.x(px)) + 0.5, Math.round(F.y(py)) + 0.5, Math.round(F.len(pw)), Math.round(F.len(ph)));
  for (const t of a.xTicks) say(ctx, t.s, X(t.v), F.y(py + ph + 2.5), F.size(1.9, 6), { align: 'center', color: DUST });
  for (const t of a.yTicks) say(ctx, t.s, F.x(px - 1), Y(t.v), F.size(1.9, 6), { align: 'right', color: DUST });
  say(ctx, a.yName, F.x(px), F.y(py - 1.2), F.size(1.9, 6), { color: DIM, maxW: F.len(pw) });
  say(ctx, a.xName, F.x(px), F.y(py + ph + 6.6), F.size(1.9, 6), { color: DIM, maxW: F.len(36) });
  return { X, Y };
}

/** The tick lists for a linear axis: `{ v, s }` with true minus signs. */
const linTicks = (lo, hi, step) => tickList(lo, hi, step).map(v => ({ v, s: minus(round(v, 6)) }));

/** The pen: a line through `pts` (pixel pairs), cut where it leaves the well, and its tip as a small amber square. */
function pen(ctx, F, pts, color = PHOS, tip = true) {
  if (!pts.length) return;
  ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.6, F.len(0.45));
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke(); ctx.lineWidth = 1;
  if (tip) {
    const [x, y] = pts[pts.length - 1];
    ctx.fillStyle = AMBER;
    ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 5, 5);
  }
}

/** A trace `[{ q (J), T }]` as pixel points on a heat-against-temperature plot, cut at the plot's right and left edges. */
function tracePoints(trace, a, m) {
  const out = [];
  for (let i = 0; i < trace.length; i++) {
    const { q, T } = trace[i];
    const x = q / 1000;
    const clamp = v => Math.max(a.yMin, Math.min(a.yMax, v));
    if (x >= a.xMin && x <= a.xMax) out.push([m.X(x), m.Y(clamp(T))]);
    else if (out.length && i > 0) {
      // Past the edge: finish at the edge, along the line to this point.
      const prev = trace[i - 1];
      const edge = x > a.xMax ? a.xMax : a.xMin;
      const f = (edge - prev.q / 1000) / (x - prev.q / 1000);
      out.push([m.X(edge), m.Y(clamp(prev.T + (T - prev.T) * f))]);
      break;
    }
  }
  return out;
}

const heatAxes = p => ({
  ...p,
  mx: v => (v - p.xMin) / (p.xMax - p.xMin),
  my: v => (v - p.yMin) / (p.yMax - p.yMin),
  xTicks: linTicks(p.xMin, p.xMax, p.xStep),
  yTicks: linTicks(p.yMin, p.yMax, p.yStep),
  yName: 'TEMPERATURE (°C)',
  xName: 'HEAT ADDED (kJ)'
});

/* ---- the left panel ---- */

/** A well of twelve molecules, or a cup, with a thermometer column at its right. */
function samplePanel(ctx, F, top, T, a, { crowd = null, cup = null }) {
  const wx = 3; const wy = top + 0.4; const ww = 21; const wh = 21;
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(F.x(wx), F.y(wy), F.len(ww), F.len(wh));
  if (crowd) {
    const unit = F.len(1.55);
    const tail = tailOf(T) * 3.4;
    for (let i = 0; i < 12; i++) {
      const m = placeOfMolecule(i, crowd);
      const cx = F.x(wx + 1.5 + m.at[0] * (ww - 3)); const cy = F.y(wy + 1.5 + m.at[1] * (wh - 3));
      const ang = 0.6 + i * 2.1;
      ctx.strokeStyle = DUST; ctx.globalAlpha = 0.5; ctx.lineWidth = Math.max(1, F.len(0.28));
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - Math.cos(ang) * F.len(tail), cy - Math.sin(ang) * F.len(tail)); ctx.stroke();
      ctx.globalAlpha = 1;
      paintGlyph(ctx, 'H2O', cx, cy, unit);
    }
  } else if (cup) {
    // A lagged cup with the sample in it, as deep as its mass and tinted by its temperature.
    ctx.fillStyle = T > a.yMin + (a.yMax - a.yMin) * 0.5 ? 'rgba(192,101,43,0.30)' : T < 15 ? 'rgba(111,143,176,0.32)' : 'rgba(111,143,63,0.22)';
    ctx.fillRect(F.x(wx), F.y(wy + wh * 0.4), F.len(ww), F.len(wh * 0.6));
    say(ctx, cup, F.x(wx + ww / 2), F.y(wy + wh - 3), F.size(2.4, 6), { align: 'center', color: DUST });
  }
  ctx.strokeStyle = STEEL; ctx.lineWidth = 2;
  ctx.strokeRect(Math.round(F.x(wx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(ww)), Math.round(F.len(wh)));
  ctx.lineWidth = 1;
  // The thermometer: its column stands as high as the reading between the plot's lowest and highest temperature.
  const tx = 26.5;
  ctx.strokeStyle = DUST;
  ctx.strokeRect(Math.round(F.x(tx)) + 0.5, Math.round(F.y(wy)) + 0.5, Math.round(F.len(3)), Math.round(F.len(wh)));
  const frac = Math.max(0.02, Math.min(1, (T - a.yMin) / (a.yMax - a.yMin)));
  ctx.fillStyle = inkOf(T);
  ctx.fillRect(F.x(tx) + 1, F.y(wy + wh - wh * frac), F.len(3) - 1, F.len(wh * frac));
}

function readouts(ctx, F, y, rows) {
  rows.forEach(([name, value, color], i) => {
    say(ctx, name, F.x(3), F.y(y + i * 6.2), F.size(1.9, 6), { color: DIM });
    say(ctx, value, F.x(3), F.y(y + 3 + i * 6.2), F.size(2.8, 6.5), { color, weight: 700, maxW: F.len(34) });
  });
}

/* ---- the heat recorder ---- */

function paintHeatCurve(ctx, f, state, b) {
  const F = frameOf(b);
  const r = heatRead(state, f.id);
  const p = f.props;
  const top = topOf(f, b.lay);
  const a = heatAxes(p.plot);
  samplePanel(ctx, F, top, r.plan.T, a, { crowd: p.window ? r.crowd : null, cup: p.window ? null : `${fixed(p.grams, 1)} g` });
  const rowsOut = [['TEMPERATURE', `${minus(fixed(r.plan.T, 1))} °C`, inkOf(r.plan.T)]];
  if (p.showHeat) rowsOut.push(['HEAT ADDED', `${minus(fixed(r.q / 1000, 2, true))} kJ`, AMBER]);
  readouts(ctx, F, top + 24.2, rowsOut);
  const m = axes(ctx, F, a);
  // The marker's line, across the plot at the heat the marker is set to.
  if (p.cursor && state.fixtures[p.cursor]) {
    const v = markerRead(state, p.cursor);
    if (v >= a.xMin && v <= a.xMax) {
      ctx.strokeStyle = AMBER; ctx.setLineDash([4, 3]);
      ctx.beginPath(); ctx.moveTo(Math.round(m.X(v)) + 0.5, F.y(PLOT.py)); ctx.lineTo(Math.round(m.X(v)) + 0.5, F.y(PLOT.py + PLOT.ph)); ctx.stroke();
      ctx.setLineDash([]);
    }
  }
  const pts = tracePoints(r.trace, a, m);
  pen(ctx, F, pts);
}

/* ---- the cooler ---- */

function paintCooler(ctx, f, state, b) {
  const F = frameOf(b);
  const r = coolRead(state, f.id);
  const a = heatAxes(f.props.plot);
  const m = axes(ctx, F, a);
  say(ctx, 'HEAT GIVEN TO A HAND', F.x(3), F.y(27.4), F.size(1.9, 6), { color: DIM, maxW: F.len(36) });
  say(ctx, r.cooled ? `${round(r.gave, 2).toFixed(2)} kJ` : r.item ? '—' : '', F.x(3), F.y(31.6), F.size(3.4, 8), { color: r.cooled ? AMBER : DUST, weight: 700 });
  say(ctx, 'COOLED TO', F.x(3), F.y(37.2), F.size(1.9, 6), { color: DIM });
  say(ctx, `${BODY_T} °C`, F.x(3), F.y(40.6), F.size(2.8, 6.5), { color: COLD, weight: 700 });
  pen(ctx, F, tracePoints(r.trace, a, m));
}

/* ---- the phase map ---- */

const PHASE_INK = { solid: COLD, liquid: PHOS, gas: AMBER, fluid: DUST };
const LOGP = { lo: -1, hi: 5 }; // 0.1 kPa to 100 000 kPa

function paintPhaseMap(ctx, f, state, b) {
  const F = frameOf(b);
  const r = mapRead(state, f.id);
  const top = topOf(f, b.lay);
  const a = {
    mx: v => (v - SWEEP.lo) / (SWEEP.hi - SWEEP.lo),
    my: P => (Math.log10(P) - LOGP.lo) / (LOGP.hi - LOGP.lo),
    xTicks: linTicks(0, SWEEP.hi, 100),
    yTicks: [0.1, 1, 10, 100, 1000, 10000, 100000].map(v => ({ v, s: v >= 1000 ? `${v / 1000}k` : String(v) })),
    yName: 'PRESSURE (kPa, TEN TIMES PER STEP)',
    xName: 'TEMPERATURE (°C)'
  };
  const m = axes(ctx, F, a);
  // Every sweep so far: the line at its pressure, coloured by the state, then the places the state changed.
  for (const P of r.swept) {
    const s = sweepAt(P);
    for (const st of s.stages) {
      const y = m.Y(P);
      ctx.strokeStyle = PHASE_INK[st.phase]; ctx.lineWidth = Math.max(1.6, F.len(0.45));
      ctx.beginPath(); ctx.moveTo(m.X(Math.max(SWEEP.lo, st.from)), y); ctx.lineTo(m.X(Math.min(SWEEP.hi, st.to)), y); ctx.stroke();
    }
  }
  ctx.lineWidth = 1;
  for (const c of r.changes) {
    ctx.fillStyle = '#dcd6cc';
    ctx.fillRect(Math.round(m.X(c.T)) - 2, Math.round(m.Y(c.P)) - 2, 5, 5);
  }
  // The list at the left: the states the last sweep went through, and between which temperatures.
  say(ctx, 'LAST SWEEP', F.x(3), F.y(top + 1.6), F.size(1.9, 6), { color: DIM });
  if (!r.last) {
    say(ctx, 'none yet', F.x(3), F.y(top + 6.2), F.size(2.2, 6.2), { color: DUST });
  } else {
    r.last.stages.forEach((st, i) => {
      const y = top + 6.2 + i * 6.6;
      say(ctx, st.phase, F.x(3), F.y(y), F.size(2.4, 6.2), { color: PHASE_INK[st.phase], weight: 700 });
      say(ctx, `${minus(Math.round(st.from))} to ${minus(Math.round(st.to))} °C`, F.x(3), F.y(y + 3), F.size(1.9, 6), { color: DUST, maxW: F.len(36) });
    });
  }
  say(ctx, `${pressureText(r.pressure)} SET`, F.x(3), F.y(f.size.h - 3.4), F.size(2.2, 6.2), { color: DUST, weight: 700 });
}

/* ------------------------------------------------------------------
   THE SAMPLE CARD
   ------------------------------------------------------------------ */

function paintSample(ctx, p, state, o) {
  const box = slab(ctx, o, HSAMP_RECT, '#1d1a16');
  const sc = o.sc;
  const size = Math.max(6.2, 2.1 * sc);
  say(ctx, p.label, o.x, box.y0 + 3.1 * sc, size, { align: 'center', weight: 700, maxW: box.w - 2 * sc });
  say(ctx, `${round(p.props.grams, 2).toFixed(2)} g`, o.x, box.y0 + 6.9 * sc, Math.max(6, 1.9 * sc), { align: 'center', color: DUST, maxW: box.w - 2 * sc });
  if (p.props.gave != null) say(ctx, `gave ${round(p.props.gave, 2).toFixed(2)} kJ`, o.x, box.y0 + 10.9 * sc, Math.max(6, 2.0 * sc), { align: 'center', weight: 700, color: AMBER, maxW: box.w - 2 * sc });
}

/* ------------------------------------------------------------------
   REGISTRATION
   ------------------------------------------------------------------ */

registerFixture('heatcurve', {
  paint: paintHeatCurve,
  run(state, fid) {
    const r = heatRead(state, fid);
    const q = r.q + Math.round(r.pulse * 1000);
    const plan = planThermal(r.p.grams, r.start, q);
    return { x: q / 1000, y: round(plan.T, 2), label: `${fid}:${r.presses + 1}` };
  }
});

registerFixture('cooler', {
  paint: paintCooler,
  run(state, fid) {
    const r = coolRead(state, fid);
    if (!r.item) return { noop: 'Put a sample in the slot first.' };
    return { x: round(r.qJ / 1000, 4), y: BODY_T, label: `${fid}:${r.item.id}`, stamp: { [r.item.id]: { gave: round(-r.qJ / 1000, 4) } } };
  }
});

registerFixture('phasemap', {
  paint: paintPhaseMap,
  run(state, fid) {
    const r = mapRead(state, fid);
    const s = sweepAt(r.pressure);
    return { rows: s.changes.map(c => ({ x: round(c.T, 2), y: r.pressure, label: `${fid}:${r.pressure}:${c.from}>${c.to}` })), x: 0, y: r.pressure, label: `${fid}:sweep` };
  }
});

registerPiece('hsamp', {
  kind: { r: 7.5, rect: HSAMP_RECT, nojoin: true },
  paint: paintSample,
  faceKey: p => `hsamp|${p.label}|${p.props.grams}|${p.props.gave ?? ''}`,
  printed: p => String(p.label)
});

/* ------------------------------------------------------------------
   THE TOUR
   ------------------------------------------------------------------ */

addTourText({
  'matter:heatcurve': {
    title: 'Heater and recorder', dials: false,
    text: f => `The cup holds a sample, with a thermometer beside it${f.props.window ? '; the cup shows twelve of the sample\'s molecules' : ''}. Set the "Heat per press" dial, then press "${f.runLabel}": that much heat goes into the sample, or comes out of it where the dial reads minus. The line on the plot is a pen. It draws the temperature against all the heat added so far, and it draws every stretch it passed, not only the points where you pressed.`
  },
  'matter:cooler': {
    title: 'Cooler', dials: false,
    text: 'The cooler has a slot on the left. Drag a sample card into it and press "Cool". The sample cools to body temperature, 37 °C, and the pen draws its temperature against the heat added on the way down, which is below zero. The number under the slot is the heat the sample gave to a hand, and the card keeps it.'
  },
  'matter:phasemap': {
    title: 'Pressure and temperature', dials: false,
    text: 'The plot has temperature across it and pressure up it, and each step up is ten times the last. Turn the "Pressure" dial to pick one pressure, then press "Heat". A sample of ice at −40 °C is warmed along that pressure to 400 °C. The pen draws the line, coloured by the state the sample is in, and a square marks each place the state changed. The list on the left names the states of the last warming.'
  }
}, {
  hsamp: ['Sample cards', 'Each card names a sample and its mass. Drag one into the cooler\'s slot and press the cooler\'s key. A card that has been through the cooler keeps the heat it gave, so you can compare the cards once they are out of it again.']
});
