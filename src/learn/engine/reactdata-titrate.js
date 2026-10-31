/**
 * reactdata-titrate.js — The planners of Kettle's q7-titrate (titration, CED 4.6). PURE: no DOM, no kit.
 *
 * Built on `reactdata.js` `titrate` (strong acid against strong base: moles left, pH, equivalence volume) and `indicatorColour`;
 * nothing there is changed. Every reading the burette bench shows (what is left in the flask, the colour an indicator shows, the
 * volume at which it first changes, the concentration a reading gives) is the answer of a function here.
 *
 * A SYSTEM is `{ acid: {M, mL, nH}, base: {M, nOH} }`: `M` in mol/L, `mL` the flask's acid, `nH` the H⁺ each acid particle gives
 * (HCl 1, H₂SO₄ 2), `nOH` the OH⁻ each base particle gives. Strong against strong, both fully split, which is all the bench uses.
 * Water's own ions are ignored away from the equivalence point, as the planner in `reactdata.js` does.
 *
 * PERMANGANATE. 5 Fe²⁺ + MnO₄⁻ + 8 H⁺ → 5 Fe³⁺ + Mn²⁺ + 4 H₂O in acid in plenty: 5 mol of iron(II) to 1 mol of permanganate.
 * Permanganate is purple and its product is nearly colourless, so the first purple that stays is the end: purple means some
 * permanganate has nothing left to meet.
 */

import { titrate, indicatorColour } from './reactdata.js';

const round = (x, d = 9) => Math.round(x * 10 ** d) / 10 ** d;

/** What a burette holds, and the smallest step the bench's dial makes. */
export const BURETTE_ML = 50;

/** Moles of H⁺ the flask's acid holds. */
export const acidMoles = sys => (sys.acid.M * sys.acid.mL * (sys.acid.nH || 1)) / 1000;

/** The volume of base (mL) at which the moles of OH⁻ added equal the moles of H⁺ in the flask. */
export const equivalenceMl = sys => titrate(sys.acid, sys.base, 0).equivalenceMl;

/**
 * The flask after `vMl` of base, seen through `indicator` (or none). `left` is positive for acid still in the flask and negative for
 * base in excess. `colour` is the indicator's colour word, or 'colourless' with none. The pH is the planner's, used only to pick a colour.
 */
export function flaskAt(sys, vMl, indicator = null) {
  const t = titrate(sys.acid, sys.base, vMl);
  const colour = indicator ? indicatorColour(indicator, t.pH) : 'colourless';
  return {
    vMl, nH: t.nH, nOH: t.nOH, left: t.left,
    acidLeft: Math.max(0, t.left), baseLeft: Math.max(0, -t.left),
    colour, equivalenceMl: t.equivalenceMl, liters: t.liters
  };
}

/**
 * The first volume on a grid of `stepMl` (stepMl, 2 stepMl, ...) at which `indicator` shows a colour other than the one it shows
 * with no base added; null when it never changes within the burette.
 */
export function endpointMl(sys, indicator, stepMl = 0.5) {
  const start = flaskAt(sys, 0, indicator).colour;
  const n = Math.round(BURETTE_ML / stepMl);
  for (let k = 1; k <= n; k++) {
    const v = round(k * stepMl, 6);
    if (flaskAt(sys, v, indicator).colour !== start) return v;
  }
  return null;
}

/** The acid's concentration (mol/L) from the base used: moles of OH⁻, shared among the H⁺ of the acid, over the acid's volume. */
export const acidMolarity = (base, vBaseMl, acidMl, nH = 1) => (base.M * (base.nOH || 1) * vBaseMl) / (acidMl * nH);

/* ------------------------------------------------------------------
   PERMANGANATE AGAINST IRON(II)
   ------------------------------------------------------------------ */

/** Moles of Fe²⁺ per mole of MnO₄⁻. */
export const FE_PER_MN = 5;

/**
 * Iron(II) `{M, mL}` titrated with permanganate `{M}` after `vMl` of it. The colour is 'pale' while iron(II) is left and 'purple'
 * once permanganate is in excess.
 */
export function permanganateAt(fe, mn, vMl) {
  const nFe = (fe.M * fe.mL) / 1000;
  const nMn = (mn.M * vMl) / 1000;
  const feLeft = Math.max(0, nFe - FE_PER_MN * nMn);
  const mnLeft = Math.max(0, nMn - nFe / FE_PER_MN);
  return {
    vMl, nFe: round(nFe), nMn: round(nMn), feLeft: round(feLeft), mnLeft: round(mnLeft),
    colour: mnLeft > 1e-12 ? 'purple' : 'pale',
    equivalenceMl: round((nFe / FE_PER_MN / mn.M) * 1000, 6)
  };
}

/** The first volume on a grid at which the flask shows permanganate's own purple. */
export function permanganateEndMl(fe, mn, stepMl = 0.5) {
  const n = Math.round(BURETTE_ML / stepMl);
  for (let k = 1; k <= n; k++) {
    const v = round(k * stepMl, 6);
    if (permanganateAt(fe, mn, v).colour === 'purple') return v;
  }
  return null;
}

/** The iron(II) concentration (mol/L) a permanganate volume gives. */
export const ironMolarity = (mn, vMl, feMl) => (FE_PER_MN * mn.M * vMl) / feMl;
