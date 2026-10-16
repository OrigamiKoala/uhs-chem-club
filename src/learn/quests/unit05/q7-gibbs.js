/**
 * Unit 5 · Bench 7 — Free Energy (q7-gibbs)
 *
 * The favourability plotter. ΔG is plotted against temperature as a straight
 * line, with a tug-of-war bar for the two terms that set it and a shaded region
 * where ΔG is below zero. The player reads which side of the line a change is
 * on, finds the temperature where the line crosses, and couples an uphill
 * reaction to a steeper downhill one.
 *
 *   1  changes that run and changes that need driving    -> spontaneous
 *   2  ΔG from ΔH and ΔS at one temperature              -> Gibbs free energy
 *   3  the four sign combinations                        -> (temperature decides when signs differ)
 *   4  the temperature where ice melts                   -> (ΔG is zero at equilibrium)
 *   5  ΔG from formation values                          -> (free energies of formation)
 *   6  diamond to graphite                               -> kinetic control
 *   7  an uphill step driven by a steeper one            -> coupled reactions
 *   8  the temperature that tips a decomposition         -> (T tips the balance)
 *
 * THE EVIDENCE IS ON THE BENCH. A plotter that asks for ΔG hides the tug-of-war
 * numbers (`hideTug`), and one that asks for a temperature hides the crossing
 * marker (`hideCrossing`), so the player reads ΔG off the dial or works it out.
 * The formation tables never carry a note that does the sum.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';
import { FORMATION_TABLE, gibbsFreeEnergy, standardReactionChange } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bspontaneous\b/i, introducedAt: 1 },
  { term: /\bGibbs free energy\b/i, introducedAt: 2 },
  { term: /\bkinetic control\b/i, introducedAt: 6 },
  { term: /\bcoupled\b/i, introducedAt: 7 }
];

/** Entropy and enthalpy are earned in the benches before this one. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

const CO_DG = standardReactionChange([{ id: 'CO2(g)' }], [{ id: 'CO(g)' }], 'dGf'); // -257.2
const DG_300 = gibbsFreeEnergy(-100, -200, 300); // -40
const COUPLED = 742.2 - 771.6; // -29.4

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-favorable',
    title: 'Changes That Run on Their Own',
    prompt: 'Sort the three changes by whether they run on their own or only while energy is supplied.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each plate shows one change at 298 K and 1 bar, with a note of what is seen when it is left alone.'
    },
    rigs: [
      {
        id: 'burn-ch4', label: 'Burning Methane', head: 'diagram',
        reactantsLabel: 'CH₄ + 2O₂', productsLabel: 'CO₂ + 2H₂O',
        dH: -890.4, sublabel: 'Keeps burning once lit'
      },
      {
        id: 'cold-pack', label: 'Dissolving a Cold-Pack Salt', head: 'diagram',
        reactantsLabel: 'NH₄NO₃(s)', productsLabel: 'NH₄⁺ + NO₃⁻',
        dH: 25.7, sublabel: 'Dissolves by itself and chills the water'
      },
      {
        id: 'split-h2o', label: 'Splitting Liquid Water', head: 'diagram',
        reactantsLabel: 'H₂O(l)', productsLabel: 'H₂ + ½O₂',
        dH: 285.8, sublabel: 'Stops the moment the current stops'
      }
    ],
    widget: {
      type: 'bins',
      label: 'What the change does',
      bins: [choice('fav', 'Runs on its own'), choice('unfav', 'Needs continuous driving')],
      items: [
        choice('burn-ch4', 'Burning methane in air'),
        choice('cold-pack', 'Dissolving a cold-pack salt in water'),
        choice('split-h2o', 'Splitting liquid water into hydrogen and oxygen')
      ]
    },
    hints: [
      'Read the note on each plate.',
      'Compare what each change does when it is left alone.',
      'A change that carries on by itself belongs in the first bin, and one that stops when the supply stops belongs in the second.'
    ],
    check(state) {
      const want = { 'burn-ch4': 'fav', 'cold-pack': 'fav', 'split-h2o': 'unfav' };
      if (Object.keys(want).some(k => !state.bins[k])) return { ok: false, notYet: true, msg: 'Place all three changes first.' };
      if (Object.entries(want).every(([k, v]) => state.bins[k] === v)) return { ok: true };
      return { ok: false, msg: 'Go by the note on each plate, not by the direction of the shelf drawn: what does the change do when it is left alone?' };
    },
    reward: {
      log: 'Two changes ran by themselves, and one did not.',
      title: 'Spontaneous Change',
      body: 'A change that runs on its own, without continuous outside driving, is spontaneous. ΔH alone cannot decide it, because dissolving a cold-pack salt climbs in enthalpy and still runs by itself.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-combine-dh-ds',
    title: 'Balancing Enthalpy Against Entropy',
    prompt: 'Find ΔG for the reaction on the plate at 300 K, in kJ/mol.',
    briefing: {
      speaker: SPEAKER,
      body: 'The plate gives the reaction’s ΔH in kilojoules and its ΔS in joules, and the tug-of-war bar shows the two terms pulling against each other.'
    },
    rigs: [
      {
        id: 'tug', label: 'Enthalpy and Entropy Tug-of-War', head: 'gibbs',
        dH: -100, dS: -200, T: 300, TMin: 200, TMax: 600, hideDG: true, hideTug: true
      }
    ],
    reference: ['ΔG = ΔH − T × ΔS'],
    widget: { type: 'number', label: 'ΔG at 300 K (kJ/mol)', min: -120, max: 120, step: 20, start: 0 },
    hints: [
      'Read the ΔH, the ΔS and the temperature from the plate.',
      'Compare the units of ΔH and ΔS before you put them in the same sum.',
      'Turn ΔS into kilojoules, multiply it by the temperature, and take that off ΔH.'
    ],
    check(state) {
      if (state.number === DG_300) return { ok: true };
      return { ok: false, msg: 'Check the units of ΔS against those of ΔH, and the sign of the T × ΔS term when ΔS is negative.' };
    },
    reward: {
      log: 'The two terms were balanced at one temperature.',
      title: 'Gibbs Free Energy',
      body: 'The Gibbs free energy, ΔG = ΔH − TΔS, balances the heat a change gives out against the entropy it gains at a given temperature. A negative ΔG means the change is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-four-signs',
    title: 'The Four Tug-of-War Cases',
    prompt: 'Sort the four sign combinations by the temperatures at which ΔG is negative.',
    briefing: {
      speaker: SPEAKER,
      body: 'On each plate the line is ΔG against temperature, and the shaded region is where ΔG is below zero.'
    },
    rigs: [
      { id: 'both-help', label: 'ΔH < 0, ΔS > 0', head: 'gibbs', dH: -40, dS: 100, T: 300, TMin: 100, TMax: 600 },
      { id: 'both-oppose', label: 'ΔH > 0, ΔS < 0', head: 'gibbs', dH: 40, dS: -100, T: 300, TMin: 100, TMax: 600 },
      { id: 'high-t', label: 'ΔH > 0, ΔS > 0', head: 'gibbs', dH: 40, dS: 100, T: 300, TMin: 100, TMax: 600 },
      { id: 'low-t', label: 'ΔH < 0, ΔS < 0', head: 'gibbs', dH: -40, dS: -100, T: 300, TMin: 100, TMax: 600 }
    ],
    widget: {
      type: 'bins',
      label: 'Where ΔG is negative',
      bins: [
        choice('always', 'At every temperature'),
        choice('never', 'At no temperature'),
        choice('high', 'Only at high temperature'),
        choice('low', 'Only at low temperature')
      ],
      items: [
        choice('both-help', 'ΔH < 0 and ΔS > 0'),
        choice('both-oppose', 'ΔH > 0 and ΔS < 0'),
        choice('high-t', 'ΔH > 0 and ΔS > 0'),
        choice('low-t', 'ΔH < 0 and ΔS < 0')
      ]
    },
    hints: [
      'Tap each plate and follow its line from the cold end to the hot end.',
      'Compare where each line sits against the shaded region at the two ends.',
      'If the line stays on one side the verdict never changes, and if it crosses the verdict flips at one temperature.'
    ],
    check(state) {
      const want = { 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' };
      if (Object.keys(want).some(k => !state.bins[k])) return { ok: false, notYet: true, msg: 'Place all four cases first.' };
      if (Object.entries(want).every(([k, v]) => state.bins[k] === v)) return { ok: true };
      return { ok: false, msg: 'Check each plate’s line against the shaded region at both ends of the temperature range.' };
    },
    reward: {
      log: 'Each case was sorted by its line.',
      title: 'Temperature as a Lever',
      body: 'When ΔH and −TΔS agree in sign, the verdict is the same at every temperature. When they oppose each other, temperature tips ΔG across zero, high T letting entropy win and low T letting enthalpy win.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-crossing-temp',
    title: 'Where Ice Starts to Melt',
    prompt: 'Give the temperature in kelvin at which ΔG is zero for melting ice.',
    briefing: {
      speaker: SPEAKER,
      body: 'Ice melts when ΔG turns negative, and the dial sets the temperature the plotter reads.'
    },
    rigs: [
      {
        id: 'melt-ice', label: 'Melting Ice', head: 'gibbs', eq: 'H₂O(s) ⇌ H₂O(l)',
        dH: 6.01, dS: 22.0, T: 250, TMin: 220, TMax: 320, hideCrossing: true
      }
    ],
    dial: { key: 'temp', label: 'Temperature', unit: 'K', values: [250, 260, 273, 285, 300], start: 1 },
    reference: ['ΔG = ΔH − T × ΔS'],
    widget: { type: 'number', label: 'Temperature where ΔG is zero (K)', min: 223, max: 323, step: 10 },
    hints: [
      'Turn the Temperature dial and watch the ΔG printed under the plotter.',
      'Compare the readings either side of the point where ΔG changes sign.',
      'At the temperature where ΔG is zero, ΔH equals T times ΔS, so you can also solve for T directly.'
    ],
    check(state) {
      if (Math.abs(state.number - 273) <= 2) return { ok: true };
      return { ok: false, msg: 'Check the dial for the setting where ΔG reads zero, or set ΔH equal to T × ΔS with both in the same unit.' };
    },
    reward: {
      log: 'The line crossed zero at the melting point.',
      title: 'Equilibrium at ΔG = 0',
      body: 'At 273 K, ΔG is zero and ice and liquid water coexist in equilibrium. Below it enthalpy wins and ice stays solid, and above it the TΔS term wins and ice melts.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-formation-gibbs',
    title: 'Free Energy from Formation Values',
    prompt: 'Use the free energies of formation on the plate to find ΔG for CO(g) + ½O₂(g) → CO₂(g).',
    briefing: {
      speaker: SPEAKER,
      body: 'Free energy depends only on a substance’s state, as enthalpy does, so a table of formation values works the same way.'
    },
    rigs: [
      {
        id: 'dgf-table',
        label: 'Free Energies of Formation',
        head: 'hess',
        submode: 'formation',
        hideSeaLevel: true,
        columnLabel: 'ΔG°f (kJ/mol)',
        targetEq: 'CO(g) + ½O₂(g) → CO₂(g)',
        reactants: [
          { formula: 'CO(g)', n: 1, dHf: FORMATION_TABLE['CO(g)'].dGf },
          { formula: '½ O₂(g)', n: 0.5, dHf: 0 }
        ],
        products: [{ formula: 'CO₂(g)', n: 1, dHf: FORMATION_TABLE['CO2(g)'].dGf }]
      }
    ],
    widget: {
      type: 'choice',
      label: 'ΔG (kJ/mol)',
      options: [
        choice('right', '−257.2'),
        choice('flipped', '+257.2'),
        choice('all', '−531.6'),
        choice('prod', '−394.4')
      ]
    },
    hints: [
      'Read the free energy of formation of each substance from the table.',
      'Compare the total for the products with the total for the reactants.',
      'Add the free energies of the products, then take off the free energies of the reactants.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'flipped') return { ok: false, msg: 'The sign is backward: check which total is larger, the products’ or the reactants’.' };
      if (state.choice === 'all') return { ok: false, msg: 'The reactants are taken off the products, not added to them.' };
      return { ok: false, msg: 'That is only the products’ total; the reactants’ free energy still has to be taken off.' };
    },
    reward: {
      log: 'The reaction was routed through the elements.',
      title: 'Free Energy of Reaction',
      body: 'A reaction’s ΔG is the free energies of formation of its products minus those of its reactants. Burning carbon monoxide to carbon dioxide has a ΔG of −257.2 kJ/mol, so it is spontaneous.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-diamond-kinetic',
    title: 'Why Diamonds Last',
    prompt: 'Turning diamond into graphite has a negative ΔG at 298 K; why does a diamond ring not change?',
    briefing: {
      speaker: SPEAKER,
      body: 'The plotter shows where the change sits, and the note beneath it says what is seen in practice.'
    },
    rigs: [
      {
        id: 'diamond', label: 'Diamond to Graphite', head: 'gibbs', eq: 'C(diamond) → C(graphite)',
        dH: -1.9, dS: 3.3, T: 298, TMin: 200, TMax: 500, barrierNote: 'Seen in practice: no change at 298 K'
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason',
      options: [
        choice('barrier', 'The change is immeasurably slow because it needs a large energy barrier'),
        choice('unfav', 'A negative ΔG means a change cannot happen'),
        choice('eq', 'Diamond and graphite are already at equilibrium')
      ]
    },
    hints: [
      'Read the ΔG on the plotter and the note beneath it.',
      'Compare what the sign of ΔG says with what is seen in practice.',
      'ΔG says which way a change can run, and something else must say how fast it runs.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'barrier') return { ok: true };
      if (state.choice === 'unfav') return { ok: false, msg: 'Read the sign on the plotter again: a negative ΔG is the sign of a change that can run.' };
      return { ok: false, msg: 'At equilibrium ΔG would be zero, and the plotter shows it is not.' };
    },
    reward: {
      log: 'Favourable did not mean fast.',
      title: 'Kinetic Control',
      body: 'A negative ΔG says a change can run, not how fast. A diamond sits behind a large activation barrier, so its change to graphite is under kinetic control and too slow to see.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-coupled-reactions',
    title: 'Driving an Uphill Reaction',
    prompt: 'Find ΔG for Fe₂O₃(s) + 3 CO(g) → 2 Fe(s) + 3 CO₂(g) from the two reactions on the stack.',
    briefing: {
      speaker: SPEAKER,
      body: 'The first reaction cannot run alone, but the oxygen it frees is exactly what the second uses.'
    },
    rigs: [
      {
        id: 'smelt',
        label: 'Blast Furnace Smelting',
        head: 'hess',
        submode: 'stack',
        hideSum: true,
        targetEq: 'Fe₂O₃(s) + 3 CO(g) → 2 Fe(s) + 3 CO₂(g)',
        cards: [
          { id: 'c1', eq: 'Fe₂O₃(s) → 2 Fe(s) + 1.5 O₂(g)', dH: 742.2 },
          { id: 'c2', eq: '3 CO(g) + 1.5 O₂(g) → 3 CO₂(g)', dH: -771.6 }
        ]
      }
    ],
    widget: {
      type: 'choice',
      label: 'Combined ΔG (kJ)',
      options: [
        choice('right', '−29.4'),
        choice('flipped', '+29.4'),
        choice('all', '+1513.8'),
        choice('first', '+742.2')
      ]
    },
    hints: [
      'Read the ΔG of each of the two reactions on the stack.',
      'Compare what the first reaction frees with what the second one uses.',
      'The substance that appears in both cancels, so the free energy changes simply add.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'right') return { ok: true };
      if (state.choice === 'flipped') return { ok: false, msg: 'The sign is backward: compare how far each reaction climbs or falls and which is larger.' };
      if (state.choice === 'all') return { ok: false, msg: 'One of the two reactions falls, and a fall is taken off a climb, not added to it.' };
      return { ok: false, msg: 'That is only the first reaction; the second one is needed to make it run.' };
    },
    reward: {
      log: 'The steeper fall outweighed the climb.',
      title: 'Coupled Reactions',
      body: 'An uphill reaction can be driven by a coupled reaction that falls further, if the two share an intermediate. Smelting iron and building proteins in cells both rely on this.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-pick-temp',
    title: 'Dialling Temperature to Tip the Balance',
    prompt: 'Turn the dial to find the temperature at which this decomposition has a negative ΔG.',
    briefing: {
      speaker: SPEAKER,
      body: 'The reaction takes in heat and gains entropy, and the plotter reads ΔG at the temperature the dial is set to.'
    },
    rigs: [
      {
        id: 'decomp-t', label: 'High-Temperature Decomposition', head: 'gibbs', eq: 'AB(s) → A(s) + B(g)',
        dH: 90, dS: 150, T: 300, TMin: 200, TMax: 900, hideCrossing: true
      }
    ],
    dial: { key: 'temp', label: 'Temperature', unit: 'K', values: [300, 450, 600, 750], start: 1 },
    widget: {
      type: 'choice',
      label: 'Temperature with a negative ΔG',
      options: [choice('750', '750 K'), choice('300', '300 K'), choice('450', '450 K'), choice('600', '600 K')]
    },
    hints: [
      'Turn the Temperature dial through its settings and read the ΔG at each.',
      'Compare the sign of the ΔG reading at each setting.',
      'Keep the setting where the reading falls below zero, not merely to it.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a temperature.' };
      if (state.choice === '750') return { ok: true };
      if (state.choice === '600') return { ok: false, msg: 'At that setting ΔG reads zero, which is the balance point and not below it.' };
      return { ok: false, msg: 'At that setting the plotter reads ΔG above zero, so the decomposition does not run there.' };
    },
    reward: {
      log: 'Only the hottest setting tipped the balance.',
      title: 'Temperature Tips the Balance',
      body: 'For a reaction with positive ΔH and positive ΔS, ΔG falls as temperature rises and turns negative above ΔH divided by ΔS. At 750 K the TΔS term outweighs the 90 kJ it costs.'
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
      body: 'ΔG = ΔH − TΔS sets one verdict from two pulls. A negative ΔG says a change can run on its own, temperature can tip it when the pulls oppose, and a barrier can still make it too slow to see.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'This one balance explains why ice melts, why iron can be smelted and why your own cells can build what they need. Nothing in it is a rule to memorise.'
    },
    {
      heading: 'Next',
      body: 'The caldera rim holds the Fifth Guild’s siphon core, and every tool from this world will be needed to crack it.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'A reaction has ΔH = −50 kJ/mol and ΔS = −100 J/(mol·K). What is ΔG at 300 K?',
    options: [
      { id: 'a', label: '−20 kJ/mol' },
      { id: 'b', label: '+20 kJ/mol' },
      { id: 'c', label: '−80 kJ/mol' },
      { id: 'd', label: '+30 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'TΔS is 300 K × (−0.100 kJ/(mol·K)) = −30 kJ, so ΔG = −50 − (−30) = −20 kJ/mol.'
  },
  {
    question: 'A change has ΔH > 0 and ΔS > 0. When is it spontaneous?',
    options: [
      { id: 'a', label: 'Only at high temperature' },
      { id: 'b', label: 'Only at low temperature' },
      { id: 'c', label: 'At every temperature' },
      { id: 'd', label: 'At no temperature' }
    ],
    answer: 'a',
    explanation: 'Entropy gain only outweighs the heat cost once T is large enough, so ΔG turns negative at high temperature.'
  },
  {
    question: 'Melting has ΔH = +6.01 kJ/mol and ΔS = +22.0 J/(mol·K). At what temperature is ΔG zero?',
    options: [
      { id: 'a', label: '273 K' },
      { id: 'b', label: '132 K' },
      { id: 'c', label: '2.73 K' },
      { id: 'd', label: '546 K' }
    ],
    answer: 'a',
    explanation: 'Set ΔH = TΔS and solve: T = 6010 J/mol divided by 22.0 J/(mol·K), which is 273 K.'
  },
  {
    question: 'An uphill reaction has ΔG = +60 kJ and is coupled to a reaction with ΔG = −90 kJ. What is the combined ΔG?',
    options: [
      { id: 'a', label: '−30 kJ' },
      { id: 'b', label: '+30 kJ' },
      { id: 'c', label: '+150 kJ' },
      { id: 'd', label: '−150 kJ' }
    ],
    answer: 'a',
    explanation: 'The two free energy changes add, giving +60 + (−90) = −30 kJ, so the coupled pair runs.'
  },
  {
    question: 'Why does graphite not appear from a diamond at room temperature when ΔG is negative?',
    options: [
      { id: 'a', label: 'The change is far too slow because of a large activation energy' },
      { id: 'b', label: 'A negative ΔG means the change is forbidden' },
      { id: 'c', label: 'Diamond has a lower free energy than graphite' }
    ],
    answer: 'a',
    explanation: 'ΔG tells you whether a change can run, not how fast, and a large barrier can make a favourable change immeasurably slow.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { bins: { 'burn-ch4': 'fav', 'cold-pack': 'fav', 'split-h2o': 'unfav' } },
  { number: DG_300 },
  { bins: { 'both-help': 'always', 'both-oppose': 'never', 'high-t': 'high', 'low-t': 'low' } },
  { number: 273 },
  { choice: 'right' },
  { choice: 'barrier' },
  { choice: 'right' },
  { choice: '750' }
];

export const MISSES = [
  { bins: { 'burn-ch4': 'fav', 'cold-pack': 'unfav', 'split-h2o': 'unfav' } },
  { number: 80 },
  { bins: { 'both-help': 'never', 'both-oppose': 'always', 'high-t': 'high', 'low-t': 'low' } },
  { number: 323 },
  { choice: 'flipped' },
  { choice: 'unfav' },
  { choice: 'flipped' },
  { choice: '600' }
];

export const stateFor = makeStateFor(STAGES);

export function mount(container, ctx) {
  return mountThermo(container, ctx, { STAGES, DEBRIEF, toolNoteFor });
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { CO_DG, COUPLED };
