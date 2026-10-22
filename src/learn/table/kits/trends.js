/**
 * kits/trends.js — The trends kit: scale-model atoms, a spring gauge that tugs an electron, a size gauge and a stripper.
 *
 * LANTERNFALL'S EIGHTH BENCH, WORKED WITH THE HANDS (plan `bench-tabletop.md`, T4c): `q8-trends`. An atom card is drawn TO SCALE (a bigger atom
 * is a bigger circle on every card) and laid in a holder: the SPRING GAUGE tugs the electron the dial names and reads the pull, with the charge at
 * the middle, the distance and (when the stage names them) the electrons between and the charge the electron feels; the SIZE GAUGE reads the
 * radius of whatever is laid in it; the STRIPPER takes the outermost electron off and reads what it cost; an ELECTRON laid on a card puts one
 * back. Ions are made by hand and sized the same way, and cards are ranked on the shared rail.
 *
 * A THIN WRAPPER over `electronbench.js` `planPull` and `electrons.js` (`RADIUS`, `ION_RADIUS`, `IONIZATION`, `MG_SUCCESSIVE`) and it authors
 * nothing: a pull, a size and a cost are the planners' and the measured tables' answers, shown as the picture.
 */

import { registerKit } from './registry.js';
import { paintPiece, paintFixture, faceKey, RECTS } from './trends-draw.js';
import { seatedIn, pullOf, costOf, itemOf, shellsNow, radiusOf } from './trends-read.js';

export const TRENDS_KIT_ID = 'trends';
export const TRENDS_BOUNDS_H = 64;

/* ------------------------------------------------------------------
   THE KIT
   ------------------------------------------------------------------ */

function run(state, fixtureId) {
  const f = state.fixtures[fixtureId];
  if (!f || f.noRun) return null;
  const piece = seatedIn(state, f.props.slot);
  if (f.kind === 'spring') {
    if (!piece) return { noop: 'Put an atom in the holder first.' };
    const p = pullOf(piece, f.dials.which.value === 2 ? 'inner' : 'outer');
    if (!p) return { noop: 'The bench has no size for that ion, so it cannot read a pull.' };
    return { x: p.distPm, y: p.pull, label: piece.props.sym, stamp: { [piece.id]: { lastPull: p.pull } } };
  }
  if (f.kind === 'strip') {
    if (!piece) return { noop: 'Put an atom in the holder first.' };
    const charge = piece.props.charge || 0;
    if (charge < 0) return { noop: 'That atom holds an extra electron: there is nothing of its own to strip.' };
    const cost = costOf(piece.props.sym, charge);
    if (cost == null) return { noop: 'The bench has measured no further than that.' };
    return { x: charge + 1, y: cost, label: piece.props.sym, stamp: { [piece.id]: { charge: charge + 1, lastCost: cost } } };
  }
  if (f.kind === 'sizer') {
    if (!piece) return { noop: 'Put an atom in the holder first.' };
    return { stamp: { [piece.id]: { measured: true } } };
  }
  return null;
}

/** An electron laid on an atom card puts one more on its outermost shell; nothing else joins anything. */
function planJoin(a, b) {
  if (a.kind === 'electron' && b.kind === 'atom') {
    const charge = b.props.charge || 0;
    const shells = shellsNow(b.props.sym, charge);
    if (shells[shells.length - 1] >= 8) return { holds: false, home: true, reason: 'That outer shell is already full: there is no room for another electron.' };
    return { holds: true, once: true, set: { b: { charge: charge - 1, lastCost: null } }, reason: 'An electron added.' };
  }
  return { holds: false, home: true, reason: 'Nothing here joins.' };
}

export const TRENDS_KIT = {
  id: TRENDS_KIT_ID,
  kinds: {
    atom: { r: 9.5, rect: RECTS.atom },
    electron: { r: 7, rect: RECTS.electron, tool: true }
  },
  // Only an electron is ever laid on an atom; a card set down beside another is just set down.
  pairable: (a, b) => a.kind === 'electron' && b.kind === 'atom',
  planJoin,
  run,
  paintPiece,
  paintFixture,
  printed: p => String(p.label),
  faceKey
};

registerKit(TRENDS_KIT);

/** A stage's declaration with the trends kit's defaults: the kit, the bounds, a parked recorder strip. */
export function trendsTable(spec, { w = 150, recorder = null } = {}) {
  return { kit: TRENDS_KIT_ID, bounds: { w, h: TRENDS_BOUNDS_H }, tools: [], recorder: recorder || { at: { x: w - 2.6, y: TRENDS_BOUNDS_H - 2.4 }, size: { w: 5, h: 3.4 } }, ...spec };
}

/* ------------------------------------------------------------------
   PIECES AND FIXTURES
   ------------------------------------------------------------------ */

/** A scale-model atom card of element `sym`. */
export const atomCard = (id, label, sym, at, { zone = null, charge = 0 } = {}) => ({
  id, kind: 'atom', label, at, ...(zone ? { zone } : {}), props: { sym, ...(charge ? { charge } : {}) }
});

/** The loose electron that puts one back on an atom. */
export const electronPiece = (id, at, label = 'Add Electron') => ({ id, kind: 'electron', label, at, props: {} });

/** The spring gauge: a holder, a dial naming which electron, the readings the stage shows, and a Tug Electron key. */
export function springFixture(id, at, { show = {}, feelWord = 'CHARGE IT FEELS', label = 'Spring gauge' } = {}) {
  const size = { w: 62, h: 38 };
  const slotId = `${id}.atom`;
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  return {
    fixture: {
      id, kind: 'spring', label, at: { ...at }, size, runLabel: 'Tug Electron',
      dials: { which: { min: 1, max: 2, step: 1, value: 1, label: 'Electron', labels: ['Outermost', 'Innermost'] } },
      props: { backdrop: true, slot: slotId, show, feelWord }
    },
    slots: [{ id: slotId, label: 'Atom', at: { x: x0 + 10.5, y: y0 + 21 }, size: { w: 11, h: 11 } }],
    size
  };
}

/** The size gauge: a holder and the radius laid along a scale; `measure` gives it a Measure Atom key, and the reading waits for it. */
export function sizerFixture(id, at, { measure = false, label = 'Size gauge', w = 44 } = {}) {
  const size = { w, h: 28 };
  const slotId = `${id}.atom`;
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  return {
    fixture: {
      id, kind: 'sizer', label, at: { ...at }, size, ...(measure ? { runLabel: 'Measure Atom' } : { noRun: true }), dials: {},
      props: { backdrop: true, slot: slotId, measure }
    },
    slots: [{ id: slotId, label: 'Atom', at: { x: x0 + 10.5, y: y0 + 14 }, size: { w: 11, h: 11 } }],
    size
  };
}

/** The stripper: a holder and a Strip Electron key; each press takes the outermost electron off and reads what it cost. */
export function stripFixture(id, at, { label = 'Stripper' } = {}) {
  const size = { w: 46, h: 32 };
  const slotId = `${id}.atom`;
  const x0 = at.x - size.w / 2;
  const y0 = at.y - size.h / 2;
  return {
    fixture: { id, kind: 'strip', label, at: { ...at }, size, runLabel: 'Strip Electron', dials: {}, props: { backdrop: true, slot: slotId } },
    slots: [{ id: slotId, label: 'Atom', at: { x: x0 + 10.5, y: y0 + 15 }, size: { w: 11, h: 11 } }],
    size
  };
}

export * from './trends-read.js';
export { itemOf, radiusOf };
