/**
 * Unit 5 · Bench 2 — Calorimetry (q2-calorimetry)
 *
 * The lidded cup with a weighed bath. The player gives the bath a known amount of
 * heat and watches how far the thermometer climbs, then runs the sum backwards:
 * from a thermometer rise to joules, to a metal's name, to a heat per mole.
 *
 *   1  the same heat into 100 g and 200 g of water    -> heat capacity
 *   2  the same heat into water and into iron         -> specific heat capacity
 *   3  warming a bath by a stated amount             -> q = m c ΔT
 *   4  a hot block dropped into a bath               -> (heat lost equals heat gained)
 *   5  naming the metal from the number it gave      -> (c is a fingerprint)
 *   6  a reaction run in the cup                     -> calorimeter
 *   7  the heat one whole mole would release         -> (heat per mole)
 *   8  the same run with the lid off                 -> (heat escapes the bath)
 *
 * THE EVIDENCE IS ON THE BENCH. Every cup that asks for a heat has its own
 * `|q|` readout switched off (`hideHeat`), so the joules are worked out from the
 * mass, the specific heat capacity and the temperature rise printed beside the
 * trace. The sum itself is given on the plate, because a formula a stage needs
 * is never withheld.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { mountThermo, makeStateFor } from '../../engine/thermomount.js';
import { SPECIFIC_HEAT_WATER, SPECIFIC_HEATS, heatTransfer, blockSpecificHeat } from '../../engine/thermodata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bheat capacity\b/i, introducedAt: 1 },
  { term: /\bspecific heat capacity\b/i, introducedAt: 2 },
  { term: /\bcalorimeter\b/i, introducedAt: 6 }
];

/** The bench reads a thermometer as particle motion, and counts in moles. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** A key whose label says what it does carries no legend. */
export function toolNoteFor() { return null; }

const choice = (id, label) => ({ id, label });

// Stage 3: 100 g of water from 20.0 to 25.0 degrees takes 2092 J.
const Q_STAGE3 = heatTransfer(100, SPECIFIC_HEAT_WATER, 5);
// Stage 4: 100 g of water gains 836.8 J while a 50.0 g block falls from 65.4 to 22.0 degrees.
const C_STAGE4 = Number(blockSpecificHeat(50, 65.4, 100, 20.0, 22.0).toFixed(2));
// Stage 6: 100 g of solution warms by 6.0 degrees, which is 2510 J.
const Q_STAGE6 = heatTransfer(100, SPECIFIC_HEAT_WATER, 6.0);
// Stage 7: that heat spread over 0.045 mol.
const PER_MOLE = Q_STAGE6 / 1000 / 0.045;

const FORMULA = 'q = m × c × ΔT';
const C_WATER = 'c of water = 4.184 J/(g·°C)';

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-mass-water',
    title: 'Sharing the Same Joules',
    prompt: 'The same heat enters 100 g and 200 g of water; how do the two temperature rises compare?',
    briefing: {
      speaker: SPEAKER,
      body: 'Two insulated cups each receive the same amount of heat from an electric heater. One holds 100 g of water and the other holds 200 g.'
    },
    rigs: [
      { id: 'cup100', label: '100 g Water Bath', head: 'cup', waterMass: 100, waterTInit: 20.0, joules: 4184 },
      { id: 'cup200', label: '200 g Water Bath', head: 'cup', waterMass: 200, waterTInit: 20.0, joules: 4184 }
    ],
    widget: {
      type: 'choice',
      label: 'The 200 g bath’s temperature rise',
      options: [
        choice('half', 'It rises half as much as the 100 g bath'),
        choice('double', 'It rises twice as much as the 100 g bath'),
        choice('same', 'It rises by the same amount')
      ]
    },
    hints: [
      'Read the temperature rise printed under the thermometer trace on each plate.',
      'Compare the two rises with the two masses of water.',
      'Twice the water means the same energy is shared among twice as many particles.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a comparison.' };
      if (state.choice === 'half') return { ok: true };
      if (state.choice === 'double') return { ok: false, msg: 'More water does not magnify the rise; it spreads the same heat over more particles.' };
      return { ok: false, msg: 'The two cups receive the same heat but not the same mass, and the rises printed under the traces are not equal.' };
    },
    reward: {
      log: 'Twice the water gave half the rise.',
      title: 'Heat Capacity',
      body: 'The heat a sample needs to rise by one degree is its heat capacity. Doubling the mass doubles the heat capacity, so the same heat produces half the temperature rise.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-water-vs-iron',
    title: 'Different Thermal Buckets',
    prompt: 'The same heat enters 100 g of water and 100 g of iron; why does the iron warm so much more?',
    briefing: {
      speaker: SPEAKER,
      body: 'Both samples weigh the same and the heater delivers the same energy to each.'
    },
    rigs: [
      {
        id: 'water', label: '100 g Water', head: 'cup', waterMass: 100,
        cFluid: SPECIFIC_HEATS.water.c, fluidName: 'H₂O', waterTInit: 20.0, joules: 4184
      },
      {
        id: 'iron', label: '100 g Iron', head: 'cup', waterMass: 100,
        cFluid: SPECIFIC_HEATS.iron.c, fluidName: 'Fe', waterTInit: 20.0, joules: 4184
      }
    ],
    widget: {
      type: 'choice',
      label: 'Reason',
      options: [
        choice('bucket', 'Each gram of iron needs less heat than a gram of water for one degree of rise'),
        choice('heavier', 'A hundred grams of iron weighs more than a hundred grams of water'),
        choice('more-heat', 'The heater delivered more energy to the iron')
      ]
    },
    hints: [
      'Compare the mass and the heat on the two plates before you compare the rises.',
      'Read the c printed inside each sample and compare the two values.',
      'A sample with a small c warms a lot for each joule it receives, and one with a large c warms very little.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a reason.' };
      if (state.choice === 'bucket') return { ok: true };
      if (state.choice === 'heavier') return { ok: false, msg: 'Read the mass label on each plate before you compare weights.' };
      return { ok: false, msg: 'Read the heat delivered on each plate: the two samples receive equal amounts.' };
    },
    reward: {
      log: 'Water takes far more heat per degree than iron.',
      title: 'Specific Heat Capacity',
      body: 'The heat needed to raise one gram of a substance by one degree is its specific heat capacity, c. Water’s is unusually large, so it warms slowly and stores a great deal of heat.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-warm-water',
    title: 'Counting Joules Across Grams and Degrees',
    prompt: 'How many joules warm this 100 g water bath from 20.0 °C to 25.0 °C, to the nearest 50 J?',
    briefing: {
      speaker: SPEAKER,
      body: 'The plate gives the bath’s mass and its temperature rise but not the heat that caused it.'
    },
    rigs: [
      {
        id: 'warm', label: '100 g Water Bath', head: 'cup', hideHeat: true, hideVerdict: true,
        waterMass: 100, waterTInit: 20.0, TFinal: 25.0, sublabel: '100 g of water'
      }
    ],
    reference: [FORMULA, C_WATER],
    widget: { type: 'number', label: 'Heat in joules', min: 1000, max: 3500, step: 50, start: 1500 },
    hints: [
      'Read the bath’s mass and its temperature rise from the plate.',
      'Compare what each gram of water needs for one degree with how many grams and how many degrees there are.',
      'Multiply the mass, the specific heat capacity and the temperature rise together.'
    ],
    check(state) {
      if (Math.abs(state.number - Q_STAGE3) <= 25) return { ok: true };
      return { ok: false, msg: 'Check that the sum uses the mass, the specific heat capacity and the rise, each once.' };
    },
    reward: {
      log: 'Heat is mass times c times the rise.',
      title: 'q = m × c × ΔT',
      body: 'The heat a sample takes in is its mass times its specific heat capacity times its temperature rise. Every gram of water absorbed 4.184 J for each degree of the rise.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-drop-block',
    title: 'Metal Into Water',
    prompt: 'Find the specific heat capacity of Metal M from the block and bath readings on the plate.',
    briefing: {
      speaker: SPEAKER,
      body: 'A hot block of Metal M is dropped into a weighed bath inside the lidded cup. Nothing can leave the cup.'
    },
    rigs: [
      {
        id: 'drop', label: 'Submerged Metal Block', head: 'cup', hideHeat: true, hideVerdict: true,
        waterMass: 100, waterTInit: 20.0,
        block: { label: 'Metal M', symbol: 'M', mass: 50.0, TInit: 65.4, c: 0.386 }
      }
    ],
    reference: [FORMULA, C_WATER],
    widget: { type: 'decimal', label: 'Specific heat capacity of Metal M (J/(g·°C))', min: 0.15, max: 0.90, step: 0.03 },
    hints: [
      'Read the bath’s mass and temperature rise, then the block’s mass and starting temperature.',
      'Compare the heat the bath gained with the heat the block must have lost, since the lid keeps all of it inside.',
      'Divide the heat the bath gained by the block’s mass times its temperature drop.'
    ],
    check(state) {
      if (Math.abs(state.decimal - C_STAGE4) <= 0.02) return { ok: true };
      return { ok: false, msg: 'Check which temperature change belongs to the bath and which to the block, and whose mass goes where.' };
    },
    reward: {
      log: 'The bath’s gain was the block’s loss.',
      title: 'Heat Lost Equals Heat Gained',
      body: 'In an insulated cup, the heat gained by the bath equals the heat lost by the metal. That equality turns a thermometer rise in the water into the specific heat capacity of the block.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-identify-metal',
    title: 'Naming the Metal from Its Bucket Size',
    prompt: 'Name Metal M from the specific heat capacity you measured.',
    briefing: {
      speaker: SPEAKER,
      body: 'Each pure metal has a value of its own, and the plate lists four to choose from.'
    },
    rigs: [
      {
        id: 'drop', label: 'Metal M Assay', head: 'cup', hideHeat: true, hideVerdict: true,
        waterMass: 100, waterTInit: 20.0,
        block: { label: 'Metal M', symbol: 'M', mass: 50.0, TInit: 65.4, c: 0.385 }
      }
    ],
    reference: [
      'Aluminium: c = 0.90 J/(g·°C)',
      'Iron: c = 0.45 J/(g·°C)',
      'Copper: c = 0.39 J/(g·°C)',
      'Silver: c = 0.24 J/(g·°C)'
    ],
    widget: {
      type: 'choice',
      label: 'Identity of Metal M',
      options: [
        choice('cu', 'Copper'),
        choice('al', 'Aluminium'),
        choice('fe', 'Iron'),
        choice('ag', 'Silver')
      ]
    },
    hints: [
      'Use the value you found for Metal M on the last stage.',
      'Compare that value with the four listed on the plate.',
      'Pick the metal whose listed value is closest to yours.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose a metal.' };
      if (state.choice === 'cu') return { ok: true };
      return { ok: false, msg: 'That metal’s listed value is not the one you measured on the last stage.' };
    },
    reward: {
      log: 'The measured c matched one metal on the list.',
      title: 'A Fingerprint',
      body: 'Specific heat capacity belongs to the material, not to the sample, so measuring it can name an unknown metal. A heavier atom means fewer atoms per gram and less heat per degree.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-reaction-cup',
    title: 'Catching a Reaction’s Heat in the Cup',
    prompt: 'How many joules did the reaction release into the 100 g bath, to the nearest 50 J?',
    briefing: {
      speaker: SPEAKER,
      body: 'This time the heat comes from chemicals reacting in the water, and the bath catches it the same way it caught the metal’s.'
    },
    rigs: [
      {
        id: 'rxn', label: 'Neutralisation Run', head: 'cup', hideHeat: true, hideVerdict: true,
        waterMass: 100, waterTInit: 21.0, TFinal: 27.0,
        reaction: { label: 'H⁺ + OH⁻ → H₂O', moles: 0.045, q: 2510 }
      }
    ],
    reference: [FORMULA, 'c of the solution = 4.184 J/(g·°C)'],
    widget: { type: 'number', label: 'Heat in joules', min: 1500, max: 3500, step: 50, start: 2000 },
    hints: [
      'Read the bath’s mass and its temperature rise from the plate.',
      'Compare this run with the stage where you warmed a bath by a known amount.',
      'The heat the bath gained is its mass times c times its rise, and the reaction released that much.'
    ],
    check(state) {
      if (Math.abs(state.number - Q_STAGE6) <= 25) return { ok: true };
      return { ok: false, msg: 'Check that the sum uses the bath’s mass, its c and its own rise.' };
    },
    reward: {
      log: 'The reaction’s heat was read from the bath.',
      title: 'The Calorimeter',
      body: 'An insulated vessel that measures the heat of a change from the temperature shift of its bath is a calorimeter. The bath’s gain is the heat the reaction released.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-per-mole',
    title: 'Scaling From This Cup to One Mole',
    prompt: 'How many kilojoules would one whole mole of this reaction release?',
    briefing: {
      speaker: SPEAKER,
      body: 'The cup held only a small fraction of a mole, and a bigger scoop would have warmed the bath more.'
    },
    rigs: [
      {
        id: 'rxn', label: 'Neutralisation Run (0.045 mol)', head: 'cup', hideHeat: true, hideVerdict: true,
        waterMass: 100, waterTInit: 21.0, TFinal: 27.0,
        reaction: { label: '0.045 mol H⁺ + OH⁻', moles: 0.045, q: 2510 }
      }
    ],
    reference: [FORMULA, 'c of the solution = 4.184 J/(g·°C)', '1 kJ = 1000 J'],
    widget: { type: 'number', label: 'Heat per mole (kJ/mol)', min: 40, max: 80, step: 2 },
    hints: [
      'Work out the heat the cup caught, and put it in kilojoules.',
      'Compare the moles that reacted with the single mole you are asked about.',
      'Divide the heat in kilojoules by the moles that reacted.'
    ],
    check(state) {
      if (Math.abs(state.number - PER_MOLE) <= 1) return { ok: true };
      return { ok: false, msg: 'Check that the heat is in kilojoules, and that it is divided by the moles that reacted rather than multiplied.' };
    },
    reward: {
      log: 'The cup’s heat, scaled to one mole.',
      title: 'Heat per Mole',
      body: 'Dividing the heat by the moles that reacted gives a figure that does not depend on the size of the scoop. It is the heat released per mole of reaction, in kilojoules per mole.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-lid-off',
    title: 'Why the Lid Matters',
    prompt: 'Press "Lift Lid" and decide how an open cup changes the heat you would calculate.',
    briefing: {
      speaker: SPEAKER,
      body: 'Every sum so far assumed that all the reaction’s heat stayed in the bath. Open the cup and compare the thermometer.'
    },
    rigs: [
      {
        id: 'open', label: 'Calorimeter Lid Test', head: 'cup', hideHeat: true, hideVerdict: true,
        waterMass: 100, waterTInit: 21.0, allowLidToggle: true,
        reaction: { label: '0.045 mol neutralisation', moles: 0.045, q: 2510 }
      }
    ],
    toggleAction: { group: 'Vessel', label: 'Lift Lid' },
    widget: {
      type: 'choice',
      label: 'The calculated heat with the lid off',
      options: [
        choice('small', 'Too small'),
        choice('large', 'Too large'),
        choice('none', 'Unchanged')
      ]
    },
    hints: [
      'Press "Lift Lid" and compare the temperature rise with the lid off and on.',
      'Compare the heat the reaction released with the heat the bath actually caught.',
      'You calculate heat from the bath’s rise, so any heat that never reaches the bath goes missing from the sum.'
    ],
    check(state) {
      if (!state.choice) return { ok: false, notYet: true, msg: 'Choose how the calculated heat changes.' };
      if (state.choice === 'small') return { ok: true };
      if (state.choice === 'large') return { ok: false, msg: 'Heat that escapes into the room cannot make the bath warm more than it should.' };
      return { ok: false, msg: 'Press "Lift Lid" and compare the two rises: the bath is not reporting the same heat.' };
    },
    reward: {
      log: 'An open cup under-reads the heat.',
      title: 'Heat Lost to the Room',
      body: 'Heat that leaks into the air never warms the bath, so the rise is smaller and the calculated heat is too low. That is why a calorimeter wears a lid and is insulated.'
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
      body: 'A weighed bath turns a thermometer rise into joules by q = m × c × ΔT. In an insulated cup the bath’s gain equals the reaction’s release, and dividing by the moles that reacted gives the heat per mole.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Nobody can put a joule meter inside a bond. Every heat figure in the rest of this world was first caught this way, in a bath with a lid.'
    },
    {
      heading: 'Next',
      body: 'The next bench gives that heat per mole a sign, so that releasing and absorbing can be told apart on paper.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'How much heat does 50.0 g of water absorb when it warms from 20.0 °C to 30.0 °C? (c = 4.184 J/(g·°C))',
    options: [
      { id: 'a', label: '2090 J' },
      { id: 'b', label: '1050 J' },
      { id: 'c', label: '4180 J' },
      { id: 'd', label: '209 J' }
    ],
    answer: 'a',
    explanation: 'The heat is mass times c times the rise: 50.0 g × 4.184 J/(g·°C) × 10.0 °C, which is about 2090 J.'
  },
  {
    question: 'Two 100 g blocks, one aluminium (c = 0.90 J/(g·°C)) and one silver (c = 0.24 J/(g·°C)), each absorb 900 J. Which warms more?',
    options: [
      { id: 'a', label: 'Silver, because each gram needs less heat per degree' },
      { id: 'b', label: 'Aluminium, because its specific heat capacity is larger' },
      { id: 'c', label: 'Both rise by the same amount, because their masses are equal' }
    ],
    answer: 'a',
    explanation: 'The rise is q divided by m times c, so for the same heat and mass the metal with the smaller c warms more.'
  },
  {
    question: 'A 100 g metal sample cools by 50.0 °C while a water bath absorbs 4500 J from it. What is the metal’s specific heat capacity?',
    options: [
      { id: 'a', label: '0.90 J/(g·°C)' },
      { id: 'b', label: '0.45 J/(g·°C)' },
      { id: 'c', label: '1.80 J/(g·°C)' },
      { id: 'd', label: '90 J/(g·°C)' }
    ],
    answer: 'a',
    explanation: 'Divide the heat by the mass times the temperature drop: 4500 J divided by 100 g times 50.0 °C gives 0.90 J/(g·°C).'
  },
  {
    question: 'In a coffee-cup calorimeter, 0.020 mol of a salt dissolves and absorbs 520 J from the bath. How much heat is absorbed per mole?',
    options: [
      { id: 'a', label: '26 kJ/mol' },
      { id: 'b', label: '10.4 kJ/mol' },
      { id: 'c', label: '2.6 kJ/mol' },
      { id: 'd', label: '0.026 kJ/mol' }
    ],
    answer: 'a',
    explanation: 'Convert 520 J to 0.520 kJ and divide by the 0.020 mol that dissolved, which gives 26 kJ per mole.'
  },
  {
    question: 'A student runs an exothermic neutralisation in a thin metal beaker instead of an insulated cup. How does the calculated heat compare with the true value?',
    options: [
      { id: 'a', label: 'It is too low, because heat leaks through the walls instead of warming the solution' },
      { id: 'b', label: 'It is too high, because the metal conducts extra heat to the thermometer' },
      { id: 'c', label: 'It is unchanged, because the moles of acid and base are unchanged' }
    ],
    answer: 'a',
    explanation: 'Heat lost through the walls lowers the measured rise, so the heat calculated from the rise is smaller than the true value.'
  }
];

/* ------------------------------------------------------------------
   BENCH STATE
   ------------------------------------------------------------------ */
export const SOLUTIONS = [
  { choice: 'half' },
  { choice: 'bucket' },
  { number: 2100 },
  { decimal: 0.39 },
  { choice: 'cu' },
  { number: 2500 },
  { number: 56 },
  { choice: 'small' }
];

export const MISSES = [
  { choice: 'double' },
  { choice: 'heavier' },
  { number: 1500 },
  { decimal: 0.24 },
  { choice: 'al' },
  { number: 3000 },
  { number: 40 },
  { choice: 'large' }
];

export const stateFor = makeStateFor(STAGES);

export function mount(container, ctx) {
  return mountThermo(container, ctx, { STAGES, DEBRIEF, toolNoteFor });
}
