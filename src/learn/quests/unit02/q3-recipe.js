/**
 * q3-recipe.js — Ligar, bench three: THE SAME RECIPE.
 *
 * The sampler scope from Tallow, wheeled out onto Ligar and pointed at
 * compounds rather than at single kinds. Bench one settled why a compound has a
 * ratio at all; this one settles how hard that ratio is, and what it looks like
 * when you weigh it instead of counting it.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  count a group in three samples of one stuff -> a compound has a fixed composition
 *   2  a sample with pieces nothing would take     -> extra pieces make a mixture
 *   3  two samples of the same two kinds           -> two compounds, whole numbers apart
 *   4  add up the masses in one group              -> a group weighs what its parts weigh
 *   5  which share of that weight is the heavy kind-> percent composition
 *   6  a weight ratio off the vent line            -> the empirical formula
 *   7  name three samples off their recipes        -> the recipe is the identity
 *   8  three claims against one label              -> a recipe is a test you can run
 *   -- debrief: what a formula really claims, and what the last bench does.
 *
 * WHAT THIS BENCH DOES NOT DO. Every group it asks about is one you can count.
 * Counting a heap far too large to count is bench four, and the mole belongs
 * there, not here.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { SampleScope, detailFor } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { dialMarkup, bindDial, paintDial as paintDialControl } from '../../engine/dial.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

/** When each withheld word is earned. Specific terms first. */
export const VOCABULARY = [
  { term: /\bfixed composition\b/i, introducedAt: 1 },
  { term: /\bpercent composition\b/i, introducedAt: 5 },
  { term: /\bempirical formulas?\b/i, introducedAt: 6 }
];

const SPEAKER = 'Vess';

/* ------------------------------------------------------------------
   THE CATALOGUE
   The scope's own filing, unchanged since Tallow's first bench. The
   masses are the ones charted at Tallow site five.
   ------------------------------------------------------------------ */
export const KINDS = {
  k01: { code: 'CAT 01', mass: 1.0, size: 0.30, tint: 'bone', note: 'The lightest thing the yard handles.' },
  k06: { code: 'CAT 06', mass: 12.0, size: 0.56, tint: 'iron', note: 'Dark and dry. Marks anything it touches.' },
  k07: { code: 'CAT 07', mass: 14.0, size: 0.54, tint: 'pale', note: 'Most of the air on this planet is this.' },
  k08: { code: 'CAT 08', mass: 16.0, size: 0.52, tint: 'rust', note: 'Turns up in almost every sample here.' },
  k11: { code: 'CAT 11', mass: 23.0, size: 0.74, tint: 'pale', note: 'Large, soft and dull.' },
  k17: { code: 'CAT 17', mass: 35.5, size: 0.66, tint: 'sand', note: 'Yellow and heavy. Sharp smell.' }
};

const massBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].mass / 40) * 10)));
const sizeBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].size / 0.8) * 10)));

/* ------------------------------------------------------------------
   SHAPES
   A `kinds` list alone means one centre with the rest holding on to it.
   Where that would misstate what is joined to what, the entry draws
   itself: the scope does not lie about the salvage.
   ------------------------------------------------------------------ */

/** One CAT 08 with two CAT 01 on it, bent. */
const WATER = { kinds: ['k08', 'k01', 'k01'] };

/** One CAT 06 with one CAT 08 on it. */
const OXIDE_1 = { kinds: ['k06', 'k08'] };

/** One CAT 06 with a CAT 08 on each side, in a straight line rather than bent. */
const OXIDE_2 = {
  kinds: ['k06', 'k08', 'k08'],
  geom: [[0, 0], [-0.99, 0], [0.99, 0]],
  bonds: [[0, 1], [0, 2]]
};

/** One CAT 07 with three CAT 01 on it. */
const AIR_GROUP = { kinds: ['k07', 'k01', 'k01', 'k01'] };

/** One CAT 06 with four CAT 01 on it. */
const GAS_GROUP = { kinds: ['k06', 'k01', 'k01', 'k01', 'k01'] };

/** Two CAT 08 in a chain with one CAT 01 on each end — not a star. */
const PEROXIDE = {
  kinds: ['k08', 'k08', 'k01', 'k01'],
  geom: [[-0.52, 0], [0.52, 0], [-1.0, -0.78], [1.0, 0.78]],
  bonds: [[0, 1], [0, 2], [1, 3]]
};

/* ------------------------------------------------------------------
   THE KEY LEGEND
   Nothing on this bench is named without being explained — including
   the tap, which has no key of its own and still has to be told.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  power: [{
    from: 1,
    key: 'Power',
    what: 'Zooms the scope in. Drag it round, or click it and use the arrow keys.'
  }],
  probe: [{
    from: 1,
    key: 'Tap a piece',
    what: 'Reads the piece you tap: its code, what it weighs, and how many others hold it.'
  }],
  cut: [{
    from: 1,
    key: 'Run Cutter',
    what: 'Tries to split the selected sample. Whatever it cannot split it leaves alone.'
  }],
  settle: [{
    from: 1,
    key: 'Settle',
    what: 'Shakes the selected sample and lets it sink. Each substance in it forms its own layer.'
  }]
};

export function toolNoteFor(controlId, stageNumber) {
  const rows = TOOL_TEXT[controlId];
  if (!rows) return null;
  let out = null;
  for (const r of rows) if (stageNumber >= r.from) out = r;
  return out ? { key: out.key, what: out.what } : null;
}

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Three Sources, One Group',
    briefing: {
      speaker: SPEAKER,
      body: 'This is the sampler scope from Tallow: a power dial that zooms in, a cutter that tries to split a sample, and a shaker that settles it into layers. Turn the power up until the groups come apart, then tap a piece to read it.'
    },
    prompt: 'Turn the power up until the groups separate on all three samples, count the pieces in one group, and set the tray to that recipe.',
    controls: ['power', 'probe'],
    samples: [
      { id: 'a1', label: 'SAMPLE A', note: 'condensed off the vent stacks', floorPower: 4, particles: [{ ...WATER, n: 12 }] },
      { id: 'a2', label: 'SAMPLE B', note: 'drawn from the arch springs', floorPower: 4, particles: [{ ...WATER, n: 28 }] },
      { id: 'a3', label: 'SAMPLE C', note: 'traded in off a hauler', floorPower: 4, particles: [{ ...WATER, n: 20 }] }
    ],
    widget: { type: 'build', kinds: ['k01', 'k08'], max: 5, label: 'One group holds' },
    hints: [
      'Turn the Power dial up to 4 or past it, then look at one group on any of the three plates.',
      'Every group is the same shape: one larger piece with two smaller ones on it. Tap each to read its code.',
      'One group holds one CAT 08 and two CAT 01, and all three samples are drawn the same way.'
    ],
    check(state) {
      if ((state.maxPower || 1) < 4) {
        return { ok: false, notYet: true, msg: 'Turn the Power dial up until the groups come apart.' };
      }
      const n01 = state.build.k01 || 0;
      const n08 = state.build.k08 || 0;
      if (!n01 && !n08) {
        return { ok: false, notYet: true, msg: 'Set the tray to what you counted in one group.' };
      }
      if (n01 === 1 && n08 === 2) {
        return { ok: false, msg: 'That is the two counts the wrong way round: the larger piece is the single one.' };
      }
      if (n01 !== 2 || n08 !== 1) {
        return { ok: false, msg: `A group holds three pieces in all, and you have set ${n01 + n08}. Count one group again on any plate.` };
      }
      return { ok: true };
    },
    reward: {
      log: 'All three samples: two CAT 01 to one CAT 08.',
      title: 'A Compound Has a Fixed Composition',
      body: 'Three samples from three places at three different sizes, and every group in all of them holds the same one CAT 08 and two CAT 01. A compound is not a blend you can mix to taste: it has a fixed composition, the same ratio of kinds every time, wherever it came from. That is exactly what makes it a compound and not a mixture.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Wrong Proportions',
    prompt: 'Raise the power on both samples, run the shaker over each of them, and say which one is not a compound.',
    controls: ['power', 'probe', 'settle'],
    samples: [
      { id: 'b1', label: 'SAMPLE A', note: 'condensed off the vent stacks', floorPower: 4, particles: [{ ...WATER, n: 20 }] },
      {
        id: 'b2', label: 'SAMPLE B', note: 'drained out of a cracked tank', floorPower: 4,
        particles: [{ ...WATER, n: 16 }, { kinds: ['k01'], n: 14 }]
      }
    ],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'extra', label: 'Sample B, because it holds loose CAT 01 that no group took in', note: 'Some of it belongs to no group at all.' },
        { id: 'a', label: 'Sample A, because its groups hold two of one kind and one of another', note: 'An uneven recipe.' },
        { id: 'both', label: 'Both of them, because each holds more than one kind of piece', note: 'More than one kind means a mixture.' },
        { id: 'neither', label: 'Neither — a compound can hold any proportions at all', note: 'Both are the same substance.' }
      ]
    },
    hints: [
      'Tap a sample to select it, press "Settle", and do the same for the other one.',
      'Sample A settles into one even layer. Sample B settles into two, so there is more than one substance in it.',
      'Raise the power on Sample B and look between the groups: there are loose CAT 01 pieces in there that no group would take.'
    ],
    check(state) {
      if (state.settled.size < 2) {
        return { ok: false, notYet: true, msg: 'Settle both samples before you answer.' };
      }
      if ((state.maxPower || 1) < 4) {
        return { ok: false, notYet: true, msg: 'Turn the Power dial up and look at what is actually in each one.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'a') {
        return { ok: false, msg: 'One CAT 08 to two CAT 01 is the recipe you counted in three separate samples on the last stage, so there is nothing wrong with it.' };
      }
      if (state.choice === 'both') {
        return { ok: false, msg: 'Sample A settled into a single layer and every piece in it belongs to a group, so it is one substance.' };
      }
      if (state.choice === 'neither') {
        return { ok: false, msg: 'Sample B settled into two layers. One substance does not do that.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B: groups plus loose CAT 01. Two layers.',
      title: 'Extra Pieces Make a Mixture',
      body: 'Sample B holds exactly the same groups as Sample A, plus CAT 01 pieces sitting loose that no group would take in. Adding more of one kind does not shift a compound to a new recipe; it leaves the extra alongside as a mixture, which is why the shaker found two layers in it. A compound takes exactly as many of each kind as its bonds allow and not one more.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Two Recipes, Same Two Kinds',
    prompt: 'Raise the power on both samples, count one group in each, and say how much CAT 08 goes with one CAT 06 in each of them.',
    controls: ['power', 'probe', 'cut'],
    samples: [
      { id: 'c1', label: 'SAMPLE A', note: 'off the flare stack', floorPower: 4, particles: [{ ...OXIDE_1, n: 22 }] },
      { id: 'c2', label: 'SAMPLE B', note: 'off the kiln vent', floorPower: 4, particles: [{ ...OXIDE_2, n: 18 }] }
    ],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'one-two', label: 'One CAT 08 in Sample A, two in Sample B', note: 'Both counts are whole numbers.' },
        { id: 'one-one', label: 'One in each, so the two samples are the same substance', note: 'The same recipe twice.' },
        { id: 'two-three', label: 'Two in Sample A and three in Sample B', note: 'One more in each than it looks.' },
        { id: 'half', label: 'One in Sample A and one and a half in Sample B', note: 'Sample B holds half a piece more.' }
      ]
    },
    hints: [
      'Turn the power up past 4, then count the pieces in one group on each plate and tap them to read the codes.',
      'Sample A draws two pieces to a group and Sample B draws three, with the dark CAT 06 in the middle of each.',
      'Sample A is one CAT 06 to one CAT 08. Sample B is one CAT 06 to two CAT 08 — exactly twice as much, for the same one CAT 06.'
    ],
    check(state) {
      if ((state.maxPower || 1) < 4) {
        return { ok: false, notYet: true, msg: 'Turn the Power dial up until the groups come apart.' };
      }
      if (state.probed.size < 2) {
        return { ok: false, notYet: true, msg: 'Tap at least two different pieces to read what they are.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'one-one') {
        return { ok: false, msg: 'A group in Sample A draws two pieces and a group in Sample B draws three, so they are not the same.' };
      }
      if (state.choice === 'two-three') {
        return { ok: false, msg: 'Count again: a Sample A group is two pieces in all, one of each kind.' };
      }
      if (state.choice === 'half') {
        return { ok: false, msg: 'Nothing on the plate is half a piece. Every group in Sample B draws two whole CAT 08.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A: one to one. Sample B: one to two.',
      title: 'Two Compounds, Whole Numbers Apart',
      body: 'The same two elements can make more than one compound, but not any compound at all: for the same one CAT 06, Sample B holds exactly twice the CAT 08 that Sample A does. The ratios always come out as small whole numbers, because there is no such thing as half an atom to put into a group. Two different recipes of the same two elements are two different substances.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What One Group Weighs',
    prompt: 'Raise the power on the sample, tap each piece in one group to read what it weighs, and set the counter to what the whole group weighs.',
    controls: ['power', 'probe'],
    samples: [
      { id: 'd1', label: 'SAMPLE A', note: 'condensed off the vent stacks', floorPower: 4, particles: [{ ...WATER, n: 20 }] }
    ],
    widget: { type: 'number', min: 14, max: 24, step: 1, label: 'Weight of one group' },
    hints: [
      'Turn the power up past 4, then tap the large piece in a group and tap one of the small ones.',
      'The CAT 08 reads 16.0 and each CAT 01 reads 1.0, and a group holds one of the first and two of the second.',
      '16.0 + 1.0 + 1.0 = 18.0, so one group weighs 18.'
    ],
    check(state) {
      if (!state.probed.has('k08') || !state.probed.has('k01')) {
        return { ok: false, notYet: true, msg: 'Tap both kinds of piece and read what each one weighs first.' };
      }
      if (state.number === 14) {
        return { ok: false, notYet: true, msg: 'Set the counter to the figure you worked out.' };
      }
      if (state.number === 17) {
        return { ok: false, msg: 'That counts only one CAT 01. A group holds two of them.' };
      }
      if (state.number === 16) {
        return { ok: false, msg: 'That is the CAT 08 on its own, with neither CAT 01 counted.' };
      }
      if (state.number !== 18) {
        return { ok: false, msg: 'Add the three pieces in one group: 16.0 for the CAT 08 and 1.0 for each of the two CAT 01.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One group of Sample A weighs 18.0.',
      title: 'A Group Weighs What Its Parts Weigh',
      body: 'Adding up the listed mass of every atom in one group gives what that whole group weighs: 16.0 for the CAT 08 plus 1.0 for each of the two CAT 01 is 18.0. Nothing is lost when atoms bond and nothing is gained. That figure is as fixed for a compound as its recipe is, because it comes straight out of it.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Which Share Is Which',
    prompt: 'Work out how much of this sample\'s weight is CAT 08, out of every hundred.',
    controls: ['power', 'probe'],
    samples: [
      { id: 'e1', label: 'SAMPLE A', note: 'condensed off the vent stacks', floorPower: 4, particles: [{ ...WATER, n: 20 }] }
    ],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: '89', label: 'About 89 out of 100', note: '16.0 of the 18.0 is the one heavy piece.' },
        { id: '67', label: 'About 67 out of 100', note: 'Two of the three pieces are CAT 01.' },
        { id: '50', label: '50 out of 100', note: 'An even split by weight.' },
        { id: '33', label: 'About 33 out of 100', note: 'One piece in three is CAT 08.' }
      ]
    },
    hints: [
      'Read one group again: 16.0 for the CAT 08 and 1.0 for each CAT 01, making 18.0 in all.',
      'The question asks for a share of the WEIGHT, not a share of the pieces. Two of the three pieces are CAT 01, but they are the light ones.',
      '16.0 out of 18.0 is 0.889, so 89 out of every 100 by weight is CAT 08.'
    ],
    check(state) {
      if (!state.probed.has('k08') || !state.probed.has('k01')) {
        return { ok: false, notYet: true, msg: 'Tap both kinds of piece and read what each one weighs first.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === '67' || state.choice === '33') {
        return { ok: false, msg: 'That is a share of the PIECES, not of the weight. One CAT 08 weighs sixteen times what one CAT 01 does.' };
      }
      if (state.choice === '50') {
        return { ok: false, msg: 'An even split would need the two CAT 01 to weigh as much as the CAT 08 between them, and they weigh 2.0 against 16.0.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 89 out of 100 by weight is CAT 08.',
      title: 'Percent Composition',
      body: 'The share of a compound\'s mass that comes from each element is its percent composition, and it falls straight out of the recipe: 16.0 of every 18.0 of mass here is CAT 08, which is 89 percent. Notice how far that is from the share of the PIECES, which is one in three. Count and weight are two different questions, and a compound answers both with fixed numbers.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Backwards From the Weight',
    prompt: 'A sealed drum off the vent line runs 3 parts CAT 06 to 8 parts CAT 08 by weight. Count one group in each bench sample, then pick the recipe the drum must hold.',
    controls: ['power', 'probe'],
    samples: [
      { id: 'f1', label: 'SAMPLE A', note: 'off the flare stack', floorPower: 4, particles: [{ ...OXIDE_1, n: 20 }] },
      { id: 'f2', label: 'SAMPLE B', note: 'off the kiln vent', floorPower: 4, particles: [{ ...OXIDE_2, n: 16 }] }
    ],
    widget: {
      type: 'choice',
      label: 'The drum holds',
      options: [
        { id: 'one-two', label: 'One CAT 06 to two CAT 08', note: 'The same recipe as Sample B.' },
        { id: 'one-one', label: 'One CAT 06 to one CAT 08', note: 'The same recipe as Sample A.' },
        { id: 'three-eight', label: 'Three CAT 06 to eight CAT 08', note: 'The two weights read straight off as a count.' },
        { id: 'two-one', label: 'Two CAT 06 to one CAT 08', note: 'Twice as much of the lighter kind.' }
      ]
    },
    hints: [
      'Count one group on each plate first: Sample A holds one CAT 08 to its CAT 06, and Sample B holds two.',
      'A weight is not a count. Divide each of the drum\'s two parts by what one piece of that kind weighs, and you get how many pieces that part is.',
      '3 divided by 12.0 is 0.25, and 8 divided by 16.0 is 0.5. 0.25 to 0.5 is 1 to 2, which is Sample B.'
    ],
    check(state) {
      if ((state.maxPower || 1) < 4) {
        return { ok: false, notYet: true, msg: 'Turn the Power dial up until the groups come apart.' };
      }
      if (state.probed.size < 2) {
        return { ok: false, notYet: true, msg: 'Tap a piece of each kind and read what it weighs.' };
      }
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'three-eight') {
        return { ok: false, msg: '3 and 8 are weights, not counts. One CAT 06 weighs 12.0 and one CAT 08 weighs 16.0, so equal weights are not equal numbers of pieces.' };
      }
      if (state.choice === 'one-one') {
        return { ok: false, msg: 'One to one would need equal numbers of pieces, which by weight would be 12 parts CAT 06 to 16 parts CAT 08 — not 3 to 8.' };
      }
      if (state.choice === 'two-one') {
        return { ok: false, msg: 'The drum holds more than twice as much CAT 08 as CAT 06 by weight, so CAT 08 cannot be the kind there is less of.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Drum: 3 to 8 by weight is 1 to 2 by count.',
      title: 'The Empirical Formula',
      body: 'Dividing each element\'s share of the mass by what one of its atoms weighs turns a weight ratio into a count ratio, and reducing that to the smallest whole numbers gives the empirical formula. Three parts CAT 06 to eight parts CAT 08 comes to 0.25 against 0.5, which is one to two. This is how a compound is identified out of a drum nobody can see inside.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Name Three Samples',
    prompt: 'Raise the power on all three samples, count one group in each, and file each sample under the recipe it matches.',
    controls: ['power', 'probe', 'cut'],
    samples: [
      { id: 'g1', label: 'SAMPLE A', note: 'unlabelled, off a hauler', floorPower: 4, particles: [{ ...WATER, n: 18 }] },
      { id: 'g2', label: 'SAMPLE B', note: 'unlabelled, off a hauler', floorPower: 4, particles: [{ ...AIR_GROUP, n: 16 }] },
      { id: 'g3', label: 'SAMPLE C', note: 'unlabelled, off a hauler', floorPower: 4, particles: [{ ...GAS_GROUP, n: 14 }] }
    ],
    widget: {
      type: 'bins',
      rows: ['g1', 'g2', 'g3'],
      bins: [
        { id: 'm1', label: 'One CAT 08 to two CAT 01', note: 'A group of it weighs 18.0.' },
        { id: 'm2', label: 'One CAT 07 to three CAT 01', note: 'A group of it weighs 17.0.' },
        { id: 'm3', label: 'One CAT 06 to four CAT 01', note: 'A group of it weighs 16.0.' }
      ]
    },
    hints: [
      'Turn the power up past 4, then count how many small pieces are hanging off the large one in each sample.',
      'Tap the large piece in each group to read its code — the three are CAT 06, CAT 07 and CAT 08, and they are hard to tell apart by eye.',
      'Sample A is one CAT 08 to two CAT 01, Sample B is one CAT 07 to three, and Sample C is one CAT 06 to four.'
    ],
    check(state) {
      if ((state.maxPower || 1) < 4) {
        return { ok: false, notYet: true, msg: 'Turn the Power dial up until the groups come apart.' };
      }
      if (state.probed.size < 2) {
        return { ok: false, notYet: true, msg: 'Tap the large piece in a group to read what it is.' };
      }
      const labels = { g1: 'Sample A', g2: 'Sample B', g3: 'Sample C' };
      for (const id of ['g1', 'g2', 'g3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      const reasons = {
        g1: 'Sample A draws three pieces to a group, with a CAT 08 in the middle.',
        g2: 'Sample B draws four pieces to a group, with a CAT 07 in the middle.',
        g3: 'Sample C draws five pieces to a group, with a CAT 06 in the middle.'
      };
      const want = { g1: 'm1', g2: 'm2', g3: 'm3' };
      for (const id of ['g1', 'g2', 'g3']) {
        if (state.bins[id] !== want[id]) return { ok: false, msg: reasons[id] };
      }
      return { ok: true };
    },
    reward: {
      log: 'Three samples, three recipes, three weights.',
      title: 'The Recipe Is the Identity',
      body: 'All three of those samples are mostly CAT 01 and all three look identical at low power, but their recipes are different and so is everything else about them. A compound is named by what it holds and in what ratio, not by what the crate looks like. Two substances with different recipes are never the same substance.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Claims',
    prompt: 'All three samples are sold as the same compound. Raise the power, settle each one, and say which of them really are what the label says.',
    controls: ['power', 'probe', 'settle', 'cut'],
    samples: [
      { id: 'h1', label: 'SAMPLE A', note: 'sold as vent-stack condensate', floorPower: 4, particles: [{ ...WATER, n: 20 }] },
      {
        id: 'h2', label: 'SAMPLE B', note: 'sold as vent-stack condensate', floorPower: 4,
        particles: [{ ...WATER, n: 15 }, { kinds: ['k01'], n: 12 }]
      },
      { id: 'h3', label: 'SAMPLE C', note: 'sold as vent-stack condensate', floorPower: 4, particles: [{ ...PEROXIDE, n: 14 }] }
    ],
    widget: {
      type: 'bins',
      rows: ['h1', 'h2', 'h3'],
      bins: [
        { id: 'yes', label: 'As claimed', note: 'One CAT 08 to two CAT 01, and nothing else in it.' },
        { id: 'no', label: 'Not as claimed', note: 'Either the recipe is wrong or there is something else in there.' }
      ]
    },
    hints: [
      'Turn the power up past 4, then settle each sample and count one group on each plate.',
      'The claim is one CAT 08 to two CAT 01. A sample fails it either by holding a different group, or by holding anything at all besides that group.',
      'Sample A is the claim exactly. Sample B has the right groups with loose CAT 01 alongside. Sample C draws four pieces to a group, not three.'
    ],
    check(state) {
      if ((state.maxPower || 1) < 4) {
        return { ok: false, notYet: true, msg: 'Turn the Power dial up until the groups come apart.' };
      }
      if (state.settled.size < 3) {
        return { ok: false, notYet: true, msg: 'Settle all three samples before you answer.' };
      }
      const labels = { h1: 'Sample A', h2: 'Sample B', h3: 'Sample C' };
      for (const id of ['h1', 'h2', 'h3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      const reasons = {
        h1: 'Sample A settles into one layer and every group in it is one CAT 08 with two CAT 01, which is the claim exactly.',
        h2: 'Sample B settles into two layers: the right groups, with loose CAT 01 sitting alongside them.',
        h3: 'Sample C draws four pieces to a group — two CAT 08 in a chain with one CAT 01 on each end, which is a different compound.'
      };
      const want = { h1: 'yes', h2: 'no', h3: 'no' };
      for (const id of ['h1', 'h2', 'h3']) {
        if (state.bins[id] !== want[id]) return { ok: false, msg: reasons[id] };
      }
      return { ok: true };
    },
    reward: {
      log: 'One as claimed, one a mixture, one a different compound.',
      title: 'A Recipe Is a Test You Can Run',
      body: 'Sample B held the right groups with loose CAT 01 alongside them, and Sample C held the same two elements in a different ratio, so neither is what its label says. Counting one group settles it either way, because a compound has exactly one recipe and no room to argue. That is the whole reason a formula is worth writing down.',
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
      body: 'A compound holds the same kinds in the same ratio wherever it came from and however much of it you have. Put in more of one kind and it does not become a new compound; the extra just sits there as a mixture.'
    },
    {
      heading: 'By Weight',
      body: 'That fixed recipe fixes the weights too: what one group weighs, and what share of that weight each element brings. Running it backwards, a weight ratio divided by the atoms\' own masses gives you the recipe of something you never opened.'
    },
    {
      heading: 'Next',
      body: 'You counted groups on this bench because there were few enough to count. A real crate holds more atoms than anyone could count in a lifetime, and the last bench here weighs them instead.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Water from a comet and water from a tap are both analysed. What is true of the hydrogen-to-oxygen ratio?',
    options: [
      { id: 'a', label: 'It is 2 to 1 in both, because a compound has a fixed composition' },
      { id: 'b', label: 'It depends on where the water came from' },
      { id: 'c', label: 'It depends on how much of each sample was taken' },
      { id: 'd', label: 'Only the comet sample has a fixed ratio' }
    ],
    answer: 'a',
    explanation: 'A compound is defined by its ratio of atoms, and that ratio comes from how many bonds each atom can make. Water is H2O wherever it is found, which is why a formula is worth writing at all.'
  },
  {
    question: 'Carbon monoxide is CO and carbon dioxide is CO2. What does that tell you about compounds of the same two elements?',
    options: [
      { id: 'a', label: 'There can only ever be one compound of two elements' },
      { id: 'b', label: 'The amounts of one element combining with a fixed amount of the other are in small whole-number ratios' },
      { id: 'c', label: 'The two compounds behave the same way' },
      { id: 'd', label: 'Carbon dioxide is a mixture of carbon monoxide and oxygen' }
    ],
    answer: 'b',
    explanation: 'For the same one carbon atom, CO2 holds exactly twice the oxygen that CO does — 2 to 1, not 1.7 to 1. Atoms combine as whole units, so the ratios between compounds come out as small whole numbers.'
  },
  {
    question: 'Water is H2O. Hydrogen weighs 1.0 and oxygen 16.0. What percent of water\'s mass is oxygen?',
    options: [
      { id: 'a', label: 'About 33 percent' },
      { id: 'b', label: 'About 50 percent' },
      { id: 'c', label: 'About 67 percent' },
      { id: 'd', label: 'About 89 percent' }
    ],
    answer: 'd',
    explanation: 'One molecule weighs 16.0 + 1.0 + 1.0 = 18.0, of which oxygen is 16.0. 16.0 / 18.0 = 0.889, so 89 percent. Two thirds of the atoms are hydrogen, but they carry almost none of the mass.'
  },
  {
    question: 'A compound is 3 g of carbon to 8 g of oxygen. Carbon weighs 12.0 and oxygen 16.0. What is its empirical formula?',
    options: [
      { id: 'a', label: 'CO' },
      { id: 'b', label: 'CO2' },
      { id: 'c', label: 'C3O8' },
      { id: 'd', label: 'C2O' }
    ],
    answer: 'b',
    explanation: 'Divide each mass by that element\'s atomic mass to get counts: 3 / 12.0 = 0.25 and 8 / 16.0 = 0.5. The ratio 0.25 to 0.5 reduces to 1 to 2, so the formula is CO2. C3O8 is the mass ratio read as if it were a count.'
  },
  {
    question: 'Extra hydrogen gas is bubbled into a flask of water. What is in the flask afterwards?',
    options: [
      { id: 'a', label: 'A new compound with more hydrogen in it' },
      { id: 'b', label: 'Water, plus hydrogen sitting alongside it as a mixture' },
      { id: 'c', label: 'Nothing has changed, because the hydrogen is absorbed' },
      { id: 'd', label: 'Hydrogen peroxide' }
    ],
    answer: 'b',
    explanation: 'A water molecule has no room for a third hydrogen: oxygen makes two bonds and both are taken. The extra hydrogen cannot join, so it stays as a separate substance mixed in with the water.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    power: 1,
    maxPower: 1,
    number: stage.widget.type === 'number' ? stage.widget.min : null,
    choice: null,
    build: {},
    bins: {},
    sample: null,
    probed: new Set(),
    settled: new Set(),
    cut: new Set()
  };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { maxPower: 4, probed: new Set(['k01', 'k08']), build: { k01: 2, k08: 1 } },
  { maxPower: 4, probed: new Set(['k01', 'k08']), settled: new Set(['b1', 'b2']), choice: 'extra' },
  { maxPower: 4, probed: new Set(['k06', 'k08']), choice: 'one-two' },
  { maxPower: 4, probed: new Set(['k01', 'k08']), number: 18 },
  { maxPower: 4, probed: new Set(['k01', 'k08']), choice: '89' },
  { maxPower: 4, probed: new Set(['k06', 'k08']), choice: 'one-two' },
  { maxPower: 4, probed: new Set(['k06', 'k08']), bins: { g1: 'm1', g2: 'm2', g3: 'm3' } },
  {
    maxPower: 4,
    probed: new Set(['k01', 'k08']),
    settled: new Set(['h1', 'h2', 'h3']),
    bins: { h1: 'yes', h2: 'no', h3: 'no' }
  }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { maxPower: 4, probed: new Set(['k01', 'k08']), build: { k01: 1, k08: 2 } },
  { maxPower: 4, probed: new Set(['k01', 'k08']), settled: new Set(['b1', 'b2']), choice: 'both' },
  { maxPower: 4, probed: new Set(['k06', 'k08']), choice: 'one-one' },
  { maxPower: 4, probed: new Set(['k01', 'k08']), number: 17 },
  { maxPower: 4, probed: new Set(['k01', 'k08']), choice: '67' },
  { maxPower: 4, probed: new Set(['k06', 'k08']), choice: 'three-eight' },
  { maxPower: 4, probed: new Set(['k06', 'k08']), bins: { g1: 'm1', g2: 'm3', g3: 'm2' } },
  {
    maxPower: 4,
    probed: new Set(['k01', 'k08']),
    settled: new Set(['h1', 'h2', 'h3']),
    bins: { h1: 'yes', h2: 'yes', h3: 'no' }
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

  const scope = SampleScope(frame.instrumentHost, {
    kinds: KINDS,
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id)
  });

  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let busy = false;
  let disposed = false;
  let unbindDial = null;

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

    scope.setSamples(stage.samples);
    scope.setPower(state.power);
    scope.setSelectable(stage.samples.length > 1);
    if (stage.samples.length === 1) onSelect(stage.samples[0].id);

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

    if (stage.controls.includes('power')) {
      parts.push(dialMarkup({ label: 'Power', min: 1, max: 6, value: state.power, id: 'scope-power' }));
    }
    if (stage.controls.includes('cut')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="cut">Run Cutter</button>');
    }
    if (stage.controls.includes('settle')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="settle">Settle</button>');
    }

    parts.push(toolNotes(
      stage.controls.map(id => toolNoteFor(id, index + 1)).filter(Boolean)
    ));

    frame.setControls(parts.join(''));
    const host = frame.el.controls;

    unbindDial?.();
    unbindDial = stage.controls.includes('power')
      ? bindDial(host, { min: 1, max: 6, onChange: v => setPower(v) })
      : null;

    host.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => runTool(btn.dataset.tool));
    });
    paintDial();
  }

  function setPower(p) {
    const next = Math.max(1, Math.min(6, p));
    if (next === state.power) return;
    state.power = next;
    state.maxPower = Math.max(state.maxPower || 1, next);
    scope.setPower(next);
    soundscape.playToggleClack?.();
    paintDial();
    renderReadout(null);
  }

  function paintDial() {
    paintDialControl(frame.el.controls, state.power, { min: 1, max: 6 });
  }

  async function runTool(tool) {
    if (busy) return;
    if (!state.sample) {
      frame.note('Tap a sample on the bench first.');
      return;
    }
    busy = true;
    frame.clearBanner();
    frame.setCommitEnabled(false);

    const id = state.sample;
    if (tool === 'cut') {
      const found = await scope.cut(id);
      state.cut.add(id);
      soundscape.playBondSnap?.();
      renderReadout(null, {
        head: `Cutter // ${labelFor(id)}`,
        body: found === 'none'
          ? 'The blade closes on a single atom and finds nothing inside to split.'
          : found === 'broke'
            ? 'The blade cuts the bonds and every group falls apart into separate atoms.'
            : 'The blade just scatters the heap. Nothing here was bonded to anything.'
      });
    } else if (tool === 'settle') {
      await scope.settle(id);
      state.settled.add(id);
      const bands = bandCount(id);
      renderReadout(null, {
        head: `Shaker // ${labelFor(id)}`,
        body: bands > 1
          ? `It settles into ${bands} separate layers, so more than one substance is in there.`
          : 'It settles into one even layer, so it is all one substance.'
      });
    }

    busy = false;
    frame.setCommitEnabled(true);
  }

  function labelFor(id) {
    return STAGES[index].samples.find(s => s.id === id)?.label || id;
  }

  /** How many distinct substances are in a sample — what the shaker reveals. */
  function bandCount(id) {
    const sample = STAGES[index].samples.find(s => s.id === id);
    return new Set(sample.particles.map(p => p.kinds.join('+'))).size;
  }

  /* ---------------- probe readout ---------------- */

  function onProbe(hit) {
    state.probed.add(hit.kindId);
    soundscape.playScanSweep?.();
    renderReadout(hit);
  }

  function onSelect(id) {
    state.sample = id;
    scope.setSelected(id);
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
    if (!hit) {
      const stage = STAGES[index];
      const anyResolved = stage.samples.some(s => detailFor(state.power, s.floorPower) >= 3);
      frame.setReadout(`
        <div class="lq-readout-card lq-readout-idle">
          <div class="lq-readout-head">Probe // standby</div>
          <p class="lq-readout-line">${anyResolved
            ? 'Tap any piece to read it.'
            : 'Nothing is in focus yet. Turn the Power dial up.'}</p>
        </div>
      `);
      return;
    }

    const k = KINDS[hit.kindId];
    frame.setReadout(`
      <div class="lq-readout-card">
        <div class="lq-readout-head">Probe // ${esc(hit.sampleLabel)}</div>
        <div class="lq-readout-code">${esc(k.code)}</div>
        ${meter('Mass', massBar(hit.kindId), k.mass.toFixed(1))}
        ${meter('Size', sizeBar(hit.kindId), k.size.toFixed(2))}
        <div class="lq-readout-hold">${hit.neighbours === 0
          ? 'Not joined to anything.'
          : `Joined to ${hit.neighbours} other ${hit.neighbours === 1 ? 'atom' : 'atoms'}.`}</div>
        <p class="lq-readout-line">${esc(k.note)}</p>
      </div>
    `);
  }

  function meter(label, filled, value) {
    return `
      <div class="lq-meter">
        <span class="lq-meter-label">${label}</span>
        <span class="lq-meter-bar" aria-hidden="true">${
          Array.from({ length: 10 }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('')
        }</span>
        <span class="lq-meter-value">${value}</span>
      </div>
    `;
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

    if (w.type === 'build') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-build">
            ${w.kinds.map(kid => `
              <div class="lq-build-row" data-kind="${kid}">
                <span class="lq-build-dot" data-tint="${KINDS[kid].tint}"></span>
                <span class="lq-build-code">${KINDS[kid].code}</span>
                <button type="button" class="btn-secondary quest-btn-sm" data-build="-1" aria-label="One fewer ${KINDS[kid].code}">&minus;</button>
                <span class="lq-build-count">${state.build[kid] || 0}</span>
                <button type="button" class="btn-secondary quest-btn-sm" data-build="1" aria-label="One more ${KINDS[kid].code}">+</button>
              </div>
            `).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-build]').forEach(btn => {
        btn.addEventListener('click', () => {
          const row = btn.closest('[data-kind]');
          const kid = row.dataset.kind;
          const n = Math.max(0, Math.min(w.max, (state.build[kid] || 0) + Number(btn.dataset.build)));
          if (n === 0) delete state.build[kid]; else state.build[kid] = n;
          row.querySelector('.lq-build-count').textContent = String(n);
          row.classList.toggle('filled', n > 0);
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
      const rows = w.rows || stage.samples.map(s => s.id);
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Your answer</span>
          <div class="lq-bins">
            ${rows.map(id => `
              <div class="lq-bin-row" data-sample="${id}">
                <span class="lq-bin-sample">${esc(labelFor(id))}</span>
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
          const row = btn.closest('[data-sample]');
          const sid = row.dataset.sample;
          state.bins[sid] = btn.dataset.bin;
          row.querySelectorAll('[data-bin]').forEach(o => o.classList.toggle('selected', o === btn));
          const bin = w.bins.find(b => b.id === btn.dataset.bin);
          scope.setPlateTag(sid, bin ? bin.label : '');
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
      unbindDial?.();
      unbindDial = null;
      scope.dispose();
      frame.dispose();
    }
  };
}
