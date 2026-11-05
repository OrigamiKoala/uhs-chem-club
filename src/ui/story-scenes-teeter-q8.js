/**
 * story-scenes-teeter-q8.js — the story painter of Teeter's bench 8 (`q8-free`), spread into `TEETER_SCENES` (`story-scenes-teeter.js`).
 * A 960-wide plate, a pure function of `t`; every number printed is measured from what is drawn (bar heights, the dot's place on a curve
 * or a line, a drawn length), using the same planners the bench reads (`engine/eqdata-free.js`).
 *
 * `free-k`, four beats:
 *   0 to 0.26     three pans settle (ΔG° +8, +2, −3 kJ/mol); each pan's K is its product bar over its reactant bar, both measured in pixels.
 *   0.26 to 0.52  a dot walks down the curve of product held against ΔG°; the product share and K are read from the dot's height.
 *   0.52 to 0.76  N₂O₄ ⇌ 2 NO₂ warmed along its ΔG° line from 298 K to 350 K; ΔG° is read from the dot's place on the line.
 *   0.76 to 1     the +13.8 bar slides along the −30.5 bar and the length left over is measured.
 */

import { settledAt, MODEL_PAN, WARM, columnRead, COUPLE, dGOf } from '../learn/engine/eqdata-free.js';
import { C, text, ground, win, ease } from './story-kit.js';

const R_INK = '#c0652b'; const P_INK = '#6f8fb0';
const fs = h => Math.max(14, h * 0.042);
const sgn = (v, d = 1) => `${v < 0 ? '−' : '+'}${(Math.abs(v) + 1e-9).toFixed(d)}`;

function box(ctx, x, y, w, h) {
  ctx.fillStyle = '#100f0c'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

/** Beat one: three pans, the bars growing from the start (all reactant) to where each settles. */
function pans(ctx, w, h, p) {
  const dGs = [8, 2, -3];
  const bw = w * 0.2; const gap = (w - 3 * bw) / 4; const top = h * 0.2; const hh = h * 0.42;
  dGs.forEach((dG, i) => {
    const x = gap + i * (bw + gap);
    box(ctx, x, top, bw, hh);
    const r = settledAt(MODEL_PAN, dG);
    const a = 1 - p * (1 - r.amounts.A); const b = p * r.amounts.B;
    const base = top + hh - 8;
    const hA = a * (hh - 24); const hB = b * (hh - 24);
    ctx.fillStyle = R_INK; ctx.fillRect(x + bw * 0.16, base - hA, bw * 0.26, hA);
    ctx.fillStyle = P_INK; ctx.fillRect(x + bw * 0.58, base - hB, bw * 0.26, hB);
    text(ctx, `ΔG° ${sgn(dG, 0)} kJ/mol`, x + bw / 2, top - h * 0.04, { size: fs(h), color: C.amber, weight: 700 });
    // K, measured from the two bars as drawn.
    if (p > 0.97) text(ctx, `product ÷ reactant = ${(hB / hA).toPrecision(2)}`, x + bw / 2, top + hh + h * 0.07, { size: fs(h), color: C.dust });
  });
  text(ctx, 'reactant (orange) and product (blue) bars, 1.00 mol/L at the start', w / 2, h * 0.9, { size: fs(h) * 0.9, color: C.dim });
}

/** Beat two: product held against ΔG°, and a dot on the curve. */
function curve(ctx, w, h, p) {
  const x0 = w * 0.12; const x1 = w * 0.88; const y0 = h * 0.18; const y1 = h * 0.7;
  box(ctx, x0, y0, x1 - x0, y1 - y0);
  const lo = -12; const hi = 12;
  const X = d => x1 - ((d - lo) / (hi - lo)) * (x1 - x0);
  const Y = share => y1 - share * (y1 - y0);
  ctx.strokeStyle = C.dim; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x0, Y(0.5)); ctx.lineTo(x1, Y(0.5)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = P_INK; ctx.lineWidth = 3; ctx.beginPath();
  for (let i = 0; i <= 120; i++) {
    const d = hi - (i / 120) * (hi - lo);
    const share = settledAt(MODEL_PAN, d).amounts.B;
    if (i === 0) ctx.moveTo(X(d), Y(share)); else ctx.lineTo(X(d), Y(share));
  }
  ctx.stroke(); ctx.lineWidth = 1;
  const d = hi - ease(p) * (hi - lo);
  const share = settledAt(MODEL_PAN, d).amounts.B;
  ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(X(d), Y(share), 9, 0, Math.PI * 2); ctx.fill();
  // The readings are taken from the dot: its height gives the share, the share gives K.
  const shown = (y1 - Y(share)) / (y1 - y0);
  text(ctx, `ΔG° ${sgn(d)} kJ/mol`, w * 0.3, h * 0.8, { size: fs(h) * 1.15, color: C.amber, weight: 700 });
  text(ctx, `product held ${(shown * 100).toFixed(0)}%`, w * 0.5, h * 0.8, { size: fs(h) * 1.15, color: P_INK, weight: 700 });
  text(ctx, `K = ${(shown / (1 - shown)).toPrecision(2)}`, w * 0.74, h * 0.8, { size: fs(h) * 1.15, color: C.dust, weight: 700 });
  text(ctx, 'half of it product', x0 + 80, Y(0.5) - 12, { size: fs(h) * 0.85, color: C.dim });
}

/** Beat three: ΔG° = ΔH° − TΔS° as a line against T; the dot walks from 298 K to 350 K. */
function warm(ctx, w, h, p) {
  const r = WARM.n2o4;
  const x0 = w * 0.12; const x1 = w * 0.88; const y0 = h * 0.18; const y1 = h * 0.7;
  box(ctx, x0, y0, x1 - x0, y1 - y0);
  const Tlo = 280; const Thi = 380; const gLo = -10; const gHi = 10;
  const X = T => x0 + ((T - Tlo) / (Thi - Tlo)) * (x1 - x0);
  const Y = g => y1 - ((g - gLo) / (gHi - gLo)) * (y1 - y0);
  ctx.strokeStyle = C.dim; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(x0, Y(0)); ctx.lineTo(x1, Y(0)); ctx.stroke(); ctx.setLineDash([]);
  ctx.strokeStyle = C.green; ctx.lineWidth = 3; ctx.beginPath();
  ctx.moveTo(X(Tlo), Y(dGOf({ dH: r.dH, dS: r.dS, T: Tlo }))); ctx.lineTo(X(Thi), Y(dGOf({ dH: r.dH, dS: r.dS, T: Thi }))); ctx.stroke(); ctx.lineWidth = 1;
  const T = r.Ts[0] + ease(p) * (r.Ts[1] - r.Ts[0]);
  const g = dGOf({ dH: r.dH, dS: r.dS, T });
  ctx.fillStyle = C.amber; ctx.beginPath(); ctx.arc(X(T), Y(g), 9, 0, Math.PI * 2); ctx.fill();
  // Read back from the dot's place: its x gives T, its y gives ΔG°, and ΔG° at T gives the product of the pan.
  const Tread = Tlo + ((X(T) - x0) / (x1 - x0)) * (Thi - Tlo);
  const gRead = gLo + ((y1 - Y(g)) / (y1 - y0)) * (gHi - gLo);
  const prod = columnRead(r.sys, { dG: gRead, T: Tread }).amounts.NO2;
  text(ctx, `${r.eq}`, w * 0.5, h * 0.1, { size: fs(h), color: C.dust });
  text(ctx, `${Tread.toFixed(0)} K`, w * 0.28, h * 0.8, { size: fs(h) * 1.15, color: C.dust, weight: 700 });
  text(ctx, `ΔG° ${sgn(gRead)} kJ/mol`, w * 0.5, h * 0.8, { size: fs(h) * 1.15, color: C.amber, weight: 700 });
  text(ctx, `NO₂ held ${prod.toPrecision(2)} bar`, w * 0.75, h * 0.8, { size: fs(h) * 1.15, color: P_INK, weight: 700 });
}

/** Beat four: the +13.8 bar slides along the −30.5 bar; the length that is left is measured. */
function couple(ctx, w, h, p) {
  const a = COUPLE.atp.dG; const b = COUPLE.g6p.dG;
  const cx = w * 0.62; const scale = (w * 0.5) / 35; // pixels per kJ/mol
  const yA = h * 0.3; const yB = h * 0.5; const yN = h * 0.7; const bh = h * 0.08;
  ctx.strokeStyle = C.dim; ctx.beginPath(); ctx.moveTo(cx, h * 0.2); ctx.lineTo(cx, h * 0.78); ctx.stroke();
  // ATP hydrolysis, left of the zero line.
  ctx.fillStyle = C.green; ctx.fillRect(cx + a * scale, yA, -a * scale, bh);
  text(ctx, `ATP hydrolysis ${sgn(a)} kJ/mol`, cx + (a * scale) / 2, yA - bh * 0.9, { size: fs(h), color: C.dust });
  // Glucose + Pi starts right of zero and slides left until it lies on the end of the long bar.
  const slide = ease(win(p, 0.15, 0.7));
  const x0 = cx - slide * b * scale;
  ctx.fillStyle = C.amber; ctx.fillRect(x0, yB, b * scale, bh);
  text(ctx, `glucose + Pi ${sgn(b)} kJ/mol`, x0 + (b * scale) / 2, yB + bh * 1.9, { size: fs(h), color: C.dust });
  if (slide > 0.01) {
    // What is left of the long bar once the short one lies on it, measured from the drawn rectangles.
    const covered = Math.max(0, cx - x0);
    const nx0 = cx + a * scale; const nx1 = cx - covered;
    ctx.fillStyle = C.green; ctx.fillRect(nx0, yN, nx1 - nx0, bh);
    text(ctx, `together ${sgn(-(nx1 - nx0) / scale)} kJ/mol`, (nx0 + nx1) / 2, yN + bh * 1.9, { size: fs(h) * 1.1, color: C.amber, weight: 700 });
  }
}

function freeK(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.26) pans(ctx, w, h, ease(win(t, 0, 0.2)));
  else if (t < 0.52) curve(ctx, w, h, win(t, 0.26, 0.5));
  else if (t < 0.76) warm(ctx, w, h, win(t, 0.52, 0.74));
  else couple(ctx, w, h, win(t, 0.76, 0.96));
}

export const TEETER_Q8_SCENES = {
  'free-k': freeK
};
