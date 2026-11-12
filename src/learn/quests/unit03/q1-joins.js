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
 *   1  PREDICT: what happens when two hydrogen atoms are brought together?   (no instrument; the wrong idea is a card)
 *   2  drag a hydrogen pair along the energy curve and leave it where it settles -> why two atoms bond (teaching pass 2026-11-12;
 *      this stage was `q3-distance` stage 1, moved here so the reason for a bond is seen before the full-shell rule is used)
 *   3  press four pairs, sort the ones that bonded                            -> which atoms bond
 *   4  sort four pairs by whether an electron was transferred or a pair shared -> electronegativity, ionic and covalent bonds
 *   5  bond chlorine atoms to one magnesium atom until nothing is charged      -> the counts fix the ratio
 *   6  sort four pairs by the number of pairs between them                     -> single, double and triple bonds
 *   -- debrief: why atoms bond, the two kinds of bond, and why a compound has one formula.
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
import { atomTable, pairRead, closureOf } from '../../table/kits/atoms.js';
import { bondsTable, wellRead } from '../../table/kits/bonds.js';
import { PAIRS } from '../../engine/bonddata.js';
import { clusterOf } from '../../table/snap.js';
import { applyNotes } from '../../table/notes.js';
import { predictStage, testPrompt, verdictLine, wells, wellRow } from './_ligar.js';

export const meta = { stageCount: 6 };

/**
 * The stage whose reward card first says each term (`verify:learn` holds the card to it; `verify:table` keeps a Tour step from
 * using the term earlier). The specific entries come first: the list is searched in order.
 */
export const VOCABULARY = [
  { term: /\bdouble bonds?\b/i, introducedAt: 6 },
  { term: /\btriple bonds?\b/i, introducedAt: 6 },
  { term: /\belectronegativ\w*/i, introducedAt: 4 },
  { term: /\bionic\b/i, introducedAt: 4 },
  { term: /\bcovalent\b/i, introducedAt: 4 },
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

/** The legend lines. This bench has no keys: its atoms are dragged. Kept so the quest contract (`toolNoteFor`) holds. */
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
/** Stage 3 prints how hard each atom pulls on shared electrons, so the gap between two atoms can be compared before a pair is pressed. */
const OPTS_PULL = { ...OPTS_3, pull: true };

/** The atoms of one stage laid in pairs along y: `[[idA, elA, idB, elB], ...]` at the given x of each pair's left atom. */
function pairsAt(y, xs, list) {
  return list.flatMap(([ia, ea, ib, eb], k) => [atomAt(ia, ea, xs[k], y), atomAt(ib, eb, xs[k] + 12, y)]);
}

/**
 * The same pairs in a 2 x 2 grid (rows `ys`, left atoms at `xs`), with the pairs far enough apart that a drag toward a partner can never
 * land on a stranger.
 */
function pairsGrid(ys, xs, list) {
  return list.flatMap(([ia, ea, ib, eb], k) => {
    const x = xs[k % 2];
    const y = ys[Math.floor(k / 2)];
    return [atomAt(ia, ea, x, y), atomAt(ib, eb, x + 16, y)];
  });
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
   THE SIX STAGES
   ------------------------------------------------------------------ */
const P2 = [['a1', 'Na', 'a2', 'Cl'], ['b1', 'Ne', 'b2', 'Ne'], ['c1', 'H', 'c2', 'H'], ['d1', 'Ar', 'd2', 'H']];
const P3 = [['m1', 'Mg', 'm2', 'O'], ['h1', 'H', 'h2', 'Cl'], ['k1', 'K', 'k2', 'F'], ['d1', 'C', 'd2', 'H']];
const P5 = [['u1', 'H', 'u2', 'H'], ['v1', 'O', 'v2', 'O'], ['w1', 'N', 'w2', 'N'], ['x1', 'F', 'x2', 'F']];

/** Stage 2: how near the lowest point of the curve the pair must be left (pm), and whether it has been dragged at all. */
const SETTLE_TOL = Math.max(6, Math.round(PAIRS['H-H'].r0 * 0.1));
const TRAY_NAME = { bonded: 'Formed a bond', apart: 'Did not bond', ionic: 'Ionic bond', covalent: 'Covalent bond', one: 'Single bond', two: 'Double bond', three: 'Triple bond' };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Two of the Same',
    prompt: 'Two hydrogen atoms are brought together: what happens?',
    cards: GUESSES,
    hints: [
      'Lay one of the three cards in the slot.',
      'Each hydrogen atom is one positive nucleus and one negative electron, so think about what each nucleus does to the other atom\'s electron.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage brings two hydrogen atoms together.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What Holds Two Atoms',
    briefing: {
      speaker: SPEAKER,
      body: 'Each nucleus attracts the other atom\'s electron, and the two nuclei repel each other. The curve shows the energy of the pair at each distance, and atoms left alone move toward lower energy.'
    },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'at what distance apart do two hydrogen atoms settle?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      fixtures: [wells('w', [wellRow('a', 'H-H', 'Pair', 200)], { at: { x: 67, y: 34 }, size: { w: 130, h: 62 }, top: 14, margin: 10, discs: true, grab: 7, discK: 0.17, components: true, plot: { y0: 26, foot: 9 } })]
    }),
    hints: [
      'Drag the right-hand atom along the track and watch the curve and the two dotted traces being drawn.',
      'Compare how fast the attraction trace and the repulsion trace change as the atoms get very close.',
      'Find the distance where moving closer stops lowering the energy, and ask which of the two traces has taken over there.'
    ],
    check(state) {
      const r = wellRead(state.table, 'w').rows[0];
      if (r.lo === r.hi) return { ok: false, notYet: true, msg: 'Drag the atom along the track to draw the curve.' };
      if (Math.abs(r.gap - r.r0) <= SETTLE_TOL) return { ok: true };
      return r.gap < r.r0
        ? { ok: false, msg: `At ${r.gap} pm the repulsion trace has risen steeply and the energy is higher than it is a little further out.` }
        : { ok: false, msg: `At ${r.gap} pm the energy is still falling as the atoms come closer.` };
    },
    get reward() {
      return {
        log: 'The lowest point of the curve.',
        title: 'Chemical Bond',
        body: `${verdictLine(QUEST_KEY, 'hold')}The pair settles where the energy is lowest: close enough for each nucleus to attract both electrons, not so close that the nuclei repel strongly. Atoms held together this way are joined by a chemical bond.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Press Them Together',
    prompt: 'Which pairs of atoms form a bond?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_2,
      pieces: pairsGrid([10, 27], [22, 82], P2),
      zones: { trays: [trayAt('bonded', TRAY_NAME.bonded, 36, 50, 44, 16), trayAt('apart', TRAY_NAME.apart, 92, 50, 44, 16)] }
    }),
    hints: [
      'Drag one atom of a pair onto the other, let go, and watch whether the two stay joined.',
      'Compare the outer shells drawn on the atoms in the pairs that stayed joined with those in the pairs that came apart.',
      'A full outer shell has no place for another electron, so look for a lit ring in each pair before you press it.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P2, ['bonded', 'apart']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Sort all four pairs into the trays before you submit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      // A bonded pair stays joined; a pair that sprang apart is two loose atoms.
      const want = [true, false, true, false];
      if (pairs.some(p => p.tray === 'bonded' && !p.joined)) return { ok: false, msg: `The atoms of a pair in "${TRAY_NAME.bonded}" are not joined on the table.` };
      if (pairs.some(p => p.tray === 'apart' && p.joined)) return { ok: false, msg: `The atoms of a pair in "${TRAY_NAME.apart}" are joined on the table.` };
      if (pairs.some((p, i) => (p.tray === 'bonded') !== want[i])) return { ok: false, msg: `A pair in "${TRAY_NAME.apart}" has not been pressed together yet.` };
      return { ok: true };
    },
    reward: {
      log: 'Sodium with chlorine bonded. Neon with neon did not. Hydrogen with hydrogen bonded. Argon with hydrogen did not.',
      title: 'Which Atoms Bond',
      body: 'Neon and argon have full outer shells, with no place for another electron, so the pairs with them did not bond. In the two pairs that bonded, each atom ended with a full outer shell.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Where the Electron Went',
    briefing: {
      speaker: SPEAKER,
      body: 'Electronegativity, the number on each atom, is how strongly that atom pulls on electrons it shares with another atom. In an ionic bond one atom takes electrons from the other and the two ions attract; in a covalent bond the atoms share electrons in pairs.'
    },
    prompt: 'Which pairs of atoms form an ionic bond and which a covalent bond?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_PULL,
      pieces: pairsGrid([10, 27], [22, 82], P3),
      zones: { trays: [trayAt('ionic', TRAY_NAME.ionic, 36, 50, 44, 16), trayAt('covalent', TRAY_NAME.covalent, 92, 50, 44, 16)] }
    }),
    hints: [
      'Press each pair together and watch whether an electron crosses to one atom or a pair settles between the two.',
      'Compare the two electronegativity values in the pairs where an electron crossed with those in the pairs that share.',
      'The atom with the higher electronegativity pulls the electrons harder, so think about what a very large difference does to a shared pair.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P3, ['ionic', 'covalent']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Sort all four pairs into the trays before you submit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      if (pairs.some(p => !p.joined)) return { ok: false, msg: 'A pair in a tray has not been pressed together.' };
      const want = ['transfer', 'share', 'transfer', 'share'];
      const tray = { transfer: 'ionic', share: 'covalent' };
      const bad = pairs.findIndex((p, i) => p.tray !== tray[want[i]]);
      if (bad >= 0) {
        return { ok: false, msg: pairs[bad].tray === 'ionic' ? `A pair in "${TRAY_NAME.ionic}" shows no charge on its atoms: no electron crossed.` : `A pair in "${TRAY_NAME.covalent}" shows a plus on one atom and a minus on the other: an electron crossed.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two pairs transferred an electron, two shared a pair.',
      title: 'Ionic and Covalent Bonds',
      body: 'Where the electronegativities differ greatly, one atom takes the electrons and the ions attract (ionic); where they are close, pairs are shared (covalent). No single value of the difference divides the two kinds sharply.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'How Many It Takes',
    briefing: {
      speaker: SPEAKER,
      body: 'An atom that loses electrons becomes a positive ion, and one that gains them a negative ion. Ions bond in the numbers that make their charges add up to zero.'
    },
    prompt: 'How many chlorine atoms does one magnesium atom bond with?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: [atomAt('mg', 'Mg', 24, 22), atomAt('cl1', 'Cl', 60, 14), atomAt('cl2', 'Cl', 78, 14), atomAt('cl3', 'Cl', 96, 14), atomAt('cl4', 'Cl', 60, 30)],
      fixtures: [{ id: 'needle', kind: 'needle', label: 'Total charge', at: { x: 99, y: 38 }, size: { w: 34, h: 16 }, noRun: true, props: { cluster: 'mg', range: 3 } }]
    }),
    hints: [
      'Drag chlorine atoms onto the magnesium atom; the charge meter reads the total charge of everything joined to it.',
      'Compare the charge printed on the magnesium atom, and the electrons left in its outer shell, after each chlorine joins.',
      'Every electron a chlorine atom gains comes from magnesium, so compare what one chlorine can take with what magnesium\'s outer shell holds.'
    ],
    check(state) {
      const t = state.table;
      const unit = clusterOf(t, 'mg');
      if (unit.length === 1) return { ok: false, notYet: true, msg: 'Join a chlorine atom to the magnesium atom first.' };
      if (!closureOf(unit, t).closed) return { ok: false, msg: 'The ring on one of the joined atoms is not lit: that atom\'s outer shell is not yet a full one.' };
      return { ok: true };
    },
    reward: {
      log: 'Magnesium bonded with two chlorines.',
      title: 'Formula Ratios',
      body: 'Magnesium loses two electrons and each chlorine gains one, so one magnesium bonds with two chlorines and the charges add up to zero. This is written MgCl₂.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Multiple Bonds',
    briefing: {
      speaker: SPEAKER,
      body: 'Two atoms can share more than one pair of electrons. One shared pair is a single bond, two a double bond and three a triple bond.'
    },
    prompt: 'How many electron pairs does each pair of atoms share?',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: pairsGrid([10, 27], [22, 82], P5),
      zones: { trays: [trayAt('one', TRAY_NAME.one, 24, 50, 28, 16), trayAt('two', TRAY_NAME.two, 60, 50, 28, 16), trayAt('three', TRAY_NAME.three, 96, 50, 28, 16)] }
    }),
    hints: [
      'Press a pair together to see the pairs of electrons that settle between its atoms.',
      'Count how many electrons each atom is short of a full outer shell: hydrogen\'s is full with two, the others with eight.',
      'Each shared pair counts toward both atoms\' outer shells, so compare the pairs shared with the electrons each atom was short.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P5, ['one', 'two', 'three']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Sort all four pairs into the trays before you submit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      const want = ['one', 'two', 'three', 'one'];
      const bad = pairs.findIndex((p, i) => p.tray !== want[i]);
      if (bad >= 0) return { ok: false, msg: `A pair in "${TRAY_NAME[pairs[bad].tray]}" does not show that many pairs of electrons between its atoms when pressed together.` };
      return { ok: true };
    },
    reward: {
      log: 'One pair, two pairs, three pairs.',
      title: 'Double and Triple Bonds',
      body: 'H₂ and F₂ share one pair, O₂ two (a double bond) and N₂ three (a triple bond). In these pairs each atom shares as many pairs as it was short of a full outer shell.',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  2: ['Drag the right-hand atom along its track.'],
  3: ['A ring lights on an atom when its outer shell is full.'],
  4: ['The number on each atom is its electronegativity.']
};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Two atoms bond when being together lowers their energy: each nucleus attracts the other atom\'s electrons. Atoms with full outer shells do not bond.'
    },
    {
      heading: 'Two Kinds of Bond',
      body: 'Where electronegativities differ greatly, an electron is transferred and the ions attract: an ionic bond. Where they are close, electrons are shared in pairs: a covalent bond, which can be single, double or triple.'
    },
    {
      heading: 'Next',
      body: 'The next bench tests solids: which conduct, which melt easily and which break.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one
   through the reducer by direct actions, by drag and by two taps, and every join in it is the
   kit's planner saying it holds. A pair that does not hold is tried all the same, and drifts apart.
   ------------------------------------------------------------------ */

const tray = (piece, id) => ({ place: { piece, to: `tray:${id}` } });
const hand = value => ({ setDial: { fixture: 'w', dial: 'a', value } });
const join = (a, b) => ({ join: [a, b] });
const to = (piece, zone) => ({ place: { piece, to: `slot:${zone}` } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [to('hold', 'guess')],
  [hand(90), hand(40), hand(74)],
  [
    join('a1', 'a2'), join('c1', 'c2'), join('b1', 'b2'), join('d1', 'd2'),
    tray('a1', 'bonded'), tray('c1', 'bonded'), tray('b1', 'apart'), tray('b2', 'apart'), tray('d1', 'apart'), tray('d2', 'apart')
  ],
  [
    join('m1', 'm2'), join('h1', 'h2'), join('k1', 'k2'), join('d1', 'd2'),
    tray('m1', 'ionic'), tray('k1', 'ionic'), tray('h1', 'covalent'), tray('d1', 'covalent')
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
  [hand(120)],
  [
    join('a1', 'a2'), join('c1', 'c2'), join('b1', 'b2'), join('d1', 'd2'),
    tray('a1', 'bonded'), tray('c1', 'apart'), tray('b1', 'apart'), tray('b2', 'apart'), tray('d1', 'apart'), tray('d2', 'apart')
  ],
  [
    join('m1', 'm2'), join('h1', 'h2'), join('k1', 'k2'), join('d1', 'd2'),
    tray('m1', 'ionic'), tray('k1', 'ionic'), tray('h1', 'ionic'), tray('d1', 'covalent')
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
