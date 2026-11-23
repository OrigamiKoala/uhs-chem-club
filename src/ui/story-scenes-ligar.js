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

import { LIGAR_MECHANISMS } from './story-scenes-ligar-mech.js';
import { C as KIT, disc, line, legacyText as text, ground } from './story-kit.js';
const C = KIT;


const clamp01 = v => Math.max(0, Math.min(1, v));
const win = (t, a, b) => clamp01((t - a) / (b - a));
const ease = v => v * v * (3 - 2 * v);


/* ---- q2-lattice: four structures revealed one concept at a time with minimal text ---- */
function linerHeat(ctx, w, h, t, clock = 0) {
  ground(ctx, w, h);
  const margin = w * 0.045;
  const gap = w * 0.02;
  const colW = (w - margin * 2 - gap * 3) / 4;
  const colH = h * 0.62;
  const colY = h * 0.14;

  const active = t < 0.25 ? 0 : t < 0.5 ? 1 : t < 0.75 ? 2 : 3;
  const titles = ['Molecular', 'Ionic', 'Metallic', 'Network'];
  const melts = [115, 801, 1085, 1710];

  for (let i = 0; i <= active; i++) {
    const x0 = margin + i * (colW + gap);
    const xc = x0 + colW / 2;
    const isFocus = i === active;
    const isLiner = i === 3 && active === 3;
    const isMelted = (i === 0 && t > 0.12) || (i === 1 && t > 0.36);

    ctx.save();
    ctx.globalAlpha = isFocus ? 1 : 0.42;

    ctx.fillStyle = C.bg0;
    ctx.fillRect(x0, colY, colW, colH);
    ctx.strokeStyle = isFocus ? C.amber : C.steel;
    ctx.lineWidth = isFocus ? 2 : 1;
    ctx.strokeRect(x0 + 0.5, colY + 0.5, colW - 1, colH - 1);

    text(ctx, titles[i], xc, colY + h * 0.055, { size: Math.max(11, h * 0.038), weight: 700, color: isFocus ? C.amber : C.text });
    text(ctx, `${melts[i]} °C`, xc, colY + h * 0.105, { size: Math.max(10, h * 0.032), color: isMelted ? C.amber : C.dust });

    const circY = colY + h * 0.165;
    const conducts = (i === 2) || (i === 1 && isMelted);
    line(ctx, xc - colW * 0.32, circY, xc - 10, circY, C.dim, 1.5);
    line(ctx, xc + 10, circY, xc + colW * 0.32, circY, C.dim, 1.5);
    disc(ctx, xc, circY, Math.max(3.5, h * 0.016), conducts ? C.amber : C.iron, conducts ? C.amber : C.steel);

    const structY = colY + h * 0.36;
    const structH = h * 0.22;

    if (i === 0) {
      const sep = ease(win(t, 0.08, 0.22));
      const clusters = [
        [-colW * 0.22 - sep * 8, -structH * 0.22 - sep * 6],
        [colW * 0.22 + sep * 8, -structH * 0.22 - sep * 6],
        [-colW * 0.22 - sep * 8, structH * 0.22 + sep * 6],
        [colW * 0.22 + sep * 8, structH * 0.22 + sep * 6]
      ];
      if (sep < 0.9) {
        ctx.strokeStyle = C.faint;
        ctx.lineWidth = 1;
        ctx.setLineDash?.([2, 3]);
        ctx.beginPath();
        ctx.moveTo(xc + clusters[0][0], structY + clusters[0][1]);
        ctx.lineTo(xc + clusters[1][0], structY + clusters[1][1]);
        ctx.moveTo(xc + clusters[2][0], structY + clusters[2][1]);
        ctx.lineTo(xc + clusters[3][0], structY + clusters[3][1]);
        ctx.stroke();
        ctx.setLineDash?.([]);
      }
      for (const [ox, oy] of clusters) {
        const cx0 = xc + ox;
        const cy0 = structY + oy;
        const r0 = Math.max(3.2, h * 0.015);
        const r1 = r0 * 0.75;
        line(ctx, cx0, cy0, cx0 - 7, cy0 + 5, C.steel, 2);
        line(ctx, cx0, cy0, cx0 + 7, cy0 + 5, C.steel, 2);
        disc(ctx, cx0, cy0, r0, C.pale, C.steel);
        disc(ctx, cx0 - 7, cy0 + 5, r1, C.dust, C.steel);
        disc(ctx, cx0 + 7, cy0 + 5, r1, C.dust, C.steel);
      }
      text(ctx, 'Weak forces', xc, colY + colH - h * 0.055, { size: Math.max(9, h * 0.028), color: C.dust });
    } else if (i === 1) {
      const meltProg = ease(win(t, 0.32, 0.46));
      const cols = 4;
      const rows = 3;
      const pitchX = colW * 0.18;
      const pitchY = structH * 0.32;
      const startX = xc - (cols - 1) * pitchX * 0.5;
      const startY = structY - (rows - 1) * pitchY * 0.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isPlus = (r + c) % 2 === 0;
          let px = startX + c * pitchX;
          let py = startY + r * pitchY;
          if (meltProg > 0) {
            const driftAngle = (r * cols + c) * 1.3 + (isPlus ? 0 : Math.PI);
            const driftDist = meltProg * (9 + (r + c) * 2.5);
            px += Math.cos(driftAngle) * driftDist;
            py += Math.sin(driftAngle) * driftDist * 0.6;
          }
          if (meltProg < 0.8) {
            if (c + 1 < cols) line(ctx, px, py, startX + (c + 1) * pitchX, py, C.steel, 1);
            if (r + 1 < rows) line(ctx, px, py, px, startY + (r + 1) * pitchY, C.steel, 1);
          }
          const rad = isPlus ? Math.max(3.2, h * 0.015) : Math.max(4.5, h * 0.02);
          disc(ctx, px, py, rad, isPlus ? C.pale : C.amber, C.steel);
          text(ctx, isPlus ? '+' : '−', px, py, { size: Math.max(7, h * 0.017), color: '#16140f', weight: 700 });
        }
      }
      text(ctx, isMelted ? 'Mobile when molten' : 'Locked ions', xc, colY + colH - h * 0.055, { size: Math.max(9, h * 0.028), color: isMelted ? C.amber : C.dust });
    } else if (i === 2) {
      const cols = 4;
      const rows = 3;
      const pitchX = colW * 0.18;
      const pitchY = structH * 0.32;
      const startX = xc - (cols - 1) * pitchX * 0.5;
      const startY = structY - (rows - 1) * pitchY * 0.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = startX + c * pitchX;
          const py = startY + r * pitchY;
          disc(ctx, px, py, Math.max(4.2, h * 0.018), C.rust, C.steel);
          text(ctx, '+', px, py, { size: Math.max(8, h * 0.018), color: C.text, weight: 700 });
        }
      }
      const eCount = 14;
      for (let k = 0; k < eCount; k++) {
        const u = ((k / eCount) + t * 2.5 + clock * 0.8) % 1;
        const ex = xc - colW * 0.38 + u * (colW * 0.76);
        const ey = structY - structH * 0.35 + ((k * 37) % 100) * 0.01 * (structH * 0.7);
        disc(ctx, ex, ey, 1.8, C.amber, C.amber);
      }
      text(ctx, 'Mobile electrons', xc, colY + colH - h * 0.055, { size: Math.max(9, h * 0.028), color: C.amber });
    } else {
      const cols = 4;
      const rows = 3;
      const pitchX = colW * 0.18;
      const pitchY = structH * 0.32;
      const startX = xc - (cols - 1) * pitchX * 0.5;
      const startY = structY - (rows - 1) * pitchY * 0.5;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = startX + c * pitchX;
          const py = startY + r * pitchY;
          if (c + 1 < cols) line(ctx, px, py, startX + (c + 1) * pitchX, py, isLiner ? C.amber : C.steel, 1.8);
          if (r + 1 < rows) line(ctx, px, py, px, startY + (r + 1) * pitchY, isLiner ? C.amber : C.steel, 1.8);
          if (c + 1 < cols && r + 1 < rows && (r + c) % 2 === 0) {
            line(ctx, px, py, startX + (c + 1) * pitchX, startY + (r + 1) * pitchY, isLiner ? C.amber : C.dim, 1.2);
          }
        }
      }
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = startX + c * pitchX;
          const py = startY + r * pitchY;
          disc(ctx, px, py, Math.max(3.6, h * 0.016), C.iron, isLiner ? C.amber : C.steel);
        }
      }
      text(ctx, 'Solid · No current', xc, colY + colH - h * 0.055, { size: Math.max(9, h * 0.028), color: C.amber, weight: 700 });
    }
    ctx.restore();
  }

  if (active === 3) {
    const threshY = colY + colH + h * 0.08;
    line(ctx, margin, threshY, w - margin, threshY, C.amber, 1.5, [6, 4]);
    text(ctx, '900 °C LINER THRESHOLD', w / 2, threshY - h * 0.022, {
      size: Math.max(9, h * 0.026),
      color: C.amber,
      weight: 700
    });
  }
}


export const LIGAR_SCENES = {
  'liner-heat': linerHeat,
  // The mechanism pictures (electrons moving, atoms on the well, shapes turning) are in their own file.
  ...LIGAR_MECHANISMS
};
