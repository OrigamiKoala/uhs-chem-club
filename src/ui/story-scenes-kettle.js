/**
 * story-scenes-kettle.js — the pictures behind Kettle's story animations.
 *
 * Same rules as `story-scenes.js`, which spreads `KETTLE_SCENES` into its `SCENES`: each painter draws one frame of a scene from a
 * progress `t` in [0, 1] on a 960 x 540 plate (the registry scales it up), is a pure function of `t`, draws in the SCOURED PLATE
 * palette, and draws from the numbers the bench measured. EVERY NUMBER ON SCREEN IS COUNTED FROM WHAT IS DRAWN: a scoop's tally is
 * the atoms in it, a mass is the listed masses of the atoms drawn, a yield bar is `reactdata.js` applied to the tons shown.
 *
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import { ATOMIC, molarMass, parseEquation, reactPlan } from '../learn/engine/reactdata.js';
import { C, disc, line, legacyText as text, ground, win, ease } from './story-kit.js';

import { Q2_SCENES } from './story-scenes-kettle-q2.js';
import { Q3_SCENES } from './story-scenes-kettle-q3.js';
import { Q4_SCENES } from './story-scenes-kettle-q4.js';
import { Q5_SCENES } from './story-scenes-kettle-q5.js';
import { Q7_SCENES } from './story-scenes-kettle-q7.js';
import { Q8_SCENES } from './story-scenes-kettle-q8.js';
import { BOSS_SCENES } from './story-scenes-kettle-boss.js';

const fs = h => Math.max(11, h * 0.04);

function box(ctx, x, y, w, h, fill, stroke = C.steel, lw = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

const INK = { H: '#d6cebd', O: '#9a4a2e', N: '#6f8fb0', Fe: '#9aa0a6' };
const RADIUS = { H: 0.017, O: 0.026, N: 0.024 };

/** One water molecule centred on (x, y): an oxygen with two hydrogens on it. Returns its atoms, so the scene can count them. */
function water(ctx, x, y, u, a = 1) {
  const prev = ctx.globalAlpha;
  ctx.globalAlpha = prev * a;
  const atoms = [['O', x, y], ['H', x - u * 0.9, y + u * 0.75], ['H', x + u * 0.9, y + u * 0.75]];
  line(ctx, x, y, atoms[1][1], atoms[1][2], C.dim, 2);
  line(ctx, x, y, atoms[2][1], atoms[2][2], C.dim, 2);
  for (const [el, ax, ay] of atoms) disc(ctx, ax, ay, u * (el === 'O' ? 0.62 : 0.4), INK[el]);
  ctx.globalAlpha = prev;
  return atoms.map(a2 => a2[0]);
}

const tally = els => els.reduce((m, e) => { m[e] = (m[e] || 0) + 1; return m; }, {});
const massOf = counts => Object.entries(counts).reduce((s, [el, n]) => s + n * ATOMIC[el], 0);

/* ---- q1-recipe: three scoops, one recipe ---- */
const SCOOPS = [8, 12, 10];

function threeScoops(ctx, w, h, t) {
  ground(ctx, w, h);
  const u = h * 0.034;
  const per = w * 0.3;
  const counted = [];
  SCOOPS.forEach((n, k) => {
    const x0 = w * 0.04 + k * (per + w * 0.02);
    box(ctx, x0, h * 0.12, per, h * 0.46, '#16140f', C.steel);
    const els = [];
    const cols = 4;
    for (let i = 0; i < n; i++) {
      const cx = x0 + per * (0.14 + 0.24 * (i % cols));
      const cy = h * 0.19 + Math.floor(i / cols) * h * 0.115;
      const appear = ease(win(t, 0.02 + k * 0.05, 0.18 + k * 0.05));
      if (appear > 0.01) els.push(...water(ctx, cx, cy, u, appear));
    }
    counted.push(tally(els));
  });
  // The tally of each scoop: counted from the atoms just drawn.
  if (t > 0.12) {
    counted.forEach((c, k) => {
      const x0 = w * 0.04 + k * (per + w * 0.02);
      text(ctx, `H ${c.H || 0}   O ${c.O || 0}`, x0 + per / 2, h * 0.63, { size: fs(h) * 1.1, color: C.dust, weight: 700 });
    });
  }
  // Beat two: loose hydrogens added to the middle scoop do not change what the molecule is.
  const loose = Math.round(7 * ease(win(t, 0.3, 0.5)));
  if (loose > 0) {
    const x0 = w * 0.04 + (per + w * 0.02);
    for (let i = 0; i < loose; i++) disc(ctx, x0 + per * (0.12 + 0.12 * i), h * 0.545, u * 0.4, INK.H);
    text(ctx, `${loose} loose H beside ${SCOOPS[1]} molecules`, x0 + per / 2, h * 0.7, { size: fs(h), color: C.amber });
  }
  // Beat three: the same atoms weigh the same loose and joined.
  const pw = ease(win(t, 0.52, 0.72));
  if (pw > 0.01) {
    const loosePan = massOf({ H: 2, O: 1 });
    const joinedPan = massOf(tally(['O', 'H', 'H']));
    box(ctx, w * 0.1, h * 0.76, w * 0.26, h * 0.1 * pw, '#100f0c', C.steel);
    box(ctx, w * 0.64, h * 0.76, w * 0.26, h * 0.1 * pw, '#100f0c', C.steel);
    if (pw > 0.8) {
      text(ctx, `loose H, H, O: ${loosePan.toFixed(1)}`, w * 0.23, h * 0.81, { size: fs(h), color: C.dust });
      text(ctx, `one molecule: ${joinedPan.toFixed(1)}`, w * 0.77, h * 0.81, { size: fs(h), color: C.dust });
    }
  }
  // Beat four: the share of the weight that is oxygen, counted from the three atoms.
  const sh = ease(win(t, 0.76, 0.96));
  if (sh > 0.01) {
    const total = massOf({ H: 2, O: 1 });
    const frac = ATOMIC.O / total;
    const bx = w * 0.1; const bw = w * 0.8; const by = h * 0.9;
    box(ctx, bx, by, bw, h * 0.035, '#100f0c', C.steel);
    ctx.fillStyle = INK.O;
    ctx.fillRect(bx + 1, by + 1, (bw - 2) * frac * sh, h * 0.035 - 2);
    text(ctx, `oxygen ${(frac * 100).toFixed(1)} of every 100 parts by weight`, w / 2, by - h * 0.03, { size: fs(h), color: C.amber, weight: 700 });
  }
}

/* ---- q6-stoich: what forty tons of ore can give ---- */
const EQ = parseEquation('Fe2O3 + 3 CO -> 2 Fe + 3 CO2');
const ORE_TONS = 40;
const CLAIMED_TONS = 50;
// Tons are kilograms times a thousand; the moles are the same in any unit, so work in kilomoles.
const POSSIBLE = (() => {
  const kmol = (ORE_TONS * 1000) / molarMass('Fe2O3');
  return reactPlan(EQ, { Fe2O3: kmol }).made.Fe * molarMass('Fe') / 1000;
})();

function furnaceLedger(ctx, w, h, t) {
  ground(ctx, w, h);
  // Beat one (0 to 0.25): two hydrogens and one oxygen make two waters; the masses are counted from the atoms drawn.
  const a = ease(win(t, 0.0, 0.2));
  ctx.globalAlpha = 1 - 0.8 * ease(win(t, 0.26, 0.32));
  {
    const u = h * 0.03;
    const lhs = { H: 4, O: 2 };
    const y = h * 0.2;
    for (let i = 0; i < 2; i++) {
      disc(ctx, w * (0.08 + 0.07 * i), y - u * 0.5, u * 0.4 * a, INK.H);
      disc(ctx, w * (0.08 + 0.07 * i) + u * 0.8, y - u * 0.5, u * 0.4 * a, INK.H);
    }
    disc(ctx, w * 0.25, y, u * 0.62 * a, INK.O); disc(ctx, w * 0.25 + u * 1.2, y, u * 0.62 * a, INK.O);
    if (a > 0.5) {
      text(ctx, `2 H₂ + O₂: ${(2 * 2 * ATOMIC.H + 2 * ATOMIC.O).toFixed(1)}`, w * 0.2, y + h * 0.07, { size: fs(h), color: C.dust });
      const waters = tally(['O', 'H', 'H']);
      text(ctx, `2 H₂O: ${(2 * massOf(waters)).toFixed(1)}`, w * 0.62, y + h * 0.07, { size: fs(h), color: C.dust });
      line(ctx, w * 0.44, y, w * 0.54, y, C.amber, 2);
      water(ctx, w * 0.62, y - h * 0.012, u, a); water(ctx, w * 0.72, y - h * 0.012, u, a);
      void lhs;
    }
  }
  ctx.globalAlpha = 1;
  // Beat two (0.25 to 0.5): the mole ratio, three hydrogens to two ammonias, counted by pairing the discs.
  const b = ease(win(t, 0.26, 0.46));
  ctx.globalAlpha = 1 - 0.8 * ease(win(t, 0.5, 0.56));
  if (b > 0.01) {
    const y = h * 0.42; const u = h * 0.022;
    for (let i = 0; i < 6; i++) disc(ctx, w * (0.08 + 0.045 * i), y, u * b, INK.H);
    for (let i = 0; i < 4; i++) disc(ctx, w * (0.58 + 0.06 * i), y, u * 1.2 * b, INK.N);
    if (b > 0.7) text(ctx, '6 H₂ → 4 NH₃: the ratio is 3 to 2', w * 0.4, y + h * 0.06, { size: fs(h), color: C.dust });
  }
  ctx.globalAlpha = 1;
  // Beat three (0.5 to 0.72): two piles, one runs out; what is left is counted.
  const c = ease(win(t, 0.5, 0.68));
  ctx.globalAlpha = 1 - 0.8 * ease(win(t, 0.74, 0.8));
  if (c > 0.01) {
    const y = h * 0.62; const u = h * 0.02;
    const plan = reactPlan(parseEquation('2 H2 + O2 -> 2 H2O'), { H2: 5, O2: 2 });
    const used = Math.round(5 - plan.left.H2 * c * 1);
    void used;
    for (let i = 0; i < 5; i++) disc(ctx, w * (0.08 + 0.04 * i), y, u, i < 5 - plan.left.H2 ? (c > 0.6 ? C.dim : INK.H) : INK.H);
    for (let i = 0; i < 2; i++) disc(ctx, w * (0.4 + 0.05 * i), y, u * 1.2, c > 0.6 ? C.dim : INK.O);
    if (c > 0.7) text(ctx, `oxygen gone, ${plan.left.H2} hydrogen left`, w * 0.62, y, { size: fs(h), color: C.amber });
  }
  ctx.globalAlpha = 1;
  // Beat four (0.72 to 1): the ledger. Forty tons of ore can give POSSIBLE tons; the ledger says fifty.
  const d = ease(win(t, 0.74, 0.96));
  if (d > 0.01) {
    const bx = w * 0.08; const bw = w * 0.84; const scale = bw / 56;
    const row = (label, tons, yy, color) => {
      text(ctx, label, bx, yy - h * 0.028, { size: fs(h), color: C.dust, align: 'left' });
      box(ctx, bx, yy, bw, h * 0.03, '#100f0c', C.steel);
      ctx.fillStyle = color;
      ctx.fillRect(bx + 1, yy + 1, Math.max(0, tons * scale * d - 2), h * 0.03 - 2);
      if (d > 0.8) text(ctx, `${tons.toFixed(1)} t`, bx + tons * scale + w * 0.03, yy + h * 0.015, { size: fs(h), color: C.pale, align: 'left', weight: 700 });
    };
    row('ore in', ORE_TONS, h * 0.78, '#8a4a32');
    row('iron the equation allows', POSSIBLE, h * 0.86, C.pale);
    row('iron the ledger claims', CLAIMED_TONS, h * 0.94, C.danger);
  }
}

export const KETTLE_SCENES = {
  'three-scoops': threeScoops,
  'furnace-ledger': furnaceLedger,
  ...Q2_SCENES, ...Q3_SCENES, ...Q4_SCENES, ...Q5_SCENES, ...Q7_SCENES, ...Q8_SCENES, ...BOSS_SCENES
};
