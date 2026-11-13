/**
 * q6-weigh.js — Tallow, bench six: COUNTING BY WEIGHT.
 *
 * Eight stages:
 *   1  Predicting Formula Mass (typed)
 *   2  Confirming on the Scale
 *   3  The Same Number of Atoms (new — balance with atom counters on both pans)
 *   4  Moles in a Drum (typed, was 3 — worked case)
 *   5  Which Drum Holds the Most (was 4)
 *   6  Where the Mass Sits (typed, was 5 — worked case)
 *   7  The Formula From the Masses (typed, was 7 — worked case)
 *   8  The Whole Molecule (typed, was 8)
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { piecesIn, formulaOf, scratchCorner, TABLE_BOUNDS, PARKED_RECORDER } from '../../table/kits/atoms.js';
import {
  massTable, balanceTable, crate, pourSteps, speciesMass, scaleRead, panLoad
} from '../../table/kits/mass.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bformula mass\b/i, introducedAt: 1 },
  { term: /\bmolar mass\b/i, introducedAt: 3 },
  { term: /\bmoles?\b/i, introducedAt: 3 },
  { term: /\bpercent by mass\b/i, introducedAt: 6 },
  { term: /\bempirical formula\b/i, introducedAt: 7 },
  { term: /\bmolecular formula\b/i, introducedAt: 8 }
];

const SPEAKER = 'Vess';

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

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Predicting Formula Mass',
    briefing: {
      speaker: SPEAKER,
      body: 'The mass of one atom is measured in atomic mass units, u. The plate lists the mass of each kind of atom.'
    },
    prompt: 'What is the mass of one molecule of methane, CH₄, in u?',
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
      'Use the formula CH₄ and the "Atomic masses" plate.',
      'Count each kind of atom the formula gives.',
      'Every atom in the molecule adds its own mass.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number.' };
      if (Math.abs(v - 16) < 0.1) return { ok: true };
      if (Math.abs(v - 13) < 0.1) return { ok: false, msg: 'Methane has four hydrogen atoms, not one.' };
      return { ok: false, msg: 'Add the mass of one carbon and four hydrogens.' };
    },
    reward: {
      log: 'Predicted methane formula mass: 16.0 u.',
      title: 'Formula Mass',
      body: 'One carbon and four hydrogens add up to 16.0 u. The sum of the atomic masses in a formula is the formula mass.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Confirming on the Scale',
    prompt: 'Does a molecule of methane have the mass you predicted?',
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
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: 58, y: 30 }, size: { w: 30, h: 16 }, noRun: true, props: { lines: ['hydrogen 1.0 u', 'carbon 12.0 u'] } }
      ]
    }),
    hints: [
      'Use the atoms, their joins and the scale\'s pan.',
      'Read the mass on the scale to check your prediction.',
      'Build methane on the pan and read the mass on the scale.'
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
      body: 'The scale reads 16.0 u, the sum of the five atomic masses.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'The Same Number of Atoms',
    briefing: {
      speaker: SPEAKER,
      body: 'Atoms are far too small to count one at a time, so they are counted by weighing. The counter on each pan shows how many atoms that pan holds.'
    },
    prompt: 'Pour oxygen onto the pan until both pans hold the same number of atoms.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { L: { label: 'ATOMS' }, R: { label: 'ATOMS' } },
      refCrate: crate('c', 'CARBON', { x: 0, y: 0 }, { species: 'carbon', grams: 12, note: '12.0 g' }),
      drum: { label: 'Oxygen', what: 'oxygen', amount: 32 },
      steps: { oxygen: 4 },
      capacity: 32
    }),
    hints: [
      'Use the oxygen drum and the right pan.',
      'Watch the atom counter on the right pan as you pour oxygen.',
      'Stop pouring when both counters show the same number of atoms.'
    ],
    check(state) {
      const grams = state.table.zones.containers['pan-r'].contents.oxygen || 0;
      if (grams === 0) return { ok: false, notYet: true, msg: 'Pour oxygen from the drum onto the right pan.' };
      if (grams < 16) return { ok: false, msg: 'The right counter holds fewer atoms than the 12 g of carbon on the left.' };
      if (grams > 16) return { ok: false, msg: 'The right counter holds more atoms than the 12 g of carbon on the left.' };
      return { ok: true };
    },
    reward: {
      log: '12 g of carbon and 16 g of oxygen each hold 6.02 × 10²³ atoms.',
      title: 'The Mole',
      body: '12 g of carbon and 16 g of oxygen each hold 6.02 × 10²³ atoms. That number is one mole, and the mass of one mole in grams, the molar mass, equals the atomic mass in u.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Moles in a Drum',
    briefing: {
      speaker: SPEAKER,
      body: 'The number of moles is the mass divided by the molar mass.',
      worked: ['molar mass of O = 16 g', '48 g ÷ 16 g = 3 mol']
    },
    prompt: 'How many moles of water are in the 72-gram drum?',
    entry: { id: 'ans', label: 'Moles of H₂O', unit: 'mol' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        { ...crate('w', 'WATER DRUM', { x: 38, y: 38 }, { species: 'water', grams: 72, sealed: true, note: '72.0 g' }) }
      ],
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'Water (H₂O)', at: { x: 96, y: 28 }, size: { w: 60, h: 22 }, noRun: true, props: { lines: ['molar mass of H₂O = 18.0 g/mol', 'drum mass = 72.0 g'] } }
      ]
    }),
    hints: [
      'Read the drum mass and water\'s molar mass on the plate.',
      'Each mole of water has a mass of 18.0 g.',
      'Follow the worked example in the briefing: divide the drum\'s mass by the molar mass.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the number of moles.' };
      if (Math.abs(v - 4) < 0.01) return { ok: true };
      if (Math.abs(v - 72) < 0.01) return { ok: false, msg: '72 is the mass of the drum in grams, not the number of moles.' };
      if (Math.abs(v - 18) < 0.01) return { ok: false, msg: '18 g is the mass of one mole of water.' };
      return { ok: false, msg: `${v} mol of water would have a mass of ${(v * 18).toFixed(1)} g, not 72.0 g.` };
    },
    reward: {
      log: '72 g of water contains 4 moles.',
      title: 'Moles From Mass',
      body: '72 g of water at 18 g for each mole is 4 mol.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Which Drum Holds the Most',
    prompt: 'Which drum holds the most atoms, and which the fewest?',
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
        { id: 'plate', kind: 'plate', label: 'Molar masses', at: { x: 40, y: 22 }, size: { w: 52, h: 24 }, noRun: true, props: { lines: ['H 1.0 g/mol', 'C 12.0 g/mol', 'O 16.0 g/mol'] } }
      ]
    }),
    hints: [
      'Use the scale\'s pan and the rail.',
      'The heaviest drum does not always hold the most atoms, so weigh each drum first.',
      'Compare the moles in each drum using its mass and molar mass, with the fewest on the left.'
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
      title: 'Mass Is Not Count',
      body: 'The lightest drum holds the most atoms, because each hydrogen atom has so little mass. Atoms are compared in moles, not grams.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Where the Mass Sits',
    briefing: {
      speaker: SPEAKER,
      body: 'Percent by mass is the mass of one element divided by the formula mass.',
      worked: ['C: 12.0 u of 16.0 u', '12.0 ÷ 16.0 = 0.75 = 75%']
    },
    prompt: 'What percent of the mass of water is oxygen?',
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
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: 58, y: 30 }, size: { w: 30, h: 16 }, noRun: true, props: { lines: ['hydrogen 1.0 u', 'oxygen 16.0 u'] } }
      ]
    }),
    hints: [
      'Build water on the scale\'s pan and read its formula mass.',
      'Compare oxygen\'s atomic mass with the mass of the whole water molecule.',
      'Follow the worked example in the briefing to find oxygen\'s share of the total mass.'
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
      if (Math.abs(v - 33.3) < 1) return { ok: false, msg: 'That is the share of the atoms. The atoms do not have the same mass.' };
      return { ok: false, msg: 'That share of 18.0 u does not match oxygen\'s 16.0 u.' };
    },
    reward: {
      log: 'Oxygen is 16 of the water molecule\'s 18.',
      title: 'Percent by Mass',
      body: 'Oxygen is 16.0 of the 18.0 u, so its percent by mass in water is 88.9%.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'The Formula From the Masses',
    briefing: {
      speaker: SPEAKER,
      body: 'The empirical formula is the simplest whole-number ratio of atoms in a compound, found by comparing moles.',
      worked: ['4.0 ÷ 1.0 = 4 mol H', '32.0 ÷ 16.0 = 2 mol O', '4 : 2 = 2 H for each O']
    },
    prompt: 'How many hydrogen atoms are there for each carbon atom in this compound?',
    entry: { id: 'ans', label: 'Hydrogen atoms per carbon atom', unit: '' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        { ...crate('c', 'CARBON', { x: 30, y: 38 }, { species: 'carbon', grams: 24, fixed: true, note: '24.0 g in compound' }) },
        { ...crate('h', 'HYDROGEN', { x: 68, y: 38 }, { species: 'hydrogen', grams: 6, fixed: true, note: '6.0 g in compound' }) }
      ],
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'Molar masses', at: { x: 114, y: 28 }, size: { w: 46, h: 22 }, noRun: true, props: { lines: ['carbon 12.0 g/mol', 'hydrogen 1.0 g/mol'] } }
      ]
    }),
    hints: [
      'Read the mass of each drum and the molar masses on the plate.',
      'Convert each element\'s mass to moles first: atoms combine in the ratio of their moles.',
      'Follow the worked example in the briefing to compare the moles of hydrogen and carbon.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number.' };
      if (Math.abs(v - 3) < 0.01) return { ok: true };
      if (Math.abs(v - 0.25) < 0.01) return { ok: false, msg: 'That is the ratio of the grams, not of the atoms, and it is upside down.' };
      if (Math.abs(v - 4) < 0.01) return { ok: false, msg: 'That is the ratio of the grams. Carbon and hydrogen atoms do not have the same mass.' };
      return { ok: false, msg: 'That ratio does not match the moles of hydrogen and carbon in the drums.' };
    },
    reward: {
      log: '2.0 mol carbon, 6.0 mol hydrogen: 3 hydrogen for each carbon.',
      title: 'Empirical Formula',
      body: '2 mol of carbon to 6 mol of hydrogen is 1 to 3, so the empirical formula is CH₃.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Whole Molecule',
    briefing: {
      speaker: SPEAKER,
      body: 'A molecule can hold the empirical formula\'s atoms more than once. Its molecular formula says how many it really holds.'
    },
    prompt: 'How many carbon atoms are in one molecule of this compound?',
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
        { id: 'plate', kind: 'plate', label: 'Compound', at: { x: 36, y: 54 }, size: { w: 58, h: 16 }, noRun: true, props: { lines: ['3 H for each C', 'one molecule: 30.0 u', 'C = 12.0 u, H = 1.0 u'] } }
      ]
    }),
    hints: [
      'Use the atoms and the scale\'s pan to build trial molecules.',
      'Keep the 3-to-1 ratio of hydrogen to carbon as you test sizes on the pan.',
      'Compare the mass of one CH₃ unit with the mass of the molecule.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number.' };
      if (Math.abs(v - 2) < 0.01) return { ok: true };
      if (Math.abs(v - 1) < 0.01) return { ok: false, msg: 'One carbon with its three hydrogens has less mass than the molecule does.' };
      return { ok: false, msg: 'That many carbon atoms, with three hydrogens each, would not have a mass of 30.0 u.' };
    },
    reward: {
      log: 'CH₃ is 15.0 u; the molecule is 30.0 u: C₂H₆.',
      title: 'Molecular Formula',
      body: 'CH₃ is 15.0 u and the molecule is 30.0 u, so the molecular formula holds two units: C₂H₆.',
      last: true
    }
  }
];

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Nobody can count atoms, so everybody weighs them instead. One mole of a substance is its formula mass in grams, and it always holds the same number of atoms or molecules, whichever the substance is made of — 6.02 x 10^23 of them.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'If there are 72 grams of water and each mole has a mass of 18 grams, then there are 4 moles of water. The molar mass connects the mass on the balance to the particle count in the recipe.'
    }
  ]
};

const to = (piece, target) => ({ place: { piece, to: target } });
const joinTo = (a, b) => ({ join: [a, b] });
const typed = (id, value) => ({ type: { entry: id, value: String(value) } });

export const SOLUTIONS = [
  [typed('ans', '16')],
  [joinTo('h1', 'c'), joinTo('h2', 'c'), joinTo('h3', 'c'), joinTo('h4', 'c'), to('c', 'container:pan')],
  pourSteps('oxygen', 4, 4),
  [typed('ans', '4')],
  [to('d2', 'slot:weigh'), to('d2', 'rail:0'), to('d1', 'slot:weigh'), to('d1', 'rail:1'), to('d3', 'slot:weigh'), to('d3', 'rail:2')],
  [joinTo('h1', 'o'), joinTo('h2', 'o'), to('o', 'container:pan'), typed('ans', '88.9')],
  [typed('ans', '3')],
  [typed('ans', '2')]
];

export const MISSES = [
  [typed('ans', '13')],
  [joinTo('h1', 'c'), joinTo('h2', 'c'), to('c', 'container:pan')],
  pourSteps('oxygen', 4, 2),
  [typed('ans', '72')],
  [to('d3', 'slot:weigh'), to('d3', 'rail:2')],
  [joinTo('h1', 'o'), joinTo('h2', 'o'), to('o', 'container:pan'), typed('ans', '33.3')],
  [typed('ans', '4')],
  [typed('ans', '1')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { scaleRead, panLoad };
