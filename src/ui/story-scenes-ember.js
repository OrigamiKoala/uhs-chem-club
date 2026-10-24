/**
 * story-scenes-ember.js — the pictures behind Ember Reach's story animations.
 *
 * Same rules as `story-scenes.js`, which spreads `EMBER_SCENES` into its `SCENES`: each painter draws one frame of a scene from a
 * progress `t` in [0, 1] on a canvas `w` x `h`, is a pure function of `t` (so reduced motion and `3D Off` show the last frame and lose
 * nothing), draws in the SCOURED PLATE palette (obsidian, titanium, one amber signal, no glow), and draws from the numbers the bench
 * measured: the cold pack's fall in the bath, the two routes' totals, the crossing of melting ice. It needs no WebGL.
 *
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import { SPECIFIC_HEAT_WATER, hessStackEnthalpy, crossingTemperature, gibbsFreeEnergy } from '../learn/engine/thermodata.js';
import { mulberry32 } from '../learn/engine/plates.js';

const C = { bg: '#0d0c0a', rim: '#2e2a26', steel: '#6b625a', dust: '#b8afa0', dim: '#544e46', amber: '#d99423', text: '#dcd6cc', pale: '#cfc8b8', iron: '#3c3833', cold: '#6f8fb0', warm: '#c0652b' };

const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);

function line(ctx, x0, y0, x1, y1, color, width = 1, dash = null) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.setLineDash?.(dash || []);
  ctx.stroke();
  ctx.setLineDash?.([]);
}

function disc(ctx, x, y, r, fill, stroke = null) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

function box(ctx, x, y, w, h, fill, stroke = C.steel, lw = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function text(ctx, str, x, y, { size = 12, color = C.dust, align = 'center', weight = 400 } = {}) {
  ctx.font = `${weight} ${size}px Quantico, "JetBrains Mono", monospace`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(str, x, y);
}

function ground(ctx, w, h) {
  ctx.fillStyle = C.bg;
  ctx.fillRect(0, 0, w, h);
  line(ctx, 0, h * 0.88, w, h * 0.88, C.rim, 2);
}

const fs = h => Math.max(11, h * 0.04);

/* ---- q1-flow: the cold pack's bath fell, and the Fifth's manifold is furred with frost ---- */
// The bench's cold pack: 0.08 mol taking 26 kJ/mol out of 100 g of water.
const PACK_FALL = (0.08 * 26 * 1000) / (100 * SPECIFIC_HEAT_WATER);

function frostManifold(ctx, w, h, t) {
  ground(ctx, w, h);
  // The caldera main, hot, running in from the left.
  box(ctx, 0, h * 0.4, w * 0.3, h * 0.08, C.iron, C.steel);
  box(ctx, 0, h * 0.4, w * 0.3, h * 0.012, C.warm, C.warm);
  text(ctx, 'caldera main', w * 0.15, h * 0.34, { size: fs(h), color: C.dim });
  // The manifold, in dark livery, and the frost that grows on it.
  const mx = w * 0.3; const my = h * 0.28; const mw = w * 0.26; const mh = h * 0.32;
  box(ctx, mx, my, mw, mh, '#16140f', C.dim, 2);
  const frost = ease(win(t, 0.15, 0.8));
  const rand = mulberry32(0x5f);
  const n = Math.round(90 * frost);
  for (let i = 0; i < n; i++) {
    const side = Math.floor(rand() * 4);
    const u = rand();
    const len = 4 + rand() * 10;
    const x = side < 2 ? mx + u * mw : (side === 2 ? mx : mx + mw);
    const y = side < 2 ? (side === 0 ? my : my + mh) : my + u * mh;
    const dx = side === 2 ? -len : side === 3 ? len : (rand() - 0.5) * len;
    const dy = side === 0 ? -len : side === 1 ? len : (rand() - 0.5) * len;
    line(ctx, x, y, x + dx, y + dy, C.pale, 1.4);
  }
  text(ctx, 'the Fifth\'s manifold', mx + mw / 2, my + mh + h * 0.06, { size: fs(h), color: C.dust });
  // The bench's reading: a bath that cools means heat went in. The column falls by what the cold pack measured.
  const bx = w * 0.7; const by = h * 0.18; const bw = w * 0.06; const bh = h * 0.5;
  box(ctx, bx, by, bw, bh, '#100f0c', C.steel);
  const fall = ease(win(t, 0.1, 0.7));
  const level = Math.max(0.05, (22 - fall * PACK_FALL) / 30);
  ctx.fillStyle = fall > 0.05 ? C.cold : C.amber;
  ctx.fillRect(bx + 2, by + bh * (1 - level), bw - 4, bh * level);
  text(ctx, 'cold pack bath', bx + bw / 2 + w * 0.08, by + bh + h * 0.06, { size: fs(h), color: C.dust });
  text(ctx, `−${PACK_FALL.toFixed(1)} °C`, bx + bw + w * 0.07, by + bh * 0.35, { size: fs(h) * 1.3, color: C.amber, weight: 700, align: 'left' });
  line(ctx, mx + mw, my + mh / 2, bx, by + bh * 0.5, C.dim, 1, [4, 6]);
}

/* ---- q5-hess: a sealed straight shaft and a stepped pipe, between the same two points, with the same total ---- */
const STEPS = [-110.5, -283.0];
const ROUTE_TOTAL = hessStackEnthalpy(STEPS.map(dH => ({ dH })));

function twoRoutes(ctx, w, h, t) {
  ground(ctx, w, h);
  const x0 = w * 0.2; const y0 = h * 0.2; const x1 = w * 0.8; const y1 = h * 0.72;
  disc(ctx, x0, y0, 9, C.iron, C.steel);
  disc(ctx, x1, y1, 9, C.iron, C.steel);
  text(ctx, 'start', x0, y0 - h * 0.06, { size: fs(h), color: C.dust });
  text(ctx, 'finish', x1, y1 + h * 0.06, { size: fs(h), color: C.dust });
  // The sealed shaft, straight, with a bar across it.
  line(ctx, x0, y0, x1, y1, C.dim, 3, [10, 8]);
  const mx = (x0 + x1) / 2; const my = (y0 + y1) / 2;
  line(ctx, mx - 12, my - 12, mx + 12, my + 12, C.dust, 3);
  line(ctx, mx - 12, my + 12, mx + 12, my - 12, C.dust, 3);
  text(ctx, 'sealed shaft', mx + w * 0.1, my - h * 0.07, { size: fs(h), color: C.dim });
  // The stepped pipe, drawn on as time runs, with the heat of each step.
  const pts = [[x0, y0], [x0, y0 + (y1 - y0) * 0.5], [x1, y0 + (y1 - y0) * 0.5], [x1, y1]];
  const p = ease(win(t, 0.1, 0.65));
  const total = pts.slice(1).reduce((a, q, i) => a + Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]), 0);
  let left = p * total;
  for (let i = 1; i < pts.length && left > 0; i++) {
    const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const f = Math.min(1, left / seg);
    line(ctx, pts[i - 1][0], pts[i - 1][1], pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * f, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * f, C.amber, 4);
    left -= seg;
  }
  text(ctx, 'stepped pipe', w * 0.5, y0 + (y1 - y0) * 0.5 - h * 0.06, { size: fs(h), color: C.dust });
  const show = ease(win(t, 0.55, 0.85));
  ctx.globalAlpha = show;
  text(ctx, `${STEPS[0]}`, x0 - w * 0.07, y0 + (y1 - y0) * 0.25, { size: fs(h), color: C.dust });
  text(ctx, `${STEPS[1]}`, x1 + w * 0.07, y0 + (y1 - y0) * 0.75, { size: fs(h), color: C.dust });
  text(ctx, `${ROUTE_TOTAL.toFixed(1)} kJ either way`, w / 2, h * 0.94, { size: fs(h) * 1.2, color: C.amber, weight: 700 });
  ctx.globalAlpha = 1;
}

/* ---- q7-gibbs: the line for melting ice crosses zero, and a marker stands where it does ---- */
const ICE = { dH: 6.01, dS: 22.0 };
const T_ICE = crossingTemperature(ICE.dH, ICE.dS);

function sealCrossing(ctx, w, h, t) {
  ground(ctx, w, h);
  const px = w * 0.12; const pw = w * 0.76; const py = h * 0.12; const ph = h * 0.66;
  const Tmin = 200; const Tmax = 350;
  const gMin = gibbsFreeEnergy(ICE.dH, ICE.dS, Tmax); const gMax = gibbsFreeEnergy(ICE.dH, ICE.dS, Tmin);
  const X = T => px + ((T - Tmin) / (Tmax - Tmin)) * pw;
  const Y = g => py + ph * (1 - (g - gMin) / (gMax - gMin));
  box(ctx, px, py, pw, ph, '#100f0c', C.rim);
  line(ctx, px, Y(0), px + pw, Y(0), C.dim, 1, [6, 6]);
  text(ctx, 'net balance of melting ice', px + 6, py + 14, { size: fs(h), color: C.dim, align: 'left' });
  text(ctx, 'below zero: melts', px + pw - 6, Y(0) + h * 0.07, { size: fs(h), color: C.dim, align: 'right' });
  const p = ease(win(t, 0.08, 0.7));
  const Tnow = Tmin + p * (Tmax - Tmin);
  ctx.beginPath();
  ctx.moveTo(X(Tmin), Y(gibbsFreeEnergy(ICE.dH, ICE.dS, Tmin)));
  ctx.lineTo(X(Tnow), Y(gibbsFreeEnergy(ICE.dH, ICE.dS, Tnow)));
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 3;
  ctx.stroke();
  if (Tnow >= T_ICE) {
    const a = ease(win(t, 0.5, 0.8));
    ctx.globalAlpha = a;
    line(ctx, X(T_ICE), py, X(T_ICE), py + ph, C.amber, 2);
    text(ctx, `${Math.round(T_ICE)} K`, X(T_ICE), py + ph + h * 0.06, { size: fs(h) * 1.2, color: C.amber, weight: 700 });
    ctx.globalAlpha = 1;
  }
  text(ctx, 'temperature', w / 2, h * 0.94, { size: fs(h), color: C.dust });
}

/* ---- boss-crucible: the casing splits along its seams, and a pipe runs down from the exchanger into the crust ---- */
function crucibleOpen(ctx, w, h, t) {
  ground(ctx, w, h);
  const open = ease(win(t, 0.12, 0.65));
  const cx = w / 2; const top = h * 0.14; const cH = h * 0.5; const cW = w * 0.2;
  // The exchanger plates between the halves.
  const plates = 7;
  for (let i = 0; i < plates; i++) {
    const x = cx - cW * 0.7 + (i / (plates - 1)) * cW * 1.4;
    line(ctx, x, top + cH * 0.12, x, top + cH * 0.88, C.steel, 3);
  }
  // The two halves of the casing, drawn apart.
  const gap = open * w * 0.16;
  box(ctx, cx - cW - gap, top, cW, cH, C.iron, C.steel, 2);
  box(ctx, cx + gap, top, cW, cH, C.iron, C.steel, 2);
  text(ctx, 'exchanger', cx, top - h * 0.04, { size: fs(h), color: C.dust });
  // The pipe from the exchanger down into the crust, drawn on as time runs.
  const draw = ease(win(t, 0.5, 0.9));
  const pipeTop = top + cH;
  line(ctx, cx, pipeTop, cx, pipeTop + (h * 0.88 - pipeTop) * draw, C.amber, 5);
  if (draw > 0.6) text(ctx, 'down into the crust', cx + w * 0.12, pipeTop + (h * 0.88 - pipeTop) * 0.6, { size: fs(h), color: C.dust, align: 'left' });
}

export const EMBER_SCENES = {
  'frost-manifold': frostManifold,
  'two-routes': twoRoutes,
  'seal-crossing': sealCrossing,
  'crucible-open': crucibleOpen
};
