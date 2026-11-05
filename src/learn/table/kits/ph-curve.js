/**
 * kits/ph-curve.js — the curve plotter, registered on the ph kit (`ph-registry.js`). Verdigris's titration bench (`q6-titrate`).
 *
 *   CURVE  a flat plot of pH (up) against the mL poured (across). It draws only the readings the burette has written on the paper strip
 *          (`ph-burette.js`: label "<burette>|<flask>"), a dot for each pour joined by straight lines, so a stretch that was poured in one
 *          big measure is a straight line and a curve holds nothing the player did not pour. With `mark` it carries a volume mark the
 *          player sets (a vertical line on the volume axis); with `log` it lists the latest readings beside the plot.
 *
 * A THIN WRAPPER: the points are the recorder's rows, which are the planner's pH at the volume poured. Flat at 3D On and Off alike.
 */

import { PLATE_COLORS } from '../../engine/plates.js';
import { registerFixture } from './ph-registry.js';
import { frameOf } from './matter-draw.js';
import { put, ionText } from './ph-flask.js';
import { fmt } from '../../engine/phdata.js';
import { mlText } from './ph-burette.js';
import './ph-curve-tour.js';

const DUST = PLATE_COLORS.dust;
const DIM = PLATE_COLORS.dim;
const STEEL = PLATE_COLORS.steel;
const AMBER = PLATE_COLORS.amber;
export const CURVE_INKS = Object.freeze(['#dcd6cc', '#78a142']);
const LOG_W = 27;

/** The readings of one flask of a burette, in the order they were poured. */
export const curveRows = (state, bid, k) => state.recorder.rows.filter(r => r.label === `${bid}|${k}`);

/** The plot's rectangle inside the fixture (table units from its top left). */
export function plotRect(f) {
  const p = f.props;
  const top = p.mark ? 14 : 8;
  const x0 = 9; const x1 = f.size.w - 3 - (p.log ? LOG_W : 0);
  return { x0, x1, y0: top, y1: f.size.h - 8, w: x1 - x0, h: f.size.h - 8 - top };
}

function paintCurve(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  const R = plotRect(f);
  const X = mL => R.x0 + (mL / p.xMax) * R.w;
  const Y = pH => R.y1 - (pH / 14) * R.h;
  ctx.fillStyle = '#100f0c'; ctx.fillRect(F.x(R.x0), F.y(R.y0), F.len(R.w), F.len(R.h));
  ctx.strokeStyle = 'rgba(140,131,118,0.28)';
  for (let v = 0; v <= 14; v += 2) {
    ctx.beginPath(); ctx.moveTo(F.x(R.x0), F.y(Y(v))); ctx.lineTo(F.x(R.x1), F.y(Y(v))); ctx.stroke();
    put(ctx, String(v), F.x(R.x0 - 1.4), F.y(Y(v)), F.size(2.0, 6), { align: 'right', color: DUST });
  }
  for (let m = 0; m <= p.xMax + 1e-9; m += p.xTick) {
    ctx.beginPath(); ctx.moveTo(F.x(X(m)), F.y(R.y1)); ctx.lineTo(F.x(X(m)), F.y(R.y1 + 1.2)); ctx.stroke();
    put(ctx, String(m), F.x(X(m)), F.y(R.y1 + 3.2), F.size(2.0, 6), { color: DUST });
  }
  ctx.strokeStyle = STEEL; ctx.strokeRect(Math.round(F.x(R.x0)) + 0.5, Math.round(F.y(R.y0)) + 0.5, Math.round(F.len(R.w)), Math.round(F.len(R.h)));
  put(ctx, 'pH', F.x(2.4), F.y(R.y0 + 1.6), F.size(2.2, 6.4), { color: DUST, weight: 700, align: 'left' });
  put(ctx, 'mL poured', F.x(R.x1), F.y(f.size.h - 1.6), F.size(2.0, 6), { color: DIM, align: 'right' });
  const all = p.series.map((s, k) => ({ s, rows: curveRows(state, p.burette, s.sample) }));
  all.forEach(({ s, rows }, k) => {
    const ink = CURVE_INKS[k % CURVE_INKS.length];
    ctx.strokeStyle = ink; ctx.lineWidth = Math.max(1.6, F.len(0.4)); ctx.beginPath();
    rows.forEach((r, i) => { const px = F.x(X(r.x)); const py = F.y(Y(r.y)); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke(); ctx.lineWidth = 1;
    ctx.fillStyle = ink;
    for (const r of rows) { ctx.beginPath(); ctx.arc(F.x(X(r.x)), F.y(Y(r.y)), Math.max(2, F.len(0.7)), 0, Math.PI * 2); ctx.fill(); }
    if (p.series.length > 1) {
      const lx = R.x0 + 2 + k * 30; const ly = R.y0 + 2.4;
      ctx.fillStyle = ink; ctx.fillRect(F.x(lx), F.y(ly) - 3, 6, 6);
      put(ctx, ionText(s.name), F.x(lx + 1.6), F.y(ly), F.size(2.0, 6), { align: 'left', color: DUST });
    }
  });
  if (p.mark) {
    const m = f.dials.mark.value;
    if (m > 0) {
      ctx.strokeStyle = AMBER; ctx.lineWidth = Math.max(1.6, F.len(0.4));
      ctx.beginPath(); ctx.moveTo(F.x(X(m)), F.y(R.y0)); ctx.lineTo(F.x(X(m)), F.y(R.y1)); ctx.stroke(); ctx.lineWidth = 1;
    }
  }
  if (p.log) {
    const lx = f.size.w - LOG_W + 1;
    put(ctx, 'mL', F.x(lx + 1), F.y(R.y0 + 1.6), F.size(2.0, 6), { align: 'left', color: DIM });
    all.forEach(({ s }, k) => put(ctx, ionText(s.short || s.name), F.x(lx + 11 + k * 8), F.y(R.y0 + 1.6), F.size(1.8, 5.6), { align: 'left', color: CURVE_INKS[k % 2], maxW: F.len(8) }));
    const n = Math.floor((R.h - 4) / 3.4);
    const base = all[0].rows;
    const first = Math.max(0, base.length - n);
    base.slice(first).forEach((r, i) => {
      const y = R.y0 + 5.6 + i * 3.4;
      put(ctx, mlText(r.x), F.x(lx + 1), F.y(y), F.size(2.0, 6), { align: 'left', color: DUST });
      all.forEach(({ rows }, k) => {
        const q = rows[first + i];
        if (q) put(ctx, fmt(q.y, 2), F.x(lx + 11 + k * 8), F.y(y), F.size(2.0, 6), { align: 'left', color: CURVE_INKS[k % 2] });
      });
    });
  }
}

registerFixture('phcurve', { paint: paintCurve });

/**
 * The plotter. `burette`: the burette fixture's id; `series`: [{ sample, name, short? }] (flasks to draw, in ink order); `xMax` the mL the
 * axis runs to; `mark: true` adds the volume mark dial; `log: true` the list of readings. At least 36 by 22 units of plot.
 */
export function curveFixture(id, at, { burette, series, xMax = 50, xTick = 10, mark = false, log = false, w = 96, h = 64, title = 'Curve' } = {}) {
  return {
    id, kind: 'phcurve', label: title, at: { ...at }, size: { w, h }, noRun: true,
    dials: mark ? { mark: { min: 0, max: xMax, step: 0.5, value: 0, label: 'Mark at (mL)' } } : {},
    props: { backdrop: true, burette, series, xMax, xTick, mark, log }
  };
}
