/**
 * model-parts-ligar.js — the solid models Ligar's reward cards show (a molecule's shape, a salt crystal, a blend of orbitals).
 *
 * PURE DATA, like `model-parts.js`, which asks `ligarParts(spec)` first and falls back to its own types. Every part is derived from
 * the numbers a bench already works with, never typed in a second place:
 *
 *   { type: 'shape', mol, lone?: false, caption? }        a hub and its arms where `vsepr.planDomains` settles them (lone pairs as faint lobes)
 *   { type: 'crystal', cation, anion, n?, caption? }      an n x n x n block of alternating ions (the lattice of `bonds.js`' grid)
 *   { type: 'lobes', n, caption? }                        the lobes of n blended orbitals, pointing where n arms settle
 *   { type: 'molecule', name }                            the small hand-set molecules in `LIGAR_MOLECULES` (found by `model-parts.js`)
 *
 * The viewer draws spheres, rods, rings and electrons; a lobe is a short chain of shrinking spheres, which is how a lobe is drawn
 * flat as well, so the picture is the same at `3D Off`.
 */

import { planDomains, RIG_MOLECULES } from './vsepr.js';

/** Display colours, in the plate's weathered palette. */
export const COLOR = {
  H: '#d8d2c4', C: '#4a4640', N: '#7b8794', O: '#a0522d', F: '#a3a86e', B: '#b08a6a', S: '#c9b04a', Cl: '#c9b66a', Xe: '#8a7fa0', Br: '#9a5a3a',
  Na: '#cfc8b8', K: '#b9b2a0', Mg: '#9aa08c', lone: '#5f584e', lobe: '#d99423', lobeAlt: '#8c8376'
};
const RADIUS = { H: 0.26, C: 0.4, N: 0.38, O: 0.36, F: 0.32, B: 0.38, S: 0.46, Cl: 0.46, Br: 0.5, Xe: 0.5, Na: 0.5, K: 0.56, Mg: 0.44 };
const dim = el => RADIUS[el] || 0.35;

/** Ball-and-stick molecules set by hand (display units): the ones a shape model cannot make (a pair, a chain). */
export const LIGAR_MOLECULES = {
  hydrogen: { atoms: [['H', -0.4, 0, 0], ['H', 0.4, 0, 0]], bonds: [[0, 1, 1]], formula: 'H₂' },
  nitrogen: { atoms: [['N', -0.56, 0, 0], ['N', 0.56, 0, 0]], bonds: [[0, 1, 3]], formula: 'N₂' },
  ozone: { atoms: [['O', 0, 0.55, 0], ['O', -0.94, -0.35, 0], ['O', 0.94, -0.35, 0]], bonds: [[0, 1, 1.5], [0, 2, 1.5]], formula: 'O₃' },
  oxygen: { atoms: [['O', -0.6, 0, 0], ['O', 0.6, 0, 0]], bonds: [[0, 1, 2]], formula: 'O₂' },
  ethene: {
    atoms: [['C', -0.67, 0, 0], ['C', 0.67, 0, 0], ['H', -1.24, 0.92, 0], ['H', -1.24, -0.92, 0], ['H', 1.24, 0.92, 0], ['H', 1.24, -0.92, 0]],
    bonds: [[0, 1, 2], [0, 2, 1], [0, 3, 1], [1, 4, 1], [1, 5, 1]], formula: 'C₂H₄'
  },
  ethane: {
    atoms: [['C', 0, -0.77, 0], ['C', 0, 0.77, 0], ['H', 1.0, -1.15, 0], ['H', -0.5, -1.15, 0.87], ['H', -0.5, -1.15, -0.87], ['H', -1.0, 1.15, 0], ['H', 0.5, 1.15, 0.87], ['H', 0.5, 1.15, -0.87]],
    bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]], formula: 'C₂H₆'
  }
};

const BOND_LEN = { H: 1.0 };
const lenOf = sym => BOND_LEN[sym] || 1.25;

/** A hub and its arms where `planDomains` puts them: atoms as spheres on rods, lone pairs as faint lobes. */
function shapeParts(spec) {
  const mol = RIG_MOLECULES[spec.mol];
  if (!mol) throw new Error(`model: no shape "${spec.mol}"`);
  const plan = planDomains(mol.arms);
  const spheres = [{ pos: [0, 0, 0], r: dim(mol.hub), color: COLOR[mol.hub] || COLOR.H, kind: mol.hub }];
  const bonds = [];
  let reach = 0.6;
  for (const v of plan.vectors) {
    if (v.kind === 'lone') {
      if (spec.lone === false) continue;
      const pos = v.v.map(c => c * 0.7);
      spheres.push({ pos, r: 0.24, color: COLOR.lone, kind: 'lone' });
      spheres.push({ pos: v.v.map(c => c * 0.38), r: 0.17, color: COLOR.lone, kind: 'lone' });
      reach = Math.max(reach, 0.95);
      continue;
    }
    const pos = v.v.map(c => c * lenOf(v.sym));
    spheres.push({ pos, r: dim(v.sym), color: COLOR[v.sym] || COLOR.H, kind: v.sym });
    bonds.push({ a: [0, 0, 0], b: pos, order: v.mult || 1 });
    reach = Math.max(reach, lenOf(v.sym) + dim(v.sym));
  }
  return { spheres, bonds, rings: [], electrons: [], radius: reach + 0.3, plan };
}

/** An n x n x n block of ions, alternating by position, with the nearest neighbours joined by faint rods. */
function crystalParts(spec) {
  const n = spec.n || 3;
  const pitch = 1.0;
  const half = (n - 1) / 2;
  const spheres = [];
  const bonds = [];
  const index = new Map();
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    const plus = (x + y + z) % 2 === 0;
    const sym = plus ? spec.cation : spec.anion;
    const pos = [(x - half) * pitch, (y - half) * pitch, (z - half) * pitch];
    index.set(`${x},${y},${z}`, pos);
    // The negative ions are the bigger ones, as in the real salt.
    spheres.push({ pos, r: plus ? 0.2 : 0.3, color: COLOR[sym] || COLOR.H, kind: sym, sign: plus ? 1 : -1 });
  }
  for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
    for (const [dx, dy, dz] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) {
      const b = index.get(`${x + dx},${y + dy},${z + dz}`);
      if (b) bonds.push({ a: index.get(`${x},${y},${z}`), b, order: 1 });
    }
  }
  return { spheres, bonds, rings: [], electrons: [], radius: half * pitch * 1.75 + 0.5, cleave: true };
}

/** One lobe along `dir`: a chain of shrinking spheres, fat end outward. */
function lobeSpheres(dir, color, scale = 1) {
  return [[0.34, 0.2], [0.62, 0.27], [0.92, 0.22]].map(([t, r]) => ({ pos: dir.map(c => c * t * scale), r: r * scale, color, kind: 'lobe' }));
}

/** The lobes of n blended orbitals, pointing where n arms settle, round a small nucleus. */
function lobesParts(spec) {
  const plan = planDomains(Array.from({ length: spec.n }, () => ({ kind: 'atom', sym: 'H', mult: 1 })));
  const spheres = [{ pos: [0, 0, 0], r: 0.2, color: COLOR.C, kind: 'C' }];
  for (const v of plan.vectors) spheres.push(...lobeSpheres(v.v, COLOR.lobe, 1.3));
  // The p orbitals not blended stand over as they were: a pair of lobes across the nucleus, in the one direction the blend leaves empty.
  for (const ax of spec.left || []) {
    const dir = ax === 'x' ? [1, 0, 0] : ax === 'y' ? [0, 1, 0] : [0, 0, 1];
    spheres.push(...lobeSpheres(dir, COLOR.lobeAlt, 1.1), ...lobeSpheres(dir.map(c => -c), COLOR.lobeAlt, 1.1));
  }
  return { spheres, bonds: [], rings: [], electrons: [], radius: 1.9 };
}

/** The parts of a Ligar model spec, or null when the spec is not one of Ligar's. */
export function ligarParts(spec) {
  if (spec.type === 'shape') return shapeParts(spec);
  if (spec.type === 'crystal') return crystalParts(spec);
  if (spec.type === 'lobes') return lobesParts(spec);
  return null;
}

/** The words under a Ligar model, or null. */
export function ligarCaption(spec) {
  if (spec.caption) return spec.caption;
  if (spec.type === 'shape') return `${RIG_MOLECULES[spec.mol]?.label || spec.mol}, with each arm where the arms settle.`;
  if (spec.type === 'crystal') return `A block of ${spec.cation} and ${spec.anion} ions, alternating in every direction.`;
  if (spec.type === 'lobes') return `${spec.n} lobes pointing as far apart as they can.`;
  return null;
}
