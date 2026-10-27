/**
 * q6-filling.js — Lanternfall, bench six: ELECTRON CONFIGURATION.
 *
 * The other face of the records tent's board. Bench five gave every box an address; this one fills the boxes the way an atom
 * does, from carbon to chromium, and finds the places where the rule and the measurement part company.
 *
 * The sixth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4b), on the address and filling kit (`table/kits/shells.js`),
 * reworked on 2026-10-23 around ONE CLICK. Arrows are dealt into the rack's boxes by hand (Up, Down, Lift Out dropped on a box), as the
 * Lewis slate deals pairs; the board reads what the rack holds (`electrons.js` `readRack`); a written form is a card put in a slot.
 * At `3D On` the rack's boxes are real wells with a rod for each electron (`shells.js` `piece3d`).
 *
 * THE CLICK. A player fills shells in numerical order: the third shell, all of it, then the fourth. So the guess for potassium's
 * nineteenth electron (the third shell's 3d row, or the fourth shell's 4s row) is asked first, with no rack on the table, and the rack
 * then puts the 4s row below the 3d row on the ladder.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  build carbon so the rack pulls on the magnet as the sample does          -> aufbau principle, Hund's rule, paramagnetic
 *   2  build oxygen, lay the card of what it reads                              -> electron configuration
 *   3  PREDICT: where potassium's nineteenth electron settles (no rack)         -> a guess before the evidence
 *   4  TEST: place that electron on the ladder                                  -> the ladder is not in shell order
 *   5  place chromium so the rack matches the magnet (BEYOND THE EXAM)          -> the Cr and Cu exceptions
 *
 * THE MAGNET MEASURES THE SAMPLE. `Test Sample` reads the real sample's pull from `electrons.MEASURED`, and `Test Rack` reads the
 * arrangement on the rack by the same rule (single electrons pointing the same way add, opposite ones cancel). Chromium is the
 * stage where the two disagree on the first attempt and only agree on the right one, which is why it is a discovery and not a recital.
 *
 * Cut on 2026-10-23 (problems doc T6, T7): carbon's two p electrons as a stage of their own (stage 1 now carries the magnet), iron in
 * noble-gas shorthand (a notation), the blocks of the table (read off a lit bar) and iron's ion (AP depth).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  shellsTable, shelf, hand, configCard, magnet,
  readOf, rackOf, rackPull, rackFor, groundConfig, readRack, isLaddered, MEASURED, boxPieceId, configString, shortString, symbolOf
} from '../../table/kits/shells.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bconfigurations?\b/i, introducedAt: 2 },
  { term: /\bhund.?s? rule\b/i, introducedAt: 1 },
  { term: /\bparamagnetic\b/i, introducedAt: 1 },
  { term: /\baufbau\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q5-numbers', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q6-filling';
const GUESS_LABEL = { d3: 'Third shell, 3d', s4: 'Fourth shell, 4s' };

/** Every piece and key on this bench says what it does on its face, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const ROWS = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'];

/** The Ar core, locked on the rack so a stage can start where an atom's chemistry starts. */
const AR_CORE = rackFor(18);

/** Hands for a stage: Up, Down and Lift Out in a row. */
const hands = (x, y, pitch = 18) => [hand('up', 'up', { x, y }), hand('down', 'down', { x: x + pitch, y }), hand('lift', 'lift', { x: x + 2 * pitch, y })];

/** Four written forms as cards, two rows of three at the bottom right. */
const cards = items => items.map(([id, label], i) => configCard(id, label, { x: 88 + (i % 3) * 24, y: 44 + Math.floor(i / 3) * 13 }));

const SHELF_AT = { x: 36, y: 32 };

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], { x: 34, y: 32 });
    return {
      title: 'Six for Carbon',
      prompt: 'Build a carbon atom on the rack so that it pulls on the magnet as hard as the sample does.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(84, 12)],
        fixtures: [rack.fixture, magnet('msample', { x: 92, y: 42 }, { sample: 'C' }), magnet('mrack', { x: 128, y: 42 }, { rack: 'rack' })]
      }),
      hints: [
        'Use "Up" and "Down" on the boxes, and "Test Sample" and "Test Rack".',
        'Compare the pull of the rack with the pull of the sample, arrangement by arrangement.',
        'Fill the lowest rows first, and find the arrangement of the last two electrons whose pull matches the sample\'s.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place carbon\'s electrons on the rack.' };
        if (r.total !== 6) return { ok: false, msg: 'The rack holds a different number of electrons from carbon.' };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron sits in a row while a lower row still has room.' };
        if (rackPull(t, 'rack') !== MEASURED.C) return { ok: false, msg: 'The rack pulls differently from the sample.' };
        return { ok: true };
      },
      reward: {
        log: 'Carbon is pulled: two electrons are unpaired, pointing alike.',
        title: 'Aufbau and Hund',
        body: 'Electrons fill the lowest rows first, from the bottom of the ladder up: the aufbau principle. In a row they spread across the boxes before any pair up, all pointing the same way, which is Hund\'s rule, and an atom with unpaired electrons is pulled into a magnet and is called paramagnetic.',
        model: { type: 'rack', z: 6, caption: 'Carbon\'s six electrons: the two lowest rows full, and the last two in separate 2p boxes pointing the same way.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], SHELF_AT);
    return {
      title: 'Eight for Oxygen',
      prompt: 'Build oxygen on the rack, then put the card that says what the rack reads in the slot.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(92, 8), ...cards([['p4', '1s² 2s² 2p⁴'], ['p6', '1s² 2s² 2p⁶'], ['p5', '1s² 2s² 2p⁵'], ['s4', '1s² 2s⁴ 2p²']])],
        fixtures: [rack.fixture],
        zones: { slots: [{ id: 'reads', label: 'What the rack reads', at: { x: 112, y: 24 }, size: { w: 28, h: 13 } }] }
      }),
      hints: [
        'Use "Up" and "Down" on the boxes, and the slot for the card.',
        'Compare the figures the rack prints for each row with the written forms on the cards.',
        'Fill the lowest rows first, then match the number of electrons the rack reports in each row to a card.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        const card = Object.values(t.pieces).find(p => p.kind === 'ccard' && p.zone === 'slot:reads');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place oxygen\'s electrons on the rack.' };
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (r.total !== 8 || !isLaddered(r.counts)) return { ok: false, msg: 'The rack does not hold oxygen\'s electrons in the lowest rows.' };
        if (card.label !== r.config) return { ok: false, msg: 'The card and the rack read differently, row by row.' };
        return { ok: true };
      },
      reward: {
        log: 'The rack prints rows and their electrons.',
        title: 'Electron Configuration',
        body: 'The written arrangement the rack prints, each row followed by its number of electrons as a small raised figure, is the electron configuration. Oxygen\'s is 1s² 2s² 2p⁴, with four electrons in 2p filling one box twice and two boxes once.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Potassium\'s Last',
    // A PREDICT STAGE: the rack is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Argon\'s eighteen electrons are placed: where do you think potassium\'s nineteenth electron settles?',
    widget,
    table: shellsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 34, h: 14 } },
        tokens: [
          { id: 'd3', label: 'Third shell, 3d', at: { x: 50, y: 48 }, r: 8 },
          { id: 's4', label: 'Fourth shell, 4s', at: { x: 100, y: 48 }, r: 8 }
        ]
      }
    }),
    hints: [
      'Drag one of the two guesses into the slot.',
      'Think about the order the shells are numbered in, and whether energy has to follow the same order.',
      'There is no wrong guess yet; commit to the one you would bet on.'
    ],
    check(state) {
      if (!state.table.prediction?.token) return { ok: false, notYet: true, msg: 'Put a guess in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const token = state.table.prediction?.token;
      if (token) remember(QUEST_KEY, token);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'A Guess to Test',
      body: 'Filling shell by shell, in the order they are numbered, is a fair guess. Next, the rack will show where the energy ladder puts the electron.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const rack = shelf('rack', ROWS, SHELF_AT, { pre: AR_CORE, locked: true });
    return {
      title: 'Place the Nineteenth',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": where does potassium's nineteenth electron settle on the energy ladder?`
          : 'Where does potassium\'s nineteenth electron settle on the energy ladder?';
      },
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(92, 32)], fixtures: [rack.fixture] }),
      hints: [
        'Use "Up" on a box for the one electron still to place.',
        'Compare the rows that have room by how high each sits on the ladder.',
        'Place the electron in the lowest row with room, even if it is not the next shell along.'
      ],
      check(state) {
        const r = readOf(state.table, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place the one electron still to come.' };
        if (r.total !== 19) return { ok: false, msg: 'The rack holds a different number of electrons from potassium.' };
        if (r.counts['4s'] !== 1) return { ok: false, msg: 'A row lower on the ladder than this electron still has room.' };
        return { ok: true };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 's4'
          ? 'You predicted the 4s row, and the ladder agreed. '
          : 'The ladder did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'The 4s row sits below the 3d row.',
          title: 'Energy Order, Not Shell Order',
          body: `${verdict}The 4s row sits below the 3d row on the ladder, so potassium's last electron goes into 4s even though 3 comes before 4. Rows fill in order of their energy, which is not always the order of their shells.`,
          model: { type: 'rack', z: 19, caption: 'Potassium: the lowest rows full, and the nineteenth electron alone in the 4s box.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rack = shelf('rack', ROWS, SHELF_AT, { pre: AR_CORE, locked: true });
    return {
      title: 'Chromium Disagrees',
      prompt: 'Place chromium\'s electrons so the rack\'s magnetic pull matches the sample.',
      widget,
      beyondExam: true,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(84, 12)],
        fixtures: [rack.fixture, magnet('msample', { x: 92, y: 42 }, { sample: 'Cr' }), magnet('mrack', { x: 128, y: 42 }, { rack: 'rack' })]
      }),
      hints: [
        'Use "Up", "Down", "Test Sample" and "Test Rack".',
        'Compare the two pulls and ask which arrangement of the last six electrons would make the rack pull harder.',
        'Count how many unpaired electrons would have to stand in separate boxes, pointing the same way, to match the sample\'s pull.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place the last six electrons on the rack.' };
        if (r.total !== 24) return { ok: false, msg: 'The rack holds a different number of electrons from chromium.' };
        if (rackPull(t, 'rack') !== MEASURED.Cr) return { ok: false, msg: 'The rack pulls differently from the sample.' };
        return { ok: true };
      },
      reward: {
        log: 'The sample is pulled harder than the rule predicts.',
        title: 'The Chromium Exception',
        body: 'Chromium moves one 4s electron into 3d, so every box in the 3d row holds one (4s¹ 3d⁵), and copper does the same to fill its 3d row (4s¹ 3d¹⁰). The resulting half-filled and filled subshells minimize electron repulsion and increase magnetic pull.',
        model: { type: 'rack', z: 24, caption: 'Chromium: one electron unpaired in 4s and one unpaired in each of the five 3d boxes, six pointing the same way.' },
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag an arrow onto a box.'],
  5: ['Press Test Sample, then Test Rack, and compare the pulls.']
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
      body: 'Electrons fill the lowest available energy levels first (Aufbau principle) and occupy degenerate orbitals singly with parallel spins before pairing (Hund\'s rule). Unpaired electrons produce a net magnetic attraction (paramagnetism).'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Chemical properties and bonding behavior depend on the valence electrons. Writing configurations explains how elements react and form ions.'
    },
    {
      heading: 'Next',
      body: 'The next bench measures the energy required to remove each electron, verifying electron configurations experimentally.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the ground-state electron configuration of oxygen?',
    options: [
      { id: 'a', label: '1s² 2s² 2p⁴' },
      { id: 'b', label: '1s² 2s² 2p⁶' },
      { id: 'c', label: '1s² 2s⁴ 2p²' },
      { id: 'd', label: '1s² 2s² 2p⁵' }
    ],
    answer: 'a',
    explanation: 'Oxygen has 8 electrons. They fill 1s (2), then 2s (2), leaving 4 for the 2p row.'
  },
  {
    question: 'How many unpaired electrons does a ground-state nitrogen atom have?',
    options: [
      { id: 'a', label: '0' },
      { id: 'b', label: '1' },
      { id: 'c', label: '2' },
      { id: 'd', label: '3' }
    ],
    answer: 'd',
    explanation: 'Nitrogen is 1s² 2s² 2p³. By Hund\'s rule the three 2p electrons occupy three separate boxes, all pointing the same way, so all three are unpaired.'
  },
  {
    question: 'Which row does potassium\'s nineteenth electron go into?',
    options: [
      { id: 'a', label: '4s' },
      { id: 'b', label: '3d' },
      { id: 'c', label: '4p' },
      { id: 'd', label: '3p' }
    ],
    answer: 'a',
    explanation: 'Argon has 18 electrons, and the next one goes into 4s, which sits below 3d on the ladder.'
  },
  {
    question: 'An atom has unpaired electrons. How does it behave near a strong magnet?',
    options: [
      { id: 'a', label: 'It is pulled in (paramagnetic)' },
      { id: 'b', label: 'It is pushed away strongly' },
      { id: 'c', label: 'Nothing happens' },
      { id: 'd', label: 'It becomes a magnet itself for ever' }
    ],
    answer: 'a',
    explanation: 'Unpaired electrons pointing the same way add up to a pull. Atoms with every electron paired are only pushed away very slightly.'
  },
  {
    question: 'Chromium\'s ground state is [Ar] 4s¹ 3d⁵, not [Ar] 4s² 3d⁴. What does the magnet find?',
    options: [
      { id: 'a', label: 'Six unpaired electrons' },
      { id: 'b', label: 'Four unpaired electrons' },
      { id: 'c', label: 'No unpaired electrons' },
      { id: 'd', label: 'Two unpaired electrons' }
    ],
    answer: 'a',
    explanation: 'Chromium has one electron in 4s and one in each of the five 3d boxes: six unpaired electrons. The simple filling order would have predicted four.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Arrows are dropped on boxes, cards put in a slot, the magnet pressed.
   Nothing here says what the rack reads or how hard a sample is pulled.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const on = (piece, row, idx) => put(piece, `piece:${boxPieceId('rack', row, idx)}`);
const up = (row, idx) => on('up', row, idx);
const down = (row, idx) => on('down', row, idx);
const pair = (row, idx) => [up(row, idx), down(row, idx)];

export const SOLUTIONS = [
  [{ run: 'msample' }, ...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), { run: 'mrack' }],
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2), down('2p', 0), put('p4', 'slot:reads')],
  [{ predict: 's4' }],
  [up('4s', 0)],
  [{ run: 'msample' }, up('4s', 0), up('3d', 0), up('3d', 1), up('3d', 2), up('3d', 3), up('3d', 4), { run: 'mrack' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...pair('1s', 0), ...pair('2p', 0), ...pair('2p', 1)],
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2), down('2p', 0), put('p6', 'slot:reads')],
  [],
  [up('3d', 0)],
  [...pair('4s', 0), up('3d', 0), up('3d', 1), up('3d', 2), up('3d', 3)]
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
export { AR_CORE, ROWS, rackOf, readRack, groundConfig, configString, shortString, symbolOf, QUEST_KEY };
