/**
 * THE DIP RACK'S PLANNERS — Brinewire `q2-activity` (Which Metal Gives). Pure, no DOM; imports `celldata.js` and edits nothing in it.
 *
 * A strip dipped in a beaker comes out in one of three ways: coated with the metal of the solution, bubbling (an acid beaker), or clean.
 * Every one is `celldata.js`: `displaces` (the ion's E° is above the strip's), `givesHydrogen`, `protectsIron`. The mixed beaker
 * (copper(II) and iron(II) together) is the same test twice, once for each ion; the ions left in it are counted from the swap, one
 * dipped metal ion for each ion of charge-for-charge swapped out.
 *
 * SIMPLIFICATIONS (said on the bench where they matter): 1 M solutions, every strip left in long enough to finish; one bubble pattern
 * for every metal that gives hydrogen (real rates differ); a bare nail also rusts slowly, which the nails show only as the spots that
 * wiring to a less active metal adds.
 */

import { METALS, displaces, givesHydrogen, protectsIron, takesOutOnly, activityOrder } from './celldata.js';

/** The mixed beaker's starting ions: counted particles, equal numbers of each. */
export const MIX_START = Object.freeze({ cu: 6, fe: 6 });

/** The ions a dipped strip puts in a solution when it takes the place of ions of charge `q`: charge for charge. */
const swapIn = (stripId, count, q) => (count * q) / METALS[stripId].n;

/**
 * What a strip shows after a dip in a beaker. `beaker` is a metal id (a solution of that metal's ions), `'acid'` or `'mix'`.
 * Returns `{ coats: [metal ids on the strip, in the order of the beaker's ions], gas, ions }`; `ions` is the particle count in a
 * mixed beaker after the dip, by metal id (null for the others).
 */
export function dipResult(stripId, beaker) {
  if (beaker === 'acid') return { coats: [], gas: givesHydrogen(stripId), ions: null };
  if (beaker === 'mix') {
    const coats = Object.keys(MIX_START).filter(m => displaces(stripId, m));
    const ions = { ...MIX_START };
    for (const m of coats) {
      const gone = ions[m]; delete ions[m];
      ions[stripId] = (ions[stripId] || 0) + swapIn(stripId, gone, METALS[m].n);
    }
    return { coats, gas: false, ions };
  }
  return { coats: displaces(stripId, beaker) ? [beaker] : [], gas: false, ions: null };
}

/** The colour name of a coating, from the metal that formed it. */
export const coatName = metalId => METALS[metalId].deposit;

/** What the window says in a few plain words: the colour of the coating, "bubbles" or "clean". */
export function dipWords(res) {
  if (res.coats.length) return res.coats.map(coatName).join(' and ');
  return res.gas ? 'bubbles' : 'clean';
}

/** Does this dip leave the strip coated (the planner's `displaces`, read through the picture)? */
export const coated = (stripId, beaker) => dipResult(stripId, beaker).coats.length > 0;

/** The partners of the nail stage that keep it from rusting, and how many blue spots a nail shows after its week. */
export const NAIL_SPOTS = 5;
export const nailSpots = partnerId => (protectsIron(partnerId) ? 0 : NAIL_SPOTS);
export const protectingPartners = ids => ids.filter(protectsIron);

/** The strips that take `wanted` out of the mixed beaker and leave `kept` ions in it. */
export const stripsTakingOnly = (ids, wanted, kept) => ids.filter(m => takesOutOnly(m, wanted, kept));

/** Hydrogen's place among metals: the metals that bubbled belong before it, the others after it. */
export const hydrogenSide = ids => ({ before: ids.filter(givesHydrogen), after: ids.filter(m => !givesHydrogen(m)) });

export { activityOrder };
