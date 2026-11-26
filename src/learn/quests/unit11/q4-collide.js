/**
 * Unit 11 · Bench 4 — Collisions and the Hill (q4-collide)
 *
 * CED 5.5 (Collision Model), 5.6 (Reaction Energy Profile).
 * Seven stages teaching collision energy + orientation, Maxwell-Boltzmann shift,
 * transition state peak, reverse activation energy, and kinetic vs thermodynamic control.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember } from '../../engine/predict.js';
import {
  rateTable,
  rateLeadFixture,
  collviewFixture,
  mbhistFixture,
  kprofileFixture,
  arrplotFixture,
  stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 9 };

export const VOCABULARY = [
  { term: /\bactivation energy\b/i, introducedAt: 2 },
  { term: /\borientation\b/i, introducedAt: 3 },
  { term: /\btransition state\b/i, introducedAt: 5 }
];

const SPEAKER = 'Vess';

const widget = {
  type: 'table',
  inspect() { return []; }
};

function toolNoteFor() {
  return '';
}

const DEBRIEF = {
  title: 'Bench 4 cleared',
  body: 'Collisions react only when they bring at least the activation energy Ea and meet at the right angle. Warming moves more particles past the fixed Ea barrier.',
  filed: 'Filed: cold fuel sits safely because few collisions clear the activation energy hill until warming raises the spread.'
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-lead',
    title: 'Every Collision?',
    predict: true,
    briefing: {
      speaker: SPEAKER,
      body: 'Reactants are the starting particles. Watch them collide and see how many collisions produce product.'
    },
    prompt: 'Out of all the collisions between reactant particles, how many lead to a reaction?',
    widget,
    table: rateTable({
      pieces: [
        stmt('all', 'All of them', { x: 112, y: 10 }),
        stmt('half', 'About half', { x: 112, y: 24 }),
        stmt('few', 'A small share', { x: 112, y: 38 })
      ],
      fixtures: [
        rateLeadFixture('lead', { x: 42, y: 28 }, {
          scene: 'collide',
          title: 'Collision preview',
          w: 70,
          h: 38
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'My prediction', at: { x: 112, y: 52 }, size: { w: 46, h: 12 } }]
      }
    }),
    hints: [
      'Watch the particles in the preview and compare the Collisions and Reacted counters.',
      'Count how many collisions end with particles simply bouncing apart.',
      'Most collisions bounce off unchanged instead of reacting.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place one prediction card in "My prediction".' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (card) remember('unit11/q4-collide', card.id);
    },
    reward: {
      log: 'Prediction locked for the collision tests.',
      title: 'Prediction Locked',
      body: 'Prediction locked. The next stages slow collisions down so you can see why some react and others bounce off.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-energy',
    title: 'Energy Threshold',
    briefing: {
      speaker: SPEAKER,
      body: 'To react, colliding particles must break old bonds. The minimum energy needed is the activation energy, Ea (marked by the amber bar on the right).'
    },
    prompt: 'Why did the slow pair bounce back unchanged while the fast pair reacted?',
    widget,
    table: rateTable({
      pieces: [
        stmt('below', 'Below activation energy', { x: 114, y: 10 }),
        stmt('angle', 'Wrong collision angle', { x: 114, y: 24 }),
        stmt('count', 'Particles are too heavy', { x: 114, y: 38 })
      ],
      fixtures: [
        collviewFixture('view', { x: 44, y: 28 }, {
          title: 'Speed test',
          mode: 'energy',
          pairs: [
            { label: 'Slow', speed: 0.4, angle: 0, reacts: false, note: 'Too slow: bounces apart' },
            { label: 'Fast', speed: 1.0, angle: 0, reacts: true, note: 'Above Ea: bonds rearrange' }
          ],
          w: 76,
          h: 44
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Reason', at: { x: 114, y: 52 }, size: { w: 46, h: 12 } }]
      }
    }),
    hints: [
      'Switch the "Pair" dial between Slow and Fast and press "Play".',
      'Compare each pair\'s energy bar to the Ea line on the right.',
      'Breaking old bonds takes a minimum amount of collision energy.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Reason".' };
      if (card.id === 'angle') return { ok: false, msg: 'Both pairs collide head-on along the same line.' };
      if (card.id === 'count') return { ok: false, msg: 'Both pairs use the exact same particles, so only their speed differs.' };
      return { ok: true };
    },
    reward: {
      log: 'Collisions below Ea bounce back unchanged.',
      title: 'Activation Energy',
      body: 'A collision must reach the activation energy (Ea) before old bonds can stretch and break.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-orientation',
    title: 'Geometry Matters',
    prompt: 'Why does only one of these equal-speed pairs react?',
    widget,
    table: rateTable({
      pieces: [
        stmt('orient', 'Only one pair is lined up', { x: 114, y: 10 }),
        stmt('lowerEa', 'One pair has a different bond', { x: 114, y: 24 }),
        stmt('hotter', 'One pair is heavier', { x: 114, y: 38 })
      ],
      fixtures: [
        collviewFixture('view', { x: 44, y: 28 }, {
          title: 'Angle test',
          mode: 'orientation',
          pairs: [
            { label: 'Sideways', speed: 1.0, angle: 90, reacts: false, note: 'Reactive ends miss' },
            { label: 'Head-on', speed: 1.0, angle: 0, reacts: true, note: 'Reactive ends meet' }
          ],
          w: 76,
          h: 44
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Reason', at: { x: 114, y: 52 }, size: { w: 46, h: 12 } }]
      }
    }),
    hints: [
      'Switch the "Pair" dial between Sideways and Head-on and press "Play".',
      'Watch whether the ringed reactive ends touch on impact.',
      'Both pairs have the same molecules and speed; only how they line up differs.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Reason".' };
      if (card.id === 'lowerEa') return { ok: false, msg: 'Both pairs are the same molecules with the same bonds.' };
      if (card.id === 'hotter') return { ok: false, msg: 'Both pairs have the same molecules and the same speed.' };
      return { ok: true };
    },
    reward: {
      log: 'Orientation determines whether reactive atoms meet.',
      title: 'Collision Orientation',
      body: 'Molecules must line up so their ringed reactive ends meet. Sideways hits bounce apart without reacting.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-maxwell-boltzmann',
    title: 'Warming the Spread',
    briefing: {
      speaker: SPEAKER,
      body: 'Temperature is in kelvin (K), where 300 K is about 27 °C and 360 K is about 87 °C. The bars show how many particles have each energy, and the amber bars are past Ea.'
    },
    prompt: 'Why does warming from 300 K to 360 K speed up the reaction?',
    widget,
    table: rateTable({
      pieces: [
        stmt('more', 'More particles clear Ea', { x: 118, y: 10 }),
        stmt('eaDrops', 'Ea itself drops with T', { x: 118, y: 24 }),
        stmt('all', 'Every particle clears Ea', { x: 118, y: 38 })
      ],
      fixtures: [
        mbhistFixture('mb', { x: 48, y: 28 }, {
          title: 'Energy spread',
          Ts: [300, 330, 360],
          Ea: 12,
          eMax: 24,
          w: 84,
          h: 44
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Cause', at: { x: 118, y: 52 }, size: { w: 46, h: 12 } }]
      }
    }),
    hints: [
      'Slide or tap the "Temperature" dial from 300 K to 330 K to 360 K.',
      'Watch the Ea = 12 kJ/mol line and the amber bars to its right.',
      'Check how the amber share changes with temperature, and whether the Ea line moves.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Cause".' };
      if (card.id === 'eaDrops') return { ok: false, msg: 'The Ea line stays fixed at 12 kJ/mol at every temperature.' };
      if (card.id === 'all') return { ok: false, msg: 'At 360 K, most particles are still below Ea (only 4.56% are above).' };
      return { ok: true };
    },
    reward: {
      log: 'Higher T shifts more particles past the fixed Ea threshold.',
      title: 'More Particles Past Ea',
      body: 'Raising temperature leaves the Ea line fixed at 12 kJ/mol, while shifting a larger share of particles past it.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-profile-tap',
    title: 'Top of the Hill',
    briefing: {
      speaker: SPEAKER,
      body: 'This curve is an energy profile, a hill whose height is the Ea barrier from before. The peak at the top is the transition state.'
    },
    prompt: 'How much energy must the reactants gain to reach the top of the hill?',
    entry: { id: 'ea_fwd', label: 'Forward Ea', unit: 'kJ/mol' },
    widget,
    table: rateTable({
      fixtures: [
        kprofileFixture('prof', { x: 75, y: 28 }, {
          title: 'Energy profile',
          reactants: 40,
          ts: 110,
          products: 10,
          showLevels: true,
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Drag the ball along the hill (or read the dashed lines) at the start and at the peak.',
      'Compare the starting reactant energy with the peak energy (transition state).',
      'The climb is the difference between the peak and where the reactants start.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea_fwd');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the activation energy in kJ/mol.' };
      if (Math.abs(val - 70) <= 0.5) return { ok: true };
      if (Math.abs(val - 110) <= 0.5) return { ok: false, msg: 'The top is at 110 kJ/mol, but the reactants start above zero.' };
      if (Math.abs(val - 40) <= 0.5) return { ok: false, msg: '40 kJ/mol is where the reactants start, not how far they must climb.' };
      return { ok: false, msg: 'Compare the start level and the top of the hill.' };
    },
    reward: {
      log: 'Forward Ea = 110 - 40 = 70 kJ/mol.',
      title: 'Activation Energy',
      body: 'The transition state peak is at 110 kJ/mol and the reactants start at 40 kJ/mol, so they must climb 70 kJ/mol.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-reverse-ea',
    title: 'Climbing Back',
    briefing: {
      speaker: SPEAKER,
      body: 'The reverse reaction starts from the products and climbs back up to the same peak.',
      worked: [
        'Another reaction: reactants 20, top 70, products 5 (kJ/mol)',
        'Forward climb: 70 − 20 = 50 kJ/mol'
      ]
    },
    prompt: 'What is the activation energy for the reverse reaction?',
    entry: { id: 'ea_rev', label: 'Reverse Ea', unit: 'kJ/mol' },
    widget,
    table: rateTable({
      fixtures: [
        kprofileFixture('prof', { x: 75, y: 28 }, {
          title: 'Energy profile (kJ/mol)',
          reactants: 30,
          ts: 95,
          products: 15,
          noProgress: true,
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Read the product level and the peak level from the dashed lines.',
      'The reverse reaction starts at the products and climbs to the same peak.',
      'Its activation energy is the height from the products level up to the peak.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea_rev');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Enter the reverse activation energy in kJ/mol.' };
      if (Math.abs(val - 65) < 0.5) return { ok: false, msg: '65 kJ/mol is the forward climb from the reactants. The reverse reaction starts from the products.' };
      if (Math.abs(val - 15) < 0.5) return { ok: false, msg: '15 kJ/mol is where the products sit, not the climb up to the peak.' };
      if (Math.abs(val - 95) < 0.5) return { ok: false, msg: '95 kJ/mol is the peak height from zero, not the climb from products.' };
      if (Math.abs(val - 80) > 0.5) return { ok: false, msg: 'The reverse climb starts at the products level and ends at the top; check both on the profile.' };
      return { ok: true };
    },
    reward: {
      log: 'Reverse Ea = 95 - 15 = 80 kJ/mol.',
      title: 'Reverse Barrier',
      body: 'Products sit at 15 kJ/mol and the peak is at 95 kJ/mol, so the reverse climb is 80 kJ/mol. Even reactions that release energy still have a barrier in reverse.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-kinetic-control',
    title: 'Fastest Path vs Lowest Product',
    briefing: {
      speaker: SPEAKER,
      body: 'Two competing paths start from the same reactant at 40 kJ/mol. Ending lower in energy does not mean a path is faster.'
    },
    prompt: 'Which path forms product faster?',
    widget,
    table: rateTable({
      pieces: [
        stmt('pathA', 'Path A', { x: 28, y: 49 }),
        stmt('pathB', 'Path B', { x: 122, y: 49 })
      ],
      fixtures: [
        kprofileFixture('profA', { x: 40, y: 20 }, {
          title: 'Path A (kJ/mol)',
          reactants: 40,
          ts: 75,
          products: 25,
          noProgress: true,
          w: 64,
          h: 34
        }),
        kprofileFixture('profB', { x: 110, y: 20 }, {
          title: 'Path B (kJ/mol)',
          reactants: 40,
          ts: 105,
          products: 10,
          noProgress: true,
          w: 64,
          h: 34
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Faster path', at: { x: 75, y: 49 }, size: { w: 42, h: 12 } }]
      }
    }),
    hints: [
      'Compare how high each path climbs above the 40 kJ/mol starting level.',
      'Speed depends on the height of the hill to climb, not on how low the product ends.',
      'A lower activation hill lets more collisions cross each second.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Faster path".' };
      if (card.id === 'pathB') return { ok: false, msg: 'Compare the heights of the two hills above the reactant level, not where the products end.' };
      return { ok: true };
    },
    reward: {
      log: 'Path A is faster because its Ea (35 kJ/mol) is lower.',
      title: 'Lower Hill Wins',
      body: 'Path A has a lower activation hill (35 vs 65 kJ/mol), so it forms product faster even though Path B ends lower in energy.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-temperature-factor',
    title: 'How Much Faster When Warmer',
    briefing: {
      speaker: SPEAKER,
      body: 'Reaction rate scales with the share of collisions that have at least Ea. Doubling that share doubles the rate.',
      worked: [
        'Another reaction: 1.5% of collisions at 300 K, 3.0% at 330 K',
        'The share doubled, so the rate doubled: a factor of 3.0 ÷ 1.5 = 2'
      ]
    },
    prompt: 'By what factor does the rate rise when the reactor warms from 300 K to 360 K?',
    entry: { id: 'factor', label: 'Rate factor', unit: '×' },
    widget,
    table: rateTable({
      fixtures: [
        mbhistFixture('mb', { x: 75, y: 28 }, {
          title: 'Energy spread',
          Ts: [300, 360],
          Ea: 12,
          eMax: 24,
          showGhost: true,
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Switch the "Temperature" dial between 300 K and 360 K and read the percentage past Ea at each.',
      'The rate scales directly with the share of collisions past Ea.',
      'Compare how many times larger the 360 K share is than the 300 K share.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'factor');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the factor the rate rises by.' };
      if (Math.abs(val - 2.07) <= 0.12) return { ok: true };
      if (Math.abs(val - 2.36) <= 0.05) return { ok: false, msg: '2.36 is the difference between the two percentages, not how many times larger the hotter share is.' };
      if (val < 1) return { ok: false, msg: 'Warming raises the share of collisions past Ea, so the factor must be greater than 1.' };
      return { ok: false, msg: 'Divide the 360 K share by the 300 K share.' };
    },
    reward: {
      log: 'Rate factor 4.56 ÷ 2.20 ≈ 2.1.',
      title: 'Temperature and Rate',
      body: 'Warming from 300 K to 360 K raised the share past Ea from 2.20% to 4.56%, about 2.1 times as fast.'
    }
  },

  /* ---------------------------------------------------------------- 9 */
  {
    id: 's9-arrhenius',
    title: 'Activation Energy From Two Temperatures',
    beyondAp: true,
    briefing: {
      speaker: SPEAKER,
      body: 'Plotting ln k against 1/T gives a straight line with slope −Ea ÷ R, where R = 8.314 J/(mol·K). Divide J/mol by 1000 to get kJ/mol.',
      worked: [
        'Another reaction: slope = −6000 K',
        'Ea = 6000 × 8.314 = 49 900 J/mol = 49.9 kJ/mol'
      ]
    },
    prompt: 'What is the activation energy of this reaction, in kJ/mol?',
    entry: { id: 'ea_arr', label: 'Activation energy', unit: 'kJ/mol' },
    widget,
    table: rateTable({
      fixtures: [
        arrplotFixture('arr', { x: 75, y: 28 }, {
          pts: [
            { x: 3.33, y: -6.0, label: '(3.33, −6.0)' },
            { x: 3.23, y: -5.1, label: '(3.23, −5.1)' }
          ],
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Read the two points on the graph; the 1/T axis is in units of 10⁻³ per K.',
      'Slope is the change in ln k divided by the change in 1/T.',
      'Because slope = −Ea / R, multiplying the positive slope by R gives Ea in J/mol.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea_arr');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the activation energy in kJ/mol.' };
      if (Math.abs(val - 74.8) <= 3) return { ok: true };
      if (Math.abs(val - 74800) <= 3000) return { ok: false, msg: 'That is in J/mol; the field is in kJ/mol.' };
      if (Math.abs(val - 9) <= 0.5) return { ok: false, msg: 'That is the change in ln k; the slope divides it by the change in 1/T, then R converts it to energy.' };
      if (val < 0) return { ok: false, msg: 'An activation energy is a climb, so it is positive.' };
      return { ok: false, msg: 'Check the slope: the change in ln k over the change in 1/T, then multiply by R.' };
    },
    reward: {
      log: 'Ea = 9000 K × 8.314 = 75 kJ/mol.',
      title: 'Arrhenius Slope',
      body: 'ln k rose 0.9 while 1/T fell 0.10 × 10⁻³, giving a slope of −9000 K. Multiplying by R gives Ea ≈ 75 kJ/mol.'
    }
  }
];

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [put('few', 'slot:ans')],
  [runFx('view'), put('below', 'slot:ans')],
  [dial('view', 'pair', 2), runFx('view'), put('orient', 'slot:ans')],
  [dial('mb', 'T', 3), put('more', 'slot:ans')],
  [{ type: { entry: 'ea_fwd', value: '70' } }],
  [{ type: { entry: 'ea_rev', value: '80' } }],
  [put('pathA', 'slot:ans')],
  [{ type: { entry: 'factor', value: '2.07' } }],
  [{ type: { entry: 'ea_arr', value: '75' } }]
];

export const MISSES = [
  [],
  [put('angle', 'slot:ans')],
  [put('lowerEa', 'slot:ans')],
  [put('eaDrops', 'slot:ans')],
  [{ type: { entry: 'ea_fwd', value: '110' } }],
  [{ type: { entry: 'ea_rev', value: '65' } }],
  [put('pathB', 'slot:ans')],
  [{ type: { entry: 'factor', value: '2.36' } }],
  [{ type: { entry: 'ea_arr', value: '9' } }]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() {}
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}
