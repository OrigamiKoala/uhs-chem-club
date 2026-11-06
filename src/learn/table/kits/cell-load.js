/**
 * kits/cell-load.js — the cell under load, registered on the cell kit (`cell-registry.js`). Brinewire's `q5-load`.
 *
 *   CELLLOADRUN   two beakers with ion windows, a voltmeter, a load, and a plot of voltage against time. The "Run" key lets the cell
 *                 drive the load for a fixed number of ticks; the plot is painted only to the tick reached and the windows show the ions
 *                 counted at that tick (one dot is 0.02 mol/L). Tin in the left beaker, lead in the right.
 *   CELLLOADREAD  two beakers of a metal and its ions at a set concentration, a voltmeter and a log. A beaker may carry a dial of two
 *                 concentrations (1.0 M and 0.010 M); "Run" reads the cell as set and keeps a line for every setting that has been read.
 *                 `wired: false` leaves the voltmeter off (a cell nobody has connected).
 *   CELLLOADCC    a concentration cell: the same metal in two beakers of different concentration, a voltmeter and an ammeter whose needle
 *                 swings toward the bar the electrons go to. Beaker concentrations can be sealed ("?").
 *
 * A THIN WRAPPER over `engine/celldata-q5.js` (and `celldata.js`): a painter decides nothing, every reading is a planner's answer.
 * Flat, like the rest of the kit; each beaker stands in a low glass dish at `3D On`.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { METALS, fmt } from '../../engine/celldata.js';
import { LOAD, CONC_STEPS, concLabel, loadAt, loadTrace, milliText, readAt, concCellSigned } from '../../engine/celldata-q5.js';
import { voltText } from './cell-read.js';
import { put, METAL_INK } from './cell-board.js';
import './cell-load-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;

const LIQUID = '#2f4a47';
const CUP = Object.freeze({ w: 12, h: 12 });
const WIN = Object.freeze({ w: 24, h: 26 });
const FLASH_ORDER = Object.freeze(Array.from({ length: LOAD.dotsCap }, (_, i) => (i * 37 + 11) % LOAD.dotsCap));

/* ------------------------------------------------------------------ shared drawing */

function beakerAt(ctx, F, x, y, w, h) {
  ctx.fillStyle = LIQUID; ctx.fillRect(F.x(x + 0.5), F.y(y + h * 0.12), F.len(w - 1), F.len(h * 0.88 - 0.5));
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y)); ctx.stroke();
  ctx.lineWidth = 1;
}

function bar(ctx, F, x, top, bottom, metal) {
  ctx.fillStyle = METAL_INK[metal] || '#9a9690';
  ctx.fillRect(F.x(x - 1.2), F.y(top), F.len(2.4), F.len(bottom - top));
}

function wire(ctx, F, pts) {
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.2, F.len(0.3));
  ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(F.x(x), F.y(y)) : ctx.moveTo(F.x(x), F.y(y)))); ctx.stroke();
  ctx.lineWidth = 1;
}

function meterBox(ctx, F, m, caption, reading, on) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(m.x), F.y(m.y), F.len(m.w), F.len(m.h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(m.x)) + 0.5, Math.round(F.y(m.y)) + 0.5, Math.round(F.len(m.w)), Math.round(F.len(m.h)));
  put(ctx, reading, F.x(m.x + m.w / 2), F.y(m.y + m.h / 2), F.size(3.8, 9), { color: on ? AMBER : DIM, weight: 700, maxW: F.len(m.w - 2) });
  put(ctx, caption, F.x(m.x + m.w / 2), F.y(m.y - 2.2), F.size(1.9, 5.6), { color: DUST });
}

/** Low glass dishes round each beaker at `3D On`. */
function dishes(f, state, c, cups) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const group = new T.Group();
  const H = 0.024; const t = 0.005;
  const wall = (cx, cy, lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  for (const { x, y, w, h } of cups) {
    const ww = w * s; const d = h * s;
    const cx = box.x0 + x + w / 2; const cy = box.y0 + y + h / 2;
    wall(cx, cy, ww + 2 * t, t, 0, -d / 2 - t / 2);
    wall(cx, cy, ww + 2 * t, t, 0, d / 2 + t / 2);
    wall(cx, cy, t, d, -ww / 2 - t / 2, 0);
    wall(cx, cy, t, d, ww / 2 + t / 2, 0);
  }
  return group;
}

/* ------------------------------------------------------------------ the run bench: windows, voltmeter, plot */

/** What the run bench shows at its tick: the planner's state, the trace so far, and whether the cell has been run at all. */
export function loadRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const tick = Math.round(f.dials.tick.value);
  const start = { cAnode0: p.cAnode0, cCathode0: p.cCathode0 };
  const now = loadAt(p.cathode, p.anode, start, tick);
  return { f, tick, start, now, ran: tick > 0, trace: tick > 0 ? loadTrace(p.cathode, p.anode, start, tick) : [] };
}

function windowAt(ctx, F, x, y, n, barSide, metal) {
  beakerAt(ctx, F, x, y, WIN.w, WIN.h);
  const bx = barSide === 'left' ? x + 2 : x + WIN.w - 2;
  bar(ctx, F, bx, y - 5, y + WIN.h - 1.5, metal);
  const x0 = barSide === 'left' ? x + 4.2 : x + 1.6;
  ctx.fillStyle = '#dcd6cc';
  for (let i = 0; i < n; i++) {
    const k = FLASH_ORDER[i];
    const cx = x0 + (k % 10) * 1.92 + 0.9; const cy = y + 3.3 + Math.floor(k / 10) * 2.15;
    ctx.beginPath(); ctx.arc(F.x(cx), F.y(cy), Math.max(1.5, F.len(0.55)), 0, Math.PI * 2); ctx.fill();
  }
}

function paintRun(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = loadRead(state, f.id);
  const L = METALS[p.anode]; const R = METALS[p.cathode];
  const wy = 22;
  // The wire over the top through the voltmeter and the load.
  const m = p.meter;
  const lbx = p.lx + 2; const rbx = p.rx + WIN.w - 2;
  wire(ctx, F, [[lbx, wy - 5], [lbx, m.y + m.h / 2], [m.x, m.y + m.h / 2]]);
  wire(ctx, F, [[m.x + m.w, m.y + m.h / 2], [p.load.x, m.y + m.h / 2]]);
  wire(ctx, F, [[p.load.x + p.load.w, m.y + m.h / 2], [rbx, m.y + m.h / 2], [rbx, wy - 5]]);
  windowAt(ctx, F, p.lx, wy, r.now.nAnode, 'left', p.anode);
  windowAt(ctx, F, p.rx, wy, r.now.nCathode, 'right', p.cathode);
  // The salt bridge between the windows.
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(2, F.len(0.9));
  ctx.beginPath(); ctx.moveTo(F.x(p.lx + WIN.w - 4), F.y(wy + 8)); ctx.lineTo(F.x(p.lx + WIN.w - 4), F.y(wy - 1.5)); ctx.lineTo(F.x(p.rx + 4), F.y(wy - 1.5)); ctx.lineTo(F.x(p.rx + 4), F.y(wy + 8)); ctx.stroke();
  ctx.lineWidth = 1;
  meterBox(ctx, F, m, 'Voltmeter', r.ran ? `${milliText(r.now.E)} V` : '—', r.ran);
  // The load: a resistor block.
  ctx.fillStyle = '#26231d'; ctx.fillRect(F.x(p.load.x), F.y(m.y), F.len(p.load.w), F.len(m.h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(p.load.x)) + 0.5, Math.round(F.y(m.y)) + 0.5, Math.round(F.len(p.load.w)), Math.round(F.len(m.h)));
  put(ctx, 'Load', F.x(p.load.x + p.load.w / 2), F.y(m.y + m.h / 2), F.size(2.6, 7), { color: TEXT, weight: 700 });
  // Names and counts under the windows.
  const ny = wy + WIN.h + 3;
  put(ctx, `${L.ion}`, F.x(p.lx + WIN.w / 2), F.y(ny), F.size(2.8, 7), { color: TEXT, weight: 700 });
  put(ctx, `${R.ion}`, F.x(p.rx + WIN.w / 2), F.y(ny), F.size(2.8, 7), { color: TEXT, weight: 700 });
  if (p.counts) {
    put(ctx, String(r.now.nAnode), F.x(p.lx + WIN.w / 2), F.y(ny + 4.2), F.size(3.4, 8), { color: AMBER, weight: 700 });
    put(ctx, String(r.now.nCathode), F.x(p.rx + WIN.w / 2), F.y(ny + 4.2), F.size(3.4, 8), { color: AMBER, weight: 700 });
  }
  put(ctx, `Each beaker started at ${concLabel(p.cAnode0)}`, F.x(p.lx), F.y(ny + 9.4), F.size(2.1, 6), { align: 'left', color: DUST });
  put(ctx, 'One dot is 0.02 M of ions', F.x(p.lx), F.y(ny + 13.2), F.size(2.1, 6), { align: 'left', color: DUST });
  // The plot of voltage against time, painted only to the tick reached.
  const Pr = p.plot;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(Pr.x0), F.y(Pr.y0), F.len(Pr.w), F.len(Pr.h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(Pr.x0)) + 0.5, Math.round(F.y(Pr.y0)) + 0.5, Math.round(F.len(Pr.w)), Math.round(F.len(Pr.h)));
  const X = t => Pr.x0 + 1.5 + (t / LOAD.maxTick) * (Pr.w - 3);
  const Y = v => Pr.y0 + Pr.h - 2 - (v / Pr.vMax) * (Pr.h - 4);
  put(ctx, 'Voltage (V)', F.x(Pr.x0), F.y(Pr.y0 - 2.4), F.size(2.2, 6.4), { align: 'left', color: DUST, weight: 700 });
  put(ctx, '0', F.x(Pr.x0 - 1.4), F.y(Y(0)), F.size(2.1, 6), { align: 'right', color: DUST });
  put(ctx, String(Pr.vMax), F.x(Pr.x0 - 1.4), F.y(Y(Pr.vMax)), F.size(2.1, 6), { align: 'right', color: DUST });
  put(ctx, '0', F.x(X(0)), F.y(Pr.y0 + Pr.h + 3), F.size(2.1, 6), { color: DUST });
  put(ctx, `Time (${LOAD.maxTick} ticks)`, F.x(Pr.x0 + Pr.w), F.y(Pr.y0 + Pr.h + 3), F.size(2.1, 6), { align: 'right', color: DUST });
  if (r.trace.length) {
    ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.6, F.len(0.4)); ctx.beginPath();
    r.trace.forEach((q, i) => { const px = F.x(X(q.t)); const py = F.y(Y(q.E)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = AMBER;
    const last = r.trace[r.trace.length - 1];
    ctx.beginPath(); ctx.arc(F.x(X(last.t)), F.y(Y(last.E)), Math.max(2, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
  }
}

/** One press lets the cell drive the load for `LOAD.perPress` ticks; the plot and the windows follow the planner to the tick reached. */
function runLoad(state, fid) {
  const f = state.fixtures[fid];
  const tick = Math.round(f.dials.tick.value);
  if (tick >= LOAD.maxTick) return { noop: 'The cell has been run as long as the bench allows.' };
  const next = Math.min(LOAD.maxTick, tick + LOAD.perPress);
  const p = f.props;
  const a = loadAt(p.cathode, p.anode, { cAnode0: p.cAnode0, cCathode0: p.cCathode0 }, next);
  return { x: next, y: Math.round(a.E * 1e5) / 1e5, label: fid, dials: { [fid]: { tick: next } } };
}

registerFixture('cellloadrun', {
  paint: paintRun,
  run: runLoad,
  dress3d: (f, state, c) => dishes(f, state, c, [{ x: f.props.lx, y: 22, w: WIN.w, h: WIN.h }, { x: f.props.rx, y: 22, w: WIN.w, h: WIN.h }])
});

/**
 * A cell under load with ion windows: tin (left, gives its ions) and lead (right), or any two +2 metals of `METALS`. `counts` prints the
 * count under each window; `tick` is the tick the cell has already been run to (0 for a fresh cell).
 */
export function loadFixture(id, at, { anode = 'sn', cathode = 'pb', cAnode0 = 1, cCathode0 = 1, counts = false, tick = 0, title = 'Cell under load' } = {}) {
  const w = 150; const h = 74;
  const lx = 5; const rx = 40;
  return {
    id, kind: 'cellloadrun', label: title, at: { ...at }, size: { w, h }, runLabel: 'Run',
    dials: { tick: { min: 0, max: LOAD.maxTick, step: 1, value: tick, label: 'Time' } },
    props: {
      hidden: ['tick'], backdrop: true, anode, cathode, cAnode0, cCathode0, counts, lx, rx,
      meter: { x: 9, y: 11, w: 30, h: 7.4 }, load: { x: 44, w: 16 },
      plot: { x0: 80, y0: 14, w: 64, h: 44, vMax: 0.012 }
    }
  };
}

/* ------------------------------------------------------------------ the read bench: set concentrations, read the voltage, keep a line */

function settingConc(f, idx) { return f.props.aDial ? CONC_STEPS[idx - 1] : f.props.aC; }

/** What a read bench shows: the concentrations as set, the last reading and a line for each setting read. */
export function readRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const idx = p.aDial ? Math.round(f.dials.a.value) : 1;
  const aC = settingConc(f, idx);
  const V = i => readAt(p.right, p.left, settingConc(f, i), p.cC);
  const rows = [];
  for (const s of [1, 2]) if (Math.round(f.dials[`s${s}`]?.value ?? 0) === 1) rows.push({ idx: s, aC: settingConc(f, s), cC: p.cC, V: V(s) });
  const last = Math.round(f.dials.last?.value ?? 0);
  return { f, aC, cC: p.cC, idx, rows, last, now: last ? { aC: settingConc(f, last), cC: p.cC, V: V(last) } : null };
}

function paintRead(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = readRead(state, f.id);
  const L = METALS[p.left]; const R = METALS[p.right];
  const cy = p.cy;
  const lbx = p.lx + CUP.w / 2; const rbx = p.rx + CUP.w / 2;
  const m = p.meter;
  wire(ctx, F, [[lbx, cy - 5], [lbx, m.y + m.h / 2], [m.x, m.y + m.h / 2]]);
  wire(ctx, F, [[rbx, cy - 5], [rbx, m.y + m.h / 2], [m.x + m.w, m.y + m.h / 2]]);
  beakerAt(ctx, F, p.lx, cy, CUP.w, CUP.h);
  beakerAt(ctx, F, p.rx, cy, CUP.w, CUP.h);
  bar(ctx, F, lbx, cy - 5, cy + CUP.h * 0.9, p.left);
  bar(ctx, F, rbx, cy - 5, cy + CUP.h * 0.9, p.right);
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(2, F.len(0.9));
  ctx.beginPath(); ctx.moveTo(F.x(p.lx + CUP.w - 2), F.y(cy + CUP.h * 0.5)); ctx.lineTo(F.x(p.lx + CUP.w - 2), F.y(cy - 1)); ctx.lineTo(F.x(p.rx + 2), F.y(cy - 1)); ctx.lineTo(F.x(p.rx + 2), F.y(cy + CUP.h * 0.5)); ctx.stroke();
  ctx.lineWidth = 1;
  const wired = p.wired;
  meterBox(ctx, F, m, wired ? 'right against left' : 'Not connected', wired && r.now ? `${voltText(r.now.V)} V` : '—', wired && !!r.now);
  put(ctx, L.symbol, F.x(p.lx + CUP.w / 2), F.y(cy + CUP.h + 2.6), F.size(2.8, 7), { color: TEXT, weight: 700 });
  put(ctx, R.symbol, F.x(p.rx + CUP.w / 2), F.y(cy + CUP.h + 2.6), F.size(2.8, 7), { color: TEXT, weight: 700 });
  put(ctx, `${L.ion} ${concLabel(r.aC)}`, F.x(p.lx + CUP.w / 2), F.y(cy + CUP.h + 5.8), F.size(1.9, 5.6), { color: DUST, maxW: F.len(CUP.w + 8) });
  put(ctx, `${R.ion} ${concLabel(r.cC)}`, F.x(p.rx + CUP.w / 2), F.y(cy + CUP.h + 5.8), F.size(1.9, 5.6), { color: DUST, maxW: F.len(CUP.w + 8) });
  if (p.aDial) {
    r.rows.forEach((row, i) => {
      const y = cy + CUP.h + 11.4 + i * 4;
      put(ctx, `${L.ion} ${concLabel(row.aC)}`, F.x(3), F.y(y), F.size(2.4, 6.4), { align: 'left', color: DUST });
      put(ctx, `${voltText(row.V)} V`, F.x(f.size.w - 3), F.y(y), F.size(2.6, 6.8), { align: 'right', color: AMBER, weight: 700 });
    });
  }
}

function runRead(state, fid) {
  const f = state.fixtures[fid];
  const idx = f.props.aDial ? Math.round(f.dials.a.value) : 1;
  const V = readAt(f.props.right, f.props.left, settingConc(f, idx), f.props.cC);
  return { x: idx, y: Math.round(V * 1000) / 1000, label: fid, dials: { [fid]: { last: idx, [`s${idx}`]: 1 } } };
}

registerFixture('cellloadread', {
  paint: paintRead,
  run: runRead,
  dress3d: (f, state, c) => dishes(f, state, c, [{ x: f.props.lx, y: f.props.cy, w: CUP.w, h: CUP.h }, { x: f.props.rx, y: f.props.cy, w: CUP.w, h: CUP.h }])
});

/**
 * A two-beaker cell, the `left` metal giving to the `right` metal's ions, read by a voltmeter. `aC` the left ion concentration (mol/L, or a dial of
 * the two settings when `aDial`), `cC` the right ion concentration. `wired: false` leaves it unconnected (no Run key). `w` is the width.
 */
export function readFixture(id, at, { left = 'zn', right = 'cu', aC = 1, cC = 1, aDial = false, aLabel = null, wired = true, w = 60, title = null } = {}) {
  const oy = aDial ? 11 : 0;
  const cy = 22 + oy;
  const logRows = aDial ? 2 : 0;
  const h = Math.round((cy + CUP.h + 11.4 + logRows * 4 + 6) * 10) / 10;
  const lx = 4; const rx = w - 4 - CUP.w;
  const mw = Math.min(24, w - 24);
  const meter = { x: (w - mw) / 2, y: 7 + oy, w: mw, h: 7.4 };
  const dials = {
    last: { min: 0, max: 2, step: 1, value: 0, label: 'Last run' },
    s1: { min: 0, max: 1, step: 1, value: 0, label: 'Read 1' },
    s2: { min: 0, max: 1, step: 1, value: 0, label: 'Read 2' },
    ...(aDial ? { a: { min: 1, max: 2, step: 1, value: 1, label: aLabel ?? `${METALS[left].ion}`, labels: CONC_STEPS.map(concLabel) } } : {})
  };
  return {
    id, kind: 'cellloadread', label: title ?? `${METALS[left].symbol} and ${METALS[right].symbol}`, at: { ...at }, size: { w, h },
    ...(wired ? { runLabel: 'Run' } : { noRun: true }),
    dials,
    props: { hidden: ['last', 's1', 's2'], backdrop: true, left, right, aC, cC, aDial, wired, lx, rx, cy, meter }
  };
}

/* ------------------------------------------------------------------ the concentration cell: voltmeter and ammeter */

/** What a concentration cell reads once it has been run: the signed voltage (right bar against left) and which way the needle swings. */
export function ccRead(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const ran = Math.round(f.dials.ran.value) === 1;
  const V = concCellSigned(p.metal, p.cLeft, p.cRight);
  return { f, ran, V, needle: ran ? Math.sign(V) : 0 };
}

function paintCC(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = ccRead(state, f.id);
  const M = METALS[p.metal];
  const cy = p.cy;
  const lbx = p.lx + CUP.w / 2; const rbx = p.rx + CUP.w / 2;
  const my = p.meter.y + p.meter.h / 2;
  wire(ctx, F, [[lbx, cy - 5], [lbx, my], [p.meter.x, my]]);
  wire(ctx, F, [[p.meter.x + p.meter.w, my], [p.amm.x, my]]);
  wire(ctx, F, [[p.amm.x + p.amm.w, my], [rbx, my], [rbx, cy - 5]]);
  beakerAt(ctx, F, p.lx, cy, CUP.w, CUP.h);
  beakerAt(ctx, F, p.rx, cy, CUP.w, CUP.h);
  bar(ctx, F, lbx, cy - 5, cy + CUP.h * 0.9, p.metal);
  bar(ctx, F, rbx, cy - 5, cy + CUP.h * 0.9, p.metal);
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(2, F.len(0.9));
  ctx.beginPath(); ctx.moveTo(F.x(p.lx + CUP.w - 2), F.y(cy + CUP.h * 0.5)); ctx.lineTo(F.x(p.lx + CUP.w - 2), F.y(cy - 1)); ctx.lineTo(F.x(p.rx + 2), F.y(cy - 1)); ctx.lineTo(F.x(p.rx + 2), F.y(cy + CUP.h * 0.5)); ctx.stroke();
  ctx.lineWidth = 1;
  meterBox(ctx, F, p.meter, 'Voltmeter', r.ran ? `${fmt(r.V, 3)} V` : '—', r.ran);
  // The ammeter: a half dial, its needle swinging toward the bar the electrons go to.
  const a = p.amm; const ax = a.x + a.w / 2; const ay = a.y + a.h;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(a.x), F.y(a.y), F.len(a.w), F.len(a.h));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(a.x)) + 0.5, Math.round(F.y(a.y)) + 0.5, Math.round(F.len(a.w)), Math.round(F.len(a.h)));
  ctx.strokeStyle = DIM; ctx.beginPath(); ctx.arc(F.x(ax), F.y(ay - 1), F.len(7), Math.PI * 1.18, Math.PI * 1.82); ctx.stroke();
  const ang = -Math.PI / 2 + r.needle * 0.62;
  ctx.strokeStyle = r.ran ? AMBER : DUST; ctx.lineWidth = Math.max(1.6, F.len(0.4));
  ctx.beginPath(); ctx.moveTo(F.x(ax), F.y(ay - 1)); ctx.lineTo(F.x(ax) + Math.cos(ang) * F.len(7.4), F.y(ay - 1) + Math.sin(ang) * F.len(7.4)); ctx.stroke(); ctx.lineWidth = 1;
  put(ctx, 'Ammeter', F.x(ax), F.y(a.y - 2.2), F.size(1.9, 5.6), { color: DUST });
  // Names and concentrations.
  const names = p.names;
  put(ctx, names[0], F.x(p.lx + CUP.w / 2), F.y(cy + CUP.h + 2.6), F.size(2.6, 7), { color: TEXT, weight: 700 });
  put(ctx, names[1], F.x(p.rx + CUP.w / 2), F.y(cy + CUP.h + 2.6), F.size(2.6, 7), { color: TEXT, weight: 700 });
  const cl = p.sealed ? `${M.ion} ?` : `${M.ion} ${concLabel(p.cLeft)}`;
  const cr = p.sealed ? `${M.ion} ?` : `${M.ion} ${concLabel(p.cRight)}`;
  put(ctx, cl, F.x(p.lx + CUP.w / 2), F.y(cy + CUP.h + 5.8), F.size(1.9, 5.6), { color: DUST, maxW: F.len(CUP.w + 8) });
  put(ctx, cr, F.x(p.rx + CUP.w / 2), F.y(cy + CUP.h + 5.8), F.size(1.9, 5.6), { color: DUST, maxW: F.len(CUP.w + 8) });
}

function runCC(state, fid) {
  return { x: 1, y: Math.round(ccRead(state, fid).V * 1000) / 1000, label: fid, dials: { [fid]: { ran: 1 } } };
}

registerFixture('cellloadcc', {
  paint: paintCC,
  run: runCC,
  dress3d: (f, state, c) => dishes(f, state, c, [{ x: f.props.lx, y: f.props.cy, w: CUP.w, h: CUP.h }, { x: f.props.rx, y: f.props.cy, w: CUP.w, h: CUP.h }])
});

/**
 * A concentration cell of one metal (a key of `METALS`): `cLeft` and `cRight` in mol/L. `sealed` prints "?" for the concentrations and `names`
 * labels the beakers ("Beaker A", "Beaker B" by default).
 */
export function ccFixture(id, at, { metal = 'cu', cLeft = 1, cRight = 0.01, sealed = false, names = ['Left', 'Right'], title = 'Concentration cell' } = {}) {
  const w = 82; const cy = 22;
  const h = Math.round((cy + CUP.h + 5.8 + 14) * 10) / 10;
  const lx = 5; const rx = w - 5 - CUP.w;
  return {
    id, kind: 'cellloadcc', label: title, at: { ...at }, size: { w, h }, runLabel: 'Run',
    dials: { ran: { min: 0, max: 1, step: 1, value: 0, label: 'Run' } },
    props: { hidden: ['ran'], backdrop: true, metal, cLeft, cRight, sealed, names, lx, rx, cy, meter: { x: 16, y: 10, w: 24, h: 7.4 }, amm: { x: 46, y: 8, w: 22, h: 11 } }
  };
}
