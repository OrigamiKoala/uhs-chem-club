/**
 * q8-trends.js — Lanternfall, bench eight: PERIODIC TRENDS.
 *
 * The tile store. Bench seven showed that rows exist; this one measures what holds an electron in one and follows the answer across the table
 * and down it. The whole bench is one law applied three ways — charge pulls, distance weakens it, and other electrons in the way cancel some
 * of it — and every trend the course teaches falls out of that.
 *
 * The eighth of Lanternfall's TABLETOPS (plan `bench-tabletop.md`, phase T4c), on the trends kit (`table/kits/trends.js`). Atoms are scale-model
 * cards (a bigger atom is a bigger circle); a SPRING GAUGE tugs the electron its dial names and reads the pull; a SIZE GAUGE reads a radius; a
 * STRIPPER takes the outermost electron off and reads what it cost; an electron laid on a card puts one on. Ions are made by hand and sized the
 * same way, and cards are ranked on the rail.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  the electron an atom holds hardest              -> Coulomb's law
 *   2  the charge an outer electron feels              -> shielding, effective nuclear charge
 *   3  four atoms, by size                             -> atomic radius
 *   4  predict a bigger atom a group down              -> (one more ring)
 *   5  Na+, Na and Cl-, by size                        -> ionic radius
 *   6  three atoms, by what it costs to strip one      -> ionization energy
 *   7  how far magnesium is stripped                   -> successive ionization energies
 *   8  four atoms, by their pull on their outermost    -> electronegativity, electron affinity
 *
 * EVERY FIGURE IS REAL. The radii (pm), the first ionization energies (kJ/mol) and magnesium's successive ones come from `electrons.js`; the pull
 * is Coulomb's law over the declared nuclear charge, the electrons in the shells below and the real radius (`planPull`), so the bench shows the
 * trend without being told it.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import {
  trendsTable, atomCard, electronPiece, springFixture, sizerFixture, stripFixture,
  springRead, sizeRead, stripRead, pullOf, hardestPull, feelsOf, costOf, itemOf, sizeNow, planPull, shellsOf, outerShell,
  RADIUS, ION_RADIUS, IONIZATION, MG_SUCCESSIVE, zOf, nameOf
} from '../../table/kits/trends.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\belectron affinity\b/i, introducedAt: 8 },
  { term: /\belectronegativity\b/i, introducedAt: 8 },
  { term: /\bsuccessive ionization energies\b/i, introducedAt: 7 },
  { term: /\bionization energ(?:y|ies)\b/i, introducedAt: 6 },
  { term: /\bionic radi(?:us|i)\b/i, introducedAt: 5 },
  { term: /\batomic radi(?:us|i)\b/i, introducedAt: 3 },
  { term: /\beffective nuclear charge\b/i, introducedAt: 2 },
  { term: /\bshielding\b/i, introducedAt: 2 },
  { term: /\bcoulomb.?s law\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q7-pes', 'unit02/q6-filling'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const widget = { type: 'table', label: 'The bench' };
const SPRING = 'sp';
const SIZER = 'sz';
const STRIP = 'st';
const SPRING_SLOT = `slot:${SPRING}.atom`;
const SIZER_SLOT = `slot:${SIZER}.atom`;
const STRIP_SLOT = `slot:${STRIP}.atom`;

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
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 });
    return {
      title: 'What Makes the Pull',
      briefing: {
        speaker: SPEAKER,
        body: 'This bench models atoms to scale and measures the pull on their electrons. Put an atom in the holder and press "Tug Electron" to read the pull on the electron the dial names.'
      },
      prompt: 'Put the atom that holds one of its electrons hardest of all in the tray.',
      widget,
      table: trendsTable({
        pieces: row([['li', 'Li'], ['na', 'Na'], ['be', 'Be'], ['mg', 'Mg']]),
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, trays: [{ id: 'hard', label: 'Hardest pull', at: { x: 128, y: 30 }, size: { w: 30, h: 26 }, cell: 26 }] }
      }),
      hints: [
        'Put an atom in the holder, turn the dial to an electron and press "Tug Electron".',
        'Compare the pull with the charge at the middle and the distance on each reading, for the innermost and the outermost electron.',
        'Tug the innermost and the outermost electron of every atom and keep the atom with the largest reading of all.'
      ],
      check(state) {
        const t = state.table;
        const held = ['li', 'na', 'be', 'mg'].filter(id => where(t, id) === 'hard');
        if (held.length === 0) return { ok: false, notYet: true, msg: 'Put an atom in the tray.' };
        const best = ['li', 'na', 'be', 'mg'].slice().sort((a, b) => hardestPull(sym(t, b)) - hardestPull(sym(t, a)))[0];
        if (held.length === 1 && held[0] === best) return { ok: true };
        if (held.length > 1) return { ok: false, msg: 'The tray holds one atom: the one with the electron pulled harder than any other.' };
        return { ok: false, msg: 'Another atom has an electron pulled harder: tug the innermost electron of every atom, not only the outermost, and compare.' };
      },
      reward: {
        log: 'Closer and a bigger core: a harder pull.',
        title: 'Coulomb\'s Law',
        body: 'The pull between a nucleus and an electron grows with the charge on the nucleus and falls off with the square of the distance between them. This is Coulomb\'s law, and everything else on this bench is an application of it.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 }, { show: { between: true, feel: true } });
    return {
      title: 'Plus One, Not Plus Eleven',
      prompt: 'Sort the atoms by the charge their outermost electron actually feels.',
      widget,
      table: trendsTable({
        pieces: row([['li', 'Li'], ['na', 'Na'], ['be', 'Be'], ['mg', 'Mg']]),
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, trays: [tray('one', 'Feels +1', { x: 125, y: 14 }, 44), tray('two', 'Feels +2', { x: 125, y: 40 }, 44)] }
      }),
      hints: [
        'Put each atom in the holder with the dial on its outermost electron and read every line.',
        'Compare the charge at the middle with the electrons between and with the charge the electron feels.',
        'Subtract the electrons between from the charge at the middle and tray each atom by what is left.'
      ],
      check(state) {
        const t = state.table;
        const ids = ['li', 'na', 'be', 'mg'];
        if (!ids.every(id => where(t, id) === 'one' || where(t, id) === 'two')) return { ok: false, notYet: true, msg: 'Put every atom in a tray.' };
        for (const id of ids) {
          if (where(t, id) !== (feelsOf(sym(t, id)) === 1 ? 'one' : 'two')) return { ok: false, msg: 'An atom is in the wrong tray: read the charge its outermost electron feels in the holder, not the charge at its middle.' };
        }
        return { ok: true };
      },
      reward: {
        log: 'Eleven protons, ten electrons in the way.',
        title: 'Shielding and Effective Nuclear Charge',
        body: 'The electrons between an outer electron and the nucleus cancel most of the charge, an effect called shielding. What is left is the effective nuclear charge, which is +1 for sodium\'s outer electron: eleven protons less ten shielding electrons.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const sz = sizerFixture(SIZER, { x: 30, y: 15 });
    return {
      title: 'Four in a Row',
      prompt: 'Order lithium, beryllium, boron, and carbon from largest atomic size to smallest.',
      widget,
      table: trendsTable({
        pieces: row([['c', 'C'], ['li', 'Li'], ['b', 'B'], ['be', 'Be']]),
        fixtures: [sz.fixture],
        zones: { slots: sz.slots, rail: railAt('Largest atom', 'Smallest atom') }
      }),
      hints: [
        'Lay an atom in the size gauge and read its radius.',
        'Compare the radii, and compare how much charge the outermost electron of each atom feels.',
        'Put the atom with the largest radius at the left of the rail and the smallest at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four atoms on the rail.' };
        const want = order.slice().sort((a, b) => sizeOfCard(t, b) - sizeOfCard(t, a));
        if (order.join() === want.join()) return { ok: true };
        if (order.join() === want.slice().reverse().join()) return { ok: false, msg: 'That order runs the wrong way: the atom at the left end of the rail must be the biggest.' };
        return { ok: false, msg: 'Lay each atom in the size gauge and read its radius before you place it.' };
      },
      reward: {
        log: 'Across the row, the outer electron comes closer.',
        title: 'Atomic Radius',
        body: 'How far an atom\'s outer electrons sit from its nucleus is its atomic radius. Across a period it shrinks, because each step adds a proton to pull the same shell in tighter while the extra electron goes into that same shell and shields almost nothing.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 }, { show: { between: true, feel: true }, feelWord: 'EFF. NUCLEAR CHARGE' });
    const sz = sizerFixture(SIZER, { x: 88, y: 15 }, { measure: true, w: 40 });
    const token = (id, label, y) => ({ id, label, at: { x: 130, y }, r: 7 });
    return {
      title: 'Down a Group',
      prompt: 'Predict how a potassium atom\'s size compares with a sodium atom\'s.',
      widget,
      table: trendsTable({
        pieces: row([['na', 'Na'], ['k', 'K']]),
        fixtures: [sp.fixture, sz.fixture],
        zones: { slots: [...sp.slots, ...sz.slots] },
        prediction: {
          slot: { id: 'predict', label: 'Size of K', at: { x: 130, y: 10 }, size: { w: 24, h: 12 } },
          tokens: [token('larger', 'Larger', 26), token('smaller', 'Smaller', 40), token('equal', 'Equal', 54)]
        }
      }),
      hints: [
        'Place a prediction, then lay an atom in the size gauge and press "Measure Atom".',
        'Count the rings on each card and compare the charge each outermost electron feels.',
        'Ask whether an outermost electron that feels the same charge but sits outside one more ring is nearer or farther.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction for the size of potassium first.' };
        const real = sizeNow(t.pieces.k) > sizeNow(t.pieces.na) ? 'larger' : sizeNow(t.pieces.k) < sizeNow(t.pieces.na) ? 'smaller' : 'equal';
        if (token === real) return { ok: true };
        if (t.prediction.tested) return { ok: false, msg: 'The gauge reads a different size for potassium than you predicted.' };
        return { ok: false, msg: 'Lay each atom in the size gauge, press "Measure Atom" and compare the two radii with your prediction.' };
      },
      reward: {
        log: 'One more ring, the same charge felt, a bigger atom.',
        title: 'Down a Group, Atoms Grow',
        body: 'Potassium\'s outer electron feels about the same effective nuclear charge as sodium\'s, but it sits outside one more full shell. Down a group every row of the table adds a shell, so atoms get bigger even as their nuclei grow stronger.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const st = stripFixture(STRIP, { x: 27, y: 18 });
    const sz = sizerFixture(SIZER, { x: 76, y: 15 });
    return {
      title: 'Plus, Minus and Neutral',
      briefing: {
        speaker: SPEAKER,
        body: 'You can now change the number of electrons on an atom. Press "Strip Electron" with an atom in the stripper to take one off, or lay "Add Electron" on an atom to put one on.'
      },
      prompt: 'Make a sodium ion and a chlorine ion, then order them with a sodium atom, smallest first.',
      widget,
      table: trendsTable({
        pieces: [
          atomCard('na1', 'SODIUM A', 'Na', rowAt(0)), atomCard('na2', 'SODIUM B', 'Na', rowAt(1)), atomCard('cl', 'CHLORINE', 'Cl', rowAt(2)),
          electronPiece('e', { x: 96, y: ROW_Y })
        ],
        fixtures: [st.fixture, sz.fixture],
        zones: { slots: [...st.slots, ...sz.slots], rail: railAt('Smallest size', 'Largest size') }
      }),
      hints: [
        'Press "Strip Electron" with a sodium atom in the stripper, and lay "Add Electron" on the chlorine card.',
        'Lay each of the three in the size gauge and compare the radii with the charge on each card.',
        'Put the smallest of the three at the left of the rail and the largest at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three on the rail.' };
        const states = order.map(id => `${sym(t, id)}${itemOf(t.pieces[id]).charge}`).sort().join();
        if (states !== ['Cl-1', 'Na0', 'Na1'].sort().join()) return { ok: false, msg: 'The rail should hold a sodium atom, a sodium ion and a chlorine ion: make each ion on its card first.' };
        const want = order.slice().sort((a, b) => sizeOfCard(t, a) - sizeOfCard(t, b));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Lay each of the three in the size gauge, read its radius, and order the three by those readings.' };
      },
      reward: {
        log: 'Strip one electron and the atom shrinks; add one and it swells.',
        title: 'Ionic Radius',
        body: 'A positive ion is much smaller than its atom, because losing the outer shell leaves the remaining electrons pulled in by the same nucleus. A negative ion is bigger, since an extra electron adds repulsion without any extra pull. These sizes are the ionic radius.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const st = stripFixture(STRIP, { x: 27, y: 18 });
    return {
      title: 'Three Costs',
      prompt: 'Order lithium, beryllium and boron by the energy it costs to strip one electron, cheapest first.',
      widget,
      table: trendsTable({
        pieces: row([['b', 'B'], ['li', 'Li'], ['be', 'Be']]),
        fixtures: [st.fixture],
        zones: { slots: st.slots, rail: railAt('Costs least', 'Costs most') }
      }),
      hints: [
        'Put an atom in the stripper and press "Strip Electron" to read what the first electron costs.',
        'Compare the three costs, and compare their order with the order of the atoms across the row.',
        'Put the atom with the smallest cost at the left of the rail and the largest at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three atoms on the rail.' };
        const want = order.slice().sort((a, b) => costOf(sym(t, a), 0) - costOf(sym(t, b), 0));
        if (order.join() === want.join()) return { ok: true };
        return { ok: false, msg: 'Strip each atom, read what the electron cost, and order the three by those readings: the order is not the order across the row.' };
      },
      reward: {
        log: 'Li 520, B 801, Be 899.',
        title: 'Ionization Energy',
        body: 'The energy it takes to strip the outermost electron from an atom is its ionization energy, and it generally rises across a period. Boron dips below beryllium because its outer electron is in a 2p row, which holds an electron less tightly than a 2s row does.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const st = stripFixture(STRIP, { x: 27, y: 18 });
    return {
      title: 'Magnesium\'s Three',
      prompt: 'Strip electrons from magnesium until the next one would cost many times more than the last.',
      widget,
      table: trendsTable({
        pieces: [atomCard('mg', 'MAGNESIUM', 'Mg', rowAt(0)), electronPiece('e', { x: 40, y: ROW_Y })],
        fixtures: [st.fixture],
        zones: { slots: st.slots }
      }, { recorder: { at: { x: 120, y: 30 }, size: { w: 30, h: 18 }, xLabel: 'Electrons stripped', yLabel: 'Cost', yUnit: 'kJ/mol' } }),
      hints: [
        'Put magnesium in the stripper and press "Strip Electron" again and again, reading each cost.',
        'Compare each cost with the one before it on the card and on the sheet, and look for a cost that jumps.',
        'Leave magnesium with the electrons it lost before the jump, and if it went past, take it out of the stripper and lay "Add Electron" on it.'
      ],
      check(state) {
        const t = state.table;
        const charge = t.pieces.mg.props.charge || 0;
        if (charge === 0) return { ok: false, notYet: true, msg: 'Strip an electron from magnesium.' };
        const jump = [0, 1, 2].find(n => MG_SUCCESSIVE[n + 1] / MG_SUCCESSIVE[n] > 4) + 1;
        if (charge === jump) return { ok: true };
        if (charge < jump) return { ok: false, msg: 'The next electron costs little more than the last: keep stripping and read the costs.' };
        return { ok: false, msg: 'An electron has come off at a cost many times the one before: the stripping went past the jump, so lay an electron back.' };
      },
      reward: {
        log: '738, 1451, then 7733.',
        title: 'Successive Ionization Energies',
        body: 'Each further electron costs more than the last, because it leaves an ion that already carries a charge, and the cost leaps when the next electron comes from a closed inner shell. Magnesium\'s successive ionization energies jump after the second, so it gives up exactly two electrons and forms Mg²⁺.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const sp = springFixture(SPRING, { x: 33, y: 19 }, { show: { between: true, feel: true }, feelWord: 'EFF. NUCLEAR CHARGE' });
    return {
      title: 'The Pull From Outside',
      prompt: 'Order Na, C, N, and F by their pulling strength on electrons, weakest first.',
      widget,
      table: trendsTable({
        pieces: row([['f', 'F'], ['na', 'Na'], ['n', 'N'], ['c', 'C']]),
        fixtures: [sp.fixture],
        zones: { slots: sp.slots, rail: railAt('Weakest pull', 'Strongest pull') }
      }),
      hints: [
        'Put an atom in the holder with the dial on its outermost electron and press "Tug Electron".',
        'An atom\'s pull on a pair it shares is the pull on its outermost electrons, so compare those four readings.',
        'Put the atom with the weakest outermost-electron pull at the left of the rail and the strongest at the right.'
      ],
      check(state) {
        const t = state.table;
        const order = railOf(t);
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all four atoms on the rail.' };
        const pull = id => pullOf(t.pieces[id], 'outer').pull;
        const want = order.slice().sort((a, b) => pull(a) - pull(b));
        if (order.join() === want.join()) return { ok: true };
        if (order.join() === want.slice().reverse().join()) return { ok: false, msg: 'That order runs the wrong way: the atom at the left end of the rail must pull weakest.' };
        return { ok: false, msg: 'Read the pull on each atom\'s outermost electron before you place it.' };
      },
      reward: {
        log: 'The outer pull climbs across the row and falls down a group.',
        title: 'Electronegativity and Electron Affinity',
        body: 'An atom\'s pull on a pair of electrons it shares is its electronegativity, and it rises across a period and falls down a group, just as the pull meter showed. Electron affinity, the energy released when an atom gains an electron, follows much the same trend.',
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
      body: 'One law explains the table: charge pulls, distance weakens the pull, and the electrons in between cancel some of the charge. Radius, ionization energy and electronegativity are that law measured three ways.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Nearly every property a chemist predicts about an element starts from where it sits on the table. You now know why.'
    },
    {
      heading: 'Next',
      body: 'That finishes the atoms of Lanternfall. The next world asks what happens when two of them come close enough to share what you have just measured.'
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
      { id: 'a', label: 'Sodium, because it has one fewer proton pulling on the same shell' },
      { id: 'b', label: 'Magnesium, because it has more electrons' },
      { id: 'c', label: 'They are the same size' },
      { id: 'd', label: 'Magnesium, because it is further down the table' }
    ],
    answer: 'a',
    explanation: 'Both have their outer electrons in the third shell, but magnesium has one more proton pulling on them, so its radius is smaller. Moving across a period atoms shrink.'
  },
  {
    question: 'Why is the first ionization energy of oxygen lower than that of nitrogen?',
    options: [
      { id: 'a', label: 'Oxygen\'s outer electron is the second in a 2p box, and the repulsion of its partner makes it easier to remove' },
      { id: 'b', label: 'Oxygen has fewer protons than nitrogen' },
      { id: 'c', label: 'Oxygen has a larger atomic radius than nitrogen' },
      { id: 'd', label: 'Oxygen has a full 2p row' }
    ],
    answer: 'a',
    explanation: 'Nitrogen\'s 2p electrons are all unpaired. In oxygen two electrons share one 2p box, and their repulsion makes one of them easier to remove, so oxygen dips below nitrogen.'
  },
  {
    question: 'The successive ionization energies of an element are 496, 4562 and 6910 kJ/mol. In which group is it?',
    options: [
      { id: 'a', label: 'Group 1, because the second ionization energy is enormously higher than the first' },
      { id: 'b', label: 'Group 2' },
      { id: 'c', label: 'Group 13' },
      { id: 'd', label: 'Group 17' }
    ],
    answer: 'a',
    explanation: 'A huge jump after the first electron means the second must come from a closed inner shell. An atom with one electron outside a closed shell is in Group 1.'
  },
  {
    question: 'How does the radius of a sodium ion, Na⁺, compare with that of a sodium atom?',
    options: [
      { id: 'a', label: 'It is smaller, because the outer shell has been lost' },
      { id: 'b', label: 'It is larger, because it has a positive charge' },
      { id: 'c', label: 'It is the same' },
      { id: 'd', label: 'It cannot be compared' }
    ],
    answer: 'a',
    explanation: 'Sodium loses its single 3s electron to form Na⁺, leaving the compact second shell, and the same nucleus now holds fewer electrons more tightly.'
  },
  {
    question: 'Which of these elements has the highest electronegativity?',
    options: [
      { id: 'a', label: 'Fluorine' },
      { id: 'b', label: 'Oxygen' },
      { id: 'c', label: 'Chlorine' },
      { id: 'd', label: 'Sodium' }
    ],
    answer: 'a',
    explanation: 'Electronegativity rises across a period and falls down a group. Fluorine is furthest right and highest of those listed, at 3.98 on the Pauling scale.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions, by drag
   and by two taps. Atoms are laid in holders and read, electrons stripped and added, cards put in trays and on the rail. Nothing here says what
   a pull, a size or a cost is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const tug = id => [put(id, SPRING_SLOT), { run: SPRING }];
const strip = (id, times = 1) => [put(id, STRIP_SLOT), ...Array.from({ length: times }, () => ({ run: STRIP }))];
const size = id => [put(id, SIZER_SLOT)];

export const SOLUTIONS = [
  [dial(SPRING, 'which', 2), ...tug('li'), ...tug('na'), ...tug('be'), ...tug('mg'), put('mg', 'tray:hard')],
  [...['li', 'na', 'be', 'mg'].flatMap(id => [put(id, SPRING_SLOT)]), put('li', 'tray:one'), put('na', 'tray:one'), put('be', 'tray:two'), put('mg', 'tray:two')],
  [...['li', 'be', 'b', 'c'].flatMap(size), put('li', 'rail:0'), put('be', 'rail:1'), put('b', 'rail:2'), put('c', 'rail:3')],
  [{ predict: 'larger' }, ...size('na'), { run: SIZER }, ...size('k'), { run: SIZER }],
  [...strip('na2'), { join: ['e', 'cl'] }, put('na2', 'rail:0'), put('cl', 'rail:1'), put('na1', 'rail:2')],
  [...strip('li'), ...strip('be'), ...strip('b'), put('li', 'rail:0'), put('b', 'rail:1'), put('be', 'rail:2')],
  [...strip('mg', 2)],
  [...tug('na'), ...tug('c'), ...tug('n'), ...tug('f'), put('na', 'rail:0'), put('c', 'rail:1'), put('n', 'rail:2'), put('f', 'rail:3')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial(SPRING, 'which', 2), ...tug('na'), put('na', 'tray:hard')],
  [put('li', 'tray:two'), put('na', 'tray:two'), put('be', 'tray:one'), put('mg', 'tray:one')],
  [put('c', 'rail:0'), put('b', 'rail:1'), put('be', 'rail:2'), put('li', 'rail:3')],
  [{ predict: 'smaller' }, ...size('na'), { run: SIZER }, ...size('k'), { run: SIZER }],
  [...strip('na2'), { join: ['e', 'cl'] }, put('na2', 'rail:0'), put('na1', 'rail:1'), put('cl', 'rail:2')],
  [...strip('li'), ...strip('be'), ...strip('b'), put('li', 'rail:0'), put('be', 'rail:1'), put('b', 'rail:2')],
  [...strip('mg', 3)],
  [...tug('f'), ...tug('n'), ...tug('c'), ...tug('na'), put('f', 'rail:0'), put('n', 'rail:1'), put('c', 'rail:2'), put('na', 'rail:3')]
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

const kjmol = n => `${n} kJ/mol`;

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { springRead, sizeRead, stripRead, pullOf, hardestPull, feelsOf, costOf, itemOf, sizeNow, planPull, shellsOf, outerShell, zOf, kjmol };
