/**
 * q1-grain.js — Tallow, site one: THE GRAIN OF THINGS.
 *
 * The first game on the Learn road. Eight stages on a salvage bench, and the
 * player leaves knowing what an atom, an element, a molecule, a compound and a
 * mixture are — without being told any of those words until the debrief.
 *
 * THE ORDER IS THE WHOLE DESIGN. Every stage is a thing the player does with an
 * instrument, and the idea arrives afterwards as a reward card, never as a
 * briefing. Nothing on this bench is explained before it has been seen:
 *
 *   1  turn the power up until the picture stops getting finer   -> there is a floor
 *   2  find the crate that is one material                       -> one kind, or several
 *   3  count how many kinds are in one crate                     -> sample widely, trust the scale
 *   4  run a cutter over four objects                            -> one of them will not divide
 *   5  assemble the cluster that repeats                         -> a bound group is a fixed recipe
 *   6  file two vials against two manifests                      -> same ingredients, different recipe
 *   7  settle three crates and read the bands                    -> mixed, or not
 *   8  file a manifest of four unknown crates                    -> all of it at once
 *   -- debrief: atom, element, molecule, compound, mixture, and the real names.
 *
 * Player-facing vocabulary before the debrief: piece, kind, cluster, crate, band,
 * recipe, material. That is deliberate and it is the product.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings. It
 * reports through `ctx` and nothing else.
 */

import { SampleScope, detailFor } from '../../engine/scope.js';
import { LearnFrame } from '../../engine/frame.js';
import { esc } from '../../../ui/layout.js';
import { soundscape } from '../../../audio/soundscape.js';

export const meta = { stageCount: 8 };

const SPEAKER = 'VESS // TALLOW BENCH';

/* ------------------------------------------------------------------
   THE CATALOGUE
   What the scope has met before, in the order it met it. The numbers are
   the scope's own filing and they are not arbitrary — site three on Tallow
   is where the player finds out what they count. Until then they are just
   how the instrument refers to a kind of piece.
   ------------------------------------------------------------------ */
export const KINDS = {
  k01: {
    code: 'CAT 01', mass: 1.0, size: 0.30, tint: 'bone',
    note: 'Barely registers on the scale. Nothing the scope has logged is lighter.'
  },
  k06: {
    code: 'CAT 06', mass: 12.0, size: 0.56, tint: 'iron',
    note: 'Dark and dry. Leaves a mark on everything it is dragged across.'
  },
  k08: {
    code: 'CAT 08', mass: 16.0, size: 0.52, tint: 'rust',
    note: 'Small and heavy for it. Turns up in almost every crate on this flat.'
  },
  k11: {
    code: 'CAT 11', mass: 23.0, size: 0.74, tint: 'pale',
    note: 'Large, soft, dull. Will not sit still if the seal is broken.'
  },
  k16: {
    code: 'CAT 16', mass: 32.1, size: 0.64, tint: 'sand',
    note: 'Yellowish. Reads a shade lighter than the one it is easy to mistake it for.'
  },
  k17: {
    code: 'CAT 17', mass: 35.5, size: 0.66, tint: 'sand',
    note: 'Yellowish and heavy. Smells sharp even through a sealed tray.'
  }
};

/** 0–10 segment meters. The bars are derived from the readings, never authored. */
const massBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].mass / 40) * 10)));
const sizeBar = k => Math.max(1, Math.min(10, Math.round((KINDS[k].size / 0.8) * 10)));

/* ------------------------------------------------------------------
   SHAPES
   A `kinds` list alone means one centre with the rest holding on to it.
   Where that would misstate what is joined to what, the entry draws itself.
   ------------------------------------------------------------------ */

/** One heavy piece with two light arms, bent. */
const CLUSTER_A = { kinds: ['k08', 'k01', 'k01'] };

/** Two heavy pieces in a chain, one light arm on each end — not a star. */
const CLUSTER_B = {
  kinds: ['k08', 'k08', 'k01', 'k01'],
  geom: [[-0.52, 0], [0.52, 0], [-1.0, -0.78], [1.0, 0.78]],
  bonds: [[0, 1], [0, 2], [1, 3]]
};

/** A bound pair of the lightest piece: still one kind, and still bound. */
const PAIR_LIGHT = { kinds: ['k01', 'k01'] };

/* ------------------------------------------------------------------
   THE EIGHT STAGES

   Exported because every `check` here is a pure function of the bench state,
   which is what makes them checkable without a browser. `npm run verify:learn`
   runs SOLUTIONS and MISSES below through them, so a stage whose grading has
   drifted away from its samples fails the build instead of stranding a student.
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Magnification Limit',
    briefing: {
      speaker: SPEAKER,
      body: "We are set up in an old Imperial salvage bunker on the salt flats of Tallow, and an orbital Guild buyer is inbound to inspect our cargo. Our bench scope magnifies across six power levels; step the dial up to find where continuous grit stops breaking down and resolves into individual grains."
    },
    prompt: 'Step the power dial up from 1 to 6. Watch the crate, and log the lowest power where individual grains appear and turning the dial higher reveals no smaller pieces.',
    controls: ['power'],
    samples: [
      { id: 'c7', label: 'CRATE 07', note: 'raw salvage, unrefined', floorPower: 4, particles: [{ kinds: ['k06'], n: 46 }] }
    ],
    widget: { type: 'number', min: 1, max: 6, label: 'Power logged' },
    answer: 4,
    hints: [
      'Click the "+" button on the Power dial to step up through the magnification levels.',
      'Powers 1 through 3 show blurry solid clumps. At power 4, the clumps break apart into separate round grains.',
      'Powers 5 and 6 only zoom in closer on the same grains. Power 4 is the lowest power that reveals the grain floor.'
    ],
    check(state) {
      if (state.number === 4) return { ok: true };
      if (state.number < 4) return { ok: false, msg: 'Turn the power higher. Clumps are still breaking into smaller pieces above that level.' };
      return { ok: false, msg: 'You went past the floor. Powers 5 and 6 only magnify the same pieces; log the lowest power where individual grains first appear.' };
    },
    reward: {
      log: 'Crate 07 logged. Grain floor confirmed at power 4.',
      title: 'The Floor of Matter',
      body: 'Everything you handle is made of pieces too small to see with the naked eye. Turn the dial far enough and the texture stops getting finer — past power 4, you are simply viewing the same indivisible grains from closer up.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Two Crates of Grey Grit',
    briefing: {
      speaker: SPEAKER,
      body: "A scavenger brought in two crates logged as identical 'grey grit', but I suspect one is diluted with cheap pale filler. Power up the scope to 4, probe both plates, and find the crate that contains only one material."
    },
    prompt: 'Turn the power dial to 4 so the grains resolve clearly. Tap pieces in both crates to inspect their readings on the scope, then select the crate that contains only one kind of piece.',
    controls: ['power'],
    select: true,
    samples: [
      { id: 'c09', label: 'CRATE 09', note: 'grey grit · uniform', floorPower: 4, particles: [{ kinds: ['k06'], n: 44 }] },
      { id: 'c14', label: 'CRATE 14', note: 'grey grit · mixed', floorPower: 4, particles: [{ kinds: ['k06'], n: 26 }, { kinds: ['k11'], n: 18 }] }
    ],
    widget: { type: 'sample' },
    hints: [
      'Both crates look identical at low power. Raise the dial to power 4 so the scope resolves the individual pieces.',
      'Tap pieces on each plate to read their mass and size on the scope. Check multiple pieces across both crates.',
      'Crate 14 mixes dark pieces (CAT 06) with pale pieces (CAT 11). Crate 09 contains only dark pieces. Tap Crate 09 to select it.'
    ],
    check(state) {
      if (!state.sample) return { ok: false, msg: 'Nothing selected. Tap a crate on the bench first.' };
      if (state.sample === 'c09') return { ok: true };
      return { ok: false, msg: 'Look at that crate again at power 4. It mixes dark pieces (CAT 06) with pale pieces (CAT 11) — it is not a single material.' };
    },
    reward: {
      log: 'Crate 09 certified as single material. Crate 14 rejected.',
      title: 'One Kind, or Several',
      body: 'A crate containing only one kind of piece is uniform all the way down to the individual grain. A mixture of two kinds looks uniform from a distance, but the scope exposes the imposter.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Sold as Single Source',
    briefing: {
      speaker: SPEAKER,
      body: "A prospector claims Crate 22 is rare 'single-source ore' from the deep flats and demands a triple premium. I suspect they padded the shipment with tailings; probe thoroughly across the plate and count how many distinct kinds of pieces hide inside."
    },
    prompt: 'Set power to 4 and tap grains all across the plate to inspect their mass and size meters. Log the exact number of different kinds of pieces found in this crate.',
    controls: ['power'],
    samples: [
      {
        id: 'ore', label: 'CRATE 22', note: 'unverified salt-flat ore', floorPower: 4,
        particles: [
          { kinds: ['k17'], n: 26 },
          { kinds: ['k08'], n: 20 },
          { kinds: ['k16'], n: 9 }
        ]
      }
    ],
    widget: { type: 'number', min: 1, max: 6, label: 'Kinds counted' },
    answer: 3,
    hints: [
      'One probe reading only tells you about one piece. Tap many different pieces all across the plate.',
      'Two kinds look yellowish and similar in size, but compare their mass meters: one reads 32.1 and the other reads 35.5.',
      'There are three distinct kinds: heavy rust (CAT 08), dense yellow (CAT 17), and light yellow (CAT 16). Set the counter to 3.'
    ],
    check(state) {
      if (state.probed.size < 3 && state.number !== 3) {
        return { ok: false, msg: `You have probed ${state.probed.size} ${state.probed.size === 1 ? 'kind' : 'kinds'} so far. Tap grains all across the plate before committing your count.` };
      }
      if (state.number === 3) return { ok: true };
      if (state.number < 3) return { ok: false, msg: 'There are more kinds hidden here. Two kinds look similar; check their mass meter readings to tell them apart.' };
      return { ok: false, msg: 'Fewer than that. Check your probe readings — some pieces belong to the same catalogue kind.' };
    },
    reward: {
      log: 'Crate 22 rejected. Three kinds detected; premium denied.',
      title: 'Look More Than Twice',
      body: 'One reading only tells you what one piece is; it never speaks for the whole crate. Even if an impurity makes up only a fraction of the cargo, probing widely across the plate will reveal it.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What the Blade Cannot Divide',
    briefing: {
      speaker: SPEAKER,
      body: "The salvage crew claims any piece of matter can be chopped into smaller pieces forever. We have a precision cutter clamped to the bench; select each tray, run the blade, and find the one object that the blade cannot divide."
    },
    prompt: 'Select each tray in turn and click "Run Cutter" to test it against the blade. Observe how each sample behaves, then select and log the tray that the blade cannot divide.',
    controls: ['cut'],
    select: true,
    samples: [
      { id: 't1', label: 'TRAY A', note: 'loose heap', floorPower: 1, magnify: 1.5, particles: [{ kinds: ['k08'], n: 20 }] },
      { id: 't2', label: 'TRAY B', note: 'bound cluster', floorPower: 1, magnify: 3.6, particles: [{ ...CLUSTER_A, n: 1 }] },
      { id: 't3', label: 'TRAY C', note: 'bound pair', floorPower: 1, magnify: 3.6, particles: [{ ...PAIR_LIGHT, n: 1 }] },
      { id: 't4', label: 'TRAY D', note: 'single grain', floorPower: 1, magnify: 3.6, particles: [{ kinds: ['k08'], n: 1 }] }
    ],
    widget: { type: 'sample' },
    hints: [
      'Tap each tray (A, B, C, D) on the bench and click "Run Cutter" to test it against the blade.',
      'A loose heap scatters under the blade. A bound cluster or pair snaps apart into pieces. Only one sample resists division.',
      'Tray D holds a single individual grain, and the blade finds nothing inside it to split. Tap Tray D to select it.'
    ],
    check(state) {
      if (state.cut.size < 4) return { ok: false, msg: 'Select and run the cutter on all four trays before committing. You must test every sample against the blade.' };
      if (!state.sample) return { ok: false, msg: 'Nothing selected. Tap a tray on the bench first.' };
      if (state.sample === 't4') return { ok: true };
      return { ok: false, msg: 'That sample broke apart or scattered under the blade. Select the tray that the cutter cannot divide.' };
    },
    reward: {
      log: 'Tray D tested. The blade cannot divide a single grain.',
      title: 'The Piece That Will Not Divide',
      body: 'A loose heap scatters into pieces. A bound cluster comes apart into pieces. But a single grain comes apart into nothing at all — it is the indivisible fundamental floor of matter.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Cluster That Repeats',
    briefing: {
      speaker: SPEAKER,
      body: "We salvaged a sealed vial of vital cooling fluid from an abandoned refinery pump, and every particle inside is a bound cluster built to an identical recipe. Probe a cluster to map its pieces, then assemble an exact replica on the bench tray."
    },
    prompt: 'Turn power to 4. Probe a cluster to inspect its center piece and attached arms, then use the Assembly Tray (+ / -) to build an identical bound cluster.',
    controls: ['power'],
    samples: [
      { id: 'v9', label: 'VIAL 09', note: 'coolant sample · repeating clusters', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_A, n: 20 }] }
    ],
    widget: { type: 'build', kinds: ['k01', 'k06', 'k08'], max: 4 },
    hints: [
      'Turn the dial to power 4. Tap the large center piece of any cluster, then tap the smaller satellite pieces holding onto it.',
      'The center piece reads as CAT 08 (rust). The two attached arms read as CAT 01 (bone).',
      'In the assembly tray, set CAT 08 to 1 and CAT 01 to 2. Leave CAT 06 at 0.'
    ],
    check(state) {
      const b = state.build;
      const total = Object.values(b).reduce((n, v) => n + v, 0);
      if (total === 0) return { ok: false, msg: 'The tray is empty. Use the + and - buttons to assemble a cluster before committing.' };
      if (b.k06) return { ok: false, msg: 'There is no CAT 06 in this vial. Probe the cluster on the plate to verify the correct pieces.' };
      if (b.k01 === 2 && b.k08 === 1) return { ok: true };
      if (b.k01 > 0 && b.k08 > 0) return { ok: false, msg: 'Right kinds, wrong count. Probe a cluster on the plate and count the center piece and attached arms.' };
      return { ok: false, msg: 'Your tray is missing one of the kinds that forms this cluster. Probe the center and arms separately.' };
    },
    reward: {
      log: 'Coolant cluster assembled: 1 heavy center, 2 light arms.',
      title: 'A Fixed Recipe',
      body: 'Loose pieces can pile together in any random ratio. But a bound cluster cannot: it is always the exact same count of the exact same kinds, repeated across every particle in the container.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Two Manifests, Two Vials',
    briefing: {
      speaker: SPEAKER,
      body: "Salt vapor dissolved the labels on two salvage vials in the hold, and one of them is a corrosive scouring agent eating through its seal! Both vials list the same two kinds of pieces; probe their clusters and match each vial to its manifest before a seal breaches."
    },
    prompt: 'Set power to 4 and probe clusters in Vial A and Vial B. Count the heavy pieces in each cluster, then assign each vial to its matching manifest.',
    controls: ['power'],
    samples: [
      { id: 'vA', label: 'VIAL A', note: 'unlabeled container', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_A, n: 16 }] },
      { id: 'vB', label: 'VIAL B', note: 'unlabeled container · seal corroding', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_B, n: 14 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'm9', label: 'Manifest 09', note: 'coolant · one heavy piece, two light' },
        { id: 'm22', label: 'Manifest 22', note: 'scouring agent · two heavy pieces, two light' }
      ]
    },
    hints: [
      'Both vials contain only CAT 01 and CAT 08. The difference is how many pieces are linked into a single cluster.',
      'Probe a cluster in each vial: Vial A has 1 heavy piece (CAT 08), while Vial B has a chain of 2 heavy pieces.',
      'File Vial A under Manifest 09 (coolant) and Vial B under Manifest 22 (scouring agent).'
    ],
    check(state) {
      const { bins } = state;
      if (!bins.vA || !bins.vB) return { ok: false, msg: 'Both vials must be assigned to a manifest before committing.' };
      if (bins.vA === 'm9' && bins.vB === 'm22') return { ok: true };
      return { ok: false, msg: 'Those assignments are inverted. Count the heavy pieces (CAT 08) in each cluster: Manifest 09 has 1 heavy piece, Manifest 22 has 2.' };
    },
    reward: {
      log: 'Vial B flagged as corrosive scouring agent and isolated.',
      title: 'The Recipe Is the Thing',
      body: 'The exact same kinds of pieces, bound in a different recipe, create entirely different materials. One sits harmlessly in coolant lines, while the other dissolves ship seals.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Let It Settle',
    briefing: {
      speaker: SPEAKER,
      body: "Three crates are queued for export as pure stock, but we must verify them before the buyer's shuttle lands. The bench shaker uses high-frequency vibration to separate loose materials by density; settle all three crates and file each as one material or a mixture."
    },
    prompt: 'Select each crate, click "Settle Crate", and watch how the layers come to rest. File each crate as "One material" (single band) or "More than one" (multiple bands).',
    controls: ['settle'],
    select: true,
    samples: [
      { id: 'p1', label: 'CRATE 31', note: 'coarse yellow grit', floorPower: 1, particles: [{ kinds: ['k17'], n: 30 }] },
      { id: 'p2', label: 'CRATE 32', note: 'bound fluid clusters', floorPower: 1, particles: [{ ...CLUSTER_A, n: 26 }] },
      { id: 'p3', label: 'CRATE 33', note: 'coarse grey grit', floorPower: 1, particles: [{ kinds: ['k11'], n: 16 }, { kinds: ['k06'], n: 16 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'one', label: 'One material', note: 'settles into a single band' },
        { id: 'mixed', label: 'More than one', note: 'separates into bands' }
      ]
    },
    hints: [
      'Select Crate 31, 32, and 33 in turn and click "Settle Crate" on each to run the shaker.',
      'Dense pieces sink while lighter pieces rise. A crate that separates into two or more distinct bands contains more than one material.',
      'Crates 31 and 32 each settle into one band. Crate 33 splits into two bands. File them accordingly.'
    ],
    check(state) {
      const { bins, settled } = state;
      if (settled.size < 3) return { ok: false, msg: 'Select and settle all three crates before filing. The stratified bands reveal whether they are pure or mixed.' };
      if (!bins.p1 || !bins.p2 || !bins.p3) return { ok: false, msg: 'Every crate must be filed on the manifest.' };
      if (bins.p1 === 'one' && bins.p2 === 'one' && bins.p3 === 'mixed') return { ok: true };
      return { ok: false, msg: 'At least one crate is filed incorrectly. Check the bands after settling: one band means one material; multiple bands mean a mixture.' };
    },
    reward: {
      log: 'Crate 33 pulled from pure stock. Two distinct bands.',
      title: 'Mixed, or Not',
      body: 'Vibration causes unbonded materials to sort themselves by weight into separate bands. Notice that bound clusters settle together as a single band — mechanical shaking cannot break chemical bonds.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Manifest',
    briefing: {
      speaker: SPEAKER,
      body: "The orbital buyer's transport has entered atmosphere, and four salvage crates sit on the bench with no labels. You have all bench tools at your disposal — power dial, probe, cutter, and shaker; inspect all four crates and file the final manifest."
    },
    prompt: 'Examine Crates 41 through 44 using the scope, cutter, and shaker. Classify each crate as loose pieces (one kind), bound clusters (one recipe), or more than one material.',
    controls: ['power', 'cut', 'settle'],
    select: true,
    samples: [
      { id: 'm1', label: 'CRATE 41', note: 'dark solid scrap', floorPower: 4, particles: [{ kinds: ['k06'], n: 40 }] },
      { id: 'm2', label: 'CRATE 42', note: 'clear fluid canisters', floorPower: 4, particles: [{ ...CLUSTER_A, n: 30 }] },
      { id: 'm3', label: 'CRATE 43', note: 'mixed mineral tailings', floorPower: 4, particles: [{ kinds: ['k11'], n: 18 }, { kinds: ['k17'], n: 18 }] },
      { id: 'm4', label: 'CRATE 44', note: 'light pressurized gas', floorPower: 4, particles: [{ ...PAIR_LIGHT, n: 34 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'loose', label: 'Loose pieces, one kind', note: 'nothing bound to anything' },
        { id: 'bound', label: 'Bound clusters, one recipe', note: 'every cluster the same' },
        { id: 'mixed', label: 'More than one material', note: 'settles into bands' }
      ]
    },
    hints: [
      'Power up to 4 to see if pieces are loose or bound. Run the shaker to check if a crate separates into bands.',
      'Crate 43 separates into two bands (more than one material). Crate 41 has single unbonded pieces. Crates 42 and 44 contain bound clusters.',
      'File Crate 41 as "Loose pieces", Crate 42 as "Bound clusters", Crate 43 as "More than one material", and Crate 44 as "Bound clusters".'
    ],
    check(state) {
      const b = state.bins;
      if (!b.m1 || !b.m2 || !b.m3 || !b.m4) return { ok: false, msg: 'Every crate must be assigned on the manifest before submitting.' };
      const want = { m1: 'loose', m2: 'bound', m3: 'mixed', m4: 'bound' };
      const wrong = Object.keys(want).filter(k => b[k] !== want[k]);
      if (!wrong.length) return { ok: true };
      if (wrong.length === 1) {
        return { ok: false, msg: 'One crate is filed incorrectly. Check if it is a single loose kind, a bound cluster, or separates into bands.' };
      }
      return { ok: false, msg: 'Multiple crates are filed incorrectly. Use the scope to inspect the bonds and the shaker to check for separate bands.' };
    },
    reward: {
      log: 'Final manifest submitted and verified. Buyer cleared for docking.',
      title: 'Mastering the Bench',
      last: true,
      body: 'Loose pieces of one kind, bound clusters of a single recipe, or loose mixtures sharing a container. You can now classify any sample of matter from first principles, with no labels required.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   The only place in this quest where the real words are spoken. They are
   spoken last on purpose: a student who has already separated a mixture
   with a shaker has somewhere to put the word "mixture".
   ------------------------------------------------------------------ */
const DEBRIEF = {
  speaker: 'VESS // TALLOW BENCH',
  sections: [
    {
      heading: 'The Buyer Signed',
      body: 'Four crates filed with perfect accuracy, and the buyer just signed the transfer manifest without dispute. That pays for our fuel cells and keeps the Avalon flying. You solved it using only a dial, a probe, a blade, and a shaker.'
    },
    {
      heading: 'Atom',
      body: 'The single piece that the cutter blade could not divide has an ancient name: atom. Every scrap of salvage in the galaxy is an assemblage of atoms.'
    },
    {
      heading: 'Element',
      body: 'A material built from only one kind of atom is an element. Crate 41 was pure carbon, and Crate 44 was pure hydrogen — even though hydrogen atoms travel bound together in pairs.'
    },
    {
      heading: 'Molecule',
      body: 'A bound cluster is a molecule: an exact, repeating architecture of atoms bonded together. That is why you were able to build an exact replica of the coolant cluster in your assembly tray.'
    },
    {
      heading: 'Compound',
      body: 'When a molecule binds two or more different kinds of atoms together, it is a chemical compound. Its properties depend entirely on the recipe: one oxygen with two hydrogens is water, but two oxygens with two hydrogens is the corrosive scouring agent that ate its own seal.'
    },
    {
      heading: 'Mixture',
      body: 'When two or more materials share a container without chemical bonds joining them, they form a mixture. That is why Crate 43 separated into distinct bands in the shaker, while pure elements and compounds never split apart.'
    },
    {
      heading: 'The Real Names',
      body: 'CAT 01 is hydrogen, CAT 06 is carbon, CAT 08 is oxygen, CAT 11 is sodium, CAT 16 is sulfur, and CAT 17 is chlorine. Water is H2O, and the corrosive scouring agent is hydrogen peroxide, H2O2.'
    },
    {
      heading: 'One More Thing',
      body: 'The scope catalogue numbers are not arbitrary filing codes — they count something fundamental inside each atom. When we reach Site 3 on Tallow, you will discover exactly what CAT numbers count.'
    }
  ]
};

/* ------------------------------------------------------------------
   BENCH STATE
   Everything a stage's `check` is allowed to look at. One shape for all
   eight stages, so the widgets stay interchangeable.
   ------------------------------------------------------------------ */
function blankState(stage) {
  return {
    power: 1,
    number: stage.widget.type === 'number' ? stage.widget.min : null,
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
  { number: 4 },
  { sample: 'c09' },
  { number: 3, probed: new Set(['k08', 'k17', 'k16']) },
  { sample: 't4', cut: new Set(['t1', 't2', 't3', 't4']) },
  { build: { k08: 1, k01: 2 } },
  { bins: { vA: 'm9', vB: 'm22' } },
  { bins: { p1: 'one', p2: 'one', p3: 'mixed' }, settled: new Set(['p1', 'p2', 'p3']) },
  { bins: { m1: 'loose', m2: 'bound', m3: 'mixed', m4: 'bound' } }
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  { number: 6 },
  { sample: 'c14' },
  { number: 2, probed: new Set(['k08', 'k17', 'k16']) },
  { sample: 't2', cut: new Set(['t1', 't2', 't3', 't4']) },
  { build: { k08: 1, k01: 1 } },
  { bins: { vA: 'm22', vB: 'm9' } },
  { bins: { p1: 'one', p2: 'mixed', p3: 'mixed' }, settled: new Set(['p1', 'p2', 'p3']) },
  { bins: { m1: 'loose', m2: 'bound', m3: 'mixed', m4: 'loose' } }
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

  const scope = new SampleScope(frame.instrumentHost, {
    kinds: KINDS,
    onProbe: hit => onProbe(hit),
    onSelect: id => onSelect(id)
  });

  // A finished quest replays from the top and costs nothing, the way a cleared
  // campaign quest does. Otherwise pick up where the bench was left.
  let index = ctx.isComplete ? 0 : Math.min(ctx.stagesCleared, STAGES.length - 1);
  let cleared = ctx.isComplete ? STAGES.length : ctx.stagesCleared;
  let state = null;
  let busy = false;
  let disposed = false;

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
      commitLabel: stage.widget.type === 'bins' ? 'File Manifest' : 'Commit'
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
      frame.miss(result.msg);
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
      parts.push(`
        <div class="lq-dial">
          <span class="form-label">Power</span>
          <button type="button" class="quest-btn-sm" data-power="-1" aria-label="Lower power">&minus;</button>
          <span class="lq-dial-segs" aria-hidden="true">
            ${Array.from({ length: 6 }, (_, i) => `<i data-seg="${i + 1}"></i>`).join('')}
          </span>
          <span class="lq-dial-value" aria-live="polite">1</span>
          <button type="button" class="quest-btn-sm" data-power="1" aria-label="Raise power">+</button>
        </div>
      `);
    }
    if (stage.controls.includes('cut')) {
      parts.push('<button type="button" class="quest-btn-sm lq-tool" data-tool="cut">Run Cutter</button>');
    }
    if (stage.controls.includes('settle')) {
      parts.push('<button type="button" class="quest-btn-sm lq-tool" data-tool="settle">Settle Crate</button>');
    }

    frame.setControls(parts.join(''));
    const host = frame.el.controls;

    host.querySelectorAll('[data-power]').forEach(btn => {
      btn.addEventListener('click', () => setPower(state.power + Number(btn.dataset.power)));
    });
    host.querySelectorAll('[data-tool]').forEach(btn => {
      btn.addEventListener('click', () => runTool(btn.dataset.tool));
    });
    paintDial();
  }

  function setPower(p) {
    const next = Math.max(1, Math.min(6, p));
    if (next === state.power) return;
    state.power = next;
    scope.setPower(next);
    soundscape.playToggleClack?.();
    paintDial();
    renderReadout(null);
  }

  function paintDial() {
    const host = frame.el.controls;
    const value = host.querySelector('.lq-dial-value');
    if (value) value.textContent = String(state.power);
    host.querySelectorAll('[data-seg]').forEach(seg => {
      seg.classList.toggle('lit', Number(seg.dataset.seg) <= state.power);
    });
  }

  async function runTool(tool) {
    if (busy) return;
    if (!state.sample) {
      frame.note('Nothing selected. Tap a plate on the bench first.');
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
          ? 'The blade closes on a single grain and finds nothing to divide. This indivisible piece resists the cutter.'
          : found === 'broke'
            ? 'The cutter severs the bonds holding the cluster together. It splits into separate, unlinked pieces.'
            : 'The blade scatters the loose heap. The pieces were resting together, not bound.'
      });
    } else if (tool === 'settle') {
      await scope.settle(id);
      state.settled.add(id);
      const bands = bandCount(id);
      renderReadout(null, {
        head: `Shaker // ${labelFor(id)}`,
        body: bands > 1
          ? `Centrifugal vibration sorts the crate into ${bands} distinct density bands. More than one material is present.`
          : 'The crate settles into a single uniform band. Only one material is present.'
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
    state.probed.add(hit.kindId);
    soundscape.playScanSweep?.();
    renderReadout(hit);
  }

  function onSelect(id) {
    state.sample = id;
    scope.setSelected(id);
    if (STAGES[index].widget.type === 'sample') renderWidget();
  }

  /**
   * The instrument card. It reports what it measured and nothing more: how many
   * other pieces are holding this one, never which kinds they are. Counting the
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
            ? 'Tap a piece in the field to read it.'
            : 'Nothing is resolved at this power. Nothing to read yet.'}</p>
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
          ? 'Held to nothing. Loose in the field.'
          : `Held to ${hit.neighbours} other ${hit.neighbours === 1 ? 'piece' : 'pieces'}.`}</div>
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
            <button type="button" class="quest-btn-sm" data-num="-1" aria-label="Lower">&minus;</button>
            <span class="lq-number-value" aria-live="polite">${state.number}</span>
            <button type="button" class="quest-btn-sm" data-num="1" aria-label="Raise">+</button>
          </div>
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
          <p class="form-help">Tap a plate on the bench to select it.</p>
        </div>
      `);
      return;
    }

    if (w.type === 'build') {
      frame.setWidget(`
        <div class="lq-answer">
          <span class="form-label">Assembly tray</span>
          <div class="lq-build">
            ${w.kinds.map(kid => `
              <div class="lq-build-row" data-kind="${kid}">
                <span class="lq-build-dot" data-tint="${KINDS[kid].tint}"></span>
                <span class="lq-build-code">${KINDS[kid].code}</span>
                <button type="button" class="quest-btn-sm" data-build="-1" aria-label="One fewer ${KINDS[kid].code}">&minus;</button>
                <span class="lq-build-count">0</span>
                <button type="button" class="quest-btn-sm" data-build="1" aria-label="One more ${KINDS[kid].code}">+</button>
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
          <span class="form-label">Manifest</span>
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
      scope.dispose();
      frame.dispose();
    }
  };
}
