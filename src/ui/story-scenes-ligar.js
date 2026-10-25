/**
 * story-scenes-ligar.js — the pictures behind Ligar's quest story animations (`story/quest-story.js`, keys `unit03/...`).
 *
 * Same contract as `story-scenes.js`: each painter draws one frame from a progress `t` in [0, 1] on a canvas of `w` x `h`, as a PURE function
 * of `t` (the same `t` is the same picture, so reduced motion and `3D Off` show the last frame and lose nothing), in the SCOURED PLATE
 * palette with no glow. Each draws from the numbers its bench measured: the melting points of stage 3 of `q2-lattice`, the H-Cl well of
 * `q3-distance`, the molecules of `q7-polarity`, the gases of `q9-orbitals`. The helpers are repeated here so the shared file stays untouched.
 *
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import { mulberry32 } from '../learn/engine/plates.js';
import { morse, PAIRS } from '../learn/engine/bonddata.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
const C = KIT;


const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);

const label = h => Math.max(11, h * 0.04);

/* ---- q1-joins: two pairs are pressed together; one holds, one comes apart ---- */
function bondPairs(ctx, w, h, t) {
  ground(ctx, w, h);
  const press = ease(win(t, 0.1, 0.5));
  const settle = ease(win(t, 0.5, 0.8));
  const r = h * 0.07;
  const y = h * 0.45;
  // The pair that holds: the atoms close until a rod stands between them, and both rims are full.
  const gap = w * (0.14 - 0.06 * press);
  const lx = w * 0.27;
  disc(ctx, lx - gap / 2, y, r, C.pale, C.steel);
  disc(ctx, lx + gap / 2, y, r, C.pale, C.steel);
  if (press > 0.6) line(ctx, lx - gap / 2, y, lx + gap / 2, y, C.amber, 4);
  // The pair that does not: it is pushed together and drifts back apart.
  const rx = w * 0.73;
  const g2 = w * (0.14 - 0.08 * press * (1 - settle));
  disc(ctx, rx - g2 / 2, y, r, C.iron, C.amber);
  disc(ctx, rx + g2 / 2, y, r, C.iron, C.amber);
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 2;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(rx + s * g2 / 2, y, r * 1.35, 0, Math.PI * 2); ctx.stroke(); }
  text(ctx, 'held', lx, h * 0.68, { size: label(h), color: C.amber });
  text(ctx, 'came apart', rx, h * 0.68, { size: label(h) });
  // The rubble round the tunnel mouth: loose grains, each held to its neighbours by bonds like these.
  const rand = mulberry32(0x31);
  const grains = Math.round(win(t, 0.6, 1) * 40);
  for (let i = 0; i < grains; i++) disc(ctx, w * (0.25 + rand() * 0.5), h * (0.8 + rand() * 0.05), 2.2, C.pale);
}

/* ---- q2-lattice: four blocks and the heat each took; only one stands past 900 degrees and passes no current ---- */
function linerHeat(ctx, w, h, t) {
  ground(ctx, w, h);
  const rise = ease(win(t, 0.1, 0.7));
  const top = 1710;
  const blocks = [['vent', 115], ['salt', 801], ['copper', 1085], ['network', 1710]];
  const x0 = w * 0.18;
  const bw = w * 0.1;
  const base = h * 0.82;
  const span = h * 0.6;
  blocks.forEach(([name, melt], i) => {
    const bh = (melt / top) * span * rise;
    const x = x0 + i * w * 0.2;
    ctx.fillStyle = name === 'network' ? C.iron : C.dim;
    ctx.fillRect(x, base - bh, bw, bh);
    ctx.strokeStyle = name === 'network' && rise >= 1 ? C.amber : C.steel;
    ctx.lineWidth = name === 'network' && rise >= 1 ? 2 : 1;
    ctx.strokeRect(x + 0.5, base - bh + 0.5, bw - 1, bh - 1);
    text(ctx, name, x + bw / 2, base + h * 0.04, { size: Math.max(10, h * 0.036) });
  });
  const lineY = base - (900 / top) * span;
  line(ctx, w * 0.12, lineY, w * 0.88, lineY, C.amber, 1.5, [6, 4]);
  text(ctx, '900 degrees', w * 0.9, lineY - h * 0.03, { size: Math.max(10, h * 0.036), color: C.amber, align: 'right' });
  if (t > 0.78) text(ctx, 'the liner', x0 + 3 * w * 0.2 + bw / 2, base - span - h * 0.04, { size: label(h), color: C.amber });
}

/* ---- q3-distance: the H-Cl well, and a breaker charge set deeper than it ---- */
function wellDepth(ctx, w, h, t) {
  ground(ctx, w, h);
  const P = PAIRS['H-Cl'];
  const x0 = w * 0.12;
  const x1 = w * 0.88;
  const zeroY = h * 0.3;
  const botY = h * 0.78;
  const drawn = ease(win(t, 0.05, 0.6));
  const X = r => x0 + (r / 330) * (x1 - x0);
  const Y = e => zeroY + (-e / P.de) * (botY - zeroY);
  line(ctx, x0, zeroY, x1, zeroY, C.dim, 1, [4, 4]);
  ctx.beginPath();
  let started = false;
  const last = 60 + drawn * 270;
  for (let r = 60; r <= last; r += 2) {
    const e = Math.min(morse('H-Cl', r), P.de * 0.35);
    const x = X(r);
    const y = Math.min(Y(e), botY);
    if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
  }
  ctx.strokeStyle = C.text;
  ctx.lineWidth = 2;
  ctx.stroke();
  const dep = ease(win(t, 0.6, 0.85));
  if (dep > 0) {
    line(ctx, X(P.r0), zeroY, X(P.r0), zeroY + (botY - zeroY) * dep, C.amber, 2);
    text(ctx, `${P.de} kJ/mol`, X(P.r0) + w * 0.03, (zeroY + botY) / 2, { size: label(h), color: C.amber, align: 'left' });
  }
  if (t > 0.86) {
    const cy = botY + h * 0.06;
    line(ctx, x0, cy, x1, cy, C.amber, 6);
    text(ctx, 'breaker charge', w / 2, cy + h * 0.045, { size: label(h), color: C.amber });
  }
}

/* ---- q7-polarity: water swings round to line up with the plates, carbon dioxide stays as it stood ---- */
function fieldSwing(ctx, w, h, t) {
  ground(ctx, w, h);
  const on = ease(win(t, 0.25, 0.7));
  const barW = w * 0.035;
  const y0 = h * 0.12;
  const y1 = h * 0.76;
  for (const [x, s] of [[w * 0.1, '+'], [w * 0.9 - barW, '−']]) {
    ctx.fillStyle = C.iron;
    ctx.fillRect(x, y0, barW, y1 - y0);
    ctx.strokeStyle = on > 0.5 ? C.amber : C.steel;
    ctx.strokeRect(x + 0.5, y0 + 0.5, barW - 1, y1 - y0 - 1);
    text(ctx, s, x + barW / 2, y0 + h * 0.05, { size: Math.max(14, h * 0.06), color: C.text, weight: 700 });
  }
  const r = h * 0.045;
  // Water: a V that turns until its two hydrogens (the plus end) face the minus bar, so its net pull lines up with the field.
  const cx = w * 0.32;
  const cy = h * 0.44;
  const a = (-0.9 + 0.9 * on) + Math.PI * 0.5;
  const arm = h * 0.15;
  const half = 52 * Math.PI / 360;
  const pts = [[a - half], [a + half]].map(([ang]) => [cx + Math.cos(ang) * arm, cy + Math.sin(ang) * arm]);
  pts.forEach(([x, y]) => { line(ctx, cx, cy, x, y, C.steel, 3); disc(ctx, x, y, r * 0.7, C.pale, C.steel); });
  disc(ctx, cx, cy, r, C.dim, C.steel);
  text(ctx, 'water', cx, h * 0.84 + h * 0.06, { size: label(h) });
  // Carbon dioxide: two equal pulls the other way round, and it does not move.
  const dx = w * 0.68;
  line(ctx, dx - arm, cy, dx + arm, cy, C.steel, 3);
  disc(ctx, dx - arm, cy, r * 0.8, C.dim, C.steel);
  disc(ctx, dx + arm, cy, r * 0.8, C.dim, C.steel);
  disc(ctx, dx, cy, r * 0.7, C.iron, C.steel);
  text(ctx, 'carbon dioxide', dx, h * 0.84 + h * 0.06, { size: label(h) });
  if (on > 0.9) text(ctx, 'swung round', cx, cy - h * 0.2, { size: label(h), color: C.amber });
  if (on > 0.9) text(ctx, 'stayed put', dx, cy - h * 0.2, { size: label(h) });
}

export const LIGAR_SCENES = {
  'bond-pairs': bondPairs,
  'liner-heat': linerHeat,
  'well-depth': wellDepth,
  'field-swing': fieldSwing,
};
