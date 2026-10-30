/**
 * story-scenes-kettle-q2.js — the story painters of Kettle's q2 bench, spread into `KETTLE_SCENES` (`story-scenes-kettle.js`).
 * Follow `story-scenes-kettle.js`: 960 x 540 plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `crate-labels`: three ideas of the bench. Chips slide into a cell and the needle's total is the sum of the charges of the chips that
 * have arrived; a name is built from the ions' own names (`nameIonic`); and the iron in Fe2O3 gets its charge from the drawn oxide
 * chips (their running sum, split between the drawn irons), which is where the roman numeral comes from (`romanOf`).
 */

import { IONS, netCharge, chargeText, nameIonic } from '../learn/engine/reactdata.js';
import { romanOf, metalChargeFrom } from '../learn/engine/reactdata-names.js';
import { C, disc, line, legacyText as text, ground, win, ease } from './story-kit.js';

const fs = h => Math.max(11, h * 0.04);
const INK = { Mg: '#8aa89a', Cl: '#8fae6a', O: '#a0522d', Fe: '#9a6a52' };

function box(ctx, x, y, w, h, fill, stroke = C.steel) {
  ctx.fillStyle = fill; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/** One ion chip: a disc with its symbol and, when asked, its charge. */
function chip(ctx, x, y, r, ion, a = 1, showCharge = true) {
  ctx.globalAlpha = a;
  disc(ctx, x, y, r, INK[IONS[ion].f] || '#b8afa0', C.dust);
  text(ctx, IONS[ion].f, x, y, { size: r * 0.9, color: '#0f0e0b', weight: 700 });
  if (showCharge) text(ctx, chargeText(IONS[ion].q), x + r * 0.95, y - r * 0.9, { size: r * 0.8, color: C.amber, weight: 700 });
  ctx.globalAlpha = 1;
}

function crateLabels(ctx, w, h, t) {
  ground(ctx, w, h);
  const u = h * 0.045;
  /* Beat one (0 to 0.3): Mg and Cl chips slide into a cell; the needle's total is the sum of the chips that have arrived. */
  {
    const cell = { x: w * 0.3, y: h * 0.1, w: w * 0.4, h: h * 0.2 };
    box(ctx, cell.x, cell.y, cell.w, cell.h, '#100f0c');
    const ions = ['Mg', 'Cl', 'Cl'];
    const arrived = {};
    ions.forEach((ion, i) => {
      const p = ease(win(t, 0.01 + i * 0.07, 0.1 + i * 0.07));
      const sx = w * (0.06 + 0.08 * i); const sy = h * 0.2;
      const tx = cell.x + cell.w * (0.22 + 0.28 * i); const ty = cell.y + cell.h / 2;
      chip(ctx, sx + (tx - sx) * p, sy + (ty - sy) * p, u * 1.15, ion);
      if (p > 0.98) arrived[ion] = (arrived[ion] || 0) + 1;
    });
    const q = netCharge(arrived);
    if (t > 0.08) text(ctx, `charge in the cell: ${q > 0 ? '+' : q < 0 ? '−' : ''}${Math.abs(q)}`, w * 0.5, h * 0.355, { size: fs(h) * 1.1, color: q === 0 && Object.keys(arrived).length ? C.pale : C.amber, weight: 700 });
  }
  /* Beat two (0.3 to 0.6): the name is built from the ions' own names. */
  const b = ease(win(t, 0.3, 0.42));
  if (b > 0.01) {
    const words = nameIonic('Mg', 'O').split(' ');
    chip(ctx, w * 0.12, h * 0.52, u * 1.15, 'Mg', b);
    chip(ctx, w * 0.2, h * 0.52, u * 1.15, 'O', b);
    words.forEach((word, i) => {
      const a = ease(win(t, 0.34 + i * 0.1, 0.44 + i * 0.1));
      box(ctx, w * (0.32 + i * 0.22), h * 0.47, w * 0.2, h * 0.09, '#2a2620', C.dust);
      ctx.globalAlpha = a;
      text(ctx, word, w * (0.42 + i * 0.22), h * 0.515, { size: fs(h) * 1.1, color: C.text, weight: 700 });
      ctx.globalAlpha = 1;
    });
  }
  /* Beat three (0.6 to 1): the oxide chips' charges add up, the irons share them, the numeral is that share. */
  const c = ease(win(t, 0.6, 0.7));
  if (c > 0.01) {
    const oxides = [0, 1, 2];
    let running = 0;
    oxides.forEach(i => {
      const a = ease(win(t, 0.62 + i * 0.06, 0.7 + i * 0.06));
      chip(ctx, w * (0.12 + 0.09 * i), h * 0.75, u * 1.15, 'O', a);
      if (a > 0.98) running += IONS.O.q;
    });
    text(ctx, `oxide charges so far: ${running}`.replace('-', '−'), w * 0.3, h * 0.86, { size: fs(h), color: C.dust });
    const irons = 2;
    const share = ease(win(t, 0.82, 0.92));
    for (let i = 0; i < irons; i++) {
      chip(ctx, w * (0.62 + 0.1 * i), h * 0.75, u * 1.15, 'Fe', c, false);
      if (share > 0.01) {
        line(ctx, w * (0.62 + 0.1 * i), h * 0.75 - u * 1.4, w * (0.62 + 0.1 * i), h * 0.75 - u * 2.4, C.amber, 2);
      }
    }
    if (share > 0.7) {
      const q = metalChargeFrom(running, irons);
      text(ctx, `each iron: ${q > 0 ? '+' : ''}${q}`, w * 0.67, h * 0.86, { size: fs(h) * 1.05, color: C.amber, weight: 700 });
      text(ctx, `${nameIonic('Fe3', 'O').replace('(III)', `(${romanOf(q)})`)}`, w * 0.5, h * 0.94, { size: fs(h) * 1.15, color: C.text, weight: 700 });
    }
  }
}

export const Q2_SCENES = { 'crate-labels': crateLabels };
