/**
 * story-scenes-teeter-q3.js — the story painter of `q3-q` (Teeter). A 960-wide plate, a pure function of `t`; the marker's place and the
 * bars are worked out from the mixture by the bench's own planners (`systemRatio`, `settleAmounts`, `gaugePos` in `engine/eqdata.js`).
 *
 * `needle-to-k`: three mixtures of A ⇌ B are left alone one after another. Each draws its bars moving to where they settle while the marker
 * on a scale slides to the K line; the marker's place at every moment is Q worked out from the bars as drawn.
 */

import { K_SYSTEMS, settleAmounts, systemRatio, gaugePos, fmtNum } from '../learn/engine/eqdata.js';
import { C, text, ground, win, ease } from './story-kit.js';

const A_INK = '#c0652b'; const B_INK = '#6f8fb0';
const AB = K_SYSTEMS.ab;
const MIX = [{ A: 0.1, B: 1.9 }, { A: 0.6, B: 0.6 }, { A: 0.5, B: 1.0 }];
const lerp = (a, b, v) => a + (b - a) * v;

function needleToK(ctx, w, h, t) {
  ground(ctx, w, h);
  const i = Math.min(2, Math.floor(t / 0.34));
  const local = ease(win(t, i * 0.34 + 0.03, i * 0.34 + 0.26));
  const start = MIX[i]; const eq = settleAmounts(AB, start);
  const now = { A: lerp(start.A, eq.A, local), B: lerp(start.B, eq.B, local) };
  const Q = systemRatio(AB, now);
  text(ctx, `Mixture ${i + 1}, left alone`, w / 2, h * 0.07, { size: 26, color: C.dust });
  // The bars.
  const bx = w * 0.1; const bw = w * 0.34; const by = h * 0.16; const bh = h * 0.56; const base = by + bh - 34;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = C.steel; ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ['A', 'B'].forEach((s, k) => {
    const cx = bx + bw * (0.3 + 0.4 * k);
    const hh = (now[s] / 2) * (base - by - 40);
    ctx.fillStyle = k ? B_INK : A_INK; ctx.fillRect(cx - 34, base - hh, 68, Math.max(1, hh));
    text(ctx, s, cx, base + 18, { size: 20, color: C.text, weight: 700 });
    text(ctx, fmtNum(now[s], 3), cx, base - hh - 14, { size: 17, color: C.dust });
  });
  // The scale: K in the middle, a tick for every tenfold step, the marker where Q stands.
  const gx0 = w * 0.55; const gx1 = w * 0.92; const gc = (gx0 + gx1) / 2; const half = (gx1 - gx0) / 2; const gy = h * 0.42;
  ctx.strokeStyle = C.steel; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(gx0, gy); ctx.lineTo(gx1, gy); ctx.stroke(); ctx.lineWidth = 1;
  for (let d = -1; d <= 1; d++) {
    ctx.strokeStyle = d ? C.steel : C.amber; ctx.lineWidth = d ? 2 : 4;
    const tx = gc + (d / 1.5) * half; ctx.beginPath(); ctx.moveTo(tx, gy - (d ? 10 : 30)); ctx.lineTo(tx, gy + (d ? 10 : 16)); ctx.stroke();
  }
  ctx.lineWidth = 1;
  text(ctx, `K = ${fmtNum(AB.K, 2)}`, gc, gy - 46, { size: 20, color: C.amber, weight: 700 });
  const nx = gc + gaugePos(Q, AB.K, 1.5) * half;
  ctx.fillStyle = C.text; ctx.beginPath(); ctx.moveTo(nx, gy + 2); ctx.lineTo(nx - 11, gy + 28); ctx.lineTo(nx + 11, gy + 28); ctx.closePath(); ctx.fill();
  text(ctx, `Q = ${fmtNum(Q, 3)}`, Math.max(gx0 + 70, Math.min(gx1 - 70, nx)), gy + 52, { size: 22, color: C.text, weight: 700 });
}

export const TEETER_Q3_SCENES = { 'needle-to-k': needleToK };
