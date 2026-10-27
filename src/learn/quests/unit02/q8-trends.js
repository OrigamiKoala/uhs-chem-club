/**
 * q8-trends.js — Lanternfall, bench eight: PERIODIC TRENDS.
 *
 * The tile store. Bench seven showed that rows exist; this one measures what holds an electron in one and follows the answer across the table.
 * The whole bench is one law applied three ways: charge pulls, distance weakens it, and other electrons in the way cancel some of it.
 *
 * The eighth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4c), on the trends kit (`table/kits/trends.js`), reworked on
 * 2026-10-23 around ONE CLICK. Atoms are scale-model cards (a bigger atom is a bigger circle); a SPRING GAUGE tugs the electron its
 * dial names and reads the pull; a SIZE GAUGE reads a radius; a STRIPPER takes the outermost electron off and reads what it cost; an
 * electron laid on a card puts one on. Ions are made by hand and sized the same way, and cards are ranked on the rail.
 *
 * THE CLICK. A player expects an atom with more protons and more electrons to be bigger: more stuff, more size. So the guess
 * (lithium or carbon, the first with three protons and the second with six) is asked with no gauge on the table, and then the size
 * gauge puts four atoms of one row in order, the biggest being the one with the fewest protons.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  PREDICT: which of lithium and carbon is the bigger atom (no gauge)           -> a guess before the evidence
 *   2  TEST: four atoms of one row, largest to smallest                              -> atomic radius
 *   3  four atoms, by the charge their outermost electron actually feels            -> shielding, effective nuclear charge, Coulomb's law
 *   4  three atoms, by what it costs to strip one electron                           -> ionization energy
 *   5  Na+, Na and Cl-, by size                                                      -> ionic radius
 *
 * EVERY FIGURE IS REAL. The radii (pm) and the first ionization energies (kJ/mol) come from `electrons.js`; the pull is Coulomb's law over
 * the declared nuclear charge, the electrons in the shells below and the real radius (`planPull`), so the bench shows the trend without
 * being told it.
 *
 * Cut on 2026-10-23 (problems doc T6, T7): the electron held hardest of all (stage 3 asks the same question about the outer one), the
 * group trend predicted (stage 2 again with a ring more), magnesium's three costs (successive ionization energies, AP depth) and
 * the closing pull ranking (electronegativity and electron affinity; the words go to the Drill Deck).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import {
  trendsTable, atomCard, electronPiece, springFixture, sizerFixture, stripFixture,
  springRead, sizeRead, stripRead, pullOf, hardestPull, feelsOf, costOf, itemOf, sizeNow, planPull, shellsOf, outerShell,
  RADIUS, ION_RADIUS, IONIZATION, zOf, nameOf
} from '../../table/kits/trends.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bionization energ(?:y|ies)\b/i, introducedAt: 4 },
  { term: /\bionic radi(?:us|i)\b/i, introducedAt: 5 },
  { term: /\beffective nuclear charge\b/i, introducedAt: 3 },
  { term: /\bshielding\b/i, introducedAt: 3 },
  { term: /\bcoulomb.?s law\b/i, introducedAt: 3 },
  { term: /\batomic radi(?:us|i)\b/i, introducedAt: 2 }
];

export const BUILDS_ON = ['unit02/q7-pes', 'unit02/q6-filling'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit02/q8-trends';
const GUESS_LABEL = { li: 'Lithium is bigger', c: 'Carbon is bigger', same: 'The same size' };

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const SPRING = 'sp';
const SIZER = 'sz';
const STRIP = 'st';

const ROW_Y = 53;
const rowAt = i => ({ x: 14 + i * 24, y: ROW_Y });
const NAMES = { Li: 'LITHIUM', Na: 'SODIUM', Be: 'BERYLLIUM', Mg: 'MAGNESIUM', B: 'BORON', C: 'CARBON', N: 'NITROGEN', F: 'FLUORINE', K: 'POTASSIUM', Cl: 'CHLORINE' };
/** Cards in a row along the bottom: `[id, sym]` each, labelled with the element's name. */
const row = list => list.map(([id, sym, label], i) => atomCard(id, label || NAMES[sym], sym, rowAt(i)));

const railAt = (first, last) => ({ id: 'rail', at: { x: 108, y: 36 }, size: { w: 80, h: 12 }, first, last, items: [] });
const railOf = t => t.zones.rail.order.slice();
const where = (t, id) => (t.pieces[id].zone || '').replace(/^(tray|slot):/, '');
const sym = (t, id) => t.pieces[id].props.sym;

/** The tray that holds `n` cards across, one row. */
const tray = (id, label, at, w) => ({ id, label, at, size: { w, h: 22 }, cell: 21 });

/** The size of a card as it stands now, ions included. */
const sizeOfCard = (t, id) => sizeNow(t.pieces[id]);

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Bigger Atoms',
    // A PREDICT STAGE: the gauges are not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Carbon has six protons and lithium has three: which atom do you think is bigger?',
    widget,
    table: trendsTable({
      pieces: [],
      fixtures: [],
      zones: {},
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 75, y: 22 }, size: { w: 34, h: 14 } },
        tokens: [
          { id: 'li', label: 'Lithium', at: { x: 38, y: 48 }, r: 7 },
          { id: 'c', label: 'Carbon', at: { x: 75, y: 48 }, r: 7 },
          { id: 'same', label: 'The same', at: { x: 112, y: 48 }, r: 7 }
        ]
      }
    }),
    hints: [
      'Drag one of the three guesses into the slot.',
      'Think about what carbon has more of, and whether more of it should make the atom bigger.',
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
      body: 'More protons and more electrons is more of everything, so a bigger atom is a fair guess. Next, a size gauge will read the atoms of one row.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const sz = sizerFixture(SIZER, { x: 30, y: 15 });
    return {
      title: 'Four in a Row',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You predicted "${GUESS_LABEL[guess]}": order lithium, beryllium, boron and carbon from largest atom to smallest.`
          : 'Order lithium, beryllium, boron and carbon from largest atom to smallest.';
      },
      widget,
      table: trendsTable({
        pieces: row([['c', 'C'], ['li', 'Li'], ['b', 'B'], ['be', 'Be']]),
        fixtures: [sz.fixture],
        zones: { slots: sz.slots, rail: railAt('Largest atom', 'Smallest atom') }
      }),
      hints: [
        'Use the size gauge: lay an atom in it to read its radius.',
        'Compare the radii of the four atoms with the number of protons on each.',
        'Put the atom with the largest radius at the left of the rail and the smallest at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four atoms on the rail.' };
        const want = order.slice().sort((a, b) => sizeOfCard(t, b) - sizeOfCard(t, a));
        if (order.join() === want.join()) return { ok: true };
        for (let k = 0; k < order.length - 1; k++) {
          if (sizeOfCard(t, order[k]) < sizeOfCard(t, order[k + 1])) return { ok: false, msg: `${t.pieces[order[k]].label} stands left of ${t.pieces[order[k + 1]].label}, and its radius is the smaller.` };
        }
        return { ok: false, msg: 'The rail does not run the way the radii do.' };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = !guess || !GUESS_LABEL[guess] ? '' : guess === 'li'
          ? 'You predicted that lithium is bigger, and the gauge agreed. '
          : 'The gauge did not agree with your prediction, which is how a guess gets better. ';
        return {
          log: 'Across the row, the atoms shrink.',
          title: 'Atomic Radius',
          body: `${verdict}How far an atom's outer electrons sit from its nucleus is its atomic radius, and across a row it shrinks even though each atom has more protons and more electrons than the one before.`,
          model: { type: 'radii', items: [{ sym: 'Li', pm: 152 }, { sym: 'Be', pm: 112 }, { sym: 'B', pm: 85 }, { sym: 'C', pm: 77 }], caption: 'Lithium, beryllium, boron and carbon as spheres to scale: the atoms get smaller as the protons increase.' }
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 }, { show: { between: true, feel: true } });
    return {
      title: 'Effective Nuclear Charge',
      prompt: 'Sort the atoms by the charge their outermost electron actually feels.',
      widget,
      table: trendsTable({
        pieces: row([['li', 'Li'], ['na', 'Na'], ['be', 'Be'], ['mg', 'Mg']]),
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, trays: [tray('one', 'Feels +1', { x: 125, y: 16 }, 44), tray('two', 'Feels +2', { x: 125, y: 43 }, 44)] }
      }),
      hints: [
        'Use the spring gauge: put an atom in the holder with the dial on its outermost electron, and press "Tug Electron".',
        'Compare the charge at the middle with the electrons between and with the charge the electron feels.',
        'Subtract the electrons between from the charge at the middle and tray each atom by what is left.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['li', 'na', 'be', 'mg'];
        if (!ids.every(id => where(t, id) === 'one' || where(t, id) === 'two')) return { ok: false, notYet: true, msg: 'Put every atom in a tray.' };
        const wrong = ids.find(id => where(t, id) !== (feelsOf(sym(t, id)) === 1 ? 'one' : 'two'));
        if (!wrong) return { ok: true };
        return { ok: false, msg: `${t.pieces[wrong].label} is in a tray that does not match the charge its outermost electron feels in the holder.` };
      },
      reward: {
        log: 'Eleven protons, ten electrons in the way.',
        title: 'Shielding and Effective Nuclear Charge',
        body: 'The electrons between an outer electron and the nucleus cancel most of the charge, an effect called shielding, and what is left is the effective nuclear charge: +1 for sodium\'s outer electron, eleven protons less ten shielding electrons. By Coulomb\'s law the pull on an electron grows with that charge and falls off quickly with distance.',
        model: { type: 'atom', p: 11, n: 12, caption: 'Sodium: eleven protons in the middle, and ten electrons on the two shells between them and the lone outer electron.' }
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const st = stripFixture(STRIP, { x: 27, y: 18 });
    return {
      title: 'Ionization Energy',
      prompt: 'Order lithium, beryllium and boron by the energy it costs to strip one electron, cheapest first.',
      widget,
      table: trendsTable({
        pieces: row([['b', 'B'], ['li', 'Li'], ['be', 'Be']]),
        fixtures: [st.fixture],
        zones: { slots: st.slots, rail: railAt('Costs least', 'Costs most') }
      }),
      hints: [
        'Use the stripper: put an atom in the holder and press "Strip Electron".',
        'Compare the three costs, and compare their order with the order of the atoms across the row.',
        'Put the atom with the smallest cost at the left of the rail and the largest at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three atoms on the rail.' };
        const want = order.slice().sort((a, b) => costOf(sym(t, a), 0) - costOf(sym(t, b), 0));
        if (order.join() === want.join()) return { ok: true };
        for (let k = 0; k < order.length - 1; k++) {
          if (costOf(sym(t, order[k]), 0) > costOf(sym(t, order[k + 1]), 0)) return { ok: false, msg: `${t.pieces[order[k]].label} stands left of ${t.pieces[order[k + 1]].label}, and it costs more to strip.` };
        }
        return { ok: false, msg: 'The rail does not run the way the costs do.' };
      },
      reward: {
        log: 'Li 520, B 801, Be 899.',
        title: 'Ionization Energy',
        body: 'The energy required to remove the outermost electron from an atom is its ionization energy, which generally rises across a row. Boron dips below beryllium because its outer electron is in a 2p subshell, which is higher in energy and shielded by the 2s electrons.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const st = stripFixture(STRIP, { x: 27, y: 18 });
    const sz = sizerFixture(SIZER, { x: 76, y: 15 });
    return {
      title: 'Ionic Radii',
      prompt: 'Make a sodium ion and a chlorine ion, then order them with a sodium atom, smallest first.',
      widget,
      table: trendsTable({
        pieces: [
          atomCard('na1', 'SODIUM A', 'Na', rowAt(0)), atomCard('na2', 'SODIUM B', 'Na', rowAt(1)), atomCard('cl', 'CHLORINE', 'Cl', rowAt(2)),
          electronPiece('e', { x: 96, y: ROW_Y - 2 })
        ],
        fixtures: [st.fixture, sz.fixture],
        zones: { slots: [...st.slots, ...sz.slots], rail: railAt('Smallest size', 'Largest size') }
      }),
      hints: [
        'Use "Strip Electron" with a sodium atom in the stripper, "Add Electron" on the chlorine card, and the size gauge.',
        'Lay each of the three in the size gauge and compare the radii with the charge on each card.',
        'Put the smallest of the three at the left of the rail and the largest at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three on the rail.' };
        const states = order.map(id => `${sym(t, id)}${itemOf(t.pieces[id]).charge}`).sort().join();
        if (states !== ['Cl-1', 'Na0', 'Na1'].sort().join()) return { ok: false, msg: 'The rail does not hold a sodium atom, a sodium ion and a chlorine ion.' };
        const want = order.slice().sort((a, b) => sizeOfCard(t, a) - sizeOfCard(t, b));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'The rail does not run the way the radii do.' };
      },
      reward: {
        log: 'Strip one electron and the atom shrinks; add one and it swells.',
        title: 'Ionic Radius',
        body: 'A positive ion is much smaller than its atom, because losing the outer shell leaves the remaining electrons pulled in by the same nucleus. A negative ion is bigger, since an extra electron adds repulsion without any extra pull. These sizes are the ionic radius.',
        model: { type: 'radii', items: [{ sym: 'Na+', pm: 102 }, { sym: 'Cl-', pm: 181 }, { sym: 'Na', pm: 186 }], caption: 'The sodium ion, the chlorine ion and the sodium atom as spheres to scale: losing the outer shell shrinks sodium a great deal.' },
        last: true
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Lay an atom in the size gauge to read its size.'],
  3: ['Drag an atom into the holder, then press Tug Electron.']
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
      body: 'Atomic structure governs periodic trends: nuclear charge pulls electrons inward, inner electrons shield outer electrons, and greater distance reduces attraction.'
    },
    {
      heading: 'Why It Matters',
      body: 'Trends in atomic radius, effective nuclear charge, and ionization energy explain how elements interact and react across the periodic table.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which has the larger atomic radius: sodium or magnesium?',
    options: [
      { id: 'a', label: 'Sodium' },
      { id: 'b', label: 'Magnesium' },
      { id: 'c', label: 'They are the same' },
      { id: 'd', label: 'It depends on the temperature' }
    ],
    answer: 'a',
    explanation: 'Across a row each atom has one more proton pulling on the same shell, so atoms shrink from left to right. Sodium is to the left of magnesium.'
  },
  {
    question: 'An outer electron in sodium feels an effective nuclear charge of about +1, though the nucleus has 11 protons. Why?',
    options: [
      { id: 'a', label: 'The ten electrons between it and the nucleus cancel most of the charge' },
      { id: 'b', label: 'Sodium has only one proton' },
      { id: 'c', label: 'The outer electron has no charge' },
      { id: 'd', label: 'The nucleus is too far away to matter at all' }
    ],
    answer: 'a',
    explanation: 'Shielding: the inner electrons sit between the outer electron and the nucleus and cancel most of its charge, leaving about +1.'
  },
  {
    question: 'Which of these costs the most energy to strip one electron from?',
    options: [
      { id: 'a', label: 'Beryllium' },
      { id: 'b', label: 'Lithium' },
      { id: 'c', label: 'Boron' },
      { id: 'd', label: 'Sodium' }
    ],
    answer: 'a',
    explanation: 'Beryllium holds its outer electron harder than lithium or sodium, and a little harder than boron, whose outer electron is in a 2p subshell.'
  },
  {
    question: 'A sodium atom loses its outer electron and becomes Na+. How does its size change?',
    options: [
      { id: 'a', label: 'It gets much smaller' },
      { id: 'b', label: 'It gets much bigger' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It gets slightly bigger' }
    ],
    answer: 'a',
    explanation: 'The outer shell is gone, and the remaining electrons are pulled in by the same nucleus.'
  },
  {
    question: 'A chlorine atom gains an electron and becomes Cl-. How does its size change?',
    options: [
      { id: 'a', label: 'It gets bigger' },
      { id: 'b', label: 'It gets smaller' },
      { id: 'c', label: 'It stays the same' },
      { id: 'd', label: 'It vanishes' }
    ],
    answer: 'a',
    explanation: 'The extra electron repels the others and adds no extra pull, so the ion is bigger than the atom.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. Atoms are put in a holder, a key is pressed, electrons are laid on cards, cards
   go on a rail or in trays. Nothing here says what a gauge reads.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const SPRING_SLOT = `slot:${SPRING}.atom`;
const STRIP_SLOT = `slot:${STRIP}.atom`;
const SIZER_SLOT = `slot:${SIZER}.atom`;
const tug = id => [put(id, SPRING_SLOT), { run: SPRING }];
const strip = (id, times = 1) => [put(id, STRIP_SLOT), ...Array.from({ length: times }, () => ({ run: STRIP }))];
const size = id => [put(id, SIZER_SLOT)];

export const SOLUTIONS = [
  [{ predict: 'li' }],
  [...['li', 'be', 'b', 'c'].flatMap(size), put('li', 'rail:0'), put('be', 'rail:1'), put('b', 'rail:2'), put('c', 'rail:3')],
  [...['li', 'na', 'be', 'mg'].flatMap(id => [put(id, SPRING_SLOT)]), put('li', 'tray:one'), put('na', 'tray:one'), put('be', 'tray:two'), put('mg', 'tray:two')],
  [...strip('li'), ...strip('be'), ...strip('b'), put('li', 'rail:0'), put('b', 'rail:1'), put('be', 'rail:2')],
  [...strip('na2'), { join: ['e', 'cl'] }, put('na2', 'rail:0'), put('cl', 'rail:1'), put('na1', 'rail:2')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('c', 'rail:0'), put('b', 'rail:1'), put('be', 'rail:2'), put('li', 'rail:3')],
  [put('li', 'tray:two'), put('na', 'tray:two'), put('be', 'tray:one'), put('mg', 'tray:one')],
  [...strip('li'), ...strip('be'), ...strip('b'), put('li', 'rail:0'), put('be', 'rail:1'), put('b', 'rail:2')],
  [...strip('na2'), { join: ['e', 'cl'] }, put('na2', 'rail:0'), put('na1', 'rail:1'), put('cl', 'rail:2')]
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
export { springRead, sizeRead, stripRead, pullOf, hardestPull, feelsOf, costOf, itemOf, sizeNow, planPull, shellsOf, outerShell, RADIUS, ION_RADIUS, IONIZATION, zOf, nameOf, QUEST_KEY };
