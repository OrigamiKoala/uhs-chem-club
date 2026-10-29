/**
 * kits/pes.js — The spectrum kit: light fired at a specimen, the electrons it knocks loose falling into a strip of energy bins.
 *
 * LANTERNFALL'S SEVENTH BENCH, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4c): `q7-pes`. A specimen card is put in a chamber and
 * "Fire Light" knocks off every electron the light carries enough energy for (`electrons.js` `planPES`: the real binding energies, one
 * peak per row that holds electrons); each lands in a bin of a strip graded in energy and the electrons pile up, so a peak is exactly
 * as tall as the number of electrons held with that energy. The card keeps a printout of what it showed, so several specimens can be
 * set side by side on a rail or in trays. The light's energy is a dial: the least energy that frees an electron is how tightly it was held.
 * An atom can be BUILT to match a spectrum (protons and electrons on two dials) and its own peaks lie over the strip as outlines; a
 * configuration is WRITTEN (an electron count for each row) and graded against the element's.
 *
 * A THIN WRAPPER over `electronbench.js` `spectrumOf` (`electrons.js` `planPES`) and it authors nothing: which electrons a beam frees,
 * where they land and what an atom built to match would show are the planners' answers, shown as the picture. Pieces never join.
 * THE ROWS' NAMES ARE NEVER ON THE BENCH until the last stage, whose answer they are.
 */

import { registerKit } from './registry.js';
import { paintPiece, paintFixture, faceKey, RECTS } from './pes-draw.js';
import {
  ENERGY_STEPS, TOP_STEP, BINS, WRITER_ROWS, seatedIn, chamberPiles, capacityOf
} from './pes-read.js';

export const PES_KIT_ID = 'pes';
export const PES_BOUNDS_H = 64;

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun || f.kind !== 'pes') return null;
  const piece = seatedIn(state, f.props.slot);
  if (!piece) return { noop: 'The chamber is empty: put a specimen in it first.' };
  const index = f.props.sources.indexOf(piece.id) + 1;
  // The strip shows this specimen at this energy; the card keeps a printout of the same.
  return { dials: { [f.id]: { shown: index, at: f.dials.energy.value } }, stamp: { [piece.id]: { printed: true, printAt: f.dials.energy.value } } };
}

export const PES_KIT = {
  id: PES_KIT_ID,
  kinds: { spec: { r: 9, rect: RECTS.spec, nojoin: true } },
  run,
  pilesOf: chamberPiles,
  paintPiece,
  paintFixture,
  slot3d: () => 'chamber',
  deckStyle: () => 'instrument',
  printed: p => String(p.label),
  faceKey
};

registerKit(PES_KIT);

/** A stage's declaration with the spectrum kit's defaults: the kit, the bounds, a parked recorder strip. */
export function pesTable(spec, { w = 150 } = {}) {
  return { kit: PES_KIT_ID, bounds: { w, h: PES_BOUNDS_H }, tools: [], recorder: { at: { x: w - 2.6, y: PES_BOUNDS_H - 2.4 }, size: { w: 5, h: 3.4 } }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

/** A specimen card: element `sym` is on it only as the thing the planner is asked about; the face prints a label and a note. */
export const specimen = (id, label, sym, at, { note = '', zone = null } = {}) => ({
  id, kind: 'spec', label, at, ...(zone ? { zone } : {}), props: { sym, ...(note ? { note } : {}) }
});

/* ------------------------------------------------------------------
   FIXTURES (each builder returns the fixture and the zones it owns)
   ------------------------------------------------------------------ */

/**
 * The chamber and its strip: a holder for one specimen, a Fire Light key, an energy dial (shown only on the stages that use it) and
 * the strip the electrons fall into. `sources` are the ids of the specimen cards that may be fired (the strip's caption names the one
 * that was); `rings` draws the specimen's own rings beside the holder; `model` names a build fixture whose atom lies over the strip.
 */
export function chamber(id, at, sources, { energyDial = false, rings = false, model = null, axisLabel = 'ENERGY TO REMOVE, MJ/mol', label = 'Chamber', h = 44 } = {}) {
  const size = { w: 110, h };
  const slotId = `${id}.spec`;
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  return {
    fixture: {
      id, kind: 'pes', label, at: { ...at }, size, runLabel: 'Fire Light',
      dials: {
        energy: { min: 1, max: TOP_STEP, step: 1, value: TOP_STEP, label: 'Light energy (MJ/mol)', labels: ENERGY_STEPS.map(String) },
        shown: { min: 0, max: Math.max(1, sources.length), step: 1, value: 0 },
        at: { min: 1, max: TOP_STEP, step: 1, value: TOP_STEP }
      },
      props: {
        backdrop: true, slot: slotId, sources: sources.slice(), axisLabel, rings, ...(model ? { model } : {}),
        hidden: energyDial ? ['shown', 'at'] : ['energy', 'shown', 'at'], stripLeft: 27, baseAt: 27, dotStep: 2.2
      }
    },
    // The holder is as wide as the specimen card that stands in it (22 units).
    slots: [{ id: slotId, label: 'Holder', at: { x: x0 + 13, y: y0 + (energyDial ? 24 : 15) }, size: { w: 24, h: 16 } }],
    size,
    slotId
  };
}

/** An atom to build: protons in the middle and electrons round them, on two dials. Its peaks lie over a chamber that names it as `model`. */
export function buildFixture(id, at, { max = 13, label = 'Build an atom', size = { w: 36, h: 46 } } = {}) {
  return {
    id, kind: 'build', label, at: { ...at }, size: { ...size }, noRun: true,
    dials: {
      protons: { min: 0, max, step: 1, value: 0, label: 'Protons' },
      electrons: { min: 0, max, step: 1, value: 0, label: 'Electrons' }
    },
    props: {}
  };
}

/** A configuration to write: an electron count for each row of the ladder, one dial a row. */
export function writerFixture(id, at, { label = 'Write it down' } = {}) {
  const dials = {};
  for (const row of WRITER_ROWS) dials[row] = { min: 0, max: capacityOf(row), step: 1, value: 0, label: row };
  return { id, kind: 'writer', label, at: { ...at }, size: { w: 36, h: 8 + 5 * (WRITER_ROWS.length - 1) + 9 }, noRun: true, dials, props: {} };
}

/** A number to set: a tally the player sets to what they have counted. */
export function tallyFixture(id, label, at, max, { w = 40 } = {}) {
  return { id, kind: 'tally', label, at: { ...at }, size: { w, h: 16 }, noRun: true, dials: { value: { min: 0, max, step: 1, value: 0, label: 'Tally' } }, props: {} };
}

/** A printed reference: lines of text on a plate. */
export function plaqueFixture(id, label, at, lines, { w = 44 } = {}) {
  return { id, kind: 'plaque', label, at: { ...at }, size: { w, h: 8.4 + lines.length * 3.8 }, noRun: true, dials: {}, props: { lines: lines.slice() } };
}

export * from './pes-read.js';
export { BINS };
