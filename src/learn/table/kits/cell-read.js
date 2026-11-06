/**
 * kits/cell-read.js — what a metal, a seat and a cell read: the planners' answer (`engine/celldata.js`) for what stands on the table.
 * Pure; nothing here is drawn, and no stage types a reading into a table: it names the metals in the seats and every figure follows.
 */

import { METALS, HYDROGEN, fmt } from '../../engine/celldata.js';

/** The metal an electrode piece stands for. */
export const metalOfPiece = p => METALS[p.props.metal];

/** A signed voltage as the meters print it: a true minus, two decimals, a plain zero. */
export const voltText = v => fmt(v, 2);

/** The voltage of one half-cell against the hydrogen reference. */
export const halfCellReading = id => (id === 'h' ? HYDROGEN.E0 : METALS[id].E0);

/** The half-reaction a metal's couple is written as (reduction), for the picture under a reading. */
export function halfText(id) {
  const m = METALS[id];
  const e = m.n === 1 ? 'e⁻' : `${m.n} e⁻`;
  return `${m.ion} + ${e} → ${m.symbol}`;
}

export { METALS, HYDROGEN, fmt };

/** The piece lying in a slot of the table's own, by slot id (a stage's guess slot), or null. */
export function pieceIn(state, slotId) {
  return Object.values(state.pieces).find(p => p.zone === `slot:${slotId}` && !p.hidden) || null;
}

/** The value of a fixture's dial (the answer dial's default name is `value`). */
export const dialValue = (state, fid, name = 'value') => state.fixtures[fid]?.dials?.[name]?.value;
