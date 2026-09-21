/**
 * q1-joins.js — Ligar, bench one: WHAT HOLDS.
 *
 * The first bench on the second world. Tallow spent five benches on one atom at
 * a time; this one puts two of them in a clamp and presses them together.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  press three pairs and see which held      -> a join has a name: a bond
 *   2  read the outer shells before and after    -> a bond fills the outer shell
 *   3  read the charge on all four pieces        -> handed over, or held between
 *   4  press four pairs and file what happened   -> ionic and covalent
 *   5  a giver with two to give                  -> the counts fix the ratio
 *   6  count the pairs sitting between           -> double and triple bonds
 *   7  predict four pairs off the catalogue      -> the catalogue decides it
 *   8  how many of one kind a giver can hold     -> the counts fix the recipe
 *   -- debrief: two ways to join, and why a compound has only one recipe.
 *
 * WHAT THIS BENCH DOES NOT DO. It never weighs anything and it never counts a
 * heap. What a compound weighs, and how you count pieces too small to count,
 * are benches four and five of this world.
 *
 * Everything Tallow taught is a plain word here: atom, element, compound,
 * molecule, proton, neutron, electron, shell, valence, isotope, ion, cation,
 * anion, metal, nonmetal. What this quest has to earn is on `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { JoinBench, planJoin, shellPlan, shellsAfter } from '../../engine/joinbench.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned.
 *
 * The specific entries come FIRST, because the schedule is searched in order
 * and the first term that matches a word decides when that word is sayable.
 * Put `bond` at the top and "double bond" would silently inherit stage one.
 */
export const VOCABULARY = [
  { term: /\bdouble bonds?\b/i, introducedAt: 6 },
  { term: /\btriple bonds?\b/i, introducedAt: 6 },
  { term: /\bionic\b/i, introducedAt: 4 },
  { term: /\bcovalent\b/i, introducedAt: 4 },
  { term: /\bbond(s|ed|ing)?\b/i, introducedAt: 1 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE CATALOGUE

   The same filing the scope has used since Tallow's first bench, with
   the one thing this world needs added: how the electrons are stacked
   on each kind. The innermost shell holds two and every shell after it
   holds eight, which the core bench already established.
   ------------------------------------------------------------------ */
export const PIECES = {
  h:  { code: 'CAT 01', kind: 'nonmetal', shells: [1], tint: 'bone', note: 'The lightest thing the yard handles.' },
  c:  { code: 'CAT 06', kind: 'nonmetal', shells: [2, 4], tint: 'iron', note: 'Dark and dry. Marks anything it touches.' },
  n:  { code: 'CAT 07', kind: 'nonmetal', shells: [2, 5], tint: 'pale', note: 'Most of the air on this planet is this.' },
  o:  { code: 'CAT 08', kind: 'nonmetal', shells: [2, 6], tint: 'rust', note: 'Turns up in almost every sample here.' },
  f:  { code: 'CAT 09', kind: 'nonmetal', shells: [2, 7], tint: 'sand', note: 'Eats through most containers.' },
  ne: { code: 'CAT 10', kind: 'nonmetal', shells: [2, 8], tint: 'pale', note: 'Sits in the vent lamps and does nothing else.' },
  na: { code: 'CAT 11', kind: 'metal', shells: [2, 8, 1], tint: 'pale', note: 'Large, soft and dull.' },
  mg: { code: 'CAT 12', kind: 'metal', shells: [2, 8, 2], tint: 'bone', note: 'Light, and burns very white.' },
  al: { code: 'CAT 13', kind: 'metal', shells: [2, 8, 3], tint: 'iron', note: 'Most of the hull plate in the yard.' },
  s:  { code: 'CAT 16', kind: 'nonmetal', shells: [2, 8, 6], tint: 'sand', note: 'Yellow. The vents are crusted with it.' },
  cl: { code: 'CAT 17', kind: 'nonmetal', shells: [2, 8, 7], tint: 'sand', note: 'Yellow and heavy. Sharp smell.' },
  ar: { code: 'CAT 18', kind: 'nonmetal', shells: [2, 8, 8], tint: 'pale', note: 'Pumped into the weld hoods.' },
  k:  { code: 'CAT 19', kind: 'metal', shells: [2, 8, 8, 1], tint: 'pale', note: 'Soft enough to cut with a blade.' },
  ca: { code: 'CAT 20', kind: 'metal', shells: [2, 8, 8, 2], tint: 'bone', note: 'The arches are half built out of it.' }
};

/* ------------------------------------------------------------------
   THE KEY LEGEND
   Nothing on this bench is named without being explained. Every control
   a stage offers carries one plain sentence for as long as it is there.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  press: [{
    from: 1,
    key: 'Press Together',
    what: 'Closes the clamps on the selected pair and shows whether the two pieces hold.'
  }],
  read: [{
    from: 1,
    key: 'Read Piece',
    what: 'Reports the piece you tapped: its code, whether it is a metal, and its outer shell.'
  }],
  needle: [{
    from: 3,
    key: 'Read Charge',
    what: 'Reports the charge on the piece you tapped, the way the needle on Tallow did.'
  }]
};

/**
 * The legend line for one control on one stage, or null if there is none.
 * `stageNumber` is one-based, the way a player counts stages.
 */
export function toolNoteFor(controlId, stageNumber) {
  const rows = TOOL_TEXT[controlId];
  if (!rows) return null;
  let out = null;
  for (const r of rows) if (stageNumber >= r.from) out = r;
  return out ? { key: out.key, what: out.what } : null;
}

/** A pair plate, written the way a stage reads it. */
const pair = (id, label, note, left, right) => ({ id, label, note, left, right });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   Exported so `verify:learn` can run SOLUTIONS and MISSES through every
   `check` without a browser.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Press Them Together',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench clamps two pieces face to face and presses them together to see whether they hold. Tap a piece and press "Read Piece" to find out what it is and what sits on its outer shell.'
    },
    prompt: 'Press each of the three pairs together, then file each pair by whether it held.',
    controls: ['press', 'read'],
    pairs: [
      pair('p1', 'PAIR A', 'off the salt pan', PIECES.na, PIECES.cl),
      pair('p2', 'PAIR B', 'off the vent lamps', PIECES.ne, PIECES.ne),
      pair('p3', 'PAIR C', 'off the gas line', PIECES.h, PIECES.h)
    ],
    widget: {
      type: 'bins',
      rows: ['p1', 'p2', 'p3'],
      bins: [
        { id: 'held', label: 'Held', note: 'The two pieces stayed against each other.' },
        { id: 'apart', label: 'Sprang apart', note: 'The clamps let go and nothing stayed.' }
      ]
    },
    hints: [
      'Tap a pair to select it, press "Press Together", and do the same for the other two.',
      'Watch the clamps after each press: a pair that holds stays closed, and a pair that does not springs back to where it started.',
      'Pair A held and Pair C held. Pair B sprang apart.'
    ],
    check(state) {
      if (state.pressed.size < 3) {
        return { ok: false, notYet: true, msg: 'Press all three pairs before you answer.' };
      }
      const labels = { p1: 'Pair A', p2: 'Pair B', p3: 'Pair C' };
      for (const id of ['p1', 'p2', 'p3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      if (state.bins.p1 !== 'held') {
        return { ok: false, msg: 'Pair A stayed closed after the press, so it held.' };
      }
      if (state.bins.p2 !== 'apart') {
        return { ok: false, msg: 'Pair B sprang straight back out of the clamps, so nothing held it.' };
      }
      if (state.bins.p3 !== 'held') {
        return { ok: false, msg: 'Pair C stayed closed after the press, so it held.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Pair A held. Pair B sprang apart. Pair C held.',
      title: 'What Holds Is Called a Bond',
      body: 'Two atoms that stay together after the clamps let go are held by a chemical bond, and Pair A and Pair C each made one. Pair B made nothing at all. Every solid thing on this planet is atoms held to other atoms by bonds.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Why B Would Not Hold',
    prompt: 'Read the pieces before and after the presses, then say why Pair B would not hold when the other two did.',
    controls: ['press', 'read'],
    pairs: [
      pair('p1', 'PAIR A', 'off the salt pan', PIECES.na, PIECES.cl),
      pair('p2', 'PAIR B', 'off the vent lamps', PIECES.ne, PIECES.ne),
      pair('p3', 'PAIR C', 'off the gas line', PIECES.h, PIECES.h)
    ],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'full', label: 'Both of its pieces already had a full outer shell', note: 'Neither one had room for anything.' },
        { id: 'same', label: 'Its two pieces were the same kind as each other', note: 'Like will not hold like.' },
        { id: 'heavy', label: 'Its two pieces were the heaviest on the bench', note: 'Weight decided it.' },
        { id: 'few', label: 'Neither of its pieces had enough electrons', note: 'Both outsides were nearly empty.' }
      ]
    },
    hints: [
      'Tap a piece, press "Read Piece", and do it for a piece in each of the three pairs.',
      'Compare the outer shell of a Pair B piece with the outer shell of a Pair A piece, and then read the Pair A pieces again after the press.',
      'Both Pair B pieces carry eight electrons on the outer shell, which is as many as that shell holds. Every piece that joined ended up with a full outer shell too.'
    ],
    check(state) {
      if (state.pressed.size < 3) {
        return { ok: false, notYet: true, msg: 'Press all three pairs before you answer.' };
      }
      if (state.read.size < 2) {
        return { ok: false, notYet: true, msg: 'Read at least two of the pieces before you answer.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'same') {
        return { ok: false, msg: 'Pair C is two pieces of the same kind and it held, so that is not what stopped Pair B.' };
      }
      if (state.choice === 'heavy') {
        return { ok: false, msg: 'Pair A holds the two heaviest pieces on the bench and it held, so weight is not what stopped Pair B.' };
      }
      if (state.choice === 'few') {
        return { ok: false, msg: 'Read a Pair B piece: it carries eight electrons on its outer shell, which is not nearly empty.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Pair B: eight on each outer shell, no room on either.',
      title: 'A Bond Fills the Outer Shell',
      body: 'Both pieces of every pair that joined here came out of the press with a full outer shell, and a full outer shell is eight electrons — two, on the innermost one. Pair B started full on both sides, so a bond had nothing left to do for it. Atoms bond in order to fill the outer shell, and one that is already full has no reason to bond at all.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where the Electron Went',
    prompt: 'Press both pairs, read the charge on all four pieces, and say how the two joins differ.',
    controls: ['press', 'read', 'needle'],
    pairs: [
      pair('j1', 'PAIR A', 'off the salt pan', PIECES.na, PIECES.cl),
      pair('j2', 'PAIR B', 'off the gas line', PIECES.h, PIECES.h)
    ],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'moved', label: 'In Pair A an electron crossed over to the other piece; in Pair B the two pieces hold a pair between them', note: 'Handed over on one plate, held between on the other.' },
        { id: 'swap', label: 'The two pieces traded places in the clamps', note: 'The pieces moved, not the electrons.' },
        { id: 'noise', label: 'The joins are the same and the charge reading is instrument noise', note: 'Nothing real is different.' },
        { id: 'both', label: 'In both pairs each piece gave an electron away', note: 'Everything was handed over.' }
      ]
    },
    hints: [
      'Press both pairs, then tap a piece and press "Read Charge" on each of the four.',
      'Two of the four pieces read something other than zero. Look at which plate they are on, and at where the electrons are drawn afterwards.',
      'Pair A reads plus one and minus one, because one electron crossed over. Pair B reads zero and zero, because its pair of electrons sits between the two pieces.'
    ],
    check(state) {
      if (state.pressed.size < 2) {
        return { ok: false, notYet: true, msg: 'Press both pairs before you answer.' };
      }
      if (state.chargedPlates.size < 2) {
        return { ok: false, notYet: true, msg: 'Read the charge on a piece in each of the two pairs before you answer.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'swap') {
        return { ok: false, msg: 'The code plates under the clamps never changed, so neither piece went anywhere.' };
      }
      if (state.choice === 'noise') {
        return { ok: false, msg: 'Pair A reads plus one and minus one while both Pair B pieces read zero. That is a difference, not noise.' };
      }
      if (state.choice === 'both') {
        return { ok: false, msg: 'Both Pair B pieces read zero, so neither of them gave anything away.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Pair A: plus one and minus one. Pair B: zero and zero.',
      title: 'Two Ways to Fill a Shell',
      body: 'In Pair A one atom handed an electron over, which left a cation reading plus one and an anion reading minus one, and the pull between those opposite charges is what holds them together. In Pair B neither piece would give one up, so the two hold a pair of electrons between them and each of them counts that pair as its own. Every join you will ever meet is one of those two.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Which Way It Goes',
    prompt: 'Press each pair, read both of its pieces, and file every pair by what happened to the electrons.',
    controls: ['press', 'read', 'needle'],
    pairs: [
      pair('r1', 'PAIR A', 'off the arch quarry', PIECES.mg, PIECES.o),
      pair('r2', 'PAIR B', 'off the vent field', PIECES.o, PIECES.o),
      pair('r3', 'PAIR C', 'off the salt pan', PIECES.k, PIECES.f),
      pair('r4', 'PAIR D', 'off the gas line', PIECES.c, PIECES.h)
    ],
    widget: {
      type: 'bins',
      rows: ['r1', 'r2', 'r3', 'r4'],
      bins: [
        { id: 'handed', label: 'Handed over', note: 'One piece gave electrons to the other.' },
        { id: 'shared', label: 'Held between', note: 'The two pieces hold a pair between them.' }
      ]
    },
    hints: [
      'Press a pair, then tap each of its pieces and press "Read Piece", and do the same for the other three.',
      'Every plate where something was handed over has a metal in it, and every plate where a pair sits between them has two nonmetals.',
      'Pair A and Pair C handed electrons over. Pair B and Pair D hold pairs between them.'
    ],
    check(state) {
      if (state.pressed.size < 4) {
        return { ok: false, notYet: true, msg: 'Press all four pairs before you answer.' };
      }
      if (state.readPlates.size < 4) {
        return { ok: false, notYet: true, msg: 'Read a piece in each of the four pairs before you answer.' };
      }
      const labels = { r1: 'Pair A', r2: 'Pair B', r3: 'Pair C', r4: 'Pair D' };
      for (const id of ['r1', 'r2', 'r3', 'r4']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      if (state.bins.r1 !== 'handed') {
        return { ok: false, msg: 'Pair A holds a metal, and after the press one piece reads plus two and the other minus two.' };
      }
      if (state.bins.r2 !== 'shared') {
        return { ok: false, msg: 'Neither Pair B piece is a metal, and both read zero after the press, so nothing was handed over.' };
      }
      if (state.bins.r3 !== 'handed') {
        return { ok: false, msg: 'Pair C holds a metal, and after the press one piece reads plus one and the other minus one.' };
      }
      if (state.bins.r4 !== 'shared') {
        return { ok: false, msg: 'Neither Pair D piece is a metal, and both read zero after the press.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two plates handed over, two held between.',
      title: 'Ionic and Covalent',
      body: 'A metal and a nonmetal hand electrons over and are then held by the pull between the ions that makes, which is an ionic bond. Two nonmetals both refuse to give one up, so they hold pairs between them instead, which is a covalent bond. Which one you get is decided by the two kinds, and the catalogue already says which kinds are metals.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'How Many It Takes',
    prompt: 'Press both pairs, read the left-hand piece in each one afterwards, and say how many CAT 17 pieces one CAT 12 piece needs in order to give away everything it has.',
    controls: ['press', 'read', 'needle'],
    pairs: [
      pair('t1', 'PAIR A', 'off the arch quarry', PIECES.mg, PIECES.cl),
      pair('t2', 'PAIR B', 'off the salt pan', PIECES.na, PIECES.cl)
    ],
    widget: { type: 'number', min: 0, max: 5, step: 1, label: 'CAT 17 pieces per CAT 12 piece' },
    hints: [
      'Press both pairs, then tap the left-hand piece on each plate and press "Read Piece".',
      'The CAT 11 piece on Pair B has nothing left on its outer shell afterwards, but the CAT 12 piece on Pair A still has something sitting on its outer shell.',
      'A CAT 12 piece starts with two electrons on its outer shell and each CAT 17 takes one of them, so it needs two: (1 x 2 given) = (2 x 1 taken).'
    ],
    check(state) {
      if (state.pressed.size < 2) {
        return { ok: false, notYet: true, msg: 'Press both pairs before you answer.' };
      }
      if (state.readPlates.size < 2) {
        return { ok: false, notYet: true, msg: 'Read the left-hand piece on each plate after the press.' };
      }
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 1) {
        return { ok: false, msg: 'One CAT 17 took a single electron, and the CAT 12 piece still has one sitting on its outer shell.' };
      }
      if (state.number !== 2) {
        return { ok: false, msg: 'A CAT 12 piece starts with two electrons on its outer shell, and each CAT 17 takes exactly one.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'CAT 12 needs two CAT 17. CAT 11 needs one.',
      title: 'The Counts Fix the Ratio',
      body: 'A CAT 12 atom has two electrons to hand over and a CAT 17 atom takes exactly one each, so it takes two CAT 17 to clear one CAT 12 and the charges cancel to zero. A CAT 11 atom only has one to give, so it needs only one partner. The ratio in an ionic compound is not a choice — it falls straight out of the counts on the two outer shells.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'More Than One Pair',
    prompt: 'Press all three pairs and file each one by how many pairs of electrons it holds between its two pieces.',
    controls: ['press', 'read'],
    pairs: [
      pair('u1', 'PAIR A', 'off the gas line', PIECES.h, PIECES.h),
      pair('u2', 'PAIR B', 'off the vent field', PIECES.o, PIECES.o),
      pair('u3', 'PAIR C', 'off the air plant', PIECES.n, PIECES.n)
    ],
    widget: {
      type: 'bins',
      rows: ['u1', 'u2', 'u3'],
      bins: [
        { id: 'one', label: 'One pair', note: 'Two electrons sit between them.' },
        { id: 'two', label: 'Two pairs', note: 'Four electrons sit between them.' },
        { id: 'three', label: 'Three pairs', note: 'Six electrons sit between them.' }
      ]
    },
    hints: [
      'Press each pair, then count the electrons drawn in the middle, between the two pieces.',
      'Read a piece before the press to see how many places its outer shell still has open, and check that against what ends up between them.',
      'Pair A holds one pair, Pair B holds two and Pair C holds three.'
    ],
    check(state) {
      if (state.pressed.size < 3) {
        return { ok: false, notYet: true, msg: 'Press all three pairs before you answer.' };
      }
      const labels = { u1: 'Pair A', u2: 'Pair B', u3: 'Pair C' };
      const counts = { u1: 'two electrons, which is one pair', u2: 'four electrons, which is two pairs', u3: 'six electrons, which is three pairs' };
      for (const id of ['u1', 'u2', 'u3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      const want = { u1: 'one', u2: 'two', u3: 'three' };
      for (const id of ['u1', 'u2', 'u3']) {
        if (state.bins[id] !== want[id]) {
          return { ok: false, msg: `${labels[id]} holds ${counts[id]} between its two pieces.` };
        }
      }
      return { ok: true };
    },
    reward: {
      log: 'One pair, two pairs, three pairs.',
      title: 'Double and Triple Bonds',
      body: 'A piece with two places to fill holds two pairs with its partner, and one with three places holds three, because each shared pair fills one place on each side at once. One shared pair is a single bond, two is a double bond and three is a triple bond. The more pairs a join holds, the shorter and the stronger it is.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Read It Off the Catalogue',
    prompt: 'Read both pieces in each pair, file every pair from what you read, then press them to check.',
    controls: ['press', 'read', 'needle'],
    pairs: [
      pair('v1', 'PAIR A', 'off the arch quarry', PIECES.ca, PIECES.s),
      pair('v2', 'PAIR B', 'off the vent field', PIECES.c, PIECES.o),
      pair('v3', 'PAIR C', 'off the weld hoods', PIECES.ar, PIECES.h),
      pair('v4', 'PAIR D', 'off the hull racks', PIECES.al, PIECES.cl)
    ],
    widget: {
      type: 'bins',
      rows: ['v1', 'v2', 'v3', 'v4'],
      bins: [
        { id: 'ionic', label: 'Ionic', note: 'A metal hands electrons to a nonmetal.' },
        { id: 'covalent', label: 'Covalent', note: 'Two nonmetals hold pairs between them.' },
        { id: 'none', label: 'No bond', note: 'An outer shell is already full.' }
      ]
    },
    hints: [
      'Tap each piece and press "Read Piece": the line that matters is whether it is a metal, and whether its outer shell has any room left.',
      'A metal with a nonmetal is ionic, two nonmetals are covalent, and any pair holding a full outer shell makes nothing.',
      'Pair A and Pair D are ionic, Pair B is covalent, and Pair C makes no bond because CAT 18 already carries eight.'
    ],
    check(state) {
      if (state.readPlates.size < 4) {
        return { ok: false, notYet: true, msg: 'Read a piece in each of the four pairs before you answer.' };
      }
      const labels = { v1: 'Pair A', v2: 'Pair B', v3: 'Pair C', v4: 'Pair D' };
      for (const id of ['v1', 'v2', 'v3', 'v4']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      const reasons = {
        v1: 'Pair A is a metal with a nonmetal, so it is ionic.',
        v2: 'Neither Pair B piece is a metal, so it is covalent.',
        v3: 'CAT 18 already carries eight electrons on its outer shell, so Pair C makes no bond at all.',
        v4: 'Pair D is a metal with a nonmetal, so it is ionic.'
      };
      const want = { v1: 'ionic', v2: 'covalent', v3: 'none', v4: 'ionic' };
      for (const id of ['v1', 'v2', 'v3', 'v4']) {
        if (state.bins[id] !== want[id]) return { ok: false, msg: reasons[id] };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two ionic, one covalent, one that will not join.',
      title: 'The Catalogue Decides It',
      body: 'A metal with a nonmetal gives an ionic bond, two nonmetals give a covalent bond, and a piece whose outer shell is already full gives no bond at all. You did not have to press anything to know which was which. Where two kinds sit in the catalogue is enough to say what they will do.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Build the Recipe',
    prompt: 'Press both pairs, read the left-hand piece in each one afterwards, and say how many CAT 01 pieces one CAT 06 piece can hold.',
    controls: ['press', 'read'],
    pairs: [
      pair('w1', 'PAIR A', 'off the gas line', PIECES.c, PIECES.h),
      pair('w2', 'PAIR B', 'off the air plant', PIECES.n, PIECES.h)
    ],
    widget: { type: 'number', min: 0, max: 6, step: 1, label: 'CAT 01 pieces per CAT 06 piece' },
    hints: [
      'Press both pairs, then tap the left-hand piece on each plate and press "Read Piece".',
      'After one CAT 01, the CAT 06 piece still has room for three more, and the CAT 07 piece still has room for two.',
      'One pair is already held, and three places are still open, so one CAT 06 holds 1 + 3 = 4 of them.'
    ],
    check(state) {
      if (state.pressed.size < 2) {
        return { ok: false, notYet: true, msg: 'Press both pairs before you answer.' };
      }
      if (state.readPlates.size < 2) {
        return { ok: false, notYet: true, msg: 'Read the left-hand piece on each plate after the press.' };
      }
      if (state.number === 0) {
        return { ok: false, notYet: true, msg: 'Set the counter to the number you worked out.' };
      }
      if (state.number === 3) {
        return { ok: false, msg: 'Three is how many CAT 01 one CAT 07 piece holds. Read the CAT 06 piece again: it has room for three more on top of the one it already holds.' };
      }
      if (state.number === 1) {
        return { ok: false, msg: 'One CAT 01 fills only one of the four places on a CAT 06 outer shell.' };
      }
      if (state.number !== 4) {
        return { ok: false, msg: 'A CAT 06 outer shell has four places open and each CAT 01 fills exactly one of them.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'CAT 06 holds four CAT 01. CAT 07 holds three.',
      title: 'The Counts Fix the Recipe',
      body: 'A CAT 06 atom has four places to fill and each CAT 01 fills one, so one CAT 06 holds exactly four of them — never three and never five. The same counting fixes an ionic compound, except that there it is the charges that have to cancel. A compound has one recipe because the outer shells leave it no choice.',
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
      body: 'Atoms join to fill their outer shells, and there are only two ways to do it: hand electrons over, or hold pairs between you. A metal with a nonmetal does the first and makes an ionic bond; two nonmetals do the second and make a covalent bond.'
    },
    {
      heading: 'Why the Recipe Is Fixed',
      body: 'How many electrons each outer shell has to move is a count, not a preference. That count decides how many of each kind end up in a compound, which is why one compound only ever has one recipe.'
    },
    {
      heading: 'Next',
      body: 'The arches outside are standing on joins like these. The next bench takes a whole block of each kind and asks what it does when you hit it, heat it and put a current through it.'
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
    explanation: 'An ionic bond needs one atom willing to hand electrons over and one willing to take them — a metal with a nonmetal. Sodium is the only metal in the list, so only that pair transfers.'
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
    explanation: 'Neon carries eight electrons on its outer shell. Atoms bond in order to reach a full outer shell, and neon is already there, so there is nothing for a bond to do.'
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
    explanation: 'Magnesium has two electrons to give and each chlorine takes only one, so it takes two chlorines to clear both. That is why the compound is MgCl2 and the charges cancel: one +2 against two −1.'
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
    explanation: 'Both atoms are nonmetals, so they share rather than transfer: the bond is covalent. Oxygen has six on its outer shell and needs two more, so the two atoms hold two shared pairs — a double bond.'
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
    explanation: 'Aluminium hands over three electrons and each chlorine takes one, so three chlorines are needed to absorb them all. The compound is AlCl3, and its +3 and three −1 charges cancel exactly.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    number: stage.widget.type === 'number' ? stage.widget.min : null,
    choice: null,
    bins: {},
    plate: null,
    side: null,
    pressed: new Set(),
    read: new Set(),
    readPlates: new Set(),
    charged: new Set(),
    chargedPlates: new Set()
  };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { pressed: new Set(['p1', 'p2', 'p3']), bins: { p1: 'held', p2: 'apart', p3: 'held' } },
  {
    pressed: new Set(['p1', 'p2', 'p3']),
    read: new Set(['p1:left', 'p2:left']),
    readPlates: new Set(['p1', 'p2']),
    choice: 'full'
  },
  {
    pressed: new Set(['j1', 'j2']),
    charged: new Set(['j1:left', 'j1:right', 'j2:left', 'j2:right']),
    chargedPlates: new Set(['j1', 'j2']),
    choice: 'moved'
  },
  {
    pressed: new Set(['r1', 'r2', 'r3', 'r4']),
    read: new Set(['r1:left', 'r2:left', 'r3:left', 'r4:left']),
    readPlates: new Set(['r1', 'r2', 'r3', 'r4']),
    bins: { r1: 'handed', r2: 'shared', r3: 'handed', r4: 'shared' }
  },
  {
    pressed: new Set(['t1', 't2']),
    read: new Set(['t1:left', 't2:left']),
    readPlates: new Set(['t1', 't2']),
    number: 2
  },
  {
    pressed: new Set(['u1', 'u2', 'u3']),
    bins: { u1: 'one', u2: 'two', u3: 'three' }
  },
  {
    read: new Set(['v1:left', 'v2:left', 'v3:left', 'v4:left']),
    readPlates: new Set(['v1', 'v2', 'v3', 'v4']),
    bins: { v1: 'ionic', v2: 'covalent', v3: 'none', v4: 'ionic' }
  },
  {
    pressed: new Set(['w1', 'w2']),
    read: new Set(['w1:left', 'w2:left']),
    readPlates: new Set(['w1', 'w2']),
    number: 4
  }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { pressed: new Set(['p1', 'p2', 'p3']), bins: { p1: 'held', p2: 'held', p3: 'held' } },
  {
    pressed: new Set(['p1', 'p2', 'p3']),
    read: new Set(['p1:left', 'p2:left']),
    readPlates: new Set(['p1', 'p2']),
    choice: 'same'
  },
  {
    pressed: new Set(['j1', 'j2']),
    charged: new Set(['j1:left', 'j2:left']),
    chargedPlates: new Set(['j1', 'j2']),
    choice: 'both'
  },
  {
    pressed: new Set(['r1', 'r2', 'r3', 'r4']),
    read: new Set(['r1:left', 'r2:left', 'r3:left', 'r4:left']),
    readPlates: new Set(['r1', 'r2', 'r3', 'r4']),
    bins: { r1: 'handed', r2: 'handed', r3: 'handed', r4: 'shared' }
  },
  {
    pressed: new Set(['t1', 't2']),
    read: new Set(['t1:left', 't2:left']),
    readPlates: new Set(['t1', 't2']),
    number: 1
  },
  {
    pressed: new Set(['u1', 'u2', 'u3']),
    bins: { u1: 'one', u2: 'one', u3: 'three' }
  },
  {
    read: new Set(['v1:left', 'v2:left', 'v3:left', 'v4:left']),
    readPlates: new Set(['v1', 'v2', 'v3', 'v4']),
    bins: { v1: 'ionic', v2: 'covalent', v3: 'covalent', v4: 'ionic' }
  },
  {
    pressed: new Set(['w1', 'w2']),
    read: new Set(['w1:left', 'w2:left']),
    readPlates: new Set(['w1', 'w2']),
    number: 3
  }
];

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return { ...blankState(STAGES[i]), ...overrides };
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const frame = new LearnFrame(container, {
    stageCount: STAGES.length,
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  const bench = new JoinBench(frame.instrumentHost, {
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id)
  });

  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let busy = false;
  let disposed = false;

  /* ---------------- stage lifecycle ---------------- */

  function loadStage(i) {
    index = i;
    const stage = STAGES[i];
    state = blankState(stage);

    frame.setCleared(cleared);
    frame.setStage({
      index: i,
      title: stage.title,
      prompt: stage.prompt,
      briefing: stage.briefing,
      hints: stage.hints,
      commitLabel: 'Commit'
    });

    bench.setPlates(stage.pairs);
    bench.setSelectable(stage.pairs.length > 1);
    if (stage.pairs.length === 1) onSelect(stage.pairs[0].id);

    renderControls();
    renderWidget();
    renderReadout(null);

    if (stage.briefing && !ctx.isComplete && cleared <= i) frame.showBriefing();
  }

  function next() {
    if (index >= STAGES.length - 1) {
      frame.showDebrief(DEBRIEF, () => ctx.exit());
      return;
    }
    loadStage(index + 1);
  }

  function submit() {
    if (busy) return;
    const stage = STAGES[index];
    const result = stage.check(state);
    if (!result.ok) {
      if (result.notYet) frame.note(result.msg);
      else frame.miss(result.msg);
      return;
    }
    frame.clearBanner();
    if (index + 1 > cleared) {
      cleared = index + 1;
      ctx.reportStage(index);
    }
    frame.setCleared(cleared);
    frame.clear(stage.reward);
    if (index === STAGES.length - 1) ctx.reportComplete();
  }

  /* ---------------- bench controls ---------------- */

  function renderControls() {
    const stage = STAGES[index];
    const parts = [];

    if (stage.controls.includes('press')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="press">Press Together</button>');
    }
    if (stage.controls.includes('read')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="read">Read Piece</button>');
    }
    if (stage.controls.includes('needle')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="needle">Read Charge</button>');
    }

    parts.push(toolNotes(
      stage.controls.map(id => toolNoteFor(id, index + 1)).filter(Boolean)
    ));

    frame.setControls(parts.join(''));
    frame.el.controls.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => runTool(btn.dataset.tool));
    });
  }

  function plateFor(id) {
    return STAGES[index].pairs.find(p => p.id === id) || null;
  }

  async function runTool(tool) {
    if (busy) return;
    if (!state.plate) {
      frame.note('No pair selected. Tap one of the plates first.');
      return;
    }
    const item = plateFor(state.plate);

    if (tool === 'press') {
      if (bench.pressed(state.plate)) {
        frame.note(`${item.label} is already held. The clamps have nothing left to close on.`);
        return;
      }
      busy = true;
      frame.clearBanner();
      frame.setCommitEnabled(false);
      const plan = await bench.press(state.plate);
      state.pressed.add(state.plate);
      if (plan.type === 'none') soundscape.playMissBuzzer?.();
      else soundscape.playBondSnap?.();
      renderReadout(null, { head: `Clamps // ${item.label}`, body: pressLine(plan) });
      busy = false;
      frame.setCommitEnabled(true);
      return;
    }

    if (!state.side) {
      frame.note('No piece selected. Tap one of the two pieces on the plate first.');
      return;
    }

    const piece = state.side === 'left' ? item.left : item.right;
    const held = bench.pressed(state.plate);

    if (tool === 'read') {
      state.read.add(`${state.plate}:${state.side}`);
      state.readPlates.add(state.plate);
      soundscape.playScanSweep?.();
      const shells = held ? shellsAfter(item, state.side) : (piece.shells || []).slice();
      renderPiece(item, piece, shells, held, null);
      return;
    }

    if (tool === 'needle') {
      state.charged.add(`${state.plate}:${state.side}`);
      state.chargedPlates.add(state.plate);
      soundscape.playScanSweep?.();
      const charge = held ? (planJoin(item).charge?.[state.side] ?? 0) : 0;
      renderCharge(item, piece, charge, held);
    }
  }

  /** What the clamps actually did, read off the plan and nothing else. */
  function pressLine(plan) {
    if (plan.type === 'none') {
      return 'The clamps close, the two pieces touch and then spring straight back apart. Nothing held.';
    }
    if (plan.type === 'transfer') {
      const n = plan.moved;
      const from = plan.giverSide === 'left' ? 'left' : 'right';
      const to = plan.giverSide === 'left' ? 'right' : 'left';
      return `The clamps close, ${n === 1 ? 'one electron crosses' : `${n} electrons cross`} from the ${from} piece to the ${to} one, and the two stay together.`;
    }
    const p = plan.pairs;
    return `The clamps close and ${p === 1 ? 'a pair of electrons settles' : `${p} pairs of electrons settle`} in the middle, between the two pieces, which stay together.`;
  }

  /* ---------------- probe readout ---------------- */

  function onProbe(hit) {
    state.plate = hit.plateId;
    state.side = hit.side;
    bench.setSelected(hit.plateId);
    soundscape.playToggleClack?.();
    const item = plateFor(hit.plateId);
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Clamp // ${esc(item.label)}, ${hit.side === 'right' ? 'right' : 'left'}</div>
        <div class="lq-readout-code">${esc(hit.piece.code)}</div>
        <p class="lq-readout-line">Selected. Press "Read Piece" to read it, or one of the other keys.</p>
      </div>
    `);
  }

  function onSelect(id) {
    state.plate = id;
    state.side = null;
    bench.setSelected(id);
  }

  function renderPiece(item, piece, shells, held) {
    const plan = shellPlan({ shells });
    const sideName = state.side === 'right' ? 'right' : 'left';
    // The room figure is reported for a piece that could still take something
    // in. On a metal it would read as "room for seven more", which is the exact
    // opposite of what a metal does with its outer shell, and the bench has no
    // business implying it — stage four is where the player finds that out.
    const roomLine = plan.full
      ? ', full'
      : (piece.kind === 'metal' ? '' : `, room for ${plan.room} more`);
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Probe // ${esc(item.label)}, ${sideName} clamp</div>
        <div class="lq-readout-code">${esc(piece.code)}</div>
        <div class="lq-readout-hold">${piece.kind === 'metal' ? 'A metal.' : 'Not a metal.'}</div>
        <div class="lq-readout-hold">Outer shell: ${plan.outer} of ${plan.cap}${roomLine}</div>
        ${held ? '<div class="lq-readout-hold">Read after the press.</div>' : ''}
        <p class="lq-readout-line">${esc(piece.note)}</p>
      </div>
    `);
  }

  function renderCharge(item, piece, charge, held) {
    const sign = charge > 0 ? 'plus' : charge < 0 ? 'minus' : 'zero';
    const text = charge === 0 ? 'ZERO' : `${charge > 0 ? 'PLUS' : 'MINUS'} ${Math.abs(charge)}`;
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Needle // ${esc(item.label)}, ${state.side === 'right' ? 'right' : 'left'} clamp</div>
        <div class="lq-readout-code">${esc(piece.code)}</div>
        <p class="cb-charge" data-sign="${sign}">CHARGE ${text}</p>
        <p class="lq-readout-line">${held
          ? 'The needle reads the piece as it is now, after the press.'
          : 'Nothing has been pressed on this plate yet, so the piece is as it came in.'}</p>
      </div>
    `);
  }

  function renderReadout(hit, message) {
    if (message) {
      frame.setReadout(`
        <div class="lq-readout-card">
          <div class="lq-readout-head">${esc(message.head)}</div>
          <p class="lq-readout-line">${esc(message.body)}</p>
        </div>
      `);
      return;
    }
    frame.setReadout(`
      <div class="lq-readout-card lq-readout-idle">
        <div class="lq-readout-head">Bench // standby</div>
        <p class="lq-readout-line">Each plate holds two pieces in clamps, with their shells drawn round them. Tap a piece to aim the tools at it.</p>
      </div>
    `);
  }

  /* ---------------- answer widgets ---------------- */

  function renderWidget() {
    const stage = STAGES[index];
    const w = stage.widget;

    if (w.type === 'number') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-number">
            <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${state.number}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
          <p class="form-help">Between ${w.min} and ${w.max}.</p>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.number = Math.max(w.min, Math.min(w.max, state.number + Number(btn.dataset.num) * (w.step || 1)));
          frame.el.widget.querySelector('.lq-number-value').textContent = String(state.number);
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'choice') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-bin-keys">
            ${w.options.map(o => `
              <button type="button" class="choice-option lq-bin-key" data-choice="${o.id}">
                <span class="lq-bin-label">${esc(o.label)}</span>
                <span class="lq-bin-note">${esc(o.note)}</span>
              </button>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-choice]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.choice = btn.dataset.choice;
          frame.el.widget.querySelectorAll('[data-choice]')
            .forEach(o => o.classList.toggle('selected', o === btn));
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'bins') {
      const rows = w.rows || stage.pairs.map(p => p.id);
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Your answer</span>
          <div class="lq-bins">
            ${rows.map(id => `
              <div class="lq-bin-row" data-plate="${id}">
                <span class="lq-bin-sample">${esc(plateFor(id)?.label || id)}</span>
                <div class="lq-bin-keys">
                  ${w.bins.map(b => `
                    <button type="button" class="choice-option lq-bin-key" data-bin="${b.id}">
                      <span class="lq-bin-label">${esc(b.label)}</span>
                      <span class="lq-bin-note">${esc(b.note)}</span>
                    </button>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-bin]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('[data-plate]');
          const pid = row.dataset.plate;
          state.bins[pid] = btn.dataset.bin;
          row.querySelectorAll('[data-bin]').forEach(o => o.classList.toggle('selected', o === btn));
          const bin = w.bins.find(b => b.id === btn.dataset.bin);
          bench.setPlateTag(pid, bin ? bin.label : '');
          soundscape.playToggleClack?.();
        });
      });
    }
  }

  /* ---------------- go ---------------- */

  loadStage(index);

  return {
    dispose() {
      if (disposed) return;
      disposed = true;
      bench.dispose();
      frame.dispose();
    }
  };
}
