/**
 * Unit 5 · Bench 3 — Enthalpy of Reaction (q3-enthalpy)
 *
 * The habitat's boiler room, on the heat kit (`table/kits/heat.js`). The same lidded cup, now read from the chemicals' side of the line: the
 * heat a bath gains is the heat the reaction lost, counted per mole, and that figure decides which fuel a skiff should carry. Three stages
 * and ONE click: the belief that the fuel with the biggest number printed on it is the best fuel.
 *
 *   1  a powder in a bath: the energy chart per mole           -> enthalpy change, ΔH
 *   2  PREDICT: which of four fuels gives the most heat per gram of tank?
 *   3  TEST: ten grams of each in a 5 kg tank, ranked by how far each warms it   -> energy per gram
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction's cards print each fuel's heat per MOLE, and methane's is the biggest. The tank ranks the
 * tins by heat per GRAM, and the lightest molecule wins. A tin that has been in the tank keeps how far it warmed it, so four readings can
 * be compared on the rail.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { heatTable, charge, note, cupFixture, shelvesFixture, cupRead, shelvesRead, fixed, FUELS, SPECIFIC_HEAT_WATER } from '../../table/kits/heat.js';

export const meta = { stageCount: 3 };

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

// Stage 3: ten grams of each fuel into a 5000 g tank.
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
  {
    id: 's2-predict',
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

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const c = cupFixture('cup', { x: 28, y: 31 }, { title: 'Water tank · 5000 g', water: TANK, T0: 20 });
    const tin = (id, at) => ({ ...charge(id, `${FUELS[id].name[0].toUpperCase()}${FUELS[id].name.slice(1)}`, at, { moles: molesOf(id), dH: FUELS[id].dHc, shown: `${GRAMS} g` }) });
    return {
      id: 's3-rank',
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
        body: 'Hydrogen releases the least heat per mole yet the most heat per gram because of its low molar mass (2.0 g/mol). Fuel energy density depends on mass rather than moles.',
        model: { type: 'molecules', items: ['hydrogen', 'methane'], caption: 'A hydrogen molecule, 2 g a mole, beside a methane molecule, 16 g a mole.' }
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the powder onto the cup, then turn the dial.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Drag a tin onto the cup, then back to the rail.']
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
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'For N₂(g) + 3 H₂(g) → 2 NH₃(g), ΔH = −92 kJ. What is ΔH for 2 NH₃(g) → N₂(g) + 3 H₂(g)?',
    options: [
      { id: 'a', label: '+92 kJ' },
      { id: 'b', label: '−92 kJ' },
      { id: 'c', label: '+184 kJ' },
      { id: 'd', label: '0 kJ' }
    ],
    answer: 'a',
    explanation: 'Reversing a reaction swaps the reactants and products, so ΔH keeps its size and changes its sign.'
  },
  {
    question: 'C(s) + O₂(g) → CO₂(g) has ΔH = −393.5 kJ/mol. How much heat is released when 2.00 mol of carbon burns completely?',
    options: [
      { id: 'a', label: '787 kJ' },
      { id: 'b', label: '394 kJ' },
      { id: 'c', label: '197 kJ' },
      { id: 'd', label: '1574 kJ' }
    ],
    answer: 'a',
    explanation: 'Two moles release twice the heat of one mole: 2.00 mol × 393.5 kJ/mol is about 787 kJ.'
  },
  {
    question: 'Why is a fuel’s ΔH more negative when it burns to liquid water than to water vapour?',
    options: [
      { id: 'a', label: 'Condensing the vapour to a liquid releases extra heat' },
      { id: 'b', label: 'Condensing the vapour to a liquid absorbs heat from the flame' },
      { id: 'c', label: 'Liquid water contains more oxygen atoms than vapour' }
    ],
    answer: 'a',
    explanation: 'Liquid water sits lower in enthalpy than vapour, so ending as a liquid releases the enthalpy of condensation as well.'
  },
  {
    question: 'When 0.10 mol of a salt dissolves in a calorimeter, the water bath loses 1.5 kJ. What is ΔH for dissolving one mole of the salt?',
    options: [
      { id: 'a', label: '+15 kJ/mol' },
      { id: 'b', label: '−15 kJ/mol' },
      { id: 'c', label: '+1.5 kJ/mol' },
      { id: 'd', label: '−1.5 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'The bath lost the energy the salt gained, so ΔH is positive, and 1.5 kJ divided by 0.10 mol is 15 kJ/mol.'
  },
  {
    question: 'Burning 1.0 mol of carbon (12.0 g/mol) releases 394 kJ, and burning 1.0 mol of hydrogen (2.0 g/mol) releases 286 kJ. Which releases more heat per gram?',
    options: [
      { id: 'a', label: 'Hydrogen, because a gram of it holds many more moles' },
      { id: 'b', label: 'Carbon, because 394 kJ is larger than 286 kJ' },
      { id: 'c', label: 'Both release the same heat per gram' }
    ],
    answer: 'a',
    explanation: 'Divide by the molar mass: hydrogen gives about 143 kJ per gram and carbon about 33 kJ per gram.'
  }
];

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
  [put('hydrogen', 'slot:guess')],
  [...tryAll(), ...rail(BY_GRAM)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('powder', MOUTH), dial('chart', 'after', 4)],
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
export const CHECKS = { POWDER, AFTER, GRAMS, TANK, FUEL_IDS, BY_GRAM, riseOf, molesOf };
export { cupRead, shelvesRead };
