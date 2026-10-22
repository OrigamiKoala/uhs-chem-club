/**
 * q6-filling.js — Lanternfall, bench six: ELECTRON CONFIGURATION.
 *
 * The other face of the records tent's board. Bench five gave every box an address; this one fills the boxes the way an atom
 * does, from carbon to iron, and finds the two places the rule and the measurement part company.
 *
 * The sixth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4b), on the address and filling kit (`table/kits/shells.js`).
 * Arrows are dealt into the rack's boxes by hand (Up, Down, Lift Out dropped on a box), as the Lewis slate deals pairs; the board reads
 * what the rack holds (`electrons.js` `readRack`); a written form is a card put in a slot; elements are strips sorted into trays.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  place carbon's six electrons                  -> aufbau principle
 *   2  match the magnet's pull for the p electrons   -> Hund's rule, paramagnetic and diamagnetic
 *   3  build oxygen, lay the card of what it reads   -> electron configuration
 *   4  place potassium's nineteenth electron         -> the ladder is not in shell order
 *   5  iron in short form                            -> noble-gas notation
 *   6  six elements, by where the last electron went -> blocks of the periodic table
 *   7  lift two electrons off iron                   -> transition metal ions
 *   8  place chromium so the rack matches the magnet -> the Cr and Cu exceptions (BEYOND THE EXAM)
 *
 * THE MAGNET MEASURES THE SAMPLE. `Test Sample` reads the real sample's pull from `electrons.MEASURED`, and `Test Rack` reads the
 * arrangement on the rack by the same rule (single electrons pointing the same way add, opposite ones cancel). Chromium is the
 * stage where the two disagree on the first attempt and only agree on the right one, which is why it is a discovery and not a recital.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import {
  shellsTable, shelf, hand, configCard, elementStrip, magnet, coreSwitch,
  readOf, rackOf, rackPull, rackFor, groundConfig, readRack, isLaddered, blockOf, zOf, symbolOf, MEASURED, boxPieceId, configString, shortString
} from '../../table/kits/shells.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\btransition metal ions?\b/i, introducedAt: 7 },
  { term: /\bblocks?\b/i, introducedAt: 6 },
  { term: /\bnoble.gas notation\b/i, introducedAt: 5 },
  { term: /\bconfigurations?\b/i, introducedAt: 3 },
  { term: /\bhund.?s? rule\b/i, introducedAt: 2 },
  { term: /\bparamagnetic\b/i, introducedAt: 2 },
  { term: /\bdiamagnetic\b/i, introducedAt: 2 },
  { term: /\baufbau\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q5-numbers', 'unit02/q4-cloud'];

const SPEAKER = 'Vess';

/** Every piece and key on this bench says what it does on its face, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, at, size, cell = 16) => ({ id, label, at, size, cell });
const inTray = (t, id) => (t.pieces[id].zone || '').startsWith('tray:');

const ROWS = ['1s', '2s', '2p', '3s', '3p', '4s', '3d', '4p'];
/** Rows with the 3d row below 4s, the way an ion's ladder is drawn. */
const ION_ROWS = ['1s', '2s', '2p', '3s', '3p', '3d', '4s'];

/** The Ar core, locked on the rack so a stage can start where an atom's chemistry starts. */
const AR_CORE = rackFor(18);

const SYMS = ['K', 'Cl', 'Zn', 'Eu', 'Al', 'Mn'];

/** Hands for a stage: Up, Down and Lift Out in a row. */
const hands = (x, y, pitch = 18) => [hand('up', 'up', { x, y }), hand('down', 'down', { x: x + pitch, y }), hand('lift', 'lift', { x: x + 2 * pitch, y })];

/** Four written forms as cards, two rows of three at the bottom right. */
const cards = items => items.map(([id, label], i) => configCard(id, label, { x: 88 + (i % 3) * 24, y: 44 + Math.floor(i / 3) * 13 }));

const SHELF_AT = { x: 36, y: 32 };

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p', '3s'], SHELF_AT);
    return {
      title: 'Six for Carbon',
      briefing: {
        speaker: SPEAKER,
        body: 'This bench files electrons into orbital boxes by energy, lowest first. Drop an arrow on a box to place an electron there.'
      },
      prompt: 'Build a ground-state carbon atom by placing its six electrons on the rack.',
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(92, 22)], fixtures: [rack.fixture] }),
      hints: [
        'Drop "Up" or "Down" on a box to place an electron there, starting at the bottom of the ladder.',
        'Compare the rows by how high they sit on the ladder, and decide which of them still have room.',
        'Fill the lowest row until its boxes are full before you put anything in the row above it.'
      ],
      check(state) {
        const r = readOf(state.table, 'rack');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place carbon\'s electrons on the rack.' };
        if (r.total !== 6) return { ok: false, msg: 'Count the electrons on the rack against how many carbon has.' };
        if (!isLaddered(r.counts)) return { ok: false, msg: 'An electron is sitting in a row while a lower row still has room. Look further down the ladder.' };
        return { ok: true };
      },
      reward: {
        log: 'Lowest rows first.',
        title: 'Aufbau Principle',
        body: 'Electrons fill the lowest energy rows first, from the bottom of the ladder up, and no row takes an electron while a lower one has room. That filling order is the aufbau principle, from the German for building up.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const rack = shelf('rack', ['1s', '2s', '2p'], { x: 34, y: 32 }, { pre: rackFor(4), locked: true });
    return {
      title: 'Two in the p Row',
      briefing: {
        speaker: SPEAKER,
        body: 'A magnetic probe is now available. Use "Test Sample" or "Test Rack" to measure the magnetic pull of unpaired electrons.'
      },
      prompt: 'Place carbon\'s two 2p electrons so the rack pulls on the magnet as hard as the sample does.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(84, 12)],
        fixtures: [rack.fixture, magnet('msample', { x: 92, y: 42 }, { sample: 'C' }), magnet('mrack', { x: 128, y: 42 }, { rack: 'rack' })]
      }),
      hints: [
        'Press "Test Sample" to see how hard carbon is pulled, then place the two p electrons different ways and press "Test Rack" each time.',
        'Compare the pull of the rack with the pull of the sample, arrangement by arrangement.',
        'Find the arrangement of the two p electrons whose pull on the rack matches the sample\'s.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 4) return { ok: false, notYet: true, msg: 'Place carbon\'s two 2p electrons on the rack.' };
        if (r.total !== 6) return { ok: false, msg: 'Count the electrons on the rack against how many carbon has.' };
        if (rackPull(t, 'rack') !== MEASURED.C) return { ok: false, msg: 'The rack pulls differently from the sample. Test both, and look for an arrangement of the two p electrons that matches the sample\'s pull.' };
        return { ok: true };
      },
      reward: {
        log: 'Carbon is pulled: two electrons stand alone, pointing alike.',
        title: 'Hund\'s Rule',
        body: 'Electrons spread out over the boxes of a row before any pair up, and the single ones all point the same way: that is Hund\'s rule. An atom with unpaired electrons is pulled into a magnet and is called paramagnetic, while one with none is pushed very slightly away and is called diamagnetic.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
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
        'Place oxygen\'s electrons on the rack the way you placed carbon\'s, and read what the rack prints along the top.',
        'Compare the figures the rack prints for each row with the written forms on the cards.',
        'Fill the lowest rows first, then match the number of electrons the rack reports in each row to a card.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        const card = Object.values(t.pieces).find(p => p.kind === 'ccard' && p.zone === 'slot:reads');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place oxygen\'s electrons on the rack.' };
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (r.total !== 8 || !isLaddered(r.counts)) return { ok: false, msg: 'Place all of oxygen\'s electrons on the rack, lowest rows first, and compare what it prints with the card.' };
        if (card.label !== r.config) return { ok: false, msg: 'Compare what the rack prints, row by row, with this card.' };
        return { ok: true };
      },
      reward: {
        log: 'The rack prints rows and their electrons.',
        title: 'Electron Configuration',
        body: 'The written arrangement the rack prints, each row followed by its number of electrons as a small raised figure, is the electron configuration. Oxygen\'s is 1s² 2s² 2p⁴, with four electrons in 2p filling one box twice and two boxes once.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const rack = shelf('rack', ROWS, SHELF_AT, { pre: AR_CORE, locked: true });
    return {
      title: 'Potassium\'s Last',
      prompt: 'Where does potassium\'s nineteenth electron settle on the energy ladder?',
      widget,
      table: shellsTable({ pieces: [...rack.boxes, ...hands(92, 32)], fixtures: [rack.fixture] }),
      hints: [
        'Drop "Up" on a box for the one electron still to place.',
        'Compare the rows that have room by how high each sits on the ladder.',
        'Place the electron in the lowest row with room, even if it is not the next shell along.'
      ],
      check(state) {
        const r = readOf(state.table, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place the one electron still to come.' };
        if (r.total !== 19) return { ok: false, msg: 'Place exactly one more electron than the rack started with.' };
        if (r.counts['4s'] !== 1) return { ok: false, msg: 'A row lower on the ladder still has room. Compare the heights of the rows, not the order of their labels.' };
        return { ok: true };
      },
      reward: {
        log: 'The 4s row sits below the 3d row.',
        title: 'Energy Order, Not Shell Order',
        body: 'The 4s row sits below the 3d row on the ladder, so potassium\'s last electron goes into 4s even though 3 comes before 4. Rows fill in order of their energy, and that is not always the order of their shells.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rack = shelf('rack', ROWS, SHELF_AT, { pre: AR_CORE, locked: true, core: 'core' });
    return {
      title: 'Iron in Short Form',
      briefing: {
        speaker: SPEAKER,
        body: 'You can now abbreviate filled inner shells. Turn Collapse Core on to fold the completed inner rows into a shorthand symbol.'
      },
      prompt: 'Build iron on the rack, then put the card with its noble-gas shorthand in the slot.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(92, 8), ...cards([['ar', '[Ar] 4s² 3d⁶'], ['d8', '[Ar] 4s² 3d⁸'], ['ne', '[Ne] 4s² 3d⁶'], ['kr', '[Kr] 4s² 3d⁶']])],
        fixtures: [rack.fixture, coreSwitch('core', { x: 96, y: 24 })],
        zones: { slots: [{ id: 'reads', label: 'Short form', at: { x: 132, y: 24 }, size: { w: 28, h: 13 } }] }
      }),
      hints: [
        'Place the eight electrons iron has beyond the closed core, then turn Collapse Core on and read the top of the rack.',
        'Compare the symbol in brackets with the rows it replaces: it stands for every closed row below the open ones.',
        'Fill the 4s row first and then the 3d boxes, and put the card that matches what the rack prints in the slot.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        const card = Object.values(t.pieces).find(p => p.kind === 'ccard' && p.zone === 'slot:reads');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place the rest of iron\'s electrons on the rack.' };
        if (!card) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (r.total !== 26 || !isLaddered(r.counts)) return { ok: false, msg: 'Place exactly the electrons iron has, lowest rows first, then compare what the rack prints with the card.' };
        if (card.label !== r.short) return { ok: false, msg: 'Turn the core key on and compare what the rack prints with this card.' };
        return { ok: true };
      },
      reward: {
        log: 'A closed core folds into one symbol.',
        title: 'Noble-Gas Notation',
        body: 'The closed rows that match a noble gas fold into its symbol in brackets, so iron is written [Ar] 4s² 3d⁶. This noble-gas notation says only what lies beyond the closed core, which is where the chemistry happens.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const strips = SYMS.map((sym, i) => elementStrip(`e-${sym.toLowerCase()}`, sym, { x: 12 + i * 19, y: 10 }));
    return {
      title: 'Where the Last Electron Went',
      prompt: 'Put each element strip in the tray for the kind of row its last electron went into.',
      widget,
      table: shellsTable({
        pieces: strips,
        fixtures: [],
        zones: {
          trays: [
            tray('s', 'An s row', { x: 20, y: 46 }, { w: 33, h: 34 }),
            tray('p', 'A p row', { x: 57, y: 46 }, { w: 33, h: 34 }),
            tray('d', 'A d row', { x: 94, y: 46 }, { w: 33, h: 34 }),
            tray('f', 'An f row', { x: 128, y: 46 }, { w: 32, h: 34 })
          ]
        }
      }),
      hints: [
        'Find the lit bar on each strip; it marks the row the last electron went into.',
        'Read the letter on the lit row\'s label and tray the strip by it.',
        'Compare the letter of the highest row with electrons in it, in ladder order, for each element.'
      ],
      check(state) {
        const t = state.table;
        const ids = SYMS.map(s => `e-${s.toLowerCase()}`);
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put all six elements in a tray.' };
        for (const sym of SYMS) {
          if (t.pieces[`e-${sym.toLowerCase()}`].zone !== `tray:${blockOf(zOf(sym))}`) {
            return { ok: false, msg: 'Look for the lit bar on that strip and read the letter of the row it belongs to.' };
          }
        }
        return { ok: true };
      },
      reward: {
        log: 'Where the last electron lands is where the element sits.',
        title: 'Blocks of the Periodic Table',
        body: 'The row an element\'s last electron goes into puts it in the s, p, d or f block of the periodic table. The s block is the first two columns, the p block the last six, the d block the ten between them and the f block the fourteen that hang below.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const rack = shelf('rack', ION_ROWS, { x: 34, y: 31 }, { pre: rackFor(26) });
    return {
      title: 'Iron Loses Two',
      prompt: 'Lift the two electrons that leave first when an iron atom forms an Fe²⁺ ion.',
      widget,
      table: shellsTable({
        pieces: [...rack.boxes, ...hands(84, 12)],
        fixtures: [rack.fixture, magnet('msample', { x: 92, y: 42 }, { sample: 'Fe2+' }), magnet('mrack', { x: 128, y: 42 }, { rack: 'rack' })]
      }),
      hints: [
        'Drop "Lift Out" on the boxes you want to take an electron from.',
        'Look at the ladder: this is how a charged atom draws it, and the electrons that leave first are the highest on it.',
        'Take both electrons from the highest row with electrons in it, then press "Test Rack" and compare with "Test Sample".'
      ],
      check(state) {
        const r = readOf(state.table, 'rack');
        if (r.total >= 26) return { ok: false, notYet: true, msg: 'Lift two electrons off the rack.' };
        if (r.total !== 24) return { ok: false, msg: 'Lift exactly two electrons from the rack, no more and no fewer.' };
        if ((r.counts['4s'] || 0) !== 0 || r.counts['3d'] !== 6) return { ok: false, msg: 'The electrons that leave first are the ones in the highest row on this ladder. Check which row that is.' };
        return { ok: true };
      },
      reward: {
        log: 'The 4s electrons go first.',
        title: 'Transition Metal Ions',
        body: 'A transition metal gives up its 4s electrons before its 3d ones, so iron(II) is [Ar] 3d⁶ and not [Ar] 4s² 3d⁴. Once an atom carries a charge the 3d row drops below 4s on the ladder, and the highest row is the one that empties first.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
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
        'Press "Test Sample" to see how hard chromium is pulled, then fill the rack the way you have been and press "Test Rack".',
        'Compare the two pulls and ask which arrangement of the last six electrons would make the rack pull harder.',
        'Count how many electrons would have to stand alone in separate boxes, pointing the same way, to match the sample\'s pull.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'rack');
        if (r.total <= 18) return { ok: false, notYet: true, msg: 'Place the last six electrons on the rack.' };
        if (r.total !== 24) return { ok: false, msg: 'Place exactly as many electrons as chromium has.' };
        if (rackPull(t, 'rack') !== MEASURED.Cr) return { ok: false, msg: 'The rack pulls differently from the sample. Test both, and look for an arrangement that matches the sample\'s pull.' };
        return { ok: true };
      },
      reward: {
        log: 'The sample is pulled harder than the rule predicts.',
        title: 'The Chromium and Copper Exceptions',
        body: 'Chromium moves one 4s electron into 3d, so every box in the 3d row holds one, and copper does the same to fill its 3d row. The ladder alone predicts a smaller pull, but the magnet measures the real one. This is beyond the exam.',
        last: true
      }
    };
  })()
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Electrons fill the lowest rows first, spread across a row before pairing, and the ladder is ordered by energy and not by shell. The blocks of the periodic table are simply the rows the last electron lands in.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Nearly everything an element does follows from the few electrons beyond its closed core. You can now write that core in one symbol and the rest in a line.'
    },
    {
      heading: 'Next',
      body: 'The core bench from Tallow can pull those electrons off one at a time. The next two benches measure what it costs, and read it back as a spectrum.'
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
    question: 'Which is the correct noble-gas notation for the ground state of calcium (20 electrons)?',
    options: [
      { id: 'a', label: '[Ar] 4s²' },
      { id: 'b', label: '[Ar] 3d²' },
      { id: 'c', label: '[Ne] 4s²' },
      { id: 'd', label: '[Kr] 4s²' }
    ],
    answer: 'a',
    explanation: 'Argon has 18 electrons, and the next two go into 4s, which sits below 3d on the ladder. Calcium is [Ar] 4s².'
  },
  {
    question: 'When an iron atom becomes Fe²⁺, which electrons are lost first?',
    options: [
      { id: 'a', label: 'The two 4s electrons' },
      { id: 'b', label: 'Two 3d electrons' },
      { id: 'c', label: 'One 4s and one 3d electron' },
      { id: 'd', label: 'Two 3p electrons' }
    ],
    answer: 'a',
    explanation: 'Transition metals lose their outermost s electrons first. Fe²⁺ is [Ar] 3d⁶, not [Ar] 4s² 3d⁴.'
  },
  {
    question: '(Beyond the exam.) Chromium\'s ground state is [Ar] 4s¹ 3d⁵, not [Ar] 4s² 3d⁴. What does the magnet find?',
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
   actions, by drag and by two taps. Arrows are dropped on boxes, cards put in a slot, strips in trays, the magnet pressed.
   Nothing here says what the rack reads or how hard a sample is pulled.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const on = (piece, row, idx) => put(piece, `piece:${boxPieceId('rack', row, idx)}`);
const up = (row, idx) => on('up', row, idx);
const down = (row, idx) => on('down', row, idx);
const lift = (row, idx) => on('lift', row, idx);
const pair = (row, idx) => [up(row, idx), down(row, idx)];

export const SOLUTIONS = [
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1)],
  [{ run: 'msample' }, up('2p', 0), up('2p', 1), { run: 'mrack' }],
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2), down('2p', 0), put('p4', 'slot:reads')],
  [up('4s', 0)],
  [...pair('4s', 0), up('3d', 0), up('3d', 1), up('3d', 2), up('3d', 3), up('3d', 4), down('3d', 0), { setDial: { fixture: 'core', dial: 'core', value: 1 } }, put('ar', 'slot:reads')],
  [put('e-k', 'tray:s'), put('e-cl', 'tray:p'), put('e-zn', 'tray:d'), put('e-eu', 'tray:f'), put('e-al', 'tray:p'), put('e-mn', 'tray:d')],
  [lift('4s', 0), lift('4s', 0), { run: 'msample' }, { run: 'mrack' }],
  [{ run: 'msample' }, up('4s', 0), up('3d', 0), up('3d', 1), up('3d', 2), up('3d', 3), up('3d', 4), { run: 'mrack' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...pair('1s', 0), ...pair('2p', 0), ...pair('2p', 1)],
  [up('2p', 0), down('2p', 0)],
  [...pair('1s', 0), ...pair('2s', 0), up('2p', 0), up('2p', 1), up('2p', 2), down('2p', 0), put('p6', 'slot:reads')],
  [up('3d', 0)],
  [...pair('4s', 0), up('3d', 0), up('3d', 1), up('3d', 2), up('3d', 3), up('3d', 4), down('3d', 0), put('ne', 'slot:reads')],
  [put('e-k', 'tray:s'), put('e-cl', 'tray:p'), put('e-zn', 'tray:s'), put('e-eu', 'tray:d'), put('e-al', 'tray:p'), put('e-mn', 'tray:d')],
  [lift('3d', 0), lift('3d', 0)],
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
export { AR_CORE, SYMS, ROWS, ION_ROWS, rackOf, readRack, groundConfig, configString, shortString, symbolOf };
