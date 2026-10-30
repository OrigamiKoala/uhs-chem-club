/**
 * Unit 7 · Bench 6 — Stoichiometry (q6-stoich)
 *
 * The blast-furnace charge floor, on the pot kit (`table/kits/pot.js`): a reaction pot that is fed from jars (or a dial), a catch jar
 * the pot's key fills, a balance that reads what a jar holds, and a window of particles. Every amount the pot makes is
 * `reactdata.js` `reactPlan` of what was fed; nothing on the table is authored. Eight stages and ONE click: the belief that grams react
 * in the ratio of the equation's coefficients.
 *
 *   1  PREDICT: how many grams of water does 4.0 g of hydrogen make?       (the held model: the coefficients are grams)
 *   2  TEST: the pot at 1 to 4 g of hydrogen, the balance, then 5.0 g past the dial   -> grams of product follow grams fed
 *   3  moles in, moles out: the window, one disc a mole; 12 mol past the dial          -> mole ratio
 *   4  a different pot: grams of salt from grams of chlorine, past the dial            -> grams to grams, theoretical yield
 *   5  two jars, the balance on what was made; type the hydrogen left                  -> excess reactant (limiting, on masses)
 *   6  heat limestone; the syringe at 10.0 g, then 50.0 g past it                      -> gas volume from moles
 *   7  the furnace makes less than the equation allows; type the percent               -> percent yield
 *   8  sealed: a salt sample, silver nitrate in plenty, weigh the solid; type the purity -> gravimetric analysis
 *
 * THE TEACHING STANCE. The equation is printed (balancing is `q4-balance`'s job) with the molar masses a stage needs, because
 * a constant is given and a method is not. A figure is typed past the dial's range, and a pot is always run once so a picture stands
 * behind the number. A product's mass is never printed: the catch jar says what it holds and the balance says how much.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, jar, reactorFixture, weighFixture, plaqueFixture, stmt, reactorRead, weighRead, seatedIn, fixed } from '../../table/kits/pot.js';
import { molarMass, reactPlan, parseEquation, gasVolume, percentYield } from '../../engine/reactdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmole ratio\b/i, introducedAt: 3 },
  { term: /\btheoretical yield\b/i, introducedAt: 4 },
  { term: /\bexcess reactant\b/i, introducedAt: 5 },
  { term: /\bpercent yield\b/i, introducedAt: 7 },
  { term: /\bgravimetric analysis\b/i, introducedAt: 8 }
];

/** Moles and molar mass are Tallow's, the gas law is Bellows', the limiting reactant is this world's first bench. */
export const BUILDS_ON = ['unit01/q6-weigh', 'unit04/q3-ideal', 'unit07/q1-recipe'];

/** The room this quest's table stands in at T4: Kettle has no world to stand in yet (`rooms.js`). */
export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q6-stoich';

/* ------------------------------------------------------------------
   THE CASES (every figure is worked from the equation and the listed masses)
   ------------------------------------------------------------------ */

const EQ_WATER = '2 H2 + O2 -> 2 H2O';
const EQ_AMMONIA = 'N2 + 3 H2 -> 2 NH3';
const EQ_SALT = '2 Na + Cl2 -> 2 NaCl';
const EQ_LIME = 'CaCO3 -> CaO + CO2';
const EQ_ORE = 'Fe2O3 + 3 CO -> 2 Fe + 3 CO2';
const EQ_SILVER = 'AgNO3 + NaCl -> AgCl + NaNO3';

const gOf = (f, g) => g / molarMass(f);
const made = (eq, feed) => reactPlan(parseEquation(eq), feed).made;

// Stage 1 and 2: hydrogen with oxygen to spare.
const H2_DIAL = [1, 2, 3, 4];
const H2_ASKED = 5;
const waterFrom = gH2 => made(EQ_WATER, { H2: gOf('H2', gH2) }).H2O * molarMass('H2O');
const PREDICT_ASKED = 4;

// Stage 3: three nitrogen-with-hydrogen settings, and 12 mol past the dial.
const H2_MOLES = [3, 6, 9];
const H2_ASKED_MOL = 12;
const NH3_ASKED = made(EQ_AMMONIA, { H2: H2_ASKED_MOL }).NH3;

// Stage 4: chlorine with sodium to spare; 7.1 g in the trial, 21.3 g asked.
const CL2_TRIAL = 7.1;
const CL2_ASKED = 21.3;
const NACL_ASKED = made(EQ_SALT, { Cl2: gOf('Cl2', CL2_ASKED) }).NaCl * molarMass('NaCl');

// Stage 5: 12.0 g of hydrogen and 64.0 g of oxygen.
const S5 = { H2: 12.0, O2: 64.0 };
const S5_PLAN = reactPlan(parseEquation(EQ_WATER), { H2: gOf('H2', S5.H2), O2: gOf('O2', S5.O2) });
const H2_LEFT = S5_PLAN.left.H2 * molarMass('H2');

// Stage 6: limestone, 10.0 g in the syringe, 50.0 g asked, at 25 °C and 1.00 atm.
const GAS = { tC: 25, atm: 1.0 };
const LIME_TRIAL = 10.0;
const LIME_ASKED = 50.0;
const litresFrom = g => gasVolume(made(EQ_LIME, { CaCO3: gOf('CaCO3', g) }).CO2, GAS.tC, GAS.atm);
const CO2_ASKED = litresFrom(LIME_ASKED);

// Stage 7: 79.8 g of ore in a furnace that keeps 62 % of the iron.
const ORE_G = 79.8;
const FURNACE = 0.62;
const FE_POSSIBLE = made(EQ_ORE, { Fe2O3: gOf('Fe2O3', ORE_G) }).Fe * molarMass('Fe');
const FE_MADE = Math.round(FE_POSSIBLE * FURNACE * 10) / 10;
const YIELD_PCT = percentYield(FE_MADE, FE_POSSIBLE);

// Stage 8: 2.00 g of a salt sample that is 90 % sodium chloride; silver nitrate in plenty.
const SALT = { grams: 2.0, pure: 0.9 };
const AGCL_MADE = Math.round(made(EQ_SILVER, { NaCl: gOf('NaCl', SALT.grams * SALT.pure) }).AgCl * molarMass('AgCl') * 100) / 100;
const PURITY = ((AGCL_MADE / molarMass('AgCl')) * molarMass('NaCl') / SALT.grams) * 100;

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

/** The runs a pot has done on this table, as `{fed: moles, out: moles of the product it keeps}`. */
function runsOf(t, fid) {
  return t.recorder.rows.filter(r => r.label.startsWith(`${fid}|`)).map(r => ({ fed: r.x, out: r.y }));
}

const typedValue = (t, id) => entryNumber(t, id);
const within = (v, want, tol) => Math.abs(v - want) <= tol;

/** The catch jar's weight on the balance, or null when nothing has been weighed. */
const weighed = (t, fid) => { const r = weighRead(t, fid); return r.item ? r.grams : null; };

const GUESS = { g2: '2.0 g', g4: '4.0 g', g18: '18 g', g36: '36 g', g72: '72 g' };
const GUESS_VALUE = { g2: 2.0, g4: 4.0, g18: 18, g36: 36, g72: 72 };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Water From Hydrogen',
    // A PREDICT STAGE: the pot is not on the table yet. The guess is made first and comes back with the test.
    predict: true,
    prompt: 'Choose how many grams of water 4.0 g of hydrogen makes, with plenty of oxygen.',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 10 + Math.floor(i / 2) * 16 })),
      fixtures: [plaqueFixture('eq', 'Equation', { x: 116, y: 12 }, ['2 H₂ + O₂ → 2 H₂O'], { w: 50 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 116, y: 38 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the five cards and the slot.',
      'Think about what the numbers in the equation count, and what a hydrogen molecule and a water molecule each weigh.',
      'Commit to the mass of water you expect, then run the pot to see what the balance reads.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, run the pot on several amounts of hydrogen and weigh the water it makes.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 25 }, {
      eq: EQ_WATER, pour: { species: 'H2', unit: 'g', list: H2_DIAL }, pourLabel: 'Hydrogen fed', plenty: ['O2'], out: 'H2O', window: false, title: 'Pot'
    });
    const b = weighFixture('bal', { x: 112, y: 38 });
    return {
      id: 's2-grams',
      title: 'Weigh the Water',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `You guessed ${GUESS[g]}. ` : '';
        return `${guess}Type the grams of water that ${H2_ASKED.toFixed(1)} g of hydrogen makes.`;
      },
      entry: { id: 'g', label: 'Water made', unit: 'g' },
      widget,
      table: potTable({
        pieces: [jar('catch', 'Catch jar', { x: 139, y: 42 }, { catchFor: 'H2O' })],
        fixtures: [r.fixture, b.fixture, plaqueFixture('eq', 'Equation', { x: 121, y: 10 }, ['2 H₂ + O₂ → 2 H₂O'], { w: 52 })],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Use the pot, its "Hydrogen fed" dial, the catch jar and the balance.',
        'Compare the grams of hydrogen fed with the grams of water the balance reads, at each setting of the dial.',
        'Each extra gram of hydrogen makes the same extra mass of water, so the readings grow in step.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'g');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the mass of water in grams.' };
        if (within(v, waterFrom(H2_ASKED), 0.6)) return { ok: true };
        const runs = runsOf(t, 'pot');
        if (!runs.length) return { ok: false, msg: 'The pot has not been run yet.' };
        const rows = runs.map(x => `${fixed(x.fed * molarMass('H2'), 1)} g of hydrogen made ${fixed(x.out * molarMass('H2O'), 1)} g`).join(', ');
        return { ok: false, msg: `${fixed(v, 1)} g does not carry on from what the pot made: ${rows}.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS_VALUE[g] != null
          ? (GUESS_VALUE[g] === waterFrom(PREDICT_ASKED) ? 'The balance agreed with your guess. ' : 'The balance did not agree with your guess, which is how a guess gets better. ')
          : '';
        return {
          log: '4.0 g of hydrogen made 36 g of water.',
          title: 'Grams Follow the Amount Fed',
          body: `${verdict}The water made grows in step with the hydrogen fed, 9 g for every gram. The 2 and the 2 in the equation count molecules, and a water molecule weighs nine times a hydrogen molecule.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 29 }, {
      eq: EQ_AMMONIA, pour: { species: 'H2', unit: 'mol', list: H2_MOLES }, pourLabel: 'Hydrogen fed', plenty: ['N2'], unitMol: 1, window: true, title: 'Pot'
    });
    return {
      id: 's3-moles',
      title: 'Ammonia by the Mole',
      prompt: `Type the moles of ammonia that ${H2_ASKED_MOL} mol of hydrogen makes.`,
      entry: { id: 'mol', label: 'Ammonia made', unit: 'mol' },
      widget,
      table: potTable({
        fixtures: [r.fixture, plaqueFixture('eq', 'Equation', { x: 121, y: 12 }, ['N₂ + 3 H₂ → 2 NH₃'], { w: 52 })],
        zones: { slots: [] }
      }),
      hints: [
        'Use the pot, its "Hydrogen fed" dial and the "Run" key.',
        'Compare the discs of hydrogen before the reaction with the discs of ammonia after it, at each setting.',
        'Every 3 mol of hydrogen makes the same number of moles of ammonia, so scale that up to the amount asked.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'mol');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the moles of ammonia.' };
        if (within(v, NH3_ASKED, 0.05)) return { ok: true };
        const runs = runsOf(t, 'pot');
        if (!runs.length) return { ok: false, msg: 'The pot has not been run yet.' };
        const rows = runs.map(x => `${fixed(x.fed, 0)} mol of hydrogen made ${fixed(x.out, 0)} mol of ammonia`).join(', ');
        return { ok: false, msg: `${fixed(v, 1)} mol does not carry on from what the pot made: ${rows}.` };
      },
      reward: {
        log: '12 mol of hydrogen makes 8 mol of ammonia.',
        title: 'The Mole Ratio',
        body: 'The coefficients of a balanced equation give the mole ratio: 3 mol of hydrogen to 2 mol of ammonia. An equation counts moles, so every step between substances goes through the mole ratio.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_SALT, seats: 1, plenty: ['Na'], out: 'NaCl', window: false, title: 'Pot' });
    const b = weighFixture('bal', { x: 112, y: 40 });
    return {
      id: 's4-gramsgrams',
      title: 'Grams to Grams',
      prompt: `Type the grams of salt that ${CL2_ASKED.toFixed(1)} g of chlorine makes.`,
      entry: { id: 'g', label: 'Salt made', unit: 'g' },
      widget,
      table: potTable({
        pieces: [
          jar('cl2', 'Chlorine', { x: 14, y: 55 }, { species: 'Cl2', grams: CL2_TRIAL, shown: `${CL2_TRIAL.toFixed(1)} g` }),
          jar('catch', 'Catch jar', { x: 38, y: 55 }, { catchFor: 'NaCl' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('eq', 'Equation and listed masses', { x: 121, y: 11 }, ['2 Na + Cl₂ → 2 NaCl', 'Na 23.0 g/mol', 'Cl₂ 71.0 · NaCl 58.5 g/mol'], { w: 56 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Use the pot, the chlorine jar, the catch jar and the balance.',
        'Compare the grams of chlorine fed with the grams of salt the balance reads.',
        'Change the grams of chlorine to moles, use the ratio in the equation, then change the moles of salt to grams.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'g');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the mass of salt in grams.' };
        if (within(v, NACL_ASKED, 0.6)) return { ok: true };
        const w = weighed(t, 'bal');
        const trial = w != null && w > 0 ? ` The pot made ${fixed(w, 1)} g of salt from ${CL2_TRIAL.toFixed(1)} g of chlorine.` : ' Run the pot and weigh the catch jar.';
        return { ok: false, msg: `${fixed(v, 1)} g does not follow from the trial.${trial}` };
      },
      reward: {
        log: '21.3 g of chlorine makes 35.1 g of salt.',
        title: 'Theoretical Yield',
        body: 'Grams of one substance become grams of another through moles: 21.3 g of chlorine is 0.30 mol, the equation makes 0.60 mol of salt from it, and that weighs 35.1 g. The most the equation allows is the theoretical yield.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_WATER, seats: 2, out: 'H2O', window: false, title: 'Pot' });
    const b = weighFixture('bal', { x: 112, y: 40 });
    return {
      id: 's5-excess',
      title: 'What Is Left Over',
      prompt: 'Type the grams of hydrogen left over once the pot has made all the water it can.',
      entry: { id: 'g', label: 'Hydrogen left', unit: 'g' },
      widget,
      table: potTable({
        pieces: [
          jar('h2', 'Hydrogen', { x: 14, y: 55 }, { species: 'H2', grams: S5.H2, shown: `${S5.H2.toFixed(1)} g` }),
          jar('o2', 'Oxygen', { x: 36, y: 55 }, { species: 'O2', grams: S5.O2, shown: `${S5.O2.toFixed(1)} g` }),
          jar('catch', 'Catch jar', { x: 58, y: 55 }, { catchFor: 'H2O' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('eq', 'Equation and listed masses', { x: 121, y: 11 }, ['2 H₂ + O₂ → 2 H₂O', 'H₂ 2.0 g/mol', 'O₂ 32.0 g/mol'], { w: 52 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Use the pot, both jars, the catch jar and the balance.',
        'Compare the grams fed with the grams of water the balance reads.',
        'Change both feeds to moles and see which reactant the equation runs out of first; the other has the rest left.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'g');
        if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Type the mass of hydrogen in grams.' };
        if (within(v, H2_LEFT, 0.06)) return { ok: true };
        const w = weighed(t, 'bal');
        const trial = w != null && w > 0 ? ` The pot made ${fixed(w, 1)} g of water from ${S5.H2.toFixed(1)} g of hydrogen and ${S5.O2.toFixed(1)} g of oxygen.` : ' Run the pot and weigh the catch jar.';
        return { ok: false, msg: `${fixed(v, 1)} g of hydrogen left does not match the table.${trial}` };
      },
      reward: {
        log: 'Oxygen ran out; 4.0 g of hydrogen was left.',
        title: 'Excess Reactant',
        body: 'The oxygen ran out first and set how much water could form. The hydrogen was the excess reactant: 6.0 mol was fed, 4.0 mol was used, and the 2.0 mol left over weighs 4.0 g.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 29 }, {
      eq: EQ_LIME, seats: 1, gas: { species: 'CO2', ...GAS, maxL: 3 }, window: false, title: 'Pot', runLabel: 'Heat'
    });
    return {
      id: 's6-gas',
      title: 'Gas From Limestone',
      prompt: `Type the litres of carbon dioxide that ${LIME_ASKED.toFixed(1)} g of limestone gives at 25 °C and 1.00 atm.`,
      entry: { id: 'L', label: 'Gas volume', unit: 'L' },
      widget,
      table: potTable({
        pieces: [jar('lime', 'Limestone', { x: 121, y: 40 }, { species: 'CaCO3', grams: LIME_TRIAL, shown: `${LIME_TRIAL.toFixed(1)} g` })],
        fixtures: [
          r.fixture,
          plaqueFixture('eq', 'Equation and constants', { x: 121, y: 12 }, ['CaCO₃ → CaO + CO₂', 'CaCO₃ 100.1 g/mol', 'R = 0.0821 L·atm/(mol·K)'], { w: 56 })
        ],
        zones: { slots: [...r.slots] }
      }),
      hints: [
        'Use the pot, the limestone jar and the "Heat" key.',
        'Compare the grams of limestone heated with the litres the syringe reads.',
        'The equation gives the moles of gas, and the gas law turns those moles into litres at the stated conditions.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'L');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the volume in litres.' };
        if (within(v, CO2_ASKED, 0.2)) return { ok: true };
        const runs = runsOf(t, 'pot');
        if (!runs.length) return { ok: false, msg: 'The pot has not been heated yet.' };
        return { ok: false, msg: `${fixed(v, 1)} L does not follow from the syringe, which read ${fixed(litresFrom(LIME_TRIAL), 2)} L for ${LIME_TRIAL.toFixed(1)} g.` };
      },
      reward: {
        log: '50.0 g of limestone gives 12.2 L of carbon dioxide.',
        title: 'Gas Volume From Moles',
        body: 'The equation gives 1 mol of carbon dioxide for each mole of limestone, 0.50 mol from 50.0 g. Then PV = nRT turns moles of gas into litres: 0.50 mol at 25 °C and 1.00 atm fills 12.2 L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_ORE, seats: 1, plenty: ['CO'], out: 'Fe', yieldFrac: FURNACE, window: false, title: 'Furnace' });
    const b = weighFixture('bal', { x: 112, y: 40 });
    return {
      id: 's7-yield',
      title: 'What the Furnace Keeps',
      prompt: 'Type the percent of the iron the equation allows that the furnace actually made.',
      entry: { id: 'pct', label: 'Percent made', unit: '%' },
      widget,
      table: potTable({
        pieces: [
          jar('ore', 'Iron ore', { x: 14, y: 55 }, { species: 'Fe2O3', grams: ORE_G, shown: `${ORE_G.toFixed(1)} g` }),
          jar('catch', 'Catch jar', { x: 38, y: 55 }, { catchFor: 'Fe' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('eq', 'Equation and listed masses', { x: 121, y: 11 }, ['Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂', 'Fe₂O₃ 159.6 g/mol', 'Fe 55.8 g/mol'], { w: 56 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Use the furnace, the ore jar, the catch jar and the balance.',
        'Compare the iron on the balance with the iron the equation allows from this much ore.',
        'Work out the theoretical yield, then divide the iron actually made by it and multiply by 100.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'pct');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the percent.' };
        if (within(v, YIELD_PCT, 1)) return { ok: true };
        const w = weighed(t, 'bal');
        const trial = w != null && w > 0 ? ` The balance read ${fixed(w, 1)} g of iron.` : ' Run the furnace and weigh the catch jar.';
        return { ok: false, msg: `${fixed(v, 1)} % does not follow from the table.${trial}` };
      },
      reward: {
        log: '34.6 g of the 55.8 g possible: 62 %.',
        title: 'Percent Yield',
        body: 'Percent yield is the mass actually made divided by the theoretical yield, times 100. Here 34.6 g of the 55.8 g the equation allows is 62 %; real reactions leave some product behind.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_SILVER, seats: 1, plenty: ['AgNO3'], out: 'AgCl', window: false, title: 'Pot', runLabel: 'Mix and Dry' });
    const b = weighFixture('bal', { x: 112, y: 40 }, { digits: 2 });
    return {
      id: 's8-gravimetric',
      title: 'Weigh the Cloud',
      prompt: 'Type the percent of the sealed sample that is sodium chloride.',
      entry: { id: 'pct', label: 'Percent salt', unit: '%' },
      widget,
      table: potTable({
        pieces: [
          jar('sample', 'Salt sample', { x: 14, y: 55 }, { species: 'NaCl', grams: SALT.grams, pure: SALT.pure, shown: `${SALT.grams.toFixed(2)} g` }),
          jar('catch', 'Catch jar', { x: 38, y: 55 }, { catchFor: 'AgCl' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('eq', 'Equation and listed masses', { x: 121, y: 11 }, ['AgNO₃ + NaCl → AgCl + NaNO₃', 'AgCl 143.4 g/mol', 'NaCl 58.5 g/mol'], { w: 56 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Use the pot, the sample jar, the catch jar and the balance.',
        'Compare the dried solid on the balance with the 2.00 g the sample weighed.',
        'Every mole of silver chloride came from a mole of sodium chloride, so work back from the solid to the salt.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'pct');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the percent.' };
        if (within(v, PURITY, 1.5)) return { ok: true };
        const w = weighed(t, 'bal');
        const trial = w != null && w > 0 ? ` The dried solid weighed ${fixed(w, 2)} g.` : ' Run the pot and weigh the catch jar.';
        return { ok: false, msg: `${fixed(v, 1)} % does not follow from the table.${trial}` };
      },
      reward: {
        log: '4.41 g of silver chloride: the sample is 90 % salt.',
        title: 'Gravimetric Analysis',
        body: 'In gravimetric analysis a substance is turned into a solid, dried and weighed, and the mass is worked back to how much of it was in the sample. The 4.41 g of solid held 0.0308 mol of chloride, so 90 % of the sample was salt.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Drag the catch jar under the pot, run it, then weigh the jar.'],
  3: ['Turn the dial, press Run, then type your answer.'],
  4: ['Seat the jars, run the pot, weigh the catch jar.'],
  5: ['Seat the jars, run the pot, weigh the catch jar.'],
  6: ['Drag the jar into the pot, press Heat, then type your answer.'],
  7: ['Seat the jar, run the furnace, weigh the catch jar.'],
  8: ['Seat the jars, run the pot, weigh the catch jar.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'An equation counts moles, so grams reach grams through the mole ratio. The reactant that runs out sets the theoretical yield, and a real furnace makes a percent of it. Forty tons of ore cannot give fifty tons of iron.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const run = id => ({ run: id });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });

export const SOLUTIONS = [
  [put('g36', 'slot:guess')],
  [put('catch', 'slot:pot.out'), dial('pot', 'pour', 4), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '45')],
  [dial('pot', 'pour', 3), run('pot'), typed('mol', '8')],
  [put('cl2', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '35.1')],
  [put('h2', 'slot:pot.in1'), put('o2', 'slot:pot.in2'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '4.0')],
  [put('lime', 'slot:pot.in1'), run('pot'), typed('L', '12.2')],
  [put('ore', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('pct', '62')],
  [put('sample', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('pct', '90')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('catch', 'slot:pot.out'), dial('pot', 'pour', 2), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '10')],
  [dial('pot', 'pour', 3), run('pot'), typed('mol', '18')],
  [put('cl2', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '17.55')],
  [put('h2', 'slot:pot.in1'), put('o2', 'slot:pot.in2'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '0')],
  [put('lime', 'slot:pot.in1'), run('pot'), typed('L', '22.4')],
  [put('ore', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('pct', '100')],
  [put('sample', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('pct', '54.6')]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor, room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = {
  EQ_WATER, EQ_AMMONIA, EQ_SALT, EQ_LIME, EQ_ORE, EQ_SILVER, H2_DIAL, H2_ASKED, PREDICT_ASKED, H2_MOLES, H2_ASKED_MOL, CL2_TRIAL, CL2_ASKED, S5, GAS,
  LIME_TRIAL, LIME_ASKED, ORE_G, FURNACE, SALT, answers: { water: waterFrom(H2_ASKED), nh3: NH3_ASKED, nacl: NACL_ASKED, h2Left: H2_LEFT, co2: CO2_ASKED, feMade: FE_MADE, feAllowed: FE_POSSIBLE, yieldPct: YIELD_PCT, agcl: AGCL_MADE, purity: PURITY }
};
export { reactorRead, seatedIn };
