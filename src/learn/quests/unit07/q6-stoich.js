/**
 * Unit 7 · Bench 6 — Stoichiometry (q6-stoich)
 *
 * The blast-furnace charge floor, on the pot kit (`table/kits/pot.js`) and the heap kit (`table/kits/heap.js` for stage 5):
 * a reaction vessel fed from jars (or a dial), a catch jar the vessel's key fills, a balance that reads what a jar holds,
 * and a particle view. Every amount the vessel makes is `reactdata.js` `reactPlan` of what was fed; nothing on the table is authored.
 *
 *   1  PREDICT: how many grams of water does 4.0 g of hydrogen make?
 *   2  TEST: the vessel at 1 to 4 g of hydrogen, the balance, then 5.0 g past the dial -> grams follow grams fed
 *   3  moles in, moles out: the particle view, one circle a mole; 12 mol past the dial -> mole ratio
 *   4  grams to grams, with a worked case in the briefing                              -> grams -> moles -> moles -> grams
 *   5  limiting reactant seen with countable atoms (moved from q1 stage 4)             -> limiting reactant
 *   6  two jars, the balance on what was made; type the hydrogen left                  -> excess reactant in grams
 *   7  heat limestone; the syringe at 10.0 g, then 50.0 g past it                      -> gas volume from molar volume
 *   8  the furnace makes less than the equation allows; type the percent               -> theoretical & percent yield
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { potTable, jar, reactorFixture, weighFixture, plaqueFixture, stmt, reactorRead, weighRead, seatedIn, fixed } from '../../table/kits/pot.js';
import { heapTable, heap, dock, product, limitOf, tallyOf } from '../../table/kits/heap.js';
import { molarMass, reactPlan, parseEquation, gasVolume, percentYield } from '../../engine/reactdata.js';

export const meta = { stageCount: 9 };

export const VOCABULARY = [
  { term: /\bmole ratio\b/i, introducedAt: 3 },
  { term: /\blimiting reactants?\b/i, introducedAt: 5 },
  { term: /\bexcess reactants?\b/i, introducedAt: 5 },
  { term: /\btheoretical yield\b/i, introducedAt: 8 },
  { term: /\bpercent yield\b/i, introducedAt: 8 }
];

/** Moles and molar mass are Tallow's. */
export const BUILDS_ON = ['unit01/q6-weigh'];

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

// Stage 4: chlorine with sodium to spare; 5.0 g in the trial (not a simple factor of 21.3 g), 21.3 g asked.
const CL2_TRIAL = 5.0;
const CL2_ASKED = 21.3;
const NACL_ASKED = made(EQ_SALT, { Cl2: gOf('Cl2', CL2_ASKED) }).NaCl * molarMass('NaCl');

// Stage 5: countable atoms (18 H, 11 O -> 9 H2O).
const WATER_NEED = { H: 2, O: 1 };
const atomAt = (id, el, x, y) => ({ id, kind: 'atom', label: el, at: { x, y }, props: { el } });

// Stage 6: 12.0 g of hydrogen and 64.0 g of oxygen.
const S6 = { H2: 12.0, O2: 64.0 };
const S6_PLAN = reactPlan(parseEquation(EQ_WATER), { H2: gOf('H2', S6.H2), O2: gOf('O2', S6.O2) });
const H2_LEFT = S6_PLAN.left.H2 * molarMass('H2');

// Stage 7: limestone, 7.5 g in the trial (not a simple factor of 50.0 g), 50.0 g asked, at 25 °C and 1.00 atm.
const GAS = { tC: 25, atm: 1.0 };
const LIME_TRIAL = 7.5;
const LIME_ASKED = 50.0;
const litresFrom = g => gasVolume(made(EQ_LIME, { CaCO3: gOf('CaCO3', g) }).CO2, GAS.tC, GAS.atm);
const CO2_ASKED = litresFrom(LIME_ASKED);

// Stage 8: 79.8 g of ore in a furnace that keeps 62 % of the iron.
const ORE_G = 79.8;
const FURNACE = 0.62;
const FE_POSSIBLE = made(EQ_ORE, { Fe2O3: gOf('Fe2O3', ORE_G) }).Fe * molarMass('Fe');
const FE_MADE = Math.round(FE_POSSIBLE * FURNACE * 10) / 10;
const YIELD_PCT = percentYield(FE_MADE, FE_POSSIBLE);

// Stage 9: purity from elemental analysis (impure limestone measuring 32.0 % Ca).
const SAMPLE_CA_PCT = 32.0;
const PURE_CA_PCT = (molarMass('Ca') / molarMass('CaCO3')) * 100;
const PURITY_PCT = (SAMPLE_CA_PCT / PURE_CA_PCT) * 100;

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

function runsOf(t, fid) {
  return t.recorder.rows.filter(r => r.label.startsWith(`${fid}|`)).map(r => ({ fed: r.x, out: r.y }));
}

const typedValue = (t, id) => entryNumber(t, id);
const within = (v, want, tol) => Math.abs(v - want) <= tol;
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
    predict: true,
    prompt: 'How many grams of water do you expect from 4.0 g of hydrogen with plenty of oxygen (guess now, test next)?',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 10 + Math.floor(i / 2) * 16 })),
      fixtures: [plaqueFixture('eq', 'Equation', { x: 116, y: 12 }, ['2 H₂ + O₂ → 2 H₂O'], { w: 50 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 116, y: 38 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Look at the equation: how many H₂ molecules react for each H₂O molecule made?',
      'Think about what the coefficients count, and compare the mass of a water molecule to a hydrogen molecule.',
      'Commit to the mass of water you expect, then run the vessel to see what the balance reads.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the prediction slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, run the reaction vessel on several amounts of hydrogen and weigh the water it makes.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 25 }, {
      eq: EQ_WATER, pour: { species: 'H2', unit: 'g', list: H2_DIAL }, pourLabel: 'Hydrogen fed', plenty: ['O2'], out: 'H2O', window: false, title: 'Reaction vessel'
    });
    const b = weighFixture('bal', { x: 112, y: 38 });
    return {
      id: 's2-grams',
      title: 'Weigh the Water',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `Your guess for 4.0 g was ${GUESS[g]}. Now test: ` : '';
        return `${guess}How many grams of water does ${H2_ASKED.toFixed(1)} g of hydrogen make?`;
      },
      entry: { id: 'g', label: 'Water made', unit: 'g' },
      widget,
      table: potTable({
        pieces: [jar('catch', 'Catch jar', { x: 139, y: 42 }, { catchFor: 'H2O' })],
        fixtures: [r.fixture, b.fixture, plaqueFixture('eq', 'Equation', { x: 121, y: 10 }, ['2 H₂ + O₂ → 2 H₂O'], { w: 52 })],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Look at the hydrogen fed on the dial and the grams of water read on the balance.',
        'Compare the grams of hydrogen fed with the grams of water on the balance at each dial setting.',
        'The mass of water grows steadily with the hydrogen fed in, so see how much water each gram of hydrogen makes.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'g');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the mass of water in grams.' };
        if (within(v, waterFrom(H2_ASKED), 0.6)) return { ok: true };
        const runs = runsOf(t, 'pot');
        if (!runs.length) return { ok: false, msg: 'Run the vessel first to measure a trial.' };
        const rows = runs.map(x => `${fixed(x.fed * molarMass('H2'), 1)} g of hydrogen made ${fixed(x.out * molarMass('H2O'), 1)} g`).join(', ');
        return { ok: false, msg: `${fixed(v, 1)} g does not match the pattern from your trials: ${rows}.` };
      },
      get reward() {
        return {
          log: '4.0 g of hydrogen made 36 g of water; 5.0 g makes 45 g.',
          title: 'Grams Follow the Amount Fed',
          body: 'Every gram of hydrogen made 9 g of water, so 4.0 g makes 36 g and 5.0 g makes 45 g. The amounts stay in a fixed ratio set by the equation.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 29 }, {
      eq: EQ_AMMONIA, pour: { species: 'H2', unit: 'mol', list: H2_MOLES }, pourLabel: 'Hydrogen fed', plenty: ['N2'], unitMol: 1, window: true, title: 'Reaction vessel'
    });
    return {
      id: 's3-moles',
      title: 'Ammonia by the Mole',
      briefing: {
        title: 'Counting in Moles',
        body: 'A mole is a fixed, very large number of particles. Each circle in the particle view stands for one mole.'
      },
      prompt: `With each circle standing for 1 mole (6.02 × 10²³ particles), how many moles of ammonia does ${H2_ASKED_MOL} mol of hydrogen make?`,
      entry: { id: 'mol', label: 'Ammonia made', unit: 'mol' },
      widget,
      table: potTable({
        fixtures: [r.fixture, plaqueFixture('eq', 'Equation', { x: 121, y: 12 }, ['N₂ + 3 H₂ → 2 NH₃'], { w: 52 })],
        zones: { slots: [] }
      }),
      hints: [
        'Compare the H₂ circles before the reaction with the NH₃ circles after it.',
        'Compare the circles of hydrogen before the reaction with the circles of ammonia after it, at each setting.',
        'Compare the moles of hydrogen fed with the moles of ammonia made, then scale that ratio up to 12 mol.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'mol');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the moles of ammonia.' };
        if (within(v, NH3_ASKED, 0.05)) return { ok: true };
        const runs = runsOf(t, 'pot');
        if (!runs.length) return { ok: false, msg: 'Run the vessel first to observe a trial.' };
        const rows = runs.map(x => `${fixed(x.fed, 0)} mol of hydrogen made ${fixed(x.out, 0)} mol of ammonia`).join(', ');
        return { ok: false, msg: `${fixed(v, 1)} mol does not match the pattern from your trials: ${rows}.` };
      },
      reward: {
        log: '12 mol of hydrogen makes 8 mol of ammonia.',
        title: 'The Mole Ratio',
        body: 'Every 3 mol of hydrogen made 2 mol of ammonia, matching the equation\'s coefficients. That is the mole ratio.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_SALT, seats: 1, plenty: ['Na'], out: 'NaCl', window: false, title: 'Reaction vessel' });
    const b = weighFixture('bal', { x: 112, y: 44.5 });
    return {
      id: 's4-gramsgrams',
      title: 'Grams to Grams',
      briefing: {
        title: 'Grams Go Through Moles',
        body: 'A balance measures grams, while molar mass (g/mol) gives the mass of one mole.\nConvert grams → moles with molar mass, apply the equation\'s mole ratio, then convert moles → grams.'
      },
      prompt: `How many grams of salt does ${CL2_ASKED.toFixed(1)} g of chlorine make?`,
      entry: { id: 'g', label: 'Salt made', unit: 'g' },
      widget,
      table: potTable({
        pieces: [
          jar('cl2', 'Chlorine', { x: 14, y: 55 }, { species: 'Cl2', grams: CL2_TRIAL, shown: `${CL2_TRIAL.toFixed(1)} g` }),
          jar('catch', 'Catch jar', { x: 38, y: 55 }, { catchFor: 'NaCl' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('eq', 'Equation and listed masses', { x: 121, y: 12 }, ['2 Na + Cl₂ → 2 NaCl', 'Na: 23.0 g/mol', 'Cl₂: 71.0 g/mol', 'NaCl: 58.5 g/mol'], { w: 56 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Look at the molar masses on the plaque and compare them with the 21.3 g of chlorine asked.',
        'Divide 21.3 g of Cl₂ by its molar mass (71.0 g/mol) to find moles of Cl₂.',
        'Convert Cl₂ grams → moles, double for the 1 Cl₂ : 2 NaCl ratio, then multiply by NaCl\'s molar mass (58.5 g/mol).'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'g');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the mass of salt in grams.' };
        if (within(v, NACL_ASKED, 0.6)) return { ok: true };
        const w = weighed(t, 'bal');
        const trial = w != null && w > 0 ? ` Compare the ${fixed(w, 1)} g weighed from ${CL2_TRIAL.toFixed(1)} g Cl₂ with ${CL2_ASKED.toFixed(1)} g Cl₂.` : ' Run the vessel and weigh the catch jar first.';
        return { ok: false, msg: `${fixed(v, 1)} g does not match.${trial}` };
      },
      reward: {
        log: '21.3 g of chlorine makes 35.1 g of salt.',
        title: 'Grams Through Moles',
        body: '21.3 g Cl₂ ÷ 71.0 g/mol = 0.30 mol Cl₂ → 0.60 mol NaCl × 58.5 g/mol = 35.1 g.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-limiting',
    title: 'One Reactant Runs Out',
    prompt: 'How many water molecules can the two supply trays make?',
    widget,
    table: heapTable({
      pieces: [
        ...['h1', 'h2', 'h3'].map((id, i) => atomAt(id, 'H', 10 + i * 12, 33)),
        ...['o1', 'o2'].map((id, i) => atomAt(id, 'O', 48 + i * 12, 33))
      ],
      zones: {
        containers: [
          heap('heap-h', 'Hydrogen supply', 'H', 18, { x: 17, y: 17 }),
          heap('heap-o', 'Oxygen supply', 'O', 11, { x: 49, y: 17 }),
          product('made', 'Built', { x: 92, y: 18 }, 24),
          dock('dock', 'Molecule to copy', { x: 17, y: 53 }, { w: 28, h: 16 })
        ]
      },
      fixtures: [
        {
          id: 'maker', kind: 'maker', label: 'Maker', runLabel: 'Make Molecule', at: { x: 54, y: 52 }, size: { w: 34, h: 18 },
          props: { dock: 'container:dock', heaps: { H: 'heap-h', O: 'heap-o' }, product: 'made' }
        },
        { id: 'tally', kind: 'tally', label: 'Tally', at: { x: 96, y: 52 }, size: { w: 38, h: 18 }, noRun: true, dials: { n: { min: 0, max: 12, step: 1, value: 0, label: 'Molecules made' } }, props: { tickLabels: true, dialIndent: 5.5, grab: { n: 3.4 } } }
      ]
    }),
    hints: [
      'Watch the counts on the Hydrogen and Oxygen supply trays as you build water molecules.',
      'Check which supply tray empties first and how many atoms remain in the other.',
      'Keep pressing until one supply cannot make another molecule, then set the tally to how many molecules were built.'
    ],
    check(state) {
      const t = state.table;
      const left = { H: t.zones.containers['heap-h'].capacity, O: t.zones.containers['heap-o'].capacity };
      const want = limitOf(left, WATER_NEED);
      const tally = tallyOf(t, 'tally');
      if (tally === 0) return { ok: false, notYet: true, msg: 'Set the tally dial to the number of molecules built.' };
      if (tally !== want.made) return { ok: false, msg: 'That count does not match what the supplies can make. Keep building until one supply runs out, then count.' };
      return { ok: true };
    },
    reward: {
      log: 'The hydrogen supply ran out at 9 water molecules.',
      title: 'The Limiting Reactant',
      body: 'Hydrogen ran out first and stopped the reaction. The reactant that runs out first is the limiting reactant; what is left of the other is the excess reactant.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_WATER, seats: 2, out: 'H2O', window: false, title: 'Reaction vessel' });
    const b = weighFixture('bal', { x: 112, y: 40 });
    return {
      id: 's6-excess',
      title: 'What Is Left Over',
      briefing: {
        title: 'Limiting Reactant in Grams',
        body: 'When both starting masses are in grams, convert each to moles first to see which reactant runs out, then convert any leftover moles back to grams.'
      },
      prompt: 'How many grams of hydrogen are left over when the vessel has made all the water it can?',
      entry: { id: 'g', label: 'Hydrogen left', unit: 'g' },
      widget,
      table: potTable({
        pieces: [
          jar('h2', 'Hydrogen', { x: 14, y: 55 }, { species: 'H2', grams: S6.H2, shown: `${S6.H2.toFixed(1)} g` }),
          jar('o2', 'Oxygen', { x: 36, y: 55 }, { species: 'O2', grams: S6.O2, shown: `${S6.O2.toFixed(1)} g` }),
          jar('catch', 'Catch jar', { x: 58, y: 55 }, { catchFor: 'H2O' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('eq', 'Equation and listed masses', { x: 121, y: 11 }, ['2 H₂ + O₂ → 2 H₂O', 'H₂: 2.0 g/mol', 'O₂: 32.0 g/mol'], { w: 52 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      hints: [
        'Compare the starting masses of H₂ and O₂ using their molar masses on the plaque.',
        'Convert both 12.0 g H₂ and 64.0 g O₂ to moles, then check which one runs out first.',
        'Use the 2 H₂ : 1 O₂ mole ratio to find how many moles of H₂ react with the O₂, then convert leftover H₂ moles to grams.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'g');
        if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Type the mass of hydrogen in grams.' };
        if (within(v, H2_LEFT, 0.06)) return { ok: true };
        return { ok: false, msg: `${fixed(v, 1)} g does not match what is left over from 12.0 g H₂ and 64.0 g O₂.` };
      },
      reward: {
        log: 'Oxygen ran out; 4.0 g of hydrogen was left.',
        title: 'Excess in Grams',
        body: 'Oxygen was the limiting reactant. 4.0 mol of the 6.0 mol of hydrogen reacted, leaving 2.0 mol (4.0 g).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 29 }, {
      eq: EQ_LIME, seats: 1, gas: { species: 'CO2', ...GAS, maxL: 3 }, window: false, title: 'Reaction vessel', runLabel: 'Heat'
    });
    return {
      id: 's7-gas',
      title: 'Gas From Limestone',
      prompt: `How many litres of carbon dioxide does ${LIME_ASKED.toFixed(1)} g of limestone give at room temperature (25 °C) and normal air pressure (1.00 atm)?`,
      entry: { id: 'L', label: 'Gas volume', unit: 'L' },
      widget,
      table: potTable({
        pieces: [jar('lime', 'Limestone', { x: 121, y: 40 }, { species: 'CaCO3', grams: LIME_TRIAL, shown: `${LIME_TRIAL.toFixed(1)} g` })],
        fixtures: [
          r.fixture,
          plaqueFixture('eq', 'Equation and molar volume', { x: 121, y: 12 }, ['CaCO₃ → CaO + CO₂', 'CaCO₃: 100.1 g/mol', 'Room temp (25 °C), normal pressure (1.00 atm): 1 mol gas = 24.5 L'], { w: 58 })
        ],
        zones: { slots: [...r.slots] }
      }),
      hints: [
        'Look at the molar mass of CaCO₃ and the volume of 1 mol of gas on the plaque.',
        'Compare the moles in 50.0 g of CaCO₃ with the 1:1 ratio to CO₂ in the equation.',
        'Find the moles of carbon dioxide from the equation, then multiply by 24.5 L/mol.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'L');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the volume in litres.' };
        if (within(v, CO2_ASKED, 0.2)) return { ok: true };
        const runs = runsOf(t, 'pot');
        if (!runs.length) return { ok: false, msg: 'Heat the limestone in the vessel first.' };
        return { ok: false, msg: `The gas volume for ${LIME_ASKED.toFixed(1)} g of limestone is not ${fixed(v, 1)} L; compare with the ${LIME_TRIAL.toFixed(1)} g trial.` };
      },
      reward: {
        log: '50.0 g of limestone gives 12.2 L of carbon dioxide.',
        title: 'Gas Volume From Moles',
        body: '50.0 g of limestone is 0.50 mol and gives 0.50 mol of carbon dioxide, which fills 12.2 L.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_ORE, seats: 1, plenty: ['CO'], out: 'Fe', yieldFrac: FURNACE, window: false, title: 'Furnace' });
    const b = weighFixture('bal', { x: 112, y: 40 });
    return {
      id: 's8-yield',
      title: 'What the Furnace Keeps',
      briefing: {
        title: 'Theoretical and Percent Yield',
        body: 'The most product a balanced equation allows is the theoretical yield. Percent yield compares what you actually made to that theoretical yield.\n\n(3.0 g actual ÷ 4.0 g theoretical) × 100% = 75%'
      },
      prompt: 'What is the percent yield of iron from this furnace?',
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
        'Compare the actual iron on the balance with the theoretical iron the equation allows from 79.8 g of ore.',
        'Find how many moles of Fe₂O₃ are in 79.8 g, then how many grams of Fe the equation allows.',
        'Divide the actual iron weighed on the balance by the theoretical yield, then multiply by 100.'
      ],
      check(state) {
        const t = state.table;
        const v = typedValue(t, 'pct');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the percent.' };
        if (within(v, YIELD_PCT, 1)) return { ok: true };
        const w = weighed(t, 'bal');
        const trial = w != null && w > 0 ? ` ${fixed(w, 1)} g is the mass of iron the furnace made — compare it to the maximum iron allowed from ${ORE_G.toFixed(1)} g of ore.` : ' Run the furnace and weigh the catch jar.';
        return { ok: false, msg: `${fixed(v, 1)}% is not the percent yield.${trial}` };
      },
      reward: {
        log: '34.6 g of the 55.8 g possible: 62%.',
        title: 'Percent Yield',
        body: 'The equation allows 55.8 g (the theoretical yield), but real furnaces lose some material or react incompletely; 34.6 g is a 62% yield.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 9 */
  (() => {
    return {
      id: 's9-purity',
      title: 'Purity From Elemental Mass',
      briefing: {
        title: 'Sample Purity',
        body: 'A pure compound always has the same mass percent of each element. Impurities that contain no calcium dilute that percentage in proportion to how much pure compound is present.'
      },
      prompt: 'If lab analysis measures 32.0% calcium in impure limestone, what percent of the sample is pure CaCO₃?',
      entry: { id: 'pct', label: 'Sample purity', unit: '%' },
      widget,
      table: potTable({
        pieces: [],
        fixtures: [
          plaqueFixture('eq', 'Elemental analysis and molar masses', { x: 88, y: 18 }, [
            'Sample: 32.0% Ca (impurities have no Ca)',
            'CaCO₃: 100.09 g/mol',
            'Ca: 40.08 g/mol'
          ], { w: 68 })
        ],
        zones: { slots: [] }
      }),
      hints: [
        'Look at the molar masses of Ca and CaCO₃ on the plaque.',
        'Find what percent of pure CaCO₃ is calcium by dividing Ca\'s molar mass (40.08) by CaCO₃\'s molar mass (100.09).',
        'Pure CaCO₃ is 40.04% calcium, while this sample measures 32.0% calcium — divide measured % by pure % to find purity.'
      ],
      check(state) {
        const v = typedValue(state.table, 'pct');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the percent.' };
        if (within(v, PURITY_PCT, 1)) return { ok: true };
        return { ok: false, msg: `${fixed(v, 1)}% is not the purity. 32.0% is the calcium percent of the sample — compare it to the calcium percent of pure CaCO₃.` };
      },
      reward: {
        log: '32.0% Ca vs 40.04% Ca in pure CaCO₃ gives 79.9% purity.',
        title: 'Elemental Purity',
        body: 'Pure CaCO₃ is 40.04% calcium, so a sample measuring 32.0% calcium is 79.9% pure CaCO₃.'
      }
    };
  })()
];


/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A balanced equation works in moles, so convert grams to moles to use the mole ratio. The limiting reactant sets the theoretical yield, and percent yield measures how much of it the furnace actually makes.'
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
const joinTo = (a, b) => ({ join: [a, b] });
const makes = n => Array.from({ length: n }, () => ({ run: 'maker' }));

export const SOLUTIONS = [
  [put('g36', 'slot:guess')],
  [put('catch', 'slot:pot.out'), dial('pot', 'pour', 4), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '45')],
  [dial('pot', 'pour', 3), run('pot'), typed('mol', '8')],
  [put('cl2', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '35.1')],
  [joinTo('h1', 'o1'), joinTo('h2', 'o1'), put('o1', 'container:dock'), ...makes(9), dial('tally', 'n', 9)],
  [put('h2', 'slot:pot.in1'), put('o2', 'slot:pot.in2'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '4.0')],
  [put('lime', 'slot:pot.in1'), run('pot'), typed('L', '12.2')],
  [put('ore', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('pct', '62')],
  [typed('pct', '79.9')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('catch', 'slot:pot.out'), dial('pot', 'pour', 2), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '10')],
  [dial('pot', 'pour', 3), run('pot'), typed('mol', '18')],
  [put('cl2', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '17.55')],
  [joinTo('h1', 'o1'), joinTo('h2', 'o1'), put('o1', 'container:dock'), ...makes(9), dial('tally', 'n', 11)],
  [put('h2', 'slot:pot.in1'), put('o2', 'slot:pot.in2'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('g', '0')],
  [put('lime', 'slot:pot.in1'), run('pot'), typed('L', '22.4')],
  [put('ore', 'slot:pot.in1'), put('catch', 'slot:pot.out'), run('pot'), put('catch', 'slot:bal.pan'), typed('pct', '100')],
  [typed('pct', '32')]
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
  EQ_WATER, EQ_AMMONIA, EQ_SALT, EQ_LIME, EQ_ORE, H2_DIAL, H2_ASKED, PREDICT_ASKED, H2_MOLES, H2_ASKED_MOL, CL2_TRIAL, CL2_ASKED, S6, GAS,
  LIME_TRIAL, LIME_ASKED, ORE_G, FURNACE, PURITY_PCT, answers: { water: waterFrom(H2_ASKED), nh3: NH3_ASKED, nacl: NACL_ASKED, h2Left: H2_LEFT, co2: CO2_ASKED, feMade: FE_MADE, feAllowed: FE_POSSIBLE, yieldPct: YIELD_PCT, purityPct: PURITY_PCT }
};
export { reactorRead, seatedIn };
