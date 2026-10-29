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
 *   1  tip two samples and read the code of each bin -> A sample is a mix of isotopes
 *   2  tip two samples of the same stock          -> Abundance
 *   3  slide the fulcrum under the piles         -> The listed mass is an average
 *   4  do the balancing on a fresh sample        -> Average atomic mass
 *   5  PREDICT: where will a one-bin sample balance (no instrument yet) -> Predict, then test
 *   6  TEST: tip it and find the balance point    -> Why some masses are whole (the guess is never graded)
 *   7  balance a sealed canister with a made-up mix -> The average pins the mix
 *   8  three claims of the same stock            -> The mass is a fingerprint
 *      (A stage that named three unlabelled samples by their balance point repeated stages 3 and 4
 *      with a tray at the end, and was cut. The Hopper's slag phase still asks it.)
 *   -- debrief: what a listed mass really is, and what comes after Tallow.
 *
 * WHAT THIS BENCH DOES NOT DO. It never counts a heap too large to count, and
 * it never converts a weight into a number of atoms. Counting by weighing —
 * the mole, molar mass and Avogadro's number — belongs to the next bench, and a unit
 * that has only just met the weighted average has no business being handed it. Nor does
 * any instrument here divide: a beam compares, a fulcrum balances, a bin counts.
 *
 * NO FIELD FETCH. Stage 1 once sent the player to the hopper's catch bins for a draw that was
 * the same chlorine as Sample A, so the walk carried nothing and was retired (problems doc U3).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { massTable, assayRead, balanceRead, mixRead } from '../../table/kits/mass.js';

export const meta = { stageCount: 10 };

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

/** The key the player's guess is kept under (`engine/predict.js`) and what each token is called in the test's prompt. */
const QUEST_KEY = 'unit01/q5-assay';
const TOKEN_LABEL = { 't-pile': 'At the pile\'s weight', 't-between': 'Between two weights' };
const CHUTE = { id: 'chute', label: 'Chute', at: { x: SAMPLE_X, y: 12 }, size: { w: 20, h: 17 } };

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
const LI = [{ mass: 6, n: 10 }, { mass: 7, n: 90 }];
const MG = [{ mass: 24, n: 32 }, { mass: 25, n: 4 }, { mass: 26, n: 4 }];

const trayOf = (t, id) => (t.pieces[id].zone || '').replace('tray:', '');
const chuteSample = t => assayRead(t, 'assay');

/* ------------------------------------------------------------------
   THE TEN STAGES
   Exported so `verify:learn` and `verify:table` can run SOLUTIONS and MISSES through every `check`.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Tip It Out',
    prompt: 'How many elements do the atoms of each sample belong to?',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [
        sample('a', 'SAMPLE A', CL, { x: SAMPLE_X, y: 34 }, { code: 'chlorine' }),
        // Two elements, one name per bin: the code is what tells it apart, not the look of the heap.
        sample('b', 'SAMPLE B', [{ mass: 23, n: 20, code: 'sodium' }, { mass: 35, n: 20, code: 'chlorine' }], { x: SAMPLE_X, y: 49 })
      ],
      zones: {
        slots: [CHUTE],
        trays: [trayAt('one', 'One element', 88, 60, 38), trayAt('two', 'Two elements', 130, 60, 38)]
      },
      fixtures: [
        assayFixture({ at: { x: 69, y: 23 }, size: { w: 82, h: 42 } }),
        {
          id: 'coder', kind: 'coder', label: 'Code', runLabel: 'Read Code', at: { x: 127, y: 23 }, size: { w: 34, h: 42 },
          props: { assay: 'assay' }, dials: { bin: { min: 1, max: 2, step: 1, value: 1, label: 'Bin' } }
        }
      ]
    }),
    hints: [
      'Use "Tip Sample", the "Bin" dial and "Read Code".',
      'Read the code of every bin of a sample and compare what the bins say.',
      'If every bin reads the same name the atoms are one element, and if the names differ they are more than one.'
    ],
    check(state) {
      const t = state.table;
      for (const [id, name] of [['a', 'Sample A'], ['b', 'Sample B']]) {
        if (!['one', 'two'].includes(trayOf(t, id))) return { ok: false, notYet: true, msg: `${name} has no tray yet.` };
      }
      if (trayOf(t, 'a') === 'two') return { ok: false, msg: 'Both bins of Sample A read the same name.' };
      if (trayOf(t, 'b') === 'one') return { ok: false, msg: 'The two bins of Sample B read different names.' };
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 30 atoms at 35, 10 at 37, all chlorine. Sample B: sodium and chlorine.',
      title: 'A Sample Is a Mix of Isotopes',
      body: 'Both bins of Sample A contain chlorine with 17 protons, differing only in neutrons as isotopes. Sample B contains two distinct elements. Natural samples are mixtures of isotopes.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Run It Twice',
    prompt: 'Sort each sample under how many of its atoms in every hundred land in the lighter bin.',
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
      'Use "Tip Sample" on each sample.',
      'Read the tally over the lighter bin and the number of atoms on the card, for each sample.',
      'Divide the lighter bin\'s tally by the sample\'s total and scale it to a hundred, then check that both samples agree.'
    ],
    check(state) {
      const t = state.table;
      const mine = { a: trayOf(t, 'a'), b: trayOf(t, 'b') };
      const names = { a: 'Sample A', b: 'Sample B' };
      for (const id of ['a', 'b']) if (!['s25', 's50', 's75'].includes(mine[id])) return { ok: false, notYet: true, msg: `${names[id]} has no tray yet.` };
      for (const id of ['a', 'b']) {
        if (mine[id] === 's25') return { ok: false, msg: `The lighter bin of ${names[id]} holds more than 25 in every 100.` };
        if (mine[id] === 's50') return { ok: false, msg: `The two tallies of ${names[id]} are not equal.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'Both samples split 75 to 25.',
      title: 'Abundance',
      body: 'Isotope proportions are consistent regardless of sample size. The percentage of an element occurring as a specific isotope is its abundance: here, 75% at mass 35 and 25% at mass 37.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Where the Piles Balance',
    prompt: 'Find the point where Sample A\'s piles balance on the beam.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'SAMPLE A', CL, { x: SAMPLE_X, y: 34 })],
      zones: { slots: [CHUTE] },
      fixtures: [assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(34.5, 37.5, 36) })]
    }),
    hints: [
      'Use "Tip Sample" and the "Fulcrum" dial.',
      'Watch which end of the beam dips as the fulcrum moves, and where it lies level.',
      'The beam lies level where the fulcrum is as far from the weight of the atoms on one side as from the other side\'s, counting every atom.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Tip Sample A into the chute, then slide the fulcrum.' };
      if (!r.level) {
        return { ok: false, msg: r.net > 0
          ? 'The beam dips on the heavy-weight side.'
          : 'The beam dips on the light-weight side.' };
      }
      return { ok: true };
    },
    reward: {
      log: '35.5 sits a quarter of the way from 35 to 37.',
      title: 'The Listed Mass Is an Average',
      body: 'A listed atomic mass is the average mass across a natural sample, leaning toward more common isotopes. Because 75% of chlorine is chlorine-35, the average is 35.5.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Work Out the Average',
    prompt: 'What does one atom of this boron sample weigh on average?',
    entry: { id: 'ans', label: 'Average weight', unit: 'u' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'SAMPLE A', B, { x: SAMPLE_X, y: 34 }, { note: '40 atoms, nothing listed for it' })],
      zones: { slots: [CHUTE] },
      fixtures: [assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(9.5, 11.5, 10.5) })]
    }),
    hints: [
      'Use "Tip Sample" to see the tallies, and the "Fulcrum" dial to test your figure.',
      'Read the tally over each bin and notice which pile is the bigger.',
      'Multiply each bin\'s weight by its share of the atoms and add the two results.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Tip the sample into the chute to see its piles.' };
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the average weight of one atom.' };
      const want = averageOf(B);
      if (Math.abs(v - want) <= 0.051) return { ok: true };
      const middle = (B[0].mass + B[1].mass) / 2;
      if (Math.abs(v - middle) < 0.051) return { ok: false, msg: 'The two piles are not the same size, so the beam would not balance at the middle of their weights.' };
      return { ok: false, msg: v < B[0].mass || v > B[1].mass ? 'An average cannot lie outside the lightest and heaviest atom.' : 'Slide the fulcrum to that weight: the beam does not lie level there.' };
    },
    reward: {
      log: 'Sample A averages 10.8 per atom.',
      title: 'Average Atomic Mass',
      body: 'Average atomic mass is the weighted average of an element\'s isotopes, weighted by their abundance. This is why listed masses are rarely whole numbers.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Predict the Balance',
    // A PREDICT STAGE: the chute, the bins and the fulcrum are not on the table yet. The guess is made first and comes back with the test.
    predict: true,
    prompt: 'Where will the beam balance under this fluorine sample?',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [{ ...sample('a', 'SAMPLE A', [{ mass: 19, n: 40 }], { x: SAMPLE_X, y: 34 }), fixed: true }],
      prediction: {
        slot: { id: 'predict', label: 'My prediction', at: { x: 87, y: 24 }, size: { w: 34, h: 16 } },
        tokens: [
          { id: 't-pile', label: 'At the pile\'s weight', at: { x: 64, y: 52 }, r: 7.2 },
          { id: 't-between', label: 'Between two weights', at: { x: 110, y: 52 }, r: 7.2 }
        ]
      }
    }),
    hints: [
      'Use the two tokens and the prediction slot.',
      'Compare this sample with the last two, which landed in two bins, and ask how many bins this one will fill.',
      'There is no wrong guess yet; commit to the one you would bet on.'
    ],
    check(state) {
      if (!state.table.prediction.token) return { ok: false, notYet: true, msg: 'Drop a token in the slot: where will the beam balance?' };
      return { ok: true };
    },
    onClear(state) {
      if (state.table.prediction.token) remember(QUEST_KEY, state.table.prediction.token);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Predict, Then Test',
      body: 'A prediction made before the test is the only kind a test can prove wrong. Next, the beam will answer yours.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Only One Bin',
    get prompt() {
      const guess = recall(QUEST_KEY);
      return TOKEN_LABEL[guess]
        ? `You predicted "${TOKEN_LABEL[guess]}": where does the beam balance under this fluorine sample?`
        : 'Where does the beam balance under this fluorine sample?';
    },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'SAMPLE A', [{ mass: 19, n: 40 }], { x: SAMPLE_X, y: 34 })],
      zones: { slots: [CHUTE] },
      fixtures: [assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(18, 20, 19.6) })]
    }),
    hints: [
      'Use "Tip Sample" and the "Fulcrum" dial.',
      'Count how many bins caught atoms, and compare with the last two samples, which landed in two.',
      'Slide the "Fulcrum" dial to where the beam lies level and see whether that place has a pile of its own.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Tip the sample, then slide the fulcrum.' };
      if (!r.level) return { ok: false, msg: 'The beam is not level at the fulcrum.' };
      return { ok: true };
    },
    get reward() {
      const guess = recall(QUEST_KEY);
      const verdict = !TOKEN_LABEL[guess] ? '' : guess === 't-pile'
        ? 'You predicted this, and the beam agreed. '
        : 'The beam did not agree with your prediction, which is how a guess gets better. ';
      return {
        log: 'Sample A: one weight only, 19.0 confirmed.',
        title: 'Why Some Masses Are Whole',
        body: `${verdict}All 40 atoms stand in one pile, so the beam levels at that pile's own weight and the listed mass comes out whole.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Weighed Without Opening It',
    prompt: 'Balance the sealed canister with a mix of 40 atoms of weight 20 and weight 22.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [{ ...sample('can', 'CANISTER', NE, { x: 30, y: 58 }, { sealed: true, note: '40 atoms' }), fixed: true, zone: 'container:pan-l' }],
      zones: { containers: [{ id: 'pan-l', label: 'Canister pan', at: { x: 30, y: 58 }, size: { w: 30, h: 26 }, cell: 30 }] },
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
      'Use the "Heavy atoms" dial.',
      'The canister and the mix both hold 40 atoms, so only the weights of the atoms can set them apart.',
      'Add heavy atoms one at a time and stop at the first mix where neither pan dips.'
    ],
    check(state) {
      const t = state.table;
      const bal = balanceRead(t, 'balance');
      if (mixRead(t, 'mixer').heavy === 0) return { ok: false, notYet: true, msg: 'The mix is all light atoms. Turn the dial and watch the beam.' };
      if (!bal.level) {
        return { ok: false, msg: bal.lean > 0
          ? 'The mix pan is the heavier pan.'
          : 'The canister pan is the heavier pan.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A averages 20.2: 90 atoms light, 10 heavy.',
      title: 'The Average Pins the Mix',
      body: 'The relationship works both ways: abundances determine average mass, and average mass reveals the isotope abundances of a sample.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Claims',
    prompt: 'Sort each sample as natural chlorine or as having an altered mix of isotopes.',
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
      'Use "Tip Sample" and the "Fulcrum" dial on each sample.',
      'Every sample is chlorine, so the name will not tell them apart: compare where each one balances.',
      'Natural chlorine balances at its listed mass, and a sample that balances anywhere else has had its mix changed.'
    ],
    check(state) {
      const t = state.table;
      const want = { a: 'natural', b: 'altered', c: 'altered' };
      const names = { a: 'Sample A', b: 'Sample B', c: 'Sample C' };
      for (const id of ['a', 'b', 'c']) if (!['natural', 'altered'].includes(trayOf(t, id))) return { ok: false, notYet: true, msg: `${names[id]} has no tray yet.` };
      for (const id of ['a', 'b', 'c']) {
        if (trayOf(t, id) !== want[id]) return { ok: false, msg: `${names[id]}'s tray does not match where its piles balance.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'One sample natural, two altered.',
      title: 'The Mass Is a Fingerprint of the Mix',
      body: 'All three samples were chlorine, but only one had the natural mix. Listed atomic mass reflects natural isotope proportions; altering the mix changes the measured mass.'
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    title: 'Three Piles',
    prompt: 'What does one atom of this magnesium sample weigh on average?',
    entry: { id: 'ans', label: 'Average weight', unit: 'u' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [sample('a', 'SAMPLE A', MG, { x: SAMPLE_X, y: 34 }, { code: 'magnesium' })],
      zones: { slots: [CHUTE] },
      fixtures: [assayFixture({ at: { x: 87, y: 24 }, size: { w: 114, h: 44 } }, { dials: fulcrum(23.5, 26.5, 25) })]
    }),
    hints: [
      'Use "Tip Sample" to see the tallies, and the "Fulcrum" dial to test your figure.',
      'Most of the atoms stand in one pile, so the average sits close to that pile\'s weight.',
      'Multiply each pile\'s weight by its share of the atoms and add the three results.'
    ],
    check(state) {
      const r = chuteSample(state.table);
      if (!r.sample || !r.poured) return { ok: false, notYet: true, msg: 'Tip the sample into the chute to see its piles.' };
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type the average weight of one atom.' };
      if (Math.abs(v - averageOf(MG)) <= 0.051) return { ok: true };
      if (Math.abs(v - 25) < 0.051) return { ok: false, msg: 'The three piles are not the same size, so the beam would not balance at the middle pile\'s weight.' };
      return { ok: false, msg: 'Slide the fulcrum to that weight: the beam does not lie level there.' };
    },
    reward: {
      log: 'Magnesium averages 24.3 across three isotopes.',
      title: 'Any Number of Isotopes',
      body: 'The same sum works for three isotopes or thirty: each weight counts in proportion to its share of the atoms. Magnesium is mostly mass 24, so its average, 24.3, sits just above 24.'
    }
  },

  /* ---------------------------------------------------------------- 10 */
  {
    title: 'Share From the Average',
    prompt: 'What percent of the atoms in the sealed lithium canister weigh 7?',
    entry: { id: 'ans', label: 'Weigh 7', unit: '%' },
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [{ ...sample('can', 'LITHIUM', LI, { x: 30, y: 58 }, { sealed: true, note: '100 atoms of weight 6 or 7' }), fixed: true, zone: 'container:pan-l' }],
      zones: { containers: [{ id: 'pan-l', label: 'Canister pan', at: { x: 30, y: 58 }, size: { w: 30, h: 26 }, cell: 30 }] },
      fixtures: [
        {
          id: 'balance', kind: 'balance', label: 'Balance', at: { x: 75, y: 22 }, size: { w: 130, h: 34 }, noRun: true,
          props: { unit: 'u', pans: { L: 'container:pan-l', R: { mix: 'mixer' } } }
        },
        {
          id: 'mixer', kind: 'mixer', label: 'Mix', at: { x: 122, y: 54 }, size: { w: 46, h: 24 }, noRun: true,
          props: { total: 100, light: { mass: 6 }, heavy: { mass: 7 } },
          dials: { heavy: { min: 0, max: 100, step: 5, value: 0, label: 'Heavy atoms' } }
        }
      ]
    }),
    hints: [
      'Use the "Heavy atoms" dial to try a mix against the canister, and type the percent that weigh 7.',
      'With no heavy atoms the mix weighs 600; each heavy atom added raises it by the same amount.',
      'Find how far the canister\'s weight sits above an all-light 100, and what fraction of the way that is to an all-heavy 100.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'ans');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a percent.' };
      if (Math.abs(v - 90) <= 0.51) return { ok: true };
      if (Math.abs(v - 50) < 0.51) return { ok: false, msg: 'With half the atoms at each weight the average would be at the middle of the two weights.' };
      if (Math.abs(v - 10) < 0.51) return { ok: false, msg: 'With that few heavy atoms the average would sit much nearer 6 than 6.9 does.' };
      return { ok: false, msg: 'That share of weight-7 atoms would not average 6.9.' };
    },
    reward: {
      log: 'Lithium: 90 percent weigh 7.',
      title: 'Working Back From the Average',
      body: 'The average sat 0.9 of the way from 6 to 7, so 90% of the atoms weigh 7. Natural lithium is close to this: about 92% lithium-7.',
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
const typed = (id, value) => ({ type: { entry: id, value: String(value) } });
const slide = value => ({ setDial: { fixture: 'assay', dial: 'pivot', value } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [...tip('a'), { run: 'coder' }, { setDial: { fixture: 'coder', dial: 'bin', value: 2 } }, { run: 'coder' }, to('a', 'tray:one'), ...tip('b'), { run: 'coder' }, { setDial: { fixture: 'coder', dial: 'bin', value: 2 } }, { run: 'coder' }, to('b', 'tray:two')],
  [...tip('a'), ...tip('b'), to('a', 'tray:s75'), to('b', 'tray:s75')],
  [...tip('a'), slide(35.5)],
  [...tip('a'), typed('ans', '10.8')],
  [{ predict: 't-pile' }],
  [...tip('a'), slide(19)],
  [{ setDial: { fixture: 'mixer', dial: 'heavy', value: 4 } }],
  [...tip('a'), slide(35.5), ...tip('b'), slide(36), ...tip('c'), slide(35), to('a', 'tray:natural'), to('b', 'tray:altered'), to('c', 'tray:altered')],
  [...tip('a'), typed('ans', '24.3')],
  [typed('ans', '90')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...tip('a'), { run: 'coder' }, { setDial: { fixture: 'coder', dial: 'bin', value: 2 } }, { run: 'coder' }, to('a', 'tray:two'), to('b', 'tray:two')],
  [...tip('a'), ...tip('b'), to('a', 'tray:s75'), to('b', 'tray:s25')],
  [...tip('a'), slide(36)],
  [...tip('a'), typed('ans', '10.5')],
  [],
  [...tip('a')],
  [{ setDial: { fixture: 'mixer', dial: 'heavy', value: 1 } }],
  [...tip('a'), ...tip('b'), ...tip('c'), to('a', 'tray:natural'), to('b', 'tray:natural'), to('c', 'tray:altered')],
  [...tip('a'), typed('ans', '25')],
  [typed('ans', '50')]
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
