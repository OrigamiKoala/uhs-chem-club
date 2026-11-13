/**
 * q6-filling.js — Lanternfall, bench six: ELECTRON CONFIGURATION.
 *
 * Bench five gave every box a quantum address; this bench fills the orbitals the way nature does,
 * from carbon to scandium, exploring the aufbau principle and electron configurations.
 *
 * Potential energy is lowest nearest the nucleus: electrons naturally fall into the lowest available
 * energy levels first (the aufbau principle). Within degenerate orbitals of equal energy, electrons spread
 * out with parallel spins before pairing up (Hund's rule).
 *
 * STAGES:
 *   1  build ground-state carbon on the rack          -> aufbau principle, Hund's rule
 *   2  build oxygen, match configuration card in slot  -> electron configuration notation
 *   3  PREDICT: where potassium's nineteenth electron settles -> energy order vs shell order
 *   4  TEST: place potassium's nineteenth electron in 4s      -> 4s sits below 3d
 *   5  build scandium's ground state on the argon core       -> filling the 3d subshell
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  shellsTable, shelf, hand, configCard, energyWell,
  readOf, rackOf, rackPull, rackFor, groundConfig, readRack, isLaddered, boxPieceId, configString, shortString, symbolOf
} from '../../table/kits/shells.js';

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bconfigurations?\b/i, introducedAt: 3 },
  { term: /\bhund.?s? rule\b/i, introducedAt: 2 },
  { term: /\baufbau\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q5-numbers', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q6-filling';
const GUESS_LABEL = { d3: 'Third shell, 3d', s4: 'Fourth shell, 4s' };

/** Every piece and key on this bench says what it does on its face, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

export const ROWS = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'];

/** The Ar core, locked on the rack so higher stages start where valence chemistry begins. */
export const AR_CORE = rackFor(18);

/** Hands for a stage: Up, Down and Lift Out in a row. */
const hands = (x, y, pitch = 18) => [
  hand('up', 'up', { x, y }),
  hand('down', 'down', { x: x + pitch, y }),
  hand('lift', 'lift', { x: x + 2 * pitch, y })
];

/** Configuration cards. */
const cards = items => items.map(([id, label], i) =>
  configCard(id, label, { x: 88 + (i % 3) * 24, y: 44 + Math.floor(i / 3) * 13 })
);

const SHELF_AT = { x: 38, y: 32 };

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], { x: 38, y: 32 }, { verdict: false });
    return {
      title: 'Five for Boron',
      briefing: {
        speaker: SPEAKER,
        body: 'A subshell is a set of orbitals with the same energy, such as 2s or the three 2p orbitals. The diagram draws each subshell as a row, with higher energy higher up.'
      },
      prompt: 'How are boron\'s five electrons arranged when the atom has its lowest energy?',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Drag "Add ↑" or "Add ↓" onto an orbital to place an electron; "Test Energy" tests the arrangement you have built.',
        'After a test, notice whether any electron sits above an orbital that still has room.',
        'Ask of each electron in turn whether any orbital lower down could still take it.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place boron\'s electrons in the orbitals.' };
        if (r.total !== 5) return { ok: false, msg: `Boron has five electrons, and the diagram holds ${r.total}.` };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron sits in a higher subshell while a lower one still has room, so the atom could lose energy.' };
        return { ok: true };
      },
      reward: {
        log: 'Boron: two in 1s, two in 2s, one in 2p.',
        title: 'The Aufbau Principle',
        body: 'Two electrons in 1s, two in 2s and one in 2p. Filling the subshells from the lowest energy up is called the aufbau principle.',
        model: { type: 'rack', z: 5, stage: 1, caption: 'Boron (Z = 5): 1s fills, then 2s, and the fifth electron goes into 2p.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], { x: 38, y: 32 }, { pre: rackFor(5), locked: true, verdict: false });
    return {
      title: 'Six for Carbon',
      prompt: 'Where does carbon\'s sixth electron go, and with which spin?',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Five electrons are already placed; add the sixth to a 2p orbital and press "Test Energy".',
        'Compare what the energy test says for each place and each spin you try for the sixth electron.',
        'Electrons repel one another, so think which arrangement keeps the two 2p electrons further apart.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 5) return { ok: false, notYet: true, msg: 'Place carbon\'s sixth electron.' };
        if (r.total !== 6) return { ok: false, msg: `Carbon has six electrons, and the diagram holds ${r.total}.` };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'The sixth electron sits in a higher subshell while 2p still has room.' };
        if (r.doubledWhileEmpty) return { ok: false, msg: 'The two 2p electrons share one orbital while two 2p orbitals stand empty, and the energy test reads higher for that.' };
        if (r.mixedSingles) return { ok: false, msg: 'The two 2p electrons are in separate orbitals with opposite spins, and the energy test reads higher for that.' };
        return { ok: true };
      },
      reward: {
        log: 'Carbon: the two 2p electrons in separate orbitals, same spin.',
        title: 'Hund\'s Rule',
        body: 'The sixth electron takes a 2p orbital of its own, with the same spin as the fifth: that is lower in energy than pairing. This is Hund\'s rule.',
        model: { type: 'rack', z: 6, stage: 1, caption: 'Carbon (Z = 6): the two 2p electrons sit in separate orbitals with the same spin.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    // The diagram stands built and does not print the configuration: reading it off the arrows is the task.
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], SHELF_AT, { pre: rackFor(8), locked: true, readout: false });
    return {
      title: 'Writing Oxygen',
      briefing: {
        speaker: SPEAKER,
        body: 'An electron configuration lists each subshell that holds electrons, followed by a small raised number saying how many it holds. 1s² means two electrons in the 1s subshell.'
      },
      prompt: 'Which electron configuration describes the oxygen atom on the diagram?',
      widget,
      table: shellsTable({
        pieces: [
          ...rack.boxes,
          ...cards([['p4', '1s² 2s² 2p⁴'], ['p6', '1s² 2s² 2p⁶'], ['p5', '1s² 2s² 2p⁵'], ['s4', '1s² 2s⁴ 2p²']])
        ],
        fixtures: [rack.fixture],
        zones: { slots: [{ id: 'reads', label: 'Oxygen', at: { x: 112, y: 24 }, size: { w: 28, h: 13 } }] }
      }),
      hints: [
        'The diagram shows oxygen\'s eight electrons as arrows; drag one card into the slot.',
        'Count the arrows in each row of the diagram.',
        'Each raised number on a card must equal the number of arrows in the row that card names.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        const card = Object.values(t.pieces).find(p => p.kind === 'ccard' && p.zone === 'slot:reads');
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (card.label !== r.config) return { ok: false, msg: 'A raised number on that card is not the number of arrows in the row it names.' };
        return { ok: true };
      },
      reward: {
        log: 'Oxygen: 1s² 2s² 2p⁴.',
        title: 'Electron Configuration',
        body: 'Two arrows in 1s, two in 2s and four in 2p: oxygen\'s electron configuration is 1s² 2s² 2p⁴.',
        model: { type: 'rack', z: 8, stage: 2, caption: 'Oxygen (Z = 8): 1s² 2s² 2p⁴. Three 2p electrons take separate orbitals, and the fourth pairs with one of them.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Potassium\'s Last',
    predict: true,
    prompt: 'Argon\'s eighteen electrons fill 1s to 3p: which subshell does potassium\'s nineteenth electron go into?',
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
      'Drag one of the two cards into the slot.',
      'The third shell still has its five 3d orbitals empty, and the fourth shell has not been started.',
      'A prediction is not graded, so choose the one you think is most likely.'
    ],
    check(state) {
      if (!state.table.prediction?.token) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const token = state.table.prediction?.token;
      if (token) remember(QUEST_KEY, token);
    },
    reward: {
      log: 'Prediction made.',
      title: 'Prediction',
      body: 'Next, the diagram draws the 3d and 4s subshells at their energies.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rack = shelf('rack', ROWS, SHELF_AT, { pre: AR_CORE, locked: true, verdict: false });
    return {
      title: 'Place the Nineteenth',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": which subshell does potassium's nineteenth electron go into?`
          : 'Which subshell does potassium\'s nineteenth electron go into?';
      },
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Drag "Add ↑" onto an orbital for the nineteenth electron, and press "Test Energy".',
        'Compare the heights of the 3d row and the 4s row on the diagram.',
        'The aufbau principle goes by energy, so the row drawn lower fills first whatever its shell number.'
      ],
      check(state) {
        const r = readOf(state.table, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place potassium\'s nineteenth electron.' };
        if (r.total !== 19) return { ok: false, msg: `Potassium has nineteen electrons, and the diagram holds ${r.total}.` };
        if (r.counts['4s'] !== 1) return { ok: false, msg: 'The electron sits in a row drawn above an empty one, so the atom could lose energy.' };
        return { ok: true };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 's4' ? 'Your prediction held. ' : 'The diagram did not agree with your prediction. ';
        return {
          log: '4s lies below 3d.',
          title: 'Energy Order, Not Shell Order',
          body: `${verdict}In potassium, 4s fills before 3d. Subshells fill in order of energy, not of shell number.`,
          model: { type: 'rack', z: 19, stage: 4, caption: 'Potassium (Z = 19): 4s lies below 3d, so the nineteenth electron goes into 4s: [Ar] 4s¹.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const rack = shelf('rack', ROWS, SHELF_AT, { pre: AR_CORE, locked: true, verdict: false });
    return {
      title: 'Scandium\'s Twenty-First',
      prompt: 'How are scandium\'s last three electrons arranged when the atom has its lowest energy?',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Argon\'s eighteen electrons are placed; add three more and press "Test Energy".',
        'Notice how many electrons the 4s subshell can take, and which row is drawn next above it.',
        'Fill from the lowest row up, and move to the next row only when the one below has no room left.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place scandium\'s last three electrons.' };
        if (r.total !== 21) return { ok: false, msg: `Scandium has twenty-one electrons, and the diagram holds ${r.total}.` };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron sits in a higher subshell while a lower one still has room, so the atom could lose energy.' };
        return { ok: true };
      },
      reward: {
        log: 'Scandium: 4s² 3d¹ after argon.',
        title: 'After 4s, 3d',
        body: 'Two electrons fill 4s and the third goes into 3d, the next subshell up: 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d¹.',
        model: { type: 'rack', z: 21, stage: 5, caption: 'Scandium (Z = 21): with 4s full, the twenty-first electron goes into 3d: [Ar] 4s² 3d¹.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const rows = ['1s', '2s', '2p', '3s', '3p'];
    const rack = shelf('rack', rows, SHELF_AT, { pre: rackFor(10), locked: true, verdict: false });
    return {
      title: 'A Chloride Ion',
      briefing: {
        speaker: SPEAKER,
        body: 'An ion is an atom that has gained or lost electrons. A chlorine atom has 17 electrons; the chloride ion, Cl⁻, has a charge of −1.'
      },
      prompt: 'What is the electron configuration of the chloride ion, Cl⁻?',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'The first ten electrons are placed; add the rest with "Add ↑" and "Add ↓".',
        'Decide whether a charge of −1 means one electron more or one fewer than the atom has.',
        'Electrons are negative, so work out how the count must change to leave the ion negative overall.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 10) return { ok: false, notYet: true, msg: 'Place the ion\'s remaining electrons.' };
        if (r.total !== 18) return { ok: false, msg: `The diagram holds ${r.total} electrons against chlorine's 17 protons, which gives a charge of ${17 - r.total > 0 ? '+' : '−'}${Math.abs(17 - r.total)}${17 - r.total === 0 ? ' (no charge)' : ''}.` };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron sits in a higher subshell while a lower one still has room.' };
        return { ok: true };
      },
      reward: {
        log: 'Chloride has the same configuration as argon.',
        title: 'Configurations of Ions',
        body: 'Chloride has 18 electrons: 1s² 2s² 2p⁶ 3s² 3p⁶, the same configuration as argon. For main-group ions, the configuration follows from the number of electrons.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate. */
const NOTES = {
  1: ['Drag an arrow onto an orbital.']
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
      body: 'Electrons fill the subshells from the lowest energy up (the aufbau principle), and within a subshell they take separate orbitals with the same spin before any pair (Hund\'s rule). 4s lies below 3d, so it fills first.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'An atom\'s outermost electrons decide how it reacts. A configuration shows which those are, and why the periodic table has the shape it has.'
    },
    {
      heading: 'Next',
      body: 'Next: an instrument that measures how tightly each electron of an atom is held.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const on = (piece, row, idx) => put(piece, `piece:${boxPieceId('rack', row, idx)}`);
const up = (row, idx) => on('up', row, idx);
const down = (row, idx) => on('down', row, idx);
const pair = (row, idx) => [up(row, idx), down(row, idx)];

export const SOLUTIONS = [
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), { run: 'well' }],
  [up('2p', 1), { run: 'well' }],
  [put('p4', 'slot:reads')],
  [{ predict: 's4' }],
  [up('4s', 0)],
  [...pair('4s', 0), up('3d', 0), { run: 'well' }],
  [...pair('3s', 0), ...pair('3p', 0), ...pair('3p', 1), ...pair('3p', 2)]
];

export const MISSES = [
  [...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2)],
  [down('2p', 0), { run: 'well' }],
  [put('p6', 'slot:reads')],
  [],
  [up('3d', 0)],
  [up('4s', 0), ...pair('3d', 0)],
  [...pair('3s', 0), ...pair('3p', 0), ...pair('3p', 1), up('3p', 2)]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() {}
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { symbolOf, configString, shortString, groundConfig, readRack, rackFor, rackOf, rackPull, QUEST_KEY };
