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
const AFTER = [-320, -240, -160, -80, 0, 80, 160, 240, 320];
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
// Stage 6: ten grams of each fuel into a 10 kg tank (keeps the bath well below boiling).
const GRAMS = 10;
const TANK = 10000;
const FUEL_IDS = ['hydrogen', 'methane', 'methanol', 'carbon'];
const molesOf = id => GRAMS / FUELS[id].molarMass;
const riseOf = id => (molesOf(id) * -FUELS[id].dHc * 1000) / (TANK * SPECIFIC_HEAT_WATER);
/** The fuels from the least heat per gram to the most. */
const BY_GRAM = [...FUEL_IDS].sort((a, b) => riseOf(a) - riseOf(b));

/** A fuel's card in the prediction: name and formula only, so the bench settles the ranking. */
const FUEL_FORMULA = { hydrogen: 'H₂', methane: 'CH₄', methanol: 'CH₃OH', carbon: 'C' };
const perMole = id => `${FUELS[id].name[0].toUpperCase()}${FUELS[id].name.slice(1)} (${FUEL_FORMULA[id]})`;

/* ------------------------------------------------------------------
   THE SIX STAGES (limiting reactant and activation energy left this bench on 2026-11-11: `archive/2026-11-11/ember/`)
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 200 g', water: 200, T0: 20, showHeat: true });
    return {
      id: 's1-chart',
      title: 'Heat per Mole',
      briefing: {
        speaker: SPEAKER,
        body: [
          'A mole (mol) is a fixed count of 6.02 × 10²³ particles.',
          'The enthalpy change of a reaction (ΔH) is the heat released or absorbed per mole.',
          'ΔH is negative when a reaction releases heat to the bath, and positive when it absorbs heat.'
        ]
      },
      prompt: 'What is the enthalpy change (ΔH) for one mole of this hot-pack powder?',
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, POWDER)],
        fixtures: [
          c.fixture,
          shelvesFixture('chart', { x: 120, y: 30 }, {
            reactants: 'Powder before', products: 'Powder after', dH: 0, scale: 320, hideValue: true, hideVerdict: true, title: 'Energy diagram', afterStart: 5,
            build: { afterList: AFTER, labels: AFTER.map(v => (v === 0 ? 'Level' : `${v > 0 ? '+' : '−'}${Math.abs(v)} kJ/mol`)), label: 'ΔH' }
          })
        ],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Drop the powder into the cup, then read the bath\'s HEAT and the moles on the powder label.',
        'That heat came from 0.05 mol, so compare it with what 1 full mole would release.',
        'Convert the heat per mole to kilojoules (1 kJ = 1,000 J), and use a negative sign because the bath warmed.'
      ],
      check(state) {
        const t = state.table;
        const r = shelvesRead(t, 'chart');
        if (r.dH === 0) return { ok: false, notYet: true, msg: 'Both levels are equal: turn the "ΔH" dial.' };
        if (r.dH === POWDER.dH) return { ok: true };
        const rise = t.pieces.powder.props.rise;
        if (rise == null) return { ok: false, msg: 'Test the powder in the cup first.' };
        const bath = `the bath ${rise > 0 ? 'warmed' : 'cooled'} by ${fixed(Math.abs(rise), 1)} °C`;
        if (Math.sign(r.dH) !== Math.sign(POWDER.dH)) return { ok: false, msg: `A ${r.dH > 0 ? 'higher' : 'lower'} product level means the powder ${r.dH > 0 ? 'absorbed heat' : 'released heat'}, but ${bath}.` };
        return { ok: false, msg: `The diagram shows a drop of ${Math.abs(r.dH)} kJ/mol, while ${bath} from ${POWDER.moles} mol.` };
      },
      reward: {
        log: 'The energy level dropped 160 kJ per mole.',
        title: 'Enthalpy Change',
        body: 'The bath absorbed 8,000 J from 0.05 mol of powder, which equals 160 kJ per mole. Because heat flowed out to the bath, ΔH = −160 kJ/mol.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 200 g', water: 200, T0: 20, showHeat: true, molesList: SCALE_MOLES });
    return {
      id: 's2-scale',
      title: 'More Powder, More Heat',
      briefing: { speaker: SPEAKER, body: 'The total heat a reaction releases scales directly with the moles that react: q = n × ΔH.' },
      prompt: 'How much heat does 0.30 mol of the powder release?',
      entry: { id: 'kj', label: 'Heat released', unit: 'kJ' },
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, { ...POWDER, shown: 'ΔH = −160 kJ/mol' })],
        fixtures: [
          c.fixture,
        ],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Drop the powder into the cup, turn the "Moles reacted" dial, and watch the HEAT reading.',
        'Compare the heat released at 0.05 mol, 0.10 mol, and 0.20 mol.',
        'Because heat scales directly with moles, extend that pattern to 0.30 mol, just beyond the dial.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat in kilojoules.' };
        if (Math.abs(v - Q_ASKED) <= 1) return { ok: true };
        const r = cupRead(t, 'cup');
        if (!r.item) return { ok: false, msg: 'Test the powder in the cup first.' };
        return { ok: false, msg: `At ${fixed(r.moles, 2)} mol, the bath absorbed ${fixed(r.q / 1000, 1)} kJ, so check how much 0.30 mol would release.` };
      },
      reward: {
        log: '0.30 mol of the powder released 48 kJ.',
        title: 'Heat Scales With Moles',
        body: 'Doubling the moles doubles the heat, so 0.30 mol × 160 kJ/mol = 48 kJ. Total heat scales with moles while ΔH stays −160 kJ/mol.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 400 g', water: FINAL_BATH, T0: FINAL_T0, molesList: FINAL_MOLES });
    return {
      id: 's6-final',
      title: 'Predicting a Temperature',
      briefing: { speaker: SPEAKER, body: 'Combine q = n × ΔH with q = m × c × ΔT to predict the final temperature of a larger bath.' },
      prompt: 'Starting at 20.0 °C, what final temperature does the 400 g bath reach with 0.25 mol?',
      entry: { id: 't', label: 'Final temperature', unit: '°C' },
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, { ...POWDER, shown: 'ΔH = −160 kJ/mol' })],
        fixtures: [
          c.fixture,
          plaqueFixture('ref', 'Reference', { x: 118, y: 24 }, [
            'Bath starts at 20.0 °C',
            'ΔH = −160 kJ/mol',
            'q = n × ΔH',
            'q = m × c × ΔT',
            'c of water = 4.184 J/(g·°C)'
          ], { w: 54 })
        ],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Drop the powder into the 400 g cup, turn the "Moles reacted" dial, and read the RISE at each setting.',
        'Compare the temperature rise at 0.05 mol with the rise at 0.10 mol.',
        'Scale that rise to 0.25 mol and add it to the starting temperature of 20.0 °C.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 't');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the temperature in °C.' };
        if (Math.abs(v - T_FINAL) <= 0.6) return { ok: true };
        const rises = FINAL_MOLES.map(n => fixed((n * -POWDER.dH * 1000) / (FINAL_BATH * SPECIFIC_HEAT_WATER), 1));
        return { ok: false, msg: `From 20.0 °C, the 400 g bath rises ${rises[0]} °C with ${FINAL_MOLES[0]} mol and ${rises[1]} °C with ${FINAL_MOLES[1]} mol; ${fixed(v, 1)} °C is a rise of ${fixed(v - FINAL_T0, 1)} °C.` };
      },
      reward: {
        log: '0.25 mol of powder warmed the 400 g bath to 43.9 °C.',
        title: 'Heat Into a Rise',
        body: 'Five times the moles produces five times the heat and five times the temperature rise, warming the bath by 23.9 °C from 20.0 °C to 43.9 °C.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's5-equation',
    title: 'ΔH and Its Equation',
    briefing: {
      speaker: SPEAKER,
      body: [
        'In a chemical equation, (g) marks a gas and (l) a liquid. Coefficients tell how many moles react.',
        'The ΔH beside an equation matches those exact coefficients: twice the moles releases twice the heat.'
      ]
    },
    prompt: 'How much heat is released when 6.0 g of hydrogen burns?',
    entry: { id: 'kj', label: 'Heat released', unit: 'kJ' },
    widget,
    table: heatTable({
      pieces: [],
      fixtures: [
        plaqueFixture('eq', 'Burning hydrogen', { x: 48, y: 28 }, [
          '2 H₂(g) + O₂(g) → 2 H₂O(l)',
          `ΔH = ${EQN_DH} kJ`,
          'Sample to burn: 6.0 g of H₂',
          'Molar mass of H₂ = 2.0 g/mol'
        ], { w: 78 }),
        rxnFixture('atoms', { x: 120, y: 28 }, { lhs: [[2, 'H₂'], [1, 'O₂']], rhs: [[2, 'H₂O']], dH: EQN_DH, w: 54, h: 34 })
      ]
    }),
    hints: [
      'Check the equation, its ΔH, and the molar mass of H₂ on the reference plate.',
      'Find how many moles are in 6.0 g of H₂ and compare that with the 2 mol in the equation.',
      'Since 572 kJ is released per 2 mol of H₂, scale that heat to your number of moles.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'kj');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat in kilojoules.' };
      if (Math.abs(v - Q_EQN) <= 10) return { ok: true };
      const mol = (v / -EQN_DH) * 2;
      return { ok: false, msg: `By this equation, ${v} kJ corresponds to burning ${fixed(mol, 1)} mol (${fixed(mol * 2, 1)} g) of H₂.` };
    },
    reward: {
      log: '6.0 g of hydrogen released 858 kJ.',
      title: 'ΔH Matches the Equation',
      body: '6.0 g of H₂ is 3.0 mol, which is 1.5 times the 2 mol in the equation, so it releases 1.5 × 572 = 858 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's3-predict',
    title: 'Which Fuel?',
    // A PREDICT STAGE: the tank is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which fuel releases the most heat per gram burned?',
    widget,
    table: heatTable({
      pieces: [
        note('hydrogen', perMole('hydrogen'), { x: 24, y: 14 }),
        note('methane', perMole('methane'), { x: 70, y: 14 }),
        note('methanol', perMole('methanol'), { x: 24, y: 34 }),
        note('carbon', perMole('carbon'), { x: 70, y: 34 })
      ],
      fixtures: [leadFixture('lead', { x: 122, y: 48 }, { scene: 'react', lhs: [[1, 'C₂H₅OH'], [3, 'O₂']], rhs: [[2, 'CO₂'], [3, 'H₂O']], dH: -1367, w: 40, h: 26 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 122, y: 20 }, size: { w: 46, h: 18 } }] }
    }),
    hints: [
      'Consider which fuel packs the most heat into each gram of mass.',
      'A lighter molecule fits more moles into every gram of fuel.',
      'Think about how many moles fit into 1 g of each fuel and how much heat each mole releases.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the four fuels is saved. Test it on the bench.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, {
      title: 'Water tank · 10,000 g',
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
      prompt: 'Rank the four fuels from least heat to most heat when 10 g of each burns.',
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
        'Drop each fuel into the tank and read how much the water warms on the thermometer.',
        'Compare the moles in 10 g of each fuel with how much each warmed the tank.',
        'Total heat equals moles burned times ΔH, and 10 g of a light molecule contains many moles.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Place all four samples on the rail.' };
        if (order.join() === BY_GRAM.join()) return { ok: true };
        const tins = order.map(id => t.pieces[id]);
        if (tins.some(p => p.props.rise == null)) return { ok: false, msg: 'Test every fuel in the tank first.' };
        const k = tins.findIndex((p, i) => i > 0 && tins[i - 1].props.rise > p.props.rise);
        return { ok: false, msg: `${tins[k - 1].label} is left of ${tins[k].label}, even though ${tins[k - 1].label} warmed the tank by ${fixed(tins[k - 1].props.rise, 1)} °C and ${tins[k].label} by ${fixed(tins[k].props.rise, 1)} °C.` };
      },
      reward: {
        log: 'Hydrogen released the most heat per gram.',
        title: 'Energy per Gram',
        body: '10 g of hydrogen is 5 mol, so it released the most heat even though one mole of H₂ releases less than methane. Each mole of H₂ weighs only 2 g.'
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
      body: 'Enthalpy change (ΔH) is the heat a reaction releases or absorbs per mole, and it is negative when heat is released. Total heat scales with moles reacted, so lightweight fuels like hydrogen pack the most energy per gram.'
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
  [put('powder', MOUTH), dial('chart', 'after', 3)],
  [put('powder', MOUTH), dial('cup', 'moles', 3), { type: { entry: 'kj', value: '48' } }],
  [put('powder', MOUTH), { type: { entry: 't', value: '43.9' } }],
  [{ type: { entry: 'kj', value: '858' } }],
  [put('hydrogen', 'slot:guess')],
  [...tryAll(), ...rail(BY_GRAM)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('powder', MOUTH), dial('chart', 'after', 7)],
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
    onLoad(r) {
      if (r.index === 5) {
        const g = recall(QUEST_KEY);
        if (g && GUESS_LABEL[g]) r.frame.note(`You predicted: ${GUESS_LABEL[g]}. Test all four fuels on the bench.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { T_FINAL, POWDER, AFTER, SCALE_MOLES, Q_ASKED, Q_EQN, EQN_DH, GRAMS, TANK, FUEL_IDS, BY_GRAM, riseOf, molesOf };
export { cupRead, shelvesRead };
