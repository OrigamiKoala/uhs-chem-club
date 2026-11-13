/**
 * Unit 5 · Bench 3 — Enthalpy of Reaction (q3-enthalpy)
 *
 * The habitat's boiler room, on the heat kit (`table/kits/heat.js`). The same lidded cup, now read from the chemicals' side of the line: the
 * heat a bath gains is the heat the reaction lost, counted per mole, and that figure decides which fuel a skiff should carry. Five stages
 * and ONE click: the belief that the fuel with the biggest number printed on it is the best fuel.
 *
 *   1  a powder in a bath: the energy chart per mole           -> enthalpy change, ΔH
 *   2  the same powder at 0.05, 0.10 and 0.20 mol, then 0.30 mol past the dial   -> heat is proportional to the moles (q = n × ΔH)
 *   3  PREDICT: which of four fuels gives the most heat per gram of tank?
 *   4  TEST: ten grams of each in a 5 kg tank, ranked by how far each warms it   -> energy per gram
 *   5  a ΔH printed beside an equation, and 6.0 g of hydrogen              -> ΔH is for the amounts the equation writes
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction's cards print each fuel's heat per MOLE, and methane's is the biggest. The tank ranks the
 * tins by heat per GRAM, and the lightest molecule wins. A tin that has been in the tank keeps how far it warmed it, so four readings can
 * be compared on the rail.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { heatTable, charge, note, cupFixture, shelvesFixture, plaqueFixture, markerFixture, leadFixture, rxnFixture, markerRead, cupRead, shelvesRead, fixed, FUELS, SPECIFIC_HEAT_WATER } from '../../table/kits/heat.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\benthalpy\b/i, introducedAt: 1 }
];

/** Moles and molar mass are Tallow's; heat in a bath is this world's first two benches. */
export const BUILDS_ON = ['unit01/q6-weigh', 'unit05/q2-calorimetry'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const MOUTH = 'slot:cup.mouth';

const QUEST_KEY = 'unit05/q3-enthalpy';
const GUESS_LABEL = { hydrogen: 'hydrogen', methane: 'methane', methanol: 'methanol', carbon: 'carbon' };

// Stage 1: 0.05 mol of a powder gives 8 kJ to a 200 g bath: 160 kJ for every mole.
const POWDER = { moles: 0.05, dH: -160 };
const AFTER = [-320, -160, 0, 160, 320];
// Stage 2: the same powder at three amounts on the dial, and 0.30 mol beyond it (48 kJ).
const SCALE_MOLES = [0.05, 0.1, 0.2];
const ASKED_MOLES = 0.3;
const Q_ASKED = ASKED_MOLES * -POWDER.dH;
// Stage 4: 2 H2 + O2 -> 2 H2O, ΔH = -572 kJ as written; 6.0 g of hydrogen is 3.0 mol, so 1.5 times the reaction as written.
const EQN_DH = -572;
const H2_GRAMS = 6;
const REACTIONS_RUN = H2_GRAMS / 2.0 / 2;
const Q_EQN = REACTIONS_RUN * -EQN_DH;

// Stage 3: 0.25 mol of the powder in a 400 g bath at 20 degrees: a rise of 23.9 degrees.
const FINAL_MOLES = [0.05, 0.1];
const FINAL_BATH = 400;
const FINAL_T0 = 20;
const FINAL_ASKED = 0.25;
const T_FINAL = FINAL_T0 + (FINAL_ASKED * -POWDER.dH * 1000) / (FINAL_BATH * SPECIFIC_HEAT_WATER);
// Stage 6: ten grams of each fuel into a 5000 g tank.
const GRAMS = 10;
const TANK = 5000;
const FUEL_IDS = ['hydrogen', 'methane', 'methanol', 'carbon'];
const molesOf = id => GRAMS / FUELS[id].molarMass;
const riseOf = id => (molesOf(id) * -FUELS[id].dHc * 1000) / (TANK * SPECIFIC_HEAT_WATER);
/** The fuels from the least heat per gram to the most. */
const BY_GRAM = [...FUEL_IDS].sort((a, b) => riseOf(a) - riseOf(b));

/** A fuel's card in the prediction: its heat per mole (the number that looks like the answer) and what a mole weighs. */
const perMole = id => `${FUELS[id].name[0].toUpperCase()}${FUELS[id].name.slice(1)}: ${Math.round(-FUELS[id].dHc)} kJ from one mole; one mole is ${Math.round(FUELS[id].molarMass)} g`;

/* ------------------------------------------------------------------
   THE SIX STAGES (limiting reactant and activation energy left this bench on 2026-11-11: `archive/2026-11-11/ember/`)
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 200 g', water: 200, T0: 20, showHeat: true });
    return {
      id: 's1-chart',
      title: 'Heat for Each Mole',
      briefing: { speaker: SPEAKER, body: 'A mole (mol) is a fixed number of particles, about 6.02 × 10²³ of them. The enthalpy change of a reaction, ΔH, is the heat it gives out or takes in for each mole that reacts, and it is negative when heat is given out.' },
      prompt: 'What is the enthalpy change, ΔH, when one mole of the powder dissolves?',
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, POWDER)],
        fixtures: [
          c.fixture,
          shelvesFixture('chart', { x: 120, y: 30 }, {
            reactants: 'Powder before', products: 'Powder after', dH: 0, scale: 320, hideValue: true, hideVerdict: true, title: 'Energy diagram',
            build: { afterList: AFTER, labels: ['−320 kJ/mol', '−160 kJ/mol', 'Level', '+160 kJ/mol', '+320 kJ/mol'], label: 'ΔH' }
          })
        ],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Drop the powder in the cup, then read the HEAT the bath took in and the moles printed on the powder.',
        'That heat came from only 0.05 mol, so compare it with what one whole mole would give.',
        'ΔH is the heat for one whole mole in kilojoules (1 kJ = 1,000 J), with a minus sign when the bath warmed.'
      ],
      check(state) {
        const t = state.table;
        const r = shelvesRead(t, 'chart');
        if (r.dH === 0) return { ok: false, notYet: true, msg: 'The two levels of the diagram are equal: turn the "ΔH" dial.' };
        if (r.dH === POWDER.dH) return { ok: true };
        const rise = t.pieces.powder.props.rise;
        if (rise == null) return { ok: false, msg: 'The powder has not been in the cup yet.' };
        const bath = `the bath ${rise > 0 ? 'warmed' : 'cooled'} ${fixed(Math.abs(rise), 1)} °C`;
        // A chart on the wrong side says only that; a chart on the right side with the wrong size says what it shows.
        if (Math.sign(r.dH) !== Math.sign(POWDER.dH)) return { ok: false, msg: `The diagram ${r.dH > 0 ? 'climbs' : 'drops'}, and ${bath}.` };
        return { ok: false, msg: `The diagram drops ${Math.abs(r.dH)} kJ per mole, and ${bath} from ${POWDER.moles} mol.` };
      },
      reward: {
        log: 'The level dropped 160 kJ per mole.',
        title: 'Enthalpy Change',
        body: 'The bath took in 8,000 J from 0.05 mol of powder, which is 160 kJ for each mole. Heat was given out, so ΔH = −160 kJ/mol and the level after dissolving is the lower one on the energy diagram.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 200 g', water: 200, T0: 20, showHeat: true, molesList: SCALE_MOLES });
    return {
      id: 's2-scale',
      title: 'More Powder, More Heat',
      prompt: 'How much heat does 0.30 mol of the powder give out?',
      entry: { id: 'kj', label: 'Heat given out', unit: 'kJ' },
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, POWDER)],
        fixtures: [
          c.fixture,
        ],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Drop the powder in the cup, then turn the "Moles reacted" dial and read the HEAT.',
        'Compare the heat the bath takes in at 0.05 mol, 0.1 mol and 0.2 mol.',
        'The heat grows in step with the moles, so carry the pattern on to 0.30 mol, which is past the end of the dial.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
        if (Math.abs(v - Q_ASKED) <= 1) return { ok: true };
        const r = cupRead(t, 'cup');
        if (!r.item) return { ok: false, msg: 'The powder has not been in the cup yet.' };
        return { ok: false, msg: `The bath took in ${fixed(r.q / 1000, 1)} kJ from ${fixed(r.moles, 2)} mol, and ${v} kJ does not carry that pattern on to 0.30 mol.` };
      },
      reward: {
        log: '0.30 mol of the powder gave out 48 kJ.',
        title: 'Heat Scales With Moles',
        body: 'Twice the moles gave twice the heat, so 0.30 mol gives 0.30 × 160 = 48 kJ. The heat given out is the moles that react times ΔH, and ΔH stays at −160 kJ/mol.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 400 g', water: FINAL_BATH, T0: FINAL_T0, molesList: FINAL_MOLES });
    return {
      id: 's6-final',
      title: 'Predicting a Temperature',
      prompt: 'What temperature does the 400 g bath reach with 0.25 mol of the powder?',
      entry: { id: 't', label: 'Final temperature', unit: '°C' },
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, POWDER)],
        fixtures: [c.fixture],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Drop the powder in the cup, then turn the "Moles reacted" dial and read the RISE at each setting.',
        'Compare the rise at 0.05 mol with the rise at 0.1 mol.',
        'The rise grows in step with the moles, and the bath starts at 20 °C.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 't');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the temperature in °C.' };
        if (Math.abs(v - T_FINAL) <= 0.6) return { ok: true };
        const rises = FINAL_MOLES.map(n => fixed((n * -POWDER.dH * 1000) / (FINAL_BATH * SPECIFIC_HEAT_WATER), 1));
        return { ok: false, msg: `The bath rises ${rises[0]} °C with ${FINAL_MOLES[0]} mol and ${rises[1]} °C with ${FINAL_MOLES[1]} mol, and ${fixed(v, 1)} °C is a rise of ${fixed(v - FINAL_T0, 1)} °C.` };
      },
      reward: {
        log: '0.25 mol of the powder took the 400 g bath to about 44 °C.',
        title: 'Heat Into a Rise',
        body: 'Five times the moles gives five times the heat and five times the rise, so the bath climbs 23.9 °C to about 43.9 °C.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's5-equation',
    title: 'ΔH and Its Equation',
    briefing: { speaker: SPEAKER, body: 'When ΔH is written beside an equation, it is the heat for the numbers of moles shown in that equation, where (g) marks a gas and (l) a liquid. If twice as many moles react, twice the heat is given out.' },
    prompt: 'How much heat is given out when 6.0 g of hydrogen burns?',
    entry: { id: 'kj', label: 'Heat given out', unit: 'kJ' },
    widget,
    table: heatTable({
      pieces: [
        charge('h2-sample', 'Hydrogen sample', { x: 30, y: 50 }, { moles: 3, dH: EQN_DH / 2, shown: '6.0 g H₂' })
      ],
      fixtures: [
        plaqueFixture('eq', 'Burning hydrogen', { x: 52, y: 24 }, [
          '2 H₂(g) + O₂(g) → 2 H₂O(l)',
          `ΔH = ${EQN_DH} kJ`,
          '1 mol of H₂ has a mass of 2.0 g'
        ], { w: 76 }),
        rxnFixture('atoms', { x: 121, y: 28 }, { lhs: [[2, 'H₂'], [1, 'O₂']], rhs: [[2, 'H₂O']], dH: EQN_DH, w: 54, h: 34 })
      ]
    }),
    hints: [
      'Read the plate: the equation, its ΔH, and the mass of one mole of hydrogen.',
      'Compare the moles of hydrogen in 6.0 g with the 2 mol of hydrogen in the equation.',
      'The 572 kJ is given out when 2 mol of hydrogen burns, so scale it to the moles you have.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'kj');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
      if (Math.abs(v - Q_EQN) <= 10) return { ok: true };
      const mol = (v / -EQN_DH) * 2;
      return { ok: false, msg: `By this equation ${v} kJ is the heat from ${fixed(mol, 1)} mol of hydrogen, which is ${fixed(mol * 2, 1)} g.` };
    },
    reward: {
      log: '6.0 g of hydrogen released about 860 kJ.',
      title: 'ΔH Goes With the Equation',
      body: '6.0 g of hydrogen is 3.0 mol, one and a half times the 2 mol in the equation, so it gives out 1.5 × 572 = 858 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's3-predict',
    title: 'Which Fuel?',
    // A PREDICT STAGE: the tank is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which fuel gives out the most heat for each gram burned?',
    widget,
    table: heatTable({
      pieces: [
        note('hydrogen', perMole('hydrogen'), { x: 30, y: 14 }),
        note('methane', perMole('methane'), { x: 78, y: 14 }),
        note('methanol', perMole('methanol'), { x: 30, y: 34 }),
        note('carbon', perMole('carbon'), { x: 78, y: 34 })
      ],
      fixtures: [leadFixture('lead', { x: 122, y: 48 }, { scene: 'react', lhs: [[1, 'C₂H₅OH'], [3, 'O₂']], rhs: [[2, 'CO₂'], [3, 'H₂O']], dH: -1367, w: 40, h: 26 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 22 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Read both figures on each card: the heat from one mole, and the mass of one mole.',
      'A gram of a fuel whose mole is light holds more moles than a gram of a fuel whose mole is heavy.',
      'Think about how many moles one gram of each fuel is, and how much heat that many moles gives out.'
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
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the four fuels is recorded. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, {
      title: 'Water tank · 5000 g',
      water: TANK,
      T0: 20,
      hideUntilCommit: true,
      hideRiseUntilCommit: true,
      gate: { railChanged: ['methane', 'hydrogen', 'methanol', 'carbon'] }
    });
    const tin = (id, at) => ({ ...charge(id, `${FUELS[id].name[0].toUpperCase()}${FUELS[id].name.slice(1)}`, at, { moles: molesOf(id), dH: FUELS[id].dHc, shown: `${GRAMS} g = ${Number(molesOf(id).toPrecision(2))} mol` }) });
    return {
      id: 's4-rank',
      title: 'Ten Grams Each',
      prompt: 'What is the order of the four fuels, from least heat to most, when ten grams of each burns?',
      widget,
      table: heatTable({
        // A tin bumped out of the cup's mouth comes to rest on the strip below the rail.
        pieces: FUEL_IDS.map((id, i) => tin(id, { x: 66 + i * 24, y: 54 })),
        fixtures: [c.fixture],
        zones: {
          slots: [c.slot],
          rail: { at: { x: 104, y: 34 }, size: { w: 88, h: 16 }, first: 'Least heat', last: 'Most heat', items: FUEL_IDS, start: ['methane', 'hydrogen', 'methanol', 'carbon'] }
        }
      }),
      hints: [
        'Drop each fuel in the cup and read how far the bath rose.',
        'Compare the moles printed on each ten-gram sample with the heat from one mole that its card gave.',
        'The heat given out is the moles burned times the heat from one mole, and ten grams of a light fuel is many moles.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four samples on the rail.' };
        if (order.join() === BY_GRAM.join()) return { ok: true };
        const tins = order.map(id => t.pieces[id]);
        if (tins.some(p => p.props.rise == null)) return { ok: false, msg: 'Not every sample has been in the cup yet.' };
        const k = tins.findIndex((p, i) => i > 0 && tins[i - 1].props.rise > p.props.rise);
        return { ok: false, msg: `${tins[k - 1].label} sits left of ${tins[k].label}, and the tank rose ${fixed(tins[k - 1].props.rise, 1)} °C for the one and ${fixed(tins[k].props.rise, 1)} °C for the other.` };
      },
      reward: {
        log: 'Hydrogen warmed the tank most per gram.',
        title: 'Energy per Gram',
        body: 'Ten grams of hydrogen is about 5 mol, so it gave out the most heat, although hydrogen gives the least heat for each mole. A light mole means more moles in every gram.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the powder onto the cup, then turn the "ΔH" dial.'],
  2: ['Drag the powder onto the cup, turn the dial, then type your answer.'],
  3: ['Drag the powder onto the cup, turn the dial, then type your answer.'],
  4: ['Type your answer in the field at the bottom.'],
  5: ['Drag the card you choose into the slot.'],
  6: ['Drag a fuel onto the cup, then back to the rail.']
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
      body: 'The enthalpy change, ΔH, is the heat a reaction gives out or takes in for each mole, and it is negative when heat is given out. The heat grows in step with the moles that react, so a fuel with a light mole, such as hydrogen, gives out the most heat for each gram.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
/** Each tin in the tank in turn, then onto the rail in the order given (the last drop of each leaves its reading on the tin). */
const tryAll = () => FUEL_IDS.map(id => put(id, MOUTH));
const rail = order => order.map((id, i) => put(id, `rail:${i}`));

export const SOLUTIONS = [
  [put('powder', MOUTH), dial('chart', 'after', 2)],
  [put('powder', MOUTH), dial('cup', 'moles', 3), { type: { entry: 'kj', value: '48' } }],
  [put('powder', MOUTH), { type: { entry: 't', value: '43.9' } }],
  [{ type: { entry: 'kj', value: '860' } }],
  [put('hydrogen', 'slot:guess')],
  [...tryAll(), ...rail(BY_GRAM)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('powder', MOUTH), dial('chart', 'after', 4)],
  [put('powder', MOUTH), dial('cup', 'moles', 3), { type: { entry: 'kj', value: '32' } }],
  [put('powder', MOUTH), { type: { entry: 't', value: '40' } }],
  [{ type: { entry: 'kj', value: '570' } }],
  [],
  [...tryAll(), ...rail(['methane', 'hydrogen', 'methanol', 'carbon'])]
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
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { T_FINAL, POWDER, AFTER, SCALE_MOLES, Q_ASKED, Q_EQN, EQN_DH, GRAMS, TANK, FUEL_IDS, BY_GRAM, riseOf, molesOf };
export { cupRead, shelvesRead };
