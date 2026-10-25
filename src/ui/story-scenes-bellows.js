/**
 * story-scenes-bellows.js — the pictures behind Bellows' seven story animations.
 *
 * Same contract as `story-scenes.js`: each painter draws one frame of a scene from a progress `t` in [0, 1] on a canvas of `w` x `h`, a pure
 * function of `t`, so reduced motion and `3D Off` show the last frame and lose nothing. Painters draw in the SCOURED PLATE palette. Every
 * figure on a frame is the bench's own, read from `gasdata.js`, never a number made up for the picture.
 *
 * Kept in its own file so the world-by-world rollout does not collide in `story-scenes.js`, which spreads `BELLOWS_SCENES` into `SCENES`.
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import {
  GASES, pressureIdeal, planMixture, leftAfter, halfTime, pressureVdw, speeds
} from '../learn/engine/gasdata.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
const C = KIT;


const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);
/** A point bouncing between 0 and 1: the same `u` and `t` always give the same place. */
const bounce = (u, speed, t) => { const x = (u + speed * t) % 2; return x < 1 ? x : 2 - x; };
const hash = (i, k) => { let a = Math.imul((i + 1) * 7919 + (k + 1) * 104729, 0x45d9f3b); a = Math.imul(a ^ (a >>> 16), 0x45d9f3b); return ((a ^ (a >>> 16)) >>> 0) / 4294967296; };

const frame = (ctx, x, y, w, h, color = C.steel) => {
  ctx.fillStyle = '#100f0c';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
};

/** A dial: a ring, a needle at `frac` of its sweep, and a figure under it. */
function dial(ctx, cx, cy, r, frac, label, value, color = C.amber) {
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI * 0.8, Math.PI * 2.2);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.stroke();
  const a = Math.PI * 0.8 + Math.PI * 1.4 * clamp01(frac);
  line(ctx, cx, cy, cx + Math.cos(a) * r * 0.85, cy + Math.sin(a) * r * 0.85, color, 3);
  disc(ctx, cx, cy, r * 0.1, C.dust);
  text(ctx, label, cx, cy + r * 1.35, { size: Math.max(10, r * 0.34), color: C.dim });
  if (value != null) text(ctx, value, cx, cy + r * 1.8, { size: Math.max(11, r * 0.4), color: C.text, weight: 700 });
}

/** `n` particles bouncing about in a box. */
function crowd(ctx, x, y, w, h, n, speed, t, r, color = C.pale, seed = 1) {
  for (let i = 0; i < n; i++) {
    disc(ctx, x + r + bounce(hash(i, seed), speed * (0.6 + hash(i, seed + 1)), t) * (w - 2 * r), y + r + bounce(hash(i, seed + 2), speed * (0.6 + hash(i, seed + 3)), t) * (h - 2 * r), r, color);
  }
}

/* ---- q1-knocks: three gauges, one on each wall of a box, all reading the same ---- */
function gaugeWalls(ctx, w, h, t) {
  ground(ctx, w, h);
  const P = pressureIdeal(1, 300, 10);
  const bx = w * 0.34; const by = h * 0.3; const bw = w * 0.32; const bh = h * 0.4;
  frame(ctx, bx, by, bw, bh);
  crowd(ctx, bx, by, bw, bh, 12, 1.6, t * 3, Math.max(3, h * 0.014));
  const read = ease(win(t, 0.25, 0.7));
  const frac = 0.7 * read;
  const val = read > 0.95 ? `${Math.round(P)}` : null;
  dial(ctx, w * 0.5, h * 0.17, h * 0.07, frac, 'roof', val);
  dial(ctx, w * 0.8, h * 0.5, h * 0.07, frac, 'side wall', val);
  dial(ctx, w * 0.5, h * 0.8, h * 0.07, frac, 'floor', val);
  if (t > 0.8) text(ctx, 'all three alike', w * 0.17, h * 0.5, { size: Math.max(11, h * 0.042), color: C.amber });
}

/* ---- q2-laws: a sealed tank cooled by fifty degrees, its gauge falling in step with the kelvin temperature ---- */
function coldTank(ctx, w, h, t) {
  ground(ctx, w, h);
  const cool = ease(win(t, 0.1, 0.8));
  const tC = 20 - 50 * cool;
  const P = pressureIdeal(1, tC + 273.15, 10);
  const P0 = pressureIdeal(1, 293.15, 10);
  ctx.fillStyle = C.iron;
  ctx.fillRect(w * 0.3, h * 0.36, w * 0.32, h * 0.38);
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.3, h * 0.36, w * 0.32, h * 0.38);
  crowd(ctx, w * 0.3, h * 0.36, w * 0.32, h * 0.38, 12, 2.2 * (1 - 0.1 * cool), t * 3, Math.max(3, h * 0.014));
  dial(ctx, w * 0.46, h * 0.2, h * 0.08, (P / P0) * 0.72, 'gauge', `${Math.round(P)}`);
  // The thermometer: a column that shortens as the deck cools.
  const tx = w * 0.78;
  ctx.fillStyle = C.rim;
  ctx.fillRect(tx - 3, h * 0.2, 6, h * 0.55);
  ctx.fillStyle = C.amber;
  const colH = h * 0.55 * ((tC + 50) / 90);
  ctx.fillRect(tx - 3, h * 0.2 + h * 0.55 - colH, 6, colH);
  text(ctx, `${Math.round(tC)} °C`, tx, h * 0.82, { size: Math.max(12, h * 0.046), color: C.text, weight: 700 });
  if (t > 0.85) text(ctx, 'falls in step', w * 0.2, h * 0.5, { size: Math.max(11, h * 0.04), color: C.dust });
}

/* ---- q3-ideal: a mole of a light gas and a mole of a heavy one fill the same room ---- */
function equalRooms(ctx, w, h, t) {
  ground(ctx, w, h);
  const bw = w * 0.28; const bh = h * 0.4; const by = h * 0.28;
  const shown = Math.round(12 * ease(win(t, 0.1, 0.6)));
  [[w * 0.2, 'He', 'helium'], [w * 0.56, 'CO2', 'carbon dioxide']].forEach(([x, gas, name], k) => {
    frame(ctx, x, by, bw, bh);
    const r = Math.max(3, h * (gas === 'He' ? 0.014 : 0.024));
    const sp = (speeds(gas, 300).mean / speeds('CO2', 300).mean) * 0.7;
    for (let i = 0; i < shown; i++) {
      disc(ctx, x + r + bounce(hash(i, 5 + k), sp * (0.6 + hash(i, 6)), t * 2) * (bw - 2 * r), by + r + bounce(hash(i, 7 + k), sp * (0.6 + hash(i, 8)), t * 2) * (bh - 2 * r), r, gas === 'He' ? C.pale : C.steel);
    }
    text(ctx, name, x + bw / 2, by + bh + h * 0.07, { size: Math.max(11, h * 0.04), color: C.dust });
    text(ctx, `${Math.round(GASES[gas].M)} g`, x + bw / 2, by + bh + h * 0.13, { size: Math.max(11, h * 0.04), color: C.amber, weight: 700 });
  });
  text(ctx, `${shown} particles each`, w / 2, h * 0.14, { size: Math.max(12, h * 0.05), color: C.text });
  if (t > 0.8) text(ctx, 'the same room', w / 2, h * 0.2, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q4-mixtures: each gas's push stacked up to the gauge ---- */
function mixShare(ctx, w, h, t) {
  ground(ctx, w, h);
  const m = planMixture([{ gas: 'He', n: 1 }, { gas: 'Ne', n: 0.6 }], 300, 10);
  const x0 = w * 0.14; const full = w * 0.72; const y = h * 0.4; const bh = h * 0.16;
  let at = x0;
  m.rows.forEach((r, k) => {
    const grow = ease(win(t, 0.1 + k * 0.3, 0.4 + k * 0.3));
    const seg = (r.P / m.P) * full * grow;
    ctx.fillStyle = k ? C.steel : C.pale;
    ctx.fillRect(at, y, seg, bh);
    if (grow > 0.9) text(ctx, `${GASES[r.gas].name} ${Math.round(r.P)}`, at + seg / 2, y - h * 0.05, { size: Math.max(11, h * 0.04), color: C.dust });
    at += seg;
  });
  ctx.strokeStyle = C.rim;
  ctx.lineWidth = 2;
  ctx.strokeRect(x0, y, full, bh);
  if (t > 0.85) {
    text(ctx, `gauge ${Math.round(m.P)}`, w / 2, y + bh + h * 0.1, { size: Math.max(12, h * 0.05), color: C.amber, weight: 700 });
    text(ctx, 'each gas on its own, added up', w / 2, y + bh + h * 0.18, { size: Math.max(11, h * 0.038), color: C.dust });
  }
}

/* ---- q5-speed: chambers with a pinhole, the lightest gas emptying first ---- */
function leakRace(ctx, w, h, t) {
  ground(ctx, w, h);
  const gases = ['H2', 'He', 'N2', 'CO2'];
  const secs = ease(win(t, 0.1, 0.9)) * 4;
  gases.forEach((g, i) => {
    const x = w * (0.08 + i * 0.225);
    const cw = w * 0.17; const ch = h * 0.34; const cy = h * 0.3;
    frame(ctx, x, cy, cw, ch);
    ctx.fillStyle = C.bg;
    ctx.fillRect(x + cw - 2, cy + ch * 0.4, 4, ch * 0.2);
    const n = Math.round(24 * leftAfter(g, secs, 300));
    for (let k = 0; k < n; k++) disc(ctx, x + 4 + hash(k, i) * (cw - 8), cy + 4 + hash(k, i + 9) * (ch - 8), 2.2, C.pale);
    text(ctx, GASES[g].sym, x + cw / 2, cy + ch + h * 0.07, { size: Math.max(11, h * 0.042), color: C.dust });
    text(ctx, `${halfTime(g, 300).toFixed(1)} s`, x + cw / 2, cy + ch + h * 0.13, { size: Math.max(10, h * 0.036), color: i === 0 ? C.amber : C.dim });
  });
  if (t > 0.85) text(ctx, 'the lighter the gas, the sooner it is gone', w / 2, h * 0.16, { size: Math.max(11, h * 0.042), color: C.text });
}

/* ---- q6-real: a squeezed gas reads above the law, a cooled one below ---- */
function crowdAndPull(ctx, w, h, t) {
  ground(ctx, w, h);
  const sq = pressureVdw('He', 1, 300, 0.06);
  const co = pressureVdw('CO2', 1, 230, 0.5);
  const squeeze = ease(win(t, 0.1, 0.55));
  // Left: helium squeezed, its particles filling the room.
  const bw = w * (0.3 - 0.14 * squeeze);
  frame(ctx, w * 0.12, h * 0.3, bw, bw);
  crowd(ctx, w * 0.12, h * 0.3, bw, bw, 12, 1.5, t * 3, Math.max(3, bw * (0.07 + 0.08 * squeeze)));
  text(ctx, 'squeezed', w * 0.27, h * 0.78, { size: Math.max(11, h * 0.04), color: C.dust });
  if (t > 0.6) text(ctx, `${sq.P >= sq.ideal ? '+' : '−'}${Math.round(Math.abs(sq.P / sq.ideal - 1) * 100)} %`, w * 0.27, h * 0.86, { size: Math.max(12, h * 0.046), color: C.amber, weight: 700 });
  // Right: carbon dioxide cooled, its particles slowing and sticking together.
  const cool = ease(win(t, 0.35, 0.85));
  const rx = w * 0.58; const ry = h * 0.3; const rw = w * 0.3;
  frame(ctx, rx, ry, rw, rw);
  for (let i = 0; i < 12; i++) {
    const free = bounce(hash(i, 3), 1.2, t * 3) * (rw - 14);
    const stuckX = rw * (0.35 + 0.3 * hash(i, 4)); const stuckY = rw * (0.7 + 0.2 * hash(i, 5));
    const px = 7 + free * (1 - cool) + stuckX * cool;
    const py = 7 + bounce(hash(i, 6), 1.1, t * 3) * (rw - 14) * (1 - cool) + stuckY * cool;
    disc(ctx, rx + Math.min(rw - 5, px), ry + Math.min(rw - 5, py), Math.max(3, h * 0.016), C.steel);
  }
  text(ctx, 'cooled', rx + rw / 2, h * 0.78, { size: Math.max(11, h * 0.04), color: C.dust });
  if (t > 0.9) text(ctx, `${co.P >= co.ideal ? '+' : '−'}${Math.round(Math.abs(co.P / co.ideal - 1) * 100)} %`, rx + rw / 2, h * 0.86, { size: Math.max(12, h * 0.046), color: C.amber, weight: 700 });
}

export const BELLOWS_SCENES = {
  'gauge-walls': gaugeWalls,
  'cold-tank': coldTank,
  'equal-rooms': equalRooms,
  'mix-share': mixShare,
  'leak-race': leakRace,
  'crowd-and-pull': crowdAndPull,
};
