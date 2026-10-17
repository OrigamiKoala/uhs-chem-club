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

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { piecesIn, formulaOf, scratchCorner, TABLE_BOUNDS, PARKED_RECORDER } from '../../table/kits/atoms.js';
import {
  massTable, balanceTable, crate, pourSteps, balanceRead, counterOf, scaleRead, speciesMass, panLoad
} from '../../table/kits/mass.js';
import { lineOf, readY } from '../../table/recorder.js';

export const meta = { stageCount: 8 };

/** When each withheld word is earned. Specific terms first. */
export const VOCABULARY = [
  { term: /\bformula mass\b/i, introducedAt: 2 },
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
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Count What You Cannot Tip',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench has a balance with a sealed crate on one pan. Pour from the drum onto the other pan, and its counter keeps the count.'
    },
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
        fetch: [{ id: 'sack', label: 'Counted sack', at: { x: 75, y: 66 }, size: { w: 22, h: 10 } }]
      }
    }),
    hints: [
      'Pour carbon from the drum onto the empty pan and watch which way the beam tips.',
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
          ? 'The crate is the heavier pan, so the right pan holds too few atoms.'
          : 'The right pan is heavier than the crate, so it holds too many atoms.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Crate balanced by the same weight of carbon.',
      title: 'Counting By Weighing',
      body: 'Nobody counted the crate and nobody has to: atoms of one kind all weigh the same, so a pan that balances it holds the same number of atoms. The scoops you poured were counted, so the crate is counted too. This is how chemists count things far too small to count one by one.'
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
        containers: [{ id: 'pan', label: 'Pan', at: { x: 98, y: 45 }, size: { w: 40, h: 24 }, cell: 13 }],
        trays: [scratchCorner().tray]
      },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 98, y: 16 }, size: { w: 44, h: 26 }, noRun: true, props: { pan: 'container:pan', unit: 'u' } },
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: 58, y: 30 }, size: { w: 30, h: 16 }, noRun: true, props: { lines: ['hydrogen 1.0', 'carbon 12.0', 'oxygen 16.0'] } }
      ]
    }),
    hints: [
      'Join hydrogen atoms to the carbon atom, then drag the molecule onto the scale\'s pan.',
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
      if (formula !== 'CH₄') return { ok: false, msg: 'That is not methane. Check how many atoms of each kind its formula calls for.' };
      return { ok: true };
    },
    reward: {
      log: 'Methane on the scale: one carbon and four hydrogen.',
      title: 'Formula Mass',
      body: 'The scale read 12.0 + 1.0 + 1.0 + 1.0 + 1.0, the listed masses of the atoms in one molecule, added up. Adding up the listed masses of every atom in one molecule of a substance gives its formula mass, and there is nothing more to it than that.'
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
      'Drag a crate onto the scale\'s pan and press "Weigh", then do the same for the other two.',
      'Each reading lands as a point on the strip, with the listed mass of one atom across and the weight of sixty up.',
      'Press "Straightedge" to lay a line across the points and see whether all three keep to it.'
    ],
    check(state) {
      const t = state.table;
      const rows = t.recorder.rows;
      const kinds = new Set(rows.map(r => r.label));
      if (!kinds.size) return { ok: false, notYet: true, msg: 'Nothing has been weighed yet. Put a crate on the pan and weigh it.' };
      if (kinds.size < 3) return { ok: false, msg: 'Two points always make a line. Weigh the third element too, to see whether it keeps to the line.' };
      const line = lineOf(t.recorder);
      if (!line) return { ok: false, notYet: true, msg: 'Lay the straightedge across the points to see how the weights keep to the listed masses.' };
      const bad = rows.find(r => Math.abs(readY(line, r.x) - r.y) > 1e-6 * r.y);
      if (bad) return { ok: false, msg: 'The line misses one of the points. Lay it across two points that you trust.' };
      return { ok: true };
    },
    reward: {
      log: 'Three samples of 60: 60, 720 and 960 on the scale.',
      title: 'Equal Counts Weigh In the Same Ratio',
      body: 'Three samples holding exactly the same number of atoms weighed 60, 720 and 960 — one, twelve and sixteen times each other, which is the ratio of their listed masses. It has to come out that way: if one carbon atom weighs twelve times one hydrogen atom, any equal counts of the two weigh in that same twelve to one ratio. Run that backwards and you have a way of measuring out equal counts without counting anything.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Measure Out a Matching Count',
    briefing: {
      speaker: SPEAKER,
      body: 'A dozen eggs and a dozen bowling balls weigh differently but count the same. Each pan now has an atom counter, and the drum pours grams.'
    },
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
      'Pour oxygen from the drum onto the right pan and read both atom counters.',
      'Watch the beam as the counters get closer: equal counts do not have to weigh the same.',
      'Keep pouring until the right counter reads exactly what the left one does, then look at what the right pan holds.'
    ],
    check(state) {
      const t = state.table;
      const c = countersMatch(t);
      if (c.r === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour some oxygen onto it.' };
      if (poured(t, 'oxygen') === 12) return { ok: false, msg: 'Equal weights are not equal counts: an oxygen atom is heavier, so the same weight of it holds fewer atoms.' };
      if (!c.same) {
        return { ok: false, msg: c.r > c.l
          ? 'The right counter reads more than the left, so there are too many atoms on the right pan.'
          : 'The right counter reads less than the left, so there are too few atoms on the right pan.' };
      }
      return { ok: true };
    },
    reward: {
      log: '12.0 g of carbon matches 16.0 g of oxygen.',
      title: 'The Mole',
      body: "Take the listed mass of any element in grams and you have taken the same number of atoms every time, and that amount is called one mole of it. Nobody picked the number: it falls out of the listed masses already being ratios of one another. It works out to 6.02 x 10^23 atoms — a 6 followed by 23 zeros — a figure called Avogadro's number, and that count being far too big to say any other way is the whole reason the word mole exists."
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
      'Pour carbon dioxide from the drum onto the right pan and compare the two counters.',
      'The pan counts molecules, one for each carbon and two oxygen joined together, and the other pan counts atoms.',
      'Keep pouring until the counters agree, then read how many grams are on the right pan.'
    ],
    check(state) {
      const t = state.table;
      const c = countersMatch(t);
      if (c.r === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour some carbon dioxide onto it.' };
      const grams = poured(t, 'carbon dioxide');
      if (grams === 12) return { ok: false, msg: 'Equal weights are not equal counts: a carbon dioxide molecule is heavier than a carbon atom.' };
      if (!c.same) {
        return { ok: false, msg: c.r > c.l
          ? 'The right counter reads more than the left, so there are too many molecules on the right pan.'
          : 'The right counter reads less than the left, so there are too few molecules on the right pan.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One mole of carbon dioxide weighs 44.0 grams.',
      title: 'Molar Mass',
      body: 'The rule does not stop at elements: add up the listed masses of every atom in one molecule of a compound and that many grams of it is one mole of its molecules. Here 12.0 + 16.0 + 16.0 = 44.0, so 44.0 grams holds 6.02 x 10^23 molecules of it. That figure, grams per mole, is called the molar mass, and every substance has one.'
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
      'Pour water onto the right pan until its count matches the carbon pan, and note how many grams that takes.',
      'The drum is made up of equal scoops of that size.',
      'Divide the drum\'s grams by the grams on the matching pan, and set the tally to the result.'
    ],
    check(state) {
      const t = state.table;
      const n = t.fixtures.tally.dials.n.value;
      if (n === 0) return { ok: false, notYet: true, msg: 'The tally is on zero. Set it to the number of matching scoops in the drum.' };
      if (n === 1) return { ok: false, msg: 'One matching scoop is the amount that balances the carbon pan\'s count. Compare that with what the whole drum holds.' };
      if (n === 2) return { ok: false, msg: 'Two matching scoops would weigh twice one scoop. Compare that with what the whole drum holds.' };
      if (n !== molesOf('water', 72)) return { ok: false, msg: 'Work out how many of the matching scoops make up the drum from the grams in one scoop.' };
      return { ok: true };
    },
    reward: {
      log: 'The drum holds 4 matching scoops: 4 moles.',
      title: 'Grams and Moles Convert Both Ways',
      body: 'The molar mass is the bridge between the two: divide a mass in grams by it to get moles, multiply moles by it to get grams. 72 grams at 18 grams per mole is 4 moles, and those 4 moles hold four times 6.02 x 10^23 molecules. Every real measurement you can take is a mass and every recipe is a count, so this is the conversion that joins the two.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Moles of Each Element',
    prompt: 'Pour hydrogen onto the right pan until it holds as many hydrogen atoms as two moles of water.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { L: { label: 'H ATOMS', of: 'H' }, R: { label: 'H ATOMS', of: 'H' } },
      refCrate: crate('two', 'WATER', { x: 0, y: 0 }, { species: 'water', grams: 36, note: '2 moles' }),
      drum: { label: 'Hydrogen drum', what: 'hydrogen', amount: 10 },
      steps: { hydrogen: 1 },
      capacity: 10
    }),
    hints: [
      'Pour hydrogen from the drum onto the right pan and watch its hydrogen-atom counter.',
      'Compare it with the left counter, which counts only the hydrogen atoms in the water.',
      'Each water molecule holds two hydrogen atoms, so there are more hydrogen atoms in the water than molecules.'
    ],
    check(state) {
      const t = state.table;
      const c = countersMatch(t);
      if (c.r === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour some hydrogen onto it.' };
      if (!c.same) {
        return { ok: false, msg: c.r > c.l
          ? 'The right counter reads more than the left, so there is too much hydrogen on the right pan.'
          : 'The right counter reads less than the left, so there is too little hydrogen on the right pan.' };
      }
      return { ok: true };
    },
    reward: {
      log: '2 moles of water hold 4 moles of hydrogen.',
      title: 'A Recipe Reads in Moles',
      body: 'The numbers in a formula are a ratio of atoms, and a ratio does not care what unit you count in: two hydrogen per molecule is also two moles of hydrogen per mole of molecules. So two moles of this compound hold four moles of hydrogen and two moles of oxygen. That is why the formula written for a single molecule is the same formula a yard uses to weigh out a shipment.'
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
      fixtures: [{ id: 'scale', kind: 'scale', label: 'Scale', at: { x: 118, y: 22 }, size: { w: 56, h: 34 }, noRun: true, props: { pan: 'slot:weigh', unit: 'g', counter: { label: 'ATOMS' } } }]
    }),
    hints: [
      'Drag a drum onto the scale\'s pan to read what it weighs and how many atoms it holds, then drag it back to the rail.',
      'The heaviest drum is not always the one with the most atoms, so compare the counters.',
      'Put the drums in order of their atom counters, the smallest count at the left end.'
    ],
    check(state) {
      const t = state.table;
      const order = t.zones.rail.order;
      if (order.length < 3) return { ok: false, notYet: true, msg: 'All three drums belong on the rail. Put the drum on the scale back.' };
      const atoms = id => molesOf(t.pieces[id].props.species, t.pieces[id].props.grams);
      const want = ['d1', 'd2', 'd3'].sort((a, b) => atoms(a) - atoms(b));
      if (order.join() !== want.join()) {
        return { ok: false, msg: 'The drums are not in order of their atom counters. The heaviest drum is not necessarily the one with the most atoms.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The lightest drum holds the most atoms.',
      title: 'Weight Is Not Count',
      body: 'The lightest drum on the floor holds the most atoms, because a hydrogen atom weighs a sixteenth of what an oxygen atom does. A balance only ever reports mass, so a count is always a mass divided by a molar mass. Every real measurement in chemistry begins with that division and ends with the reverse of it.',
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
    },
    {
      heading: 'Next',
      body: 'You\'ve mastered weighing and counting on Tallow! Now, one colossal rogue machine stands on the salt flats: the refinery Hopper. Let\'s put everything together!'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Water is H2O. Hydrogen is 1.0 and oxygen is 16.0. How many moles are in 36 grams of water?',
    options: [
      { id: 'a', label: '1 mole' },
      { id: 'b', label: '2 moles' },
      { id: 'c', label: '18 moles' },
      { id: 'd', label: '36 moles' }
    ],
    answer: 'b',
    explanation: 'One molecule of water weighs 16.0 + 1.0 + 1.0 = 18.0, so the molar mass is 18 grams per mole. 36 / 18 = 2 moles.'
  },
  {
    question: 'Carbon is 12.0 and oxygen is 16.0. What is the molar mass of carbon dioxide, CO2?',
    options: [
      { id: 'a', label: '28 grams per mole' },
      { id: 'b', label: '32 grams per mole' },
      { id: 'c', label: '44 grams per mole' },
      { id: 'd', label: '56 grams per mole' }
    ],
    answer: 'c',
    explanation: 'One CO2 holds one carbon and TWO oxygens: 12.0 + 16.0 + 16.0 = 44.0. The answer 28 counts only one oxygen, which is carbon monoxide instead.'
  },
  {
    question: 'You have 12 grams of carbon (12.0) and 12 grams of magnesium (24.3). Which holds more atoms?',
    options: [
      { id: 'a', label: 'The carbon' },
      { id: 'b', label: 'The magnesium' },
      { id: 'c', label: 'They hold the same number, because they weigh the same' },
      { id: 'd', label: 'There is no way to tell' }
    ],
    answer: 'a',
    explanation: '12 / 12.0 = 1 mole of carbon, but 12 / 24.3 = about 0.49 moles of magnesium. A magnesium atom is roughly twice as heavy, so the same mass of it holds about half as many atoms.'
  },
  {
    question: 'How many moles of hydrogen atoms are in 2 moles of water, H2O?',
    options: [
      { id: 'a', label: '1' },
      { id: 'b', label: '2' },
      { id: 'c', label: '4' },
      { id: 'd', label: '6' }
    ],
    answer: 'c',
    explanation: 'Each water molecule holds 2 hydrogen atoms, so each mole of water holds 2 moles of hydrogen. Two moles of water therefore hold 2 x 2 = 4 moles of hydrogen atoms.'
  },
  {
    question: 'What does it mean to say you have one mole of iron?',
    options: [
      { id: 'a', label: 'You have one iron atom' },
      { id: 'b', label: 'You have one gram of iron' },
      { id: 'c', label: 'You have 6.02 x 10^23 iron atoms, which weigh 55.8 grams' },
      { id: 'd', label: 'You have as much iron as will fit in a standard container' }
    ],
    answer: 'c',
    explanation: 'A mole is a fixed count, 6.02 x 10^23, chosen so that one mole of any element weighs its listed atomic mass in grams. Iron is listed at 55.8, so one mole of it is 55.8 grams.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const weighIn = piece => [to(piece, 'slot:pan'), { run: 'scale' }];
const joinTo = (a, b) => ({ join: [a, b] });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ fetch: 'sack' }, to('sack', 'container:pan-r'), ...pourSteps('carbon', 50, 4)],
  [joinTo('h1', 'c'), joinTo('h2', 'c'), joinTo('h3', 'c'), joinTo('h4', 'c'), to('c', 'container:pan')],
  [...weighIn('h'), ...weighIn('c'), ...weighIn('o'), { lay: { kind: 'straightedge', through: [0, 2] } }],
  pourSteps('oxygen', 4, 4),
  pourSteps('carbon dioxide', 11, 4),
  [...pourSteps('water', 6, 3), { setDial: { fixture: 'tally', dial: 'n', value: 4 } }],
  pourSteps('hydrogen', 1, 4),
  [to('d2', 'slot:weigh'), to('d2', 'rail:0'), to('d1', 'slot:weigh'), to('d1', 'rail:1'), to('d3', 'slot:weigh'), to('d3', 'rail:2')]
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
  [to('d3', 'slot:weigh'), to('d3', 'rail:2')]
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
