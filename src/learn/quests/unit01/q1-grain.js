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
    title: 'The Dial Goes to Six',
    briefing: {
      speaker: SPEAKER,
      body: 'Tallow pays by the crate and the buyer pays by the material, so somebody has to say what is actually in it. That somebody is you, and the scope on the bench has a power dial that goes to six.'
    },
    prompt: 'Step the power up from one and watch the crate. Log the lowest power at which turning the dial higher shows you nothing new.',
    controls: ['power'],
    samples: [
      { id: 'c7', label: 'CRATE 07', note: 'hull scrap, unsorted', floorPower: 4, particles: [{ kinds: ['k06'], n: 46 }] }
    ],
    widget: { type: 'number', min: 1, max: 6, label: 'Power logged' },
    answer: 4,
    hints: [
      'Start at one and step up a power at a time. Watch what happens to the picture between each step.',
      'Somewhere in the middle the grit stops being grit and becomes separate round pieces. That step matters.',
      'Powers five and six show you the same pieces, only larger. The last power that changed anything was four.'
    ],
    check(state) {
      if (state.number === 4) return { ok: true };
      if (state.number < 4) return { ok: false, msg: 'Turn it further. Pieces are still breaking apart above that power.' };
      return { ok: false, msg: 'You went past it. Come back down to the first power that showed you nothing new.' };
    },
    reward: {
      log: 'Crate 07 logged. Grain floor at power four.',
      title: 'The floor',
      body: 'Everything you have ever picked up is a heap of pieces too small to see. Turn the dial far enough and the heap stops getting finer — past that you are only looking at the same pieces from closer up.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Two Crates of Grey Grit',
    prompt: 'Two crates, both logged as grey grit, and only one of them is a single material. Take the power up, probe both, and log the one that is one material.',
    controls: ['power'],
    select: true,
    samples: [
      { id: 'c09', label: 'CRATE 09', note: 'grey grit', floorPower: 4, particles: [{ kinds: ['k06'], n: 44 }] },
      { id: 'c14', label: 'CRATE 14', note: 'grey grit', floorPower: 4, particles: [{ kinds: ['k06'], n: 26 }, { kinds: ['k11'], n: 18 }] }
    ],
    widget: { type: 'sample' },
    hints: [
      'Both crates look identical until the scope resolves them. The dial is the first move.',
      'Probe several pieces in each crate and compare what comes back on the scale.',
      'Crate 14 has two different pieces in it — a small dark one and a large pale one. Crate 09 has only the dark one.'
    ],
    check(state) {
      if (!state.sample) return { ok: false, msg: 'Nothing selected. Tap a crate on the bench first.' };
      if (state.sample === 'c09') return { ok: true };
      return { ok: false, msg: 'Look at that one again at full power. There is more than one kind of piece in it.' };
    },
    reward: {
      log: 'Crate 09 filed as single material. Crate 14 held back.',
      title: 'One kind, or several',
      body: 'A heap of one kind of piece is the same all the way down. A heap of two kinds looks perfectly uniform until you get close enough to tell them apart, which is exactly how a bad crate gets sold.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Sold as Single Source',
    prompt: 'This crate is sold as single-source ore and the buyer pays a premium for that. Probe it until you can say how many different kinds of piece are in it.',
    controls: ['power'],
    samples: [
      {
        id: 'ore', label: 'CRATE 22', note: 'single-source ore, unverified', floorPower: 4,
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
      'One probe tells you about one piece. Read a lot of them, from all over the plate.',
      'Two of the pieces here are nearly the same size and the same colour. The mass bar is the only thing that separates them.',
      'There are three: CAT 08, CAT 17, and a scarce CAT 16 that reads a shade lighter than CAT 17.'
    ],
    check(state) {
      if (state.probed.size < 3 && state.number !== 3) {
        return { ok: false, msg: `You have read ${state.probed.size} different ${state.probed.size === 1 ? 'kind' : 'kinds'} so far. Probe more of the plate before you commit a count.` };
      }
      if (state.number === 3) return { ok: true };
      if (state.number < 3) return { ok: false, msg: 'Keep probing. Two of these look alike on the plate and do not weigh the same.' };
      return { ok: false, msg: 'Fewer than that. Compare your readings — some of them are the same kind twice.' };
    },
    reward: {
      log: 'Crate 22 rejected. Three kinds present, premium withdrawn.',
      title: 'Look more than twice',
      body: 'One probe tells you what one piece is; it never tells you what the crate is. A kind that is only one grain in six is still in there, and the buyer’s scope will find it.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'What the Blade Cannot Divide',
    briefing: {
      speaker: SPEAKER,
      body: 'There is a cutter clamped to the end of the bench and it will take anything the scope can see. Select a tray, run the blade, and watch what is left in the field.'
    },
    prompt: 'Four trays off the same crate. Run the cutter over every one of them and log the one the blade cannot divide.',
    controls: ['cut'],
    select: true,
    samples: [
      { id: 't1', label: 'TRAY A', note: 'loose fill', floorPower: 1, magnify: 1.5, particles: [{ kinds: ['k08'], n: 20 }] },
      { id: 't2', label: 'TRAY B', note: 'one bound cluster', floorPower: 1, magnify: 3.6, particles: [{ ...CLUSTER_A, n: 1 }] },
      { id: 't3', label: 'TRAY C', note: 'one bound pair', floorPower: 1, magnify: 3.6, particles: [{ ...PAIR_LIGHT, n: 1 }] },
      { id: 't4', label: 'TRAY D', note: 'one grain', floorPower: 1, magnify: 3.6, particles: [{ kinds: ['k08'], n: 1 }] }
    ],
    widget: { type: 'sample' },
    hints: [
      'Select a tray, then run the cutter. The blade tells you what it found.',
      'A loose heap scatters. A bound cluster comes apart into its pieces. One of these four does neither.',
      'Tray D holds a single grain, and the blade finds nothing inside it to divide.'
    ],
    check(state) {
      if (state.cut.size < 4) return { ok: false, msg: 'Run the cutter over all four trays before you commit. The blade is the only thing that settles this.' };
      if (!state.sample) return { ok: false, msg: 'Nothing selected. Tap a tray on the bench first.' };
      if (state.sample === 't4') return { ok: true };
      return { ok: false, msg: 'That one came apart under the blade. Whatever you log has to survive the cutter.' };
    },
    reward: {
      log: 'Tray D holds. Blade finds nothing to divide.',
      title: 'The piece that will not divide',
      body: 'A heap comes apart into pieces. A bound cluster comes apart into pieces. A piece comes apart into nothing at all — which is the floor you found on the dial in the first place.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'The Cluster That Repeats',
    prompt: 'Every cluster in this vial is built to the same pattern. Probe one apart and assemble a matching cluster in the tray.',
    controls: ['power'],
    samples: [
      { id: 'v9', label: 'VIAL 09', note: 'bound clusters, uniform', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_A, n: 20 }] }
    ],
    widget: { type: 'build', kinds: ['k01', 'k06', 'k08'], max: 4 },
    hints: [
      'Probe the middle piece of a cluster. The readout says how many others are holding on to it.',
      'Now probe the arms. They do not read the same as the middle.',
      'One CAT 08 in the middle and two CAT 01 on the arms — and every cluster in the vial is that.'
    ],
    check(state) {
      const b = state.build;
      const total = Object.values(b).reduce((n, v) => n + v, 0);
      if (total === 0) return { ok: false, msg: 'The tray is empty. Build the cluster before you commit it.' };
      if (b.k06) return { ok: false, msg: 'There is no CAT 06 anywhere in this vial. Probe again before you put one in the tray.' };
      if (b.k01 === 2 && b.k08 === 1) return { ok: true };
      if (b.k01 > 0 && b.k08 > 0) return { ok: false, msg: 'Right kinds, wrong count. Probe a cluster on the plate and count its arms.' };
      return { ok: false, msg: 'Your tray is missing a kind that is in every cluster out there. Probe the middle and the arms separately.' };
    },
    reward: {
      log: 'Vial 09 pattern matched. One heavy, two light.',
      title: 'A fixed recipe',
      body: 'Loose pieces pile up in any proportion you like. A bound cluster cannot: it is the same count of the same kinds every single time, or it is not the same material.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Two Manifests, Two Vials',
    briefing: {
      speaker: SPEAKER,
      body: 'Two manifests came up from the hold and both of them list the same two kinds of piece, which is why the labels rotting off is a problem. One of those vials can stow anywhere and one of them is eating its own seal.'
    },
    prompt: 'Probe both vials, count what is in one cluster of each, and file each vial against the manifest it matches.',
    controls: ['power'],
    samples: [
      { id: 'vA', label: 'VIAL A', note: 'label unreadable', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_A, n: 16 }] },
      { id: 'vB', label: 'VIAL B', note: 'label unreadable, seal pitted', floorPower: 4, magnify: 1.5, particles: [{ ...CLUSTER_B, n: 14 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'm9', label: 'Manifest 09', note: 'coolant · one heavy piece, two light' },
        { id: 'm22', label: 'Manifest 22', note: 'scouring agent · two heavy pieces, two light' }
      ]
    },
    hints: [
      'Both vials hold only CAT 01 and CAT 08. The difference is how many of each are bound into one cluster.',
      'Probe a cluster in each vial and count the heavy pieces before you file anything.',
      'Vial B carries two heavy pieces in every cluster, which makes it the scouring agent on Manifest 22.'
    ],
    check(state) {
      const { bins } = state;
      if (!bins.vA || !bins.vB) return { ok: false, msg: 'Both vials have to be filed before the manifest goes up.' };
      if (bins.vA === 'm9' && bins.vB === 'm22') return { ok: true };
      return { ok: false, msg: 'Those are swapped. Count the heavy pieces in one cluster from each vial and file them again.' };
    },
    reward: {
      log: 'Vial B flagged. Stowed aft, away from the hull.',
      title: 'The recipe is the thing',
      body: 'The same two kinds of piece, bound in a different count, are not the same material at all. One of these sits quietly in a hold and the other one eats its seal, and only the recipe could tell you which.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Let It Settle',
    briefing: {
      speaker: SPEAKER,
      body: 'The bench shaker will settle a crate for you, and heavy goes to the bottom the way it always does. What comes to rest in the field is worth more than anything written on the lid.'
    },
    prompt: 'Three crates going out as pure stock. Settle each one, read the bands, and file every crate.',
    controls: ['settle'],
    select: true,
    samples: [
      { id: 'p1', label: 'CRATE 31', note: 'pure stock?', floorPower: 1, particles: [{ kinds: ['k17'], n: 30 }] },
      { id: 'p2', label: 'CRATE 32', note: 'pure stock?', floorPower: 1, particles: [{ ...CLUSTER_A, n: 26 }] },
      { id: 'p3', label: 'CRATE 33', note: 'pure stock?', floorPower: 1, particles: [{ kinds: ['k11'], n: 16 }, { kinds: ['k06'], n: 16 }] }
    ],
    widget: {
      type: 'bins',
      bins: [
        { id: 'one', label: 'One material', note: 'settles into a single band' },
        { id: 'mixed', label: 'More than one', note: 'separates into bands' }
      ]
    },
    hints: [
      'Select a crate and settle it. Heavy sinks, and it sinks on its own.',
      'A crate that comes to rest in more than one band had more than one material in it.',
      'Crate 33 settles into two bands. The other two settle as one.'
    ],
    check(state) {
      const { bins, settled } = state;
      if (settled.size < 3) return { ok: false, msg: 'Settle all three crates before you file them. The bands are the whole reading.' };
      if (!bins.p1 || !bins.p2 || !bins.p3) return { ok: false, msg: 'Every crate needs a line on the manifest.' };
      if (bins.p1 === 'one' && bins.p2 === 'one' && bins.p3 === 'mixed') return { ok: true };
      return { ok: false, msg: 'At least one of those is filed wrong. Settle it again and count the bands.' };
    },
    reward: {
      log: 'Crate 33 pulled from pure stock. Two bands.',
      title: 'Mixed, or not',
      body: 'Let a heap settle and it sorts itself by weight. If it comes to rest in more than one band, more than one material was sharing the crate — and it makes no difference whether those materials were loose pieces or bound clusters.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'The Manifest',
    briefing: {
      speaker: SPEAKER,
      body: 'The buyer is an hour out and the manifest is blank. Everything on that bench is yours — the dial, the probe, the blade and the shaker.'
    },
    prompt: 'Four crates and no labels. Use the whole bench and file every one of them.',
    controls: ['power', 'cut', 'settle'],
    select: true,
    samples: [
      { id: 'm1', label: 'CRATE 41', note: 'no label', floorPower: 4, particles: [{ kinds: ['k06'], n: 40 }] },
      { id: 'm2', label: 'CRATE 42', note: 'no label', floorPower: 4, particles: [{ ...CLUSTER_A, n: 30 }] },
      { id: 'm3', label: 'CRATE 43', note: 'no label', floorPower: 4, particles: [{ kinds: ['k11'], n: 18 }, { kinds: ['k17'], n: 18 }] },
      { id: 'm4', label: 'CRATE 44', note: 'no label', floorPower: 4, particles: [{ ...PAIR_LIGHT, n: 34 }] }
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
      'Power up and look first. Settle anything you still cannot call, and run the blade if you are unsure whether something is bound.',
      'A crate that settles into one band is one material — you still have to say whether its pieces are loose or bound to each other.',
      'Crate 43 is the only mixed one. Crate 41 is loose pieces of one kind, and 42 and 44 are both bound clusters.'
    ],
    check(state) {
      const b = state.bins;
      if (!b.m1 || !b.m2 || !b.m3 || !b.m4) return { ok: false, msg: 'The manifest has a blank line. Every crate gets filed.' };
      const want = { m1: 'loose', m2: 'bound', m3: 'mixed', m4: 'bound' };
      const wrong = Object.keys(want).filter(k => b[k] !== want[k]);
      if (!wrong.length) return { ok: true };
      if (wrong.length === 1) {
        return { ok: false, msg: 'One line is wrong. Go back over the crate you were least sure about — settle it, then look at whether its pieces are joined.' };
      }
      return { ok: false, msg: 'More than one line is wrong. Settle each crate first, then probe what the bands are made of.' };
    },
    reward: {
      log: 'Manifest filed. Buyer inbound.',
      title: 'The manifest',
      last: true,
      body: 'Loose pieces of one kind, bound clusters of one recipe, or more than one material sharing a crate. Every cargo on this route is one of those three and you can now tell which, with no label and nobody to ask.'
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
      body: 'Four crates filed correctly with not one label between them. That is the whole job on this route, and you did it with a dial, a probe, a blade and a shaker.'
    },
    {
      heading: 'Atom',
      body: 'The piece the blade could not divide has a name, and the name is atom. Every crate you opened on that bench was a heap of them.'
    },
    {
      heading: 'Element',
      body: 'A material built from only one kind of atom is an element. Crate 41 was one, and so was Crate 44 — even though its atoms came bound together in pairs.'
    },
    {
      heading: 'Molecule',
      body: 'A bound cluster is a molecule: a fixed count of a fixed set of atoms, identical every time it turns up. That is why one reading was enough for you to build a matching one in the tray.'
    },
    {
      heading: 'Compound',
      body: 'When the molecule carries more than one kind of atom, the material is a compound. How it behaves belongs to the recipe and not to the ingredient list, which is the part that catches people out.'
    },
    {
      heading: 'Mixture',
      body: 'More than one material sharing a crate, with nothing bound across them, is a mixture. That is why it settled into bands and a compound never did, however long you ran the shaker.'
    },
    {
      heading: 'The Real Names',
      body: 'CAT 01 is hydrogen and CAT 08 is oxygen. One oxygen bound to two hydrogen is water, and two oxygen with two hydrogen is the scouring agent that was pitting its own seal in the hold.'
    },
    {
      heading: 'One More Thing',
      body: 'The scope’s catalogue numbers are not a filing order I invented, and they are not weights either — you saw that yourself on the scale. Come back for the third site on Tallow and you will find out what they have been counting.'
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
          ? 'The blade closes on nothing. Whatever is in this tray does not come apart.'
          : found === 'broke'
            ? 'The cluster comes apart. Separate pieces, and none of them joined to anything now.'
            : 'The heap scatters into loose pieces. Nothing was holding it together in the first place.'
      });
    } else if (tool === 'settle') {
      await scope.settle(id);
      state.settled.add(id);
      const bands = bandCount(id);
      renderReadout(null, {
        head: `Shaker // ${labelFor(id)}`,
        body: bands > 1
          ? `Comes to rest in ${bands} bands. Heavy at the bottom, and a clean line between them.`
          : 'Comes to rest in one band. Nothing separated out of it.'
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
