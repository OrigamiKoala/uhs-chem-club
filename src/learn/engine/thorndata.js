/**
 * thorndata.js — Thornmere's chemistry (unit13, organic): data tables and pure planners. No UI, no THREE.
 *
 * Every number a Thornmere bench prints comes from here, and the drawn table and the built table call the same functions, so a stage
 * grades the same at `3D On` and `3D Off`. `tools/lib/thornmere/data-checks.mjs` checks each against values typed in from the source.
 *
 * SOURCES. Boiling points and bond lengths: CRC Handbook of Chemistry and Physics (and the NIST WebBook). Electronegativity: Pauling's
 * scale. Ka of ethanoic acid 1.75e-5 and Kb of methylamine 4.4e-4 (CRC).
 *
 * THE BOARD. Carbons stand on a square lattice and bond along its lines. Every ring the lattice can hold has an even number of
 * carbons (four, six), so three- and five-membered rings cannot be drawn there; the board's Tour says so.
 *
 * A SCENE is a drawn group of molecules: atoms at fixed places (one unit is one bond length), bonds, lone pairs, charges. A reaction is
 * a list of scenes (`play`) with the curved arrows that lead from each to the next; an atom keeps its id through the list, so the
 * painter can move it. Scenes are registered per bench (`addScenes`) so no two builders edit one table.
 */

/* ------------------------------------------------------------------ elements */

/** Pauling electronegativity and the number of bonds an uncharged atom forms. */
export const EL = Object.freeze({
  H: { en: 2.20, bonds: 1, name: 'hydrogen' },
  C: { en: 2.55, bonds: 4, name: 'carbon' },
  N: { en: 3.04, bonds: 3, name: 'nitrogen' },
  O: { en: 3.44, bonds: 2, name: 'oxygen' },
  F: { en: 3.98, bonds: 1, name: 'fluorine' },
  Cl: { en: 3.16, bonds: 1, name: 'chlorine' },
  Br: { en: 2.96, bonds: 1, name: 'bromine' },
  Na: { en: 0.93, bonds: 1, name: 'sodium' }
});

/** Bond lengths in picometres. */
export const BOND_PM = Object.freeze({ 'C-C': 154, 'C=C': 134, benzene: 139 });

/* ------------------------------------------------------------------ substances */

/**
 * What the test rigs know about each substance. `bp` boiling point in °C; `ene` has a carbon–carbon double bond that bromine adds to;
 * `ph` the pH of a 0.1 mol/L solution in water (computed below for the weak acid and base); `formula` as printed on a label.
 */
export const KA_ETHANOIC = 1.75e-5;
export const KB_METHYLAMINE = 4.4e-4;

/** pH of a weak acid of concentration `c` (mol/L) from its Ka, by the exact quadratic. */
export function phWeakAcid(Ka, c) {
  const h = (-Ka + Math.sqrt(Ka * Ka + 4 * Ka * c)) / 2;
  return -Math.log10(h);
}
/** pH of a weak base of concentration `c` from its Kb at 25 °C. */
export function phWeakBase(Kb, c) {
  const oh = (-Kb + Math.sqrt(Kb * Kb + 4 * Kb * c)) / 2;
  return 14 + Math.log10(oh);
}

export const SUBSTANCES = Object.freeze({
  ethane: { name: 'Ethane', formula: 'C₂H₆', bp: -88.6, ene: false },
  ethene: { name: 'Ethene', formula: 'C₂H₄', bp: -103.7, ene: true },
  butane: { name: 'Butane', formula: 'C₄H₁₀', bp: -0.5, ene: false },
  methylpropane: { name: '2-Methylpropane', formula: 'C₄H₁₀', bp: -11.7, ene: false },
  pentane: { name: 'Pentane', formula: 'C₅H₁₂', bp: 36.1, ene: false, contact: 1.0 },
  methylbutane: { name: '2-Methylbutane', formula: 'C₅H₁₂', bp: 27.9, ene: false, contact: 0.72 },
  dimethylpropane: { name: '2,2-Dimethylpropane', formula: 'C₅H₁₂', bp: 9.5, ene: false, contact: 0.45 },
  hexane: { name: 'Hexane', formula: 'C₆H₁₄', bp: 68.7, ene: false },
  cyclohexane: { name: 'Cyclohexane', formula: 'C₆H₁₂', bp: 80.7, ene: false },
  hexene: { name: 'Hex-1-ene', formula: 'C₆H₁₂', bp: 63.5, ene: true },
  cyclopentane: { name: 'Cyclopentane', formula: 'C₅H₁₀', bp: 49.3, ene: false },
  pentene: { name: 'Pent-1-ene', formula: 'C₅H₁₀', bp: 30.0, ene: true },
  benzene: { name: 'Benzene', formula: 'C₆H₆', bp: 80.1, ene: false },
  ethanol: { name: 'Ethanol', formula: 'C₂H₆O', bp: 78.4, ene: false, ph: 7.0, hbond: true },
  methoxymethane: { name: 'Methoxymethane', formula: 'C₂H₆O', bp: -24.8, ene: false, ph: 7.0, hbond: false },
  propanone: { name: 'Propanone', formula: 'C₃H₆O', bp: 56.1, ene: false, ph: 7.0 },
  ethanoic: { name: 'Ethanoic acid', formula: 'C₂H₄O₂', bp: 117.9, ene: false, ph: phWeakAcid(KA_ETHANOIC, 0.1), acid: true },
  methylamine: { name: 'Methylamine', formula: 'CH₅N', bp: -6.3, ene: false, ph: phWeakBase(KB_METHYLAMINE, 0.1), base: true },
  naoh: { name: 'Sodium hydroxide', formula: 'NaOH', ene: false, ph: 13.0, ionic: true }
});

export const substance = id => SUBSTANCES[id] || null;
/** Does bromine water lose its colour with this substance? Only a carbon–carbon double bond (not benzene's ring) adds bromine. */
export const bromineFades = id => Boolean(SUBSTANCES[id]?.ene);
/** The meter's reading, to one decimal. */
export const phOf = id => Math.round((SUBSTANCES[id].ph + 1e-9) * 10) / 10;
export const boilOf = id => SUBSTANCES[id].bp;

/* ------------------------------------------------------------------ formulas */

const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
export const sub = n => String(n).split('').map(c => SUB[c]).join('');
/** "C₂H₆" from counts (a count of one prints no number, a count of zero prints nothing). */
export function formulaOf(counts) {
  const order = ['C', 'H', ...Object.keys(counts).filter(k => k !== 'C' && k !== 'H').sort()];
  return order.filter(k => counts[k] > 0).map(k => `${k}${counts[k] > 1 ? sub(counts[k]) : ''}`).join('');
}
/** Hydrogens on an alkane chain (or branched alkane) of `n` carbons: two per carbon and one more at each end. */
export const alkaneH = n => 2 * n + 2;
/** Each ring or double bond removes two hydrogens from the alkane's count. */
export const hydrogensFor = (n, ringsAndDoubles = 0) => 2 * n + 2 - 2 * ringsAndDoubles;
/** Links (and molecules of water given off) when `n` monomers join into one chain by condensation. */
export const linksIn = n => Math.max(0, n - 1);

/* ------------------------------------------------------------------ the board's graph */

/**
 * A carbon skeleton: `sites` (lattice indices that hold a carbon) and `bonds` ([i, j, order]). Bonds to a place with no carbon are dropped.
 * @returns {{ n, ids, adj: Map<number, Array<[number, number]>>, bonds }}
 */
export function skeleton(sites, bonds) {
  const ids = [...new Set(sites)].sort((a, b) => a - b);
  const has = new Set(ids);
  const adj = new Map(ids.map(i => [i, []]));
  const kept = [];
  for (const [a, b, o] of bonds) {
    if (!o || !has.has(a) || !has.has(b) || a === b) continue;
    adj.get(a).push([b, o]); adj.get(b).push([a, o]);
    kept.push([Math.min(a, b), Math.max(a, b), o]);
  }
  return { n: ids.length, ids, adj, bonds: kept };
}
/** Bonds a carbon has used on other carbons (a double bond counts two). */
export const usedBonds = (g, i) => (g.adj.get(i) || []).reduce((s, [, o]) => s + o, 0);
/** Hydrogens that fill a carbon's four bonds. */
export const freeBonds = (g, i) => Math.max(0, 4 - usedBonds(g, i));
export const hydrogensOf = g => g.ids.reduce((s, i) => s + freeBonds(g, i), 0);
export function componentsOf(g) {
  const seen = new Set(); let c = 0;
  for (const s of g.ids) {
    if (seen.has(s)) continue;
    c++;
    const q = [s]; seen.add(s);
    while (q.length) { const u = q.pop(); for (const [v] of g.adj.get(u)) if (!seen.has(v)) { seen.add(v); q.push(v); } }
  }
  return c;
}
export const ringsOf = g => (g.n ? g.bonds.length - g.n + componentsOf(g) : 0);
export const doublesOf = g => g.bonds.filter(b => b[2] === 2).length;
/** The number of carbons in the longest chain (the longest path that visits no carbon twice). */
export function longestChain(g) {
  let best = 0;
  const walk = (u, seen, len) => {
    if (len > best) best = len;
    for (const [v] of g.adj.get(u)) if (!seen.has(v)) { seen.add(v); walk(v, seen, len + 1); seen.delete(v); }
  };
  for (const s of g.ids) walk(s, new Set([s]), 1);
  return best;
}

const KEY_CACHE = new Map();
/**
 * A molecule's identity, whichever way it is drawn: the smallest adjacency string over every ordering of its carbons. Two builds are the
 * same molecule exactly when their keys are equal. Exact, by trying every ordering, for the eight carbons at most a board holds.
 */
export function canonKey(g) {
  const sig = `${g.ids.join(',')}|${g.bonds.map(b => b.join(':')).sort().join(',')}`;
  if (KEY_CACHE.has(sig)) return KEY_CACHE.get(sig);
  const n = g.n;
  if (n === 0) { KEY_CACHE.set(sig, ''); return ''; }
  if (n > 8) throw new Error('canonKey: more than eight carbons');
  const idx = new Map(g.ids.map((id, k) => [id, k]));
  const M = Array.from({ length: n }, () => new Array(n).fill(0));
  for (const [a, b, o] of g.bonds) { M[idx.get(a)][idx.get(b)] = o; M[idx.get(b)][idx.get(a)] = o; }
  // Order candidates by degree first so the search is small: only orderings that keep the sorted invariant are tried.
  const inv = M.map(row => `${row.reduce((s, v) => s + v, 0)}.${row.filter(v => v).length}`);
  const perm = []; const used = new Array(n).fill(false);
  let best = null;
  const sortedInv = [...inv].sort();
  const rec = k => {
    if (k === n) {
      let s = '';
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) s += M[perm[i]][perm[j]];
      if (best === null || s < best) best = s;
      return;
    }
    for (let v = 0; v < n; v++) {
      if (used[v] || inv[v] !== sortedInv[k]) continue;
      used[v] = true; perm[k] = v; rec(k + 1); used[v] = false;
    }
  };
  rec(0);
  const key = `${n}:${sortedInv.join(',')}:${best}`;
  KEY_CACHE.set(sig, key);
  return key;
}

/** A skeleton from a short description: `chain(4)`, or carbons and bonds by hand. Used for targets and checks. */
export function chain(n, { double = [], ring = false, branches = [] } = {}) {
  const sites = Array.from({ length: n }, (_, i) => i);
  const bonds = [];
  for (let i = 0; i < n - 1; i++) bonds.push([i, i + 1, double.includes(i) ? 2 : 1]);
  if (ring) bonds.push([n - 1, 0, 1]);
  let next = n;
  for (const at of branches) { sites.push(next); bonds.push([at, next, 1]); next++; }
  return skeleton(sites, bonds);
}

/** Named skeletons the benches ask for, and their keys. */
export const TARGETS = Object.freeze({
  ethane: chain(2), propane: chain(3), butane: chain(4), pentane: chain(5), hexane: chain(6),
  methylpropane: chain(3, { branches: [1] }),
  methylbutane: chain(4, { branches: [1] }),
  dimethylpropane: chain(3, { branches: [1, 1] }),
  methylpentane3: chain(5, { branches: [2] }),
  cyclobutane: chain(4, { ring: true }),
  cyclohexane: chain(6, { ring: true }),
  ethene: chain(2, { double: [0] }),
  propene: chain(3, { double: [0] })
});
export const keyOf = name => canonKey(TARGETS[name]);
export const ALKANE_NAMES = Object.freeze(['', 'methane', 'ethane', 'propane', 'butane', 'pentane', 'hexane']);
export const CHAIN_PREFIX = Object.freeze(['', 'meth-', 'eth-', 'prop-', 'but-', 'pent-', 'hex-']);
/** The structural isomers of the alkanes CₙH₂ₙ₊₂ (standard counts). */
export const ISOMER_COUNT = Object.freeze({ 1: 1, 2: 1, 3: 1, 4: 2, 5: 3, 6: 5 });

/* ------------------------------------------------------------------ scenes */

const SCENES = new Map();
const PLAYS = new Map();

/**
 * Register scenes. A scene: `{ atoms: { id: { el, x, y, label?, q?, mark? } }, bonds: [[a, b, order]], lone: [[atom, angleDeg]], note? }`.
 * `label` replaces the element letter with a group ("CH₃"): such an atom's hydrogens are not drawn one by one.
 */
export function addScenes(table) { for (const [id, s] of Object.entries(table)) SCENES.set(id, Object.freeze(s)); }
/** Register reactions. A play: `{ scenes: [id, ...], arrows: [[{ src, dst }, ...], ...] }`, one arrow list per step between scenes. */
export function addPlays(table) { for (const [id, p] of Object.entries(table)) PLAYS.set(id, Object.freeze(p)); }
export const sceneOf = id => SCENES.get(id) || null;
export const playOf = id => PLAYS.get(id) || null;
export const allSceneIds = () => [...SCENES.keys()];
export const allPlayIds = () => [...PLAYS.keys()];

export const bondId = (a, b) => `${a}-${b}`;
/**
 * The electron pairs of a scene that can be pointed at: the pair of each single bond (`s:a-b`), the two pairs of a double bond (`s:a-b` on
 * the line between the atoms and `p:a-b` beside it), and each lone pair (`l:atom:k`).
 */
export function pairsOf(scene) {
  const out = [];
  for (const [a, b, o] of scene.bonds) {
    out.push({ id: `s:${bondId(a, b)}`, kind: 's', a, b });
    if (o >= 2) out.push({ id: `p:${bondId(a, b)}`, kind: 'p', a, b });
  }
  const seen = {};
  for (const [atom, angle] of scene.lone || []) {
    const k = seen[atom] = (seen[atom] ?? -1) + 1;
    out.push({ id: `l:${atom}:${k}`, kind: 'l', a: atom, angle });
  }
  return out;
}

/**
 * Where a shared pair is DRAWN along the bond from `a` to `b`, as a fraction (0.5 is midway). The pair is drawn nearer the atom with the
 * larger electronegativity, and the shift is drawn larger than life so it can be seen (a C–H pair sits just on carbon's side of the
 * middle, a C–O pair clearly on oxygen's). A drawing rule, not a measurement: the Tour says so.
 */
export function pairPlace(elA, elB) {
  const d = EL[elB].en - EL[elA].en;
  return Math.max(0.2, Math.min(0.8, 0.5 + 0.28 * d));
}

/** Bonds an atom has in a scene (a double bond counts two). */
export function bondsOn(scene, atom) {
  return scene.bonds.reduce((s, [a, b, o]) => s + (a === atom || b === atom ? o : 0), 0);
}
/** The bonds an atom of this kind holds at most when it is drawn as a single atom (a group label holds all of its own). */
export function seatsOf(scene, atom) {
  const A = scene.atoms[atom];
  if (A.label) return bondsOn(scene, atom);
  if (A.el === 'C') return 4;
  if (A.el === 'H') return 1;
  return EL[A.el].bonds + Math.max(0, A.q || 0);
}
/**
 * How short of electrons an atom is drawn: the sum, over its bonds, of how far each shared pair sits toward the other atom. Positive means
 * electron-poor. A positive charge counts as one whole pair.
 */
export function poorness(scene, atom) {
  const A = scene.atoms[atom];
  let s = (A.q || 0) > 0 ? 1 : 0;
  for (const [a, b, o] of scene.bonds) {
    if (a !== atom && b !== atom) continue;
    const other = scene.atoms[a === atom ? b : a];
    if (other.label && other.el === 'C' && A.el === 'C') continue;
    s += o * (pairPlace(A.el, other.el) - 0.5);
  }
  return s;
}
/** The atom of a scene that is shortest of electrons among `among` (default: every atom). */
export function poorestAtom(scene, among = null) {
  const ids = among || Object.keys(scene.atoms);
  return ids.reduce((best, id) => (best === null || poorness(scene, id) > poorness(scene, best) + 1e-9 ? id : best), null);
}

const nameOf = A => (A.label ? `${A.label} group` : EL[A.el].name);

/**
 * What happens when a pair is sent to an atom. `right` is the arrow that begins the step (`{ src, dst }`); `wrongs` is the stage's own list
 * of `{ src?, dst?, msg }` (first match wins). Anything else gets a reason from what the scene shows: never the answer.
 * @returns {{ ok: true } | { ok: false, msg: string }}
 */
export function judgeArrow(scene, src, dst, right, wrongs = []) {
  if (src === right.src && dst === right.dst) return { ok: true };
  for (const w of wrongs) if ((w.src == null || w.src === src) && (w.dst == null || w.dst === dst)) return { ok: false, msg: w.msg };
  const D = scene.atoms[dst];
  const pair = pairsOf(scene).find(p => p.id === src);
  if (pair && (pair.a === dst || pair.b === dst)) return { ok: false, msg: 'That pair is already held by that atom.' };
  if (D.el === 'H' && !D.label) return { ok: false, msg: 'Hydrogen holds one bond, and it did not give way: the pair returned.' };
  if (pair && pair.kind === 's') return { ok: false, msg: 'That pair is held on the line between two atoms, and it returned.' };
  if (bondsOn(scene, dst) >= seatsOf(scene, dst) && poorness(scene, dst) <= 0.05) {
    return { ok: false, msg: `That ${nameOf(D)} is not short of electrons, and the pair returned.` };
  }
  return { ok: false, msg: 'The pair returned to where it was.' };
}

/* ------------------------------------------------------------------ mirror images */

/** The four corners of a tetrahedron, one bond length from the centre. */
export const TETRA = Object.freeze([[0, 1, 0], [0.9428, -0.3333, 0], [-0.4714, -0.3333, 0.8165], [-0.4714, -0.3333, -0.8165]]);
/** The twelve ways of turning a tetrahedron onto itself, as the corner each corner goes to (the even permutations of four). */
export const TETRA_TURNS = Object.freeze((() => {
  const out = [];
  const rec = (p, used) => {
    if (p.length === 4) {
      let inv = 0;
      for (let i = 0; i < 4; i++) for (let j = i + 1; j < 4; j++) if (p[i] > p[j]) inv++;
      if (inv % 2 === 0) out.push([...p]);
      return;
    }
    for (let v = 0; v < 4; v++) if (!used[v]) { used[v] = true; p.push(v); rec(p, used); p.pop(); used[v] = false; }
  };
  rec([], [false, false, false, false]);
  return out;
})());
/** A mirror image of four groups on a tetrahedron: two corners change places. */
export const mirrorOf = groups => [groups[0], groups[1], groups[3], groups[2]];
/** After turn `t`, how many corners of the turned image hold the same group as the original (0 to 4). */
export function mirrorMatches(groups, t) {
  const img = mirrorOf(groups);
  const turn = TETRA_TURNS[t];
  let n = 0;
  for (let c = 0; c < 4; c++) if (img[c] === groups[turn[c]]) n++;
  return n;
}
/** Can any turn lay the mirror image on the original? False exactly when the four groups are all different. */
export const superposable = groups => TETRA_TURNS.some((_, t) => mirrorMatches(groups, t) === 4);
export const isChiral = groups => !superposable(groups);

/* ------------------------------------------------------------------ the slice's scenes (q2-unsat) */

const H = (x, y) => ({ el: 'H', x, y });
const Cc = (x, y, o = {}) => ({ el: 'C', x, y, ...o });

addScenes({
  /* Ethene and hydrogen bromide, before anything has moved. */
  'hbr-ethene-0': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0),
      h1: H(-0.6, 0.85), h2: H(-0.6, -0.85), h3: H(1.9, 0.85), h4: H(1.9, -0.85),
      hb: H(0.1, 1.75), br: { el: 'Br', x: 0.1, y: 3.0 }
    },
    bonds: [['c1', 'c2', 2], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c2', 'h3', 1], ['c2', 'h4', 1], ['hb', 'br', 1]],
    lone: [['br', 0], ['br', 90], ['br', 180]]
  },
  /* The double bond's second pair has bonded to hydrogen; the H–Br pair has left with bromine. */
  'hbr-ethene-1': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0, { q: 1 }),
      h1: H(-0.85, 0.5), h2: H(-0.6, -0.85), h3: H(1.9, 0.85), h4: H(1.9, -0.85),
      hb: H(0, 1.05), br: { el: 'Br', x: 2.7, y: 2.6, q: -1 }
    },
    bonds: [['c1', 'c2', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c2', 'h3', 1], ['c2', 'h4', 1], ['c1', 'hb', 1]],
    lone: [['br', 0], ['br', 90], ['br', 180], ['br', 270]]
  },
  /* Bromide has bonded to the carbon that had three bonds: bromoethane. */
  'hbr-ethene-2': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0),
      h1: H(-0.85, 0.5), h2: H(-0.6, -0.85), h3: H(2.15, 0.5), h4: H(1.9, -0.85),
      hb: H(0, 1.05), br: { el: 'Br', x: 1.3, y: 1.3 }
    },
    bonds: [['c1', 'c2', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c2', 'h3', 1], ['c2', 'h4', 1], ['c1', 'hb', 1], ['c2', 'br', 1]],
    lone: [['br', 0], ['br', 90], ['br', 180]]
  },

  /* The bromine test's window: a double bond meets Br–Br. R stands for the rest of the chain. */
  'br2-ene-0': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0), r1: Cc(-0.75, -0.75, { label: 'R' }), r2: Cc(2.05, -0.75, { label: 'R' }),
      h1: H(-0.6, 0.85), h3: H(1.9, 0.85),
      b1: { el: 'Br', x: 0.65, y: 1.9 }, b2: { el: 'Br', x: 0.65, y: 3.1 }
    },
    bonds: [['c1', 'c2', 2], ['c1', 'r1', 1], ['c2', 'r2', 1], ['c1', 'h1', 1], ['c2', 'h3', 1], ['b1', 'b2', 1]],
    lone: []
  },
  'br2-ene-1': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0), r1: Cc(-0.75, -0.75, { label: 'R' }), r2: Cc(2.05, -0.75, { label: 'R' }),
      h1: H(-0.85, 0.55), h3: H(2.15, 0.55),
      b1: { el: 'Br', x: 0.65, y: 1.15, q: 1 }, b2: { el: 'Br', x: 2.6, y: 2.7, q: -1 }
    },
    bonds: [['c1', 'c2', 1], ['c1', 'r1', 1], ['c2', 'r2', 1], ['c1', 'h1', 1], ['c2', 'h3', 1], ['c1', 'b1', 1], ['c2', 'b1', 1]],
    lone: []
  },
  'br2-ene-2': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0), r1: Cc(-0.75, -0.75, { label: 'R' }), r2: Cc(2.05, -0.75, { label: 'R' }),
      h1: H(-0.85, 0.55), h3: H(2.15, 0.55),
      b1: { el: 'Br', x: 0, y: 1.3 }, b2: { el: 'Br', x: 1.3, y: -1.3 }
    },
    bonds: [['c1', 'c2', 1], ['c1', 'r1', 1], ['c2', 'r2', 1], ['c1', 'h1', 1], ['c2', 'h3', 1], ['c1', 'b1', 1], ['c2', 'b2', 1]],
    lone: []
  },
  /* A chain of single bonds meets Br–Br: nothing for the bromine to bond to. */
  'br2-ane-0': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0), r1: Cc(-0.75, -0.75, { label: 'R' }), r2: Cc(2.05, -0.75, { label: 'R' }),
      h1: H(-0.6, 0.85), h2: H(0.25, 0.95), h3: H(1.9, 0.85), h4: H(1.05, 0.95),
      b1: { el: 'Br', x: 0.65, y: 2.1 }, b2: { el: 'Br', x: 0.65, y: 3.3 }
    },
    bonds: [['c1', 'c2', 1], ['c1', 'r1', 1], ['c2', 'r2', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c2', 'h3', 1], ['c2', 'h4', 1], ['b1', 'b2', 1]],
    lone: []
  },
  'br2-ane-1': {
    atoms: {
      c1: Cc(0, 0), c2: Cc(1.3, 0), r1: Cc(-0.75, -0.75, { label: 'R' }), r2: Cc(2.05, -0.75, { label: 'R' }),
      h1: H(-0.6, 0.85), h2: H(0.25, 0.95), h3: H(1.9, 0.85), h4: H(1.05, 0.95),
      b1: { el: 'Br', x: 2.4, y: 2.2 }, b2: { el: 'Br', x: 3.1, y: 3.2 }
    },
    bonds: [['c1', 'c2', 1], ['c1', 'r1', 1], ['c2', 'r2', 1], ['c1', 'h1', 1], ['c1', 'h2', 1], ['c2', 'h3', 1], ['c2', 'h4', 1], ['b1', 'b2', 1]],
    lone: []
  }
});

/* Benzene: six carbons on a ring, drawn with alternating double bonds, in its two drawings. */
(() => {
  const ring = (start) => {
    const atoms = {}; const bonds = [];
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i + Math.PI / 6;
      atoms[`c${i}`] = Cc(1.3 * Math.cos(a), 1.3 * Math.sin(a));
      atoms[`h${i}`] = H(2.3 * Math.cos(a), 2.3 * Math.sin(a));
      bonds.push([`c${i}`, `h${i}`, 1]);
    }
    for (let i = 0; i < 6; i++) bonds.push([`c${i}`, `c${(i + 1) % 6}`, i % 2 === start ? 2 : 1]);
    return { atoms, bonds, lone: [] };
  };
  addScenes({ 'benzene-a': ring(0), 'benzene-b': ring(1) });
})();

addPlays({
  /* Hydrogen bromide adds across ethene's double bond, in two steps. */
  'hbr-ethene': {
    scenes: ['hbr-ethene-0', 'hbr-ethene-1', 'hbr-ethene-2'],
    arrows: [
      [{ src: 'p:c1-c2', dst: 'hb' }, { src: 's:hb-br', dst: 'br' }],
      [{ src: 'l:br:3', dst: 'c2' }]
    ]
  },
  /* Bromine adds across a double bond, through the bridged ion. */
  'br2-ene': {
    scenes: ['br2-ene-0', 'br2-ene-1', 'br2-ene-2'],
    arrows: [[{ src: 'p:c1-c2', dst: 'b1' }, { src: 's:b1-b2', dst: 'b2' }], [{ src: 'a:b2', dst: 'c2' }]]
  },
  /* Bromine meets a chain with single bonds only and drifts away. */
  'br2-ane': { scenes: ['br2-ane-0', 'br2-ane-1'], arrows: [[]] },
  /* The three second pairs of benzene's ring move one place round. */
  'benzene-shift': {
    scenes: ['benzene-a', 'benzene-b'],
    arrows: [[{ src: 'p:c0-c1', dst: 'c2', bond: true }, { src: 'p:c2-c3', dst: 'c4', bond: true }, { src: 'p:c4-c5', dst: 'c0', bond: true }]]
  }
});

/** The length the meter reads on a carbon–carbon bond of a scene, in pm. Benzene's six are equal whichever way the ring is drawn. */
export function bondLengthPm(sceneId, a, b) {
  if (sceneId.startsWith('benzene')) return BOND_PM.benzene;
  const s = sceneOf(sceneId);
  const bond = s.bonds.find(([x, y]) => (x === a && y === b) || (x === b && y === a));
  return bond[2] === 2 ? BOND_PM['C=C'] : BOND_PM['C-C'];
}
