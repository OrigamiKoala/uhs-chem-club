/**
 * q5-numbers.js — Lanternfall, bench five: QUANTUM NUMBERS.
 *
 * **BEYOND THE EXAM.** The AP exam does not assess quantum-number assignment, and
 * the stage-one card says so. The box rack in its `address` layout labels every
 * row with the numbers that name its boxes, and every electron with the one that
 * names its direction, so the four numbers arrive by being READ OFF the board
 * and then named.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  what the first number on every box tracks      -> principal quantum number
 *   2  which shapes the second shell offers           -> angular momentum quantum number
 *   3  how many boxes a d row has                     -> magnetic quantum number
 *   4  two electrons in one box                       -> spin
 *   5  four sets, two of which cannot both be there   -> the Pauli exclusion principle
 *   6  how many electrons the third shell holds       -> 2n squared
 *   7  the numbers that name one of nitrogen's        -> every electron has an address
 *   8  which sets of numbers cannot exist             -> the allowed values
 *
 * The rack never says an arrangement is wrong. It refuses exactly one thing, a
 * second electron of the same direction in one box, and the player is left to
 * work out what that has to mean.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { BoxRack } from '../../engine/instruments.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { handKeys, paintHand, describeAct } from '../../engine/rackcontrols.js';
import { validAddress, sameAddress } from '../../engine/electrons.js';
import { esc } from '../../../ui/layout.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bpauli\b/i, introducedAt: 5 },
  { term: /\bspins?\b/i, introducedAt: 4 },
  { term: /\bmagnetic\b/i, introducedAt: 3 },
  { term: /\bangular momentum\b/i, introducedAt: 2 },
  { term: /\bprincipal\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q4-cloud'];

const SPEAKER = 'Vess';

const TOOL_TEXT = {
  hand: { key: 'Up, Down, Remove', what: 'Pick what the next tap on a box does: place an up arrow, place a down arrow, or lift one out.' }
};

export function toolNoteFor(controlId) { return TOOL_TEXT[controlId] || null; }

/* Which of the four numbers the board has printed so far. */
const SHOW = [
  { n: true, l: false, ml: false, ms: false },
  { n: true, l: true, ml: false, ms: false },
  { n: true, l: true, ml: true, ms: false },
  { n: true, l: true, ml: true, ms: true }
];

const ROWS_N3 = ['1s', '2s', '2p', '3s', '3p', '3d'];

const rackPlate = (rows, extra = {}) => ({
  id: 'rack', label: 'RACK', head: 'rack', layout: 'address', rows, note: 'the orbital boxes, lowest energy at the bottom', ...extra
});

/** The electrons a quest lists as sets of four numbers, written as the board prints them. */
const fmtSet = s => `n = ${s.n}, l = ${s.l}, ml = ${s.ml > 0 ? '+' : ''}${s.ml}, ms = ${s.ms > 0 ? '+1/2' : '-1/2'}`;

const FOUR_ELECTRONS = {
  a: { n: 2, l: 1, ml: 0, ms: 0.5 },
  b: { n: 2, l: 1, ml: 0, ms: -0.5 },
  c: { n: 2, l: 1, ml: 0, ms: 0.5 },
  d: { n: 2, l: 1, ml: 1, ms: 0.5 }
};

const SETS = {
  a: { n: 2, l: 1, ml: -1, ms: 0.5 },
  b: { n: 3, l: 3, ml: 0, ms: -0.5 },
  c: { n: 2, l: 1, ml: 2, ms: 0.5 },
  d: { n: 4, l: 2, ml: -2, ms: 0.5 }
};

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The First Number',
    briefing: {
      speaker: SPEAKER,
      body: 'This rack holds orbital boxes in rows, with the lowest energy at the bottom. This bench goes beyond the exam, so nothing here is marked on it.'
    },
    prompt: 'Find what the first number on every box tracks.',
    controls: [],
    show: 0,
    cloudsBeside: true,
    rows: ['1s', '2s', '2p', '3s'],
    rigs: [rackPlate(['1s', '2s', '2p', '3s'])],
    widget: {
      type: 'choice', label: 'What it tracks',
      options: [
        { id: 'size', label: 'How far out the cloud reaches' },
        { id: 'dir', label: 'Which way the electron is pointing' },
        { id: 'count', label: 'How many boxes the row has' },
        { id: 'who', label: 'Which element the box belongs to' }
      ]
    },
    hints: [
      'Compare the rows labelled with a 1, a 2 and a 3, and the cloud drawn beside each of them.',
      'Look at how the cloud beside each row changes as the first number goes up.',
      'Note which property of the cloud grows steadily from the first row to the last.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what it tracks.' };
      if (state.choice !== 'size') {
        return { ok: false, msg: 'Compare the rows with each other and with the cloud beside them: which of their properties changes as the first number does?' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The first number counts shells outward.',
      title: 'Principal Quantum Number',
      body: 'The first number on every box, n, is the principal quantum number: it sets how far out the cloud reaches and roughly how much energy its electron has. Every row in one shell shares the same n, which counts up from 1. The exam does not assess this bench.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Second Number',
    prompt: 'Find which shapes the second shell offers.',
    controls: [],
    show: 1,
    rows: ['1s', '2s', '2p', '3s', '3p', '3d'],
    rigs: [rackPlate(['1s', '2s', '2p', '3s', '3p', '3d'])],
    widget: {
      type: 'choice', label: 'The shapes on offer',
      options: [
        { id: 'sp', label: 'Round and two-lobed (s and p)' },
        { id: 's', label: 'Round only (s)' },
        { id: 'spd', label: 'Round, two-lobed and four-lobed (s, p and d)' },
        { id: 'p', label: 'Two-lobed only (p)' }
      ]
    },
    hints: [
      'Find every row whose first number is 2 and read the second number printed beside it.',
      'Compare those second numbers with the shapes from the last bench: round, two-lobed and four-lobed.',
      'Match each second number you found to the shape that has that number: 0 is round, 1 is two-lobed.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the shapes.' };
      if (state.choice !== 'sp') {
        return { ok: false, msg: 'Read the second number beside every row of the second shell, and set each one against the shapes from the cloud plate.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The second number picks the shape.',
      title: 'Angular Momentum Number',
      body: 'The second number, l, is the angular momentum quantum number: it sets the shape, with l = 0 for s, 1 for p and 2 for d. For a given n, l can be any whole number from 0 up to n - 1, which is why the second shell has an s row and a p row and no more.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Third Number',
    prompt: 'Count the boxes in a d row.',
    controls: [],
    show: 2,
    rows: ['3s', '3p', '3d'],
    rigs: [rackPlate(['3s', '3p', '3d'])],
    widget: { type: 'number', label: 'Boxes in a d row', min: 1, max: 9, step: 1 },
    hints: [
      'Look at the third number printed above each box in the s, p and d rows.',
      'Compare the range of that number in each row with the number printed for the row itself.',
      'The third number runs from minus the row\'s second number up to plus it, so count every value in between, zero included.'
    ],
    check(state) {
      if (state.number === 1) return { ok: false, notYet: true, msg: 'Set the number of boxes you counted.' };
      if (state.number !== 5) {
        return { ok: false, msg: 'Count every box in the d row on the board, and check your count against the range the third number covers.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The third number picks the orientation.',
      title: 'Magnetic Quantum Number',
      body: 'The third number, ml, is the magnetic quantum number: it picks the orientation of the shape, running from -l to +l, so a row has 2l + 1 boxes. A d row has five boxes, a p row three and an s row one.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Two in One Box',
    prompt: 'Put two electrons in one box.',
    controls: ['hand'],
    show: 3,
    rows: ['1s', '2s', '2p'],
    rigs: [rackPlate(['1s', '2s', '2p'])],
    widget: { type: 'none' },
    hints: [
      'Pick "Up" from the hand keys, then tap a box, and look at what the board prints.',
      'Try tapping the same box again with "Up", then with "Down", and compare what the rack does each time.',
      'Place one electron with "Up" in a box, then place a second in that same box with "Down".'
    ],
    check(state) {
      const doubled = Object.values(state.rack || {}).some(v => v.length === 2);
      if (!doubled) {
        return { ok: false, msg: 'No box holds two electrons yet. Try to put a second one into a box that already has one.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'A second arrow the same way is refused. Opposite is fine.',
      title: 'Spin',
      body: 'The fourth number, ms, is the spin quantum number, and it takes only two values: +1/2 for an up arrow and -1/2 for a down arrow. That is why a box holds two electrons at most, and only when their spins are opposite.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Impossible Pair',
    prompt: 'Find which two electrons cannot share one atom.',
    controls: ['hand'],
    show: 3,
    rows: ['1s', '2s', '2p'],
    reference: Object.entries(FOUR_ELECTRONS).map(([k, s]) => `Electron ${k.toUpperCase()}: ${fmtSet(s)}`),
    rigs: [rackPlate(['1s', '2s', '2p'])],
    widget: {
      type: 'choice', label: 'The pair that cannot coexist',
      options: [
        { id: 'ac', label: 'Electrons A and C' },
        { id: 'ab', label: 'Electrons A and B' },
        { id: 'ad', label: 'Electrons A and D' },
        { id: 'bd', label: 'Electrons B and D' }
      ]
    },
    hints: [
      'Place a pair of electrons in the rack to see which arrangements the board allows and which it refuses.',
      'Compare the four numbers of each pair of electrons and look for a pair that has none of them different.',
      'Check every pair for two electrons that would have to sit in the same box pointing the same way.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the pair.' };
      if (state.choice !== 'ac') {
        return { ok: false, msg: 'A pair can share an address only if all four of its numbers match. Compare the numbers pair by pair.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two electrons cannot share all four numbers.',
      title: 'The Pauli Exclusion Principle',
      body: 'No two electrons in one atom can share all four quantum numbers: this is the Pauli exclusion principle. It is the whole reason a box holds two electrons and no more.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'A Full Shell',
    prompt: 'Count the electrons the third shell holds.',
    controls: ['hand'],
    show: 3,
    rows: ROWS_N3.slice(3),
    rigs: [rackPlate(['3s', '3p', '3d'])],
    widget: { type: 'number', label: 'Electrons in the third shell', min: 2, max: 32, step: 2 },
    hints: [
      'Fill every box in the rows of the third shell with as many electrons as the board will take.',
      'Count the boxes in all the rows of the third shell, and how many electrons each box can hold.',
      'Multiply the number of boxes in the shell by the two electrons each box takes.'
    ],
    check(state) {
      if (state.number === 2) return { ok: false, notYet: true, msg: 'Set the number of electrons you counted.' };
      if (state.number !== 18) {
        return { ok: false, msg: 'Fill the rack until it refuses another electron, then count what is on it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The shell takes as many as its boxes allow.',
      title: '2n Squared',
      body: 'A shell holds 2n² electrons: 2 in the first, 8 in the second and 18 in the third. The count is the number of boxes in the shell, n², times the two spins each box allows.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'An Address for Nitrogen',
    prompt: 'Pick the four numbers that name one of the 2p electrons of Sample A.',
    controls: [],
    show: 3,
    rows: ['1s', '2s', '2p'],
    rigs: [rackPlate(['1s', '2s', '2p'], { label: 'SAMPLE A', sample: 'N', fillGround: true, note: 'N, seven electrons' })],
    widget: {
      type: 'choice', label: 'The four numbers',
      options: [
        { id: 'ok', label: 'n = 2, l = 1, ml = 0, ms = +1/2' },
        { id: 'ml', label: 'n = 2, l = 1, ml = 2, ms = +1/2' },
        { id: 'l', label: 'n = 2, l = 2, ml = 0, ms = +1/2' },
        { id: 'n', label: 'n = 1, l = 1, ml = 0, ms = -1/2' }
      ]
    },
    hints: [
      'Read the numbers the board prints on the electrons in Sample A\'s 2p row.',
      'Check each candidate against the ranges the board shows for n, l, ml and ms.',
      'Discard any set whose l is not smaller than n, or whose ml lies outside the range from minus l to plus l.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick a set of numbers.' };
      if (state.choice !== 'ok') {
        return { ok: false, msg: 'Check the set against the board: each number must lie within the range the board allows for the one before it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Every electron has four numbers, and no two match.',
      title: 'Every Electron Has an Address',
      body: 'Four numbers name any electron in any atom, from its shell down to its direction. Nitrogen\'s three 2p electrons sit in three different boxes, so each of them has an address of its own.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Sets That Cannot Exist',
    prompt: 'Pick every set of numbers that cannot name an electron.',
    controls: [],
    show: 3,
    rows: ROWS_N3,
    reference: Object.entries(SETS).map(([k, s]) => `Set ${k.toUpperCase()}: ${fmtSet(s)}`),
    rigs: [rackPlate(ROWS_N3)],
    widget: {
      type: 'multi', label: 'Sets that cannot exist',
      options: Object.keys(SETS).map(k => ({ id: k, label: `Set ${k.toUpperCase()}` }))
    },
    hints: [
      'Look at the boxes the board offers for each shell and each shape, and see which sets name no box at all.',
      'Test each set\'s second number against its first, and its third number against its second.',
      'A set fails if l is as large as n, or if ml is more than l away from zero.'
    ],
    check(state) {
      if (!state.picks.length) return { ok: false, notYet: true, msg: 'Pick the sets that cannot exist.' };
      const bad = Object.entries(SETS).filter(([, s]) => !validAddress(s)).map(([k]) => k).sort().join();
      if (state.picks.slice().sort().join() !== bad) {
        return { ok: false, msg: 'Test every set against the board\'s ranges, not just the first one that looks odd, and keep the ones that pass.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'l below n, and ml no further than l from zero.',
      title: 'The Allowed Values',
      body: 'For each n, l runs from 0 to n - 1, and for each l, ml runs from -l to +l. A set outside those ranges, such as l equal to n, or ml beyond l, does not name a box on the rack at all.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Four numbers name every electron: n for its shell, l for its shape, ml for its orientation and ms for its direction. No two electrons in an atom share all four, and from that one rule the capacity of every shell follows.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'The rows of the periodic table are the shells and subshells counted out loud. Two, eight, eighteen: you have just derived the pattern the table was built on.'
    },
    {
      heading: 'Next',
      body: 'The next bench fills those boxes in the order an atom actually does, from hydrogen on, and meets the places where the rule and the magnet disagree.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS. This bench is beyond the exam, and each question says so.
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: '(Beyond the exam.) Which quantum number determines the shape of an orbital?',
    options: [
      { id: 'a', label: 'The angular momentum quantum number, l' },
      { id: 'b', label: 'The principal quantum number, n' },
      { id: 'c', label: 'The magnetic quantum number, ml' },
      { id: 'd', label: 'The spin quantum number, ms' }
    ],
    answer: 'a',
    explanation: 'l sets the shape: 0 for s, 1 for p, 2 for d. n sets the size and energy, ml the orientation and ms the direction of spin.'
  },
  {
    question: '(Beyond the exam.) How many orbitals are in a d subshell?',
    options: [
      { id: 'a', label: '1' },
      { id: 'b', label: '3' },
      { id: 'c', label: '5' },
      { id: 'd', label: '7' }
    ],
    answer: 'c',
    explanation: 'For d, l = 2, so ml takes the values -2, -1, 0, +1 and +2: five orbitals, which hold ten electrons between them.'
  },
  {
    question: '(Beyond the exam.) Which set of quantum numbers cannot describe an electron?',
    options: [
      { id: 'a', label: 'n = 2, l = 2, ml = 0, ms = +1/2' },
      { id: 'b', label: 'n = 3, l = 1, ml = -1, ms = -1/2' },
      { id: 'c', label: 'n = 4, l = 3, ml = +2, ms = +1/2' },
      { id: 'd', label: 'n = 1, l = 0, ml = 0, ms = -1/2' }
    ],
    answer: 'a',
    explanation: 'l must be smaller than n. With n = 2, l can only be 0 or 1, so l = 2 names no orbital.'
  },
  {
    question: '(Beyond the exam.) How many electrons can the n = 4 shell hold?',
    options: [
      { id: 'a', label: '16' },
      { id: 'b', label: '8' },
      { id: 'c', label: '32' },
      { id: 'd', label: '18' }
    ],
    answer: 'c',
    explanation: 'A shell holds 2n² electrons. For n = 4 that is 2 x 16 = 32.'
  },
  {
    question: '(Beyond the exam.) The Pauli exclusion principle says that:',
    options: [
      { id: 'a', label: 'No two electrons in an atom can have all four quantum numbers the same' },
      { id: 'b', label: 'Electrons fill the lowest energy orbitals first' },
      { id: 'c', label: 'Orbitals of equal energy fill one electron at a time before pairing' },
      { id: 'd', label: 'Electrons cannot be in the same shell' }
    ],
    answer: 'a',
    explanation: 'Two electrons may share n, l and ml only if their spins differ, which is why an orbital holds at most two. The other two options describe the aufbau principle and Hund\'s rule.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState() { return { rack: {} }; }

export const SOLUTIONS = [
  { choice: 'size' },
  { choice: 'sp' },
  { number: 5 },
  { rack: { '1s:0': 'ud' } },
  { choice: 'ac' },
  { number: 18 },
  { choice: 'ok' },
  { picks: ['b', 'c'] }
];

export const MISSES = [
  { choice: 'count' },
  { choice: 's' },
  { number: 3 },
  { rack: { '1s:0': 'u' } },
  { choice: 'ab' },
  { number: 8 },
  { choice: 'ml' },
  { picks: ['a', 'b'] }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/** Held to the board's own arithmetic by the verifier. */
export const CHECKS = { FOUR_ELECTRONS, SETS, sameAddress };

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  let rack = null;
  let runner = null;

  function onProbe(hit) {
    const stage = runner.stage;
    if (hit.kind === 'hand') {
      paintHand(runner.frame.el.controls, hit.hand);
      return;
    }
    if (hit.kind === 'rack') {
      runner.state.rack = hit.rack;
      const item = rack.itemFor(hit.plateId);
      const d = describeAct(hit, item);
      runner.readout(d.head, d.body);
      paintHand(runner.frame.el.controls, rack.cfg.hand);
      void stage;
    }
  }

  function onTool(tool) {
    if (tool.startsWith('hand:')) {
      rack.setHand(tool.split(':')[1]);
      paintHand(runner.frame.el.controls, rack.cfg.hand);
    } else if (tool === 'clear') {
      rack.clear();
      runner.state.rack = {};
      runner.readout('Rack // cleared', 'Every box is empty again.');
    }
  }

  function onLoad(stage, i, r) {
    rack.setPlates(stage.rigs, { show: SHOW[stage.show], clouds: Boolean(stage.cloudsBeside), hand: null });
    rack.setSelectable(false);
    r.state.rack = rack.rackOf('rack');

    const parts = [];
    if (stage.controls.includes('hand')) parts.push(handKeys({ clear: true }));
    if (stage.reference?.length) {
      parts.push(`
        <div class="assay-extract">
          <span class="form-label">The sets</span>
          <ul>${stage.reference.map(t => `<li>${esc(t)}</li>`).join('')}</ul>
        </div>
      `);
    }
    r.setControls(parts, onTool);
    paintHand(r.frame.el.controls, null);
    r.readout(null, null, {
      idleHead: 'Rack // standby',
      idle: stage.controls.includes('hand') ? 'Pick a hand, then tap a box.' : 'Read the numbers printed on the board.'
    });
  }

  runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    setup: r => { rack = BoxRack(r.frame.instrumentHost, { onProbe }); },
    onLoad,
    onDispose: () => rack?.dispose()
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
