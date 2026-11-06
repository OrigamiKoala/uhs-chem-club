/**
 * THE CELL TABLES AND PLANNERS — Brinewire (Unit 10, electrochemistry)
 *
 * Pure functions, no DOM. Every number on the beakers, the meters, the potential board, the dip rack, the half-reaction ledger and the
 * supply bench comes from here, so the drawn and the built twin of a bench read the same value. Nothing here is typed in by a stage.
 *
 * SIMPLIFICATIONS (stated on the bench where they matter): activities are taken as concentrations; every cell is at 25 °C (298.15 K);
 * volumes are equal in the two beakers; no overpotential (a gas appears at an electrolysis cell as soon as the supply exceeds the cell's
 * back voltage, which is not how real electrodes behave); standard potentials are CRC values in volts against the standard hydrogen
 * electrode at 1 M and 1 bar.
 */

import { fmt, sci } from './phdata.js';
export { fmt, sci };

/* ------------------------------------------------------------------ constants */

/** Faraday constant, C per mole of electrons (CED equation sheet gives 96,485). */
export const FARADAY = 96485.33212;
/** Gas constant, J/(mol K). */
export const GAS_R = 8.314462618;
/** Standard temperature of every bench in this world, K. */
export const TEMP = 298.15;
/** RT/F in volts, and the ln 10 form used by log10 versions of the Nernst equation: 0.05916 V at 25 °C. */
export const RT_F = (GAS_R * TEMP) / FARADAY;
export const NERNST_LOG = RT_F * Math.LN10;

/* ------------------------------------------------------------------ the metals and their ions */

/**
 * Metal couples M^(n+) + n e⁻ → M, standard reduction potentials at 25 °C (CRC Handbook, "Electrochemical Series").
 * `deposit` is the colour a coating of the metal shows on the dip rack; `M` is the molar mass in g/mol (IUPAC standard atomic weight).
 */
export const METALS = Object.freeze({
  mg: { id: 'mg', symbol: 'Mg', name: 'magnesium', ion: 'Mg²⁺', n: 2, E0: -2.37,  M: 24.305,  deposit: 'silver-white' },
  al: { id: 'al', symbol: 'Al', name: 'aluminium',  ion: 'Al³⁺', n: 3, E0: -1.66,  M: 26.982,  deposit: 'silver-white' },
  zn: { id: 'zn', symbol: 'Zn', name: 'zinc',       ion: 'Zn²⁺', n: 2, E0: -0.76,  M: 65.38,   deposit: 'blue-grey' },
  fe: { id: 'fe', symbol: 'Fe', name: 'iron',       ion: 'Fe²⁺', n: 2, E0: -0.44,  M: 55.845,  deposit: 'dark grey' },
  ni: { id: 'ni', symbol: 'Ni', name: 'nickel',     ion: 'Ni²⁺', n: 2, E0: -0.26,  M: 58.693,  deposit: 'silver-grey' },
  sn: { id: 'sn', symbol: 'Sn', name: 'tin',        ion: 'Sn²⁺', n: 2, E0: -0.138, M: 118.71,  deposit: 'silver' },
  pb: { id: 'pb', symbol: 'Pb', name: 'lead',       ion: 'Pb²⁺', n: 2, E0: -0.126, M: 207.2,   deposit: 'dull grey' },
  cu: { id: 'cu', symbol: 'Cu', name: 'copper',     ion: 'Cu²⁺', n: 2, E0: 0.34,   M: 63.546,  deposit: 'red-brown' },
  ag: { id: 'ag', symbol: 'Ag', name: 'silver',     ion: 'Ag⁺',  n: 1, E0: 0.80,   M: 107.868, deposit: 'bright silver' },
  au: { id: 'au', symbol: 'Au', name: 'gold',       ion: 'Au³⁺', n: 3, E0: 1.50,   M: 196.967, deposit: 'yellow' }
});

/** The hydrogen reference couple 2 H⁺ + 2 e⁻ → H₂, defined as 0.00 V. */
export const HYDROGEN = Object.freeze({ id: 'h', symbol: 'H', name: 'hydrogen', ion: 'H⁺', n: 1, E0: 0 });

/** Other couples used by the redox and electrolysis benches (reduction potentials, volts at 25 °C, 1 M). */
export const COUPLES = Object.freeze({
  mno4: { id: 'mno4', ox: 'MnO₄⁻', red: 'Mn²⁺', E0: 1.51, medium: 'acid' },
  fe3:  { id: 'fe3',  ox: 'Fe³⁺',  red: 'Fe²⁺', E0: 0.77 },
  o2:   { id: 'o2',   ox: 'O₂',    red: 'H₂O',  E0: 1.23, medium: 'acid' },
  cl2:  { id: 'cl2',  ox: 'Cl₂',   red: 'Cl⁻',  E0: 1.36 }
});

/** Voltage a cell must be pushed above before water splits, with no overpotential: E°(O₂/H₂O) − E°(H⁺/H₂). */
export const WATER_BACK_VOLTAGE = COUPLES.o2.E0 - HYDROGEN.E0;

export const metalOf = id => METALS[id] || null;

/* ------------------------------------------------------------------ cells: the favoured direction, voltage, energy, balance point */

/** E°cell = E°(cathode) − E°(anode), volts. Either argument is a metal id (or 'h'). Positive means the cell runs by itself. */
export function cellE0(cathodeId, anodeId) {
  const c = cathodeId === 'h' ? HYDROGEN : METALS[cathodeId];
  const a = anodeId === 'h' ? HYDROGEN : METALS[anodeId];
  return c.E0 - a.E0;
}

/** Which of two metals is the anode (oxidised) and which the cathode when both half-cells are 1 M. The one with the lower E° gives. */
export function cellDirection(idA, idB) {
  const a = METALS[idA]; const b = METALS[idB];
  const [anode, cathode] = a.E0 < b.E0 ? [a, b] : [b, a];
  return { anode: anode.id, cathode: cathode.id, E0: cathode.E0 - anode.E0 };
}

/** Electrons moved by the reaction as written: the lowest common multiple of the two charges (Zn|Cu 2, Al|Cu 6, Mg|Ag 2). */
export function electronsMoved(idA, idB) {
  const x = METALS[idA].n; const y = METALS[idB].n;
  const gcd = (p, q) => (q ? gcd(q, p % q) : p);
  return (x * y) / gcd(x, y);
}

/** ΔG° in kJ per mole of reaction as written: −n F E°. */
export const deltaG0 = (E0, n) => -(n * FARADAY * E0) / 1000;

/** log10 K = n E° / 0.05916 (from ΔG° = −RT ln K = −n F E°). */
export const logK = (E0, n) => (n * E0) / NERNST_LOG;
export const lnK = (E0, n) => (n * E0) / RT_F;

/** Nernst: E = E° − (RT/nF) ln Q, volts. */
export const nernst = (E0, n, Q) => E0 - (RT_F / n) * Math.log(Q);

/** Reaction quotient of M_anode + ion_cathode: [anode ion]^(1/nA)... for equal-charge pairs this is [anode ion]/[cathode ion]. */
export const quotient = (anodeIon, cathodeIon) => anodeIon / cathodeIon;

/** Voltage of a cell at the given ion concentrations (mol/L), for two metals whose charges are equal (the benches that vary c). */
export function cellVoltage(cathodeId, anodeId, { cAnode = 1, cCathode = 1 } = {}) {
  const n = electronsMoved(cathodeId, anodeId);
  const nc = METALS[cathodeId].n; const na = METALS[anodeId].n;
  // Q = [anode ion]^(n/na) / [cathode ion]^(n/nc) for the equation scaled to n electrons.
  const Q = (cAnode ** (n / na)) / (cCathode ** (n / nc));
  return nernst(cellE0(cathodeId, anodeId), n, Q);
}

/** A concentration cell: the same metal in two solutions. E = (RT/nF) ln(c_conc/c_dilute), volts; the dilute side is the anode. */
export function concentrationCell(metalId, cA, cB) {
  const n = METALS[metalId].n;
  const dilute = cA < cB ? 'A' : (cA > cB ? 'B' : null);
  return { E: (RT_F / n) * Math.abs(Math.log(cA / cB)), anodeSide: dilute };
}

/**
 * A cell run under load, with equal volumes and a 1:1 mole ratio of the two ions (two +2 metals). `x` is the extent in mol/L of reaction
 * so far: anode ion c0a + x, cathode ion c0c − x. Returns the species and the voltage. The balance point (E = 0) is Q = K.
 */
export function runCell(cathodeId, anodeId, { cAnode0 = 1, cCathode0 = 1, x = 0 } = {}) {
  const cA = cAnode0 + x; const cC = cCathode0 - x;
  if (cC <= 0) return { anodeIon: cA, cathodeIon: 0, E: -Infinity, Q: Infinity, dead: true };
  const E0 = cellE0(cathodeId, anodeId);
  const n = electronsMoved(cathodeId, anodeId);
  const E = nernst(E0, n, cA / cC);
  return { anodeIon: cA, cathodeIon: cC, E, Q: cA / cC, dead: E <= 1e-9 };
}

/** The extent at which a 1:1 cell reaches balance (Q = K): (c0a + x)/(c0c − x) = K. Needs both starting concentrations. */
export function balanceExtent(cathodeId, anodeId, { cAnode0 = 1, cCathode0 = 1 } = {}) {
  const K = 10 ** logK(cellE0(cathodeId, anodeId), electronsMoved(cathodeId, anodeId));
  return (K * cCathode0 - cAnode0) / (1 + K);
}

/* ------------------------------------------------------------------ displacement, activity, rust (q2) */

/** Does a strip of `metalId` get a coating of `ionOfId`'s metal in that metal's solution? True when the ion's E° is above the strip's. */
export function displaces(metalId, ionOfId) {
  if (metalId === ionOfId) return false;
  return METALS[ionOfId].E0 > METALS[metalId].E0 + 1e-9;
}

/** Metal ids in activity order: the metal that gives electrons most readily (lowest E°) first. */
export const activityOrder = ids => [...ids].sort((p, q) => METALS[p].E0 - METALS[q].E0);

/** Does the metal give hydrogen from a 1 M strong acid? */
export const givesHydrogen = id => METALS[id].E0 < HYDROGEN.E0 - 1e-9;

/** Wired to an iron nail in brine, does this partner keep the iron from rusting (is it the one that gives)? */
export const protectsIron = partnerId => METALS[partnerId].E0 < METALS.fe.E0 - 1e-9;

/** The strip that takes `wanted` ions out of a mixed solution and leaves `kept` ions as they are: it displaces the first and not the second. */
export const takesOutOnly = (stripId, wanted, kept) => displaces(stripId, wanted) && !displaces(stripId, kept);

/* ------------------------------------------------------------------ the bridge and the wire (q3) */

/**
 * Ion flow in the salt bridge of a running cell. The anode beaker gains positive ions (the metal goes in as ions) and the cathode beaker
 * loses them, so negative ions in the bridge move toward the anode beaker and positive ions toward the cathode beaker. Electrons move
 * in the wire from the anode to the cathode.
 */
export const ionFlow = () => ({ anions: 'anode', cations: 'cathode', electrons: 'anode-to-cathode' });

/** Mass change of an electrode in a running cell: the anode loses metal, the cathode gains. Grams for a charge `q` (coulombs). */
export function electrodeMassChange(role, metalId, q) {
  const m = METALS[metalId];
  const g = (q / (m.n * FARADAY)) * m.M;
  return role === 'anode' ? -g : g;
}

/* ------------------------------------------------------------------ electrolysis (q6) */

/** I = q / t: charge in coulombs from a constant current (A) and time (s). */
export const charge = (I, t) => I * t;

/** Grams plated: m = I t M / (n F). */
export function faradayMass(I, t, metalId) {
  const m = METALS[metalId];
  return (I * t * m.M) / (m.n * FARADAY);
}

/** The current that plated `grams` of a metal in `t` seconds: I = m n F / (M t). */
export function faradayCurrent(grams, t, metalId) {
  const m = METALS[metalId];
  return (grams * m.n * FARADAY) / (m.M * t);
}

/** Moles of electrons carried by a charge. */
export const molesElectrons = q => q / FARADAY;

/** How many identical cells in series (E° each) it takes to exceed a back voltage. */
export const cellsToExceed = (backV, eachV) => Math.floor(backV / eachV + 1e-9) + 1;

/** Products of the electrolysis cells of q6: what forms at the cathode (reduction) and the anode (oxidation). */
export const ELECTROLYSIS = Object.freeze({
  moltenNaCl: { id: 'moltenNaCl', name: 'molten sodium chloride', cathode: { product: 'Na', phase: 'liquid metal' }, anode: { product: 'Cl₂', phase: 'gas' } },
  water:      { id: 'water',      name: 'water with a little sulfuric acid', cathode: { product: 'H₂', phase: 'gas' }, anode: { product: 'O₂', phase: 'gas' }, gasRatio: [2, 1] },
  brine:      { id: 'brine',      name: 'concentrated sodium chloride solution', cathode: { product: 'H₂', phase: 'gas' }, anode: { product: 'Cl₂', phase: 'gas' }, gasRatio: [1, 1], note: 'chlorine forms at the anode because of overpotential' }
});

/* ------------------------------------------------------------------ oxidation numbers and the half-reaction ledger (q1) */

/** Elements' common states by rule, used to solve the one unknown element in a species. */
const RULE = { O: -2, H: 1, F: -1, Li: 1, Na: 1, K: 1, Mg: 2, Ca: 2, Al: 3, Zn: 2, Ag: 1 };

/**
 * Oxidation numbers of the elements in a species given as `{ comp: {El: count}, charge }`. Rules: an element on its own is 0; fluorine −1;
 * oxygen −2; hydrogen +1; alkali metals +1; alkaline earths +2; chlorine −1 unless oxygen is present; one remaining element takes what
 * the total charge needs. `override` supplies the state of an element the rules cannot settle.
 */
export function oxStates(sp, override = {}) {
  const els = Object.keys(sp.comp);
  const out = {};
  if (els.length === 1) { out[els[0]] = sp.charge / sp.comp[els[0]]; return out; }
  for (const el of els) {
    if (override[el] != null) out[el] = override[el];
    else if (RULE[el] != null) out[el] = RULE[el];
    else if (el === 'Cl' && !els.includes('O')) out[el] = -1;
  }
  const unknown = els.filter(e => out[e] == null);
  if (unknown.length > 1) throw new Error(`oxStates: cannot settle ${unknown.join(', ')} in ${JSON.stringify(sp)}`);
  if (unknown.length === 1) {
    const known = els.filter(e => out[e] != null).reduce((s, e) => s + out[e] * sp.comp[e], 0);
    out[unknown[0]] = (sp.charge - known) / sp.comp[unknown[0]];
  }
  return out;
}

/** Species used by the redox benches: composition, charge and display text. */
export const SPECIES = Object.freeze({
  Zn:     { text: 'Zn',      comp: { Zn: 1 }, charge: 0 },
  'Zn2+': { text: 'Zn²⁺',    comp: { Zn: 1 }, charge: 2 },
  Cu:     { text: 'Cu',      comp: { Cu: 1 }, charge: 0 },
  'Cu2+': { text: 'Cu²⁺',    comp: { Cu: 1 }, charge: 2 },
  Al:     { text: 'Al',      comp: { Al: 1 }, charge: 0 },
  'Al3+': { text: 'Al³⁺',    comp: { Al: 1 }, charge: 3 },
  Ag:     { text: 'Ag',      comp: { Ag: 1 }, charge: 0 },
  'Ag+':  { text: 'Ag⁺',     comp: { Ag: 1 }, charge: 1 },
  Fe:     { text: 'Fe',      comp: { Fe: 1 }, charge: 0 },
  'Fe2+': { text: 'Fe²⁺',    comp: { Fe: 1 }, charge: 2 },
  'Fe3+': { text: 'Fe³⁺',    comp: { Fe: 1 }, charge: 3 },
  Mg:     { text: 'Mg',      comp: { Mg: 1 }, charge: 0 },
  'Mg2+': { text: 'Mg²⁺',    comp: { Mg: 1 }, charge: 2 },
  'H+':   { text: 'H⁺',      comp: { H: 1 }, charge: 1 },
  H2:     { text: 'H₂',      comp: { H: 2 }, charge: 0 },
  H2O:    { text: 'H₂O',     comp: { H: 2, O: 1 }, charge: 0 },
  'Cl-':  { text: 'Cl⁻',     comp: { Cl: 1 }, charge: -1 },
  'Na+':  { text: 'Na⁺',     comp: { Na: 1 }, charge: 1 },
  SO4:    { text: 'SO₄²⁻',   comp: { S: 1, O: 4 }, charge: -2 },
  NO3:    { text: 'NO₃⁻',    comp: { N: 1, O: 3 }, charge: -1 },
  MnO4:   { text: 'MnO₄⁻',   comp: { Mn: 1, O: 4 }, charge: -1 },
  'Mn2+': { text: 'Mn²⁺',    comp: { Mn: 1 }, charge: 2 },
  AgCl:   { text: 'AgCl',    comp: { Ag: 1, Cl: 1 }, charge: 0 },
  NaCl:   { text: 'NaCl',    comp: { Na: 1, Cl: 1 }, charge: 0 },
  NaOH:   { text: 'NaOH',    comp: { Na: 1, O: 1, H: 1 }, charge: 0 },
  HCl:    { text: 'HCl',     comp: { H: 1, Cl: 1 }, charge: 0 },
  AgNO3:  { text: 'AgNO₃',   comp: { Ag: 1, N: 1, O: 3 }, charge: 0 },
  NaNO3:  { text: 'NaNO₃',   comp: { Na: 1, N: 1, O: 3 }, charge: 0 },
  MgCl2:  { text: 'MgCl₂',   comp: { Mg: 1, Cl: 2 }, charge: 0 }
});

/** The oxidation number of one element in a named species (e.g. `oxNumber('MnO4', 'Mn')` = 7). */
export const oxNumber = (id, el) => oxStates(SPECIES[id])[el];

/**
 * The half-reaction ledger: a half is `{ left: {speciesId: coefficient}, right: {...}, eLeft, eRight }` (electrons on each side).
 * Returns a row per element and one for charge, each `{ label, left, right, balanced }`. Elements are listed in a fixed order.
 */
export function ledgerRows(half) {
  const els = new Set();
  const tally = (side, key) => {
    const t = {};
    for (const [id, k] of Object.entries(half[side] || {})) {
      const sp = SPECIES[id];
      for (const [el, c] of Object.entries(sp.comp)) { t[el] = (t[el] || 0) + c * k; els.add(el); }
    }
    return t;
  };
  const L = tally('left'); const R = tally('right');
  const charge = side => Object.entries(half[side] || {}).reduce((s, [id, k]) => s + SPECIES[id].charge * k, 0) - (side === 'left' ? half.eLeft || 0 : half.eRight || 0);
  const order = ['O', 'H'];
  const sorted = [...els].sort((a, b) => {
    const ia = order.indexOf(a); const ib = order.indexOf(b);
    if (ia >= 0 || ib >= 0) return (ia < 0 ? -1 : ia) - (ib < 0 ? -1 : ib);
    return a.localeCompare(b);
  });
  const rows = sorted.map(el => ({ label: el, left: L[el] || 0, right: R[el] || 0, balanced: (L[el] || 0) === (R[el] || 0) }));
  const cl = charge('left'); const cr = charge('right');
  rows.push({ label: 'charge', left: cl, right: cr, balanced: cl === cr });
  return rows;
}

/** A half balanced in acid when every row balances. */
export const halfBalanced = half => ledgerRows(half).every(r => r.balanced);

/**
 * Solve the acid-solution half-reaction for a reduction or oxidation whose main species have fixed coefficients: add H₂O to balance O, H⁺ to
 * balance H, electrons to balance charge. `left` and `right` are `{id: k}` maps of the main species.
 */
export function balanceAcidHalf(left, right) {
  const half = { left: { ...left }, right: { ...right }, eLeft: 0, eRight: 0 };
  const count = (side, el) => Object.entries(half[side]).reduce((s, [id, k]) => s + (SPECIES[id].comp[el] || 0) * k, 0);
  const dO = count('left', 'O') - count('right', 'O');
  if (dO > 0) half.right.H2O = (half.right.H2O || 0) + dO; else if (dO < 0) half.left.H2O = (half.left.H2O || 0) - dO;
  const dH = count('left', 'H') - count('right', 'H');
  if (dH > 0) half.right['H+'] = (half.right['H+'] || 0) + dH; else if (dH < 0) half.left['H+'] = (half.left['H+'] || 0) - dH;
  const q = side => Object.entries(half[side]).reduce((s, [id, k]) => s + SPECIES[id].charge * k, 0);
  const dq = q('left') - q('right');
  if (dq > 0) half.eLeft = dq; else if (dq < 0) half.eRight = -dq;
  return half;
}

/** Electron count of a balanced half (the side that carries electrons). */
export const electronsOf = half => (half.eLeft || 0) + (half.eRight || 0);

/** Multipliers that make two halves carry the same number of electrons (lowest whole numbers). */
export function matchElectrons(nA, nB) {
  const gcd = (p, q) => (q ? gcd(q, p % q) : p);
  const l = (nA * nB) / gcd(nA, nB);
  return { a: l / nA, b: l / nB, electrons: l };
}
