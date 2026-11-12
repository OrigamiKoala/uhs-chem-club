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
 *   7  sulfur tetrafluoride, where sulfur's lamp shows ten          -> expanded octet
 *   8  nitric oxide, eleven electrons and one left unpaired         -> odd-electron molecule
 *
 * Cut (2026-10-23): "what is left over" (water already leaves lone pairs), the ammonium ion (a charge dial for a count the AP exam
 * asks), nitric oxide and SF6 (free radical and expanded octet; restored 2026-10-29 as stages 7 and 8).
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

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bincomplete octets?\b/i, introducedAt: 6 },
  { term: /\bexpanded octets?\b/i, introducedAt: 7 },
  { term: /\bunpaired electrons?\b|\bfree radicals?\b|\bodd.electron\b/i, introducedAt: 8 },
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
      briefing: { speaker: SPEAKER, body: 'Valence electrons are the electrons in an atom\'s outermost shell, drawn here as dots round each atom.' },
      prompt: 'How many valence electrons do the three atoms of water bring in all?',
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
        'The dial sets your answer; each atom is drawn with its valence electrons round it.',
        'Compare what a hydrogen atom brings with what the oxygen atom brings.',
        'A molecule has every valence electron of every one of its atoms, so nothing is left out and nothing counted twice.'
      ],
      check(state) {
        const v = state.table.fixtures.count.dials.count.value;
        if (!v) return { ok: false, notYet: true, msg: 'Set the dial to a number of electrons.' };
        if (v === trayFor(MOLECULES.H2O)) return { ok: true };
        return { ok: false, msg: 'That is not the number of dots drawn round the three atoms.' };
      },
      reward: {
        log: 'Two hydrogens at 1 and an oxygen at 6.',
        title: 'Electrons to Place',
        body: 'One from each hydrogen and six from oxygen: eight valence electrons to place.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Water\'s Electrons',
    briefing: { speaker: SPEAKER, body: 'A Lewis structure shows every valence electron either in a pair shared between two atoms, which is a bond, or in a lone pair on one atom. Most atoms end with eight electrons round them, an octet; hydrogen ends with two.' },
    prompt: 'Where do water\'s eight valence electrons go?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'H2O', 82, 28, 62]]),
    hints: [
      'Drag the Pair piece onto the gap between two atoms to share a pair, or onto one atom to leave a pair there.',
      'Compare the atoms whose lights are on with the one whose light is still off, and count the electrons round it.',
      'A shared pair counts toward both atoms it sits between, so place those first and see what each atom still lacks.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and an atom\'s light is still off.' };
      return { ok: false, msg: 'Every electron is placed, and an atom\'s light is still off: count the electrons round that atom.' };
    },
    reward: {
      log: 'Every electron placed, every lamp lit.',
      title: 'Lewis Structure',
      body: 'Two shared pairs bond the hydrogens to oxygen, and two lone pairs stay on oxygen. Oxygen has its octet and each hydrogen has two: this drawing is the Lewis structure of water.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  predictStage({
    key: QUEST_KEY,
    title: 'Carbon Dioxide',
    prompt: 'How many electron pairs does carbon share with each oxygen in carbon dioxide?',
    cards: GUESSES,
    hints: [
      'Lay one of the three cards in the slot.',
      'Carbon brings four valence electrons and each oxygen six, and every atom should end with an octet.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage places carbon dioxide\'s sixteen valence electrons.'
    }
  }),

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Pairs Short',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'how can every atom in carbon dioxide have an octet with only sixteen electrons?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO2', 80, 28, 68]]),
    hints: [
      'The Pair piece adds a pair and "Lift Out" takes one back; a gap between two atoms can hold more than one pair.',
      'With one shared pair in each gap, compare the electrons round carbon with the electrons round each oxygen.',
      'A pair on one atom counts for that atom only, while a shared pair counts for two atoms, so ask which placing gives more octets.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and an atom\'s light is still off.' };
      return { ok: false, msg: 'Every electron is placed, and an atom\'s light is still off: count the electrons round that atom.' };
    },
    get reward() {
      return {
        log: 'Neighbours share a second pair.',
        title: 'Double Bonds',
        body: `${verdictLine(QUEST_KEY, 'two')}With single bonds carbon is four electrons short and none are left. Sharing a second pair with each oxygen gives every atom an octet: carbon forms a double bond to each.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'The Middle',
    briefing: { speaker: SPEAKER, body: 'An atom bonded to two or more other atoms is a central atom.' },
    prompt: 'Which atom in HOF is bonded to both of the others?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'HOF', 82, 35, 62, HOF_POS]]),
    hints: [
      'Any two of the three atoms can share a pair here; complete the structure with the atom you choose in the middle.',
      'Compare how many more electrons hydrogen, oxygen and fluorine each need to fill their outer shells.',
      'An atom forms about as many bonds as it is electrons short of a full outer shell.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and an atom\'s light is still off.' };
      return { ok: false, msg: 'Every electron is placed, and an atom\'s light is still off: count the electrons round that atom.' };
    },
    reward: {
      log: 'The atom that joins the others.',
      title: 'Central Atom',
      body: 'Hydrogen and fluorine are each one electron short and form one bond. Oxygen is two short and forms two, so oxygen is the central atom.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Fewer Than Eight',
    briefing: { speaker: SPEAKER, body: 'Fluorine is the most electronegative element and forms only single bonds: it never shares a second pair.' },
    prompt: 'Where do the 24 valence electrons of BF₃ go, given that fluorine forms only single bonds?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'BF3', 82, 36, 62]]),
    hints: [
      'Place pairs until none are left; boron\'s light turns amber, not lit, if it ends with fewer than eight.',
      'Compare how many electrons each fluorine needs with how many are left for boron afterwards.',
      'Fluorine is more electronegative than boron, so ask which atoms keep the electrons when there are not enough for every octet.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      const lamps = sl.read.atoms.map(a => a.lamp);
      if (lamps.includes('over')) return { ok: false, msg: 'An atom has more electrons round it than it can hold.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      if (sl.read.atoms.slice(1).some(a => a.lamp !== 'full')) return { ok: false, msg: 'Every electron is placed, and a fluorine atom\'s light is still off.' };
      if (lamps[0] === 'amber') return { ok: true };
      return { ok: false, msg: 'Every electron is placed, and boron\'s light is not amber.' };
    },
    reward: {
      log: 'Boron stops at six.',
      title: 'Incomplete Octet',
      body: 'Every fluorine has its octet and boron is left with six: an incomplete octet. A few atoms, boron among them, form compounds this way.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'More Than Eight',
    prompt: 'Where do the electrons go that are left once every fluorine in SF₄ has its octet?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'SF4', 82, 32, 46]]),
    hints: [
      'Place pairs until none are left to place, and watch which atom has to take the last pair.',
      'Compare the electrons round sulfur with eight once the last pair is placed.',
      'Fluorine is in the second period and never has more than eight, so ask which atom is left to take the extra pair.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      const atoms = sl.read.atoms;
      if (atoms.some(a => a.lamp === 'over')) return { ok: false, msg: 'An atom has more electrons round it than it can hold.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      if (atoms.slice(1).some(a => a.lamp !== 'full')) return { ok: false, msg: 'Every electron is placed, and a fluorine atom\'s light is still off.' };
      if (atoms[0].lamp === 'expanded') return { ok: true };
      return { ok: false, msg: 'Every electron is placed, and sulfur is not joined to all four fluorine atoms.' };
    },
    reward: {
      log: 'Sulfur holds ten.',
      title: 'Expanded Octet',
      body: 'The last pair is a lone pair on sulfur, which then has ten electrons round it: an expanded octet. Only atoms in the third period or below can have more than eight.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'One Left Over',
    prompt: 'Nitric oxide, NO, has eleven valence electrons: where does the odd one go?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'NO', 82, 36, 62]], { single: true }),
    hints: [
      'The Single piece places one electron on an atom; the Pair piece places two.',
      'Compare the electrons round each atom with eight once all eleven are placed.',
      'Oxygen pulls electrons more strongly than nitrogen, so ask which atom is left one short.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place.' };
      const [n, o] = sl.read.atoms;
      if (o.lamp !== 'full') return { ok: false, msg: 'Every electron is placed, and oxygen does not have eight round it.' };
      if (n.around === 7 && n.dots === 1) return { ok: true };
      return { ok: false, msg: 'Every electron is placed, and nitrogen does not have seven round it with one electron on its own.' };
    },
    reward: {
      log: 'One electron stays unpaired.',
      title: 'Free Radical',
      body: 'One electron has no partner and sits on nitrogen, which has seven round it. A molecule with an unpaired electron is a free radical.',
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
      heading: 'What You Found',
      body: 'A Lewis structure places every valence electron in a bond or a lone pair. Most atoms end with an octet, and where single bonds leave an atom short, a second or third pair is shared.'
    },
    {
      heading: 'Exceptions',
      body: 'Boron can stop at six electrons, atoms from the third period down can hold more than eight, and a molecule with an odd number of electrons leaves one unpaired.'
    },
    {
      heading: 'Next',
      body: 'The next bench looks at molecules that one Lewis structure cannot describe.'
    }
  ]
};

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
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3)],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('aj04'), ...deal('a0'), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3), ...deal('a4', 3)],
  [...deal('aj01', 2), ...deal('a0'), ...deal('a0', 1, 'single'), ...deal('a1', 2)]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [{ setDial: { fixture: 'count', dial: 'count', value: 7 } }],
  [...deal('aj01'), ...deal('aj02')],
  [],
  [...deal('aj01'), ...deal('aj12'), ...deal('a0', 3), ...deal('a2', 3)],
  [...deal('aj02'), ...deal('a1', 3), ...deal('a2', 3)],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('a1', 2), ...deal('a2', 2), ...deal('a3', 2)],
  [...deal('aj01'), ...deal('aj02'), ...deal('aj03'), ...deal('aj04'), ...deal('a1', 3), ...deal('a2', 3), ...deal('a3', 3), ...deal('a4', 3)],
  [...deal('aj01', 3), ...deal('a0'), ...deal('a1')]
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
