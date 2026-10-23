/**
 * Unit 5 · Bench 1 — Heat and Temperature (q1-flow)
 *
 * The wellhead's heat exchanger, and the first of Ember Reach's TABLETOPS (plan `bench-tabletop.md`, phase T6), on the heat kit
 * (`table/kits/heat.js`). Two metal blocks, a lagged cup with a bath thermometer, and the shelves of an energy chart. Nothing is
 * told: the player joins blocks and reads two thermometers meet, drops chemicals in a cup and reads which way the bath moved, then
 * builds the chart that matches.
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
 * THE EVIDENCE IS ON THE BENCH. The cup prints no verdict: the player reads the thermometer, or the shelves. Stage 7's spark and bath
 * differ only in how much is hot, and each can be joined to the cold block in turn.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  heatTable, block, charge, shelfCard, tag, stmt, cupFixture, shelvesFixture, selectorFixture, markerFixture, blockRead, cupRead, shelvesRead,
  markerRead, whereIs, equilibriumTemp, dialAt
} from '../../table/kits/heat.js';

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

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const FE = 0.449;
const WATER = 4.184;
const CUP = 'cup';
const MOUTH = 'slot:cup.mouth';

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-equilibrium',
    title: 'Where Both Blocks Settle',
    prompt: 'Join the two iron blocks, then set the marker to the temperature at which both finish.',
    briefing: {
      speaker: SPEAKER,
      body: 'Two blocks of the same iron sit on the bench, one hot and one cold. Press Submit when the table shows your answer.'
    },
    widget,
    table: heatTable({
      pieces: [
        block('a', 'Block A', { x: 22, y: 42 }, { m: 100, c: FE, T: 80, mat: 'Fe' }),
        block('b', 'Block B', { x: 58, y: 42 }, { m: 100, c: FE, T: 20, mat: 'Fe' })
      ],
      fixtures: [markerFixture('tfinal', 'Both finish at', { x: 112, y: 40 }, { min: 20, max: 80, step: 5, unit: '°C', w: 50 })]
    }),
    hints: [
      'Drag one block onto the other and watch the thermometer on each.',
      'Compare how far each reading moves, given that the two blocks have the same mass and the same metal.',
      'Look for the level where the two readings meet and stop changing.'
    ],
    check(state) {
      const t = state.table;
      const v = markerRead(t, 'tfinal');
      if (v === 20) return { ok: false, notYet: true, msg: 'Join the blocks, then set the marker to where their readings meet.' };
      const a = t.pieces.a.props; const b = t.pieces.b.props;
      const want = equilibriumTemp(a.m, a.c, a.T, b.m, b.c, b.T);
      if (Math.abs(v - want) < 0.5) return { ok: true };
      return v > want
        ? { ok: false, msg: 'That is nearer Block A\'s starting reading than the level the thermometers meet at.' }
        : { ok: false, msg: 'That is nearer Block B\'s starting reading than the level the thermometers meet at.' };
    },
    reward: {
      log: 'Both thermometers met at one level.',
      title: 'Thermal Equilibrium',
      body: 'Fast-moving particles pass motion to slow ones until both blocks share the same average motion. When nothing changes any more, the blocks are in thermal equilibrium.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-direction',
    title: 'Which Way Energy Crossed',
    prompt: 'Join the blocks, then set the arrow to the way energy crosses between them.',
    widget,
    table: heatTable({
      pieces: [
        block('a', 'Block A', { x: 22, y: 42 }, { m: 100, c: FE, T: 80, mat: 'Fe' }),
        block('b', 'Block B', { x: 58, y: 42 }, { m: 100, c: FE, T: 20, mat: 'Fe' })
      ],
      fixtures: [selectorFixture('arrow', 'Energy crosses', { x: 112, y: 40 }, { options: ['Block A to Block B', 'Block B to Block A', 'Neither way'], start: 3, w: 52 })]
    }),
    hints: [
      'Join the two blocks and read each thermometer before and after.',
      'Compare which block\'s reading fell and which block\'s reading rose.',
      'Whichever block\'s reading fell gave up energy, and the block whose reading rose took it in.'
    ],
    check(state) {
      const t = state.table;
      const v = dialAt(t, 'arrow', 'value');
      const ra = blockRead(t, 'a'); const rb = blockRead(t, 'b');
      const want = ra.T0 > rb.T0 ? 1 : 2;
      if (v === want) return { ok: true };
      if (v === 3) return { ok: false, msg: 'One block\'s reading falls and the other\'s rises when they join, so something does cross.' };
      return { ok: false, msg: 'Cold is only slower particle motion, so there is nothing in the cooler block to send across.' };
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
      body: 'A dashed line on the cup marks off the part being studied, which chemists call the system. Everything outside the line is the surroundings.'
    },
    widget,
    table: (() => {
      const c = cupFixture(CUP, { x: 30, y: 32 }, { boundary: true, title: 'Cup' });
      return heatTable({
        pieces: [
          { ...charge('rx', 'Reacting chemicals', { x: 30, y: 30 }, { moles: 0.05, dH: 0, shown: 'in the cup' }), zone: MOUTH, fixed: true },
          tag('reactants', 'The reacting molecules and their bonds', { x: 74, y: 14 }),
          tag('water', 'The water bath around the sample', { x: 74, y: 27 }),
          tag('thermo', 'The thermometer bulb in the bath', { x: 74, y: 40 }),
          tag('cupwall', 'The insulated cup walls', { x: 74, y: 53 })
        ],
        fixtures: [c.fixture],
        zones: {
          slots: [c.slot],
          trays: [
            { id: 'system', label: 'System', at: { x: 120, y: 18 }, size: { w: 30, h: 13 }, cell: 28, cellH: 12 },
            { id: 'surroundings', label: 'Surroundings', at: { x: 120, y: 46 }, size: { w: 58, h: 26 }, cell: 28, cellH: 12 }
          ]
        }
      });
    })(),
    hints: [
      'Look at the dashed line drawn on the cup and at what it encloses.',
      'Compare each part with the two labelled places on the table.',
      'Anything the line encloses is the system, and anything outside it, instruments included, is the surroundings.'
    ],
    check(state) {
      const t = state.table;
      const want = { reactants: 'system', water: 'surroundings', thermo: 'surroundings', cupwall: 'surroundings' };
      if (Object.keys(want).some(k => !['system', 'surroundings'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Place all four parts first.' };
      if (Object.entries(want).every(([k, v]) => whereIs(t, k) === v)) return { ok: true };
      return { ok: false, msg: 'Check each part against the dashed line on the cup: it encloses only what is reacting.' };
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
    prompt: 'Sort each pack by which way heat crosses the system\'s boundary.',
    widget,
    table: (() => {
      const c = cupFixture(CUP, { x: 30, y: 32 }, { title: 'Cup' });
      return heatTable({
        pieces: [
          charge('warmer', 'Hand warmer', { x: 74, y: 22 }, { moles: 0.04, dH: -165 }),
          charge('cold', 'Cold pack', { x: 74, y: 44 }, { moles: 0.08, dH: 26 })
        ],
        fixtures: [c.fixture],
        zones: {
          slots: [c.slot],
          trays: [
            { id: 'out', label: 'Heat leaves the system', at: { x: 122, y: 20 }, size: { w: 48, h: 16 }, cell: 22, cellH: 14 },
            { id: 'in', label: 'Heat enters the system', at: { x: 122, y: 48 }, size: { w: 48, h: 16 }, cell: 22, cellH: 14 }
          ]
        }
      });
    })(),
    hints: [
      'Drop a pack in the cup\'s mouth and read the bath thermometer, then try the other pack.',
      'Compare which way each bath moved with where the heat must have come from or gone to.',
      'A bath that warmed received heat from the system, and a bath that cooled lost heat into it.'
    ],
    check(state) {
      const t = state.table;
      if (!['out', 'in'].includes(whereIs(t, 'warmer')) || !['out', 'in'].includes(whereIs(t, 'cold'))) return { ok: false, notYet: true, msg: 'Place both packs first.' };
      if (whereIs(t, 'warmer') === 'out' && whereIs(t, 'cold') === 'in') return { ok: true };
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
    title: 'Reading the Bath',
    prompt: 'Predict what happens to Sample A\'s energy as it dissolves in the bath, then test it.',
    widget,
    table: (() => {
      const c = cupFixture(CUP, { x: 30, y: 32 }, { title: 'Cup', record: true });
      const token = (id, label, x) => ({ id, label, at: { x, y: 56 }, r: 7 });
      return heatTable({
        pieces: [charge('sampleA', 'Sample A', { x: 74, y: 22 }, { moles: 0.09, dH: 26 })],
        fixtures: [c.fixture],
        zones: { slots: [c.slot] },
        prediction: {
          slot: { id: 'predict', label: 'Sample A\'s energy', at: { x: 118, y: 30 }, size: { w: 30, h: 12 } },
          tokens: [token('gained', 'Gains energy', 84), token('lost', 'Loses energy', 114), token('same', 'No change', 140)]
        }
      });
    })(),
    hints: [
      'Place a prediction, drop Sample A in the cup\'s mouth, then press Record.',
      'Compare the bath thermometer before and after, and ask where the bath\'s energy went.',
      'Energy is not destroyed, so what the bath lost must show up in the sample inside the dashed line.'
    ],
    check(state) {
      const t = state.table;
      const token = t.prediction.token;
      if (!token) return { ok: false, notYet: true, msg: 'Place a prediction first.' };
      if (token === 'gained') return { ok: true };
      if (t.prediction.tested) return token === 'lost'
        ? { ok: false, msg: 'The bath is the part that lost energy, and the thermometer reads the bath.' }
        : { ok: false, msg: 'The bath\'s reading changed, and the energy it lost cannot simply disappear.' };
      return { ok: false, msg: 'Drop Sample A in the cup\'s mouth, press Record, and compare the bath with your prediction.' };
    },
    reward: {
      log: 'The water\'s loss was the sample\'s gain.',
      title: 'Energy Is Conserved',
      body: 'The energy a bath loses is gained by the system, so a cooling bath means the change is endothermic. The thermometer reports on the surroundings, and the system does the opposite.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-diagram',
    title: 'Where the Bath\'s Heat Went',
    prompt: 'Set the energy chart so it matches Sample A as it dissolves in the cooling bath.',
    briefing: {
      speaker: SPEAKER,
      body: 'An energy chart draws the system\'s stored energy as a shelf before the change and a shelf after it.'
    },
    widget,
    table: (() => {
      const c = cupFixture(CUP, { x: 30, y: 32 }, { title: 'Cup' });
      return heatTable({
        pieces: [charge('sampleA', 'Sample A', { x: 76, y: 22 }, { moles: 0.09, dH: 26 })],
        fixtures: [
          c.fixture,
          shelvesFixture('chart', { x: 120, y: 32 }, {
            reactants: 'Sample A(s)', products: 'Sample A(aq)', dH: 0, scale: 26, hideValue: true, hideVerdict: true, title: 'Energy chart',
            build: { afterList: [-26, -13, 0, 13, 26], labels: ['Far lower', 'Lower', 'Level', 'Higher', 'Far higher'], label: 'After shelf' }
          })
        ],
        zones: { slots: [c.slot] }
      });
    })(),
    hints: [
      'Turn the After shelf dial and watch the chart change.',
      'Compare the chart with what the last stage showed happened to the energy of Sample A.',
      'The chart for a system that gained energy ends on a higher shelf than it began on.'
    ],
    check(state) {
      const t = state.table;
      const r = shelvesRead(t, 'chart');
      if (r.dH === 0) return { ok: false, notYet: true, msg: 'The two shelves are level: turn the After shelf dial.' };
      if (r.up) return { ok: true };
      return { ok: false, msg: 'On that chart the system ends on a lower shelf, which is what a system does when it gives energy to the bath.' };
    },
    reward: {
      log: 'The chart ends on a higher shelf.',
      title: 'Energy Diagram',
      body: 'An energy diagram draws the system\'s stored energy before and after a change. An endothermic change climbs to a higher shelf, and an exothermic change drops to a lower one.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-bath-spark',
    title: 'The Spark and the Bath',
    prompt: 'Warm the cold block as far as you can by joining it to one of the hot bodies.',
    widget,
    table: heatTable({
      pieces: [
        block('spark', 'Spark', { x: 22, y: 16 }, { m: 0.001, c: FE, T: 1200, mat: 'Fe', mass: '0.001 g Fe' }),
        block('bath', 'Warm bath', { x: 22, y: 48 }, { m: 2000, c: WATER, T: 40, mat: 'H₂O', mass: 'a tank of water' }),
        block('cold', 'Cold block', { x: 66, y: 32 }, { m: 500, c: FE, T: 20, mat: 'Fe' }),
        { ...stmt('tap', 'Tap card: the tank holds 2000 g of water', { x: 116, y: 22 }), hidden: true, fetchFrom: 'flowline' }
      ],
      fetch: [{ id: 'flowline', label: 'Flowline Tap', at: { x: 124, y: 54 } }]
    }),
    hints: [
      'Drag the cold block onto each hot body in turn and read its thermometer.',
      'Compare where the cold block ends up after each join.',
      'Temperature is one particle\'s average motion, while the energy a body can hand over depends on all of its particles together.'
    ],
    check(state) {
      const t = state.table;
      const r = blockRead(t, 'cold');
      if (!r.joined) return { ok: false, notYet: true, msg: 'Join the cold block to one of the hot bodies and read its thermometer.' };
      if (r.T >= 35) return { ok: true };
      return { ok: false, msg: 'The cold block has barely warmed: read its thermometer after joining it to each hot body in turn.' };
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
    widget,
    table: heatTable({
      pieces: [
        shelfCard('burn', 'Burning methane', { x: 22, y: 16 }, { dH: -890, from: 'CH₄ + 2O₂', to: 'CO₂ + 2H₂O' }),
        shelfCard('melt', 'Melting ice', { x: 52, y: 16 }, { dH: 6, from: 'H₂O(s)', to: 'H₂O(l)' }),
        shelfCard('condense', 'Condensing steam', { x: 82, y: 16 }, { dH: -44, from: 'H₂O(g)', to: 'H₂O(l)' }),
        shelfCard('nh4no3', 'Cold-pack salt', { x: 112, y: 16 }, { dH: 25.7, from: 'NH₄NO₃(s)', to: 'NH₄⁺ + NO₃⁻' })
      ],
      zones: {
        trays: [
          { id: 'exo', label: 'Exothermic', at: { x: 36, y: 50 }, size: { w: 56, h: 22 }, cell: 27, cellH: 20 },
          { id: 'endo', label: 'Endothermic', at: { x: 108, y: 50 }, size: { w: 56, h: 22 }, cell: 27, cellH: 20 }
        ]
      }
    }),
    hints: [
      'Look at each chart and compare where its starting shelf and its finishing shelf sit.',
      'Compare each finishing shelf with the starting one to see whether the system gained or lost energy.',
      'A system that ends on a lower shelf released energy, and one that ends on a higher shelf absorbed it.'
    ],
    check(state) {
      const t = state.table;
      const want = { burn: 'exo', melt: 'endo', condense: 'exo', nh4no3: 'endo' };
      if (Object.keys(want).some(k => !['exo', 'endo'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Classify all four changes first.' };
      if (Object.entries(want).every(([k, v]) => whereIs(t, k) === v)) return { ok: true };
      return { ok: false, msg: 'Check each change against its own chart: which shelf does the system finish on?' };
    },
    reward: {
      log: 'Four changes sorted by their shelves.',
      title: 'Bonds Made and Bonds Broken',
      body: 'Pulling attracting particles apart takes energy in, as in melting or dissolving a cold-pack salt. Letting particles lock together releases it, as in burning or condensing.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag one block onto the other to join them;', 'tap the gap between them to pull them apart.'],
  2: ['Drag one block onto the other to join them.'],
  3: ['Drag each part into a tray.'],
  4: ['Drag a pack onto the cup, then drag each pack into a tray.'],
  5: ['Place a prediction, drop Sample A on the cup,', 'then press Record.'],
  6: ['Drop Sample A on the cup to read its bath;', 'turn the After shelf dial to build the chart.'],
  7: ['Drag the cold block onto a hot body.'],
  8: ['Drag each chart into a tray.']
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
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const join = (a, b) => put(a, `piece:${b}`);
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));

export const SOLUTIONS = [
  [join('a', 'b'), dial('tfinal', 'value', 50)],
  [join('a', 'b'), dial('arrow', 'value', 1)],
  [...sort({ reactants: 'system', water: 'surroundings', thermo: 'surroundings', cupwall: 'surroundings' })],
  [put('warmer', MOUTH), put('cold', MOUTH), ...sort({ warmer: 'out', cold: 'in' })],
  [{ predict: 'gained' }, put('sampleA', MOUTH), { run: CUP }],
  [put('sampleA', MOUTH), dial('chart', 'after', 5)],
  [{ fetch: 'flowline' }, join('cold', 'spark'), join('cold', 'bath')],
  [...sort({ burn: 'exo', melt: 'endo', condense: 'exo', nh4no3: 'endo' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [join('a', 'b'), dial('tfinal', 'value', 80)],
  [join('a', 'b'), dial('arrow', 'value', 2)],
  [...sort({ reactants: 'surroundings', water: 'system', thermo: 'surroundings', cupwall: 'surroundings' })],
  [put('warmer', MOUTH), put('cold', MOUTH), ...sort({ warmer: 'in', cold: 'out' })],
  [{ predict: 'lost' }, put('sampleA', MOUTH), { run: CUP }],
  [put('sampleA', MOUTH), dial('chart', 'after', 1)],
  [join('cold', 'spark')],
  [...sort({ burn: 'endo', melt: 'endo', condense: 'exo', nh4no3: 'endo' })]
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
export { cupRead, shelvesRead, blockRead };
