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
  if (t <= 0.42) {
    /* Beat one (0 to 0.2): Mg and Cl chips slide into a cell; the needle's total is the sum of the chips that have arrived. */
    {
      const cell = { x: w * 0.3, y: h * 0.08, w: w * 0.4, h: h * 0.2 };
      box(ctx, cell.x, cell.y, cell.w, cell.h, '#100f0c');
      const ions = ['Mg', 'Cl', 'Cl'];
      const arrived = {};
      ions.forEach((ion, i) => {
        const p = ease(win(t, 0.01 + i * 0.05, 0.07 + i * 0.05));
        const sx = w * (0.06 + 0.08 * i); const sy = h * 0.18;
        const tx = cell.x + cell.w * (0.22 + 0.28 * i); const ty = cell.y + cell.h / 2;
        chip(ctx, sx + (tx - sx) * p, sy + (ty - sy) * p, u * 1.15, ion);
        if (p > 0.98) arrived[ion] = (arrived[ion] || 0) + 1;
      });
      const q = netCharge(arrived);
      if (t > 0.05) text(ctx, `charge in the cell: ${q > 0 ? '+' : q < 0 ? '−' : ''}${Math.abs(q)}`, w * 0.5, h * 0.33, { size: fs(h) * 1.05, color: q === 0 && Object.keys(arrived).length ? C.pale : C.amber, weight: 700 });
    }
    /* Beat two (0.2 to 0.42): magnesium oxide and iron(III) oxide. */
    const b = ease(win(t, 0.21, 0.3));
    if (b > 0.01) {
      const words = nameIonic('Mg', 'O').split(' ');
      chip(ctx, w * 0.12, h * 0.5, u * 1.1, 'Mg', b);
      chip(ctx, w * 0.2, h * 0.5, u * 1.1, 'O', b);
      words.forEach((word, i) => {
        box(ctx, w * (0.32 + i * 0.22), h * 0.45, w * 0.2, h * 0.09, '#2a2620', C.dust);
        text(ctx, word, w * (0.42 + i * 0.22), h * 0.495, { size: fs(h) * 1.05, color: C.text, weight: 700 });
      });
      let running = 0;
      [0, 1, 2].forEach(i => {
        const a = ease(win(t, 0.25 + i * 0.03, 0.31 + i * 0.03));
        chip(ctx, w * (0.12 + 0.09 * i), h * 0.73, u * 1.1, 'O', a);
        if (a > 0.98) running += IONS.O.q;
      });
      text(ctx, `oxide charges: ${running}`.replace('-', '−'), w * 0.28, h * 0.85, { size: fs(h), color: C.dust });
      const irons = 2;
      const share = ease(win(t, 0.32, 0.39));
      for (let i = 0; i < irons; i++) {
        chip(ctx, w * (0.62 + 0.1 * i), h * 0.73, u * 1.1, 'Fe3', b, false);
        if (share > 0.01) line(ctx, w * (0.62 + 0.1 * i), h * 0.73 - u * 1.4, w * (0.62 + 0.1 * i), h * 0.73 - u * 2.2, C.amber, 2);
      }
      if (share > 0.6) {
        const q = metalChargeFrom(running, irons);
        text(ctx, `each iron: +${q}`, w * 0.67, h * 0.85, { size: fs(h) * 1.05, color: C.amber, weight: 700 });
        text(ctx, `${nameIonic('Fe3', 'O').replace('(III)', `(${romanOf(q)})`)}`, w * 0.5, h * 0.94, { size: fs(h) * 1.15, color: C.text, weight: 700 });
      }
    }
    return;
  }
  /* Beat three (0.42 to 0.64): polyatomic ions stay whole (Ca(NO3)2 & Fe2(SO4)3). */
  if (t <= 0.64) {
    const p = ease(win(t, 0.43, 0.56));
    box(ctx, w * 0.08, h * 0.16, w * 0.84, h * 0.28, '#100f0c');
    text(ctx, 'POLYATOMIC IONS STAY WHOLE', w * 0.5, h * 0.1, { size: fs(h), color: C.dust, weight: 700 });
    chip(ctx, w * 0.22, h * 0.3, u * 1.15, 'Ca', p);
    [0, 1].forEach(i => {
      const cx = w * (0.44 + i * 0.18); const cy = h * 0.3;
      disc(ctx, cx, cy, u * 1.35, '#20262c', C.amber);
      text(ctx, 'NO₃⁻', cx, cy, { size: fs(h) * 0.95, color: C.text, weight: 700 });
    });
    text(ctx, 'Ca(NO₃)₂', w * 0.8, h * 0.3, { size: fs(h) * 1.2, color: C.amber, weight: 700 });
    box(ctx, w * 0.08, h * 0.54, w * 0.84, h * 0.32, '#100f0c');
    [0, 1].forEach(i => chip(ctx, w * (0.18 + i * 0.1), h * 0.68, u * 1.05, 'Fe3', p, false));
    [0, 1, 2].forEach(i => {
      const cx = w * (0.44 + i * 0.13); const cy = h * 0.68;
      disc(ctx, cx, cy, u * 1.25, '#262319', C.amber);
      text(ctx, 'SO₄²⁻', cx, cy, { size: fs(h) * 0.82, color: C.text, weight: 700 });
    });
    text(ctx, 'iron(III) sulfate · Fe₂(SO₄)₃', w * 0.5, h * 0.8, { size: fs(h) * 1.05, color: C.text, weight: 700 });
    return;
  }
  /* Beat four (0.64 to 0.82): molecular prefixes (N2O4 -> dinitrogen tetroxide). */
  if (t <= 0.82) {
    const p = ease(win(t, 0.65, 0.76));
    text(ctx, 'MOLECULAR PREFIXES COUNT ATOMS', w * 0.5, h * 0.14, { size: fs(h), color: C.dust, weight: 700 });
    box(ctx, w * 0.14, h * 0.24, w * 0.72, h * 0.34, '#100f0c');
    const nPos = [[0.42, 0.41], [0.58, 0.41]];
    const oPos = [[0.32, 0.32], [0.32, 0.5], [0.68, 0.32], [0.68, 0.5]];
    oPos.forEach(([ox, oy], i) => {
      const [nx, ny] = nPos[i < 2 ? 0 : 1];
      line(ctx, w * nx, h * ny, w * ox, h * oy, C.steel, 3);
    });
    line(ctx, w * 0.42, h * 0.41, w * 0.58, h * 0.41, C.steel, 3);
    ctx.globalAlpha = p;
    nPos.forEach(([nx, ny]) => { disc(ctx, w * nx, h * ny, u * 1.15, '#6f8fb0', C.dust); text(ctx, 'N', w * nx, h * ny, { size: fs(h), color: '#0f0e0b', weight: 700 }); });
    oPos.forEach(([ox, oy]) => { disc(ctx, w * ox, h * oy, u * 0.95, '#a0522d', C.dust); text(ctx, 'O', w * ox, h * oy, { size: fs(h) * 0.9, color: '#0f0e0b', weight: 700 }); });
    ctx.globalAlpha = 1;
    text(ctx, '2 N (di-)  ·  4 O (tetra-)  →  dinitrogen tetroxide', w * 0.5, h * 0.72, { size: fs(h) * 1.1, color: C.amber, weight: 700 });
    return;
  }
  /* Beat five (0.82 to 1): acid names (-ide -> hydro-...-ic, -ate -> ...-ic). */
  const p = ease(win(t, 0.83, 0.94));
  ctx.globalAlpha = p;
  text(ctx, 'ACID NAMES', w * 0.5, h * 0.14, { size: fs(h), color: C.dust, weight: 700 });
  box(ctx, w * 0.1, h * 0.24, w * 0.8, h * 0.24, '#100f0c');
  text(ctx, 'H⁺ + Cl⁻ (chloride, -ide)  →  hydrochloric acid', w * 0.5, h * 0.36, { size: fs(h) * 1.1, color: C.text, weight: 700 });
  box(ctx, w * 0.1, h * 0.56, w * 0.8, h * 0.24, '#100f0c');
  text(ctx, 'H⁺ + NO₃⁻ (nitrate, -ate)  →  nitric acid', w * 0.5, h * 0.68, { size: fs(h) * 1.1, color: C.amber, weight: 700 });
  ctx.globalAlpha = 1;
}

export const Q2_SCENES = { 'crate-labels': crateLabels };
