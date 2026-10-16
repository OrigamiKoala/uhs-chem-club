/**
 * Unit 5 · Bench 1 — Heat and Temperature (q1-flow)
 *
 * The calorimeter's first bench. Two metal blocks, a lidded cup with a bath
 * thermometer, and shelf charts that show a change's energy before and after.
 * Nothing is told: the player joins blocks and reads two traces meet, then
 * reads which way a thermometer moved and what that says about the chemicals.
 *
 *   1  two blocks join                             -> thermal equilibrium
 *   2  which way energy crosses the joint          -> heat
 *   3  the dashed line round the reacting part     -> system and surroundings
 *   4  a hand warmer and a cold pack               -> exothermic, endothermic
 *   5  a bath that cools                           -> (the sample gained energy)
 *   6  the shelf chart that matches                -> energy diagram
 *   7  a hot spark and a warm bath                 -> temperature versus total energy
 *   8  four everyday changes                       -> (every change is one or the other)
 *
 * THE EVIDENCE IS ON THE BENCH. Stages 4 to 6 hide the plate's own verdict
 * (`hideVerdict`), so the player reads the thermometer or the shelves rather
 * than a printed word. Stage 7's two plates differ only in how much is hot.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bthermal equilibrium\b/i, introducedAt: 1 },
  { term: /\bheat\b/i, introducedAt: 2 },
  { term: /\bsurroundings\b/i, introducedAt: 3 },
  { term: /\bexothermic\b/i, introducedAt: 4 },
  { term: /\bendothermic\b/i, introducedAt: 4 }
];

/** Temperature as the average motion of particles is Bellows' idea. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-equilibrium',
    title: 'Where Both Blocks Settle',
    prompt: 'Join the two iron blocks and give the temperature at which both finish.',
    briefing: {
      speaker: SPEAKER,
      body: 'Two blocks of the same iron sit on the bench, one hot and one cold. Join them and watch both thermometer traces.'
    },
    rigs: [
      {
        id: 'blocks',
        label: 'Contact Bridge',
        head: 'contact',
        left: { label: 'Block A', T: 80, m: 100, c: 0.449, massLabel: '100 g Fe' },
        right: { label: 'Block B', T: 20, m: 100, c: 0.449, massLabel: '100 g Fe' },
        joined: false
      }
    ],
    toggleAction: { group: 'Bridge', label: 'Join Blocks' },
    widget: { type: 'number', label: 'Settling temperature (°C)', min: 20, max: 80, step: 5 },
    hints: [
      'Press "Join Blocks" and watch the two thermometer traces on the right of the plate.',
      'Compare how far each trace moves, given that the two blocks have the same mass and the same metal.',
      'Look for the level where the upper and lower traces meet and stop changing.'
    ],
    check(state) {
      if (state.number === 50) return { ok: true };
      return state.number > 50
        ? { ok: false, msg: 'That is nearer Block A’s starting reading than the level the traces meet at.' }
        : { ok: false, msg: 'That is nearer Block B’s starting reading than the level the traces meet at.' };
    },
    reward: {
      log: 'Both traces met at one level.',
      title: 'Thermal Equilibrium',
      body: 'Fast-moving particles pass motion to slow ones until both blocks share the same average motion. When nothing changes any more, the blocks are in thermal equilibrium.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-direction',
    title: 'Which Way Energy Crossed',
    prompt: 'When the two blocks touch, which way does energy cross the joint?',
    briefing: {
      speaker: SPEAKER,
      body: 'The blocks are already joined and the arrows inside each show how fast its particles move.'
    },
    rigs: [
      {
        id: 'blocks',
        label: 'Contact Bridge',
        head: 'contact',
        left: { label: 'Block A (80 °C)', T: 80, m: 100, c: 0.449 },
        right: { label: 'Block B (20 °C)', T: 20, m: 100, c: 0.449 },
        joined: true,
        showArrow: true
      }
    ],
    widget: {
      type: 'choice',
      label: 'Direction of transfer',
      options: [
        choice('a-to-b', 'From Block A into Block B'),
        choice('b-to-a', 'From Block B into Block A'),
        choice('none', 'No energy crosses the joint')
      ]
    },
    hints: [
      'Compare the particle arrows in Block A with those in Block B at the moment of contact.',
      'Compare each block’s reading before and after they touch to see which gained and which lost.',
      'Whichever block’s reading fell gave up energy, and the block whose reading rose took it in.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a direction.' };
      if (state.choice === 'a-to-b') return { ok: true };
      if (state.choice === 'b-to-a') return { ok: false, msg: 'Cold is only slower particle motion, so there is nothing in the cooler block to send across.' };
      return { ok: false, msg: 'One block’s reading fell and the other’s rose, so something did cross the joint.' };
    },
    reward: {
      log: 'The energy moved from the hot block to the cold one.',
      title: 'Heat',
      body: 'Energy that crosses between two objects because of a temperature difference is called heat. It always crosses from the hotter object to the colder one.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-boundary',
    title: 'Inside and Outside the Line',
    prompt: 'Sort each part of the bench into the system or the surroundings.',
    briefing: {
      speaker: SPEAKER,
      body: 'A dashed line on the plate marks off the part being studied, which chemists call the system. Everything outside the line is the surroundings.'
    },
    rigs: [
      {
        id: 'cup',
        label: 'Boundary View',
        head: 'contact',
        left: { label: 'Reacting bonds', T: 65, m: 50, c: 1.0, massLabel: 'Inside dashed line' },
        right: { label: 'Water + Thermometer', T: 25, m: 100, c: 4.184, massLabel: 'Outside dashed line' },
        showBoundary: true,
        joined: false
      }
    ],
    widget: {
      type: 'bins',
      label: 'Assign each part',
      bins: [
        choice('system', 'System'),
        choice('surroundings', 'Surroundings')
      ],
      items: [
        choice('reactants', 'The reacting molecules and their bonds'),
        choice('water', 'The water bath around the sample'),
        choice('thermo', 'The thermometer bulb in the bath'),
        choice('cupwall', 'The insulated cup walls')
      ]
    },
    hints: [
      'Look at the dashed line drawn on the plate and at what it encloses.',
      'Compare each listed part with the two labelled regions on the plate.',
      'Anything the line encloses is the system, and anything outside it, instruments included, is the surroundings.'
    ],
    check(state) {
      const want = { reactants: 'system', water: 'surroundings', thermo: 'surroundings', cupwall: 'surroundings' };
      if (Object.keys(want).some(k => !state.bins[k])) return { ok: false, notYet: true, msg: 'Place all four parts first.' };
      if (Object.entries(want).every(([k, v]) => state.bins[k] === v)) return { ok: true };
      return { ok: false, msg: 'Check each part against the dashed line on the plate: it encloses only what is reacting.' };
    },
    reward: {
      log: 'The line was drawn round the reacting chemicals.',
      title: 'System and Surroundings',
      body: 'The system is the part being studied, here the reacting chemicals. The water, thermometer and cup around it are the surroundings, and heat is measured by what crosses the line between them.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-packs',
    title: 'Hand Warmer and Cold Pack',
    prompt: 'Sort each pack by which way heat crosses the system’s boundary.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each cup holds a pack reacting in a bath of water, with a thermometer in the bath.'
    },
    rigs: [
      {
        id: 'warmer',
        label: 'Hand Warmer Charge',
        head: 'cup',
        hideVerdict: true,
        waterMass: 100,
        waterTInit: 22.0,
        reaction: { label: 'Fe oxidation', moles: 0.04, dH: -165 }
      },
      {
        id: 'coldpack',
        label: 'Cold Pack Salt',
        head: 'cup',
        hideVerdict: true,
        waterMass: 100,
        waterTInit: 22.0,
        reaction: { label: 'Salt dissolution', moles: 0.08, dH: 26 }
      }
    ],
    widget: {
      type: 'bins',
      label: 'Direction of heat flow',
      bins: [
        choice('out', 'Heat leaves the system'),
        choice('in', 'Heat enters the system')
      ],
      items: [
        choice('warmer', 'Hand warmer'),
        choice('coldpack', 'Cold pack')
      ]
    },
    hints: [
      'Read the bath thermometer on each plate before and after the pack reacts.',
      'Compare which way each bath moved with where the heat must have come from or gone to.',
      'A bath that warmed received heat from the system, and a bath that cooled lost heat into it.'
    ],
    check(state) {
      if (!state.bins.warmer || !state.bins.coldpack) return { ok: false, notYet: true, msg: 'Place both packs first.' };
      if (state.bins.warmer === 'out' && state.bins.coldpack === 'in') return { ok: true };
      return { ok: false, msg: 'The thermometer is in the surroundings, so a bath that warms was given heat, and one that cools gave it away.' };
    },
    reward: {
      log: 'Both packs sorted by their baths.',
      title: 'Exothermic and Endothermic',
      body: 'A change that releases heat to its surroundings is exothermic, and the bath warms. A change that absorbs heat from its surroundings is endothermic, and the bath cools.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-trace',
    title: 'Reading the Bath Trace',
    prompt: 'Sample A dissolves and its bath cools; what happened to the energy of Sample A?',
    briefing: {
      speaker: SPEAKER,
      body: 'The thermometer reads the water, not the sample. Decide whose energy the reading describes.'
    },
    rigs: [
      {
        id: 'sampleA',
        label: 'Sample A Dissolution',
        head: 'cup',
        hideVerdict: true,
        waterMass: 100,
        waterTInit: 22.0,
        TFinal: 16.4,
        reaction: { label: 'Sample A(s) dissolving', moles: 0.09, dH: 26.0 }
      }
    ],
    widget: {
      type: 'choice',
      label: 'Sample A’s energy',
      options: [
        choice('gained', 'Sample A gained energy'),
        choice('lost', 'Sample A lost energy'),
        choice('same', 'Sample A’s energy did not change')
      ]
    },
    hints: [
      'Read the bath thermometer on the plate and note which way it moved.',
      'Compare the energy the water lost with where that energy could have gone.',
      'Energy is not destroyed, so the water’s loss must show up in the system inside the dashed line.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what happened to Sample A’s energy.' };
      if (state.choice === 'gained') return { ok: true };
      if (state.choice === 'lost') return { ok: false, msg: 'The bath is the part that lost energy, and the thermometer reads the bath.' };
      return { ok: false, msg: 'The bath’s reading changed, and the energy it lost cannot simply disappear.' };
    },
    reward: {
      log: 'The water’s loss was the sample’s gain.',
      title: 'Energy Is Conserved',
      body: 'The energy a bath loses is gained by the system, so a cooling bath means the change is endothermic. The thermometer reports on the surroundings, and the system does the opposite.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-diagram',
    title: 'Where the Bath’s Heat Went',
    prompt: 'Tap the energy chart that matches Sample A as it dissolves in the cooling bath.',
    briefing: {
      speaker: SPEAKER,
      body: 'An energy chart draws the system’s stored energy as a shelf before the change and a shelf after it.'
    },
    rigs: [
      {
        id: 'uphill',
        label: 'Chart A',
        head: 'diagram',
        hideVerdict: true,
        hideValue: true,
        reactantsLabel: 'Sample A(s)',
        productsLabel: 'Sample A(aq)',
        dH: 26.0
      },
      {
        id: 'downhill',
        label: 'Chart B',
        head: 'diagram',
        hideVerdict: true,
        hideValue: true,
        reactantsLabel: 'Sample A(s)',
        productsLabel: 'Sample A(aq)',
        dH: -26.0
      }
    ],
    widget: { type: 'pick', label: 'Selected chart', help: 'Tap Chart A or Chart B on the bench.' },
    hints: [
      'Tap each chart on the bench and compare where its before shelf and after shelf sit.',
      'Compare each chart with what the last stage showed happened to the energy of Sample A.',
      'The chart for a system that gained energy ends on a higher shelf than it began on.'
    ],
    check(state) {
      if (!state.sample) return { ok: false, notYet: true, msg: 'Tap one of the two charts on the bench.' };
      if (state.sample === 'uphill') return { ok: true };
      return { ok: false, msg: 'On that chart the system ends on a lower shelf, which is what a system does when it gives energy to the bath.' };
    },
    reward: {
      log: 'The chart ends on a higher shelf.',
      title: 'Energy Diagram',
      body: 'An energy diagram draws the system’s stored energy before and after a change. An endothermic change climbs to a higher shelf, and an exothermic change drops to a lower one.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-bath-spark',
    title: 'The Spark and the Bath',
    prompt: 'Why does the 40 °C bath warm the cold block more than the 1200 °C spark does?',
    briefing: {
      speaker: SPEAKER,
      body: 'Each plate joins a different hot body to the same cold block. Compare where each pair settles.'
    },
    rigs: [
      {
        id: 'spark',
        label: '1200 °C Spark (0.001 g)',
        head: 'contact',
        left: { label: 'Spark', T: 1200, m: 0.001, c: 0.45, massLabel: '0.001 g Fe' },
        right: { label: 'Cold Block', T: 20, m: 500, c: 0.45, massLabel: '500 g Fe' },
        joined: true
      },
      {
        id: 'bath',
        label: '40 °C Bath (2000 g)',
        head: 'contact',
        left: { label: 'Warm Bath', T: 40, m: 2000, c: 4.184, massLabel: '2000 g H₂O' },
        right: { label: 'Cold Block', T: 20, m: 500, c: 0.45, massLabel: '500 g Fe' },
        joined: true
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason',
      options: [
        choice('total', 'The bath holds far more particles, so far more energy in all'),
        choice('faster', 'Each water molecule moves faster than each iron atom in the spark'),
        choice('cold', 'A cooler body always pushes heat harder than a hotter one')
      ]
    },
    hints: [
      'Compare where the cold block ends up on each of the two plates.',
      'Compare the mass written on each hot body, and think about how many particles that is.',
      'Temperature describes one particle’s average motion, while the energy a body can hand over depends on all of its particles together.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'total') return { ok: true };
      if (state.choice === 'faster') return { ok: false, msg: 'The spark is far hotter than the bath, so its atoms are the ones moving faster.' };
      return { ok: false, msg: 'Heat crosses from the hotter body to the colder one, never the other way, so that cannot be the reason.' };
    },
    reward: {
      log: 'The large, mild bath outweighed the tiny, fierce spark.',
      title: 'Temperature and Total Energy',
      body: 'Temperature is the average energy of one particle, but the heat a body can deliver is the energy of all its particles together. A large, warm bath holds far more than a tiny, hot spark.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-four-processes',
    title: 'Four Everyday Processes',
    prompt: 'Sort the four changes into exothermic and endothermic.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each plate shows one change as a shelf for its starting materials and a shelf for what they become.'
    },
    rigs: [
      { id: 'burn', label: 'Burning Methane', head: 'diagram', hideVerdict: true, hideValue: true, reactantsLabel: 'CH₄ + 2O₂', productsLabel: 'CO₂ + 2H₂O', dH: -890 },
      { id: 'melt', label: 'Melting Ice', head: 'diagram', hideVerdict: true, hideValue: true, reactantsLabel: 'H₂O(s)', productsLabel: 'H₂O(l)', dH: 6.0 },
      { id: 'condense', label: 'Condensing Steam', head: 'diagram', hideVerdict: true, hideValue: true, reactantsLabel: 'H₂O(g)', productsLabel: 'H₂O(l)', dH: -44.0 },
      { id: 'nh4no3', label: 'Dissolving NH₄NO₃ (Cold Pack)', head: 'diagram', hideVerdict: true, hideValue: true, reactantsLabel: 'NH₄NO₃(s)', productsLabel: 'NH₄⁺ + NO₃⁻', dH: 25.7 }
    ],
    widget: {
      type: 'bins',
      label: 'Classify each process',
      bins: [
        choice('exo', 'Exothermic'),
        choice('endo', 'Endothermic')
      ],
      items: [
        choice('burn', 'Burning methane gas in a burner'),
        choice('melt', 'Melting solid ice into liquid water'),
        choice('condense', 'Condensing steam into liquid droplets'),
        choice('nh4no3', 'Dissolving ammonium nitrate in a cold pack')
      ]
    },
    hints: [
      'Tap each plate and compare where its starting shelf and its finishing shelf sit.',
      'Compare each finishing shelf with the starting one to see whether the system gained or lost energy.',
      'A system that ends on a lower shelf released energy, and one that ends on a higher shelf absorbed it.'
    ],
    check(state) {
      const want = { burn: 'exo', melt: 'endo', condense: 'exo', nh4no3: 'endo' };
      if (Object.keys(want).some(k => !state.bins[k])) return { ok: false, notYet: true, msg: 'Classify all four changes first.' };
      if (Object.entries(want).every(([k, v]) => state.bins[k] === v)) return { ok: true };
      return { ok: false, msg: 'Check each change against its own plate: which shelf does the system finish on?' };
    },
    reward: {
      log: 'Four changes sorted by their shelves.',
      title: 'Bonds Made and Bonds Broken',
      body: 'Pulling attracting particles apart takes energy in, as in melting or dissolving a cold-pack salt. Letting particles lock together releases it, as in burning or condensing.'
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'Heat is energy crossing a boundary because of a temperature difference. A bath that warms was given heat by the system, a bath that cools gave heat to it, and the thermometer always reads the surroundings.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every measurement at Ember Reach is a bath, a thermometer and a decision about which side of the line the energy went. You can now read that decision off the trace.'
    },
    {
      heading: 'Next',
      body: 'The next bench turns a thermometer rise into joules, so that the heat has a size as well as a direction.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Two identical copper blocks at 90 °C and 30 °C are placed in contact inside an insulated box. At what temperature do both blocks finish?',
    options: [
      { id: 'a', label: '60 °C' },
      { id: 'b', label: '45 °C' },
      { id: 'c', label: '75 °C' },
      { id: 'd', label: '120 °C' }
    ],
    answer: 'a',
    explanation: 'Equal masses of the same metal change by equal amounts, so the blocks meet halfway between their starting temperatures.'
  },
  {
    question: 'Citric acid and baking soda react in water and the solution cools from 24 °C to 15 °C. Which statement is correct?',
    options: [
      { id: 'a', label: 'The reaction is endothermic, because the chemicals absorbed heat from the water' },
      { id: 'b', label: 'The reaction is exothermic, because the thermometer reading fell' },
      { id: 'c', label: 'No heat crossed between the chemicals and the water' }
    ],
    answer: 'a',
    explanation: 'A cooling bath means heat left the water and entered the reacting chemicals, which is what endothermic means.'
  },
  {
    question: 'On an energy diagram for an exothermic reaction, how do the shelves of the products and the reactants compare?',
    options: [
      { id: 'a', label: 'The products sit lower, because the system released energy' },
      { id: 'b', label: 'The products sit higher, because the bath warmed up' },
      { id: 'c', label: 'The two shelves sit at the same height' }
    ],
    answer: 'a',
    explanation: 'The energy released to warm the bath comes from the system dropping to a lower shelf.'
  },
  {
    question: 'Why can a 1000 g pot of water at 50 °C melt more ice than a 10 g iron nail at 200 °C?',
    options: [
      { id: 'a', label: 'The pot holds far more particles, so it has far more energy to give up in total' },
      { id: 'b', label: 'Water molecules at 50 °C move faster on average than iron atoms at 200 °C' },
      { id: 'c', label: 'Heat flows from colder objects into hotter objects when water is present' }
    ],
    answer: 'a',
    explanation: 'Temperature is an average per particle, but the heat a body can deliver depends on how many particles share the energy.'
  },
  {
    question: 'Which of these changes is exothermic?',
    options: [
      { id: 'a', label: 'Liquid water freezing into ice' },
      { id: 'b', label: 'Liquid water boiling into steam' },
      { id: 'c', label: 'Dry ice turning into carbon dioxide gas' }
    ],
    answer: 'a',
    explanation: 'Freezing lets particles lock into stronger attractions and releases heat. Boiling and sublimation need heat to pull particles apart.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { number: 50 },
  { choice: 'a-to-b' },
  { bins: { reactants: 'system', water: 'surroundings', thermo: 'surroundings', cupwall: 'surroundings' } },
  { bins: { warmer: 'out', coldpack: 'in' } },
  { choice: 'gained' },
  { sample: 'uphill' },
  { choice: 'total' },
  { bins: { burn: 'exo', melt: 'endo', condense: 'exo', nh4no3: 'endo' } }
];

export const MISSES = [
  { number: 80 },
  { choice: 'b-to-a' },
  { bins: { reactants: 'surroundings', water: 'system', thermo: 'surroundings', cupwall: 'surroundings' } },
  { bins: { warmer: 'in', coldpack: 'out' } },
  { choice: 'lost' },
  { sample: 'downhill' },
  { choice: 'faster' },
  { bins: { burn: 'endo', melt: 'endo', condense: 'exo', nh4no3: 'endo' } }
];

export const stateFor = makeStateFor(STAGES);

export function mount(container, ctx) {
  return mountThermo(container, ctx, { STAGES, DEBRIEF, toolNoteFor });
}
