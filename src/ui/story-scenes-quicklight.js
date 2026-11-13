/**
 * story-scenes-quicklight.js — Story debrief painters for Quicklight (unit11), registered in `story-scenes.js`.
 */

import { planKineticsRun } from '../learn/engine/ratedata.js';
import { C, text, ground, win, ease } from './story-kit.js';

function drawCurve(ctx, x0, y0, w, h, pts, tMax, yMax, prog, col, dashed = false) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  const maxI = Math.max(1, Math.round(prog * (pts.length - 1)));
  for (let i = 0; i <= maxI; i++) {
    const px = x0 + (pts[i].t / tMax) * w;
    const py = y0 + h - (pts[i].P / yMax) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function rateWatch(ctx, w, h, t) {
  ground(ctx, w, h);
  const v1 = planKineticsRun({ order: 1, k: 0.08, a0: 0.40, tMax: 30 });
  const v2 = planKineticsRun({ order: 1, k: 0.25, a0: 0.40, tMax: 30 });

  const gx = 150, gy = 130, gw = 660, gh = 290;
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx, gy + gh);
  ctx.lineTo(gx + gw, gy + gh);
  ctx.stroke();

  text(ctx, '0.40 mol/L', gx - 16, gy + 12, { size: 18, color: C.dust, align: 'right' });
  text(ctx, '0', gx - 16, gy + gh, { size: 18, color: C.dust, align: 'right' });
  text(ctx, '30 s', gx + gw, gy + gh + 32, { size: 18, color: C.dust, align: 'right' });

  const p1 = ease(win(t, 0, 0.35));
  drawCurve(ctx, gx, gy, gw, gh, v1.points, 30, 0.45, p1, C.dim);
  drawCurve(ctx, gx, gy, gw, gh, v2.points, 30, 0.45, p1, C.amber);

  if (t > 0.25) {
    text(ctx, 'Vessel 2 (steeper)', gx + 150, gy + 44, { size: 20, color: C.amber, weight: 700 });
    text(ctx, 'Vessel 1', gx + 420, gy + 150, { size: 20, color: C.dim });
  }
  if (t > 0.55) {
    text(ctx, 'Both end at 0.40 mol/L', gx + gw - 20, gy + 24, { size: 20, color: C.text, align: 'right' });
  }
}

export const QUICKLIGHT_SCENES = {
  'rate-watch': rateWatch
};
