/**
 * reactdata-change.js — the chemistry of Kettle's q3-change (physical and chemical changes, evidence, mass in an open or a sealed pot).
 *
 * PURE: no DOM, no kit. `planChange(caseId, { sealed, scale })` answers, for one change done in the pot, what stands in the pot before,
 * what stands in it after, what left through an open lid, what the air gave, what the balance reads before and after, and which of the
 * four evidence lamps light. Nothing is authored: masses are `reactdata.js` `molarMass` of the species the change names (the two ions of
 * salt carry the listed mass of their atom), the products of a reaction are `reactPlan` of its balanced equation, and a lamp is a rule
 * about what the planner says changed.
 *
 *   gas given off      a gas stands in the pot after (or has left it) that was not a gas before
 *   new colour         a colour stands in the pot after that was not there before
 *   solid forms        a solid stands in the pot after that was not there before
 *   temperature        the change gives out or takes in at least 2 kJ for the amount in the pot (a change the pot's heater drives
 *                      is not read: the heat there is the heater's)
 *
 * SOURCES. Listed masses: `reactdata.js` ATOMIC. Heats of change, kJ per mole as written: ice melting 6.0 and the iron and magnesium
 * oxides from the formation table (`thermodata.js` FORMATION_TABLE: H2O(l) −285.8, H2O(s) −291.8, Fe2O3 −824.2; MgO −601.6, CRC),
 * dry ice subliming +25.2 (CRC), sucrose dissolving +5.9 and salt dissolving +3.9 (CRC, from NaCl(s) −411.2, Na+(aq) −240.1, Cl−(aq)
 * −167.2), cellulose burning about −2815 per C6H10O5 (formation about −975, CRC). A lamp reads only the sign and whether the heat is
 * past 2 kJ, so the roundness of these is not the figure anyone is shown.
 *
 * SIMPLIFICATIONS, said on the bench and in the design file: wood is drawn as cellulose, C6H10O5, burning completely (real wood leaves
 * a little ash); rust and the iron oxide of burning steel wool are drawn as Fe2O3; heated sugar is drawn as C12H22O11 → 12 C + 11 H2O,
 * the charring a real caramel also leaves volatile oils out of; a sealed pot is large enough to hold the oxygen the burn takes.
 */

import { parseEquation, reactPlan, molarMass } from './reactdata.js';

const round = (x, d = 4) => Math.round(x * 10 ** d) / 10 ** d;

/** The two ions of salt: the listed mass of their atom (the electron's mass is left out). */
const ION_MASS = Object.freeze({ 'Na+': 23.0, 'Cl-': 35.5 });
export const massOf = f => (ION_MASS[f] != null ? ION_MASS[f] : molarMass(f));

/** The key a species is filed under: its formula and its state. */
export const keyOf = (f, st) => `${f}|${st}`;

/** What a species LOOKS like when it is something you could see: a colour, or nothing for clear and colourless. */
export const LOOK = Object.freeze({
  'Fe|s': 'grey', 'Fe2O3|s': 'red-brown', 'C12H22O11|s': 'white', 'C|s': 'black', 'Mg|s': 'silver', 'MgO|s': 'white',
  'C6H10O5|s': 'tan', 'NaCl|s': 'white', 'H2O|s': 'white', 'CO2|s': 'white'
});

/** The heat lamp lights at this many kJ. */
export const HEAT_LAMP_KJ = 2.0;

/**
 * THE CHANGES. `kind` is what chemists call it. A physical change names the sample (`sample`) and what it becomes (`becomes`, per
 * mole of the sample); a chemical change names a balanced equation (`eq`), what the jar holds (`feed`, moles), the reactants the open
 * air supplies in plenty (`air`), and how much of them a sealed pot holds in with it (`sealedIn`). `solvent` stands in the pot unchanged.
 * `dH` is the heat of the change in kJ per mole of the change as written, `heated` marks a change the pot's own heater drives, and
 * `unit` the moles one window disc stands for.
 */
export const CASES = Object.freeze({
  ice: {
    id: 'ice', name: 'Ice', verb: 'melts', kind: 'physical', unit: 0.25, dH: 6.0,
    sample: { f: 'H2O', st: 's', mol: 1.0 }, becomes: [{ f: 'H2O', st: 'l', k: 1 }]
  },
  sugarwater: {
    id: 'sugarwater', name: 'Sugar and water', verb: 'dissolves', kind: 'physical', unit: 0.0125, dH: 5.9,
    sample: { f: 'C12H22O11', st: 's', mol: 0.05 }, becomes: [{ f: 'C12H22O11', st: 'aq', k: 1 }], solvent: 'H2O'
  },
  saltwater: {
    id: 'saltwater', name: 'Salt and water', verb: 'dissolves', kind: 'physical', unit: 0.05, dH: 3.9,
    sample: { f: 'NaCl', st: 's', mol: 0.2 }, becomes: [{ f: 'Na+', st: 'aq', k: 1 }, { f: 'Cl-', st: 'aq', k: 1 }], solvent: 'H2O',
    // The crystal is its two ions, held in a lattice: the window draws them as such.
    crystal: [{ f: 'Na+', st: 's', k: 1 }, { f: 'Cl-', st: 's', k: 1 }]
  },
  dryice: {
    id: 'dryice', name: 'Dry ice', verb: 'warms', kind: 'physical', unit: 0.25, dH: 25.2,
    sample: { f: 'CO2', st: 's', mol: 1.0 }, becomes: [{ f: 'CO2', st: 'g', k: 1 }]
  },
  sugarheat: {
    id: 'sugarheat', name: 'Sugar', verb: 'heated', kind: 'chemical', unit: 0.1, heated: true, dH: 0,
    eq: 'C12H22O11(s) -> 12 C(s) + 11 H2O(g)', feed: { C12H22O11: 0.1 }, air: [], sealedIn: {}
  },
  wool: {
    id: 'wool', name: 'Steel wool', verb: 'burned', kind: 'chemical', unit: 0.25, dH: 2 * -824.2,
    eq: '4 Fe(s) + 3 O2(g) -> 2 Fe2O3(s)', feed: { Fe: 1.0 }, air: ['O2'], sealedIn: { O2: 0.75 }
  },
  magnesium: {
    id: 'magnesium', name: 'Magnesium', verb: 'burned', kind: 'chemical', unit: 0.25, dH: 2 * -601.6,
    eq: '2 Mg(s) + O2(g) -> 2 MgO(s)', feed: { Mg: 1.0 }, air: ['O2'], sealedIn: { O2: 0.5 }
  },
  wood: {
    id: 'wood', name: 'Wood chips', verb: 'burned', kind: 'chemical', unit: 0.1, dH: -2815,
    eq: 'C6H10O5(s) + 6 O2(g) -> 6 CO2(g) + 5 H2O(g)', feed: { C6H10O5: 0.1 }, air: ['O2'], sealedIn: { O2: 0.6 }
  }
});

/** The ids of every change. */
export const CASE_IDS = Object.freeze(Object.keys(CASES));

/** One species of a reading: formula, state, moles, and the grams those moles weigh. */
const item = (f, st, mol, from) => ({ f, st, mol: round(mol, 6), grams: round(mol * massOf(f), 4), from });

/**
 * Do one change in the pot. `sealed` is the lid; `scale` multiplies the amounts (the pot's amount dial).
 * @returns {{
 *   id, kind, sealed, scale, unit,
 *   before: object[], air: object[], after: object[], escaped: object[],
 *   massBefore: number, massAfter: number, change: number,
 *   lamps: { gas: boolean, colour: boolean, solid: boolean, temp: boolean }, heat: number, newSubstance: boolean
 * }}
 */
export function planChange(id, { sealed = false, scale = 1 } = {}) {
  const c = CASES[id];
  if (!c) throw new Error(`reactdata-change: no change called "${id}"`);
  let before = [];
  let after = [];
  let air = [];
  let extent = 1;
  if (c.kind === 'physical') {
    const mol = c.sample.mol * scale;
    before = c.crystal ? c.crystal.map(b => item(b.f, b.st, mol * b.k, 'jar')) : [item(c.sample.f, c.sample.st, mol, 'jar')];
    after = c.becomes.map(b => item(b.f, b.st, mol * b.k, 'made'));
    extent = mol;
  } else {
    const eq = parseEquation(c.eq);
    const states = {};
    for (const s of [...eq.lhs, ...eq.rhs]) states[s.f] = s.state;
    const feeds = {};
    for (const [f, mol] of Object.entries(c.feed)) feeds[f] = mol * scale;
    if (sealed) for (const [f, mol] of Object.entries(c.sealedIn)) feeds[f] = mol * scale;
    const plan = reactPlan(eq, feeds);
    extent = plan.extent;
    for (const [f, mol] of Object.entries(c.feed)) before.push(item(f, states[f], mol * scale, 'jar'));
    if (sealed) for (const [f, mol] of Object.entries(c.sealedIn)) before.push(item(f, states[f], mol * scale, 'sealed'));
    if (!sealed) {
      for (const f of c.air) {
        const n = eq.lhs.find(s => s.f === f).n;
        air.push(item(f, states[f], n * extent, 'air'));
      }
    }
    for (const [f, mol] of Object.entries(plan.left)) if (mol > 1e-9) after.push(item(f, states[f], mol, 'left'));
    for (const s of eq.rhs) after.push(item(s.f, s.state, plan.made[s.f], 'made'));
  }
  // A gas leaves an open pot; a sealed pot keeps it. The solvent stays.
  const escaped = sealed ? [] : after.filter(a => a.st === 'g').map(a => ({ ...a, from: 'escaped' }));
  const kept = sealed ? after : after.filter(a => a.st !== 'g');
  const sumG = list => round(list.reduce((s, a) => s + a.grams, 0) + (c.solvent ? solventG(c, scale) : 0), 3);
  const massBefore = sumG(before);
  const massAfter = sumG(kept);

  const beforeKeys = new Set(before.map(b => keyOf(b.f, b.st)));
  const afterAll = [...kept, ...escaped];
  const gas = afterAll.some(a => a.st === 'g' && !beforeKeys.has(keyOf(a.f, a.st)));
  const looks = list => new Set(list.map(a => LOOK[keyOf(a.f, a.st)]).filter(Boolean));
  const lookBefore = looks(before);
  const colour = [...looks(kept)].some(l => !lookBefore.has(l));
  const solid = kept.some(a => a.st === 's' && !beforeKeys.has(keyOf(a.f, a.st)));
  const heat = c.heated ? 0 : round((c.kind === 'physical' ? c.dH * extent : c.dH * extent), 3);
  const temp = !c.heated && Math.abs(heat) >= HEAT_LAMP_KJ;
  // A NEW SUBSTANCE: a species (by formula) stands in the pot after that was not in the pot before. Ice becomes water: the same H2O.
  // A salt's two ions are the salt's own, so they count as the salt.
  const formulaOf = f => (f === 'Na+' ? 'NaCl' : f === 'Cl-' ? 'NaCl' : f);
  const beforeF = new Set(before.map(b => formulaOf(b.f)));
  const newSubstance = afterAll.some(a => !beforeF.has(formulaOf(a.f)));
  return {
    id, kind: c.kind, sealed, scale, unit: c.unit, name: c.name, solvent: c.solvent || null,
    before, air, after: kept, escaped, extent: round(extent, 6),
    massBefore, massAfter, change: round(massAfter - massBefore, 3),
    lamps: { gas, colour, solid, temp }, heat, newSubstance
  };
}

function solventG(c, scale) {
  // The water the salt or sugar is stirred into: 90 g, a fixed bath (it does not change, so it adds the same to both weighings).
  return c.solvent === 'H2O' ? 90 : 0;
}

/** The grams of the pot's contents before and after, for the amounts a scale gives: a convenience for checks and stages. */
export const weighChange = (id, opts) => { const p = planChange(id, opts); return { before: p.massBefore, after: p.massAfter }; };
