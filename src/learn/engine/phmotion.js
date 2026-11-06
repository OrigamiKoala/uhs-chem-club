/**
 * engine/phmotion.js — the pure motion of Verdigris's particle windows. No DOM, no THREE.
 *
 * `windowAt(units, ionized, seed, t)` gives, for every cell of a window at clock time `t` seconds, where the particle sits (a small
 * wobble about its cell), whether it is an intact unit or has handed a proton over, and how far a hand-over in progress has got.
 *
 * A solution that has settled is not still. In a weak acid, units hand a proton to water and take it back all the time, and the *share* of
 * units that have let go stays the same; so the cells that are ionized change every `PERIOD` seconds while their count stays the planner's
 * `ionized`. A strong acid has every unit let go, and a very weak one almost none: nothing can swap, so nothing does. The count shown at
 * every settled instant is therefore the graded count (`ionizedCells` in `kits/ph-read.js`); only which cells it is changes.
 */

import { mulberry32 } from './plates.js';

export const PERIOD = 2.6;       // seconds between swaps
const MOVE = 0.45;               // share of a period a hand-over takes
const frac = x => x - Math.floor(x);

/** A fixed shuffle of the cells (the same as `ionizedCells`, so a still window and a moving one agree at rest). */
export function shuffle(units, seed) {
  const order = Array.from({ length: units }, (_, i) => i);
  const g = mulberry32(seed);
  for (let i = units - 1; i > 0; i--) { const j = Math.floor(g() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

/** How many cells swap each period: a quarter of the smaller group, at least one; none when every cell, or no cell, has let go. */
export const swapCount = (units, ionized) => (ionized <= 0 || ionized >= units ? 0 : Math.max(1, Math.round(Math.min(ionized, units - ionized) * 0.25)));

/**
 * Cells at time t: `{ ion, p, dir, wx, wy }` each.
 *   ion  the cell has let go (settled), `dir` +1 a hand-over is under way in it (p 0..1), -1 a take-back is, 0 none
 *   wx, wy  wobble about the cell centre, in half-cells (-0.25..0.25)
 */
export function windowAt(units, ionized, seed, t, order = shuffle(units, seed)) {
  const s = swapCount(units, ionized);
  const k = Math.floor(t / PERIOD);
  const into = frac(t / PERIOD) * PERIOD;
  const p = Math.min(1, into / (PERIOD * MOVE));
  const ionAt = step => {
    const set = new Set();
    for (let j = 0; j < ionized; j++) set.add(order[(step * s + j) % units]);
    return set;
  };
  const prev = ionAt(k - 1 < 0 ? 0 : k - 1); const now = ionAt(k);
  const cells = [];
  for (let i = 0; i < units; i++) {
    const was = k > 0 ? prev.has(i) : now.has(i); const is = now.has(i);
    const dir = was === is ? 0 : (is ? 1 : -1);
    const ph = i * 2.399963;
    cells.push({
      ion: dir === 0 ? is : (p >= 1 ? is : was),
      dir: p >= 1 ? 0 : dir, p,
      wx: Math.sin(t * (1.3 + (i % 5) * 0.17) + ph) * 0.2,
      wy: Math.cos(t * (1.1 + (i % 7) * 0.13) + ph * 1.7) * 0.2
    });
  }
  return cells;
}

/** The count of cells that have let go at the moment `t` (settled cells plus the ones whose hand-over is done). */
export const ionCount = cells => cells.filter(c => (c.dir === 0 ? c.ion : c.dir === -1 ? false : true)).length;

/** A signature for the checks: the picture at `t`. */
export const windowSignature = (units, ionized, seed, t) => JSON.stringify(windowAt(units, ionized, seed, t).map(c => [c.ion, c.dir, +c.p.toFixed(2), +c.wx.toFixed(2), +c.wy.toFixed(2)]));

/** Thermal wobble of particle i at time t, in half-cells: the motion of any window whose count is fixed by something else. */
export const wobble = (i, t) => ({
  wx: Math.sin(t * (1.3 + (i % 5) * 0.17) + i * 2.399963) * 0.2,
  wy: Math.cos(t * (1.1 + (i % 7) * 0.13) + i * 2.399963 * 1.7) * 0.2
});

/**
 * The hydronium and hydroxide in a flask as `n` dots, in the ratio the pH gives: [H₃O⁺] ÷ [OH⁻] = 10^(14 − 2 pH) at 25 °C. At pH 7 the two are
 * equal; each unit of pH away from 7 moves the ratio by a factor of 100, so the dots saturate quickly, as the chemistry does.
 */
export function ionDots(pH, n = 24) {
  const h = Math.pow(10, -pH); const oh = Math.pow(10, pH - 14);
  const nh = Math.max(0, Math.min(n, Math.round((n * h) / (h + oh))));
  return { h: nh, oh: n - nh };
}

/** The tip's drop: 0..1 down its fall `dt` seconds after a pour, or null when it has landed. */
export const dropAt = dt => (dt >= 0 && dt < 0.6 ? dt / 0.6 : null);

/** Painter-only memory for a fixture (a shuffle, the clock a pour began): kept off the fixture, so the table the checks compare stays pure data. */
const SCRATCH = new WeakMap();
export const scratch = (f, key = 'flat') => { if (!SCRATCH.has(f)) SCRATCH.set(f, {}); const m = SCRATCH.get(f); return (m[key] ||= {}); };
