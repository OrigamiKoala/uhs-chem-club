/**
 * story-scenes-verdigris-capacity.js — the story painter of q8-capacity (unit09), registered in `story-scenes.js` through `legacy()`.
 *
 * `capacity-limit`: a pure function of `t` on the 960-wide plate. Spheres are the benches' own (one is 0.1 mmol): beat one draws 100 cells of
 * acetic acid at pH 3 and at pH 6 and counts the two forms from `fractions`; beat two the same pour of acid into a 0.010 M and a 0.10 M
 * buffer; beat three flask 1 of the limit stage after 0, 4 and 8 pours; beat four the two beakers of the solubility stage after two
 * pours. Every number printed is counted from the spheres drawn or read from `engine/phdata.js` / `eqdata.js`.
 */

import { bufferState, ACIDS, fractions, pOf, fmt } from '../learn/engine/phdata.js';
import { cellGrid, ACID_INK, BASE_INK } from '../learn/table/kits/ph-read.js';
import { solidAfter } from '../learn/table/kits/ph-solid.js';
import { C, text, ground, win, ease, disc } from './story-kit.js';

const Ka = ACIDS.acetic.Ka;
const U = 1e-4;
const CAT_INK = '#b08d57';

/** A flask of `ha`/`a` spheres after `n` pours of `per` spheres of acid: its pH and acetate and acetic acid spheres. */
export function after(ha, a, n, per) {
  const r = bufferState({ Ka, nHA: ha * U, nA: a * U, V: 0.1, nH: n * per * U, vAdd: n * 0.01 });
  const A = Math.round(r.A / U);
  return { pH: r.pH, A, HA: ha + a - A, H: Math.round((r.h * r.Vt) / U) };
}

/** Draws `kinds` ([count, ink] pairs) as spheres in a window and returns the counts drawn. */
function spheres(ctx, x, y, w, h, cols, rows, kinds) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const cells = cellGrid(cols * rows, cols, x + 4, y + 4, w - 8, h - 8);
  let i = 0; const drawn = [];
  for (const [n, ink] of kinds) {
    let c0 = 0;
    for (let k = 0; k < n && i < cells.length; k++) { const c = cells[i++]; disc(ctx, c.x, c.y, Math.min(c.cw, c.ch) * 0.42, ink); c0++; }
    drawn.push(c0);
  }
  return drawn;
}

function capacityLimit(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.26) {
    const p = ease(win(t, 0.02, 0.2));
    text(ctx, 'Acetic acid, 100 molecules, at two pH', w / 2, 34, { size: 24, color: C.dust });
    [3, 6].forEach((ph, i) => {
      const x = 130 + i * 400;
      const f = fractions(pOf(Ka), ph);
      const shownA = Math.round((100 - Math.round(100 * f.HA)) * p);
      const shownHA = Math.round(Math.round(100 * f.HA) * p);
      const d = spheres(ctx, x, 120, 300, 150, 20, 5, [[shownHA, ACID_INK], [shownA, BASE_INK]]);
      text(ctx, `pH ${ph}`, x + 150, 98, { size: 22, color: C.dust, weight: 700 });
      text(ctx, `${d[0]} acetic acid`, x + 80, 300, { size: 22, color: C.dust, weight: 700 });
      text(ctx, `${d[1]} acetate`, x + 230, 300, { size: 22, color: C.green, weight: 700 });
    });
    return;
  }
  if (t < 0.5) {
    const p = ease(win(t, 0.28, 0.44));
    text(ctx, 'The same pour of acid, 5 spheres, into two buffers', w / 2, 34, { size: 24, color: C.dust });
    [[10, 10, '0.010 M of each', 90], [100, 100, '0.10 M of each', 530]].forEach(([ha, a, title, x]) => {
      const s0 = after(ha, a, 0, 5); const s1 = after(ha, a, 1, 5);
      const aNow = Math.round(s0.A + (s1.A - s0.A) * p); const haNow = ha + a - aNow;
      const d = spheres(ctx, x, 110, 340, 140, 20, 10, [[aNow, BASE_INK], [haNow, ACID_INK]]);
      text(ctx, title, x + 170, 88, { size: 21, color: C.dust, weight: 700 });
      text(ctx, `acetate ${d[0]}`, x + 170, 290, { size: 24, color: C.green, weight: 700 });
      if (p > 0.95) text(ctx, `pH ${fmt(s0.pH, 2)} to ${fmt(s1.pH, 2)}`, x + 170, 336, { size: 26, color: C.amber, weight: 700 });
    });
    return;
  }
  if (t < 0.76) {
    const k = ease(win(t, 0.52, 0.7));
    text(ctx, 'Flask 1: 40 spheres of acetate, 5 spheres of acid a pour', w / 2, 34, { size: 24, color: C.dust });
    [0, 4, 8].forEach((n, i) => {
      const x = 60 + i * 300;
      const s = after(40, 40, n, 5);
      if (k < 0.15 + i * 0.3) return;
      spheres(ctx, x, 110, 260, 120, 20, 5, [[s.A, BASE_INK], [s.HA, ACID_INK], [s.H, C.amber]]);
      text(ctx, `after ${n} pours`, x + 130, 90, { size: 21, color: C.dust, weight: 700 });
      text(ctx, `${s.A} acetate left`, x + 130, 262, { size: 22, color: C.green, weight: 700 });
      text(ctx, `pH ${fmt(s.pH, 2)}`, x + 130, 306, { size: 26, color: C.amber, weight: 700 });
    });
    return;
  }
  const k = ease(win(t, 0.78, 0.9));
  text(ctx, 'Two pours of acid, 10 spheres each, on a solid with 40 spheres', w / 2, 34, { size: 24, color: C.dust });
  [['Mg_OH_2', true, 'Magnesium hydroxide', 80], ['AgCl', false, 'Silver chloride', 540]].forEach(([salt, basic, title, x]) => {
    const n = k > 0.95 ? 2 : 0;
    const q = solidAfter({ salt, solid: 40, basic, n, acidSph: 10 });
    const d = spheres(ctx, x, 110, 340, 150, 20, 6, [[q.cations, CAT_INK], [q.left, C.steel]]);
    text(ctx, title, x + 170, 88, { size: 21, color: C.dust, weight: 700 });
    text(ctx, `${d[0]} dissolved, ${d[1]} solid`, x + 170, 296, { size: 24, color: C.amber, weight: 700 });
  });
}

export const VERDIGRIS_CAPACITY_SCENES = { 'capacity-limit': capacityLimit };
