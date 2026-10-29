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

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bconfigurations?\b/i, introducedAt: 2 },
  { term: /\bhund.?s? rule\b/i, introducedAt: 1 },
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
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], { x: 38, y: 32 });
    return {
      title: 'Six for Carbon',
      prompt: 'Build a ground-state carbon atom on the rack at the lowest possible energy.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Use "Add ↑" and "Add ↓" on the boxes, and "Test Energy".',
        'Check whether any electrons sit in a higher row while a lower row has room.',
        'Fill 1s and 2s first, then place the last two electrons in separate 2p boxes with parallel spins.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place carbon\'s electrons on the rack.' };
        if (r.total !== 6) return { ok: false, msg: 'Carbon has six electrons.' };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron sits in a higher row while a lower row has room.' };
        if (!r.ruleHolds) return { ok: false, msg: 'Electrons in 2p must occupy separate boxes pointing the same way before pairing.' };
        return { ok: true };
      },
      reward: {
        log: 'Carbon\'s six electrons settle into the lowest available levels.',
        title: 'The Aufbau Principle',
        body: 'Electrons fill the lowest available energy levels first: this is the aufbau principle. In orbitals of equal energy, electrons spread across separate boxes with parallel spins before pairing up (Hund\'s rule).',
        model: {
          type: 'rack',
          z: 6,
          stage: 1,
          caption: 'Carbon (Z = 6): Electrons fill 1s and 2s first, then enter separate 2p boxes with parallel spins (Hund\'s rule).'
        }
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
        pieces: [
          ...rack.boxes,
          ...hands(86, 10, 16),
          ...cards([['p4', '1s² 2s² 2p⁴'], ['p6', '1s² 2s² 2p⁶'], ['p5', '1s² 2s² 2p⁵'], ['s4', '1s² 2s⁴ 2p²']])
        ],
        fixtures: [rack.fixture],
        zones: { slots: [{ id: 'reads', label: 'What the rack reads', at: { x: 112, y: 24 }, size: { w: 28, h: 13 } }] }
      }),
      hints: [
        'Use "Add ↑" and "Add ↓" on the boxes, and the slot for the card.',
        'Fill the lowest rows first, then pair one box in 2p for oxygen\'s eighth electron.',
        'Count the electrons in each row and match the rack\'s readout to a card.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        const card = Object.values(t.pieces).find(p => p.kind === 'ccard' && p.zone === 'slot:reads');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place oxygen\'s electrons on the rack.' };
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (r.total !== 8 || !isLaddered(r.counts)) return { ok: false, msg: 'Oxygen has eight electrons in the lowest available rows.' };
        if (card.label !== r.config) return { ok: false, msg: 'The card does not match what the rack reads.' };
        return { ok: true };
      },
      reward: {
        log: 'The rack prints oxygen\'s electron configuration.',
        title: 'Electron Configuration',
        body: 'The written notation, each row followed by its electron count as an exponent, is the electron configuration. Oxygen\'s ground state is 1s² 2s² 2p⁴: two electrons fill 1s, two fill 2s, and four settle into 2p.',
        model: {
          type: 'rack',
          z: 8,
          stage: 2,
          caption: 'Oxygen (Z = 8): 1s² 2s² 2p⁴ — after spreading singly across 2p, the fourth electron pairs with opposite spin.'
        }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Potassium\'s Last',
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
      'Think about whether electrons fill strictly by shell number or by energy level.',
      'Commit to the guess you want to test on the energy ladder.'
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
      title: 'Prediction',
      body: 'Filling shell by shell in numerical order is a fair guess. Next, the energy ladder will reveal which level actually lies lower in energy.'
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
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Use "Add ↑" on a box for the nineteenth electron.',
        'Look at the energy axis on the ladder to see whether 4s or 3d sits lower.',
        'Place the electron in the lowest open row on the ladder, even if its shell number is higher.'
      ],
      check(state) {
        const r = readOf(state.table, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place potassium\'s nineteenth electron on the rack.' };
        if (r.total !== 19) return { ok: false, msg: 'Potassium has nineteen electrons.' };
        if (r.counts['4s'] !== 1) return { ok: false, msg: 'The 4s row is lower in energy than 3d and must fill first.' };
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
          body: `${verdict}The 4s row sits below the 3d row on the energy ladder, so potassium's nineteenth electron falls into 4s before 3d begins. Subshells fill in order of energy, not shell number.`,
          model: {
            type: 'rack',
            z: 19,
            stage: 4,
            caption: 'Potassium (Z = 19): 4s sits below 3d on the energy ladder, so the nineteenth electron fills 4s first ([Ar] 4s¹).'
          }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rack = shelf('rack', ROWS, SHELF_AT, { pre: AR_CORE, locked: true });
    return {
      title: 'Scandium\'s Twenty-First',
      prompt: 'Build scandium\'s ground state on the rack at the lowest possible energy.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Use "Add ↑" and "Add ↓" on the boxes, and "Test Energy".',
        'Fill 4s with two electrons before placing the remaining electron.',
        'Place two electrons in 4s and one electron in 3d.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place scandium\'s remaining three electrons on the rack.' };
        if (r.total !== 21) return { ok: false, msg: 'Scandium has twenty-one electrons.' };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron sits in a higher row while a lower row has room.' };
        if (r.counts['4s'] !== 2 || r.counts['3d'] !== 1) return { ok: false, msg: 'Electrons fill 4s before entering 3d.' };
        return { ok: true };
      },
      reward: {
        log: 'Scandium\'s last electron falls into the 3d row.',
        title: 'Filling the 3d Subshell',
        body: 'Once 4s is filled with two electrons, the next electron falls into the 3d row, which sits below 4p on the energy ladder. Scandium\'s configuration is [Ar] 4s² 3d¹, marking the start of the transition metals.',
        model: {
          type: 'rack',
          z: 21,
          stage: 5,
          caption: 'Scandium (Z = 21): With 4s full ([Ar] 4s²), the twenty-first electron enters the 3d subshell ([Ar] 4s² 3d¹).'
        }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const rows = ['1s', '2s', '2p', '3s', '3p'];
    const rack = shelf('rack', rows, SHELF_AT, { pre: rackFor(10), locked: true });
    return {
      title: 'A Chloride Ion',
      prompt: 'Build the chloride ion, Cl\u207b, on the rack at the lowest possible energy.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(86, 10, 16)],
        fixtures: [rack.fixture, energyWell('well', { x: 124, y: 44 }, { rack: 'rack', size: { w: 30, h: 32 } })]
      }),
      hints: [
        'Use "Add \u2191" and "Add \u2193" on the boxes, and "Test Energy".',
        'Count the electrons a neutral chlorine atom has, then change that count for the ion\'s charge.',
        'The charge tells you how many electrons the ion has gained or lost compared with the atom.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 10) return { ok: false, notYet: true, msg: 'Place the ion\'s remaining electrons on the rack.' };
        if (r.total !== 18) return { ok: false, msg: 'The rack holds the wrong number of electrons for this ion: the charge changes the atom\'s count.' };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron sits in a higher row while a lower row has room.' };
        return { ok: true };
      },
      reward: {
        log: 'Chloride has the same electrons as argon.',
        title: 'Electron Configurations of Ions',
        body: 'Chloride has 18 electrons, 1s\u00b2 2s\u00b2 2p\u2076 3s\u00b2 3p\u2076, the same as argon. A metal ion loses its outermost-shell electrons first, so Fe\u00b3\u207a is [Ar] 3d\u2075: its 4s electrons leave before any 3d.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate. */
const NOTES = {
  1: ['Drag an arrow onto a box.']
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
      body: 'Electrons fall into the lowest available energy levels first (the aufbau principle) and occupy degenerate orbitals singly with parallel spins before pairing (Hund\'s rule). Energy levels determine filling order, placing 4s below 3d.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Chemical properties and bonding behavior depend on the valence electrons. Writing electron configurations explains how elements react and why the periodic table is organized into blocks.'
    },
    {
      heading: 'Next',
      body: 'The next bench measures the energy required to remove each electron, verifying electron configurations experimentally.'
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
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), { run: 'well' }],
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2), down('2p', 0), put('p4', 'slot:reads')],
  [{ predict: 's4' }],
  [up('4s', 0)],
  [...pair('4s', 0), up('3d', 0), { run: 'well' }],
  [...pair('3s', 0), ...pair('3p', 0), ...pair('3p', 1), ...pair('3p', 2)]
];

export const MISSES = [
  [...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2), down('2p', 0)],
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2), down('2p', 0), put('p6', 'slot:reads')],
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
