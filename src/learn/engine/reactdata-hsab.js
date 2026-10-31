/**
 * reactdata-hsab.js — Hard Soft Acid Base (HSAB) chemistry for Kettle's q9-hsab bench.
 *
 * PURE: no DOM, no kit, no THREE. Built over `reactdata.js` (`IONS`, `ionicFormula`, `solubility`).
 *
 * HSAB PRINCIPLE:
 *  - Hard acids (cations): small radius, high charge density, rigid electron clouds with low polarizability.
 *  - Hard bases (anions): small radius, electronegative, non-polarizable clouds.
 *  - Soft acids (cations): large radius, diffuse polarizable electron clouds.
 *  - Soft bases (anions): large radius, easily deformed (squishy) electron clouds.
 *
 * PREDICTION OF REACTIONS AND SOLUBILITY:
 *  - Hard-hard pairs form strong ionic/electrostatic bonds with high lattice energy (e.g. CaF2).
 *  - Soft-soft pairs form strong covalent bonds via orbital overlap (e.g. AgI, Ag2S, PbS).
 *  - Mismatched pairs (hard-soft or soft-hard) are relatively weak; in polar water, hydration easily
 *    outweighs their interaction, keeping them dissolved (e.g. CaI2, AgF, CaS, MgS).
 *  - When mismatched soluble salts meet in water, ions swap partners (metathesis) to pair like with like,
 *    driving precipitation of the matched products.
 */

import { IONS, ionicFormula, solubility, pretty } from './reactdata.js';

export const HSAB_DATA = Object.freeze({
  Ca: { hard: true, role: 'acid', radius: 100, cloud: 'rigid', polarizability: 'low' },
  Mg: { hard: true, role: 'acid', radius: 72, cloud: 'rigid', polarizability: 'low' },
  Ag: { hard: false, role: 'acid', radius: 115, cloud: 'squishy', polarizability: 'high' },
  Pb2: { hard: false, role: 'acid', radius: 119, cloud: 'squishy', polarizability: 'high' },
  F: { hard: true, role: 'base', radius: 133, cloud: 'rigid', polarizability: 'low' },
  OH: { hard: true, role: 'base', radius: 137, cloud: 'rigid', polarizability: 'low' },
  I: { hard: false, role: 'base', radius: 220, cloud: 'squishy', polarizability: 'high' },
  S: { hard: false, role: 'base', radius: 184, cloud: 'squishy', polarizability: 'high' }
});

export const PRECIPITATE_COLORS = Object.freeze({
  CaF2: { color: 'white', ink: '#e6e2da' },
  AgI: { color: 'bright yellow', ink: '#d6c24a' },
  Ag2S: { color: 'black', ink: '#2a2622' },
  PbS: { color: 'black', ink: '#242220' },
  MgF2: { color: 'white', ink: '#e6e2da' },
  PbI2: { color: 'yellow', ink: '#d9b61c' }
});

/** Probe an ion: reports its cloud firmness and polarizability. */
export function probeIon(ionId) {
  const d = HSAB_DATA[ionId];
  if (!d) throw new Error(`reactdata-hsab: unknown ion ${ionId}`);
  return {
    ion: ionId,
    hard: d.hard,
    role: d.role,
    cloud: d.cloud,
    polarizability: d.polarizability,
    deformation: d.hard ? 0.08 : 0.65
  };
}

/** Check if an ion is classified as hard. */
export const isHard = ionId => Boolean(HSAB_DATA[ionId]?.hard);

/**
 * Predict interaction outcome between a cation and an anion:
 * match type, whether it precipitates, precipitate formula, and bond character.
 */
export function pairOutcome(catId, anId) {
  const c = HSAB_DATA[catId];
  const a = HSAB_DATA[anId];
  if (!c || !a) throw new Error(`reactdata-hsab: unknown pair ${catId} / ${anId}`);

  const match = c.hard && a.hard ? 'hard-hard'
    : !c.hard && !a.hard ? 'soft-soft'
    : c.hard ? 'hard-soft' : 'soft-hard';

  const sol = solubility(catId, anId);
  const precipitates = sol === 'insoluble';
  const f = ionicFormula(catId, anId);

  const bondType = match === 'hard-hard' ? 'ionic'
    : match === 'soft-soft' ? 'covalent'
    : 'mismatched';

  const visual = PRECIPITATE_COLORS[f.formula] || (precipitates ? { color: 'white', ink: '#e6e2da' } : null);

  return {
    cat: catId,
    an: anId,
    formula: f.formula,
    text: f.text,
    match,
    precipitates,
    bondType,
    color: visual?.color || null,
    ink: visual?.ink || null
  };
}

/**
 * Double displacement / partner swapping between two salt solutions:
 * (catA + anA) and (catB + anB) swap to form matched pairs.
 */
export function swapOutcome(catA, anA, catB, anB) {
  const originalA = pairOutcome(catA, anA);
  const originalB = pairOutcome(catB, anB);

  const swapped1 = pairOutcome(catA, anB);
  const swapped2 = pairOutcome(catB, anA);

  const matched1 = (swapped1.match === 'hard-hard' || swapped1.match === 'soft-soft') ? swapped1 : originalA;
  const matched2 = (swapped2.match === 'hard-hard' || swapped2.match === 'soft-soft') ? swapped2 : originalB;

  return {
    reactants: [originalA, originalB],
    products: [swapped1, swapped2],
    matchedProducts: [matched1, matched2],
    solids: [swapped1, swapped2].filter(p => p.precipitates)
  };
}

/**
 * Selective precipitation: tests which reagent selectively precipitates
 * the target cation while leaving spectator cations in solution.
 */
export function selectivePrecipitation(targetCat, spectatorCat, reagentAnions) {
  return reagentAnions.map(anId => {
    const targetOut = pairOutcome(targetCat, anId);
    const spectatorOut = pairOutcome(spectatorCat, anId);
    const selective = targetOut.precipitates && !spectatorOut.precipitates;
    return {
      reagent: anId,
      targetPrecipitates: targetOut.precipitates,
      spectatorPrecipitates: spectatorOut.precipitates,
      targetSolid: targetOut.formula,
      selective
    };
  });
}
