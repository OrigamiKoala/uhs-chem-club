/**
 * story-scenes-brinewire-q6.js — the story painter of Brinewire's `q6-electrolysis`, registered in `story-scenes.js` through `legacy()`.
 *
 * `electrolysis-push` is a pure function of `t` on the 960-wide plate. Every number printed is measured from what is drawn: a voltage is a
 * bar length over its scale, the electrons and ions are the discs counted, a charge is the area of a drawn current-by-time rectangle over
 * its scale, a ratio is one drawn bar over another, a mass is a bar length over the length of a mole of that metal. Beat one pushes the
 * zinc–copper cell backwards (supply bar against cell bar, the zinc strip's mass bar grows by the planner's figure for the net push), beat
 * two counts electrons into sodium ions and out of chloride ions in the melt, beat three draws the three silver runs as rectangles,
 * beat four goes from 3600 C through one mole of electrons to grams of copper.
 */

import { cellE0, charge, faradayMass, METALS, FARADAY, fmt } from '../learn/engine/celldata.js';
import { driveZnCu } from '../learn/engine/celldata-electrolysis.js';
import { C, text, ground, win, ease, disc, line } from './story-kit.js';

function rect(ctx, x, y, w, h, fill, edge = null) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  if (edge) { ctx.strokeStyle = edge; ctx.strokeRect(Math.round(x) + 0.5, Math.round(y) + 0.5, Math.round(w), Math.round(h)); }
}

/** Beat one: the supply against the cell. */
function push(ctx, w, h, t) {
  text(ctx, 'A supply stronger than the cell drives it backwards', w / 2, 36, { size: 24, color: C.dust });
  const p = ease(win(t, 0.02, 0.18));
  const PX = 300; const x0 = 150;
  const cellV = cellE0('cu', 'zn'); const supV = 1.5;
  const cl = cellV * PX; const sl = supV * PX * p;
  text(ctx, 'Supply', 100, 140, { size: 20, color: C.dust, align: 'right' });
  rect(ctx, x0, 124, sl, 32, C.amber);
  text(ctx, `${fmt(sl / PX, 2)} V`, x0 + sl + 14, 140, { size: 24, color: C.amber, weight: 700, align: 'left' });
  text(ctx, 'Cell alone', 100, 220, { size: 20, color: C.dust, align: 'right' });
  rect(ctx, x0, 204, cl, 32, C.steel);
  text(ctx, `${fmt(cl / PX, 2)} V`, x0 + cl + 14, 220, { size: 24, color: C.dust, weight: 700, align: 'left' });
  if (p > 0.95) {
    line(ctx, x0 + cl, 112, x0 + cl, 250, C.pale, 2, [4, 5]);
    text(ctx, `${fmt((sl - cl) / PX, 2)} V left over`, x0 + cl + (sl - cl) / 2, 270, { size: 20, color: C.pale });
  }
  const q = ease(win(t, 0.1, 0.23));
  const drive = driveZnCu(supV, 'zn');
  const MG = 40;
  const ml = drive.zn * 1000 * MG * q;
  text(ctx, 'Zinc strip', 100, 380, { size: 20, color: C.dust, align: 'right' });
  rect(ctx, x0, 364, ml, 32, C.green);
  text(ctx, `gained ${fmt(ml / MG, 1)} mg`, x0 + ml + 14, 380, { size: 24, color: C.green, weight: 700, align: 'left' });
}

/** Beat two: electrons counted into sodium ions and out of chloride ions. */
function melt(ctx, w, h, t) {
  text(ctx, 'Molten sodium chloride between two electrodes', w / 2, 36, { size: 24, color: C.dust });
  const p = ease(win(t, 0.27, 0.43));
  const N = 6;
  rect(ctx, 150, 190, 660, 190, '#3b2d1d', C.steel);
  rect(ctx, 285, 150, 18, 230, '#8a8274'); rect(ctx, 657, 150, 18, 230, '#8a8274');
  text(ctx, 'cathode', 294, 124, { size: 20, color: C.dust }); text(ctx, 'anode', 666, 124, { size: 20, color: C.dust });
  let inN = 0; let outN = 0;
  for (let i = 0; i < N; i++) {
    const q = ease(win(p, i * 0.1, i * 0.1 + 0.45));
    const y = 215 + i * 26;
    // A sodium ion drifts to the left electrode and takes an electron there: an atom.
    const nx = 470 - q * 160;
    disc(ctx, nx, y, 15, q >= 1 ? '#d9d6cf' : '#b4ab97');
    if (q >= 1) inN++;
    // A chloride ion drifts to the right electrode and gives an electron up there.
    const cx = 490 + q * 160;
    disc(ctx, cx, y, 17, q >= 1 ? '#9fb04a' : '#5b7a32');
    if (q >= 1) outN++;
    // The electron on the wire: out of the chloride, over the supply, into the sodium.
    const e = ease(win(p, i * 0.1 + 0.2, i * 0.1 + 0.55));
    if (e > 0 && e < 1) disc(ctx, 666 - e * 372, 96 + Math.sin(e * Math.PI) * 0, 9, C.pale);
  }
  line(ctx, 294, 150, 294, 96, C.dust, 2); line(ctx, 294, 96, 666, 96, C.dust, 2); line(ctx, 666, 96, 666, 150, C.dust, 2);
  text(ctx, `${inN} electrons taken by ${inN} sodium ions`, 294, 420, { size: 21, color: C.amber, weight: 700 });
  text(ctx, `${outN} electrons given up by ${outN} chloride ions`, 666, 420, { size: 21, color: C.green, weight: 700 });
}

/** Beat three: three runs as current-by-time rectangles. */
function runs(ctx, w, h, t) {
  text(ctx, 'Silver plated by three runs', w / 2, 36, { size: 24, color: C.dust });
  const p = ease(win(t, 0.5, 0.66));
  const TS = 1.6; const IS = 70; const MG = 8;
  [[1, 30, 60], [2, 10, 340], [0.5, 100, 620]].forEach(([I, s, x]) => {
    const rw = s * TS * p; const rh = I * IS;
    const y = 270;
    rect(ctx, x, y - rh, rw, rh, '#4a463e', C.steel);
    text(ctx, `${I} A, ${s} s`, x + 90, 96, { size: 21, color: C.dust });
    const area = (rw / TS) * (rh / IS);
    text(ctx, `${fmt(area, 0)} C`, x + 90, y + 30, { size: 30, color: C.amber, weight: 700 });
    const mg = faradayMass(I, s, 'ag') * 1000;
    const bl = mg * MG * p;
    rect(ctx, x, y + 66, bl, 22, C.pale);
    text(ctx, `${fmt(bl / MG, 1)} mg of silver`, x, y + 112, { size: 20, color: C.dust, align: 'left' });
  });
}

/** Beat four: charge, then moles of electrons, then grams. */
function faraday(ctx, w, h, t) {
  text(ctx, 'Copper plated by 2.00 A for 1800 s', w / 2, 36, { size: 24, color: C.dust });
  const p = ease(win(t, 0.78, 0.9));
  const TS = 0.3; const IS = 40;
  const rw = 1800 * TS; const rh = 2 * IS;
  rect(ctx, 150, 90, rw * p, rh, '#4a463e', C.steel);
  text(ctx, `${fmt(((rw * p) / TS) * (rh / IS), 0)} C passed`, 150 + rw + 30, 90 + rh / 2, { size: 24, color: C.amber, weight: 700, align: 'left' });
  const L = 700; const bx = 150;
  const q = charge(2, 1800);
  const fl = L; const ql = (q / FARADAY) * L * p;
  text(ctx, 'One mole of electrons, 96,485 C', bx, 210, { size: 19, color: C.dust, align: 'left' });
  rect(ctx, bx, 224, fl, 18, C.faint, C.steel);
  rect(ctx, bx, 224, ql, 18, C.amber);
  text(ctx, `${fmt(ql / L, 4)} mol of electrons`, bx + Math.max(ql, 60) + 14, 233, { size: 20, color: C.amber, weight: 700, align: 'left' });
  const hl = ql / 2;
  text(ctx, 'Two electrons for each copper atom', bx, 282, { size: 19, color: C.dust, align: 'left' });
  rect(ctx, bx, 296, hl, 18, C.pale);
  text(ctx, `${fmt(hl / L, 4)} mol of copper`, bx + Math.max(hl, 40) + 14, 305, { size: 20, color: C.pale, weight: 700, align: 'left' });
  text(ctx, 'One mole of copper, 63.5 g', bx, 354, { size: 19, color: C.dust, align: 'left' });
  rect(ctx, bx, 368, L, 18, C.faint, C.steel);
  const g = (hl / L) * METALS.cu.M;
  rect(ctx, bx, 368, hl, 18, C.green);
  if (p > 0.9) text(ctx, `${fmt(g, 2)} g of copper`, bx + 40, 412, { size: 28, color: C.green, weight: 700, align: 'left' });
}

function electrolysisPush(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t <= 0.24) return push(ctx, w, h, t);
  if (t <= 0.48) return melt(ctx, w, h, t);
  if (t <= 0.72) return runs(ctx, w, h, t);
  return faraday(ctx, w, h, t);
}

export const BRINEWIRE_Q6_SCENES = { 'electrolysis-push': electrolysisPush };
