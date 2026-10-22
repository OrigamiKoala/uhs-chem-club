/**
 * table-surface.js — What a work surface looks like when it has been worked on.
 *
 * Pure 2D-canvas painting, no THREE, so the built table (which uses the result as the plate's
 * texture) and `verify:table` (which draws in Node) share it. Nothing here per-pixel: a worked
 * surface is a ground colour, a mottle, grain, scuffs, scratches, stains and edge wear, each a
 * handful of cheap strokes laid by a seeded random, so a table is the same table every time.
 *
 * WHY IT IS NOT FLAT BLACK. A tabletop that is one flat colour with outlines on it reads as a
 * diagram on a screen, not as a bench somebody has used; the player reads "a bunch of squares
 * with textures fitted on top". A real work mat is uneven: it has a tone, a grain, a sheen where
 * hands slide, scratches where tools were dragged and a pale ring where something wet stood.
 *
 * THE PALETTE is the surface's own and deliberately mid-dark: pieces are light (bone, sand,
 * enamel) and print dark on top, so they need a ground they stand OUT of. Amber is never used
 * here: it is a signal, and a surface is not one.
 */

import { mulberry32 } from './plates.js';

/** The tones of a mat: a base, the paint printed on it, and the dust that settles in it. */
export const MAT = Object.freeze({
  base: '#4a4842',
  mottleLight: '#57554d',
  mottleDark: '#3c3b36',
  scuff: '#6e6a5e',
  paint: '#e2dbc7',
  paintDim: '#a39d8b',
  shadow: 'rgba(14, 13, 11, 0.75)',
  edge: '#1f1e1b'
});

/**
 * A rounded rectangle as the current path. (`ctx.roundRect` is not in every browser or in the Node
 * shim, so the corners are drawn by hand.)
 */
export function roundRectPath(ctx, x, y, w, h, r) {
  const k = Math.max(0, Math.min(r, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + k, y);
  ctx.lineTo(x + w - k, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + k);
  ctx.lineTo(x + w, y + h - k);
  ctx.quadraticCurveTo(x + w, y + h, x + w - k, y + h);
  ctx.lineTo(x + k, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - k);
  ctx.lineTo(x, y + k);
  ctx.quadraticCurveTo(x, y, x + k, y);
  ctx.closePath();
}

/**
 * Paint a worn work mat over the whole canvas.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {number} seed
 */
export function paintMat(ctx, w, h, seed = 1) {
  const rnd = mulberry32(seed * 7919 + 17);
  ctx.save();
  ctx.fillStyle = MAT.base;
  ctx.fillRect(0, 0, w, h);

  // Mottle: broad soft patches of lighter and darker, where the mat took the light or the wet differently.
  for (let i = 0; i < 46; i++) {
    const r = (0.05 + rnd() * 0.16) * Math.min(w, h * 2);
    const x = rnd() * w;
    const y = rnd() * h;
    const light = rnd() > 0.45;
    const g = ctx.createRadialGradient?.(x, y, 0, x, y, r);
    if (g) {
      g.addColorStop(0, light ? 'rgba(120, 117, 104, 0.20)' : 'rgba(10, 10, 8, 0.2)');
      g.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }

  // Grain: short fine strokes along the way the mat was rolled, so the surface has a direction.
  ctx.lineWidth = 1;
  for (let i = 0; i < Math.round(w * h / 900); i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 6 + rnd() * 22;
    ctx.strokeStyle = rnd() > 0.5 ? 'rgba(120, 118, 106, 0.10)' : 'rgba(0, 0, 0, 0.14)';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + len, y + (rnd() - 0.5) * 1.5);
    ctx.stroke();
  }

  // Scuffs: pale, short, many, where things were dragged across it.
  for (let i = 0; i < 70; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 14 + rnd() * 70;
    const a = (rnd() - 0.5) * 0.7;
    ctx.strokeStyle = `rgba(150, 146, 130, ${0.06 + rnd() * 0.12})`;
    ctx.lineWidth = 0.6 + rnd() * 1.4;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  // Scratches: a few long, thin, bright, bent a little.
  for (let i = 0; i < 9; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const len = 60 + rnd() * 220;
    const a = (rnd() - 0.5) * 1.2;
    ctx.strokeStyle = `rgba(190, 184, 166, ${0.10 + rnd() * 0.16})`;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.5 + (rnd() - 0.5) * 14, x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }

  // Rings and stains: where something wet stood, pale rim and darker middle.
  for (let i = 0; i < 6; i++) {
    const x = rnd() * w;
    const y = rnd() * h;
    const r = 18 + rnd() * 44;
    ctx.strokeStyle = 'rgba(176, 170, 150, 0.08)';
    ctx.lineWidth = 2 + rnd() * 3;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(8, 8, 6, 0.06)';
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dust: fine specks, a few bright, most dark.
  for (let i = 0; i < Math.round(w * h / 1800); i++) {
    ctx.fillStyle = rnd() > 0.7 ? 'rgba(200, 194, 176, 0.22)' : 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 1.4, 1 + rnd() * 1.4);
  }

  // Edge wear: a darker, rubbed margin, so the mat reads as a thing with an edge and not as a texture on a plane.
  const edge = Math.min(w, h) * 0.05;
  const sides = [
    [0, 0, w, edge, 0, 0, 0, edge],
    [0, h - edge, w, edge, 0, h, 0, h - edge],
    [0, 0, edge, h, 0, 0, edge, 0],
    [w - edge, 0, edge, h, w, 0, w - edge, 0]
  ];
  for (const [x, y, bw, bh, x0, y0, x1, y1] of sides) {
    const g = ctx.createLinearGradient?.(x0, y0, x1, y1);
    if (!g) continue;
    g.addColorStop(0, 'rgba(8, 8, 6, 0.55)');
    g.addColorStop(1, 'rgba(8, 8, 6, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, bw, bh);
  }
  ctx.restore();
}

/**
 * Paint a line of text the way a stencil puts it on a mat: a dark under-print one pixel down and
 * right, then the paint. `maxW` shrinks the type to fit rather than cutting the word.
 */
export function paintStencil(ctx, text, x, y, { size = 12, align = 'left', base = 'alphabetic', color = MAT.paint, weight = 700, maxW = 0 } = {}) {
  let px = size;
  ctx.font = `${weight} ${px}px "Quantico", "JetBrains Mono", monospace`;
  if (maxW && ctx.measureText) {
    const w = ctx.measureText(text).width;
    if (w > maxW && w > 0) {
      px = Math.max(7, Math.floor(size * maxW / w));
      ctx.font = `${weight} ${px}px "Quantico", "JetBrains Mono", monospace`;
    }
  }
  ctx.textAlign = align;
  ctx.textBaseline = base;
  ctx.fillStyle = MAT.shadow;
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = color;
  ctx.fillText(text, x, y);
  return px;
}

/** Wear for a painted face: a few scratches and a dusting over what the kit drew, so no piece is factory-new. */
export function weatherFace(ctx, n, seed = 1, strength = 1) {
  const rnd = mulberry32(seed * 104729 + 3);
  ctx.save();
  for (let i = 0; i < 14 * strength; i++) {
    const x = rnd() * n;
    const y = rnd() * n;
    const len = n * (0.05 + rnd() * 0.22);
    const a = rnd() * Math.PI;
    ctx.strokeStyle = `rgba(215, 208, 190, ${0.05 + rnd() * 0.10})`;
    ctx.lineWidth = Math.max(1, n * 0.004);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.stroke();
  }
  for (let i = 0; i < 90 * strength; i++) {
    ctx.fillStyle = rnd() > 0.5 ? 'rgba(235, 228, 210, 0.07)' : 'rgba(0, 0, 0, 0.09)';
    const s = Math.max(1, n * (0.004 + rnd() * 0.008));
    ctx.fillRect(rnd() * n, rnd() * n, s, s);
  }
  ctx.restore();
}
