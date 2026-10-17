/**
 * q1-joins.js — Ligar, bench one: WHAT HOLDS.
 *
 * The first bench on the second world, and its first TABLETOP (plan `bench-tabletop.md`, phase
 * T1b). Tallow spent five benches on one atom at a time; this one hands the player loose atoms
 * and asks them to put two together. A pair that holds snaps (an electron visibly crosses, or a
 * pair of electrons settles in the joint); a pair that does not drifts apart when let go. A
 * stage is graded on what is on the table when Commit is pressed.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  put three pairs together and tray what held       -> a join has a name: a bond
 *   2  fill the outer shell of every atom                -> a bond fills the outer shell
 *   3  build a charged pair and a neutral pair           -> handed over, or held between
 *   4  tray four pairs by what moved                     -> ionic and covalent
 *   5  build a unit with every outer shell full          -> the counts fix the ratio
 *   6  tray three pairs by the pairs between them        -> double and triple bonds
 *   7  tray four pairs by the kind of bond, or none      -> the catalogue decides it
 *   8  fill carbon's outer shell                         -> the counts fix the recipe
 *   -- debrief: two ways to join, and why a compound has only one recipe.
 *
 * THE TABLE (`table/`, `kits/atoms.js`, the bond-scale half). Whether a pair holds is
 * `joinbench.js` `planJoin` asked against the atoms' shells as they stand; no stage declares an
 * outcome and none refuses a join: any pair may be tried, and what happens is shown. `SOLUTIONS`
 * and `MISSES` are scripts of the player's own actions, replayed by `verify:table` by drag and by
 * two taps. Words are plain until earned: the faces carry no charge until stage 3 and no shell
 * until stage 2, and a refusal says "room" before it says "shell".
 *
 * WHAT THIS BENCH DOES NOT DO. It never weighs anything and it never counts a heap. What a
 * compound weighs, and how you count atoms too small to count, are benches four and five of this
 * world.
 *
 * Everything Tallow taught is a plain word here: atom, element, compound, molecule, proton,
 * neutron, electron, shell, valence, isotope, ion, cation, anion, metal, nonmetal. What this
 * quest has to earn is on `VOCABULARY`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { atomTable, pairRead, readPiece, closureOf, moleculesOf } from '../../table/kits/atoms.js';
import { clusterOf } from '../../table/snap.js';

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

/**
 * The legend lines. A key whose label says what it does owes nothing, and this bench has no keys:
 * its atoms are dragged. Kept so the quest contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   One layout, so the furniture is always where the hand expects it (120 x 64 units): the atoms in
   pairs along the top (a pair stands close, the next pair further off), the trays under them, and
   the scratch corner bottom left. A pair is two atoms that start side by side; the table lets any
   atom join any other, and a stage only grades the pairs it handed over.
   ------------------------------------------------------------------ */

const atomAt = (id, el, x, y) => ({ id, kind: 'atom', label: el, at: { x, y }, props: { el } });
const trayAt = (id, label, x, y, w = 26, h = 14) => ({ id, label, at: { x, y }, size: { w, h } });

/** What the faces show, by stage: the charge arrives with stage 3, the shell with stage 2. */
const OPTS_1 = { words: 'plain', charges: false };
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

const STRAY = 'An atom is joined to one it did not start beside. Pull it out and join each atom to its own partner.';

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
const P1 = [['a1', 'Na', 'a2', 'Cl'], ['b1', 'Ne', 'b2', 'Ne'], ['c1', 'H', 'c2', 'H']];
const P4 = [['m1', 'Mg', 'm2', 'O'], ['n1', 'O', 'n2', 'O'], ['k1', 'K', 'k2', 'F'], ['d1', 'C', 'd2', 'H']];
const P6 = [['u1', 'H', 'u2', 'H'], ['v1', 'O', 'v2', 'O'], ['w1', 'N', 'w2', 'N']];
const P7 = [['x1', 'Ca', 'x2', 'S'], ['y1', 'C', 'y2', 'O'], ['z1', 'Ar', 'z2', 'H'], ['q1', 'Al', 'q2', 'Cl']];

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Press Them Together',
    briefing: {
      speaker: SPEAKER,
      body: 'Drag one atom onto another to press the two together. The loose atoms in the corner are yours to play with.'
    },
    prompt: 'Tray the pairs of atoms that hold together apart from the pairs that spring apart.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_1,
      pieces: pairsAt(12, [14, 54, 94], P1),
      zones: { trays: [trayAt('held', 'Held', 40, 34, 44), trayAt('apart', 'Sprang apart', 96, 34, 24)] }
    }),
    hints: [
      'Drag an atom onto the one it started beside and let go.',
      'Watch each pair after you let go: one stays joined and another drifts back apart.',
      'Press all three pairs, then tray the ones that stayed joined apart from the ones that did not.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P1, ['held', 'apart']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Tray all three pairs before you commit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      // Held pairs stay joined; a pair that sprang apart is two loose atoms.
      const want = [true, false, true];
      if (pairs.some((p, i) => (p.tray === 'held') !== want[i])) {
        return { ok: false, msg: 'A pair is under the wrong heading. Press it together again and watch whether the two atoms stay joined.' };
      }
      if (pairs.some((p, i) => p.joined !== want[i])) {
        return { ok: false, msg: 'A pair under Held has to be joined, and one under Sprang apart has to be two loose atoms.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sodium and chlorine held. Neon and neon sprang apart. Hydrogen and hydrogen held.',
      title: 'What Holds Is Called a Bond',
      body: 'Two atoms that stay together after you let go are held by a chemical bond, and the first and last pairs each made one. The middle pair made nothing at all. Every solid thing on this planet is atoms held to other atoms by bonds.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Why B Would Not Hold',
    briefing: {
      speaker: SPEAKER,
      body: 'The dots round an atom\'s rim are the electrons on its outer shell. A ring lights inside the rim when that shell is full.'
    },
    prompt: 'Fill the outer shell of every atom on the table.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_2,
      pieces: pairsAt(14, [14, 54, 94], P1)
    }),
    hints: [
      'Drag an atom onto another and watch the dots on its rim.',
      'Compare the rings: a lit one means that atom\'s outer shell is full, and some atoms start lit.',
      'Join atoms until every ring is lit, and leave alone any atom that already has one.'
    ],
    check(state) {
      const t = state.table;
      const atoms = Object.values(t.pieces).filter(p => p.kind === 'atom' && !p.props.scratch);
      const open = atoms.filter(p => !readPiece(p.id, t).full);
      if (!open.length) return { ok: true };
      if (!Object.values(t.links).length) return { ok: false, notYet: true, msg: 'Press some atoms together first.' };
      return { ok: false, msg: 'An atom\'s outer shell is not full yet: the ring on its face is dark.' };
    },
    reward: {
      log: 'The neon atoms started full. Every join filled a shell.',
      title: 'A Bond Fills the Outer Shell',
      body: 'Both atoms of every pair that joined came out of the press with a full outer shell. For most atoms a full outer shell holds eight electrons, or two for the innermost shell. The neon pair began with both outer shells full, so neither atom needed a bond.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where the Electron Went',
    briefing: {
      speaker: SPEAKER,
      body: 'A plus or a minus on an atom\'s face is the charge it carries after a join.'
    },
    prompt: 'Build one pair whose atoms end up charged and one pair whose atoms end up neutral.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: [atomAt('na', 'Na', 24, 14), atomAt('cl', 'Cl', 48, 14), atomAt('h1', 'H', 80, 14), atomAt('h2', 'H', 104, 14)]
    }),
    hints: [
      'Join two atoms and read the plus or minus that appears on each face.',
      'Compare a pair whose faces show a plus and a minus with a pair whose faces show nothing at all.',
      'Try other pairings of the four atoms until one pair is charged and the other is not.'
    ],
    check(state) {
      const t = state.table;
      const mols = moleculesOf(t);
      const charge = m => m.ids.map(id => readPiece(id, t).charge);
      const pairsOnly = mols.filter(m => m.ids.length === 2);
      const charged = pairsOnly.filter(m => charge(m).every(q => q !== 0));
      const neutral = pairsOnly.filter(m => charge(m).every(q => q === 0));
      if (!mols.length) return { ok: false, notYet: true, msg: 'Join some atoms first.' };
      if (charged.length && neutral.length) return { ok: true };
      if (!charged.length && !neutral.length) return { ok: false, msg: 'Neither pair is finished yet: join the atoms two by two.' };
      if (!charged.length) return { ok: false, msg: 'No pair on the table has charged atoms. Try a different pairing of the atoms.' };
      return { ok: false, msg: 'No pair on the table is neutral. Try a different pairing of the atoms.' };
    },
    reward: {
      log: 'One pair read plus one and minus one. The other read zero and zero.',
      title: 'Two Ways to Fill a Shell',
      body: 'In one pair an atom handed an electron over, which left a cation — an atom missing an electron — reading plus one and an anion — an atom holding an extra electron — reading minus one, and the pull between those opposite charges is what holds them together. In the other pair neither atom would give one up, so the two hold a pair of electrons between them and each of them counts that pair as its own. Every bond you will ever meet is one of those two.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Which Way It Goes',
    prompt: 'Tray each pair of atoms by whether electrons are handed over or shared between them.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: [...pairsAt(9, [14, 70], P4.slice(0, 2)), ...pairsAt(24, [14, 70], P4.slice(2))],
      zones: { trays: [trayAt('handed', 'Handed over', 66, 49, 26, 22), trayAt('shared', 'Held between', 98, 49, 26, 22)] }
    }),
    hints: [
      'Join each pair, then look at what moved between its two atoms.',
      'In one kind of join an electron crosses over and charges appear; in the other a pair settles between the atoms.',
      'Tray the pairs where charges appeared apart from the pairs where a pair of electrons sits between.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P4, ['handed', 'shared']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Tray all four pairs before you commit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      if (pairs.some(p => !p.joined)) return { ok: false, msg: 'A pair in a tray has not been pressed together, so nothing is known about it yet.' };
      const want = ['transfer', 'share', 'transfer', 'share'];
      const tray = { transfer: 'handed', share: 'shared' };
      if (pairs.some((p, i) => p.type !== want[i] || p.tray !== tray[want[i]])) {
        return { ok: false, msg: 'A pair is under the wrong heading. Look at what moved between its two atoms, and at the charges on their faces.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two pairs handed over, two held between.',
      title: 'Ionic and Covalent',
      body: 'A metal and a nonmetal hand electrons over and are then held by the pull between the ions that makes, which is an ionic bond. Two nonmetals both refuse to give one up, so they hold pairs between them instead, which is a covalent bond. Which one you get is decided by the two elements, and the catalogue already says which elements are metals.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'How Many It Takes',
    briefing: {
      speaker: SPEAKER,
      body: 'The needle reads the net charge of everything joined to the magnesium atom.'
    },
    prompt: 'Build a unit in which every atom\'s outer shell is full and the needle reads zero.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: [atomAt('mg', 'Mg', 24, 22), atomAt('cl1', 'Cl', 60, 14), atomAt('cl2', 'Cl', 78, 14), atomAt('cl3', 'Cl', 96, 14), atomAt('cl4', 'Cl', 60, 30)],
      fixtures: [{ id: 'needle', kind: 'needle', label: 'Unit charge', at: { x: 99, y: 38 }, size: { w: 34, h: 16 }, noRun: true, props: { cluster: 'mg', range: 3 } }]
    }),
    hints: [
      'Drag chlorine atoms onto the magnesium atom one at a time and watch its face.',
      'Magnesium keeps handing electrons over until its outer shell is gone, and each chlorine takes only so many.',
      'Add one chlorine at a time and stop when the magnesium atom has nothing left to give.'
    ],
    check(state) {
      const t = state.table;
      const unit = clusterOf(t, 'mg');
      if (unit.length === 1) return { ok: false, notYet: true, msg: 'Join something to the magnesium atom first.' };
      if (!closureOf(unit, t).closed) return { ok: false, msg: 'An atom in the unit has an outer shell that is not full yet: look for the dark ring on its face.' };
      return { ok: true };
    },
    reward: {
      log: 'Magnesium took chlorines until nothing was left to give.',
      title: 'The Counts Fix the Ratio',
      body: 'A magnesium atom has two electrons to hand over and a chlorine atom takes exactly one each, so it takes two chlorines to clear one magnesium and cancel the charges to zero. A sodium atom has only one to give, so it needs only one partner. The ratio in an ionic compound falls straight out of the counts on the outer shells.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'More Than One Pair',
    prompt: 'Tray each pair of atoms by how many electron pairs end up held between them.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: pairsAt(12, [14, 54, 94], P6),
      zones: { trays: [trayAt('one', 'One pair', 22, 34), trayAt('two', 'Two pairs', 60, 34), trayAt('three', 'Three pairs', 98, 34)] }
    }),
    hints: [
      'Join each pair and count the rods between its two atoms.',
      'Compare how many places each kind of atom has open on its outer shell before the join.',
      'Each rod is one shared pair, so tray each pair under the number of rods you counted.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P6, ['one', 'two', 'three']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Tray all three pairs before you commit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      if (pairs.some(p => !p.joined)) return { ok: false, msg: 'A pair in a tray has not been pressed together, so there is nothing between its atoms to count.' };
      const want = ['one', 'two', 'three'];
      if (pairs.some((p, i) => p.tray !== want[i])) {
        return { ok: false, msg: 'A pair has a different number of electron pairs in the middle: count them between its atoms.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One pair, two pairs, three pairs.',
      title: 'Double and Triple Bonds',
      body: 'An atom with two places to fill holds two pairs with its partner, and one with three places holds three, because each shared pair fills one place on each side at once. One shared pair is a single bond, two is a double bond and three is a triple bond. The more pairs a join holds, the shorter and the stronger it is.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Read It Off the Catalogue',
    prompt: 'Tray each pair of atoms by what kind of bond it forms, or none.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: pairsAt(10, [10, 40, 70, 100], P7),
      zones: { trays: [trayAt('ionic', 'Ionic', 30, 31, 50), trayAt('covalent', 'Covalent', 72, 31), trayAt('none', 'No bond', 102, 31, 24)] }
    }),
    hints: [
      'Press each pair together and look at what happened, if anything.',
      'Look at which atom of a pair is a metal, and whether either outer shell starts full.',
      'Go pair by pair: if either atom has a full outer shell it makes no bond; otherwise a metal with a nonmetal is ionic and two nonmetals are covalent.'
    ],
    check(state) {
      const t = state.table;
      const pairs = readPairs(t, P7, ['ionic', 'covalent', 'none']);
      if (pairs.some(p => !p.filed)) return { ok: false, notYet: true, msg: 'Tray all four pairs before you commit.' };
      if (pairs.some(p => p.split)) return { ok: false, msg: 'The two atoms of a pair belong in the same tray.' };
      if (pairs.some(p => p.stray)) return { ok: false, msg: STRAY };
      const want = ['ionic', 'covalent', 'none', 'ionic'];
      const type = { ionic: 'transfer', covalent: 'share', none: null };
      if (pairs.some((p, i) => p.tray !== want[i] || p.type !== type[want[i]])) {
        return { ok: false, msg: 'A pair is under the wrong heading. Read both atoms: is either one a metal, and is either outer shell already full?' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Two ionic, one covalent, one that will not join.',
      title: 'The Catalogue Decides It',
      body: 'A metal with a nonmetal gives an ionic bond, two nonmetals give a covalent bond, and an atom whose outer shell is already full gives no bond at all. After a few pairs you do not have to press anything to know which is which. Where two elements sit in the catalogue is enough to say what they will do.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Build the Recipe',
    prompt: 'Fill carbon\'s outer shell using only hydrogen atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      opts: OPTS_3,
      pieces: [
        atomAt('c', 'C', 24, 18),
        ...['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].map((id, k) => atomAt(id, 'H', 52 + k * 12, 14 + (k % 2) * 14))
      ]
    }),
    hints: [
      'Drag hydrogen atoms onto the carbon atom one at a time.',
      'Watch the ring on the carbon atom and the dots on its rim after each one.',
      'Keep adding until the carbon atom\'s ring is lit, and see how many hydrogen atoms that took.'
    ],
    check(state) {
      const t = state.table;
      const unit = clusterOf(t, 'c');
      if (unit.length === 1) return { ok: false, notYet: true, msg: 'Join some hydrogen atoms to the carbon atom first.' };
      if (!readPiece('c', t).full) return { ok: false, msg: 'The carbon atom still has room: the ring on its face is dark.' };
      if (unit.some(id => t.pieces[id].props.el !== 'C' && t.pieces[id].props.el !== 'H')) return { ok: false, msg: 'Something other than hydrogen is joined to the carbon atom.' };
      return { ok: true };
    },
    reward: {
      log: 'Carbon took hydrogens until its shell was full.',
      title: 'The Counts Fix the Recipe',
      body: 'A carbon atom has four open spots and each hydrogen fills one, so one carbon holds exactly four of them. A compound has one fixed recipe because the outer shells leave it no choice.',
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
      body: 'How many electrons each outer shell has to move is a count, not a preference. That count decides how many of each element end up in a compound, which is why one compound only ever has one recipe.'
    },
    {
      heading: 'Next',
      body: 'The arches outside are standing on joins like these. The next bench takes a whole block of each element and asks what it does when you hit it, heat it and put a current through it.'
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one
   through the reducer by direct actions, by drag and by two taps, and every join in it is the
   kit's planner saying it holds. A pair that does not hold is tried all the same, and drifts apart.
   ------------------------------------------------------------------ */

const tray = (piece, id) => ({ place: { piece, to: `tray:${id}` } });
const join = (a, b) => ({ join: [a, b] });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [join('a1', 'a2'), join('c1', 'c2'), join('b1', 'b2'), tray('a1', 'held'), tray('c1', 'held'), tray('b1', 'apart'), tray('b2', 'apart')],
  [join('a1', 'a2'), join('c1', 'c2'), join('b1', 'b2')],
  [join('h1', 'h2'), join('na', 'cl')],
  [
    join('m1', 'm2'), join('n1', 'n2'), join('k1', 'k2'), join('d1', 'd2'),
    tray('m1', 'handed'), tray('k1', 'handed'), tray('n1', 'shared'), tray('d1', 'shared')
  ],
  [join('cl1', 'mg'), join('cl2', 'mg')],
  [join('u1', 'u2'), join('v1', 'v2'), join('w1', 'w2'), tray('u1', 'one'), tray('v1', 'two'), tray('w1', 'three')],
  [
    join('x1', 'x2'), join('y1', 'y2'), join('z1', 'z2'), join('q1', 'q2'),
    tray('x1', 'ionic'), tray('q1', 'ionic'), tray('y1', 'covalent'), tray('z1', 'none'), tray('z2', 'none')
  ],
  [join('h1', 'c'), join('h2', 'c'), join('h3', 'c'), join('h4', 'c'), join('h5', 'c')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [join('a1', 'a2'), join('c1', 'c2'), join('b1', 'b2'), tray('a1', 'held'), tray('c1', 'held'), tray('b1', 'held'), tray('b2', 'held')],
  [join('a1', 'a2')],
  [join('h1', 'h2')],
  [
    join('m1', 'm2'), join('n1', 'n2'), join('k1', 'k2'), join('d1', 'd2'),
    tray('m1', 'handed'), tray('k1', 'handed'), tray('n1', 'handed'), tray('d1', 'shared')
  ],
  [join('cl1', 'mg')],
  [join('u1', 'u2'), join('v1', 'v2'), join('w1', 'w2'), tray('u1', 'one'), tray('v1', 'one'), tray('w1', 'three')],
  [
    join('x1', 'x2'), join('y1', 'y2'), join('z1', 'z2'), join('q1', 'q2'),
    tray('x1', 'ionic'), tray('q1', 'ionic'), tray('y1', 'covalent'), tray('z1', 'covalent'), tray('z2', 'covalent')
  ],
  [join('h1', 'c'), join('h2', 'c'), join('h3', 'c')]
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
