/**
 * story-scenes-kettle-q7.js — the story painters of Kettle's q7 bench, spread into `KETTLE_SCENES` (`story-scenes-kettle.js`).
 * Follow `story-scenes-kettle.js`: 960 x 540 plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `burette-count`: the burette lets half a millilitre run into the flask at a time. EVERY NUMBER IS COUNTED: the drops are the
 * drops drawn (n of them, n x 0.5 mL), the discs of base are one for each drop and the discs of acid are what `reactdata-titrate.js`
 * says the flask still holds, in the same unit; the colour is the indicator's at that volume; the strength at the end is the base's
 * strength times the volume that was counted, over the flask's volume.
 */

import { flaskAt, equivalenceMl, acidMolarity } from '../learn/engine/reactdata-titrate.js';
import { C, disc, line, legacyText as text, ground, win, ease } from './story-kit.js';

const fs = h => Math.max(11, h * 0.04);
const SYS = { acid: { M: 0.1, mL: 25, nH: 1 }, base: { M: 0.25, nOH: 1 } };
const DROP_ML = 0.5;
/** Moles one drop of base holds: a disc in the rows below stands for exactly this. */
const DISC_MOL = (SYS.base.M * DROP_ML) / 1000;
const INK = { colourless: '#9fb4c0', pink: '#d94a8c' };
const WARM = '#c0652b';
const COLD = '#6f8fb0';

function box(ctx, x, y, w, h, fill, stroke = C.steel) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/** The drops that have run in at progress `t`, as a whole count and the part of the next one that has fallen. */
const DROPS_LAST = 21;
function dropsAt(t) {
  const x = DROPS_LAST * win(t, 0.04, 0.7);
  return { n: Math.min(DROPS_LAST, Math.floor(x + 1e-9)), part: x - Math.floor(x + 1e-9) };
}

function buretteCount(ctx, w, h, t) {
  ground(ctx, w, h);
  const { n, part } = dropsAt(t);
  const v = n * DROP_ML;
  const fl = flaskAt(SYS, v, 'phenolphthalein');
  // The burette: its level drops with every drop that has run.
  const bx = w * 0.12; const tw = w * 0.04; const top = h * 0.08; const th = h * 0.42;
  box(ctx, bx - tw / 2, top, tw, th, '#100f0c');
  const SCALE_ML = 12; // the tube drawn here is marked 0 to 12 mL; the story runs 10.5 mL
  const level = (v / SCALE_ML) * th;
  for (const m of [0, 5, 10]) { line(ctx, bx + tw / 2, top + (m / SCALE_ML) * th, bx + tw / 2 + 8, top + (m / SCALE_ML) * th, C.dim, 1); text(ctx, String(m), bx + tw / 2 + 24, top + (m / SCALE_ML) * th, { size: fs(h) * 0.8, color: C.dim }); }
  ctx.fillStyle = '#8aa0b8'; ctx.globalAlpha = 0.6;
  ctx.fillRect(bx - tw / 2 + 2, top + level, tw - 4, th - level); ctx.globalAlpha = 1;
  line(ctx, bx - tw / 2 - 6, top + level, bx + tw / 2, top + level, C.amber, 2);
  ctx.fillStyle = C.steel; ctx.fillRect(bx - tw / 2 + 3, top + th, tw - 6, 8);
  // The drop falling to the flask.
  const fy0 = top + th + 14; const fy1 = h * 0.64;
  if (t > 0.04 && n < DROPS_LAST) disc(ctx, bx, fy0 + (fy1 - fy0) * part, h * 0.008, '#8aa0b8');
  // The flask, in the indicator's colour at this volume.
  const fb = h * 0.9; const fw = w * 0.07;
  ctx.beginPath();
  ctx.moveTo(bx - w * 0.015, h * 0.64); ctx.lineTo(bx + w * 0.015, h * 0.64); ctx.lineTo(bx + w * 0.015, h * 0.72); ctx.lineTo(bx + fw, fb); ctx.lineTo(bx - fw, fb); ctx.lineTo(bx - w * 0.015, h * 0.72); ctx.closePath();
  ctx.fillStyle = '#100f0c'; ctx.fill(); ctx.strokeStyle = C.steel; ctx.stroke();
  ctx.globalAlpha = fl.colour === 'colourless' ? 0.35 : 0.85;
  ctx.fillStyle = INK[fl.colour] || INK.colourless;
  ctx.beginPath(); ctx.moveTo(bx + w * 0.017, h * 0.74); ctx.lineTo(bx + fw - 4, fb - 3); ctx.lineTo(bx - fw + 4, fb - 3); ctx.lineTo(bx - w * 0.017, h * 0.74); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  // The count of drops and the volume they make, counted from the drops drawn.
  text(ctx, `${n} drops = ${v.toFixed(1)} mL`, bx + w * 0.11, h * 0.14, { size: fs(h) * 1.1, color: C.amber, weight: 700, align: 'left' });

  // Two rows of discs: one base disc for each drop that has run, and the acid discs the flask still holds.
  const x0 = w * 0.36; const step = w * 0.027; const r = h * 0.0125;
  const row = (count, y, ink) => { for (let i = 0; i < count; i++) disc(ctx, x0 + i * step, y, r, ink); return count; };
  const acidDiscs = Math.round(fl.acidLeft / DISC_MOL);
  const baseDiscs = Math.round(fl.nOH / DISC_MOL);
  const showRows = ease(win(t, 0.22, 0.3));
  if (showRows > 0.01) {
    ctx.globalAlpha = showRows;
    text(ctx, 'base added', x0 - w * 0.02, h * 0.28, { size: fs(h), color: COLD, weight: 700, align: 'left' });
    row(baseDiscs, h * 0.34, COLD);
    text(ctx, 'acid still in the flask', x0 - w * 0.02, h * 0.5, { size: fs(h), color: WARM, weight: 700, align: 'left' });
    row(acidDiscs, h * 0.56, WARM);
    text(ctx, `${baseDiscs} discs of base      ${acidDiscs} discs of acid`, x0 - w * 0.02, h * 0.68, { size: fs(h), color: C.dust, align: 'left' });
    ctx.globalAlpha = 1;
  }
  // The equivalence point: the drops at which no acid disc is left, found by counting down, and the next drop turns the dye.
  if (t > 0.5) {
    const eqDrops = Math.round(equivalenceMl(SYS) / DROP_ML);
    if (n >= eqDrops && acidDiscs === 0) text(ctx, `the discs match at ${eqDrops} drops`, x0 - w * 0.02, h * 0.77, { size: fs(h), color: C.pale, weight: 700, align: 'left' });
    if (fl.colour === 'pink') text(ctx, `the dye turns on drop ${n}`, x0 - w * 0.02, h * 0.85, { size: fs(h), color: INK.pink, weight: 700, align: 'left' });
  }
  // The strength: the base's strength times the volume counted, over the flask's volume.
  const d = ease(win(t, 0.76, 0.94));
  if (d > 0.01) {
    ctx.globalAlpha = d;
    box(ctx, w * 0.3, h * 0.08, w * 0.66, h * 0.1, '#100f0c');
    const eqMl = Math.round(equivalenceMl(SYS) / DROP_ML) * DROP_ML;
    const M = acidMolarity(SYS.base, eqMl, SYS.acid.mL, 1);
    text(ctx, `${SYS.base.M.toFixed(3)} mol/L x ${eqMl.toFixed(1)} mL / ${SYS.acid.mL.toFixed(1)} mL = ${M.toFixed(3)} mol/L`, w * 0.63, h * 0.13, { size: fs(h) * 1.05, color: C.dust, weight: 700 });
    ctx.globalAlpha = 1;
  }
}

export const Q7_SCENES = {
  'burette-count': buretteCount
};
