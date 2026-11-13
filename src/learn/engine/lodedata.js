/**
 * lodedata.js — The numbers of Lodestone (unit12, the transition metals). Pure data and planners; the drawn table, the built table,
 * the checks and the story animations all read these, so nothing is computed twice.
 *
 * Sources: ground-state configurations and successive ionization energies from the NIST Atomic Spectra Database (as tabulated in the
 * CRC Handbook of Chemistry and Physics); absorption maxima, spin states and unpaired counts of the complexes from Housecroft & Sharpe,
 * Inorganic Chemistry (5th ed.), chapters 20 and 21, and Shriver & Atkins. Simplifications, each said on the bench where it is used:
 *   - the energy ladder is a picture, not a measured scale: 4s below 3d for the neutral atoms (true as a filling order; Cr and Cu are
 *     the two exceptions and are never built by the rule), 3d below 4s once the atom carries a charge;
 *   - the split ladder's gap and pairing cost are in kJ/mol of the right size for first-row complexes (pairing about 210 kJ/mol);
 *   - the magnet's pull grows as n(n + 2) for n unpaired electrons (the spin-only magnetic moment, squared).
 */

/* ------------------------------------------------------------------ elements */

/** Outer electrons of the fourth-row atoms, as measured: 4s and 3d. Cr and Cu are the row's two exceptions. */
export const ELEMENTS = Object.freeze({
  K: { z: 19, name: 'potassium', s: 1, d: 0 },
  Ca: { z: 20, name: 'calcium', s: 2, d: 0 },
  Sc: { z: 21, name: 'scandium', s: 2, d: 1 },
  Ti: { z: 22, name: 'titanium', s: 2, d: 2 },
  V: { z: 23, name: 'vanadium', s: 2, d: 3 },
  Cr: { z: 24, name: 'chromium', s: 1, d: 5, exception: true },
  Mn: { z: 25, name: 'manganese', s: 2, d: 5 },
  Fe: { z: 26, name: 'iron', s: 2, d: 6 },
  Co: { z: 27, name: 'cobalt', s: 2, d: 7 },
  Ni: { z: 28, name: 'nickel', s: 2, d: 8 },
  Cu: { z: 29, name: 'copper', s: 1, d: 10, exception: true },
  Zn: { z: 30, name: 'zinc', s: 2, d: 10 }
});

/** The first eight successive ionization energies, kJ/mol (NIST ASD / CRC). */
export const IE = Object.freeze({
  Ca: [589.8, 1145.4, 4912.4, 6491, 8153, 10496, 12270, 14206],
  Sc: [633.1, 1235.0, 2388.6, 7090.6, 8843, 10679, 13310, 15250],
  Ti: [658.8, 1309.8, 2652.5, 4174.6, 9581, 11533, 13590, 16440],
  V: [650.9, 1414, 2830, 4507, 6298.7, 12363, 14530, 16730],
  Cr: [652.9, 1590.6, 2987, 4743, 6702, 8744.9, 15455, 17820],
  Mn: [717.3, 1509.0, 3248, 4940, 6990, 9220, 11500, 18770],
  Fe: [762.5, 1561.9, 2957, 5290, 7240, 9560, 12060, 14580],
  Co: [760.4, 1648, 3232, 4950, 7670, 9840, 12440, 15230],
  Ni: [737.1, 1753, 3395, 5300, 7339, 10400, 12800, 15600]
});

/** The common ions a card shows (`q2-charges` stage 5). */
export const COMMON_IONS = Object.freeze({
  Ca: [2], Sc: [3], Ti: [3], V: [3], Cr: [3], Mn: [2], Fe: [2, 3], Co: [2, 3], Ni: [2], Cu: [1, 2], Zn: [2]
});

/** The outer electrons of an ion of element `el` with charge `q`: 4s leaves first, then 3d (as measured for every first-row ion). */
export function ionOf(el, q) {
  const e = ELEMENTS[el];
  let s = e.s; let d = e.d; let left = q;
  const fromS = Math.min(s, left); s -= fromS; left -= fromS;
  const fromD = Math.min(d, left); d -= fromD; left -= fromD;
  return { s, d, core: left };
}

/** Which subshell each successive electron of `el` leaves from, starting at charge `q0`: 4s, then 3d, then the 3p core. */
export function removalOrder(el, q0 = 0, n = 8) {
  const e = ELEMENTS[el];
  const out = [];
  let s = e.s; let d = e.d;
  for (let i = 0; i < q0; i++) { if (s) s--; else if (d) d--; }
  for (let i = 0; i < n; i++) {
    if (s) { s--; out.push('4s'); } else if (d) { d--; out.push('3d'); } else out.push('3p');
  }
  return out;
}

/** The cost of the `k`-th electron (1-based) removed from `el`. */
export const ieOf = (el, k) => IE[el][k - 1];

/** The removal after which the cost jumps: the first electron that leaves from the core (3p). */
export const jumpAfter = el => removalOrder(el, 0, 8).indexOf('3p');

/* ------------------------------------------------------------------ the atom/ion ladder (dshell) */

export const PAIR_ATOM = 0.3;

/** The dshell's levels at a charge. Atom: 4s at 0, 3d at +1. Charged: 3d at −0.6, 4s at +0.8. In between they glide (t = charge / 1, held at 1). */
export function shellLevels(charge, { fixed = null } = {}) {
  const t = fixed != null ? fixed : Math.max(0, Math.min(1, charge));
  return [
    { id: '4s', n: 1, e: 0 + t * 0.8 },
    { id: '3d', n: 5, e: 1 - t * 1.6 }
  ];
}

/** Energy of an occupation `occ` (array of box counts, level by level) on `levels`, with pairing cost `P` per doubly filled box. */
export function energyOf(levels, occ, P) {
  let E = 0; let k = 0;
  for (const L of levels) {
    for (let i = 0; i < L.n; i++, k++) {
      const o = occ[k] || 0;
      E += o * L.e + (o === 2 ? P : 0);
    }
  }
  return E;
}

/** The boxes of a level filled with `m` electrons at the lowest energy: one each, then pairs. */
export function fillLevel(n, m) {
  const out = new Array(n).fill(0);
  for (let i = 0; i < Math.min(m, n); i++) out[i] = 1;
  for (let i = 0; i < Math.max(0, m - n); i++) out[i] = 2;
  return out;
}

/** The lowest-energy occupation of `N` electrons on `levels` (every split between the levels tried). */
export function lowestOcc(levels, N, P) {
  let best = null;
  const rec = (i, left, acc) => {
    if (i === levels.length) {
      if (left !== 0) return;
      const occ = acc.flat();
      const E = energyOf(levels, occ, P);
      if (!best || E < best.E - 1e-9) best = { occ, E };
      return;
    }
    const L = levels[i];
    for (let m = 0; m <= Math.min(2 * L.n, left); m++) rec(i + 1, left - m, [...acc, fillLevel(L.n, m)]);
  };
  rec(0, N, []);
  return best;
}

/** Count of electrons per level. */
export function perLevel(levels, occ) {
  const out = {}; let k = 0;
  for (const L of levels) { let s = 0; for (let i = 0; i < L.n; i++, k++) s += occ[k] || 0; out[L.id] = s; }
  return out;
}

export const unpaired = occ => occ.filter(o => o === 1).length;
export const total = occ => occ.reduce((a, b) => a + (b || 0), 0);

/**
 * What "Test Energy" shows: whether `occ` is a lowest arrangement, and if not, which electrons could sit lower and where they go
 * (a list of moves from box to box, the fewest that reach a lowest arrangement).
 */
export function testEnergy(levels, occ, P) {
  const N = total(occ);
  const best = lowestOcc(levels, N, P);
  const E = energyOf(levels, occ, P);
  if (E <= best.E + 1e-9) return { lowest: true, moves: [], E, Emin: best.E };
  // A target that keeps the player's boxes where it can: per level, the lowest count, filled into the boxes the player already used.
  const want = perLevel(levels, best.occ);
  const target = []; let k = 0;
  for (const L of levels) {
    const mine = occ.slice(k, k + L.n);
    const order = [...mine.keys()].sort((a, b) => (mine[b] - mine[a]) || (a - b));
    const fill = fillLevel(L.n, want[L.id]).sort((a, b) => b - a);
    const t = new Array(L.n).fill(0);
    order.forEach((box, j) => { t[box] = fill[j]; });
    target.push(...t); k += L.n;
  }
  const from = []; const to = [];
  occ.forEach((o, i) => { for (let j = 0; j < o - target[i]; j++) from.push(i); });
  target.forEach((o, i) => { for (let j = 0; j < o - (occ[i] || 0); j++) to.push(i); });
  const moves = from.map((f, i) => ({ from: f, to: to[i] }));
  return { lowest: false, moves, E, Emin: best.E, target };
}

/* ------------------------------------------------------------------ the split ladder (dsplit) */

/** Pairing cost and the two gaps the split ladder draws, kJ/mol. */
export const PAIR_KJ = 210;
export const GAPS = Object.freeze({ narrow: 120, wide: 300 });

/** t2g (three orbitals) at −0.4Δ and eg (two) at +0.6Δ below and above the unsplit level. */
export function splitLevels(gap) {
  return [
    { id: 't2g', n: 3, e: -0.4 * gap },
    { id: 'eg', n: 2, e: 0.6 * gap }
  ];
}

export const fillSplit = (N, gap, P = PAIR_KJ) => lowestOcc(splitLevels(gap), N, P).occ;

/* ------------------------------------------------------------------ light */

const H = 6.626e-34; const C = 2.998e8; const NA = 6.022e23;
/** Energy of one mole of photons of wavelength `nm`, kJ/mol. */
export const photonKJ = nm => (H * C / (nm * 1e-9)) * NA / 1000;
/** Energy of one photon, J. */
export const photonJ = nm => H * C / (nm * 1e-9);

/** Six colour bands, violet to red, with the wavelength drawn for each (nm). */
export const BANDS = Object.freeze([
  { id: 'violet', name: 'Violet', lo: 400, hi: 435, nm: 420, css: '#7a5bb8' },
  { id: 'blue', name: 'Blue', lo: 435, hi: 490, nm: 465, css: '#3f6fc4' },
  { id: 'green', name: 'Green', lo: 490, hi: 560, nm: 520, css: '#4f9a52' },
  { id: 'yellow', name: 'Yellow', lo: 560, hi: 590, nm: 575, css: '#d8c23e' },
  { id: 'orange', name: 'Orange', lo: 590, hi: 625, nm: 605, css: '#dc8a32' },
  { id: 'red', name: 'Red', lo: 625, hi: 700, nm: 660, css: '#c2443a' }
]);
export const bandOf = nm => BANDS.find(b => nm >= b.lo && nm < b.hi) || (nm < 400 ? BANDS[0] : BANDS[5]);
/** Complementary pairs on the six-colour wheel. */
export const COMPLEMENT = Object.freeze({ violet: 'yellow', yellow: 'violet', blue: 'orange', orange: 'blue', green: 'red', red: 'green' });

/* ------------------------------------------------------------------ complexes */

/**
 * The complexes on Lodestone's benches. `absorb`: the bands of visible light taken out (the measured band, clipped to 400–700 nm);
 * `nm`: the absorption maximum; `seen`: the colour of the solution; `d`: d electrons; `spin`: 'high' | 'low' | null; `unpaired`.
 */
export const COMPLEXES = Object.freeze({
  'cu-aq': { formula: '[Cu(H₂O)₆]²⁺', metal: 'Cu', q: 2, d: 9, nm: 800, absorb: ['orange', 'red'], seen: 'blue', tint: '#8fb4d8', unpaired: 1, spin: null },
  'cu-nh3': { formula: '[Cu(NH₃)₄(H₂O)₂]²⁺', metal: 'Cu', q: 2, d: 9, nm: 600, absorb: ['orange'], seen: 'deep blue-violet', tint: '#3b3f9e', unpaired: 1, spin: null },
  'ti-aq': { formula: '[Ti(H₂O)₆]³⁺', metal: 'Ti', q: 3, d: 1, nm: 500, absorb: ['green'], seen: 'purple', tint: '#9b5c9e', unpaired: 1, spin: null },
  'sc-aq': { formula: '[Sc(H₂O)₆]³⁺', metal: 'Sc', q: 3, d: 0, nm: null, absorb: [], seen: 'colourless', tint: '#d9dde0', unpaired: 0, spin: null },
  'zn-aq': { formula: '[Zn(H₂O)₆]²⁺', metal: 'Zn', q: 2, d: 10, nm: null, absorb: [], seen: 'colourless', tint: '#d9dde0', unpaired: 0, spin: null },
  'ni-aq': { formula: '[Ni(H₂O)₆]²⁺', metal: 'Ni', q: 2, d: 8, nm: 720, absorb: ['red'], seen: 'green', tint: '#5fa36a', unpaired: 2, spin: null },
  'co-nh3': { formula: '[Co(NH₃)₆]³⁺', metal: 'Co', q: 3, d: 6, nm: 475, absorb: ['blue'], seen: 'yellow-orange', tint: '#d9a03a', unpaired: 0, spin: 'low' },
  'co-f': { formula: '[CoF₆]³⁻', metal: 'Co', q: 3, d: 6, nm: 700, absorb: ['red'], seen: 'green', tint: '#5f9e86', unpaired: 4, spin: 'high' },
  'fe2-aq': { formula: '[Fe(H₂O)₆]²⁺', metal: 'Fe', q: 2, d: 6, nm: null, absorb: [], seen: 'pale green', tint: '#b9d3a8', unpaired: 4, spin: 'high' },
  'fe2-cn': { formula: '[Fe(CN)₆]⁴⁻', metal: 'Fe', q: 2, d: 6, nm: null, absorb: [], seen: 'pale yellow', tint: '#e2d58c', unpaired: 0, spin: 'low' },
  'fe3-aq': { formula: '[Fe(H₂O)₆]³⁺', metal: 'Fe', q: 3, d: 5, nm: null, absorb: [], seen: 'pale violet', tint: '#c9b6d6', unpaired: 5, spin: 'high' },
  'fe3-cn': { formula: '[Fe(CN)₆]³⁻', metal: 'Fe', q: 3, d: 5, nm: null, absorb: [], seen: 'red-orange', tint: '#c8642e', unpaired: 1, spin: 'low' },
  'mn-aq': { formula: '[Mn(H₂O)₆]²⁺', metal: 'Mn', q: 2, d: 5, nm: null, absorb: [], seen: 'pale pink', tint: '#e2bcc6', unpaired: 5, spin: 'high' },
  'cr-aq': { formula: '[Cr(H₂O)₆]³⁺', metal: 'Cr', q: 3, d: 3, nm: null, absorb: [], seen: 'violet', tint: '#7b6a9c', unpaired: 3, spin: null }
});

/** How hard the magnet pulls a sample with `n` unpaired electrons: n(n + 2), the spin-only moment squared (0 for none). */
export const pull = n => n * (n + 2);

/* ------------------------------------------------------------------ ligands and complex ions */

/** Ligands: charge, the places each takes, its size class (how many fit round a first-row ion), its symbol. */
export const LIGANDS = Object.freeze({
  h2o: { sym: 'H₂O', q: 0, places: 1, fit: 6, donor: 'O' },
  nh3: { sym: 'NH₃', q: 0, places: 1, fit: 6, donor: 'N' },
  cl: { sym: 'Cl⁻', q: -1, places: 1, fit: 4, donor: 'Cl' },
  cn: { sym: 'CN⁻', q: -1, places: 1, fit: 6, donor: 'C' },
  f: { sym: 'F⁻', q: -1, places: 1, fit: 6, donor: 'F' },
  en: { sym: 'en', q: 0, places: 2, fit: 6, donor: 'N' }
});

/** Charge of a metal ion of charge `q` with ligands `ids` (one id per ligand). */
export const complexCharge = (q, ids) => ids.reduce((a, id) => a + (LIGANDS[id]?.q || 0), q);

/** How many of ligand `id` bond to one first-row ion: the places it fills before the space is used, divided by the places each takes. */
export const fitCount = id => LIGANDS[id].fit / LIGANDS[id].places;

/* ------------------------------------------------------------------ the two frames' turns (isomers) */

/** Octahedral places: 0 +x, 1 −x, 2 +y, 3 −y, 4 +z, 5 −z. Square places: 0 +x, 1 +y, 2 −x, 3 −y. */
export const OCT_DIRS = Object.freeze([[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]);
export const SQ_DIRS = Object.freeze([[1, 0, 0], [0, 1, 0], [-1, 0, 0], [0, -1, 0]]);

const mul = (a, b) => a.map((r, i) => b[0].map((_, j) => r.reduce((s, _x, k) => s + a[i][k] * b[k][j], 0)));
const rx = [[1, 0, 0], [0, 0, -1], [0, 1, 0]];
const ry = [[0, 0, 1], [0, 1, 0], [-1, 0, 0]];
const rz = [[0, -1, 0], [1, 0, 0], [0, 0, 1]];
const I3 = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const key = m => m.flat().map(v => Math.round(v)).join(',');

/** Every turn that lays the shape on itself: 24 for the octahedron, 8 for the square (turns in the plane and flips over). */
function group(gens) {
  const seen = new Map([[key(I3), I3]]);
  const queue = [I3];
  while (queue.length) {
    const m = queue.shift();
    for (const g of gens) {
      const n = mul(g, m);
      const k = key(n);
      if (!seen.has(k)) { seen.set(k, n); queue.push(n); }
    }
  }
  return [...seen.values()];
}
export const OCT_TURNS = Object.freeze(group([rx, ry, rz]));
export const SQ_TURNS = Object.freeze(group([rz, rx.map((r, i) => r.map((v, j) => (i === 0 ? [1, 0, 0] : i === 1 ? [0, -1, 0] : [0, 0, -1])[j]))]));

const apply = (m, v) => m.map(r => r[0] * v[0] + r[1] * v[1] + r[2] * v[2]);
const dirIndex = (dirs, v) => dirs.findIndex(d => d.every((x, i) => Math.abs(x - v[i]) < 1e-6));

/** Find a turn that lays arrangement `b` exactly on arrangement `a` (arrays of ligand ids per place, '' for empty). */
export function fitTurn(geom, a, b) {
  const dirs = geom === 'sq' ? SQ_DIRS : OCT_DIRS;
  const turns = geom === 'sq' ? SQ_TURNS : OCT_TURNS;
  for (const m of turns) {
    let ok = true;
    for (let i = 0; i < dirs.length && ok; i++) {
      const j = dirIndex(dirs, apply(m, dirs[i]));
      if ((b[i] || '') !== (a[j] || '')) ok = false;
    }
    if (ok) return m;
  }
  return null;
}

/** Whether two places of a frame are opposite each other. */
export const opposite = (geom, i, j) => {
  const dirs = geom === 'sq' ? SQ_DIRS : OCT_DIRS;
  return dirs[i].every((x, k) => Math.abs(x + dirs[j][k]) < 1e-6);
};

/** cis or trans for an arrangement holding exactly two of `id` (null otherwise). */
export function cisTrans(geom, arr, id) {
  const at = arr.map((v, i) => (v === id ? i : -1)).filter(i => i >= 0);
  if (at.length !== 2) return null;
  return opposite(geom, at[0], at[1]) ? 'trans' : 'cis';
}

/** How many different arrangements a set of arrangements holds (two are the same when a turn lays one on the other). */
export function distinctCount(geom, arrs) {
  const reps = [];
  for (const a of arrs) if (!reps.some(r => fitTurn(geom, r, a))) reps.push(a);
  return reps.length;
}

/** Every placement of `counts` ({id: n}) on a frame, and how many of them are truly different. */
export function isomerCount(geom, counts) {
  const n = geom === 'sq' ? 4 : 6;
  const ids = Object.entries(counts).flatMap(([id, k]) => new Array(k).fill(id));
  const all = new Set();
  const perm = (arr, rest) => {
    if (!rest.length) { all.add(arr.join('|')); return; }
    rest.forEach((x, i) => perm([...arr, x], rest.filter((_, j) => j !== i)));
  };
  perm([], ids.concat(new Array(n - ids.length).fill('')));
  const arrs = [...all].map(s => s.split('|'));
  return { placements: arrs.length, distinct: distinctCount(geom, arrs) };
}
