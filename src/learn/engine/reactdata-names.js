/**
 * reactdata-names.js — what Kettle's q2-names bench draws and asks, as pure functions over `reactdata.js`.
 *
 * PURE: no DOM, no kit. `reactdata.js` owns the ions, the formulas and the names; this file adds only the pictures the bench draws from them
 * (the atoms of an ion, the atoms of a small molecule, the pieces a salt breaks into in water) and the small readings a label is graded by
 * (the roman numeral of a charge, the formula a row of tokens spells, the words of an acid's name). Nothing here authors a chemistry fact
 * that `reactdata.js` does not already hold: a salt's pieces are `ionicFormula` and `IONS`, a name is `nameIonic` / `nameMolecular` /
 * `nameAcid`.
 */

import { IONS, ionicFormula, nameIonic, nameMolecular, nameAcid, parseFormula, netCharge, pretty } from './reactdata.js';

/** The atoms of one ion, as `{el, x, y}` in a unit disc (the centre atom first), and the bonds between them as index pairs. */
const ring = (n, r, a0 = -Math.PI / 2) => Array.from({ length: n }, (_, i) => [Math.cos(a0 + (2 * Math.PI * i) / n) * r, Math.sin(a0 + (2 * Math.PI * i) / n) * r]);
const around = (centre, outer, r, a0) => ({
  atoms: [{ el: centre, x: 0, y: 0 }, ...ring(outer.length, r, a0).map(([x, y], i) => ({ el: outer[i], x, y }))],
  bonds: outer.map((_, i) => [0, i + 1])
});

export const ION_PICTURE = Object.freeze({
  NO3: around('N', ['O', 'O', 'O'], 0.55),
  SO4: around('S', ['O', 'O', 'O', 'O'], 0.58, -Math.PI / 4),
  NH4: around('N', ['H', 'H', 'H', 'H'], 0.55, -Math.PI / 4),
  CO3: around('C', ['O', 'O', 'O'], 0.55),
  PO4: around('P', ['O', 'O', 'O', 'O'], 0.58, -Math.PI / 4),
  OH: { atoms: [{ el: 'O', x: -0.28, y: 0 }, { el: 'H', x: 0.36, y: 0 }], bonds: [[0, 1]] },
  C2H3O2: around('C', ['C', 'O', 'O', 'H'], 0.58, -Math.PI / 4)
});

/** The picture of an ion id: one atom for a single-atom ion, the joined atoms for a polyatomic one. */
export function ionPicture(id) {
  const ion = IONS[id];
  if (!ion) throw new Error(`reactdata-names: unknown ion ${id}`);
  return ION_PICTURE[id] || { atoms: [{ el: ion.f, x: 0, y: 0 }], bonds: [] };
}
export const isPolyatomic = id => Boolean(IONS[id]?.poly);

/** What a salt breaks into in water: each kind of ion and how many of it, and the formula it was written as. */
export function saltInWater(catId, anId) {
  const f = ionicFormula(catId, anId);
  return { formula: f.formula, text: f.text, pieces: [{ ion: catId, count: f.nCat }, { ion: anId, count: f.nAn }], atoms: parseFormula(f.formula) };
}

/** Small molecules the bench draws: atoms placed in a box, and the bonds between them (index pairs, with an order). */
export const MOLECULES = Object.freeze({
  CO: { atoms: [{ el: 'C', x: -0.28, y: 0 }, { el: 'O', x: 0.32, y: 0 }], bonds: [[0, 1, 3]] },
  CO2: { atoms: [{ el: 'C', x: 0, y: 0 }, { el: 'O', x: -0.62, y: 0 }, { el: 'O', x: 0.62, y: 0 }], bonds: [[0, 1, 2], [0, 2, 2]] },
  N2O4: { atoms: [{ el: 'N', x: -0.3, y: 0 }, { el: 'N', x: 0.3, y: 0 }, { el: 'O', x: -0.78, y: -0.5 }, { el: 'O', x: -0.78, y: 0.5 }, { el: 'O', x: 0.78, y: -0.5 }, { el: 'O', x: 0.78, y: 0.5 }], bonds: [[0, 1, 1], [0, 2, 2], [0, 3, 1], [1, 4, 2], [1, 5, 1]] }
});
export const moleculeAtoms = formula => {
  const m = MOLECULES[formula];
  if (!m) throw new Error(`reactdata-names: no picture for ${formula}`);
  return m;
};
/** The atoms a picture draws, counted by element. */
export function countDrawn(picture) {
  return picture.atoms.reduce((c, a) => { c[a.el] = (c[a.el] || 0) + 1; return c; }, {});
}

/** The roman numeral of a metal ion's charge (1 to 7). */
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];
export const romanOf = q => ROMAN[q] || '';

/** The charge of one metal ion, from the printed charge of the rest of a neutral group: `-6` over 2 metals is 3. */
export function metalChargeFrom(printedSum, nMetal) {
  return -printedSum / nMetal;
}

/** The sum of the charges PRINTED on pieces (each `{ion, hide}`); a piece that hides its charge adds nothing. */
export function printedCharge(chips) {
  const counts = {};
  for (const c of chips) if (!c.hide) counts[c.ion] = (counts[c.ion] || 0) + 1;
  return netCharge(counts);
}

/** A formula as a row of tokens spells it: subscript digits and brackets joined, spaces dropped. Always plain digits (`Ca(NO3)2`). */
const SUBS = '₀₁₂₃₄₅₆₇₈₉';
export function spell(tokens) {
  return tokens.filter(Boolean).map(t => String(t).replace(/[₀-₉]/g, c => String(SUBS.indexOf(c)))).join('');
}
/** Atoms a spelled formula holds, or null when it does not read as a formula. */
export function atomsOfSpelled(text) {
  try { return parseFormula(text); } catch { return null; }
}

/** The words of an acid's name before "acid": `HCl` → `hydrochloric`, `HNO3` → `nitric`. */
export function acidWord(formula) {
  const full = nameAcid(formula);
  return full ? full.replace(/ acid$/, '') : null;
}

/** Normalise a molecular name's elision so `tetraoxide` and `tetroxide` are one name. */
export const squashName = text => String(text).toLowerCase().replace(/[^a-z]/g, '').replace(/(tetra|penta|mono|hexa|hepta|octa)oxide/g, (_, p) => `${p.slice(0, -1)}oxide`);

export { IONS, ionicFormula, nameIonic, nameMolecular, nameAcid, pretty };
