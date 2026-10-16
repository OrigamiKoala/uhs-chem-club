/**
 * Unit 5 · Bench 6 — Entropy (q6-entropy)
 *
 * The microstate box. A chamber of cells with a gate in it, and particles that
 * could sit in any of them. The player opens the gate, counts the ways the
 * particles can be arranged, and finds that spreading out is simply the most
 * likely thing to happen. Phases, reactions and dissolving are then read the same
 * way: which side has more ways?
 *
 *   1  opening a gate on two particles            -> microstates
 *   2  why a gas never crowds back                -> entropy
 *   3  ice, water and steam                       -> (S rises from solid to gas)
 *   4  reactions that make or use gas             -> ΔS°
 *   5  a salt dissolving                          -> (ions freed from a crystal)
 *   6  a heated sample                            -> (heating raises S)
 *   7  an entropy table at 298 K                  -> standard molar entropy
 *   8  four changes sorted                        -> (the sign of ΔS)
 *
 * THE EVIDENCE IS ON THE BENCH. Stage 1's box prints how many particles and how
 * many cells but not the count (`hideWays`) and not the law (`hideLaw`), so the
 * player counts the pairs of cells. The entropy table on stage 7 is headed with
 * its own unit, and no note beside it does the sum.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';
import { FORMATION_TABLE, microstateWays, standardReactionChange } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bmicrostates?\b/i, introducedAt: 1 },
  { term: /\bentropy\b/i, introducedAt: 2 },
  { term: /\bstandard molar entropy\b/i, introducedAt: 7 }
];

/** Gas particles in a box are Bellows' idea; the sign of a ΔH is this world's. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

const WAYS_8_2 = microstateWays(8, 2, false); // 28
const LIME_DS = standardReactionChange(
  [{ id: 'CaO(s)' }, { id: 'CO2(g)' }], [{ id: 'CaCO3(s)' }], 'S0'
); // +160.2

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-count-ways',
    title: 'More Room, More Ways to Arrange',
    prompt: 'Press "Open Gate" and give the number of different ways the two particles can sit in the open cells.',
    briefing: {
      speaker: SPEAKER,
      body: 'Two particles sit in a chamber of cells, and a gate holds them in the left four. Each different choice of cells for them is one arrangement.'
    },
    rigs: [
      {
        id: 'box1',
        label: 'Partitioned Lattice Box',
        head: 'box',
        cells: 8,
        leftCells: 4,
        particles: 2,
        hideWays: true,
        hideLaw: true
      }
    ],
    toggleAction: { group: 'Gate', label: 'Open Gate' },
    widget: { type: 'number', label: 'Arrangements', min: 2, max: 60, step: 2, start: 20 },
    hints: [
      'Press "Open Gate" and count the cells now open to the two particles.',
      'Compare the closed box with the open one by counting the different pairs of cells the two particles could fill.',
      'Each particle takes a cell of its own, and swapping the two particles gives the same arrangement.'
    ],
    check(state) {
      if (state.number === WAYS_8_2) return { ok: true };
      if (state.number === 6) return { ok: false, msg: 'That is the count with the gate shut; open it and count again.' };
      return { ok: false, msg: 'Count the pairs of open cells: each particle needs a cell of its own, and the particles are identical.' };
    },
    reward: {
      log: 'Opening the gate multiplied the ways.',
      title: 'Microstates',
      body: 'Each distinct arrangement of the particles is a microstate, and W is how many there are. Opening the gate to eight cells raises W from 6 to 28.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-why-never-back',
    title: 'Why an Expanding Gas Never Crowds Back',
    prompt: 'Why do gas particles let into an empty chamber spread out and not crowd back into one side?',
    briefing: {
      speaker: SPEAKER,
      body: 'Nothing pulls the particles to the right; each one just moves at random into whichever cell is open.'
    },
    rigs: [
      {
        id: 'expansion',
        label: 'Free Expansion Chamber',
        head: 'box',
        cells: 8,
        leftCells: 4,
        particles: 4,
        open: true,
        sublabel: '70 arrangements across 8 cells; 1 keeps all 4 on the left'
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason',
      options: [
        choice('ways', 'Spread-out arrangements far outnumber crowded ones'),
        choice('vacuum-pull', 'The empty space pulls the particles rightward'),
        choice('heat-pull', 'Opening the gate heats the gas and fixes it in place')
      ]
    },
    hints: [
      'Read the counts on the plate for all arrangements and for the crowded one.',
      'Compare how many arrangements put every particle on the left with how many spread them out.',
      'With particles moving at random, the state with the most arrangements is the one that turns up.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'ways') return { ok: true };
      if (state.choice === 'vacuum-pull') return { ok: false, msg: 'Empty space has nothing in it to pull with; the particles only move at random.' };
      return { ok: false, msg: 'Nothing on the plate says the gas is warmed or held, and the counts on the plate are what to compare.' };
    },
    reward: {
      log: 'Spread out is simply the likeliest state.',
      title: 'Entropy',
      body: 'Entropy, S, measures how many microstates a system has: S = k ln W. A gas spreads out because spread-out states overwhelmingly outnumber crowded ones, with no force needed.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-order-phases',
    title: 'Positional Freedom Across Solid, Liquid and Gas',
    prompt: 'Order ice, liquid water and steam from the lowest entropy to the highest.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each plate draws the same number of water molecules in the same box at the same temperature.'
    },
    rigs: [
      { id: 'ice', label: 'Ice H₂O(s)', head: 'box', submode: 'phases', phaseState: 'solid', sublabel: 'Vibrating at fixed lattice sites' },
      { id: 'water', label: 'Liquid Water H₂O(l)', head: 'box', submode: 'phases', phaseState: 'liquid', sublabel: 'Sliding past one another in a compact layer' },
      { id: 'steam', label: 'Water Vapour H₂O(g)', head: 'box', submode: 'phases', phaseState: 'gas', sublabel: 'Moving freely through the whole box' }
    ],
    widget: {
      type: 'order',
      label: 'Order from lowest to highest entropy',
      items: [
        choice('ice', 'Ice'),
        choice('water', 'Liquid water'),
        choice('steam', 'Steam')
      ]
    },
    hints: [
      'Look at how the molecules are placed on each of the three plates.',
      'Compare how many different places each molecule could be in on each plate.',
      'The more places a molecule can be, the more arrangements there are, so tap the plates from fewest places to most.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Tap all three phases.' };
      if (state.order.join(',') === 'ice,water,steam') return { ok: true };
      return { ok: false, msg: 'Compare how much freedom the molecules have on each plate: the most confined phase has the fewest arrangements.' };
    },
    reward: {
      log: 'More freedom meant more arrangements.',
      title: 'Solid, Liquid, Gas',
      body: 'For one substance at one temperature, S of a solid is smaller than S of a liquid, which is far smaller than S of a gas. Boiling lets each molecule roam a volume about a thousand times larger.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-gas-moles',
    title: 'Counting Gas Across a Reaction',
    prompt: 'Sort the two reactions by the sign of their ΔS°.',
    briefing: {
      speaker: SPEAKER,
      body: 'ΔS° is the entropy of a reaction’s products less that of its reactants, and each plate shows the states of the substances involved.'
    },
    rigs: [
      {
        id: 'lime-decomp', label: 'CaCO₃(s) → CaO(s) + CO₂(g)', head: 'box', submode: 'phases',
        phaseState: 'gas', sublabel: 'A solid reactant; a solid and a gas as products'
      },
      {
        id: 'haber', label: 'N₂(g) + 3 H₂(g) → 2 NH₃(g)', head: 'box', submode: 'phases',
        phaseState: 'gas', sublabel: 'Gas reactants; a gas product'
      }
    ],
    widget: {
      type: 'bins',
      label: 'Sign of ΔS°',
      bins: [choice('pos', 'ΔS° above zero'), choice('neg', 'ΔS° below zero')],
      items: [
        choice('lime-decomp', 'CaCO₃(s) → CaO(s) + CO₂(g)'),
        choice('haber', 'N₂(g) + 3 H₂(g) → 2 NH₃(g)')
      ]
    },
    hints: [
      'Read the equation of each reaction, state symbols included.',
      'Compare the moles of gas on the two sides of each equation.',
      'Gas carries by far the most entropy, so a reaction that makes gas gains entropy and one that uses gas up loses it.'
    ],
    check(state) {
      if (!state.bins['lime-decomp'] || !state.bins.haber) return { ok: false, notYet: true, msg: 'Place both reactions first.' };
      if (state.bins['lime-decomp'] === 'pos' && state.bins.haber === 'neg') return { ok: true };
      return { ok: false, msg: 'Count the moles of gas on each side of each equation: a reaction that ends with more gas than it began with gains entropy.' };
    },
    reward: {
      log: 'The gas decided the sign.',
      title: 'Gas Moles and ΔS°',
      body: 'Gas dominates entropy changes. A reaction that produces gas has a positive ΔS°, and one that turns four moles of gas into two has a negative ΔS°.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-dissolving',
    title: 'Breaking a Crystal Into Mobile Ions',
    prompt: 'What is the sign of ΔS° when solid sodium chloride dissolves in water?',
    briefing: {
      speaker: SPEAKER,
      body: 'Sodium chloride is a crystal of fixed ions, and in water its ions drift apart.'
    },
    rigs: [
      { id: 'nacl-solid', label: 'Before: NaCl(s) Crystal', head: 'box', submode: 'phases', phaseState: 'solid', sublabel: 'Ions held in a rigid lattice' },
      { id: 'nacl-aq', label: 'After: Na⁺(aq) + Cl⁻(aq)', head: 'box', submode: 'phases', phaseState: 'liquid', sublabel: 'Ions moving through the solution' }
    ],
    widget: {
      type: 'choice',
      label: 'Sign of ΔS°',
      options: [choice('pos', 'Positive'), choice('neg', 'Negative'), choice('zero', 'Zero')]
    },
    hints: [
      'Compare how the ions are placed on the two plates.',
      'Compare how many places each ion could be in before and after dissolving.',
      'More places for the ions means more arrangements, and the sign follows from whether the count rose or fell.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a sign.' };
      if (state.choice === 'pos') return { ok: true };
      if (state.choice === 'neg') return { ok: false, msg: 'The ions do not disappear when they dissolve; compare the places each one can be in before and after.' };
      return { ok: false, msg: 'The two plates show the ions in very different freedom, and no gas is needed for entropy to change.' };
    },
    reward: {
      log: 'The freed ions gained arrangements.',
      title: 'Dissolving a Salt',
      body: 'Freeing ions from a rigid crystal into a solution gives each ion far more places to be. Dissolving most simple salts therefore has a positive ΔS°.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-heating',
    title: 'How Heating Changes Entropy',
    prompt: 'What happens to a sample’s entropy when it is heated without changing phase?',
    briefing: {
      speaker: SPEAKER,
      body: 'Position is not the only freedom: heat also spreads over the speeds, spins and vibrations of the molecules.'
    },
    rigs: [
      {
        id: 'cold-gas',
        label: 'Cool and Hot Samples',
        head: 'contact',
        left: { label: 'Cool sample', T: -73, m: 100, c: 1.0, massLabel: 'Narrow range of speeds' },
        right: { label: 'Hot sample', T: 127, m: 100, c: 1.0, massLabel: 'Wide spread of speeds' },
        joined: false
      }
    ],
    widget: {
      type: 'choice',
      label: 'Effect of heating on entropy',
      options: [choice('up', 'It increases'), choice('down', 'It decreases'), choice('same', 'It stays the same')]
    },
    hints: [
      'Compare the range of speeds drawn for the cool sample and for the hot one.',
      'Compare how many different ways the energy could be shared out in each.',
      'A wider range of possible motions means more arrangements of the energy.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose an effect.' };
      if (state.choice === 'up') return { ok: true };
      if (state.choice === 'down') return { ok: false, msg: 'Faster molecules do not have fewer states; compare the range of speeds on the two plates.' };
      return { ok: false, msg: 'The two plates show different spreads of speeds, so the number of arrangements is not the same.' };
    },
    reward: {
      log: 'The hot sample had more ways to share its energy.',
      title: 'Heating Raises Entropy',
      body: 'Warming a substance spreads its energy over a wider range of speeds, rotations and vibrations. More ways to share the energy means a larger W, so entropy rises with temperature.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-table-calc',
    title: 'Absolute Entropies at 298 K',
    prompt: 'Use the entropy table on the plate to find ΔS° for CaCO₃(s) → CaO(s) + CO₂(g).',
    briefing: {
      speaker: SPEAKER,
      body: 'Entropy has a true zero, a perfect crystal at 0 K, so every substance at 298 K has a value above zero.'
    },
    rigs: [
      {
        id: 's0-table',
        label: 'Entropy Table at 298 K',
        head: 'hess',
        submode: 'formation',
        hideSeaLevel: true,
        columnLabel: 'S° (J/(mol·K))',
        targetEq: 'CaCO₃(s) → CaO(s) + CO₂(g)',
        reactants: [{ formula: 'CaCO₃(s)', n: 1, dHf: FORMATION_TABLE['CaCO3(s)'].S0 }],
        products: [
          { formula: 'CaO(s)', n: 1, dHf: FORMATION_TABLE['CaO(s)'].S0 },
          { formula: 'CO₂(g)', n: 1, dHf: FORMATION_TABLE['CO2(g)'].S0 }
        ]
      }
    ],
    widget: {
      type: 'choice',
      label: 'ΔS° (J/(mol·K))',
      options: [
        choice('right', '+160.2'),
        choice('flipped', '−160.2'),
        choice('all', '+343.6'),
        choice('prod', '+251.9')
      ]
    },
    hints: [
      'Read the S° of each substance from the table.',
      'Compare the total for the products with the total for the reactants.',
      'Add the entropies of the products, then take off the entropies of the reactants.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'flipped') return { ok: false, msg: 'The sign is backward: the reaction makes a gas from a solid, so check which total is larger.' };
      if (state.choice === 'all') return { ok: false, msg: 'The reactant’s entropy is taken off the products’, not added to them.' };
      return { ok: false, msg: 'That is only the products’ total; the reactant’s entropy still has to be taken off.' };
    },
    reward: {
      log: 'The products held more entropy than the reactant.',
      title: 'Standard Molar Entropy',
      body: 'The standard molar entropy, S°, is the absolute entropy of one mole of a substance at 1 bar and 298 K. Products less reactants gives ΔS°, and here it is +160.2 J/(mol·K) because a solid frees a gas.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sort-four',
    title: 'Sorting Four Changes by ΔS',
    prompt: 'Sort the four changes by whether their entropy rises or falls.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each plate names the change and the states of what takes part in it.'
    },
    rigs: [
      { id: 'p-boil', label: 'Boiling Liquid Ethanol', head: 'box', submode: 'phases', phaseState: 'gas', sublabel: 'C₂H₅OH(l) → C₂H₅OH(g)' },
      { id: 'p-freeze', label: 'Freezing Liquid Water', head: 'box', submode: 'phases', phaseState: 'solid', sublabel: 'H₂O(l) → H₂O(s)' },
      { id: 'p-decomp', label: 'Decomposing N₂O₅', head: 'box', submode: 'phases', phaseState: 'gas', sublabel: '2 N₂O₅(s) → 4 NO₂(g) + O₂(g)' },
      { id: 'p-cond', label: 'Precipitating AgCl', head: 'box', submode: 'phases', phaseState: 'solid', sublabel: 'Ag⁺(aq) + Cl⁻(aq) → AgCl(s)' }
    ],
    widget: {
      type: 'bins',
      label: 'Sign of ΔS',
      bins: [choice('pos', 'ΔS above zero'), choice('neg', 'ΔS below zero')],
      items: [
        choice('p-boil', 'Boiling liquid ethanol into vapour'),
        choice('p-freeze', 'Freezing liquid water into ice'),
        choice('p-decomp', 'Decomposing solid N₂O₅ into gases'),
        choice('p-cond', 'Precipitating solid AgCl from ions in water')
      ]
    },
    hints: [
      'Read the equation on each plate, state symbols included.',
      'Compare how free the particles are before and after each change.',
      'A change that frees particles into more places gains entropy, and one that locks them into fewer places loses it.'
    ],
    check(state) {
      const want = { 'p-boil': 'pos', 'p-freeze': 'neg', 'p-decomp': 'pos', 'p-cond': 'neg' };
      if (Object.keys(want).some(k => !state.bins[k])) return { ok: false, notYet: true, msg: 'Place all four changes first.' };
      if (Object.entries(want).every(([k, v]) => state.bins[k] === v)) return { ok: true };
      return { ok: false, msg: 'Check each equation: which side has the particles with more freedom to move?' };
    },
    reward: {
      log: 'Four changes sorted by freedom.',
      title: 'The Sign of ΔS',
      body: 'Boiling and gas-forming decomposition spread particles into far more arrangements, so ΔS is positive. Freezing and precipitating lock mobile particles into a crystal, so ΔS is negative.'
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
      body: 'Entropy counts the ways particles and energy can be arranged. A gas fills its chamber, a gas-making reaction gains entropy, heating raises it, and every substance at 298 K has a positive value.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Entropy is half of the answer to why things happen on their own. The other half is the heat you measured on the last benches.'
    },
    {
      heading: 'Next',
      body: 'The last bench sets the two against each other, and the balance decides which way a change runs.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which has the greatest entropy per mole at the same temperature?',
    options: [
      { id: 'a', label: 'H₂O(g)' },
      { id: 'b', label: 'H₂O(l)' },
      { id: 'c', label: 'H₂O(s)' }
    ],
    answer: 'a',
    explanation: 'A gas has the most freedom of position, so it has the most microstates and the greatest entropy.'
  },
  {
    question: 'What is the sign of ΔS° for 2 SO₂(g) + O₂(g) → 2 SO₃(g)?',
    options: [
      { id: 'a', label: 'Negative, because three moles of gas become two' },
      { id: 'b', label: 'Positive, because a new compound forms' },
      { id: 'c', label: 'Zero, because every substance is a gas' }
    ],
    answer: 'a',
    explanation: 'The reaction uses up gas, so there are fewer places for the particles to be and entropy falls.'
  },
  {
    question: 'N₂(g) + 3 H₂(g) → 2 NH₃(g). With S° of 191.6, 130.7 and 192.8 J/(mol·K), what is ΔS°?',
    options: [
      { id: 'a', label: '−198.1 J/(mol·K)' },
      { id: 'b', label: '+198.1 J/(mol·K)' },
      { id: 'c', label: '−390.9 J/(mol·K)' },
      { id: 'd', label: '+583.7 J/(mol·K)' }
    ],
    answer: 'a',
    explanation: 'Products are 2 × 192.8 = 385.6 and reactants are 191.6 + 3 × 130.7 = 583.7, so ΔS° is 385.6 − 583.7 = −198.1.'
  },
  {
    question: 'Why does a substance’s entropy rise when it is heated at constant phase?',
    options: [
      { id: 'a', label: 'Its energy can be shared among a wider range of speeds, spins and vibrations' },
      { id: 'b', label: 'Its particles move to fixed positions in a crystal' },
      { id: 'c', label: 'Its particles become fewer in number' }
    ],
    answer: 'a',
    explanation: 'A larger range of possible motions means more microstates, and entropy counts microstates.'
  },
  {
    question: 'Which change has a negative ΔS?',
    options: [
      { id: 'a', label: 'Freezing liquid water' },
      { id: 'b', label: 'Boiling liquid water' },
      { id: 'c', label: 'Dissolving sodium chloride in water' },
      { id: 'd', label: 'Dry ice turning into gas' }
    ],
    answer: 'a',
    explanation: 'Freezing locks mobile molecules into a crystal, which leaves them fewer arrangements; the other changes free particles.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { number: WAYS_8_2 },
  { choice: 'ways' },
  { order: ['ice', 'water', 'steam'] },
  { bins: { 'lime-decomp': 'pos', haber: 'neg' } },
  { choice: 'pos' },
  { choice: 'up' },
  { choice: 'right' },
  { bins: { 'p-boil': 'pos', 'p-freeze': 'neg', 'p-decomp': 'pos', 'p-cond': 'neg' } }
];

export const MISSES = [
  { number: 6 },
  { choice: 'vacuum-pull' },
  { order: ['steam', 'water', 'ice'] },
  { bins: { 'lime-decomp': 'neg', haber: 'neg' } },
  { choice: 'neg' },
  { choice: 'down' },
  { choice: 'flipped' },
  { bins: { 'p-boil': 'neg', 'p-freeze': 'neg', 'p-decomp': 'pos', 'p-cond': 'neg' } }
];

export const stateFor = makeStateFor(STAGES);

export function mount(container, ctx) {
  return mountThermo(container, ctx, { STAGES, DEBRIEF, toolNoteFor });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { LIME_DS };
