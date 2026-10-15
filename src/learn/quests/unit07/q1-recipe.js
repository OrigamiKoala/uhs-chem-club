/**
 * q1-recipe.js — Kettle, bench one: THE SAME RECIPE. (Built as Ligar's bench three.)
 *
 * The sampler scope from Tallow, wheeled out onto Ligar and pointed at
 * compounds rather than at single elements. Bench one settled why a compound has a
 * ratio at all; this one settles how hard that ratio is, and what it looks like
 * when you weigh it instead of counting it.
 *
 * THE ORDER IS THE WHOLE DESIGN:
 *
 *   1  count a molecule in three samples of one substance -> a compound has a fixed composition
 *   2  a sample with atoms no molecule would take         -> extra atoms make a mixture
 *   3  weigh the bench before and after a joining         -> conservation of mass; a molecule weighs what its atoms weigh
 *   4  two heaps feeding a joiner until one runs out      -> the limiting reactant
 *   5  which share of that weight is the heavy element    -> percent composition
 *   6  a weight ratio off the vent line                   -> the empirical formula
 *   7  name three samples off their recipes               -> the recipe is the identity
 *   8  three claims against one label                     -> a recipe is a test you can run
 *   -- debrief: what a formula really claims, and what the last bench does.
 *
 * WHAT THIS BENCH DOES NOT DO. Every molecule it asks about is one you can count.
 * Every sample on it is molecular, so "molecule" is the honest word throughout;
 * an ionic solid has formula units, and none is put on this bench.
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
  { term: /\blimiting reactants?\b/i, introducedAt: 4 },
  { term: /\bconservation of mass\b/i, introducedAt: 3 },
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
  k01: { code: 'hydrogen (H)', mass: 1.0, size: 0.30, tint: 'bone', note: 'The lightest thing the yard handles.' },
  k06: { code: 'carbon (C)', mass: 12.0, size: 0.56, tint: 'iron', note: 'Dark and dry. Marks anything it touches.' },
  k07: { code: 'nitrogen (N)', mass: 14.0, size: 0.54, tint: 'pale', note: 'Most of the air on this planet is this.' },
  k08: { code: 'oxygen (O)', mass: 16.0, size: 0.52, tint: 'rust', note: 'Turns up in almost every sample here.' },
  k11: { code: 'sodium (Na)', mass: 23.0, size: 0.74, tint: 'pale', note: 'Large, soft and dull.' },
  k17: { code: 'chlorine (Cl)', mass: 35.5, size: 0.66, tint: 'sand', note: 'Yellow and heavy. Sharp smell.' }
};

const massBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].mass / 40) * 10)));
const sizeBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].size / 0.8) * 10)));

/* ------------------------------------------------------------------
   SHAPES
   A `kinds` list alone means one centre with the rest holding on to it.
   Where that would misstate what is joined to what, the entry draws
   itself: the scope does not lie about the salvage.
   ------------------------------------------------------------------ */

/** One oxygen with two hydrogens on it, bent. */
const WATER = { kinds: ['k08', 'k01', 'k01'] };

/** One carbon with one oxygen on it. */
const OXIDE_1 = { kinds: ['k06', 'k08'] };

/** One carbon with an oxygen on each side, in a straight line rather than bent. */
const OXIDE_2 = {
  kinds: ['k06', 'k08', 'k08'],
  geom: [[0, 0], [-0.99, 0], [0.99, 0]],
  bonds: [[0, 1], [0, 2]]
};

/** One nitrogen with three hydrogens on it. */
const AIR_GROUP = { kinds: ['k07', 'k01', 'k01', 'k01'] };

/** One carbon with four hydrogens on it. */
const GAS_GROUP = { kinds: ['k06', 'k01', 'k01', 'k01', 'k01'] };

/** Two oxygens in a chain with one hydrogen on each end — not a star. */
const PEROXIDE = {
  kinds: ['k08', 'k08', 'k01', 'k01'],
  geom: [[-0.52, 0], [0.52, 0], [-1.0, -0.78], [1.0, 0.78]],
  bonds: [[0, 1], [0, 2], [1, 3]]
};

/* ------------------------------------------------------------------
   THE KEY LEGEND

   A KEY WHOSE LABEL SAYS WHAT IT DOES OWES NOTHING.

   Only the keys below carry a line, and each one carries it because
   its label leaves something out. Everything else on this bench — the
   keys that were once explained back to the player in their own words —
   is left to say what it says.
   ------------------------------------------------------------------ */
const TOOL_TEXT = {
  power: [{
    from: 1,
    key: 'Power',
    what: 'Zooms the scope in.'
  }],
  settle: [{
    from: 2,
    key: 'Settle',
    what: 'Shakes the sample and lets it sink into layers.'
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
    title: 'Three Sources, One Molecule',
    briefing: {
      speaker: SPEAKER,
      body: 'The molecular scope inspects materials at atomic scale. The Power dial zooms in, and tapping an atom reads its name and weight.'
    },
    prompt: 'Set the tray to the recipe of one molecule of this substance.',
    controls: ['power', 'probe'],
    samples: [
      { id: 'a1', label: 'SAMPLE A', note: 'condensed off the vent stacks', floorPower: 4, particles: [{ ...WATER, n: 12 }] },
      { id: 'a2', label: 'SAMPLE B', note: 'drawn from the arch springs', floorPower: 4, particles: [{ ...WATER, n: 28 }] },
      { id: 'a3', label: 'SAMPLE C', note: 'traded in off a hauler', floorPower: 4, particles: [{ ...WATER, n: 20 }] }
    ],
    widget: { type: 'build', kinds: ['k01', 'k08'], max: 5, label: 'One molecule holds' },
    hints: [
      'Turn the Power dial up to 4 or past it, then look at one molecule on any of the three plates.',
      'Every molecule on all three plates is built the same way: inspect one molecule and tap each atom in it.',
      'In that one molecule, count how many atoms read oxygen and how many read hydrogen, and set the tray to those two counts.'
    ],
    check(state) {
      const n01 = state.build.k01 || 0;
      const n08 = state.build.k08 || 0;
      if (!n01 && !n08) {
        return { ok: false, notYet: true, msg: 'Set the tray to what you counted in one molecule.' };
      }
      if (n01 === 1 && n08 === 2) {
        return { ok: false, msg: 'Tap each atom in one molecule: check which element the larger atom is, and how many atoms of each element there are.' };
      }
      if (n01 !== 2 || n08 !== 1) {
        return { ok: false, msg: 'Count one molecule again, on any plate, and tap each atom in it to inspect it.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'All three samples: two hydrogen to one oxygen.',
      title: 'A Compound Has a Fixed Composition',
      body: 'Every sample contains the same ratio: two hydrogens to one oxygen. A compound has a fixed composition, maintaining the exact same ratio of elements regardless of source.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'The Wrong Proportions',
    briefing: {
      speaker: SPEAKER,
      body: 'The settling shaker sorts unbonded atoms by weight. Press "Settle" to shake the sample and see if it separates into layers.'
    },
    prompt: 'Which of the two samples fails to behave as a true compound?',
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
        { id: 'extra', label: 'Sample B, because it holds loose hydrogen atoms that no molecule took in' },
        { id: 'a', label: 'Sample A, because its molecules hold two of one element and one of another' },
        { id: 'both', label: 'Both of them, because each holds more than one element' },
        { id: 'neither', label: 'Neither — a compound can hold any proportions at all' }
      ]
    },
    hints: [
      'Tap a sample to select it, press "Settle", and do the same for the other one.',
      'Count the layers each sample settles into, and look at high power for any atom that is not part of a molecule.',
      'A sample of this compound settles into one layer with every atom inside a molecule; check each sample against both halves of that.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'a') {
        return { ok: false, msg: 'One oxygen to two hydrogens is the recipe you counted in three separate samples on the last stage, so there is nothing wrong with it.' };
      }
      if (state.choice === 'both') {
        return { ok: false, msg: 'Settle Sample A and look at it at high power: is any atom in it sitting outside a molecule?' };
      }
      if (state.choice === 'neither') {
        return { ok: false, msg: 'Settle both samples and count the layers each one makes.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample B: molecules plus loose hydrogen. Two layers.',
      title: 'Extra Atoms Make a Mixture',
      body: 'Sample B contains pure molecules alongside unbonded hydrogen atoms. Adding extra atoms cannot change a compound\'s formula; the excess remains separated as a mixture.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Weigh Before and After',
    briefing: {
      speaker: SPEAKER,
      body: 'The joiner bonds loose hydrogen and oxygen atoms into water, one molecule at a time. The balance weighs everything on the bench at once and writes the total in the log.'
    },
    prompt: 'What happens to the bench\'s total weight when loose atoms join into molecules?',
    controls: ['power', 'probe', 'weigh', 'join'],
    log: { columns: [{ key: 'made', label: 'Molecules made' }, { key: 'total', label: 'Total weight' }] },
    samples: [
      { id: 'j1', label: 'SAMPLE A', note: 'loose atoms off the vent stacks', floorPower: 4, particles: [{ kinds: ['k01'], n: 6 }] },
      { id: 'j2', label: 'SAMPLE B', note: 'loose atoms off the vent stacks', floorPower: 4, particles: [{ kinds: ['k08'], n: 3 }] },
      { id: 'j3', label: 'JOINER TRAY', note: 'what the joiner has made', floorPower: 4, particles: [{ ...WATER, n: 0 }] }
    ],
    join: { take: { j1: 2, j2: 1 }, into: 'j3' },
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'same', label: 'It stays exactly the same' },
        { id: 'up', label: 'It goes up, because the bonds add weight' },
        { id: 'down', label: 'It goes down, because the atoms pack closer together' },
        { id: 'varies', label: 'It changes by a different amount at every join' }
      ]
    },
    hints: [
      'Press "Weigh Bench", then "Join One Molecule" until the heaps are used up, then weigh again.',
      'Compare the first row in the log with the last, and look at every row between them.',
      'Weigh after each single join too, so every number of molecules made has a row in the log.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice !== 'same') {
        return { ok: false, msg: 'Weigh the bench before anything is joined and again after, then compare the two figures in the log.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'The bench weighs the same before and after.',
      title: 'Conservation of Mass',
      body: 'Joining only rearranges atoms, so the bench weighs the same afterwards: this is the conservation of mass. It is why one molecule weighs what its atoms weigh, 16.0 for the oxygen plus 1.0 for each hydrogen.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'One Heap Runs Out',
    prompt: 'Which heap runs out first, and how many molecules can these two heaps make?',
    controls: ['power', 'probe', 'join'],
    samples: [
      { id: 'l1', label: 'SAMPLE A', note: 'loose atoms off the vent stacks', floorPower: 4, particles: [{ kinds: ['k01'], n: 8 }] },
      { id: 'l2', label: 'SAMPLE B', note: 'loose atoms off the vent stacks', floorPower: 4, particles: [{ kinds: ['k08'], n: 5 }] },
      { id: 'l3', label: 'JOINER TRAY', note: 'what the joiner has made', floorPower: 4, particles: [{ ...WATER, n: 0 }] }
    ],
    join: { take: { l1: 2, l2: 1 }, into: 'l3' },
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: 'h4', label: 'Hydrogen runs out first, after four molecules' },
        { id: 'o5', label: 'Oxygen runs out first, after five molecules' },
        { id: 'both', label: 'Both run out together, after four molecules' },
        { id: 'h8', label: 'Hydrogen runs out first, after eight molecules' }
      ]
    },
    hints: [
      'Press "Join One Molecule" until the joiner refuses, then look at what is left on each plate.',
      'Compare how many atoms each heap holds with how many of them one molecule takes.',
      'Divide each heap by the number of its atoms that one molecule takes, and see which gives out first.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice !== 'h4') {
        return { ok: false, msg: 'Join molecules one at a time until the joiner refuses, then check what was made and what is left on each plate.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'One heap ran out with atoms left in the other.',
      title: 'The Limiting Reactant',
      body: 'A recipe takes atoms in a fixed ratio, so the heap that gives out first decides how many molecules can be made. It is called the limiting reactant, and whatever is left of the other heap is left over.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Which Share Is Which',
    prompt: 'What fraction of water\'s total mass comes from oxygen, out of every hundred parts by weight?',
    controls: ['power', 'probe'],
    samples: [
      { id: 'e1', label: 'SAMPLE A', note: 'condensed off the vent stacks', floorPower: 4, particles: [{ ...WATER, n: 20 }] }
    ],
    widget: {
      type: 'choice',
      label: 'Your answer',
      options: [
        { id: '89', label: 'About 89 out of 100' },
        { id: '67', label: 'About 67 out of 100' },
        { id: '50', label: '50 out of 100' },
        { id: '33', label: 'About 33 out of 100' }
      ]
    },
    hints: [
      'Read one molecule again: 16.0 for the oxygen and 1.0 for each hydrogen, making 18.0 in all.',
      'The question asks for a share of the weight, not of the atoms, and the two hydrogens are the light ones.',
      'Divide the mass of the oxygen by the 18.0 the whole molecule weighs to find its percentage.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === '67' || state.choice === '33') {
        return { ok: false, msg: 'That is a share of the atoms, not of the weight. One oxygen weighs sixteen times what one hydrogen does.' };
      }
      if (state.choice === '50') {
        return { ok: false, msg: 'An even split would need the two hydrogens to weigh as much as the oxygen between them, and they weigh 2.0 against 16.0.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Sample A: 89 out of 100 by weight is oxygen.',
      title: 'Percent Composition',
      body: 'Percent composition is the fraction of total mass contributed by each element. In water, oxygen accounts for 16.0 of the 18.0 total mass, or 89 percent.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Backwards From the Weight',
    prompt: 'Which molecule has 3 parts carbon to 8 parts oxygen by weight?',
    controls: ['power', 'probe'],
    slate: {
      template: 'n(C) = 3 g ÷ 12 g/mol = 0.25 mol, n(O) = 8 g ÷ 16 g/mol = 0.50 mol → 1:2',
      target: 'ratio',
      targetUnit: 'C:O',
      slots: [
        { id: 'mC', label: 'm(C)', unit: 'g', constant: true, value: 3 },
        { id: 'MC', label: 'M(C)', unit: 'g/mol', constant: true, value: 12 },
        { id: 'mO', label: 'm(O)', unit: 'g', constant: true, value: 8 },
        { id: 'MO', label: 'M(O)', unit: 'g/mol', constant: true, value: 16 }
      ],
      evaluate: ({ mC, MC, mO, MO }) => (mO / MO) / (mC / MC)
    },
    samples: [
      { id: 'f1', label: 'SAMPLE A', note: 'off the flare stack', floorPower: 4, particles: [{ ...OXIDE_1, n: 20 }] },
      { id: 'f2', label: 'SAMPLE B', note: 'off the kiln vent', floorPower: 4, particles: [{ ...OXIDE_2, n: 16 }] }
    ],
    widget: {
      type: 'choice',
      label: 'The drum holds',
      options: [
        { id: 'one-two', label: 'One carbon to two oxygens' },
        { id: 'one-one', label: 'One carbon to one oxygen' },
        { id: 'three-eight', label: 'Three carbons to eight oxygens' },
        { id: 'two-one', label: 'Two carbons to one oxygen' }
      ]
    },
    hints: [
      'Turn the Power dial past 4 and tap the atoms in one molecule on each plate to read their masses.',
      'Compare the count of oxygen joined to one carbon in each sample with the weight ratio of the drum.',
      'Divide each part of the weight by what one atom of that element weighs, then scale the two counts to the smallest whole numbers.'
    ],
    check(state) {
      if (!state.choice) {
        return { ok: false, notYet: true, msg: 'Pick one of the four answers.' };
      }
      if (state.choice === 'three-eight') {
        return { ok: false, msg: '3 and 8 are weights, not counts. One carbon weighs 12.0 and one oxygen weighs 16.0, so equal weights are not equal numbers of atoms.' };
      }
      if (state.choice === 'one-one') {
        return { ok: false, msg: 'One to one would need equal numbers of atoms, which by weight would be 12 parts carbon to 16 parts oxygen — not 3 to 8.' };
      }
      if (state.choice === 'two-one') {
        return { ok: false, msg: 'The drum holds more than twice as much oxygen as carbon by weight, so oxygen cannot be the element there is less of.' };
      }
      return { ok: true };
    },
    reward: {
      log: 'Drum: 3 to 8 by weight is 1 to 2 by count.',
      title: 'The Empirical Formula',
      body: 'Dividing each mass share by atomic weight yields the mole ratio. Reducing 3 parts carbon and 8 parts oxygen gives a 1:2 ratio, matching carbon dioxide.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Name Three Samples',
    briefing: {
      speaker: SPEAKER,
      body: 'The mechanical slicer divides joined matter. Press "Run Cutter" to attempt splitting a sample along its seams.'
    },
    prompt: 'Sort each crate into its matching recipe bin.',
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
        { id: 'm1', label: 'One oxygen to two hydrogens' },
        { id: 'm2', label: 'One nitrogen to three hydrogens' },
        { id: 'm3', label: 'One carbon to four hydrogens' }
      ]
    },
    hints: [
      'Turn the power up past 4, then count how many small atoms are hanging off the large one in each sample.',
      'Tap the large atom in each molecule to read its name — carbon, nitrogen and oxygen look similar by eye.',
      'For each sample, read the middle atom in a molecule and count the hydrogens joined to it, then find the bin that names that same pair.'
    ],
    check(state) {
      const labels = { g1: 'Sample A', g2: 'Sample B', g3: 'Sample C' };
      for (const id of ['g1', 'g2', 'g3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      const reasons = {
        g1: 'Sample A is filed wrong. Read the middle atom in one of its molecules, and count the hydrogens on it.',
        g2: 'Sample B is filed wrong. Read the middle atom in one of its molecules, and count the hydrogens on it.',
        g3: 'Sample C is filed wrong. Read the middle atom in one of its molecules, and count the hydrogens on it.'
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
      body: 'A compound\'s identity depends strictly on which elements it contains and their numerical ratio. Different ratios define entirely different chemical substances.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Three Claims',
    prompt: 'Which shipments match their label, and which do not?',
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
        { id: 'yes', label: 'As claimed', note: 'One oxygen to two hydrogens, and nothing else in it.' },
        { id: 'no', label: 'Not as claimed', note: 'Either the recipe is wrong or there is something else in there.' }
      ]
    },
    hints: [
      'Turn the power up past 4, then settle each sample and count one molecule on each plate.',
      'The claim is one oxygen to two hydrogens, and a sample fails it by holding a different molecule or by holding anything besides that molecule.',
      'Test each sample twice: two layers after settling fails it, and a molecule that is not one oxygen with two hydrogens fails it; only a sample that passes both is as claimed.'
    ],
    check(state) {
      const labels = { h1: 'Sample A', h2: 'Sample B', h3: 'Sample C' };
      for (const id of ['h1', 'h2', 'h3']) {
        if (!state.bins[id]) return { ok: false, notYet: true, msg: `${labels[id]} has no answer yet.` };
      }
      const reasons = {
        h1: 'Sample A is filed wrong. Settle it and count one molecule at high power, and check both against the claim.',
        h2: 'Sample B is filed wrong. Settle it and count one molecule at high power, and check both against the claim.',
        h3: 'Sample C is filed wrong. Settle it and count one molecule at high power, and check both against the claim.'
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
      body: 'A pure compound has an exact, unvarying chemical formula. Any shift in atom ratio or unbonded excess indicates a mixture or an entirely different substance.',
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
      body: 'A compound holds the same elements in the same ratio wherever it came from and however much of it you have. Put in more of one element and it does not become a new compound; the extra just sits there as a mixture.'
    },
    {
      heading: 'By Weight',
      body: 'That fixed recipe fixes the weights too: what one molecule weighs, and what share of that weight each element brings. Running it backwards, a weight ratio divided by the atoms\' own masses gives you the recipe of something you never opened.'
    },
    {
      heading: 'Next',
      body: 'You counted molecules on this bench because there were few enough to count. One automaton still walks the yard: the Recipe Golem, bound by the very recipes you have balanced.'
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
    question: 'A joiner bonds 2 hydrogen atoms and 1 oxygen atom into each water molecule. How many molecules can 6 hydrogen atoms and 5 oxygen atoms make?',
    options: [
      { id: 'a', label: '3 molecules, and the hydrogen is the limiting reactant' },
      { id: 'b', label: '5 molecules, and the oxygen is the limiting reactant' },
      { id: 'c', label: '6 molecules, because the hydrogen sets the count' },
      { id: 'd', label: '11 molecules, because every atom is used' }
    ],
    answer: 'a',
    explanation: 'Six hydrogens make three molecules at two apiece, and three molecules need only 3 of the 5 oxygens. The hydrogen gives out first, so it limits the count and 2 oxygens are left over.'
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
    cut: new Set(),
    weighed: 0,
    made: 0,
    counts: stage.join ? Object.fromEntries(stage.samples.map(sm => [sm.id, sm.particles.map(p => p.n)])) : null
  };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { maxPower: 4, probed: new Set(['k01', 'k08']), build: { k01: 2, k08: 1 } },
  { maxPower: 4, probed: new Set(['k01', 'k08']), settled: new Set(['b1', 'b2']), choice: 'extra' },
  { maxPower: 4, probed: new Set(['k01', 'k08']), weighed: 2, made: 3, choice: 'same' },
  { maxPower: 4, probed: new Set(['k01', 'k08']), made: 4, choice: 'h4' },
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
  { maxPower: 4, probed: new Set(['k01', 'k08']), weighed: 2, made: 3, choice: 'up' },
  { maxPower: 4, probed: new Set(['k01', 'k08']), made: 4, choice: 'both' },
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
    quest: ctx?.quest || { id: 'q1-recipe' },
    world: ctx?.world,
    stageCount: STAGES.length,
    rewards: STAGES.map(s => s.reward),
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  const scope = SampleScope(frame.instrumentHost, {
    kinds: KINDS,
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id),
    onPower: v => setPower(v)
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
      log: stage.log,
      commitLabel: stage.encounter?.act || 'Commit'
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
    if (stage.controls.includes('join')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="join">Join One Molecule</button>');
    }
    if (stage.controls.includes('weigh')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="weigh">Weigh Bench</button>');
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

  /** The samples as they stand now: the joiner changes the counts, never the declaration. */
  function liveSamples() {
    const stage = STAGES[index];
    return stage.samples.map(sm => ({
      ...sm,
      particles: sm.particles.map((p, pi) => ({ ...p, n: state.counts?.[sm.id]?.[pi] ?? p.n }))
    }));
  }

  /** What the balance reports: every atom on every plate, by its listed mass. */
  function benchWeight() {
    return liveSamples().reduce((sum, sm) => sum + sm.particles.reduce(
      (t, p) => t + p.n * p.kinds.reduce((m, k) => m + KINDS[k].mass, 0), 0), 0);
  }

  function joinOne() {
    const stage = STAGES[index];
    const { take, into } = stage.join;
    if (!Object.entries(take).every(([id, k]) => state.counts[id][0] >= k)) {
      renderReadout(null, { head: 'Joiner // refused', body: 'There are not enough atoms left in one of the heaps to bond another molecule.' });
      return;
    }
    for (const [id, k] of Object.entries(take)) state.counts[id][0] -= k;
    state.counts[into][0] += 1;
    state.made += 1;
    scope.setSamples(liveSamples());
    scope.setPower(state.power);
    if (state.sample) scope.setSelected(state.sample);
    soundscape.playBondSnap?.();
    renderReadout(null, { head: 'Joiner // made', body: `One molecule bonded. ${state.made} made so far.` });
  }

  function weighBench() {
    state.weighed += 1;
    const total = benchWeight();
    frame.logReading({ made: state.made, total: total.toFixed(1) });
    renderReadout(null, { head: 'Balance // whole bench', body: `Everything on the bench weighs ${total.toFixed(1)}.` });
  }

  async function runTool(tool) {
    if (busy) return;
    if (tool === 'join') { joinOne(); return; }
    if (tool === 'weigh') { weighBench(); return; }
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
            ? 'The blade cuts the bonds and every molecule falls apart into separate atoms.'
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
            ? 'Tap any atom to read it.'
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
