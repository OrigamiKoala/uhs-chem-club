/**
 * q5-speed.js — Bellows, bench five: SPEED AND ESCAPE.
 *
 * The leak-test station at a vent stack, on the gas kit (`table/kits/gas.js`). Bench one found that the particles of a gas move at a
 * spread of speeds, and that a lighter gas is faster at one temperature. This one asks what that does when a gas finds a hole, and
 * when it has to push its way through other gas.
 *
 * THE CLICK. Players expect a heavy gas to be the one that gets away, or all gases to leak alike: a hole is a hole. Stage 1 asks which
 * of a helium chamber and a nitrogen chamber, each with a pinhole, will empty first (a predict stage, no instrument). Stage 2 sets four
 * chambers out, with the particles flying about in the glass, and the player ranks them by how soon each is empty. The lightest goes
 * first, the heaviest last, and the word for it is given only then. Stage 3 uses it to name an unknown leak by matching it against
 * a reference whose gas the player can change; stages 4 and 5 meet the same idea in a new case, two gases racing down a tube.
 *
 *   1  PREDICT: which of two chambers empties first
 *   2  TEST: rank four chambers by how soon each runs out        -> Effusion
 *   3  set a reference chamber to empty at the sample's pace      -> Naming by Leak
 *   4  PREDICT: where two gases let in at the two ends of a tube meet
 *   5  TEST: the race down the tube                              -> Diffusion
 *   6  the molar mass of an unknown gas, from how long it takes to half-empty -> Graham's law (a figure worked out)
 *
 * (Cut as repeats or as past the idea: the speed-peak target and the ranking of three gases' speeds, which bench one works out; the fast
 * tail of a heated gas; the ratio and the square-root law, which were arithmetic on the same leak; and the random walk of a smell,
 * whose lesson the tube shows. The unmarked sample no longer has to be fetched from the stack: it stands on the bench.)
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { gasTable, pinhole, tube, chip, stmt, halfTime, tubeRead, pinholeRead, GASES, front } from '../../table/kits/gas.js';
import { widget, put, dial, cardIn, predictStage, youPredicted, guessOf, answerCards, answerSlot, answerOf } from './_shared.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\beffusion\b/i, introducedAt: 2 },
  { term: /\bdiffusion\b/i, introducedAt: 5 },
  { term: /\bgraham.?s law\b/i, introducedAt: 6 }
];

/** Pressure, kelvin, the speed screen and the gas laws are plain words here. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit04/q3-ideal'];

export const KEY_LEAK = 'unit04/q5-speed#leak';
export const KEY_TUBE = 'unit04/q5-speed#tube';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const PIN = 'pin';
const T0 = 300;
/** The seconds a stopwatch can be set to. */
const TIMES = [0, 1, 2, 3, 4, 5, 6];
/** The chambers of stage 2, in the order they stand on the bench (the lightest is not first), and their gases. */
export const CHAMBERS = [['a', 'N2'], ['b', 'H2'], ['c', 'CO2'], ['d', 'He']];
/** The reference chamber's gases and the sample's gas in stage 3. */
export const REFERENCE_GASES = ['Ne', 'Ar', 'Kr', 'Xe'];
export const SAMPLE = 'Kr';
/** Stage 6: the reference gases on its dial, the unknown (not on the dial), and the figures to lay: the right mass, helium doubled, the nearest reference's, and a half of the answer. */
export const MASS_GASES = ['He', 'Ne', 'Ar', 'Kr'];
export const UNKNOWN = 'CH4';
export const MASS_CARDS = [['a', '8 g/mol', 8], ['b', '16 g/mol', 16], ['c', '20 g/mol', 20], ['d', '32 g/mol', 32]];
/** The tube: its length in centimetres and the stopwatch's seconds. */
export const TUBE_CM = 100;
const TUBE_TIMES = [0, 15, 30, 45, 60, 75];

export const LEAK_GUESSES = [['he', 'The helium chamber'], ['n2', 'The nitrogen chamber'], ['same', 'Both together']];
export const TUBE_GUESSES = [['nh3', 'Nearer the ammonia end'], ['mid', 'Halfway'], ['hcl', 'Nearer the hydrogen chloride end']];

/** Where the ring has formed, as the card that says so: more than a twentieth of the tube from the middle is "nearer an end". */
export function ringCard(ringFromLeft, length = TUBE_CM) {
  return Math.abs(ringFromLeft - length / 2) < length * 0.05 ? 'mid' : ringFromLeft < length / 2 ? 'nh3' : 'hcl';
}

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: KEY_LEAK,
    title: 'Effusion Prediction',
    prompt: 'A helium chamber and a nitrogen chamber each have a tiny hole in the wall: which one runs out of gas first?',
    items: LEAK_GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Picture the particles of each gas flying at the wall and ask which kind reaches the hole more often.',
      'Ask whether speed at one temperature depends on how heavy a particle is.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'Chambers with pinholes will now be tested to observe which gas escapes faster.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const p = pinhole(PIN, { x: 55, y: 25 }, {
      chambers: CHAMBERS.map(([id, gas]) => ({ id, gas, label: `CHAMBER ${id.toUpperCase()}` })), times: TIMES, timeStart: 1, w: 100, record: false
    });
    return {
      title: 'Effusion Rates',
      get prompt() {
        return youPredicted(KEY_LEAK, LEAK_GUESSES, 'Rank the four chambers on the rail from earliest to empty to latest to empty.', 'Rank the four chambers on the rail from earliest to empty to latest to empty.');
      },
      widget,
      table: gasTable({
        pieces: CHAMBERS.map(([id]) => chip(id, `CHAMBER ${id.toUpperCase()}`, { x: 0, y: 0 })),
        fixtures: [p],
        zones: { rail: { id: 'rail', at: { x: 75, y: 56 }, size: { w: 84, h: 14 }, first: 'Empties first', last: 'Empties last', items: CHAMBERS.map(([id]) => id), start: CHAMBERS.map(([id]) => id) } }
      }),
      hints: [
        'Turn the Stopwatch dial to observe the chambers over time.',
        'Compare the remaining gas in each chamber at equal times.',
        'Place the chamber that empties earliest at the left end of the rail.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four chambers on the rail.' };
        const gasOf = id => CHAMBERS.find(c => c[0] === id)[1];
        const want = CHAMBERS.map(c => c[0]).sort((x, y) => halfTime(gasOf(x), T0) - halfTime(gasOf(y), T0));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two adjacent chambers on the rail are in the wrong order.' };
      },
      get reward() {
        return {
          log: 'The lightest gas emptied fastest.',
          title: 'Effusion',
          body: 'Gas escaping through a pinhole into a vacuum undergoes effusion. Lighter gas molecules have higher average speeds at a given temperature, reaching the hole more frequently and effusing faster.'
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const p = pinhole(PIN, { x: 40, y: 30 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: SAMPLE, label: 'STACK LEAK', sealed: true }],
      picks: { ref: { gases: REFERENCE_GASES, label: 'Gas', start: 1 } }, times: TIMES, timeStart: 1, showHalf: true, record: false
    });
    return {
      title: 'Identifying an Unknown Gas',
      prompt: 'Set the reference gas so its effusion rate matches the unknown sample.',
      widget,
      table: gasTable({ fixtures: [p] }),
      hints: [
        'Adjust the Gas dial and use the Stopwatch dial.',
        'Compare the time required for each chamber to reach half its initial amount.',
        'Select the reference gas whose half-time matches the unknown sample.'
      ],
      check(state) {
        const t = state.table;
        const r = pinholeRead(t, PIN);
        const ref = r.chambers[0];
        const leak = r.chambers[1];
        if (Math.round(t.fixtures[PIN].dials.ref.value) === 1) return { ok: false, notYet: true, msg: 'Turn the Gas dial to test different gases.' };
        if (ref.gas === leak.gas) return { ok: true };
        return { ok: false, msg: ref.half < leak.half ? 'The reference chamber empties faster than the unknown sample.' : 'The reference chamber empties more slowly than the unknown sample.' };
      },
      reward: {
        log: 'Effusion rate matched to reference gas.',
        title: 'Effusion Rate and Molar Mass',
        body: 'Gases with identical effusion rates at the same temperature have the same molar mass. Comparing an unknown gas to reference standards identifies its molecular weight.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  predictStage({
    key: KEY_TUBE,
    title: 'Gas Meeting Point',
    prompt: 'Ammonia and hydrogen chloride are let into opposite ends of a long tube of still air: where do they meet?',
    items: TUBE_GUESSES,
    hints: [
      'Lay one card in the slot.',
      'Compare the speeds of the two gases in the tube as the last bench found them.',
      'Ask what the particles bump into on the way, and whether that slows both kinds equally.'
    ],
    reward: {
      log: 'Prediction recorded.',
      title: 'Prediction Recorded',
      body: 'A tube with opposing gas inputs will test where the two gases meet.'
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const tb = tube('tube', { x: 42, y: 28 }, { ends: ['NH3', 'HCl'], times: TUBE_TIMES, timeStart: 1, length: TUBE_CM });
    return {
      title: 'Diffusion Along a Tube',
      get prompt() {
        return youPredicted(KEY_TUBE, TUBE_GUESSES, 'Run the stopwatch until the gases meet, then place the card for where the ring formed.', 'Run the stopwatch until the gases meet, then place the card for where the ring formed.');
      },
      widget,
      table: gasTable({
        pieces: [stmt('nh3', 'Nearer the ammonia end', { x: 97, y: 45 }), stmt('mid', 'Halfway', { x: 131, y: 45 }), stmt('hcl', 'Nearer the hydrogen chloride end', { x: 114, y: 57.5 })],
        fixtures: [tb],
        zones: { slots: [{ id: 'show', label: 'Prediction', at: { x: 114, y: 26 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Advance the Stopwatch dial and press Check.',
        'Observe how far each gas migrates through the tube over time.',
        'Place the card corresponding to the position where the reaction ring appears.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        const f = t.fixtures.tube;
        const end = { ...t, fixtures: { ...t.fixtures, tube: { ...f, dials: { ...f.dials, time: { ...f.dials.time, value: f.props.times.length } } } } };
        const want = ringCard(tubeRead(end, 'tube').ringFromLeft);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: 'The reaction ring does not form at that position.' };
      },
      get reward() {
        return {
          log: 'The reaction ring formed closer to the heavier gas.',
          title: 'Diffusion',
          body: 'Gases disperse through other gases by diffusion. Frequent molecular collisions slow net movement, but lighter molecules travel faster on average, causing the reaction ring to form closer to the heavier gas.'
        };
      }
    };
  })()  ,

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const p = pinhole(PIN, { x: 40, y: 30 }, {
      chambers: [{ id: 'a', label: 'REFERENCE', pick: 'ref' }, { id: 'b', gas: UNKNOWN, label: 'UNKNOWN', sealed: true }],
      picks: { ref: { gases: MASS_GASES, label: 'Gas', start: 1 } }, times: TIMES, timeStart: 1, showHalf: true, record: false
    });
    return {
      title: 'Graham\'s Law',
      prompt: 'Lay the card for the mass of one mole of the unknown gas.',
      widget,
      table: gasTable({
        pieces: answerCards(MASS_CARDS),
        fixtures: [p],
        zones: { slots: [answerSlot('Unknown gas')] }
      }),
      hints: [
        'Turn the "Gas" dial and read each reference gas\'s half-empty time.',
        'Compare how the half-empty time grows when the mass grows, from helium to neon and from neon to argon.',
        'The half-empty time grows with the square root of the mass, so square the ratio of times before scaling a mass.'
      ],
      check(state) {
        const v = answerOf(state.table, MASS_CARDS);
        if (v == null) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const want = GASES[UNKNOWN].M;
        if (Math.abs(v - want) / want < 0.03) return { ok: true };
        return { ok: false, msg: v > want ? 'The unknown gas has a smaller figure than that.' : 'The unknown gas has a larger figure than that.' };
      },
      reward: {
        log: 'Time grew as the square root of the mass.',
        title: 'Graham\'s Law',
        body: 'The half-empty time goes as the square root of the molar mass, so a time ratio of 2 means a mass ratio of 4 (Graham\'s law). The unknown takes twice as long as helium, so its molar mass is 4 × 4 = 16 g/mol: methane.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Place a card in the slot.'],
  2: ['Turn the Stopwatch dial,', 'then arrange the chips on the rail.'],
  3: ['Adjust the Gas and Stopwatch dials.'],
  4: ['Place a card in the slot.'],
  5: ['Advance the Stopwatch dial and press Check,', 'then place a card in the slot.'],
  6: ['He 4 · Ne 20 · Ar 40 · Kr 84 g/mol.', 'Turn the Gas dial, then place a card in the slot.']
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
      body: 'Lighter gas molecules have higher average velocities at a given temperature, causing them to effuse through pinholes and diffuse through other gases more rapidly than heavier molecules.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Two chambers of the same size, one of hydrogen and one of oxygen, each have a pinhole. Which empties first?',
    options: [
      { id: 'a', label: 'Hydrogen, because its particles are lighter and faster' },
      { id: 'b', label: 'Oxygen, because its particles are heavier' },
      { id: 'c', label: 'They empty together' },
      { id: 'd', label: 'It depends on the size of the hole only' }
    ],
    answer: 'a',
    explanation: 'At one temperature the lighter particles move faster, so more of them reach the hole each second.'
  },
  {
    question: 'An unknown gas empties through a pinhole at the same pace as neon. What can you say about it?',
    options: [
      { id: 'a', label: 'Its particles have about the same mass as neon\'s' },
      { id: 'b', label: 'It is lighter than neon' },
      { id: 'c', label: 'It is heavier than neon' },
      { id: 'd', label: 'Nothing; leaking tells you nothing about the gas' }
    ],
    answer: 'a',
    explanation: 'The pace of a leak depends on the mass of the particles, so a matching pace means a matching mass.'
  },
  {
    question: 'Which of these gases leaks fastest through a pinhole at one temperature?',
    options: [
      { id: 'a', label: 'Hydrogen' },
      { id: 'b', label: 'Helium' },
      { id: 'c', label: 'Nitrogen' },
      { id: 'd', label: 'Carbon dioxide' }
    ],
    answer: 'a',
    explanation: 'Hydrogen has the lightest particles, so they move fastest and come to the hole most often.'
  },
  {
    question: 'Ammonia and hydrogen chloride are let in at the two ends of a tube. The white ring forms nearer which end?',
    options: [
      { id: 'a', label: 'The hydrogen chloride end, because ammonia is lighter and spreads further' },
      { id: 'b', label: 'The ammonia end, because it is lighter' },
      { id: 'c', label: 'The middle, because they are let in together' },
      { id: 'd', label: 'Neither; no ring forms' }
    ],
    answer: 'a',
    explanation: 'The lighter ammonia has crept further when they meet, so the meeting point is nearer the heavier gas\'s end.'
  },
  {
    question: 'Why does a smell take seconds to cross a room when its particles move at hundreds of metres a second?',
    options: [
      { id: 'a', label: 'They keep colliding with air particles and wander instead of flying straight' },
      { id: 'b', label: 'The particles of a smell are slow' },
      { id: 'c', label: 'The air pushes them back' },
      { id: 'd', label: 'Smells are not made of particles' }
    ],
    answer: 'a',
    explanation: 'Constant collisions turn a straight run into a random walk, so the distance from the start grows slowly (diffusion).'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

export const SOLUTIONS = [
  [put('he', 'slot:predict')],
  [dial(PIN, 'time', 3), put('b', 'rail:0'), put('d', 'rail:1'), put('a', 'rail:2'), put('c', 'rail:3')],
  [dial(PIN, 'time', 2), dial(PIN, 'ref', 3)],
  [put('hcl', 'slot:predict')],
  [dial('tube', 'time', 6), { run: 'tube' }, put('hcl', 'slot:show')],
  [dial(PIN, 'ref', 2), put('b', 'slot:answer')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(PIN, 'time', 3), put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('d', 'rail:3')],
  [dial(PIN, 'ref', 2)],
  [],
  [dial('tube', 'time', 6), { run: 'tube' }, put('mid', 'slot:show')],
  [dial(PIN, 'ref', 2), put('c', 'slot:answer')]
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
export { halfTime, tubeRead, pinholeRead, GASES, front };
