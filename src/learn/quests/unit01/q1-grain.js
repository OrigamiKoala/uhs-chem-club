/**
 * q1-grain.js — Tallow, site one: THE GRAIN OF THINGS.
 *
 * The first game on the Learn road. Eight stages on a salvage bench, naming
 * real elements from the start and discovering pure elements, mixtures,
 * molecules and compounds immediately after each stage as the reward card
 * payoff.
 *
 * WORDS ARE FREE, PHENOMENA ARE DISCOVERED. Every atom on this bench is
 * called by its real element name from stage one (hydrogen, carbon, oxygen,
 * sodium, sulfur, chlorine). What the player discovers is never the word —
 * it is the observation: one powder holds a single element, bonded groups
 * survive the cutter, shaking sorts some samples into layers and not others.
 *
 * THE ORDER IS THE WHOLE DESIGN. Every stage is a thing the player does with
 * an instrument, and the concept arrives immediately afterwards as a reward
 * card, connecting the player's hands-on observation to the real chemistry:
 *
 *   1  determine where matter stops looking smooth -> Atoms · The Discrete Floor of Matter
 *   2  find the powder that is one element        -> Elements vs. Mixtures
 *   3  count the elements in an unsorted ore      -> Atomic Mass · Weighing Tells Them Apart
 *   4  test samples against the bench cutter      -> Molecules · What the Blade Cannot Cut
 *   5  assemble a molecule to match the sample    -> Water, H2O
 *   6  match vials to recipes                    -> Chemical Compounds · Structure Dictates Function
 *   7  settle crates to find mixtures            -> Separating Mixtures vs. Chemical Bonds
 *   8  classify all unknown salvage crates       -> Classifying All Matter
 *   -- debrief: what the element numbers mean & preview of the atomic core.
 *
 * EVERY STAGE IS A FIGHT. Each stage declares an `encounter` (foes.js): the
 * samples on the bench are salt husks, the Commit key is named for the attack it
 * is, and the husk reacts to the cutter and the shaker from the SAME planners the
 * scope uses. No `check()` knows any of this. Copy in an encounter obeys the
 * VOCABULARY schedule below like every other line the player reads.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It
 * reports through `ctx` and nothing else.
 */

import { SampleScope, detailFor } from '../../engine/instruments.js';
import { LearnFrame, toolNotes } from '../../engine/frame.js';
import { dialMarkup, bindDial, paintDial as paintDialControl } from '../../engine/dial.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

const SPEAKER = 'Vess';

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
    from: 7,
    key: 'Settle',
    what: 'Shakes the sample so heavier atoms sink below lighter ones.'
  }]
  // Run Cutter runs the cutter.
};

/**
 * The legend line for one control on one stage, or null if there is none.
 * `stageNumber` is one-based, the way a player counts stages.
 */
export function toolNoteFor(controlId, stageNumber) {
  const rows = TOOL_TEXT[controlId];
  if (!rows) return null;
  let out = null;
  for (const r of rows) if (stageNumber >= r.from) out = r;
  return out ? { key: out.key, what: out.what } : null;
}

/* ------------------------------------------------------------------
   THE ELEMENTS
   What the scope has met before, in the order it met it. Every atom is
   called by its real element name from the start — hydrogen, carbon,
   oxygen, sodium, sulfur, chlorine — with the mass the scope weighed for
   it. The numbers beside the names are each element's place in the order
   site three is about; until then they are just part of the name.
   ------------------------------------------------------------------ */
export const KINDS = {
  k01: {
    code: 'hydrogen (H)', mass: 1.0, size: 0.30, tint: 'bone',
    note: 'The lightest atom the scope has ever weighed.'
  },
  k02: {
    code: 'helium (He)', mass: 4.0, size: 0.38, tint: 'pale',
    note: 'Light and unreactive. Floats free as lone atoms.'
  },
  k06: {
    code: 'carbon (C)', mass: 12.0, size: 0.56, tint: 'iron',
    note: 'Dark and dry. Leaves a mark on anything it touches.'
  },
  k08: {
    code: 'oxygen (O)', mass: 16.0, size: 0.52, tint: 'rust',
    note: 'Small but heavy. Turns up in almost every sample here.'
  },
  k11: {
    code: 'sodium (Na)', mass: 23.0, size: 0.74, tint: 'pale',
    note: 'Large, soft and dull. Joins with almost anything.'
  },
  k12: {
    code: 'magnesium (Mg)', mass: 24.3, size: 0.72, tint: 'pale',
    note: 'Lightweight, pale metal.'
  },
  k16: {
    code: 'sulfur (S)', mass: 32.1, size: 0.64, tint: 'sand',
    note: 'Yellow. Slightly lighter than the chlorine it looks like.'
  },
  k17: {
    code: 'chlorine (Cl)', mass: 35.5, size: 0.66, tint: 'sand',
    note: 'Yellow and heavy. Sharp smell.'
  }
};

export const POWER_SCALES = {
  1: '1 mm',
  2: '100 µm',
  3: '10 µm',
  4: '1 µm',
  5: '100 nm',
  6: '1 nm'
};

/** 0–10 segment meters. The bars are derived from the readings, never authored. */
const massBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].mass / 40) * 10)));
const sizeBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].size / 0.8) * 10)));

/* ------------------------------------------------------------------
   SHAPES
   A `kinds` list alone means one center with the rest holding on to it.
   Where that would misstate what is joined to what, the entry draws itself.
   ------------------------------------------------------------------ */

/** One heavy atom with two light ones attached, bent. */
const CLUSTER_A = { kinds: ['k08', 'k01', 'k01'] };

/** Two heavy atoms in a chain with one light atom on each end — not a star. */
const CLUSTER_B = {
  kinds: ['k08', 'k08', 'k01', 'k01'],
  geom: [[-0.52, 0], [0.52, 0], [-1.0, -0.78], [1.0, 0.78]],
  bonds: [[0, 1], [0, 2], [1, 3]]
};

/** Two of the lightest atom bonded to each other: one kind, and still bonded. */
const PAIR_LIGHT = { kinds: ['k01', 'k01'] };

/* ------------------------------------------------------------------
   WHEN EACH WORD IS EARNED

   `introducedAt` is the stage whose REWARD CARD first uses the word. From the
   NEXT stage on the game just says it — prompts, hints, labels and all. A word
   is withheld for exactly one stage: long enough for the player to find the
   thing, not so long that the game is talking in code. `verify:learn` reads
   this table; nothing in it is player-facing.
   ------------------------------------------------------------------ */
export const VOCABULARY = [
  { term: /\b(atoms?|atomic)\b/i, introducedAt: 1 },
  { term: /\belements?\b/i, introducedAt: 2 },
  { term: /\bmixtures?\b/i, introducedAt: 2 },
  { term: /\b(molecules?|molecular)\b/i, introducedAt: 4 },
  { term: /\bcompounds?\b/i, introducedAt: 6 }
];

/* ------------------------------------------------------------------
   THE EIGHT STAGES

   One idea per stage, one thing to do, one thing to answer. Every `check` is a
   pure function of the bench state, which is what makes them checkable without
   a browser: `npm run verify:learn` runs SOLUTIONS and MISSES below through
   them, so a stage whose grading has drifted fails the build instead of
   stranding a student.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'Zoom In',
    briefing: {
      speaker: 'Vess',
      body: 'The molecular scope zooms down through matter to the smallest pieces. Turn the Power dial to bring individual particles into view.'
    },
    prompt: 'What is the lowest power where individual particles resolve?',
    controls: ['power'],
    samples: [
      { id: 'c7', label: 'SAMPLE A', note: 'grey powder from the refinery yard', floorPower: 4, particles: [{ kinds: ['k06'], n: 46 }] }
    ],
    widget: { type: 'choice-row', min: 1, max: 6, label: 'Lowest power' },
    answer: 4,
    hints: [
      'Turn the Power dial up one step at a time and watch the picture change.',
      'At low power you see solid clumps, and at high power you see separate round atoms.',
      'Find the first power where you can pick out single atoms, then turn down one step and check that the picture there is still clumps.'
    ],
    check(state) {
      if (!state.number) {
        return { ok: false, notYet: true, msg: 'Pick a power from 1 to 6 first.' };
      }
      if (state.number === 4) return { ok: true };
      if (state.number < 4) return { ok: false, msg: 'Too low. At that power the sample still looks like solid clumps.' };
      return { ok: false, msg: 'Too high. That power shows the same atoms, just bigger — go back to the first power where they appear.' };
    },
    reward: {
      log: 'Atoms resolved at power 4.',
      title: 'Atoms',
      body: 'Zoom in far enough and matter stops being smooth: it is made of separate tiny particles. These particles are called atoms.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'One Kind or Two?',
    prompt: 'Which sample is a pure element, made of only one kind of atom?',
    controls: ['power'],
    select: true,
    samples: [
      { id: 'c09', label: 'SAMPLE A', note: 'grey powder from the refinery yard', floorPower: 4, particles: [{ kinds: ['k06'], n: 44 }] },
      { id: 'c14', label: 'SAMPLE B', note: 'grey powder from the refinery yard', floorPower: 4, particles: [{ kinds: ['k06'], n: 26 }, { kinds: ['k11'], n: 18 }] }
    ],
    widget: { type: 'sample' },
    hints: [
      'They look identical until the scope shows the atoms, so turn the Power dial up first.',
      'Compare the two pictures atom by atom: every atom in one sample matches, and the other sample holds two different atoms.',
      'Tap several atoms in each sample and compare their names: a pure element reads one name on every atom.'
    ],
    check(state) {
      if (state.sample === 'c09') return { ok: true };
      return { ok: false, msg: 'Look again: that one holds dark carbon atoms and pale sodium atoms together, so it is no pure element.' };
    },
    reward: {
      log: 'Sample A is carbon only. Sample B mixes carbon and sodium.',
      title: 'Elements and Mixtures',
      body: 'A substance made of only one kind of atom is called an element. Different atoms sitting together without joining make a mixture.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Count the Elements',
    prompt: 'How many different elements are present in this ore sample?',
    controls: ['power'],
    samples: [
      {
        id: 'ore', label: 'SAMPLE A', note: 'unsorted rock from the refinery yard', floorPower: 4,
        particles: [
          { kinds: ['k11'], n: 26 },
          { kinds: ['k12'], n: 20 },
          { kinds: ['k06'], n: 9 }
        ]
      }
    ],
    widget: { type: 'number', min: 1, max: 6, label: 'Elements counted' },
    answer: 3,
    hints: [
      'Tap atoms across the sample to inspect each one.',
      'Two of the elements look alike, but their masses differ: one reads 23.0 and the other 24.3.',
      'Count how many distinct element names appear across all your readings.'
    ],
    check(state) {
      if (state.number === 3) return { ok: true };
      if (state.number < 3) return { ok: false, msg: 'There is at least one more element in there. Two of them look alike, so check their mass readings.' };
      return { ok: false, msg: 'Too many. Some of the atoms you read are the same element as each other.' };
    },
    reward: {
      log: 'Three elements found: sodium, magnesium and carbon.',
      title: 'Every Element Has Its Own Atom',
      body: 'The atoms of different elements differ in mass and size. When two elements look identical under the scope, weighing an atom tells them apart.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What the Blade Cannot Cut',
    briefing: {
      speaker: 'Vess',
      body: 'The mechanical slicer cuts samples into smaller pieces. Press "Run Cutter" to test what the blade can divide.'
    },
    prompt: 'Which of the four samples cannot be split by the cutter?',
    controls: ['cut'],
    select: true,
    samples: [
      { id: 't1', label: 'SAMPLE A', note: 'loose grey grit', floorPower: 1, magnify: 1.5, particles: [{ kinds: ['k06'], n: 20 }] },
      { id: 't2', label: 'SAMPLE B', note: 'a clear droplet', floorPower: 1, magnify: 3.6, particles: [{ ...CLUSTER_A, n: 1 }] },
      { id: 't3', label: 'SAMPLE C', note: 'a puff of light gas', floorPower: 1, magnify: 3.6, particles: [{ ...PAIR_LIGHT, n: 1 }] },
      { id: 't4', label: 'SAMPLE D', note: 'a puff of gas from the vent lamp', floorPower: 1, magnify: 3.6, particles: [{ kinds: ['k02'], n: 1 }] }
    ],
    widget: { type: 'sample' },
    hints: [
      'Select each sample in turn and press "Run Cutter".',
      'Joined groups break into separate pieces, but one sample does not change at all.',
      'Pick the sample whose picture remains completely unchanged after cutting.'
    ],
    check(state) {
      if (state.sample === 't4') return { ok: true };
      return { ok: false, msg: 'That one came apart under the blade. Pick the sample the cutter left exactly as it was.' };
    },
    reward: {
      log: 'A single helium atom will not divide.',
      title: 'Atoms Do Not Split',
      body: 'Groups of atoms joined together are called molecules, and the cutter splits them apart. A lone atom cannot be divided.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Copy the Molecule',
    prompt: 'How many atoms of each element build one molecule of Sample A?',
    controls: ['power'],
    samples: [
      { id: 'v9', label: 'SAMPLE A', note: 'clear liquid from the refinery', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_A, n: 20 }] }
    ],
    widget: { type: 'build', kinds: ['k01', 'k06', 'k08'], max: 4 },
    hints: [
      'Turn the Power dial up until one molecule is clear, then tap the atom in the middle and each one joined to it.',
      'Every molecule here is the same, so read just one: the name of the atom in the middle and the name of each atom joined to it.',
      'Add one atom to the tray for every atom in that one molecule, by name: the middle one plus each joined one, and nothing else.'
    ],
    check(state) {
      const b = state.build;
      const total = Object.values(b).reduce((n, v) => n + v, 0);
      if (total === 0) return { ok: false, notYet: true, msg: 'The tray is empty. Use the + keys to add atoms.' };
      if (b.k06) return { ok: false, msg: 'There is no carbon in this sample. Tap the atoms in a molecule and check what they read.' };
      if (b.k01 === 2 && b.k08 === 1) return { ok: true };
      if (b.k01 > 0 && b.k08 > 0) return { ok: false, msg: 'Right elements, wrong numbers. Count the middle atom and the ones joined to it.' };
      return { ok: false, msg: 'One of the two elements is missing. Tap the middle atom and the joined ones separately.' };
    },
    reward: {
      log: 'Copy built: 1 x oxygen, 2 x hydrogen.',
      title: 'Water, H2O',
      body: 'Each water molecule contains one oxygen atom joined to two hydrogen atoms. A fixed combination of atoms defines a molecule.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Same Atoms, Different Recipe',
    prompt: 'File each sample under the recipe that matches its molecules.',
    controls: ['power'],
    samples: [
      { id: 'vA', label: 'SAMPLE A', note: 'clear liquid from the refinery', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_A, n: 16 }] },
      { id: 'vB', label: 'SAMPLE B', note: 'clear liquid from the refinery', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_B, n: 14 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'm9', label: '1 oxygen + 2 hydrogen', note: 'one oxygen atom in the middle' },
        { id: 'm22', label: '2 oxygen + 2 hydrogen', note: 'two oxygen atoms joined in a chain' }
      ]
    },
    hints: [
      'Turn the Power dial up until single molecules are clear, then count the atoms in one from each sample.',
      'Both samples use only hydrogen and oxygen, and the difference is how many oxygen atoms each molecule holds.',
      'Count the oxygen atoms in one molecule from each sample, then file each under the recipe with that many oxygen atoms.'
    ],
    check(state) {
      const { bins } = state;
      if (!bins.vA || !bins.vB) return { ok: false, notYet: true, msg: 'File both samples before you commit.' };
      if (bins.vA === 'm9' && bins.vB === 'm22') return { ok: true };
      return { ok: false, msg: 'At least one sample is under the wrong recipe. Count the oxygen atoms in one molecule from each sample.' };
    },
    reward: {
      log: 'Sample A: H2O. Sample B: H2O2.',
      title: 'Compounds',
      body: 'Two or more different elements bonded together make a compound. Changing the recipe produces a different substance with different properties.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Shake It Out',
    briefing: {
      speaker: 'Vess',
      body: 'The shaker table sorts unbonded atoms by weight. Press "Settle" to see if a sample separates into layers.'
    },
    prompt: 'Classify each sample as a single substance or a mixture.',
    controls: ['settle'],
    select: true,
    samples: [
      { id: 'p1', label: 'SAMPLE A', note: 'yellow powder from the mine', floorPower: 1, particles: [{ kinds: ['k16'], n: 30 }] },
      { id: 'p2', label: 'SAMPLE B', note: 'clear liquid from the refinery', floorPower: 1, particles: [{ ...CLUSTER_A, n: 26 }] },
      { id: 'p3', label: 'SAMPLE C', note: 'pale powder from the yard', floorPower: 1, particles: [{ kinds: ['k11'], n: 16 }, { kinds: ['k06'], n: 16 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'one', label: 'Single substance', note: 'settles into one even layer' },
        { id: 'mixed', label: 'Mixture', note: 'settles into two or more layers' }
      ]
    },
    hints: [
      'Select each sample and press "Settle" to watch how its particles land.',
      'Heavier atoms sink and lighter atoms float, separating unbonded mixtures into layers.',
      'Count the layers in each sample: one layer is a single substance, while multiple layers indicate a mixture.'
    ],
    check(state) {
      const { bins, settled } = state;
      if (!bins.p1 || !bins.p2 || !bins.p3) return { ok: false, notYet: true, msg: 'File all three samples before you commit.' };
      if (bins.p1 === 'one' && bins.p2 === 'one' && bins.p3 === 'mixed') return { ok: true };
      return { ok: false, msg: 'At least one is filed wrong. One layer means one substance; two layers mean a mixture.' };
    },
    reward: {
      log: 'Sample C separated into sodium and carbon layers.',
      title: 'Why Mixtures Separate',
      body: 'Shaking separates a mixture because nothing holds the different substances together. A compound stays together because chemical bonds hold its atoms.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'Sort Them All',
    prompt: 'Classify each sample as an element, a compound, or a mixture.',
    controls: ['power', 'cut', 'settle'],
    select: true,
    samples: [
      { id: 'm1', label: 'SAMPLE A', note: 'dark powder from the yard', floorPower: 4, particles: [{ kinds: ['k06'], n: 40 }] },
      { id: 'm2', label: 'SAMPLE B', note: 'clear liquid from the refinery', floorPower: 4, particles: [{ ...CLUSTER_A, n: 30 }] },
      { id: 'm3', label: 'SAMPLE C', note: 'dark and yellow powder from the yard', floorPower: 4, particles: [{ kinds: ['k06'], n: 18 }, { kinds: ['k16'], n: 18 }] },
      { id: 'm4', label: 'SAMPLE D', note: 'colorless gas from a sealed tank', floorPower: 4, particles: [{ ...PAIR_LIGHT, n: 34 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'element', label: 'Element', note: 'atoms of a single element' },
        { id: 'compound', label: 'Compound', note: 'different elements bonded together' },
        { id: 'mixed', label: 'Mixture', note: 'different elements, not bonded' }
      ]
    },
    hints: [
      'Zoom in on each sample to see how many elements it holds and whether its atoms are bonded, then settle any you are unsure of.',
      'For each sample, check two things: how many different names its atoms read, and whether its atoms are joined in groups or sit loose.',
      'One element only is an element even in joined pairs, while different elements joined together make a compound and sitting loose make a mixture.'
    ],
    check(state) {
      const b = state.bins;
      if (!b.m1 || !b.m2 || !b.m3 || !b.m4) return { ok: false, notYet: true, msg: 'File all four samples before you commit.' };
      const want = { m1: 'element', m2: 'compound', m3: 'mixed', m4: 'element' };
      const wrong = Object.keys(want).filter(k => b[k] !== want[k]);
      if (!wrong.length) return { ok: true };
      if (wrong.length === 1) {
        return { ok: false, msg: 'One is filed wrong. Check whether it holds one element or several, and whether they are bonded.' };
      }
      return { ok: false, msg: 'More than one is filed wrong. One element is an element even when its atoms are bonded in pairs.' };
    },
    reward: {
      log: 'All four filed correctly.',
      title: 'Elements, Compounds, and Mixtures',
      last: true,
      body: 'An element has only one kind of atom, a compound bonds different elements together, and a mixture keeps them unbonded. Every substance fits one of these three.'
    }
  }
];
/* ------------------------------------------------------------------
   THE DEBRIEF
   Three short cards: what the player learned, what the element numbers
   mean, and what the next bench is about.
   ------------------------------------------------------------------ */
const DEBRIEF = {
  speaker: 'Vess',
  sections: [
    {
      heading: 'What You Found',
      body: 'Matter is made of atoms. One element on its own is an element, different elements bonded together make a compound, and elements just sitting together unbonded make a mixture.'
    },
    {
      heading: 'What the numbers mean',
      body: 'Nice job! Now let\'s go explore what an atom is made of.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   Five questions covering atoms, elements, molecules, compounds, and
   mixtures. Appear after the debrief, before the player exits.
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'You zoom in until matter stops looking smooth and breaks into separate tiny pieces. What are those pieces called?',
    options: [
      { id: 'a', label: 'Molecules' },
      { id: 'b', label: 'Atoms' },
      { id: 'c', label: 'Elements' },
      { id: 'd', label: 'Compounds' }
    ],
    answer: 'b',
    explanation: 'Atoms are the tiny particles everything is made of. Zooming in further just shows the same atoms bigger.'
  },
  {
    question: 'A sample contains only carbon (C) atoms and nothing else. What kind of substance is it?',
    options: [
      { id: 'a', label: 'A compound' },
      { id: 'b', label: 'A mixture' },
      { id: 'c', label: 'A pure element' },
      { id: 'd', label: 'A molecule' }
    ],
    answer: 'c',
    explanation: 'An element is built from only one kind of atom. Carbon on its own is the element C.'
  },
  {
    question: 'One oxygen (O) atom is bonded to two hydrogen (H) atoms. What have you got?',
    options: [
      { id: 'a', label: 'An element' },
      { id: 'b', label: 'A mixture' },
      { id: 'c', label: 'A molecule (H₂O)' },
      { id: 'd', label: 'An atom' }
    ],
    answer: 'c',
    explanation: 'Atoms bonded together make a molecule. This one is water, H₂O — the molecule you copied.'
  },
  {
    question: 'Carbon (C) atoms and sodium (Na) atoms sit in the same jar, not bonded to each other. What is in the jar?',
    options: [
      { id: 'a', label: 'A compound' },
      { id: 'b', label: 'A mixture' },
      { id: 'c', label: 'A pure element' },
      { id: 'd', label: 'A molecule' }
    ],
    answer: 'b',
    explanation: 'Different atoms that are not bonded make a mixture, which is why shaking can separate them.'
  },
  {
    question: 'Hydrogen peroxide (H₂O₂) is two H atoms bonded to two O atoms, always in that ratio. What is H₂O₂?',
    options: [
      { id: 'a', label: 'A mixture' },
      { id: 'b', label: 'An element' },
      { id: 'c', label: 'A chemical compound' },
      { id: 'd', label: 'A loose heap of atoms' }
    ],
    answer: 'c',
    explanation: 'Different elements bonded together in a fixed recipe make a compound. No amount of shaking will separate it.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   Everything a stage's `check` is allowed to look at. One shape for all
   eight stages, so the widgets stay interchangeable.
   ------------------------------------------------------------------ */
function blankState(stage) {
  const initialNum = (stage.widget.type === 'number' || stage.widget.type === 'choice-row')
    ? (stage.widget.min ?? null)
    : null;
  return {
    power: 1,
    maxPower: 1,
    resolved: new Set(),
    number: initialNum,
    sample: null,
    build: {},
    bins: {},
    probed: new Set(),   // distinct kinds read on this stage
    cut: new Set(),      // samples the blade has been run over
    settled: new Set()   // samples that have been shaken down
  };
}

/** The bench state that solves each stage, in order. Checked by verify:learn. */
export const SOLUTIONS = [
  { number: 4, maxPower: 4 },
  { sample: 'c09', resolved: new Set(['c09', 'c14']) },
  { number: 3, probed: new Set(['k08', 'k17', 'k16']) },
  { sample: 't4', cut: new Set(['t1', 't2', 't3', 't4']) },
  { build: { k08: 1, k01: 2 } },
  { bins: { vA: 'm9', vB: 'm22' } },
  { bins: { p1: 'one', p2: 'one', p3: 'mixed' }, settled: new Set(['p1', 'p2', 'p3']) },
  { bins: { m1: 'element', m2: 'compound', m3: 'mixed', m4: 'element' } }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { number: 6, maxPower: 4 },
  { sample: 'c14', resolved: new Set(['c09', 'c14']) },
  { number: 2, probed: new Set(['k08', 'k17', 'k16']) },
  { sample: 't2', cut: new Set(['t1', 't2', 't3', 't4']) },
  { build: { k08: 1, k01: 1 } },
  { bins: { vA: 'm22', vB: 'm9' } },
  { bins: { p1: 'one', p2: 'mixed', p3: 'mixed' }, settled: new Set(['p1', 'p2', 'p3']) },
  { bins: { m1: 'element', m2: 'compound', m3: 'mixed', m4: 'compound' } }
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
    quest: ctx?.quest || { id: 'q1-grain' },
    world: ctx?.world,
    stageCount: STAGES.length,
    rewards: STAGES.map(s => s.reward),
    onSubmit: () => submit(),
    onNext: () => next(),
    onJump: i => loadStage(i),
    onExit: () => ctx.exit()
  });

  const scope = new SampleScope(frame.instrumentHost, {
    kinds: KINDS,
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id),
    // THE DIAL ON THE BENCH. Where the bench is built (T4 on Tallow) the power
    // control is a real knob standing on the plate, and turning it arrives
    // here. Where the bench is drawn the option is ignored and the panel dial
    // is the only one there is. Either way the quest calls the same `setPower`,
    // which is the rule that keeps the two instruments one instrument.
    onPower: v => setPower(v),
    powerRange: { min: 1, max: 6 }
  });

  // A finished quest replays from the top and costs nothing, the way a cleared
  // campaign quest does. Otherwise pick up where the bench was left.
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
    scope.setSelectable(Boolean(stage.select) || stage.controls.some(c => c === 'cut' || c === 'settle'));

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
      if (result.notYet) {
        frame.note(result.msg);
      } else {
        frame.miss(result.msg);
      }
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
      // A magnification setting is a thing you turn, so it is a knob. See
      // `engine/dial.js`: drag it round, arrow-key it, or roll the wheel on it.
      parts.push(dialMarkup({ label: 'Power', min: 1, max: 6, value: state.power, id: 'scope-power', scaleLabels: POWER_SCALES }));
    }
    if (stage.controls.includes('cut')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="cut">Run Cutter</button>');
    }
    if (stage.controls.includes('settle')) {
      parts.push('<button type="button" class="btn-secondary quest-btn-sm lq-tool" data-tool="settle">Settle</button>');
    }

    // The legend, under the keys: what each one of them actually does.
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

  /**
   * Which plates are resolved at the power the dial is on.
   *
   * ONE DIAL DRIVES EVERY PLATE. The scope magnifies the whole bench at once,
   * so a power that resolves one crate has resolved the crate beside it — the
   * player can see both without touching either. This used to record only the
   * *selected* plate, which meant stage two's "inspect both crates" could not be
   * satisfied by looking: the only way through was to tap the wrong crate first,
   * and a player who raised the dial and then tapped the right one was told to
   * go and do the thing they had just done.
   */
  function checkResolved() {
    const samples = STAGES[index].samples || [];
    samples.forEach(s => {
      if (state.power >= (s.floorPower || 1)) state.resolved.add(s.id);
    });
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
    checkResolved();
  }

  function paintDial() {
    paintDialControl(frame.el.controls, state.power, { min: 1, max: 6, scaleLabels: POWER_SCALES });
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
      frame.foeReact(id, { tool: 'cut' });
      renderReadout(null, {
        head: `Cutter // ${labelFor(id)}`,
        body: found === 'none'
          ? 'The blade closes on a single atom and finds nothing inside to split.'
          : found === 'broke'
            ? 'The blade cuts the joins and the group falls apart into separate atoms.'
            : 'The blade just scatters the heap. Nothing here was bonded to anything.'
      });
    } else if (tool === 'settle') {
      await scope.settle(id);
      state.settled.add(id);
      frame.foeReact(id, { tool: 'settle' });
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

  /** How many distinct materials are in a crate — what the shaker reveals. */
  function bandCount(id) {
    const sample = STAGES[index].samples.find(s => s.id === id);
    return new Set(sample.particles.map(p => p.kinds.join('+'))).size;
  }

  /* ---------------- probe readout ---------------- */

  function onProbe(hit) {
    // Stage 3 counts distinct elements, so each new one read is one row on the bench log.
    if (index === 2 && !state.probed.has(hit.kindId)) {
      frame.logReading({ 'Atom': KINDS[hit.kindId].code, 'Mass': KINDS[hit.kindId].mass.toFixed(1) });
    }
    state.probed.add(hit.kindId);
    soundscape.playScanSweep?.();
    renderReadout(hit);
    if (index === 2) {
      const tally = frame.el.widget.querySelector('.lq-tally');
      if (tally) tally.textContent = `Different elements read so far: ${state.probed.size}`;
    }
  }

  function onSelect(id) {
    state.sample = id;
    scope.setSelected(id);
    checkResolved();
    if (STAGES[index].widget.type === 'sample') renderWidget();
  }

  /**
   * The instrument card. It reports what it measured and nothing more: how many
   * other atoms are holding this one, never which elements they are. Counting the
    * arms is the player's job, and it is the whole of stage five.
    */
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
        <span class="lq-meter-bar" aria-hidden="true">${Array.from({ length: 10 }, (_, i) => `<i class="${i < filled ? 'on' : ''}"></i>`).join('')
      }</span>
        <span class="lq-meter-value">${value}</span>
      </div>
    `;
  }

  /* ---------------- answer widgets ---------------- */

  function renderWidget() {
    const stage = STAGES[index];
    const w = stage.widget;

    if (w.type === 'choice-row') {
      const min = w.min || 1;
      const max = w.max || 6;
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-choice-row">
            ${Array.from({ length: max - min + 1 }, (_, i) => {
        const val = min + i;
        const sel = state.number === val;
        return `<button type="button" class="btn-secondary quest-btn-sm lq-choice-btn ${sel ? 'selected' : ''}" data-choice-val="${val}">${val}</button>`;
      }).join('')}
          </div>
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-choice-val]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.number = Number(btn.dataset.choiceVal);
          frame.el.widget.querySelectorAll('.lq-choice-btn').forEach(b => {
            b.classList.toggle('selected', Number(b.dataset.choiceVal) === state.number);
          });
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'number') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">${esc(w.label)}</span>
          <div class="lq-number">
            <button type="button" class="btn-secondary quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${state.number}</span>
            <button type="button" class="btn-secondary quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
          ${index === 2 ? `<div class="lq-tally eyebrow lit">Different elements read so far: ${state.probed.size}</div>` : ''}
        </div>
      `);
      frame.el.widget.querySelectorAll('[data-num]').forEach(btn => {
        btn.addEventListener('click', () => {
          state.number = Math.max(w.min, Math.min(w.max, state.number + Number(btn.dataset.num)));
          frame.el.widget.querySelector('.lq-number-value').textContent = String(state.number);
          soundscape.playToggleClack?.();
        });
      });
      return;
    }

    if (w.type === 'sample') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Logged</span>
          <div class="lq-answer-value">${state.sample ? esc(labelFor(state.sample)) : '—'}</div>
          <p class="form-help">Tap a sample on the bench to pick it.</p>
        </div>
      `);
      return;
    }

    if (w.type === 'build') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Build tray</span>
          <div class="lq-build">
            ${w.kinds.map(kid => `
              <div class="lq-build-row" data-kind="${kid}">
                <span class="lq-build-dot" data-tint="${KINDS[kid].tint}"></span>
                <span class="lq-build-code">${KINDS[kid].code}</span>
                <button type="button" class="btn-secondary quest-btn-sm" data-build="-1" aria-label="One fewer ${KINDS[kid].code}">&minus;</button>
                <span class="lq-build-count">0</span>
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

    if (w.type === 'bins') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Your answer</span>
          <div class="lq-bins">
            ${stage.samples.map(s => `
              <div class="lq-bin-row" data-sample="${s.id}">
                <span class="lq-bin-sample">${esc(s.label)}</span>
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
