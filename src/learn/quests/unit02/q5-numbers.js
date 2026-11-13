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
const GUESS_LABEL = { one: 'One', two: 'Two', any: 'Any number' };

/** Every piece on this bench says what it does on its face (Up, Down, Lift Out), so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, at, size, cell = size?.w ?? 40, cellH = size?.h ?? 14) => ({ id, label, at, size, cell, cellH });
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
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 40, y: 32 }, { target: TARGET, finder: 'addr', readout: false, labels: true, show: { ml: true } });
    const strip = addressStrip('addr', { x: 112, y: 26 }, { fields: ['n', 'l', 'ml'], show: ['n', 'l', 'ml'], start: { n: 1, l: 0, ml: 0 } });
    return {
      title: 'An Orbital\'s Address',
      briefing: {
        speaker: SPEAKER,
        body: 'Every orbital is picked out by three quantum numbers. The diagram draws each orbital as a square: n is its shell (its main energy layer), l is its shape (0 for s, 1 for p), and ml tells apart orbitals of the same shape that point in different directions.'
      },
      prompt: 'What are the three quantum numbers of the orbital marked TARGET?',
      widget,
      table: shellsTable({ pieces: rack.boxes, fixtures: [rack.fixture, strip] }),
      hints: [
        'Turn the n, l and ml dials and watch which orbital lights.',
        'Notice which dial moves the light to another row, and which moves it along a row.',
        'Change one dial at a time and see what kind of step the light takes toward the target.'
      ],
      check(state) {
        const a = addressOfFinder(state.table, 'addr');
        const room = findRoom(a);
        if (!room.exists) return { ok: false, msg: 'No orbital has these three numbers: l is never larger than n − 1, and ml lies between −l and +l.' };
        if (room.row === TARGET.row && room.idx === TARGET.idx) return { ok: true };
        return { ok: false, msg: `These numbers light an orbital in the ${room.row} row, and it is not the one marked TARGET.` };
      },
      reward: {
        log: 'Three quantum numbers name one orbital.',
        title: 'Three Quantum Numbers',
        body: 'The target is n = 2, l = 1, ml = +1: one of the three 2p orbitals. Their full names are the principal (n), angular momentum (l) and magnetic (ml) quantum numbers.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'How Many in an Orbital',
    // A PREDICT STAGE: the diagram is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'How many electrons can one orbital hold?',
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
      'Drag one of the three cards into the slot.',
      'Think whether one region round a nucleus could go on taking electrons, which all repel one another.',
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
      body: 'Next, electrons are added to one orbital until it takes no more.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 38, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    const count = marker('count', 'Electrons one orbital holds', { x: 112, y: 52 }, { min: 0, max: 6, step: 1, value: 0, size: { w: 36, h: 12 } });
    return {
      title: 'Orbital Capacity',
      briefing: {
        speaker: SPEAKER,
        body: 'An electron has a property called spin, which points one of two ways. The diagram draws an electron as an arrow, ↑ for one spin and ↓ for the other.'
      },
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": how many electrons can one orbital hold?`
          : 'How many electrons can one orbital hold?';
      },
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(92, 22)], fixtures: [rack.fixture, count] }),
      hints: [
        'Drag "Add ↑" or "Add ↓" onto one orbital to put an electron in it, and set the number dial to your answer.',
        'Notice which electron an orbital refuses, and what the message says about the one already there.',
        'Go on adding electrons of both spins to one orbital until every further one is refused, then count what it holds.'
      ],
      check(state) {
        const t = state.table;
        const marked = t.fixtures.count.dials.n.value;
        const full = Object.values(t.pieces).some(p => p.kind === 'box' && arrowsOf(t, p).length === 2);
        if (!full) return { ok: false, notYet: true, msg: 'Add electrons to one orbital until it takes no more.' };
        if (marked === 0) return { ok: false, notYet: true, msg: 'Set the number dial to your answer.' };
        if (marked === 2) return { ok: true };
        return { ok: false, msg: `The fullest orbital on the diagram holds 2 electrons, and the dial reads ${marked}.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'two'
          ? 'Your prediction held. '
          : 'The orbital did not agree with your prediction. ';
        return {
          log: 'An orbital holds two electrons with opposite spins.',
          title: 'Two Electrons, Opposite Spin',
          body: `${verdict}An orbital holds two electrons at most, one of each spin. The two spins are written +½ (↑) and −½ (↓).`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 36, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    return {
      title: 'The Pauli Principle',
      prompt: 'Which card cannot join the diagram once the rest are placed?',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...tokensOf(CANDIDATES, TWO_COLUMNS)],
        fixtures: [rack.fixture],
        zones: { trays: [tray('no', 'Refused', { x: 108, y: 56 }, { w: 40, h: 14 })] }
      }),
      hints: [
        'Drag each electron card onto the diagram; it goes to the orbital its first three numbers name.',
        'Compare the four numbers on a refused card with those of the electrons already placed.',
        'Two electrons may share an orbital, so look for what else the refused electron has in common with one already there.'
      ],
      check(state) {
        const t = state.table;
        const ids = Object.keys(CANDIDATES).map(k => `t${k}`);
        const placed = ids.filter(id => t.pieces[id].props.placed && !inTray(t, id));
        const away = ids.filter(id => inTray(t, id));
        if (placed.length === 0 && away.length === 0) return { ok: false, notYet: true, msg: 'Place the electron cards on the diagram.' };
        if (away.length !== 1) return { ok: false, notYet: true, msg: 'Put exactly one electron, the one the diagram will not take, in the tray.' };
        const out = addressOfToken(t.pieces[away[0]]);
        if (placed.length === ids.length - 1 && placed.some(id => sameAddress(addressOfToken(t.pieces[id]), out))) return { ok: true };
        return { ok: false, msg: 'The electron in the tray has a free place on the diagram, or another card is still waiting to be placed.' };
      },
      reward: {
        log: 'Two electrons cannot share the same address.',
        title: 'The Pauli Exclusion Principle',
        body: 'A and C have the same four quantum numbers, so the atom holds only one of them. No two electrons in an atom share all four: this is the Pauli exclusion principle.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rack = shelf('rack', ['3s', '3p', '3d'], { x: 40, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    const count = marker('count', 'Electrons in the third shell', { x: 114, y: 48 }, { min: 0, max: 32, step: 2, value: 0, size: { w: 46, h: 12 } });
    return {
      title: 'Shell Capacity',
      prompt: 'How many electrons can the third shell hold?',
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(90, 20)], fixtures: [rack.fixture, count] }),
      hints: [
        'The diagram shows every orbital of the third shell, and "Add ↑" and "Add ↓" fill them if you want to count.',
        'Count the orbitals across the 3s, 3p and 3d rows.',
        'Remember how many electrons each orbital can hold.'
      ],
      check(state) {
        const t = state.table;
        const boxes = Object.values(t.pieces).filter(p => p.kind === 'box');
        const marked = t.fixtures.count.dials.n.value;
        if (marked === 0) return { ok: false, notYet: true, msg: 'Set the number dial to your answer.' };
        if (marked === shellCapacity(3)) return { ok: true };
        return { ok: false, msg: `The third shell has ${boxes.length} orbitals on the diagram, and ${marked} is not two electrons for each.` };
      },
      reward: {
        log: 'Nine orbitals, two electrons each.',
        title: 'Shell Capacity',
        body: 'Nine orbitals with two electrons each: 18. The first shell has one orbital and holds 2; the second has four and holds 8.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the n, l and ml dials:', 'the orbital they name lights up.'],
  3: ['Drag "Add ↑" or "Add ↓" onto an orbital to put an electron in it.'],
  4: ['Drag each electron card onto the diagram.']
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
      body: 'Three quantum numbers pick out an orbital: n for the shell, l for the shape and ml for the direction. A fourth, the spin, picks out the electron. An orbital holds two electrons of opposite spin, and no two electrons in an atom share all four numbers.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Counting orbitals gives the number of electrons each shell can hold: 2, 8, 18. Those numbers set the lengths of the rows of the periodic table.'
    },
    {
      heading: 'Next',
      body: 'Next: the order in which electrons fill the orbitals of an atom.'
    }
  ]
};

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
  [dial('count', 'n', 18)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('addr', 'n', 2), dial('addr', 'l', 1), dial('addr', 'ml', -1)],
  [],
  [onBox('up', '1s', 0), onBox('down', '1s', 0), dial('count', 'n', 3)],
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
