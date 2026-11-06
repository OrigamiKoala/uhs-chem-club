/**
 * story-scenes-brinewire-q3.js — the story painter of Brinewire's `q3-galvanic`, registered in `story-scenes.js` through `legacy()`.
 *
 * `cell-open`: a pure function of `t` on the 960-wide plate. Every number printed is counted or measured from what is drawn:
 *   beat 1  the current of a wire-only cell and of a cell with a salt bridge, plotted second by second from the planner's trace; the
 *           "zero at" second is the first plotted point on the axis, and the current labels are the traces' own readings;
 *   beat 2  the zinc and copper cell: the electrons drawn along the wire are counted, the ions drawn in each beaker are counted;
 *   beat 3  the same cell with its bridge: the negative ions drawn crossing toward the anode and the positive ions toward the cathode are
 *           counted, and the electrons stay on the wire;
 *   beat 4  the iron and copper cell after an hour: each bar's height is its strip's mass, and the change printed is the difference of the
 *           two drawn heights.
 * It switches scene on `t <= to` (a beat ends at `t = to`), so a beat's last frame is its own picture.
 */

import { METALS } from '../learn/engine/celldata.js';
import {
  loopCurrent, currentTrace, stopSecond, windowCounts, ELECTRONS_PER_RUN, START_IONS, stripChange, stripMass, WEIGH_RUN_SECONDS, RUN_SECONDS, fmt
} from '../learn/engine/celldata-galvanic.js';
import { C, text, ground, win, ease, disc, line, tag } from './story-kit.js';

const BLUE = '#8fb0c8';
const cap = s => s[0].toUpperCase() + s.slice(1);

/* ---------------------------------------------------------------- beat 1: the plot */

function plotScene(ctx, w, h, t) {
  text(ctx, 'The zinc and copper cell, run for 10 seconds', w / 2, 36, { size: 24, color: C.dust });
  const x0 = 150; const x1 = 840; const y0 = 90; const y1 = 400; const yMax = 0.6;
  const X = s => x0 + (s / RUN_SECONDS) * (x1 - x0);
  const Y = I => y1 - (I / yMax) * (y1 - y0);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  for (let v = 0; v <= yMax + 1e-9; v += 0.2) {
    line(ctx, x0, Y(v), x1, Y(v), 'rgba(140,131,118,0.28)', 1);
    text(ctx, v.toFixed(1), x0 - 14, Y(v), { size: 18, color: C.dust, align: 'right' });
  }
  for (let s = 0; s <= RUN_SECONDS; s += 2) text(ctx, String(s), X(s), y1 + 22, { size: 18, color: C.dust });
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0);
  text(ctx, 'current, in amperes', x0, y0 - 18, { size: 18, color: C.dim, align: 'left' });
  text(ctx, 'seconds', x1, y1 + 50, { size: 18, color: C.dim, align: 'right' });
  const I0 = loopCurrent('zn', 'cu');
  const reach = Math.floor(ease(win(t, 0.02, 0.2)) * RUN_SECONDS + 1e-9);
  [['none', 'a wire alone', C.amber], ['bridge', 'a salt bridge', C.green]].forEach(([link, name, ink], k) => {
    const rows = currentTrace(I0, link).filter(r => r.t <= reach);
    ctx.strokeStyle = ink; ctx.lineWidth = 4; ctx.beginPath();
    rows.forEach((r, i) => { if (i) ctx.lineTo(X(r.t), Y(r.I)); else ctx.moveTo(X(r.t), Y(r.I)); });
    ctx.stroke();
    for (const r of rows) disc(ctx, X(r.t), Y(r.I), 5, ink);
    text(ctx, name, x0 + 18 + k * 190, y0 + 22, { size: 20, color: ink, align: 'left', weight: 700 });
    const last = rows[rows.length - 1];
    if (last && reach >= RUN_SECONDS && link === 'bridge') text(ctx, `${fmt(last.I, 2)} A at ${last.t} s`, X(last.t) - 12, Y(last.I) - 20, { size: 22, color: ink, align: 'right', weight: 700 });
    const stop = stopSecond(rows);
    if (stop != null) text(ctx, `zero at ${stop} s`, X(stop) + 14, Y(0) - 26, { size: 22, color: ink, align: 'left', weight: 700 });
  });
}

/* ---------------------------------------------------------------- beats 2 and 3: the cell */

const CELL = { lx: 80, rx: 590, y: 250, w: 290, h: 170 };
/** Window cells inside a beaker, in drawing order: 6 columns by 4 rows. */
const spot = (x, k) => ({ x: x + 40 + (k % 6) * 40, y: CELL.y + 38 + Math.floor(k / 6) * 32 });

function beaker(ctx, x, name, ink) {
  ctx.fillStyle = '#2f4a47'; ctx.fillRect(x + 2, CELL.y + 12, CELL.w - 4, CELL.h - 14);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, CELL.y); ctx.lineTo(x, CELL.y + CELL.h); ctx.lineTo(x + CELL.w, CELL.y + CELL.h); ctx.lineTo(x + CELL.w, CELL.y); ctx.stroke();
  ctx.fillStyle = ink; ctx.fillRect(x + 20, CELL.y - 60, 16, CELL.h * 0.78 + 60);
  text(ctx, name, x + CELL.w / 2, CELL.y + CELL.h + 30, { size: 24, color: C.text, weight: 700 });
}

function wire(ctx) {
  const ya = CELL.y - 76;
  line(ctx, CELL.lx + 28, CELL.y - 60, CELL.lx + 28, ya, C.dust, 4);
  line(ctx, CELL.lx + 28, ya, CELL.rx + 28, ya, C.dust, 4);
  line(ctx, CELL.rx + 28, ya, CELL.rx + 28, CELL.y - 60, C.dust, 4);
  return { ya, x0: CELL.lx + 28, x1: CELL.rx + 28 };
}

function cellScene(ctx, w, h, t, withBridge) {
  const p = withBridge ? win(t, 0.5, 0.68) : ease(win(t, 0.26, 0.44));
  const n = ELECTRONS_PER_RUN;
  text(ctx, withBridge ? 'The same cell, with its salt bridge' : 'The zinc and copper cell, run', w / 2, 36, { size: 24, color: C.dust });
  beaker(ctx, CELL.lx, 'Zn   Zn²⁺', '#8f9ca4');
  beaker(ctx, CELL.rx, 'Cu   Cu²⁺', '#b66a3e');
  const wr = wire(ctx);
  // The ions in each window: eight to start, two zinc ions appear, two copper ions go.
  const start = windowCounts('zn', 'cu', { ran: false });
  const end = windowCounts('zn', 'cu', { ran: true });
  const madeAt = k => 0.1 + 0.8 * (k / (end.left.metal - start.left.metal));
  let zn = 0; let cu = 0;
  for (let k = 0; k < end.left.metal; k++) {
    const born = k >= START_IONS ? p >= madeAt(k - START_IONS + 1) : true;
    if (!born) continue;
    const s = spot(CELL.lx, k); disc(ctx, s.x, s.y, 9, '#b4bcc2'); zn++;
  }
  for (let k = 0; k < start.right.metal; k++) {
    const gone = k >= end.right.metal && p >= madeAt(start.right.metal - k);
    if (gone) continue;
    const s = spot(CELL.rx, k); disc(ctx, s.x, s.y, 9, '#c9835a'); cu++;
  }
  // The electrons along the wire, one after another; one that has reached the copper strip waits beside it, and those are counted.
  let moving = 0;
  for (let k = 0; k < n; k++) {
    const q = ease(win(p, 0.12 * k, 0.12 * k + 0.5));
    if (q <= 0) continue;
    if (q >= 1) { disc(ctx, wr.x1 + 26, CELL.y - 52 + moving * 22, 8, C.pale); moving++; continue; }
    const L1 = wr.ya - (CELL.y - 60); const L2 = wr.x1 - wr.x0; const tot = L1 * 2 + L2;
    const d = q * tot; let x; let y;
    if (d < L1) { x = wr.x0; y = CELL.y - 60 - d; } else if (d < L1 + L2) { x = wr.x0 + (d - L1); y = wr.ya; } else { x = wr.x1; y = wr.ya + (d - L1 - L2); }
    disc(ctx, x, y, 8, C.pale);
  }
  text(ctx, `${moving} electrons crossed the wire`, w / 2, wr.ya - 28, { size: 22, color: C.dust });
  text(ctx, `Zn²⁺ ${zn}`, CELL.lx + CELL.w / 2, CELL.y + CELL.h + 62, { size: 24, color: C.amber, weight: 700 });
  text(ctx, `Cu²⁺ ${cu}`, CELL.rx + CELL.w / 2, CELL.y + CELL.h + 62, { size: 24, color: C.amber, weight: 700 });
  if (!withBridge) {
    tag(ctx, 'anode: oxidation', CELL.lx + CELL.w / 2, 104, { size: 21, color: C.pale });
    tag(ctx, 'cathode: reduction', CELL.rx + CELL.w / 2, 104, { size: 21, color: C.pale });
    return;
  }
  // The bridge: four ions of each sign lie in the tube and a stream follows them. Negative ions drift toward the anode (left) and positive
  // ions toward the cathode (right); each one that leaves the tube lands in its beaker, and the landed ones are counted.
  const bx0 = CELL.lx + CELL.w - 40; const bx1 = CELL.rx + 40; const by = CELL.y - 36; const L = bx1 - bx0 - 30;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(bx0, by - 22, bx1 - bx0, 44);
  ctx.strokeStyle = BLUE; ctx.lineWidth = 3; ctx.strokeRect(bx0, by - 22, bx1 - bx0, 44);
  let negIn = 0; let posIn = 0;
  for (let j = 0; j < 2 * n; j++) {
    const f = (j + 0.5) / n;
    const neg = f - p; const pos = 1 - f + p;
    ctx.strokeStyle = BLUE; ctx.lineWidth = 2;
    if (neg >= 0 && neg <= 1) ctx.strokeRect(bx0 + 15 + neg * L - 7, by + 2, 14, 14);
    else if (neg < 0) { const s2 = spot(CELL.lx, 18 + negIn); ctx.strokeRect(s2.x - 7, s2.y - 7, 14, 14); negIn++; }
    if (pos >= 0 && pos <= 1) { ctx.beginPath(); ctx.arc(bx0 + 15 + pos * L, by - 9, 7, 0, Math.PI * 2); ctx.stroke(); }
    else if (pos > 1) { const s2 = spot(CELL.rx, 16 + posIn); ctx.beginPath(); ctx.arc(s2.x, s2.y, 7, 0, Math.PI * 2); ctx.stroke(); posIn++; }
  }
  text(ctx, `${negIn} negative ions reached the anode beaker`, CELL.lx + CELL.w / 2 + 20, CELL.y + CELL.h + 98, { size: 20, color: BLUE });
  text(ctx, `${posIn} positive ions reached the cathode beaker`, CELL.rx + CELL.w / 2 - 20, CELL.y + CELL.h + 98, { size: 20, color: BLUE });
}

/* ---------------------------------------------------------------- beat 4: the balance */

function weighScene(ctx, w, h, t) {
  const p = ease(win(t, 0.76, 0.9));
  text(ctx, 'The iron and copper cell, weighed before and after an hour', w / 2, 36, { size: 24, color: C.dust });
  const base = 420; const per = 26;
  const strips = [['fe', 6, 250, 'iron strip'], ['cu', 7, 640, 'copper strip']];
  strips.forEach(([id, m0, cx, name]) => {
    const dm = stripChange('fe', 'cu', id, WEIGH_RUN_SECONDS);
    const mNow = m0 + dm * p;
    ctx.fillStyle = '#4a463d'; ctx.fillRect(cx - 70, base, 140, 10);
    ctx.fillStyle = id === 'fe' ? '#8f9ca4' : '#b66a3e'; ctx.fillRect(cx - 40, base - m0 * per, 80, m0 * per);
    // The ghost of the starting height: the change is the gap between the two drawn heights.
    ctx.strokeStyle = C.dust; ctx.lineWidth = 2; ctx.setLineDash?.([6, 5]); ctx.strokeRect(cx - 40, base - m0 * per, 80, m0 * per); ctx.setLineDash?.([]);
    ctx.fillStyle = id === 'fe' ? '#8f9ca4' : '#b66a3e'; ctx.fillRect(cx - 40, base - mNow * per, 80, mNow * per);
    text(ctx, cap(name), cx, base + 38, { size: 22, color: C.text, weight: 700 });
    text(ctx, `${fmt(m0, 2)} g`, cx - 120, base - m0 * per + 10, { size: 20, color: C.dust, align: 'right' });
    if (p > 0.95) {
      const now = stripMass(m0, dm);
      const drawn = (now - m0);
      text(ctx, `${fmt(now, 2)} g`, cx, base - Math.max(m0, mNow) * per - 52, { size: 26, color: C.amber, weight: 700 });
      text(ctx, `${drawn > 0 ? 'gained' : 'lost'} ${fmt(Math.abs(drawn), 2)} g`, cx, base - Math.max(m0, mNow) * per - 24, { size: 22, color: drawn > 0 ? C.green : C.amber });
    }
  });
  if (p > 0.95) {
    text(ctx, `${cap(METALS.fe.name)} is the anode`, 250, 112, { size: 22, color: C.dust });
    text(ctx, `${cap(METALS.cu.name)} is the cathode`, 640, 112, { size: 22, color: C.dust });
  }
}

function cellOpen(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t <= 0.24) return plotScene(ctx, w, h, t);
  if (t <= 0.48) return cellScene(ctx, w, h, t, false);
  if (t <= 0.72) return cellScene(ctx, w, h, t, true);
  return weighScene(ctx, w, h, t);
}

export const BRINEWIRE_Q3_SCENES = { 'cell-open': cellOpen };
