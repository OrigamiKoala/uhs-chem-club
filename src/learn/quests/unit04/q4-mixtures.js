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
    prompt: 'When helium is added to a tank of neon at the same temperature, what happens to the neon\'s own pressure?',
    items: GUESSES,
    hints: [
      'Think about whether adding helium changes how fast or how often neon particles hit the walls.',
      'Gas is mostly empty space, so neon particles keep moving across the tank as before.',
      'Ask whether neon\'s wall collisions depend on another gas sharing the same container.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Your guess is locked in. Next, you will open two tanks into a common tank to test neon\'s pressure.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: V0, T: T0, of: VALVES, show: { partials: true }, words: 2 });
    return {
      title: 'Each Gas Alone',
      prompt: 'When helium joins neon in the common tank, what happens to neon\'s own pressure?',
      widget,
      table: gasTable({
        pieces: [
          t10('a', 'TANK A', { x: 88, y: 12 }, HELIUM.gas, HELIUM.n), t10('b', 'TANK B', { x: 124, y: 12 }, NEON.gas, NEON.n),
          stmt('same', 'The same', { x: 90, y: 45 }), stmt('lower', 'Lower', { x: 128, y: 45 }), stmt('higher', 'Higher', { x: 109, y: 57.5 })
        ],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray], slots: [{ id: 'show', label: 'What neon\'s pressure did', at: { x: 109, y: 29 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Drag Tank B (neon), then Tank A (helium), into the drop tray below the common tank.',
        'Watch neon\'s pressure reading when it is alone, then again after helium opens beside it.',
        'Compare neon\'s pressure before and after adding helium, then pick the matching card.'
      ],
      check(state) {
        const t = state.table;
        const open = Object.values(t.pieces).filter(p => p.zone === `tray:${VALVES}`);
        if (open.length < 2) return { ok: false, notYet: true, msg: 'Open both Tank A and Tank B into the common tank first so you can compare neon\'s pressure.' };
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const alone = planMixture([{ gas: NEON.gas, n: NEON.n }], T0, V0).rows[0].P;
        const mixed = planMixture([{ gas: HELIUM.gas, n: HELIUM.n }, { gas: NEON.gas, n: NEON.n }], T0, V0).rows.find(r => r.gas === NEON.gas).P;
        const want = Math.abs(mixed - alone) < 1e-6 ? 'same' : mixed < alone ? 'lower' : 'higher';
        if (card.id === want) return { ok: true };
        return { ok: false, msg: `Neon's own pressure stayed at ${Math.round(alone)} kPa when helium joined it.` };
      },
      reward: {
        log: 'Neon has the same pressure alone and in the mixture.',
        title: 'Partial Pressure',
        body: 'Neon kept its own 150 kPa pressure when helium joined it. Each gas\'s own pressure is its partial pressure, and they add to the total (Dalton\'s law).',
        model: { type: 'bellows-scene', scene: 'mix-share' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const ct = commonTank(CT, { x: 39, y: 31 }, { V: SHARE_V, T: T0, of: VALVES, show: { partials: false }, words: 4, w: 72 });
    const at = [[96, 15], [128, 15], [96, 43], [128, 43]];
    return {
      title: 'A Gas\'s Share',
      briefing: {
        speaker: 'Vess',
        body: 'A gas\'s mole fraction is its moles divided by all the moles in the mixture. Its partial pressure is that fraction of the total pressure.'
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
        'Drag all four tanks into the drop tray below the common tank to read the total pressure.',
        'Add up the moles from all four tanks, then divide nitrogen\'s moles by that total to find its mole fraction.',
        'Multiply nitrogen\'s mole fraction by the total pressure in the common tank.'
      ],
      check(state) {
        const t = state.table;
        const open = Object.values(t.pieces).filter(p => p.zone === `tray:${VALVES}`);
        if (open.length < 4) return { ok: false, notYet: true, msg: 'Open all four tanks into the common tank first to read the total pressure.' };
        const v = entryNumber(t, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the pressure in kPa.' };
        const totalP = planMixture(SHARE.map(([, gas, n]) => ({ gas, n })), T0, SHARE_V).P;
        const want = SHARE_N2 * totalP;
        if (Math.abs(v - want) <= 1.5) return { ok: true };
        if (v >= totalP - 5) return { ok: false, msg: 'Nitrogen is only part of the mixture: 100 kPa is the total pressure of all four gases together.' };
        return { ok: false, msg: v < want ? 'Nitrogen\'s partial pressure is higher than that. Check nitrogen\'s fraction of the total 4.0 mol.' : 'Nitrogen\'s partial pressure is lower than that. Check nitrogen\'s fraction of the total 4.0 mol.' };
      },
      reward: {
        log: 'A gas\'s mole fraction gives its share of the total pressure.',
        title: 'Mole Fraction',
        body: 'Nitrogen is 2.4 of the 4.0 mol (a mole fraction of 0.60), so its partial pressure is 60 kPa of the 100 kPa total.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const plate = plaqueFixture('plate', 'Molar masses', { x: 24, y: 30 }, [
      'He: 4 g/mol',
      'N₂: 28 g/mol',
      'CO₂: 44 g/mol',
      'Xe: 131 g/mol'
    ], { w: 42 });
    const tanks = RANK.map(([id, gas, n]) => tank(id, `TANK ${id.toUpperCase()}`, { x: 0, y: 0 }, { gas, n, V: RANK_V, T: T0, noGauge: true, printMass: true, plate: false }));
    return {
      title: 'Moles, Not Mass',
      prompt: 'Order the four tanks from lowest pressure (left) to highest (right), all at the same volume and temperature.',
      widget,
      table: gasTable({
        pieces: tanks,
        fixtures: [plate],
        zones: {
          rail: { id: 'rail', at: { x: 102, y: 42 }, size: { w: 92, h: 16 }, first: 'Lowest pressure', last: 'Highest pressure', items: ['a', 'b', 'c', 'd'], start: ['d', 'c', 'b', 'a'] }
        }
      }),
      hints: [
        'Divide each tank\'s grams by its molar mass on the plaque to find how many moles it holds.',
        'At the same volume and temperature, more moles always means higher pressure, no matter how heavy the particles are.',
        'Fewer moles means lower pressure, and more moles means higher pressure.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four tanks on the strip.' };
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => tankRead(t.pieces[x]).P - tankRead(t.pieces[y]).P);
        if (order.join() === want.join()) return { ok: true };
        for (let i = 0; i < order.length - 1; i++) {
          if (tankRead(t.pieces[order[i]]).P > tankRead(t.pieces[order[i + 1]]).P) {
            return { ok: false, msg: `${t.pieces[order[i]].label} and ${t.pieces[order[i + 1]].label} are in the wrong order.` };
          }
        }
        return { ok: false, msg: 'Two adjacent tanks on the strip are in the wrong order.' };
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
    const jar = rig('jar', { x: 75, y: 31 }, {
      cyls: [{ id: 'a', label: 'Jar over water', gas: 'N2', n: nTotal, hold: 'V', V: 10, T: 298.15, sealed: true }],
      vmax: 20, w: 76, units: 'mmHg', overWater: true,
      title: `Jar over water · H₂O = ${OVER_WATER.vapor} mmHg`, show: { amount: false, temperature: true, gauge: true, volume: true }
    });
    return {
      title: 'Gas Over Water',
      briefing: {
        speaker: 'Vess',
        body: `Pressure can also be measured in mmHg (760 mmHg = 1 atm). A gas collected over water is mixed with water vapor (${OVER_WATER.vapor} mmHg at 25 °C), so subtract the water vapor pressure from the total.`
      },
      prompt: 'If a jar over water reads 752 mmHg total (including 24 mmHg of water vapor), what is the partial pressure of the gas alone?',
      entry: { id: 'ans', label: 'Gas alone', unit: 'mmHg' },
      widget,
      table: gasTable({ fixtures: [jar] }),
      hints: [
        'Read the total pressure on the jar (752 mmHg) and the water vapor pressure (24 mmHg).',
        'By Dalton\'s law, total pressure equals the dry gas\'s pressure plus the water vapor pressure.',
        'Subtract the water vapor pressure from the total pressure to leave the gas alone.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the pressure in mmHg.' };
        const want = OVER_WATER.total - OVER_WATER.vapor;
        if (Math.abs(v - want) / want < 0.01) return { ok: true };
        if (Math.abs(v - OVER_WATER.total) < 2) return { ok: false, msg: '752 mmHg includes the 24 mmHg of water vapor. Subtract it to get the gas alone.' };
        return { ok: false, msg: v > want ? 'The gas alone has less pressure than that; subtract the 24 mmHg of water vapor.' : 'The gas alone has more pressure than that; check 752 − 24.' };
      },
      reward: {
        log: 'Total pressure minus water vapor.',
        title: 'Gas Over Water',
        body: 'The total, 752 mmHg, is the gas plus 24 mmHg of water vapor, so the gas alone is 728 mmHg.',
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
