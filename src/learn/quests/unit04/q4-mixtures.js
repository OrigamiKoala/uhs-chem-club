/**
 * q4-mixtures.js — Bellows, bench four: PARTIAL PRESSURES.
 *
 * 1  PREDICT: helium added to neon, what happens to neon's own pressure
 * 2  TEST: open both tanks into the common tank                    -> Partial pressure, Dalton's law
 * 3  partial pressure of nitrogen from four tanks (worked case)    -> Mole fraction
 * 4  rank four tanks by pressure from mass and molar mass          -> Moles, not mass
 * 5  gas collected over water                                      -> Subtracting water vapour
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, tank, commonTank, tankRead, planMixture, plaqueFixture, stmt, R
} from '../../table/kits/gas.js';
import { widget, put, cardIn, predictStage, typed } from './_shared.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bpartial pressures?\b/i, introducedAt: 2 },
  { term: /\bdalton.?s law\b/i, introducedAt: 2 },
  { term: /\bmole fractions?\b/i, introducedAt: 3 }
];

/** The gas laws, pressure and the mole are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q2-laws'];

export const QUEST_KEY = 'unit04/q4-mixtures';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const CT = 'ct';
const VALVES = `${CT}.valves`;

const T0 = 300;
const V0 = 10;
export const HELIUM = { gas: 'He', n: 1 };
export const NEON = { gas: 'Ne', n: 0.6 };
export const GUESSES = [['same', 'The same'], ['lower', 'Lower'], ['higher', 'Higher']];

/** Stage 3's four tanks (total 4.0 mol, N2 = 2.4 mol) in a 99.77 L common tank at 300 K (total 100 kPa). */
export const SHARE_V = 99.77;
export const SHARE = [['a', 'He', 0.4], ['b', 'Ne', 0.4], ['c', 'N2', 2.4], ['d', 'CO2', 0.8]];
export const SHARE_N2 = 2.4 / 4.0;

/** Stage 4's tanks (20 L, 300 K): the heaviest gas has fewer moles than the lightest. */
export const RANK = [['a', 'N2', 1.0], ['b', 'CO2', 0.5], ['c', 'He', 1.5], ['d', 'Xe', 0.6]];
export const RANK_V = 20;

/** Stage 5: a jar of gas over water. */
export const OVER_WATER = { total: 752, vapor: 24 };

const t10 = (id, label, at, gas, n, extra = {}) => tank(id, label, at, { gas, n, V: V0, T: T0, gaugeMax: 400, ...extra });

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'A Second Gas',
    prompt: 'Neon is alone in a tank and helium is added: what happens to the pressure neon makes?',
    items: GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Picture neon\'s particles flying about the tank, and ask whether helium\'s particles change how often neon hits a wall.',
      'Ask whether one gas\'s collisions with the walls depend on what else is in the tank.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, connected tanks will test whether adding a second gas changes neon\'s pressure.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 30 }, { V: V0, T: T0, of: VALVES, show: { partials: true }, words: 2, gate: { slot: 'show' }, hideUntilCommit: ['partials', 'gauge'] });
    return {
      title: 'Each Gas Alone',
      prompt: 'What happens to neon\'s own pressure when helium is let into the same tank?',
      widget,
      table: gasTable({
        pieces: [
          t10('a', 'TANK A', { x: 92, y: 9 }, HELIUM.gas, HELIUM.n), t10('b', 'TANK B', { x: 114, y: 9 }, NEON.gas, NEON.n),
          stmt('same', 'The same', { x: 90, y: 45 }), stmt('lower', 'Lower', { x: 128, y: 45 }), stmt('higher', 'Higher', { x: 109, y: 57.5 })
        ],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray], slots: [{ id: 'show', label: 'What neon\'s pressure did', at: { x: 109, y: 29 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Drag Tank B, then Tank A, into the tray under the common tank, then place a card in the slot.',
        'Compare neon\'s pressure in the common tank with Tank B\'s pressure.',
        'Read neon\'s pressure when it is alone, then again after helium opens beside it.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const alone = planMixture([{ gas: NEON.gas, n: NEON.n }], T0, V0).rows[0].P;
        const mixed = planMixture([{ gas: HELIUM.gas, n: HELIUM.n }, { gas: NEON.gas, n: NEON.n }], T0, V0).rows.find(r => r.gas === NEON.gas).P;
        const want = Math.abs(mixed - alone) < 1e-6 ? 'same' : mixed < alone ? 'lower' : 'higher';
        if (card.id === want) return { ok: true };
        return { ok: false, msg: `Neon's own pressure is not ${card.id === 'lower' ? 'lower' : 'higher'} with helium in the tank.` };
      },
      reward: {
        log: 'Neon has the same pressure alone and in the mixture.',
        title: 'Partial Pressure',
        body: 'Neon\'s pressure did not change. The pressure a gas has in a mixture is its partial pressure, and the partial pressures add up to the total: Dalton\'s law.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: SHARE_V, T: T0, of: VALVES, show: { partials: false }, words: 4 });
    const at = [[92, 16], [116, 16], [92, 40], [116, 40]];
    return {
      title: 'A Gas\'s Share',
      briefing: {
        speaker: 'Vess',
        body: 'A gas\'s mole fraction is its moles divided by all the moles in the mixture. Its partial pressure is that fraction of the total pressure.',
        worked: ['0.2 mol of 0.8 mol is 0.25', '0.25 × 200 kPa = 50 kPa']
      },
      prompt: 'What is the partial pressure of nitrogen when all four tanks are open?',
      entry: { id: 'ans', label: 'Partial pressure of nitrogen', unit: 'kPa' },
      widget,
      table: gasTable({
        pieces: SHARE.map(([id, gas, n], i) => t10(id, `TANK ${id.toUpperCase()}`, { x: at[i][0], y: at[i][1] }, gas, n, { showAmount: true, noGauge: true })),
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] }
      }),
      hints: [
        'Drag all four tanks into the tray under the common tank to read the total pressure.',
        'Add up all the moles, then find nitrogen\'s fraction of the total.',
        'Multiply nitrogen\'s mole fraction by the total pressure in the common tank.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the pressure in kPa.' };
        const totalP = planMixture(SHARE.map(([, gas, n]) => ({ gas, n })), T0, SHARE_V).P;
        const want = SHARE_N2 * totalP;
        if (Math.abs(v - want) <= 1.5) return { ok: true };
        return { ok: false, msg: v < want ? 'Nitrogen makes more pressure than that.' : 'Nitrogen makes less pressure than that.' };
      },
      reward: {
        log: 'A gas\'s mole fraction gives its share of the total pressure.',
        title: 'Mole Fraction',
        body: 'Nitrogen is 2.4 of the 4.0 mol, a mole fraction of 0.60, so it makes 60 kPa of the 100 kPa.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const plate = plaqueFixture('plate', 'Molar masses', { x: 34, y: 30 }, [
      'He: 4 g/mol',
      'N₂: 28 g/mol',
      'CO₂: 44 g/mol',
      'Xe: 131 g/mol'
    ], { w: 48 });
    const tanks = RANK.map(([id, gas, n]) => tank(id, `TANK ${id.toUpperCase()}`, { x: 0, y: 0 }, { gas, n, V: RANK_V, T: T0, noGauge: true, printMass: true, plate: false }));
    return {
      title: 'Moles, Not Mass',
      prompt: 'Put the four tanks in order from lowest pressure on the left to highest on the right, at the same volume and temperature.',
      widget,
      table: gasTable({
        pieces: tanks,
        fixtures: [plate],
        zones: {
          rail: { id: 'rail', at: { x: 108, y: 42 }, size: { w: 80, h: 16 }, first: 'Lowest pressure', last: 'Highest pressure', items: ['a', 'b', 'c', 'd'], start: ['d', 'c', 'b', 'a'] }
        }
      }),
      hints: [
        'Use each tank\'s mass and molar mass to compare how many moles each holds.',
        'At the same volume and temperature, more moles means higher pressure, whatever the particles weigh.',
        'Convert each tank\'s grams to moles using the molar mass plaque before ordering them.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four tanks on the rail.' };
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => tankRead(t.pieces[x]).P - tankRead(t.pieces[y]).P);
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two adjacent tanks on the rail are in the wrong order.' };
      },
      reward: {
        log: 'More moles means higher pressure, not more grams.',
        title: 'Moles, Not Mass',
        body: 'The tank with the most moles has the highest pressure, even though it does not hold the most grams.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const nTotal = (OVER_WATER.total / 7.5006168 * 10) / (R * 298.15);
    const jar = rig('jar', { x: 36, y: 29 }, {
      cyls: [{ id: 'a', label: 'Jar over water', gas: 'N2', n: nTotal, hold: 'V', V: 10, T: 298.15, sealed: true }],
      volumes: [5, 10, 20], volumeStart: 2, vmax: 20, w: 62, units: 'mmHg',
      title: `Jar over water · H₂O = ${OVER_WATER.vapor} mmHg`, show: { amount: false, temperature: true, gauge: true, volume: true }
    });
    return {
      title: 'Gas Over Water',
      briefing: {
        speaker: 'Vess',
        body: `A gas collected over water is mixed with water vapour (${OVER_WATER.vapor} mmHg at 25 °C; 760 mmHg = 1 atm).`
      },
      prompt: 'What is the partial pressure of the gas alone in the jar at 10 L?',
      entry: { id: 'ans', label: 'Gas alone', unit: 'mmHg' },
      widget,
      table: gasTable({ fixtures: [jar] }),
      hints: [
        'Read the total pressure on the jar at 10 L and the water vapour pressure.',
        'The total pressure is the sum of the gas and the water vapour.',
        'Use Dalton\'s law for the two gases in the cylinder: the gas and the water vapour.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the pressure in mmHg.' };
        const want = OVER_WATER.total - OVER_WATER.vapor;
        if (Math.abs(v - want) / want < 0.01) return { ok: true };
        return { ok: false, msg: v > want ? 'The gas alone has less pressure than that.' : 'The gas alone has more pressure than that.' };
      },
      reward: {
        log: 'Total pressure minus water vapour.',
        title: 'Gas Over Water',
        body: 'The total, 752 mmHg, is the gas plus 24 mmHg of water vapour, so the gas alone is 728 mmHg.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Open both tanks into the common tank,', 'then place a card in the slot.'],
  3: ['Open all four tanks,', 'then type your answer at the bottom.'],
  4: ['Arrange the tanks along the strip.'],
  5: ['Type your answer in the field at the bottom.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'Summary',
      body: 'In a gas mixture, each gas has the same pressure it would have alone: its partial pressure. Partial pressures add up to the total pressure (Dalton\'s law), and each gas\'s partial pressure is its mole fraction times the total pressure.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('same', 'slot:predict')],
  [put('b', `tray:${VALVES}`), put('a', `tray:${VALVES}`), put('same', 'slot:show')],
  [put('a', `tray:${VALVES}`), put('b', `tray:${VALVES}`), put('c', `tray:${VALVES}`), put('d', `tray:${VALVES}`), typed('ans', '60')],
  [put('b', 'rail:0'), put('d', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')],
  [typed('ans', '728')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('b', `tray:${VALVES}`), put('a', `tray:${VALVES}`), put('higher', 'slot:show')],
  [put('a', `tray:${VALVES}`), put('b', `tray:${VALVES}`), put('c', `tray:${VALVES}`), put('d', `tray:${VALVES}`), typed('ans', '25')],
  [put('c', 'rail:0'), put('b', 'rail:1'), put('a', 'rail:2'), put('d', 'rail:3')],
  [typed('ans', '776')]
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

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { planMixture };
