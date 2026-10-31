/**
 * story-scenes-kettle-q3.js — the story painters of Kettle's q3 bench, spread into `KETTLE_SCENES` (`story-scenes-kettle.js`).
 * Follow `story-scenes-kettle.js`: 960 x 540 plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `sealed-pot`: the balance reads the atoms that stand inside the pot. The sum on every plate is the listed masses of the atoms
 * DRAWN INSIDE THE POT'S WALLS at that instant, so it changes only when an atom crosses the rim:
 *   an open pot of burning iron: oxygen atoms from the air come down into it (the sum rises);
 *   an open pot of the gases a burn made: carbon dioxide rises out of it (the sum falls);
 *   a sealed pot: the same ten atoms join up differently and the lid keeps every one in (the sum does not move);
 *   the three changes in the sum, each the difference of the two sums counted above.
 * The atoms are those of 4 Fe + 3 O2 → 2 Fe2O3 and of six carbon dioxide molecules (6 C + 12 O).
 */

import { ATOMIC } from '../learn/engine/reactdata.js';
import { C, ball, line, text, ground, win, ease, lerp, tag } from './story-kit.js';

const fs = h => Math.max(13, h * 0.04);

/** The pot's walls: a box with an open top. */
function potBox(w, h, cx) {
  const pw = w * 0.34;
  return { x0: cx - pw / 2, x1: cx + pw / 2, y0: h * 0.36, y1: h * 0.7 };
}

function drawPot(ctx, R, sealed) {
  ctx.strokeStyle = C.steel; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(R.x0, R.y0); ctx.lineTo(R.x0, R.y1); ctx.lineTo(R.x1, R.y1); ctx.lineTo(R.x1, R.y0); ctx.stroke();
  if (sealed) { ctx.fillStyle = C.steel; ctx.fillRect(R.x0 - 4, R.y0 - 7, R.x1 - R.x0 + 8, 7); }
  ctx.lineWidth = 1;
}

const inside = (R, a) => a.x > R.x0 && a.x < R.x1 && a.y > R.y0 && a.y < R.y1;
const inPot = (R, atoms) => atoms.filter(a => inside(R, a));
const sumOf = atoms => atoms.reduce((s, a) => s + ATOMIC[a.el], 0);

/** Draw atoms, and return those standing inside the walls. */
function paint(ctx, R, atoms, r) {
  for (const a of atoms) ball(ctx, a.x, a.y, a.el === 'Fe' ? r * 1.15 : a.el === 'O' ? r * 0.85 : r, a.el === 'Fe' ? 'ingot' : a.el);
  return inPot(R, atoms);
}

const FE_POS = [[0.3, 0.5], [0.7, 0.5], [0.3, 0.8], [0.7, 0.8]];

/** The atoms of the open iron pot at progress `p`: four iron in the pot, six oxygen coming down from above the rim. */
function ironOpen(R, p, h) {
  const atoms = FE_POS.map(([fx, fy]) => ({ el: 'Fe', x: lerp(R.x0, R.x1, fx), y: lerp(R.y0, R.y1, fy) }));
  const o = [[0.2, 0.3], [0.38, 0.35], [0.5, 0.3], [0.62, 0.35], [0.8, 0.3], [0.5, 0.62]];
  o.forEach(([ox, oy], i) => {
    const x = lerp(R.x0, R.x1, ox);
    const yEnd = lerp(R.y0, R.y1, oy + 0.1);
    const yStart = R.y0 - h * (0.16 + 0.03 * i);
    atoms.push({ el: 'O', x, y: lerp(yStart, yEnd, p) });
  });
  return atoms;
}

/** Six carbon dioxide molecules standing in the pot, rising out of it as `p` goes from 0 to 1. */
function gasesOut(R, p, h) {
  const atoms = [];
  [0.2, 0.5, 0.8].forEach((cx, i) => {
    [0.4, 0.75].forEach((cy, j) => {
      const rise = ease(p) * (R.y1 - R.y0 + h * 0.5) * (1 + 0.12 * ((i + j) % 3));
      const x = lerp(R.x0, R.x1, cx);
      const y = lerp(R.y0, R.y1, cy) - rise;
      atoms.push({ el: 'C', x, y }, { el: 'O', x: x - h * 0.05, y }, { el: 'O', x: x + h * 0.05, y });
    });
  });
  return atoms;
}

/** The same ten atoms of the sealed pot: iron and oxygen drifting, then clustered as iron oxide. Every one stays under the lid. */
function sealedAtoms(R, p) {
  const atoms = FE_POS.map(([fx, fy]) => ({ el: 'Fe', x: lerp(R.x0, R.x1, fx), y: lerp(R.y0, R.y1, fy) }));
  const start = [[0.18, 0.3], [0.5, 0.34], [0.82, 0.3], [0.3, 0.62], [0.7, 0.62], [0.5, 0.86]];
  const end = [[0.3, 0.36], [0.7, 0.36], [0.5, 0.6], [0.3, 0.64], [0.7, 0.64], [0.5, 0.88]];
  start.forEach(([sx, sy], i) => atoms.push({
    el: 'O',
    x: lerp(lerp(R.x0, R.x1, sx), lerp(R.x0, R.x1, end[i][0]), p),
    y: lerp(lerp(R.y0, R.y1, sy), lerp(R.y0, R.y1, end[i][1]), p)
  }));
  return atoms;
}

function sealedPot(ctx, w, h, t) {
  ground(ctx, w, h);
  const r = h * 0.032;
  const size = fs(h);
  const cx = w * 0.5;
  const R = potBox(w, h, cx);
  // The sums the three pots reach, each counted from the atoms standing inside its walls at its first and last frame.
  const sums = {
    ironIn: sumOf(inPot(R, ironOpen(R, 0, h))),
    ironOut: sumOf(inPot(R, ironOpen(R, 1, h))),
    gasIn: sumOf(inPot(R, gasesOut(R, 0, h))),
    gasOut: sumOf(inPot(R, gasesOut(R, 1, h))),
    sealIn: sumOf(inPot(R, sealedAtoms(R, 0))),
    sealOut: sumOf(inPot(R, sealedAtoms(R, 1)))
  };
  const read = v => tag(ctx, `balance ${v.toFixed(1)}`, cx, h * 0.8, { size: size * 1.1, color: C.amber });
  const ends = (before, after, p) => {
    text(ctx, `before ${before.toFixed(1)}`, w * 0.12, h * 0.8, { size: size * 0.9, color: C.dim, align: 'left' });
    if (p > 0.97) text(ctx, `after ${after.toFixed(1)}`, w * 0.88, h * 0.8, { size: size * 0.9, color: C.dim, align: 'right' });
  };

  if (t < 0.27) {
    const p = ease(win(t, 0.04, 0.22));
    drawPot(ctx, R, false);
    const held = paint(ctx, R, ironOpen(R, p, h), r);
    text(ctx, 'open pot, iron burning', cx, h * 0.22, { size, color: C.dust });
    read(sumOf(held));
    ends(sums.ironIn, sums.ironOut, p);
    return;
  }
  if (t < 0.52) {
    const p = win(t, 0.3, 0.5);
    drawPot(ctx, R, false);
    const held = paint(ctx, R, gasesOut(R, p, h), r * 0.9);
    text(ctx, 'open pot, the gases a burn made', cx, h * 0.22, { size, color: C.dust });
    read(sumOf(held));
    ends(sums.gasIn, sums.gasOut, p);
    return;
  }
  if (t < 0.77) {
    const p = ease(win(t, 0.55, 0.72));
    drawPot(ctx, R, true);
    const held = paint(ctx, R, sealedAtoms(R, p), r);
    text(ctx, 'sealed pot, iron burning', cx, h * 0.22, { size, color: C.dust });
    read(sumOf(held));
    ends(sums.sealIn, sums.sealOut, p);
    return;
  }
  // The three changes in the sum, each the difference of the two sums counted above.
  const p = ease(win(t, 0.79, 0.93));
  const rows = [
    ['open, iron burns', sums.ironOut - sums.ironIn],
    ['open, gases leave', sums.gasOut - sums.gasIn],
    ['sealed, iron burns', sums.sealOut - sums.sealIn]
  ];
  const mid = w * 0.58;
  const scale = (w * 0.26) / Math.max(...rows.map(x => Math.abs(x[1])), 1);
  line(ctx, mid, h * 0.24, mid, h * 0.8, C.steel, 2);
  text(ctx, 'change in the balance', w * 0.5, h * 0.14, { size, color: C.dust });
  rows.forEach(([name, d], i) => {
    const y = h * (0.36 + i * 0.18);
    text(ctx, name, w * 0.05, y, { size, color: C.dust, align: 'left' });
    ctx.fillStyle = d > 0 ? C.green : d < 0 ? C.danger : C.steel;
    const len = d * scale * p;
    ctx.fillRect(Math.min(mid, mid + len), y - h * 0.025, Math.max(2, Math.abs(len)), h * 0.05);
    if (p > 0.8) {
      const label = d === 0 ? '0.0' : `${d > 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}`;
      text(ctx, label, d >= 0 ? mid + Math.max(len, 0) + 14 : mid + len - 14, y, { size, color: C.pale, align: d >= 0 ? 'left' : 'right', weight: 700 });
    }
  });
}

export const Q3_SCENES = {
  'sealed-pot': sealedPot
};
