/**
 * q6-weigh.js — Tallow, bench six: COUNTING BY WEIGHT. (Built as Ligar's bench four;
 * moved to Tallow on 2026-10-10, where it follows Atomic Mass as AP Unit 1 does. Its
 * one ionic sample became a molecular one, because Tallow comes before Ligar names
 * the formula unit.)
 *
 * The sixth bench on Tallow, and the sixth on the TABLETOP (plan `bench-tabletop.md`, phase T2): the
 * mass kit (`table/kits/mass.js`) on the sack scale. Bench three counted molecules because there were
 * few enough to count; a real crate holds more atoms than anyone could count in a lifetime, and every
 * instrument in the yard reports a MASS. This bench is the bridge, and the bridge is a two-pan balance
 * with an ATOM COUNTER on a pan: a balance weighs and never divides, and a counter counts and never
 * weighs. What the player does is pour, until two pans balance or two counters agree, and read what
 * is on the pan.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  a crate too full to tip, balanced by scoops of the same atom  -> counting by weighing
 *   2  build a molecule of methane and weigh it                       -> formula mass
 *   3  weigh sixty atoms of three elements and lay a line             -> equal counts weigh in the same ratio
 *   4  pour oxygen until its counter matches 12.0 g of carbon         -> the mole
 *   5  pour carbon dioxide until its counter matches                  -> molar mass
 *   6  how many such scoops in a drum of 72 grams                      -> grams and moles convert both ways
 *   7  pour hydrogen to match the hydrogen in two moles of water       -> a recipe reads in moles
 *   8  rank three drums by the atoms each holds                        -> weight is not count
 *   -- debrief: why every real measurement is a mass, and what comes after it.
 *
 * THE MOLE IS DISCOVERED, NOT SAID. Stage 4 never names it. The counters print a count (6.02 x 10^23 is a
 * number on a counter) and the player finds that 12.0 grams of carbon and 16 grams of oxygen read the
 * same; the reward card then names what they found. `q3-recipe` earned fixed composition, percent
 * composition and the empirical formula, so those are plain words here. What this quest has to earn is on
 * `VOCABULARY`.
 *
 * FIELD (stage 1). A counted sack can be brought from the sack-filling scale on the bagging line: the
 * field point is a real piece of the host (`tallow/stations.js` `buildBaggingLine`). It is evidence,
 * never a lock: the stage is answered by pouring alone, and at T1 to T3 the same fetch is a drawn
 * site plate.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { piecesIn, formulaOf, scratchCorner, TABLE_BOUNDS, PARKED_RECORDER } from '../../table/kits/atoms.js';
import {
  massTable, balanceTable, crate, pourSteps, balanceRead, counterOf, scaleRead, speciesMass, panLoad
} from '../../table/kits/mass.js';
import { lineOf, readY } from '../../table/recorder.js';

export const meta = { stageCount: 13 };

/** When each withheld word is earned. Specific terms first. */
export const VOCABULARY = [
  { term: /\bformula mass\b/i, introducedAt: 2 },
  { term: /\bpercent by mass\b/i, introducedAt: 9 },
  { term: /\bempirical formula\b/i, introducedAt: 11 },
  { term: /\bcomposition of a mixture\b/i, introducedAt: 13 },
  { term: /\bmolecular formula\b/i, introducedAt: 12 },
  { term: /\bavogadro\w*\b/i, introducedAt: 4 },
  { term: /\bmolar\b/i, introducedAt: 5 },
  { term: /\bmoles?\b/i, introducedAt: 4 }
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

/**
 * THE KEY LEGEND. A key whose label says what it does owes nothing, and the pieces of this table
 * are poured and dragged. The one key that is not self-evident is none: "Straightedge" and "Weigh"
 * say what they do. Kept so the quest contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/**
 * What a drum of this much weighs in whole moles, for a check and its recomputation in `verify:learn`:
 * the grams over the grams in one mole. NOT WHAT ANY INSTRUMENT HERE REPORTS: the player finds the
 * scoop that matches the carbon pan and counts them.
 */
export function molesOf(species, grams) {
  return grams / speciesMass(species);
}

/* ------------------------------------------------------------------
   THE TABLES
   One layout (150 x 72 units): the balance across the top with its two pans below it at the ends of
   the beam, the drum or the loose pieces between and beside them.
   ------------------------------------------------------------------ */

const poured = (t, what) => t.zones.containers['pan-r'].contents[what] || 0;

/** The same count on both counters (to the tolerance of the arithmetic), and something counted. */
function countersMatch(t) {
  const l = counterOf(t, 'balance', 'L');
  const r = counterOf(t, 'balance', 'R');
  return { l, r, same: r > 0 && Math.abs(l - r) <= 1e-9 * Math.max(l, r) };
}

/* ------------------------------------------------------------------
   THE THIRTEEN STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Count What You Cannot Tip',
    prompt: 'Find how many atoms the sealed carbon crate holds.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'u',
      counters: { R: { label: 'ATOMS' } },
      refCrate: crate('crate', 'CRATE', { x: 0, y: 0 }, { species: 'carbon', n: 300, sealed: true, note: 'carbon' }),
      drum: { label: 'Carbon drum', what: 'carbon', amount: 1000 },
      steps: { carbon: 50 },
      capacity: 600,
      extra: {
        pieces: [{ ...crate('sack', 'SACK', { x: 14, y: 52 }, { species: 'carbon', n: 100, note: 'counted: 100' }), hidden: true, fetchFrom: 'sack' }],
        fetch: [{ id: 'sack', label: 'Counted sack', at: { x: 75, y: 67.5 }, size: { w: 22, h: 8 } }]
      }
    }),
    hints: [
      'Use the drum and the right pan.',
      'The counter over the pan you pour on reads how many atoms are on it.',
      'When the two pans balance they hold the same weight of the same kind of atom, so they hold the same number of them.'
    ],
    check(state) {
      const t = state.table;
      const bal = balanceRead(t, 'balance');
      const have = counterOf(t, 'balance', 'R');
      if (have === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour some carbon onto it.' };
      if (!bal.level) {
        return { ok: false, msg: bal.lean < 0
          ? 'The crate is the heavier pan.'
          : 'The right pan is the heavier pan.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Crate balanced by the same weight of carbon.',
      title: 'Counting By Weighing',
      body: 'Identical atoms have identical mass, so balanced pans contain equal numbers of atoms. Weighing allows counting particles that are too small to count directly.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'What One Molecule Weighs',
    prompt: 'Weigh one molecule of methane (CH₄) on the scale.',
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
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: 58, y: 30 }, size: { w: 30, h: 16 }, noRun: true, props: { lines: ['hydrogen 1.0', 'carbon 12.0', 'oxygen 16.0'] } }
      ]
    }),
    hints: [
      'Use the atoms, their joins and the scale\'s pan.',
      'Read the weight on the scale and set it beside the listed mass of each atom in the molecule.',
      'The scale reads the listed masses of every atom on the pan added up, so build the molecule before you read it.'
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
      log: 'Methane on the scale: one carbon and four hydrogen.',
      model: { type: 'molecule', name: 'methane', caption: 'CH₄: one carbon atom (dark) and four hydrogen atoms (pale).' },
      title: 'Formula Mass',
      body: 'Adding the atomic masses of all atoms in a molecule gives its formula mass: 12.0 + (4 × 1.0) = 16.0 for methane (CH₄).'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Three Samples of Sixty',
    prompt: 'Weigh sixty atoms of each element and show how the weights relate to the listed masses.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      tools: ['straightedge'],
      recorder: { at: { x: 60, y: 38 }, size: { w: 56, h: 46 }, xLabel: 'Listed mass of one atom', yLabel: 'Weight of sixty' },
      pieces: [
        crate('h', 'HYDROGEN', { x: 14, y: 18 }, { species: 'hydrogen', n: 60, note: '60 atoms' }),
        crate('c', 'CARBON', { x: 14, y: 36 }, { species: 'carbon', n: 60, note: '60 atoms' }),
        crate('o', 'OXYGEN', { x: 14, y: 54 }, { species: 'oxygen', n: 60, note: '60 atoms' })
      ],
      zones: { slots: [{ id: 'pan', label: 'Scale pan', at: { x: 118, y: 56 }, size: { w: 22, h: 18 } }] },
      fixtures: [{ id: 'scale', kind: 'scale', label: 'Scale', runLabel: 'Weigh', at: { x: 118, y: 24 }, size: { w: 56, h: 34 }, props: { pan: 'slot:pan', unit: 'u' } }]
    }),
    hints: [
      'Use the crates, the scale\'s pan and "Weigh".',
      'Each reading lands as a point on the strip, with the listed mass of one atom across and the weight of sixty up.',
      'Press "Straightedge" to lay a line across the points and see whether all three keep to it.'
    ],
    check(state) {
      const t = state.table;
      const rows = t.recorder.rows;
      const kinds = new Set(rows.map(r => r.label));
      if (!kinds.size) return { ok: false, notYet: true, msg: 'Nothing has been weighed yet. Put a crate on the pan and weigh it.' };
      if (kinds.size < 3) return { ok: false, msg: 'Only two elements have been weighed.' };
      const line = lineOf(t.recorder);
      if (!line) return { ok: false, notYet: true, msg: 'Lay the straightedge across the points to see how the weights keep to the listed masses.' };
      const bad = rows.find(r => Math.abs(readY(line, r.x) - r.y) > 1e-6 * r.y);
      if (bad) return { ok: false, msg: 'The line misses one of the points.' };
      return { ok: true };
    },
    reward: {
      log: 'Three samples of 60: 60, 720 and 960 on the scale.',
      title: 'Equal Counts Weigh In the Same Ratio',
      body: 'Equal numbers of atoms have masses in exact proportion to their atomic masses: hydrogen (1), carbon (12), and oxygen (16) weigh 60, 720, and 960.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Measure Out a Matching Count',
    prompt: 'Pour oxygen onto the right pan until its atom counter matches the carbon pan.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { L: { label: 'ATOMS' }, R: { label: 'ATOMS' } },
      refCrate: crate('ref', 'CARBON', { x: 0, y: 0 }, { species: 'carbon', grams: 12, note: '12.0 g' }),
      drum: { label: 'Oxygen drum', what: 'oxygen', amount: 40 },
      steps: { oxygen: 4 },
      capacity: 40
    }),
    hints: [
      'Use the drum and the right pan.',
      'Watch the beam as the counters get closer: equal counts do not have to weigh the same.',
      'Keep pouring until the right counter reads exactly what the left one does, then look at what the right pan holds.'
    ],
    check(state) {
      const t = state.table;
      const c = countersMatch(t);
      if (c.r === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour some oxygen onto it.' };
      if (poured(t, 'oxygen') === 12) return { ok: false, msg: 'The right pan holds 12 g, and the two counters do not agree.' };
      if (!c.same) {
        return { ok: false, msg: c.r > c.l
          ? 'The right counter reads more than the left.'
          : 'The right counter reads less than the left.' };
      }
      return { ok: true };
    },
    reward: {
      log: '12.0 g of carbon matches 16.0 g of oxygen.',
      title: 'The Mole',
      body: 'The atomic mass of any element in grams contains one mole of atoms. One mole equals 6.02 × 10²³ particles, known as Avogadro\'s number.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'A Mole of a Compound',
    prompt: 'Pour carbon dioxide onto the right pan until its count matches the carbon pan.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { L: { label: 'COUNT' }, R: { label: 'COUNT' } },
      refCrate: crate('ref', 'CARBON', { x: 0, y: 0 }, { species: 'carbon', grams: 12, note: '12.0 g' }),
      drum: { label: 'Carbon dioxide drum', what: 'carbon dioxide', amount: 100 },
      steps: { 'carbon dioxide': 11 },
      capacity: 66
    }),
    hints: [
      'Use the drum and the right pan.',
      'The pan counts molecules, one for each carbon and two oxygen joined together, and the other pan counts atoms.',
      'Keep pouring until the counters agree, then read how many grams are on the right pan.'
    ],
    check(state) {
      const t = state.table;
      const c = countersMatch(t);
      if (c.r === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour some carbon dioxide onto it.' };
      const grams = poured(t, 'carbon dioxide');
      if (grams === 12) return { ok: false, msg: 'The right pan holds 12 g, and the two counters do not agree.' };
      if (!c.same) {
        return { ok: false, msg: c.r > c.l
          ? 'The right counter reads more than the left.'
          : 'The right counter reads less than the left.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One mole of carbon dioxide weighs 44.0 grams.',
      model: { type: 'molecule', name: 'carbon dioxide', caption: 'CO₂: one carbon atom (dark) between two oxygen atoms (red-brown).' },
      title: 'Molar Mass',
      body: 'The mass in grams of one mole of a substance is its molar mass. For CO₂, 12.0 + (2 × 16.0) = 44.0 grams per mole.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'A Drum of Seventy-Two',
    prompt: 'Set the tally to the number of moles of water in the 72-gram drum.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { L: { label: 'COUNT' }, R: { label: 'COUNT' } },
      refCrate: crate('ref', 'CARBON', { x: 0, y: 0 }, { species: 'carbon', grams: 12, note: '12.0 g' }),
      drum: { label: 'Water drum', what: 'water', amount: 72 },
      steps: { water: 6 },
      capacity: 72,
      balanceAt: { x: 65, y: 16 },
      balanceW: 110,
      extra: {
        fixtures: [{ id: 'tally', kind: 'tally', label: 'Tally', at: { x: 134, y: 40 }, size: { w: 26, h: 30 }, noRun: true, dials: { n: { min: 0, max: 8, step: 1, value: 0, label: 'Moles' } } }]
      }
    }),
    hints: [
      'Use the drum, the right pan and the tally.',
      'The drum is made up of equal scoops of that size.',
      'Divide the drum\'s grams by the grams on the matching pan, and set the tally to the result.'
    ],
    check(state) {
      const t = state.table;
      const n = t.fixtures.tally.dials.n.value;
      if (n === 0) return { ok: false, notYet: true, msg: 'The tally is on zero.' };
      if (n < molesOf('water', 72)) return { ok: false, msg: 'The drum holds more matching scoops than the tally says.' };
      if (n !== molesOf('water', 72)) return { ok: false, msg: 'The drum holds fewer matching scoops than the tally says.' };
      return { ok: true };
    },
    reward: {
      log: 'The drum holds 4 matching scoops: 4 moles.',
      title: 'Grams and Moles Convert Both Ways',
      body: 'Molar mass converts between mass and moles: dividing 72 grams of water by 18 g/mol yields 4 moles of water.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Moles of Each Element',
    prompt: 'Pour hydrogen onto the right pan until it holds as many hydrogen atoms as two moles of water.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { L: { label: 'H ATOMS', of: 'H', hidden: true }, R: { label: 'H ATOMS', of: 'H' } },
      refCrate: crate('two', 'WATER', { x: 0, y: 0 }, { species: 'water', grams: 36, note: '2 moles' }),
      drum: { label: 'Hydrogen drum', what: 'hydrogen', amount: 10 },
      steps: { hydrogen: 1 },
      capacity: 10
    }),
    hints: [
      'Use the drum and the right pan.',
      'Work out how many moles of hydrogen atoms two moles of water hold, and read the right counter against that many moles.',
      'Each water molecule holds two hydrogen atoms, so there are more moles of hydrogen atoms in the water than moles of water.'
    ],
    check(state) {
      const t = state.table;
      const c = countersMatch(t);
      if (c.r === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour some hydrogen onto it.' };
      if (!c.same) {
        return { ok: false, msg: c.r > c.l
          ? 'The right pan holds more hydrogen atoms than two moles of water do.'
          : 'The right pan holds fewer hydrogen atoms than two moles of water do.' };
      }
      return { ok: true };
    },
    reward: {
      log: '2 moles of water hold 4 moles of hydrogen.',
      title: 'A Recipe Reads in Moles',
      body: 'Chemical formulas express mole ratios: each mole of H₂O contains two moles of hydrogen atoms and one mole of oxygen atoms.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
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

  /* ---------------------------------------------------------------- 9 */
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

  /* ---------------------------------------------------------------- 10 */
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

  /* ---------------------------------------------------------------- 11 */
  {
    title: 'The Recipe From the Weights',
    prompt: 'How many hydrogen atoms join each carbon atom in this compound?',
    entry: { id: 'ans', label: 'Hydrogen atoms per carbon atom', unit: '' },
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { L: { label: 'C ATOMS' }, R: { label: 'H ATOMS' } },
      refCrate: crate('c', 'CARBON', { x: 0, y: 0 }, { species: 'carbon', grams: 24, note: '24.0 g in the compound' }),
      drum: { label: 'Hydrogen drum', what: 'hydrogen', amount: 10 },
      steps: { hydrogen: 1 },
      capacity: 10,
      extra: {
        fixtures: [{ id: 'plate', kind: 'plate', label: 'Compound', at: { x: 75, y: 67.5 }, size: { w: 90, h: 9 }, noRun: true, props: { lines: ['hydrogen in it 6.0 g', 'g/mol: C 12.0, H 1.0'] } }]
      }
    }),
    hints: [
      'Use the drum and the right pan to put the compound\'s hydrogen on the balance, then type the ratio.',
      'Compare the two atom counters: atoms combine in the ratio of their moles.',
      'Divide each crate\'s grams by its grams per mole, then divide the larger count by the smaller.'
    ],
    check(state) {
      if (poured(state.table, 'hydrogen') < 6) return { ok: false, notYet: true, msg: 'Pour the compound\'s 6.0 g of hydrogen onto the right pan.' };
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number.' };
      if (Math.abs(v - 3) < 0.01) return { ok: true };
      if (Math.abs(v - 0.25) < 0.01) return { ok: false, msg: 'That is the ratio of the grams, not of the atoms, and it is upside down.' };
      if (Math.abs(v - 4) < 0.01) return { ok: false, msg: 'That is the ratio of the grams. The atoms do not weigh the same.' };
      return { ok: false, msg: 'That ratio does not match the moles in the two crates.' };
    },
    reward: {
      log: '2.0 mol carbon, 6.0 mol hydrogen: 3 hydrogen for each carbon.',
      title: 'Empirical Formula',
      body: 'The simplest whole-number ratio of atoms in a compound is its empirical formula. Weighing the elements and converting to moles gives the ratio: here CH₃, three hydrogen atoms for each carbon.'
    }
  },

  /* ---------------------------------------------------------------- 12 */
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
        { id: 'plate', kind: 'plate', label: 'Compound', at: { x: 36, y: 55 }, size: { w: 56, h: 12 }, noRun: true, props: { lines: ['3 H for each C', 'one molecule weighs 30.0'] } }
      ]
    }),
    hints: [
      'Use the atoms and the scale\'s pan to weigh a trial molecule, then type the carbon count.',
      'One carbon with its three hydrogens is the smallest unit; the molecule is a whole number of those units.',
      'Divide the molecule\'s weight by the weight of one carbon with its three hydrogens.'
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
      body: 'The molecular formula is a whole-number multiple of the empirical formula. CH₃ weighs 15.0 and the molecule 30.0, so there are two units: C₂H₆.'
    }
  },

  /* ---------------------------------------------------------------- 13 */
  {
    title: 'How Much of the Mixture Is Salt',
    prompt: 'What percent of the mixture\'s weight is salt?',
    entry: { id: 'ans', label: 'Salt', unit: '%' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        { ...crate('mix', 'SALT AND SAND', { x: 18, y: 44 }, { species: 'water', grams: 40, sealed: true, note: 'before washing' }) },
        { ...crate('sand', 'SAND', { x: 46, y: 44 }, { species: 'water', grams: 10, sealed: true, note: 'left on the filter' }) }
      ],
      zones: { slots: [{ id: 'weigh', label: 'Scale pan', at: { x: 118, y: 52 }, size: { w: 22, h: 18 } }] },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 118, y: 22 }, size: { w: 56, h: 34 }, noRun: true, props: { pan: 'slot:weigh', unit: 'g' } },
        { id: 'plate', kind: 'plate', label: 'Washed', at: { x: 52, y: 14 }, size: { w: 76, h: 16 }, noRun: true, props: { lines: ['the salt dissolved and washed away', 'only the sand stayed'] } }
      ]
    }),
    hints: [
      'Use the scale\'s pan to weigh each crate.',
      'Compare what the mixture weighed before washing with what was left after.',
      'The salt is the weight that washed away: divide it by the weight of the whole mixture, then scale it to a hundred.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a percent.' };
      if (Math.abs(v - 75) <= 0.6) return { ok: true };
      if (Math.abs(v - 25) < 0.6) return { ok: false, msg: 'That is the share that stayed on the filter.' };
      return { ok: false, msg: 'That share of the mixture\'s weight does not match what washed away.' };
    },
    reward: {
      log: 'The mixture was 75 percent salt by weight.',
      title: 'Composition of a Mixture',
      body: 'A mixture\'s composition is the weight of each part over the weight of the whole. The salt was 40.0 g minus 10.0 g, so 30.0 g of 40.0 g: 75% salt by mass.',
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
      body: 'A formula is a count and a balance reads a mass, and until you can turn one into the other a recipe cannot be prepared. The molar mass provides that conversion.'
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
  [{ fetch: 'sack' }, to('sack', 'container:pan-r'), ...pourSteps('carbon', 50, 4)],
  [joinTo('h1', 'c'), joinTo('h2', 'c'), joinTo('h3', 'c'), joinTo('h4', 'c'), to('c', 'container:pan')],
  [...weighIn('h'), ...weighIn('c'), ...weighIn('o'), { lay: { kind: 'straightedge', through: [0, 2] } }],
  pourSteps('oxygen', 4, 4),
  pourSteps('carbon dioxide', 11, 4),
  [...pourSteps('water', 6, 3), { setDial: { fixture: 'tally', dial: 'n', value: 4 } }],
  pourSteps('hydrogen', 1, 4),
  [to('d2', 'slot:weigh'), to('d2', 'rail:0'), to('d1', 'slot:weigh'), to('d1', 'rail:1'), to('d3', 'slot:weigh'), to('d3', 'rail:2')],
  [joinTo('h1', 'o'), joinTo('h2', 'o'), to('o', 'container:pan'), typed('ans', '88.9')],
  [typed('ans', '24.08')],
  [...pourSteps('hydrogen', 1, 6), typed('ans', '3')],
  [typed('ans', '2')],
  [typed('ans', '75')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  pourSteps('carbon', 50, 5),
  [joinTo('h1', 'c'), joinTo('h2', 'c'), to('c', 'container:pan')],
  [...weighIn('h'), ...weighIn('c'), { lay: { kind: 'straightedge', through: [0, 1] } }],
  pourSteps('oxygen', 4, 3),
  pourSteps('carbon dioxide', 11, 2),
  [...pourSteps('water', 6, 3), { setDial: { fixture: 'tally', dial: 'n', value: 1 } }],
  pourSteps('hydrogen', 1, 2),
  [to('d3', 'slot:weigh'), to('d3', 'rail:2')],
  [joinTo('h1', 'o'), joinTo('h2', 'o'), to('o', 'container:pan'), typed('ans', '33.3')],
  [typed('ans', '12.04')],
  [...pourSteps('hydrogen', 1, 6), typed('ans', '4')],
  [typed('ans', '1')],
  [typed('ans', '25')]
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
