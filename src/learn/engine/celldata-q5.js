/**
 * THE PLANNERS OF Q5-LOAD (Brinewire, Under Load) — pure, no DOM. Built on `celldata.js` (`runCell`, `nernst`, `cellVoltage`,
 * `concentrationCell`, `balanceExtent`, `logK`); that file is not edited.
 *
 * A CELL RUN UNDER LOAD. The load draws a current proportional to the cell's voltage, so in each tick the reaction advances by
 * `LOAD.rate × E` mol/L (equal volumes, equal charges, the 1 : 1 mole ratio of `runCell`). The voltage at the new extent is the Nernst
 * voltage of the new ion concentrations. The voltage therefore falls, ever more slowly, toward zero at the balance extent
 * (`balanceExtent`, where Q = K), and the extent never passes it: the factor `rate × |dE/dx|` stays well under 1.
 *
 * SIMPLIFICATIONS (stated on the bench): equal volumes, activities taken as concentrations, a load that draws current in proportion to the
 * voltage, 25 °C, solid electrodes never run out (the tin and lead bars are large). One dot in a window is 0.02 mol/L of that ion.
 */

import { runCell, balanceExtent, logK, cellE0, electronsMoved, concentrationCell, cellVoltage, METALS, RT_F, fmt } from './celldata.js';

/** Constants of the load bench. `rate` mol/L per volt per tick; `perPress` ticks one press of Run advances; `maxTick` ticks the bench allows. */
export const LOAD = Object.freeze({ rate: 4, perPress: 20, maxTick: 40, dotM: 0.02, dotsCap: 100 });

/** The two concentration settings of every dial in this bench (mol/L). */
export const CONC_STEPS = Object.freeze([0.010, 1.0]);

/** Whole dots a concentration is drawn as (one dot is `LOAD.dotM` mol/L). */
export const dotsOf = c => Math.round(c / LOAD.dotM + 1e-9);

/** The run state at `tick`: extent, the two ion concentrations, the voltage and the dot counts. */
export function loadAt(cathodeId, anodeId, { cAnode0 = 1, cCathode0 = 1 } = {}, tick = 0) {
  let x = 0;
  for (let t = 0; t < tick; t++) {
    const E = runCell(cathodeId, anodeId, { cAnode0, cCathode0, x }).E;
    x += LOAD.rate * Math.max(E, 0);
  }
  const r = runCell(cathodeId, anodeId, { cAnode0, cCathode0, x });
  return { tick, x, cAnode: r.anodeIon, cCathode: r.cathodeIon, E: r.E, Q: r.Q, nAnode: dotsOf(r.anodeIon), nCathode: dotsOf(r.cathodeIon) };
}

/** The voltage at every tick from 0 to `tick`: what the plot has drawn so far. */
export function loadTrace(cathodeId, anodeId, start, tick) {
  const out = [];
  let x = 0;
  for (let t = 0; t <= tick; t++) {
    const E = runCell(cathodeId, anodeId, { ...start, x }).E;
    out.push({ t, E });
    x += LOAD.rate * Math.max(E, 0);
  }
  return out;
}

/** A voltage as the load bench prints it: three decimals, a plain zero. */
export const milliText = v => fmt(v, 3);

/** The cell reads zero on the meter (below half a thousandth of a volt). */
export const readsZero = E => milliText(E) === '0.000';

/** The first tick at which the meter reads zero, or null. */
export function firstZeroTick(cathodeId, anodeId, start) {
  const tr = loadTrace(cathodeId, anodeId, start, LOAD.maxTick);
  const hit = tr.find(p => readsZero(p.E));
  return hit ? hit.t : null;
}

/** Ion concentrations at balance (Q = K) for a 1 : 1 cell: the extent the reaction ends at, and K. */
export function balanceOf(cathodeId, anodeId, start) {
  const x = balanceExtent(cathodeId, anodeId, start);
  const K = 10 ** logK(cellE0(cathodeId, anodeId), electronsMoved(cathodeId, anodeId));
  return { x, K, cAnode: (start.cAnode0 ?? 1) + x, cCathode: (start.cCathode0 ?? 1) - x };
}

/** A zinc–copper style cell at set concentrations (open circuit): the Nernst voltage. */
export const readAt = (cathodeId, anodeId, cAnode, cCathode) => cellVoltage(cathodeId, anodeId, { cAnode, cCathode });

/**
 * A concentration cell of one metal in two beakers, `cLeft` and `cRight`. The dilute beaker is the one the electrons leave. Returns the
 * voltage and the side the electrons leave (`'left'`, `'right'`, or null when the two are equal).
 */
export function concCellRead(metalId, cLeft, cRight) {
  const r = concentrationCell(metalId, cLeft, cRight);
  return { E: r.E, leaves: r.anodeSide === 'A' ? 'left' : (r.anodeSide === 'B' ? 'right' : null), n: METALS[metalId].n };
}

/** The voltmeter of a concentration cell, the right bar against the left bar: positive when the right beaker is the more concentrated. */
export const concCellSigned = (metalId, cLeft, cRight) => (RT_F / METALS[metalId].n) * Math.log(cRight / cLeft);

/** A concentration as the bench prints it: 1.0 M, 0.010 M, 0.0010 M. */
export const concLabel = c => (c >= 1 ? c.toFixed(1) : c >= 0.01 ? c.toFixed(3) : c.toFixed(4)) + ' M';
