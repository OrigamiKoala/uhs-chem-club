/**
 * story-scenes-mirrowen-q7.js — the story picture of Mirrowen's q7 bench (Pulling Apart): three ways a mixture comes apart.
 * Same contract as `story-scenes-mirrowen.js`: pure functions of `t` on a 960-wide plate, SCOURED PLATE palette, every number read from
 * the data (`matterdata-strip.js`) or counted from what is drawn.
 *
 *   1  a filter paper: grains stop on it, dissolved particles go through its pores; the two counts are of the drawn dots
 *   2  two paper strips, water and hexane with acetone: each spot climbs to its own height and its Rf is the drawn spot's height over the drawn front's
 *   3  a still: three vials fill, ten cells each, with the temperature at the top of the column
 */

import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp, hash } from './story-sim.js';
import { spotCm, DYE_COLOUR, INKS, STILL_LIQUIDS, STILL_INK, STILL_NAME, stillCuts, FRONT_CM, SOLVENT_LABEL } from '../learn/engine/matterdata-strip.js';

const C = { ...KIT, cold: '#6f8fb0', warm: '#c0652b' };

const GRAINS = 9;
const IONS = 36;

function pullApart(ctx, w, h, t) {
  ground(ctx, w, h);
  /* ---- 1: the filter ---- */
  const a = 1 - ease(win(t, 0.3, 0.36));
  if (a > 0) {
    ctx.globalAlpha = a;
    const py = 290; const period = 36; const x0 = 120; const n = 20;
    // The paper: short bars with a pore between each pair.
    for (let k = 0; k < n; k++) { ctx.fillStyle = C.dust; ctx.fillRect(x0 + k * period, py - 4, 14, 8); }
    const p = ease(win(t, 0.03, 0.26));
    let caught = 0; let through = 0;
    for (let i = 0; i < GRAINS; i++) {
      const gx = x0 + (1 + i * 2) * period + 7 - period * 0.0;
      const stop = py - 4 - 20;
      const y = lerp(110, stop, p);
      disc(ctx, gx, y, 20, '#b79a5f');
      if (y >= stop - 0.5) caught++;
    }
    for (let j = 0; j < IONS; j++) {
      const k = Math.floor(hash(j, 3) * n);
      const gx = x0 + k * period + 14 + 11 + (hash(j, 5) - 0.5) * 8;
      const y0 = 100 + hash(j, 7) * 120;
      const y = lerp(y0, 440 - hash(j, 9) * 60, p);
      disc(ctx, gx, y, 4, C.cold);
      if (y > py + 4) through++;
    }
    text(ctx, `on the paper  ${caught}`, 120, 70, { size: 24, color: C.text, align: 'left', weight: 700 });
    text(ctx, `through the paper  ${through}`, 520, 70, { size: 24, color: C.text, align: 'left', weight: 700 });
    text(ctx, 'sand grains', 150, 510, { size: 20, color: '#b79a5f', align: 'left' });
    text(ctx, 'dissolved salt, in the water', 330, 510, { size: 20, color: C.cold, align: 'left' });
    ctx.globalAlpha = 1;
  }
  /* ---- 2: two strips ---- */
  const b = ease(win(t, 0.34, 0.4)) * (1 - ease(win(t, 0.64, 0.7)));
  if (b > 0) {
    ctx.globalAlpha = b;
    const p = ease(win(t, 0.4, 0.6));
    const base = 450; const px = 30; // 30 px to a centimetre
    [['water', 270], ['hexane', 690]].forEach(([sol, xc]) => {
      ctx.fillStyle = '#1c1a16'; ctx.fillRect(xc - 60, base - 11 * px, 120, 11 * px + 12);
      ctx.strokeStyle = C.steel; ctx.strokeRect(xc - 60 + 0.5, base - 11 * px + 0.5, 120, 11 * px + 12);
      line(ctx, xc - 60, base, xc + 60, base, C.dim, 1);
      const frontPx = FRONT_CM * px * p;
      if (p > 0.02) line(ctx, xc - 60, base - frontPx, xc + 60, base - frontPx, C.dust, 2);
      text(ctx, SOLVENT_LABEL[sol], xc, base - 11 * px - 22, { size: 22, color: C.text, weight: 700 });
      INKS.black.dyes.forEach(d => {
        const sp = spotCm(d, sol) * px * p;
        ctx.fillStyle = DYE_COLOUR[d];
        ctx.beginPath(); ctx.ellipse(xc, base - sp, 26, 16, 0, 0, Math.PI * 2); ctx.fill();
        // The fraction is the drawn spot's height over the drawn front's.
        if (frontPx > 8) text(ctx, (sp / frontPx).toFixed(2), xc + 90, base - sp, { size: 22, color: DYE_COLOUR[d], align: 'left', weight: 700 });
      });
    });
    text(ctx, 'distance of the spot ÷ distance of the front', w / 2, 510, { size: 22, color: C.dust });
    ctx.globalAlpha = 1;
  }
  /* ---- 3: the still ---- */
  const c = ease(win(t, 0.64, 0.7));
  if (c > 0) {
    ctx.globalAlpha = c;
    const cuts = stillCuts();
    const base = 420; const cell = 24;
    STILL_LIQUIDS.forEach((id, i) => {
      rect(ctx, 130, 150 + i * 36, 18, 18, STILL_INK[id]);
      text(ctx, STILL_NAME[id], 160, 159 + i * 36, { size: 24, color: C.text, align: 'left' });
    });
    cuts.forEach((cut, i) => {
      const xv = 430 + i * 130;
      ctx.strokeStyle = C.steel; ctx.strokeRect(xv + 0.5, base - 10 * cell + 0.5, 70, 10 * cell);
      const filled = Math.round(10 * ease(win(t, 0.7 + i * 0.08, 0.76 + i * 0.08)));
      let k = 0;
      STILL_LIQUIDS.forEach((id, j) => {
        for (let q = 0; q < cut.cells[j]; q++) { if (k < filled) rect(ctx, xv + 3, base - (k + 1) * cell + 2, 64, cell - 3, STILL_INK[id]); k++; }
      });
      text(ctx, `${cut.T.toFixed(1)} °C`, xv + 35, base + 30, { size: 22, color: C.dust });
      text(ctx, String(i + 1), xv + 35, base - 10 * cell - 20, { size: 22, color: C.text, weight: 700 });
    });
    text(ctx, 'ten cells to a vial, and the top of the column', 600, 500, { size: 20, color: C.dim });
    ctx.globalAlpha = 1;
  }
}

function rect(ctx, x, y, wd, ht, fill) { ctx.fillStyle = fill; ctx.fillRect(x, y, wd, ht); }

export const Q7_SCENES = { 'pull-apart': pullApart };
