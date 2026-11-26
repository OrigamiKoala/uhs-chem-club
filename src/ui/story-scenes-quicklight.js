/**
 * story-scenes-quicklight.js — Story debrief painters for Quicklight (unit11), registered in `story-scenes.js`.
 * Each quest has its own dedicated visual scene.
 */

import { planKineticsRun, planMB } from '../learn/engine/ratedata.js';
import { C, text, ground, win, ease } from './story-kit.js';

function drawCurve(ctx, x0, y0, w, h, pts, tMax, yMax, prog, col, getter = pt => pt.P, dashed = false) {
  ctx.save();
  ctx.strokeStyle = col;
  ctx.lineWidth = 3;
  if (dashed) ctx.setLineDash([6, 5]);
  ctx.beginPath();
  const maxI = Math.max(1, Math.round(prog * (pts.length - 1)));
  for (let i = 0; i <= maxI; i++) {
    const px = x0 + (pts[i].t / tMax) * w;
    const py = y0 + h - (getter(pts[i]) / yMax) * h;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.restore();
}

function drawAxes(ctx, gx, gy, gw, gh) {
  ctx.strokeStyle = C.steel;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(gx, gy);
  ctx.lineTo(gx, gy + gh);
  ctx.lineTo(gx + gw, gy + gh);
  ctx.stroke();
}

function rateWatch(ctx, w, h, t) {
  ground(ctx, w, h);
  const gx = 150, gy = 130, gw = 660, gh = 290;
  drawAxes(ctx, gx, gy, gw, gh);

  if (t < 0.40) {
    const v1 = planKineticsRun({ order: 1, k: 0.08, a0: 0.40, tMax: 30 });
    const v2 = planKineticsRun({ order: 1, k: 0.25, a0: 0.40, tMax: 30 });
    text(ctx, '0.40 mol/L', gx - 16, gy + 12, { size: 18, color: C.dust, align: 'right' });
    text(ctx, '0', gx - 16, gy + gh, { size: 18, color: C.dust, align: 'right' });
    text(ctx, '30 s', gx + gw, gy + gh + 32, { size: 18, color: C.dust, align: 'right' });
    const p1 = ease(win(t, 0, 0.30));
    drawCurve(ctx, gx, gy, gw, gh, v1.points, 30, 0.45, p1, C.dim);
    drawCurve(ctx, gx, gy, gw, gh, v2.points, 30, 0.45, p1, C.amber);
    text(ctx, 'Vessel 2 (steeper)', gx + 150, gy + 44, { size: 20, color: C.amber, weight: 700 });
    text(ctx, 'Vessel 1', gx + 420, gy + 150, { size: 20, color: C.dim });
    text(ctx, 'Both end at 0.40 mol/L', gx + gw - 20, gy + 24, { size: 20, color: C.text, align: 'right' });
  } else {
    const ab = planKineticsRun({ order: 1, k: 0.08, a0: 0.80, tMax: 30, stoich: { a: 2, b: 1 } });
    const p2 = ease(win(t, 0.40, 0.70));
    text(ctx, '0.80 mol/L', gx - 16, gy + 12, { size: 18, color: C.dust, align: 'right' });
    text(ctx, '0', gx - 16, gy + gh, { size: 18, color: C.dust, align: 'right' });
    text(ctx, '2 A → B', gx + gw / 2, gy - 18, { size: 22, color: C.text, align: 'center', weight: 700 });
    drawCurve(ctx, gx, gy, gw, gh, ab.points, 30, 0.85, p2, C.amber, pt => pt.A);
    drawCurve(ctx, gx, gy, gw, gh, ab.points, 30, 0.85, p2, '#5cc8f0', pt => pt.P);
    text(ctx, 'A falling (2×)', gx + 120, gy + 65, { size: 20, color: C.amber, weight: 700 });
    text(ctx, 'B rising (1×)', gx + 360, gy + 180, { size: 20, color: '#5cc8f0', weight: 700 });
  }
}

function rateLaw(ctx, w, h, t) {
  ground(ctx, w, h);
  const p = ease(win(t, 0, 0.45));
  const panels = [
    { label: 'Feed A (order 1)', fn: x => x, col: C.amber },
    { label: 'Feed B (order 2)', fn: x => x * x, col: '#5cc8f0' },
    { label: 'Feed C (order 0)', fn: () => 0.45, col: C.dim }
  ];
  const pw = 210, ph = 180, gap = 40;
  const startX = (w - (pw * 3 + gap * 2)) / 2;
  const gy = 175;
  text(ctx, 'rate = k [A] [B]²', w / 2, 118, { size: 28, color: C.amber, align: 'center', weight: 700 });
  panels.forEach((pn, idx) => {
    const gx = startX + idx * (pw + gap);
    drawAxes(ctx, gx, gy, pw, ph);
    ctx.strokeStyle = pn.col;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    const steps = 28;
    const maxI = Math.max(1, Math.round(p * steps));
    for (let i = 0; i <= maxI; i++) {
      const u = i / steps;
      const px = gx + u * pw;
      const py = gy + ph - pn.fn(u) * (ph - 16) - 8;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
    text(ctx, pn.label, gx + pw / 2, gy + ph + 34, { size: 18, color: pn.col, align: 'center', weight: 700 });
  });
}

function rateTime(ctx, w, h, t) {
  ground(ctx, w, h);
  const gx = 160, gy = 130, gw = 640, gh = 290;
  drawAxes(ctx, gx, gy, gw, gh);
  const k = Math.LN2 / 20;
  const run = planKineticsRun({ order: 1, k, a0: 0.80, tMax: 60 });
  const p = ease(win(t, 0, 0.45));
  drawCurve(ctx, gx, gy, gw, gh, run.points, 60, 0.85, p, C.amber, pt => pt.A);
  text(ctx, '0.80 mol/L', gx - 16, gy + 12, { size: 18, color: C.dust, align: 'right' });
  text(ctx, '60 s', gx + gw, gy + gh + 32, { size: 18, color: C.dust, align: 'right' });
  if (t > 0.25) {
    const marks = [
      { time: 20, frac: '½ left', A: 0.40 },
      { time: 40, frac: '¼ left', A: 0.20 }
    ];
    marks.forEach(m => {
      const mx = gx + (m.time / 60) * gw;
      const my = gy + gh - (m.A / 0.85) * gh;
      ctx.save();
      ctx.strokeStyle = '#5cc8f0';
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(mx, gy + gh);
      ctx.lineTo(mx, my);
      ctx.lineTo(gx, my);
      ctx.stroke();
      ctx.restore();
      text(ctx, '20 s', mx - 70, gy + 36, { size: 20, color: '#5cc8f0', align: 'center', weight: 700 });
      text(ctx, m.frac, gx + 14, my - 8, { size: 17, color: C.text });
    });
  }
}

function rateCollide(ctx, w, h, t) {
  ground(ctx, w, h);
  const gx = 160, gy = 140, gw = 640, gh = 270;
  drawAxes(ctx, gx, gy, gw, gh);
  const T = t < 0.45 ? 300 : 360;
  const mb = planMB({ T, Ea: 12, eMax: 24, nBins: 32 });
  const maxD = Math.max(...mb.bins.map(b => b.density), 0.1);
  const bw = gw / mb.bins.length;
  mb.bins.forEach((bin, i) => {
    const bh = (bin.density / maxD) * gh * 0.88;
    ctx.fillStyle = bin.above ? C.amber : '#48586b';
    ctx.fillRect(gx + i * bw, gy + gh - bh, Math.max(2, bw - 3), bh);
  });
  const eaX = gx + (12 / 24) * gw;
  ctx.strokeStyle = C.amber;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(eaX, gy);
  ctx.lineTo(eaX, gy + gh);
  ctx.stroke();
  text(ctx, `T = ${T} K  ·  ≥ Ea: ${mb.percentAbove.toFixed(2)}%`, gx + gw, gy - 16, { size: 22, color: C.amber, align: 'right', weight: 700 });
  text(ctx, 'Ea = 12 kJ/mol', eaX + 12, gy + 26, { size: 19, color: C.amber, weight: 700 });
  text(ctx, 'Kinetic energy (kJ/mol)', gx + gw / 2, gy + gh + 34, { size: 18, color: C.dust, align: 'center' });
}

function rateSteps(ctx, w, h, t) {
  ground(ctx, w, h);
  const gx = 150, gy = 130, gw = 660, gh = 290;
  drawAxes(ctx, gx, gy, gw, gh);
  const segs = [[0, 30], [0.28, 95], [0.52, 55], [0.76, 75], [1, 15]];
  const eval2 = u => {
    for (let i = 0; i < segs.length - 1; i++) {
      const [u0, e0] = segs[i]; const [u1, e1] = segs[i + 1];
      if (u <= u1 || i === segs.length - 2) {
        const s = Math.max(0, Math.min(1, (u - u0) / (u1 - u0)));
        return e0 + (e1 - e0) * (0.5 - 0.5 * Math.cos(Math.PI * s));
      }
    }
    return 15;
  };
  const toX = u => gx + u * gw;
  const toY = e => gy + gh - ((e - 5) / 105) * gh;
  const p = ease(win(t, 0, 0.45));
  ctx.strokeStyle = '#5cc8f0';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i <= Math.round(60 * p); i++) {
    const u = i / 60;
    const x = toX(u); const y = toY(eval2(u));
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  text(ctx, 'Step 1 (slow · 65 kJ/mol)', toX(0.28), toY(95) - 18, { size: 20, color: C.amber, align: 'center', weight: 700 });
  text(ctx, 'Intermediate', toX(0.52), toY(55) + 32, { size: 18, color: '#88e060', align: 'center', weight: 700 });
  text(ctx, 'Step 2 (fast)', toX(0.76), toY(75) - 18, { size: 18, color: C.dim, align: 'center' });
}

function rateShortcut(ctx, w, h, t) {
  ground(ctx, w, h);
  const gx = 150, gy = 130, gw = 660, gh = 290;
  drawAxes(ctx, gx, gy, gw, gh);
  const eval1 = (u, peak) => {
    if (u <= 0.45) return 40 + (peak - 40) * (0.5 - 0.5 * Math.cos(Math.PI * (u / 0.45)));
    return peak + (15 - peak) * (0.5 - 0.5 * Math.cos(Math.PI * ((u - 0.45) / 0.55)));
  };
  const toX = u => gx + u * gw;
  const toY = e => gy + gh - ((e - 5) / 120) * gh;
  const p = ease(win(t, 0, 0.4));
  ctx.strokeStyle = '#5cc8f0';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  for (let i = 0; i <= 60; i++) {
    const u = i / 60;
    if (i === 0) ctx.moveTo(toX(u), toY(eval1(u, 110))); else ctx.lineTo(toX(u), toY(eval1(u, 110)));
  }
  ctx.stroke();
  ctx.save();
  ctx.strokeStyle = '#88e060';
  ctx.lineWidth = 3.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  for (let i = 0; i <= Math.round(60 * p); i++) {
    const u = i / 60;
    if (i === 0) ctx.moveTo(toX(u), toY(eval1(u, 70))); else ctx.lineTo(toX(u), toY(eval1(u, 70)));
  }
  ctx.stroke();
  ctx.restore();
  text(ctx, 'Uncatalysed (110)', toX(0.45), toY(110) - 16, { size: 20, color: '#5cc8f0', align: 'center', weight: 700 });
  text(ctx, 'Catalysed shortcut (70)', toX(0.45), toY(70) + 32, { size: 20, color: '#88e060', align: 'center', weight: 700 });
  text(ctx, 'Same start & end', toX(0.95), toY(15) - 16, { size: 18, color: C.text, align: 'right' });
}

function rateFlare(ctx, w, h, t) {
  ground(ctx, w, h);
  const gx = 150, gy = 135, gw = 660, gh = 280;
  drawAxes(ctx, gx, gy, gw, gh);
  const surge = planKineticsRun({ order: 1, k: 0.14, a0: 0.80, tMax: 30 });
  const calm = planKineticsRun({ order: 1, k: 0.04, a0: 0.80, tMax: 30 });
  const p = ease(win(t, 0, 0.45));
  drawCurve(ctx, gx, gy, gw, gh, surge.points, 30, 0.85, p, C.amber, pt => pt.A, true);
  drawCurve(ctx, gx, gy, gw, gh, calm.points, 30, 0.85, p, '#5cc8f0', pt => pt.A);
  text(ctx, 'THE FLARE · STABILIZED', gx + gw / 2, gy - 22, { size: 24, color: C.amber, align: 'center', weight: 700 });
  text(ctx, 'Catalysed surge (rate = k[X]²[Y])', gx + 20, gy + 38, { size: 19, color: C.amber, weight: 700 });
  text(ctx, 'Controlled burn', gx + 420, gy + 130, { size: 19, color: '#5cc8f0', weight: 700 });
}

export const QUICKLIGHT_SCENES = {
  'rate-watch': rateWatch,
  'rate-law': rateLaw,
  'rate-time': rateTime,
  'rate-collide': rateCollide,
  'rate-steps': rateSteps,
  'rate-shortcut': rateShortcut,
  'rate-flare': rateFlare
};
