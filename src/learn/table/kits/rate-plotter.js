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
  return {
    id,
    kind: 'plotter',
    label: title,
    at: { ...at },
    size: { w, h },
    noRun: true,
    dials,
    props: { title, datasets }
  };
}

function paintPlotter(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const rxnIdx = Math.max(0, Math.min(p.datasets.length - 1, Math.round(f.dials.rxn?.value ?? 1) - 1));
  const modeIdx = Math.max(0, Math.min(2, Math.round(f.dials.plot?.value ?? 1) - 1));
  const ds = p.datasets[rxnIdx];
  const mode = MODES[modeIdx];

  say(ctx, `${p.title}${ds ? ` · ${ds.label}` : ''}`, F.x(2), F.y(2.5), F.size(2.1, 5.4), { color: TEXT, weight: 700, maxW: F.len(f.size.w * 0.65) });
  say(ctx, MODE_LABELS[modeIdx], F.x(f.size.w - 2), F.y(2.5), F.size(1.9, 5.0), { align: 'right', color: AMBER, weight: 700 });

  if (!ds || !ds.points?.length) return;
  const tr = planPlotTransform(ds.points, mode);
  const pts = tr.pts;
  const tMax = Math.max(...pts.map(x => x.t), 1);
  let yMin = Math.min(...pts.map(x => x.y));
  let yMax = Math.max(...pts.map(x => x.y));
  if (Math.abs(yMax - yMin) < 1e-6) { yMin -= 1; yMax += 1; }
  const pad = (yMax - yMin) * 0.12;
  yMin -= pad;
  yMax += pad;

  const gx = 9;
  const gy = 11.5;
  const gw = f.size.w - 13;
  const gh = f.size.h - 16.5;

  ctx.strokeStyle = DUST;
  ctx.beginPath();
  ctx.moveTo(F.x(gx), F.y(gy));
  ctx.lineTo(F.x(gx), F.y(gy + gh));
  ctx.lineTo(F.x(gx + gw), F.y(gy + gh));
  ctx.stroke();

  const toX = t => gx + (t / tMax) * gw;
  const toY = y => gy + gh - ((y - yMin) / (yMax - yMin)) * gh;

  // Straightedge reference line (first-to-last point)
  const p0 = pts[0];
  const p1 = pts[pts.length - 1];
  ctx.strokeStyle = AMBER;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(F.x(toX(p0.t)), F.y(toY(p0.y)));
  ctx.lineTo(F.x(toX(p1.t)), F.y(toY(p1.y)));
  ctx.stroke();
  ctx.setLineDash([]);

  // Data curve & points
  ctx.strokeStyle = LINE_COL;
  ctx.lineWidth = Math.max(1.8, F.len(0.32));
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
    ctx.arc(F.x(toX(pt.t)), F.y(toY(pt.y)), Math.max(2.6, F.len(0.55)), 0, Math.PI * 2);
    ctx.fill();
  });

  say(ctx, 'Time (s)', F.x(gx + gw), F.y(gy + gh + 2.5), F.size(1.6, 4.2), { align: 'right', color: DIM });
  say(ctx, 'dashed = straightedge', F.x(gx + 1), F.y(gy + gh + 2.5), F.size(1.5, 4.0), { color: AMBER });
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
  say(ctx, p.title, F.x(2), F.y(2.5), F.size(2.1, 5.4), { color: TEXT, weight: 700, maxW: F.len(f.size.w - 4) });
  if (!p.pts.length) return;
  const gx = 11; const gy = 8; const gw = f.size.w - 17; const gh = f.size.h - 15;
  const xs = p.pts.map(q => q.x); const ys = p.pts.map(q => q.y);
  const xMin = Math.min(...xs); const xMax = Math.max(...xs); const yMin = Math.min(...ys); const yMax = Math.max(...ys);
  const toX = x => gx + 0.12 * gw + ((x - xMin) / (xMax - xMin || 1)) * gw * 0.76;
  const toY = y => gy + gh - 0.12 * gh - ((y - yMin) / (yMax - yMin || 1)) * gh * 0.76;
  ctx.strokeStyle = DUST;
  ctx.beginPath(); ctx.moveTo(F.x(gx), F.y(gy)); ctx.lineTo(F.x(gx), F.y(gy + gh)); ctx.lineTo(F.x(gx + gw), F.y(gy + gh)); ctx.stroke();
  const a = p.pts[0]; const c = p.pts[p.pts.length - 1];
  ctx.strokeStyle = AMBER; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(F.x(toX(a.x) - (toX(c.x) - toX(a.x)) * 0.25), F.y(toY(a.y) - (toY(c.y) - toY(a.y)) * 0.25));
  ctx.lineTo(F.x(toX(c.x) + (toX(c.x) - toX(a.x)) * 0.25), F.y(toY(c.y) + (toY(c.y) - toY(a.y)) * 0.25)); ctx.stroke();
  ctx.setLineDash([]);
  p.pts.forEach(q => {
    ctx.fillStyle = TEXT; ctx.beginPath(); ctx.arc(F.x(toX(q.x)), F.y(toY(q.y)), Math.max(3, F.len(0.7)), 0, Math.PI * 2); ctx.fill();
    say(ctx, q.label, F.x(toX(q.x) + 1.5), F.y(toY(q.y) - 3.2), F.size(1.6, 4.4), { color: AMBER, weight: 700 });
  });
  say(ctx, p.xLabel, F.x(gx + gw / 2), F.y(gy + gh + 3), F.size(1.6, 4.2), { align: 'center', color: DIM });
  say(ctx, p.yLabel, F.x(gx - 1), F.y(gy + 1.5), F.size(1.6, 4.2), { align: 'right', color: DIM });
}

registerFixture('arrplot', { paint: paintArrplot });
