/**
 * vsepr.js — Where the arms of a hub settle, which way a molecule leans in a
 * field, and how its orbitals mix.
 *
 * PURE. No DOM, no canvas, no three.js: the domain rig draws a projection of
 * these vectors on its plates and (at T4) stands them in the well as real arms,
 * both from the SAME `planDomains`, and `verify:learn` rebuilds every molecule
 * a stage grades against here.
 *
 * THE INSTRUMENT KNOWS NO NAMES UNTIL A CARD EARNS THEM. Everything here returns
 * numbers and vectors; the shape names are returned alongside so a quest can
 * decide when the word becomes sayable. The rig never prints one on its own.
 *
 * MEASURED, NOT IDEAL. A lone pair pushes harder than a bonding pair, so
 * ammonia's bonds sit at 107 degrees and water's at 104.5, not at the tetrahedral
 * 109.5. Those two figures (and bent three-domain molecules at 119) are the real
 * measured angles; every other shape is the ideal one.
 */

import { ELECTRONEGATIVITY } from './electrons.js';

/** Pauling electronegativities: the table `electrons.js` holds, plus what Ligar needs. */
export const EN = {
  ...ELECTRONEGATIVITY,
  Be: 1.57, B: 2.04, Mg: 1.31, Al: 1.61, Si: 1.90, P: 2.19, S: 2.58, Xe: 2.60, Br: 2.96, I: 2.66
};

const norm = v => {
  const m = Math.hypot(v[0], v[1], v[2]) || 1;
  return [v[0] / m, v[1] / m, v[2] / m];
};
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const RAD = Math.PI / 180;

/** Ideal unit vectors for n domains. Index order is the order sockets are filled. */
export const IDEAL = {
  1: [[0, 0, 1]],
  2: [[0, 0, 1], [0, 0, -1]],
  3: [[0, 1, 0], [-0.866, -0.5, 0], [0.866, -0.5, 0]],
  4: [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]].map(norm),
  // Two axial, then three in the equatorial plane.
  5: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-0.5, 0, 0.866], [-0.5, 0, -0.866]],
  6: [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]
};

/** Which sockets a lone pair takes first: the equator of five, opposite sides of six. */
const LONE_ORDER = {
  1: [0], 2: [0, 1], 3: [0, 1, 2], 4: [0, 1, 2, 3],
  5: [2, 3, 4, 0, 1],
  6: [1, 0, 2, 3, 4, 5]
};

/** Shape names, by bonded atoms and lone pairs on the hub. */
export const SHAPES = {
  '1-0': { shape: 'linear', electron: 'linear' },
  '2-0': { shape: 'linear', electron: 'linear' },
  '3-0': { shape: 'trigonal planar', electron: 'trigonal planar' },
  '2-1': { shape: 'bent', electron: 'trigonal planar' },
  '4-0': { shape: 'tetrahedral', electron: 'tetrahedral' },
  '3-1': { shape: 'trigonal pyramidal', electron: 'tetrahedral' },
  '2-2': { shape: 'bent', electron: 'tetrahedral' },
  '5-0': { shape: 'trigonal bipyramidal', electron: 'trigonal bipyramidal' },
  '4-1': { shape: 'seesaw', electron: 'trigonal bipyramidal' },
  '3-2': { shape: 'T-shaped', electron: 'trigonal bipyramidal' },
  '2-3': { shape: 'linear', electron: 'trigonal bipyramidal' },
  '6-0': { shape: 'octahedral', electron: 'octahedral' },
  '5-1': { shape: 'square pyramidal', electron: 'octahedral' },
  '4-2': { shape: 'square planar', electron: 'octahedral' }
};

/** The real bond angle (degrees) where a lone pair squeezes it. */
export const MEASURED_ANGLE = { '3-1': 107, '2-2': 104.5, '2-1': 119 };

/** Hybrid name by domains on the hub. */
export const HYBRID = { 1: 's', 2: 'sp', 3: 'sp2', 4: 'sp3', 5: 'sp3d', 6: 'sp3d2' };

function compressed(key, ideal, loneAt, nBond) {
  // Only the shapes with a measured angle are rebuilt; the rest keep the ideal set.
  const theta = MEASURED_ANGLE[key];
  if (!theta) return null;
  if (key === '3-1') {
    const c2 = (Math.cos(theta * RAD) + 0.5) / 1.5;
    const a = Math.acos(Math.sqrt(c2));
    const bonds = [0, 1, 2].map(k => {
      const phi = (90 + 120 * k) * RAD;
      return [Math.sin(a) * Math.cos(phi), -Math.cos(a), Math.sin(a) * Math.sin(phi)];
    });
    return { bonds, lone: [[0, 1, 0]] };
  }
  const half = (theta / 2) * RAD;
  const bonds = [[-Math.sin(half), -Math.cos(half), 0], [Math.sin(half), -Math.cos(half), 0]];
  if (key === '2-2') return { bonds, lone: [norm([0, 0.58, 0.82]), norm([0, 0.58, -0.82])] };
  return { bonds, lone: [[0, 1, 0]] };
}

/**
 * Settle a hub. `arms` is a list of `{ kind: 'atom', sym, mult? }` and
 * `{ kind: 'lone' }`. A multiple bond is ONE arm, because it is one region of
 * electrons however many pairs are in it.
 */
export function planDomains(arms) {
  const n = arms.length;
  const lone = arms.filter(a => a.kind === 'lone').length;
  const bonds = n - lone;
  const key = `${bonds}-${lone}`;
  const names = SHAPES[key] || { shape: null, electron: null };
  if (!n) return { n: 0, bonds: 0, lone: 0, key, ...names, vectors: [], hybrid: null };

  const ideal = IDEAL[Math.min(6, n)] || IDEAL[6];
  const squeeze = compressed(key, ideal, null, bonds);
  const vectors = [];

  if (squeeze) {
    let b = 0; let l = 0;
    arms.forEach((a, i) => {
      const v = a.kind === 'lone' ? squeeze.lone[l++] : squeeze.bonds[b++];
      vectors.push({ i, ...a, v });
    });
  } else {
    // Lone pairs take their sockets first; atoms fill the rest in order.
    const order = LONE_ORDER[Math.min(6, n)];
    const loneSockets = order.slice(0, lone);
    const free = ideal.map((_, k) => k).filter(k => !loneSockets.includes(k));
    let li = 0; let fi = 0;
    arms.forEach((a, i) => {
      const socket = a.kind === 'lone' ? loneSockets[li++] : free[fi++];
      vectors.push({ i, ...a, v: ideal[socket] });
    });
  }
  return { n, bonds, lone, key, ...names, vectors, hybrid: HYBRID[Math.min(6, n)] || null };
}

/** The angle between two arms in degrees, to the nearest half degree. */
export function angleBetween(plan, i, j) {
  const a = plan.vectors[i]; const b = plan.vectors[j];
  if (!a || !b) return null;
  const c = Math.max(-1, Math.min(1, dot(a.v, b.v)));
  return Math.round((Math.acos(c) / RAD) * 2) / 2;
}

/** Every distinct bond-to-bond angle a hub makes, sorted. */
export function bondAngles(plan) {
  const atoms = plan.vectors.filter(v => v.kind === 'atom');
  const out = new Set();
  for (let a = 0; a < atoms.length; a++) {
    for (let b = a + 1; b < atoms.length; b++) {
      const c = Math.max(-1, Math.min(1, dot(atoms[a].v, atoms[b].v)));
      out.add(Math.round((Math.acos(c) / RAD) * 2) / 2);
    }
  }
  return [...out].sort((x, y) => x - y);
}

/* ------------------------------------------------------------------
   THE MOLECULES THE RIG HOLDS
   ------------------------------------------------------------------ */

const A = (sym, mult = 1) => ({ kind: 'atom', sym, mult });
const L = () => ({ kind: 'lone' });
const many = (n, f) => Array.from({ length: n }, f);

/**
 * `arms` as they hang on the hub. `skeleton` lists every bond with its multiplicity,
 * for counting sigma and pi bonds.
 */
export const RIG_MOLECULES = {
  H2: { id: 'H2', label: 'H₂', hub: 'H', arms: [A('H')] },
  HCl: { id: 'HCl', label: 'HCl', hub: 'H', arms: [A('Cl')] },
  NaCl: { id: 'NaCl', label: 'NaCl', hub: 'Na', arms: [A('Cl')] },
  CO2: { id: 'CO2', label: 'CO₂', hub: 'C', arms: [A('O', 2), A('O', 2)] },
  H2O: { id: 'H2O', label: 'H₂O', hub: 'O', arms: [A('H'), A('H'), L(), L()] },
  NH3: { id: 'NH3', label: 'NH₃', hub: 'N', arms: [A('H'), A('H'), A('H'), L()] },
  CH4: { id: 'CH4', label: 'CH₄', hub: 'C', arms: many(4, () => A('H')) },
  CCl4: { id: 'CCl4', label: 'CCl₄', hub: 'C', arms: many(4, () => A('Cl')) },
  CHCl3: { id: 'CHCl3', label: 'CHCl₃', hub: 'C', arms: [A('H'), A('Cl'), A('Cl'), A('Cl')] },
  BF3: { id: 'BF3', label: 'BF₃', hub: 'B', arms: many(3, () => A('F')) },
  PCl5: { id: 'PCl5', label: 'PCl₅', hub: 'P', arms: many(5, () => A('Cl')) },
  SF4: { id: 'SF4', label: 'SF₄', hub: 'S', arms: [...many(4, () => A('F')), L()] },
  SF6: { id: 'SF6', label: 'SF₆', hub: 'S', arms: many(6, () => A('F')) },
  XeF4: { id: 'XeF4', label: 'XeF₄', hub: 'Xe', arms: [...many(4, () => A('F')), L(), L()] },
  XeF2: { id: 'XeF2', label: 'XeF₂', hub: 'Xe', arms: [A('F'), A('F'), L(), L(), L()] },
  ClF3: { id: 'ClF3', label: 'ClF₃', hub: 'Cl', arms: [A('F'), A('F'), A('F'), L(), L()] },
  HCN: { id: 'HCN', label: 'HCN', hub: 'C', arms: [A('H'), A('N', 3)] },
  C2H4: { id: 'C2H4', label: 'C₂H₄', hub: 'C', arms: [A('H'), A('H'), A('C', 2)] },
  C2H6: { id: 'C2H6', label: 'C₂H₆', hub: 'C', arms: [A('H'), A('H'), A('H'), A('C')] },
  C2H2: { id: 'C2H2', label: 'C₂H₂', hub: 'C', arms: [A('H'), A('C', 3)] }
};

const mol = m => (typeof m === 'string' ? RIG_MOLECULES[m] : m);

export function planMolecule(m) {
  return planDomains(mol(m).arms);
}

/** Sigma and pi bonds in a whole molecule given as `[a, b, multiplicity]` bonds. */
export const SKELETONS = {
  HCN: [['H', 'C', 1], ['C', 'N', 3]],
  C2H4: [['C', 'H', 1], ['C', 'H', 1], ['C', 'H', 1], ['C', 'H', 1], ['C', 'C', 2]],
  C2H6: [['C', 'H', 1], ['C', 'H', 1], ['C', 'H', 1], ['C', 'H', 1], ['C', 'H', 1], ['C', 'H', 1], ['C', 'C', 1]],
  C2H2: [['C', 'H', 1], ['C', 'H', 1], ['C', 'C', 3]],
  CO2: [['C', 'O', 2], ['C', 'O', 2]],
  N2: [['N', 'N', 3]]
};

export function countSigmaPi(id) {
  const sk = SKELETONS[id];
  if (!sk) return null;
  let sigma = 0; let pi = 0;
  for (const [, , m] of sk) { sigma += 1; pi += m - 1; }
  return { sigma, pi };
}

/* ------------------------------------------------------------------
   THE FIELD
   ------------------------------------------------------------------ */

/** The electronegativity difference across a bond, and which end is pulled negative. */
export function bondDipole(hubSym, outerSym) {
  const d = (EN[outerSym] ?? 0) - (EN[hubSym] ?? 0);
  return { diff: Math.round(d * 100) / 100, toward: d > 0 ? 'outer' : d < 0 ? 'hub' : null };
}

/** The bond dipoles of a molecule and their sum. Lone pairs add no arrow. */
export function planDipole(m) {
  const mm = mol(m);
  const plan = planDomains(mm.arms);
  const arrows = [];
  let net = [0, 0, 0];
  for (const v of plan.vectors) {
    if (v.kind !== 'atom') continue;
    const d = (EN[v.sym] ?? 0) - (EN[mm.hub] ?? 0);
    const vec = [v.v[0] * d, v.v[1] * d, v.v[2] * d];
    arrows.push({ sym: v.sym, d: Math.round(d * 100) / 100, vec, dir: v.v });
    net = [net[0] + vec[0], net[1] + vec[1], net[2] + vec[2]];
  }
  const mag = Math.hypot(net[0], net[1], net[2]);
  return { arrows, net, mag: Math.round(mag * 100) / 100, polar: mag > 0.05, plan };
}

/** A bond is nonpolar, polar or ionic by the size of the difference. */
export function bondKind(a, b) {
  const d = Math.abs((EN[a] ?? 0) - (EN[b] ?? 0));
  return d < 0.4 ? 'nonpolar' : d < 1.7 ? 'polar' : 'ionic';
}

/* ------------------------------------------------------------------
   THE MIXER
   ------------------------------------------------------------------ */

/** Blend one s cloud with `p` p clouds: the lobes that result and the p clouds left. */
export function planMix(p) {
  const lobes = p + 1;
  const angle = { 1: 180, 2: 120, 3: 109.5 }[p] ?? null;
  return {
    p, lobes, angle, leftoverP: 3 - p,
    hybrid: { 1: 'sp', 2: 'sp2', 3: 'sp3' }[p] || null
  };
}

/** Turn one end of a bond: the single bond turns freely, the double one locks. */
export function planTwist(kind) {
  if (kind === 'single') return { free: true, held: 0, why: 'Only the end-on overlap joins the two ends, and it looks the same from every angle.' };
  if (kind === 'double') return { free: false, held: 1, why: 'The side-to-side overlap is broken by any turn.' };
  return { free: false, held: 2, why: 'Two side-to-side overlaps hold it.' };
}

/* ------------------------------------------------------------------
   THE STRAIN OF AN ARRANGEMENT (the table's frame hubs)
   ------------------------------------------------------------------ */

/**
 * How hard the domains of an arrangement push on each other. `kinds[k]` is what stands at socket k of the ideal
 * polyhedron for `kinds.length` domains (`IDEAL`): 'atom', 'lone' or null (empty). Every pair repels as one over the
 * cube of the straight distance between them, and a pair that holds a lone pair repels harder: a lone pair is held by
 * one nucleus and spreads wide, so lone-lone pushes hardest and bonding-bonding least. This is the textbook ranking
 * and it is all the rule there is; where a lone pair SITS is whatever this makes smallest, which is what
 * `planDomains` hands a lone pair without being asked (`LONE_ORDER`) and `verify:learn` holds the two to each other.
 */
export const REPULSION = Object.freeze({ bond: 1, mixed: 1.4, lone: 2, power: 3 });

export function domainStrain(kinds) {
  const n = kinds.length;
  const sockets = IDEAL[Math.min(6, n)] || IDEAL[6];
  let total = 0;
  for (let i = 0; i < n; i++) {
    if (!kinds[i]) continue;
    for (let j = i + 1; j < n; j++) {
      if (!kinds[j]) continue;
      const d = Math.hypot(sockets[i][0] - sockets[j][0], sockets[i][1] - sockets[j][1], sockets[i][2] - sockets[j][2]);
      const w = kinds[i] === 'lone' && kinds[j] === 'lone' ? REPULSION.lone : (kinds[i] === 'lone' || kinds[j] === 'lone') ? REPULSION.mixed : REPULSION.bond;
      total += w / Math.pow(d, REPULSION.power);
    }
  }
  return Math.round(total * 1e6) / 1e6;
}

/** Every distinct way of standing `atoms` bonding domains and `lone` lone pairs on the sockets of `atoms + lone` domains. */
export function arrangements(atoms, lone) {
  const n = atoms + lone;
  const out = [];
  const pick = (start, left, cur) => {
    if (left === 0) { out.push(Array.from({ length: n }, (_, k) => (cur.includes(k) ? 'lone' : 'atom'))); return; }
    for (let k = start; k < n; k++) pick(k + 1, left - 1, [...cur, k]);
  };
  pick(0, lone, []);
  return out;
}

/** The smallest strain any arrangement of these domains can have. */
export function bestStrain(atoms, lone) {
  return Math.min(...arrangements(atoms, lone).map(domainStrain));
}

/** The socket index pairs `[i, j]` of a polyhedron whose domains are `degrees` apart (to the nearest degree). */
export function socketAngle(n, i, j) {
  const s = IDEAL[Math.min(6, n)] || IDEAL[6];
  const c = Math.max(-1, Math.min(1, dot(s[i], s[j])));
  return Math.round((Math.acos(c) / RAD) * 2) / 2;
}

/**
 * How far the hub sits from the plane through the tips of its three atoms, in units of an arm. Flat (0) for three
 * atoms that lie in a plane with the hub in it; above it for a pyramid. Null for any other count of atoms.
 */
export function hubHeight(plan) {
  const t = plan.vectors.filter(v => v.kind === 'atom').map(v => v.v);
  if (t.length !== 3) return null;
  const a = [t[1][0] - t[0][0], t[1][1] - t[0][1], t[1][2] - t[0][2]];
  const b = [t[2][0] - t[0][0], t[2][1] - t[0][1], t[2][2] - t[0][2]];
  const n = [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const m = Math.hypot(n[0], n[1], n[2]);
  if (m < 1e-9) return 0;
  return Math.round((Math.abs(dot(n, t[0])) / m) * 1000) / 1000;
}

/* ------------------------------------------------------------------
   THE MIXER, ALL THE WAY UP (s, p and d orbitals into a bowl)
   ------------------------------------------------------------------ */

/**
 * What a bowl of orbitals makes: one s with `p` p orbitals and `d` d orbitals blend into as many hybrid lobes as
 * orbitals went in (an s is needed: p orbitals alone do not blend into anything new). `leftoverP` is what was left
 * out of the three p orbitals an atom has, so `planMix(p)` is the same answer with no d.
 */
export function planBlend(s, p, d = 0) {
  const blends = s === 1 && p + d >= 1 && p <= 3 && d <= 2;
  const lobes = blends ? 1 + p + d : 0;
  const hybrid = blends ? ({ 2: 'sp', 3: 'sp2', 4: 'sp3', 5: 'sp3d', 6: 'sp3d2' }[lobes] || null) : null;
  return { s, p, d, blends, lobes, hybrid, leftoverP: 3 - p, angle: blends && !d ? ({ 2: 180, 3: 120, 4: 109.5 }[lobes] ?? null) : null };
}
