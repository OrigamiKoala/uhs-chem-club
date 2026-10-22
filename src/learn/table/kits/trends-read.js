/**
 * kits/trends-read.js — What the trends bench of the trends kit reads.
 *
 * PURE, NODE-IMPORTABLE, NO DOM. The pull on an electron is `electronbench.js` `planPull` (Coulomb's law over the declared nuclear charge, the
 * electrons in the shells below it and the real radius); the radii are `electrons.js` `RADIUS` and `ION_RADIUS`; the cost of stripping an
 * electron is the measured `IONIZATION` and, for magnesium, `MG_SUCCESSIVE`. This file only decides what an atom is NOW (an electron taken
 * off, an electron added) and reads what the spring gauge, the size gauge and the stripper say about it. A stage declares what stands on the
 * table and what to look for; it never declares what a pull is.
 */

import { planPull, shellsOf, outerShell } from '../../engine/electronbench.js';
import { RADIUS, ION_RADIUS, IONIZATION, MG_SUCCESSIVE, zOf, nameOf } from '../../engine/electrons.js';

export { planPull, shellsOf, outerShell, RADIUS, ION_RADIUS, IONIZATION, MG_SUCCESSIVE, zOf, nameOf };

const live = p => p && !p.hidden;
export const seatedIn = (state, slotId) => Object.values(state.pieces).find(p => live(p) && p.zone === `slot:${slotId}`) || null;

/** The radius, in pm, of an atom of `sym` carrying `charge` (0 neutral, +1 one electron short, -1 one over), or null where the bench has no figure. */
export function radiusOf(sym, charge) {
  if (charge === 0) return RADIUS[sym] ?? ION_RADIUS[sym] ?? null;
  const key = `${sym}${charge > 0 ? '+' : '-'}`;
  return Math.abs(charge) === 1 ? (ION_RADIUS[key] ?? null) : null;
}

/** The electrons per shell of `sym` once `charge` electrons have been taken off (or, below zero, put on) the outermost shell. */
export function shellsNow(sym, charge) {
  const s = shellsOf(sym).slice();
  for (let k = 0; k < Math.abs(charge); k++) {
    if (charge > 0) {
      const i = outerShell({ shells: s });
      s[i] -= 1;
      if (s[i] === 0) s.pop();
    } else {
      s[s.length - 1] += 1;
    }
  }
  return s;
}

/** What an atom piece is now: its element, its charge, its shells and the radius the bench has for it. */
export function itemOf(piece) {
  const sym = piece.props.sym;
  const charge = piece.props.charge || 0;
  return { sym, z: zOf(sym), charge, shells: shellsNow(sym, charge), radius: radiusOf(sym, charge) };
}

/** The pull on the electron `which` ('outer' or 'inner') of an atom, or null where the bench cannot size it. */
export function pullOf(piece, which) {
  const item = itemOf(piece);
  if (item.radius == null) return null;
  const i = which === 'inner' ? 0 : outerShell(item);
  return { ...planPull(item, i), item, which };
}

/** The largest pull on any electron of `sym` as it comes: the innermost one's. */
export function hardestPull(sym) {
  const item = { sym, z: zOf(sym), shells: shellsOf(sym), radius: radiusOf(sym, 0) };
  return Math.max(...item.shells.map((_, i) => planPull(item, i).pull));
}

/** The charge the outermost electron of a neutral `sym` feels. */
export const feelsOf = sym => pullOf({ props: { sym, charge: 0 } }, 'outer').zeff;

/** The cost, kJ/mol, of stripping the next electron from an atom that has lost `removed` already, or null beyond what the bench has measured. */
export function costOf(sym, removed) {
  if (sym === 'Mg') return MG_SUCCESSIVE[removed] ?? null;
  return removed === 0 ? (IONIZATION[sym] ?? null) : null;
}

/* ------------------------------------------------------------------
   THE GAUGES
   ------------------------------------------------------------------ */

/** The spring gauge: the atom in its holder, the electron the dial names, and the pull a tug would read. */
export function springRead(state, id) {
  const f = state.fixtures[id];
  const piece = seatedIn(state, f.props.slot);
  const which = f.dials.which.value === 2 ? 'inner' : 'outer';
  if (!piece) return { piece: null, which, pull: null };
  const p = pullOf(piece, which);
  return p ? { piece, which, ...p } : { piece, which, pull: null, unsized: true };
}

/** The size gauge: the atom or ion in its holder and the radius the bench has for it. */
export function sizeRead(state, id) {
  const f = state.fixtures[id];
  const piece = seatedIn(state, f.props.slot);
  if (!piece) return { piece: null, radius: null };
  const item = itemOf(piece);
  return { piece, radius: item.radius, item, measured: Boolean(piece.props.measured) };
}

/** The stripper: the atom in its holder, how many electrons it has lost, and what the next costs. */
export function stripRead(state, id) {
  const f = state.fixtures[id];
  const piece = seatedIn(state, f.props.slot);
  if (!piece) return { piece: null };
  const charge = piece.props.charge || 0;
  return { piece, charge, next: charge >= 0 ? costOf(piece.props.sym, charge) : null, last: piece.props.lastCost ?? null };
}

/** The size of an atom piece as it stands now (null where unsized). */
export const sizeNow = piece => itemOf(piece).radius;
