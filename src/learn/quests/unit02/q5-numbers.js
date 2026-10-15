/**
 * q5-numbers.js — Lanternfall, bench five: QUANTUM NUMBERS.
 *
 * **BEYOND THE EXAM.** The AP exam does not assess quantum-number assignment, and
 * the stage-one card says so. The box rack in its `address` layout carries an
 * ADDRESS FINDER: four cells the player sets (floor, suite type, room, bunk),
 * and the box the address names lights on the rack, or nothing lights and the
 * strip says no room has that address. So an address is FOUND (set it, see where
 * the light goes) and WRITTEN (set the cells until the lit box is the ringed one)
 * and never read off a label. Stages four and five keep the labelled board: spin
 * and the exclusion rule are things to see on a box with two arrows in it.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  what the floor number does to the lit cloud    -> principal quantum number
 *   2  which shapes the second shell offers           -> angular momentum quantum number
 *   3  finding the box an address names               -> magnetic quantum number
 *   4  two electrons in one box                       -> spin
 *   5  four sets, two of which cannot both be there   -> the Pauli exclusion principle
 *   6  how many electrons the third shell holds       -> 2n squared
 *   7  writing the address of a ringed electron       -> every electron has an address
 *   8  which sets of numbers light no box             -> the allowed values
 *
 * The rack never says an arrangement is wrong. It refuses exactly one thing, a
 * second electron of the same direction in one box, and the player is left to
 * work out what that has to mean.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { BoxRack } from '../../engine/instruments.js';
import { finderStart } from '../../engine/boxrack.js';
import { createRunner, blankAnswer } from '../../engine/stagerunner.js';
import { handKeys, paintHand, describeAct } from '../../engine/rackcontrols.js';
import { validAddress, sameAddress, findRoom } from '../../engine/electrons.js';
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
  d: { n: 3, l: 2, ml: -2, ms: 0.5 }
};

/** The electron stage seven rings: nitrogen's up arrow in the right-hand 2p box. */
const RINGED = { n: 2, l: 1, ml: 1, ms: 0.5 };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The First Number',
    briefing: {
      speaker: SPEAKER,
      body: 'Think of an electron\'s state as an apartment address: floor (n), suite type (l), room (ml), and bunk (ms). Tap the arrows on a cell of the address strip to change it, and the rack lights what that address names.'
    },
    prompt: 'What property of the electron cloud does the floor number (n) set?',
    controls: [],
    show: 0,
    cloudsBeside: true,
    rows: ['1s', '2s', '2p', '3s'],
    rigs: [rackPlate(['1s', '2s', '2p', '3s'], { finder: { show: ['n'], fields: ['n'] } })],
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
      'Tap the arrows on the floor cell and watch which rows light and the cloud drawn beside them.',
      'Compare the cloud beside the rows lit for floor 1 with the one lit for floor 3.',
      'Line the floors up in order and describe what happens to the lit cloud from one floor to the next.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick what it tracks.' };
      if (state.choice !== 'size') {
        return { ok: false, msg: 'Step the floor cell through every floor and watch what changes about the lit cloud, then test your answer against it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The floor number counts shells outward.',
      title: 'Principal Quantum Number (Floor)',
      body: 'The first number on every box, n, is the floor (principal quantum number): it sets how far out the cloud reaches and roughly how much energy its electron has. Every room on one floor shares the same n, which counts up from 1. This bench is an optional Deep Dive.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Second Number',
    prompt: 'Which room types (orbital shapes) does the second floor offer?',
    controls: [],
    show: 1,
    rows: ['1s', '2s', '2p', '3s', '3p', '3d'],
    rigs: [rackPlate(['1s', '2s', '2p', '3s', '3p', '3d'], { finder: { show: ['n', 'l'], fields: ['n', 'l'] } })],
    widget: {
      type: 'choice', label: 'The shapes on offer',
      options: [
        { id: 'sp', label: 'Round and two-lobed (s and p)' },
        { id: 'sd', label: 'Round and four-lobed (s and d)' },
        { id: 'pd', label: 'Two-lobed and four-lobed (p and d)' },
        { id: 'spd', label: 'Round, two-lobed and four-lobed (s, p and d)' }
      ]
    },
    hints: [
      'Set the floor cell to the second floor, then tap through the suite cell and see which settings light a row.',
      'Match the shape drawn beside the suite cell to the cloud shapes from the cloud plate.',
      'Keep only the suite types that light a row on that floor, and leave out the ones that light nothing.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the shapes.' };
      if (state.choice !== 'sp') {
        return { ok: false, msg: 'Hold the floor cell on the second floor, step the suite cell through every setting, and keep only the shapes that light a row.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The second number sets the room type.',
      title: 'Angular Momentum Number (Room Type)',
      body: 'The second number, l, is the suite type (angular momentum number): it sets the shape, with l = 0 for round (s) and 1 for two-lobed (p). On floor n, l runs from 0 up to n - 1, so floor 2 offers s and p suites.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Third Number',
    prompt: 'Which box does the address n = 3, l = 2, ml = +1 name?',
    controls: [],
    show: 2,
    rows: ['3s', '3p', '3d'],
    rigs: [rackPlate(['3s', '3p', '3d'], {
      finder: { show: ['n', 'l', 'ml'], fields: ['l', 'ml'], range: { n: [3, 3], l: [0, 2], ml: [-2, 2] }, start: { n: 3, l: 0, ml: 0 } }
    })],
    widget: {
      type: 'choice', label: 'The box it names',
      options: [
        { id: 'first', label: 'The first box from the left of its row' },
        { id: 'second', label: 'The second box from the left of its row' },
        { id: 'third', label: 'The third box from the left of its row' },
        { id: 'fourth', label: 'The fourth box from the left of its row' }
      ]
    },
    hints: [
      'Set the suite cell, then the room cell, and see which box lights.',
      'Try room numbers either side of zero and notice which way along the row they run.',
      'Compare where room number zero lights with where each number either side of it lights.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Pick the box.' };
      if (state.choice !== 'fourth') {
        return { ok: false, msg: 'Set the address on the strip and see which box lights, then compare its place along the row with your answer.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The third number numbers the rooms.',
      title: 'Magnetic Quantum Number (Room)',
      body: 'The third number, ml, is the room number (magnetic quantum number): it picks the orientation, running from -l to +l, giving 2l + 1 rooms per suite. A d suite has five rooms, p has three, and s has one.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Two in One Box',
    briefing: {
      speaker: SPEAKER,
      body: 'Each room has a bunk bed holding two electrons: top bunk (+1/2, up arrow) and bottom bunk (-1/2, down arrow).'
    },
    prompt: 'Pack two electrons into a single orbital box.',
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
      title: 'Spin (The Bunk)',
      body: 'The fourth number, ms, is the spin (the bunk): +1/2 for an up arrow and -1/2 for a down arrow. A room holds two electrons at most, and only when their spins are opposite.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Impossible Pair',
    prompt: 'Which two candidate electrons can never coexist in the same atom?',
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
      log: 'Two electrons cannot share the same address.',
      title: 'The Pauli Exclusion Principle',
      body: 'No two electrons in one atom can share all four quantum numbers: this is the Pauli exclusion principle. The next bench, electron configuration, builds entirely on this rule.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'A Full Shell',
    prompt: 'How many electrons can the third shell hold when completely filled?',
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
    prompt: 'Write the address of the electron in the ringed box of nitrogen.',
    controls: [],
    show: 3,
    rows: ['1s', '2s', '2p'],
    rigs: [rackPlate(['1s', '2s', '2p'], {
      label: 'SAMPLE A', sample: 'N', fillGround: true, note: 'N, seven electrons',
      target: { row: '2p', idx: 2 },
      finder: { show: ['n', 'l', 'ml', 'ms'], fields: ['n', 'l', 'ml', 'ms'] }
    })],
    widget: { type: 'none' },
    hints: [
      'Set the cells of the address strip until the box that lights is the ringed one.',
      'The lit box gives the floor, suite and room, and the arrow inside the ringed box gives the bunk.',
      'The room number counts from the middle box of the row, and the bunk follows the direction the arrow points.'
    ],
    check(state) {
      const a = state.addr || {};
      if (sameAddress(a, finderStart(this.rigs[0].finder))) return { ok: false, notYet: true, msg: 'Set the address first.' };
      if (!findRoom(a).exists) return { ok: false, msg: 'No room has the address you set. Set one the strip lights, then compare it with the ringed box.' };
      if (!sameAddress(a, RINGED)) {
        return { ok: false, msg: 'That address does not name the ringed electron. Set it, see where the light goes, and check which way the arrow in the box points.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Every electron has four numbers, and no two match.',
      title: 'Every Electron Has an Address',
      body: 'Four numbers give every electron its unique address: floor (n), room type (l), room (ml), and bunk (ms). Nitrogen\'s three 2p electrons sit in three separate rooms, so each has an address of its own.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Sets That Cannot Exist',
    prompt: 'Which listed addresses violate the quantum rules?',
    controls: [],
    show: 3,
    rows: ROWS_N3,
    reference: Object.entries(SETS).map(([k, s]) => `Set ${k.toUpperCase()}: ${fmtSet(s)}`),
    rigs: [rackPlate(ROWS_N3, {
      finder: { show: ['n', 'l', 'ml', 'ms'], fields: ['n', 'l', 'ml', 'ms'] }
    })],
    widget: {
      type: 'multi', label: 'Sets that cannot exist',
      options: Object.keys(SETS).map(k => ({ id: k, label: `Set ${k.toUpperCase()}` }))
    },
    hints: [
      'Set each listed address on the strip and see whether a box lights.',
      'Compare the addresses that light a box with the ones that light nothing, number against number.',
      'Find the largest suite type each floor lights, and the largest room number each suite type lights.'
    ],
    check(state) {
      if (!state.picks.length) return { ok: false, notYet: true, msg: 'Pick the sets that cannot exist.' };
      const bad = Object.entries(SETS).filter(([, s]) => !validAddress(s)).map(([k]) => k).sort().join();
      if (state.picks.slice().sort().join() !== bad) {
        return { ok: false, msg: 'Set every listed address on the strip, not just the first one that looks odd, and keep only the ones that light nothing.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'l below n, and ml no further than l from zero.',
      title: 'The Allowed Values',
      body: 'For each floor n, room types l run from 0 to n - 1, and for each suite l, room numbers ml run from -l to +l. An address outside those ranges does not name a room in the building.',
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
function blankState(stage) {
  const finder = stage?.rigs?.[0]?.finder;
  return { rack: {}, addr: finder ? finderStart(finder) : null };
}

export const SOLUTIONS = [
  { choice: 'size' },
  { choice: 'sp' },
  { choice: 'fourth' },
  { rack: { '1s:0': 'ud' } },
  { choice: 'ac' },
  { number: 18 },
  { addr: RINGED },
  { picks: ['b', 'c'] }
];

export const MISSES = [
  { choice: 'count' },
  { choice: 'sd' },
  { choice: 'third' },
  { rack: { '1s:0': 'u' } },
  { choice: 'ab' },
  { number: 8 },
  { addr: { n: 2, l: 1, ml: -1, ms: 0.5 } },
  { picks: ['a', 'b'] }
];

export function stateFor(i, overrides) {
  return { ...blankAnswer(STAGES[i]), ...blankState(STAGES[i]), ...overrides };
}

/** Held to the board's own arithmetic by the verifier. */
export const CHECKS = { FOUR_ELECTRONS, SETS, RINGED, sameAddress, findRoom };

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
    if (hit.kind === 'addr') {
      runner.state.addr = hit.addr;
      if (hit.found.exists) {
        runner.readout('Strip // address', 'A box is lit for this address.');
      } else {
        runner.readout('Strip // address', 'No room has this address.');
      }
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
    r.state.addr = rack.addrOf('rack');

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
      idle: stage.controls.includes('hand') ? 'Pick a hand, then tap a box.' : stage.rigs[0].finder ? 'Tap the arrows on the address strip.' : 'Read the numbers printed on the board.'
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
