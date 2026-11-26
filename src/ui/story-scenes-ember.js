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
import { EMBER_MECHANISMS } from './story-scenes-ember-mech.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
const C = { ...KIT, cold: '#6f8fb0', warm: '#c0652b' };


const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);

function box(ctx, x, y, w, h, fill, stroke = C.steel, lw = 1) {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

const fs = h => Math.max(11, h * 0.04);

/* ---- q1-flow: the cold pack's bath fell, and the Fifth's manifold is furred with frost ---- */
// The bench's cold pack: 0.08 mol taking 26 kJ/mol out of 100 g of water.
const PACK_FALL = (0.08 * 26 * 1000) / (100 * SPECIFIC_HEAT_WATER);

function frostManifold(ctx, w, h, t) {
  ground(ctx, w, h);
  if (t < 0.34) {
    // Beat 1: Heat flows from a hotter block (80 °C) to a colder block (20 °C) until both reach thermal equilibrium (50 °C).
    const p = ease(win(t, 0.04, 0.28));
    const Th = 80 - 30 * p;
    const Tc = 20 + 30 * p;
    const bw = w * 0.24; const bh = h * 0.34; const by = h * 0.32;
    const gap = w * 0.06 * (1 - ease(win(t, 0.02, 0.12)));
    const xL = w * 0.5 - bw - gap / 2;
    const xR = w * 0.5 + gap / 2;
    box(ctx, xL, by, bw, bh, p < 0.9 ? '#4a2614' : '#352b1a', C.warm, 2);
    box(ctx, xR, by, bw, bh, p < 0.9 ? '#1a2d3d' : '#352b1a', C.cold, 2);
    text(ctx, `${Th.toFixed(0)} °C`, xL + bw / 2, by + bh / 2, { size: fs(h) * 1.4, color: C.text, weight: 700 });
    text(ctx, `${Tc.toFixed(0)} °C`, xR + bw / 2, by + bh / 2, { size: fs(h) * 1.4, color: C.text, weight: 700 });
    if (p > 0.1 && p < 0.95) {
      line(ctx, xL + bw - 12, by + bh * 0.25, xR + 18, by + bh * 0.25, C.amber, 3);
      text(ctx, 'heat flow →', w * 0.5, by - h * 0.06, { size: fs(h) * 1.1, color: C.amber, weight: 700 });
    } else if (p >= 0.95) {
      text(ctx, 'thermal equilibrium: 50 °C', w * 0.5, by - h * 0.06, { size: fs(h) * 1.1, color: C.amber, weight: 700 });
    }
    return;
  }
  if (t < 0.66) {
    // Beat 2: Endothermic cold pack in a water bath — heat flows from the water into the pack, cooling the thermometer.
    const fall = ease(win(t, 0.38, 0.60));
    const cx = w * 0.24; const cy = h * 0.22; const cw = w * 0.34; const ch = h * 0.52;
    box(ctx, cx, cy, cw, ch, '#142029', C.steel, 2);
    text(ctx, 'water bath (surroundings)', cx + cw / 2, cy + ch + h * 0.06, { size: fs(h), color: C.dust });
    const px = cx + cw * 0.25; const py = cy + ch * 0.28; const pw = cw * 0.5; const ph = ch * 0.42;
    box(ctx, px, py, pw, ph, '#1f2830', C.amber, 2);
    text(ctx, 'endothermic', px + pw / 2, py + ph / 2, { size: fs(h), color: C.amber, weight: 700 });
    // Thermometer cooling down
    const tx = w * 0.68; const ty = h * 0.22; const tw = w * 0.055; const th = h * 0.52;
    box(ctx, tx, ty, tw, th, '#100f0c', C.steel);
    const level = Math.max(0.08, (22 - fall * PACK_FALL) / 30);
    ctx.fillStyle = C.cold;
    ctx.fillRect(tx + 2, ty + th * (1 - level), tw - 4, th * level);
    text(ctx, `−${(fall * PACK_FALL).toFixed(1)} °C`, tx + tw + w * 0.06, ty + th * 0.4, { size: fs(h) * 1.3, color: C.cold, weight: 700, align: 'left' });
    return;
  }
  // Beat 3: The frosted pipe pulling heat away from the colony shelters.
  const frost = ease(win(t, 0.68, 0.94));
  box(ctx, w * 0.1, h * 0.34, w * 0.26, h * 0.32, '#3a2416', C.warm, 2);
  text(ctx, 'shelters', w * 0.23, h * 0.5, { size: fs(h) * 1.1, color: C.text, weight: 700 });
  const mx = w * 0.54; const my = h * 0.30; const mw = w * 0.30; const mh = h * 0.38;
  box(ctx, mx, my, mw, mh, '#161b22', C.cold, 2);
  text(ctx, 'frosted pipe', mx + mw / 2, my + mh / 2, { size: fs(h) * 1.1, color: C.cold, weight: 700 });
  line(ctx, w * 0.37, h * 0.5, mx - 8, h * 0.5, C.amber, 3);
  text(ctx, 'heat pulled out →', w * 0.45, h * 0.43, { size: fs(h), color: C.amber, weight: 700 });
  const rand = mulberry32(0x5f);
  const n = Math.round(60 * frost);
  for (let i = 0; i < n; i++) {
    const u = rand(); const len = 4 + rand() * 8;
    line(ctx, mx + u * mw, my, mx + u * mw + (rand() - 0.5) * len, my - len, C.pale, 1.4);
  }
}

/* ---- q5-hess: designing a multi-step heating route with the same total enthalpy ---- */
const STEPS = [-110.5, -283.0];
const ROUTE_TOTAL = hessStackEnthalpy(STEPS.map(dH => ({ dH })));

function twoRoutes(ctx, w, h, t) {
  ground(ctx, w, h);
  const x0 = w * 0.2; const y0 = h * 0.2; const x1 = w * 0.8; const y1 = h * 0.72;
  disc(ctx, x0, y0, 9, C.iron, C.steel);
  disc(ctx, x1, y1, 9, C.iron, C.steel);
  text(ctx, 'reactants: C + O₂', x0, y0 - h * 0.06, { size: fs(h), color: C.dust });
  text(ctx, 'products: CO₂', x1, y1 + h * 0.06, { size: fs(h), color: C.dust });
  // Direct one-step route
  line(ctx, x0, y0, x1, y1, C.dim, 3, [10, 8]);
  text(ctx, 'direct route', x0 + (x1 - x0) * 0.44, y0 + (y1 - y0) * 0.28, { size: fs(h), color: C.dim });
  // Two-step heating route, drawn on as time runs
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
  text(ctx, 'two-step route (via CO)', w * 0.5, y0 + (y1 - y0) * 0.5 + h * 0.065, { size: fs(h), color: C.dust });
  const show = ease(win(t, 0.55, 0.85));
  ctx.globalAlpha = show;
  text(ctx, `${STEPS[0]} kJ`, x0 - w * 0.07, y0 + (y1 - y0) * 0.25, { size: fs(h), color: C.dust });
  text(ctx, `${STEPS[1]} kJ`, x1 + w * 0.07, y0 + (y1 - y0) * 0.75, { size: fs(h), color: C.dust });
  text(ctx, `${ROUTE_TOTAL.toFixed(1)} kJ either way`, w / 2, h * 0.94, { size: fs(h) * 1.2, color: C.amber, weight: 700 });
  ctx.globalAlpha = 1;
}

/* ---- q7-gibbs: the line for melting ice crosses zero, and a marker stands where it does ---- */
const ICE = { dH: 6.01, dS: 22.0 };
const T_ICE = crossingTemperature(ICE.dH, ICE.dS);

function sealCrossing(ctx, w, h, t) {
  ground(ctx, w, h);
  const px = w * 0.12; const pw = w * 0.76; const py = h * 0.15; const ph = h * 0.63;
  const Tmin = 200; const Tmax = 350;
  const gMin = gibbsFreeEnergy(ICE.dH, ICE.dS, Tmax); const gMax = gibbsFreeEnergy(ICE.dH, ICE.dS, Tmin);
  const X = T => px + ((T - Tmin) / (Tmax - Tmin)) * pw;
  const Y = g => py + ph * (1 - (g - gMin) / (gMax - gMin));
  box(ctx, px, py, pw, ph, '#100f0c', C.rim);
  line(ctx, px, Y(0), px + pw, Y(0), C.dim, 1, [6, 6]);
  text(ctx, 'free energy of melting ice (ΔG)', px, py - h * 0.045, { size: fs(h), color: C.dust, align: 'left' });
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

export const EMBER_SCENES = {
  'frost-manifold': frostManifold,
  'two-routes': twoRoutes,
  'seal-crossing': sealCrossing,
  // The mechanism pictures (heat swapping, bonds summed, a gas spreading) are in their own file.
  ...EMBER_MECHANISMS
};
