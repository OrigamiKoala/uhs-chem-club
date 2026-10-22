/**
 * q4-dots.js — Ligar, bench four: LEWIS STRUCTURES.
 *
 * The pair slate, and the second TABLETOP on the second world (plan `bench-tabletop.md`, phase
 * T1b). A slate holds a molecule's atoms, fixed where the molecule puts them, with a joint at every
 * place a pair could go between two of them; a tray holds exactly the electrons the molecule has.
 * The player deals electrons from the tray by hand: a pair dropped on a joint shares itself between
 * the two atoms beside it, a pair dropped on an atom stays on that atom, and "Lift Out" takes one
 * back. Every atom carries a lamp that lights when eight stand round it (two for hydrogen). The
 * slate reads and never lectures: it has one rule, that a hydrogen or fluorine atom shares one pair
 * and no more. Nothing arranges an electron for the player, and the lamps only report.
 *
 *   1  place all of water's electrons so every lamp is lit       -> Lewis structure, lone pair, octet
 *   2  place the electrons of three molecules                    -> (valence electrons set the count)
 *   3  carbon dioxide, where single bonds leave two lamps dark   -> (multiple bonds share more)
 *   4  build HOF: the player fills the skeleton                  -> central atom
 *   5  the ammonium ion, where the tray has to change            -> polyatomic ion
 *   6  boron trifluoride, where boron's lamp stays amber         -> incomplete octet
 *   7  nitric oxide, with an odd number of electrons             -> free radical
 *   8  SF6, where sulfur goes past eight                         -> expanded octet
 *
 * Stage 4 is HOF, not HCN: on this board hydrogen and fluorine take one pair only, so the oxygen
 * between them is the one atom that can join them, which is something the player can FIND. The
 * slate offers a joint between every two atoms (a triangle) and the drawing is graded on which of
 * them the player filled. (HCN has an isomer, HNC, that lights every lamp as well, so the lamps
 * alone could not settle which atom sits in the middle.)
 *
 * THE TABLE (`table/`, `kits/atoms.js`, the Lewis slate). The dealing is `lewis.js` `addBond` /
 * `addLone` / `addDot` / `removeOne`, the reading is `planLewis`, and `lewisOf`-style readings are
 * `slateOf`: the picture and the grade are one function. `SOLUTIONS` and `MISSES` are scripts of the
 * player's own deals, replayed by `verify:table` by drag and by two taps. `boss-warden` still plays
 * the pair board (`pairboard.js`), which this quest no longer uses.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { atomTable, slateOf, slateParts, slateLayout } from '../../table/kits/atoms.js';
import { MOLECULES, DRAWINGS, planLewis, allLit, trayFor } from '../../engine/lewis.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bincomplete octets?\b/i, introducedAt: 6 },
  { term: /\bexpanded octets?\b/i, introducedAt: 8 },
  { term: /\bfree radicals?\b/i, introducedAt: 7 },
  { term: /\bpolyatomic ions?\b/i, introducedAt: 5 },
  { term: /\bcentral atoms?\b/i, introducedAt: 4 },
  { term: /\blewis structures?\b/i, introducedAt: 1 },
  { term: /\blone pairs?\b/i, introducedAt: 1 },
  { term: /\boctets?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q1-joins', 'unit03/q3-distance', 'unit01/q2-core'];

const SPEAKER = 'Vess';

/**
 * The legend lines. A piece whose label says what it does owes nothing, and the tray's pieces are
 * dragged, not pressed. Kept so the quest contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   One layout, so the furniture is always where the hand expects it (120 x 64 units): the tray's
   pieces and the charge chip down the left, the slate on the right, the scratch corner bottom
   left. A slate's atoms and joints are fixed (they are targets, never grabbed); the tray's pieces
   are the only things that move.
   ------------------------------------------------------------------ */

const OPTS = { words: 'shells', slate: true };

/** What each tool does, printed under the place it hangs. */
const CAPTION = { pairs: 'Adds a pair', lift: 'Takes one back', single: 'Adds one' };
const tile = (kind, label, [x, y]) => ({ id: kind, kind, label, at: { x, y }, caption: CAPTION[kind] });
const TILES = { pairs: [10, 10], lift: [32, 10], single: [54, 10] };

/**
 * One stage's table: its slates (`[id, molecule, cx, cy, size, pos?, chip?]`), the tray's pieces (`tiles`
 * moves them when a stage needs the left for a slate) and any extra fixtures.
 */
function slateTable(slates, { single = false, fixtures = [], tiles = TILES } = {}) {
  const pieces = [tile('pairs', 'Pair', tiles.pairs), tile('lift', 'Lift Out', tiles.lift), ...(single ? [tile('single', 'Single', tiles.single)] : [])];
  const boards = [];
  for (const [id, mol, cx, cy, size, pos, chip] of slates) {
    const part = slateParts(id, mol, slateLayout(mol, cx, cy, size, pos), { chip });
    pieces.push(...part.pieces);
    boards.push(part.fixture);
  }
  return atomTable({ opts: OPTS, pieces, fixtures: [...boards, ...fixtures] });
}

/** HOF laid out with no atom at the head of anything: the hydrogen on top, oxygen and fluorine below. */
const HOF_POS = [[0.5, 0.22], [0.2, 0.78], [0.8, 0.78]];

/** Ammonia with its hydrogens spread wide, so the three joints stand well apart. */
const NH3_POS = [[0.5, 0.2], [0.1, 0.78], [0.5, 0.86], [0.9, 0.78]];

/** Methane with its hydrogens at the corners, so the four joints fit a small plate. */
const CH4_POS = [[0.5, 0.5], [0.1, 0.15], [0.9, 0.15], [0.1, 0.85], [0.9, 0.85]];

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Water\'s Electrons',
    briefing: {
      speaker: SPEAKER,
      body: 'Drag the Pair tile onto the gap between two atoms to share a pair, or onto one atom to leave it there; a ring lights round an atom when enough electrons stand round it. Press Submit when the table shows your answer.'
    },
    prompt: 'Place all valence electrons on the slate so that every atom satisfies the octet rule.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'H2O', 82, 28, 62]]),
    hints: [
      'Drag the Pair tile onto the gap between two atoms, or onto one atom.',
      'Compare each atom\'s count with its lamp: hydrogen wants two and the others eight.',
      'Fill the gaps between atoms first, then put whatever electrons are left onto the atom whose lamp is still dark.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed but a lamp is still dark. Look at which atom has too few round it and which has too many.' };
    },
    reward: {
      log: 'Every electron placed, every lamp lit.',
      title: 'Lewis Structure',
      body: 'A drawing that puts every valence — outer-shell — electron in a bond or on an atom is a Lewis structure. Pairs on one atom are lone pairs, and each atom is content with eight round it, two for hydrogen: the octet rule.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Is Left Over',
    prompt: 'Place the electrons of ammonia, methane and hydrogen fluoride so that every lamp is lit.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'NH3', 26, 22.5, 37, NH3_POS], ['b', 'CH4', 98, 24, 29, CH4_POS], ['c', 'HF', 64, 12, 38]], { tiles: { pairs: [64, 28], lift: [64, 47] } }),
    hints: [
      'Draw each molecule on its own plate until every lamp is lit.',
      'Compare how many electrons are left on each plate once its bonds are filled, and where they end up.',
      'Count what the atom brings, take away the electrons its bonds use, and what remains sits on it as pairs.'
    ],
    check(state) {
      const plates = ['a', 'b', 'c'].map(id => slateOf(state.table, id));
      if (plates.every(p => p.used === 0)) return { ok: false, notYet: true, msg: 'Place the electrons on the slates.' };
      if (plates.every(p => allLit(p.read))) return { ok: true };
      if (plates.some(p => p.used === 0)) return { ok: false, notYet: true, msg: 'A plate has no electrons on it yet.' };
      return { ok: false, msg: 'A lamp is still dark on one of the plates. Check the electrons left on each one, and the count on each atom.' };
    },
    reward: {
      log: 'Valence electrons set the count.',
      title: 'What Is Left Over',
      body: 'An atom keeps as lone pairs the electrons its bonds do not use. Carbon uses all four of its own in bonds, nitrogen leaves one pair over, and fluorine leaves three.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Pairs Short',
    prompt: 'Place all valence electrons for carbon dioxide so that every atom satisfies the octet rule.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO2', 80, 28, 68]]),
    hints: [
      'Put a pair in each gap first and see which lamps stay dark.',
      'Compare the lamp on carbon with the lamps on the oxygen atoms once their own pairs are down.',
      'Where an atom is short, lift a pair off its neighbour with "Lift Out" and put it in the gap between them.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed but a lamp is still dark. An atom with a pair to spare could share it.' };
    },
    reward: {
      log: 'Neighbours share a second pair.',
      title: 'Multiple Bonds Share More',
      body: 'When single bonds leave an atom short, the atoms beside it can share a second pair between them. Carbon dioxide ends with a double bond on each side of the carbon.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Middle',
    prompt: 'Build hypofluorous acid, HOF, so that every lamp is lit and no electron is left.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'HOF', 82, 32, 62, HOF_POS]]),
    hints: [
      'Try filling the gaps between each pair of atoms and see which lamps light.',
      'Compare how many shared pairs each atom is allowed to take on this board.',
      'The atom the others attach to must be allowed more than a single shared pair.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed but a lamp is still dark. Try the pairs in a different set of gaps: an atom with room for one shared pair only cannot join the other two.' };
    },
    reward: {
      log: 'The atom that joins the others.',
      title: 'Central Atom',
      body: 'The atom in the middle, which the others attach to, is the central atom. An atom that can share only one pair, like hydrogen or fluorine, can never be it.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'One Electron Fewer',
    briefing: {
      speaker: SPEAKER,
      body: 'You can now change how many electrons there are to place: turn the charge chip to take electrons away or add them.'
    },
    prompt: 'Set the charge chip and place all valence electrons for the ammonium ion until every lamp lights.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'NH4', 82, 34, 62, null, 'chip']], {
      fixtures: [{
        id: 'chip', kind: 'chip', label: 'Ion charge', at: { x: 27, y: 32 }, size: { w: 34, h: 16 }, noRun: true,
        dials: { charge: { min: -2, max: 2, step: 1, value: 0, label: 'Charge', labels: ['−2', '−1', '0', '+1', '+2'] } }
      }]
    }),
    hints: [
      'Try the drawing with the charge chip as it is and see what is left over.',
      'Compare the number of electrons to place with the number the lamps need.',
      'Turn the charge chip until the electrons to place match what the lamps need.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read) && sl.charge === 1) return { ok: true };
      if (sl.total % 2 === 1) return { ok: false, msg: 'There is an odd number of electrons, and a pair cannot be made from a single one left over.' };
      if (sl.charge !== 1) return { ok: false, msg: 'The lamps can be lit, but this is not the number of electrons the ion has: the charge sets how many it keeps.' };
      return { ok: false, msg: 'Electrons are still left to place, or a lamp is still dark.' };
    },
    reward: {
      log: 'The electron count changes with the charge.',
      title: 'Polyatomic Ion',
      body: 'Atoms bonded together that carry an overall charge form a polyatomic ion. Each positive charge takes one electron away.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'The Amber Lamp',
    prompt: 'Place every electron in boron trifluoride so that no electron is left and no atom holds more than it can.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'BF3', 82, 34, 62]]),
    hints: [
      'Fill the bonds and then the pairs on the atoms until no electron is left.',
      'Compare how many shared pairs boron can take with how many each fluorine atom is willing to share.',
      'Count the shared pairs round boron when every fluorine atom takes exactly one.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      const lamps = sl.read.atoms.map(a => a.lamp);
      if (lamps.includes('over')) return { ok: false, msg: 'An atom has more round it than it can hold.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      if (sl.read.atoms.slice(1).some(a => a.lamp !== 'full')) return { ok: false, msg: 'Every electron is placed, but a fluorine lamp is still dark.' };
      if (lamps[0] === 'amber') return { ok: true };
      return { ok: false, msg: 'Every electron is placed, but not the way the board allows: look at what the atoms beside boron will take.' };
    },
    reward: {
      log: 'Boron stops at six.',
      title: 'Incomplete Octet',
      body: 'An atom that ends with fewer than eight electrons round it has an incomplete octet. Boron is the usual case: it brings three electrons, and fluorine will not share a second pair to make up the rest.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'An Odd One',
    briefing: {
      speaker: SPEAKER,
      body: 'Single places one electron where a pair would place two.'
    },
    prompt: 'Place every electron to complete the Lewis structure for nitric oxide.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'NO', 84, 26, 66]], { single: true }),
    hints: [
      'Place pairs until no whole pair is left, then see what remains.',
      'Compare the electrons you have with how many a whole number of pairs can use.',
      'Put the electron that has no partner on the atom that has room for it, with "Single".'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      const over = sl.read.atoms.some(a => a.lamp === 'over');
      const dots = sl.read.atoms.reduce((n, a) => n + a.dots, 0);
      if (sl.left === 0 && !over && dots === 1) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      if (over) return { ok: false, msg: 'An atom has more round it than it can hold.' };
      return { ok: false, msg: 'Every electron is placed, but not all the way they have to be. One of them cannot be half of a pair.' };
    },
    reward: {
      log: 'An electron with no partner.',
      title: 'Free Radical',
      body: 'A species with an odd number of electrons must leave one unpaired, and one lamp stays dark. That is a free radical, and its lone electron makes it very reactive.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Past Eight',
    prompt: 'Distribute all valence electrons so that sulfur forms an expanded octet in SF6.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'SF6', 82, 33, 61]]),
    hints: [
      'Put a shared pair in every bond, then see how many electrons are left.',
      'Compare the fluorine lamps with the lamp on sulfur as the electrons run out.',
      'Give each fluorine atom the lone pairs it needs and let sulfur keep the shared pairs it ends up with.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read) && sl.read.atoms[0].lamp === 'expanded') return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed but a lamp is still dark, or an atom has more than it can hold.' };
    },
    reward: {
      log: 'Sulfur goes past eight.',
      title: 'Expanded Octet',
      body: 'Atoms on the third ring and below have room for more than eight electrons, so sulfur holds twelve in SF₆. That is an expanded octet, and it is why such atoms can bond to six others.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag a Pair onto the gap between two atoms,', 'or onto one atom.'],
  3: ['Lift Out takes a pair back off an atom.']
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
      body: 'A Lewis structure puts every valence electron somewhere: in a bond between two atoms or as a lone pair on one. Most atoms stop at eight round them, but boron stops short, a radical leaves one over, and a third-ring atom can go beyond.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every shape, charge and reaction in the rest of this unit begins from one of these drawings. If you can place the electrons, you can say what the molecule will do.'
    },
    {
      heading: 'Next',
      body: 'Some molecules have more than one good drawing. The next bench counts the charge on each atom and chooses between them.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'How many lone pairs are on the oxygen atom in a Lewis structure of H₂O?',
    options: [
      { id: 'a', label: 'Two' },
      { id: 'b', label: 'One' },
      { id: 'c', label: 'Three' },
      { id: 'd', label: 'None' }
    ],
    answer: 'a',
    explanation: 'Water has eight valence electrons. Two bonds use four, and the remaining four sit on oxygen as two lone pairs.'
  },
  {
    question: 'What is the best Lewis structure for CO₂?',
    options: [
      { id: 'a', label: 'Two double bonds, with two lone pairs on each oxygen' },
      { id: 'b', label: 'Two single bonds, with three lone pairs on each oxygen' },
      { id: 'c', label: 'One triple and one single bond' },
      { id: 'd', label: 'Two double bonds, with no lone pairs' }
    ],
    answer: 'a',
    explanation: 'With 16 valence electrons, two double bonds give carbon and both oxygens eight electrons each.'
  },
  {
    question: 'How many electrons does the Lewis structure of the NH₄⁺ ion contain?',
    options: [
      { id: 'a', label: '8' },
      { id: 'b', label: '9' },
      { id: 'c', label: '10' },
      { id: 'd', label: '5' }
    ],
    answer: 'a',
    explanation: 'Nitrogen brings 5 and four hydrogens bring 4, which is 9. The positive charge removes one electron, leaving 8.'
  },
  {
    question: 'Why does boron in BF₃ have only six electrons round it?',
    options: [
      { id: 'a', label: 'Boron has only three valence electrons to share, and fluorine does not form a second bond to it' },
      { id: 'b', label: 'Boron cannot bond to fluorine' },
      { id: 'c', label: 'Fluorine has an expanded octet' },
      { id: 'd', label: 'The molecule has an unpaired electron' }
    ],
    answer: 'a',
    explanation: 'Boron brings three electrons, so three single bonds give it six. Fluorine is too electronegative to share more, so the octet stays incomplete.'
  },
  {
    question: 'Which of these can have an expanded octet?',
    options: [
      { id: 'a', label: 'Sulfur in SF₆' },
      { id: 'b', label: 'Nitrogen in NH₃' },
      { id: 'c', label: 'Oxygen in H₂O' },
      { id: 'd', label: 'Carbon in CH₄' }
    ],
    answer: 'a',
    explanation: 'Only atoms on the third period or below have room for more than eight electrons, so sulfur holds twelve in SF₆.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN DEALS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one
   through the reducer by direct actions, by drag and by two taps. A deal is a tray piece dropped on
   a joint (`<slate>j<i><j>`) or on an atom (`<slate><i>`).
   ------------------------------------------------------------------ */

const deal = (target, n = 1, tool = 'pairs') => Array.from({ length: n }, () => ({ join: [tool, target] }));
const dials = value => ({ setDial: { fixture: 'chip', dial: 'charge', value } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [...deal('aj01'), ...deal('aj02'), ...deal('a0', 2)],
  [
    ...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a0'),
    ...deal('bj01'), ...deal('bj02'), ...deal('bj03'), ...deal('bj04'),
    ...deal('cj01'), ...deal('c1', 3)
  ],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2)],
  [...deal('aj01'), ...deal('aj12'), ...deal('a1', 2), ...deal('a2', 3)],
  [dials(1), ...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('aj04')],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3)],
  [...deal('aj01', 2), ...deal('a0'), ...deal('a1', 2), ...deal('a0', 1, 'single')],
  [
    ...['aj01', 'aj02', 'aj03', 'aj04', 'aj05', 'aj06'].flatMap(j => deal(j)),
    ...['a1', 'a2', 'a3', 'a4', 'a5', 'a6'].flatMap(a => deal(a, 3))
  ]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...deal('aj01'), ...deal('aj02')],
  [
    ...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a0'),
    ...deal('bj01'), ...deal('bj02'), ...deal('bj03'), ...deal('bj04'),
    ...deal('cj01'), ...deal('c1', 2)
  ],
  [...deal('aj01'), ...deal('aj12'), ...deal('a0', 3), ...deal('a2', 3)],
  [...deal('aj02'), ...deal('a1', 3), ...deal('a2', 3)],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('aj04')],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a1', 2), ...deal('a2', 2), ...deal('a3', 2)],
  [...deal('aj01', 2), ...deal('a0'), ...deal('a1', 2)],
  ['aj01', 'aj02', 'aj03', 'aj04', 'aj05', 'aj06'].flatMap(j => deal(j))
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
