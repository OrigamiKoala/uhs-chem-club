/**
 * q4-dots.js — Ligar, bench four: LEWIS STRUCTURES.
 *
 * REBUILT 2026-11-21 (`docs/feedback-11-21.md`). The old bench was practice for a student who already knew Lewis structures: it
 * asked for a count of valence electrons nobody had taught, pinned water's atoms in a triangle, and never said what a lone pair is.
 * This one teaches from the shell picture up, one idea per stage, and only then builds molecules (the old file is in
 * `archive/2026-11-21/q4-dots-before-rework/`).
 *
 *   1  count oxygen's outer-shell electrons off its shell picture                  -> valence electrons
 *   2  read sulfur's count off its column, with four open atoms beside it          -> the column gives the count
 *   3  add up what water's three atoms bring                                         -> a molecule pools them
 *   4  build water on the board: bond by dragging atoms together, then lone pairs   -> bond, lone pair, Lewis structure, octet
 *   5  PREDICT: how many pairs join carbon to each oxygen in carbon dioxide?          (no instrument; the single-bond idea is a card)
 *   6  build carbon dioxide                                                           -> double bonds
 *   7  build HOF with the atoms loose: which atom can bond to both others?            -> central atom
 *   8  boron trifluoride, where boron's ring stays amber                              -> incomplete octet
 *   9  sulfur tetrafluoride, where sulfur ends with ten                               -> expanded octet
 *  10  nitric oxide, eleven electrons and one left on its own                         -> free radical
 *
 * THE BOARD (`kits/atoms.js`, the LOOSE slate). A molecule's atoms start apart in a row. Dragging one atom onto another shares an
 * electron pair between them (a bond, drawn as a thick line); an Electron pair dropped on an atom stays there (a lone pair, two dots);
 * dropped on a bond it shares one more pair; Remove takes one back. After every move the atoms arrange themselves round the bonds and
 * lone pairs they now hold (`lewis.js` `poseDrawing`), so the drawing is never a fixed triangle. Each atom prints the electrons in its
 * outer shell against a full one and lights its ring when full; nothing is arranged FOR the player. The reading is `planLewis`
 * (`slateOf`): the picture and the grade are one function. `SOLUTIONS` and `MISSES` are scripts of the player's own moves, replayed
 * by `verify:table` by drag and by two taps.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { atomTable, slateOf, looseSlateParts } from '../../table/kits/atoms.js';
import { MOLECULES, DRAWINGS, planLewis, allLit, trayFor } from '../../engine/lewis.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 10 };

export const VOCABULARY = [
  { term: /\bincomplete octets?\b/i, introducedAt: 8 },
  { term: /\bexpanded octets?\b/i, introducedAt: 9 },
  { term: /\bfree radicals?\b/i, introducedAt: 10 },
  { term: /\bcentral atoms?\b/i, introducedAt: 7 },
  { term: /\blewis structures?\b/i, introducedAt: 4 },
  { term: /\blone pairs?\b/i, introducedAt: 4 },
  { term: /\boctets?\b/i, introducedAt: 4 },
  { term: /\bvalence electrons?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q1-joins', 'unit03/q3-distance', 'unit01/q2-core'];

const SPEAKER = 'Vess';

/** The legend lines. The board's pieces are dragged, not pressed. Kept so the quest contract (`toolNoteFor`) holds. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE COUNTING TABLES (stages 1-3)
   Atoms shown as their shells (the `specimen` pieces Tallow used): the small ring is the inner shell, the
   big one the outer shell. The answer is set on a dial; nothing on these tables can be built.
   ------------------------------------------------------------------ */

/** An atom drawn as its shells: `rings` from the inside out. */
const shells = (id, label, x, y, r, p, n, rings, extra = {}) => ({ id, kind: 'specimen', label, at: { x, y }, r, fixed: true, props: { p, n, rings, ...extra } });
const OXYGEN = (id, label, x, y, r) => shells(id, label, x, y, r, 8, 8, [2, 6]);
const HYDROGEN = (id, label, x, y, r) => shells(id, label, x, y, r, 1, 0, [1]);

/** The answer dial. */
const dial = (label, dialLabel, at) => ({
  id: 'count', kind: 'tally', label, at, size: { w: 44, h: 16 }, noRun: true,
  dials: { count: { min: 0, max: 12, step: 1, value: 0, label: dialLabel } }
});

/** A counting stage's check: the dial against the right count. */
function countCheck(right, wrongMsg) {
  return state => {
    const v = state.table.fixtures.count.dials.count.value;
    if (!v) return { ok: false, notYet: true, msg: 'Turn the dial to a number of electrons.' };
    if (v === right) return { ok: true };
    return { ok: false, msg: wrongMsg };
  };
}

/* ------------------------------------------------------------------
   THE BOARD TABLES (stages 4, 6-10)
   The electron pieces in a column down the left, the board across the rest of the table and its full depth, so even a
   five-atom molecule is drawn large.
   ------------------------------------------------------------------ */

const CAPTION = { pairs: 'Two electrons', lift: 'Takes one back', single: 'One electron' };
const LABEL = { pairs: 'Electron pair', lift: 'Remove', single: 'Single' };
const tile = (kind, y) => ({ id: kind, kind, label: LABEL[kind], at: { x: 10, y }, caption: CAPTION[kind] });
const BOARD = { x0: 22, y0: 2, x1: 118, y1: 62 };
/** The atoms' radius and the bond length the board draws when there is room. */
const ATOM_R = 5.4;
const BOND = 20;

/** One stage's board: the molecule's atoms loose on it, and the electron pieces above it. */
function boardTable(molKey, { single = false, r = ATOM_R, bond = BOND } = {}) {
  const part = looseSlateParts('a', molKey, BOARD, { r, bond });
  const pieces = single ? [tile('pairs', 12), tile('single', 30), tile('lift', 48)] : [tile('pairs', 18), tile('lift', 40)];
  return atomTable({ opts: { words: 'shells', slate: true }, layout: 'as-drawn', pieces: [...pieces, ...part.pieces], fixtures: [part.fixture] });
}

/** Every atom's ring lit and no electron left over (boron's amber and sulfur's ten count as lit). */
function litCheck(state) {
  const sl = slateOf(state.table, 'a');
  if (sl.used === 0) return { ok: false, notYet: true, msg: 'Drag one atom onto another to start.' };
  if (allLit(sl.read)) return { ok: true };
  if (sl.read.atoms.some(a => a.lamp === 'over')) return { ok: false, msg: 'An atom has more electrons in its outer shell than it can hold.' };
  if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and an atom\'s ring is still dark.' };
  return { ok: false, msg: 'Every electron is placed, and an atom\'s ring is still dark: read the number on that atom.' };
}

/* ------------------------------------------------------------------
   THE TEN STAGES
   ------------------------------------------------------------------ */

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q4-dots';
const GUESSES = [
  ['one', 'one pair joins each oxygen', ['One pair', 'joins each oxygen', 'to the carbon']],
  ['two', 'two pairs join each oxygen', ['Two pairs', 'join each oxygen', 'to the carbon']],
  ['three', 'three pairs join each oxygen', ['Three pairs', 'join each oxygen', 'to the carbon']]
];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Outer Shell',
    briefing: {
      speaker: SPEAKER,
      body: 'An atom\'s electrons sit in shells around its nucleus, and only the electrons in the outermost shell take part in bonding. Here the small ring is oxygen\'s inner shell and the large ring is its outer shell.'
    },
    prompt: 'How many electrons does an oxygen atom have in its outer shell?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      layout: 'as-drawn',
      pieces: [OXYGEN('o', 'Oxygen', 36, 33, 16)],
      fixtures: [dial('Outer shell', 'Electrons', { x: 88, y: 33 })]
    }),
    hints: [
      'Look at the larger of the two rings around the oxygen atom.',
      'Count only the dots on the large outer ring, not the small inner ring.',
      'The inner shell is full and never takes part in bonding, so its two electrons are not part of the answer.'
    ],
    check: countCheck(6, 'That is not the number of dots on the outer ring.'),
    reward: {
      log: 'Oxygen: six in its outer shell.',
      title: 'Valence Electrons',
      body: 'Oxygen has 6 electrons in its outer shell. These are its valence electrons, the only ones used in bonding.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Read the Column',
    briefing: {
      speaker: SPEAKER,
      body: 'The periodic table\'s columns are numbered 1 to 18, and atoms in the same column have the same number of valence electrons. Sulfur\'s shells are covered, but its column is printed.'
    },
    prompt: 'How many valence electrons does a sulfur atom have?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      layout: 'as-drawn',
      pieces: [
        // Laid out as the periodic table lays them: one row, and sulfur under oxygen in its column.
        shells('c', 'Carbon, column 14', 30, 16, 9, 6, 6, [2, 4]),
        shells('n', 'Nitrogen, column 15', 54, 16, 9, 7, 7, [2, 5]),
        OXYGEN('o', 'Oxygen, column 16', 78, 16, 9),
        shells('f', 'Fluorine, column 17', 102, 16, 9, 9, 10, [2, 7]),
        shells('s', 'Sulfur, column 16', 78, 44, 9, 16, 16, [2, 8, 6], { casing: true })
      ],
      fixtures: [dial('Sulfur', 'Valence electrons', { x: 32, y: 46 })]
    }),
    hints: [
      'Read the column number under each atom, and count the outer-ring dots on each visible atom.',
      'Compare sulfur\'s column number with the four visible atoms.',
      'Atoms in the same column have the same number of valence electrons, so find the atom in sulfur\'s column.'
    ],
    check: countCheck(6, 'That is not the count of the visible atom in sulfur\'s column.'),
    reward: {
      log: 'Sulfur: six, like oxygen above it.',
      title: 'Same Column, Same Count',
      body: 'Sulfur is in oxygen\'s column, so it has 6 valence electrons too. Each column to the right adds one more: carbon 4, nitrogen 5, fluorine 7.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Water\'s Electrons',
    briefing: {
      speaker: SPEAKER,
      body: 'When atoms bond into a molecule, all of their valence electrons go into one shared pool. A drawing of the molecule must place every one of them.'
    },
    prompt: 'How many total valence electrons do water\'s three atoms have?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      layout: 'as-drawn',
      pieces: [OXYGEN('o', 'Oxygen', 32, 25, 13), HYDROGEN('h1', 'Hydrogen', 64, 25, 10), HYDROGEN('h2', 'Hydrogen', 90, 25, 10)],
      fixtures: [dial('Water', 'Valence electrons', { x: 60, y: 52 })]
    }),
    hints: [
      'Count the outer-ring electrons on each of the three atoms.',
      'Compare how many valence electrons each hydrogen brings with how many oxygen brings.',
      'Add the outer-ring electrons from all three atoms together.'
    ],
    check: countCheck(trayFor(MOLECULES.H2O), 'That is not the sum of the three outer rings.'),
    reward: {
      log: 'Two hydrogens at 1 and an oxygen at 6.',
      title: 'Eight to Place',
      body: 'One from each hydrogen and six from oxygen gives water 8 valence electrons to place.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Bonds and Lone Pairs',
    briefing: {
      speaker: SPEAKER,
      body: 'In a Lewis structure, every electron pair is either shared between two atoms (a bond, drawn as a line) or kept by one atom (a lone pair, drawn as two dots). Each atom ends with a full outer shell: 8 electrons, or 2 for hydrogen.',
      parts: [
        { title: 'Lewis Structure', body: 'A Lewis structure shows where every valence electron in a molecule sits. Electrons are placed in pairs.' },
        { title: 'Bonds', body: 'A pair shared between two atoms is a bond, drawn as a line. It counts toward both atoms\' outer shells.' },
        { title: 'Lone Pairs', body: 'A pair kept by one atom is a lone pair, drawn as two dots. It counts only toward that atom\'s outer shell.' },
        { title: 'Full Shells', body: 'The number on each atom counts all electrons in its outer shell (shared and lone). A shell is full at 8 (or 2 for hydrogen), and its ring lights up.' }
      ]
    },
    prompt: 'How are water\'s 8 valence electrons arranged so every atom has a full outer shell?',
    widget: { type: 'table', label: 'The bench' },
    table: boardTable('H2O'),
    hints: [
      'Drag each hydrogen onto the oxygen, then check the electron count on every atom.',
      'Compare oxygen\'s count with 8 once both hydrogens are bonded, and see how many electrons are left.',
      'A lone pair counts only for the atom it sits on, and both hydrogens are already full, so place the leftover pairs on oxygen.'
    ],
    check: litCheck,
    reward: {
      log: 'Two bonds and two lone pairs.',
      title: 'Water\'s Lewis Structure',
      body: 'Two bonds join the hydrogens to oxygen, and two lone pairs stay on oxygen. Oxygen has 8 electrons (an octet) and each hydrogen has 2: this is water\'s Lewis structure.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  predictStage({
    key: QUEST_KEY,
    title: 'Carbon Dioxide',
    briefing: {
      speaker: SPEAKER,
      body: 'The gas from the crack is carbon dioxide: one carbon atom and two oxygen atoms. Carbon brings 4 valence electrons and each oxygen brings 6, giving 16 electrons to place.'
    },
    prompt: 'How many electron pairs does carbon share with each oxygen in carbon dioxide?',
    cards: GUESSES,
    hints: [
      'Drag one of the three prediction cards into the slot.',
      'Water needed one shared pair per hydrogen; think about how carbon can reach 8 electrons.',
      'Predictions are never graded, so pick the card you think is most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage builds carbon dioxide from its 16 valence electrons.'
    }
  }),

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'More Than One Pair',
    briefing: {
      speaker: SPEAKER,
      body: 'Two atoms can share more than one electron pair. Drag an atom onto one it is already bonded to, or drag an Electron pair onto the bond, to share another pair.'
    },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'how are carbon dioxide\'s 16 valence electrons arranged?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: boardTable('CO2'),
    hints: [
      'Bond each oxygen to carbon once, fill each oxygen with lone pairs, then check carbon\'s count.',
      'Compare carbon\'s count with 8 when no electrons are left, and look at the lone pairs on each oxygen.',
      'A shared pair counts for both atoms while a lone pair counts for one, so sharing an oxygen lone pair gives carbon more electrons without taking any from oxygen.'
    ],
    check: litCheck,
    get reward() {
      return {
        log: 'Each oxygen shares two pairs.',
        title: 'Double Bonds',
        body: `${verdictLine(QUEST_KEY, 'two')}With one bond to each oxygen, carbon has only 4 electrons. Each oxygen shares a second pair instead of keeping it, giving every atom 8: two double bonds.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'The Middle',
    briefing: {
      speaker: SPEAKER,
      body: 'HOF has one hydrogen, one oxygen, and one fluorine atom. Hydrogen and fluorine can each form only one bond.'
    },
    prompt: 'Which atom in HOF bonds to both of the others?',
    widget: { type: 'table', label: 'The bench' },
    table: boardTable('HOF'),
    hints: [
      'Try bonding a pair of atoms and notice which atoms will not accept a second bond.',
      'Compare how many electrons each atom needs to reach a full outer shell.',
      'Each bond adds 1 electron to an atom\'s count, so an atom that is only 1 electron short can form just one bond.'
    ],
    check: litCheck,
    reward: {
      log: 'Oxygen joins the other two.',
      title: 'Central Atom',
      body: 'Hydrogen and fluorine each form one bond. Oxygen needs two electrons and forms two bonds, so it sits in the middle as the central atom.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Fewer Than Eight',
    briefing: {
      speaker: SPEAKER,
      body: 'Boron is in column 13 (3 valence electrons) and each fluorine brings 7. Fluorine pulls strongly on electrons and only ever forms single bonds.'
    },
    prompt: 'How are the 24 valence electrons of BF₃ arranged?',
    widget: { type: 'table', label: 'The bench' },
    table: boardTable('BF3'),
    hints: [
      'Bond each fluorine to boron and fill each fluorine\'s outer shell; boron\'s ring turns amber when it stops short of 8.',
      'Compare how many electrons the three fluorines use with the 24 total valence electrons.',
      'Fluorine will not share a second pair, so check whether any electrons are left for boron.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Drag one atom onto another to start.' };
      const lamps = sl.read.atoms.map(a => a.lamp);
      if (lamps.includes('over')) return { ok: false, msg: 'An atom has more electrons in its outer shell than it can hold.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      if (sl.read.atoms.slice(1).some(a => a.lamp !== 'full')) return { ok: false, msg: 'Every electron is placed, and a fluorine atom\'s ring is still dark.' };
      if (lamps[0] === 'amber') return { ok: true };
      return { ok: false, msg: 'Every electron is placed, and boron is not bonded to all three fluorine atoms.' };
    },
    reward: {
      log: 'Boron stops at six.',
      title: 'Incomplete Octet',
      body: 'Every fluorine has 8 electrons while boron stops at 6: an incomplete octet. Boron is one of the few atoms that bond this way.'
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    title: 'More Than Eight',
    briefing: {
      speaker: SPEAKER,
      body: 'Sulfur is in row 3 of the periodic table, while fluorine is in row 2. Atoms from row 3 and below can hold more than 8 electrons in their outer shell.'
    },
    prompt: 'Where do the leftover electrons go once every fluorine in SF₄ has a full shell?',
    widget: { type: 'table', label: 'The bench' },
    table: boardTable('SF4', { r: 5 }),
    hints: [
      'Bond all four fluorines to sulfur, fill every fluorine, and see how many electrons remain.',
      'Check sulfur\'s count against 8 once the last pair is placed.',
      'Fluorine never holds more than 8 electrons or forms double bonds, so only sulfur can take the extra pair.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Drag one atom onto another to start.' };
      const atoms = sl.read.atoms;
      if (atoms.some(a => a.lamp === 'over')) return { ok: false, msg: 'An atom has more electrons in its outer shell than it can hold.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      if (atoms.slice(1).some(a => a.lamp !== 'full')) return { ok: false, msg: 'Every electron is placed, and a fluorine atom\'s ring is still dark.' };
      if (atoms[0].lamp === 'expanded') return { ok: true };
      return { ok: false, msg: 'Every electron is placed, and sulfur is not bonded to all four fluorine atoms.' };
    },
    reward: {
      log: 'Sulfur holds ten.',
      title: 'Expanded Octet',
      body: 'The leftover pair becomes a lone pair on sulfur, giving it 10 electrons: an expanded octet. Only atoms from row 3 and below can hold more than 8.'
    }
  },

  /* ---------------------------------------------------------------- 10 */
  {
    title: 'One Left Over',
    briefing: {
      speaker: SPEAKER,
      body: 'Nitric oxide, NO, has 5 + 6 = 11 valence electrons, an odd number, so one electron cannot be paired. Use the Single piece to place one unpaired electron.'
    },
    prompt: 'Where does nitric oxide\'s odd electron go?',
    widget: { type: 'table', label: 'The bench' },
    table: boardTable('NO', { single: true }),
    hints: [
      'Bond the two atoms, fill oxygen first, and check the count on nitrogen.',
      'Compare the electron count around each atom with 8 once all 11 electrons are placed.',
      'Oxygen is more electronegative than nitrogen, so think about which atom keeps a full 8 and which is left with 7.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Drag one atom onto another to start.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      const [n, o] = sl.read.atoms;
      if (o.lamp !== 'full') return { ok: false, msg: 'Every electron is placed, and oxygen does not have 8.' };
      if (n.around === 7 && n.dots === 1) return { ok: true };
      return { ok: false, msg: 'Every electron is placed, and nitrogen does not have 7 with one unpaired electron.' };
    },
    reward: {
      log: 'One electron stays on its own.',
      title: 'Free Radical',
      body: 'The odd electron sits alone on nitrogen, which holds 7. A molecule with an unpaired electron is a free radical, and it reacts readily.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF — one idea per card
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    { heading: 'Count', body: 'Valence electrons are the outer-shell electrons. Add up every atom\'s count to get the molecule\'s.' },
    { heading: 'Place', body: 'Each pair is a bond between two atoms or a lone pair on one. Most atoms end with 8, hydrogen with 2.' },
    { heading: 'Share More', body: 'When single bonds leave an atom short, neighbors share a second or third pair.' },
    { heading: 'The Gas', body: 'Carbon dioxide is O=C=O: two double bonds, and every atom has 8.' },
    { heading: 'Exceptions', body: 'Boron can stop at 6, sulfur can hold more than 8, and an odd count leaves one electron alone.' }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN MOVES
   `bond(a, b)` drags atom a onto atom b (one shared pair); `deal(target, n, tool)` drops an electron piece on an
   atom (`a<i>`) or a bond (`aj<i><j>`). `verify:table` replays each by direct actions, by drag and by two taps.
   ------------------------------------------------------------------ */

const bond = (a, b, n = 1) => Array.from({ length: n }, () => ({ join: [`a${a}`, `a${b}`] }));
const deal = (target, n = 1, tool = 'pairs') => Array.from({ length: n }, () => ({ join: [tool, target] }));
const dialTo = v => [{ setDial: { fixture: 'count', dial: 'count', value: v } }];
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The moves that solve each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  dialTo(6),
  dialTo(6),
  dialTo(8),
  [...bond(1, 0), ...bond(2, 0), ...deal('a0', 2)],
  [guess('two')],
  [...bond(0, 1), ...bond(2, 1), ...bond(0, 1), ...deal('aj12'), ...deal('a0', 2), ...deal('a2', 2)],
  [...bond(0, 1), ...bond(2, 1), ...deal('a1', 2), ...deal('a2', 3)],
  [...bond(1, 0), ...bond(2, 0), ...bond(3, 0), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3)],
  [...bond(1, 0), ...bond(2, 0), ...bond(3, 0), ...bond(4, 0), ...deal('a0'), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3), ...deal('a4', 3)],
  [...bond(0, 1, 2), ...deal('a0'), ...deal('a0', 1, 'single'), ...deal('a1', 2)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  dialTo(8),
  dialTo(4),
  dialTo(7),
  [...bond(1, 0), ...bond(2, 0)],
  [],
  [...bond(0, 1), ...bond(2, 1), ...deal('a0', 3), ...deal('a2', 3)],
  [...bond(0, 2), ...deal('a1', 3), ...deal('a2', 3)],
  [...bond(1, 0), ...bond(2, 0), ...deal('a1', 2), ...deal('a2', 2), ...deal('a3', 2)],
  [...bond(1, 0), ...bond(2, 0), ...bond(3, 0), ...bond(4, 0), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3), ...deal('a4', 3)],
  [...bond(0, 1, 3), ...deal('a0'), ...deal('a1')]
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

export { trayFor, MOLECULES, DRAWINGS, planLewis };
