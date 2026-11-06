/**
 * THE GALVANIC CELL PLANNERS — Brinewire `q3-galvanic` (Unit 10, electrochemistry). Pure, no DOM; imports `celldata.js` and does not edit it.
 *
 * Every number on the cell rig comes from here: the loop current, the trace of that current while the cell runs (with and without a path
 * for ions between the beakers), the direction electrons move, the ions counted in each beaker's window and in the bridge, the strips' atoms,
 * the mass an electrode gains or loses, and the shorthand a cell is written in.
 *
 * SIMPLIFICATIONS (stated on the bench where they matter):
 *   - the loop has a fixed resistance, so the current at the start of a run is E°cell ÷ LOOP_OHMS;
 *   - a cell with nothing carrying ions between the beakers has a current that falls to zero in COLLAPSE_S seconds. In a real cell the
 *     charge that builds in each beaker pushes back until the current is a tiny trickle; the bench draws it as a straight fall to zero;
 *   - a run moves ELECTRONS_PER_RUN electrons through the wire for the window counts (a few particles stand for a mole of ions), and each
 *     beaker starts with START_IONS metal ions and START_IONS sulfate ions; the bridge holds potassium nitrate;
 *   - the window counts are for two metals whose ions have a charge of 2+ (zinc, copper, magnesium, iron...).
 */

import { METALS, cellDirection, electrodeMassChange, FARADAY, fmt } from './celldata.js';
export { fmt };

/* ------------------------------------------------------------------ the loop and the clock */

/** Resistance of the wire loop and meter, ohms. */
export const LOOP_OHMS = 2.2;
/** Seconds a run lasts, and the seconds after which a cell with no path for ions has no current left. */
export const RUN_SECONDS = 10;
export const COLLAPSE_S = 3;
/** The bench that weighs electrodes runs the cell this long (one hour), in seconds. */
export const WEIGH_RUN_SECONDS = 3600;

/** The current the loop carries at the start of a run, amperes: E°cell ÷ R. Either metal order. */
export const loopCurrent = (idA, idB) => cellDirection(idA, idB).E0 / LOOP_OHMS;

/** What stands between the beakers: 'bridge' carries ions; 'rod' (a glass rod), 'none' and a second wire do not. */
export const carriesIons = link => link === 'bridge';

/** The current `t` seconds into a run. With ions carried it holds; without, it falls in a straight line to zero at COLLAPSE_S. */
export function currentAt(I0, link, t) {
  if (carriesIons(link)) return I0;
  return I0 * Math.max(0, 1 - t / COLLAPSE_S);
}

/** The whole run as readings: one `{ t, I }` per second, from 0 to RUN_SECONDS, rounded to a milliampere. */
export function currentTrace(I0, link, seconds = RUN_SECONDS) {
  const rows = [];
  for (let t = 0; t <= seconds; t++) rows.push({ t, I: Math.round(currentAt(I0, link, t) * 1000) / 1000 });
  return rows;
}

/** The second at which the current has reached zero (the first reading of 0 after the start), or null if it never does. */
export function stopSecond(trace) {
  const hit = trace.find((r, i) => i > 0 && r.I <= 1e-9);
  return hit ? hit.t : null;
}

/* ------------------------------------------------------------------ which way the electrons go */

/** Which beaker the electrons move toward through the wire: the cathode's. `left` and `right` are metal ids. */
export function electronsToward(leftId, rightId) {
  const d = cellDirection(leftId, rightId);
  return d.cathode === leftId ? 'left' : 'right';
}

/** The ammeter's signed reading: positive when electrons move left to right (the anode is the left beaker), negative right to left. */
export function signedCurrent(leftId, rightId, I) {
  return electronsToward(leftId, rightId) === 'right' ? I : -I;
}

/** The roles of the two beakers: which side loses atoms (anode) and which gains them (cathode). */
export function sides(leftId, rightId) {
  const d = cellDirection(leftId, rightId);
  return d.anode === leftId ? { left: 'anode', right: 'cathode' } : { left: 'cathode', right: 'anode' };
}

/* ------------------------------------------------------------------ the windows (counted ions) */

/** Metal ions and sulfate ions each beaker starts with, electrons a run moves, atoms a strip starts with. */
export const START_IONS = 8;
export const ELECTRONS_PER_RUN = 4;
export const START_ATOMS = 6;

/**
 * What each beaker's window holds after a run (or before it, `ran` false), for two metals whose ions have a charge of 2+:
 *   metal   the metal ions in the solution: the anode's rise by one for every two electrons, the cathode's fall by the same
 *   sulfate the negative ions the beaker started with
 *   anion   negative bridge ions that came in (the anode beaker, one for every electron: they keep the beaker's charge balanced)
 *   cation  positive bridge ions that came in (the cathode beaker, one for every electron)
 *   atoms   atoms on the strip: the anode's strip loses one for every ion formed, the cathode's gains one for every ion used up
 * and `charge` (the beaker's net charge in electron charges, 0 when balanced).
 */
export function windowCounts(leftId, rightId, { ran = true, link = 'bridge' } = {}) {
  const l = METALS[leftId]; const r = METALS[rightId];
  if (l.n !== 2 || r.n !== 2) throw new Error('windowCounts: the windows are drawn for 2+ ions');
  const roles = sides(leftId, rightId);
  const moved = ran ? ELECTRONS_PER_RUN : 0;
  const made = moved / 2;
  const bridged = carriesIons(link);
  const one = id => {
    const role = roles[id];
    const metal = START_IONS + (role === 'anode' ? made : -made);
    const sulfate = START_IONS;
    const anion = role === 'anode' && bridged ? moved : 0;
    const cation = role === 'cathode' && bridged ? moved : 0;
    const atoms = START_ATOMS + (role === 'anode' ? -made : made);
    const charge = 2 * metal - 2 * sulfate - anion + cation;
    return { role, metal, sulfate, anion, cation, atoms, charge };
  };
  return { left: one('left'), right: one('right') };
}

/** Where a bridge ion has got to along the tube after a run, as the share of one spacing it has moved (negative ions toward the anode). */
export const BRIDGE_SLOTS = 4;
export const bridgeShift = ran => (ran ? 1 : 0);

/** Which end of the bridge each kind of ion drifts to: the same fact as `celldata.js` `ionFlow`, in beaker-side terms. */
export function bridgeDrift(leftId, rightId) {
  const roles = sides(leftId, rightId);
  const anodeSide = roles.left === 'anode' ? 'left' : 'right';
  return { anions: anodeSide, cations: anodeSide === 'left' ? 'right' : 'left' };
}

/* ------------------------------------------------------------------ weighing the electrodes */

/**
 * The mass change of a strip after the cell has run for `seconds` at the current of the pair: grams, negative for the anode.
 * Mass is `q ÷ (n F) × M` with q = I t.
 */
export function stripChange(leftId, rightId, metalId, seconds) {
  const role = sides(leftId, rightId)[metalId === leftId ? 'left' : 'right'];
  const I = loopCurrent(leftId, rightId);
  return electrodeMassChange(role, metalId, I * seconds);
}

/** The mass a balance prints for a strip: its start mass plus what the runs have added or taken, two decimals. */
export const stripMass = (m0, dm) => Math.round((m0 + dm) * 100) / 100;

/* ------------------------------------------------------------------ cell notation */

/** The chips of a cell written in shorthand, left to right: anode half, bridge, cathode half. */
export function notationChips(anodeId, cathodeId) {
  const a = METALS[anodeId]; const c = METALS[cathodeId];
  return [a.symbol, '|', a.ion, '||', c.ion, '|', c.symbol];
}
export const notationText = (anodeId, cathodeId) => {
  const k = notationChips(anodeId, cathodeId);
  return `${k[0]} ${k[1]} ${k[2]} ${k[3]} ${k[4]} ${k[5]} ${k[6]}`;
};

export { FARADAY };
