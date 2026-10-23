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
 *
 * (Cut as repeats: the pour-until-400 stage, which the test of stage 2 already shows; the push of one gas from a share, which stage 3
 * reads off the tank; adding argon, which is stage 2 again; and the trap that pulls one gas out, which was the same counting.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, tank, chip, commonTank, commonRead, partialOf, tankRead, whereIs, planMixture, AIR, GASES
} from '../../table/kits/gas.js';
import { widget, put, dial, sort, cardIn, predictStage, youPredicted, guessOf } from './_shared.js';
import { stmt } from '../../table/kits/gas.js';

export const meta = { stageCount: 5 };

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

const t10 = (id, label, at, gas, n, extra = {}) => tank(id, label, at, { gas, n, V: V0, T: T0, gaugeMax: 400, ...extra });

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Guess the Crowd',
    prompt: 'Neon pushes on a tank\'s walls by itself, then helium is let into the same tank: what happens to neon\'s own push?',
    items: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Picture two kinds of particle in one tank: do they get in each other\'s way on the walls?',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    reward: {
      log: 'Prediction locked in.',
      title: 'A Guess Worth Testing',
      body: 'Two tanks and a common tank that reads each gas separately are about to be set out, and neon\'s own figure will say whether the guess holds.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 30 }, { V: V0, T: T0, of: VALVES, show: { partials: true }, words: 2 });
    return {
      title: 'Each Alone',
      get prompt() {
        return youPredicted(QUEST_KEY, GUESSES, 'open both tanks, then lay the card for what neon\'s own push did.', 'Open both tanks, then lay the card for what neon\'s own push did.');
      },
      widget,
      table: gasTable({
        pieces: [
          t10('a', 'TANK A', { x: 92, y: 12 }, HELIUM.gas, HELIUM.n), t10('b', 'TANK B', { x: 114, y: 12 }, NEON.gas, NEON.n),
          stmt('same', 'The same', { x: 90, y: 45 }), stmt('lower', 'Lower', { x: 128, y: 45 }), stmt('higher', 'Higher', { x: 109, y: 57.5 })
        ],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray], slots: [{ id: 'show', label: 'What neon\'s push did', at: { x: 109, y: 29 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Drag Tank B, then Tank A, into the place under the common tank.',
        'Compare neon\'s figure in the common tank with Tank B\'s own gauge.',
        'Lay the card that says what neon\'s figure did when the second tank was opened.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const alone = planMixture([{ gas: NEON.gas, n: NEON.n }], T0, V0).rows[0].P;
        const mixed = planMixture([{ gas: HELIUM.gas, n: HELIUM.n }, { gas: NEON.gas, n: NEON.n }], T0, V0).rows.find(r => r.gas === NEON.gas).P;
        const want = Math.abs(mixed - alone) < 1e-6 ? 'same' : mixed < alone ? 'lower' : 'higher';
        if (card.id === want) return { ok: true };
        return { ok: false, msg: `Neon's own push is no ${card.id === 'lower' ? 'lower' : 'higher'} with the helium in the tank.` };
      },
      get reward() {
        const g = guessOf(QUEST_KEY, GUESSES);
        const verdict = !g ? '' : g.id === 'same' ? 'You predicted this one, and the tank agreed. ' : 'The tank did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'Neon pushes the same alone and in the mix.',
          title: 'Partial Pressure',
          body: `${verdict}Each gas pushes as hard as it would if it were alone in the tank, and that share is its partial pressure. The gauge's total is just the partial pressures added together, which is Dalton's law.`,
          model: {
            type: 'gas',
            boxes: [{ label: 'One tank', w: 3.2, parts: [{ kind: 'He', n: 12 }, { kind: 'Ne', n: 7 }] }],
            caption: 'Helium (12 particles) and neon (7) in one tank: each knocks the walls as if the other were not there. Not to scale.'
          }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: V0, T: T0, of: VALVES, show: { partials: true, share: true }, words: 4 });
    const at = [[92, 16], [116, 16], [92, 40], [116, 40]];
    return {
      title: 'A Share of the Push',
      prompt: 'Open tanks into the common tank until nitrogen makes up 60 percent of the push.',
      widget,
      table: gasTable({
        pieces: SHARE.map(([id, gas, n], i) => t10(id, `TANK ${id.toUpperCase()}`, { x: at[i][0], y: at[i][1] }, gas, n, { showAmount: true, noGauge: true })),
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] }
      }),
      hints: [
        'Drag tanks into the place under the common tank, or out of it.',
        'Compare each gas\'s share of the push with the share of the moles it has among the tanks you opened.',
        'Choose tanks whose moles of nitrogen are the share asked for of all the moles in the common tank.'
      ],
      check(state) {
        const t = state.table;
        const rd = commonRead(t, CT);
        if (!rd.tanks.length) return { ok: false, notYet: true, msg: 'Open a tank into the common tank first.' };
        const n2 = partialOf(rd, 'N2');
        const share = rd.P > 0 ? n2 / rd.P : 0;
        if (n2 > 0 && Math.abs(share - 0.6) < 0.005) return { ok: true };
        return { ok: false, msg: share < 0.6 ? 'Nitrogen\'s share of the push is below the share asked for.' : 'Nitrogen\'s share of the push is above the share asked for.' };
      },
      reward: {
        log: 'A gas\'s share of the moles is its share of the push.',
        title: 'Mole Fraction',
        body: 'The share of the moles that belong to one gas is its mole fraction: the moles of the gas over the total moles. A gas pushes with the same share of the total pressure, and the mole fractions in a mixture add up to one.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 30 }, { V: RANK_V, T: T0, of: VALVES, show: { partials: true }, words: 2 });
    const tanks = RANK.map(([id, gas, n], i) => tank(id, `TANK ${id.toUpperCase()}`, { x: 0, y: 0 }, { gas, n, V: RANK_V, T: T0, noGauge: true, printMass: true, plate: false }));
    return {
      title: 'Rank by Push',
      prompt: 'Put the four tanks on the strip from the gas that pushes hardest to the gas that pushes least.',
      widget,
      table: gasTable({
        pieces: tanks,
        fixtures: [ct.fixture],
        zones: {
          trays: [ct.tray],
          rail: { id: 'rail', at: { x: 108, y: 48 }, size: { w: 80, h: 16 }, first: 'Pushes hardest', last: 'Pushes least', items: ['a', 'b', 'c', 'd'], start: ['a', 'b', 'c', 'd'] }
        }
      }),
      hints: [
        'Drag a tank into the place under the common tank to read its push, and drag it back to the strip.',
        'Compare the pushes of tanks that fill the same room at the same temperature, not their weights.',
        'Put the tank with the largest push at the strong end of the strip and the smallest at the other end.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four tanks on the strip.' };
        const want = ['a', 'b', 'c', 'd'].sort((x, y) => tankRead(t.pieces[y]).P - tankRead(t.pieces[x]).P);
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two neighbouring tanks on the strip are the wrong way round.' };
      },
      reward: {
        log: 'The moles decide the push.',
        title: 'Moles Decide the Push',
        body: 'At one temperature in one tank, the gas with the most moles has the largest partial pressure, whatever its particles weigh. Light particles knock more often and heavy ones knock harder, and the two balance out.'
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
      title: 'Up the Mountain',
      prompt: 'Turn the Height dial, then sort each reading by whether it falls as the air gets thinner.',
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
            { id: 'falls', label: 'Falls as you climb', at: { x: 90, y: 49 }, size: { w: 36, h: 22 }, cell: 17 },
            { id: 'stays', label: 'Stays put', at: { x: 128, y: 49 }, size: { w: 28, h: 22 }, cell: 15 }
          ]
        }
      }),
      hints: [
        'Use the "Height" dial.',
        'Compare each reading at sea level with the same reading at the greatest height.',
        'A reading goes in "Falls as you climb" only if it is lower at the greatest height than at sea level.'
      ],
      check(state) {
        const t = state.table;
        if (!things.every(([id]) => ['falls', 'stays'].includes(whereIs(t, id)))) return { ok: false, notYet: true, msg: 'Put every reading in a tray.' };
        if (Math.round(t.fixtures[CT].dials.volume.value) === 1) return { ok: false, notYet: true, msg: 'The Height dial is where it started: turn it and watch the readings.' };
        const at = k => commonRead({ ...t, fixtures: { ...t.fixtures, [CT]: { ...t.fixtures[CT], dials: { ...t.fixtures[CT].dials, volume: { ...t.fixtures[CT].dials.volume, value: k } } } } }, CT);
        const lo = at(1);
        const hi = at(HEIGHTS.length);
        const share = (r, g) => partialOf(r, g) / r.P;
        const falls = {
          o2share: share(hi, 'O2') < share(lo, 'O2') - 1e-6, o2push: partialOf(hi, 'O2') < partialOf(lo, 'O2') - 1e-6,
          total: hi.P < lo.P - 1e-6, n2share: share(hi, 'N2') < share(lo, 'N2') - 1e-6
        };
        if (things.some(([id]) => whereIs(t, id) === 'falls' && !falls[id])) return { ok: false, msg: 'The "Falls as you climb" tray holds a reading that is no lower at the top than at sea level.' };
        if (things.some(([id]) => whereIs(t, id) === 'stays' && falls[id])) return { ok: false, msg: 'The "Stays put" tray holds a reading that is lower at the top than at sea level.' };
        return { ok: true };
      },
      reward: {
        log: 'Thin air has the same mixture at a lower push.',
        title: 'Thin Air',
        body: 'Higher up, the air is the same mixture but thinner, so oxygen\'s partial pressure falls with the total while its share stays at the same mole fraction. A climber is short of oxygen because that push is low, not because the mixture has changed.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag one card into the slot.'],
  2: ['Open both tanks, then drag a card in.'],
  3: ['Drag tanks into the place under the common tank,', 'or take them out again.'],
  4: ['Open one tank at a time to read its push,', 'then put it back on the strip.'],
  5: ['Turn the Height dial, then drag each chip', 'into a tray.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Every gas in a tank pushes as if it were alone, and the gauge adds the pushes up. A gas\'s share of the push is its share of the particles, and the moles, not the weight, decide who pushes hardest.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'The station\'s air is a mixture, and so is the fuel in its lines. Splitting a tank\'s push gas by gas is how a crew sees what has been added to it.'
    },
    {
      heading: 'Next',
      body: 'The next bench asks how fast the particles of each gas go, and what that does when a gas finds a hole.'
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
  [dial(CT, 'volume', 4), ...sort({ o2share: 'stays', n2share: 'stays', o2push: 'falls', total: 'falls' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('b', OPEN), put('a', OPEN), put('lower', 'slot:show')],
  [put('c', OPEN)],
  [put('d', 'rail:0'), put('b', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')],
  [dial(CT, 'volume', 4), ...sort({ o2share: 'falls', n2share: 'stays', o2push: 'falls', total: 'falls' })]
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
