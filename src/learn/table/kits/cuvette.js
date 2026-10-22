/**
 * kits/cuvette.js — The cuvette kit: cuvettes filled drop by drop, slid into a beam, and read.
 *
 * LANTERNFALL'S NINTH BENCH, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4c): `q9-absorb`. A cuvette is a piece with drops in it (a drop
 * is a fixed strength, so drops are concentration); the DROPPER laid on one adds a drop, the EMPTY tool rinses it. A cuvette put in the
 * spectrometer's holder is read live (A = epsilon x b x c, `lightdata.js` `planAbsorb`) at the wavelength and path the dials stand at, and
 * "Record" drops a point on the sheet: against wavelength, against strength or against path, as the stage says. The straightedge is the built-in
 * recorder tool, laid across the points for the calibration line. A light dial shows what each kind of light does to a molecule, and a strip shows
 * the light that gets through a solution, its missing colour dark.
 *
 * A THIN WRAPPER over `lightdata.js` (`planAbsorb`, `regionOf`, `planRegion`, `wavelengthRgb`) and it authors nothing: every reading is the
 * planners' answer, shown as the picture. A sealed cuvette is read but its strength is never printed.
 */

import { registerKit } from './registry.js';
import { BUILTIN_TOOLS } from '../tools.js';
import { paintPiece, paintFixture, faceKey, RECTS } from './cuvette-draw.js';
import {
  seatedIn, spectroRead, concOf, MAX_DROPS, COPPER_SWEEP, PATHS, REGIONS
} from './cuvette-read.js';

export const CUVETTE_KIT_ID = 'cuvette';
export const CUVETTE_BOUNDS_H = 64;

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun || f.kind !== 'spectro') return null;
  const r = spectroRead(state, fixtureId);
  if (!r.piece) return { noop: 'Put a cuvette in the beam first.' };
  const piece = r.piece;
  // A sealed cuvette is read, never plotted: its face keeps the reading and the sheet is not told its strength.
  if (piece.props.sealed) return { stamp: { [piece.id]: { read: r.A } } };
  const axis = f.props.xAxis || 'conc';
  const x = axis === 'nm' ? r.nm : axis === 'path' ? r.path : Math.round(r.conc * 1e6) / 1e3;
  return { x, y: r.A, label: piece.label };
}

/** A tool laid on a cuvette: the dropper adds a drop, the empty tool pours it out; nothing else joins anything. */
function planJoin(a, b) {
  if ((a.kind === 'dropper' || a.kind === 'rinse') && b.kind === 'cuvette') {
    if (b.props.sealed || b.props.conc != null) return { holds: false, home: true, reason: 'That cuvette is sealed or filled from the lake: its strength is not yours to change.' };
    const drops = b.props.drops || 0;
    if (a.kind === 'rinse') {
      if (drops === 0) return { holds: false, home: true, reason: 'That cuvette is already empty.' };
      return { holds: true, once: true, set: { b: { drops: 0 } }, reason: 'Poured out.' };
    }
    if (drops >= MAX_DROPS) return { holds: false, home: true, reason: 'That cuvette is full.' };
    return { holds: true, once: true, set: { b: { drops: drops + 1 } }, reason: 'A drop added.' };
  }
  return { holds: false, home: true, reason: 'Nothing here joins.' };
}

const rect = (r, kind) => ({ r, rect: RECTS[kind], nojoin: true });

export const CUVETTE_KIT = {
  id: CUVETTE_KIT_ID,
  kinds: {
    cuvette: { r: 9, rect: RECTS.cuvette },
    chip: rect(8, 'chip'),
    motion: rect(9, 'motion'),
    reading: rect(9, 'reading'),
    dropper: { r: 7, rect: RECTS.tool, tool: true },
    rinse: { r: 7, rect: RECTS.tool, tool: true }
  },
  // The straightedge is the built-in recorder tool; what it needs laid on is two readings, so its probe reads two cuvettes first.
  tools: {
    straightedge: {
      ...BUILTIN_TOOLS.straightedge,
      probe(state) {
        const beam = Object.values(state.fixtures).find(f => f.kind === 'spectro' && f.props.slot)?.props.slot;
        const two = Object.values(state.pieces).filter(p => p.kind === 'cuvette' && !p.props.sealed && !p.hidden).slice(0, 2);
        const fx = Object.values(state.fixtures).find(f => f.kind === 'spectro' && f.props.slot)?.id;
        const out = [];
        for (const c of two) out.push({ place: { piece: c.id, to: `slot:${beam}` } }, { run: fx });
        out.push({ lay: { kind: 'straightedge', through: [0, two.length - 1] } });
        return out;
      }
    }
  },
  pairable: (a, b) => (a.kind === 'dropper' || a.kind === 'rinse') && b.kind === 'cuvette',
  planJoin,
  run,
  paintPiece,
  paintFixture,
  printed: p => String(p.label),
  faceKey
};

registerKit(CUVETTE_KIT);

/** A stage's declaration with the cuvette kit's defaults: the kit, the bounds, a parked recorder strip. */
export function cuvetteTable(spec, { w = 150, recorder = null } = {}) {
  return { kit: CUVETTE_KIT_ID, bounds: { w, h: CUVETTE_BOUNDS_H }, tools: [], recorder: recorder || { at: { x: w - 2.6, y: CUVETTE_BOUNDS_H - 2.4 }, size: { w: 5, h: 3.4 } }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES
   ------------------------------------------------------------------ */

/** A cuvette of copper(II) sulfate: `drops` of stock in it, or a fixed `conc` (mol/L) when sealed or drawn from the lake. */
export const cuvette = (id, label, at, { drops = 0, conc = null, sealed = false, blank = false, solute = 'cuso4', zone = null, fetchFrom = null, hidden = false } = {}) => ({
  id, kind: 'cuvette', label, at, ...(zone ? { zone } : {}), ...(fetchFrom ? { fetchFrom } : {}), ...(hidden ? { hidden: true } : {}),
  props: { solute, ...(conc != null ? { conc } : { drops }), ...(sealed ? { sealed: true } : {}), ...(blank ? { blank: true } : {}) }
});

export const dropper = (id, at, label = 'Add Drop') => ({ id, kind: 'dropper', label, at, props: {} });
export const rinser = (id, at, label = 'Empty') => ({ id, kind: 'rinse', label, at, props: {} });
export const chip = (id, label, nm, at) => ({ id, kind: 'chip', label, at, props: { nm } });
export const motionCard = (id, label, at) => ({ id, kind: 'motion', label, at, props: {} });
export const readingCard = (id, label, nm, at) => ({ id, kind: 'reading', label, at, props: { nm } });

/* ------------------------------------------------------------------
   FIXTURES
   ------------------------------------------------------------------ */

/**
 * The spectrometer: a holder for one cuvette, a live reading, and (as the stage uses them) a wavelength dial (`tune`), a path dial
 * (`pathDial`) and a Record key. `xAxis` is what a recorded point is plotted against: 'nm', 'conc' or 'path'. `region` instead makes it the
 * light dial with a molecule to watch, and `strip` the strip of light that gets through the cuvette in the holder.
 */
export function spectro(id, at, {
  tune = false, pathDial = false, record = true, xAxis = 'conc', word = 'DIMMING', nmFixed = 630, pathFixed = 1, start = 2,
  region = false, molecule = 'HCl', strip = false, label = 'Spectrometer', w = 74, h = 40
} = {}) {
  const size = { w, h };
  const slotId = `${id}.cuv`;
  const x0 = at.x - w / 2;
  const y0 = at.y - h / 2;
  const dials = {};
  const hidden = [];
  if (region) {
    dials.region = { min: 1, max: 3, step: 1, value: 1, label: 'Light', labels: ['Microwave', 'Infrared', 'Ultraviolet and visible'] };
  } else {
    dials.nm = { min: 1, max: COPPER_SWEEP.length, step: 1, value: start, label: 'Wavelength (nm)', labels: COPPER_SWEEP.map(String) };
    dials.path = { min: 1, max: PATHS.length, step: 1, value: 1, label: 'Path', labels: PATHS.map(p => `${p} cm`) };
    if (!tune) hidden.push('nm');
    if (!pathDial) hidden.push('path');
  }
  const noRun = region || strip || !record;
  return {
    fixture: {
      id, kind: 'spectro', label, at: { ...at }, size, ...(noRun ? { noRun: true } : { runLabel: 'Record' }), dials,
      props: {
        backdrop: true, slot: region ? null : slotId, tune, pathDial, xAxis, word, nmFixed, pathFixed, ...(strip ? { strip: true } : {}),
        ...(region ? { molecule } : {}), hidden, readAt: 24
      }
    },
    slots: region ? [] : [{ id: slotId, label: 'Beam', at: { x: x0 + 10.5, y: y0 + h - 11 }, size: { w: 11, h: 11 } }],
    size,
    slotId
  };
}

/** A printed reference: lines of text on a plate. */
export function plaqueFixture(id, label, at, lines, { w = 44 } = {}) {
  return { id, kind: 'plaque', label, at: { ...at }, size: { w, h: 8.4 + lines.length * 3.8 }, noRun: true, dials: {}, props: { lines: lines.slice() } };
}

/** A number to set: a marker the player sets to what they have read. */
export function markerFixture(id, label, at, { min = 0, max = 8, step = 0.5, w = 44 } = {}) {
  return { id, kind: 'marker', label, at: { ...at }, size: { w, h: 16 }, noRun: true, dials: { value: { min, max, step, value: min, label: 'Set' } }, props: {} };
}

export * from './cuvette-read.js';
export { REGIONS };
