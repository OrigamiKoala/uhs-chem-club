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
import { heatTable, charge, note, cupFixture, shelvesFixture, plaqueFixture, markerFixture, markerRead, cupRead, shelvesRead, fixed, FUELS, SPECIFIC_HEAT_WATER } from '../../table/kits/heat.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\benthalpy\b/i, introducedAt: 1 },
  { term: /\blimiting reactant\b/i, introducedAt: 7 }
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
// Stage 8: a reaction-progress diagram, levels in kJ. The forward barrier is 60 kJ and ΔH is -40 kJ, so the reverse barrier is 100 kJ.
const BARRIER = { r: 100, p: 60, peak: 160 };
const EA_REVERSE = BARRIER.peak - BARRIER.p;

// Stage 2: the same powder at three amounts on the dial, and 0.30 mol beyond it (48 kJ).
const SCALE_MOLES = [0.05, 0.1, 0.2];
const ASKED_MOLES = 0.3;
const Q_ASKED = ASKED_MOLES * -POWDER.dH;
// Stage 5: 2 H2 + O2 -> 2 H2O, ΔH = -572 kJ as written; 6.0 g of hydrogen is 3.0 mol, so 1.5 times the reaction as written.
const EQN_DH = -572;
const H2_GRAMS = 6;
const REACTIONS_RUN = H2_GRAMS / 2.0 / 2;
const Q_EQN = REACTIONS_RUN * -EQN_DH;

// Stage 6: 0.25 mol of the powder in a 400 g bath at 20 degrees: a rise of 23.9 degrees.
const FINAL_MOLES = [0.05, 0.1];
const FINAL_BATH = 400;
const FINAL_T0 = 20;
const FINAL_ASKED = 0.25;
const T_FINAL = FINAL_T0 + (FINAL_ASKED * -POWDER.dH * 1000) / (FINAL_BATH * SPECIFIC_HEAT_WATER);
// Stage 7: HCl + NaOH -> NaCl + H2O gives out 56 kJ per mole of reaction; 0.040 mol of acid meets 0.060 mol of base.
const NEUT_DH = -56;
const NEUT = { acid: 0.04, base: 0.06 };
const Q_NEUT = Math.min(NEUT.acid, NEUT.base) * -NEUT_DH;

// Stage 4: ten grams of each fuel into a 5000 g tank.
const GRAMS = 10;
const TANK = 5000;
const FUEL_IDS = ['hydrogen', 'methane', 'methanol', 'carbon'];
const molesOf = id => GRAMS / FUELS[id].molarMass;
const riseOf = id => (molesOf(id) * -FUELS[id].dHc * 1000) / (TANK * SPECIFIC_HEAT_WATER);
/** The fuels from the least heat per gram to the most. */
const BY_GRAM = [...FUEL_IDS].sort((a, b) => riseOf(a) - riseOf(b));

/** A fuel's card in the prediction: its heat per mole (the number that looks like the answer) and what a mole weighs. */
const perMole = id => `${FUELS[id].name[0].toUpperCase()}${FUELS[id].name.slice(1)}: ${Math.round(-FUELS[id].dHc)} kJ per mole, a mole weighs ${Math.round(FUELS[id].molarMass)} g`;

/* ------------------------------------------------------------------
   THE THREE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 200 g', water: 200, T0: 20, showHeat: true });
    return {
      id: 's1-chart',
      title: 'The Chart for a Powder',
      prompt: 'Set the chart to the energy change per mole of the powder.',
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, POWDER)],
        fixtures: [
          c.fixture,
          shelvesFixture('chart', { x: 120, y: 30 }, {
            reactants: 'Powder before', products: 'Powder after', dH: 0, scale: 320, hideValue: true, hideVerdict: true, title: 'Energy chart',
            build: { afterList: AFTER, labels: ['−320 kJ/mol', '−160 kJ/mol', 'Level', '+160 kJ/mol', '+320 kJ/mol'], label: 'After shelf' }
          })
        ],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Use the cup, the powder and the "After shelf" dial.',
        'Compare the energy the cup caught with how many moles the powder holds.',
        'Divide the energy by the moles for one mole, then set the shelf to that size in the direction the bath shows.'
      ],
      check(state) {
        const t = state.table;
        const r = shelvesRead(t, 'chart');
        if (r.dH === 0) return { ok: false, notYet: true, msg: 'The two shelves are level: turn the dial under the chart.' };
        if (r.dH === POWDER.dH) return { ok: true };
        const rise = t.pieces.powder.props.rise;
        if (rise == null) return { ok: false, msg: 'The powder has not been in the cup yet.' };
        const bath = `the bath ${rise > 0 ? 'warmed' : 'cooled'} ${fixed(Math.abs(rise), 1)} °C`;
        // A chart on the wrong side says only that; a chart on the right side with the wrong size says what it shows.
        if (Math.sign(r.dH) !== Math.sign(POWDER.dH)) return { ok: false, msg: `The chart ${r.dH > 0 ? 'climbs' : 'drops'}, and ${bath}.` };
        return { ok: false, msg: `The chart drops ${Math.abs(r.dH)} kJ per mole, and ${bath} from ${POWDER.moles} mol.` };
      },
      reward: {
        log: 'The shelf dropped 160 kJ per mole.',
        title: 'Enthalpy Change',
        body: 'Enthalpy change, ΔH, is the heat absorbed or released per mole of reaction. Dissolving 0.05 mol released 8,000 J to the bath, giving ΔH = −160 kJ/mol, where a negative sign indicates an exothermic change.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 200 g', water: 200, T0: 20, showHeat: true, molesList: SCALE_MOLES });
    return {
      id: 's2-scale',
      title: 'More Powder, More Heat',
      prompt: 'Type the heat that 0.30 mol of the powder gives out, in kilojoules.',
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
        'Use the cup, its "Moles reacted" dial, the powder and the marker.',
        'Compare the heat the bath catches at each setting of the dial.',
        'Each extra mole of powder gives the same amount again, so the heat grows in step with the moles.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
        if (Math.abs(v - Q_ASKED) <= 1) return { ok: true };
        const r = cupRead(t, 'cup');
        if (!r.item) return { ok: false, msg: 'The powder has not been in the cup yet.' };
        return { ok: false, msg: `${v} kJ is not what the cup caught: it caught ${fixed(r.q / 1000, 1)} kJ from ${fixed(r.moles, 2)} mol.` };
      },
      reward: {
        log: '0.30 mol of the powder gave out 48 kJ.',
        title: 'Heat Scales With Moles',
        body: 'The heat given out is the moles that react times ΔH: q = n × ΔH. Three times the powder gives three times the heat, so ΔH in kJ/mol is the same however much you use.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'Which Fuel?',
    // A PREDICT STAGE: the tank is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which fuel gives the skiff the most heat from every gram of its tank?',
    widget,
    table: heatTable({
      pieces: [
        note('hydrogen', perMole('hydrogen'), { x: 30, y: 14 }),
        note('methane', perMole('methane'), { x: 78, y: 14 }),
        note('methanol', perMole('methanol'), { x: 30, y: 34 }),
        note('carbon', perMole('carbon'), { x: 78, y: 34 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the four cards and the slot.',
      'Compare what each card says about a mole with what a mole weighs.',
      'Commit to the fuel you expect to release the most heat per gram.'
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
      body: 'Next, burn ten grams of each fuel under the tank to measure the heat released per gram.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Water tank · 5000 g', water: TANK, T0: 20 });
    const tin = (id, at) => ({ ...charge(id, `${FUELS[id].name[0].toUpperCase()}${FUELS[id].name.slice(1)}`, at, { moles: molesOf(id), dH: FUELS[id].dHc, shown: `${GRAMS} g` }) });
    return {
      id: 's4-rank',
      title: 'Ten Grams Each',
      prompt: 'Order the four tins by how far each warms the same tank.',
      widget,
      table: heatTable({
        // A tin bumped out of the cup's mouth comes to rest on the strip below the rail.
        pieces: FUEL_IDS.map((id, i) => tin(id, { x: 66 + i * 24, y: 54 })),
        fixtures: [c.fixture],
        zones: {
          slots: [c.slot],
          rail: { at: { x: 104, y: 34 }, size: { w: 88, h: 16 }, first: 'Warms the tank least', last: 'Warms the tank most', items: FUEL_IDS, start: ['methane', 'hydrogen', 'methanol', 'carbon'] }
        }
      }),
      hints: [
        'Use the cup, the four tins and the rail.',
        'Compare how far each tin warms the same tank, since every tin holds the same weight.',
        'Rank the tins by the bath readings they kept, not by the figures you were shown for a mole.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four tins on the rail.' };
        if (order.join() === BY_GRAM.join()) return { ok: true };
        const tins = order.map(id => t.pieces[id]);
        if (tins.some(p => p.props.rise == null)) return { ok: false, msg: 'Not every tin has been in the cup yet.' };
        const k = tins.findIndex((p, i) => i > 0 && tins[i - 1].props.rise > p.props.rise);
        return { ok: false, msg: `${tins[k - 1].label} sits left of ${tins[k].label}, and the tank rose ${fixed(tins[k - 1].props.rise, 1)} °C for the one and ${fixed(tins[k].props.rise, 1)} °C for the other.` };
      },
      reward: {
        log: 'Hydrogen warmed the tank most per gram.',
        title: 'Energy per Gram',
        body: 'Hydrogen releases the least heat per mole yet the most heat per gram because of its low molar mass (2.0 g/mol). Fuel energy density depends on mass rather than moles.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-equation',
    title: 'Per Equation',
    prompt: 'Type the heat released when 6.0 g of hydrogen burns, in kilojoules.',
    entry: { id: 'kj', label: 'Heat released', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('eq', 'Measured', { x: 52, y: 24 }, [
          '2 H₂(g) + O₂(g) → 2 H₂O(l)',
          `ΔH = ${EQN_DH} kJ`,
          'Molar mass of H₂ = 2.0 g/mol'
        ], { w: 76 }),
      ]
    }),
    hints: [
      'Use the plate of facts and the marker.',
      'Compare the moles of hydrogen in 6.0 g with the moles of hydrogen the equation burns.',
      'Find how many times the equation as written is carried out, then multiply its ΔH by that.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'kj');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
      if (Math.abs(v - Q_EQN) <= 10) return { ok: true };
      return { ok: false, msg: `${v} kJ does not follow from the plate, which gives ${Math.abs(EQN_DH)} kJ.` };
    },
    reward: {
      log: '6.0 g of hydrogen released about 860 kJ.',
      title: 'ΔH Goes With the Equation',
      body: 'A ΔH belongs to the equation it is written beside: −572 kJ is for 2 mol of H₂ burning, not 1 mol. Count how many times the equation as written is carried out, and multiply.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Bath · 400 g', water: FINAL_BATH, T0: FINAL_T0, molesList: FINAL_MOLES });
    return {
      id: 's6-final',
      title: 'The Bath\'s Final Temperature',
      prompt: 'Type the temperature the bath reaches with 0.25 mol of the powder, in °C.',
      entry: { id: 't', label: 'Final temperature', unit: '°C' },
      widget,
      table: heatTable({
        pieces: [charge('powder', 'Hot-pack powder', { x: 74, y: 20 }, POWDER)],
        fixtures: [c.fixture],
        zones: { slots: [c.slot] }
      }),
      hints: [
        'Use the cup, its "Moles reacted" dial and the powder.',
        'Compare how far the bath rises at each setting of the dial.',
        'The rise grows in step with the moles, and the final temperature is the starting one plus the rise.'
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
        title: 'Predicting a Temperature',
        body: 'Heat from the reaction is n × ΔH, and the bath warms by that heat divided by m × c: 40 kJ into 400 g of water is a rise of 23.9 °C, so the bath ends near 44 °C. The same steps, run forwards, predict what a thermometer will read.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-limiting',
    title: 'Which Runs Out?',
    prompt: 'Type the heat given out when the acid and the base react completely, in kJ.',
    entry: { id: 'q', label: 'Heat given out', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        plaqueFixture('facts', 'HCl + NaOH → NaCl + H₂O', { x: 52, y: 28 }, [
          'ΔH = −56 kJ for each mole of reaction',
          'The cup holds 0.040 mol of HCl',
          'and 0.060 mol of NaOH.'
        ], { w: 80 })
      ]
    }),
    hints: [
      'Use the plate of facts.',
      'Compare the moles of each reactant with the one-to-one ratio in the equation.',
      'The reaction stops when the reactant there is less of is used up, so count the moles of reaction from that one.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'q');
      if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
      if (Math.abs(v - Q_NEUT) <= 0.06) return { ok: true };
      return { ok: false, msg: `${fixed(v, 2)} kJ is the heat of ${fixed(v / -NEUT_DH, 3)} mol of reaction, and the cup holds ${NEUT.acid.toFixed(3)} mol of HCl and ${NEUT.base.toFixed(3)} mol of NaOH, one for one.` };
    },
    reward: {
      log: 'The 0.040 mol of acid ran out first: 2.24 kJ.',
      title: 'The Limiting Reactant',
      body: 'The reactant that runs out first, here the 0.040 mol of HCl, is the limiting reactant, and it sets how many moles of reaction happen. The heat is that many moles times ΔH: 0.040 × 56 = 2.24 kJ, and the extra NaOH stays unreacted.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-barrier',
    title: 'The Way Back Over the Hill',
    prompt: 'Type the activation energy of the reverse reaction, in kJ.',
    entry: { id: 'ea', label: 'Reverse activation energy', unit: 'kJ' },
    widget,
    table: heatTable({
      fixtures: [
        shelvesFixture('chart', { x: 40, y: 32 }, { reactants: 'Reactants', products: 'Products', dH: BARRIER.p - BARRIER.r, levels: BARRIER, hideValue: true, hideVerdict: true, title: 'Reaction progress', w: 70 }),
        plaqueFixture('facts', 'Energy levels', { x: 112, y: 32 }, ['Reactants: 100 kJ', 'Top of the hill: 160 kJ', 'Products: 60 kJ'], { w: 36 })
      ]
    }),
    hints: [
      'Use the diagram and the plate of levels.',
      'The reverse reaction starts on the products\' shelf and climbs to the top of the same hill.',
      'Subtract the products\' level from the top of the hill.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ea');
      if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Type the figure you worked out, in kJ.' };
      if (Math.abs(v - EA_REVERSE) <= 0.6) return { ok: true };
      if (Math.abs(v - (BARRIER.peak - BARRIER.r)) <= 0.6) return { ok: false, msg: 'That is the climb from the reactants, and the reverse reaction starts on the other shelf.' };
      return { ok: false, msg: `${fixed(v, 0)} kJ above the products\' shelf does not reach the top of the hill on the diagram.` };
    },
    reward: {
      log: 'The reverse reaction climbs 100 kJ.',
      title: 'Activation Energy',
      body: 'The forward reaction climbs 60 kJ from reactants to the top of the hill and releases 40 kJ overall (ΔH = −40 kJ). The reverse reaction starts lower, so it climbs 60 + 40 = 100 kJ.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the powder onto the cup, then turn the dial.'],
  2: ['Drag the powder onto the cup, turn the dial, then type your answer.'],
  3: ['Drag the card you choose into the slot.'],
  4: ['Drag a tin onto the cup, then back to the rail.'],
  5: ['Type your answer in the field at the bottom.'],
  6: ['Drag the powder onto the cup, turn the dial, then type your answer.'],
  7: ['Type your answer in the field at the bottom.'],
  8: ['Type your answer in the field at the bottom.']
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
      body: 'Reaction enthalpy is expressed per mole of substance, with a negative sign indicating released heat. While molar enthalpy tracks reaction stoichiometry, energy density per gram depends on molar mass, making lightweight fuels like hydrogen highly energetic by mass.'
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
  [put('hydrogen', 'slot:guess')],
  [...tryAll(), ...rail(BY_GRAM)],
  [{ type: { entry: 'kj', value: '860' } }],
  [put('powder', MOUTH), { type: { entry: 't', value: '43.9' } }],
  [{ type: { entry: 'q', value: '2.24' } }],
  [{ type: { entry: 'ea', value: '100' } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('powder', MOUTH), dial('chart', 'after', 4)],
  [put('powder', MOUTH), dial('cup', 'moles', 3), { type: { entry: 'kj', value: '32' } }],
  [],
  [...tryAll(), ...rail(['methane', 'hydrogen', 'methanol', 'carbon'])],
  [{ type: { entry: 'kj', value: '570' } }],
  [put('powder', MOUTH), { type: { entry: 't', value: '40' } }],
  [{ type: { entry: 'q', value: '3.36' } }],
  [{ type: { entry: 'ea', value: '60' } }]
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
export const CHECKS = { BARRIER, EA_REVERSE, T_FINAL, Q_NEUT, POWDER, AFTER, SCALE_MOLES, Q_ASKED, Q_EQN, EQN_DH, GRAMS, TANK, FUEL_IDS, BY_GRAM, riseOf, molesOf };
export { cupRead, shelvesRead };
