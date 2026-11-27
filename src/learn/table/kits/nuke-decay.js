/**
 * kits/nuke-decay.js — Cinder Halo's decaying sample (`ndecay`).
 *
 * One or two grids of nuclei on one clock. Each nucleus decays at its own moment (`decayTimes` in `nucdata.js`: the moments are spread so
 * a grid keeps to the large-sample law, and the fixture says so); a decayed nucleus is drawn dark. "Wait" moves the clock one step on,
 * "Back" one step back. Beside the grid a plot of what is left (or of its natural log, a straight line for first-order decay) fills in
 * point by point as the clock moves; nothing is drawn ahead of the clock. In counter mode the rig prints a count rate (in step with the
 * nuclei left) instead of a count of nuclei.
 */

import { decayTimes, gridLeft } from '../../engine/nucdata.js';
import { registerFixture } from './nuke-registry.js';
import { C, frameOf, say, title, foot, box, key, keyRow, progress, commas, clamp } from './nuke-draw.js';

/**
 * @param {object} o `grids` [{ N0, seed, label }]; `half` the half-life in clock units; `unit` the clock's unit word (singular);
 *   `step` clock units per tap; `max` the clock's end; `plot` 'count' | 'ln' | null; `rate` a count rate at time 0 (counter mode) with
 *   `rateUnit`, `rateDp` decimals.
 */
export function ndecayFixture(id, at, { grids = [{ N0: 256, seed: 7 }], half, unit = 'day', step = 1, bigStep = 0, max = 24, plot = 'count', rate = null, rateUnit = 'counts per minute', rateDp = 0, w = 116, h = 58, title: ttl = 'Decaying sample' } = {}) {
  return {
    id, kind: 'ndecay', label: ttl, at: { ...at }, size: { w, h }, noRun: true,
    dials: { t: { min: 0, max: Math.round(max / step), step: 1, value: 0, label: 'Clock' } },
    props: { grids, half, unit, step, bigStep, max, plot, rate, rateUnit, rateDp, hidden: ['t'] }
  };
}
/** The clock's time, in its units. */
export const clockOf = (state, id) => Math.round(state.fixtures[id].dials.t.value) * state.fixtures[id].props.step;
/** Nuclei left in grid `g` at time `t`. */
export function leftIn(f, g, t) {
  const G = f.props.grids[g];
  return gridLeft(decayTimes(G.N0, f.props.half, G.seed ?? 7), t);
}
/** The count rate at time `t` (counter mode): in step with the nuclei left, by the law. */
export const rateAt = (f, t) => f.props.rate * Math.pow(2, -t / f.props.half);
export const decayRead = (state, id) => { const f = state.fixtures[id]; const t = clockOf(state, id); return { t, left: f.props.grids.map((_, g) => leftIn(f, g, t)), rate: f.props.rate != null ? rateAt(f, t) : null }; };

const plural = (n, word) => `${word}${n === 1 ? '' : 's'}`;
const keysOf = f => {
  const wait = `Wait ${f.props.step === 1 ? '1' : commas(f.props.step)} ${plural(f.props.step, f.props.unit)}`;
  const labels = ['Back', wait];
  const steps = [-1, 1];
  if (f.props.bigStep) {
    labels.push(`Wait ${commas(f.props.bigStep * f.props.step)} ${plural(f.props.bigStep * f.props.step, f.props.unit)}`);
    steps.push(f.props.bigStep);
  }
  const zs = keyRow(labels, 0, 1.0, { h: 4.6 });
  const width = zs[zs.length - 1].x1;
  return zs.map((z, i) => ({ ...z, x0: z.x0 + f.size.w - width - 2, x1: z.x1 + f.size.w - width - 2, step: steps[i], text: labels[i] }));
};
const fmtRate = (f, v) => (f.props.rateDp ? v.toFixed(f.props.rateDp) : commas(v));

function paintDecay(ctx, f, state, b) {
  const F = frameOf(b);
  const p = f.props;
  title(ctx, f, F, b);
  for (const z of keysOf(f)) key(ctx, F, z, z.text);
  const steps = Math.round(f.dials.t.value);
  const t = steps * p.step;
  // The grids, left of the plot. A nucleus that has decayed since the clock last moved fades as the change plays.
  const k = progress(`${f.id}:clock`, b, steps + 1, 1.2);
  const gTop = 8; const gH = f.size.h - gTop - 9;
  const gW = Math.min(gH, (f.size.w * 0.42) / p.grids.length - 2);
  p.grids.forEach((G, gi) => {
    const times = decayTimes(G.N0, p.half, G.seed ?? 7);
    const side = Math.round(Math.sqrt(G.N0));
    const gx = 2.5 + gi * (gW + 3); const cell = gW / side;
    box(ctx, F, gx - 0.4, gTop - 0.4, gW + 0.8, gW + 0.8, C.win, C.steel);
    for (let i = 0; i < G.N0; i++) {
      const x = gx + (i % side + 0.5) * cell; const y = gTop + (Math.floor(i / side) + 0.5) * cell;
      const gone = times[i] <= t + 1e-9;
      const justNow = gone && times[i] > t - p.step + 1e-9 && k < 1;
      ctx.fillStyle = gone ? (justNow ? `rgba(201,147,62,${(1 - k).toFixed(2)})` : '#3a3630') : C.alpha;
      ctx.beginPath(); ctx.arc(F.x(x), F.y(y), Math.max(1.2, F.len(cell * 0.36)), 0, Math.PI * 2); ctx.fill();
    }
    const left = gridLeft(times, t);
    say(ctx, p.rate != null ? `${G.label || ''}` : `${commas(left)} of ${commas(G.N0)} left`, F.x(gx + gW / 2), F.y(gTop + gW + 2.6), F.size(1.7, 6.2), { align: 'center', color: C.text, weight: 600, maxW: F.len(gW + 2) });
  });
  // The clock and (counter mode) the count rate.
  const clock = `${commas(t)} ${plural(t, p.unit)}`;
  foot(ctx, f, F, p.rate != null ? `${clock} · count rate ${fmtRate(f, rateAt(f, t))} ${p.rateUnit}` : `Clock: ${clock}. With only a few nuclei, the numbers would jump around.`, C.text);
  if (!p.plot) return;
  // The plot: what is left (fraction left when comparing two sample sizes, so both share the same curve), or ln of it.
  const px0 = 2.5 + p.grids.length * (gW + 3) + 6; const px1 = f.size.w - 3; const py0 = 9; const py1 = f.size.h - 11;
  box(ctx, F, px0, py0, px1 - px0, py1 - py0, null, C.dim);
  const N0 = p.grids[0].N0;
  const fracMode = p.grids.length > 1 && p.plot !== 'ln' && p.rate == null;
  const yOf = (n, gN0 = N0) => {
    if (p.plot === 'ln') return py1 - (Math.log(Math.max(n, 1)) / Math.log(N0)) * (py1 - py0);
    if (fracMode) return py1 - (n / gN0) * (py1 - py0);
    const top = p.rate != null ? p.rate : N0;
    return py1 - (n / top) * (py1 - py0);
  };
  const xOf = tt => px0 + (tt / p.max) * (px1 - px0);
  say(ctx, p.plot === 'ln' ? 'ln(nuclei left)' : fracMode ? 'Fraction left (0 to 1)' : p.rate != null ? 'Count rate' : 'Nuclei left', F.x(px0 + 0.8), F.y(py0 + 1.8), F.size(1.7, 6.5), { color: C.dust });
  say(ctx, `${p.unit[0].toUpperCase()}${p.unit.slice(1)}s →`, F.x(px1), F.y(py1 + 2.2), F.size(1.7, 6.5), { align: 'right', color: C.dust });
  say(ctx, '0', F.x(px0), F.y(py1 + 2.2), F.size(1.6, 6), { color: C.dim });
  say(ctx, commas(p.max), F.x(px1 - 9), F.y(py1 + 2.2), F.size(1.6, 6), { align: 'right', color: C.dim });
  p.grids.forEach((G, gi) => {
    const times = decayTimes(G.N0, p.half, G.seed ?? 7);
    ctx.fillStyle = gi ? C.e : C.amber;
    for (let s = 0; s <= steps; s++) {
      const tt = s * p.step;
      const v = p.rate != null ? rateAt(f, tt) : gridLeft(times, tt);
      const y = yOf(v, G.N0);
      ctx.fillRect(F.x(xOf(tt)) - (gi ? 1.2 : 2.0), F.y(clamp(y, py0, py1)) - (gi ? 1.2 : 2.0), gi ? 2.4 : 4, gi ? 2.4 : 4);
    }
  });
}

registerFixture('ndecay', {
  paint: paintDecay,
  live: () => true,
  tapZones: f => keysOf(f).map(z => ({ x0: z.x0, x1: z.x1, y0: z.y0, y1: z.y1, dial: 't', step: z.step }))
});
