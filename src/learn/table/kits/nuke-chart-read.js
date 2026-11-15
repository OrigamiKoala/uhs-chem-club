/**
 * kits/nuke-chart-read.js — what the chart of nuclides (`nchart`) holds, read without drawing: the square picked, the marker of a walk,
 * the move chosen from the legend. Pure; shared by the chart's painter, the nucleus view that follows it, and the quests' checks.
 */

import { stepOf } from '../../engine/nucdata.js';

export const MOVES = Object.freeze(['alpha', 'beta', 'positron']);

/** The grid's columns (protons) and rows (neutrons). */
export const chartDims = f => ({ z0: f.props.z[0], z1: f.props.z[1], n0: f.props.n[0], n1: f.props.n[1], cols: f.props.z[1] - f.props.z[0] + 1, rows: f.props.n[1] - f.props.n[0] + 1 });

/** The walk's marker: the start moved by every step taken, in order. */
export function walkAt(f) {
  let Z = f.props.start.Z; let N = f.props.start.N;
  const path = [{ Z, N }];
  for (const c of f.props.path || '') {
    const s = stepOf(c === 'a' ? 'alpha' : 'beta');
    Z += s.dZ; N += s.dN; path.push({ Z, N });
  }
  return { Z, N, path, alphas: (f.props.path || '').split('').filter(c => c === 'a').length, betas: (f.props.path || '').split('').filter(c => c === 'b').length };
}

/** The square picked on a chart (`{ Z, N }`), the walk's marker, or null. A `columns` chart picks a whole element (`{ Z }`). */
export function chartPick(state, id) {
  const f = state.fixtures?.[id];
  if (!f) return null;
  if (f.props.mode === 'walk') return walkAt(f);
  const v = Math.round(f.dials.pick?.value || 0);
  if (!v) return null;
  const d = chartDims(f);
  if (f.props.mode === 'columns') return { Z: d.z0 + v - 1, N: null };
  const i = v - 1;
  return { Z: d.z0 + (i % d.cols), N: d.n0 + Math.floor(i / d.cols) };
}
/** The legend's move chosen (a DECAY key) or null. */
export function chartMove(state, id) {
  const v = Math.round(state.fixtures?.[id]?.dials?.move?.value || 0);
  return v ? MOVES[v - 1] : null;
}
/** The dial value that picks square (Z, N) on a chart: what a script sets. */
export function pickValue(f, Z, N) {
  const d = chartDims(f);
  return f.props.mode === 'columns' ? Z - d.z0 + 1 : (N - d.n0) * d.cols + (Z - d.z0) + 1;
}
