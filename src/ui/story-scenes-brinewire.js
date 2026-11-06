/**
 * story-scenes-brinewire.js — the story painters of Brinewire (unit10), registered in `story-scenes.js` through `legacy()`.
 *
 * `cell-gap` (q4-potential): a pure function of `t` on the 960-wide plate. A horizontal voltage axis carries each metal at its reading
 * against the hydrogen reference (`engine/celldata.js` `METALS`); every number printed is measured from what is drawn: a cell's voltage is
 * the distance between two markers divided by the scale, the electrons moved are the electron discs drawn, the energy is the planner's
 * answer for that count and that voltage. Beat one places the readings, beat two bridges two of them, beat three writes a cell once and
 * twice over, beat four reads the energy and K of the zinc and silver cell from its own gap and discs.
 */

import { METALS, cellE0, deltaG0, logK, fmt } from '../learn/engine/celldata.js';
import { C, text, ground, win, ease, disc, line } from './story-kit.js';

const AX = { x0: 110, x1: 850, vMin: -2.6, vMax: 1.0 };
const PX = (AX.x1 - AX.x0) / (AX.vMax - AX.vMin);
const xOf = V => AX.x0 + (V - AX.vMin) * PX;
const vOf = x => AX.vMin + (x - AX.x0) / PX;
const cap = s => s[0].toUpperCase() + s.slice(1);

function axis(ctx, y) {
  line(ctx, AX.x0, y, AX.x1, y, C.steel, 2);
  for (let v = -2; v <= 1; v++) {
    line(ctx, xOf(v), y - 6, xOf(v), y + 6, C.steel, 2);
    text(ctx, `${v < 0 ? '−' : ''}${Math.abs(v)}`, xOf(v), y + 26, { size: 18, color: C.dust });
  }
  text(ctx, 'volts against the hydrogen reference', (AX.x0 + AX.x1) / 2, y + 56, { size: 17, color: C.dim });
  line(ctx, xOf(0), y - 70, xOf(0), y + 6, C.amber, 2, [4, 5]);
  text(ctx, 'reference', xOf(0), y - 84, { size: 17, color: C.amber });
}

/** A metal's marker on the axis; returns its x. */
function marker(ctx, id, y, p, label = true, dy = 0) {
  const x = xOf(METALS[id].E0);
  disc(ctx, x, y - 34 + dy, 14 * p, C.pale);
  if (label && p > 0.6) {
    text(ctx, cap(METALS[id].name), x, y - 62 + dy, { size: 19, color: C.text, weight: 700 });
  }
  return x;
}

function cellGap(ctx, w, h, t) {
  ground(ctx, w, h);
  const y = 330;
  if (t <= 0.26) {
    text(ctx, 'Four metals against the same reference', w / 2, 36, { size: 24, color: C.dust });
    axis(ctx, y);
    ['mg', 'zn', 'cu', 'ag'].forEach((id, i) => {
      const p = ease(win(t, 0.02 + i * 0.05, 0.08 + i * 0.05));
      if (p <= 0) return;
      const x = marker(ctx, id, y, p);
      if (p > 0.9) text(ctx, `${fmt(vOf(x), 2)} V`, x, y - 8 + 54, { size: 19, color: C.amber, weight: 700 });
    });
    return;
  }
  if (t <= 0.52) {
    const p = ease(win(t, 0.3, 0.46));
    text(ctx, 'A cell takes its voltage from the gap between two readings', w / 2, 36, { size: 24, color: C.dust });
    axis(ctx, y);
    const xa = marker(ctx, 'mg', y, 1); const xb = marker(ctx, 'ag', y, 1);
    const xe = xa + (xb - xa) * p;
    line(ctx, xa, y - 12, xe, y - 12, C.amber, 5);
    const gap = vOf(xe) - vOf(xa);
    text(ctx, `${fmt(gap, 2)} V`, (xa + xe) / 2, y - 112, { size: 34, color: C.amber, weight: 700 });
    if (p > 0.95) {
      disc(ctx, 770, 140, 20, C.amber);
      text(ctx, 'lamp lit', 770, 184, { size: 18, color: C.dust });
    }
    return;
  }
  if (t <= 0.76) {
    const p = ease(win(t, 0.55, 0.68));
    text(ctx, 'The zinc and copper cell, written once and twice over', w / 2, 36, { size: 24, color: C.dust });
    const V = cellE0('cu', 'zn');
    [[1, 'Once', 230], [2, 'Twice over', 700]].forEach(([k, title, cx]) => {
      text(ctx, title, cx, 96, { size: 24, color: C.dust, weight: 700 });
      let n = 0;
      for (let i = 0; i < 2 * k; i++) {
        const q = ease(win(p, 0.15 * i, 0.15 * i + 0.4));
        const ex = cx - 110 + (i % 4) * 56 + q * 0; const ey = 160;
        if (q > 0) { disc(ctx, ex, ey + (1 - q) * -30, 15, C.pale); n++; }
      }
      text(ctx, `${n} electrons moved`, cx, 214, { size: 20, color: C.dust });
      text(ctx, `${fmt(V, 2)} V`, cx, 290, { size: 40, color: C.amber, weight: 700 });
      text(ctx, 'voltmeter', cx, 330, { size: 17, color: C.dim });
      const kJ = -deltaG0(V, n);
      const bar = 3.1 * kJ / 10;
      ctx.fillStyle = C.green; ctx.fillRect(cx - 130, 372, bar * p, 26);
      text(ctx, `${fmt(kJ * p, 0)} kJ released`, cx, 430, { size: 24, color: C.green, weight: 700 });
    });
    return;
  }
  const p = ease(win(t, 0.78, 0.9));
  text(ctx, 'The zinc and silver cell', w / 2, 36, { size: 24, color: C.dust });
  const x0 = xOf(METALS.zn.E0); const x1 = xOf(METALS.ag.E0);
  axis(ctx, 250);
  marker(ctx, 'zn', 250, 1); marker(ctx, 'ag', 250, 1);
  line(ctx, x0, 238, x0 + (x1 - x0) * p, 238, C.amber, 5);
  const E0 = vOf(x0 + (x1 - x0) * p) - vOf(x0);
  const n = 2;
  for (let i = 0; i < n; i++) disc(ctx, 330 + i * 60, 400, 15, C.pale);
  text(ctx, `${n} electrons moved`, 360, 440, { size: 20, color: C.dust });
  if (p > 0.9) {
    text(ctx, `ΔG° = −nFE° = ${fmt(deltaG0(E0, n), 0)} kJ`, 650, 392, { size: 26, color: C.green, weight: 700 });
    text(ctx, `log K = nE° ÷ 0.0592 = ${fmt(logK(E0, n), 1)}`, 650, 440, { size: 26, color: C.amber, weight: 700 });
  }
}

export const BRINEWIRE_SCENES = { 'cell-gap': cellGap };
