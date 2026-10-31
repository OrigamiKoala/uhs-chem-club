/**
 * reactdata-balance.js — the chemistry of Kettle's q4-balance (equations that count atoms).
 *
 * PURE: no DOM, no kit. The equation board, its atom ledger and its particle window all ask the functions here, so the drawn and the
 * built table cannot disagree and `verify:learn` can recompute every figure. The counting itself is `reactdata.js`
 * (`parseEquation`, `atomLedger`, `balance`, `withCoefficients`, `equationText`); this file adds only what a board needs around it:
 *
 *   boardPlan      an equation with the coefficients, the small numbers and the states a player has set, and its atom ledger
 *   groupLedger    the same count with a group of atoms (PO4, OH) counted as one piece
 *   shapeOf        where the atoms of one molecule sit, for the particle window (counts come from the formula, and are held to it in Node)
 *   STATE_OF       the state each species is in at the table's temperature, the datum the state tiles are checked against
 *   diagramOf      what a pot holds before and after a run of a balanced equation (a particle diagram)
 */

import { parseEquation, parseFormula, atomLedger, balance, withCoefficients, equationText, reactPlan, molarMass } from './reactdata.js';

/* ------------------------------------------------------------------
   THE BOARD'S EQUATION
   ------------------------------------------------------------------ */

/** The formula with the count of one element replaced (`H2O`, `O`, 2 → `H2O2`): the small number a player turns. Groups in brackets are left alone. */
export function withSubscript(formula, el, n) {
  let depth = 0;
  let out = '';
  for (let i = 0; i < formula.length; i++) {
    const ch = formula[i];
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (depth === 0 && ch === el[0] && !/[a-z]/.test(formula[i + 1] || '') && (el.length === 1 || formula.startsWith(el, i))) {
      let j = i + el.length;
      while (/[0-9]/.test(formula[j] || '')) j++;
      return out + el + (n === 1 ? '' : String(n)) + formula.slice(j);
    }
    out += ch;
  }
  return formula;
}

/**
 * The equation a board stands for. `eqText` is the starting equation; `coefs` are the coefficients, left side then right (species without
 * a dial keep their written one); `subs` is `{ [speciesIndex]: { el, n } }`, a small number turned; `states` is `{ [speciesIndex]: 's'|'l'|'g'|'aq' }`.
 * Returns the equation, its ledger and whether the atoms agree.
 */
export function boardPlan(eqText, { coefs = null, subs = {}, states = {} } = {}) {
  const base = parseEquation(eqText);
  const all = [...base.lhs, ...base.rhs];
  const nl = base.lhs.length;
  const made = all.map((s, i) => {
    const sb = subs[i];
    return { n: coefs ? coefs[i] : s.n, f: sb ? withSubscript(s.f, sb.el, sb.n) : s.f, state: states[i] !== undefined ? states[i] : s.state };
  });
  const eq = { lhs: made.slice(0, nl), rhs: made.slice(nl) };
  const ledger = atomLedger(eq);
  return { eq, species: made, ledger, balanced: ledger.balanced, text: equationText(eq) };
}

/** The smallest whole-number coefficients of an equation's species, left then right as one list, or null. */
export function smallestCoefs(eqText) {
  const eq = parseEquation(eqText);
  const b = balance(eq);
  return b ? [...b[0], ...b[1]] : null;
}

/** True when every coefficient is a multiple of one number above 1 (a balanced set that could be written smaller). */
export function reducible(coefs) {
  const g = (a, b) => (b ? g(b, a % b) : a);
  return coefs.reduce(g) > 1;
}

/* ------------------------------------------------------------------
   GROUPS COUNTED AS ONE PIECE
   ------------------------------------------------------------------ */

/** A group's atoms, for the check that a formula split into groups is still the same formula. */
export const GROUP_ATOMS = Object.freeze({ H: { H: 1 }, Ca: { Ca: 1 }, OH: { O: 1, H: 1 }, PO4: { P: 1, O: 4 } });

/** How a formula splits into pieces, when a group is counted once (`[unit, count]`). Written for the species of the benches that use it. */
export const PARTS = Object.freeze({
  'Ca(OH)2': [['Ca', 1], ['OH', 2]],
  H3PO4: [['H', 3], ['PO4', 1]],
  'Ca3(PO4)2': [['Ca', 3], ['PO4', 2]],
  H2O: [['H', 1], ['OH', 1]]
});

/** Expand a split back into atoms (held equal to `parseFormula` in Node). */
export function expandParts(parts) {
  const out = {};
  for (const [u, n] of parts) for (const [el, k] of Object.entries(GROUP_ATOMS[u])) out[el] = (out[el] || 0) + n * k;
  return out;
}

/** The ledger of a board's equation by pieces: rows `{ el, left, right }` for each unit that appears, in `order`. */
export function groupLedger(eq, order) {
  const sum = side => {
    const t = {};
    for (const { n, f } of side) for (const [u, k] of PARTS[f] || []) t[u] = (t[u] || 0) + n * k;
    return t;
  };
  const left = sum(eq.lhs);
  const right = sum(eq.rhs);
  const rows = order.map(el => ({ el, left: left[el] || 0, right: right[el] || 0 }));
  return { rows, balanced: rows.every(r => r.left === r.right) };
}

/* ------------------------------------------------------------------
   MOLECULES FOR THE PARTICLE WINDOW
   ------------------------------------------------------------------ */

/** Relative atom radii (bond length is about the sum of two). */
export const RADIUS = Object.freeze({ H: 0.55, C: 0.85, N: 0.8, O: 0.8, Na: 1.0, P: 0.95, Ca: 1.1, Fe: 1.0, Cl: 0.95 });
/** The colour of each kind of atom in the window (muted, on a dark glass). */
export const INK = Object.freeze({ H: '#d8d2c4', C: '#8c8376', N: '#6f8fb0', O: '#a0522d', Na: '#b4ab97', P: '#b9a06a', Ca: '#cfc8b4', Fe: '#9aa0a6', Cl: '#78a142' });

const rad = d => (d * Math.PI) / 180;
const at = (r, deg) => [r * Math.cos(rad(deg)), r * Math.sin(rad(deg))];

/** A hub atom at the origin with others at given angles (degrees, 0 to the right, 90 down). */
function spokes(hub, list) {
  const out = [{ el: hub, x: 0, y: 0 }];
  for (const [el, deg] of list) {
    const [x, y] = at(RADIUS[hub] + RADIUS[el], deg);
    out.push({ el, x, y });
  }
  return out;
}
const pair = (a, b) => [{ el: a, x: -(RADIUS[a] + RADIUS[b]) / 2, y: 0 }, { el: b, x: (RADIUS[a] + RADIUS[b]) / 2, y: 0 }];
const addH = (atoms, i, degs) => degs.map(d => { const [dx, dy] = at(RADIUS[atoms[i].el] + RADIUS.H, d); return { el: 'H', x: atoms[i].x + dx, y: atoms[i].y + dy }; });
const tetra = (r = 1.25) => [[-r, -r], [r, -r], [-r, r], [r, r]];

function po4(cx) {
  return [{ el: 'P', x: cx, y: 0 }, ...tetra().map(([x, y]) => ({ el: 'O', x: cx + x, y }))];
}

/** A generic cluster for a formula with no drawing of its own: one atom, a pair, or a ring wide enough for its atoms. */
function ring(formula) {
  const els = Object.entries(parseFormula(formula)).flatMap(([el, n]) => Array(n).fill(el));
  if (els.length === 1) return [{ el: els[0], x: 0, y: 0 }];
  if (els.length === 2) return pair(els[0], els[1]);
  const R = Math.max(...els.map(e => RADIUS[e])) * 1.1 / Math.sin(Math.PI / els.length) * 1.05;
  return els.map((el, i) => { const [x, y] = at(R, -90 + (360 * i) / els.length); return { el, x, y }; });
}

const DRAWN = {
  H2: () => pair('H', 'H'),
  O2: () => pair('O', 'O'),
  N2: () => pair('N', 'N'),
  CO: () => pair('C', 'O'),
  H2O: () => spokes('O', [['H', 37.75], ['H', 142.25]]),
  NH3: () => spokes('N', [['H', 30], ['H', 150], ['H', 270]]),
  CH4: () => spokes('C', [['H', 45], ['H', 135], ['H', 225], ['H', 315]]),
  CO2: () => spokes('C', [['O', 0], ['O', 180]]),
  H2O2: () => {
    const a = pair('O', 'O');
    return [...a, ...addH(a, 0, [150]), ...addH(a, 1, [330])];
  },
  C3H8: () => {
    const c = [{ el: 'C', x: -1.47, y: 0.43 }, { el: 'C', x: 0, y: -0.43 }, { el: 'C', x: 1.47, y: 0.43 }];
    return [...c, ...addH(c, 0, [180, 120, 240]), ...addH(c, 1, [235, 305]), ...addH(c, 2, [0, 60, 300])];
  },
  Fe: () => [{ el: 'Fe', x: 0, y: 0 }],
  Na: () => [{ el: 'Na', x: 0, y: 0 }],
  Fe2O3: () => ['Fe', 'O', 'Fe', 'O', 'O'].map((el, i) => { const [x, y] = at(1.6, -90 + 72 * i); return { el, x, y }; }),
  NaOH: () => [{ el: 'Na', x: -1.8, y: 0 }, { el: 'O', x: 0, y: 0 }, { el: 'H', x: 1.35, y: 0 }],
  P4: () => [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, y]) => ({ el: 'P', x, y })),
  'Ca(OH)2': () => {
    const c = [{ el: 'Ca', x: 0, y: 0 }, { el: 'O', x: -1.9, y: 0 }, { el: 'O', x: 1.9, y: 0 }];
    return [...c, ...addH(c, 1, [235]), ...addH(c, 2, [305])];
  },
  H3PO4: () => {
    const a = po4(0);
    const [dx, dy] = at(1.35, 225);
    return [...a, { el: 'H', x: a[1].x + dx, y: a[1].y + dy }, { el: 'H', x: a[2].x - dx, y: a[2].y + dy }, { el: 'H', x: a[3].x + dx, y: a[3].y - dy }];
  },
  'Ca3(PO4)2': () => [...po4(-3), ...po4(3), { el: 'Ca', x: 0, y: 0 }, { el: 'Ca', x: 0, y: -2.9 }, { el: 'Ca', x: 0, y: 2.9 }]
};

/** The atoms of one molecule of `formula`, centred on its middle: `[{el, x, y}]` in the units of RADIUS. */
export function shapeOf(formula) {
  const atoms = (DRAWN[formula] || (() => ring(formula)))();
  const xs = atoms.map(a => a.x); const ys = atoms.map(a => a.y);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
  return atoms.map(a => ({ el: a.el, x: Math.round((a.x - cx) * 1000) / 1000, y: Math.round((a.y - cy) * 1000) / 1000 }));
}

/** The width and height a molecule of `formula` takes, in RADIUS units. */
export function extentOf(formula) {
  const atoms = shapeOf(formula);
  const w = Math.max(...atoms.map(a => a.x + RADIUS[a.el])) - Math.min(...atoms.map(a => a.x - RADIUS[a.el]));
  const h = Math.max(...atoms.map(a => a.y + RADIUS[a.el])) - Math.min(...atoms.map(a => a.y - RADIUS[a.el]));
  return { w, h };
}

/* ------------------------------------------------------------------
   STATES
   ------------------------------------------------------------------ */

/** The state of each species at room temperature in a pot of water (the datum the state symbols are held to). */
export const STATE_OF = Object.freeze({ Na: 's', H2O: 'l', NaOH: 'aq', H2: 'g' });
export const STATE_WORDS = Object.freeze({ s: 'solid', l: 'liquid', g: 'gas', aq: 'in water' });
/** What the window draws of each state, in words, for a refusal: how the particles sit. */
export const STATE_PICTURE = Object.freeze({
  s: 'locked in rows',
  l: 'touching and jumbled',
  g: 'far apart',
  aq: 'spread out among water particles'
});

/* ------------------------------------------------------------------
   A PARTICLE DIAGRAM OF A POT
   ------------------------------------------------------------------ */

/**
 * What a pot holds before and after a run: `feed` is molecules by formula. The reaction is the balanced equation of `eqText`; the
 * reactant that runs out sets how far it goes (`reactPlan`), the others keep what is left. Returns `{ before: [[f, n]], after: [[f, n]], coefs }`.
 */
export function diagramOf(eqText, feed) {
  const eq = parseEquation(eqText);
  const b = balance(eq);
  const bal = withCoefficients(eq, b);
  const plan = reactPlan(bal, feed);
  const before = eq.lhs.map(s => [s.f, feed[s.f] || 0]).filter(([, n]) => n > 0);
  const after = [
    ...eq.lhs.map(s => [s.f, plan.left[s.f] ?? 0]),
    ...eq.rhs.map(s => [s.f, plan.made[s.f]])
  ].filter(([, n]) => n > 0);
  return { before, after, coefs: [...b[0], ...b[1]], plan };
}

export { molarMass };
