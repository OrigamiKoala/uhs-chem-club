/**
 * q1-joins.js — Ligar, bench one: WHAT HOLDS.
 *
 * The first bench on the second world, and its first TABLETOP (plan `bench-tabletop.md`, phase T1b). Tallow spent six benches on one
 * atom at a time; this one hands the player loose atoms and asks them to put two together. A pair that holds snaps (an electron
 * visibly crosses, or a pair of electrons settles in the joint); a pair that does not drifts apart when let go. A stage is graded on
 * what is on the table when Submit is pressed.
 *
 * THE CLICK (2026-10-23 rollout). Most students arrive believing that atoms only join when they are DIFFERENT ("two of the same
 * thing have nothing to trade"). So the quest opens on a prediction about two hydrogen atoms (the wrong idea is a card), and the very
 * next bench presses four pairs: the hydrogen pair holds, a pair of different atoms (argon with hydrogen) comes apart, and the rings
 * on the atoms' rims show why. Only then is the word "bond" given.
 *
 *   1  PREDICT: do two hydrogen atoms stay together?            (no instrument; the wrong idea is a card)
 *   2  press four pairs, sort the ones that stayed together     -> a bond fills the outer shell
 *   3  sort four pairs by whether an electron was handed or held -> ionic and covalent
 *   4  build a unit whose shells are all full and whose needle reads zero -> the counts fix the ratio
 *   5  sort four pairs by the number of pairs between them      -> double and triple bonds
 *   -- debrief: two ways to join, and why a compound has only one recipe.
 *
 * Cut as repeats of those ideas (the pairs and the trays changed, the idea did not): "fill the outer shell of every atom" (stage 2
 * shows the rings), "build a charged pair and a neutral pair" (stage 3 sorts them), "read it off the catalogue" and "build the recipe"
 * (stages 3 and 4 already hold both).
 *
 * THE TABLE (`table/`, `kits/atoms.js`, the bond-scale half). Whether a pair holds is `joinbench.js` `planJoin` asked against the
 * atoms' shells as they stand; no stage declares an outcome and none refuses a join: any pair may be tried, and what happens is shown.
 * `SOLUTIONS` and `MISSES` are scripts of the player's own actions, replayed by `verify:table` by drag and by two taps. Words are
 * plain until earned: the faces carry no charge until stage 3, and a refusal says what the table shows, never why.
 *
 * Everything Tallow taught is a plain word here: atom, element, proton, neutron, electron, shell, valence, isotope, ion, cation, anion,
 * metal, nonmetal. What this quest has to earn is on `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { atomTable, pairRead, readPiece, closureOf, moleculesOf } from '../../table/kits/atoms.js';
import { clusterOf } from '../../table/snap.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 5 };

/**
 * When each withheld word is earned.
 *
 * The specific entries come FIRST, because the schedule is searched in order
 * and the first term that matches a word decides when that word is sayable.
 * Put `bond` at the top and "double bond" would silently inherit stage two.
 */
export const VOCABULARY = [
  { term: /\bdouble bonds?\b/i, introducedAt: 5 },
  { term: /\btriple bonds?\b/i, introducedAt: 5 },
  { term: /\bionic\b/i, introducedAt: 3 },
  { term: /\bcovalent\b/i, introducedAt: 3 },
  { term: /\bbond(s|ed|ing)?\b/i, introducedAt: 2 }
];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q1-joins';
const GUESSES = [
  ['hold', 'the hydrogen atoms stay together', ['They stay together', 'Something holds', 'the two']],
  ['apart', 'the hydrogen atoms drift apart', ['They drift apart', 'Identical atoms', 'have nothing to swap']],
  ['merge', 'the hydrogen atoms merge', ['They merge', 'into one bigger', 'atom']]
];

/**
 * The legend lines. A key whose label says what it does owes nothing, and this bench has no keys:
 * its atoms are dragged. Kept so the quest contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   One layout, so the furniture is always where the hand expects it (120 x 64 units): the atoms in
   pairs along the top (a pair stands close, the next pair further off) and the trays under them. A pair
   is two atoms that start side by side; the table lets any atom join any other, and a stage only grades
   the pairs it handed over.
   ------------------------------------------------------------------ */

const atomAt = (id, el, x, y) => ({ id, kind: 'atom', label: el, at: { x, y }, props: { el } });
const trayAt = (id, label, x, y, w = 26, h = 14) => ({ id, label, at: { x, y }, size: { w, h } });

/** What the faces show: the rings of an outer shell from stage 2 on, the charge once a join has handed an electron (stage 3). */
const OPTS_2 = { words: 'shells', shells: true, charges: false };
const OPTS_3 = { words: 'shells', shells: true };

/** The atoms of one stage laid in pairs along y: `[[idA, elA, idB, elB], ...]` at the given x of each pair's left atom. */
function pairsAt(y, xs, list) {
  return list.flatMap(([ia, ea, ib, eb], k) => [atomAt(ia, ea, xs[k], y), atomAt(ib, eb, xs[k] + 12, y)]);
}

/** Where a pair stood, from the stage's own declaration: used by the checks to tell a pair from a stranger. */
const mates = pairs => pairs.map(([a, , b]) => [a, b]);

/** The pair a check reads, with its atoms filed or not: `{joined, type, pairs, tray}`. */
function readPairs(t, list, trays) {
  return mates(list).map(([a, b]) => {
    const r = pairRead(t, a, b);
    const za = r.zones[0];
    const zb = r.zones[1];
    return { ...r, a, b, tray: za && za === zb ? trays.find(k => za === `tray:${k}`) || null : null, split: Boolean(za && zb && za !== zb), filed: Boolean(za && zb) };
  });
}

const STRAY = 'An atom is joined to one it did not start beside.';

/* ------------------------------------------------------------------
   THE FIVE STAGES
   ------------------------------------------------------------------ */
const P2 = [['a1', 'Na', 'a2', 'Cl'], ['b1', 'Ne', 'b2', 'Ne'], ['c1', 'H', 'c2', 'H'], ['d1', 'Ar', 'd2', 'H']];
const P3 = [['m1', 'Mg', 'm2', 'O'], ['h1', 'H', 'h2', 'Cl'], ['k1', 'K', 'k2', 'F'], ['d1', 'C', 'd2', 'H']];
const P5 = [['u1', 'H', 'u2', 'H'], ['v1', 'O', 'v2', 'O'], ['w1', 'N', 'w2', 'N'], ['x1', 'F', 'x2', 'F']];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Two of the Same',
    prompt: 'When two hydrogen atoms are brought together, what happens?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Picture two identical atoms pressed together, and ask what they have to give each other.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage tests what happens when two hydrogen atoms meet.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Press Them Together',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'test each pair of atoms and sort them by whether they stay together.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_2,
      pieces: pairsAt(12, [10, 40, 70, 100], P2),
      zones: { trays: [trayAt('held', 'Stayed together', 36, 38, 44, 16), trayAt('apart', 'Came apart', 92, 38, 44, 16)] }
    }),
    hints: [
      'Use the atoms and the two trays.',
      'Compare the rim of each atom, and the ring on it, in the pairs that held and the pairs that drifted apart.',
      'Press every pair once and watch it after you let go, then file each pair by what it did.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P2, ['held', 'apart']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Sort all four pairs into the trays before you submit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      // Held pairs stay joined; a pair that sprang apart is two loose atoms.
      const want = [true, false, true, false];
      if (pairs.some((p, i) => p.tray === 'held' && !p.joined)) return { ok: false, msg: 'A pair in "Stayed together" is not joined.' };
      if (pairs.some((p, i) => p.tray === 'apart' && p.joined)) return { ok: false, msg: 'A pair in "Came apart" is joined.' };
      if (pairs.some((p, i) => (p.tray === 'held') !== want[i])) return { ok: false, msg: 'A pair in "Came apart" has not been pressed together.' };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Sodium with chlorine held. Neon with neon came apart. Hydrogen with hydrogen held. Argon with hydrogen came apart.',
        title: 'Chemical Bonds',
        body: `${verdictLine(QUEST_KEY, 'hold')}Two atoms that stay together are held by a chemical bond, giving both atoms a full outer shell. A pair with an atom whose outer shell was already full separated.`,
        model: { type: 'molecule', name: 'hydrogen', caption: 'Two hydrogen atoms held by a single covalent bond.' }
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where the Electron Went',
    prompt: 'Sort each pair of atoms into a tray by whether an electron was handed over or the two share a pair.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: pairsAt(12, [10, 40, 70, 100], P3),
      zones: { trays: [trayAt('handed', 'Handed over', 36, 38, 44, 16), trayAt('shared', 'Shared', 92, 38, 44, 16)] }
    }),
    hints: [
      'Use the atoms and the two trays.',
      'Compare the faces of a pair after you press it with what sits in the gap between the two atoms.',
      'In one kind of join an electron crosses over and charges appear; in the other a pair settles between the atoms.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P3, ['handed', 'shared']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Sort all four pairs into the trays before you submit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      if (pairs.some(p => !p.joined)) return { ok: false, msg: 'A pair in a tray has not been pressed together.' };
      const want = ['transfer', 'share', 'transfer', 'share'];
      const tray = { transfer: 'handed', share: 'shared' };
      const bad = pairs.findIndex((p, i) => p.tray !== tray[want[i]]);
      if (bad >= 0) {
        return { ok: false, msg: pairs[bad].tray === 'handed' ? 'A pair in the left tray shows no charge on its faces.' : 'A pair in the right tray shows a plus and a minus on its faces.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two pairs handed over, two held between.',
      title: 'Ionic and Covalent Bonds',
      body: 'A metal and a nonmetal hand electrons over to form ions held by opposite charges, making an ionic bond. Two nonmetals share electron pairs between them, forming a covalent bond.',
      model: { type: 'atoms', items: [{ p: 11, n: 12, charge: 1, label: 'Sodium ion' }, { p: 17, n: 18, charge: -1, label: 'Chloride ion' }], caption: 'An ionic pair: sodium cation and chloride anion.' }
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'How Many It Takes',
    prompt: 'Build a unit where every atom has a full outer shell and the net charge is zero.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: [atomAt('mg', 'Mg', 24, 22), atomAt('cl1', 'Cl', 60, 14), atomAt('cl2', 'Cl', 78, 14), atomAt('cl3', 'Cl', 96, 14), atomAt('cl4', 'Cl', 60, 30)],
      fixtures: [{ id: 'needle', kind: 'needle', label: 'Charge of the unit', at: { x: 99, y: 38 }, size: { w: 34, h: 16 }, noRun: true, props: { cluster: 'mg', range: 3 } }]
    }),
    hints: [
      'Use the chlorine atoms and the needle.',
      'Compare the face of the magnesium atom after each chlorine joins it with the needle.',
      'Add one chlorine at a time until the net charge reads zero.'
    ],
    check(state) {
      const t = state.table;
      const unit = clusterOf(t, 'mg');
      if (unit.length === 1) return { ok: false, notYet: true, msg: 'Join something to the magnesium atom first.' };
      if (!closureOf(unit, t).closed) return { ok: false, msg: 'An atom in the unit has a dark ring on its face.' };
      return { ok: true };
    },
    reward: {
      log: 'Magnesium took chlorines until nothing was left to give.',
      title: 'Formula Ratios',
      body: 'A magnesium atom has two electrons to hand over and each chlorine accepts one, so two chlorines balance one magnesium to reach a net charge of zero. Outer shell electron counts fix the formula ratio of ionic compounds.',
      model: { type: 'atoms', items: [{ p: 17, n: 18, charge: -1, label: 'Chloride' }, { p: 12, n: 12, charge: 2, label: 'Magnesium ion' }, { p: 17, n: 18, charge: -1, label: 'Chloride' }], caption: 'One magnesium ion (Mg²⁺) and two chloride ions (Cl⁻).' }
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Multiple Bonds',
    prompt: 'Sort each pair of atoms into a tray by how many electron pairs are held between them.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: pairsAt(12, [10, 40, 70, 100], P5),
      zones: { trays: [trayAt('one', 'One pair', 24, 38, 28, 16), trayAt('two', 'Two pairs', 60, 38, 28, 16), trayAt('three', 'Three pairs', 96, 38, 28, 16)] }
    }),
    hints: [
      'Use the atoms and the three trays.',
      'Compare the number of rods between the two atoms of a pair after you press it.',
      'Each rod is one shared pair, so file each pair by the number of rods you counted.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P5, ['one', 'two', 'three']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Sort all four pairs into the trays before you submit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      if (pairs.some(p => !p.joined)) return { ok: false, msg: 'A pair in a tray has not been pressed together.' };
      const want = ['one', 'two', 'three', 'one'];
      const bad = pairs.findIndex((p, i) => p.tray !== want[i]);
      if (bad >= 0) return { ok: false, msg: `A pair in the "${{ one: 'One pair', two: 'Two pairs', three: 'Three pairs' }[pairs[bad].tray]}" tray has a different number of rods between its atoms.` };
      return { ok: true };
    },
    reward: {
      log: 'One pair, two pairs, three pairs.',
      title: 'Double and Triple Bonds',
      body: 'An atom sharing two electron pairs forms a double bond, and one sharing three forms a triple bond. Each shared pair fills one electron vacancy on both atoms simultaneously.',
      model: { type: 'molecule', name: 'carbon dioxide', caption: 'Carbon dioxide: carbon shares two electron pairs with each oxygen, forming double bonds.' },
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Atoms bond to achieve full outer shells. Metals transfer electrons to nonmetals in ionic bonds, while nonmetals share electron pairs in covalent bonds.'
    },
    {
      heading: 'Fixed Ratios',
      body: 'Valence electron counts determine how many atoms combine to achieve full shells and neutral charge, fixing the compound formula.'
    },
    {
      heading: 'Next',
      body: 'The next bench tests the physical and electrical properties of ionic, molecular, and network solids.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   Shown at the END OF THE WORLD, after the last debrief, which is why
   they may use the real names freely.
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which pair of atoms forms an ionic bond?',
    options: [
      { id: 'a', label: 'Sodium and chlorine' },
      { id: 'b', label: 'Chlorine and chlorine' },
      { id: 'c', label: 'Neon and neon' },
      { id: 'd', label: 'Hydrogen and hydrogen' }
    ],
    answer: 'a',
    explanation: 'An ionic bond requires a metal and a nonmetal to transfer electrons. Sodium is a metal and chlorine is a nonmetal, so they form an ionic bond.'
  },
  {
    question: 'Neon will not bond to anything. Why not?',
    options: [
      { id: 'a', label: 'It is too light' },
      { id: 'b', label: 'Its outer shell is already full, so a bond would gain it nothing' },
      { id: 'c', label: 'It has no electrons at all' },
      { id: 'd', label: 'It is a metal' }
    ],
    answer: 'b',
    explanation: 'Neon has a complete valence shell of eight electrons. Because atoms bond to achieve full valence shells, neon is energetically stable and chemically inert.'
  },
  {
    question: 'Magnesium has two electrons on its outer shell and chlorine needs one. How many chlorine atoms does one magnesium atom bond to?',
    options: [
      { id: 'a', label: 'One' },
      { id: 'b', label: 'Two' },
      { id: 'c', label: 'Three' },
      { id: 'd', label: 'Four' }
    ],
    answer: 'b',
    explanation: 'Magnesium loses two electrons and each chlorine accepts one. Therefore, two chloride ions balance one magnesium ion to produce neutral MgCl2.'
  },
  {
    question: 'Two oxygen atoms bond together. What kind of bond is it, and how many pairs of electrons does it hold?',
    options: [
      { id: 'a', label: 'Ionic, holding one pair' },
      { id: 'b', label: 'Covalent, holding one pair' },
      { id: 'c', label: 'Covalent, holding two pairs' },
      { id: 'd', label: 'Covalent, holding three pairs' }
    ],
    answer: 'c',
    explanation: 'Both atoms are nonmetals, forming a covalent bond. Oxygen has six valence electrons and shares two pairs to complete its octet, forming a double bond.'
  },
  {
    question: 'Aluminium has three electrons on its outer shell and chlorine needs one. What is the ratio of aluminium to chlorine in the compound they make?',
    options: [
      { id: 'a', label: '1 to 1' },
      { id: 'b', label: '1 to 2' },
      { id: 'c', label: '1 to 3' },
      { id: 'd', label: '3 to 1' }
    ],
    answer: 'c',
    explanation: 'Aluminium forms an Al3+ cation and each chlorine forms a Cl- anion. Three chloride ions balance one aluminium ion, yielding AlCl3.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one
   through the reducer by direct actions, by drag and by two taps, and every join in it is the
   kit's planner saying it holds. A pair that does not hold is tried all the same, and drifts apart.
   ------------------------------------------------------------------ */

const tray = (piece, id) => ({ place: { piece, to: `tray:${id}` } });
const join = (a, b) => ({ join: [a, b] });
const to = (piece, zone) => ({ place: { piece, to: `slot:${zone}` } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [to('hold', 'guess')],
  [
    join('a1', 'a2'), join('c1', 'c2'), join('b1', 'b2'), join('d1', 'd2'),
    tray('a1', 'held'), tray('c1', 'held'), tray('b1', 'apart'), tray('b2', 'apart'), tray('d1', 'apart'), tray('d2', 'apart')
  ],
  [
    join('m1', 'm2'), join('h1', 'h2'), join('k1', 'k2'), join('d1', 'd2'),
    tray('m1', 'handed'), tray('k1', 'handed'), tray('h1', 'shared'), tray('d1', 'shared')
  ],
  [join('cl1', 'mg'), join('cl2', 'mg')],
  [
    join('u1', 'u2'), join('v1', 'v2'), join('w1', 'w2'), join('x1', 'x2'),
    tray('u1', 'one'), tray('v1', 'two'), tray('w1', 'three'), tray('x1', 'one')
  ]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [
    join('a1', 'a2'), join('c1', 'c2'), join('b1', 'b2'), join('d1', 'd2'),
    tray('a1', 'held'), tray('c1', 'apart'), tray('b1', 'apart'), tray('b2', 'apart'), tray('d1', 'apart'), tray('d2', 'apart')
  ],
  [
    join('m1', 'm2'), join('h1', 'h2'), join('k1', 'k2'), join('d1', 'd2'),
    tray('m1', 'handed'), tray('k1', 'handed'), tray('h1', 'handed'), tray('d1', 'shared')
  ],
  [join('cl1', 'mg')],
  [
    join('u1', 'u2'), join('v1', 'v2'), join('w1', 'w2'), join('x1', 'x2'),
    tray('u1', 'one'), tray('v1', 'one'), tray('w1', 'three'), tray('x1', 'one')
  ]
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
