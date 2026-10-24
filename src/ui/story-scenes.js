/**
 * story-scenes.js — the pictures behind a quest's story animation.
 *
 * Each painter draws one frame of a scene from a progress `t` in [0, 1], on a canvas of `w` x `h`. A painter is a pure
 * function of `t`: the same `t` is the same picture, so a player who has asked for reduced motion, or whose device is
 * drawing without WebGL, is shown the last frame (`t = 1`) and loses nothing. Painters draw in the SCOURED PLATE palette: obsidian,
 * titanium, one amber signal, and no glow.
 *
 * Pure over a 2D context: importable in Node (`verify:story` draws every scene on a stub context).
 */

import { mulberry32 } from '../learn/engine/plates.js';
import { LANTERNFALL_SCENES } from './story-scenes-lanternfall.js';

const C = { bg: '#0d0c0a', rim: '#2e2a26', steel: '#6b625a', dust: '#b8afa0', dim: '#544e46', amber: '#d99423', text: '#dcd6cc', pale: '#cfc8b8', iron: '#3c3833' };

const clamp01 = v => Math.max(0, Math.min(1, v));
/** `t` inside the window [a, b], as 0..1. */
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);

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

/* ---- q1-grain: a dust of grains resolves into atoms, and some of them are joined ---- */
function grainResolve(ctx, w, h, t) {
  ground(ctx, w, h);
  const rand = mulberry32(0x6a1);
  const zoom = ease(win(t, 0.05, 0.6));
  const join = ease(win(t, 0.6, 0.9));
  const pts = Array.from({ length: 54 }, () => [rand(), rand() * 0.8 + 0.05, rand() < 0.35]);
  const r = (1.2 + zoom * 10) * Math.min(w, h) / 360;
  pts.forEach(([u, v, pale], i) => {
    const x = w * (0.5 + (u - 0.5) * (0.55 + zoom * 0.45));
    const y = h * (0.5 + (v - 0.45) * (0.55 + zoom * 0.45));
    disc(ctx, x, y, r, zoom < 0.15 ? C.dim : pale ? C.pale : C.iron, zoom < 0.15 ? null : C.steel);
    const [u2, v2] = pts[(i * 7 + 3) % pts.length];
    if (join > 0 && i % 4 === 0) {
      const x2 = w * (0.5 + (u2 - 0.5) * (0.55 + zoom * 0.45));
      const y2 = h * (0.5 + (v2 - 0.45) * (0.55 + zoom * 0.45));
      line(ctx, x, y, x + (x2 - x) * join * 0.06, y + (y2 - y) * join * 0.06, C.amber, 2);
    }
  });
  text(ctx, zoom < 0.15 ? 'powder' : 'atoms', w / 2, h * 0.93, { size: Math.max(11, h * 0.04), color: C.dust });
}

/* ---- q2-core: shots cross a foil that is nearly all empty; one comes straight back ---- */
function beamFoil(ctx, w, h, t) {
  ground(ctx, w, h);
  const fx = w * 0.55;
  const cy = h * 0.45;
  ctx.fillStyle = C.steel;
  ctx.fillRect(w * 0.08, cy - h * 0.05, w * 0.07, h * 0.1);
  for (let i = 0; i < 5; i++) for (let j = 0; j < 7; j++) disc(ctx, fx + (i - 2) * w * 0.012, h * (0.16 + j * 0.055), 2.2, C.amber);
  line(ctx, fx, h * 0.12, fx, h * 0.8, C.dim, 1, [4, 6]);
  const p = win(t, 0.05, 0.8);
  const shots = 13;
  for (let k = 0; k < shots; k++) {
    const y = h * (0.16 + (k / (shots - 1)) * 0.58);
    const back = k === 6;
    const x0 = w * 0.16;
    const travel = (p * 1.25 - (k % 5) * 0.03);
    const reach = clamp01(travel);
    if (back) {
      const hit = fx - 4;
      const x = x0 + (hit - x0) * Math.min(1, reach / 0.55);
      const rb = clamp01((reach - 0.55) / 0.45);
      line(ctx, x0, y, x, y, C.text, 2);
      if (rb > 0) line(ctx, x, y, x - rb * w * 0.3, y + rb * h * 0.24, C.text, 2);
    } else {
      const x = x0 + (w * 0.88 - x0) * reach;
      line(ctx, x0, y, x, y, C.dust, 1);
    }
  }
  text(ctx, 'through', w * 0.78, h * 0.1, { size: Math.max(11, h * 0.038), color: C.dust });
  if (p > 0.7) text(ctx, 'one comes back', w * 0.3, h * 0.78, { size: Math.max(11, h * 0.038), color: C.amber });
}

/* ---- q3-catalogue: cards fall into rows of a chart, and one place stays empty ---- */
function chartFill(ctx, w, h, t) {
  ground(ctx, w, h);
  const cols = 8;
  const rows = 3;
  const cw = w * 0.085;
  const ch = h * 0.17;
  const x0 = w * 0.5 - (cols * cw * 1.25) / 2;
  const y0 = h * 0.14;
  const gap = { r: 2, c: 4 };
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const when = 0.08 + (idx / (rows * cols)) * 0.62;
      const lay = ease(win(t, when, when + 0.1));
      const x = x0 + c * cw * 1.25;
      const y = y0 + r * ch * 1.35;
      const isGap = r === gap.r && c === gap.c;
      if (isGap) {
        ctx.strokeStyle = win(t, 0.78, 1) > 0 ? C.amber : C.dim;
        ctx.lineWidth = 2;
        ctx.setLineDash?.([5, 5]);
        ctx.strokeRect(x, y, cw, ch);
        ctx.setLineDash?.([]);
        continue;
      }
      ctx.globalAlpha = lay;
      ctx.fillStyle = C.iron;
      ctx.fillRect(x, y - (1 - lay) * h * 0.1, cw, ch);
      ctx.strokeStyle = C.steel;
      ctx.lineWidth = 1;
      ctx.strokeRect(x + 0.5, y - (1 - lay) * h * 0.1 + 0.5, cw - 1, ch - 1);
      ctx.globalAlpha = 1;
    }
  }
  if (t > 0.78) text(ctx, 'no place for this entry', w / 2, h * 0.9, { size: Math.max(11, h * 0.04), color: C.amber });
}

/* ---- q4-ledger: an atom's three numbers appear, and a hand-written ledger line is struck through ---- */
function threeNumbers(ctx, w, h, t) {
  ground(ctx, w, h);
  const cx = w * 0.3;
  const cy = h * 0.45;
  const rand = mulberry32(0x4e);
  for (let i = 0; i < 7; i++) disc(ctx, cx + (rand() - 0.5) * w * 0.05, cy + (rand() - 0.5) * w * 0.05, w * 0.012, i % 2 ? C.pale : C.amber);
  [0.12, 0.2].forEach((rr, k) => {
    ctx.beginPath();
    ctx.arc(cx, cy, w * rr, 0, Math.PI * 2);
    ctx.strokeStyle = C.dim;
    ctx.lineWidth = 1;
    ctx.stroke();
    for (let e = 0; e < (k ? 1 : 2); e++) {
      const a = t * 4 + e * Math.PI + k;
      disc(ctx, cx + Math.cos(a) * w * rr, cy + Math.sin(a) * w * rr, 3, C.text);
    }
  });
  const rows = [['protons', 3], ['neutrons', 4], ['charge', 0]];
  rows.forEach(([name, n], i) => {
    const on = ease(win(t, 0.12 + i * 0.16, 0.26 + i * 0.16));
    ctx.globalAlpha = on;
    text(ctx, name, w * 0.58, h * (0.28 + i * 0.12), { size: Math.max(11, h * 0.042), color: C.dust, align: 'left' });
    text(ctx, String(n), w * 0.86, h * (0.28 + i * 0.12), { size: Math.max(12, h * 0.05), color: C.text, align: 'right', weight: 700 });
    ctx.globalAlpha = 1;
  });
  const strike = win(t, 0.7, 0.95);
  text(ctx, 'ledger: charge +2', w * 0.58, h * 0.74, { size: Math.max(11, h * 0.04), color: C.dust, align: 'left' });
  line(ctx, w * 0.57, h * 0.74, w * 0.57 + strike * w * 0.34, h * 0.74, C.amber, 2);
}

/* ---- q5-assay: piles on a beam, and the fulcrum slides to where it lies level ---- */
function balanceBins(ctx, w, h, t) {
  ground(ctx, w, h);
  const left = w * 0.25;
  const right = w * 0.75;
  const beamY = h * 0.6;
  const pivot = left + (right - left) * (0.82 - 0.57 * ease(win(t, 0.15, 0.75)));
  const level = win(t, 0.15, 0.75) >= 1;
  const tilt = (level ? 0 : (1 - ease(win(t, 0.15, 0.75))) * 0.12);
  ctx.save();
  ctx.translate(w / 2, beamY);
  ctx.rotate(-tilt);
  line(ctx, -w * 0.4, 0, w * 0.4, 0, C.dust, 4);
  ctx.restore();
  ctx.beginPath();
  ctx.moveTo(pivot, beamY + 3);
  ctx.lineTo(pivot - w * 0.03, beamY + h * 0.14);
  ctx.lineTo(pivot + w * 0.03, beamY + h * 0.14);
  ctx.closePath();
  ctx.fillStyle = C.steel;
  ctx.fill();
  [[left, 22, C.pale], [right, 9, C.iron]].forEach(([x, n, col]) => {
    for (let i = 0; i < n; i++) disc(ctx, x + ((i % 5) - 2) * w * 0.016, beamY - h * 0.045 - Math.floor(i / 5) * h * 0.05, w * 0.007, col, C.steel);
  });
  text(ctx, level ? 'level' : 'dips', pivot, beamY + h * 0.22, { size: Math.max(11, h * 0.04), color: level ? C.amber : C.dust });
}

/* ---- q6-weigh: a crate on one pan, atoms poured onto the other until the pans balance ---- */
function scaleCount(ctx, w, h, t) {
  ground(ctx, w, h);
  const poured = ease(win(t, 0.1, 0.7));
  const beamY = h * 0.38;
  const tilt = (1 - poured) * 0.1;
  ctx.save();
  ctx.translate(w / 2, beamY);
  ctx.rotate(-tilt);
  line(ctx, -w * 0.34, 0, w * 0.34, 0, C.dust, 4);
  ctx.restore();
  line(ctx, w / 2, beamY, w / 2, h * 0.86, C.steel, 5);
  ctx.fillStyle = C.iron;
  ctx.fillRect(w * 0.2, beamY + h * 0.12, w * 0.14, h * 0.14);
  ctx.strokeStyle = C.steel;
  ctx.strokeRect(w * 0.2, beamY + h * 0.12, w * 0.14, h * 0.14);
  const n = Math.round(poured * 36);
  for (let i = 0; i < n; i++) disc(ctx, w * 0.62 + (i % 9) * w * 0.012, beamY + h * 0.24 - Math.floor(i / 9) * h * 0.03, w * 0.005, C.pale);
  text(ctx, 'crate', w * 0.27, beamY + h * 0.31, { size: Math.max(11, h * 0.04), color: C.dust });
  text(ctx, `${n}`, w * 0.67, beamY + h * 0.31, { size: Math.max(12, h * 0.05), color: poured >= 1 ? C.amber : C.text, weight: 700 });
  if (t > 0.8) text(ctx, 'counted without counting', w / 2, h * 0.93, { size: Math.max(11, h * 0.038), color: C.dust });
}

/* ---- boss-hopper: a hulking machine comes apart into cold salt, and an ingot is left in the chute ---- */
function hopperFall(ctx, w, h, t) {
  ground(ctx, w, h);
  const rand = mulberry32(0x40);
  const fall = ease(win(t, 0.12, 0.7));
  const blocks = [[0.36, 0.14, 0.28, 0.1], [0.32, 0.24, 0.36, 0.16], [0.34, 0.4, 0.32, 0.12], [0.28, 0.52, 0.12, 0.22], [0.6, 0.52, 0.12, 0.22], [0.4, 0.52, 0.2, 0.1]];
  blocks.forEach(([bx, by, bw, bh]) => {
    const d = rand();
    const sink = fall * (h * 0.86 - (by + bh) * h);
    ctx.globalAlpha = 1 - fall * 0.55;
    ctx.fillStyle = C.iron;
    ctx.fillRect(bx * w + (d - 0.5) * fall * w * 0.1, by * h + sink, bw * w, bh * h);
    ctx.strokeStyle = C.steel;
    ctx.strokeRect(bx * w + (d - 0.5) * fall * w * 0.1 + 0.5, by * h + sink + 0.5, bw * w - 1, bh * h - 1);
    ctx.globalAlpha = 1;
  });
  const grains = Math.round(fall * 60);
  for (let i = 0; i < grains; i++) disc(ctx, w * (0.3 + rand() * 0.4), h * (0.8 + rand() * 0.05), 1.6, C.pale);
  const show = ease(win(t, 0.72, 0.95));
  ctx.globalAlpha = show;
  ctx.fillStyle = C.iron;
  ctx.fillRect(w * 0.45, h * 0.76, w * 0.1, h * 0.07);
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 2;
  ctx.strokeRect(w * 0.45, h * 0.76, w * 0.1, h * 0.07);
  text(ctx, 'bismuth', w / 2, h * 0.7, { size: Math.max(11, h * 0.04), color: C.amber });
  ctx.globalAlpha = 1;
}

export const SCENES = {
  'grain-resolve': grainResolve,
  'beam-foil': beamFoil,
  'chart-fill': chartFill,
  'three-numbers': threeNumbers,
  'balance-bins': balanceBins,
  'scale-count': scaleCount,
  'hopper-fall': hopperFall,
  ...LANTERNFALL_SCENES
};

/** Paint one frame of a scene. An unknown scene paints the bare plate. */
export function paintScene(id, ctx, w, h, t) {
  (SCENES[id] || ground)(ctx, w, h, clamp01(t));
}
