/**
 * q5-numbers.js — Lanternfall, bench five: QUANTUM NUMBERS.
 *
 * **BEYOND THE EXAM.** The AP exam does not assess quantum-number assignment, and the stage-one card says so. The bench is one
 * face of the records tent's board: a rack of milled boxes in ladder rows and an ADDRESS STRIP, cells the player sets (shell,
 * subshell, orbital), and the box the address names lights on the rack, or nothing lights and the board says no orbital has that
 * address. So an address is FOUND (set it, see where the light goes) and WRITTEN (set the cells until the lit box is the ringed one)
 * and never read off a label.
 *
 * The fifth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4b), on the address and filling kit (`table/kits/shells.js`),
 * reworked on 2026-10-23 around ONE CLICK. Arrows are dealt into boxes by hand, as the Lewis slate deals pairs; an electron token carries
 * its own address and stands in the orbital that address names, or the rack refuses it with the rule shown (a refusal with a reason,
 * never a gatekeeper for a correct answer). At `3D On` a box is a real well and an arrow a real rod standing in it (`shells.js` `piece3d`).
 *
 * THE CLICK. A player who has met the shells believes a box is a room, and a room takes as many as will fit: electrons can pile
 * into the lowest place. So the guess (one, two or any number) is asked with no rack on the table, and then the rack takes two and
 * refuses a third.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  set the shell, subshell and orbital cells until the lit box is the ringed one   -> the three numbers of an address
 *   2  PREDICT: how many electrons one orbital box takes (no rack)                      -> a guess before the evidence
 *   3  TEST: pack one box and set the marker to what it took                            -> spin
 *   4  six electrons placed on the rack, the one it refuses put in the tray             -> the Pauli exclusion principle
 *   5  fill every box of the third shell, then set the marker to the count              -> 2n squared
 *
 * Cut on 2026-10-23 (problems doc T6, T7): the distance a shell's cloud reaches (stage 1 again), the subshell types a shell offers
 * and the electron put in the box an address names (both are stage 1 with more cells), nitrogen's four-number address (stage 1 plus
 * stage 3) and the sets that cannot exist (a rule of the ranges, practised in the Drill Deck).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  shellsTable, shelf, hand, electronToken, addressStrip, marker,
  readOf, rackOf, addressOfFinder, finderLight, placedTokens, addressOfToken, sameAddress, findRoom, validAddress, shellCapacity, reachPm,
  boxPieceId, arrowsOf
} from '../../table/kits/shells.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bpauli\b/i, introducedAt: 4 },
  { term: /\bspins?\b/i, introducedAt: 3 },
  { term: /\bmagnetic\b/i, introducedAt: 1 },
  { term: /\bangular momentum\b/i, introducedAt: 1 },
  { term: /\bprincipal\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q4-cloud'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q5-numbers';
const GUESS_LABEL = { one: 'One electron', two: 'Two electrons', any: 'Any number' };

/** Every piece on this bench says what it does on its face (Up, Down, Lift Out), so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, at, size, cell = 17) => ({ id, label, at, size, cell });
const inTray = (t, id) => (t.pieces[id].zone || '').startsWith('tray:');

const ROWS_N3 = ['1s', '2s', '2p', '3s', '3p', '3d'];

/** The six candidates stage four lists, as the address each carries: A and C share all four numbers. */
export const CANDIDATES = {
  a: { n: 2, l: 1, ml: 0, ms: 0.5 },
  b: { n: 2, l: 1, ml: 0, ms: -0.5 },
  c: { n: 2, l: 1, ml: 0, ms: 0.5 },
  d: { n: 2, l: 1, ml: 1, ms: 0.5 },
  e: { n: 2, l: 0, ml: 0, ms: 0.5 },
  f: { n: 1, l: 0, ml: 0, ms: -0.5 }
};

/** The box stage one rings: the right-hand box of the 2p row. */
const TARGET = { row: '2p', idx: 2 };

/** Candidate tokens in two columns of three (a token is wide). */
const tokensOf = (sets, at) => Object.entries(sets).map(([k, a], i) => electronToken(`t${k}`, k.toUpperCase(), at(i), a));
const TWO_COLUMNS = i => ({ x: i < 3 ? 90 : 126, y: 10 + (i % 3) * 14 });

/** Hands for a stage: Up, Down and Lift Out in a row. */
const hands = (x, y, pitch = 18) => [hand('up', 'up', { x, y }), hand('down', 'down', { x: x + pitch, y }), hand('lift', 'lift', { x: x + 2 * pitch, y })];

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 40, y: 32 }, { target: TARGET, finder: 'addr', readout: false, labels: false });
    const strip = addressStrip('addr', { x: 112, y: 26 }, { fields: ['n', 'l', 'ml'], show: ['n', 'l', 'ml'], start: { n: 1, l: 0, ml: 0 } });
    return {
      title: 'The Address of a Box',
      prompt: 'Set the address so that the lit box is the ringed one.',
      widget,
      table: shellsTable({ pieces: rack.boxes, fixtures: [rack.fixture, strip] }),
      hints: [
        'Use the three cells of the address strip.',
        'Change one cell at a time and compare where the light goes on the rack.',
        'The first cell picks the floor, the second picks the row on that floor, and the third picks the box along the row.'
      ],
      check(state) {
        const a = addressOfFinder(state.table, 'addr');
        const room = findRoom(a);
        if (!room.exists) return { ok: false, msg: 'No box has the address you set.' };
        if (room.row === TARGET.row && room.idx === TARGET.idx) return { ok: true };
        return { ok: false, msg: 'The lit box is not the ringed one.' };
      },
      reward: {
        log: 'Three numbers name one box.',
        title: 'An Address for Every Box',
        body: 'Every box has a three-number address: the shell n (principal quantum number) counts outward, the subshell l (angular momentum quantum number) sets the shape, and the orbital ml (magnetic quantum number) picks the box along its row. This bench is an optional Deep Dive.',
        model: { type: 'rack', z: 7, caption: 'Nitrogen\'s rack: the boxes of the 1s, 2s and 2p rows, lowest at the bottom, with a rod for each electron.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'How Many in a Box',
    // A PREDICT STAGE: the rack is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'How many electrons do you think one orbital box can hold?',
    widget,
    table: shellsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 'one', label: 'One', at: { x: 38, y: 48 }, r: 7 },
          { id: 'two', label: 'Two', at: { x: 75, y: 48 }, r: 7 },
          { id: 'any', label: 'Any number', at: { x: 112, y: 48 }, r: 8 }
        ]
      }
    }),
    hints: [
      'Drag one of the three guesses into the slot.',
      'Think of a box as a room: ask whether a room has a limit, and what could set it.',
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
      body: 'A room with no stated limit is a fair picture of a box, and the rack can test it. Next, arrows will be dropped into a box until something gives.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 38, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    const count = marker('count', 'Most in one box', { x: 112, y: 52 }, { min: 0, max: 6, step: 1, value: 0, size: { w: 36, h: 12 } });
    return {
      title: 'Pack One Box',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": set the marker to the most electrons the rack will put in one box.`
          : 'Set the marker to the most electrons the rack will put in one box.';
      },
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(92, 22)], fixtures: [rack.fixture, count] }),
      hints: [
        'Use "Up" and "Down" on one box, and the marker.',
        'Compare what the rack does when you drop a second arrow on a box, pointing the same way and pointing the other way.',
        'Keep dropping arrows on one box until the rack refuses another, then count what the box holds.'
      ],
      check(state) {
        const marked = state.table.fixtures.count.dials.n.value;
        if (marked === 0) return { ok: false, notYet: true, msg: 'Set the marker to the number you found.' };
        if (marked === 2) return { ok: true };
        return { ok: false, msg: 'The marker and the most the rack put in one box are not the same number.' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'two'
          ? 'You predicted two, and the rack agreed. '
          : 'The rack did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'A second arrow the same way is refused. Opposite is fine.',
          title: 'Spin',
          body: `${verdict}A box takes two electrons at most, and only when one points up and the other down. That direction is the electron's spin.`,
          model: { type: 'rack', z: 2, caption: 'Helium\'s two electrons in one box: one rod pointing up and one pointing down.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 36, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    return {
      title: 'The Impossible Pair',
      prompt: 'Place the six candidate electrons on the rack, and put the one the rack refuses in the tray.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...tokensOf(CANDIDATES, TWO_COLUMNS)],
        fixtures: [rack.fixture],
        zones: { trays: [tray('no', 'Cannot be placed', { x: 108, y: 56 }, { w: 40, h: 14 }, 20)] }
      }),
      hints: [
        'Use the candidates: drop each one on the rack and watch whether it stands.',
        'Compare the four numbers of each candidate with those of the ones already standing.',
        'Place all six in turn, and put in the tray the one the rack will not take because its address is already in use.'
      ],
      check(state) {
        const t = state.table;
        const ids = Object.keys(CANDIDATES).map(k => `t${k}`);
        const placed = ids.filter(id => t.pieces[id].props.placed && !inTray(t, id));
        const away = ids.filter(id => inTray(t, id));
        if (placed.length === 0 && away.length === 0) return { ok: false, notYet: true, msg: 'Place the candidates on the rack.' };
        if (away.length !== 1) return { ok: false, notYet: true, msg: 'Put exactly one electron, the one the rack will not take, in the tray.' };
        const out = addressOfToken(t.pieces[away[0]]);
        if (placed.length === ids.length - 1 && placed.some(id => sameAddress(addressOfToken(t.pieces[id]), out))) return { ok: true };
        return { ok: false, msg: 'That electron stands on the rack.' };
      },
      reward: {
        log: 'Two electrons cannot share the same address.',
        title: 'The Pauli Exclusion Principle',
        body: 'No two electrons in one atom can share all four quantum numbers: the three of the box and the spin. This is the Pauli exclusion principle, and it is why a box holds two and no more.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rack = shelf('rack', ['3s', '3p', '3d'], { x: 40, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    const count = marker('count', 'Electrons in the third shell', { x: 114, y: 48 }, { min: 2, max: 32, step: 2, value: 2, size: { w: 46, h: 12 } });
    return {
      title: 'A Full Shell',
      prompt: 'Fill every box of the third shell, then set the marker to the number of electrons it holds.',
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(90, 20)], fixtures: [rack.fixture, count] }),
      hints: [
        'Use "Up" and "Down" on every box of the three rows, and the marker.',
        'Count the boxes in all the rows of the third shell, and how many electrons each box can hold.',
        'Multiply the number of boxes in the shell by the two electrons each box takes, and set the marker to the board\'s count.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        const boxes = Object.values(t.pieces).filter(p => p.kind === 'box');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Put electrons in the boxes of the third shell.' };
        if (!boxes.every(b => arrowsOf(t, b).length === 2)) return { ok: false, msg: 'Some boxes in the third shell still have room.' };
        const marked = t.fixtures.count.dials.n.value;
        if (marked === 2) return { ok: false, notYet: true, msg: 'Set the marker to the number of electrons you counted.' };
        if (marked !== r.total) return { ok: false, msg: 'The marker and the rack\'s count are not the same number.' };
        return { ok: true };
      },
      reward: {
        log: 'The shell takes as many as its boxes allow.',
        title: '2n Squared',
        body: 'A shell holds 2n² electrons: 2 in the first, 8 in the second and 18 in the third. The count is the number of boxes in the shell, n², times the two spins each box allows.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the cells of the address strip', 'and watch which box lights.'],
  3: ['Drag an arrow onto a box to place an electron.'],
  4: ['Drag each electron onto the rack. The rack refuses', 'any it cannot hold, and says why.'],
  5: ['Drop arrows on boxes until the rack takes no more.']
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
      body: 'Numbers name every box: n for its shell, l for its shape and ml for its orientation. A box holds two electrons that point opposite ways, no two electrons in an atom share all four numbers, and from that one rule the capacity of every shell follows.'
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Cells are set, arrows and electrons dropped on boxes, cards put in trays. Nothing here says
   which box an address names or whether a room has it.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const onBox = (piece, row, idx) => put(piece, `piece:${boxPieceId('rack', row, idx)}`);
/** Each candidate dropped on the box its address names, in order. */
const dropAll = () => Object.entries(CANDIDATES).map(([k, a]) => { const r = findRoom(a); return onBox(`t${k}`, r.row, r.idx); });

export const SOLUTIONS = [
  [dial('addr', 'n', 2), dial('addr', 'l', 1), dial('addr', 'ml', 1)],
  [{ predict: 'two' }],
  [onBox('up', '1s', 0), onBox('down', '1s', 0), dial('count', 'n', 2)],
  [...dropAll(), put('tc', 'tray:no')],
  [].concat(...[['3s', 0], ['3p', 0], ['3p', 1], ['3p', 2], ['3d', 0], ['3d', 1], ['3d', 2], ['3d', 3], ['3d', 4]].map(([r, i]) => [onBox('up', r, i), onBox('down', r, i)])).concat([dial('count', 'n', 18)])
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('addr', 'n', 2), dial('addr', 'l', 1), dial('addr', 'ml', -1)],
  [],
  [onBox('up', '1s', 0), dial('count', 'n', 3)],
  [...dropAll(), put('tb', 'tray:no')],
  [onBox('up', '3s', 0), onBox('down', '3s', 0), dial('count', 'n', 8)]
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

/** Held to the board's own arithmetic by the verifier. */
export const CHECKS = { CANDIDATES, TARGET, sameAddress, findRoom, validAddress, shellCapacity, reachPm, finderLight, placedTokens, QUEST_KEY };
