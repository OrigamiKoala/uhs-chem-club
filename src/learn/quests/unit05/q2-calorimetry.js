/**
 * Unit 5 · Bench 2 — Calorimetry (q2-calorimetry)
 *
 * The sampling shelf at the hot spring's edge, and Ember Reach's second TABLETOP (plan `bench-tabletop.md`, phase T6), on the heat kit
 * (`table/kits/heat.js`). The lidded cup with a weighed bath. The player gives the bath a known amount of heat and watches how far the
 * thermometer climbs, then runs the sum backwards: from a thermometer rise to joules, to a metal's name, to a heat per mole.
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
 * THE EVIDENCE IS ON THE BENCH. Every cup that asks for a heat prints no heat (`showHeat` off): the joules are worked out from the
 * mass, the specific heat capacity and the temperature rise on the thermometer. The sum itself is given on a plaque, because a formula
 * a stage needs is never withheld.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, block, charge, tag, stmt, cupFixture, plaqueFixture, markerFixture, cupRead, markerRead, whereIs, dialAt,
  SPECIFIC_HEAT_WATER, heatTransfer, blockSpecificHeat
} from '../../table/kits/heat.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bheat capacity\b/i, introducedAt: 1 },
  { term: /\bspecific heat capacity\b/i, introducedAt: 2 },
  { term: /\bcalorimeter\b/i, introducedAt: 6 }
];

/** The bench reads a thermometer as particle motion, and counts in moles. */
export const BUILDS_ON = ['unit04/q1-knocks', 'unit01/q6-weigh'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const FORMULA = 'q = m × c × ΔT';
const C_WATER = 'c of water = 4.184 J/(g·°C)';
const MOUTH = 'slot:cup.mouth';

// Stage 3: 100 g of water from 20.0 to 25.0 degrees takes 2092 J.
const Q_STAGE3 = heatTransfer(100, SPECIFIC_HEAT_WATER, 5);
// Stage 4: 100 g of water at 20.0 and a 50.0 g block of Metal M (c = 0.386) at 65.4 degrees; the bath settles at 22.0.
const BLOCK_M = { m: 50, c: 0.386, T: 65.4 };
const C_STAGE4 = Number(blockSpecificHeat(50, 65.4, 100, 20.0, 22.0).toFixed(2));
// Stage 6: 100 g of solution warms by 6.0 degrees, which is 2510 J, from 0.045 mol.
const Q_STAGE6 = heatTransfer(100, SPECIFIC_HEAT_WATER, 6.0);
const MOLES_6 = 0.045;
const DH_6 = -Q_STAGE6 / 1000 / MOLES_6;
// Stage 7: that heat spread over 0.045 mol.
const PER_MOLE = Q_STAGE6 / 1000 / MOLES_6;

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const a = cupFixture('cupA', { x: 28, y: 33 }, { title: 'Cup A · 100 g', water: 100, T0: 20, joules: 4184 });
    const b = cupFixture('cupB', { x: 84, y: 33 }, { title: 'Cup B · 200 g', water: 200, T0: 20, joulesList: [0, 2092, 4184, 6276, 8368, 10460], joulesStart: 1 });
    return {
      id: 's1-mass-water',
      title: 'Sharing the Same Joules',
      prompt: 'Set Cup B\'s heater so its bath rises as far as Cup A\'s.',
      briefing: {
        speaker: SPEAKER,
        body: 'Two insulated cups hold water, 100 g in one and 200 g in the other, and an electric heater warms each. Press Submit when the table shows your answer.'
      },
      widget,
      table: heatTable({ fixtures: [a.fixture, b.fixture], zones: { slots: [a.slot, b.slot] } }),
      hints: [
        'Turn Cup B\'s Heater dial and watch its bath thermometer beside Cup A\'s.',
        'Compare the two rises at each setting, and the two masses of water.',
        'Twice the water means the same energy is shared among twice as many particles.'
      ],
      check(state) {
        const t = state.table;
        const A = cupRead(t, 'cupA'); const B = cupRead(t, 'cupB');
        if (B.joules === 0) return { ok: false, notYet: true, msg: 'Cup B\'s heater is off: turn it and watch its bath.' };
        if (Math.abs(B.dT - A.dT) < 0.05) return { ok: true };
        return B.dT < A.dT
          ? { ok: false, msg: 'Cup B\'s bath has not risen as far as Cup A\'s: compare the two rises under the thermometers.' }
          : { ok: false, msg: 'Cup B\'s bath has risen further than Cup A\'s: compare the two rises under the thermometers.' };
      },
      reward: {
        log: 'Twice the water needed twice the heat.',
        title: 'Heat Capacity',
        body: 'The heat a sample needs to rise by one degree is its heat capacity. Doubling the mass doubles the heat capacity, so the same rise takes twice the heat.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const a = cupFixture('water', { x: 28, y: 33 }, { title: '100 g Water', water: 100, T0: 20, joules: 4184 });
    const b = cupFixture('iron', { x: 84, y: 33 }, { title: '100 g Iron', water: 100, c: 0.449, T0: 20, joulesList: [225, 449, 898, 2092, 4184], joulesStart: 5 });
    return {
      id: 's2-water-vs-iron',
      title: 'Different Thermal Buckets',
      prompt: 'Set the iron\'s heater so the iron rises as far as the water does.',
      widget,
      table: heatTable({ fixtures: [a.fixture, b.fixture], zones: { slots: [a.slot, b.slot] } }),
      hints: [
        'Turn the iron\'s Heater dial and watch its thermometer beside the water\'s.',
        'Compare the heat each sample needs for the same rise, and the mass of each.',
        'A sample with a small c warms a lot for each joule it receives, and one with a large c warms very little.'
      ],
      check(state) {
        const t = state.table;
        const W = cupRead(t, 'water'); const I = cupRead(t, 'iron');
        if (Math.abs(I.dT - W.dT) < 0.1) return { ok: true };
        return I.dT > W.dT
          ? { ok: false, msg: 'The iron has risen further than the water: it needs less heat for the same rise.' }
          : { ok: false, msg: 'The iron has not risen as far as the water yet: compare the two rises.' };
      },
      reward: {
        log: 'Water takes far more heat per degree than iron.',
        title: 'Specific Heat Capacity',
        body: 'The heat needed to raise one gram of a substance by one degree is its specific heat capacity, c. Water\'s is unusually large, so it warms slowly and stores a great deal of heat.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: '100 g Water Bath', water: 100, T0: 20, joules: Q_STAGE3 });
    return {
      id: 's3-warm-water',
      title: 'Counting Joules Across Grams and Degrees',
      prompt: 'Set the marker to the joules that warm this 100 g water bath from 20.0 °C to 25.0 °C.',
      widget,
      table: heatTable({
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 118, y: 18 }, [FORMULA, C_WATER], { w: 52 }),
          markerFixture('joules', 'Heat caught', { x: 118, y: 42 }, { min: 1000, max: 3500, step: 50, start: 1500, unit: 'J', w: 52 })
        ],
        zones: { slots: [a.slot] }
      }),
      hints: [
        'Read the bath\'s mass and its temperature rise from the cup.',
        'Compare what each gram of water needs for one degree with how many grams and how many degrees there are.',
        'Multiply the mass, the specific heat capacity and the temperature rise together.'
      ],
      check(state) {
        const v = markerRead(state.table, 'joules');
        if (Math.abs(v - Q_STAGE3) <= 25) return { ok: true };
        return { ok: false, msg: 'Check that the sum uses the mass, the specific heat capacity and the rise, each once.' };
      },
      reward: {
        log: 'Heat is mass times c times the rise.',
        title: 'q = m × c × ΔT',
        body: 'The heat a sample takes in is its mass times its specific heat capacity times its temperature rise. Every gram of water absorbed 4.184 J for each degree of the rise.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: '100 g Water Bath', water: 100, T0: 20 });
    return {
      id: 's4-drop-block',
      title: 'Metal Into Water',
      prompt: 'Find the specific heat capacity of Metal M from the block and bath readings.',
      widget,
      table: heatTable({
        pieces: [
          block('metal', 'Metal M', { x: 76, y: 22 }, { ...BLOCK_M, mass: '50.0 g' }),
          { ...stmt('tag', 'Basket tag: held in the spring at 65.4 °C', { x: 84, y: 52 }), hidden: true, fetchFrom: 'edge' }
        ],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 120, y: 14 }, [FORMULA, C_WATER], { w: 52 }),
          markerFixture('c', 'Specific heat of Metal M', { x: 120, y: 36 }, { min: 0.15, max: 0.9, step: 0.03, start: 0.15, unit: 'J/(g·°C)', w: 52 })
        ],
        zones: { slots: [a.slot] },
        fetch: [{ id: 'edge', label: 'Spring Basket', at: { x: 126, y: 55 } }]
      }),
      hints: [
        'Drop Metal M in the cup\'s mouth and read the bath thermometer before and after.',
        'Compare the heat the bath gained with the heat the block must have lost, since the lid keeps all of it inside.',
        'Divide the heat the bath gained by the block\'s mass times its temperature drop.'
      ],
      check(state) {
        const v = markerRead(state.table, 'c');
        if (v === 0.15) return { ok: false, notYet: true, msg: 'Drop Metal M in the cup, then set the marker to its specific heat capacity.' };
        if (Math.abs(v - C_STAGE4) <= 0.02) return { ok: true };
        return { ok: false, msg: 'Check which temperature change belongs to the bath and which to the block, and whose mass goes where.' };
      },
      reward: {
        log: 'The bath\'s gain was the block\'s loss.',
        title: 'Heat Lost Equals Heat Gained',
        body: 'In an insulated cup, the heat gained by the bath equals the heat lost by the metal. That equality turns a thermometer rise in the water into the specific heat capacity of the block.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: '100 g Water Bath', water: 100, T0: 20 });
    const names = [['al', 'Aluminium'], ['fe', 'Iron'], ['cu', 'Copper'], ['ag', 'Silver']];
    return {
      id: 's5-identify-metal',
      title: 'Naming the Metal from Its Bucket Size',
      prompt: 'Name Metal M from the specific heat capacity you can measure.',
      widget,
      table: heatTable({
        pieces: [
          block('metal', 'Metal M', { x: 76, y: 22 }, { m: 50, c: 0.385, T: 65.4, mass: '50.0 g' }),
          ...names.map(([id, label], i) => tag(id, label, { x: 70 + (i % 2) * 28, y: 44 + Math.floor(i / 2) * 13 }))
        ],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'Specific heat capacities', { x: 124, y: 16 }, ['Aluminium: 0.90 J/(g·°C)', 'Iron: 0.45 J/(g·°C)', 'Copper: 0.39 J/(g·°C)', 'Silver: 0.24 J/(g·°C)'], { w: 48 })
        ],
        zones: { slots: [a.slot, { id: 'answer', label: 'Metal M is', at: { x: 130, y: 50 }, size: { w: 28, h: 12 } }] }
      }),
      hints: [
        'Drop Metal M in the cup\'s mouth and work out its specific heat capacity from the bath\'s rise.',
        'Compare the value you worked out with the four listed on the plaque.',
        'Put the name of the metal whose listed value is closest to yours in the slot.'
      ],
      check(state) {
        const t = state.table;
        const p = Object.values(t.pieces).find(q => q.zone === 'slot:answer');
        if (!p) return { ok: false, notYet: true, msg: 'Put a name in the slot.' };
        if (p.id === 'cu') return { ok: true };
        return { ok: false, msg: 'That metal\'s listed value is not the one the bath\'s rise gives for Metal M.' };
      },
      reward: {
        log: 'The measured c matched one metal on the list.',
        title: 'A Fingerprint',
        body: 'Specific heat capacity belongs to the material, not to the sample, so measuring it can name an unknown metal. A heavier atom means fewer atoms per gram and less heat per degree.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: '100 g Solution', water: 100, T0: 21 });
    return {
      id: 's6-reaction-cup',
      title: 'Catching a Reaction\'s Heat in the Cup',
      prompt: 'Set the marker to the joules the reaction released into the 100 g bath.',
      briefing: {
        speaker: SPEAKER,
        body: 'This time the heat comes from chemicals reacting in the water, and the bath catches it the same way it caught the metal\'s.'
      },
      widget,
      table: heatTable({
        pieces: [charge('rxn', 'H⁺ + OH⁻', { x: 76, y: 22 }, { moles: MOLES_6, dH: DH_6 })],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 120, y: 18 }, [FORMULA, 'c of the solution = 4.184 J/(g·°C)'], { w: 52 }),
          markerFixture('joules', 'Heat released', { x: 120, y: 42 }, { min: 1500, max: 3500, step: 50, start: 2000, unit: 'J', w: 52 })
        ],
        zones: { slots: [a.slot] }
      }),
      hints: [
        'Drop the charge in the cup\'s mouth and read the bath\'s mass and its temperature rise.',
        'Compare this run with the stage where you warmed a bath by a known amount.',
        'The heat the bath gained is its mass times c times its rise, and the reaction released that much.'
      ],
      check(state) {
        const v = markerRead(state.table, 'joules');
        if (Math.abs(v - Q_STAGE6) <= 25) return { ok: true };
        return { ok: false, msg: 'Check that the sum uses the bath\'s mass, its c and its own rise.' };
      },
      reward: {
        log: 'The reaction\'s heat was read from the bath.',
        title: 'The Calorimeter',
        body: 'An insulated vessel that measures the heat of a change from the temperature shift of its bath is a calorimeter. The bath\'s gain is the heat the reaction released.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: '100 g Solution', water: 100, T0: 21 });
    return {
      id: 's7-per-mole',
      title: 'Scaling From This Cup to One Mole',
      prompt: 'Set the marker to the kilojoules one whole mole of this reaction would release.',
      widget,
      table: heatTable({
        pieces: [charge('rxn', '0.045 mol H⁺ + OH⁻', { x: 76, y: 22 }, { moles: MOLES_6, dH: DH_6 })],
        fixtures: [
          a.fixture,
          plaqueFixture('ref', 'What you may use', { x: 120, y: 15 }, [FORMULA, 'c of the solution = 4.184 J/(g·°C)', '1 kJ = 1000 J'], { w: 52 }),
          markerFixture('perMole', 'Heat per mole', { x: 120, y: 42 }, { min: 40, max: 80, step: 2, start: 40, unit: 'kJ/mol', w: 52 })
        ],
        zones: { slots: [a.slot] }
      }),
      hints: [
        'Work out the heat the cup caught, and put it in kilojoules.',
        'Compare the moles that reacted with the single mole you are asked about.',
        'Divide the heat in kilojoules by the moles that reacted.'
      ],
      check(state) {
        const v = markerRead(state.table, 'perMole');
        if (v === 40) return { ok: false, notYet: true, msg: 'Set the marker to the heat per mole.' };
        if (Math.abs(v - PER_MOLE) <= 1) return { ok: true };
        return { ok: false, msg: 'Check that the heat is in kilojoules, and that it is divided by the moles that reacted rather than multiplied.' };
      },
      reward: {
        log: 'The cup\'s heat, scaled to one mole.',
        title: 'Heat per Mole',
        body: 'Dividing the heat by the moles that reacted gives a figure that does not depend on the size of the scoop. It is the heat released per mole of reaction, in kilojoules per mole.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const a = cupFixture('cup', { x: 28, y: 33 }, { title: '100 g Solution', water: 100, T0: 21, lid: true, showLid: true, record: true });
    const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
    return {
      id: 's8-lid-off',
      title: 'Why the Lid Matters',
      prompt: 'Predict how the heat you calculate from the bath changes with the lid off, then test it.',
      widget,
      table: heatTable({
        pieces: [charge('rxn', '0.045 mol H⁺ + OH⁻', { x: 76, y: 22 }, { moles: MOLES_6, dH: DH_6 })],
        fixtures: [a.fixture],
        zones: { slots: [a.slot] },
        prediction: {
          slot: { id: 'predict', label: 'Calculated heat, lid off', at: { x: 118, y: 32 }, size: { w: 30, h: 12 } },
          tokens: [token('small', 'Too small', 90), token('large', 'Too large', 116), token('none', 'Unchanged', 141)]
        }
      }),
      hints: [
        'Place a prediction, drop the charge in the cup, set the Lid dial to off and press Record.',
        'Compare the temperature rise with the lid off and with the lid on.',
        'You calculate heat from the bath\'s rise, so any heat that never reaches the bath goes missing from the sum.'
      ],
      check(state) {
        const t = state.table;
        const token = t.prediction.token;
        if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
        if (token === 'small') return { ok: true };
        if (t.prediction.tested) return token === 'large'
          ? { ok: false, msg: 'Heat that escapes into the room cannot make the bath warm more than it should.' }
          : { ok: false, msg: 'Compare the two rises, with the lid on and off: the bath is not reporting the same heat.' };
        return { ok: false, msg: 'Drop the charge in the cup, turn the Lid dial to off, press Record and compare the rises.' };
      },
      reward: {
        log: 'An open cup under-reads the heat.',
        title: 'Heat Lost to the Room',
        body: 'Heat that leaks into the air never warms the bath, so the rise is smaller and the calculated heat is too low. That is why a calorimeter wears a lid and is insulated.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Turn Cup B\'s Heater dial.'],
  2: ['Turn the iron\'s Heater dial.'],
  3: ['Set the marker; the cup prints no heat.'],
  4: ['Drag Metal M onto the cup, then set the marker.'],
  5: ['Drag Metal M onto the cup; drag a name into the slot.'],
  6: ['Drag the charge onto the cup, then set the marker.'],
  7: ['Drag the charge onto the cup, then set the marker.'],
  8: ['Place a prediction; drag the charge onto the cup;', 'turn the Lid dial; press Record.']
};
applyNotes(STAGES, NOTES);

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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

export const SOLUTIONS = [
  [dial('cupB', 'heat', 5)],
  [dial('iron', 'heat', 2)],
  [dial('joules', 'value', 2100)],
  [{ fetch: 'edge' }, put('metal', MOUTH), dial('c', 'value', 0.39)],
  [put('metal', MOUTH), put('cu', 'slot:answer')],
  [put('rxn', MOUTH), dial('joules', 'value', 2500)],
  [put('rxn', MOUTH), dial('perMole', 'value', 56)],
  [{ predict: 'small' }, put('rxn', MOUTH), dial('cup', 'lid', 2), { run: 'cup' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('cupB', 'heat', 3)],
  [dial('iron', 'heat', 5)],
  [dial('joules', 'value', 3000)],
  [put('metal', MOUTH), dial('c', 'value', 0.9)],
  [put('metal', MOUTH), put('fe', 'slot:answer')],
  [put('rxn', MOUTH), dial('joules', 'value', 1500)],
  [put('rxn', MOUTH), dial('perMole', 'value', 70)],
  [{ predict: 'large' }, put('rxn', MOUTH), dial('cup', 'lid', 2), { run: 'cup' }]
];

function blankState() { return {}; }

/** Build a full bench state for stage `i` from one of the sets above. */
export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { cupRead, Q_STAGE3, C_STAGE4, Q_STAGE6, PER_MOLE, BLOCK_M };
