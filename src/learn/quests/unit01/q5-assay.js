/**
 * q5-assay.js — Tallow, site five: THE WEIGHT ON THE CARD.
 *
 * The fifth bench on Tallow, and the fifth on the TABLETOP (plan `bench-tabletop.md`,
 * phase T2): the mass kit (`table/kits/mass.js`) on the weigh hopper under the belt's discharge.
 * A sample card is dropped in the chute and tipped; its atoms land in bins by weight, and a beam
 * lies under the piles on a fulcrum the player slides along the ruler. The beam lies level where
 * the fulcrum sits at the average weight of the atoms: the weighted average is a balance point,
 * found with the hand and never printed. It answers the question the catalogue left lying there:
 * a single atom always has a whole-number mass, and almost none of the listed masses are whole
 * numbers.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  tip one kind and read the code of each bin -> A sample is a mix of isotopes
 *   2  tip two samples of the same stock          -> Abundance
 *   3  slide the fulcrum under the piles         -> The listed mass is an average
 *   4  do the balancing on a fresh sample        -> Average atomic mass
 *   5  predict a sample that lands in one bin    -> Why some masses are whole
 *   6  balance a sealed canister with a made-up mix -> The average pins the mix
 *   7  name three unlabelled samples             -> The mass names the element
 *   8  three claims of the same stock            -> The mass is a fingerprint
 *   -- debrief: what a listed mass really is, and what comes after Tallow.
 *
 * WHAT THIS BENCH DOES NOT DO. It never counts a heap too large to count, and
 * it never converts a weight into a number of atoms. Counting by weighing —
 * the mole, molar mass and Avogadro's number — belongs to the next bench, and a unit
 * that has only just met the weighted average has no business being handed it. Nor does
 * any instrument here divide: a beam compares, a fulcrum balances, a bin counts.
 *
 * FIELD (stage 1). A draw can be taken from the weigh hopper's catch bins: the field point
 * is a real piece of the host (`tallow/stations.js` `buildWeighHopper`). It is evidence, never a
 * lock: the stage is answered with the bench's own Sample A, and at T1 to T3 the same fetch is a
 * drawn site plate.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { massTable, assayRead, balanceRead, mixRead } from '../../table/kits/mass.js';

export const meta = { stageCount: 8 };

/**
 * When each withheld word is earned. Everything the first four benches taught —
 * proton, neutron, electron, element, isotope, ion, atomic number, mass number,
 * period, group — is a plain word here. Nothing in this table is player-facing.
 */
export const VOCABULARY = [
  { term: /\babundances?\b/i, introducedAt: 2 },
  { term: /\baverage atomic mass\b/i, introducedAt: 4 },
  { term: /\bweighted average\b/i, introducedAt: 4 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE LISTED MASSES
   The figures the player charted at site three, kept here as the bench's
   own reference sheet. Nothing on this bench may change one.
   ------------------------------------------------------------------ */
export const CARD_MASS = {
  'boron': 10.8,
  'fluorine': 19.0,
  'neon': 20.2,
  'chlorine': 35.5
};

/**
 * THIS TABLE HAS NOTHING TO EXPLAIN, AND SAYS NOTHING. "Tip Sample" tips the sample, "Read Code"
 * reads the code, and the fulcrum is a triangle under a beam. A legend restating a key's own label is
 * noise between the player and the bench. Kept so the quest contract (`toolNoteFor`) holds.
 */
export function toolNoteFor() { return null; }

/**
 * The average weight of one atom in a set of bins. NOT WHAT ANY INSTRUMENT ON THIS TABLE REPORTS, AND
 * THAT IS THE POINT: a beam compares and the fulcrum is found by hand. This is the arithmetic the
 * balance point equals, written once so a check that refuses a fulcrum and a recomputation in
 * `verify:learn` cannot drift apart.
 */
export function averageOf(bins) {
  const count = (bins || []).reduce((n, b) => n + b.n, 0);
  if (!count) return 0;
  return Math.round(((bins || []).reduce((m, b) => m + b.mass * b.n, 0) / count) * 100) / 100;
}

/* ------------------------------------------------------------------
   THE TABLES
   One layout (150 x 72 units): the chute and the loose samples down the left, the assay across the top
   (the chute's sorter with its piles, ruler, beam and fulcrum), and trays or the other instruments
   along the bottom.
   ------------------------------------------------------------------ */

const SAMPLE_X = 14;
const CHUTE = { id: 'chute', label: 'Chute', at: { x: SAMPLE_X, y: 14 }, size: { w: 20, h: 17 } };

/** A sample card: a hopper of salvage with its declared bins. */
const sample = (id, label, bins, at, props = {}) => ({
  id, kind: 'sample', label, at, props: { bins, note: `${bins.reduce((n, b) => n + b.n, 0)} atoms`, ...props }
});

const assayFixture = (box, extra = {}) => ({
  id: 'assay', kind: 'assay', label: 'Assay', runLabel: 'Tip Sample', at: box.at, size: box.size, props: { slot: 'chute' }, ...extra
});

/** The fulcrum: a dial along the ruler, which is the track the knob slides on. */
const fulcrum = (min, max, value) => ({ pivot: { min, max, step: max - min > 6 ? 0.5 : 0.1, value, label: 'Fulcrum' } });

const trayAt = (id, label, x, y, w, cell = 19, h = 22) => ({ id, label, at: { x, y }, size: { w, h }, cell });

const CL = [{ mass: 35, n: 30 }, { mass: 37, n: 10 }];
const NE = [{ mass: 20, n: 36 }, { mass: 22, n: 4 }];
const B = [{ mass: 10, n: 8 }, { mass: 11, n: 32 }];

const trayOf = (t, id) => (t.pieces[id].zone || '').replace('tray:', '');
const chuteSample = t => assayRead(t, 'assay');

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   Exported so `verify:learn` and `verify:table` can run SOLUTIONS and MISSES through every `check`.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Tip It Out',
    briefing: {
      speaker: SPEAKER,
      body: 'This bench sorts atoms down a chute into bins by weight. Drop a sample in the chute and press "Tip Sample", then read the code of a bin with "Read Code".'
    },
    prompt: 'Tray Sample A by how many elements its atoms belong to.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        sample('a', 'SAMPLE A', CL, { x: SAMPLE_X, y: 34 }, { code: 'chlorine' }),
        { ...sample('draw', 'HOPPER DRAW', CL, { x: SAMPLE_X, y: 49 }, { code: 'chlorine' }), hidden: true, fetchFrom: 'hopper' }
      ],
      zones: {
        slots: [CHUTE],
        trays: [trayAt('one', 'One element', 88, 56, 38), trayAt('two', 'Two elements', 130, 56, 38)]
      },
      fixtures: [
        assayFixture({ at: { x: 69, y: 23 }, size: { w: 82, h: 42 } }),
        {
          id: 'coder', kind: 'coder', label: 'Code', runLabel: 'Read Code', at: { x: 127, y: 23 }, size: { w: 34, h: 42 },
          props: { assay: 'assay' }, dials: { bin: { min: 1, max: 2, step: 1, value: 1, label: 'Bin' } }
        }
      ],
      fetch: [{ id: 'hopper', label: 'Hopper draw', at: { x: SAMPLE_X, y: 65 } }]
    }),
    hints: [
      'Drop Sample A in the chute and press "Tip Sample".',
      'Turn the "Bin" dial to each bin in turn, press "Read Code", and compare what the two bins say.',
      'If both bins read the same name the atoms are one element, and if the two names differ they are two elements.'
    ],
    check(state) {
      const t = state.table;
      const here = trayOf(t, 'a');
      if (!['one', 'two'].includes(here)) return { ok: false, notYet: true, msg: 'Sample A has no tray yet.' };
      if (here === 'two') return { ok: false, msg: 'Read the code on each bin and compare: two elements would read two different names.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 30 atoms at 35, 10 at 37, all chlorine.',
      title: 'A Sample Is a Mix of Isotopes',
      body: 'Both bins read chlorine, so every atom holds 17 protons and every atom is the same element. The 35s and the 37s differ only in neutrons, which makes them isotopes of each other. A natural sample of an element is a mixture of its isotopes, and this is what that looks like.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Run It Twice',
    prompt: 'Tray each sample under how many of its atoms in every hundred land in the lighter bin.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        sample('a', 'SAMPLE A', CL, { x: SAMPLE_X, y: 34 }),
        sample('b', 'SAMPLE B', [{ mass: 35, n: 60 }, { mass: 37, n: 20 }], { x: SAMPLE_X, y: 49 })
      ],
      zones: {
        slots: [CHUTE],
        trays: [
          trayAt('s25', '25 in every 100', 47, 56, 34, 17),
          trayAt('s50', '50 in every 100', 85, 56, 34, 17),
          trayAt('s75', '75 in every 100', 123, 56, 34, 17)
        ]
      },
      fixtures: [assayFixture({ at: { x: 87, y: 19 }, size: { w: 114, h: 34 } })]
    }),
    hints: [
      'Drop a sample in the chute and press "Tip Sample", then do the same with the other sample.',
      'Read the tally over the lighter bin and the number of atoms on the card, for each sample.',
      'Divide the lighter bin\'s tally by the sample\'s total and scale it to a hundred, then check that both samples agree.'
    ],
    check(state) {
      const t = state.table;
      const mine = { a: trayOf(t, 'a'), b: trayOf(t, 'b') };
      const names = { a: 'Sample A', b: 'Sample B' };
      for (const id of ['a', 'b']) if (!['s25', 's50', 's75'].includes(mine[id])) return { ok: false, notYet: true, msg: `${names[id]} has no tray yet.` };
      for (const id of ['a', 'b']) {
        if (mine[id] === 's25') return { ok: false, msg: `${names[id]}'s tray is the heavier bin's share, and the question asks about the lighter bin.` };
        if (mine[id] === 's50') return { ok: false, msg: `An even split would put the same number in each bin. Compare ${names[id]}'s two tallies.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Both samples split 75 to 25.',
      title: 'Abundance',
      body: 'Two samples of different sizes gave the same split, because the proportions of an element\'s isotopes belong to the material and not to the scoop you took. The share of a sample that is one isotope is called that isotope\'s abundance. Here it is 75 percent at weight 35 and 25 percent at weight 37.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where 35.5 Sits',
    prompt: 'Find the point where Sample A\'s piles balance on the beam.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'SAMPLE A', CL, { x: SAMPLE_X, y: 34 })],
      zones: { slots: [CHUTE] },
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: SAMPLE_X, y: 56 }, size: { w: 24, h: 16 }, noRun: true, props: { lines: ['chlorine', 'listed mass', '35.5'] } },
        assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(34.5, 37.5, 36) })
      ]
    }),
    hints: [
      'Drop Sample A in the chute, press "Tip Sample", then slide the "Fulcrum" dial along the ruler.',
      'Watch which end of the beam dips as the fulcrum moves, and where it lies level.',
      'The beam lies level where the fulcrum is as far from the weight of the atoms on one side as from the other side\'s, counting every atom.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Tip Sample A into the chute, then slide the fulcrum.' };
      if (!r.level) {
        return { ok: false, msg: r.net > 0
          ? 'The beam dips on the heavy-weight side: the fulcrum sits too far from that side.'
          : 'The beam dips on the light-weight side: the fulcrum sits too far from that side.' };
      }
      return { ok: true };
    },
    reward: {
      log: '35.5 sits a quarter of the way from 35 to 37.',
      title: 'The Listed Mass Is an Average',
      body: 'The mass listed for an element is not the weight of any single atom. It is what one atom weighs on average across a natural sample, so it leans toward whichever isotope is common. Three quarters of this sample weighs 35, which is why the figure lands at 35.5.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Work Out the Average',
    prompt: 'Find the point where this boron sample balances on the beam.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'SAMPLE A', B, { x: SAMPLE_X, y: 34 }, { note: '40 atoms, nothing listed for it' })],
      zones: { slots: [CHUTE] },
      fixtures: [assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(9.5, 11.5, 10.5) })]
    }),
    hints: [
      'Drop the sample in the chute, press "Tip Sample", and slide the "Fulcrum" dial until the beam lies level.',
      'Read the tally over each bin and notice which pile is the bigger.',
      'Multiply each bin\'s weight by its share of the atoms and add the two results, then check that the fulcrum agrees.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Tip the sample into the chute, then slide the fulcrum.' };
      if (!r.level) {
        const middle = (r.bins[0].mass + r.bins[r.bins.length - 1].mass) / 2;
        if (r.pivot === middle) return { ok: false, msg: 'The plain middle of the two weights is not where it balances, because the two bins did not catch equal numbers.' };
        return { ok: false, msg: 'The beam still dips. Weigh each pile by how many atoms stand in it, and keep sliding until it lies level.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A averages 10.8 per atom.',
      title: 'Average Atomic Mass',
      body: 'You just worked out the average atomic mass: each isotope\'s mass counted in proportion to how much of it there is. Because the two amounts are not equal, that is called a weighted average rather than a plain one. It is the mass listed for every element, and it is why those numbers are almost never whole.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Only One Bin',
    prompt: 'Predict where the beam will balance under this fluorine sample, then test it.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'SAMPLE A', [{ mass: 19, n: 40 }], { x: SAMPLE_X, y: 34 })],
      zones: { slots: [CHUTE] },
      fixtures: [
        { id: 'plate', kind: 'plate', label: 'Listed', at: { x: SAMPLE_X, y: 56 }, size: { w: 24, h: 16 }, noRun: true, props: { lines: ['fluorine', 'listed mass', '19.0'] } },
        assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(18, 20, 19.6) })
      ],
      prediction: {
        slot: { id: 'predict', label: 'It will balance', at: { x: 61, y: 62 }, size: { w: 30, h: 14 } },
        tokens: [
          { id: 't-pile', label: 'At the pile\'s weight', at: { x: 99, y: 62 }, r: 7.2 },
          { id: 't-between', label: 'Between two weights', at: { x: 131, y: 62 }, r: 7.2 }
        ]
      }
    }),
    hints: [
      'Drop a prediction in its slot, then drop Sample A in the chute and press "Tip Sample".',
      'Count how many bins caught atoms, and compare with the last two samples, which landed in two.',
      'Slide the "Fulcrum" dial to where the beam lies level and see whether that place has a pile of its own.'
    ],
    check(state) {
      const t = state.table;
      if (!t.prediction.token) return { ok: false, notYet: true, msg: 'Drop a prediction in the slot: where will the beam balance?' };
      if (t.prediction.token !== 't-pile') {
        return { ok: false, msg: 'Test it: tip the sample, slide the fulcrum along the ruler and look at where the beam lies level and where the pile stands.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A: one weight only, 19.0 confirmed.',
      title: 'Why Some Masses Are Whole',
      body: 'A few elements occur as only one isotope, so there is nothing to weight and the listed mass comes out whole. That means the decimal on a listed mass is information, not untidiness. It tells you the element turns up as a mixture of isotopes, and roughly where in that mixture the weight sits.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Weighed Without Opening It',
    briefing: {
      speaker: SPEAKER,
      body: 'Two pans now hang from a beam, with a sealed canister on one. The mix dial makes up a pile of atoms on the other pan.'
    },
    prompt: 'Balance the sealed canister with a mix of 40 atoms of weight 20 and weight 22.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [{ ...sample('can', 'CANISTER', NE, { x: 30, y: 54 }, { sealed: true, note: '40 atoms' }), fixed: true, zone: 'container:pan-l' }],
      zones: { containers: [{ id: 'pan-l', label: 'Canister pan', at: { x: 30, y: 54 }, size: { w: 30, h: 26 }, cell: 30 }] },
      fixtures: [
        {
          id: 'balance', kind: 'balance', label: 'Balance', at: { x: 75, y: 22 }, size: { w: 130, h: 34 }, noRun: true,
          props: { unit: 'u', pans: { L: 'container:pan-l', R: { mix: 'mixer' } } }
        },
        {
          id: 'mixer', kind: 'mixer', label: 'Mix', at: { x: 122, y: 54 }, size: { w: 46, h: 24 }, noRun: true,
          props: { total: 40, light: { mass: 20 }, heavy: { mass: 22 } },
          dials: { heavy: { min: 0, max: 10, step: 1, value: 0, label: 'Heavy atoms' } }
        }
      ]
    }),
    hints: [
      'Turn the "Heavy atoms" dial and watch the beam tip toward whichever pan is heavier.',
      'The canister and the mix both hold 40 atoms, so only the weights of the atoms can set them apart.',
      'Add heavy atoms one at a time and stop at the first mix where neither pan dips.'
    ],
    check(state) {
      const t = state.table;
      const bal = balanceRead(t, 'balance');
      if (mixRead(t, 'mixer').heavy === 0) return { ok: false, notYet: true, msg: 'The mix is all light atoms. Turn the dial and watch the beam.' };
      if (!bal.level) {
        return { ok: false, msg: bal.lean > 0
          ? 'The mix pan is heavier than the canister: it holds too many heavy atoms.'
          : 'The canister pan is heavier than the mix: the mix holds too few heavy atoms.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A averages 20.2: 90 atoms light, 10 heavy.',
      title: 'The Average Pins the Mix',
      body: 'The weighting runs both ways: the abundances give you the average, and the average plus the two weights gives you the abundances. That is how a sealed sample is identified without being opened. It is also how the isotope proportions of the elements were first measured.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Name Three Samples',
    prompt: 'Tray each unknown sample under the element whose listed mass it balances at.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        sample('a', 'SAMPLE A', NE, { x: SAMPLE_X, y: 34 }),
        sample('b', 'SAMPLE B', CL, { x: SAMPLE_X, y: 49 }),
        sample('c', 'SAMPLE C', B, { x: SAMPLE_X, y: 64 })
      ],
      zones: {
        slots: [CHUTE],
        trays: [
          trayAt('boron', 'Boron 10.8', 51, 56, 38),
          trayAt('neon', 'Neon 20.2', 91, 56, 38),
          trayAt('chlorine', 'Chlorine 35.5', 131, 56, 38)
        ]
      },
      fixtures: [assayFixture({ at: { x: 87, y: 20 }, size: { w: 114, h: 36 } }, { dials: fulcrum(9, 38, 23.5) })]
    }),
    hints: [
      'Drop a sample in the chute, press "Tip Sample", and slide the "Fulcrum" dial until the beam lies level.',
      'Compare the point where each sample balances with the listed masses on the trays.',
      'The point where a sample balances is its average weight, and it sits at one tray\'s listed mass and no other\'s.'
    ],
    check(state) {
      const t = state.table;
      const want = { a: 'neon', b: 'chlorine', c: 'boron' };
      const names = { a: 'Sample A', b: 'Sample B', c: 'Sample C' };
      for (const id of ['a', 'b', 'c']) if (!['boron', 'neon', 'chlorine'].includes(trayOf(t, id))) return { ok: false, notYet: true, msg: `${names[id]} has no tray yet.` };
      for (const id of ['a', 'b', 'c']) {
        if (trayOf(t, id) !== want[id]) return { ok: false, msg: `${names[id]} is filed wrong. Find where its piles balance and match that point to a tray's listed mass.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'All three samples named off their weights.',
      title: 'The Mass Names the Element',
      body: 'Every element has its own isotopes in its own proportions, so its average weight is as good as a name. No two listed masses are the same. Balancing a heap named all three samples without opening any of them.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Claims',
    prompt: 'Tray each sample as natural chlorine or as having an altered mix of isotopes.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        sample('a', 'SAMPLE A', CL, { x: SAMPLE_X, y: 34 }, { note: 'sold as natural' }),
        sample('b', 'SAMPLE B', [{ mass: 35, n: 20 }, { mass: 37, n: 20 }], { x: SAMPLE_X, y: 49 }, { note: 'sold as natural' }),
        sample('c', 'SAMPLE C', [{ mass: 35, n: 38 }, { mass: 37, n: 2 }], { x: SAMPLE_X, y: 64 }, { note: 'sold as natural' })
      ],
      zones: {
        slots: [CHUTE],
        trays: [trayAt('natural', 'Natural 35.5', 70, 56, 38), trayAt('altered', 'Not natural', 116, 56, 38)]
      },
      fixtures: [assayFixture({ at: { x: 87, y: 20 }, size: { w: 114, h: 36 } }, { dials: fulcrum(34.5, 37.5, 36) })]
    }),
    hints: [
      'Drop a sample in the chute, press "Tip Sample", and slide the "Fulcrum" dial until the beam lies level.',
      'Every sample is chlorine, so the name will not tell them apart: compare where each one balances.',
      'Natural chlorine balances at its listed mass, and a sample that balances anywhere else has had its mix changed.'
    ],
    check(state) {
      const t = state.table;
      const want = { a: 'natural', b: 'altered', c: 'altered' };
      const names = { a: 'Sample A', b: 'Sample B', c: 'Sample C' };
      for (const id of ['a', 'b', 'c']) if (!['natural', 'altered'].includes(trayOf(t, id))) return { ok: false, notYet: true, msg: `${names[id]} has no tray yet.` };
      for (const id of ['a', 'b', 'c']) {
        if (trayOf(t, id) !== want[id]) return { ok: false, msg: `${names[id]} is filed wrong. Find where its piles balance and compare that point with the listed mass.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'One sample natural, two altered.',
      title: 'The Mass Is a Fingerprint of the Mix',
      body: 'All three samples were chlorine, and only one of them had the natural mix. A listed mass says more than which element you have: it says what proportions that element\'s isotopes turn up in. Change the mix and the weight moves off the listed figure.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player found, what the number means, and
   what the next world is about.
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'A real sample of an element is a mixture of isotopes, and the proportions are fixed for that element. The mass listed for it is what one atom weighs on average across that mixture.'
    },
    {
      heading: 'Why It Has a Decimal',
      body: 'A single atom always has a whole-number mass, but an average over a mixture usually does not. The average leans toward the most common isotope, so the decimal tells you how the mix sits.'
    },
    {
      heading: 'Next',
      body: 'Excellent assaying! Now that you know how average atomic mass works, let\'s see how chemists count trillions of atoms just by weighing them.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Chlorine is listed at 35.5, but no chlorine atom weighs 35.5. Why?',
    options: [
      { id: 'a', label: 'The measurement is not precise enough' },
      { id: 'b', label: 'It is the average over chlorine\'s natural mix of isotopes' },
      { id: 'c', label: 'Chlorine atoms lose mass when weighed' },
      { id: 'd', label: 'It is the mass of a chlorine molecule, not an atom' }
    ],
    answer: 'b',
    explanation: 'Natural chlorine is about 75% chlorine-35 and 25% chlorine-37. Averaging 35 and 37 in those amounts gives 35.5, so the number describes the mixture, not one atom.'
  },
  {
    question: 'An element has two isotopes: mass 10 at 20% and mass 11 at 80%. What is its average atomic mass?',
    options: [
      { id: 'a', label: '10.2' },
      { id: 'b', label: '10.5' },
      { id: 'c', label: '10.8' },
      { id: 'd', label: '11.0' }
    ],
    answer: 'c',
    explanation: 'Multiply each mass by its share and add: (0.20 x 10) + (0.80 x 11) = 2 + 8.8 = 10.8. It sits near 11 because mass 11 is the common one.'
  },
  {
    question: 'An element\'s average atomic mass is listed as exactly 19.0. What does that most likely mean?',
    options: [
      { id: 'a', label: 'It occurs as only one isotope' },
      { id: 'b', label: 'It has no neutrons' },
      { id: 'c', label: 'The number has been rounded off' },
      { id: 'd', label: 'Its isotopes are present in equal amounts' }
    ],
    answer: 'a',
    explanation: 'A single atom always has a whole-number mass, so a whole-number average means there is nothing to average. Fluorine is essentially all fluorine-19.'
  },
  {
    question: 'Copper has isotopes of mass 63 and 65, and its average atomic mass is 63.5. Which isotope is more common?',
    options: [
      { id: 'a', label: 'Copper-65, because it is heavier' },
      { id: 'b', label: 'Copper-63, because the average sits closer to 63' },
      { id: 'c', label: 'They are equally common' },
      { id: 'd', label: 'You cannot tell from the average' }
    ],
    answer: 'b',
    explanation: 'The average always leans toward the more common isotope. 63.5 is a quarter of the way from 63 to 65, so about three quarters of copper is copper-63.'
  },
  {
    question: 'Two samples are both pure chlorine, but one weighs 35.5 per atom and the other 36.0. What is true of the second one?',
    options: [
      { id: 'a', label: 'It contains a different element' },
      { id: 'b', label: 'Its atoms each carry extra electrons' },
      { id: 'c', label: 'Its mix of isotopes has been changed from the natural one' },
      { id: 'd', label: 'It was weighed wrong' }
    ],
    answer: 'c',
    explanation: 'Both are chlorine, so both have 17 protons. Natural chlorine is 75% mass 35 and 25% mass 37, which averages 35.5, so 36.0 means the sample holds extra chlorine-37.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const tip = piece => [to(piece, 'slot:chute'), { run: 'assay' }];
const slide = value => ({ setDial: { fixture: 'assay', dial: 'pivot', value } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [{ fetch: 'hopper' }, ...tip('a'), { run: 'coder' }, { setDial: { fixture: 'coder', dial: 'bin', value: 2 } }, { run: 'coder' }, to('a', 'tray:one')],
  [...tip('a'), ...tip('b'), to('a', 'tray:s75'), to('b', 'tray:s75')],
  [...tip('a'), slide(35.5)],
  [...tip('a'), slide(10.8)],
  [{ predict: 't-pile' }, ...tip('a'), slide(19)],
  [{ setDial: { fixture: 'mixer', dial: 'heavy', value: 4 } }],
  [...tip('a'), slide(20), ...tip('b'), slide(35.5), ...tip('c'), slide(11), to('a', 'tray:neon'), to('b', 'tray:chlorine'), to('c', 'tray:boron')],
  [...tip('a'), slide(35.5), ...tip('b'), slide(36), ...tip('c'), slide(35), to('a', 'tray:natural'), to('b', 'tray:altered'), to('c', 'tray:altered')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...tip('a'), { run: 'coder' }, { setDial: { fixture: 'coder', dial: 'bin', value: 2 } }, { run: 'coder' }, to('a', 'tray:two')],
  [...tip('a'), ...tip('b'), to('a', 'tray:s75'), to('b', 'tray:s25')],
  [...tip('a'), slide(36)],
  [...tip('a'), slide(10.5)],
  [{ predict: 't-between' }, ...tip('a'), slide(19)],
  [{ setDial: { fixture: 'mixer', dial: 'heavy', value: 1 } }],
  [...tip('a'), ...tip('b'), ...tip('c'), to('a', 'tray:boron'), to('b', 'tray:chlorine'), to('c', 'tray:neon')],
  [...tip('a'), ...tip('b'), ...tip('c'), to('a', 'tray:natural'), to('b', 'tray:natural'), to('c', 'tray:altered')]
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
