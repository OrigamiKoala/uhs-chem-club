/**
 * kits/shells-read.js — What the box rack of the address and filling kit reads.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. Every rule is `engine/electrons.js` (the same planners the box rack drew from): `placeElectron` and
 * `removeElectron` (a box takes one arrow of each direction and no more), `readRack` (electrons placed, alone in a box, the pull,
 * the configuration), `findRoom` and `validAddress` (which box an address names, whether any room has it), `groundConfig`,
 * `shortString` and `MEASURED` (the REAL sample's count of unpaired electrons, which the magnet reports). This file only reads what
 * the table holds: the arrows standing in the boxes (placed by hand, or by an electron whose address names its box), the finder's
 * cells, the magnet's dial. A stage declares what stands on the table and what to look for; it never declares what the rack reads.
 */

import {
  LADDER, boxesOf, boxKey, mlOf, rowOf, readRack, findRoom, validAddress, sameAddress, MEASURED, groundConfig, shortString, configString,
  placeElectron, removeElectron, symbolOf, zOf, blockOf, rackFor, shellCapacity, fmtMs, fmtMl, capacityOf, unpairedOfConfig, isLaddered
} from '../../engine/electrons.js';
import { BOHR_PM } from '../../engine/orbitals.js';

export {
  LADDER, boxesOf, boxKey, mlOf, rowOf, readRack, findRoom, validAddress, sameAddress, MEASURED, groundConfig, shortString, configString,
  placeElectron, removeElectron, symbolOf, zOf, blockOf, rackFor, shellCapacity, fmtMs, fmtMl, capacityOf, unpairedOfConfig, isLaddered
};

const pieces = state => Object.values(state.pieces);

/** The id of the box piece for row `row`, box `idx` of rack `rack`. */
export const boxPieceId = (rack, row, idx) => `${rack}.${row}.${idx}`;

/* ------------------------------------------------------------------
   THE ARROWS IN A BOX
   ------------------------------------------------------------------ */

/** The address an electron token carries: `{n, l, ml, ms}`. */
export const addressOfToken = p => ({ n: p.props.n, l: p.props.l, ml: p.props.ml, ms: p.props.ms });

/** The tokens that have been placed on the rack and the room each one stands in. A token put in a tray is off the rack. */
export function placedTokens(state) {
  return pieces(state).filter(p => p.kind === 'etok' && p.props.placed && !p.hidden && !p.zone).map(p => {
    const a = addressOfToken(p);
    return { id: p.id, address: a, room: findRoom(a), spin: a.ms > 0 ? 'u' : 'd' };
  });
}

/**
 * The arrows in a box, as the rack stores them (`'u'`, `'d'`, `'ud'`, or `''`): the ones put there by hand (`props.up`, `props.down`,
 * a stage's prefilled ones among them) and the ones an electron token stands for, in the room its address names.
 */
export function arrowsOf(state, box) {
  let up = Boolean(box.props.up);
  let down = Boolean(box.props.down);
  for (const t of placedTokens(state)) {
    if (t.room.exists && t.room.row === box.props.row && t.room.idx === box.props.idx) {
      if (t.spin === 'u') up = true; else down = true;
    }
  }
  return `${up ? 'u' : ''}${down ? 'd' : ''}`;
}

/** The rack as the old box rack held it: `{'2p:1': 'ud', ...}`, from every box piece of rack `rackId`. */
export function rackOf(state, rackId) {
  const out = {};
  for (const p of pieces(state)) {
    if (p.kind !== 'box' || p.props.rack !== rackId) continue;
    const a = arrowsOf(state, p);
    if (a) out[boxKey(p.props.row, p.props.idx)] = a;
  }
  return out;
}

/** What the rack reads: `electrons.js` `readRack` of what stands in its boxes. */
export const readOf = (state, rackId) => readRack(rackOf(state, rackId));

/** The arrows a stage handed over already standing (and, when locked, fixed) in a box. */
export const prefillOf = box => box.props.pre || '';

/* ------------------------------------------------------------------
   THE FINDER (the address strip)
   ------------------------------------------------------------------ */

/** The address the finder is set to: the cells it carries as dials, the rest as fixed values. */
export function addressOfFinder(state, finderId) {
  const f = state.fixtures[finderId];
  const a = { n: 1, l: 0, ml: 0, ms: 0.5, ...(f.props.fixed || {}) };
  for (const k of ['n', 'l', 'ml', 'ms']) if (f.dials[k]) a[k] = f.dials[k].value;
  return a;
}

/**
 * What an address lights on the rack: the whole shell (a finder that shows only `n`), a subshell's row (`n` and `l`), or one box (all three).
 * `none` when no room has the address.
 */
export function finderLight(state, finderId) {
  const f = state.fixtures[finderId];
  const a = addressOfFinder(state, finderId);
  const shows = f.props.show || ['n'];
  const found = findRoom(a);
  const lit = { floor: null, row: null, box: null, none: false, address: a, found };
  if (!shows.includes('l')) lit.floor = a.n;
  else if (!shows.includes('ml')) { if (found.exists) lit.row = found.row; else lit.none = true; }
  else if (found.exists) lit.box = { row: found.row, idx: found.idx };
  else lit.none = true;
  return lit;
}

/** Why no room has an address (the rule, never the answer to a stage), or null when a room does. */
export function whyNoRoom(a) {
  if (validAddress(a)) return null;
  if (!(a.n >= 1)) return 'A shell number starts at 1.';
  if (!(a.l >= 0 && a.l < a.n)) return 'A subshell number has to be smaller than its shell number.';
  if (!(Math.abs(a.ml) <= a.l)) return 'An orbital number cannot be farther from zero than its subshell number.';
  return 'An arrow points up or down, and nothing else.';
}

/* ------------------------------------------------------------------
   HOW FAR A CLOUD REACHES
   ------------------------------------------------------------------ */

/**
 * How far out, in pm, the cloud of shell `n` and subshell `l` reaches on average: the real hydrogen-like mean distance, (a0 / 2)(3 n^2 - l (l + 1)).
 * `verify:learn` holds it to the mean of the sampled dots.
 */
export const reachPm = (n, l) => Math.round(((BOHR_PM / 2) * (3 * n * n - l * (l + 1))) / 10) * 10;

/* ------------------------------------------------------------------
   THE ENERGY WELL
   ------------------------------------------------------------------ */

/**
 * The Energy Well reading: whether tested, whether ground state, whether any electrons
 * sit above empty levels and can fall to a lower row.
 */
export function wellRead(state, fid) {
  const f = state.fixtures[fid];
  if (!f) return null;
  const rackId = f.props.rack || 'rack';
  const r = readOf(state, rackId);
  const v = f.dials?.state?.value || 0;
  const tested = v > 0;

  let lowestOpen = null;
  let canFall = false;

  for (const row of LADDER) {
    const count = r.counts[row.id] || 0;
    const cap = capacityOf(row.id);
    if (count < cap && !lowestOpen) lowestOpen = row.id;
    if (lowestOpen && count > 0 && LADDER.findIndex(x => x.id === row.id) > LADDER.findIndex(x => x.id === lowestOpen)) {
      canFall = true;
    }
  }

  const isGround = r.total > 0 && r.laddered && r.ruleHolds;
  const isExcited = r.total > 0 && (!r.laddered || canFall);
  const hundIssue = r.total > 0 && !r.ruleHolds;

  return {
    id: fid,
    tested,
    total: r.total,
    isGround,
    isExcited,
    hundIssue,
    canFall,
    lowestOpen,
    config: r.config,
    laddered: r.laddered,
    ruleHolds: r.ruleHolds
  };
}

/* ------------------------------------------------------------------
   THE MAGNET
   ------------------------------------------------------------------ */

/** The magnet's reading: has it been used, and the pull (the REAL sample's, or the rack's own arrangement). */
export function magnetRead(state, fid) {
  const f = state.fixtures[fid];
  const v = f.dials.pull.value;
  const real = f.props.sample != null ? (MEASURED[f.props.sample] ?? null) : null;
  return { id: fid, target: f.props.sample != null ? 'sample' : 'rack', tested: v > 0, pull: v > 0 ? v - 1 : null, real };
}

/** The pull of the arrangement on rack `rackId`: single electrons pointing the same way add, opposite ones cancel. */
export const rackPull = (state, rackId) => readOf(state, rackId).pull;

/* ------------------------------------------------------------------
   THE WRITTEN FORM
   ------------------------------------------------------------------ */

/** The configuration a rack reads, in the form the card in a slot is written. */
export const writtenOf = (state, rackId, short = false) => {
  const r = readOf(state, rackId);
  return short ? r.short : r.config;
};

/** The block of the periodic table of an element strip. */
export const stripBlock = p => blockOf(zOf(p.props.sym));

/** Everything a rack's rows can be, for a stage that wants a row by its id. */
export { pieces as allPieces };
void rowOf; void LADDER; void capacityOf;
