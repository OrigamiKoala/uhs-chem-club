/**
 * q5-resonance.js — Ligar, bench five: FORMAL CHARGE AND RESONANCE.
 *
 * The Lewis slate again (`q4-dots`), and its third TABLETOP (plan `bench-tabletop.md`, phase T3a), with three
 * readers that deal nothing: a CHARGE STAMP that prints, on any atom it is dropped on, the charge the atom carries in
 * the drawing as it stands; a PLUS MARK the player leaves on the atom they mean; and a BOND GAUGE that clamps across a
 * bond and reads how long it measures in the real molecule. The gauge reads the molecule and not the drawing, which
 * is what makes ozone a discovery: the drawing says one double bond and one single, and the gauge says both are the same.
 *
 *   1  mark the atom of carbon monoxide that carries a positive charge   -> formal charge
 *   2  draw carbon dioxide in its most stable form                       -> (charges near zero)
 *   3  draw thiocyanate with its minus on the stronger puller            -> (negative on the stronger puller)
 *   4  tray ozone's second bond by its measured length                   -> resonance
 *   5  draw every equivalent drawing of nitrate, one to a slate         -> resonance structures
 *   6  set the order of each nitrate bond                                -> fractional bond order
 *   7  tray carbonate's three drawings against each other                -> delocalized electrons
 *   8  find every different drawing of water                             -> (nothing to move)
 *
 * THE TABLE (`table/`, `kits/atoms.js`). The slate is the one `q4-dots` deals on: the dealing is `lewis.js` `addBond` /
 * `addLone` / `addDot` / `removeOne`, the reading is `planLewis` (`slateOf`), and a charge is `planLewis`'s own `fc`, so the
 * picture and the grade are one function. A skeleton may stand on a slate when a stage begins (`slateParts` `prefill`),
 * and a drawing may be fixed on it to be read. Nothing here authors an outcome: `SOLUTIONS` and `MISSES` are scripts of
 * the player's own drops, replayed by `verify:table` by drag and by two taps. `boss-warden` still plays the pair board
 * (`pairboard.js`), which this quest no longer uses.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { atomTable, slateOf, slateParts, slateLayout, piecesIn } from '../../table/kits/atoms.js';
import { bondsTable } from '../../table/kits/bonds.js';
import { MOLECULES, DRAWINGS, allLit, drawing, drawingKey, gaugeLength, linkKey, planLewis } from '../../engine/lewis.js';
import { EN } from '../../engine/vsepr.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bdelocali[sz]ed\b/i, introducedAt: 7 },
  { term: /\bfractional bond orders?\b/i, introducedAt: 6 },
  { term: /\bresonance structures?\b/i, introducedAt: 5 },
  { term: /\bresonance\b/i, introducedAt: 4 },
  { term: /\bformal charges?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit03/q4-dots', 'unit03/q3-distance', 'unit02/q8-trends'];

const SPEAKER = 'Vess';

/**
 * The legend lines. The stamp, the mark and the gauge are pieces you drop on the thing they read, and the briefing that
 * introduces each one says what it does once; a piece whose label says what it does owes nothing. Kept so the quest contract holds.
 */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES (120 x 64 units)
   The tray's pieces stand along the top (every stage: the ones it uses), the slates in the middle, the scratch corner
   bottom left. A slate's atoms and joints are fixed (they are targets, never grabbed); the pieces are the only things that move.
   ------------------------------------------------------------------ */

const OPTS = { words: 'shells', slate: true };
/** What each tool does, printed under the place it hangs. */
const CAPTION = { pairs: 'Adds a pair', lift: 'Takes one back', three: 'Adds three', fcstamp: 'Prints charge', mark: 'Marks an atom', gauge: 'Measures a bond' };
const tile = (kind, label, [x, y]) => ({ id: kind, kind, label, at: { x, y }, caption: CAPTION[kind] });
const PAIR = (at) => tile('pairs', 'Pair', at);
const LIFT = (at) => tile('lift', 'Lift Out', at);
const THREE = (at) => tile('three', '3 Pairs', at);
const STAMP = (at) => tile('fcstamp', 'Stamp', at);
const MARK = (at) => tile('mark', 'Mark', at);
const GAUGE = (at) => tile('gauge', 'Gauge', at);

/**
 * One stage's table: its slates (`[id, molecule, cx, cy, size, prefill?, pos?]`), the pieces on top and any extra furniture.
 * Three slates of a four-atom ion are wider than a 120-unit table: such a stage is `wide` (150 x 72, on the bonds kit, which is the
 * atom kit with more room and no scratch corner), and its pieces are a little larger so that a thumb still lands on them.
 */
function slateTable(slates, { pieces = [], fixtures = [], zones = {}, wide = false } = {}) {
  const all = [...pieces];
  const boards = [];
  for (const [id, mol, cx, cy, size, prefill, pos] of slates) {
    const part = slateParts(id, mol, slateLayout(mol, cx, cy, size, pos || null), { prefill: prefill || null });
    all.push(...part.pieces);
    boards.push(part.fixture);
  }
  if (wide) return bondsTable({ opts: OPTS, pieces: all.map(p => (p.fixed ? p : { ...p, r: 6.5 })), fixtures: [...boards, ...fixtures], zones });
  return atomTable({ opts: OPTS, pieces: all, fixtures: [...boards, ...fixtures], zones });
}

/** The skeleton of a molecule: one shared pair on every link and nothing else. */
const skeleton = mol => drawing(Object.fromEntries(MOLECULES[mol].links.map(([i, j]) => [linkKey(i, j), 1])));

/** A slate's reading as a drawing: whether it is finished, which drawing it is, and the charge each atom carries. */
function drawn(t, id, base = 0) {
  const sl = slateOf(t, id);
  return { sl, lit: allLit(sl.read), key: drawingKey(sl.mol, sl.placed), fcs: sl.read.atoms.map(a => a.fc), dealt: sl.used - base, empty: sl.used - base === 0 };
}
const markedAtoms = (t, id) => slateOf(t, id).atoms.filter(a => t.pieces[a].props.marked);

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Who Owns What',
    briefing: {
      speaker: SPEAKER,
      body: 'Drop the stamp on an atom and it prints the charge that atom carries; a mark stays on the atom you put it on. Press Submit when the table shows your answer.'
    },
    prompt: 'Mark the atom in carbon monoxide that carries a positive charge.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO', 84, 26, 52, DRAWINGS.CO]], { pieces: [STAMP([13, 10]), MARK([37, 10])] }),
    hints: [
      'Drop the stamp on each atom of the drawing and read the number it prints.',
      'Compare the electrons each atom brings with the electrons it owns, counting a bond as one and a lone pair as two.',
      'An atom that owns one electron fewer than it brought reads positive, so put the mark on that one.'
    ],
    check(state) {
      const t = state.table;
      const sl = slateOf(t, 'a');
      const marked = markedAtoms(t, 'a');
      if (!marked.length) return { ok: false, notYet: true, msg: 'Put the mark on an atom.' };
      const plus = sl.atoms.filter((id, i) => sl.read.atoms[i].fc > 0);
      if (marked.length === plus.length && marked.every(id => plus.includes(id))) return { ok: true };
      return { ok: false, msg: 'The mark is on an atom that owns as many electrons as it brought, or more: stamp both atoms and compare what they print.' };
    },
    reward: {
      log: 'Brought minus owned.',
      title: 'Formal Charge',
      body: 'An atom\'s formal charge is the electrons it brings minus the electrons it owns, counting each bond as one and each lone pair as two. In this drawing oxygen is +1 and carbon is −1.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Two Drawings',
    prompt: 'Draw carbon dioxide in the most stable way it can be drawn.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO2', 84, 26, 52]], { pieces: [PAIR([12, 10]), LIFT([12, 28]), STAMP([12, 46])] }),
    hints: [
      'Deal pairs onto the slate until every lamp is lit, then drop the stamp on each atom.',
      'Light the lamps a second way, stamp the atoms again, and compare the charges the two drawings give.',
      'Prefer the drawing whose stamped charges sit closest to zero.'
    ],
    check(state) {
      const d = drawn(state.table, 'a');
      if (d.empty) return { ok: false, notYet: true, msg: 'Deal the electrons onto the slate.' };
      if (!d.lit) return { ok: false, msg: 'A lamp is still dark, or electrons are still left to place: light every lamp first.' };
      if (d.fcs.every(q => q === 0)) return { ok: true };
      return { ok: false, msg: 'Every lamp is lit, but the lamps cannot choose between drawings. Stamp the atoms: another way of lighting them leaves the charges nearer zero.' };
    },
    reward: {
      log: 'Charges near zero win.',
      title: 'Charges Near Zero',
      body: 'Between two drawings of the same molecule, prefer the one whose atoms carry formal charges closest to zero. A +1 and a −1 on neighbouring atoms cost the drawing stability.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where the Minus Goes',
    prompt: 'Draw thiocyanate with its negative charge on the atom that pulls electrons harder.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'SCN', 84, 26, 52]], { pieces: [PAIR([12, 10]), LIFT([12, 28]), STAMP([12, 46])] }),
    hints: [
      'Deal pairs onto the slate until every lamp is lit, and stamp the atoms to see where the minus sits.',
      'Light the lamps a second way and compare which atom carries the negative charge in each drawing.',
      'Choose the drawing that puts the negative charge on the atom that pulls electrons harder.'
    ],
    check(state) {
      const t = state.table;
      const d = drawn(t, 'a');
      if (d.empty) return { ok: false, notYet: true, msg: 'Deal the electrons onto the slate.' };
      if (!d.lit) return { ok: false, msg: 'A lamp is still dark, or electrons are still left to place: light every lamp first.' };
      const syms = d.sl.mol.syms;
      const minus = d.fcs.map((q, i) => [q, i]).filter(([q]) => q < 0).map(([, i]) => i);
      const pullers = Math.max(...syms.map(s => EN[s]));
      if (minus.length === 1 && d.fcs.every(q => Math.abs(q) <= 1) && EN[syms[minus[0]]] === pullers) return { ok: true };
      return { ok: false, msg: 'Every lamp is lit, but the minus sits on the atom that pulls less. Stamp the atoms and compare which atom each drawing puts it on.' };
    },
    reward: {
      log: 'The minus goes where the pull is.',
      title: 'The Stronger Puller Takes the Minus',
      body: 'When two drawings have the same charges, the better one puts the negative charge on the atom that pulls electrons harder. Nitrogen pulls harder than sulfur, so it takes the minus here.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Same Length',
    briefing: {
      speaker: SPEAKER,
      body: 'The gauge clamps across a bond and reads how long that bond measures in the real molecule.'
    },
    prompt: 'Sort the second oxygen-oxygen bond of ozone into a tray by how its measured length compares with the first.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'O3', 80, 22, 44, DRAWINGS.O3]], {
      pieces: [GAUGE([12, 10]), { id: 'second', kind: 'card', label: 'Bond 2', at: { x: 28, y: 36 } }],
      zones: {
        trays: [
          { id: 'shorter', label: 'Shorter', at: { x: 62, y: 53 }, size: { w: 18, h: 14 } },
          { id: 'same', label: 'Same', at: { x: 83, y: 53 }, size: { w: 18, h: 14 } },
          { id: 'longer', label: 'Longer', at: { x: 104, y: 53 }, size: { w: 18, h: 14 } }
        ]
      }
    }),
    hints: [
      'Drop the gauge on each bond of the drawing and read what it measures.',
      'Compare the two readings with each other, and with what the drawing says about the two bonds.',
      'A double bond and a single bond would not normally measure alike, so sort the second bond by what the gauge says and not by the drawing.'
    ],
    check(state) {
      const t = state.table;
      const at = ['shorter', 'same', 'longer'].find(k => piecesIn(t, `tray:${k}`).some(p => p.id === 'second'));
      if (!at) return { ok: false, notYet: true, msg: 'Sort the second bond into a tray.' };
      const mol = MOLECULES.O3;
      const [a, b] = [gaugeLength(mol, DRAWINGS.O3, '0-1'), gaugeLength(mol, DRAWINGS.O3, '0-2')];
      const real = b < a ? 'shorter' : b > a ? 'longer' : 'same';
      if (at === real) return { ok: true };
      return { ok: false, msg: 'Read both bonds with the gauge and compare what it says with what the drawing says.' };
    },
    reward: {
      log: 'The measured bonds match.',
      title: 'Resonance',
      body: 'Ozone\'s drawing shows one double bond and one single, but both bonds measure the same, between single and double. The real molecule is a blend of drawings, and that blend is resonance.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Three Places',
    prompt: 'Draw every equivalent resonance structure of nitrate, one to a slate.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([
      ['a', 'NO3', 25, 36, 42, skeleton('NO3')],
      ['b', 'NO3', 75, 36, 42, skeleton('NO3')],
      ['c', 'NO3', 125, 36, 42, skeleton('NO3')]
    ], { wide: true, pieces: [PAIR([12, 60]), LIFT([36, 60]), THREE([60, 60])] }),
    hints: [
      'Deal pairs onto a slate until every lamp is lit, then do the same on the next slate.',
      'Compare the slates with each other and see which oxygen atom carries the double bond on each.',
      'Put the double bond on a different oxygen atom on each of the three slates.'
    ],
    check(state) {
      const t = state.table;
      const slates = ['a', 'b', 'c'].map(id => drawn(t, id, 6));
      if (slates.every(s => s.empty)) return { ok: false, notYet: true, msg: 'Deal the electrons onto a slate.' };
      if (slates.some(s => !s.empty && !s.lit)) return { ok: false, msg: 'A drawing does not light every lamp. Only drawings that do count.' };
      const lit = slates.filter(s => s.lit);
      const good = new Set(lit.map(s => s.key));
      if (good.size >= 3) return { ok: true };
      if (lit.length > good.size) return { ok: false, msg: 'Two slates hold the same drawing. Each needs the double bond in a different place.' };
      return { ok: false, notYet: true, msg: 'There is another place the double bond could go that you have not drawn.' };
    },
    reward: {
      log: 'The same ion, three drawings.',
      title: 'Resonance Structures',
      body: 'Drawings that differ only in where the electrons sit are resonance structures. Nitrate has three, and the real ion is a blend of all of them.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Four Over Three',
    prompt: 'Set the dial to the order of each nitrogen-oxygen bond in the real nitrate ion.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'NO3', 44, 30, 44, DRAWINGS.NO3_a]], {
      pieces: [GAUGE([12, 8])],
      fixtures: [{
        id: 'order', kind: 'tally', label: 'Each bond', at: { x: 94, y: 24 }, size: { w: 40, h: 16 }, noRun: true,
        dials: { order: { min: 1, max: 2, step: 1 / 12, value: 1, label: 'Order', labels: Array.from({ length: 13 }, (_, k) => (1 + k / 12).toFixed(2)) } }
      }]
    }),
    hints: [
      'Drop the gauge on all three bonds of the drawing and compare the readings.',
      'Compare the number of shared pairs in the whole ion with the number of bonds that hold them.',
      'Share the pairs equally among the bonds that hold them, and set the dial to that.'
    ],
    check(state) {
      const t = state.table;
      const v = t.fixtures.order.dials.order.value;
      if (v === 1) return { ok: false, notYet: true, msg: 'Set the dial to a bond order.' };
      const sl = slateOf(t, 'a');
      const bonds = Object.values(sl.placed.bonds).filter(n => n > 0);
      const order = bonds.reduce((a, n) => a + n, 0) / bonds.length;
      if (Math.abs(v - order) <= 0.02) return { ok: true };
      if (Math.abs(v - Math.round(v)) < 0.01) return { ok: false, msg: 'The gauge reads the three bonds alike, so a whole number does not describe them.' };
      return { ok: false, msg: 'Count the shared pairs in the whole drawing and share them among the bonds.' };
    },
    reward: {
      log: 'Four pairs share three bonds.',
      title: 'Fractional Bond Order',
      body: 'Four shared pairs spread over three equal bonds give each a bond order of one and a third. A bond order that is not a whole number belongs to a molecule whose electrons are shared among several bonds.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Which Counts Most',
    prompt: 'Sort each of carbonate\'s three drawings into a tray by how much it counts toward the real ion, against the others.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([
      ['a', 'CO3', 25, 26.5, 42, DRAWINGS.CO3_a],
      ['b', 'CO3', 75, 26.5, 42, DRAWINGS.CO3_b],
      ['c', 'CO3', 125, 26.5, 42, DRAWINGS.CO3_c]
    ], {
      wide: true,
      pieces: [
        { id: 'ta', kind: 'card', label: 'A', at: { x: 25, y: 48 } },
        { id: 'tb', kind: 'card', label: 'B', at: { x: 75, y: 48 } },
        { id: 'tc', kind: 'card', label: 'C', at: { x: 125, y: 48 } }
      ],
      zones: {
        trays: [
          { id: 'more', label: 'More', at: { x: 30, y: 65.4 }, size: { w: 44, h: 13.2 }, cell: 14 },
          { id: 'same', label: 'Same', at: { x: 75, y: 65.4 }, size: { w: 44, h: 13.2 }, cell: 14 },
          { id: 'less', label: 'Less', at: { x: 120, y: 65.4 }, size: { w: 44, h: 13.2 }, cell: 14 }
        ]
      }
    }),
    hints: [
      'Compare the three drawings side by side.',
      'Look for anything that differs between them apart from which oxygen atom carries the double bond.',
      'Drawings that are the same except for where one thing sits count equally.'
    ],
    check(state) {
      const t = state.table;
      const where = ['ta', 'tb', 'tc'].map(id => ['more', 'same', 'less'].find(k => piecesIn(t, `tray:${k}`).some(p => p.id === id)) || null);
      if (where.some(w => !w)) return { ok: false, notYet: true, msg: 'Sort all three drawings into trays.' };
      if (where.every(w => w === 'same')) return { ok: true };
      return { ok: false, msg: 'Compare the three drawings: is any one of them different from the others in anything but its position?' };
    },
    reward: {
      log: 'Equal drawings count equally.',
      title: 'Delocalized Electrons',
      body: 'When the drawings are equivalent they count equally, and the electrons of the double bond are spread over all three bonds. Electrons spread over more than two atoms in this way are delocalized.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Nothing to Move',
    prompt: 'Find every different drawing of water that lights all its lamps, one to a slate.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([
      ['a', 'H2O', 52, 30, 40, skeleton('H2O')],
      ['b', 'H2O', 98, 30, 40, skeleton('H2O')]
    ], { pieces: [PAIR([12, 10]), LIFT([12, 28]), STAMP([12, 46])] }),
    hints: [
      'Deal the electrons onto a slate until every lamp is lit.',
      'Try the second slate a different way, moving what you can, and see whether every lamp still lights.',
      'Check whether moving any pair in the drawing gives a second drawing that still lights every lamp.'
    ],
    check(state) {
      const t = state.table;
      const slates = ['a', 'b'].map(id => drawn(t, id, 4));
      if (slates.every(s => s.empty)) return { ok: false, notYet: true, msg: 'Deal the electrons onto a slate.' };
      // A slate that did not light is an attempt that failed, which is what the stage is for: only lit drawings are compared.
      const lit = slates.filter(s => s.lit);
      if (!lit.length) return { ok: false, msg: 'No slate has every lamp lit and every electron placed yet. Look at which atom has too few round it and which has too many.' };
      if (new Set(lit.map(s => s.key)).size === 1) return { ok: true };
      return { ok: false, msg: 'The two slates hold different drawings, and each lights every lamp: check the bonds again.' };
    },
    reward: {
      log: 'A drawing with nothing to move.',
      title: 'When There Is Nothing to Move',
      body: 'Resonance needs a multiple bond whose electrons could be drawn in another place. Water\'s bonds are single, so it has only one drawing.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drop the Stamp on an atom to read its charge.']
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
      body: 'Formal charge tells you which drawing to prefer: the one with charges nearest zero, and a negative charge on the atom that pulls harder. Where several equal drawings exist, the real molecule is a blend of them, with bonds between whole numbers.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Ozone, nitrate and carbonate all measure differently from any one drawing of them. Resonance is how a model that draws only whole bonds can still describe them.'
    },
    {
      heading: 'Next',
      body: 'A drawing says what is bonded to what, but not the shape. The next bench pushes the arms apart and reads the angles.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the formal charge of an atom that brings 6 valence electrons and owns 5 in a drawing?',
    options: [
      { id: 'a', label: '+1' },
      { id: 'b', label: '−1' },
      { id: 'c', label: '0' },
      { id: 'd', label: '+2' }
    ],
    answer: 'a',
    explanation: 'Formal charge is the valence electrons brought minus the electrons owned (lone electrons plus half the bonding electrons): 6 − 5 = +1.'
  },
  {
    question: 'Two Lewis structures of the same molecule differ only in their formal charges. Which is usually the better?',
    options: [
      { id: 'a', label: 'The one whose formal charges are closest to zero' },
      { id: 'b', label: 'The one with the most charges' },
      { id: 'c', label: 'The one with a positive charge on the most electronegative atom' },
      { id: 'd', label: 'The one with the most lone pairs' }
    ],
    answer: 'a',
    explanation: 'Structures with formal charges near zero are more stable, and a negative charge belongs on the more electronegative atom.'
  },
  {
    question: 'The two O–O bonds in ozone are both 128 pm long. What explains this?',
    options: [
      { id: 'a', label: 'Resonance: the real molecule is a blend of two equivalent structures' },
      { id: 'b', label: 'Ozone has two double bonds' },
      { id: 'c', label: 'Ozone has two single bonds' },
      { id: 'd', label: 'Ozone is nonpolar' }
    ],
    answer: 'a',
    explanation: 'Either structure alone predicts one long and one short bond. The measured equal lengths show the electrons are shared across both, which resonance describes.'
  },
  {
    question: 'What is the bond order of each N–O bond in the nitrate ion, NO₃⁻?',
    options: [
      { id: 'a', label: '1⅓' },
      { id: 'b', label: '1' },
      { id: 'c', label: '2' },
      { id: 'd', label: '1½' }
    ],
    answer: 'a',
    explanation: 'Nitrate has four shared pairs spread over three equivalent bonds, so each has a bond order of 4/3.'
  },
  {
    question: 'How many resonance structures does the carbonate ion have?',
    options: [
      { id: 'a', label: 'Three' },
      { id: 'b', label: 'Two' },
      { id: 'c', label: 'One' },
      { id: 'd', label: 'Four' }
    ],
    answer: 'a',
    explanation: 'The double bond can sit on any of the three oxygens, giving three equivalent structures.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN DROPS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the
   reducer by direct actions, by drag and by two taps. A deal is a tray piece dropped on a joint (`<slate>j<i><j>`) or on
   an atom (`<slate><i>`); a reader is dropped on the atom or the joint it reads.
   ------------------------------------------------------------------ */

const deal = (target, n = 1, tool = 'pairs') => Array.from({ length: n }, () => ({ join: [tool, target] }));
const use = (tool, target) => ({ join: [tool, target] });
const to = (piece, tray) => ({ place: { piece, to: `tray:${tray}` } });
/** Nitrate on slate `s` with its second shared pair on oxygen `k` (1 to 3): the skeleton stands, the rest is dealt. */
const nitrate = (s, k) => [
  ...deal(`${s}j0${k}`), ...deal(`${s}${k}`, 2),
  ...[1, 2, 3].filter(o => o !== k).flatMap(o => deal(`${s}${o}`, 1, 'three'))
];

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [use('fcstamp', 'a0'), use('fcstamp', 'a1'), use('mark', 'a1')],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2), use('fcstamp', 'a0'), use('fcstamp', 'a1'), use('fcstamp', 'a2')],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2), use('fcstamp', 'a0'), use('fcstamp', 'a2')],
  [use('gauge', 'aj01'), use('gauge', 'aj02'), to('second', 'same')],
  [...nitrate('a', 1), ...nitrate('b', 2), ...nitrate('c', 3)],
  [use('gauge', 'aj01'), use('gauge', 'aj02'), use('gauge', 'aj03'), { setDial: { fixture: 'order', dial: 'order', value: 4 / 3 } }],
  [to('ta', 'same'), to('tb', 'same'), to('tc', 'same')],
  [...deal('a0', 2), ...deal('b1'), ...deal('b0'), use('fcstamp', 'a0')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [use('fcstamp', 'a0'), use('mark', 'a0')],
  [...deal('aj01', 3), ...deal('aj12'), ...deal('a0'), ...deal('a2', 3)],
  [...deal('aj01'), ...deal('aj12', 3), ...deal('a0', 3), ...deal('a2')],
  [use('gauge', 'aj01'), to('second', 'longer')],
  [...nitrate('a', 1), ...nitrate('b', 1)],
  [use('gauge', 'aj01'), { setDial: { fixture: 'order', dial: 'order', value: 1.5 } }],
  [to('ta', 'more'), to('tb', 'same'), to('tc', 'same')],
  [...deal('a1'), ...deal('b1')]
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

export { planLewis, drawingKey, linkKey, gaugeLength };
