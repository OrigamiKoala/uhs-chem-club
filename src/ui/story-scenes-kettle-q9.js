/**
 * story-scenes-kettle-q9.js — the story painters of Kettle's q9 bench, spread into `KETTLE_SCENES` (`story-scenes-kettle.js`).
 * Follow `story-scenes-kettle.js`: 960 x 540 plate, a pure function of `t`, every number counted from what is drawn.
 *
 * `hsab-vat`: The separation of hard and soft metals in the foundry refining vat.
 * Hard calcium locks to hard fluoride into an ionic lattice; soft silver overlaps with soft sulfide into insoluble Ag2S.
 */

import { C, disc, line, legacyText as text, ground, win, ease, lerp } from './story-kit.js';

const INK = {
  Ca: '#c8c0a0',
  Ag: '#aeb4ba',
  F: '#8fc0b0',
  S: '#d6c24a'
};

function hsabVat(ctx, w, h, t) {
  ground(ctx, w, h);
  const u = h * 0.07;

  // Vat frame
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  const vx = w * 0.15, vy = h * 0.18, vw = w * 0.7, vh = h * 0.65;
  ctx.strokeRect(vx, vy, vw, vh);

  // Divider down center
  line(ctx, w * 0.5, vy, w * 0.5, vy + vh, C.dim, 1.5);

  // Labels
  ctx.fillStyle = C.dust;
  text(ctx, 'HARD PAIR: CaF₂ (IONIC)', w * 0.32, vy - u * 0.4, Math.max(12, h * 0.034), 'center');
  text(ctx, 'SOFT PAIR: Ag₂S (COVALENT)', w * 0.68, vy - u * 0.4, Math.max(12, h * 0.034), 'center');

  // Hard side (left): Ca2+ (compact) and F- (compact)
  // Beat 1 & 2: ions move towards each other and form ionic pairs
  const mHard = ease(win(t, 0.08, 0.45));
  const caPoints = [
    { x0: w * 0.22, y0: h * 0.32, x1: w * 0.3, y1: h * 0.46 },
    { x0: w * 0.36, y0: h * 0.36, x1: w * 0.38, y1: h * 0.58 }
  ];
  const fPoints = [
    { x0: w * 0.26, y0: h * 0.62, x1: w * 0.26, y1: h * 0.46 },
    { x0: w * 0.40, y0: h * 0.68, x1: w * 0.34, y1: h * 0.46 },
    { x0: w * 0.24, y0: h * 0.76, x1: w * 0.34, y1: h * 0.58 },
    { x0: w * 0.44, y0: h * 0.82, x1: w * 0.42, y1: h * 0.58 }
  ];

  for (const p of caPoints) {
    const x = lerp(p.x0, p.x1, mHard);
    const y = lerp(p.y0, p.y1, mHard);
    disc(ctx, x, y, u * 0.48, INK.Ca);
    text(ctx, 'Ca²⁺', x, y, Math.max(10, u * 0.26), 'center');
  }

  for (const p of fPoints) {
    const x = lerp(p.x0, p.x1, mHard);
    const y = lerp(p.y0, p.y1, mHard);
    disc(ctx, x, y, u * 0.38, INK.F);
    text(ctx, 'F⁻', x, y, Math.max(10, u * 0.26), 'center');
  }

  // Soft side (right): Ag+ (diffuse) and S2- (diffuse)
  // Beat 3 & 4: squishy clouds deform and overlap
  const mSoft = ease(win(t, 0.48, 0.88));
  const agPoints = [
    { x0: w * 0.60, y0: h * 0.34, x1: w * 0.66, y1: h * 0.50 },
    { x0: w * 0.76, y0: h * 0.38, x1: w * 0.74, y1: h * 0.50 }
  ];
  const sPoint = { x0: w * 0.68, y0: h * 0.72, x1: w * 0.70, y1: h * 0.50 };

  // Deformed overlapping clouds
  const sx = lerp(sPoint.x0, sPoint.x1, mSoft);
  const sy = lerp(sPoint.y0, sPoint.y1, mSoft);

  ctx.save();
  ctx.beginPath();
  ctx.ellipse(sx, sy, u * (0.65 + mSoft * 0.15), u * 0.55, 0, 0, Math.PI * 2);
  ctx.fillStyle = INK.S;
  ctx.globalAlpha = 0.65;
  ctx.fill();
  ctx.restore();
  text(ctx, 'S²⁻', sx, sy, Math.max(10, u * 0.28), 'center');

  for (const p of agPoints) {
    const x = lerp(p.x0, p.x1, mSoft);
    const y = lerp(p.y0, p.y1, mSoft);
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(x, y, u * (0.55 + mSoft * 0.12), u * 0.46, 0, 0, Math.PI * 2);
    ctx.fillStyle = INK.Ag;
    ctx.globalAlpha = 0.7;
    ctx.fill();
    ctx.restore();
    text(ctx, 'Ag⁺', x, y, Math.max(10, u * 0.28), 'center');
  }

  // Caption at bottom
  if (t > 0.85) {
    ctx.fillStyle = C.amber;
    text(ctx, 'Like pairs with like: hard locks hard, soft overlaps soft.', w * 0.5, vy + vh - u * 0.5, Math.max(12, h * 0.032), 'center');
  }
}

export const Q9_SCENES = {
  'hsab-vat': hsabVat
};
