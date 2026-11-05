/**
 * kits/pans-read.js — what a pan reads: the planners' answer for the tick the pan has been run to. Pure; nothing here is drawn.
 *
 * A pan is a fixture with a hidden dial `t` (ticks of bench time, advanced ten at a time by its Run key). Everything it shows is
 * `simulatePan` read up to that tick, so the drawn and the built table, and a scripted replay, show the same pan.
 */

import { simulatePan, tallyWindow } from '../../engine/eqdata.js';

export const PAN_TICKS = 200;
export const PAN_STEP = 10;
export const TALLY_WINDOW = 50;
/** The ringed particles of a pan with the tracer: eight, spread over the pan, some starting as A and some as B. */
export const TRACERS = Object.freeze([1, 7, 12, 19, 26, 33, 40, 45]);

const CACHE = new Map();

/** The pan's parameters: from its props (a stage's declaration). */
export const systemOf = f => {
  const p = f.props;
  return { n: p.n ?? 48, b0: p.b0 ?? 0, kf: p.kf, kr: p.kr, seed: p.seed ?? 1 };
};

/** The whole run of a pan out to PAN_TICKS, cached by its parameters (the same pan is read many times a frame). */
export function historyOf(sys) {
  const key = `${sys.n}|${sys.b0}|${sys.kf}|${sys.kr}|${sys.seed}`;
  let h = CACHE.get(key);
  if (!h) { h = simulatePan({ ...sys, ticks: PAN_TICKS }); CACHE.set(key, h); if (CACHE.size > 64) CACHE.delete(CACHE.keys().next().value); }
  return h;
}

export function panRead(state, fid) {
  const f = state.fixtures[fid];
  const sys = systemOf(f);
  const hist = historyOf(sys);
  const t = Math.round(f.dials.t.value);
  const b = hist.b[t];
  const a = sys.n - b;
  const tally = tallyWindow(hist, t, TALLY_WINDOW);
  // The level the pan has settled at: the mean of A over the last 20 ticks (null while the run is shorter than 40 ticks).
  let settledA = null;
  if (t >= 40) { let s = 0; for (let i = t - 19; i <= t; i++) s += sys.n - hist.b[i]; settledA = s / 20; }
  // The mean of A over every tick from 40 to now: steadier than the last twenty, for a comparison with a picture.
  let meanA = null;
  if (t >= 60) { let s2 = 0; for (let i = 40; i <= t; i++) s2 += sys.n - hist.b[i]; meanA = s2 / (t - 39); }
  return { sys, hist, t, a, b, n: sys.n, fwd: tally.fwd, rev: tally.rev, settledA, meanA };
}

/** The colour of particle i at tick t: 1 for B. */
export const stateOfParticle = (hist, i, t) => hist.states[t * hist.n + i];

/** The piece standing in a slot, or null. */
export function pieceIn(state, slotId) {
  return Object.values(state.pieces).find(p => p.zone === `slot:${slotId}` && !p.hidden) || null;
}

/** The value a marker or selector fixture is set to. */
export const dialValue = (state, fid, name = 'value') => state.fixtures[fid]?.dials?.[name]?.value;
