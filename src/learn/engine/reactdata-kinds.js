/**
 * reactdata-kinds.js — The chemistry of Kettle's q8-kinds (CED 4.7 to 4.9): the kinds a reaction belongs to, a proton that moves, the
 * electrons that move, oxidation numbers read from a species, and what a splint or limewater does in a gas.
 *
 * PURE: no DOM, no kit. Built on `reactdata.js` (`parseEquation`, `parseFormula`, `oxidationNumbers`, `balance`), which it never changes.
 * `reactdata.js` `kindsOf` stays as it was; the bench asks `kindsFull` here, which also knows a metal burning, an acid giving a proton
 * to ammonia, and a hydroxide (`NaOH`, whose hydrogen is +1 beside its oxygen, not −1).
 *
 * THE FIVE KINDS the bench files reactions under: synthesis, decomposition, combustion, acid-base, redox.
 *   synthesis      two or more reactants make one product.
 *   decomposition  one reactant makes two or more products.
 *   combustion     a substance burns in oxygen: O2 is a reactant and the reaction is redox (the oxygen is reduced). A metal burning
 *                  (2 Mg + O2 -> 2 MgO) counts, as it does wherever "burning" is the definition.
 *   acid-base      a proton (H+) passes from an acid to a base (`protonTransfer`).
 *   redox          an element's oxidation number changes between the left and the right (`electronFlow`).
 */

import { parseEquation, parseFormula, oxidationNumbers, balance, withCoefficients, molarMass } from './reactdata.js';

export const KINDS = Object.freeze(['synthesis', 'decomposition', 'combustion', 'acid-base', 'redox']);
export const KIND_LABEL = Object.freeze({ synthesis: 'Synthesis', decomposition: 'Decomposition', combustion: 'Combustion', 'acid-base': 'Acid-base', redox: 'Redox' });

const round = (x, d = 3) => Math.round(x * 10 ** d) / 10 ** d;

/* ------------------------------------------------------------------
   OXIDATION NUMBERS OF A SPECIES
   ------------------------------------------------------------------ */

const GROUP12 = new Set(['Li', 'Na', 'K', 'Mg', 'Ca', 'Ba']);

/**
 * Oxidation numbers of the elements of a species. A hydroxide of a metal (`NaOH`, `Ca(OH)2`) keeps hydrogen at +1 beside its oxygen;
 * everything else is `reactdata.js` `oxidationNumbers`. Returns `{El: n}` or null when the rules do not settle it.
 */
export function oxNumbers(formula, charge = 0) {
  const counts = parseFormula(formula);
  const els = Object.keys(counts);
  if (els.length === 3 && counts.O && counts.H && els.some(e => GROUP12.has(e)) && /OH/.test(formula)) {
    const metal = els.find(e => GROUP12.has(e));
    const m = metal && (['Li', 'Na', 'K'].includes(metal) ? 1 : 2);
    return { [metal]: m, O: -2, H: 1 };
  }
  return oxidationNumbers(formula, charge);
}

/** The species of one side of an equation with each element's oxidation number: `[{f, n, state, on}]` (on null when unsettled). */
function withNumbers(side) {
  return side.map(s => ({ ...s, on: oxNumbers(s.f) }));
}

/* ------------------------------------------------------------------
   ELECTRONS THAT MOVE
   ------------------------------------------------------------------ */

/**
 * The electrons that move in a redox reaction, counted from the oxidation numbers. For each element that sits in exactly one species on
 * each side, the change per atom times the atoms of it in the balanced equation: a rise is electrons LOST (oxidised), a fall is electrons
 * GAINED (reduced). Returns `{ lost: [{el, species, from, to, atoms, electrons}], gained: [...], total }` (`total` is the electrons
 * lost, which equals the electrons gained), or null when the equation has no element whose number changes or a species cannot be settled.
 */
export function electronFlow(eq) {
  const L = withNumbers(eq.lhs);
  const R = withNumbers(eq.rhs);
  if ([...L, ...R].some(s => !s.on)) return null;
  const els = [...new Set([...L, ...R].flatMap(s => Object.keys(s.on)))];
  const lost = [];
  const gained = [];
  for (const el of els) {
    const left = L.filter(s => s.on[el] != null);
    const right = R.filter(s => s.on[el] != null);
    if (left.length !== 1 || right.length !== 1) continue;
    const a = left[0];
    const b = right[0];
    const from = a.on[el];
    const to = b.on[el];
    if (from === to) continue;
    const atoms = a.n * parseFormula(a.f)[el];
    const row = { el, from: a.f, to: b.f, fromNumber: from, toNumber: to, atoms, electrons: Math.abs(to - from) * atoms };
    (to > from ? lost : gained).push(row);
  }
  if (!lost.length && !gained.length) return null;
  return { lost, gained, total: lost.reduce((s, r) => s + r.electrons, 0) };
}

/* ------------------------------------------------------------------
   A PROTON THAT MOVES
   ------------------------------------------------------------------ */

/** Acids the bench uses (formula starts with the hydrogen it gives away). */
const ACID_FORMULAS = new Set(['HCl', 'HBr', 'HF', 'HNO3', 'H2SO4', 'CH3COOH']);
/** A base takes a proton: a metal hydroxide (onto its OH) or ammonia (onto its N). */
const isHydroxide = f => /^[A-Z][a-z]?\(?OH/.test(f) && /OH/.test(f) && f !== 'H2O2';
const isAmmonia = f => f === 'NH3';

/**
 * Does a proton pass in this reaction? An acid and a base on the left: the acid gives one H+ and the base takes it. Returns
 * `{ donor, acceptor, product, site }` (`product` the species on the right that holds the proton's new place, `site` the atom that takes it)
 * or null when no proton passes (a metal and an acid is electrons, not a proton, and a fuel and oxygen is neither).
 */
export function protonTransfer(eq) {
  const lf = eq.lhs.map(s => s.f);
  const donor = lf.find(f => ACID_FORMULAS.has(f));
  const acceptor = lf.find(f => isHydroxide(f) || isAmmonia(f));
  if (!donor || !acceptor) return null;
  const site = isAmmonia(acceptor) ? 'N' : 'O';
  const rf = eq.rhs.map(s => s.f);
  const product = isAmmonia(acceptor) ? rf.find(f => parseFormula(f).N && parseFormula(f).H > 3) : rf.find(f => f === 'H2O');
  if (!product) return null;
  return { donor, acceptor, product, site };
}

/* ------------------------------------------------------------------
   THE KINDS A REACTION BELONGS TO
   ------------------------------------------------------------------ */

/** Does an element's oxidation number change between the two sides? (`electronFlow` is non-null.) */
export const isRedox = eq => electronFlow(eq) !== null;

/**
 * Every kind a reaction belongs to, as a Set of `KINDS`. A reaction can belong to several: burning magnesium is synthesis, combustion
 * and redox at once.
 */
export function kindsFull(eq) {
  const kinds = new Set();
  const nl = eq.lhs.length;
  const nr = eq.rhs.length;
  if (nl >= 2 && nr === 1) kinds.add('synthesis');
  if (nl === 1 && nr >= 2) kinds.add('decomposition');
  const redox = isRedox(eq);
  if (redox) kinds.add('redox');
  if (eq.lhs.some(s => s.f === 'O2') && redox && !eq.rhs.some(s => s.f === 'O2')) kinds.add('combustion');
  if (protonTransfer(eq)) kinds.add('acid-base');
  return kinds;
}

/** The shape of a reaction as the pieces window shows it: `many-to-one`, `one-to-many` or `neither`. */
export function shapeOf(eq) {
  if (eq.lhs.length >= 2 && eq.rhs.length === 1) return 'many-to-one';
  if (eq.lhs.length === 1 && eq.rhs.length >= 2) return 'one-to-many';
  return 'neither';
}

/** Is oxygen used (on the left) or made (on the right)? `'used' | 'made' | 'none'`. */
export function oxygenOf(eq) {
  if (eq.lhs.some(s => s.f === 'O2')) return 'used';
  if (eq.rhs.some(s => s.f === 'O2')) return 'made';
  return 'none';
}

/* ------------------------------------------------------------------
   GAS TESTS
   ------------------------------------------------------------------ */

export const GAS_TESTS = Object.freeze({
  glowing: { label: 'Glowing splint', use: 'relights in oxygen' },
  lit: { label: 'Lit splint', use: 'pops in hydrogen' },
  limewater: { label: 'Limewater', use: 'turns cloudy in carbon dioxide' },
  glass: { label: 'Cold glass', use: 'mists over in water vapour' }
});
export const GAS_TEST_ORDER = Object.freeze(['glowing', 'lit', 'limewater', 'glass']);

/**
 * What a test does in a jar that holds these gases (a list of formulas, or one). The results are the ones a school lab sees:
 *   glowing splint  relights in oxygen; otherwise goes out.
 *   lit splint      burns brighter in oxygen, pops in hydrogen, burns with a blue flame in methane, goes out in anything else.
 *   limewater       turns cloudy in carbon dioxide, stays clear otherwise.
 *   cold glass      mists over in water vapour, stays dry otherwise.
 * Returns `{ result: 'relights'|'goes out'|'brighter'|'pops'|'blue flame'|'cloudy'|'clear'|'mist'|'dry', text }`.
 */
export function gasTest(gas, test) {
  const has = new Set(Array.isArray(gas) ? gas : [gas]);
  if (!GAS_TESTS[test]) throw new Error(`reactdata-kinds: no gas test "${test}"`);
  if (test === 'glowing') return has.has('O2') ? { result: 'relights', text: 'Relights' } : { result: 'goes out', text: 'Goes out' };
  if (test === 'lit') {
    if (has.has('O2')) return { result: 'brighter', text: 'Burns brighter' };
    if (has.has('H2')) return { result: 'pops', text: 'Pops' };
    if (has.has('CH4')) return { result: 'blue flame', text: 'Burns blue' };
    return { result: 'goes out', text: 'Goes out' };
  }
  if (test === 'limewater') return has.has('CO2') ? { result: 'cloudy', text: 'Turns cloudy' } : { result: 'clear', text: 'Stays clear' };
  return has.has('H2O') ? { result: 'mist', text: 'Mists over' } : { result: 'dry', text: 'Stays dry' };
}

/**
 * What burning a fuel (a hydrocarbon `CxHy`) in plenty of oxygen leaves: the balanced equation and the gases that come off.
 * `{ eq, gases: ['CO2', 'H2O'], oxygen }` — `oxygen` is the moles of O2 used per mole of fuel.
 */
export function burnPlan(fuel) {
  const eq = parseEquation(`${fuel} + O2 -> CO2 + H2O`);
  const coeff = balance(eq);
  if (!coeff) throw new Error(`reactdata-kinds: cannot burn ${fuel}`);
  const done = withCoefficients(eq, coeff);
  return { eq: done, gases: ['CO2', 'H2O'], oxygen: coeff[0][1] / coeff[0][0] };
}

/** Moles of electrons per formula unit, as a convenience for the story (`electronFlow(eq).total`). */
export const electronsMoved = eq => electronFlow(eq)?.total ?? 0;

export { round, molarMass };
