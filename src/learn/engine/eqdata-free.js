/**
 * THE FREE-ENERGY TABLES AND PLANNERS — Teeter bench 8 (`q8-free`, CED 9.5 and 9.7)
 *
 * Pure functions, no DOM; they sit beside `eqdata.js` (which holds `kFromDeltaG`, `iceAmounts`, `coupledDeltaG` and the ATP values)
 * and add the reactions, the salts and the three readings the favourability plotter prints. Nothing a stage shows is typed in by the stage.
 *
 * SIMPLIFICATIONS (stated on the bench or in a reward):
 *   - ΔH° and ΔS° are held constant over the temperatures a stage uses, so ΔG° = ΔH° − TΔS° is a straight line in T.
 *   - K is the dimensionless thermodynamic constant (amounts in mol/L or bar divided by 1 mol/L or 1 bar), so a "pan" of a reaction
 *     settles at the amounts `iceAmounts` gives for that K, starting from reactant alone.
 *   - ΔG° is for standard states; the ATP values are for the biochemical standard state at pH 7.
 *   - Spontaneous in the thermodynamic sense says nothing about speed.
 */

import { kFromDeltaG, iceAmounts, coupledDeltaG, COUPLED } from './eqdata.js';
import { gibbsFreeEnergy, crossingTemperature } from './thermodata.js';

/** The bench temperature, kelvin, printed on every stage that does not move it. */
export const T_BENCH = 298;

/** ΔG° of a column: given outright (`dG`, kJ/mol) or worked out from ΔH° (kJ/mol), ΔS° (J/(mol·K)) and T (K). */
export const dGOf = c => (c.dG != null ? c.dG : gibbsFreeEnergy(c.dH, c.dS, c.T ?? T_BENCH));

/** The amounts a pan of `sys` ({species, start}) settles at when its ΔG° is `dG` kJ/mol at `T` K, and the K it settles at. */
export function settledAt(sys, dG, T = T_BENCH) {
  const K = kFromDeltaG(dG, T);
  return { K, dG, T, amounts: iceAmounts(sys.species, sys.start, K).amounts };
}

/** The reading of a column of the plotter: its ΔG° and what its pan settles at. */
export function columnRead(sys, col) {
  const T = col.T ?? T_BENCH;
  return settledAt(sys, dGOf({ ...col, T }), T);
}

/* ------------------------------------------------------------------ the pans of the first stages: A ⇌ B */

/** A model reaction: one reactant that turns into one product; a pan starts with 1.00 mol/L of the reactant. */
export const MODEL_PAN = Object.freeze({
  species: { A: -1, B: 1 }, start: { A: 1, B: 0 }, names: { A: 'reactant', B: 'product' }, order: ['A', 'B'], unit: 'mol/L'
});

/* ------------------------------------------------------------------ real reactions for the temperature stage (ΔH°, ΔS° from NIST/CRC tables) */

export const WARM = Object.freeze({
  n2o4: {
    id: 'n2o4', eq: 'N₂O₄ ⇌ 2 NO₂', dH: 57.2, dS: 175.8, Ts: [298, 350],
    source: 'ΔH° = 2(33.2) − 9.2 kJ; ΔS° = 2(240.1) − 304.3 J/(mol·K), standard tables',
    sys: { species: { N2O4: -1, NO2: 2 }, start: { N2O4: 1, NO2: 0 }, names: { N2O4: 'N₂O₄', NO2: 'NO₂' }, order: ['N2O4', 'NO2'], unit: 'bar' }
  },
  wgs: {
    id: 'wgs', eq: 'CO + H₂O ⇌ CO₂ + H₂', dH: -41.2, dS: -42.0, Ts: [500, 800],
    source: 'ΔH° = −393.5 − (−110.5 − 241.8) kJ; ΔS° = 213.8 + 130.7 − 197.7 − 188.8 J/(mol·K), standard tables',
    sys: { species: { CO: -1, H2O: -1, CO2: 1, H2: 1 }, start: { CO: 1, H2O: 1, CO2: 0, H2: 0 }, names: { CO: 'CO', H2O: 'H₂O', CO2: 'CO₂', H2: 'H₂' }, order: ['CO', 'H2O', 'CO2', 'H2'], unit: 'bar' }
  }
});

/* ------------------------------------------------------------------ dissolving (1 mol of salt to aqueous ions, 1 mol/L standard state) */

/**
 * ΔH (kJ/mol) and ΔS (J/(mol·K)) of dissolving, worked from the standard enthalpies of formation and standard entropies of the aqueous
 * ions and the solid (CRC Handbook / NBS tables), 298 K.
 */
export const DISSOLVE = Object.freeze({
  nacl:  { id: 'nacl',  name: 'Sodium chloride',  formula: 'NaCl',   dH: 3.9,  dS: 43.4,   source: 'ΔHf: Na⁺ −240.1, Cl⁻ −167.2, NaCl −411.2; S°: 59.0 + 56.5 − 72.1' },
  agcl:  { id: 'agcl',  name: 'Silver chloride',  formula: 'AgCl',   dH: 65.5, dS: 32.9,   source: 'ΔHf: Ag⁺ 105.6, Cl⁻ −167.2, AgCl −127.1; S°: 72.7 + 56.5 − 96.3' },
  baso4: { id: 'baso4', name: 'Barium sulfate',   formula: 'BaSO₄',  dH: 26.3, dS: -102.5, source: 'ΔHf: Ba²⁺ −537.6, SO₄²⁻ −909.3, BaSO₄ −1473.2; S°: 9.6 + 20.1 − 132.2' },
  nh4cl: { id: 'nh4cl', name: 'Ammonium chloride', formula: 'NH₄Cl', dH: 14.8, dS: 75.3,   source: 'ΔHf: NH₄⁺ −132.5, Cl⁻ −167.2, NH₄Cl −314.4 (14.7 to 14.8); S°: 113.4 + 56.5 − 94.6' }
});

/** The two pulls of a change at T: heat taken in (ΔH, kJ/mol) and the spreading worth TΔS (kJ/mol), with the net ΔG = ΔH − TΔS. */
export function pulls(c) {
  const T = c.T ?? T_BENCH;
  const TdS = (T * c.dS) / 1000;
  return { T, dH: c.dH, TdS, dG: c.dH - TdS, K: kFromDeltaG(c.dH - TdS, T) };
}

/** The temperature, kelvin, at which ΔH and TΔS are equal (ΔG = 0), or null when ΔS is zero. */
export const crossing = c => crossingTemperature(c.dH, c.dS);

/** A cold pack: `mol` of the salt dissolved in `waterG` grams of water starting at `T0` °C. The water alone is counted (c = 4.184 J/(g·°C)). */
export function coldPack(salt, { waterG = 500, T0 = 25, mol = 1 } = {}) {
  const dT = -(salt.dH * 1000 * mol) / (waterG * 4.184);
  // Does it all dissolve? The dissolving constant K (from ΔG at 298 K) fixes how much a litre holds: s = √K mol/L for a 1:1 salt.
  const K = pulls({ ...salt, T: T_BENCH }).K;
  return { T0, T1: T0 + dT, dT, K, mol, left: Math.max(0, mol - Math.sqrt(K) * (waterG / 1000)) };
}

/* ------------------------------------------------------------------ coupling (ATP and glucose) */

/** The equation cards of the coupling stage: reactions with species written once so shared ones cancel. */
export const COUPLE = Object.freeze({
  atp: { lhs: [[1, 'ATP'], [1, 'H₂O']], rhs: [[1, 'ADP'], [1, 'Pi']], dG: COUPLED.atp.dG },
  g6p: { lhs: [[1, 'glucose'], [1, 'Pi']], rhs: [[1, 'glucose-6-phosphate'], [1, 'H₂O']], dG: COUPLED.g6p.dG },
  // Phosphocreatine → creatine + Pi, ΔG°′ = −43.1 kJ/mol (Berg, Tymoczko & Stryer): a card that shares Pi but does not make the wanted product.
  pcr: { lhs: [[1, 'phosphocreatine'], [1, 'H₂O']], rhs: [[1, 'creatine'], [1, 'Pi']], dG: -43.1 }
});

/** ΔG° of the pair, kJ/mol (the stack's sum), and K of the pair at 298 K. */
export function coupledPair(...dGs) {
  const dG = coupledDeltaG(...dGs);
  return { dG, K: kFromDeltaG(dG, T_BENCH) };
}
