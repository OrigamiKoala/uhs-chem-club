/**
 * Unit 7 · Bench 9 — Hard and Soft (q9-hsab)
 *
 * The refining vat, on the pot kit (`table/kits/pot-hsab.js`):
 *   - The Firmness Probe (`hsabprobe`): tests electron cloud polarizability under an electric field.
 *   - The Reaction Wells (`hsabwells`): tests precipitation and solubility of hard vs soft ion pairs.
 *   - The Bond Viewer (`hsabbond`): shows ionic charge attraction vs covalent cloud overlap.
 *
 * Eight stages and ONE click: the discovery that solubility and precipitation are governed by ion firmness,
 * where like pairs with like (hard prefers hard, soft prefers soft).
 *
 *   1  test four ions in the probe; sort into hard (rigid) and soft (squishy)    -> hard ion, soft ion
 *   2  test Ca2+ and Ag+ with F- and I-; observe which pairs form solids         -> hard-soft principle
 *   3  PREDICT (the click): will soft silver precipitate with OH- or S2-?        (held model: all halides/anions behave alike)
 *   4  TEST: mix silver and calcium with sulfide; collect the solid that forms   -> polarizability
 *   5  particle diagrams of CaF2 vs AgI: match ionic attraction vs covalent      -> ionic attraction, covalent overlap
 *   6  predict partner exchange when mismatched CaI2 meets AgF                   -> partner exchange
 *   7  select the reagent that precipitates soft lead while leaving magnesium    -> selective precipitation
 *   8  sealed: test three unlabelled foundry jars with calcium and silver        -> hard soft acid base theory
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, plaqueFixture, stmt, chip } from '../../table/kits/pot.js';
import {
  probeFixture, wellsFixture, bondViewerFixture, hsabCard, hsabChip, probeRead, wellsRead
} from '../../table/kits/pot-hsab.js';
import { ionPuck } from '../../table/kits/pot-ionic.js';
import {
  probeIon, isHard, pairOutcome, swapOutcome, selectivePrecipitation, HSAB_DATA
} from '../../engine/reactdata-hsab.js';
import { pretty } from '../../engine/reactdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bhard ions?\b/i, introducedAt: 1 },
  { term: /\bsoft ions?\b/i, introducedAt: 1 },
  { term: /\bhard[–-]soft principle\b/i, introducedAt: 2 },
  { term: /\bpolari[sz]ability\b/i, introducedAt: 4 },
  { term: /\bionic attraction\b/i, introducedAt: 5 },
  { term: /\bcovalent overlap\b/i, introducedAt: 5 },
  { term: /\bpartner exchange\b/i, introducedAt: 6 },
  { term: /\bselective precipitation\b/i, introducedAt: 7 },
  { term: /\bhard soft acid base theory\b|\bHSAB theory\b/i, introducedAt: 8 }
];

export const BUILDS_ON = ['unit07/q1-recipe', 'unit07/q5-ionic'];

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
   STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* -------------------------------------------------------------- 1 */
  (() => {
    const p = probeFixture('probe', { x: 75, y: 24 });
    return {
      id: 's1-probe',
      title: 'Firmness Probe',
      prompt: 'Test each ion in the probe and sort them by how easily their cloud deforms.',
      widget,
      hints: [
        'Drag an ion into the probe socket and press "Test".',
        'Look at whether the electron cloud holds its shape or squishes.',
        'Put ions with rigid clouds in the hard tray and ions with squishy clouds in the soft tray.'
      ],
      reward: {
        log: 'Small ions hold rigid clouds; large ions squish easily.',
        title: 'Hard and Soft Ions',
        body: 'A hard ion has a small, compact electron cloud that resists deformation. A soft ion is larger, with a squishy cloud that deforms easily.'
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
            trayAt('hard', 'Hard (rigid cloud)', { x: 22, y: 25 }, { w: 32, h: 30 }),
            trayAt('soft', 'Soft (squishy cloud)', { x: 128, y: 25 }, { w: 32, h: 30 })
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
          return { ok: false, msg: 'The probe shows silver and iodide squish easily under the electric field.' };
        }
        if (soft.includes('Ca') || soft.includes('F')) {
          return { ok: false, msg: 'The probe shows calcium and fluoride hold a rigid, compact cloud.' };
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
      title: 'The Pairing Flip',
      prompt: 'Test each cation with fluoride and iodide, then sort the pairs by whether a solid forms.',
      widget,
      hints: [
        'Use the reagent dial on the wells and press "Mix".',
        'Compare which well turns cloudy with fluoride against which turns cloudy with iodide.',
        'Hard calcium precipitates with hard fluoride, while soft silver precipitates with soft iodide.'
      ],
      reward: {
        log: 'Like pairs stick together and precipitate.',
        title: 'The Hard-Soft Principle',
        body: 'Under the hard–soft principle, like pairs stick together: hard cations bind hard anions, and soft cations bind soft anions. Mismatched pairs stay dissolved.'
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

  /* -------------------------------------------------------------- 3 (PREDICT) */
  {
    id: 's3-predict',
    title: 'Predict: Sulfide vs Hydroxide',
    predict: true,
    prompt: 'Will soft silver ions precipitate with hard hydroxide or soft sulfide?',
    widget,
    hints: [
      'Pick the card that states your prediction.',
      'Compare the softness of silver with the softness of sulfide and hydroxide.',
      'Consider whether like partners or mismatched partners form stronger bonds.'
    ],
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, mix the solutions in the wells to test the prediction.'
    },
    table: potTable({
      fixtures: [
        plaqueFixture('plk', 'Prediction', { x: 75, y: 11 }, [
          'PREDICT: SILVER PRECIPITATION',
          'Silver (Ag⁺) is a soft cation.',
          'Hydroxide (OH⁻) is hard; sulfide (S²⁻) is soft.'
        ])
      ],
      pieces: [
        hsabCard('g_soft_s', 'Silver precipitates with soft sulfide', { x: 21, y: 53 }, { guess: 'soft_s' }),
        hsabCard('g_hard_oh', 'Silver precipitates with hard hydroxide', { x: 57, y: 53 }, { guess: 'hard_oh' }),
        hsabCard('g_both', 'Silver precipitates equally with both', { x: 93, y: 53 }, { guess: 'both' }),
        hsabCard('g_neither', 'Silver stays dissolved with both', { x: 129, y: 53 }, { guess: 'neither' })
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

  /* -------------------------------------------------------------- 4 */
  (() => {
    const w = wellsFixture('wells', { x: 75, y: 24 }, {
      w: 56, h: 30, label: 'Sulfide Reaction Wells',
      cat1: 'Ag', cat2: 'Ca', reagent: 'S'
    });
    return {
      id: 's4-test-sulfide',
      title: 'Test with Sulfide',
      get prompt() {
        const g = recall(QUEST_KEY);
        return g === 'soft_s'
          ? 'Test your prediction by mixing silver and calcium with sulfide, and collect the solid.'
          : 'Mix silver and calcium with sulfide, and collect the solid that forms.';
      },
      widget,
      hints: [
        'Press "Mix" to react the test wells with sulfide.',
        'Look for the black solid that settles at the bottom of the silver well.',
        'Soft silver binds soft sulfide to form insoluble silver sulfide.'
      ],
      get reward() {
        return {
          log: 'Soft silver binds soft sulfide into black Ag₂S.',
          title: 'Polarizability and Sulfides',
          body: 'Soft silver binds soft sulfide into insoluble black Ag₂S, while hard calcium sulfide stays in the water. High polarizability allows soft electron clouds to share density.'
        };
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
          return { ok: false, msg: 'In the well, calcium sulfide remains completely dissolved in water.' };
        }
        if (inBox.every(p => p.props.formula === 'Ag2S')) return { ok: true };
        return { ok: false, msg: 'Collect the black silver sulfide precipitate.' };
      }
    };
  })(),

  /* -------------------------------------------------------------- 5 */
  (() => {
    const b = bondViewerFixture('bonds', { x: 75, y: 22 });
    return {
      id: 's5-bonds',
      title: 'Bond Nature',
      prompt: 'Match each pair to the bond that holds its solid together.',
      widget,
      hints: [
        'Look at the particle diagrams in the two windows.',
        'Check whether the clouds remain separate spheres or merge together.',
        'Hard-hard pairs rely on ionic attraction; soft-soft pairs rely on covalent overlap.'
      ],
      reward: {
        log: 'Hard pairs bind electrostatically; soft pairs share clouds covalently.',
        title: 'Ionic Attraction vs Covalent Overlap',
        body: 'Hard–hard solids are held by strong ionic attraction between compact charges. Soft–soft solids are held by covalent overlap between deformed clouds.'
      },
      table: potTable({
        fixtures: [b.fixture],
        pieces: [
          hsabChip('chip_ionic', 'Ionic attraction between compact charges', { x: 42, y: 54 }, { type: 'ionic' }),
          hsabChip('chip_covalent', 'Covalent overlap between squishy clouds', { x: 108, y: 54 }, { type: 'covalent' })
        ],
        zones: {
          slots: b.slots
        }
      }),
      check(state) {
        const t = state.table;
        const s1 = seatedInSlot(t, 'bonds.1');
        const s2 = seatedInSlot(t, 'bonds.2');
        if (!s1 && !s2) return { ok: false, notYet: true, msg: 'Place the explanation chips in the sockets under each diagram.' };
        if (!s1 || !s2) return { ok: false, notYet: true, msg: 'Both sockets need an explanation chip.' };

        if (s1.props.type !== 'ionic') {
          return { ok: false, msg: 'Ca²⁺ and F⁻ are rigid compact spheres held by electrostatic charge attraction.' };
        }
        if (s2.props.type !== 'covalent') {
          return { ok: false, msg: 'Ag⁺ and I⁻ are squishy, deformable clouds that share electrons through orbital overlap.' };
        }
        return { ok: true };
      }
    };
  })(),

  /* -------------------------------------------------------------- 6 */
  {
    id: 's6-partner-exchange',
    title: 'Partner Exchange',
    prompt: 'Place the two solids that precipitate when calcium iodide meets silver fluoride.',
    widget,
    hints: [
      'Look at the hard and soft character of the four ions.',
      'Match hard cations with hard anions and soft cations with soft anions.',
      'Calcium pairs with fluoride, while silver pairs with iodide.'
    ],
    reward: {
      log: 'Ions swap partners to pair like with like.',
      title: 'Partner Exchange',
      body: 'In partner exchange, mismatched soluble salts swap ions so hard binds hard and soft binds soft, precipitating both CaF₂ and AgI.'
    },
    table: potTable({
      fixtures: [
        plaqueFixture('plk', 'Partner Exchange', { x: 75, y: 11 }, [
          'PARTNER EXCHANGE: CaI₂(aq) + 2 AgF(aq)',
          'Both starting salts are mismatched and soluble in water.',
          'When mixed, ions trade partners to form matched pairs.'
        ])
      ],
      pieces: [
        hsabChip('chip_caf2', 'CaF₂(s)', { x: 21, y: 53 }, { formula: 'CaF2', solid: true }),
        hsabChip('chip_agi', 'AgI(s)', { x: 57, y: 53 }, { formula: 'AgI', solid: true }),
        hsabChip('chip_cai2', 'CaI₂(s)', { x: 93, y: 53 }, { formula: 'CaI2', solid: false }),
        hsabChip('chip_agf', 'AgF(s)', { x: 129, y: 53 }, { formula: 'AgF', solid: false })
      ],
      zones: {
        trays: [
          trayAt('products', 'Precipitated Products', { x: 75, y: 34 }, { w: 52, h: 14 })
        ]
      }
    }),
    check(state) {
      const t = state.table;
      const inBox = inTray(t, 'products');
      if (!inBox.length) return { ok: false, notYet: true, msg: 'Place the precipitating product chips in the tray.' };
      if (inBox.length < 2) return { ok: false, notYet: true, msg: 'Two matched solids precipitate from the mixture.' };

      if (inBox.some(p => p.props.formula === 'CaI2')) {
        return { ok: false, msg: 'Calcium iodide is a mismatched pair and remains dissolved in water.' };
      }
      if (inBox.some(p => p.props.formula === 'AgF')) {
        return { ok: false, msg: 'Silver fluoride is a mismatched pair and remains dissolved in water.' };
      }
      const forms = inBox.map(p => p.props.formula);
      if (forms.includes('CaF2') && forms.includes('AgI')) return { ok: true };
      return { ok: false, msg: 'Hard calcium binds hard fluoride, and soft silver binds soft iodide.' };
    }
  },

  /* -------------------------------------------------------------- 7 */
  {
    id: 's7-selective',
    title: 'Selective Precipitation',
    prompt: 'Choose the reagent that precipitates lead without precipitating magnesium from the runoff.',
    widget,
    hints: [
      'Compare the softness of lead and magnesium against fluoride and sulfide.',
      'Check which reagent forms a solid with soft lead while leaving hard magnesium dissolved.',
      'Soft sulfide precipitates soft lead while leaving hard magnesium dissolved.'
    ],
    reward: {
      log: 'Soft bases capture heavy metals selectively.',
      title: 'Selective Precipitation',
      body: 'Selective precipitation uses soft reagents to capture toxic soft metals like lead as insoluble sulfides, while hard light metals remain dissolved in the effluent.'
    },
    table: potTable({
      fixtures: [
        plaqueFixture('plk', 'Effluent', { x: 75, y: 11 }, [
          'FOUNDRY RUNOFF EFFLUENT',
          'Contains hard Mg²⁺ and toxic soft Pb²⁺.',
          'Goal: precipitate lead while keeping magnesium dissolved.'
        ])
      ],
      pieces: [
        hsabCard('card_fluoride', 'Sodium fluoride (hard F⁻)', { x: 45, y: 53 }, { reagent: 'F' }),
        hsabCard('card_sulfide', 'Sodium sulfide (soft S²⁻)', { x: 105, y: 53 }, { reagent: 'S' })
      ],
      zones: {
        trays: [
          trayAt('reagent_choice', 'Selected Reagent', { x: 75, y: 34 }, { w: 52, h: 14 })
        ]
      }
    }),
    check(state) {
      const t = state.table;
      const inBox = inTray(t, 'reagent_choice');
      if (!inBox.length) return { ok: false, notYet: true, msg: 'Place your chosen reagent in the tray.' };

      const r = inBox[0].props.reagent;
      if (r === 'F') {
        return { ok: false, msg: 'Fluoride is hard and precipitates hard magnesium as MgF₂, failing selective separation.' };
      }
      if (r === 'S') return { ok: true };
      return { ok: false, msg: 'Choose the soft reagent that binds soft lead.' };
    }
  },

  /* -------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Sealed Foundry Reagents',
    prompt: 'Test each sealed jar with calcium and silver to identify the three anions.',
    widget,
    hints: [
      'Use the reaction wells to observe whether Jar A, B, and C precipitate with calcium or silver.',
      'Look at whether a precipitate forms with hard calcium or soft silver.',
      'Fluoride precipitates only with calcium, while iodide and sulfide precipitate with silver.'
    ],
    reward: {
      log: 'Ion firmness predicts reaction outcomes across all solutions.',
      title: 'Hard Soft Acid Base Theory',
      body: 'Hard soft acid base theory predicts solubility and reactions by matching ion firmness: hard prefers hard, and soft prefers soft across every solution.'
    },
    table: potTable({
      fixtures: [
        plaqueFixture('plk', 'Reagents', { x: 75, y: 13 }, [
          'SEALED FOUNDRY REAGENTS: JARS A, B, C',
          'Jar A: forms white solid with Ca²⁺, clear with Ag⁺.',
          'Jar B: forms yellow solid with Ag⁺, clear with Ca²⁺.',
          'Jar C: forms black solid with Ag⁺, clear with Ca²⁺.'
        ])
      ],
      pieces: [
        hsabChip('chip_f', 'Fluoride (F⁻)', { x: 32, y: 53 }, { an: 'F' }),
        hsabChip('chip_i', 'Iodide (I⁻)', { x: 75, y: 53 }, { an: 'I' }),
        hsabChip('chip_s', 'Sulfide (S²⁻)', { x: 118, y: 53 }, { an: 'S' })
      ],
      zones: {
        trays: [
          trayAt('slot_a', 'Jar A identity', { x: 32, y: 36 }, { w: 30, h: 12 }),
          trayAt('slot_b', 'Jar B identity', { x: 75, y: 36 }, { w: 30, h: 12 }),
          trayAt('slot_c', 'Jar C identity', { x: 118, y: 36 }, { w: 30, h: 12 })
        ]
      }
    }),
    check(state) {
      const t = state.table;
      const a = inTray(t, 'slot_a')[0];
      const b = inTray(t, 'slot_b')[0];
      const c = inTray(t, 'slot_c')[0];

      if (!a && !b && !c) return { ok: false, notYet: true, msg: 'Place an identity chip into each jar slot.' };
      if (!a || !b || !c) return { ok: false, notYet: true, msg: 'All three jars must be identified.' };

      if (a.props.an !== 'F') {
        return { ok: false, msg: 'Jar A precipitates with hard calcium, so its anion must be hard fluoride.' };
      }
      if (b.props.an !== 'I') {
        return { ok: false, msg: 'Jar B precipitates yellow with silver, which is silver iodide.' };
      }
      if (c.props.an !== 'S') {
        return { ok: false, msg: 'Jar C precipitates black with silver, which is silver sulfide.' };
      }
      return { ok: true };
    }
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS & MISSES FOR VERIFICATION
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

export const SOLUTIONS = [
  // 1: ca and f in hard, ag and i in soft
  [
    put('ca', 'slot:probe.in'), run('probe'), put('ca', 'tray:hard'),
    put('f', 'slot:probe.in'), run('probe'), put('f', 'tray:hard'),
    put('ag', 'slot:probe.in'), run('probe'), put('ag', 'tray:soft'),
    put('i', 'slot:probe.in'), run('probe'), put('i', 'tray:soft')
  ],
  // 2: caf and agi in solid, cai and agf in dissolved
  [
    run('wells'),
    dial('wells', 'reagent', 2),
    run('wells'),
    put('pair_caf', 'tray:solid'),
    put('pair_agi', 'tray:solid'),
    put('pair_cai', 'tray:dissolved'),
    put('pair_agf', 'tray:dissolved')
  ],
  // 3: predict soft_s
  [put('g_soft_s', 'tray:choice')],
  // 4: mix and collect ag2s
  [run('wells'), put('chip_ag2s', 'tray:collector')],
  // 5: ionic under 1, covalent under 2
  [put('chip_ionic', 'slot:bonds.1'), put('chip_covalent', 'slot:bonds.2')],
  // 6: caf2 and agi in products
  [put('chip_caf2', 'tray:products'), put('chip_agi', 'tray:products')],
  // 7: sulfide reagent
  [put('card_sulfide', 'tray:reagent_choice')],
  // 8: A=F, B=I, C=S
  [put('chip_f', 'tray:slot_a'), put('chip_i', 'tray:slot_b'), put('chip_s', 'tray:slot_c')]
];

export const MISSES = [
  // 1: ag in hard
  [put('ag', 'tray:hard'), put('ca', 'tray:hard'), put('f', 'tray:soft'), put('i', 'tray:soft')],
  // 2: cai in solid
  [put('pair_cai', 'tray:solid'), put('pair_caf', 'tray:solid'), put('pair_agi', 'tray:dissolved'), put('pair_agf', 'tray:dissolved')],
  // 3: predict stage (no wrong answers)
  [],
  // 4: cas collected
  [run('wells'), put('chip_cas', 'tray:collector')],
  // 5: swapped
  [put('chip_covalent', 'slot:bonds.1'), put('chip_ionic', 'slot:bonds.2')],
  // 6: agf in products
  [put('chip_agf', 'tray:products'), put('chip_caf2', 'tray:products')],
  // 7: fluoride reagent
  [put('card_fluoride', 'tray:reagent_choice')],
  // 8: swapped B and C
  [put('chip_f', 'tray:slot_a'), put('chip_s', 'tray:slot_b'), put('chip_i', 'tray:slot_c')]
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
    'Ions are not all the same firmness. Small compact ions hold tight rigid clouds, while large squishy ions deform easily under an electric field.',
    'Hard cations lock to hard anions with intense ionic attraction. Soft cations bind soft anions through covalent cloud overlap.',
    'Hard soft acid base theory explains why calcium fluorite and silver sulfides form the foundry ores, and lets us selectively separate metals from the waste stream.'
  ]
};

export const CHECKS = {
  HSAB_DATA,
  SOLUTIONS,
  MISSES
};
