/**
 * q6-weigh.js — Tallow, bench six: COUNTING BY WEIGHT.
 *
 * The sixth bench on Tallow, and the sixth on the TABLETOP (plan `bench-tabletop.md`, phase T2): the
 * mass kit (`table/kits/mass.js`) on the sack scale. Bench three counted molecules because there were
 * few enough to count; a real drum holds more atoms than anyone could count in a lifetime, and every
 * instrument in the yard reports a MASS. This bench is the bridge between mass and count.
 *
 * THE ORDER:
 *   1  predict formula mass of methane (CH4)
 *   2  weigh methane on the scale to confirm
 *   3  counting by weighing: the mole (72 g water drum -> 4 moles)
 *   4  rank three drums by how many atoms each holds
 *   5  percent by mass in water (oxygen's share)
 *   6  atoms in a weighed sample (36 g water -> hydrogen atoms)
 *   7  empirical formula from element masses (24 g C and 6 g H -> 3 H per C)
 *   8  molecular formula (CH3 unit in 30.0 g/mol molecule -> C2H6)
 *   -- debrief: why every real measurement is a mass, and what comes after it.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { piecesIn, formulaOf, scratchCorner, TABLE_BOUNDS, PARKED_RECORDER } from '../../table/kits/atoms.js';
import {
  massTable, crate, speciesMass, scaleRead, panLoad
} from '../../table/kits/mass.js';

export const meta = { stageCount: 8 };

/** When each withheld word is earned. Specific terms first. */
export const VOCABULARY = [
  { term: /\bformula mass\b/i, introducedAt: 1 },
  { term: /\bpercent by mass\b/i, introducedAt: 5 },
  { term: /\bempirical formula\b/i, introducedAt: 7 },
  { term: /\bmolecular formula\b/i, introducedAt: 8 },
  { term: /\bavogadro\w*\b/i, introducedAt: 3 },
  { term: /\bmolar\b/i, introducedAt: 3 },
  { term: /\bmoles?\b/i, introducedAt: 3 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE LISTED MASSES
   The figures charted at Tallow site three and measured at site five.
   Nothing on this bench may change one.
   ------------------------------------------------------------------ */
export const CARD_MASS = {
  'hydrogen': 1.0,
  'carbon': 12.0,
  'oxygen': 16.0,
  'sodium': 23.0,
  'chlorine': 35.5
};

export function toolNoteFor() { return null; }

export function molesOf(species, grams) {
  return grams / speciesMass(species);
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Predicting Formula Mass',
    prompt: 'Predict the mass of one molecule of methane (CH₄) in atomic mass units.',
    entry: { id: 'ans', label: 'Mass of CH₄', unit: 'u' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      bounds: { ...TABLE_BOUNDS },
      recorder: PARKED_RECORDER,
      pieces: [
        { id: 'c', kind: 'atom', label: 'C', at: { x: 28, y: 36 }, props: { el: 'C' } },
        ...[44, 58, 72, 86].map((x, i) => ({ id: `h${i + 1}`, kind: 'atom', label: 'H', at: { x, y: 36 }, props: { el: 'H' } }))
      ],
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'Atomic masses', at: { x: 58, y: 16 }, size: { w: 48, h: 16 }, noRun: true, props: { lines: ['carbon (C) 12.0 u', 'hydrogen (H) 1.0 u'] } }
      ]
    }),
    hints: [
      'Look at the formula for methane: CH₄.',
      'One molecule holds one carbon atom (12.0 u) and four hydrogen atoms (1.0 u each).',
      'Add 12.0 + (4 × 1.0) and type the total mass.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number.' };
      if (Math.abs(v - 16) < 0.1) return { ok: true };
      if (Math.abs(v - 13) < 0.1) return { ok: false, msg: 'Methane has four hydrogen atoms, not one.' };
      return { ok: false, msg: 'Add the mass of one carbon (12.0) and four hydrogens (4 × 1.0).' };
    },
    reward: {
      log: 'Predicted methane formula mass: 16.0 u.',
      title: 'Formula Mass',
      body: 'Adding the atomic masses of all atoms in a molecule gives its formula mass: 12.0 + (4 × 1.0) = 16.0 for methane (CH₄).'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Confirming on the Scale',
    prompt: 'Weigh one molecule of methane (CH₄) on the scale to confirm its formula mass.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      bounds: { ...TABLE_BOUNDS },
      recorder: PARKED_RECORDER,
      pieces: [
        { id: 'c', kind: 'atom', label: 'C', at: { x: 14, y: 14 }, props: { el: 'C' } },
        ...[28, 42, 56, 70].map((x, i) => ({ id: `h${i + 1}`, kind: 'atom', label: 'H', at: { x, y: 14 }, props: { el: 'H' } })),
        ...scratchCorner().pieces
      ],
      zones: {
        containers: [{ id: 'pan', label: 'Pan', at: { x: 98, y: 50 }, size: { w: 40, h: 24 }, cell: 13 }],
        trays: [scratchCorner().tray]
      },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 98, y: 16 }, size: { w: 44, h: 26 }, noRun: true, props: { pan: 'container:pan', unit: 'u' } },
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: 58, y: 30 }, size: { w: 30, h: 16 }, noRun: true, props: { lines: ['hydrogen 1.0', 'carbon 12.0'] } }
      ]
    }),
    hints: [
      'Use the atoms, their joins and the scale\'s pan.',
      'Read the weight on the scale to confirm your predicted formula mass.',
      'Join all five atoms into CH₄ and drag the molecule onto the pan.'
    ],
    check(state) {
      const t = state.table;
      const atoms = piecesIn(t, 'container:pan', 'atom');
      if (!atoms.length) return { ok: false, notYet: true, msg: 'The pan is empty. Build the molecule and drag it onto the pan.' };
      const ids = atoms.map(a => a.id);
      const together = ids.every(id => t.pieces[id].joinedTo.length > 0);
      if (!together) return { ok: false, msg: 'The atoms on the pan are not joined into one molecule.' };
      const formula = formulaOf(ids, t);
      if (formula !== 'CH₄') return { ok: false, msg: 'The molecule on the pan holds a different count of atoms than methane does.' };
      return { ok: true };
    },
    reward: {
      log: 'Methane on the scale: confirmed 16.0 u.',
      model: { type: 'molecule', name: 'methane', caption: 'CH₄: one carbon atom (dark) and four hydrogen atoms (pale).' },
      title: 'Mass Confirmed',
      body: 'The scale confirms that methane (CH₄) weighs 16.0 u, exactly matching the predicted formula mass.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Counting by Weighing',
    prompt: 'Determine how many 18.0-gram portions of water are in the 72-gram drum.',
    entry: { id: 'ans', label: 'Portions of 18 g', unit: '' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        { ...crate('w', 'WATER DRUM', { x: 38, y: 38 }, { species: 'water', grams: 72, sealed: true, note: '72.0 g total' }) }
      ],
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'Water (H₂O)', at: { x: 96, y: 28 }, size: { w: 60, h: 22 }, noRun: true, props: { lines: ['1 mole of H₂O = 18.0 g', 'holds 6.02 × 10²³ molecules'] } }
      ]
    }),
    hints: [
      'Each 18.0-gram portion of water corresponds to one mole.',
      'Divide the total weight (72 grams) by the weight of each portion (18 grams).',
      '72 divided by 18 gives the number of portions.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the number of portions.' };
      if (Math.abs(v - 4) < 0.01) return { ok: true };
      if (Math.abs(v - 72) < 0.01) return { ok: false, msg: '72 is the total grams, not the number of 18-gram portions.' };
      if (Math.abs(v - 18) < 0.01) return { ok: false, msg: '18 grams is the size of one portion.' };
      return { ok: false, msg: 'Divide 72 grams by 18 grams per portion.' };
    },
    reward: {
      log: '72 g of water contains 4 moles.',
      title: 'The Mole',
      body: 'Weighing allows counting particles: each 18.0-gram portion is one mole (its molar mass). So 72 g of water holds 4 moles, each with Avogadro\'s number (6.02 × 10²³) of molecules.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Which Drum Holds the Most',
    prompt: 'Rank the three drums by how many atoms each holds.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        crate('d1', 'CARBON', { x: 0, y: 0 }, { species: 'carbon', grams: 60, note: 'drum' }),
        crate('d2', 'OXYGEN', { x: 0, y: 0 }, { species: 'oxygen', grams: 64, note: 'drum' }),
        crate('d3', 'HYDROGEN', { x: 0, y: 0 }, { species: 'hydrogen', grams: 6, note: 'drum' })
      ],
      zones: {
        slots: [{ id: 'weigh', label: 'Scale pan', at: { x: 118, y: 52 }, size: { w: 22, h: 18 } }],
        rail: { id: 'rail', at: { x: 56, y: 54 }, size: { w: 84, h: 20 }, first: 'fewest atoms', last: 'most atoms', items: ['d1', 'd2', 'd3'], start: ['d1', 'd3', 'd2'] }
      },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 118, y: 22 }, size: { w: 56, h: 34 }, noRun: true, props: { pan: 'slot:weigh', unit: 'g' } },
        { id: 'plate', kind: 'plate', label: 'One mole weighs', at: { x: 40, y: 22 }, size: { w: 52, h: 24 }, noRun: true, props: { lines: ['H 1.0 g', 'C 12.0 g', 'O 16.0 g'] } }
      ]
    }),
    hints: [
      'Use the scale\'s pan and the rail.',
      'The heaviest drum is not always the one with the most atoms, so weigh each drum before you rank it.',
      'Work out the moles in each drum from its weight and the weight of one mole, and rank by moles, the fewest at the left end.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'All three drums belong on the rail. Put the drum on the scale back.' };
      const atoms = id => molesOf(t.pieces[id].props.species, t.pieces[id].props.grams);
      const want = ['d1', 'd2', 'd3'].sort((a, b) => atoms(a) - atoms(b));
      if (order.join() !== want.join()) {
        return { ok: false, msg: 'The rail is not in order of how many atoms each drum holds.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The lightest drum holds the most atoms.',
      title: 'Weight Is Not Count',
      body: 'Because lighter atoms have smaller molar masses, a given mass of lighter elements contains more atoms than the same mass of heavier ones.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Where the Weight Sits',
    prompt: 'What percent of a water molecule\'s weight is its oxygen atom?',
    entry: { id: 'ans', label: 'Oxygen', unit: '%' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      bounds: { ...TABLE_BOUNDS },
      recorder: PARKED_RECORDER,
      pieces: [
        { id: 'o', kind: 'atom', label: 'O', at: { x: 14, y: 14 }, props: { el: 'O' } },
        { id: 'h1', kind: 'atom', label: 'H', at: { x: 28, y: 14 }, props: { el: 'H' } },
        { id: 'h2', kind: 'atom', label: 'H', at: { x: 42, y: 14 }, props: { el: 'H' } }
      ],
      zones: {
        containers: [{ id: 'pan', label: 'Pan', at: { x: 98, y: 50 }, size: { w: 40, h: 24 }, cell: 13 }]
      },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 98, y: 16 }, size: { w: 44, h: 26 }, noRun: true, props: { pan: 'container:pan', unit: 'u' } },
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: 58, y: 30 }, size: { w: 30, h: 16 }, noRun: true, props: { lines: ['hydrogen 1.0', 'oxygen 16.0'] } }
      ]
    }),
    hints: [
      'Build the molecule on the scale\'s pan and read its weight.',
      'Compare the oxygen atom\'s listed weight with the weight of the whole molecule.',
      'Divide the oxygen atom\'s weight by the molecule\'s weight, then scale it to a hundred.'
    ],
    check(state) {
      const t = state.table;
      const atoms = piecesIn(t, 'container:pan', 'atom');
      if (!atoms.length) return { ok: false, notYet: true, msg: 'The pan is empty. Build the molecule and drag it onto the pan.' };
      const ids = atoms.map(a => a.id);
      if (!ids.every(id => t.pieces[id].joinedTo.length > 0) || formulaOf(ids, t) !== 'H₂O') return { ok: false, notYet: true, msg: 'Join the three atoms into one water molecule on the pan.' };
      const v = entryNumber(t, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a percent.' };
      if (Math.abs(v - 88.9) <= 0.6) return { ok: true };
      if (Math.abs(v - 33.3) < 1) return { ok: false, msg: 'That is the share of the atoms. The atoms do not weigh the same.' };
      return { ok: false, msg: 'That share of 18.0 is not the oxygen atom\'s 16.0.' };
    },
    reward: {
      log: 'Oxygen is 16 of the water molecule\'s 18.',
      title: 'Percent by Mass',
      body: 'An element\'s percent by mass in a compound is its total atomic mass divided by the formula mass, times 100. Oxygen is one atom in three, but 16.0 of 18.0, so 88.9% of the mass.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Atoms in a Weighed Sample',
    prompt: 'How many hydrogen atoms are in 36 grams of water?',
    entry: { id: 'ans', label: 'Hydrogen atoms', unit: '× 10²³' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [{ ...crate('w', 'WATER', { x: 40, y: 38 }, { species: 'water', grams: 36, note: '36 g' }), fixed: true }],
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'One mole', at: { x: 92, y: 26 }, size: { w: 52, h: 24 }, noRun: true, props: { lines: ['water 18 g', '6.02 × 10²³ particles'] } }
      ]
    }),
    hints: [
      'Type the number of hydrogen atoms, as a multiple of 10²³.',
      'Work out how many moles of water the crate holds, then how many hydrogen atoms each water molecule brings.',
      'Moles of hydrogen atoms times 6.02 × 10²³ gives the atoms.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the count, as a multiple of 10²³.' };
      const want = (36 / 18) * 2 * 6.02;
      if (Math.abs(v - want) <= 0.35) return { ok: true };
      if (Math.abs(v - 12.04) < 0.35) return { ok: false, msg: 'That counts the water molecules. Each molecule holds more than one hydrogen atom.' };
      if (Math.abs(v - 6.02) < 0.35 || Math.abs(v - 2.0) < 0.1) return { ok: false, msg: 'The crate holds more than one mole of water.' };
      return { ok: false, msg: 'That count of hydrogen atoms does not match the moles in the crate.' };
    },
    reward: {
      log: '36 g of water holds 24.1 × 10²³ hydrogen atoms.',
      title: 'From Grams to Particles',
      body: '36 g is 2 mol of water, which holds 2 × 6.02 × 10²³ molecules and twice that many hydrogen atoms: 24.1 × 10²³. Grams convert to moles by molar mass, and moles to particles by Avogadro\'s number.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'The Recipe From the Weights',
    prompt: 'How many hydrogen atoms join each carbon atom in this compound?',
    entry: { id: 'ans', label: 'Hydrogen atoms per carbon atom', unit: '' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        { ...crate('c', 'CARBON', { x: 30, y: 38 }, { species: 'carbon', grams: 24, fixed: true, note: '24.0 g in compound' }) },
        { ...crate('h', 'HYDROGEN', { x: 68, y: 38 }, { species: 'hydrogen', grams: 6, fixed: true, note: '6.0 g in compound' }) }
      ],
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'Listed masses', at: { x: 114, y: 28 }, size: { w: 46, h: 22 }, noRun: true, props: { lines: ['carbon 12.0 g/mol', 'hydrogen 1.0 g/mol'] } }
      ]
    }),
    hints: [
      'Type how many hydrogen atoms there are for every carbon atom.',
      'Compare the moles of each element: atoms combine in the ratio of their moles.',
      'Divide each element\'s grams by its molar mass, then divide the larger mole count by the smaller.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number.' };
      if (Math.abs(v - 3) < 0.01) return { ok: true };
      if (Math.abs(v - 0.25) < 0.01) return { ok: false, msg: 'That is the ratio of the grams, not of the atoms, and it is upside down.' };
      if (Math.abs(v - 4) < 0.01) return { ok: false, msg: 'That is the ratio of the grams. The atoms do not weigh the same.' };
      return { ok: false, msg: '24.0 g C is 2.0 moles, and 6.0 g H is 6.0 moles: divide 6.0 by 2.0.' };
    },
    reward: {
      log: '2.0 mol carbon, 6.0 mol hydrogen: 3 hydrogen for each carbon.',
      title: 'Empirical Formula',
      body: 'The simplest whole-number ratio of atoms in a compound is its empirical formula. Converting 24.0 g C and 6.0 g H to moles gives a 2:6 ratio, or CH₃ (3 H per C).'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Whole Molecule',
    prompt: 'How many carbon atoms does one molecule of this compound hold?',
    entry: { id: 'ans', label: 'Carbon atoms in one molecule', unit: '' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      bounds: { ...TABLE_BOUNDS },
      recorder: PARKED_RECORDER,
      pieces: [
        ...[12, 26, 40].map((x, i) => ({ id: `c${i + 1}`, kind: 'atom', label: 'C', at: { x, y: 10 }, props: { el: 'C' } })),
        ...Array.from({ length: 9 }, (_, i) => ({ id: `h${i + 1}`, kind: 'atom', label: 'H', at: { x: 10 + (i % 5) * 13, y: i < 5 ? 24 : 37 }, props: { el: 'H' } }))
      ],
      zones: { containers: [{ id: 'pan', label: 'Pan', at: { x: 98, y: 44 }, size: { w: 36, h: 22 }, cell: 12 }] },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 98, y: 14 }, size: { w: 44, h: 22 }, noRun: true, props: { pan: 'container:pan', unit: 'u' } },
        { id: 'plate', kind: 'plate', label: 'Compound', at: { x: 36, y: 54 }, size: { w: 58, h: 16 }, noRun: true, props: { lines: ['3 H for each C', 'one molecule weighs 30.0', 'C = 12.0, H = 1.0'] } }
      ]
    }),
    hints: [
      'Use the atoms and the scale\'s pan to test a trial molecule, then type the carbon count.',
      'One carbon with its three hydrogens is the smallest unit (CH₃ = 15.0); the molecule is a whole number of those units.',
      'Divide the molecule\'s weight (30.0) by the weight of CH₃ (15.0).'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number.' };
      if (Math.abs(v - 2) < 0.01) return { ok: true };
      if (Math.abs(v - 1) < 0.01) return { ok: false, msg: 'One carbon with its three hydrogens weighs less than the molecule does.' };
      return { ok: false, msg: 'That many carbon atoms, with three hydrogens each, would not weigh 30.0.' };
    },
    reward: {
      log: 'CH₃ weighs 15; the molecule weighs 30: C₂H₆.',
      title: 'Molecular Formula',
      body: 'The molecular formula is a whole-number multiple of the empirical formula. CH₃ weighs 15.0 and the molecule 30.0, so there are two units: C₂H₆.',
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
      body: 'Nobody can count atoms, so everybody weighs them instead. One mole of a substance is its formula mass in grams, and it always holds the same number of atoms or molecules, whichever the substance is made of — 6.02 x 10^23 of them.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'If there are 72 grams of water and each mole weighs 18 grams, then there are 4 moles of water. The molar mass connects the mass on the balance to the particle count in the recipe.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const weighIn = piece => [to(piece, 'slot:pan'), { run: 'scale' }];
const joinTo = (a, b) => ({ join: [a, b] });
const typed = (id, value) => ({ type: { entry: id, value: String(value) } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [typed('ans', '16')],
  [joinTo('h1', 'c'), joinTo('h2', 'c'), joinTo('h3', 'c'), joinTo('h4', 'c'), to('c', 'container:pan')],
  [typed('ans', '4')],
  [to('d2', 'slot:weigh'), to('d2', 'rail:0'), to('d1', 'slot:weigh'), to('d1', 'rail:1'), to('d3', 'slot:weigh'), to('d3', 'rail:2')],
  [joinTo('h1', 'o'), joinTo('h2', 'o'), to('o', 'container:pan'), typed('ans', '88.9')],
  [typed('ans', '24.08')],
  [typed('ans', '3')],
  [typed('ans', '2')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [typed('ans', '13')],
  [joinTo('h1', 'c'), joinTo('h2', 'c'), to('c', 'container:pan')],
  [typed('ans', '72')],
  [to('d3', 'slot:weigh'), to('d3', 'rail:2')],
  [joinTo('h1', 'o'), joinTo('h2', 'o'), to('o', 'container:pan'), typed('ans', '33.3')],
  [typed('ans', '12.04')],
  [typed('ans', '4')],
  [typed('ans', '1')]
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

export { scaleRead, panLoad };
