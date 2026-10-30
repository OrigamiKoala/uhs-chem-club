/**
 * kits/matter-parts.js — the pure shapes the matter kit's flat pictures and solids are both made from (Mirrowen).
 *
 * PURE, NODE-IMPORTABLE, NO DOM AND NO THREE. A molecule's atoms and bonds, the size of an atom's cloud and the colour of an element are
 * decided here once, so the card, the probe and the reward model draw one molecule.
 */

import { SUBSTANCES } from '../../engine/matterdata.js';

export const ELEMENT_INK = Object.freeze({ H: '#d8d2c4', C: '#4a4640', O: '#a0522d', N: '#6f8fb0', Cl: '#c9b66a', S: '#b9a23a', P: '#a8744b', F: '#78a142', He: '#b8afa0', Ne: '#b8afa0', Ar: '#b8afa0', Kr: '#b8afa0', Xe: '#b8afa0' });
export const inkOf = el => ELEMENT_INK[el] || '#b8afa0';

/**
 * A molecule's atoms as a flat glyph in a frame about 2.4 wide and 1.8 high (a bond is 1 long): `[el, x, y]`, and the bonds as pairs of
 * indexes. A chain is a zigzag; neopentane is a carbon with four arms. Hydrogens on a carbon chain are not drawn (a skeletal picture).
 */
const zig = n => Array.from({ length: n }, (_, i) => ['C', (i - (n - 1) / 2) * 0.86, i % 2 ? 0.25 : -0.25]);
const chainBonds = n => Array.from({ length: n - 1 }, (_, i) => [i, i + 1]);

export const GLYPHS = Object.freeze({
  H2O:   { atoms: [['O', 0, 0.3], ['H', -0.78, -0.35], ['H', 0.78, -0.35]], bonds: [[0, 1], [0, 2]] },
  H2S:   { atoms: [['S', 0, 0.3], ['H', -0.85, -0.3], ['H', 0.85, -0.3]], bonds: [[0, 1], [0, 2]] },
  NH3:   { atoms: [['N', 0, 0.25], ['H', -0.9, -0.35], ['H', 0, -0.55], ['H', 0.9, -0.35]], bonds: [[0, 1], [0, 2], [0, 3]] },
  PH3:   { atoms: [['P', 0, 0.25], ['H', -0.95, -0.35], ['H', 0, -0.55], ['H', 0.95, -0.35]], bonds: [[0, 1], [0, 2], [0, 3]] },
  HF:    { atoms: [['H', -0.5, 0], ['F', 0.5, 0]], bonds: [[0, 1]] },
  HCl:   { atoms: [['H', -0.55, 0], ['Cl', 0.55, 0]], bonds: [[0, 1]] },
  CH4:   { atoms: [['C', 0, 0]], bonds: [] },
  C2H6:  { atoms: zig(2), bonds: chainBonds(2) },
  C3H8:  { atoms: zig(3), bonds: chainBonds(3) },
  C4H10: { atoms: zig(4), bonds: chainBonds(4) },
  C5H12: { atoms: zig(5), bonds: chainBonds(5) },
  neoC5: { atoms: [['C', 0, 0], ['C', -0.85, 0], ['C', 0.85, 0], ['C', 0, 0.85], ['C', 0, -0.85]], bonds: [[0, 1], [0, 2], [0, 3], [0, 4]] },
  acetone: { atoms: [['C', -0.86, -0.25], ['C', 0, 0.25, '+'], ['C', 0.86, -0.25], ['O', 0, 1.15]], bonds: [[0, 1], [1, 2], [1, 3]] },
  ethanol: { atoms: [['C', -0.86, -0.25], ['C', 0, 0.25], ['O', 0.86, -0.25], ['H', 1.55, 0.1]], bonds: [[0, 1], [1, 2], [2, 3]] },
  ether: { atoms: [['C', -1.4, 0.25], ['C', -0.55, -0.25], ['O', 0.3, 0.25], ['C', 1.15, -0.25], ['C', 2.0, 0.25]].map(([e, x, y]) => [e, x * 0.78, y]), bonds: [[0, 1], [1, 2], [2, 3], [3, 4]] },
  hexane: { atoms: zig(6), bonds: chainBonds(6) }
});

/** The sign a polar molecule's atom carries (`'+'`, `'−'` or null): hydrogens and the carbonyl carbon are positive, the O, N, F, Cl, S and P they sit against negative. */
export function markOf(atom) {
  if (atom[3]) return atom[3];
  if (atom[0] === 'H') return '+';
  return ['O', 'N', 'F', 'Cl', 'S', 'P'].includes(atom[0]) ? '−' : null;
}

/** The glyph of a substance: noble gases are one disc whose size follows the atom's van der Waals radius. */
export function glyphOf(id) {
  const g = GLYPHS[id];
  if (g) return g;
  const s = SUBSTANCES[id];
  if (s) return { atoms: [[id, 0, 0]], bonds: [] };
  return { atoms: [[id, 0, 0]], bonds: [] };
}

/** The radius of an atom's cloud in frame units: a noble gas by its van der Waals radius, anything else by one size. */
export function cloudRadius(id) {
  const s = SUBSTANCES[id];
  return s && s.r ? (s.r / 216) * 1.2 : 0.34;
}

/** The sign of heat in a pull: a heat in kJ printed to the digits the bench reads. */
export const fmtKJ = v => (v < 1 ? (v + 1e-9).toFixed(2) : v < 100 ? (v + 1e-9).toFixed(1) : String(Math.round(v)));
