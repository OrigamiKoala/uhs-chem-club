/**
 * Unit 5 · Bench 3 — Enthalpy of Reaction (q3-enthalpy)
 *
 * The same lidded cup, now read from the system's side of the line. The heat a
 * bath gains is the heat the reaction lost, counted per mole, and that figure is
 * flipped, scaled and weighed out as fuel.
 *
 *   1  a bath that gained heat                    -> ΔH, with the system's sign
 *   2  twice the scoop in the cup                 -> (heat scales, heat per mole does not)
 *   3  the reverse of a reaction                  -> (ΔH changes sign)
 *   4  a weighed charge of fuel                   -> (heat from grams, by way of moles)
 *   5  the diagram of an uphill reaction          -> (positive ΔH climbs)
 *   6  steam against liquid water                 -> (state symbols carry energy)
 *   7  a heat target worked back to grams         -> (grams from heat)
 *   8  three fuels ranked                         -> (heat per gram)
 *
 * THE EVIDENCE IS ON THE BENCH. A stage that asks for a sign hides the plate's
 * own verdict (`hideVerdict`); a stage that asks for a figure puts the molar mass
 * and the molar enthalpy on the plate and leaves the dividing to the player.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';
import { FUELS } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\benthalpy\b/i, introducedAt: 1 },
  { term: /\bstate symbols?\b/i, introducedAt: 6 }
];

/** Moles and molar mass are Tallow's; heat in a bath is this world's first two benches. */
export const BUILDS_ON = ['unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

const PER_MOLE_FORM = -460;

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-sign',
    title: 'From the Bath’s Gain to the System’s Change',
    prompt: 'The bath gained 23.0 kJ as 0.050 mol of magnesium reacted; give the reaction’s ΔH in kJ/mol.',
    briefing: {
      speaker: SPEAKER,
      body: 'ΔH is the heat a reaction takes in or gives out per mole, counted from the system’s side of the line.'
    },
    rigs: [
      {
        id: 'mg-cup',
        label: 'Mg + 2H⁺ Run (0.050 mol)',
        head: 'cup',
        hideVerdict: true,
        waterMass: 200,
        waterTInit: 20.0,
        reaction: { label: 'Mg(s) + 2H⁺(aq)', moles: 0.050, q: 23000 }
      }
    ],
    widget: { type: 'number', label: 'Reaction ΔH (kJ/mol)', min: -600, max: 600, step: 20 },
    hints: [
      'Read the heat the bath gained and the moles that reacted from the plate.',
      'Compare which side of the line gained the energy with which side lost it.',
      'Divide the heat by the moles, then give it the sign that belongs to the system’s side.'
    ],
    check(state) {
      if (state.number === PER_MOLE_FORM) return { ok: true };
      if (state.number === -PER_MOLE_FORM) return { ok: false, msg: 'Decide which side of the line gained the energy; the system’s change has the opposite sign to the bath’s.' };
      return { ok: false, msg: 'Check that the heat is divided by the moles that reacted, and that the size is kilojoules per mole.' };
    },
    reward: {
      log: 'The system lost what the bath gained.',
      title: 'Enthalpy Change',
      body: 'The heat a reaction exchanges at constant pressure, per mole of reaction, is its enthalpy change, ΔH. A reaction that warms its bath has a negative ΔH, because the system lost that energy.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-scale-amount',
    title: 'Doubling the Scoop in the Cup',
    prompt: 'Turn the dial to react twice the moles; how do the heat in the cup and the heat per mole change?',
    briefing: {
      speaker: SPEAKER,
      body: 'The Moles Reacted dial sets how much magnesium goes into the same cup of acid.'
    },
    rigs: [
      {
        id: 'cup',
        label: 'Calorimeter Cup',
        head: 'cup',
        hideVerdict: true,
        waterMass: 200,
        waterTInit: 20.0,
        reaction: { label: 'Mg + 2H⁺', moles: 0.050, dH: -460, q: 23000 }
      }
    ],
    dial: { key: 'moles', label: 'Moles reacted', unit: 'mol', values: [0.050, 0.100], start: 1 },
    widget: {
      type: 'choice',
      label: 'Effect of doubling the moles',
      options: [
        choice('q-doubles-dh-same', 'The heat in the cup doubles and the heat per mole stays the same'),
        choice('both-double', 'The heat in the cup and the heat per mole both double'),
        choice('neither', 'Neither the heat in the cup nor the heat per mole changes')
      ]
    },
    hints: [
      'Turn the dial to its second setting and read the heat under the thermometer trace.',
      'Compare the new heat with the old one, then divide each by the moles that reacted.',
      'Work out the heat per mole at both settings and see whether it moves.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose what changes.' };
      if (state.choice === 'q-doubles-dh-same') return { ok: true };
      if (state.choice === 'neither') return { ok: false, msg: 'Read the heat under the trace at both dial settings: it is not the same.' };
      return { ok: false, msg: 'Divide the heat by the moles at both settings, and check whether the quotient moves.' };
    },
    reward: {
      log: 'Twice the scoop gave twice the heat.',
      title: 'Heat Scales, ΔH Does Not',
      body: 'The heat caught in a cup grows with the amount that reacts, but the heat per mole does not. ΔH is quoted per mole of reaction so that every cup size gives the same figure.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-reverse',
    title: 'Climbing Back Up the Same Hill',
    prompt: 'Forming liquid water from hydrogen and oxygen has a ΔH of −285.8 kJ/mol; give ΔH for splitting it back apart.',
    briefing: {
      speaker: SPEAKER,
      body: 'The diagram draws the two sides of the equation as shelves, and "Reverse Reaction" swaps which side the reaction starts on.'
    },
    rigs: [
      {
        id: 'water-rev',
        label: 'Water Formation and Decomposition',
        head: 'diagram',
        hideVerdict: true,
        hideValue: true,
        reactantsLabel: 'H₂(g) + ½O₂(g)',
        productsLabel: 'H₂O(l)',
        dH: -285.8,
        allowReverse: true
      }
    ],
    toggleAction: { group: 'Pathway', label: 'Reverse Reaction' },
    widget: {
      type: 'choice',
      label: 'ΔH for splitting liquid water (kJ/mol)',
      options: [
        choice('plus', '+285.8'),
        choice('minus', '−285.8'),
        choice('plus-double', '+571.6'),
        choice('zero', '0')
      ]
    },
    hints: [
      'Press "Reverse Reaction" and watch which shelf the reaction now starts on.',
      'Compare the distance between the two shelves before and after the swap.',
      'The reverse trip covers the same distance in the opposite direction.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === 'plus') return { ok: true };
      if (state.choice === 'minus') return { ok: false, msg: 'That is the value for the trip down; the reverse trip starts on the lower shelf.' };
      if (state.choice === 'plus-double') return { ok: false, msg: 'Only one mole of water is split, and the shelves are the same distance apart.' };
      return { ok: false, msg: 'The two shelves sit at different heights, so some energy must be exchanged.' };
    },
    reward: {
      log: 'The reverse trip covers the same distance.',
      title: 'Reversing a Reaction',
      body: 'Reversing a reaction swaps its starting and finishing shelves, so ΔH keeps its size and changes its sign. Splitting water takes in exactly what forming it gave out.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-burn-mass',
    title: 'Heat from a Weighed Fuel Charge',
    prompt: 'How much heat is released when 8.02 g of methane burns, given the ΔH on the plate?',
    briefing: {
      speaker: SPEAKER,
      body: 'The ΔH on the plate is for one mole of methane burning, but the charge on the bench is weighed in grams.'
    },
    rigs: [
      {
        id: 'ch4',
        label: 'Methane Burner (8.02 g CH₄)',
        head: 'diagram',
        hideVerdict: true,
        reactantsLabel: 'CH₄(g) + 2O₂(g)',
        productsLabel: 'CO₂(g) + 2H₂O(l)',
        dH: -890,
        sublabel: 'Molar mass of CH₄: 16.04 g/mol'
      }
    ],
    widget: {
      type: 'choice',
      label: 'Heat released',
      options: [
        choice('445', '445 kJ'),
        choice('890', '890 kJ'),
        choice('1780', '1780 kJ'),
        choice('55', '55.5 kJ')
      ]
    },
    hints: [
      'Read the ΔH and the molar mass from the plate.',
      'Compare the mass on the bench with the mass of one mole.',
      'Turn the grams into moles first, then multiply by the heat released per mole.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a value.' };
      if (state.choice === '445') return { ok: true };
      if (state.choice === '890') return { ok: false, msg: 'That is the heat for a whole mole; compare the mass on the bench with the mass of one mole.' };
      if (state.choice === '1780') return { ok: false, msg: 'The charge is smaller than one mole, not larger.' };
      return { ok: false, msg: 'That looks like a figure per gram; the question asks for the whole charge.' };
    },
    reward: {
      log: 'Half a mole released half the heat.',
      title: 'Heat from Grams',
      body: 'A balanced equation ties kilojoules to moles, so grams must become moles first. Here 8.02 g is half a mole of methane, and it releases half of 890 kJ, which is 445 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-pick-endo',
    title: 'Spotting an Uphill Reaction',
    prompt: 'Tap the diagram that matches N₂ + O₂ → 2 NO, which has a ΔH of +180.6 kJ/mol.',
    briefing: {
      speaker: SPEAKER,
      body: 'Both diagrams draw the same two sides of the equation but they do not agree about the heights of their shelves.'
    },
    rigs: [
      { id: 'down', label: 'Diagram A', head: 'diagram', hideVerdict: true, hideValue: true, reactantsLabel: 'N₂(g) + O₂(g)', productsLabel: '2 NO(g)', dH: -180.6 },
      { id: 'up', label: 'Diagram B', head: 'diagram', hideVerdict: true, hideValue: true, reactantsLabel: 'N₂(g) + O₂(g)', productsLabel: '2 NO(g)', dH: 180.6 }
    ],
    widget: { type: 'pick', label: 'Selected diagram', help: 'Tap Diagram A or Diagram B on the bench.' },
    hints: [
      'Tap each diagram and compare the heights of its two shelves.',
      'Compare the sign of the ΔH in the prompt with whether each diagram’s products end higher or lower.',
      'A positive ΔH means the system took in energy, so its products end on the higher shelf.'
    ],
    check(state) {
      if (!state.sample) return { ok: false, notYet: true, msg: 'Tap one of the two diagrams on the bench.' };
      if (state.sample === 'up') return { ok: true };
      return { ok: false, msg: 'That diagram’s products end on a lower shelf than they began, which is how a system looks after giving out energy.' };
    },
    reward: {
      log: 'The products sit on the higher shelf.',
      title: 'A Positive ΔH',
      body: 'A positive ΔH means the products sit on a higher enthalpy shelf than the reactants, so the reaction takes in heat. Forming nitric oxide from air is an uphill, endothermic reaction.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-state-matters',
    title: 'Why Physical State Changes ΔH',
    prompt: 'Why does burning hydrogen to liquid water release more heat than burning it to steam?',
    briefing: {
      speaker: SPEAKER,
      body: 'Both plates start from the same hydrogen and oxygen, and they differ in what the product is.'
    },
    rigs: [
      {
        id: 'vapour', label: 'To Water Vapour H₂O(g)', head: 'diagram',
        reactantsLabel: 'H₂(g) + ½O₂(g)', productsLabel: 'H₂O(g)', dH: -241.8
      },
      {
        id: 'liquid', label: 'To Liquid Water H₂O(l)', head: 'diagram',
        reactantsLabel: 'H₂(g) + ½O₂(g)', productsLabel: 'H₂O(l)', dH: -285.8
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason',
      options: [
        choice('condense', 'The steam condensing to liquid gives out extra heat'),
        choice('heavier', 'Liquid water has a larger molar mass than steam'),
        choice('reactants', 'The hydrogen and oxygen start at different energies in the two runs')
      ]
    },
    hints: [
      'Compare the starting shelf on the two plates, and then compare where each one finishes.',
      'Compare the two ΔH values with the difference between a gas and a liquid product.',
      'The liquid is further along the road than the gas, so the step between them has its own energy.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'condense') return { ok: true };
      if (state.choice === 'heavier') return { ok: false, msg: 'A mole of water has the same mass whether it is a gas or a liquid.' };
      return { ok: false, msg: 'Compare the labels on the starting shelf of the two plates: they are the same.' };
    },
    reward: {
      log: 'The liquid sits a step below the steam.',
      title: 'State Symbols Matter',
      body: 'Changing state carries its own enthalpy: condensing a mole of steam releases about 44 kJ. That is why a thermochemical equation always shows state symbols such as (s), (l) and (g).'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-mass-for-heat',
    title: 'Weighing Out a Target Heat Dose',
    prompt: 'How many grams of methane must burn to release 222.5 kJ?',
    briefing: {
      speaker: SPEAKER,
      body: 'This time the heat is fixed and the charge of fuel is the unknown.'
    },
    rigs: [
      {
        id: 'target',
        label: 'Methane Combustion',
        head: 'diagram',
        hideVerdict: true,
        reactantsLabel: 'CH₄(g) + 2O₂(g)',
        productsLabel: 'CO₂(g) + 2H₂O(l)',
        dH: -890,
        sublabel: 'Molar mass of CH₄: 16.0 g/mol'
      }
    ],
    widget: { type: 'decimal', label: 'Mass of methane (g)', min: 1.0, max: 12.0, step: 1.0 },
    hints: [
      'Read the ΔH and the molar mass from the plate.',
      'Compare the target heat with the heat that one whole mole releases.',
      'Find the moles that deliver the target, then turn those moles into grams.'
    ],
    check(state) {
      if (Math.abs(state.decimal - 4.0) <= 0.15) return { ok: true };
      return { ok: false, msg: 'Work from the heat to the moles first, then from the moles to the grams.' };
    },
    reward: {
      log: 'A quarter of a mole delivers the target.',
      title: 'Grams from Heat',
      body: 'The route runs both ways: heat divided by ΔH gives moles, and moles times molar mass gives grams. A quarter of a mole of methane, 4.0 g, releases 222.5 kJ.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-rank-fuels',
    title: 'Heat per Mole vs Heat per Gram',
    prompt: 'Order the three fuels from lowest to highest heat released per gram.',
    briefing: {
      speaker: SPEAKER,
      body: 'A rocket carries weight rather than moles, and each plate gives a fuel’s heat per mole and its molar mass.'
    },
    rigs: [
      {
        id: 'methanol', label: 'Methanol CH₃OH', head: 'diagram', hideVerdict: true,
        reactantsLabel: 'CH₃OH + 1.5O₂', productsLabel: 'CO₂ + 2H₂O',
        dH: FUELS.methanol.dHc, sublabel: 'Molar mass: 32.0 g/mol'
      },
      {
        id: 'methane', label: 'Methane CH₄', head: 'diagram', hideVerdict: true,
        reactantsLabel: 'CH₄ + 2O₂', productsLabel: 'CO₂ + 2H₂O',
        dH: FUELS.methane.dHc, sublabel: 'Molar mass: 16.0 g/mol'
      },
      {
        id: 'hydrogen', label: 'Hydrogen H₂', head: 'diagram', hideVerdict: true,
        reactantsLabel: 'H₂ + ½O₂', productsLabel: 'H₂O(l)',
        dH: FUELS.hydrogen.dHc, sublabel: 'Molar mass: 2.02 g/mol'
      }
    ],
    widget: {
      type: 'order',
      label: 'Order from lowest to highest heat per gram',
      rail: { first: 'Lowest heat per gram', last: 'Highest heat per gram' },
      items: [
        choice('methanol', 'Methanol'),
        choice('methane', 'Methane'),
        choice('hydrogen', 'Hydrogen')
      ]
    },
    hints: [
      'Tap each plate and read its heat per mole and its molar mass.',
      'Compare the fuels by the heat in one gram, not in one mole.',
      'Divide each fuel’s heat per mole by its molar mass, then put the three in rising order.'
    ],
    check(state) {
      if (state.order.length < 3) return { ok: false, notYet: true, msg: 'Put all three fuels in order.' };
      if (state.order.join(',') === 'methanol,methane,hydrogen') return { ok: true };
      return { ok: false, msg: 'Heat per mole is not heat per gram; divide each fuel’s heat by its own molar mass before ranking.' };
    },
    reward: {
      log: 'The lightest molecule carries the most heat per gram.',
      title: 'Energy per Gram',
      body: 'Hydrogen releases the least heat per mole but the most per gram, because its molar mass is tiny. Fuels for anything that must lift their own weight are ranked in kilojoules per gram.'
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
      body: 'ΔH is the heat per mole of reaction counted from the system’s side: negative when the bath warms, positive when it cools. Reversing a reaction flips its sign, and moles turn it into kilojoules and grams.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'A thermochemical equation is a price list: it says how much heat a mole of reaction buys or costs. From here on the bench reads that price, not the bath.'
    },
    {
      heading: 'Next',
      body: 'The next bench looks inside the price and asks where in the molecules the energy is kept.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'For N₂(g) + 3 H₂(g) → 2 NH₃(g), ΔH = −92 kJ. What is ΔH for 2 NH₃(g) → N₂(g) + 3 H₂(g)?',
    options: [
      { id: 'a', label: '+92 kJ' },
      { id: 'b', label: '−92 kJ' },
      { id: 'c', label: '+184 kJ' },
      { id: 'd', label: '0 kJ' }
    ],
    answer: 'a',
    explanation: 'Reversing a reaction swaps the reactants and products, so ΔH keeps its size and changes its sign.'
  },
  {
    question: 'C(s) + O₂(g) → CO₂(g) has ΔH = −393.5 kJ/mol. How much heat is released when 2.00 mol of carbon burns completely?',
    options: [
      { id: 'a', label: '787 kJ' },
      { id: 'b', label: '394 kJ' },
      { id: 'c', label: '197 kJ' },
      { id: 'd', label: '1574 kJ' }
    ],
    answer: 'a',
    explanation: 'Two moles release twice the heat of one mole: 2.00 mol × 393.5 kJ/mol is about 787 kJ.'
  },
  {
    question: 'Why is a fuel’s ΔH more negative when it burns to liquid water than to water vapour?',
    options: [
      { id: 'a', label: 'Condensing the vapour to a liquid releases extra heat' },
      { id: 'b', label: 'Condensing the vapour to a liquid absorbs heat from the flame' },
      { id: 'c', label: 'Liquid water contains more oxygen atoms than vapour' }
    ],
    answer: 'a',
    explanation: 'Liquid water sits lower in enthalpy than vapour, so ending as a liquid releases the enthalpy of condensation as well.'
  },
  {
    question: 'When 0.10 mol of a salt dissolves in a calorimeter, the water bath loses 1.5 kJ. What is ΔH for dissolving one mole of the salt?',
    options: [
      { id: 'a', label: '+15 kJ/mol' },
      { id: 'b', label: '−15 kJ/mol' },
      { id: 'c', label: '+1.5 kJ/mol' },
      { id: 'd', label: '−1.5 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'The bath lost the energy the salt gained, so ΔH is positive, and 1.5 kJ divided by 0.10 mol is 15 kJ/mol.'
  },
  {
    question: 'Burning 1.0 mol of carbon (12.0 g/mol) releases 394 kJ, and burning 1.0 mol of hydrogen (2.0 g/mol) releases 286 kJ. Which releases more heat per gram?',
    options: [
      { id: 'a', label: 'Hydrogen, because a gram of it holds many more moles' },
      { id: 'b', label: 'Carbon, because 394 kJ is larger than 286 kJ' },
      { id: 'c', label: 'Both release the same heat per gram' }
    ],
    answer: 'a',
    explanation: 'Divide by the molar mass: hydrogen gives about 143 kJ per gram and carbon about 33 kJ per gram.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { number: -460 },
  { choice: 'q-doubles-dh-same' },
  { choice: 'plus' },
  { choice: '445' },
  { sample: 'up' },
  { choice: 'condense' },
  { decimal: 4 },
  { order: ['methanol', 'methane', 'hydrogen'] }
];

export const MISSES = [
  { number: 460 },
  { choice: 'both-double' },
  { choice: 'minus' },
  { choice: '890' },
  { sample: 'down' },
  { choice: 'heavier' },
  { decimal: 8 },
  { order: ['hydrogen', 'methane', 'methanol'] }
];

export const stateFor = makeStateFor(STAGES);

export function mount(container, ctx) {
  return mountThermo(container, ctx, { STAGES, DEBRIEF, toolNoteFor });
}
