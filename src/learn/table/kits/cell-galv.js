/**
 * kits/cell-galv.js — the open cell, its current plot, its balance and its loose parts, registered on the cell kit (`cell-registry.js`).
 * Brinewire's `q3-galvanic`.
 *
 *   GALV   two beakers, each holding one metal in a solution of its own ions at 1.00 M, a wire over the top and, on the wire, an ammeter
 *          whose needle swings toward the beaker the electrons move toward (the dial prints which side is which: how to read it, not the
 *          answer). What stands between the beakers is the stage's choice: nothing, a seat that takes a piece, or a fixed tube of salt
 *          solution. The "Run" key runs the cell for a fixed time. Options add the parts a stage needs and no more: a second-wire seat, strip
 *          seats above the beakers (so a strip can be weighed and put back), a window in each beaker that counts its ions and the atoms in
 *          its strip, a bridge window, two mark seats, a dial for the player's own answer.
 *   PLOT   a flat plot of current against time drawn from the recorder's rows, up to the second the run reached; one line for each run.
 *   BAL    a balance. A strip laid on its pan prints its mass; lifted off, the pan prints nothing, and the list keeps what was read.
 *   Pieces: the salt tube, the glass rod, the second wire, the strip.
 *
 * A THIN WRAPPER over `engine/celldata-galvanic.js`: a painter decides nothing. Every current, count and mass is the planner's. The plot, the
 * windows and the dial are flat pictures; at 3D On the beakers stand in low glass dishes and the strips are metal bars (`dress3d`, `piece3d`).
 */

import * as THREE from 'three';
import { PLATE_COLORS } from '../../engine/plates.js';
import { roundedSlab } from '../../engine/table-props.js';
import { metalTint } from '../../engine/lab-props.js';
import { registerFixture, registerPiece } from './cell-registry.js';
import { frameOf } from './matter-draw.js';
import { seatedIn } from './heat-read.js';
import { METALS } from '../../engine/celldata.js';
import {
  RUN_SECONDS, WEIGH_RUN_SECONDS, START_ATOMS, loopCurrent, currentAt, currentTrace, stopSecond, signedCurrent, windowCounts,
  bridgeDrift, stripChange, stripMass, BRIDGE_SLOTS
} from '../../engine/celldata-galvanic.js';
import { put, METAL_INK } from './cell-board.js';
import './cell-galv-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;
const BRIDGE_INK = '#8fb0c8';
const SALT_INK = '#b8afa0';
export const RUN_INKS = Object.freeze(['#dcd6cc', '#78a142', '#8fb0c8', '#c9a43a', '#b66a3e', '#a8aba5']);
const NEEDLE_MAX = 1.5;
const LINKS = ['none', 'bridge', 'rod'];
const LINK_WORDS = { none: 'nothing between the beakers', bridge: 'salt tube', rod: 'glass rod' };
/** A fixed shuffle of the 24 cells of a beaker's window, so particles keep their places from one picture to the next. */
const ORDER = Object.freeze([5, 12, 0, 19, 8, 15, 3, 22, 10, 17, 1, 20, 6, 13, 23, 9, 2, 16, 11, 4, 18, 7, 21, 14]);
const GRID = { cols: 6, rows: 4 };

/* ------------------------------------------------------------------ what the rig has read */

/** The link the cell has right now: a fixed tube, or the piece lying in the seat between the beakers. */
function linkNow(state, f) {
  const p = f.props;
  if (p.across === 'fixed') return 'bridge';
  if (p.across !== 'seat') return 'none';
  const piece = seatedIn(state, p.linkSeat);
  if (!piece) return 'none';
  return piece.kind === 'cellgalvtube' ? 'bridge' : 'rod';
}

/** What the rig has read: the runs so far, the link and the second wire at the last run, the needle's current, the last run's trace. */
export function galvRead(state, fid) {
  const f = state.fixtures[fid];
  const d = n => Math.round(f.dials[n]?.value ?? 0);
  const runs = d('runs');
  const rows = state.recorder.rows.filter(r => r.label === `${fid}|${runs}`);
  const trace = f.props.plot ? rows.map(r => ({ t: r.x, I: r.y })) : [];
  const hist = d('hist');
  const digits = [];
  for (let k = 1; k <= runs; k++) digits.push(Math.floor(hist / 10 ** (runs - k)) % 10);
  const link = LINKS[d('across')] || 'none';
  return {
    f, runs, ran: runs > 0, link, w2: d('w2') === 1, I: d('iend') / 1000, trace, stop: trace.length ? stopSecond(trace) : null,
    past: digits.map((x, i) => ({ k: i + 1, link: LINKS[x % 3], w2: x >= 3 })),
    says: f.dials.says ? Math.round(f.dials.says.value) : null
  };
}

/** The reading a rig's strips give once weighed: `{ start, now }` masses for the strip of a metal, from the balance's list. */
export function weighed(state, balId, name) {
  const rows = (state.fixtures[balId]?.props.noted || []).filter(n => n.name === name);
  return rows.length ? { first: rows[0].m, last: rows[rows.length - 1].m, count: rows.length } : null;
}

/* ------------------------------------------------------------------ painting */

function beakerAt(ctx, F, x, y, w, h, liquid) {
  ctx.fillStyle = liquid; ctx.fillRect(F.x(x + 0.5), F.y(y + 3), F.len(w - 1), F.len(h - 3.5));
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.4, F.len(0.35));
  ctx.beginPath(); ctx.moveTo(F.x(x), F.y(y)); ctx.lineTo(F.x(x), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y + h)); ctx.lineTo(F.x(x + w), F.y(y)); ctx.stroke();
  ctx.lineWidth = 1;
}

function dot(ctx, F, x, y, r, shape, ink, hollow) {
  ctx.lineWidth = Math.max(1, F.len(0.28));
  if (shape === 'c') {
    ctx.beginPath(); ctx.arc(F.x(x), F.y(y), F.len(r), 0, Math.PI * 2);
    if (hollow) { ctx.strokeStyle = ink; ctx.stroke(); } else { ctx.fillStyle = ink; ctx.fill(); }
  } else if (hollow) { ctx.strokeStyle = ink; ctx.strokeRect(F.x(x - r), F.y(y - r), F.len(2 * r), F.len(2 * r)); }
  else { ctx.fillStyle = ink; ctx.fillRect(F.x(x - r), F.y(y - r), F.len(2 * r), F.len(2 * r)); }
  ctx.lineWidth = 1;
}

/** The centre of window cell `i` of a beaker whose particles fill [x0, x1] across and the liquid below `by`. */
function cellAt(i, x0, x1, by, cupH) {
  const c = ORDER[i] % GRID.cols; const r = Math.floor(ORDER[i] / GRID.cols);
  const cw = (x1 - x0) / GRID.cols; const ch = (cupH - 5) / GRID.rows;
  return { x: x0 + cw * (c + 0.5), y: by + 4 + ch * (r + 0.5) };
}

function paintAmmeter(ctx, F, p, I) {
  const cx = p.cx; const y = p.ay; const w = p.boxW;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(cx - w / 2), F.y(y), F.len(w), F.len(19));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(cx - w / 2)) + 0.5, Math.round(F.y(y)) + 0.5, Math.round(F.len(w)), Math.round(F.len(19)));
  put(ctx, 'Ammeter: the needle points', F.x(cx), F.y(y + 2.4), F.size(2.1, 6), { color: DUST, maxW: F.len(w - 2) });
  put(ctx, 'the way electrons move', F.x(cx), F.y(y + 5.1), F.size(2.1, 6), { color: DUST, maxW: F.len(w - 2) });
  const px = cx; const py = y + 17.4; const R = 8.4;
  ctx.strokeStyle = DIM; ctx.lineWidth = Math.max(1, F.len(0.3));
  for (let a = -60; a <= 60; a += 30) {
    const th = (a * Math.PI) / 180;
    ctx.beginPath(); ctx.moveTo(F.x(px + Math.sin(th) * (R - 1.4)), F.y(py - Math.cos(th) * (R - 1.4))); ctx.lineTo(F.x(px + Math.sin(th) * R), F.y(py - Math.cos(th) * R)); ctx.stroke();
  }
  ctx.lineWidth = 1;
  put(ctx, 'left', F.x(cx - w / 2 + 3.6), F.y(y + 16.6), F.size(2.0, 6), { color: DUST });
  put(ctx, 'right', F.x(cx + w / 2 - 4.2), F.y(y + 16.6), F.size(2.0, 6), { color: DUST });
  const th = Math.max(-1, Math.min(1, I / NEEDLE_MAX)) * (60 * Math.PI) / 180;
  ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.6, F.len(0.45));
  ctx.beginPath(); ctx.moveTo(F.x(px), F.y(py)); ctx.lineTo(F.x(px + Math.sin(th) * (R - 0.6)), F.y(py - Math.cos(th) * (R - 0.6))); ctx.stroke();
  ctx.lineWidth = 1;
  ctx.fillStyle = AMBER; ctx.beginPath(); ctx.arc(F.x(px), F.y(py), Math.max(1.6, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
}

function paintGalv(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = galvRead(state, f.id);
  const link = p.across === 'fixed' ? 'bridge' : linkNow(state, f);
  const counts = p.windows ? windowCounts(p.left, p.right, { ran: r.ran, link: 'bridge' }) : null;
  const sides = [['left', p.lx, p.left, p.exL], ['right', p.rx, p.right, p.exR]];
  const W = p.cupW; const H = p.cupH; const by = p.by;

  // The beakers, each with its liquid; the strips; the particles in the windows.
  sides.forEach(([side, x, id, ex], k) => {
    beakerAt(ctx, F, x, by, W, H, '#2f4a47');
    const seated = p.strips ? seatedIn(state, k === 0 ? p.seatL : p.seatR) : null;
    const hasBar = p.strips ? !!seated : true;
    const barId = p.strips ? seated?.props.metal : id;
    const sealed = p.sealed;
    if (hasBar) {
      const c = counts ? counts[side] : null;
      const frac = c ? Math.min(1, c.atoms / START_ATOMS) : 1;
      const top = p.strips ? by - 1 : p.ay + 17;
      const bottom = by + 3 + (H - 5) * frac;
      const coat = c && c.atoms > START_ATOMS ? 0.9 * (c.atoms - START_ATOMS) : 0;
      if (coat > 0) { ctx.fillStyle = METAL_INK[id] || '#b66a3e'; ctx.fillRect(F.x(ex - 1.2 - coat / 2), F.y(by + 3), F.len(2.4 + coat), F.len(bottom - by - 3)); }
      ctx.fillStyle = sealed ? '#8a8780' : (METAL_INK[barId] || '#9a9690');
      ctx.fillRect(F.x(ex - 1.2), F.y(top), F.len(2.4), F.len(bottom - top));
    }
    if (counts) {
      const c = counts[side];
      const x0 = side === 'left' ? x + 9 : x + 1.5; const x1 = side === 'left' ? x + W - 1.5 : x + W - 9;
      const metalInk = METAL_INK[id] || '#b8afa0';
      for (let n = 0; n < c.metal; n++) { const q = cellAt(n < 8 ? n : 16 + (n - 8), x0, x1, by, H); dot(ctx, F, q.x, q.y, 0.95, 'c', metalInk, false); }
      if (p.windows === 'full') {
        for (let n = 0; n < c.sulfate; n++) { const q = cellAt(8 + n, x0, x1, by, H); dot(ctx, F, q.x, q.y, 0.9, 's', SALT_INK, false); }
        const start = 16 + Math.max(0, c.metal - 8);
        for (let n = 0; n < c.anion; n++) { const q = cellAt(start + n, x0, x1, by, H); dot(ctx, F, q.x, q.y, 0.9, 's', BRIDGE_INK, true); }
        for (let n = 0; n < c.cation; n++) { const q = cellAt(start + n, x0, x1, by, H); dot(ctx, F, q.x, q.y, 0.95, 'c', BRIDGE_INK, true); }
      }
    }
  });

  // The wires: each strip up to the wire row, across through the ammeter (or straight across).
  const wy = p.ay + 15;
  ctx.strokeStyle = DUST; ctx.lineWidth = Math.max(1.2, F.len(0.3));
  const wexL = p.strips ? p.lx + W / 2 : p.exL; const wexR = p.strips ? p.rx + W / 2 : p.exR;
  const wTop = p.strips ? by - 9.5 : p.ay + 17;
  ctx.beginPath(); ctx.moveTo(F.x(wexL), F.y(wTop)); ctx.lineTo(F.x(wexL), F.y(wy));
  ctx.lineTo(F.x(p.ammeter ? p.cx - p.boxW / 2 : wexR), F.y(wy)); ctx.stroke();
  if (p.ammeter) {
    ctx.beginPath(); ctx.moveTo(F.x(p.cx + p.boxW / 2), F.y(wy)); ctx.lineTo(F.x(wexR), F.y(wy)); ctx.lineTo(F.x(wexR), F.y(wTop)); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(F.x(wexR), F.y(wy)); ctx.lineTo(F.x(wexR), F.y(wTop)); ctx.stroke();
  }
  if (p.wireSeat && seatedIn(state, p.wireSeat)) {
    const ty = p.wireY;
    ctx.strokeStyle = '#b66a3e';
    ctx.beginPath(); ctx.moveTo(F.x(wexL + 3), F.y(wTop)); ctx.lineTo(F.x(wexL + 3), F.y(ty)); ctx.lineTo(F.x(wexR - 3), F.y(ty)); ctx.lineTo(F.x(wexR - 3), F.y(wTop)); ctx.stroke();
  }
  ctx.lineWidth = 1;
  if (p.ammeter) paintAmmeter(ctx, F, p, r.I);

  // What stands between the beakers: a tube of salt solution, a glass rod, or nothing.
  if (link !== 'none') {
    const x1 = p.lx + W - 4; const x2 = p.rx + 4; const ty = by - 5;
    const thick = p.bridgeWindow;
    ctx.strokeStyle = link === 'bridge' ? BRIDGE_INK : '#8d9494'; ctx.lineWidth = Math.max(2, F.len(thick ? 6.2 : link === 'rod' ? 1.5 : 1.1));
    ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(F.x(x1), F.y(by + 3)); ctx.lineTo(F.x(x1), F.y(ty)); ctx.lineTo(F.x(x2), F.y(ty)); ctx.lineTo(F.x(x2), F.y(by + 3)); ctx.stroke();
    ctx.lineWidth = 1;
    if (thick) {
      ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x1 + 1), F.y(ty - 2.4), F.len(x2 - x1 - 2), F.len(4.8));
      const L = x2 - x1 - 2; const sp = L / BRIDGE_SLOTS;
      const drift = bridgeDrift(p.left, p.right);
      const shift = r.ran ? 0.4 * sp : 0;
      const dirAn = drift.anions === 'left' ? -1 : 1;
      for (let n = 0; n < BRIDGE_SLOTS; n++) {
        const x0 = x1 + 1 + sp * (n + 0.5);
        const ya = ty + 1.2; const yc = ty - 1.2;
        const xa = x0 + dirAn * shift; const xc = x0 - dirAn * shift;
        if (r.ran) {
          ctx.strokeStyle = DUST; ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(ya)); ctx.lineTo(F.x(xa), F.y(ya)); ctx.stroke();
          ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(yc)); ctx.lineTo(F.x(xc), F.y(yc)); ctx.stroke();
        }
        dot(ctx, F, xa, ya, 0.85, 's', BRIDGE_INK, true);
        dot(ctx, F, xc, yc, 0.85, 'c', BRIDGE_INK, true);
      }
    }
  }

  // The names and the counts under the beakers.
  sides.forEach(([side, x, id], k) => {
    const cx = x + W / 2;
    const m = METALS[id];
    put(ctx, p.sealed ? `Solution ${k === 0 ? 'A' : 'B'}` : m.symbol, F.x(cx), F.y(by + H + 2.8), F.size(2.8, 7), { color: TEXT, weight: 700 });
    if (!p.sealed) put(ctx, `${m.ion} 1.00 M`, F.x(cx), F.y(by + H + 6), F.size(2.0, 5.6), { color: DUST, maxW: F.len(W + 6) });
    if (counts) {
      const c = counts[side];
      const lines = [[`${m.ion} ${c.metal}`, METAL_INK[id] || DUST]];
      if (p.windows === 'full') {
        lines.push([`SO₄²⁻ ${c.sulfate}`, SALT_INK]);
        lines.push(c.anion ? [`NO₃⁻ ${c.anion}`, BRIDGE_INK] : c.cation ? [`K⁺ ${c.cation}`, BRIDGE_INK] : ['bridge ions 0', DIM]);
      } else lines.push([`atoms in strip ${c.atoms}`, DUST]);
      lines.forEach(([s, ink], j) => put(ctx, s, F.x(cx), F.y(by + H + 9.6 + j * 3.3), F.size(2.2, 6), { color: ink, maxW: F.len(W + 4) }));
    }
  });
  if (p.runText) put(ctx, `Runs for ${p.runText}`, F.x(3), F.y(f.size.h - 3.6), F.size(2.2, 6), { align: 'left', color: DUST });
}

/** Low glass dishes round the two beakers at `3D On`. */
function dressGalv(f, state, c) {
  const { THREE: T, scale: s, toPlate, box } = c;
  const p = f.props;
  const group = new T.Group();
  const H = 0.024; const t = 0.005;
  const wall = (cx, cy, lw, ld, dx, dz) => {
    const m = new T.Mesh(new T.BoxGeometry(lw, H, ld), c.mats.labGlass);
    const q = toPlate({ x: cx, y: cy });
    m.position.set(q.x + dx, c.ground + H / 2, q.z + dz);
    m.castShadow = false; m.receiveShadow = false;
    group.add(m);
  };
  for (const x of [p.lx, p.rx]) {
    const w = p.cupW * s; const d = p.cupH * s;
    const cx = box.x0 + x + p.cupW / 2; const cy = box.y0 + p.by + p.cupH / 2;
    wall(cx, cy, w + 2 * t, t, 0, -d / 2 - t / 2);
    wall(cx, cy, w + 2 * t, t, 0, d / 2 + t / 2);
    wall(cx, cy, t, d, -w / 2 - t / 2, 0);
    wall(cx, cy, t, d, w / 2 + t / 2, 0);
  }
  return group;
}

/* ------------------------------------------------------------------ the run */

/** The Run key: run the cell for its fixed time. The reading is the planner's; the strips seated in the beakers are changed by it. */
function run(state, fid) {
  const f = state.fixtures[fid];
  const p = f.props;
  const r = galvRead(state, fid);
  if (r.runs >= 9) return { noop: 'The cell has been run nine times.' };
  const link = linkNow(state, f);
  const w2 = p.wireSeat && seatedIn(state, p.wireSeat) ? 1 : 0;
  const seconds = p.minutes ? WEIGH_RUN_SECONDS : RUN_SECONDS;
  const stamp = {};
  if (p.strips) {
    const l = seatedIn(state, p.seatL); const q = seatedIn(state, p.seatR);
    if (!l || !q) return { noop: 'Put a strip in each beaker first.' };
    if (l.props.metal !== p.left || q.props.metal !== p.right) return { noop: p.sealed ? 'Each strip goes in the beaker with its letter.' : 'Each strip goes in the beaker of its own ions.' };
    stamp[l.id] = { dm: (l.props.dm || 0) + stripChange(p.left, p.right, p.left, seconds) };
    stamp[q.id] = { dm: (q.props.dm || 0) + stripChange(p.left, p.right, p.right, seconds) };
  }
  const I0 = loopCurrent(p.left, p.right);
  const n = r.runs + 1;
  const code = LINKS.indexOf(link);
  const trace = currentTrace(I0, link);
  const Iend = signedCurrent(p.left, p.right, currentAt(I0, link, RUN_SECONDS));
  const rows = p.plot
    ? trace.map(t => ({ x: t.t, y: t.I, label: `${fid}|${n}` }))
    : [{ x: n, y: Math.round(Math.abs(Iend) * 1000) / 1000, label: `${fid}|${n}` }];
  const hist = ((Math.round(f.dials.hist.value) * 10) + code + 3 * w2) % 1000000;
  return {
    x: rows[rows.length - 1].x, y: rows[rows.length - 1].y, label: fid, rows, stamp,
    dials: { [fid]: { runs: n, across: code, w2, iend: Math.round(Iend * 1000), hist, ran: 1 } }
  };
}

registerFixture('cellgalv', { paint: paintGalv, run, dress3d: dressGalv });

/**
 * The open cell with metal ids `left` and `right` (keys of `METALS`). Options:
 *   link     'seat' (a seat between the beakers takes a piece), 'fixed' (a tube of salt solution is in place) or 'none'
 *   ammeter  the ammeter on the wire (default true)           wire2   a seat for a second wire
 *   strips   strip seats above the beakers (the strips are pieces)         sealed  the metals are hidden behind letters
 *   windows  'metal' (metal ions and strip atoms counted) or 'full' (also sulfate and bridge ions)     bridgeWindow  the tube shows its ions
 *   marks    two seats above the beakers for the player's cards            says    a dial on the rig for the player's answer
 *   plot     the run's rows are the whole trace (the plot fixture draws them)     minutes  the run lasts an hour (for weighing)
 *   compact  a narrower cell (three stand side by side)
 * Returns `{ fixture, slots, size }`; the stage adds the slots to `zones.slots`.
 */
export function galvFixture(id, at, {
  left, right, link = 'fixed', ammeter = true, wire2 = false, strips = false, sealed = false, windows = null, bridgeWindow = false,
  marks = false, says = false, plot = false, minutes = false, compact = false, title = null
} = {}) {
  const cupW = compact ? 19 : 28; const gap = compact ? 12 : 20; const cupH = 20;
  const lx = 3; const rx = lx + cupW + gap;
  const w = rx + cupW + 3;
  const oy = says ? 11 : 0;
  const ay = oy + (wire2 ? 17 : marks ? 13 : 2);
  const by = ay + 30;
  const rows = windows === 'full' ? 3 : windows === 'metal' ? 2 : 0;
  const h = Math.round((by + cupH + 10 + rows * 3.3 + 9) * 10) / 10;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const cx = w / 2;
  const exL = strips ? lx + cupW / 2 : windows ? lx + 4.2 : lx + cupW / 2;
  const exR = strips ? rx + cupW / 2 : windows ? rx + cupW - 4.2 : rx + cupW / 2;
  const slot = (key, label, rx0, ry0, sw = 18, sh = 9) => ({ id: `${id}.${key}`, label, at: { x: x0 + rx0, y: y0 + ry0 }, size: { w: sw, h: sh } });
  const slots = [];
  const ids = {};
  if (link === 'seat') { const s = slot('link', 'Between beakers', cx, by - 5); slots.push(s); ids.linkSeat = s.id; }
  if (wire2) { const s = slot('wire', 'Wire seat', cx, oy + 5.5); slots.push(s); ids.wireSeat = s.id; }
  if (strips) {
    const a = slot('L', ' ', lx + cupW / 2, by - 5); const b = slot('R', ' ', rx + cupW / 2, by - 5);
    slots.push(a, b); ids.seatL = a.id; ids.seatR = b.id;
  }
  if (marks) {
    const a = slot('mL', 'Left strip', lx + cupW / 2, oy + 5.5); const b = slot('mR', 'Right strip', rx + cupW / 2, oy + 5.5);
    slots.push(a, b); ids.markL = a.id; ids.markR = b.id;
  }
  const dials = {
    runs: { min: 0, max: 9, step: 1, value: 0, label: 'Runs' },
    ran: { min: 0, max: 1, step: 1, value: 0, label: 'Ran' },
    across: { min: 0, max: 2, step: 1, value: 0, label: 'Across' },
    w2: { min: 0, max: 1, step: 1, value: 0, label: 'Wire' },
    iend: { min: -5000, max: 5000, step: 1, value: 0, label: 'Current' },
    hist: { min: 0, max: 999999, step: 1, value: 0, label: 'History' },
    ...(says ? { says: { min: 1, max: 3, step: 1, value: 3, label: 'Electrons move toward', labels: ['The left beaker', 'The right beaker', ' '] } } : {})
  };
  const fixture = {
    id, kind: 'cellgalv', label: title ?? 'Cell', at: { ...at }, size: { w, h }, runLabel: 'Run',
    dials,
    props: {
      hidden: ['runs', 'ran', 'across', 'w2', 'iend', 'hist'], backdrop: true,
      left, right, across: link, ammeter, wire2, strips, sealed, windows, bridgeWindow, marks, says, plot, minutes,
      lx, rx, cupW, cupH, ay, by, cx, boxW: 34, exL, exR, wireY: oy + 5.5,
      runText: minutes ? '1 hour' : `${RUN_SECONDS} s`, ...ids
    }
  };
  return { fixture, slots, size: { w, h } };
}

/* ------------------------------------------------------------------ the plot */

function paintPlot(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const r = galvRead(state, p.rig);
  const x0 = 11; const x1 = f.size.w - 3; const y0 = 7; const y1 = 37;
  const X = t => x0 + (t / RUN_SECONDS) * (x1 - x0);
  const Y = I => y1 - (I / p.yMax) * (y1 - y0);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(x0), F.y(y0), F.len(x1 - x0), F.len(y1 - y0));
  ctx.strokeStyle = 'rgba(140,131,118,0.28)';
  for (let v = 0; v <= p.yMax + 1e-9; v += p.yTick) {
    ctx.beginPath(); ctx.moveTo(F.x(x0), F.y(Y(v))); ctx.lineTo(F.x(x1), F.y(Y(v))); ctx.stroke();
    put(ctx, v.toFixed(1), F.x(x0 - 1.4), F.y(Y(v)), F.size(2.0, 6), { align: 'right', color: DUST });
  }
  for (let t = 0; t <= RUN_SECONDS; t += 2) {
    ctx.beginPath(); ctx.moveTo(F.x(X(t)), F.y(y1)); ctx.lineTo(F.x(X(t)), F.y(y1 + 1.2)); ctx.stroke();
    put(ctx, String(t), F.x(X(t)), F.y(y1 + 3.4), F.size(2.0, 6), { color: DUST });
  }
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(x0)) + 0.5, Math.round(F.y(y0)) + 0.5, Math.round(F.len(x1 - x0)), Math.round(F.len(y1 - y0)));
  put(ctx, 'seconds', F.x(x1), F.y(y1 + 7.2), F.size(2.0, 6), { color: DIM, align: 'right' });
  for (let k = 1; k <= r.runs; k++) {
    const rows = state.recorder.rows.filter(q => q.label === `${p.rig}|${k}`);
    const ink = RUN_INKS[(k - 1) % RUN_INKS.length];
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.6, F.len(k === r.runs ? 0.55 : 0.4)); ctx.beginPath();
    rows.forEach((q, i) => { const px = F.x(X(q.x)); const py = F.y(Y(q.y)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = ink;
    for (const q of rows) { ctx.beginPath(); ctx.arc(F.x(X(q.x)), F.y(Y(q.y)), Math.max(1.8, F.len(0.5)), 0, Math.PI * 2); ctx.fill(); }
  }
  // The key: what stood in the cell for each of the latest runs.
  const keyY = y1 + 11.4;
  r.past.slice(-4).forEach((q, i) => {
    const ink = RUN_INKS[(q.k - 1) % RUN_INKS.length];
    ctx.fillStyle = ink; ctx.fillRect(F.x(2.4), F.y(keyY + i * 3.3) - 3, 6, 6);
    put(ctx, `Run ${q.k}: ${LINK_WORDS[q.link]}${q.w2 ? ', second wire' : ''}`, F.x(6.4), F.y(keyY + i * 3.3), F.size(2.1, 6), { align: 'left', color: DUST, maxW: F.len(f.size.w - 9) });
  });
  put(ctx, 'Simplified: a real cell\'s current would', F.x(2.4), F.y(f.size.h - 5.4), F.size(2.0, 5.8), { align: 'left', color: DIM, maxW: F.len(f.size.w - 4) });
  put(ctx, 'fall to a small trickle, not exactly zero.', F.x(2.4), F.y(f.size.h - 2.6), F.size(2.0, 5.8), { align: 'left', color: DIM, maxW: F.len(f.size.w - 4) });
}

registerFixture('cellgalvplot', { paint: paintPlot });

/** The plot of the cell `rig`. `yMax` and `yTick` are the axis in amperes. */
export function plotFixture(id, at, { rig, yMax = 0.6, yTick = 0.2, title = 'Current in amperes' } = {}) {
  return {
    id, kind: 'cellgalvplot', label: title, at: { ...at }, size: { w: 84, h: 64 }, noRun: true, dials: {},
    props: { backdrop: true, rig, yMax, yTick }
  };
}

/* ------------------------------------------------------------------ the balance */

const massOf = piece => stripMass(piece.props.m0 || 0, piece.props.dm || 0);

function paintBal(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const s = seatedIn(state, p.seat);
  const w = f.size.w;
  ctx.strokeStyle = STEEL; ctx.lineWidth = Math.max(1.6, F.len(0.5));
  ctx.beginPath(); ctx.moveTo(F.x(3), F.y(15.5)); ctx.lineTo(F.x(w - 3), F.y(15.5)); ctx.stroke(); ctx.lineWidth = 1;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(3), F.y(18.5), F.len(w - 6), F.len(9));
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(3)) + 0.5, Math.round(F.y(18.5)) + 0.5, Math.round(F.len(w - 6)), Math.round(F.len(9)));
  put(ctx, s ? `${massOf(s).toFixed(2)} g` : '—', F.x(w / 2), F.y(23), F.size(4.6, 11), { color: s ? AMBER : DIM, weight: 700, maxW: F.len(w - 8) });
  put(ctx, 'Masses read', F.x(3), F.y(32), F.size(2.1, 6), { align: 'left', color: DUST, weight: 700 });
  (p.noted || []).slice(-5).forEach((n, i) => {
    put(ctx, n.name, F.x(3), F.y(35.8 + i * 3.4), F.size(2.2, 6), { align: 'left', color: TEXT, maxW: F.len(w * 0.5) });
    put(ctx, `${n.m.toFixed(2)} g`, F.x(w - 3), F.y(35.8 + i * 3.4), F.size(2.2, 6), { align: 'right', color: AMBER, weight: 700 });
  });
}

/** The balance keeps each distinct mass it has printed for a strip, in the order they were read. */
function settle(state) {
  for (const f of Object.values(state.fixtures)) {
    if (f.kind !== 'cellgalvbal') continue;
    const s = seatedIn(state, f.props.seat);
    if (!s) continue;
    const m = massOf(s);
    const noted = f.props.noted || (f.props.noted = []);
    const last = [...noted].reverse().find(n => n.name === s.label);
    if (!last || last.m !== m) noted.push({ name: s.label, m });
  }
}

registerFixture('cellgalvbal', { paint: paintBal, settle });

/** The balance: one pan (a seat) with a mass display and the list of what it has read. Returns `{ fixture, slot, size }`. */
export function balanceFixture(id, at, { title = 'Balance', w = 38 } = {}) {
  const h = 56;
  const x0 = at.x - w / 2; const y0 = at.y - h / 2;
  const slot = { id: `${id}.pan`, label: ' ', at: { x: x0 + w / 2, y: y0 + 9.5 }, size: { w: 18, h: 9 } };
  return {
    fixture: { id, kind: 'cellgalvbal', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { backdrop: true, seat: slot.id, noted: [] } },
    slot, size: { w, h }
  };
}

/* ------------------------------------------------------------------ the pieces */

const BAR = { hw: 8.6, hh: 5 };

function paintBarPiece(ctx, p, state, o) {
  const sc = o.sc;
  const x0 = o.x - BAR.hw * sc; const y0 = o.y - BAR.hh * sc; const w = BAR.hw * 2 * sc; const h = BAR.hh * 2 * sc;
  const strip = p.kind === 'cellgalvstrip';
  ctx.fillStyle = strip ? (p.props.sealed ? '#8a8780' : (METAL_INK[p.props.metal] || '#9a9690')) : '#1d1a16'; ctx.fillRect(x0, y0, w, h);
  ctx.strokeStyle = o.lit ? AMBER : STEEL; ctx.lineWidth = o.lit ? 2 : 1; ctx.strokeRect(x0 + 0.5, y0 + 0.5, w - 1, h - 1); ctx.lineWidth = 1;
  let ty = o.y; const tw = w - 1.4 * sc;
  if (!strip) {
    const gx = o.x - 2.2 * sc; const gw = 4.4 * sc; const gy = o.y - 1.9 * sc;
    ctx.lineWidth = Math.max(1.4, sc * 0.4);
    if (p.kind === 'cellgalvtube') { ctx.strokeStyle = BRIDGE_INK; ctx.beginPath(); ctx.moveTo(gx, gy + sc * 0.9); ctx.lineTo(gx, gy - sc * 0.8); ctx.lineTo(gx + gw, gy - sc * 0.8); ctx.lineTo(gx + gw, gy + sc * 0.9); ctx.stroke(); }
    else if (p.kind === 'cellgalvrod') { ctx.strokeStyle = '#a8b0b0'; ctx.beginPath(); ctx.moveTo(gx, gy); ctx.lineTo(gx + gw, gy); ctx.stroke(); }
    else { ctx.strokeStyle = '#b66a3e'; ctx.beginPath(); ctx.moveTo(gx, gy + sc * 0.7); ctx.lineTo(gx + gw * 0.3, gy - sc * 0.7); ctx.lineTo(gx + gw * 0.6, gy + sc * 0.7); ctx.lineTo(gx + gw, gy - sc * 0.7); ctx.stroke(); }
    ctx.lineWidth = 1;
    ty = o.y + 1.5 * sc;
  }
  put(ctx, p.label, o.x, ty, Math.max(8, Math.min(3.0 * sc, tw / (Math.max(2, p.label.length) * 0.6))), { color: strip ? '#16140f' : TEXT, weight: 700, maxW: tw });
}

const BAR_MATS = new WeakMap();
function barMaterial(mats, key, color) {
  let byKey = BAR_MATS.get(mats);
  if (!byKey) { byKey = new Map(); BAR_MATS.set(mats, byKey); }
  if (!byKey.has(key)) {
    const m = mats.labSteel.clone();
    m.color = new THREE.Color(color);
    byKey.set(key, m);
  }
  return byKey.get(key);
}

function pieceBar3d(p, state, c) {
  const { hw, hh, mats: m } = c;
  const g = new THREE.Group();
  const H = 0.018;
  const strip = p.kind === 'cellgalvstrip';
  const color = strip ? (p.props.sealed ? 0x8a8780 : metalTint(METALS[p.props.metal].symbol)) : ({ cellgalvtube: 0x4b6a7c, cellgalvrod: 0x6c7474, cellgalvwire: 0x7e4a2c }[p.kind]);
  const body = new THREE.Mesh(roundedSlab(hw * 2, hh * 2, H, Math.min(hw, hh) * 0.2, 0.002), barMaterial(m, strip ? (p.props.sealed ? 'sealed' : p.props.metal) : p.kind, color));
  body.castShadow = true; body.receiveShadow = true; g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(hw * 2 * 0.92, hh * 2 * 0.8), c.face());
  face.rotation.x = -Math.PI / 2; face.position.y = H + 0.0012; face.receiveShadow = true; g.add(face);
  g.userData.height = H + 0.002;
  return g;
}

for (const [kind, key] of [['cellgalvtube', 'tube'], ['cellgalvrod', 'rod'], ['cellgalvwire', 'wire'], ['cellgalvstrip', 'strip']]) {
  registerPiece(kind, {
    kind: { r: 8.6, rect: BAR, nojoin: true },
    paint: paintBarPiece,
    faceKey: p => `${kind}|${p.label}|${p.props.metal || ''}|${p.props.sealed ? 1 : 0}`,
    piece3d: pieceBar3d,
    printed: p => p.label
  });
  void key;
}

const TOOL = { tube: ['cellgalvtube', 'Salt tube', 'Fits between the beakers.'], rod: ['cellgalvrod', 'Glass rod', 'Fits between the beakers.'], wire: ['cellgalvwire', 'Second wire', 'Joins the two strips.'] };

/** A loose part for the cell: `which` is 'tube', 'rod' or 'wire'. */
export function toolPiece(id, which, at, { caption = null } = {}) {
  const [kind, label, cap] = TOOL[which];
  return { id, kind, label, at, props: {}, caption: caption ?? cap };
}

/** A strip of one metal (a key of `METALS`) with a start mass in grams. `sealed` hides the metal behind `label` (a letter). */
export function stripPiece(id, metal, at, { label = null, sealed = false, m0 = 6, caption = null } = {}) {
  return {
    id, kind: 'cellgalvstrip', label: label ?? `${METALS[metal].symbol} strip`, at, props: { metal, sealed, m0, dm: 0 },
    caption: caption ?? 'Lay it in a beaker seat or on the pan.'
  };
}

export { massOf };
