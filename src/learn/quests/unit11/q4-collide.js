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
import {
  rateTable,
  rateLeadFixture,
  collviewFixture,
  mbhistFixture,
  kprofileFixture,
  stmt
} from '../../table/kits/rate.js';

export const meta = { stageCount: 7 };

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
    title: 'Three Collisions',
    briefing: {
      speaker: SPEAKER,
      body: 'Watch the three collisions in slow motion and see which one actually forms product.'
    },
    prompt: 'What two things must a collision have to react?',
    widget,
    table: rateTable({
      pieces: [
        stmt('both', 'Energy ≥ Ea and right angle', { x: 108, y: 9 }),
        stmt('energyOnly', 'High energy only', { x: 108, y: 24 }),
        stmt('angleOnly', 'Right angle only', { x: 108, y: 39 })
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
        slots: [{ id: 'ans', label: 'Needed to react', at: { x: 108, y: 52 }, size: { w: 46, h: 8 } }]
      }
    }),
    hints: [
      'Watch all three collision pairs on the Collision bench.',
      'Notice why both the slow pair and the sideways pair bounce apart.',
      'Only the collision with enough energy and the right angle reacts.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:ans');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in "Needed to react".' };
      if (card.id === 'energyOnly') return { ok: false, msg: 'The sideways fast pair still bounced off unchanged.' };
      if (card.id === 'angleOnly') return { ok: false, msg: 'The slow head-on pair also bounced off unchanged.' };
      return { ok: true };
    },
    reward: {
      log: 'Reactions require enough energy and proper orientation.',
      title: 'Effective Collisions',
      body: 'Only collisions with at least the activation energy and the right orientation rearrange bonds.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-energy',
    title: 'Energy Threshold',
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
      'The slow pair lacks the minimum energy (activation energy) to break bonds.'
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
      'Even fast molecules bounce off if the reactive ends miss each other.'
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
      body: 'Turn Temperature from 300 K to 360 K and watch the amber tail past Ea.'
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
      'Ea stays fixed at 12 kJ/mol while the fraction of particles above Ea doubles from 2.20% to 4.56%.'
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
    prompt: 'Where is the transition state on the energy profile?',
    widget,
    table: rateTable({
      fixtures: [
        kprofileFixture('prof', { x: 75, y: 28 }, {
          title: 'Energy profile',
          reactants: 40,
          ts: 110,
          products: 10,
          tapZones: [
            { id: 'react', label: 'Reactants', x0: 0, x1: 0.22 },
            { id: 'ts', label: 'Transition state', x0: 0.34, x1: 0.58 },
            { id: 'prod', label: 'Products', x0: 0.78, x1: 1.0 }
          ],
          w: 104,
          h: 44
        })
      ]
    }),
    hints: [
      'Slide "Progress" from Start to End to trace the energy hill.',
      'The transition state is the highest-energy, unstable arrangement between reactants and products.',
      'Tap the peak of the curve labeled TS.'
    ],
    check(state) {
      const z = Math.round(state.table.fixtures.prof?.dials?.zone?.value ?? 4);
      if (z === 4) return { ok: false, notYet: true, msg: 'Tap the transition state region on the energy profile.' };
      if (z === 1) return { ok: false, msg: 'That is the starting reactants level (R: 40).' };
      if (z === 3) return { ok: false, msg: 'That is the final products level (P: 10).' };
      return { ok: true };
    },
    reward: {
      log: 'The transition state sits at the peak of the profile.',
      title: 'Transition State',
      body: 'The activated complex (transition state) is the unstable high-energy peak between reactants and products.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-reverse-ea',
    title: 'Climbing Back',
    briefing: {
      speaker: SPEAKER,
      body: 'Activation energy is the climb from start to peak. Forward Ea = TS − R = 95 − 30 = 65 kJ/mol.',
      worked: [
        'Forward climb: from R (30) up to TS (95) = 65 kJ/mol',
        'Reverse climb: from P up to TS'
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
      'Read the products level P and the peak TS on the profile.',
      'Going in reverse means starting at P = 15 and climbing up to TS = 95.',
      'Reverse activation energy is the energy climb from products P up to the peak TS.'
    ],
    check(state) {
      const val = entryNumber(state.table, 'ea_rev');
      if (Number.isNaN(val)) return { ok: false, notYet: true, msg: 'Enter the reverse activation energy in kJ/mol.' };
      if (Math.abs(val - 65) < 0.5) return { ok: false, msg: '65 kJ/mol is the forward climb (95 − 30); reverse starts at P = 15.' };
      if (Math.abs(val - 15) < 0.5) return { ok: false, msg: '15 kJ/mol is the products height (and |ΔH|), not the climb up to TS = 95.' };
      if (Math.abs(val - 95) < 0.5) return { ok: false, msg: '95 kJ/mol is the peak height from zero, not from P = 15.' };
      if (Math.abs(val - 80) > 0.5) return { ok: false, msg: 'Subtract the products level (15) from the transition state peak (95).' };
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
        stmt('pathA', 'Path A (lower barrier)', { x: 28, y: 49 }),
        stmt('pathB', 'Path B (lower product)', { x: 122, y: 49 })
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
  }
];

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const runFx = fixture => ({ run: { fixture } });

export const SOLUTIONS = [
  [put('both', 'slot:ans')],
  [runFx('view'), put('below', 'slot:ans')],
  [dial('view', 'pair', 2), runFx('view'), put('orient', 'slot:ans')],
  [dial('mb', 'T', 3), put('more', 'slot:ans')],
  [dial('prof', 'zone', 2)],
  [{ type: { entry: 'ea_rev', value: '80' } }],
  [put('pathA', 'slot:ans')]
];

export const MISSES = [
  [put('energyOnly', 'slot:ans')],
  [put('angle', 'slot:ans')],
  [put('lowerEa', 'slot:ans')],
  [put('eaDrops', 'slot:ans')],
  [dial('prof', 'zone', 1)],
  [{ type: { entry: 'ea_rev', value: '65' } }],
  [put('pathB', 'slot:ans')]
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
