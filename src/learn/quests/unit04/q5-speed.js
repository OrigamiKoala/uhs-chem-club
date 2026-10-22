/**
 * q5-speed.js — Bellows, bench five: SPEED AND ESCAPE.
 *
 * The leak-test station at a vent stack, and the fifth of Bellows' TABLETOPS (plan `bench-tabletop.md`, phase T5), on the gas kit
 * (`table/kits/gas.js`). Bench one found that the particles of a gas move at a spread of speeds. This one asks what that spread does: it
 * moves and flattens as the gas is heated, it sorts the gases by weight, its fast tail is what a demanding collision needs, and it decides
 * how soon a gas leaks through a hole and how slowly it spreads.
 *
 *   1  how the speed screen answers a rising temperature       -> (the peak moves right and flattens)
 *   2  three gases ordered by how fast their particles move    -> (lighter is faster)
 *   3  how many more clear a speed bar when the gas is hotter  -> (the tail grows fast)
 *   4  which gas runs out of a pinholed chamber first          -> effusion
 *   5  how many times faster hydrogen leaks than oxygen        -> Graham's law (beyond the exam)
 *   6  an unmarked gas named by racing it against helium       -> (the leak times give the molar mass)
 *   7  why a smell takes time to cross a room                  -> diffusion
 *   8  where two gases meet in a tube                          -> (the lighter spreads faster, too)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 3 prints, under the same bar, the share of the particles above it at the heater's setting, so the
 * factor is read off two printed figures. Stage 5 prints the time each chamber takes to half empty, and the ratio of the times is the ratio
 * of the rates. Stage 7's plate prints the distance a single particle has run beside the distance it is from where it started, and the two
 * are very far apart. Stage 6's sample is drawn from the vent stack at the station: the player fetches it from the field point `bleed`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  gasTable, rig, chip, pinhole, tube, walk, markerFixture, plaqueFixture, cylRead, markerRead, whereIs, pinholeRead, tubeRead, walkRead,
  speedScreen, tallestBar, barOf, shareAbove, speeds, fractionAbove, halfTime, leftAfter, front, toKelvin, speedBins, GASES
} from '../../table/kits/gas.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\beffusion\b/i, introducedAt: 4 },
  { term: /\bgraham.?s law\b/i, introducedAt: 5 },
  { term: /\bdiffusion\b/i, introducedAt: 7 }
];

/** Pressure, kelvin, the speed screen and the gas laws are plain words here. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit04/q3-ideal'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const RIG = 'rig';
const PIN = 'pin';
const T0 = 300;

/** Stage 1's mark (m/s), and the heater settings it is turned through. */
export const MARK = 650;
const HEAT = [27, 127, 327, 527, 727, 927];
/** The speed bar of stage 3, in m/s, the settings it is compared at, and how many times the 27 °C share is asked for. */
export const BAR = 1000;
const COMPARE_C = [27, 127, 227, 327, 427];
export const TAIL_TIMES = 10;
/** The seconds a stopwatch can be set to. */
const TIMES = [0, 1, 2, 3, 4, 5, 6];
/** The tube: its length in centimetres and the stopwatch's seconds. */
export const TUBE_CM = 100;
const TUBE_TIMES = [0, 15, 30, 45, 60, 75];
/** The clock of stage 7's walk, and the track's seed. */
const WALK_TIMES = [1, 2, 4, 8, 16];
const WALK_SECONDS = 16;
const WALK_SEED = 'smell';
/** The molar masses stage 6 prints (g/mol). */
const NOBLES = ['Ne', 'Ar', 'Kr', 'Xe'];
/** The shared vertical scale of stage 1 and 3's screens: the coldest setting's tallest bar. */
const REF_SPEEDS = Math.max(...speedBins('N2', toKelvin(27, 'C'), 24, 2400));

const speedRig = (at, o = {}) => rig(RIG, at, {
  cyls: [{ id: 'a', label: 'Cylinder A', gas: 'N2', n: 1, hold: 'V', V: 20, T: T0 }], tempList: 'C', tempStart: 1, vmax: 20,
  speedScreen: true, screenRef: REF_SPEEDS, ...o
});

/** Stage 3's reference figure: the share of nitrogen above the bar at the coldest setting. */
const baseShare = () => fractionAbove('N2', toKelvin(COMPARE_C[0], 'C'), BAR);

/** The rail's three cylinders, and the gas each holds. */
const THREE = [['a', 'N2'], ['b', 'He'], ['c', 'CO2']];

const token = (id, label, x) => ({ id, label, at: { x, y: 55 }, r: 7 });

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */

/** The reward card of each stage: the idea just worked out, named (unchanged by the conversion to a table). */
const STAGE_REWARDS = [
  {
      reward: {
        log: 'Hotter: a peak further right and a flatter spread.',
        title: 'Hotter, Faster, Wider',
        body: 'Heating moves the peak of the speed distribution to higher speeds and spreads it out, so a hotter gas has a higher typical speed and a longer tail of very fast particles.'
      }
  },
  {
      reward: {
        log: 'The lighter the particle, the faster it goes.',
        title: 'Lighter, Faster',
        body: 'At one temperature every gas has the same average kinetic energy, so the lighter the particles the faster they move. Speed goes as one over the square root of the molar mass — what one mole weighs.'
      }
  },
  {
      reward: {
        log: 'A little heat multiplies the fast tail.',
        title: 'The Fast Tail',
        body: 'Only the fastest particles clear a high bar, and a modest rise in temperature multiplies their number several times over. Where a collision needs a minimum energy to count, it is this tail that does the work.'
      }
  },
  {
      reward: {
        log: 'The lighter gas leaks out first.',
        title: 'Effusion',
        body: 'A gas leaking through a pinhole is effusing, and the lighter gas effuses faster because its particles move faster and reach the hole more often.'
      }
  },
  {
      reward: {
        log: 'The rates go as one over the root of the molar mass.',
        title: 'Graham\'s Law',
        body: 'The rate of effusion is inversely proportional to the square root of the molar mass, so hydrogen, about sixteen times lighter than oxygen, leaks four times as fast. This is Graham\'s law, which goes beyond the exam.'
      }
  },
  {
      reward: {
        log: 'A gas named by racing it against one you know.',
        title: 'Naming by Leak',
        body: 'Squaring the ratio of the leak times gives the ratio of the molar masses, so an unknown gas can be named by racing it against a gas whose molar mass is known.'
      }
  },
  {
      reward: {
        log: 'A crowd turns a straight run into a wander.',
        title: 'Diffusion',
        body: 'Particles spread by diffusion, a random walk of collisions: the distance run is large but the distance from the start grows slowly. That is why a gas takes seconds to cross a room its particles could cross in a fraction of a second.'
      }
  },
  {
      reward: {
        log: 'The lighter gas spreads faster as well.',
        title: 'The Lighter Gas Arrives First',
        body: 'Spreading is quicker for the lighter gas, as leaking is: ammonia arrives before hydrogen chloride in tubes of equal length. The same square-root relation to the molar mass governs both.',
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
    const r = speedRig({ x: 75, y: 30 }, { temps: HEAT, target: MARK, w: 88, show: { amount: false, speed: true } });
    return {
      title: 'Warming the Crowd',
      briefing: { speaker: SPEAKER, body: 'The Heater dial warms the gas, and the speed screen shows how many of its particles move at each speed. Press Submit when the table shows your answer.' },
      prompt: 'Heat the gas until the tallest bar of the speed screen stands under the mark.',
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Turn the Heater dial one setting at a time and watch the bars of the speed screen.',
        'Compare where the tallest bar stands at each setting with the amber mark above the screen.',
        'Stop on the setting where the tallest bar stands under the mark.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'The heater is where it started: turn it and watch the bars.' };
        const q = cylRead(t, RIG, 0);
        if (tallestBar(speedScreen(q)) === barOf(MARK)) return { ok: true };
        return { ok: false, msg: 'The tallest bar is not under the mark yet: turn the heater and watch which way the tallest bar moves.' };
      },
      ...STAGE_REWARDS[0]
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const r = rig(RIG, { x: 30, y: 32 }, {
      cyls: THREE.map(([id, gas]) => ({ id, label: `Cylinder ${id.toUpperCase()}`, gas, n: 1, hold: 'V', V: 20, T: T0 })),
      temps: [27, 127, 327], tempList: 'C', tempStart: 1, vmax: 20, compact: true, w: 36,
      show: { gauge: false, volume: false, temperature: false, amount: false, speed: true }, words: { speed: 'AVERAGE SPEED' }
    });
    return {
      title: 'Three Gases',
      prompt: 'Rank the three gases from fastest average particle speed to slowest.',
      widget,
      table: gasTable({
        pieces: THREE.map(([id], i) => chip(id, `CYLINDER ${id.toUpperCase()}`, { x: 75 + i * 28, y: 54 })),
        fixtures: [r],
        zones: { rail: { id: 'rail', at: { x: 108, y: 28 }, size: { w: 80, h: 22 }, first: 'Fastest', last: 'Slowest', items: ['a', 'b', 'c'], start: ['a', 'b', 'c'] } }
      }),
      hints: [
        'Read the average speed on each cylinder, and turn the Heater dial to see it change.',
        'Compare the three speeds at one setting of the dial, and not the sizes of the cylinders.',
        'Put the cylinder with the largest average speed at the fast end of the rail and the smallest at the other.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three cylinders on the rail.' };
        const want = ['a', 'b', 'c'].sort((x, y) => cylRead(t, RIG, y).mean - cylRead(t, RIG, x).mean);
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Read the average speed on each cylinder at one setting of the heater; the pressure and the size of the cylinder do not sort the gases.' };
      },
      ...STAGE_REWARDS[1]
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const r = speedRig({ x: 75, y: 30 }, { temps: COMPARE_C, bar: BAR, w: 88, show: { amount: false, speed: true } });
    return {
      title: 'The Fast Tail',
      prompt: 'Heat the gas until at least ten times as many particles are above the dashed bar as at 27 °C.',
      widget,
      table: gasTable({ fixtures: [r] }),
      hints: [
        'Read the share above the dashed bar at 27 °C, then turn the Heater dial and watch the share change.',
        'Compare the share at each setting with ten times the share at 27 °C.',
        'Stop on a setting where the share printed above the bar is at least ten times the share you started from.'
      ],
      check(state) {
        const t = state.table;
        if (Math.round(t.fixtures[RIG].dials.temp.value) === 1) return { ok: false, notYet: true, msg: 'The heater is where it started: turn it and read the share above the bar.' };
        const q = cylRead(t, RIG, 0);
        if (shareAbove(q, BAR) >= TAIL_TIMES * baseShare()) return { ok: true };
        return { ok: false, msg: 'The share above the bar is not yet ten times the share at 27 °C: compare the printed share with the one you started from.' };
      },
      ...STAGE_REWARDS[2]
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const p = pinhole(PIN, { x: 40, y: 30 }, {
      chambers: [{ id: 'a', gas: 'N2', label: 'CHAMBER A' }, { id: 'b', gas: 'He', label: 'CHAMBER B' }], times: TIMES, timeStart: 1, recordIndex: 0
    });
    return {
      title: 'A Hole in the Wall',
      briefing: { speaker: SPEAKER, body: 'Both chambers now have a pinhole in the wall. The Stopwatch dial sets how long the gas has had to leak.' },
      prompt: 'Predict which chamber runs out of gas first through its pinhole, then test it.',
      widget,
      table: gasTable({
        fixtures: [p],
        prediction: {
          slot: { id: 'predict', label: 'The first to run out', at: { x: 111, y: 26 }, size: { w: 30, h: 12 } },
          tokens: [token('a', 'Chamber A', 90), token('b', 'Chamber B', 112), token('same', 'Both together', 134)]
        }
      }),
      hints: [
        'Place a prediction, turn the Stopwatch dial up, and press Record.',
        'Compare how much is left in each chamber at the same time.',
        'Ask which gas has the faster particles at one temperature, and whether the chamber that empties first holds it.'
      ],
      check(state) {
        const t = state.table;
        const tk = t.prediction.token;
        if (!tk) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        const left = id => leftAfter(pinholeGas(t, id), 2, T0);
        const want = left('a') === left('b') ? 'same' : left('a') < left('b') ? 'a' : 'b';
        if (tk === want) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The chambers do not follow that prediction: compare how much is left in each at the same time.' };
        return { ok: false, msg: 'Turn the Stopwatch dial up, press Record, and compare how much is left in each chamber with your prediction.' };
      },
      ...STAGE_REWARDS[3]
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const p = pinhole(PIN, { x: 40, y: 32 }, {
      chambers: [{ id: 'a', gas: 'H2', label: 'CHAMBER A' }, { id: 'b', gas: 'O2', label: 'CHAMBER B' }], times: TIMES, timeStart: 1, showHalf: true, record: false
    });
    return {
      title: 'How Much Faster',
      prompt: 'Set the marker to how many times faster hydrogen leaks than oxygen.',
      widget,
      table: gasTable({
        fixtures: [p, markerFixture('ratio', 'Hydrogen leaks faster by', { x: 112, y: 32 }, { min: 0, max: 10, step: 1, start: 0, unit: 'times', w: 56 })]
      }),
      hints: [
        'Read the time each chamber takes to be half empty.',
        'Compare the two times as a ratio.',
        'Divide the time the oxygen takes by the time the hydrogen takes, since the faster leak takes the shorter time.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'ratio');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the ratio you work out.' };
        const want = Math.round(halfTime('O2', T0) / halfTime('H2', T0));
        if (v === want) return { ok: true };
        return { ok: false, msg: 'Compare the two times to half empty: the faster leak takes the shorter time, and the ratio of the times is the ratio of the rates.' };
      },
      ...STAGE_REWARDS[4]
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const p = pinhole(PIN, { x: 38, y: 30 }, {
      chambers: [{ id: 'a', gas: 'He', label: 'REFERENCE' }, { id: 'b', gas: 'Ar', label: 'SAMPLE B', sealed: true }], times: TIMES, timeStart: 1, showHalf: true, record: false
    });
    const trays = NOBLES.map((g, i) => ({ id: g.toLowerCase(), label: GASES[g].name[0].toUpperCase() + GASES[g].name.slice(1), at: { x: 88 + i * 16, y: 38 }, size: { w: 15, h: 22 }, cell: 13 }));
    return {
      title: 'Name the Gas',
      prompt: 'Race the unmarked sample against helium, then put the sample in the tray of the gas it must be.',
      widget,
      table: gasTable({
        pieces: [{ ...chip('u', 'SAMPLE B', { x: 104, y: 55 }), hidden: true, fetchFrom: 'bleed' }],
        fixtures: [p, plaqueFixture('ref', 'Molar mass, g per mole', { x: 110, y: 11 }, ['He 4.0  Ne 20.2  Ar 39.9', 'Kr 83.8  Xe 131'], { w: 60 })],
        zones: { trays },
        fetch: [{ id: 'bleed', label: 'Stack Leak', at: { x: 130, y: 57 } }]
      }),
      hints: [
        'Fetch the sample from the stack, turn the Stopwatch dial, and read the time each chamber takes to be half empty.',
        'Compare the two times as a ratio, and square it.',
        'Multiply the molar mass of helium by the square of the ratio of the times, and find that molar mass on the plate.'
      ],
      check(state) {
        const t = state.table;
        if (t.pieces.u.hidden) return { ok: false, notYet: true, msg: 'Fetch the sample from the stack first.' };
        const tray = whereIs(t, 'u');
        if (!NOBLES.map(g => g.toLowerCase()).includes(tray)) return { ok: false, notYet: true, msg: 'Put the sample in the tray of the gas you think it is.' };
        const guess = GASES.He.M * (halfTime('Ar', T0) / halfTime('He', T0)) ** 2;
        const want = NOBLES.slice().sort((a, b) => Math.abs(GASES[a].M - guess) - Math.abs(GASES[b].M - guess))[0].toLowerCase();
        if (tray === want) return { ok: true };
        return { ok: false, msg: 'Square the ratio of the two times before comparing it with the molar masses; the rates go as the root of the mass.' };
      },
      ...STAGE_REWARDS[5]
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const w = walk('w', { x: 42, y: 32 }, { times: WALK_TIMES, timeStart: 1, seed: WALK_SEED, w: 66, h: 42 });
    return {
      title: 'A Smell Crosses a Room',
      prompt: 'Set the marker to how many times farther the particle has run than it is from where it began, at 16 seconds.',
      widget,
      table: gasTable({
        fixtures: [w, markerFixture('ratio', 'Run farther by', { x: 118, y: 32 }, { min: 0, max: 20, step: 1, start: 0, unit: 'times', w: 58 })]
      }),
      hints: [
        'Turn the Clock dial up and watch the track the one particle makes.',
        'Compare the distance the particle has run with how far it is from where it began.',
        'Divide the distance run by the distance from the start at the clock setting the prompt names.'
      ],
      check(state) {
        const t = state.table;
        const v = markerRead(t, 'ratio');
        if (v === 0) return { ok: false, notYet: true, msg: 'Set the marker to the figure you work out.' };
        const r = walkAt(t, 'w', WALK_SECONDS);
        const want = Math.round(r.length) / Math.round(r.net);
        if (Math.abs(v - want) <= Math.max(1, want * 0.1)) return { ok: true };
        return { ok: false, msg: 'Set the clock to 16 seconds, then divide the distance run by the distance from the start: the track wanders, so the two are far apart.' };
      },
      ...STAGE_REWARDS[6]
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const tb = tube('tube', { x: 42, y: 28 }, { ends: ['NH3', 'HCl'], times: TUBE_TIMES, timeStart: 1, length: TUBE_CM });
    return {
      title: 'The Race Down the Tube',
      prompt: 'Predict where the two gases meet in the tube, then test it.',
      widget,
      table: gasTable({
        fixtures: [tb],
        prediction: {
          slot: { id: 'predict', label: 'Where they meet', at: { x: 111, y: 26 }, size: { w: 30, h: 12 } },
          tokens: [token('nh3', 'NH₃ end', 90), token('mid', 'Halfway', 112), token('hcl', 'HCl end', 134)]
        }
      }),
      hints: [
        'Place a prediction, turn the Stopwatch dial up until the two gases touch, and press Check.',
        'Compare how far each gas has crept at the same time.',
        'The meeting point lies nearer the end of the gas that has crept the shorter way.'
      ],
      check(state) {
        const t = state.table;
        const tk = t.prediction.token;
        if (!tk) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        const ring = tubeAtEnd(t, 'tube').ringFromLeft;
        const want = Math.abs(ring - TUBE_CM / 2) < TUBE_CM * 0.05 ? 'mid' : ring < TUBE_CM / 2 ? 'nh3' : 'hcl';
        if (tk === want) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The ring does not form where that prediction puts it: compare how far each gas has crept at the same time.' };
        return { ok: false, msg: 'Turn the Stopwatch dial up until the gases touch, press Check, and compare the ring with your prediction.' };
      },
      ...STAGE_REWARDS[7]
    };
  })()
];

/** The gas a pinhole's chamber holds. */
function pinholeGas(t, id) {
  return t.fixtures[PIN].props.chambers.find(c => c.id === id).gas;
}

/** A walk's reading at a clock setting the player may not have set: `seconds` of the same track. */
function walkAt(t, id, seconds) {
  const f = t.fixtures[id];
  const idx = f.props.times.indexOf(seconds) + 1;
  return walkRead({ ...t, fixtures: { ...t.fixtures, [id]: { ...f, dials: { ...f.dials, time: { ...f.dials.time, value: idx } } } } }, id);
}

/** A tube read at the end of its stopwatch: where its ring forms once the gases have met. */
function tubeAtEnd(t, id) {
  const f = t.fixtures[id];
  return tubeRead({ ...t, fixtures: { ...t.fixtures, [id]: { ...f, dials: { ...f.dials, time: { ...f.dials.time, value: f.props.times.length } } } } }, id);
}

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Heater dial and watch the screen.'],
  2: ['Drag each cylinder into its place on the rail.'],
  3: ['Turn the Heater dial and read the share above the bar.'],
  4: ['Place a prediction, turn the Stopwatch dial,', 'then press Record.'],
  5: ['Set the marker to the figure you work out.'],
  6: ['Fetch the sample, read the times,', 'then put it in a tray.'],
  7: ['Set the clock, read the plate,', 'then set the marker.'],
  8: ['Place a prediction, turn the Stopwatch dial,', 'then press Check.']
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
      body: 'Heating widens the spread of speeds and lengthens its fast tail, lighter gases are faster at the same temperature, a hole lets the lighter gas out first, and a crowd turns a straight dash into a slow wander.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Gases are separated by leaking, smells and spills travel by wandering, and the fast tail is the first sign of what makes some collisions count and others not.'
    },
    {
      heading: 'Next',
      body: 'The last bench squeezes and cools a gas until the ideal picture stops being true.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A gas is heated in a rigid container. What happens to the Maxwell–Boltzmann distribution of its particle speeds?',
    options: [
      { id: 'a', label: 'The peak moves to a higher speed and the curve flattens and widens' },
      { id: 'b', label: 'The peak moves to a higher speed and the curve narrows' },
      { id: 'c', label: 'The peak stays where it is and gets taller' },
      { id: 'd', label: 'The peak moves to a lower speed' }
    ],
    answer: 'a',
    explanation: 'Heating raises the average kinetic energy, so the typical speed rises and the spread of speeds widens, which lowers the peak.'
  },
  {
    question: 'Which of these gases has the highest average particle speed at 300 K?',
    options: [
      { id: 'a', label: 'H₂' },
      { id: 'b', label: 'N₂' },
      { id: 'c', label: 'O₂' },
      { id: 'd', label: 'CO₂' }
    ],
    answer: 'a',
    explanation: 'All gases have the same average kinetic energy at one temperature, so the lightest particles move fastest. H₂ has the smallest molar mass.'
  },
  {
    question: 'Raising the temperature greatly increases the number of particles above a given high speed. Why does this matter for reactions?',
    options: [
      { id: 'a', label: 'Only particles with enough energy can react when they collide, and the fast tail supplies them' },
      { id: 'b', label: 'Faster particles are heavier' },
      { id: 'c', label: 'Heat changes the molar mass of the particles' },
      { id: 'd', label: 'Hotter gases contain more particles' }
    ],
    answer: 'a',
    explanation: 'Many collisions need a minimum energy to count. A small rise in temperature multiplies the number of particles in the fast tail that have it.'
  },
  {
    question: 'Oxygen has a molar mass of 32 g/mol and methane 16 g/mol. How do their effusion rates compare at the same temperature?',
    options: [
      { id: 'a', label: 'Methane effuses about 1.4 times as fast' },
      { id: 'b', label: 'Methane effuses twice as fast' },
      { id: 'c', label: 'Oxygen effuses about 1.4 times as fast' },
      { id: 'd', label: 'They effuse at the same rate' }
    ],
    answer: 'a',
    explanation: 'By Graham’s law the rate goes as one over the square root of the molar mass: √(32/16) = √2 ≈ 1.4, in favour of the lighter methane.'
  },
  {
    question: 'Why does the smell of perfume take several seconds to cross a room when its molecules move at hundreds of metres per second?',
    options: [
      { id: 'a', label: 'They collide with air molecules constantly, so their path is a random walk' },
      { id: 'b', label: 'Perfume molecules are slower than air molecules' },
      { id: 'c', label: 'Perfume molecules must wait to evaporate' },
      { id: 'd', label: 'The air pushes the molecules back toward the bottle' }
    ],
    answer: 'a',
    explanation: 'Diffusion is slow because each particle changes direction at every collision, so the distance from the start grows much more slowly than the distance travelled.'
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
  [dial(RIG, 'temp', 4)],
  [put('b', 'rail:0'), put('a', 'rail:1'), put('c', 'rail:2')],
  [dial(RIG, 'temp', 4)],
  [{ predict: 'b' }, dial(PIN, 'time', 4), { run: PIN }],
  [dial('ratio', 'value', 4)],
  [{ fetch: 'bleed' }, dial(PIN, 'time', 4), put('u', 'tray:ar')],
  [dial('w', 'time', 4), dial('ratio', 'value', 8)],
  [{ predict: 'hcl' }, dial('tube', 'time', 5), { run: 'tube' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial(RIG, 'temp', 2)],
  [put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2')],
  [dial(RIG, 'temp', 3)],
  [{ predict: 'a' }, dial(PIN, 'time', 4), { run: PIN }],
  [dial('ratio', 'value', 2)],
  [{ fetch: 'bleed' }, put('u', 'tray:kr')],
  [dial('w', 'time', 4), dial('ratio', 'value', 2)],
  [{ predict: 'nh3' }, dial('tube', 'time', 5), { run: 'tube' }]
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
export const CHECKS = { speeds, fractionAbove, halfTime, leftAfter, front, GASES, BAR, MARK, baseShare, pinholeRead, tubeRead, walkRead };
