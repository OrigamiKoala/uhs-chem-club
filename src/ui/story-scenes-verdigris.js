/**
 * story-scenes-verdigris.js — the story painters of Verdigris (unit09), spread into `SCENES` (`story-scenes.js`) through `legacy()`:
 * a 960-wide plate, a pure function of `t`, every number on screen counted from what is drawn or read from the bench's own planners
 * (`engine/phdata.js` through `table/kits/ph-read.js`, the same windows, species and constants the flasks and the rig print).
 *
 * `weak-windows` (q3-weak): beat one fills the window of 0.10 M hydrochloric acid and of 0.10 M acetic acid, 200 units each, and counts the
 * pairs drawn; beat two does the same for acetic acid at three strengths; beat three multiplies the species of each flask the way the ratio
 * rig did and prints the product of the numbers shown; beat four multiplies Ka by Kb for three acids and their bases.
 */

import { sci, fmt, ACIDS, BASES } from '../learn/engine/phdata.js';
import {
  flaskSol, windowOf, speciesOf, windowSpecies, ionizedCells, cellGrid, seedOf, ionText
} from '../learn/table/kits/ph-read.js';
import { C, text, ground, win, ease, disc } from './story-kit.js';

const HCL = { id: 'hcl', c: 0.10 };
const acetic = c => ({ id: 'acetic', c });
const ACETIC = acetic(0.10);
const STRENGTHS = [0.10, 0.010, 0.0010].map(acetic);

const pStr = c => `${Number(c).toPrecision(2)} M`;

/** One window of a flask, filled to the fraction `p` (0 to 1) of the units that have let go; returns the pairs drawn, counted as they are drawn. */
function windowPic(ctx, solute, p, x, y, w, h, title) {
  const props = { solute };
  const win0 = windowOf(props);
  const sp = windowSpecies(win0);
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  const cells = cellGrid(win0.units, 20, x + 5, y + 5, w - 10, h - 10);
  const gone = ionizedCells(win0.units, win0.ionized, seedOf(props));
  const shown = Math.round(win0.ionized * p);
  // The pairs appear in the order of the shuffle: the first `shown` of the cells that have let go.
  const order = [...gone];
  const drawn = new Set(order.slice(0, shown));
  let pairs = 0;
  cells.forEach((c, i) => {
    const R = Math.min(c.cw, c.ch) * 0.42;
    if (drawn.has(i)) {
      pairs++;
      disc(ctx, c.x - R * 0.55, c.y, R * 0.62, sp.parts[0].ink);
      disc(ctx, c.x + R * 0.55, c.y, R * 0.62, sp.parts[1].ink);
    } else {
      disc(ctx, c.x, c.y, R, sp.whole.ink);
    }
  });
  text(ctx, title, x + w / 2, y - 16, { size: 21, color: C.dust, weight: 700 });
  return { pairs, units: win0.units, sol: flaskSol(props), sp };
}

/** Beats one and two: windows filling with the pairs that have let go, the count under each as drawn, the meter's reading beside it. */
function drawWindows(ctx, w, solutes, p, titles, ww, wh, y) {
  const gap = (w - ww * solutes.length) / (solutes.length + 1);
  solutes.forEach((s, i) => {
    const x = gap + i * (ww + gap);
    const r = windowPic(ctx, s, p, x, y, ww, wh, titles[i]);
    text(ctx, `${r.pairs} of ${r.units} have handed over a proton`, x + ww / 2, y + wh + 28, { size: 18, color: C.amber, weight: 700 });
    text(ctx, `pH ${fmt(r.sol.pH, 2)}`, x + ww / 2, y + wh + 56, { size: 22, color: C.text, weight: 700 });
  });
}

/** Beat three and four: a column of three rows, each a product written out from the numbers beside it. */
function rowText(ctx, x, y, parts, size = 21) {
  let cx = x;
  for (const [s, color] of parts) {
    text(ctx, s, cx, y, { size, color, align: 'left', weight: 700 });
    cx += s.length * size * 0.56 + 10;
  }
}

function weakWindows(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.28) {
    const p = ease(win(t, 0.02, 0.2));
    text(ctx, 'Two acids, each 0.10 M, 200 units in the window', w / 2, 34, { size: 24, color: C.dust });
    drawWindows(ctx, w, [HCL, ACETIC], p, ['Hydrochloric acid', 'Acetic acid'], 360, 180, 120);
    return;
  }
  if (t < 0.56) {
    const p = ease(win(t, 0.3, 0.48));
    text(ctx, 'Acetic acid, made more dilute', w / 2, 34, { size: 24, color: C.dust });
    drawWindows(ctx, w, STRENGTHS, p, STRENGTHS.map(s => pStr(s.c)), 270, 135, 130);
    return;
  }
  if (t < 0.78) {
    const k = ease(win(t, 0.58, 0.74));
    text(ctx, 'H₃O⁺ times CH₃COO⁻ over CH₃COOH, in each flask', w / 2, 34, { size: 24, color: C.dust });
    STRENGTHS.forEach((s, i) => {
      const y = 130 + i * 120;
      const sp = speciesOf({ solute: s });
      const prod = (sp.H * sp.A) / sp.HA;
      text(ctx, pStr(s.c), 90, y, { size: 24, color: C.dust, weight: 700 });
      rowText(ctx, 170, y, [[sci(sp.H, 3), C.text], ['×', C.dim], [sci(sp.A, 3), C.text], ['÷', C.dim], [sci(sp.HA, 3), C.text]]);
      if (k > 0.35 + i * 0.2) rowText(ctx, 600, y, [['=', C.dim], [sci(prod, 3), C.amber]], 26);
    });
    text(ctx, 'amounts in mol/L, worked out for each flask', w / 2, 500, { size: 17, color: C.dim });
    return;
  }
  const k = ease(win(t, 0.8, 0.9));
  text(ctx, 'Ka times Kb, for an acid and its base', w / 2, 34, { size: 24, color: C.dust });
  const pairs = [
    ['Acetic acid pair', ACIDS.acetic.Ka, BASES.acetate.Kb],
    ['Ammonia pair', ACIDS.nh4.Ka, BASES.nh3.Kb],
    ['Hydrofluoric pair', ACIDS.hf.Ka, BASES.fluoride.Kb]
  ];
  pairs.forEach(([name, Ka, Kb], i) => {
    const y = 140 + i * 110;
    text(ctx, ionText(name), 70, y, { size: 22, color: C.dust, weight: 700, align: 'left' });
    rowText(ctx, 290, y, [[`Ka ${sci(Ka, 2)}`, C.text], ['×', C.dim], [`Kb ${sci(Kb, 2)}`, C.text]], 20);
    if (k > 0.2 + i * 0.25) rowText(ctx, 680, y, [['=', C.dim], [sci(Ka * Kb, 2), C.amber]], 26);
  });
}

export const VERDIGRIS_SCENES = { 'weak-windows': weakWindows };
