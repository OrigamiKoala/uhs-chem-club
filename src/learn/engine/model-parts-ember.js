/**
 * model-parts-ember.js — the solid models Ember Reach's reward cards show: molecules the benches break and build, side by side, and
 * a box of particles spread through its cells.
 *
 * PURE DATA, like `model-parts.js`, which asks `emberModelParts(spec)` first and falls through when it answers null. Every count is
 * derived from the spec (a molecule's atoms from its name, a box's particles from the cells it lists), never typed twice.
 *
 *   { type: 'molecule', name }                                    one ball-and-stick molecule from the table below
 *   { type: 'molecules', items: ['methane', 'oxygen', ...] }      several molecules side by side
 *   { type: 'box', cells: 8, filled: [1, 3, 6, 8], gate?: 4 }     a box of cells with a particle in each filled cell
 */

const COLOR = { H: '#d8d2c4', C: '#4a4640', O: '#a0522d', N: '#6f8fb0', bond: '#8c8376', particle: '#d99423' };
const RADIUS = { H: 0.26, C: 0.4, O: 0.36, N: 0.38 };

/** Ball-and-stick molecules: atoms with positions (display units) and bonds [i, j, order]. */
export const EMBER_MOLECULES = {
  hydrogen: { atoms: [['H', -0.37, 0, 0], ['H', 0.37, 0, 0]], bonds: [[0, 1, 1]], formula: 'H₂' },
  oxygen: { atoms: [['O', -0.6, 0, 0], ['O', 0.6, 0, 0]], bonds: [[0, 1, 2]], formula: 'O₂' },
  nitrogen: { atoms: [['N', -0.55, 0, 0], ['N', 0.55, 0, 0]], bonds: [[0, 1, 3]], formula: 'N₂' },
  water: { atoms: [['O', 0, 0, 0], ['H', -0.76, -0.59, 0], ['H', 0.76, -0.59, 0]], bonds: [[0, 1, 1], [0, 2, 1]], formula: 'H₂O' },
  methane: { atoms: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', 0.63, -0.63, -0.63], ['H', -0.63, 0.63, -0.63], ['H', -0.63, -0.63, 0.63]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]], formula: 'CH₄' },
  'carbon dioxide': { atoms: [['C', 0, 0, 0], ['O', -1.16, 0, 0], ['O', 1.16, 0, 0]], bonds: [[0, 1, 2], [0, 2, 2]], formula: 'CO₂' },
  ammonia: { atoms: [['N', 0, 0.35, 0], ['H', 0.94, -0.1, 0], ['H', -0.47, -0.1, 0.81], ['H', -0.47, -0.1, -0.81]], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]], formula: 'NH₃' },
  'nitric oxide': { atoms: [['N', -0.58, 0, 0], ['O', 0.58, 0, 0]], bonds: [[0, 1, 2]], formula: 'NO' }
};

/** The atoms and bonds of one named molecule, shifted by `dx` along x. */
export function emberMolecule(name, dx = 0) {
  const m = EMBER_MOLECULES[name];
  if (!m) return null;
  return {
    spheres: m.atoms.map(([el, x, y, z]) => ({ pos: [x + dx, y, z], r: RADIUS[el] || 0.35, color: COLOR[el] || COLOR.H, kind: el })),
    bonds: m.bonds.map(([a, b, order]) => ({ a: [m.atoms[a][1] + dx, m.atoms[a][2], m.atoms[a][3]], b: [m.atoms[b][1] + dx, m.atoms[b][2], m.atoms[b][3]], order })),
    reach: Math.max(...m.atoms.map(a => Math.hypot(a[1], a[2], a[3]))) + 0.5
  };
}

/** The parts of an Ember model spec, or null when the spec is not one of this file's. */
export function emberModelParts(spec) {
  if (spec.type === 'molecule' && EMBER_MOLECULES[spec.name]) {
    const m = emberMolecule(spec.name);
    return { spheres: m.spheres, bonds: m.bonds, rings: [], electrons: [], radius: m.reach };
  }
  if (spec.type === 'molecules') {
    const gap = 3.1;
    const n = spec.items.length;
    const all = { spheres: [], bonds: [], rings: [], electrons: [], radius: 0 };
    spec.items.forEach((name, i) => {
      const dx = (i - (n - 1) / 2) * gap;
      const m = emberMolecule(name, dx);
      if (!m) throw new Error(`model: no molecule "${name}"`);
      all.spheres.push(...m.spheres);
      all.bonds.push(...m.bonds);
      all.radius = Math.max(all.radius, Math.abs(dx) + m.reach);
    });
    return all;
  }
  if (spec.type === 'box') {
    // A row of cells, one particle in each filled cell; the frame is thin rods and the gate (if any) a thin wall between two cells.
    const cells = spec.cells;
    const pitch = 0.9;
    const w = cells * pitch;
    const x0 = -w / 2;
    const h = 1.1;
    const parts = { spheres: [], bonds: [], rings: [], electrons: [], radius: w / 2 + 0.6 };
    (spec.filled || []).forEach(c => parts.spheres.push({ pos: [x0 + (c - 0.5) * pitch, 0, 0], r: 0.26, color: COLOR.particle, kind: 'particle' }));
    const rod = (a, b) => parts.bonds.push({ a, b, order: 1, thin: true });
    const corners = [[x0, -h / 2, -h / 2], [x0 + w, -h / 2, -h / 2], [x0 + w, h / 2, -h / 2], [x0, h / 2, -h / 2], [x0, -h / 2, h / 2], [x0 + w, -h / 2, h / 2], [x0 + w, h / 2, h / 2], [x0, h / 2, h / 2]];
    for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) rod(corners[i], corners[j]);
    if (spec.gate) {
      const gx = x0 + spec.gate * pitch;
      rod([gx, -h / 2, 0], [gx, h / 2, 0]);
    }
    return parts;
  }
  return null;
}

/** The words under an Ember model, or null. */
export function emberCaption(spec) {
  if (spec.type === 'molecules') return `${spec.items.map(n => EMBER_MOLECULES[n]?.formula || n).join(', ')}, as ball-and-stick models.`;
  if (spec.type === 'box') return `${(spec.filled || []).length} particles in a box of ${spec.cells} cells.`;
  return null;
}
