/**
 * kits/rate-plotter.js — Data plotter (`plotter`) with [A], ln[A], 1/[A] modes and straightedge fit
 * for Quicklight (unit11, q3-time).
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { planPlotTransform } from '../../engine/ratedata.js';
import { registerFixture } from './rate-registry.js';
import { say, frameOf } from './matter-draw.js';

const DIM = PLATE_COLORS.dim;
const DUST = PLATE_COLORS.dust;
const AMBER = PLATE_COLORS.amber;
const TEXT = PLATE_COLORS.text;
const LINE_COL = '#6f8fb0';

const MODES = ['A', 'lnA', 'invA'];
const MODE_LABELS = ['[A] vs t', 'ln[A] vs t', '1/[A] vs t'];

export function plotterFixture(id, at, {
  title = 'Data plotter',
  datasets = [], // [{ label, points: [{ t, A }] }]
  w = 78,
  h = 42
} = {}) {
  const dials = {
    plot: {
      min: 1,
      max: 3,
      step: 1,
      value: 1,
      label: 'Plot',
      labels: ['[A]', 'ln[A]', '1/[A]']
    }
  };
  if (datasets.length > 1) {
    dials.rxn = {
      min: 1,
      max: datasets.length,
      step: 1,
      value: 1,
      label: 'Reaction',
      labels: datasets.map(d => d.label)
    };
  }
  const hasTwo = datasets.length > 1;
  return {
    id,
    kind: 'plotter',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: true,
    dials,
    props: { title, datasets, top: 8.2, rowPitch: hasTwo ? 8.6 : 6.0, tickLabels: true }
  };
}

function paintPlotter(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const rxnIdx = Math.max(0, Math.min(p.datasets.length - 1, Math.round(f.dials.rxn?.value ?? 1) - 1));
  const modeIdx = Math.max(0, Math.min(2, Math.round(f.dials.plot?.value ?? 1) - 1));
  const ds = p.datasets[rxnIdx];
  const mode = MODES[modeIdx];
  const hasTwo = (p.datasets || []).length > 1;

  say(ctx, `${p.title}${ds ? ` · ${ds.label}` : ''}`, F.x(2), F.y(2.5), F.size(2.1, 5.6), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.6) });
  say(ctx, MODE_LABELS[modeIdx], F.x(f.size.w - 2), F.y(2.5), F.size(2.0, 5.4), { align: 'right', color: AMBER, weight: 700 });

  if (!ds || !ds.points?.length) return;
  const tr = planPlotTransform(ds.points, mode);
  const pts = tr.pts;
  const tMax = Math.max(...pts.map(x => x.t), 1);
  let yMin = Math.min(...pts.map(x => x.y));
  let yMax = Math.max(...pts.map(x => x.y));
  if (Math.abs(yMax - yMin) < 1e-6) { yMin -= 1; yMax += 1; }
  const pad = (yMax - yMin) * 0.14;
  yMin -= pad;
  yMax += pad;

  const gx = 11.5;
  const gy = hasTwo ? 22.8 : 15.6;
  const gw = f.size.w - 15;
  const gh = Math.max(10, f.size.h - gy - 5.2);

  // Lightened plot backdrop
  ctx.fillStyle = '#141922';
  ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));

  ctx.strokeStyle = '#8a96a6';
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  const toX = t => gx + (t / tMax) * gw;
  const toY = y => gy + gh - ((y - yMin) / (yMax - yMin)) * gh;

  // Y-axis numbers
  say(ctx, yMax.toFixed(1), F.x(gx - 1.0), F.y(gy + 1.4), F.size(1.6, 4.4), { align: 'right', color: TEXT });
  say(ctx, yMin.toFixed(1), F.x(gx - 1.0), F.y(gy + gh), F.size(1.6, 4.4), { align: 'right', color: TEXT });

  // Straightedge reference line (first-to-last point)
  const p0 = pts[0];
  const p1 = pts[pts.length - 1];
  ctx.strokeStyle = AMBER;
  ctx.lineWidth = Math.max(2.0, F.len(0.36));
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(F.x(toX(p0.t)), F.y(toY(p0.y)));
  ctx.lineTo(F.x(toX(p1.t)), F.y(toY(p1.y)));
  ctx.stroke();
  ctx.setLineDash([]);

  // Data curve & points
  ctx.strokeStyle = '#5cc8f0';
  ctx.lineWidth = Math.max(2.2, F.len(0.38));
  ctx.beginPath();
  pts.forEach((pt, idx) => {
    const x = F.x(toX(pt.t));
    const y = F.y(toY(pt.y));
    if (idx === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.lineWidth = 1;

  pts.forEach(pt => {
    ctx.fillStyle = TEXT;
    ctx.beginPath();
    ctx.arc(F.x(toX(pt.t)), F.y(toY(pt.y)), Math.max(3.0, F.len(0.6)), 0, Math.PI * 2);
    ctx.fill();
  });

  say(ctx, `Time (0–${Math.round(tMax)} s)`, F.x(gx + gw), F.y(gy + gh + 2.8), F.size(1.7, 4.6), { align: 'right', color: TEXT });
  say(ctx, 'dashed = straightedge', F.x(gx + 0.8), F.y(gy + gh + 2.8), F.size(1.6, 4.4), { color: AMBER });
}

registerFixture('plotter', { paint: paintPlotter });

/** Two measurements on a ln k against 1/T graph, joined by their straight line (the Arrhenius plot). */
export function arrplotFixture(id, at, {
  title = 'ln k against 1/T',
  pts = [],
  xLabel = '1/T (10⁻³ per K)',
  yLabel = 'ln k',
  w = 70,
  h = 44
} = {}) {
  return { id, kind: 'arrplot', label: title, at: { ...at }, size: { w, h }, noRun: true, dials: {}, props: { title, pts, xLabel, yLabel } };
}

function paintArrplot(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.2, 5.6), { color: TEXT, weight: 700, maxW: F.len(f.size.w - 4) });
  if (!p.pts.length) return;
  const gx = 14; const gy = 8.5; const gw = f.size.w - 20; const gh = f.size.h - 15.5;
  const xs = p.pts.map(q => q.x); const ys = p.pts.map(q => q.y);
  const xMin = Math.min(...xs); const xMax = Math.max(...xs); const yMin = Math.min(...ys); const yMax = Math.max(...ys);
  const toX = x => gx + 0.14 * gw + ((x - xMin) / (xMax - xMin || 1)) * gw * 0.72;
  const toY = y => gy + gh - 0.14 * gh - ((y - yMin) / (yMax - yMin || 1)) * gh * 0.72;

  ctx.fillStyle = '#141922';
  ctx.fillRect(F.x(gx), F.y(gy), F.len(gw), F.len(gh));

  ctx.strokeStyle = '#8a96a6';
  ctx.beginPath(); ctx.moveTo(F.x(gx), F.y(gy)); ctx.lineTo(F.x(gx), F.y(gy + gh)); ctx.lineTo(F.x(gx + gw), F.y(gy + gh)); ctx.stroke();

  const a = p.pts[0]; const c = p.pts[p.pts.length - 1];
  // Rise/run slope triangle
  if (p.pts.length >= 2) {
    const ax = toX(a.x); const ay = toY(a.y);
    const cx = toX(c.x); const cy = toY(c.y);
    ctx.strokeStyle = 'rgba(92,200,240,0.65)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(F.x(ax), F.y(ay));
    ctx.lineTo(F.x(cx), F.y(ay));
    ctx.lineTo(F.x(cx), F.y(cy));
    ctx.stroke();
    ctx.setLineDash([]);
    const dY = (c.y - a.y).toFixed(1);
    const dX = (c.x - a.x).toFixed(2);
    say(ctx, `rise ${Number(dY) >= 0 ? '+' : ''}${dY}`, F.x(cx - 1.5), F.y((ay + cy) / 2), F.size(1.65, 4.5), { align: 'right', color: '#5cc8f0', weight: 700 });
    say(ctx, `run ${dX} × 10⁻³`, F.x((ax + cx) / 2), F.y(ay + 2.6), F.size(1.65, 4.5), { align: 'center', color: '#5cc8f0', weight: 700 });
  }

  ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(2, F.len(0.35));
  ctx.beginPath(); ctx.moveTo(F.x(toX(a.x) - (toX(c.x) - toX(a.x)) * 0.16), F.y(toY(a.y) - (toY(c.y) - toY(a.y)) * 0.16));
  ctx.lineTo(F.x(toX(c.x) + (toX(c.x) - toX(a.x)) * 0.16), F.y(toY(c.y) + (toY(c.y) - toY(a.y)) * 0.16)); ctx.stroke();
  ctx.lineWidth = 1;

  p.pts.forEach(q => {
    ctx.fillStyle = TEXT; ctx.beginPath(); ctx.arc(F.x(toX(q.x)), F.y(toY(q.y)), Math.max(3.4, F.len(0.8)), 0, Math.PI * 2); ctx.fill();
    say(ctx, q.label, F.x(toX(q.x) + 1.8), F.y(toY(q.y) - 2.6), F.size(1.9, 5.0), { color: AMBER, weight: 700 });
  });
  say(ctx, yMax.toFixed(1), F.x(gx - 1.2), F.y(gy + 1.8), F.size(1.6, 4.4), { align: 'right', color: TEXT });
  say(ctx, yMin.toFixed(1), F.x(gx - 1.2), F.y(gy + gh), F.size(1.6, 4.4), { align: 'right', color: TEXT });
  say(ctx, p.xLabel, F.x(gx + gw / 2), F.y(gy + gh + 3.2), F.size(1.8, 4.8), { align: 'center', color: TEXT });
  say(ctx, p.yLabel, F.x(gx - 1.2), F.y(gy + gh / 2), F.size(1.8, 4.8), { align: 'right', color: TEXT });
}

registerFixture('arrplot', { paint: paintArrplot });
