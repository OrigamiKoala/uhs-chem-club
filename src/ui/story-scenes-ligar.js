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


/* ---- q2-lattice: four structures and why each behaves as it does under heat and voltage ---- */
function linerHeat(ctx, w, h, t, clock = 0) {
  ground(ctx, w, h);
  const margin = w * 0.045;
  const gap = w * 0.02;
  const colW = (w - margin * 2 - gap * 3) / 4;
  const colH = h * 0.58;
  const colY = h * 0.12;

  const heatRise = ease(win(t, 0.05, 0.85));
  const currentTemp = Math.round(heatRise * 1800);

  const titles = ['Molecular', 'Ionic Lattice', 'Metallic', 'Covalent Network'];
  const melts = [115, 801, 1085, 1710];

  for (let i = 0; i < 4; i++) {
    const x0 = margin + i * (colW + gap);
    const xc = x0 + colW / 2;
    const isLiner = i === 3 && t > 0.65;
    const isMelted = currentTemp >= melts[i];

    ctx.fillStyle = C.bg0;
    ctx.fillRect(x0, colY, colW, colH);
    ctx.strokeStyle = isLiner ? C.amber : C.steel;
    ctx.lineWidth = isLiner ? 2 : 1;
    ctx.strokeRect(x0 + 0.5, colY + 0.5, colW - 1, colH - 1);

    text(ctx, titles[i], xc, colY + h * 0.045, { size: Math.max(10, h * 0.035), weight: 700, color: isLiner ? C.amber : C.text });
    text(ctx, `${melts[i]} °C`, xc, colY + h * 0.08, { size: Math.max(9, h * 0.03), color: isMelted ? C.amber : C.dust });

    const circY = colY + h * 0.125;
    const conducts = (i === 2) || (i === 1 && isMelted);
    line(ctx, xc - colW * 0.35, circY, xc - 10, circY, C.dim, 1.5);
    line(ctx, xc + 10, circY, xc + colW * 0.35, circY, C.dim, 1.5);
    disc(ctx, xc, circY, Math.max(3.5, h * 0.016), conducts ? C.amber : C.iron, conducts ? C.amber : C.steel);
    text(ctx, conducts ? 'CURRENT' : 'NO CURRENT', xc, circY + h * 0.032, {
      size: Math.max(8, h * 0.024),
      color: conducts ? C.amber : C.dim,
      weight: conducts ? 700 : 500
    });

    const structY = colY + h * 0.31;
    const structH = h * 0.22;

    if (i === 0) {
      const sep = ease(win(t, 0.1, 0.3));
      const clusters = [
        [-colW * 0.22 - sep * 10, -structH * 0.22 - sep * 7],
        [colW * 0.22 + sep * 10, -structH * 0.22 - sep * 7],
        [-colW * 0.22 - sep * 10, structH * 0.22 + sep * 7],
        [colW * 0.22 + sep * 10, structH * 0.22 + sep * 7]
      ];
      if (sep < 0.95) {
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
      text(ctx, isMelted ? 'Molecules separated' : 'Discrete molecules', xc, colY + colH - h * 0.07, { size: Math.max(9, h * 0.026), color: C.dust });
      text(ctx, 'Weak intermolecular hold', xc, colY + colH - h * 0.03, { size: Math.max(8, h * 0.024), color: C.dim });
    } else if (i === 1) {
      const meltProg = ease(win(t, 0.22, 0.42));
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
            const driftDist = meltProg * (10 + (r + c) * 3);
            px += Math.cos(driftAngle) * driftDist;
            py += Math.sin(driftAngle) * driftDist * 0.6;
          }
          if (meltProg < 0.8) {
            if (c + 1 < cols) {
              line(ctx, px, py, startX + (c + 1) * pitchX, py, C.steel, 1);
            }
            if (r + 1 < rows) {
              line(ctx, px, py, px, startY + (r + 1) * pitchY, C.steel, 1);
            }
          }
          const rad = isPlus ? Math.max(3.2, h * 0.015) : Math.max(4.5, h * 0.02);
          disc(ctx, px, py, rad, isPlus ? C.pale : C.amber, C.steel);
          text(ctx, isPlus ? '+' : '−', px, py, { size: Math.max(7, h * 0.017), color: '#16140f', weight: 700 });
        }
      }
      text(ctx, isMelted ? 'Ions mobile in liquid' : 'Ions locked in lattice', xc, colY + colH - h * 0.07, { size: Math.max(9, h * 0.026), color: isMelted ? C.amber : C.dust });
      text(ctx, isMelted ? 'Charge flows under voltage' : 'No charge can move', xc, colY + colH - h * 0.03, { size: Math.max(8, h * 0.024), color: C.dim });
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
      text(ctx, 'Mobile electron sea', xc, colY + colH - h * 0.07, { size: Math.max(9, h * 0.026), color: C.amber });
      text(ctx, 'Electrons drift cold & molten', xc, colY + colH - h * 0.03, { size: Math.max(8, h * 0.024), color: C.dim });
    } else {
      const cols = 4;
      const rows = 3;
      const pitchX = colW * 0.18;
      const pitchY = structH * 0.32;
      const startX = xc - (cols - 1) * pitchX * 0.5;
      const startY = structY - (rows - 1) * pitchY * 0.5;

      ctx.strokeStyle = isLiner ? C.amber : C.steel;
      ctx.lineWidth = 1.8;
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
      text(ctx, isLiner ? 'The Vessel Liner' : 'Continuous covalent web', xc, colY + colH - h * 0.07, { size: Math.max(9, h * 0.026), color: isLiner ? C.amber : C.dust, weight: isLiner ? 700 : 500 });
      text(ctx, 'Bonds intact at 900°C · No current', xc, colY + colH - h * 0.03, { size: Math.max(8, h * 0.024), color: isLiner ? C.amber : C.dim });
    }
  }

  const threshY = colY + colH + h * 0.08;
  const lineActive = t > 0.45;
  line(ctx, margin, threshY, w - margin, threshY, lineActive ? C.amber : C.dim, 1.5, [6, 4]);
  text(ctx, '900 °C OPERATING THRESHOLD', margin + 6, threshY - h * 0.02, {
    size: Math.max(9, h * 0.026),
    color: lineActive ? C.amber : C.dim,
    weight: 700,
    align: 'left'
  });
  text(ctx, lineActive ? 'Only covalent network stays solid without passing current' : 'Vessel liner requirement', w - margin - 6, threshY - h * 0.02, {
    size: Math.max(9, h * 0.026),
    color: lineActive ? C.amber : C.dust,
    align: 'right'
  });
}


export const LIGAR_SCENES = {
  'liner-heat': linerHeat,
  // The mechanism pictures (electrons moving, atoms on the well, shapes turning) are in their own file.
  ...LIGAR_MECHANISMS
};
