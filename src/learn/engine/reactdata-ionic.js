/**
 * reactdata-ionic.js — Ions in a pot (Kettle bench `q5-ionic`, CED 4.2). PURE: no DOM, no kit, no THREE.
 *
 * Built on `reactdata.js` (`IONS`, `ionicFormula`, `solubility`, `planMix`); nothing there is changed. A SOLUTION is `{cat, an}` (two `IONS`
 * ids). Mixing two solutions pours in just enough of each that neither is left over (`mixUnits`: the smallest numbers of formula units whose
 * ions that leave the water are in the ratio of the solid's formula), so what remains in the water is exactly the spectators.
 *
 * `mixOutcome(A, B)` answers everything the pot, its window and its lamp print:
 *   units       { a, b }  formula units of each solution poured in
 *   before      { ionId: count }  every ion in the two jars
 *   after       { ionId: count }  the ions still dissolved once the mixing has settled
 *   solid       null | { formula, text, cat, an, nCat, nAn, units, ions: [{ion, n}] }  the precipitate, its ions packed together
 *   water       number  molecules of water formed from H+ and OH- (0 when none)
 *   lamp        { before, after }  dissolved ions counted (the lamp's brightness is proportional to this count)
 *   spectators  the ids that are in the water before and after, unchanged
 *   reacted     { ionId: count }  the ions that left the water
 */

import { IONS, ionicFormula, planMix, nameIonic, pretty, ionText } from './reactdata.js';

const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));

/** A solution of one salt: its ions, formula, name. */
export function solution(cat, an) {
  const f = ionicFormula(cat, an);
  return { cat, an, nCat: f.nCat, nAn: f.nAn, formula: f.formula, text: f.text, name: nameIonic(cat, an) };
}

/** How the solid that forms looks (data for the picture; the planner decides whether one forms). */
export const SOLID_LOOK = Object.freeze({
  PbI2: { colour: 'yellow', ink: '#d9b61c' },
  AgCl: { colour: 'white', ink: '#e6e2da' },
  AgBr: { colour: 'cream', ink: '#e0d8a8' },
  AgI: { colour: 'yellow', ink: '#d6c24a' },
  BaSO4: { colour: 'white', ink: '#e6e2da' },
  PbSO4: { colour: 'white', ink: '#e6e2da' },
  CuCO3: { colour: 'blue-green', ink: '#4f9a8a' },
  'Fe(OH)3': { colour: 'rust brown', ink: '#9a4a22' }
});

/** The tint a dissolved ion gives its solution (most are colourless). */
export const SOLUTION_TINT = Object.freeze({ Cu2: '#4a7fb0', Fe3: '#b08a3a' });

/** The smallest numbers of formula units of A and B whose reacting ions are in the ratio of the product's formula. */
export function mixUnits(A, B) {
  const sa = solution(A.cat, A.an);
  const sb = solution(B.cat, B.an);
  const plan = planMix(A, B);
  if (plan.solids.length > 1) throw new Error('reactdata-ionic: two solids are not used by a bench');
  let s = plan.solids[0] || null;
  if (!s && plan.water) s = { cat: 'H', an: 'OH', nCat: 1, nAn: 1 };
  if (!s) return { a: 1, b: 1 };
  if (s.cat === A.cat && s.an === B.an) {
    const g = gcd(sb.nAn * s.nCat, sa.nCat * s.nAn);
    return { a: (sb.nAn * s.nCat) / g, b: (sa.nCat * s.nAn) / g };
  }
  const g = gcd(sb.nCat * s.nAn, sa.nAn * s.nCat);
  return { a: (sb.nCat * s.nAn) / g, b: (sa.nAn * s.nCat) / g };
}

const add = (m, id, n) => { m[id] = (m[id] || 0) + n; };
const total = m => Object.values(m).reduce((a, b) => a + b, 0);

export function mixOutcome(A, B) {
  const sa = solution(A.cat, A.an);
  const sb = solution(B.cat, B.an);
  const plan = planMix(A, B);
  const { a, b } = mixUnits(A, B);
  const before = {};
  add(before, A.cat, a * sa.nCat); add(before, A.an, a * sa.nAn);
  add(before, B.cat, b * sb.nCat); add(before, B.an, b * sb.nAn);
  const after = { ...before };
  const reacted = {};
  let solid = null;
  let water = 0;
  const take = (id, n) => { after[id] -= n; add(reacted, id, n); if (after[id] === 0) delete after[id]; };
  if (plan.solids.length) {
    const s = plan.solids[0];
    const fromA = s.cat === A.cat && s.an === B.an;
    const units = fromA ? (a * sa.nCat) / s.nCat : (b * sb.nCat) / s.nCat;
    take(s.cat, s.nCat * units); take(s.an, s.nAn * units);
    solid = { formula: s.formula, text: s.text ?? pretty(s.formula), cat: s.cat, an: s.an, nCat: s.nCat, nAn: s.nAn, units, ions: [{ ion: s.cat, n: s.nCat * units }, { ion: s.an, n: s.nAn * units }] };
  }
  if (plan.water) { water = a; take('H', a); take('OH', a); }
  const spectators = Object.keys(after).filter(id => !reacted[id]);
  return { units: { a, b }, before, after, solid, water, lamp: { before: total(before), after: total(after) }, spectators, reacted, plan };
}

/** The net ionic equation as chips would build it: `{ ions: {id: n}, product: formula, state }` (the water case has product `H2O`). */
export function netIonic(A, B) {
  const o = mixOutcome(A, B);
  if (o.solid) return { ions: Object.fromEntries(o.solid.ions.map(x => [x.ion, x.n])), product: o.solid.formula, state: 's', units: o.solid.units };
  if (o.water) return { ions: { H: o.water, OH: o.water }, product: 'H2O', state: 'l', units: o.water };
  return null;
}

/** The complete ionic equation: every dissolved ion on the left, the dissolved ions that remain and the solid (or water) on the right. */
export function completeIonic(A, B) {
  const o = mixOutcome(A, B);
  const right = { ...o.after };
  return { left: { ...o.before }, right, product: o.solid ? { formula: o.solid.formula, n: o.solid.units, state: 's' } : o.water ? { formula: 'H2O', n: o.water, state: 'l' } : null };
}

/** `Pb²⁺ + 2 I⁻ → PbI₂(s)` as printed, from `netIonic`. */
export function netText(n) {
  const side = Object.entries(n.ions).map(([id, c]) => `${c === 1 ? '' : `${c} `}${ionText(id)}(aq)`).join(' + ');
  return `${side} → ${n.units === 1 ? '' : `${n.units} `}${pretty(n.product)}(${n.state})`;
}

export { IONS };
