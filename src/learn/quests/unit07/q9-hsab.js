/**
 * Unit 7 · Bench 9 — Hard and Soft (q9-hsab)
 *
 * The refining vat, on the pot kit (`table/kits/pot-hsab.js`):
 *   - The Cloud probe (`hsabprobe`): tests whether an ion's electron cloud keeps its shape or pulls out of shape.
 *   - The Reaction Wells (`hsabwells`): tests precipitation and solubility of hard vs soft ion pairs.
 *   - The Bond Viewer (`hsabbond`): shows attraction between opposite charges vs sharing electrons where clouds overlap.
 *
 * Six stages:
 *   1  test four ions in the probe; sort into hard and soft                       -> electron cloud, hard ion, soft ion
 *   2  test Ca2+ and Ag+ with F- and I-; observe which pairs form solids
 *   3  particle diagrams of CaF2 vs AgI: match what holds each solid together
 *   4  PREDICT: which ions will sulfide (S2-) form a solid with?
 *   5  TEST: mix silver and calcium with sulfide; collect the solid that forms
 *   6  test Pb2+ and Mg2+ with fluoride and sulfide; choose the selective reagent
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { potTable, plaqueFixture } from '../../table/kits/pot.js';
import {
  probeFixture, wellsFixture, bondViewerFixture, hsabCard, hsabChip, wellsRead
} from '../../table/kits/pot-hsab.js';
import { ionPuck } from '../../table/kits/pot-ionic.js';
import { HSAB_DATA } from '../../engine/reactdata-hsab.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\belectron clouds?\b/i, introducedAt: 1 },
  { term: /\bhard ions?\b/i, introducedAt: 1 },
  { term: /\bsoft ions?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit07/q5-ionic'];

export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q9-hsab';

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const live = p => !p.hidden;
const seatedInSlot = (t, slot) => Object.values(t.pieces || {}).find(p => live(p) && p.zone === `slot:${slot}`) || null;
const inTray = (t, tray) => Object.values(t.pieces || {}).filter(p => live(p) && p.zone === `tray:${tray}`);
const trayAt = (id, label, at, size) => ({ id, label, at, size, cell: size.cell || 14, cellH: size.cellH || 14 });

/* ------------------------------------------------------------------
   THE SIX STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* -------------------------------------------------------------- 1 */
  (() => {
    const p = probeFixture('probe', { x: 75, y: 24 });
    return {
      id: 's1-probe',
      title: 'Hard and Soft',
      briefing: {
        title: 'Electron Clouds',
        body: 'An ion\'s electrons form a cloud round its nucleus. The probe brings a charge near the ion and shows whether the cloud keeps its shape.'
      },
      prompt: 'Which ions are hard and which are soft?',
      widget,
      hints: [
        'Drag an ion into the probe socket and press "Test".',
        'Look at whether the electron cloud keeps its shape or pulls toward the charge.',
        'Compare each ion\'s cloud in the probe with the two tray descriptions.'
      ],
      reward: {
        log: 'Small ions keep their shape; large ions pull out of shape.',
        title: 'Hard and Soft Ions',
        body: 'An ion whose electron cloud keeps its shape is a hard ion; one whose cloud pulls out of shape is a soft ion. Small ions hold their electrons close and are usually hard; large ions are usually soft.'
      },
      table: potTable({
        fixtures: [p.fixture],
        pieces: [
          ionPuck('ca', 'Ca', { x: 50, y: 55 }),
          ionPuck('ag', 'Ag', { x: 67, y: 55 }),
          ionPuck('f', 'F', { x: 84, y: 55 }),
          ionPuck('i', 'I', { x: 101, y: 55 })
        ],
        zones: {
          slots: p.slots,
          trays: [
            trayAt('hard', 'Hard: keeps its shape', { x: 22, y: 25 }, { w: 34, h: 30 }),
            trayAt('soft', 'Soft: pulls out of shape', { x: 126, y: 25 }, { w: 34, h: 30 })
          ]
        }
      }),
      check(state) {
        const t = state.table;
        const hard = inTray(t, 'hard').map(p => p.props.ion);
        const soft = inTray(t, 'soft').map(p => p.props.ion);
        const total = hard.length + soft.length;
        if (total === 0) return { ok: false, notYet: true, msg: 'Test the ions in the probe and place them in the trays.' };
        if (total < 4) return { ok: false, notYet: true, msg: 'Four ions need to be placed in the trays.' };

        if (hard.includes('Ag') || hard.includes('I')) {
          return { ok: false, msg: 'The probe shows silver and iodide clouds pull out of shape under the electric field.' };
        }
        if (soft.includes('Ca') || soft.includes('F')) {
          return { ok: false, msg: 'The probe shows calcium and fluoride clouds keep their round shape.' };
        }
        return { ok: true };
      }
    };
  })(),

  /* -------------------------------------------------------------- 2 */
  (() => {
    const w = wellsFixture('wells', { x: 75, y: 24 }, {
      w: 56, h: 30, label: 'Test Wells',
      cat1: 'Ca', cat2: 'Ag',
      dials: { reagent: { min: 1, max: 2, step: 1, value: 1, label: 'Reagent', labels: ['Fluoride (F⁻)', 'Iodide (I⁻)'] } }
    });
    return {
      id: 's2-pairs',
      title: 'Which Pairs Make a Solid',
      prompt: 'Which pairs of ions form a solid?',
      widget,
      hints: [
        'Use the reagent dial on the wells and press "Mix".',
        'Compare which well turns cloudy with fluoride against which turns cloudy with iodide.',
        'Compare each pair that formed a solid with what Stage 1 showed about its two ions.'
      ],
      reward: {
        log: 'Hard paired with hard and soft with soft formed solids.',
        title: 'Hard-Hard and Soft-Soft Pairs',
        body: 'Ca²⁺ and F⁻, both hard, formed a solid, and so did Ag⁺ and I⁻, both soft. The mixed pairs stayed dissolved.'
      },
      table: potTable({
        fixtures: [w.fixture],
        pieces: [
          hsabCard('pair_caf', 'Ca²⁺ with F⁻', { x: 30, y: 55 }, { cat: 'Ca', an: 'F' }),
          hsabCard('pair_cai', 'Ca²⁺ with I⁻', { x: 60, y: 55 }, { cat: 'Ca', an: 'I' }),
          hsabCard('pair_agf', 'Ag⁺ with F⁻', { x: 90, y: 55 }, { cat: 'Ag', an: 'F' }),
          hsabCard('pair_agi', 'Ag⁺ with I⁻', { x: 120, y: 55 }, { cat: 'Ag', an: 'I' })
        ],
        zones: {
          slots: w.slots,
          trays: [
            trayAt('solid', 'Forms solid precipitate', { x: 22, y: 25 }, { w: 32, h: 30 }),
            trayAt('dissolved', 'Stays in water (aq)', { x: 128, y: 25 }, { w: 32, h: 30 })
          ]
        }
      }),
      check(state) {
        const t = state.table;
        const solid = inTray(t, 'solid').map(p => p.id);
        const dissolved = inTray(t, 'dissolved').map(p => p.id);
        const total = solid.length + dissolved.length;
        if (total === 0) return { ok: false, notYet: true, msg: 'Test the reactions and sort the pair cards.' };
        if (total < 4) return { ok: false, notYet: true, msg: 'Four pair cards need to be sorted into the trays.' };

        if (solid.includes('pair_cai')) return { ok: false, msg: 'In the well, calcium iodide stays clear and dissolved in water.' };
        if (solid.includes('pair_agf')) return { ok: false, msg: 'In the well, silver fluoride stays clear and dissolved in water.' };
        if (dissolved.includes('pair_caf')) return { ok: false, msg: 'In the well, calcium fluoride forms an insoluble white precipitate.' };
        if (dissolved.includes('pair_agi')) return { ok: false, msg: 'In the well, silver iodide forms a bright yellow precipitate.' };

        return { ok: true };
      }
    };
  })(),

  /* -------------------------------------------------------------- 3 */
  (() => {
    const b = bondViewerFixture('bonds', { x: 75, y: 22 });
    return {
      id: 's3-bonds',
      title: 'What Holds Each Solid',
      prompt: 'What holds each of the two solids together?',
      widget,
      hints: [
        'Look at the particle diagrams in the two views.',
        'Check whether the clouds stay as separate spheres or merge between the nuclei.',
        'Match each diagram to whether opposite charges attract or clouds overlap.'
      ],
      reward: {
        log: 'Hard ions attract as charges; soft ions share clouds.',
        title: 'What Holds Each Solid',
        body: 'Hard ions stay as separate charged spheres that attract. Soft ions’ clouds stretch toward each other and share electrons.'
      },
      table: potTable({
        fixtures: [b.fixture],
        pieces: [
          hsabChip('chip_ionic', 'Attraction between opposite charges', { x: 42, y: 54 }, { type: 'ionic' }),
          hsabChip('chip_covalent', 'Sharing electrons where clouds overlap', { x: 108, y: 54 }, { type: 'covalent' })
        ],
        zones: {
          slots: b.slots
        }
      }),
      check(state) {
        const t = state.table;
        const s1 = seatedInSlot(t, 'bonds.1');
        const s2 = seatedInSlot(t, 'bonds.2');
        if (!s1 && !s2) return { ok: false, notYet: true, msg: 'Place the cards in the sockets under each diagram.' };
        if (!s1 || !s2) return { ok: false, notYet: true, msg: 'Both sockets need a card.' };

        if (s1.props.type !== 'ionic') {
          return { ok: false, msg: 'Ca²⁺ and F⁻ stay as separate charged spheres that attract.' };
        }
        if (s2.props.type !== 'covalent') {
          return { ok: false, msg: 'Ag⁺ and I⁻ clouds stretch toward each other and share electrons.' };
        }
        return { ok: true };
      }
    };
  })(),

  /* -------------------------------------------------------------- 4 (PREDICT) */
  {
    id: 's4-predict',
    title: 'Sulfide',
    predict: true,
    prompt: 'Which ions do you expect sulfide to form a solid with: Ag⁺, Ca²⁺, both or neither?',
    widget,
    hints: [
      'Pick the card that states your prediction.',
      'Compare the softness of sulfide with Ag⁺ and Ca²⁺.',
      'Decide whether sulfide will pair with the soft ion, the hard ion, both or neither.'
    ],
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, mix Ag⁺ and Ca²⁺ with sulfide in the wells to test your prediction.'
    },
    table: potTable({
      fixtures: [
        plaqueFixture('plk', 'Prediction', { x: 75, y: 11 }, [
          'Sulfide, S²⁻, is a large, soft ion.',
          'Ag⁺ is soft; Ca²⁺ is hard.'
        ])
      ],
      pieces: [
        hsabCard('g_ag', 'Only Ag⁺', { x: 21, y: 53 }, { guess: 'ag' }),
        hsabCard('g_ca', 'Only Ca²⁺', { x: 57, y: 53 }, { guess: 'ca' }),
        hsabCard('g_both', 'Both', { x: 93, y: 53 }, { guess: 'both' }),
        hsabCard('g_neither', 'Neither', { x: 129, y: 53 }, { guess: 'neither' })
      ],
      zones: {
        trays: [
          trayAt('choice', 'Your Prediction', { x: 75, y: 34 }, { w: 52, h: 12 })
        ]
      }
    }),
    onClear(state) {
      const card = inTray(state.table, 'choice')[0];
      if (card) remember(QUEST_KEY, card.props.guess);
    },
    check(state) {
      const picked = inTray(state.table, 'choice');
      if (!picked.length) return { ok: false, notYet: true, msg: 'Place your prediction card in the tray.' };
      return { ok: true };
    }
  },

  /* -------------------------------------------------------------- 5 */
  (() => {
    const w = wellsFixture('wells', { x: 75, y: 24 }, {
      w: 56, h: 30, label: 'Sulfide Reaction Wells',
      cat1: 'Ag', cat2: 'Ca', reagent: 'S'
    });
    return {
      id: 's5-test-sulfide',
      title: 'Test With Sulfide',
      get prompt() {
        const g = recall(QUEST_KEY);
        return g === 'ag'
          ? 'You expected only Ag⁺. Which solid forms when sulfide meets these ions?'
          : 'Which solid forms when sulfide meets these ions?';
      },
      widget,
      hints: [
        'Press "Mix" to react the test wells with sulfide, then place the solid in the tray.',
        'Compare what settles in the silver well with what stays clear in the calcium well.',
        'Collect the solid that settles in the wells.'
      ],
      reward: {
        log: 'Soft Ag⁺ formed black Ag₂S with soft S²⁻.',
        title: 'Sulfide Prediction Confirmed',
        body: 'Soft Ag⁺ formed black Ag₂S with soft S²⁻. Hard Ca²⁺ stayed dissolved.'
      },
      table: potTable({
        fixtures: [w.fixture],
        pieces: [
          hsabChip('chip_ag2s', 'Ag₂S(s)', { x: 35, y: 52 }, { formula: 'Ag2S' }),
          hsabChip('chip_cas', 'CaS(s)', { x: 115, y: 52 }, { formula: 'CaS' })
        ],
        zones: {
          slots: w.slots,
          trays: [
            trayAt('collector', 'Precipitated solid', { x: 75, y: 52 }, { w: 36, h: 14 })
          ]
        }
      }),
      check(state) {
        const t = state.table;
        const r = wellsRead(state, 'wells');
        const inBox = inTray(t, 'collector');
        if (!inBox.length) return { ok: false, notYet: true, msg: 'Press "Mix" on the wells and collect the precipitate.' };
        if (!r.ran) return { ok: false, notYet: true, msg: 'Press "Mix" to see which mixture forms a solid.' };

        if (inBox.some(p => p.props.formula === 'CaS')) {
          return { ok: false, msg: 'In the well, calcium sulfide remains dissolved in water.' };
        }
        if (inBox.every(p => p.props.formula === 'Ag2S')) return { ok: true };
        return { ok: false, msg: 'Collect the black silver sulfide precipitate.' };
      }
    };
  })(),

  /* -------------------------------------------------------------- 6 */
  (() => {
    const w = wellsFixture('wells', { x: 52, y: 24 }, {
      w: 56, h: 30, label: 'Wastewater Wells',
      cat1: 'Pb2', cat2: 'Mg',
      dials: { reagent: { min: 1, max: 2, step: 1, value: 1, label: 'Reagent', labels: ['Fluoride (F⁻)', 'Sulfide (S²⁻)'] } }
    });
    return {
      id: 's6-selective',
      title: 'Take Out the Lead',
      briefing: {
        title: 'Separating Two Ions',
        body: 'Lead ions, Pb²⁺, are large and soft; magnesium ions, Mg²⁺, are small and hard.'
      },
      prompt: 'Which reagent removes the lead from the water and leaves the magnesium dissolved?',
      widget,
      hints: [
        'Use the reagent dial on the wells and press "Mix", then place the matching card in the tray.',
        'Look for the reagent that forms a solid in the Pb²⁺ well while keeping the Mg²⁺ well clear.',
        'Compare what happens in both wells for fluoride and for sulfide.'
      ],
      reward: {
        log: 'Soft sulfide removed Pb²⁺ and left hard Mg²⁺ dissolved.',
        title: 'Separating Metals',
        body: 'Soft sulfide formed a solid with soft Pb²⁺ and left hard Mg²⁺ dissolved. Hard and soft is a rough guide, not a law.'
      },
      table: potTable({
        fixtures: [w.fixture],
        pieces: [
          hsabCard('card_fluoride', 'Sodium fluoride (F⁻)', { x: 35, y: 54 }, { reagent: 'F' }),
          hsabCard('card_sulfide', 'Sodium sulfide (S²⁻)', { x: 95, y: 54 }, { reagent: 'S' })
        ],
        zones: {
          slots: w.slots,
          trays: [
            trayAt('reagent_choice', 'Selected Reagent', { x: 122, y: 24 }, { w: 40, h: 24 })
          ]
        }
      }),
      check(state) {
        const t = state.table;
        const r = wellsRead(state, 'wells');
        const picked = inTray(t, 'reagent_choice');
        if (!picked.length) return { ok: false, notYet: true, msg: 'Test the reagents in the wells and place your choice in the tray.' };
        if (!r.ran) return { ok: false, notYet: true, msg: 'Press "Mix" on the wells first.' };

        const choice = picked[0].props.reagent;
        if (choice === 'F') {
          return { ok: false, msg: 'In the wells, fluoride forms a solid with Mg²⁺ and leaves Pb²⁺ dissolved.' };
        }
        return { ok: true };
      }
    };
  })()
];

/* ------------------------------------------------------------------
   RUNNER & STATE
   ------------------------------------------------------------------ */

export function stateFor(stageIndex, script) {
  const st = STAGES[stageIndex];
  if (!st) throw new Error(`unit07/q9-hsab: no stage ${stageIndex}`);
  return stateFromScript(st, script || []);
}

function blankState() { return {}; }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor, room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const DEBRIEF = {
  title: 'Hard and Soft',
  lines: [
    'Small ions hold tight electron clouds and are hard; large ions whose clouds pull out of shape are soft.',
    'Hard ions pair with hard ions and soft with soft, which helps predict which solids form.',
    'Soft sulfide precipitates soft Pb²⁺ from water while leaving hard Mg²⁺ dissolved.'
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS & MISSES FOR VERIFICATION
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

export const SOLUTIONS = [
  [
    put('ca', 'slot:probe.in'), run('probe'), put('ca', 'tray:hard'),
    put('f', 'slot:probe.in'), run('probe'), put('f', 'tray:hard'),
    put('ag', 'slot:probe.in'), run('probe'), put('ag', 'tray:soft'),
    put('i', 'slot:probe.in'), run('probe'), put('i', 'tray:soft')
  ],
  [
    run('wells'),
    dial('wells', 'reagent', 2),
    run('wells'),
    put('pair_caf', 'tray:solid'),
    put('pair_agi', 'tray:solid'),
    put('pair_cai', 'tray:dissolved'),
    put('pair_agf', 'tray:dissolved')
  ],
  [put('chip_ionic', 'slot:bonds.1'), put('chip_covalent', 'slot:bonds.2')],
  [put('g_ag', 'tray:choice')],
  [run('wells'), put('chip_ag2s', 'tray:collector')],
  [dial('wells', 'reagent', 2), run('wells'), put('card_sulfide', 'tray:reagent_choice')]
];

export const MISSES = [
  [put('ag', 'tray:hard'), put('ca', 'tray:hard'), put('f', 'tray:soft'), put('i', 'tray:soft')],
  [put('pair_cai', 'tray:solid'), put('pair_caf', 'tray:solid'), put('pair_agi', 'tray:dissolved'), put('pair_agf', 'tray:dissolved')],
  [put('chip_covalent', 'slot:bonds.1'), put('chip_ionic', 'slot:bonds.2')],
  [],
  [run('wells'), put('chip_cas', 'tray:collector')],
  [run('wells'), put('card_fluoride', 'tray:reagent_choice')]
];

export const CHECKS = {
  HSAB_DATA,
  SOLUTIONS,
  MISSES
};
