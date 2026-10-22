/**
 * q5-numbers.js — Lanternfall, bench five: QUANTUM NUMBERS.
 *
 * **BEYOND THE EXAM.** The AP exam does not assess quantum-number assignment, and the stage-one card says so. The bench is one
 * face of the records tent's board: a rack of milled boxes in ladder rows and an ADDRESS STRIP, four cells the player sets (shell,
 * subshell, orbital, spin), and the box the address names lights on the rack, or nothing lights and the board says no orbital has that
 * address. So an address is FOUND (set it, see where the light goes) and WRITTEN (set the cells until the lit box is the ringed
 * one) and never read off a label.
 *
 * The fifth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4b), on the address and filling kit (`table/kits/shells.js`).
 * Arrows are dealt into boxes by hand, as the Lewis slate deals pairs; an electron token carries its own address and stands in the
 * orbital that address names, or the rack refuses it with the rule shown (a refusal with a reason, never a gatekeeper for a correct
 * answer).
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  match how far the lit shell's cloud reaches      -> principal quantum number
 *   2  which subshells the second shell offers        -> angular momentum quantum number
 *   3  an electron in the box an address names          -> magnetic quantum number
 *   4  two electrons in one box                         -> spin
 *   5  four candidates placed on the rack               -> the Pauli exclusion principle
 *   6  the third shell filled, and counted              -> 2n squared
 *   7  writing the address of a ringed electron         -> every electron has an address
 *   8  four listed addresses, tried on the rack         -> the allowed values
 *
 * The rack never says an arrangement is wrong. It refuses exactly two things: a second arrow of the same direction in one box, and
 * an electron that cannot stand where its address says, and the player is left to work out what that has to mean.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  shellsTable, shelf, hand, tag, electronToken, addressStrip, marker,
  readOf, rackOf, addressOfFinder, finderLight, placedTokens, addressOfToken, sameAddress, findRoom, validAddress, shellCapacity, reachPm,
  boxPieceId, arrowsOf
} from '../../table/kits/shells.js';

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

/** Every piece on this bench says what it does on its face (Up, Down, Lift Out), so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, at, size, cell = 17) => ({ id, label, at, size, cell });
const where = (t, id) => (t.pieces[id].zone || '').replace(/^(tray|slot):/, '');
const inTray = (t, id) => (t.pieces[id].zone || '').startsWith('tray:');

const ROWS_N3 = ['1s', '2s', '2p', '3s', '3p', '3d'];

/** The four candidates stage five lists, as the address each carries. */
export const FOUR_ELECTRONS = {
  a: { n: 2, l: 1, ml: 0, ms: 0.5 },
  b: { n: 2, l: 1, ml: 0, ms: -0.5 },
  c: { n: 2, l: 1, ml: 0, ms: 0.5 },
  d: { n: 2, l: 1, ml: 1, ms: 0.5 }
};

/** The four sets stage eight lists. */
export const SETS = {
  a: { n: 2, l: 1, ml: -1, ms: 0.5 },
  b: { n: 3, l: 3, ml: 0, ms: -0.5 },
  c: { n: 2, l: 1, ml: 2, ms: 0.5 },
  d: { n: 3, l: 2, ml: -2, ms: 0.5 }
};

/** The electron stage seven rings: nitrogen's up arrow in the right-hand 2p box. */
export const RINGED = { n: 2, l: 1, ml: 1, ms: 0.5 };

/** Nitrogen's seven electrons, as a rack. */
const NITROGEN = { '1s:0': 'ud', '2s:0': 'ud', '2p:0': 'u', '2p:1': 'u', '2p:2': 'u' };

const tokensOf = (sets, at) => Object.entries(sets).map(([k, a], i) => electronToken(`t${k}`, k.toUpperCase(), at(i), a));
const COLUMN = x => i => ({ x, y: 10 + i * 14 });

/** Hands for a stage: Up, Down and Lift Out in a row. */
const hands = (x, y, pitch = 18) => [hand('up', 'up', { x, y }), hand('down', 'down', { x: x + pitch, y }), hand('lift', 'lift', { x: x + 2 * pitch, y })];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], { x: 50, y: 31 }, { finder: 'addr', reach: true, readout: false });
    const strip = addressStrip('addr', { x: 118, y: 20 }, { fields: ['n'], show: ['n'], start: { n: 1 } });
    return {
      title: 'The First Number',
      briefing: {
        speaker: SPEAKER,
        body: 'Every electron has an address of four numbers: shell (n), subshell (l), orbital (ml) and the direction of its arrow (ms); set a cell of the address strip and the rack lights what it names. Press Submit when the table shows your answer.'
      },
      prompt: 'Set the shell number so that its s row reaches out about 300 pm.',
      widget,
      table: shellsTable({ pieces: rack.boxes, fixtures: [rack.fixture, strip] }),
      hints: [
        'Drag the shell knob and watch which rows light and how far their clouds reach.',
        'Compare the distance printed beside each lit row with the distance the prompt asks for.',
        'Set the shell whose s row prints a distance closest to the one the prompt names.'
      ],
      check(state) {
        const t = state.table;
        if (addressOfFinder(t, 'addr').n === 2) return { ok: true };
        return { ok: false, msg: 'The lit row\'s cloud reaches a different distance: set the shell and read how far it reaches.' };
      },
      reward: {
        log: 'The shell number counts outward.',
        title: 'Principal Quantum Number (Shell)',
        body: 'The first number on every box, n, is the shell (principal quantum number): it sets how far out the cloud reaches and roughly how much energy its electron has. Every orbital in one shell shares the same n, which counts up from 1. This bench is an optional Deep Dive.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const rack = shelf('rack', ROWS_N3, { x: 40, y: 32 }, { finder: 'addr', readout: false, labels: false });
    const strip = addressStrip('addr', { x: 114, y: 15 }, { fields: ['n', 'l'], show: ['n', 'l'], range: { l: [0, 3] }, start: { n: 1, l: 0 } });
    const tags = [0, 1, 2, 3].map(l => tag(`l${l}`, `l = ${l}`, { x: 84 + l * 18, y: 33 }));
    return {
      title: 'The Second Number',
      prompt: 'Put each subshell type in the tray that says whether the second shell has an orbital of that type.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...tags],
        fixtures: [rack.fixture, strip],
        zones: { trays: [tray('lights', 'An orbital lights', { x: 97, y: 53 }, { w: 34, h: 17 }, 16), tray('none', 'No orbital lights', { x: 131, y: 53 }, { w: 26, h: 17 }, 16)] }
      }),
      hints: [
        'Set the shell cell to 2, then step the subshell cell through every setting and see which settings light a row.',
        'Compare the shape drawn beside each lit row with the cloud shapes from the cloud plate.',
        'Put a subshell type in the first tray only if it lights a row in that shell, and in the second if it lights nothing.'
      ],
      check(state) {
        const t = state.table;
        const ids = [0, 1, 2, 3].map(l => `l${l}`);
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put every subshell type in a tray.' };
        for (let l = 0; l <= 3; l++) {
          const has = findRoom({ n: 2, l, ml: 0 }).exists;
          if (where(t, `l${l}`) !== (has ? 'lights' : 'none')) {
            return { ok: false, msg: 'Hold the shell cell on 2, step the subshell cell through every setting, and put each type in a tray by whether a row lights.' };
          }
        }
        return { ok: true };
      },
      reward: {
        log: 'The second number sets the subshell.',
        title: 'Angular Momentum Number (Subshell)',
        body: 'The second number, l, is the subshell (angular momentum number): it sets the shape, with l = 0 for round (s) and 1 for two-lobed (p). In shell n, l runs from 0 up to n - 1, so shell 2 offers s and p subshells.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rack = shelf('rack', ['3s', '3p', '3d'], { x: 42, y: 30 }, { finder: 'addr', readout: false, labels: false });
    const strip = addressStrip('addr', { x: 112, y: 18 }, { fields: ['l', 'ml'], show: ['n', 'l', 'ml'], range: { l: [0, 2], ml: [-2, 2] }, start: { n: 3, l: 0, ml: 0 } });
    return {
      title: 'The Third Number',
      prompt: 'Put an electron in the box that the address n = 3, l = 2, ml = +1 names.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, hand('el', 'up', { x: 100, y: 46 }, 'Electron'), hand('lift', 'lift', { x: 124, y: 46 })],
        fixtures: [rack.fixture, strip]
      }),
      hints: [
        'Set the subshell cell, then the orbital cell, and see which box lights.',
        'Try orbital numbers either side of zero and notice which way along the row they run.',
        'Compare where orbital number zero lights with where each number either side of it lights, then put the electron in the lit box.'
      ],
      check(state) {
        const t = state.table;
        const read = readOf(t, 'rack');
        if (read.total === 0) return { ok: false, notYet: true, msg: 'Put an electron in a box.' };
        const room = findRoom({ n: 3, l: 2, ml: 1 });
        const key = `${room.row}:${room.idx}`;
        if (read.total === 1 && rackOf(t, 'rack')[key]) return { ok: true };
        return { ok: false, msg: 'The electron is not in the box that address names: set the address on the strip and see which box lights.' };
      },
      reward: {
        log: 'The third number picks the orbital.',
        title: 'Magnetic Quantum Number (Orbital)',
        body: 'The third number, ml, is the orbital number (magnetic quantum number): it picks the orientation, running from -l to +l, giving 2l + 1 orbitals per subshell. A d subshell has five orbitals, p has three, and s has one.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 38, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    return {
      title: 'Two in One Box',
      briefing: {
        speaker: SPEAKER,
        body: 'Each orbital box holds two electrons, one drawn as an up arrow (+1/2) and one as a down arrow (-1/2).'
      },
      prompt: 'Pack two electrons into a single orbital box.',
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(92, 32)], fixtures: [rack.fixture] }),
      hints: [
        'Drop "Up" on a box and look at what the board prints.',
        'Try dropping "Up" on the same box again, then "Down", and compare what the rack does each time.',
        'Place one electron with "Up" in a box, then place a second in that same box with "Down".'
      ],
      check(state) {
        const doubled = Object.values(rackOf(state.table, 'rack')).some(v => v.length === 2);
        if (!doubled) return { ok: false, msg: 'No box holds two electrons yet. Try to put a second one into a box that already has one.' };
        return { ok: true };
      },
      reward: {
        log: 'A second arrow the same way is refused. Opposite is fine.',
        title: 'Spin',
        body: 'The fourth number, ms, is the spin: +1/2 for an up arrow and -1/2 for a down arrow. An orbital holds two electrons at most, and only when their spins are opposite.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 36, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    return {
      title: 'The Impossible Pair',
      prompt: 'Place the four candidate electrons on the rack, and put the one the rack refuses in the tray.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...tokensOf(FOUR_ELECTRONS, COLUMN(88))],
        fixtures: [rack.fixture],
        zones: { trays: [tray('no', 'Cannot be placed', { x: 132, y: 32 }, { w: 30, h: 40 }, 20)] }
      }),
      hints: [
        'Drop a candidate electron on the rack and see where it stands and what the board says.',
        'Compare the four numbers of each candidate and look for two that have none of them different.',
        'Place all four in turn, and put in the tray the one the rack will not take because its address is already in use.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['ta', 'tb', 'tc', 'td'];
        const placed = ids.filter(id => t.pieces[id].props.placed && !inTray(t, id));
        const away = ids.filter(id => inTray(t, id));
        if (placed.length === 0 && away.length === 0) return { ok: false, notYet: true, msg: 'Place the candidates on the rack.' };
        if (away.length !== 1) return { ok: false, notYet: true, msg: 'Put exactly one electron, the one the rack will not take, in the tray.' };
        const out = addressOfToken(t.pieces[away[0]]);
        if (placed.length === 3 && placed.some(id => sameAddress(addressOfToken(t.pieces[id]), out))) return { ok: true };
        return { ok: false, msg: 'That electron can stand on the rack. Try to place every candidate, and put the one that cannot go in the tray.' };
      },
      reward: {
        log: 'Two electrons cannot share the same address.',
        title: 'The Pauli Exclusion Principle',
        body: 'No two electrons in one atom can share all four quantum numbers: this is the Pauli exclusion principle. The next bench, electron configuration, builds entirely on this rule.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const rack = shelf('rack', ['3s', '3p', '3d'], { x: 40, y: 32 }, { show: { n: true, l: true, ml: true, ms: true } });
    const count = marker('count', 'Electrons in the third shell', { x: 114, y: 48 }, { min: 2, max: 32, step: 2, value: 2, size: { w: 46, h: 12 } });
    return {
      title: 'A Full Shell',
      prompt: 'Fill every box of the third shell, then set the marker to the number of electrons it holds.',
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(90, 20)], fixtures: [rack.fixture, count] }),
      hints: [
        'Fill every box in the rows of the third shell with as many electrons as the board will take.',
        'Count the boxes in all the rows of the third shell, and how many electrons each box can hold.',
        'Multiply the number of boxes in the shell by the two electrons each box takes, and set the marker to the board\'s count.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        const boxes = Object.values(t.pieces).filter(p => p.kind === 'box');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Put electrons in the boxes of the third shell.' };
        if (!boxes.every(b => arrowsOf(t, b).length === 2)) return { ok: false, msg: 'Some boxes in the third shell still have room: fill the rack until it refuses another electron.' };
        const marked = t.fixtures.count.dials.n.value;
        if (marked === 2) return { ok: false, notYet: true, msg: 'Set the marker to the number of electrons you counted.' };
        if (marked !== r.total) return { ok: false, msg: 'The marker should read the number of electrons the rack holds: count them.' };
        return { ok: true };
      },
      reward: {
        log: 'The shell takes as many as its boxes allow.',
        title: '2n Squared',
        body: 'A shell holds 2n² electrons: 2 in the first, 8 in the second and 18 in the third. The count is the number of boxes in the shell, n², times the two spins each box allows.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 40, y: 32 }, { pre: NITROGEN, target: { row: '2p', idx: 2 }, finder: 'addr', readout: false, labels: false });
    const strip = addressStrip('addr', { x: 112, y: 26 }, { fields: ['n', 'l', 'ml', 'ms'], show: ['n', 'l', 'ml', 'ms'], start: { n: 1, l: 0, ml: 0, ms: 0.5 } });
    return {
      title: 'An Address for Nitrogen',
      prompt: 'Write the address of the electron in the ringed box of nitrogen.',
      widget,
      table: shellsTable({ pieces: rack.boxes, fixtures: [rack.fixture, strip] }),
      hints: [
        'Set the cells of the address strip until the box that lights is the ringed one.',
        'The lit box gives the shell, subshell and orbital, and the arrow inside the ringed box gives the fourth number.',
        'The orbital number counts from the middle box of the row, and the last number follows the direction the arrow points.'
      ],
      check(state) {
        const t = state.table;
        const a = addressOfFinder(t, 'addr');
        if (a.n === 1 && a.l === 0 && a.ml === 0 && a.ms === 0.5) return { ok: false, notYet: true, msg: 'Set the address first.' };
        if (!findRoom(a).exists) return { ok: false, msg: 'No orbital has the address you set. Set one the strip lights, then compare it with the ringed box.' };
        if (!sameAddress(a, RINGED)) return { ok: false, msg: 'That address does not name the ringed electron. Set it, see where the light goes, and check which way the arrow in the box points.' };
        return { ok: true };
      },
      reward: {
        log: 'Every electron has four numbers, and no two match.',
        title: 'Every Electron Has an Address',
        body: 'Four numbers give every electron its unique address: shell (n), subshell (l), orbital (ml) and spin (ms). Nitrogen\'s three 2p electrons sit in three separate orbitals, so each has an address of its own.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const rack = shelf('rack', ROWS_N3, { x: 36, y: 32 }, { show: { n: true, l: true, ml: true, ms: true }, readout: false });
    return {
      title: 'Sets That Cannot Exist',
      prompt: 'Place the four listed electrons on the rack, and put the ones with no orbital in the tray.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...tokensOf(SETS, COLUMN(88))],
        fixtures: [rack.fixture],
        zones: { trays: [tray('no', 'No such orbital', { x: 132, y: 32 }, { w: 30, h: 40 }, 20)] }
      }),
      hints: [
        'Drop each listed electron on the rack and see whether it stands, and what the board says when it does not.',
        'Compare the addresses that stand with the ones that are refused, number against number.',
        'Find the largest subshell each shell lights, and the largest orbital number each subshell lights.'
      ],
      check(state) {
        const t = state.table;
        const ids = Object.keys(SETS).map(k => `t${k}`);
        if (!ids.some(id => t.pieces[id].props.placed || inTray(t, id))) return { ok: false, notYet: true, msg: 'Try the listed electrons on the rack.' };
        for (const k of Object.keys(SETS)) {
          const id = `t${k}`;
          const fits = validAddress(SETS[k]);
          if (fits && !(t.pieces[id].props.placed && !inTray(t, id))) return { ok: false, msg: 'An electron that has an orbital is not on the rack: try each listed electron.' };
          if (!fits && !inTray(t, id)) return { ok: false, msg: 'An electron that has no orbital is not in the tray: try each listed electron on the rack and put the ones it refuses in the tray.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'l below n, and ml no further than l from zero.',
        title: 'The Allowed Values',
        body: 'For each shell n, subshells l run from 0 to n - 1, and for each subshell l, orbital numbers ml run from -l to +l. An address outside those ranges does not name an orbital.',
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn the Shell dial and watch the rack.'],
  3: ['Drag an arrow onto the lit box to place an electron.', 'Lift Out takes one off again.'],
  4: ['Drag an Up arrow and a Down arrow onto one box.'],
  5: ['Drag each electron onto the rack. The rack refuses', 'any it cannot hold, and says why.'],
  6: ['Drop arrows on boxes until the rack takes no more.'],
  7: ['Set the dials until the ringed box lights.']
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct
   actions, by drag and by two taps. Cells are set, arrows and electrons dropped on boxes, cards put in trays. Nothing here says
   which box an address names or whether a room has it.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const onBox = (piece, row, idx) => put(piece, `piece:${boxPieceId('rack', row, idx)}`);

export const SOLUTIONS = [
  [dial('addr', 'n', 2)],
  [dial('addr', 'n', 2), dial('addr', 'l', 2), dial('addr', 'l', 1), put('l0', 'tray:lights'), put('l1', 'tray:lights'), put('l2', 'tray:none'), put('l3', 'tray:none')],
  [dial('addr', 'l', 2), dial('addr', 'ml', 1), onBox('el', '3d', 3)],
  [onBox('up', '1s', 0), onBox('down', '1s', 0)],
  [onBox('ta', '2p', 1), onBox('tb', '2p', 1), onBox('tc', '2p', 1), onBox('td', '2p', 2), put('tc', 'tray:no')],
  [].concat(...[['3s', 0], ['3p', 0], ['3p', 1], ['3p', 2], ['3d', 0], ['3d', 1], ['3d', 2], ['3d', 3], ['3d', 4]].map(([r, i]) => [onBox('up', r, i), onBox('down', r, i)])).concat([dial('count', 'n', 18)]),
  [dial('addr', 'n', 2), dial('addr', 'l', 1), dial('addr', 'ml', 1)],
  [onBox('ta', '2p', 1), onBox('tb', '2p', 1), onBox('tc', '2p', 1), onBox('td', '2p', 1), put('tb', 'tray:no'), put('tc', 'tray:no')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('addr', 'n', 3)],
  [dial('addr', 'n', 2), put('l0', 'tray:lights'), put('l1', 'tray:lights'), put('l2', 'tray:lights'), put('l3', 'tray:none')],
  [dial('addr', 'l', 2), dial('addr', 'ml', 0), onBox('el', '3d', 2)],
  [onBox('up', '1s', 0)],
  [onBox('ta', '2p', 1), onBox('tb', '2p', 1), onBox('tc', '2p', 1), onBox('td', '2p', 2), put('tb', 'tray:no')],
  [onBox('up', '3s', 0), onBox('down', '3s', 0), dial('count', 'n', 8)],
  [dial('addr', 'n', 2), dial('addr', 'l', 1), dial('addr', 'ml', -1)],
  [onBox('ta', '2p', 1), onBox('tb', '2p', 1), onBox('tc', '2p', 1), onBox('td', '2p', 1), put('ta', 'tray:no'), put('tb', 'tray:no')]
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
export const CHECKS = { FOUR_ELECTRONS, SETS, RINGED, sameAddress, findRoom, shellCapacity, reachPm, finderLight, placedTokens };
