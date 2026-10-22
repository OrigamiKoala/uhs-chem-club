/**
 * q4-mixtures.js — Bellows, bench four: PARTIAL PRESSURES.
 *
 * The blending manifold on its pipe rack, and the fourth of Bellows' TABLETOPS (plan `bench-tabletop.md`, phase T5), on the gas kit
 * (`table/kits/gas.js`). Every earlier bench held one gas. This one puts several in a tank and asks what each is doing. The answer is the
 * least expected thing about a gas: nothing. Each pushes as if the others were not there, so a tank's reading is a sum and any one gas's
 * share of it can be found, counted, ranked and even pulled out.
 *
 * A TANK is a piece with its own gauge; standing in the place under the COMMON TANK it has opened its valve into it, so its gas is in the
 * room the common tank has, at the temperature it has. The common tank's gauge is the sum of what each gas would push alone, because that is
 * what the gas law gives for each; the bench never states it as a rule.
 *
 *   1  open tanks into the common tank and watch the gauge  -> partial pressure, Dalton's law
 *   2  how a gas in a mixture pushes against the same gas alone -> (each gas ignores the others)
 *   3  one gas's share of the particles                       -> mole fraction
 *   4  a gas's share of the push, from its share of the moles -> (partial pressure = mole fraction x total)
 *   5  the oxygen in the air at altitude                      -> (thin air is the same mixture at a lower total)
 *   6  adding a gas that reacts with nothing                  -> (every other partial pressure stays put)
 *   7  three gases ranked by their push                       -> (the moles decide, not the weight)
 *   8  the moles of one gas in a sealed tank                  -> (a trap shows one partial pressure)
 *
 * THE EVIDENCE IS ON THE BENCH. Each tank prints its own gauge, and the common tank prints the push of each gas in it by a stencilled shape,
 * never by colour. Stage 7 is built to catch the obvious mistake: its heaviest gas has the fewest moles, so a heavy gas does not push the
 * hardest and only the moles decide.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, tank, trapTool, commonTank, markerFixture, plaqueFixture, markerRead, commonRead, partialOf, tankRead, whereIs,
  planMixture, GASES, R, AIR, airPressureAt, pressureIdeal
} from '../../table/kits/gas.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bpartial pressures?\b/i, introducedAt: 1 },
  { term: /\bdalton.?s law\b/i, introducedAt: 1 },
  { term: /\bmole fractions?\b/i, introducedAt: 3 }
];

/** The gas law, pressure and the mole are plain words here. */
export const BUILDS_ON = ['unit04/q3-ideal', 'unit04/q2-laws'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const CT = 'ct';
const VALVES = `${CT}.valves`;
const OPEN = `tray:${VALVES}`;

/** The tanks the bench opens: each is the same size as the common tank, so its own gauge is what its gas pushes there. */
const T0 = 300;
const V0 = 10;
export const HELIUM = { gas: 'He', n: 1 };
export const NEON = { gas: 'Ne', n: 0.6 };
export const NITROGEN = { gas: 'N2', n: 0.3 };
/** Stage 3's four tanks, stage 4's sealed mixture, and stage 5's air at four heights. */
export const SHARE = [['a', 'He', 0.5], ['b', 'Ne', 0.5], ['c', 'N2', 1.5], ['d', 'CO2', 1.0]];
export const BLEND = { parts: [{ gas: 'N2', n: 3 }, { gas: 'O2', n: 1 }], V: 49.88, T: 300 };
export const HEIGHTS = [23.62, 33.76, 45.46, 67.74];
export const HEIGHT_NAMES = ['Sea level', '3000 m', '5500 m', '8850 m'];
export const AIR_T = 288.15;
export const AIR_PARTS = AIR.map(a => ({ gas: a.gas, n: a.n / 100 }));
/** Stage 7's three tanks: the heaviest gas has the fewest moles. */
export const RANK = [['a', 'N2', 1.0], ['b', 'CO2', 0.5], ['c', 'He', 1.5]];
/** Stage 8's sealed tank of two gases, and the one a trap takes out. */
export const SEALED = { parts: [{ gas: 'N2', n: 0.4 }, { gas: 'CO2', n: 0.2 }], V: 10, T: 300 };

const t10 = (id, label, at, gas, n, extra = {}) => tank(id, label, at, { gas, n, V: V0, T: T0, gaugeMax: 400, ...extra });

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */
const STAGE_REWARDS = [
  {
      reward: {
        log: 'The tank reads what the two gases read added together.',
        title: 'Partial Pressure and Dalton\'s Law',
        body: 'Each gas in a mixture pushes as hard as it would if it were alone in the tank, and that share is its partial pressure. The total pressure is the sum of the partial pressures, which is Dalton\'s law.'
      }
  },
  {
      reward: {
        log: 'A gas ignores the gas beside it.',
        title: 'Each Gas Alone',
        body: 'A gas in a mixture knocks on the walls exactly as often as it would alone, because the particles are so far apart that they hardly notice one another. That is why the partial pressures simply add.'
      }
  },
  {
      reward: {
        log: 'A gas\'s share of the particles is its share of the push.',
        title: 'Mole Fraction',
        body: 'The share of the moles that belong to one gas is its mole fraction: the moles of the gas over the total moles. A gas pushes with the same share of the total pressure, and the mole fractions in a mixture add up to one.'
      }
  },
  {
      reward: {
        log: 'A share of the moles is a share of the push.',
        title: 'Partial Pressure From a Share',
        body: 'The partial pressure of a gas is its mole fraction times the total pressure. A gas that makes up a quarter of the moles makes up a quarter of the push.'
      }
  },
  {
      reward: {
        log: 'Thin air has the same mixture at a lower total.',
        title: 'Thin Air',
        body: 'At altitude the air is the same mixture but its total pressure is lower, so the partial pressure of oxygen falls with it. A climber is short of oxygen because its partial pressure is low, not because its mole fraction has changed.'
      }
  },
  {
      reward: {
        log: 'Argon adds its own push and takes nothing from the oxygen.',
        title: 'Gases Ignore One Another',
        body: 'A gas that reacts with nothing adds its own partial pressure to the total and leaves every other partial pressure where it was. Each gas in a mixture behaves as if it had the whole tank to itself.'
      }
  },
  {
      reward: {
        log: 'The moles decide the push.',
        title: 'Moles Decide the Push',
        body: 'At one temperature in one tank, the gas with the most moles has the largest partial pressure, whatever its particles weigh. Light particles knock more often and heavy ones knock harder, and the two balance out.'
      }
  },
  {
      reward: {
        log: 'One gas counted by taking it out.',
        title: 'Counting One Gas',
        body: 'Taking one gas out of a mixture and watching the gauge fall gives that gas\'s partial pressure, and the gas law turns that into moles. Partial pressures let you count each gas in a tank you cannot see into.',
        last: true
      }
  }
];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 30 }, { V: V0, T: T0, of: VALVES });
    return {
      title: 'Pouring Together',
      briefing: { speaker: SPEAKER, body: 'Each tank has its own gauge, and a tank put in the place under the common tank opens its valve into it. Press Submit when the table shows your answer.' },
      prompt: 'Open tanks into the common tank until its gauge reads about 400 kPa.',
      widget,
      table: gasTable({
        pieces: [t10('a', 'TANK A', { x: 92, y: 18 }, HELIUM.gas, HELIUM.n), t10('b', 'TANK B', { x: 114, y: 18 }, NEON.gas, NEON.n), t10('c', 'TANK C', { x: 136, y: 18 }, NITROGEN.gas, NITROGEN.n)],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] }
      }),
      hints: [
        'Put a tank in the place under the common tank and watch its gauge.',
        'Compare the common tank\'s gauge with the gauges of the tanks you have opened into it.',
        'Open another tank, or take one out, until the common tank\'s gauge reads what the prompt asks.'
      ],
      check(state) {
        const t = state.table;
        const rd = commonRead(t, CT);
        if (!rd.tanks.length) return { ok: false, notYet: true, msg: 'Open a tank into the common tank first.' };
        if (Math.abs(rd.P - 400) <= 8) return { ok: true };
        return { ok: false, msg: 'The common tank\'s gauge does not read 400 kPa yet: compare it with the gauges of the tanks you have opened into it.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: V0, T: T0, of: VALVES, show: { partials: true }, words: 2, record: true });
    const token = (id, label, x) => ({ id, label, at: { x, y: 57 }, r: 7 });
    return {
      title: 'Each Alone',
      prompt: 'Predict what neon\'s push becomes when helium is let into its tank, then test it.',
      widget,
      table: gasTable({
        pieces: [t10('a', 'TANK A', { x: 92, y: 14 }, HELIUM.gas, HELIUM.n), t10('b', 'TANK B', { x: 114, y: 14 }, NEON.gas, NEON.n)],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] },
        prediction: {
          slot: { id: 'predict', label: 'Neon\'s push in the mix', at: { x: 111, y: 36 }, size: { w: 30, h: 12 } },
          tokens: [token('same', 'The same', 90), token('lower', 'Lower', 112), token('higher', 'Higher', 134)]
        }
      }),
      hints: [
        'Place a prediction, then open Tank B into the common tank, then Tank A, and press Record.',
        'Compare neon\'s push in the common tank with Tank B\'s own gauge.',
        'Look at whether letting helium in changed the push the common tank prints for neon.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        const alone = planMixture([{ gas: NEON.gas, n: NEON.n }], T0, V0).rows[0].P;
        const mixed = planMixture([{ gas: HELIUM.gas, n: HELIUM.n }, { gas: NEON.gas, n: NEON.n }], T0, V0).rows.find(r => r.gas === NEON.gas).P;
        const want = Math.abs(mixed - alone) < 1e-6 ? 'same' : mixed < alone ? 'lower' : 'higher';
        if (token === want) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The common tank\'s figure for neon does not follow that prediction: compare it with Tank B\'s own gauge.' };
        return { ok: false, msg: 'Open Tank B and then Tank A into the common tank, press Record, and compare neon\'s push with your prediction.' };
      },
      ...STAGE_REWARDS[1]
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
        'Open one tank at a time and watch the share each gas takes of the push.',
        'Compare each gas\'s share of the push with the share of the moles it has among the tanks you opened.',
        'Choose tanks whose moles of nitrogen are sixty percent of all the moles in the common tank.'
      ],
      check(state) {
        const t = state.table;
        const rd = commonRead(t, CT);
        if (!rd.tanks.length) return { ok: false, notYet: true, msg: 'Open a tank into the common tank first.' };
        const n2 = partialOf(rd, 'N2');
        if (n2 > 0 && Math.abs(n2 / rd.P - 0.6) < 0.005) return { ok: true };
        return { ok: false, msg: 'Nitrogen\'s share of the push is not yet sixty percent: compare it with nitrogen\'s share of the moles you have opened.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    return {
      title: 'A Gas\'s Own Push',
      prompt: 'Set the marker to how hard the oxygen in the sealed tank pushes on its own, in kilopascals.',
      widget,
      table: gasTable({
        pieces: [tank('t', 'TANK A', { x: 30, y: 30 }, { parts: BLEND.parts, V: BLEND.V, T: BLEND.T, partsPlate: true, plate: false, gaugeMax: 300 })],
        fixtures: [markerFixture('push', 'Oxygen pushes with', { x: 100, y: 30 }, { min: 0, max: 200, step: 10, start: 0, unit: 'kPa', w: 56 })]
      }),
      hints: [
        'Read the tank\'s gauge and the moles of each gas printed on its face.',
        'Compare the moles of oxygen with all the moles in the tank.',
        'Take the same share of the gauge reading as oxygen has of the moles.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'push');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the oxygen\'s push.' };
        const want = tankRead(t.pieces.t).rows.find(r => r.gas === 'O2').P;
        if (Math.abs(v - want) <= 5) return { ok: true };
        return { ok: false, msg: 'Work out oxygen\'s share of the moles, then take that share of the tank\'s gauge reading.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 31 }, { V: HEIGHTS[0], T: AIR_T, of: VALVES, volumes: HEIGHTS, volumeStart: 1, volumeNames: HEIGHT_NAMES, volumeLabel: 'Height', show: { partials: true }, words: 3 });
    return {
      title: 'Up the Mountain',
      prompt: 'Set the marker to the oxygen\'s own push in the air at 5,500 metres, in kilopascals.',
      widget,
      table: gasTable({
        pieces: [tank('air', 'AIR', { x: 96, y: 16 }, { parts: AIR_PARTS, V: HEIGHTS[0], T: AIR_T, plate: true, gaugeMax: 150 })],
        fixtures: [ct.fixture, markerFixture('oxygen', 'Oxygen pushes with', { x: 112, y: 46 }, { min: 0, max: 30, step: 1, start: 0, unit: 'kPa', w: 56 })],
        zones: { trays: [ct.tray] }
      }),
      hints: [
        'Open the tank of air into the common tank and turn the Height dial.',
        'Compare the oxygen\'s push at sea level with its push at 5,500 metres.',
        'Read the oxygen\'s push with the Height dial at 5,500 metres and set the marker to it.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'oxygen');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the oxygen\'s push at that height.' };
        const want = planMixture(AIR_PARTS, AIR_T, HEIGHTS[2]).rows.find(r => r.gas === 'O2').P;
        if (Math.abs(v - want) <= 0.6) return { ok: true };
        return { ok: false, msg: 'Open the air into the common tank, set the Height dial to 5,500 metres, and read oxygen\'s own push there.' };
      },
      ...STAGE_REWARDS[4]
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const ct = commonTank(CT, { x: 36, y: 32 }, { V: V0, T: T0, of: VALVES, show: { partials: true }, words: 3, record: true });
    const token = (id, label, x) => ({ id, label, at: { x, y: 57 }, r: 7 });
    return {
      title: 'A Gas That Reacts With Nothing',
      prompt: 'Predict what oxygen\'s push becomes when argon is let into the common tank, then test it.',
      widget,
      table: gasTable({
        pieces: [
          tank('air', 'TANK A', { x: 0, y: 0 }, { parts: [{ gas: 'N2', n: 0.8 }, { gas: 'O2', n: 0.2 }], V: V0, T: T0, partsPlate: true, gaugeMax: 400, zone: OPEN }),
          t10('ar', 'TANK B', { x: 92, y: 14 }, 'Ar', 1.0)
        ],
        fixtures: [ct.fixture],
        zones: { trays: [ct.tray] },
        prediction: {
          slot: { id: 'predict', label: 'Oxygen\'s push, with argon', at: { x: 111, y: 36 }, size: { w: 30, h: 12 } },
          tokens: [token('same', 'The same', 90), token('lower', 'Lower', 112), token('higher', 'Higher', 134)]
        }
      }),
      hints: [
        'Place a prediction, then open the argon tank into the common tank and press Record.',
        'Compare the push the common tank prints for oxygen before and after the argon goes in.',
        'Look at whether any gas already in the common tank pushes differently once argon is added.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        const before = planMixture([{ gas: 'N2', n: 0.8 }, { gas: 'O2', n: 0.2 }], T0, V0).rows.find(r => r.gas === 'O2').P;
        const after = planMixture([{ gas: 'N2', n: 0.8 }, { gas: 'O2', n: 0.2 }, { gas: 'Ar', n: 1.0 }], T0, V0).rows.find(r => r.gas === 'O2').P;
        const want = Math.abs(after - before) < 1e-6 ? 'same' : after < before ? 'lower' : 'higher';
        if (token === want) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The common tank\'s figure for oxygen does not follow that prediction: compare it before and after the argon goes in.' };
        return { ok: false, msg: 'Open the argon tank into the common tank, press Record, and compare oxygen\'s push with your prediction.' };
      },
      ...STAGE_REWARDS[5]
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const mk = ([id, gas, n], i) => tank(id, `TANK ${id.toUpperCase()}`, { x: 40 + i * 35, y: 54 }, { gas, n, V: 20, T: 300, plate: true, gaugeMax: 300 });
    return {
      title: 'Rank by Push',
      prompt: 'Put the three tanks on the rail from the gas that pushes hardest to the gas that pushes least.',
      widget,
      table: gasTable({
        pieces: RANK.map(mk),
        zones: { rail: { id: 'rail', at: { x: 75, y: 30 }, size: { w: 100, h: 20 }, first: 'Pushes hardest', last: 'Pushes least', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } }
      }),
      hints: [
        'Read each tank\'s gauge, and the gas and the room printed on its plate.',
        'Compare the gauges of tanks that fill the same room at the same temperature.',
        'Put the tank with the highest gauge at the strong end of the rail and the lowest at the other end.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three tanks on the rail.' };
        const want = ['a', 'b', 'c'].sort((x, y) => tankRead(t.pieces[y]).P - tankRead(t.pieces[x]).P);
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Compare the three gauges: tanks that fill the same room at the same temperature push in proportion to what is inside them.' };
      },
      ...STAGE_REWARDS[6]
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    return {
      title: 'Pulling One Out',
      prompt: 'Trap the carbon dioxide out of the sealed tank, then set the marker to the moles of carbon dioxide that were in it.',
      widget,
      table: gasTable({
        pieces: [
          tank('t', 'TANK A', { x: 30, y: 28 }, { parts: SEALED.parts, V: SEALED.V, T: SEALED.T, sealed: true, plate: true, gaugeMax: 300 }),
          trapTool('trap', 'CO₂ TRAP', { x: 30, y: 50 }, 'CO2')
        ],
        fixtures: [
          plaqueFixture('ref', 'The gas constant', { x: 100, y: 14 }, ['R = 8.31 kPa·L per mol·K'], { w: 52 }),
          markerFixture('moles', 'Moles of carbon dioxide', { x: 100, y: 42 }, { min: 0, max: 1, step: 0.05, start: 0, unit: 'mol', w: 56 })
        ]
      }),
      hints: [
        'Lay the trap on the tank and watch the tank\'s gauge.',
        'Compare the gauge before and after the trap, and the room and temperature on the plate.',
        'Divide the drop in the gauge times the room by the constant times the temperature.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'moles');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the moles you worked out.' };
        if (!t.pieces.t.props.parts.every(p => p.gas !== 'CO2')) return { ok: false, msg: 'The carbon dioxide is still in the tank: lay the trap on it and watch the gauge fall.' };
        const want = SEALED.parts.find(p => p.gas === 'CO2').n;
        if (Math.abs(v - want) <= 0.05) return { ok: true };
        return { ok: false, msg: 'Check the working: take the fall in the gauge, multiply by the room, then divide by the constant times the temperature.' };
      },
      ...STAGE_REWARDS[7]
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag a tank into the place under the', 'common tank to open it.'],
  2: ['Place a prediction, open the tanks,', 'then press Record.'],
  3: ['Drag tanks into the place under the common tank,', 'or take them out again.'],
  4: ['Set the marker to the figure you work out.'],
  5: ['Open the air, turn the Height dial,', 'then set the marker.'],
  6: ['Place a prediction, open Tank B,', 'then press Record.'],
  7: ['Drag each tank into its place on the rail.'],
  8: ['Lay the trap on the tank, then set the marker.']
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
      body: 'Every gas in a mixture pushes exactly as it would alone, so the total is a sum, each share follows its moles, and a gas that reacts with nothing changes nothing but the total.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Air, breathing gas, a gas collected over a liquid and the exhaust of a reaction are all mixtures. Partial pressures are how each one is counted.'
    },
    {
      heading: 'Next',
      body: 'The next bench slows the particles down for a closer look, and finds out how fast each one goes and how soon it escapes.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A tank holds nitrogen at a partial pressure of 3.0 atm and oxygen at a partial pressure of 1.0 atm. What is the total pressure?',
    options: [
      { id: 'a', label: '4.0 atm' },
      { id: 'b', label: '3.0 atm' },
      { id: 'c', label: '2.0 atm' },
      { id: 'd', label: '3.5 atm' }
    ],
    answer: 'a',
    explanation: 'By Dalton’s law the total pressure is the sum of the partial pressures: 3.0 + 1.0 = 4.0 atm.'
  },
  {
    question: 'A mixture is 2.0 mol of helium and 3.0 mol of neon. What is the mole fraction of helium?',
    options: [
      { id: 'a', label: '0.40' },
      { id: 'b', label: '0.60' },
      { id: 'c', label: '0.67' },
      { id: 'd', label: '2.0' }
    ],
    answer: 'a',
    explanation: 'The mole fraction is the moles of helium over the total moles: 2.0 / (2.0 + 3.0) = 0.40.'
  },
  {
    question: 'The total pressure of a gas mixture is 200 kPa and oxygen makes up 25 % of its moles. What is the partial pressure of oxygen?',
    options: [
      { id: 'a', label: '50 kPa' },
      { id: 'b', label: '25 kPa' },
      { id: 'c', label: '150 kPa' },
      { id: 'd', label: '175 kPa' }
    ],
    answer: 'a',
    explanation: 'The partial pressure is the mole fraction times the total pressure: 0.25 × 200 = 50 kPa.'
  },
  {
    question: 'Why is the air at the top of a high mountain hard to breathe, when it is still about 21 % oxygen?',
    options: [
      { id: 'a', label: 'The total pressure is lower, so the partial pressure of oxygen is lower' },
      { id: 'b', label: 'The mole fraction of oxygen falls with height' },
      { id: 'c', label: 'The oxygen particles are heavier' },
      { id: 'd', label: 'The nitrogen pushes the oxygen out' }
    ],
    answer: 'a',
    explanation: 'The mixture is the same at every height, but the total pressure falls, and each gas’s partial pressure falls with it.'
  },
  {
    question: 'Argon, which reacts with nothing, is pumped into a sealed tank of nitrogen and oxygen at constant temperature. What happens to the partial pressure of the oxygen?',
    options: [
      { id: 'a', label: 'It stays the same' },
      { id: 'b', label: 'It rises' },
      { id: 'c', label: 'It falls' },
      { id: 'd', label: 'It becomes equal to the argon’s' }
    ],
    answer: 'a',
    explanation: 'Each gas behaves as if the others were not there, so only the total pressure rises.'
  }
];


/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

export const SOLUTIONS = [
  [put('a', OPEN), put('b', OPEN)],
  [{ predict: 'same' }, put('b', OPEN), put('a', OPEN), { run: CT }],
  [put('c', OPEN), put('a', OPEN), put('b', OPEN)],
  [dial('push', 'value', 50)],
  [put('air', OPEN), dial(CT, 'volume', 3), dial('oxygen', 'value', 11)],
  [{ predict: 'same' }, put('ar', OPEN), { run: CT }],
  [put('c', 'rail:0'), put('a', 'rail:1'), put('b', 'rail:2')],
  [put('trap', 'piece:t'), dial('moles', 'value', 0.2)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('a', OPEN)],
  [{ predict: 'lower' }, put('b', OPEN), put('a', OPEN), { run: CT }],
  [put('a', OPEN), put('b', OPEN), put('c', OPEN), put('d', OPEN)],
  [dial('push', 'value', 150)],
  [put('air', OPEN), dial(CT, 'volume', 1), dial('oxygen', 'value', 21)],
  [{ predict: 'lower' }, put('ar', OPEN), { run: CT }],
  [put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2')],
  [dial('moles', 'value', 0.6)]
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
export { commonRead, partialOf, tankRead, planMixture, GASES, R, AIR, airPressureAt, pressureIdeal };
