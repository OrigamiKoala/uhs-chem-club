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
import { widget, put, dial, cardIn, predictStage, youPredicted, guessOf } from './_shared.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\beffusion\b/i, introducedAt: 2 },
  { term: /\bdiffusion\b/i, introducedAt: 5 }
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
    title: 'Guess the Leak',
    prompt: 'A helium chamber and a nitrogen chamber each have a tiny hole in the wall: which one runs out of gas first?',
    items: LEAK_GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Picture the particles of each gas flying about, and how often they come to the hole.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    reward: {
      log: 'Prediction locked in.',
      title: 'A Guess Worth Testing',
      body: 'A row of chambers with pinholes is about to be set out, and a stopwatch will say whether the guess holds.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const p = pinhole(PIN, { x: 55, y: 25 }, {
      chambers: CHAMBERS.map(([id, gas]) => ({ id, gas, label: `CHAMBER ${id.toUpperCase()}` })), times: TIMES, timeStart: 1, w: 100, record: false
    });
    return {
      title: 'Four Pinholes',
      get prompt() {
        return youPredicted(KEY_LEAK, LEAK_GUESSES, 'rank the four chambers from the first to run out to the last.', 'Rank the four chambers from the first to run out to the last.');
      },
      widget,
      table: gasTable({
        pieces: CHAMBERS.map(([id]) => chip(id, `CHAMBER ${id.toUpperCase()}`, { x: 0, y: 0 })),
        fixtures: [p],
        zones: { rail: { id: 'rail', at: { x: 75, y: 56 }, size: { w: 84, h: 14 }, first: 'Runs out first', last: 'Runs out last', items: CHAMBERS.map(([id]) => id), start: CHAMBERS.map(([id]) => id) } }
      }),
      hints: [
        'Use the "Stopwatch" dial, and drag the chips along the strip.',
        'Compare how much gas is left in each chamber at the same time.',
        'Put the chamber with the least gas left at the first end of the strip, and the one with the most at the other.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four chambers on the strip.' };
        const gasOf = id => CHAMBERS.find(c => c[0] === id)[1];
        const want = CHAMBERS.map(c => c[0]).sort((x, y) => halfTime(gasOf(x), T0) - halfTime(gasOf(y), T0));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Two neighbouring chambers on the strip are the wrong way round.' };
      },
      get reward() {
        const g = guessOf(KEY_LEAK, LEAK_GUESSES);
        const verdict = !g ? '' : g.id === 'he' ? 'You predicted this one, and the chambers agreed. ' : 'The chambers did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'The lightest gas ran out first.',
          title: 'Effusion',
          body: `${verdict}A gas leaking through a pinhole is effusing, and the lighter the gas the sooner it runs out, because its particles move faster and come to the hole more often.`
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
      title: 'Name the Leak',
      prompt: 'Set the reference chamber\'s gas so that it empties at the same pace as the stack leak.',
      widget,
      table: gasTable({ fixtures: [p] }),
      hints: [
        'Use the "Gas" dial and the "Stopwatch" dial.',
        'Compare the time each chamber takes to be half empty.',
        'Stop on the gas whose time to half empty matches the leak\'s.'
      ],
      check(state) {
        const t = state.table;
        const r = pinholeRead(t, PIN);
        const ref = r.chambers[0];
        const leak = r.chambers[1];
        if (Math.round(t.fixtures[PIN].dials.ref.value) === 1) return { ok: false, notYet: true, msg: 'The reference is where it started: turn its Gas dial and compare the times.' };
        if (ref.gas === leak.gas) return { ok: true };
        return { ok: false, msg: ref.half < leak.half ? 'The reference chamber empties faster than the stack leak.' : 'The reference chamber empties more slowly than the stack leak.' };
      },
      reward: {
        log: 'A leak matched to a gas you know.',
        title: 'Naming by Leak',
        body: 'Gases that empty at the same pace have particles of the same mass, so an unknown gas can be named by matching its leak to a gas you know. The heavier the gas, the slower it leaks.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  predictStage({
    key: KEY_TUBE,
    title: 'Guess the Meeting',
    prompt: 'Ammonia and hydrogen chloride are let into the two ends of a long tube of still air: where do they meet?',
    items: TUBE_GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Ammonia\'s particles are lighter than hydrogen chloride\'s; ask which gas will creep further in the same time.',
      'There is no wrong guess yet; commit to the card you would bet on.'
    ],
    reward: {
      log: 'Prediction locked in.',
      title: 'A Second Guess',
      body: 'A tube of still air is about to be set out with a gas let in at each end, and a white ring will show where they meet.'
    }
  }),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const tb = tube('tube', { x: 42, y: 28 }, { ends: ['NH3', 'HCl'], times: TUBE_TIMES, timeStart: 1, length: TUBE_CM });
    return {
      title: 'The Race Down the Tube',
      get prompt() {
        return youPredicted(KEY_TUBE, TUBE_GUESSES, 'run the stopwatch until the gases meet, then lay the card for where the ring formed.', 'Run the stopwatch until the gases meet, then lay the card for where the ring formed.');
      },
      widget,
      table: gasTable({
        pieces: [stmt('nh3', 'Nearer the ammonia end', { x: 97, y: 45 }), stmt('mid', 'Halfway', { x: 131, y: 45 }), stmt('hcl', 'Nearer the hydrogen chloride end', { x: 114, y: 57.5 })],
        fixtures: [tb],
        zones: { slots: [{ id: 'show', label: 'Where the ring formed', at: { x: 114, y: 26 }, size: { w: 38, h: 12 } }] }
      }),
      hints: [
        'Use the "Stopwatch" dial and "Check".',
        'Compare how far each gas has crept at the same time.',
        'Lay the card for the side of the tube the white ring is nearer to.'
      ],
      check(state) {
        const t = state.table;
        const card = cardIn(t, 'show');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        const f = t.fixtures.tube;
        const end = { ...t, fixtures: { ...t.fixtures, tube: { ...f, dials: { ...f.dials, time: { ...f.dials.time, value: f.props.times.length } } } } };
        const want = ringCard(tubeRead(end, 'tube').ringFromLeft);
        if (card.id === want) return { ok: true };
        return { ok: false, msg: 'The white ring is not where that card puts it.' };
      },
      get reward() {
        const g = guessOf(KEY_TUBE, TUBE_GUESSES);
        const verdict = !g ? '' : g.id === 'hcl' ? 'You predicted this one, and the tube agreed. ' : 'The tube did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'The ring formed nearer the heavier gas.',
          title: 'Diffusion',
          body: `${verdict}Gases spread through other gas by diffusion, far more slowly than their particles fly because they keep colliding, and the lighter gas still spreads faster. So the ring forms nearer the heavier gas's end.`,
          last: true
        };
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag one card into the slot.'],
  2: ['Turn the Stopwatch dial,', 'then drag the chips along the strip.'],
  3: ['Turn the Gas dial and the Stopwatch dial.'],
  4: ['Drag one card into the slot.'],
  5: ['Turn the Stopwatch dial and press Check,', 'then drag a card into the slot.']
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
      body: 'The lighter the gas, the faster its particles go, so the sooner it leaks through a hole and the further it spreads in the same time. A leak that matches a known gas has the same kind of particle.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'This is how a crew names a gas it cannot open: let it leak, and match its pace to one it knows.'
    },
    {
      heading: 'Next',
      body: 'The last bench squeezes and chills a gas until the gas laws stop being true.'
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
  [dial('tube', 'time', 6), { run: 'tube' }, put('hcl', 'slot:show')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [dial(PIN, 'time', 3), put('a', 'rail:0'), put('b', 'rail:1'), put('c', 'rail:2'), put('d', 'rail:3')],
  [dial(PIN, 'ref', 2)],
  [],
  [dial('tube', 'time', 6), { run: 'tube' }, put('mid', 'slot:show')]
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
