/**
 * lewis.js — The molecules the pair board holds, and the one planner that reads
 * a drawing of them.
 *
 * PURE. No DOM, no canvas. `verify:learn` imports it to draw every molecule's
 * intended structure and measure it, so the board and the grading cannot drift.
 *
 * WHAT A DRAWING IS. A molecule is a slate of atoms with the places a pair could
 * go between them (`links`). A drawing (`placed`) says how many shared pairs sit
 * on each link (`bonds`, keyed "i-j" with i < j), how many lone pairs sit on each
 * atom (`lone`) and how many single electrons (`dots`). The tray holds exactly
 * the molecule's valence electrons, so a drawing is read against that total.
 *
 * THE BOARD KNOWS ONE RULE AND SAYS NOTHING ELSE. A hydrogen atom and a fluorine
 * atom have room for one shared pair (`maxBond`); everything else, including
 * whether a drawing is any good, is READ off the octet lamps and the charges.
 */

export const VALENCE = {
  H: 1, Li: 1, Be: 2, B: 3, C: 4, N: 5, O: 6, F: 7,
  Na: 1, Mg: 2, Al: 3, Si: 4, P: 5, S: 6, Cl: 7, Xe: 8
};

/** Atoms on the third ring or below may hold more than eight. */
const ROOMY = new Set(['Na', 'Mg', 'Al', 'Si', 'P', 'S', 'Cl', 'Xe']);

/** Atoms that share one pair and no more, on this board. */
const ONE_PAIR = new Set(['H', 'F']);

export function maxBondOf(sym) { return ONE_PAIR.has(sym) ? 1 : 3; }

export const linkKey = (i, j) => (i < j ? `${i}-${j}` : `${j}-${i}`);

/** Slate positions are in unit space, y down. */
const at = (x, y) => [x, y];
const ring = (n, cx = 0.5, cy = 0.5, r = 0.36, start = -Math.PI / 2) =>
  Array.from({ length: n }, (_, k) => at(cx + r * Math.cos(start + (k * 2 * Math.PI) / n), cy + r * Math.sin(start + (k * 2 * Math.PI) / n)));
function star(center, ends, extra = {}) {
  const pts = [at(0.5, 0.5), ...ring(ends.length)];
  return {
    syms: [center, ...ends], pos: pts,
    links: ends.map((_, k) => [0, k + 1]),
    ...extra
  };
}

/**
 * Every molecule a bench holds. `lengths` are MEASURED bond lengths (pm), read by
 * the bond-length gauge, keyed by link, and never derived from the drawing.
 */
export const MOLECULES = {
  H2O: { id: 'H2O', label: 'H₂O', syms: ['O', 'H', 'H'], pos: [at(0.5, 0.36), at(0.22, 0.72), at(0.78, 0.72)], links: [[0, 1], [0, 2]], charge: 0, lengths: { '0-1': 96, '0-2': 96 } },
  CH4: { id: 'CH4', label: 'CH₄', ...star('C', ['H', 'H', 'H', 'H']), charge: 0 },
  NH3: { id: 'NH3', label: 'NH₃', syms: ['N', 'H', 'H', 'H'], pos: [at(0.5, 0.36), at(0.2, 0.78), at(0.5, 0.86), at(0.8, 0.78)], links: [[0, 1], [0, 2], [0, 3]], charge: 0 },
  HF: { id: 'HF', label: 'HF', syms: ['H', 'F'], pos: [at(0.3, 0.5), at(0.7, 0.5)], links: [[0, 1]], charge: 0 },
  CO2: { id: 'CO2', label: 'CO₂', syms: ['O', 'C', 'O'], pos: [at(0.14, 0.5), at(0.5, 0.5), at(0.86, 0.5)], links: [[0, 1], [1, 2]], charge: 0, lengths: { '0-1': 116, '1-2': 116 } },
  HCN: { id: 'HCN', label: 'HCN', syms: ['H', 'C', 'N'], pos: [at(0.16, 0.74), at(0.5, 0.24), at(0.84, 0.74)], links: [[0, 1], [0, 2], [1, 2]], charge: 0 },
  NH4: { id: 'NH4', label: 'NH₄', ...star('N', ['H', 'H', 'H', 'H']), charge: 0 },
  BF3: { id: 'BF3', label: 'BF₃', ...star('B', ['F', 'F', 'F']), charge: 0 },
  NO: { id: 'NO', label: 'NO', syms: ['N', 'O'], pos: [at(0.3, 0.5), at(0.7, 0.5)], links: [[0, 1]], charge: 0 },
  SF4: { id: 'SF4', label: 'SF\u2084', ...star('S', ['F', 'F', 'F', 'F']), charge: 0 },
  SF6: { id: 'SF6', label: 'SF₆', ...star('S', ['F', 'F', 'F', 'F', 'F', 'F']), charge: 0 },
  HOF: { id: 'HOF', label: 'HOF', syms: ['H', 'O', 'F'], pos: [at(0.16, 0.74), at(0.5, 0.24), at(0.84, 0.74)], links: [[0, 1], [0, 2], [1, 2]], charge: 0 },
  CO: { id: 'CO', label: 'CO', syms: ['C', 'O'], pos: [at(0.3, 0.5), at(0.7, 0.5)], links: [[0, 1]], charge: 0, lengths: { '0-1': 113 } },
  SCN: { id: 'SCN', label: 'SCN⁻', syms: ['S', 'C', 'N'], pos: [at(0.14, 0.5), at(0.5, 0.5), at(0.86, 0.5)], links: [[0, 1], [1, 2]], charge: -1, lengths: { '0-1': 165, '1-2': 117 } },
  O3: { id: 'O3', label: 'O₃', syms: ['O', 'O', 'O'], pos: [at(0.5, 0.3), at(0.2, 0.72), at(0.8, 0.72)], links: [[0, 1], [0, 2]], charge: 0, lengths: { '0-1': 128, '0-2': 128 } },
  NO3: { id: 'NO3', label: 'NO₃⁻', ...star('N', ['O', 'O', 'O']), charge: -1, lengths: { '0-1': 124, '0-2': 124, '0-3': 124 } },
  CO3: { id: 'CO3', label: 'CO₃²⁻', ...star('C', ['O', 'O', 'O']), charge: -2, lengths: { '0-1': 129, '0-2': 129, '0-3': 129 } }
};

const molOf = m => (typeof m === 'string' ? MOLECULES[m] : m);

/** The electrons the tray holds for a molecule at a given charge. */
export function trayFor(mol, charge = null) {
  const m = molOf(mol);
  const q = charge == null ? m.charge : charge;
  return m.syms.reduce((n, s) => n + VALENCE[s], 0) - q;
}

/** A blank drawing. */
export const blankDrawing = () => ({ bonds: {}, lone: {}, dots: {} });

/** A drawing from a short description, for solutions and prefills. */
export function drawing(bonds = {}, lone = {}, dots = {}) {
  return { bonds: { ...bonds }, lone: { ...lone }, dots: { ...dots } };
}

function sumShared(m, placed, i) {
  let n = 0;
  for (const [a, b] of m.links) {
    if (a === i || b === i) n += placed.bonds[linkKey(a, b)] || 0;
  }
  return n;
}

/**
 * Read a drawing. Returns the tray's total, how many electrons are placed and
 * left, and for each atom: how many electrons stand round it, its lamp, and its
 * formal charge.
 *
 * Lamps: 'full' (eight, or two for hydrogen), 'amber' (boron at six, beryllium
 * at four: room to spare but nothing more to give), 'expanded' (more than eight
 * on an atom that has the room), 'over' (more than it can hold), 'short'.
 */
export function planLewis(mol, placed, charge = null) {
  const m = molOf(mol);
  const total = trayFor(m, charge);
  let used = 0;
  const atoms = m.syms.map((sym, i) => {
    const shared = sumShared(m, placed, i);
    const lone = placed.lone[i] || 0;
    const dots = placed.dots[i] || 0;
    const around = 2 * (shared + lone) + dots;
    let lamp;
    if (sym === 'H') lamp = around === 2 ? 'full' : around < 2 ? 'short' : 'over';
    else if (around === 8) lamp = 'full';
    else if (around < 8) lamp = ((sym === 'B' && around === 6) || (sym === 'Be' && around === 4)) ? 'amber' : 'short';
    else lamp = ROOMY.has(sym) ? 'expanded' : 'over';
    used += 2 * lone + dots;
    return { i, sym, shared, lone, dots, around, lamp, fc: VALENCE[sym] - (2 * lone + dots + shared) };
  });
  for (const [a, b] of m.links) used += 2 * (placed.bonds[linkKey(a, b)] || 0);
  return { total, used, left: total - used, atoms, complete: total - used === 0 };
}

/** True when every lamp is lit (boron's amber counts) and the tray is empty. */
export function allLit(read) {
  return read.complete && read.atoms.every(a => a.lamp === 'full' || a.lamp === 'amber' || a.lamp === 'expanded');
}

/** A drawing's bond orders as a string, so two drawings can be compared. */
export function drawingKey(mol, placed) {
  const m = molOf(mol);
  return m.links.map(([a, b]) => `${linkKey(a, b)}:${placed.bonds[linkKey(a, b)] || 0}`).join(',');
}

/** The measured length of a link (pm), or null when there is no bond on it. */
export function gaugeLength(mol, placed, key) {
  const m = molOf(mol);
  if (!(placed.bonds[key] > 0)) return null;
  return m.lengths?.[key] ?? null;
}

/** Place one shared pair on a link, if the atoms at both ends have room. */
export function addBond(mol, placed, a, b) {
  const m = molOf(mol);
  const key = linkKey(a, b);
  if (!m.links.some(([x, y]) => linkKey(x, y) === key)) return { refused: 'Those two atoms are not next to each other on this slate.' };
  const now = placed.bonds[key] || 0;
  for (const i of [a, b]) {
    // One shared pair in all, not one per slot: a hydrogen or fluorine atom cannot join two others.
    if (ONE_PAIR.has(m.syms[i]) && sumShared(m, placed, i) >= 1) return { refused: `A ${m.syms[i] === 'H' ? 'hydrogen' : 'fluorine'} atom has room for one shared pair only.` };
  }
  if (now >= 3) return { refused: 'Three shared pairs is as many as two atoms can hold between them.' };
  const next = { ...placed, bonds: { ...placed.bonds, [key]: now + 1 } };
  return { placed: next };
}

export function addLone(placed, i) {
  return { placed: { ...placed, lone: { ...placed.lone, [i]: (placed.lone[i] || 0) + 1 } } };
}

export function addDot(placed, i) {
  return { placed: { ...placed, dots: { ...placed.dots, [i]: (placed.dots[i] || 0) + 1 } } };
}

/** Lift one thing back to the tray: a dot first, then a lone pair, then a shared pair. */
export function removeOne(mol, placed, target) {
  const m = molOf(mol);
  if (target.kind === 'link') {
    const key = linkKey(target.a, target.b);
    const n = placed.bonds[key] || 0;
    if (!n) return { refused: 'There is nothing on that link to lift out.' };
    const bonds = { ...placed.bonds };
    if (n === 1) delete bonds[key]; else bonds[key] = n - 1;
    return { placed: { ...placed, bonds } };
  }
  const i = target.i;
  if (placed.dots[i]) {
    const dots = { ...placed.dots };
    if (dots[i] === 1) delete dots[i]; else dots[i] -= 1;
    return { placed: { ...placed, dots } };
  }
  if (placed.lone[i]) {
    const lone = { ...placed.lone };
    if (lone[i] === 1) delete lone[i]; else lone[i] -= 1;
    return { placed: { ...placed, lone } };
  }
  return { refused: `There is nothing on ${m.syms[i]} to lift out.` };
}

/** Every drawing in a list that reads as a finished structure, as comparison keys. */
export function distinctDrawings(mol, list) {
  const seen = new Set();
  for (const p of list) {
    const r = planLewis(mol, p);
    if (allLit(r)) seen.add(drawingKey(mol, p));
  }
  return [...seen];
}

/* ------------------------------------------------------------------
   THE INTENDED DRAWINGS
   Kept here so the board's quests and `verify:learn` read the same ones.
   ------------------------------------------------------------------ */
export const DRAWINGS = {
  H2O: drawing({ '0-1': 1, '0-2': 1 }, { 0: 2, 1: 0, 2: 0 }),
  CO2: drawing({ '0-1': 2, '1-2': 2 }, { 0: 2, 2: 2 }),
  HCN: drawing({ '0-1': 1, '1-2': 3 }, { 2: 1 }),
  NH4: drawing({ '0-1': 1, '0-2': 1, '0-3': 1, '0-4': 1 }),
  BF3: drawing({ '0-1': 1, '0-2': 1, '0-3': 1 }, { 1: 3, 2: 3, 3: 3 }),
  NO: drawing({ '0-1': 2 }, { 0: 1, 1: 2 }, { 0: 1 }),
  SF4: drawing({ '0-1': 1, '0-2': 1, '0-3': 1, '0-4': 1 }, { 0: 1, 1: 3, 2: 3, 3: 3, 4: 3 }),
  SF6: drawing({ '0-1': 1, '0-2': 1, '0-3': 1, '0-4': 1, '0-5': 1, '0-6': 1 }, { 1: 3, 2: 3, 3: 3, 4: 3, 5: 3, 6: 3 }),
  CO: drawing({ '0-1': 3 }, { 0: 1, 1: 1 }),
  // Two drawings of carbon dioxide and of thiocyanate, for the formal-charge stages.
  CO2_double: drawing({ '0-1': 2, '1-2': 2 }, { 0: 2, 2: 2 }),
  CO2_triple: drawing({ '0-1': 3, '1-2': 1 }, { 0: 1, 2: 3 }),
  SCN_n: drawing({ '0-1': 2, '1-2': 2 }, { 0: 2, 2: 2 }),
  SCN_s: drawing({ '0-1': 1, '1-2': 3 }, { 0: 3, 2: 1 }),
  O3: drawing({ '0-1': 2, '0-2': 1 }, { 0: 1, 1: 2, 2: 3 }),
  NO3_a: drawing({ '0-1': 2, '0-2': 1, '0-3': 1 }, { 1: 2, 2: 3, 3: 3 }),
  NO3_b: drawing({ '0-1': 1, '0-2': 2, '0-3': 1 }, { 1: 3, 2: 2, 3: 3 }),
  NO3_c: drawing({ '0-1': 1, '0-2': 1, '0-3': 2 }, { 1: 3, 2: 3, 3: 2 }),
  CO3_a: drawing({ '0-1': 2, '0-2': 1, '0-3': 1 }, { 1: 2, 2: 3, 3: 3 }),
  CO3_b: drawing({ '0-1': 1, '0-2': 2, '0-3': 1 }, { 1: 3, 2: 2, 3: 3 }),
  CO3_c: drawing({ '0-1': 1, '0-2': 1, '0-3': 2 }, { 1: 3, 2: 3, 3: 2 })
};
