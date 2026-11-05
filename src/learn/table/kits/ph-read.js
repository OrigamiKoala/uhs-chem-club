/**
 * kits/ph-read.js — what a flask, a meter and a rig read: the planners' answer (`engine/phdata.js`) for what stands on the table. Pure;
 * nothing here is drawn, and no stage types a reading into a table: it declares a solution (an acid or a base from the tables, a
 * concentration) and every figure follows from it.
 *
 * A FLASK holds one solute named by its id in `ACIDS` / `BASES` and a concentration `c`. Its WINDOW is a magnified square of UNITS
 * formula units; `windowOf` counts how many of them have let go of a proton (`round(units × fraction)`), so the window never shows a
 * share the planner does not give. Water is not drawn. A METER laid in the flask's seat reads its pH; a flask with no seat has no meter.
 */

import { ACIDS, BASES, strongAcid, weakAcid, weakBase, sci } from '../../engine/phdata.js';
import { mulberry32 } from '../../engine/plates.js';

export const UNITS = 200;

/** The planner's answer for a flask's solute. `solute`: `{ id, c, T? }`; `id` is a key of ACIDS (acid forms) or BASES. */
export function solveSolute(solute) {
  const { id, c, T = 25 } = solute;
  const a = ACIDS[id];
  if (a) {
    if (a.strong) return { side: 'acid', ...strongAcid(c, { T }), A: c, HA: 0, species: a };
    const s = weakAcid(a.Ka, c, { T });
    return { side: 'acid', ...s, species: a };
  }
  const b = BASES[id];
  if (b) return { side: 'base', ...weakBase(b.Kb, c, { T }), species: b };
  throw new Error(`ph-read: unknown solute ${id}`);
}

/** The flask's solution: its planner answer (cached on the fixture's props key). */
const CACHE = new Map();
export function flaskSol(p) {
  const key = `${p.solute.id}|${p.solute.c}|${p.solute.T ?? 25}`;
  let s = CACHE.get(key);
  if (!s) { s = solveSolute(p.solute); CACHE.set(key, s); if (CACHE.size > 200) CACHE.delete(CACHE.keys().next().value); }
  return s;
}

/** pH of the flask, as the planner gives it (not rounded). */
export const flaskPH = f => flaskSol(f.props).pH;

/**
 * The species of the flask in mol/L, keyed as the rig's tiles are: an acid flask `{ H, A, HA }` (hydronium, its leftover, the acid that
 * is still whole); a base flask `{ OH, BH, B }`.
 */
export function speciesOf(p) {
  const s = flaskSol(p);
  return s.side === 'acid' ? { H: s.h, A: s.A, HA: s.HA } : { OH: s.oh, BH: s.BH, B: s.B };
}

/**
 * The window's counts: of `units` formula units, `ionized` have handed a proton over (an acid, to water) or taken one (a base), the rest
 * have not. `round` keeps the count whole; a share under one unit in the window shows none.
 */
export function windowOf(p) {
  const s = flaskSol(p);
  const units = p.units ?? UNITS;
  const ionized = Math.round(units * s.ionized);
  return { units, ionized, whole: units - ionized, side: s.side, species: s.species };
}

/** The inks of the species, shared by the window, its legend and the story painter. */
export const H_INK = '#d99423';
export const OH_INK = '#6f8fb0';
export const ACID_INK = '#9a948a';
export const BASE_INK = '#78a142';

/** An ion's name with a true minus (the plate font has no superscript minus). */
export const ionText = s => String(s).replace(/⁻/g, '−');

/** The species of a window: what a whole unit is, what a unit that has let go is made of. Colours and names. */
export function windowSpecies(w) {
  if (w.side === 'acid') {
    return { whole: { ink: ACID_INK, name: w.species.formula }, parts: [{ ink: H_INK, name: 'H₃O⁺' }, { ink: BASE_INK, name: w.species.base }] };
  }
  return { whole: { ink: BASE_INK, name: w.species.formula }, parts: [{ ink: ACID_INK, name: w.species.acid }, { ink: OH_INK, name: 'OH⁻' }] };
}

/** Which cells have let go: the first `ionized` of a fixed shuffle of the cells, so a still flask holds still. */
export function ionizedCells(units, ionized, seed) {
  const order = Array.from({ length: units }, (_, i) => i);
  const g = mulberry32(seed);
  for (let i = units - 1; i > 0; i--) { const j = Math.floor(g() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return new Set(order.slice(0, ionized));
}

export const seedOf = p => [...`${p.solute.id}${p.solute.c}`].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Cell centres of a window of `units` cells in `cols` columns: x, y and the half-cell. */
export function cellGrid(units, cols, x, y, w, h) {
  const rows = Math.ceil(units / cols);
  const cw = w / cols; const ch = h / rows;
  return Array.from({ length: units }, (_, i) => ({ x: x + ((i % cols) + 0.5) * cw, y: y + (Math.floor(i / cols) + 0.5) * ch, cw, ch }));
}

/** The piece standing in a slot, or null. */
export function pieceIn(state, slotId) {
  return Object.values(state.pieces).find(p => p.zone === `slot:${slotId}` && !p.hidden) || null;
}

/** The meter laid in a flask's seat, and what it reads (pH to two places), or `null`s. */
export function meterRead(state, fid) {
  const f = state.fixtures[fid];
  const seat = f.props.seat;
  const m = seat ? pieceIn(state, seat) : null;
  const meter = m && m.kind === 'phmeter' ? m : null;
  return { meter, pH: meter ? flaskPH(f) : null, noted: f.props.noted ?? null };
}

/** The text of a concentration: two significant figures, "0.10 M". */
export const concText = c => `${Number(c).toPrecision(2)} M`;

/** A reading as the rig prints it: three figures, or scientific form outside 0.01 to 1000; zero prints plainly. */
export function numText(v) {
  if (!Number.isFinite(v)) return '—';
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 0.01 && a < 1000) return (v * (1 + 1e-12)).toPrecision(3);
  return sci(v, 3);
}

/* ------------------------------------------------------------------ the ratio rig */

/** The values of one column of a rig: a flask's species, or the constants a stage gives that column. */
export function colValues(state, col) {
  if (col.values) return col.values;
  return speciesOf(state.fixtures[col.flask].props);
}

/** What lies on a rig and what it reads in every column: the tiles above the line multiplied, over the tiles below. */
export function rigRead(state, rid) {
  const f = state.fixtures[rid];
  const p = f.props;
  const tilesOf = ids => ids.map(id => pieceIn(state, id)).filter(t => t && t.kind === 'phtile');
  const top = tilesOf(p.top);
  const bottom = tilesOf(p.bottom);
  const laid = top.length + bottom.length;
  const readings = p.cols.map(col => {
    if (!laid) return NaN;
    const v = colValues(state, col);
    let r = 1;
    for (const t of top) r *= v[t.props.key];
    for (const t of bottom) r /= v[t.props.key];
    return r;
  });
  return { top, bottom, laid, readings };
}

/** True when every reading is a finite, positive number and the largest is within `tol` of the smallest. */
export function steady(readings, tol = 0.03) {
  if (!readings.length || readings.some(r => !Number.isFinite(r) || !(r > 0))) return false;
  return Math.max(...readings) / Math.min(...readings) - 1 <= tol;
}

/** A sentence-ready list of readings: "1.80 × 10⁻⁵, 1.72 × 10⁻⁵ and 1.57 × 10⁻⁵". */
export function readingsText(readings) {
  const v = readings.map(numText);
  return `${v.slice(0, -1).join(', ')} and ${v[v.length - 1]}`;
}


/** The value a marker or selector fixture is set to. */
export const dialValue = (state, fid, name = 'value') => state.fixtures[fid]?.dials?.[name]?.value;
