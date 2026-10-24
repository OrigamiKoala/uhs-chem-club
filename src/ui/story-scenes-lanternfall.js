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

const C = { bg: '#0d0c0a', rim: '#2e2a26', steel: '#6b625a', dust: '#b8afa0', dim: '#544e46', amber: '#d99423', text: '#dcd6cc', pale: '#cfc8b8', iron: '#3c3833' };

const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);
const css = rgb => (rgb ? `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` : C.pale);

function disc(ctx, x, y, r, fill, stroke = null) {
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.5, r), 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}

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
  line(ctx, 0, h * 0.86, w, h * 0.86, C.rim, 2);
}

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
    const dx = gas === 'He' ? slide * w * 0.18 : -w * 0.12;
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

/* ---- q9-absorb: a beam goes into the tank sample whole and comes out dimmer by what the reading says ---- */
function beamDim(ctx, w, h, t) {
  ground(ctx, w, h);
  const A = planAbsorb('cuso4', 630, 1, 0.005);
  const through = Math.pow(10, -A);
  const colour = css(wavelengthRgb(630));
  const cw = w * 0.2;
  const cx = w / 2;
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.strokeRect(cx - cw / 2, h * 0.28, cw, h * 0.34);
  const rand = mulberry32(0x9d);
  for (let i = 0; i < 40; i++) disc(ctx, cx - cw / 2 + 8 + rand() * (cw - 16), h * 0.3 + rand() * h * 0.3, 2, '#6f8f9d');
  const run = win(t, 0.05, 0.7);
  ctx.globalAlpha = 1;
  line(ctx, w * 0.06, h * 0.45, cx - cw / 2, h * 0.45, colour, 6 * Math.min(1, run * 2));
  ctx.globalAlpha = Math.max(0.15, through);
  line(ctx, cx + cw / 2, h * 0.45, cx + cw / 2 + w * 0.34 * clamp01(run * 1.5 - 0.3), h * 0.45, colour, 6);
  ctx.globalAlpha = 1;
  if (t > 0.75) text(ctx, 'sealed tank water: 5 mmol/L of copper', w / 2, h * 0.84, { size: Math.max(11, h * 0.042), color: C.amber });
}

/* ---- boss-eater: the Eater settles into cold ice and a ground lens is left, its focus beyond the violet end ---- */
function eaterLens(ctx, w, h, t) {
  ground(ctx, w, h);
  const fall = ease(win(t, 0.1, 0.65));
  ctx.fillStyle = C.iron;
  ctx.strokeStyle = C.steel;
  [[0.38, 0.12, 0.24, 0.12], [0.3, 0.26, 0.4, 0.18], [0.36, 0.46, 0.28, 0.12]].forEach(([bx, by, bw, bh]) => {
    const sink = fall * (h * 0.86 - (by + bh) * h);
    ctx.globalAlpha = 1 - fall * 0.5;
    ctx.fillRect(bx * w, by * h + sink, bw * w, bh * h);
    ctx.strokeRect(bx * w + 0.5, by * h + sink + 0.5, bw * w - 1, bh * h - 1);
    ctx.globalAlpha = 1;
  });
  const show = ease(win(t, 0.65, 0.95));
  ctx.globalAlpha = show;
  ctx.beginPath();
  ctx.ellipse(w / 2, h * 0.74, w * 0.07, h * 0.07, 0, 0, Math.PI * 2);
  ctx.fillStyle = C.pale;
  ctx.fill();
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 2;
  ctx.stroke();
  // the band the eye sees, and the light beyond its violet end that the lens is ground for
  const bx = w * 0.62;
  const bw = w * 0.3;
  for (let i = 0; i < 40; i++) ctx.fillStyle = css(wavelengthRgb(380 + (i / 40) * 370)), ctx.fillRect(bx + (i / 40) * bw, h * 0.7, bw / 40 + 1, h * 0.06);
  line(ctx, bx - 4, h * 0.67, bx - 4, h * 0.79, C.amber, 2, [4, 4]);
  text(ctx, 'ground for light shorter than violet', w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: C.amber });
  ctx.globalAlpha = 1;
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
  'beam-dim': beamDim,
  'eater-lens': eaterLens
};
