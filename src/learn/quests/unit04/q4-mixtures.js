/**
 * q4-mixtures.js — Bellows, bench four: PARTIAL PRESSURES.
 *
 * The blending manifold on its pipe rack, on the gas kit (`table/kits/gas.js`). Every earlier bench held one gas. This one puts several in
 * a tank and asks what each is doing. The answer is the least expected thing about a gas: nothing. Each pushes as if the others were not
 * there, so a tank's reading is a sum, and any one gas's share of it can be found, counted and ranked.
 *
 * THE CLICK. Players expect crowds to crowd: add a second gas to a tank and the first must be squeezed, or must push harder. Stage 1
 * asks for that guess about neon and a helium let in beside it (a predict stage, no instrument); stage 2 opens the two tanks into the
 * common tank, which prints the push of each gas by its own shape of particle, and neon's push does not move. Only then is it named.
 *
 *   1  PREDICT: neon's own push when helium joins it
 *   2  TEST: open the tanks, read each gas's own push           -> Partial Pressure, Dalton's law
 *   3  open tanks until nitrogen is 60 percent of the push      -> Mole Fraction
 *   4  open each tank in turn, rank them by push                -> (the moles decide, never the weight)
 *   5  set the height where oxygen's own push has halved         -> Thin Air
 *   6  oxygen's own push in a tank, from its moles and the gauge -> Using Partial Pressures (a figure worked out)
 *   7  a gas collected over water: its own push beside the vapour  -> Gas Over Water (a figure worked out)
 *
 * (Cut as repeats: the pour-until-400 stage, which the test of stage 2 already shows; the push of one gas from a share, which stage 3
 * reads off the tank; adding argon, which is stage 2 again; and the trap that pulls one gas out, which was the same counting.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, tank, commonTank, commonRead, partialOf, tankRead, whereIs, planMixture, plaqueFixture, AIR, GASES
} from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, predictStage, youPredicted, guessOf, typed, entrySigned } from './_shared.js';
import { stmt } from '../../table/kits/gas.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bpartial pressures?\b/i, introducedAt: 2 },
  { term: /\bdalton.?s law\b/i, introducedAt: 2 },
  { term: /\bmole fractions?\b/i, introducedAt: 3 }
];

/** The gas laws, pressure, the mole and the push are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q2-laws'];

export const QUEST_KEY = 'unit04/q4-mixtures';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const CT = 'ct';
const VALVES = `${CT}.valves`;
const OPEN = `tray:${VALVES}`;

/** The tanks the bench opens: each the size of the common tank, so its own gauge is what its gas pushes there. */
const T0 = 300;
const V0 = 10;
export const HELIUM = { gas: 'He', n: 1 };
export const NEON = { gas: 'Ne', n: 0.6 };
export const GUESSES = [['same', 'The same'], ['lower', 'Lower'], ['higher', 'Higher']];
/** Stage 3's four tanks, all opened together: nitrogen's mole fraction is SHARE_N2. */
export const SHARE = [['a', 'He', 0.5], ['b', 'Ne', 0.5], ['c', 'N2', 1.5], ['d', 'CO2', 1.0]];
/** Stage 4's tanks (20 L, 300 K): the heaviest gas has fewer moles than the lightest. */
export const SHARE_N2 = 1.5 / 3.5;
export const RANK = [['a', 'N2', 1.0], ['b', 'CO2', 0.5], ['c', 'He', 1.5], ['d', 'Xe', 0.6]];
export const RANK_V = 20;
/** Stage 5: the same air at four heights, and the room (litres) it takes at each. */
export const HEIGHTS = [23.62, 33.76, 45.46, 67.74];
export const HEIGHT_NAMES = ['Sea level', '3000 m', '5500 m', '8850 m'];
export const AIR_T = 288.15;
/** Stage 5 accepts oxygen's own pressure within this much of half its sea-level figure (one dial setting does). */
export const HALF_TOL = 0.08;
export const AIR_PARTS = AIR.map(a => ({ gas: a.gas, n: a.n / 100 }));

/** Stage 6: a tank of nitrogen and oxygen whose face lists the moles of each, and the figures to lay: oxygen's own push, the slip of reading its moles as a share, nitrogen's push and the whole gauge. */
export const BLEND_TANK = [{ gas: 'N2', n: 0.6 }, { gas: 'O2', n: 0.2 }];
export const PUSH_CARDS = [['a', '50 kPa', 50], ['b', '40 kPa', 40], ['c', '150 kPa', 150], ['d', '200 kPa', 200]];

/** Stage 7: a jar of gas over water. The cards: the gas alone, the vapour added on (the slip), the vapour alone and the whole gauge. */
export const OVER_WATER = { total: 752, vapor: 24 };
export const WATER_CARDS = [['a', '728 mmHg', 728], ['b', '776 mmHg', 776], ['c', '24 mmHg', 24], ['d', '752 mmHg', 752]];

const t10 = (id, label, at, gas, n, extra = {}) => tank(id, label, at, { gas, n, V: V0, T: T0, gaugeMax: 400, ...extra });

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Mixture Pressure',
    prompt: 'Neon is in a tank by itself, then helium is added to the same tank: what happens to neon\'s own pressure?',
    items: GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Picture neon\'s particles flying about the tank, and ask whether helium\'s particles change how often they reach a wall.',
      'Ask whether one gas\'s knocks on the walls depend on what else is in the tank.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Connected tanks will now test whether adding a second gas alters individual gas pressure.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 30 }, { V: V0, T: T0, of: VALVES, show: { partials: true }, words: 2 });
    return {
      title: 'Individual Partial Pressures',
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'Open both tanks, then place the card for what neon\'s pressure did.', 'Open both tanks, then place the card for what neon\'s pressure did.');
      },
      widget,
      table: gasTable({
        pieces: [
          t10('a', 'TANK A', { x: 92, y: 9 }, HELIUM.gas, HELIUM.n), t10('b', 'TANK B', { x: 114, y: 9 }, NEON.gas, NEON.n),
          stmt('same', 'The same', { x: 90, y: 45 }), stmt('lower', 'Lower', { x: 128, y: 45 }), stmt('higher', 'Higher', { x: 109, y: 57.5 })
        ],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray], slots: [{ id: 'show', label: 'Prediction', at: { x: 109, y: 29 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Drag Tank B, then Tank A, into the tray under the common tank.',
        'Compare neon\'s pressure in the common tank with Tank B\'s gauge.',
        'Read the figure printed for neon after the first tank is open, then again after the second opens beside it.'
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
      get reward() {
        return {
          log: 'Neon exerts the same pressure alone and in the mix.',
          title: 'Partial Pressure',
          body: 'Each gas exerts the same pressure as if it were alone in the container, known as its partial pressure. The total pressure is the sum of all partial pressures, which is Dalton\'s law.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: V0, T: T0, of: VALVES, show: { partials: true }, words: 4 });
    const at = [[92, 16], [116, 16], [92, 40], [116, 40]];
    return {
      title: 'Partial Pressure Fraction',
      prompt: 'Type the fraction of the total pressure that nitrogen makes when all four tanks are open into the common tank.',
      entry: { id: 'ans', label: 'Nitrogen\'s share', unit: '' },
      widget,
      table: gasTable({
        pieces: SHARE.map(([id, gas, n], i) => t10(id, `TANK ${id.toUpperCase()}`, { x: at[i][0], y: at[i][1] }, gas, n, { showAmount: true, noGauge: true })),
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] }
      }),
      hints: [
        'Drag the tanks into the tray under the common tank, then type your answer.',
        'Compare nitrogen\'s own pressure with the total pressure in the common tank.',
        'Divide nitrogen\'s moles by the total moles of all four tanks, or its pressure by the total pressure.'
      ],
      check(state) {
        let v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type nitrogen\'s share as a fraction.' };
        if (v > 1) v /= 100;
        if (Math.abs(v - SHARE_N2) <= 0.01) return { ok: true };
        return { ok: false, msg: v < SHARE_N2 ? 'Nitrogen makes more of the total than that.' : 'Nitrogen makes less of the total than that.' };
      },
      reward: {
        log: 'A gas\'s mole share is its pressure share.',
        title: 'Mole Fraction',
        body: 'The ratio of moles of a gas to total moles is its mole fraction: the moles of the gas divided by total moles. In an ideal gas mixture, each gas contributes a fraction of total pressure equal to its mole fraction.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 30 }, { V: RANK_V, T: T0, of: VALVES, show: { partials: true }, words: 2 });
    const tanks = RANK.map(([id, gas, n], i) => tank(id, `TANK ${id.toUpperCase()}`, { x: 0, y: 0 }, { gas, n, V: RANK_V, T: T0, noGauge: true, printMass: true, plate: false }));
    return {
      title: 'Pressure Ranking by Mole Count',
      prompt: 'Arrange the four tanks on the rail from highest pressure to lowest pressure.',
      widget,
      table: gasTable({
        pieces: tanks,
        fixtures: [ct.fixture],
        zones: {
          trays: [ct.tray],
          rail: { id: 'rail', at: { x: 108, y: 48 }, size: { w: 80, h: 16 }, first: 'Highest pressure', last: 'Lowest pressure', items: ['a', 'b', 'c', 'd'], start: ['a', 'b', 'c', 'd'] }
        }
      }),
      hints: [
        'Drag a tank into the common tank tray to read its pressure, then return it to the rail.',
        'Compare the pressures of tanks with equal volume and temperature rather than their masses.',
        'Open each tank into the common tank in turn and rank the tanks by the figure each one prints.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four tanks on the rail.' };
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => tankRead(t.pieces[y]).P - tankRead(t.pieces[x]).P);
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two adjacent tanks on the rail are in the wrong order.' };
      },
      reward: {
        log: 'Mole count determines pressure.',
        title: 'Moles Determine Pressure',
        body: 'At equal volume and temperature, the gas with the most moles produces the highest pressure regardless of molecular mass. Heavier molecules move slower while lighter molecules move faster, balancing out.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 32 }, {
      V: HEIGHTS[0], T: AIR_T, of: VALVES, volumes: HEIGHTS, volumeStart: 1, volumeNames: HEIGHT_NAMES, volumeLabel: 'Height', show: { partials: true, share: true }, words: 3
    });
    return {
      title: 'Atmospheric Pressure and Altitude',
      prompt: 'Set the Height dial so oxygen\'s own pressure is half its sea-level pressure.',
      widget,
      table: gasTable({
        pieces: [tank('air', 'AIR', { x: 0, y: 0 }, { parts: AIR_PARTS, V: HEIGHTS[0], T: AIR_T, plate: true, gaugeMax: 150, zone: OPEN })],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] }
      }),
      hints: [
        'Turn the Height dial.',
        'Compare oxygen\'s own pressure at each height with its figure at sea level.',
        'The air keeps its mixture as it thins, so look for the height where the total pressure has halved.'
      ],
      check(state) {
        const t = state.table;
        const k = Math.round(t.fixtures[CT].dials.volume.value);
        if (k === 1) return { ok: false, notYet: true, msg: 'Turn the Height dial.' };
        const at = j => partialOf(commonRead({ ...t, fixtures: { ...t.fixtures, [CT]: { ...t.fixtures[CT], dials: { ...t.fixtures[CT].dials, volume: { ...t.fixtures[CT].dials.volume, value: j } } } } }, CT), 'O2');
        const ratio = at(k) / at(1);
        if (Math.abs(ratio - 0.5) <= HALF_TOL) return { ok: true };
        return { ok: false, msg: ratio > 0.5 ? 'Oxygen\'s pressure here is more than half its sea-level figure.' : 'Oxygen\'s pressure here is less than half its sea-level figure.' };
      },
      reward: {
        log: 'Oxygen\'s own pressure falls with the air\'s.',
        title: 'Atmospheric Pressure at Altitude',
        body: 'Air keeps its mixture as it thins: oxygen stays about a fifth of the particles at every height. So oxygen\'s own pressure falls exactly as the air\'s does, and halves where the air pressure halves.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const total = planMixture(BLEND_TANK, T0, V0).P;
    const plate = plaqueFixture('plate', 'Tank M', { x: 32, y: 33 }, [`Gauge: ${Math.round(total)} kPa`, `Room: ${V0} L, ${T0} K`, 'Nitrogen: 0.6 mol', 'Oxygen: 0.2 mol'], { w: 52 });
    return {
      title: 'Using Partial Pressures',
      prompt: 'Type the pressure oxygen alone makes in Tank M.',
      entry: { id: 'ans', label: 'Oxygen alone', unit: 'kPa' },
      widget,
      table: gasTable({
        fixtures: [plate],
      }),
      hints: [
        'Read the gauge and the moles of each gas from the tank\'s plate.',
        'Find oxygen\'s share of all the moles in the tank.',
        'Multiply that share by the tank\'s gauge.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the figure in kPa.' };
        const r = planMixture(BLEND_TANK, T0, V0);
        const want = r.rows.find(x => x.gas === 'O2').P;
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: v > want ? 'Oxygen alone makes less than that.' : 'Oxygen alone makes more than that.' };
      },
      reward: {
        log: 'A gas\'s share of the moles is its share of the gauge.',
        title: 'Using Partial Pressures',
        body: 'Oxygen is 0.2 of 0.8 mol, a mole fraction of 0.25, so its partial pressure is 0.25 × 200 kPa = 50 kPa. The partial pressures add back to the gauge: 150 + 50 = 200 kPa.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const plate = plaqueFixture('plate', 'Gas over water', { x: 32, y: 33 }, [`Jar gauge: ${OVER_WATER.total} mmHg`, `Water vapour: ${OVER_WATER.vapor} mmHg`, 'The jar holds only the gas and the vapour'], { w: 62 });
    return {
      title: 'Gas Over Water',
      prompt: 'Type the pressure of the gas alone in the jar, apart from the water vapour.',
      entry: { id: 'ans', label: 'Gas alone', unit: 'mmHg' },
      widget,
      table: gasTable({
        fixtures: [plate],
      }),
      hints: [
        'Read the figures from the plate, then type the result.',
        'The gauge counts every gas in the jar, and the water vapour is one of them.',
        'Take the pressure of the water vapour away from the gauge.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'ans');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the figure in mmHg.' };
        const want = OVER_WATER.total - OVER_WATER.vapor;
        if (Math.abs(v - want) / want < 0.01) return { ok: true };
        return { ok: false, msg: v > want ? 'The gas alone pushes less than that.' : 'The gas alone pushes more than that.' };
      },
      reward: {
        log: 'The jar\'s gauge is the gas plus the vapour.',
        title: 'Gas Over Water',
        body: 'The partial pressures add to the gauge: 752 mmHg = P(gas) + 24 mmHg. So the gas alone pushes 752 − 24 = 728 mmHg.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const plate = plaqueFixture('plate', 'Jar over water', { x: 32, y: 33 }, [`Gauge: ${OVER_WATER.total} mmHg`, `Water vapour: ${OVER_WATER.vapor} mmHg`, 'The student used the whole gauge', 'as the pressure of the dry gas.'], { w: 56 });
    return {
      title: 'A Forgotten Correction',
      prompt: 'Type the percentage error in the moles of dry gas, with a minus sign if the student\'s figure is too low.',
      entry: { id: 'ans', label: 'Error in moles', unit: '%' },
      widget,
      table: gasTable({
        fixtures: [plate],
      }),
      hints: [
        'Read the figures from the plate, then type the result.',
        'The moles are in step with the pressure used, so compare the pressure the student used with the pressure the dry gas really has.',
        'Percentage error is the difference between the student\'s figure and the true figure, divided by the true figure, times 100.'
      ],
      check(state) {
        const v = entrySigned(state.table, 'ans');
        if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the error as a percentage.' };
        const want = VAPOUR_ERROR_PCT();
        if (Math.abs(v - want) <= 0.06) return { ok: true };
        if (Math.abs(v + want) <= 0.06) return { ok: false, msg: 'The size is close, but the student\'s figure lies on the other side of the true one.' };
        return { ok: false, msg: 'Divide the difference by the true pressure of the dry gas, not by the gauge.' };
      },
      reward: {
        log: 'Leaving out the vapour overstates the moles.',
        title: 'Percentage Error',
        body: 'The student used 752 mmHg where the dry gas pushes 728 mmHg, so the moles come out (752 − 728) ÷ 728 × 100 = 3.3% too high. A percentage error is the difference divided by the true value, and a systematic slip like this one always pushes the same way.',
        last: true
      }
    };
  })()
];

/** Stage 8: the percentage by which the moles come out too high when the vapour is not subtracted. */
export const VAPOUR_ERROR_PCT = () => ((OVER_WATER.total - (OVER_WATER.total - OVER_WATER.vapor)) / (OVER_WATER.total - OVER_WATER.vapor)) * 100;

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Open both tanks, then place a card in the slot.'],
  3: ['Drag tanks into the tray,', 'then type your answer in the field at the bottom.'],
  4: ['Open one tank at a time to read its pressure,', 'then place it on the rail.'],
  5: ['Turn the Height dial.'],
  6: ['Type your answer in the field at the bottom.'],
  7: ['Type your answer in the field at the bottom.'],
  8: ['Type your answer in the field at the bottom.']
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
      body: 'Every gas in a mixture exerts pressure independently as a partial pressure. The total pressure is the sum of all partial pressures, with each share determined by mole fraction.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('same', 'slot:predict')],
  [put('b', OPEN), put('a', OPEN), put('same', 'slot:show')],
  [put('c', OPEN), put('a', OPEN), put('b', OPEN), put('d', OPEN), typed('ans', '0.43')],
  [
    put('c', OPEN), put('c', 'rail:0'), put('a', OPEN), put('a', 'rail:1'), put('d', OPEN), put('d', 'rail:2'), put('b', OPEN), put('b', 'rail:3')
  ],
  [dial(CT, 'volume', 3)],
  [typed('ans', "50")],
  [typed('ans', "728")],
  [typed('ans', '3.3')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('b', OPEN), put('a', OPEN), put('lower', 'slot:show')],
  [put('c', OPEN), typed('ans', '0.6')],
  [put('d', 'rail:0'), put('b', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')],
  [dial(CT, 'volume', 4)],
  [typed('ans', "40")],
  [typed('ans', "776")],
  [typed('ans', '-3.3')]
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
export { commonRead, partialOf, tankRead, planMixture, GASES };
