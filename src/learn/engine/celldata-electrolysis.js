/**
 * THE ELECTROLYSIS PLANNERS — Brinewire `q6-electrolysis`. Pure; no DOM. Imports `celldata.js` (the constants and the Faraday functions) and
 * adds what the supply bench needs: a cell driven against its own voltage, a plating run, a chain of cells in series driving water, the
 * gases of three electrolysis cells.
 *
 * MODEL (stated on the bench where it matters): ideal electrodes, no overpotential (a gas forms as soon as the supply exceeds the cell's
 * back voltage); a total circuit resistance of 2.0 Ω in every driven run; gas volumes at 25 °C and 1 bar, 24.79 L/mol, all gas collected.
 */

import { METALS, FARADAY, cellE0, faradayMass, WATER_BACK_VOLTAGE } from './celldata.js';

/** Resistance of the whole circuit in a driven run, ohms (a stated simplification: it turns a voltage into a current). */
export const CIRCUIT_R = 2.0;
/** Molar volume of a gas at 25 °C and 1 bar, litres per mole. */
export const MOLAR_VOLUME = 24.79;
/** The time of a driven run on the zinc–copper and water benches, seconds. */
export const RUN_SECONDS = 60;

/**
 * The zinc–copper cell wired to a supply (stage 1). `dir` is where the supply pushes electrons: into the 'zn' strip (against the cell's own
 * push) or into the 'cu' strip (with it). The cell alone pushes electrons from zinc to copper with `cellE0('cu','zn')` volts. Returns the
 * net push in the cell's own direction, the current, and the mass change of each strip in grams over `t` seconds (positive = gained).
 */
export function driveZnCu(Vs, dir, t = RUN_SECONDS) {
  const E = cellE0('cu', 'zn');
  const net = dir === 'zn' ? E - Vs : E + Vs;
  const I = Math.abs(net) / CIRCUIT_R;
  const natural = net > 1e-9;
  const mZn = faradayMass(I, t, 'zn');
  const mCu = faradayMass(I, t, 'cu');
  return { net, I, t, natural, zn: natural ? -mZn : mZn, cu: natural ? mCu : -mCu, zincPlates: net < -1e-9 };
}

/** A plating run: the charge passed (C), the moles of electrons and the grams plated by a constant current for t seconds. */
export function platingRun(metalId, I, t) {
  const q = I * t;
  return { q, molE: q / FARADAY, g: faradayMass(I, t, metalId) };
}

/** The current (A) that plated `g` grams of a metal in `t` seconds, by Faraday's law. */
export function currentFor(metalId, g, t) {
  const m = METALS[metalId];
  return (g * m.n * FARADAY) / (m.M * t);
}

/** Volume of a gas in mL from moles. */
export const gasML = mol => mol * MOLAR_VOLUME * 1000;

/**
 * `k` zinc–copper cells in series driving the water cell for `t` seconds: the chain's voltage, whether it exceeds the back voltage, the
 * current ((V − back) / R) and the volumes of hydrogen (2 electrons per H₂) and oxygen (4 per O₂) in mL.
 */
export function waterRun(k, t = RUN_SECONDS) {
  const V = k * cellE0('cu', 'zn');
  const goes = V > WATER_BACK_VOLTAGE + 1e-9;
  const I = goes ? (V - WATER_BACK_VOLTAGE) / CIRCUIT_R : 0;
  const molE = (I * t) / FARADAY;
  return { k, V, goes, I, t, h2: gasML(molE / 2), o2: gasML(molE / 4) };
}

/** Stage 7: water and brine on the same supply (constant `I` for `t` seconds). Volumes in mL per tube. */
export function compareRun(I, t) {
  const molE = (I * t) / FARADAY;
  return {
    q: I * t,
    water: { cathode: { gas: 'H₂', mL: gasML(molE / 2) }, anode: { gas: 'O₂', mL: gasML(molE / 4) } },
    brine: { cathode: { gas: 'H₂', mL: gasML(molE / 2) }, anode: { gas: 'Cl₂', mL: gasML(molE / 2) } }
  };
}

/** The products of the molten sodium chloride cell when the supply pushes electrons into the electrode named: sodium forms there. */
export function meltRun(into) {
  return {
    sodiumAt: into,
    chlorineAt: into === 'left' ? 'right' : 'left'
  };
}

/** The voltage molten sodium chloride needs before it splits, with no overpotential: −E°(Na⁺/Na) + E°(Cl₂/Cl⁻) taken as a size, volts. */
export const MELT_BACK_VOLTAGE = 2.71 + 1.36;
