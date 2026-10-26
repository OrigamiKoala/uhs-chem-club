/**
 * story-scenes-lanternfall.js — the pictures behind Lanternfall's quest animations (`story/quest-story.js`, keys `unit02/...`).
 *
 * Same contract as `story-scenes.js`: each painter draws one frame from a progress `t` in [0, 1] on a canvas of `w` x `h`, as a pure
 * function of `t`, in the SCOURED PLATE palette (obsidian, titanium, one amber signal, no glow). Each is drawn from the numbers its bench
 * measured (`lightdata.js`, `orbitals.js`, `electrons.js`), never from a figure typed here. `story-scenes.js` spreads `LANTERNFALL_SCENES`
 * into `SCENES`.
 */

import { mulberry32 } from '../learn/engine/plates.js';
import { planTrace, wavelengthRgb, planPhotocell, planAbsorb, LINES } from '../learn/engine/lightdata.js';
import { sampleOrbital } from '../learn/engine/orbitals.js';
import { planPES, rackFor, groundConfig, LADDER, boxesOf, RADIUS as ATOM_RADIUS } from '../learn/engine/electrons.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
const C = KIT;


const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);
const css = rgb => (rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : C.pale);

const label = (ctx, w, h, str, color = C.dust) => text(ctx, str, w / 2, h * 0.93, { size: Math.max(11, h * 0.04), color });

/* ---- q1-wave: red and violet waves across one length, a crest marked on each, and a pulse crossing at one speed ---- */
function waveBeacon(ctx, w, h, t) {
  ground(ctx, w, h);
  const x0 = w * 0.1;
  const L = w * 0.8;
  const draw = win(t, 0.05, 0.6);
  [[700, 0.3], [400, 0.55]].forEach(([nm, yy]) => {
    const per = (nm / planTrace(nm).span) * L;
    ctx.beginPath();
    for (let i = 0; i <= 200; i++) {
      const x = (i / 200) * L * draw;
      const y = h * yy - Math.cos((2 * Math.PI * x) / per) * h * 0.07;
      if (i === 0) ctx.moveTo(x0 + x, y); else ctx.lineTo(x0 + x, y);
    }
    ctx.strokeStyle = css(wavelengthRgb(nm));
    ctx.lineWidth = 2;
    ctx.stroke();
    for (let k = 0; k * per <= L * draw; k++) disc(ctx, x0 + k * per, h * yy - h * 0.07, 3, C.amber);
  });
  // a pulse crosses the same gap in the same time, whatever the colour
  const p = ease(win(t, 0.55, 0.95));
  [h * 0.74, h * 0.8].forEach(y => { line(ctx, x0, y, x0 + L, y, C.dim, 1); disc(ctx, x0 + L * p, y, 5, C.pale); });
  text(ctx, 'red', x0 - 6, h * 0.3, { size: Math.max(10, h * 0.036), align: 'right' });
  text(ctx, 'violet', x0 - 6, h * 0.55, { size: Math.max(10, h * 0.036), align: 'right' });
  if (p >= 1) text(ctx, 'same time', w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q2-photon: packets arrive at a plate; red ones are too weak for any, violet ones free an electron each ---- */
function photonPlate(ctx, w, h, t) {
  ground(ctx, w, h);
  const px = w * 0.62;
  line(ctx, px, h * 0.12, px, h * 0.8, C.steel, 6);
  const run = win(t, 0.05, 0.9);
  [[650, 0.28], [400, 0.62]].forEach(([nm, yy], row) => {
    const plan = planPhotocell('Na', nm, 3);
    const colour = css(wavelengthRgb(nm));
    for (let i = 0; i < 5; i++) {
      const at = clamp01(run * 1.6 - i * 0.13);
      const x = w * 0.08 + (px - w * 0.1 - w * 0.08) * at;
      const r = 6 + 0.9 * (planTrace(nm).e14);
      disc(ctx, x, h * (yy - 0.06 + i * 0.03), r * 0.7, colour);
      if (plan.freed && at >= 1) disc(ctx, px + 14 + (run - 0.5) * w * 0.25, h * (yy - 0.06 + i * 0.03), 3, C.text);
    }
    text(ctx, plan.freed ? 'electrons leave' : 'none leave', w * 0.82, h * yy, { size: Math.max(11, h * 0.04), color: plan.freed ? C.amber : C.dim });
    void row;
  });
  label(ctx, w, h, 'red at any strength, violet at a whisper');
}

/* ---- q3-lines: a sealed tube's lines on a dark band, a reference strip sliding alongside until they sit together ---- */
function lineGas(ctx, w, h, t) {
  ground(ctx, w, h);
  const lo = 380;
  const hi = 750;
  const bx = w * 0.1;
  const bw = w * 0.8;
  const xOf = nm => bx + ((nm - lo) / (hi - lo)) * bw;
  ctx.fillStyle = '#16140f';
  ctx.fillRect(bx, h * 0.25, bw, h * 0.2);
  const on = ease(win(t, 0.05, 0.4));
  for (const nm of LINES.He) { ctx.globalAlpha = on; line(ctx, xOf(nm), h * 0.25, xOf(nm), h * 0.45, css(wavelengthRgb(nm)), 3); ctx.globalAlpha = 1; }
  const slide = 1 - ease(win(t, 0.4, 0.8));
  for (const [gas, y] of [['He', 0.6], ['H', 0.72]]) {
    const dx = gas === 'He' ? slide * w * 0.18 : 0;
    ctx.fillStyle = C.iron;
    ctx.fillRect(bx, h * (y - 0.04), bw, h * 0.08);
    for (const nm of LINES[gas]) line(ctx, xOf(nm) + dx, h * (y - 0.04), xOf(nm) + dx, h * (y + 0.04), C.pale, 2);
    text(ctx, gas === 'He' ? 'helium' : 'hydrogen', bx - 8, h * y, { size: Math.max(10, h * 0.036), align: 'right' });
  }
  if (slide <= 0.02) text(ctx, 'every line lands', w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q4-cloud: shots land one by one, and five hundred of them make a ball, with no ring through it ---- */
function cloudBall(ctx, w, h, t) {
  ground(ctx, w, h);
  const pts = sampleOrbital('1s', 500, 1);
  const n = Math.round(ease(win(t, 0.05, 0.8)) * pts.length);
  const cx = w / 2;
  const cy = h * 0.46;
  const k = Math.min(w, h) * 0.075;
  for (let i = 0; i < n; i++) disc(ctx, cx + pts[i].x * k, cy - pts[i].y * k, 1.8, C.amber);
  if (t > 0.8) { ctx.setLineDash?.([6, 6]); ctx.beginPath(); ctx.arc(cx, cy, k * 3.2, 0, Math.PI * 2); ctx.strokeStyle = C.dim; ctx.lineWidth = 1; ctx.stroke(); ctx.setLineDash?.([]); }
  text(ctx, `${n} shots`, w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: n >= 500 ? C.amber : C.dust });
}

/* ---- q5-numbers: boxes of a rack, a pair of arrows in each, and a third refused ---- */
function rackAddress(ctx, w, h, t) {
  ground(ctx, w, h);
  const rows = [['1s', 1], ['2s', 1], ['2p', 3]];
  const fill = rackFor(8);
  const on = win(t, 0.05, 0.8);
  rows.forEach(([id, count], r) => {
    const y = h * (0.7 - r * 0.18);
    for (let b = 0; b < count; b++) {
      const cx = w / 2 + (b - (count - 1) / 2) * w * 0.12;
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 2;
      ctx.strokeRect(cx - w * 0.04, y - h * 0.06, w * 0.08, h * 0.12);
      const here = fill[`${id}:${b}`] || '';
      const shown = on > (r * 3 + b + 1) / 9;
      if (shown && here.includes('u')) { line(ctx, cx - w * 0.012, y + h * 0.04, cx - w * 0.012, y - h * 0.04, C.amber, 3); disc(ctx, cx - w * 0.012, y - h * 0.045, 4, C.amber); }
      if (shown && here.includes('d')) { line(ctx, cx + w * 0.012, y - h * 0.04, cx + w * 0.012, y + h * 0.04, C.pale, 3); disc(ctx, cx + w * 0.012, y + h * 0.045, 4, C.pale); }
    }
    text(ctx, id, w * 0.22, y, { size: Math.max(11, h * 0.04) });
  });
  if (t > 0.85) text(ctx, 'two to a box, no more', w / 2, h * 0.93, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q6-filling: the ladder fills from the bottom, and potassium's last electron goes under the 3d row ---- */
function rackFill(ctx, w, h, t) {
  ground(ctx, w, h);
  const rows = ['1s', '2s', '2p', '3s', '3p', '4s', '3d'];
  const counts = groundConfig(19);
  const n = Math.round(ease(win(t, 0.05, 0.85)) * 19);
  let left = n;
  rows.forEach((id, i) => {
    const y = h * (0.82 - i * 0.1);
    const cap = boxesOf(LADDER.find(r => r.id === id).l) * 2;
    const have = Math.min(cap, left, counts[id] || 0);
    if (id !== '3d') left -= have;
    line(ctx, w * 0.3, y, w * 0.7, y, C.steel, 2);
    for (let e = 0; e < have; e++) disc(ctx, w * 0.32 + e * w * 0.04, y - 8, 5, C.amber);
    text(ctx, id, w * 0.24, y, { size: Math.max(11, h * 0.04) });
  });
  if (t > 0.85) text(ctx, '4s fills before 3d', w / 2, h * 0.93, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q7-pes: oxygen's three peaks rise out of the strip, 2 and 2 and 4 ---- */
function peakRows(ctx, w, h, t) {
  ground(ctx, w, h);
  const peaks = planPES('O');
  const lo = Math.log10(0.3);
  const hi = Math.log10(260);
  const x0 = w * 0.1;
  const bw = w * 0.8;
  line(ctx, x0, h * 0.8, x0 + bw, h * 0.8, C.steel, 2);
  peaks.forEach((p, i) => {
    const x = x0 + ((hi - Math.log10(p.energy)) / (hi - lo)) * bw;
    const grow = ease(win(t, 0.1 + i * 0.22, 0.4 + i * 0.22));
    for (let e = 0; e < p.height; e++) if (e < p.height * grow) disc(ctx, x, h * 0.76 - e * h * 0.07, 7, C.amber);
    text(ctx, `${p.height}`, x, h * 0.86, { size: Math.max(11, h * 0.045), color: C.text, weight: 700 });
  });
  if (t > 0.9) text(ctx, 'two, two and four: oxygen', w / 2, h * 0.94, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q8-trends: lithium, beryllium, boron and carbon as spheres to scale, shrinking along the row ---- */
function radiiRow(ctx, w, h, t) {
  ground(ctx, w, h);
  const items = ['Li', 'Be', 'B', 'C'];
  const k = (h * 0.26) / ATOM_RADIUS.Li;
  items.forEach((s, i) => {
    const grow = ease(win(t, 0.05 + i * 0.12, 0.4 + i * 0.12));
    const r = ATOM_RADIUS[s] * k * grow;
    const x = w * (0.2 + i * 0.2);
    disc(ctx, x, h * 0.46, r, C.iron, C.steel);
    text(ctx, s, x, h * 0.46, { size: Math.max(11, h * 0.045), color: C.text, weight: 700 });
    text(ctx, `${ATOM_RADIUS[s]} pm`, x, h * 0.78, { size: Math.max(10, h * 0.036), color: C.dust });
  });
  if (t > 0.85) text(ctx, 'more protons, smaller atom', w / 2, h * 0.93, { size: Math.max(11, h * 0.04), color: C.amber });
}

export const LANTERNFALL_SCENES = {
  'wave-beacon': waveBeacon,
  'photon-plate': photonPlate,
  'line-gas': lineGas,
  'cloud-ball': cloudBall,
  'rack-address': rackAddress,
  'rack-fill': rackFill,
  'peak-rows': peakRows,
  'radii-row': radiiRow,
};
