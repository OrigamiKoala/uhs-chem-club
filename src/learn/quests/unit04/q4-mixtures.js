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
 *   5  sort what changes as the air gets thinner                -> Thin Air
 *   6  oxygen's own push in a tank, from its moles and the gauge -> Using Partial Pressures (a figure worked out)
 *
 * (Cut as repeats: the pour-until-400 stage, which the test of stage 2 already shows; the push of one gas from a share, which stage 3
 * reads off the tank; adding argon, which is stage 2 again; and the trap that pulls one gas out, which was the same counting.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, tank, chip, commonTank, commonRead, partialOf, tankRead, whereIs, planMixture, plaqueFixture, AIR, GASES
} from '../../table/kits/gas.js';
import { widget, put, dial, sort, cardIn, predictStage, youPredicted, guessOf, answerCards, answerSlot, answerOf } from './_shared.js';
import { stmt } from '../../table/kits/gas.js';

export const meta = { stageCount: 6 };

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
/** Stage 3's four tanks: nitrogen is 60 percent of the moles with the helium and the neon, or with the carbon dioxide alone. */
export const SHARE = [['a', 'He', 0.5], ['b', 'Ne', 0.5], ['c', 'N2', 1.5], ['d', 'CO2', 1.0]];
/** Stage 4's tanks (20 L, 300 K): the heaviest gas has fewer moles than the lightest. */
export const RANK = [['a', 'N2', 1.0], ['b', 'CO2', 0.5], ['c', 'He', 1.5], ['d', 'Xe', 0.6]];
export const RANK_V = 20;
/** Stage 5: the same air at four heights, and the room (litres) it takes at each. */
export const HEIGHTS = [23.62, 33.76, 45.46, 67.74];
export const HEIGHT_NAMES = ['Sea level', '3000 m', '5500 m', '8850 m'];
export const AIR_T = 288.15;
export const AIR_PARTS = AIR.map(a => ({ gas: a.gas, n: a.n / 100 }));

/** Stage 6: a tank of nitrogen and oxygen whose face lists the moles of each, and the figures to lay: oxygen's own push, the slip of reading its moles as a share, nitrogen's push and the whole gauge. */
export const BLEND_TANK = [{ gas: 'N2', n: 0.6 }, { gas: 'O2', n: 0.2 }];
export const PUSH_CARDS = [['a', '50 kPa', 50], ['b', '40 kPa', 40], ['c', '150 kPa', 150], ['d', '200 kPa', 200]];

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
          t10('a', 'TANK A', { x: 92, y: 12 }, HELIUM.gas, HELIUM.n), t10('b', 'TANK B', { x: 114, y: 12 }, NEON.gas, NEON.n),
          stmt('same', 'The same', { x: 90, y: 45 }), stmt('lower', 'Lower', { x: 128, y: 45 }), stmt('higher', 'Higher', { x: 109, y: 57.5 })
        ],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray], slots: [{ id: 'show', label: 'Prediction', at: { x: 109, y: 29 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Drag Tank B, then Tank A, into the tray under the common tank.',
        'Compare neon\'s pressure in the common tank with Tank B\'s gauge.',
        'Place the card matching neon\'s pressure change when the second tank opened.'
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
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: V0, T: T0, of: VALVES, show: { partials: true, share: true }, words: 4 });
    const at = [[92, 16], [116, 16], [92, 40], [116, 40]];
    return {
      title: 'Partial Pressure Fraction',
      prompt: 'Open tanks into the common tank until nitrogen makes up 60 percent of the total pressure.',
      widget,
      table: gasTable({
        pieces: SHARE.map(([id, gas, n], i) => t10(id, `TANK ${id.toUpperCase()}`, { x: at[i][0], y: at[i][1] }, gas, n, { showAmount: true, noGauge: true })),
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] }
      }),
      hints: [
        'Drag tanks into or out of the tray under the common tank.',
        'Compare each gas\'s share of the pressure with its share of the moles.',
        'Select tanks so that nitrogen provides 60 percent of the total moles.'
      ],
      check(state) {
        const t = state.table;
        const rd = commonRead(t, CT);
        if (!rd.tanks.length) return { ok: false, notYet: true, msg: 'Open a tank into the common tank first.' };
        const n2 = partialOf(rd, 'N2');
        const share = rd.P > 0 ? n2 / rd.P : 0;
        if (n2 > 0 && Math.abs(share - 0.6) < 0.005) return { ok: true };
        return { ok: false, msg: share < 0.6 ? 'Nitrogen makes up less than 60 percent of the total pressure.' : 'Nitrogen makes up more than 60 percent of the total pressure.' };
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
        'Place the tank with the highest pressure at the left end of the rail.'
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
    const things = [['o2share', 'OXYGEN SHARE'], ['o2push', 'OXYGEN PUSH'], ['total', 'TOTAL PUSH'], ['n2share', 'NITROGEN SHARE']];
    return {
      title: 'Atmospheric Pressure and Altitude',
      prompt: 'Turn the Height dial, then sort each reading by whether it falls as altitude increases.',
      widget,
      table: gasTable({
        pieces: [
          tank('air', 'AIR', { x: 0, y: 0 }, { parts: AIR_PARTS, V: HEIGHTS[0], T: AIR_T, plate: true, gaugeMax: 150, zone: OPEN }),
          ...things.map(([id, label], i) => chip(id, label, { x: 84 + (i % 2) * 20, y: 12 + Math.floor(i / 2) * 13 }))
        ],
        fixtures: [ct.fixture],
        zones: {
          trays: [
            ct.tray,
            { id: 'falls', label: 'Decreases with altitude', at: { x: 90, y: 49 }, size: { w: 36, h: 22 }, cell: 17 },
            { id: 'stays', label: 'Constant with altitude', at: { x: 128, y: 49 }, size: { w: 28, h: 22 }, cell: 15 }
          ]
        }
      }),
      hints: [
        'Turn the Height dial to change altitude.',
        'Compare each reading at sea level with its value at maximum altitude.',
        'Place a reading in the falling tray only if its value decreases at higher altitude.'
      ],
      check(state) {
        const t = state.table;
        if (!things.every(([id]) => ['falls', 'stays'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Place every reading in a tray.' };
        if (Math.round(t.fixtures[CT].dials.volume.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Height dial to observe readings at altitude.' };
        const at = k => commonRead({ ...t, fixtures: { ...t.fixtures, [CT]: { ...t.fixtures[CT], dials: { ...t.fixtures[CT].dials, volume: { ...t.fixtures[CT].dials.volume, value: k } } } } }, CT);
        const lo = at(1);
        const hi = at(HEIGHTS.length);
        const share = (r, g) => partialOf(r, g) / r.P;
        const falls = {
          o2share: share(hi, 'O2') < share(lo, 'O2') - 1e-6, o2push: partialOf(hi, 'O2') < partialOf(lo, 'O2') - 1e-6,
          total: hi.P < lo.P - 1e-6, n2share: share(hi, 'N2') < share(lo, 'N2') - 1e-6
        };
        if (things.some(([id]) => whereIs(t, id) === 'falls' && !falls[id])) return { ok: false, msg: 'A reading placed in the decreasing tray does not decrease with altitude.' };
        if (things.some(([id]) => whereIs(t, id) === 'stays' && falls[id])) return { ok: false, msg: 'A reading placed in the constant tray decreases with altitude.' };
        return { ok: true };
      },
      reward: {
        log: 'Atmospheric pressure drops while mixture proportions stay constant.',
        title: 'Atmospheric Pressure at Altitude',
        body: 'At higher altitudes, atmospheric pressure drops while the mole fraction of each gas stays constant. The partial pressure of oxygen decreases in direct proportion to the total pressure drop.'
      }
    };
  })()  ,

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const total = planMixture(BLEND_TANK, T0, V0).P;
    const plate = plaqueFixture('plate', 'Tank M', { x: 32, y: 33 }, [`Gauge: ${Math.round(total)} kPa`, `Room: ${V0} L, ${T0} K`, 'Nitrogen: 0.6 mol', 'Oxygen: 0.2 mol'], { w: 52 });
    return {
      title: 'Using Partial Pressures',
      prompt: 'Lay the card for the pressure oxygen alone makes in Tank M.',
      widget,
      table: gasTable({
        pieces: answerCards(PUSH_CARDS),
        fixtures: [plate],
        zones: { slots: [answerSlot('Oxygen alone')] }
      }),
      hints: [
        'Read the gauge and the moles of each gas from the tank\'s plate.',
        'Find oxygen\'s share of all the moles in the tank.',
        'Multiply that share by the tank\'s gauge.'
      ],
      check(state) {
        const v = answerOf(state.table, PUSH_CARDS);
        if (v == null) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const r = planMixture(BLEND_TANK, T0, V0);
        const want = r.rows.find(x => x.gas === 'O2').P;
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: v > want ? 'Oxygen alone makes less than that.' : 'Oxygen alone makes more than that.' };
      },
      reward: {
        log: 'A gas\'s share of the moles is its share of the gauge.',
        title: 'Using Partial Pressures',
        body: 'Oxygen is 0.2 of 0.8 mol, a mole fraction of 0.25, so its partial pressure is 0.25 × 200 kPa = 50 kPa. The partial pressures add back to the gauge: 150 + 50 = 200 kPa.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Open both tanks, then place a card in the slot.'],
  3: ['Drag tanks into or out of the tray.'],
  4: ['Open one tank at a time to read its pressure,', 'then place it on the rail.'],
  5: ['Turn the Height dial, then sort each reading into a tray.'],
  6: ['Place a card in the slot.']
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
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Helium is added to a tank that already holds neon, at the same temperature. What happens to the neon\'s partial pressure?',
    options: [
      { id: 'a', label: 'It stays the same' },
      { id: 'b', label: 'It rises, because the tank is more crowded' },
      { id: 'c', label: 'It falls, because the helium takes up room' },
      { id: 'd', label: 'It becomes the same as the helium\'s' }
    ],
    answer: 'a',
    explanation: 'Each gas pushes as if it were alone, so adding helium adds its own push and leaves the neon\'s where it was.'
  },
  {
    question: 'A tank holds 0.4 mol of nitrogen and 0.1 mol of oxygen and reads 250 kPa. What is the partial pressure of the oxygen?',
    options: [
      { id: 'a', label: '50 kPa' },
      { id: 'b', label: '100 kPa' },
      { id: 'c', label: '200 kPa' },
      { id: 'd', label: '25 kPa' }
    ],
    answer: 'a',
    explanation: 'Oxygen is 0.1 of 0.5 mol, a mole fraction of 0.2, and 0.2 × 250 = 50 kPa.'
  },
  {
    question: 'Two gases are in tanks of the same size at the same temperature. Tank X has more moles but lighter particles. Which pushes harder?',
    options: [
      { id: 'a', label: 'Tank X, the one with more moles' },
      { id: 'b', label: 'The tank with the heavier particles' },
      { id: 'c', label: 'They push equally' },
      { id: 'd', label: 'It depends on the gas' }
    ],
    answer: 'a',
    explanation: 'In the same room at the same temperature, the push goes with the number of moles, whatever the particles weigh.'
  },
  {
    question: 'Climbing a mountain, you feel short of breath. What has happened to the mole fraction of oxygen in the air?',
    options: [
      { id: 'a', label: 'It is the same; the total pressure is lower' },
      { id: 'b', label: 'It is much lower' },
      { id: 'c', label: 'It is much higher' },
      { id: 'd', label: 'It has dropped to zero' }
    ],
    answer: 'a',
    explanation: 'The air is the same mixture, about 21 percent oxygen, but thinner, so oxygen\'s partial pressure falls with the total.'
  },
  {
    question: 'The gauge of a mixture reads 300 kPa. Gas A pushes with 120 kPa and gas B with 100 kPa; there is one more gas, C. What is C\'s partial pressure?',
    options: [
      { id: 'a', label: '80 kPa' },
      { id: 'b', label: '100 kPa' },
      { id: 'c', label: '120 kPa' },
      { id: 'd', label: '520 kPa' }
    ],
    answer: 'a',
    explanation: 'The partial pressures add up to the total (Dalton\'s law): 300 − 120 − 100 = 80 kPa.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('same', 'slot:predict')],
  [put('b', OPEN), put('a', OPEN), put('same', 'slot:show')],
  [put('c', OPEN), put('a', OPEN), put('b', OPEN)],
  [
    put('c', OPEN), put('c', 'rail:0'), put('a', OPEN), put('a', 'rail:1'), put('d', OPEN), put('d', 'rail:2'), put('b', OPEN), put('b', 'rail:3')
  ],
  [dial(CT, 'volume', 4), ...sort({ o2share: 'stays', n2share: 'stays', o2push: 'falls', total: 'falls' })],
  [put('a', 'slot:answer')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('b', OPEN), put('a', OPEN), put('lower', 'slot:show')],
  [put('c', OPEN)],
  [put('d', 'rail:0'), put('b', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')],
  [dial(CT, 'volume', 4), ...sort({ o2share: 'falls', n2share: 'stays', o2push: 'falls', total: 'falls' })],
  [put('b', 'slot:answer')]
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
