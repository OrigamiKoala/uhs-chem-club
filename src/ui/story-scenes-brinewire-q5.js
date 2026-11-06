/**
 * story-scenes-brinewire-q5.js — the story painter of `unit10/q5-load` (Under Load), registered in `story-scenes.js` through `legacy()`.
 *
 * `load-down`: a pure function of `t` on the 960-wide plate. Every number printed is measured from what is drawn: the dots in a window are
 * counted as they are painted, the voltage on the plot is the point the planner (`celldata-q5.js` `loadTrace`) put under the pen, the
 * reaction quotient is the ratio of the two painted counts, and a voltage read off the Q axis is read from the height of the marker.
 * Beat one runs the tin and lead cell down, beat two stops it with both windows still full of dots, beat three slides Q up to K,
 * beat four reads the Nernst voltage of two other cells off a voltage-against-log Q line.
 */

import { cellE0, nernst, fmt } from '../learn/engine/celldata.js';
import { LOAD, loadAt, loadTrace, balanceOf, milliText } from '../learn/engine/celldata-q5.js';
import { C, text, ground, win, ease, disc, line } from './story-kit.js';

const START = { cAnode0: 1, cCathode0: 1 };
const ORDER = Array.from({ length: LOAD.dotsCap }, (_, i) => (i * 37 + 11) % LOAD.dotsCap);

/** A beaker window of dots; returns the number of dots it painted. */
function windowOf(ctx, x, y, n, label) {
  const w = 200; const h = 220;
  ctx.fillStyle = '#1f3330'; ctx.fillRect(x, y + 14, w, h - 14);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + h); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w, y); ctx.stroke();
  let painted = 0;
  for (let i = 0; i < n; i++) {
    const k = ORDER[i];
    disc(ctx, x + 16 + (k % 10) * 19.6, y + 34 + Math.floor(k / 10) * 18.6, 5.2, C.pale);
    painted++;
  }
  text(ctx, label, x + w / 2, y + h + 30, { size: 24, color: C.text, weight: 700 });
  return painted;
}

function plotBox(ctx, x, y, w, h, vMax, tickMax, tick) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 2; ctx.strokeRect(x, y, w, h);
  text(ctx, 'Voltage (V)', x, y - 18, { size: 20, color: C.dust, align: 'left', weight: 700 });
  text(ctx, '0', x - 12, y + h - 8, { size: 18, color: C.dust, align: 'right' });
  text(ctx, String(vMax), x - 12, y + 8, { size: 18, color: C.dust, align: 'right' });
  text(ctx, 'Time', x + w, y + h + 26, { size: 18, color: C.dim, align: 'right' });
  const X = t => x + 8 + (t / tickMax) * (w - 16);
  const Y = v => y + h - 8 - (v / vMax) * (h - 16);
  const tr = loadTrace('pb', 'sn', START, tick);
  ctx.strokeStyle = C.amber; ctx.lineWidth = 4; ctx.beginPath();
  tr.forEach((q, i) => (i ? ctx.lineTo(X(q.t), Y(q.E)) : ctx.moveTo(X(q.t), Y(q.E))));
  ctx.stroke();
  const last = tr[tr.length - 1];
  disc(ctx, X(last.t), Y(last.E), 7, C.amber);
  return last.E;
}

function loadDown(ctx, w, h, t) {
  ground(ctx, w, h);
  const K = balanceOf('pb', 'sn', START).K;
  const end = loadAt('pb', 'sn', START, LOAD.maxTick);
  const tinX = 70; const leadX = 320; const wy = 110;

  if (t <= 0.26) {
    text(ctx, 'The tin and lead cell, run under a load', w / 2, 36, { size: 24, color: C.dust });
    const tick = Math.round(ease(win(t, 0.02, 0.24)) * LOAD.maxTick);
    const s = loadAt('pb', 'sn', START, tick);
    const a = windowOf(ctx, tinX, wy, s.nAnode, 'Tin ions');
    const b = windowOf(ctx, leadX, wy, s.nCathode, 'Lead ions');
    text(ctx, String(a), tinX + 100, wy - 18, { size: 26, color: C.amber, weight: 700 });
    text(ctx, String(b), leadX + 100, wy - 18, { size: 26, color: C.amber, weight: 700 });
    const E = plotBox(ctx, 620, 130, 290, 200, 0.012, LOAD.maxTick, tick);
    text(ctx, `${milliText(E)} V`, 765, 400, { size: 40, color: C.amber, weight: 700 });
    text(ctx, 'voltmeter', 765, 436, { size: 18, color: C.dim });
    return;
  }

  if (t <= 0.5) {
    text(ctx, 'When the voltmeter reads zero', w / 2, 36, { size: 24, color: C.dust });
    const a = windowOf(ctx, tinX, wy, end.nAnode, 'Tin ions');
    const b = windowOf(ctx, leadX, wy, end.nCathode, 'Lead ions');
    const p = ease(win(t, 0.28, 0.4));
    ctx.globalAlpha = p;
    text(ctx, `${a} dots`, tinX + 100, wy - 18, { size: 30, color: C.amber, weight: 700 });
    text(ctx, `${b} dots`, leadX + 100, wy - 18, { size: 30, color: C.amber, weight: 700 });
    text(ctx, `${milliText(plotBox(ctx, 620, 130, 290, 200, 0.012, LOAD.maxTick, LOAD.maxTick))} V`, 765, 400, { size: 40, color: C.amber, weight: 700 });
    ctx.globalAlpha = 1;
    text(ctx, 'voltmeter', 765, 436, { size: 18, color: C.dim });
    return;
  }

  if (t <= 0.74) {
    text(ctx, 'Tin over lead, and the voltage', w / 2, 36, { size: 24, color: C.dust });
    const a = Math.round(end.nAnode); const b = Math.round(end.nCathode);
    // Two bars, one painted dot-unit = 4 px wide; their lengths give the ratio.
    const unit = 4.6;
    const p = ease(win(t, 0.54, 0.68));
    const la = a * unit; const lb = b * unit;
    ctx.fillStyle = C.pale; ctx.fillRect(110, 110, la, 34);
    ctx.fillStyle = C.dust; ctx.fillRect(110, 168, lb, 34);
    text(ctx, `Tin ${a}`, 100, 127, { size: 22, color: C.text, align: 'right', weight: 700 });
    text(ctx, `Lead ${b}`, 100, 185, { size: 22, color: C.text, align: 'right', weight: 700 });
    const ratio = la / lb;
    text(ctx, `tin ÷ lead = ${fmt(ratio, 1)}`, 640, 150, { size: 30, color: C.amber, weight: 700 });
    // Q axis from 1 to 3.
    const ax0 = 140; const ax1 = 820; const qMax = 3;
    const qx = q => ax0 + ((q - 1) / (qMax - 1)) * (ax1 - ax0);
    const qOf = x => 1 + ((x - ax0) / (ax1 - ax0)) * (qMax - 1);
    line(ctx, ax0, 360, ax1, 360, C.steel, 3);
    for (const q of [1, 2, 3]) { line(ctx, qx(q), 352, qx(q), 368, C.steel, 3); text(ctx, String(q), qx(q), 392, { size: 20, color: C.dust }); }
    text(ctx, 'Q', ax1 + 36, 360, { size: 24, color: C.dust, weight: 700 });
    line(ctx, qx(K), 330, qx(K), 360, C.green, 3);
    text(ctx, `K = ${fmt(K, 1)}`, qx(K), 312, { size: 22, color: C.green, weight: 700 });
    const mx = qx(1) + (qx(ratio) - qx(1)) * p;
    disc(ctx, mx, 360, 11, C.amber);
    const Q = qOf(mx);
    text(ctx, `Q = ${fmt(Q, 2)}`, mx, 422, { size: 24, color: C.amber, weight: 700 });
    text(ctx, `${milliText(nernst(cellE0('pb', 'sn'), 2, Q))} V`, 640, 232, { size: 40, color: C.amber, weight: 700 });
    return;
  }

  text(ctx, 'Voltage against Q for two other cells', w / 2, 36, { size: 24, color: C.dust });
  const x0 = 130; const x1 = 850; const lMin = -3; const lMax = 4;
  const y0 = 440; const y1 = 110; const vMin = 0; const vMax = 1.3;
  const X = lg => x0 + ((lg - lMin) / (lMax - lMin)) * (x1 - x0);
  const Y = v => y0 - ((v - vMin) / (vMax - vMin)) * (y0 - y1);
  const vOf = y => vMin + ((y0 - y) / (y0 - y1)) * (vMax - vMin);
  line(ctx, x0, y0, x1, y0, C.steel, 3);
  line(ctx, x0, y0, x0, y1, C.steel, 3);
  for (let lg = lMin; lg <= lMax; lg++) { line(ctx, X(lg), y0, X(lg), y0 + 8, C.steel, 2); text(ctx, String(lg < 0 ? `−${-lg}` : lg), X(lg), y0 + 30, { size: 18, color: C.dust }); }
  text(ctx, 'log Q', x1, y0 + 56, { size: 20, color: C.dim, align: 'right' });
  text(ctx, 'Volts', x0, y1 - 22, { size: 20, color: C.dust, align: 'left', weight: 700 });
  for (const v of [0, 0.5, 1]) text(ctx, String(v), x0 - 14, Y(v), { size: 18, color: C.dust, align: 'right' });
  const curves = [
    { E0: cellE0('cu', 'zn'), lg: 3, name: 'Zinc, 1.0 M, and copper, 0.0010 M', ink: C.amber, ly: 0 },
    { E0: 0, lg: -2, name: 'Copper, 0.010 M, against copper, 1.0 M', ink: C.green, ly: 1 }
  ];
  for (const cv of curves) {
    ctx.strokeStyle = cv.ink; ctx.lineWidth = 4; ctx.beginPath();
    for (let i = 0; i <= 56; i++) { const lg = lMin + ((lMax - lMin) * i) / 56; const px = X(lg); const py = Y(nernst(cv.E0, 2, 10 ** lg)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); }
    ctx.stroke();
    const p = ease(win(t, 0.76 + cv.ly * 0.08, 0.84 + cv.ly * 0.08));
    if (p > 0.02) {
      const mx = X(cv.lg); const my = Y(nernst(cv.E0, 2, 10 ** cv.lg));
      disc(ctx, mx, my, 11 * p, cv.ink);
      if (p > 0.9) {
        const lg = lMin + ((mx - x0) / (x1 - x0)) * (lMax - lMin);
        const q = 10 ** lg;
        text(ctx, `Q = ${q >= 100 ? Math.round(q) : fmt(q, 2)}`, mx, my - 44, { size: 22, color: cv.ink, weight: 700 });
        text(ctx, `${fmt(vOf(my), cv.E0 === 0 ? 3 : 2)} V`, mx, my - 18, { size: 28, color: cv.ink, weight: 700 });
      }
    }
    text(ctx, cv.name, 150, 486 + cv.ly * 28, { size: 18, color: cv.ink, align: 'left' });
  }
}

export const BRINEWIRE_Q5_SCENES = { 'load-down': loadDown };
