/**
 * q4-dots.js — Ligar, bench four: LEWIS STRUCTURES.
 *
 * The pair slate, and the second TABLETOP on the second world (plan `bench-tabletop.md`, phase T1b). A slate holds a molecule's
 * atoms, fixed where the molecule puts them, with a joint at every place a pair could go between two of them; a tray holds exactly
 * the electrons the molecule has. The player deals electrons from the tray by hand: a pair dropped on a joint shares itself between
 * the two atoms beside it, a pair dropped on an atom stays on that atom, and "Lift Out" takes one back. Every atom carries a lamp
 * that lights when eight stand round it (two for hydrogen). The slate reads and never lectures: it has one rule, that a hydrogen or
 * fluorine atom shares one pair and no more. Nothing arranges an electron for the player, and the lamps only report. A drawing of
 * electrons on a slate is flat, so it stays flat (the reward cards hold the solid shapes).
 *
 * THE CLICK (2026-10-23 rollout). Most students draw every bond as a single stick, so carbon dioxide would be O-C-O. The quest asks
 * how many pairs join carbon to each oxygen (the single-stick idea is a card), then hands over carbon dioxide's electrons: with a
 * pair in each gap two lamps stay dark, and only a second pair between the neighbours lights them.
 *
 *   1  place water's electrons so every lamp is lit                -> Lewis structure, lone pair, octet
 *   2  PREDICT: how many pairs join carbon to each oxygen?         (no instrument; the single-stick idea is a card)
 *   3  place carbon dioxide's electrons                            -> multiple bonds share more
 *   4  build HOF, where only one atom can join the other two        -> central atom
 *   5  boron trifluoride, where boron's lamp stays amber           -> incomplete octet
 *
 * Cut (2026-10-23): "what is left over" (water already leaves lone pairs), the ammonium ion (a charge dial for a count the AP exam
 * asks), nitric oxide and SF6 (free radical and expanded octet are beyond a first course).
 *
 * Stage 4 is HOF, not HCN: on this board hydrogen and fluorine take one pair only, so the oxygen between them is the one atom that can
 * join them, which is something the player can FIND. (HCN has an isomer, HNC, that lights every lamp as well.)
 *
 * THE TABLE (`table/`, `kits/atoms.js`, the Lewis slate). The dealing is `lewis.js` `addBond` / `addLone` / `addDot` / `removeOne`, the
 * reading is `planLewis`, and `slateOf` reads the picture: the picture and the grade are one function. `SOLUTIONS` and `MISSES` are
 * scripts of the player's own deals, replayed by `verify:table` by drag and by two taps.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { atomTable, slateOf, slateParts, slateLayout } from '../../table/kits/atoms.js';
import { MOLECULES, DRAWINGS, planLewis, allLit, trayFor } from '../../engine/lewis.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bincomplete octets?\b/i, introducedAt: 6 },
  { term: /\bcentral atoms?\b/i, introducedAt: 5 },
  { term: /\blewis structures?\b/i, introducedAt: 2 },
  { term: /\blone pairs?\b/i, introducedAt: 2 },
  { term: /\boctets?\b/i, introducedAt: 2 }
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

/* ------------------------------------------------------------------
   THE SIX STAGES
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
  (() => {
    const part = slateParts('a', 'H2O', slateLayout('H2O', 46, 32, 44, undefined), { hideTotal: true });
    return {
      title: 'Count the Electrons',
      prompt: 'Set the dial to the total number of valence electrons the three atoms of water bring.',
      widget: { type: 'table', label: 'The bench' },
      table: atomTable({
        opts: OPTS,
        pieces: part.pieces,
        fixtures: [part.fixture, {
          id: 'count', kind: 'tally', label: 'Electrons to place', at: { x: 96, y: 32 }, size: { w: 40, h: 16 }, noRun: true,
          dials: { count: { min: 0, max: 20, step: 1, value: 0, label: 'Total' } }
        }]
      }),
      hints: [
        'Set the dial to the total you counted.',
        'Each atom brings the electrons in its outermost shell: count them for hydrogen, then for oxygen.',
        'Add the valence electrons of every atom in the molecule: two hydrogens and one oxygen.'
      ],
      check(state) {
        const v = state.table.fixtures.count.dials.count.value;
        if (!v) return { ok: false, notYet: true, msg: 'Set the dial to a number of electrons.' };
        if (v === trayFor(MOLECULES.H2O)) return { ok: true };
        return { ok: false, msg: 'The dial does not match the sum of the valence electrons the atoms bring.' };
      },
      reward: {
        log: 'Two hydrogens at 1 and an oxygen at 6.',
        title: 'The Electron Budget',
        body: 'Every atom brings its valence electrons: 1 from each hydrogen and 6 from oxygen, 8 in all. Those eight are the whole budget a drawing of water can place.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Water\'s Electrons',
    prompt: 'Place all valence electrons on the slate so that every atom satisfies the octet rule.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'H2O', 82, 28, 62]]),
    hints: [
      'Use the Pair tile and the slate.',
      'Place electron pairs in bonds and as lone pairs to satisfy hydrogen\'s duet and oxygen\'s octet.',
      'Form single bonds to both hydrogens, then add remaining electrons as lone pairs on oxygen.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed, and a lamp is still dark.' };
    },
    reward: {
      log: 'Every electron placed, every lamp lit.',
      title: 'Lewis Structure and Octet Rule',
      body: 'A Lewis structure represents all valence electrons distributed into covalent bonds or lone pairs. Most main group atoms attain stability with an octet of eight valence electrons, or a duet of two for hydrogen.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'Carbon Dioxide',
    prompt: 'How many electron pairs join carbon to each oxygen atom in carbon dioxide?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Count the total valence electrons available and consider how to fulfill each octet.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Your prediction is recorded. Distribute the valence electrons of carbon dioxide on the slate to verify octets.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Pairs Short',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'distribute all valence electrons on the slate to give every atom a complete octet.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO2', 80, 28, 68]]),
    hints: [
      'Use the Pair tile, "Lift Out" and the slate.',
      'Check whether carbon has a full octet when single bonds are used.',
      'Convert lone pairs from adjacent oxygen atoms into shared pairs to complete carbon\'s octet.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed, and a lamp is still dark.' };
    },
    get reward() {
      return {
        log: 'Neighbours share a second pair.',
        title: 'Double Bonds and Octets',
        body: `${verdictLine(QUEST_KEY, 'two')}When single bonds leave an atom short of an octet, lone pairs become shared pairs. Carbon dioxide achieves a complete octet on every atom by forming a double bond to each oxygen.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Middle',
    prompt: 'Construct hypofluorous acid, HOF, so that every atom satisfies the octet rule.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'HOF', 82, 32, 62, HOF_POS]]),
    hints: [
      'Use the Pair tile and the slate.',
      'Identify which atom can form more than one covalent bond.',
      'Hydrogen and fluorine only form single bonds, so oxygen must be the central atom.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed, and a lamp is still dark.' };
    },
    reward: {
      log: 'The atom that joins the others.',
      title: 'Central Atom',
      body: 'The atom that links multiple terminal atoms is the central atom. Terminal atoms like hydrogen and fluorine can only form a single covalent bond and cannot serve as the central atom.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Amber Lamp',
    prompt: 'Distribute all valence electrons in boron trifluoride so no atom exceeds an octet.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'BF3', 82, 34, 62]]),
    hints: [
      'Use the Pair tile and the slate.',
      'Distribute single bonds to each fluorine atom, then add lone pairs to complete fluorine octets.',
      'Boron contributes three valence electrons and is stable with six valence electrons in BF3.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      const lamps = sl.read.atoms.map(a => a.lamp);
      if (lamps.includes('over')) return { ok: false, msg: 'An atom has more round it than it can hold.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      if (sl.read.atoms.slice(1).some(a => a.lamp !== 'full')) return { ok: false, msg: 'Every electron is placed, and a fluorine lamp is still dark.' };
      if (lamps[0] === 'amber') return { ok: true };
      return { ok: false, msg: 'Every electron is placed, and boron\'s lamp is not amber.' };
    },
    reward: {
      log: 'Boron stops at six.',
      title: 'Incomplete Octet',
      body: 'An atom that remains stable with fewer than eight valence electrons has an incomplete octet. Boron trifluoride contains three single bonds, giving boron six valence electrons without completing an octet.',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Drag a Pair onto the gap between two atoms,', 'or onto one atom.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'Summary',
      body: 'Lewis structures show the distribution of valence electrons into covalent bonds and lone pairs. Most elements form bonds to achieve an octet of electrons, though some elements like boron form stable molecules with an incomplete octet.'
    },
    {
      heading: 'Structure and Bonding',
      body: 'Multiple bonds form when single bonds leave atoms without a complete octet. The least electronegative non-hydrogen atom typically serves as the central atom.'
    },
    {
      heading: 'Next',
      body: 'The next bench investigates molecules whose electronic structures require resonance hybrids to represent accurately.'
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
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ setDial: { fixture: 'count', dial: 'count', value: 8 } }],
  [...deal('aj01'), ...deal('aj02'), ...deal('a0', 2)],
  [guess('two')],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2)],
  [...deal('aj01'), ...deal('aj12'), ...deal('a1', 2), ...deal('a2', 3)],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [{ setDial: { fixture: 'count', dial: 'count', value: 7 } }],
  [...deal('aj01'), ...deal('aj02')],
  [],
  [...deal('aj01'), ...deal('aj12'), ...deal('a0', 3), ...deal('a2', 3)],
  [...deal('aj02'), ...deal('a1', 3), ...deal('a2', 3)],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a1', 2), ...deal('a2', 2), ...deal('a3', 2)]
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
