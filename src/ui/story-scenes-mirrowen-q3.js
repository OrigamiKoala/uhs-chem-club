/**
 * story-scenes-mirrowen-q3.js — the story picture of Mirrowen's q3 bench (Liquids and Vapour): why a sealed flask stops rising, what
 * heat does to it, and where the outside pressure meets it.
 *
 * Same contract as `story-scenes-mirrowen.js`: pure functions of `t` on a 960-wide plate, SCOURED PLATE palette, every number read from
 * the data (`matterdata.js` Antoine rows) or counted from the drawn molecules. Each molecule has its own schedule of time in the liquid
 * and arcs through the vapor, so the molecules "in the vapor", those "left" and those "returned" are COUNTED from what is drawn.
 */

import { vaporPressure, boilingPoint } from '../learn/engine/matterdata.js';
import { vaporDots, plateau, MOUNTAIN_KPA } from '../learn/engine/matterdata-vapour.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
import { win, ease, lerp, hash, tri } from './story-sim.js';

const C = { ...KIT, cold: '#6f8fb0', warm: '#c0652b' };
const WATER = '#6f8fb0';

/* ---- the schedules: each molecule rests in the liquid, then makes an arc through the vapor, and again ---- */
const N = 40;
const TMAX = 14;
const CYCLES = 24;

/** Molecule `i`'s excursions: [{ t0, t1, x0, x1, hgt }] in simulation seconds; between them it rests in the liquid. */
const SCHEDULE = Array.from({ length: N }, (_, i) => {
  let t = hash(i, 5) * 2.5;
  const out = [];
  for (let k = 0; k < CYCLES; k++) {
    const t0 = t + 1.6 + 4.2 * hash(i, 10 + k);
    const dur = 0.7 + 1.1 * hash(i, 40 + k);
    out.push({ t0, t1: t0 + dur, x0: hash(i, 70 + k), x1: hash(i, 100 + k), hgt: 0.25 + 0.7 * hash(i, 130 + k) });
    t = t0 + dur;
  }
  return out;
});

/** How many molecules have left the liquid, how many have come back, and how many are in the vapor, at simulation time `tau`. */
function counts(tau) {
  let left = 0; let back = 0;
  for (const s of SCHEDULE) for (const e of s) { if (tau >= e.t0) left++; if (tau >= e.t1) back++; }
  return { left, back, vapor: left - back };
}

/** A molecule's place at `tau` in a flask whose liquid surface is at `surf` and whose vapor reaches `ceil`, over x from `xa` to `xb`. */
function placeIn(i, tau, xa, xb, surf, ceil, floor) {
  const s = SCHEDULE[i];
  for (const e of s) {
    if (tau >= e.t0 && tau < e.t1) {
      const p = (tau - e.t0) / (e.t1 - e.t0);
      return { x: lerp(lerp(xa, xb, e.x0), lerp(xa, xb, e.x1), p), y: surf - 4 * p * (1 - p) * e.hgt * (surf - ceil), flying: true };
    }
  }
  // At rest: a place in the liquid that wanders a little with the time.
  return { x: lerp(xa, xb, 0.06 + 0.88 * hash(i, 3)) + 5 * Math.sin(tau * 2 + i), y: lerp(surf + 16, floor - 12, hash(i, 4)) + 4 * Math.cos(tau * 1.7 + i), flying: false };
}

function flaskBox(ctx, x0, y0, x1, y1, surf, liquid = 'rgba(111,143,176,0.28)') {
  ctx.fillStyle = '#0e0d0b'; ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = liquid; ctx.fillRect(x0, surf, x1 - x0, y1 - surf);
  ctx.strokeStyle = C.steel; ctx.lineWidth = 3; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); ctx.lineWidth = 1;
  line(ctx, x0, surf, x1, surf, C.dust, 1);
}

/* ---- the scene ---- */
function boilFlask(ctx, w, h, t) {
  ground(ctx, w, h);

  /* beat 1: molecules leave and return; the count in the vapor rises and levels off */
  const a = 1 - ease(win(t, 0.31, 0.37));
  if (a > 0) {
    ctx.globalAlpha = a;
    const tau = ease(win(t, 0.02, 0.3)) * TMAX;
    const x0 = 70; const x1 = 420; const y0 = 110; const y1 = 450; const surf = 330;
    flaskBox(ctx, x0, y0, x1, y1, surf);
    for (let i = 0; i < N; i++) {
      const q = placeIn(i, tau, x0 + 12, x1 - 12, surf, y0 + 14, y1);
      disc(ctx, q.x, q.y, 7, q.flying ? C.pale : WATER, C.faint);
    }
    const c = counts(tau);
    text(ctx, 'sealed flask', (x0 + x1) / 2, 76, { size: 24, color: C.dust });
    text(ctx, `left the liquid  ${c.left}`, 540, 170, { size: 22, color: C.text, align: 'left' });
    text(ctx, `came back  ${c.back}`, 540, 206, { size: 22, color: C.text, align: 'left' });
    text(ctx, `in the vapor now  ${c.vapor}`, 540, 242, { size: 24, color: C.amber, align: 'left', weight: 700 });
    // The count in the vapor against time, drawn from the same schedules.
    const px = 540; const py = 290; const pw = 340; const ph = 150;
    line(ctx, px, py, px, py + ph, C.steel, 2); line(ctx, px, py + ph, px + pw, py + ph, C.steel, 2);
    text(ctx, 'molecules in the vapor', px, py - 14, { size: 18, color: C.dim, align: 'left' });
    text(ctx, 'time', px + pw, py + ph + 18, { size: 18, color: C.dim, align: 'right' });
    ctx.strokeStyle = C.amber; ctx.lineWidth = 3; ctx.beginPath();
    const steps = 70;
    for (let k = 0; k <= steps; k++) {
      const ts = (tau * k) / steps;
      const X = px + (ts / TMAX) * pw; const Y = py + ph - (counts(ts).vapor / 16) * ph;
      if (k) ctx.lineTo(X, Y); else ctx.moveTo(X, Y);
    }
    ctx.stroke(); ctx.lineWidth = 1;
    ctx.globalAlpha = 1;
  }

  /* beat 2: the same water, cool and warm */
  const b = ease(win(t, 0.33, 0.39)) * (1 - ease(win(t, 0.63, 0.69)));
  if (b > 0) {
    ctx.globalAlpha = b;
    const tau = t * 60;
    [[25, 150], [80, 560]].forEach(([T, x0]) => {
      const x1 = x0 + 250; const y0 = 120; const y1 = 400; const surf = 300;
      flaskBox(ctx, x0, y0, x1, y1, surf);
      const n = vaporDots('H2O', T);
      for (let i = 0; i < n; i++) {
        const x = lerp(x0 + 14, x1 - 14, tri(hash(i, 1) + (0.31 + 0.2 * hash(i, 2)) * tau * 0.05));
        const y = lerp(y0 + 14, surf - 12, tri(hash(i, 3) + (0.27 + 0.2 * hash(i, 4)) * tau * 0.05));
        disc(ctx, x, y, 7, C.pale, C.faint);
      }
      text(ctx, `${T} °C`, (x0 + x1) / 2, 76, { size: 26, color: C.text, weight: 700 });
      text(ctx, `${plateau('H2O', T).toFixed(1)} kPa`, (x0 + x1) / 2, 436, { size: 28, color: C.amber, weight: 700 });
    });
    text(ctx, 'water, sealed', w / 2, 500, { size: 20, color: C.dim });
    ctx.globalAlpha = 1;
  }

  /* beat 3: the curve of water's vapor pressure, and the outside pressure that meets it */
  const c3 = ease(win(t, 0.65, 0.71));
  if (c3 > 0) {
    ctx.globalAlpha = c3;
    const px = 150; const pw = 700; const py = 90; const ph = 340;
    const X = T => px + ((T - 20) / 80) * pw; const Y = P => py + ph - (Math.min(P, 110) / 110) * ph;
    line(ctx, px, py, px, py + ph, C.steel, 2); line(ctx, px, py + ph, px + pw, py + ph, C.steel, 2);
    for (const T of [20, 40, 60, 80, 100]) text(ctx, String(T), X(T), py + ph + 22, { size: 18, color: C.dust });
    for (const P of [0, 50, 100]) text(ctx, String(P), px - 14, Y(P), { size: 18, color: C.dust, align: 'right' });
    text(ctx, 'kPa', px, py - 16, { size: 18, color: C.dim, align: 'left' });
    text(ctx, '°C', px + pw, py + ph + 44, { size: 18, color: C.dim, align: 'right' });
    const grow = ease(win(t, 0.69, 0.78));
    ctx.strokeStyle = C.pale; ctx.lineWidth = 3; ctx.beginPath();
    for (let k = 0; k <= 80; k++) {
      const T = 20 + k; if (T > 20 + 80 * grow) break;
      if (k) ctx.lineTo(X(T), Y(vaporPressure('H2O', T))); else ctx.moveTo(X(T), Y(vaporPressure('H2O', T)));
    }
    ctx.stroke(); ctx.lineWidth = 1;
    // The outside pressure comes down from sea level to the mountain's; where it meets the curve the water boils.
    const sweep = ease(win(t, 0.76, 0.9));
    const outside = lerp(101.3, MOUNTAIN_KPA, sweep);
    const bp = boilingPoint('H2O', outside);
    line(ctx, px, Y(outside), px + pw, Y(outside), C.amber, 2, [8, 6]);
    line(ctx, X(bp), Y(outside), X(bp), py + ph, C.amber, 1, [4, 4]);
    disc(ctx, X(bp), Y(outside), 8, C.amber);
    text(ctx, `outside ${outside.toFixed(0)} kPa`, px + pw - 8, Y(outside) - 18, { size: 20, color: C.amber, align: 'right', weight: 700 });
    text(ctx, `boils at ${bp.toFixed(0)} °C`, Math.min(X(bp) + 14, px + pw - 150), Y(outside) + 36, { size: 22, color: C.text, align: 'left', weight: 700 });
    ctx.globalAlpha = 1;
  }
}

export const Q3_SCENES = {
  'boil-flask': boilFlask
};
