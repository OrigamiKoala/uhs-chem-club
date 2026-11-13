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
  stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 8 };

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
  body: 'Collisions need both energy at least Ea and the right orientation; warming shifts more particles past the fixed Ea barrier.',
  filed: 'Filed: cold fuel waits because few collisions clear the activation energy hill until the heater warms the spread.'
};

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-lead',
    title: 'Every Collision?',
    predict: true,
    prompt: 'Of all the collisions between reactant particles, how many lead to a reaction?',
    widget,
    table: rateTable({
      pieces: [
        stmt('all', 'All of them', { x: 108, y: 9 }),
        stmt('half', 'About half', { x: 108, y: 24 }),
        stmt('few', 'A small share', { x: 108, y: 39 })
      ],
      fixtures: [
        rateLeadFixture('lead', { x: 46, y: 28 }, {
          scene: 'collide',
          title: 'Collision bench',
          w: 78,
          h: 44
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'My prediction', at: { x: 108, y: 52 }, size: { w: 46, h: 8 } }]
      }
    }),
    hints: [
      'Watch the particles in the preview as they meet one another.',
      'Count how many meetings end with the particles bouncing apart unchanged.',
      'Think about how many collisions a gas has each second compared with how fast reactions usually go.'
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
      body: 'You locked in your prediction. The next stages slow collisions down to see which ones react.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-energy',
    title: 'Energy Threshold',
    briefing: {
      speaker: SPEAKER,
      body: 'Reactions need bonds to break. The least energy a collision must bring to do that is the activation energy, Ea.'
    },
    prompt: 'Why did the slow pair bounce back unchanged?',
    widget,
    table: rateTable({
      pieces: [
        stmt('below', 'Below activation energy', { x: 112, y: 9 }),
        stmt('angle', 'Wrong collision angle', { x: 112, y: 24 }),
        stmt('count', 'Too few particles', { x: 112, y: 39 })
      ],
      fixtures: [
        collviewFixture('view', { x: 46, y: 28 }, {
          title: 'Speed test',
          mode: 'energy',
          pairs: [
            { label: 'Slow', speed: 0.4, angle: 0, reacts: false, note: 'Too slow — bounces apart' },
            { label: 'Fast', speed: 1.0, angle: 0, reacts: true, note: 'Above Ea — bonds rearrange' }
          ],
          w: 78,
          h: 42
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Reason', at: { x: 112, y: 52 }, size: { w: 44, h: 8 } }]
      }
    }),
    hints: [
      'Turn the "Pair" dial between Slow and Fast and press Play.',
      'Both pairs hit head-on, so only their speed differs.',
      'Ask what the particles bring to the collision, and what breaking a bond demands.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Reason".' };
      if (card.id === 'angle') return { ok: false, msg: 'Both pairs collide head-on at 0 degrees.' };
      if (card.id === 'count') return { ok: false, msg: 'Each test shows one pair colliding.' };
      return { ok: true };
    },
    reward: {
      log: 'Collisions below Ea bounce back unchanged.',
      title: 'Activation Energy',
      body: 'A collision must reach the activation energy barrier before old bonds can stretch and break.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-orientation',
    title: 'Geometry Matters',
    prompt: 'Why does only one of these equally fast pairs react?',
    widget,
    table: rateTable({
      pieces: [
        stmt('orient', 'Only one hits at the reactive end', { x: 112, y: 9 }),
        stmt('lowerEa', 'One has lower activation energy', { x: 112, y: 24 }),
        stmt('hotter', 'One is at a higher temperature', { x: 112, y: 39 })
      ],
      fixtures: [
        collviewFixture('view', { x: 46, y: 28 }, {
          title: 'Angle test',
          mode: 'orientation',
          pairs: [
            { label: 'Sideways', speed: 1.0, angle: 90, reacts: false, note: 'Reactive ends miss' },
            { label: 'Head-on', speed: 1.0, angle: 0, reacts: true, note: 'Reactive ends meet' }
          ],
          w: 78,
          h: 42
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Reason', at: { x: 112, y: 52 }, size: { w: 46, h: 8 } }]
      }
    }),
    hints: [
      'Test both Sideways and Head-on with the "Pair" dial and Play.',
      'Watch which atoms touch at the moment of impact.',
      'The two pairs have the same speed and the same energy; ask what else could differ.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Reason".' };
      if (card.id === 'lowerEa') return { ok: false, msg: 'It is the same reaction, so the activation energy is identical.' };
      if (card.id === 'hotter') return { ok: false, msg: 'Both pairs move at the same speed.' };
      return { ok: true };
    },
    reward: {
      log: 'Orientation determines whether reactive atoms meet.',
      title: 'Collision Orientation',
      body: 'Molecules must align so the bond-forming atoms meet; sideways hits waste their kinetic energy.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-maxwell-boltzmann',
    title: 'Warming the Spread',
    briefing: {
      speaker: SPEAKER,
      body: 'The tall bars show how many particles have each energy; the amber bars are those with at least Ea.'
    },
    prompt: 'Why does warming from 300 K to 360 K speed up the reaction?',
    widget,
    table: rateTable({
      pieces: [
        stmt('more', 'More particles clear Ea', { x: 116, y: 9 }),
        stmt('eaDrops', 'Ea itself drops with T', { x: 116, y: 24 }),
        stmt('all', 'Every particle clears Ea', { x: 116, y: 39 })
      ],
      fixtures: [
        mbhistFixture('mb', { x: 48, y: 28 }, {
          title: 'Energy spread',
          Ts: [300, 330, 360],
          Ea: 12,
          eMax: 24,
          w: 84,
          h: 42
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Cause', at: { x: 116, y: 52 }, size: { w: 42, h: 8 } }]
      }
    }),
    hints: [
      'Turn the "Temperature" dial from 300 K to 330 K to 360 K.',
      'Watch the Ea = 12 kJ/mol bar and the amber bars to its right.',
      'Compare the amber share at each temperature, and ask whether the Ea bar moves at all.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Cause".' };
      if (card.id === 'eaDrops') return { ok: false, msg: 'The Ea bar stays fixed at 12 kJ/mol at every temperature.' };
      if (card.id === 'all') return { ok: false, msg: 'At 360 K, most particles are still below Ea (only 4.56% are above).' };
      return { ok: true };
    },
    reward: {
      log: 'Higher T shifts more particles past the fixed Ea threshold.',
      title: 'Maxwell-Boltzmann Shift',
      body: 'Raising temperature leaves Ea unchanged but grows the high-energy tail past Ea.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-profile-tap',
    title: 'Top of the Hill',
    briefing: {
      speaker: SPEAKER,
      body: 'An energy profile plots the energy of the reacting particles as they go from reactants to products. The top is the transition state, and the energy the reactants must gain to reach it is the activation energy.'
    },
    prompt: 'How much energy must the reactants gain to get over the top of the hill?',
    entry: { id: 'ea_fwd', label: 'Forward Ea', unit: 'kJ/mol' },
    widget,
    table: rateTable({
      fixtures: [
        kprofileFixture('prof', { x: 75, y: 28 }, {
          title: 'Energy profile',
          reactants: 40,
          ts: 110,
          products: 10,
          showLevels: false,
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Slide "Progress" and watch the energy reading as the ball moves along the hill.',
      'Compare the reading at the start with the reading at the very top.',
      'The energy gained is how much higher the top is than where the reactants begin.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea_fwd');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the activation energy in kJ/mol.' };
      if (Math.abs(val - 70) <= 0.5) return { ok: true };
      if (Math.abs(val - 110) <= 0.5) return { ok: false, msg: 'The ball reads 110 kJ/mol at the top, but it began at the reactants level, not at zero.' };
      if (Math.abs(val - 40) <= 0.5) return { ok: false, msg: 'The reactants already have 40 kJ/mol before the climb; that is where the ball starts, not how far it climbs.' };
      return { ok: false, msg: 'Compare the ball\'s reading at the start and at the top of the hill.' };
    },
    reward: {
      log: 'Forward Ea = 110 - 40 = 70 kJ/mol.',
      title: 'Activation Energy',
      body: 'The transition state sits at 110 kJ/mol and the reactants at 40, so they must gain 70 kJ/mol. That climb is the activation energy.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-reverse-ea',
    title: 'Climbing Back',
    briefing: {
      speaker: SPEAKER,
      body: 'The reverse reaction starts from the products and has to climb to the same top.',
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
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Find the levels of the products and of the top on the profile.',
      'The reverse reaction starts where the forward reaction ended.',
      'Its activation energy is the climb from where it starts to the top.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea_rev');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Enter the reverse activation energy in kJ/mol.' };
      if (Math.abs(val - 65) < 0.5) return { ok: false, msg: '65 kJ/mol is the climb that starts at the reactants; the reverse reaction starts elsewhere.' };
      if (Math.abs(val - 15) < 0.5) return { ok: false, msg: '15 kJ/mol is the products height (and |ΔH|), not the climb up to TS = 95.' };
      if (Math.abs(val - 95) < 0.5) return { ok: false, msg: '95 kJ/mol is the peak height from zero, not from P = 15.' };
      if (Math.abs(val - 80) > 0.5) return { ok: false, msg: 'The reverse climb starts at the products level and ends at the top; check both on the profile.' };
      return { ok: true };
    },
    reward: {
      log: 'Reverse Ea = 95 - 15 = 80 kJ/mol.',
      title: 'Reverse Barrier',
      body: 'Products sit at 15 kJ/mol and the peak is at 95 kJ/mol, so the reverse climb is 80 kJ/mol.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-kinetic-control',
    title: 'Fastest Path vs Lowest Product',
    briefing: {
      speaker: SPEAKER,
      body: 'Two competing paths start from the same reactant at 40 kJ/mol.'
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
          w: 64,
          h: 32
        }),
        kprofileFixture('profB', { x: 110, y: 20 }, {
          title: 'Path B (kJ/mol)',
          reactants: 40,
          ts: 105,
          products: 10,
          w: 64,
          h: 32
        })
      ],
      zones: {
        slots: [{ id: 'ans', label: 'Faster path', at: { x: 75, y: 49 }, size: { w: 40, h: 12 } }]
      }
    }),
    hints: [
      'Compare the activation barrier (TS − R) of Path A and Path B.',
      'Path A has Ea = 75 − 40 = 35 kJ/mol; Path B has Ea = 105 − 40 = 65 kJ/mol.',
      'Reaction rate depends on the barrier height (Ea), not on how low the final product sits.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Faster path".' };
      if (card.id === 'pathB') return { ok: false, msg: 'Path B has the lower product (10), but its barrier is 65 kJ/mol vs 35 kJ/mol for Path A.' };
      return { ok: true };
    },
    reward: {
      log: 'Path A is faster because its Ea (35 kJ/mol) is lower.',
      title: 'Kinetic Control',
      body: 'Rate is governed by the activation barrier, not by how stable the final product is.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-temperature-factor',
    title: 'How Much Faster When Warmer',
    briefing: {
      speaker: SPEAKER,
      body: 'The rate of a reaction follows the share of collisions that carry at least Ea. Doubling that share doubles the rate.',
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
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Turn the "Temperature" dial between its two settings and read the share at each.',
      'The rate follows the share of collisions with at least Ea.',
      'To compare two amounts as a factor, ask how many times the smaller fits into the larger.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'factor');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Type the factor the rate rises by.' };
      if (Math.abs(val - 2.07) <= 0.12) return { ok: true };
      if (Math.abs(val - 2.36) <= 0.05) return { ok: false, msg: 'That is the difference between the two shares, not how many times larger one is than the other.' };
      if (val < 1) return { ok: false, msg: 'Warming raises the share of collisions that react, so the rate rises; a factor below 1 would be a slowdown.' };
      return { ok: false, msg: `A factor of ${val} would make the 360 K share ${(2.2 * val).toFixed(1)}%, but the dial shows a different value.` };
    },
    reward: {
      log: 'Rate factor 4.56 ÷ 2.20 ≈ 2.1.',
      title: 'Temperature and Rate',
      body: 'The share of collisions with enough energy rose from 2.20% to 4.56%, so the rate roughly doubled. A modest warming has a large effect on the rate.'
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
  [{ type: { entry: 'factor', value: '2.07' } }]
];

export const MISSES = [
  [],
  [put('angle', 'slot:ans')],
  [put('lowerEa', 'slot:ans')],
  [put('eaDrops', 'slot:ans')],
  [{ type: { entry: 'ea_fwd', value: '110' } }],
  [{ type: { entry: 'ea_rev', value: '65' } }],
  [put('pathB', 'slot:ans')],
  [{ type: { entry: 'factor', value: '2.36' } }]
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
