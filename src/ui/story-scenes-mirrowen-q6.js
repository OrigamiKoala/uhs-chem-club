/**
 * story-scenes-mirrowen-q6.js — the story picture of Mirrowen's q6 bench (Taken Into Solution).
 *
 * One scene, `solution-drop`, in four parts on the 960 x 540 plate, each drawn from the flask bench's own tables (`matterdata-flask.js`):
 *   1  a salt crystal gives up its ions one by one; each lands in the water with three water molecules touching it. The two counts on
 *      the plate (ions in the water, ions left in the crystal) are counted from the discs drawn.
 *   2  a drop of each of salt, calcium chloride and sugar, four pieces in each; the particle count under it is the number of discs drawn.
 *   3  a flask topped up: eight pairs of ions in a box whose width is its volume; the volume and the molarity are read off the box and
 *      `dilutedTo`, so the same pairs spread over more litres and the molarity falls as the box grows.
 *   4  four salts in a bath: the bar for each is `bathChange`, the rise or fall of 100 g of water that dissolves 0.100 mol.
 * Pure functions of `t`; no glow; Node-importable (`verify:story`).
 */

import { C, disc, line, legacyText as text } from './story-kit.js';
import { win, ease, lerp } from './story-sim.js';
import { dropOf, countsOf, dilutedTo, bathChange, ASPECT } from '../learn/engine/matterdata-flask.js';

const CATION = '#9bb0c4';
const ANION = '#7f9d58';
const SALTS = [['NaCl', 'sodium chloride'], ['KCl', 'potassium chloride'], ['CaCl2', 'calcium chloride'], ['NH4NO3', 'ammonium nitrate']];

const colorOf = k => (k === 'cation' ? CATION : k === 'anion' ? ANION : '#cfc8b8');
const fadeOf = (t, a, b, f = 0.03) => ease(win(t, a, a + f)) * (1 - ease(win(t, b - f, b)));

/** Three water molecules touching a particle, drawn as small discs. */
function shell(ctx, x, y, r, a) {
  for (let k = 0; k < 3; k++) {
    const ang = a + (k / 3) * Math.PI * 2;
    disc(ctx, x + Math.cos(ang) * r * 1.8, y + Math.sin(ang) * r * 1.8, Math.max(4, r * 0.42), '#8c8376');
  }
}

/** Part 1: the crystal comes apart. */
function crystalPart(ctx, t, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  const drop = dropOf({ sub: 'NaCl', units: 6, spreads: true });
  const parts = drop.parts;
  const bx = 180; const by = 120; const bw = 600; const bh = 300;
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, bh);
  ctx.fillStyle = 'rgba(111,143,176,0.16)'; ctx.fillRect(bx, by, bw, bh);
  // The crystal: a checkerboard of the same ions, at the bottom left.
  const R = 21;
  const lattice = parts.map((p, i) => {
    const col = i % 4; const row = Math.floor(i / 4);
    return { x: bx + 40 + col * R * 2.05, y: by + bh - 36 - row * R * 2.05 };
  });
  let free = 0;
  parts.forEach((p, i) => {
    const go = ease(win(t, 0.02 + i * 0.016, 0.1 + i * 0.016));
    if (go >= 1) free++;
    const ex = bx + 20 + (p.u / ASPECT) * (bw - 40);
    const ey = by + 20 + p.v * (bh - 40);
    const x = lerp(lattice[i].x, ex, go); const y = lerp(lattice[i].y, ey, go);
    if (go >= 1) shell(ctx, x, y, R, p.a);
    disc(ctx, x, y, R, colorOf(p.k), C.steel);
    text(ctx, p.sign, x, y, { size: 22, color: '#15130f', weight: 700 });
  });
  text(ctx, `ions in the water  ${free}`, 560, 70, { size: 26, color: C.text, weight: 700 });
  text(ctx, `ions still in the crystal  ${parts.length - free}`, 560, 454, { size: 24, color: C.dust });
  ctx.globalAlpha = 1;
}

/** Part 2: four pieces of each, and the particles they become. */
function countPart(ctx, t, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  const kinds = [['NaCl', 'salt', 'NaCl'], ['CaCl2', 'calcium chloride', 'CaCl₂'], ['sugar', 'sugar', 'sugar']];
  const grow = ease(win(t, 0.3, 0.38));
  kinds.forEach(([sub, name, f], i) => {
    const x0 = 60 + i * 290; const y0 = 120; const w = 250; const h = 250 / ASPECT;
    ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, w, h);
    const drop = dropOf({ sub, units: 4, spreads: true });
    const shown = Math.ceil(drop.parts.length * grow);
    drop.parts.slice(0, shown).forEach(p => {
      const x = x0 + 8 + (p.u / ASPECT) * (w - 16); const y = y0 + 8 + p.v * (h - 16);
      const r = p.k === 'molecule' ? 16 : p.k === 'anion' ? 11 : 8;
      disc(ctx, x, y, r, colorOf(p.k), C.steel);
    });
    text(ctx, `4 × ${f}`, x0 + w / 2, y0 + h + 40, { size: 26, color: C.dust });
    text(ctx, `particles  ${countsOf({ parts: drop.parts.slice(0, shown) }).total}`, x0 + w / 2, y0 + h + 84, { size: 30, color: C.text, weight: 700 });
    void name;
  });
  ctx.globalAlpha = 1;
}

/** Part 3: the same pairs, a wider flask. */
function dilutePart(ctx, t, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  const grow = ease(win(t, 0.6, 0.76));
  const PX_PER_ML = 6;
  const v1 = 25; const v2 = 100; const C1 = 2.0;
  const w = (v1 + (v2 - v1) * grow) * PX_PER_ML;
  const x0 = 90; const y0 = 150; const h = 250;
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(x0, y0, w, h);
  ctx.fillStyle = 'rgba(111,143,176,0.16)'; ctx.fillRect(x0, y0, w, h);
  const drop = dropOf({ sub: 'NaCl', units: 8, spreads: true });
  const pairs = countsOf(drop).by.cation;
  drop.parts.forEach(p => {
    disc(ctx, x0 + 14 + (p.u / ASPECT) * (w - 28), y0 + 14 + p.v * (h - 28), p.k === 'anion' ? 14 : 10, colorOf(p.k), C.steel);
  });
  const mL = w / PX_PER_ML;
  text(ctx, `pairs of ions  ${pairs}`, 780, 190, { size: 28, color: C.text, weight: 700 });
  text(ctx, `volume  ${mL.toFixed(0)} mL`, 780, 250, { size: 28, color: C.dust });
  text(ctx, `${dilutedTo(C1, v1, mL).toFixed(2)} M`, 780, 330, { size: 52, color: C.amber, weight: 700 });
  ctx.globalAlpha = 1;
}

/** Part 4: four salts in a bath. */
function bathPart(ctx, t, alpha) {
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  const grow = ease(win(t, 0.82, 0.92));
  const base = 290; const k = 7.5;
  line(ctx, 100, base, 860, base, C.steel, 2);
  SALTS.forEach(([id, name], i) => {
    const x = 190 + i * 195;
    const dT = bathChange(id, 0.1, 100) * grow;
    ctx.fillStyle = dT >= 0 ? C.rust : '#6f8fb0';
    ctx.fillRect(x - 40, dT >= 0 ? base - dT * k : base, 80, Math.abs(dT) * k);
    text(ctx, `${dT >= 0 ? '+' : '−'}${Math.abs(dT).toFixed(1)} °C`, x, dT >= 0 ? base - dT * k - 24 : base - 24 - 0, { size: 26, color: C.text, weight: 700 });
    text(ctx, name, x, 470, { size: 20, color: C.dust });
  });
  text(ctx, 'bath after 0.100 mol dissolves in 100 g of water', 480, 70, { size: 24, color: C.dust });
  ctx.globalAlpha = 1;
}

function solutionDrop(ctx, w, h, t) {
  ctx.fillStyle = C.bg; ctx.fillRect(0, 0, w, h);
  crystalPart(ctx, t, fadeOf(t, -0.1, 0.3));
  countPart(ctx, t, fadeOf(t, 0.28, 0.56));
  dilutePart(ctx, t, fadeOf(t, 0.54, 0.82));
  bathPart(ctx, t, ease(win(t, 0.8, 0.84)));
}

export const Q6_SCENES = {
  'solution-drop': solutionDrop
};
