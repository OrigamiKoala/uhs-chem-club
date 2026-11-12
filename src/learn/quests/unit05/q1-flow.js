/**
 * Unit 5 · Bench 1 — Heat and Temperature (q1-flow)
 *
 * The wellhead's heat exchanger, and Ember Reach's first TABLETOP on the heat kit (`table/kits/heat.js`). Two benches' worth of
 * blocks and a cup, four stages (a fifth, Unequal Blocks, was retired on 2026-11-11: `archive/2026-11-11/ember/`), and ONE click: the belief that a hotter thing always has more heat to give.
 *
 *   1  join two blocks so both finish at 50 °C         -> thermal equilibrium, heat
 *   2  PREDICT: the welding spark (1200 °C) or the warm tank (40 °C) thaws the frozen valve?
 *   3  TEST: touch the frozen valve to each             -> temperature is not the amount of energy
 *   4  four tins in a cup, sorted by which way heat went -> exothermic, endothermic, system, surroundings
 *
 * THE WRONG MODEL IS ON THE TABLE. The spark is the hotter body by a factor of thirty, and a card for it sits beside the tank's in the
 * prediction; the valve's thermometer settles it. Stage 4's fizzing tablet is the other trap: it looks lively and takes heat in.
 *
 * THE EVIDENCE IS ON THE BENCH. The cup prints no verdict: the player reads the thermometer. A tin that has been in the cup keeps what the
 * bath did, so the four can be compared once they are out of it again.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { heatTable, block, charge, note, cupFixture, latticeFixture, leadFixture, blockRead, cupRead, shelvesRead, whereIs, fixed } from '../../table/kits/heat.js';

export const meta = { stageCount: 4 };

export const VOCABULARY = [
  { term: /\bthermal equilibrium\b/i, introducedAt: 1 },
  { term: /\bheat\b/i, introducedAt: 1 },
  { term: /\bexothermic\b/i, introducedAt: 4 },
  { term: /\bendothermic\b/i, introducedAt: 4 },
  { term: /\bsystem\b/i, introducedAt: 4 },
  { term: /\bsurroundings\b/i, introducedAt: 4 }
];

/** Temperature as the average motion of particles is Bellows' idea. */
export const BUILDS_ON = ['unit04/q1-knocks'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const FE = 0.449;
const WATER = 4.184;
const MOUTH = 'slot:cup.mouth';

/** The key the player's guess is kept under (`engine/predict.js`), and what each card is called in the test's prompt. */
const QUEST_KEY = 'unit05/q1-flow';
const GUESS_LABEL = { spark: 'the welding spark', tank: 'the warm tank', same: 'both the same' };

/* ------------------------------------------------------------------
   THE FOUR STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-meet',
    title: 'Where Two Blocks Meet',
    briefing: { speaker: SPEAKER, body: 'Temperature tells how fast the particles of a thing are moving, and heat is energy that passes from a hotter thing to a colder one. Two touching blocks pass heat until they are at one temperature, which is called thermal equilibrium.' },
    prompt: 'Which two blocks reach thermal equilibrium at 50 °C?',
    widget,
    table: heatTable({
      pieces: [
        block('a', 'Block A', { x: 20, y: 24 }, { m: 100, c: FE, T: 80, mat: 'Fe' }),
        block('b', 'Block B', { x: 52, y: 24 }, { m: 100, c: FE, T: 20, mat: 'Fe' }),
        block('c', 'Block C', { x: 84, y: 24 }, { m: 100, c: FE, T: 60, mat: 'Fe' }),
        block('d', 'Block D', { x: 116, y: 24 }, { m: 100, c: FE, T: 30, mat: 'Fe' })
      ],
      fixtures: [latticeFixture('atoms', { x: 70, y: 48 }, { blocks: ['a', 'b', 'c', 'd'], w: 128, h: 20 })]
    }),
    hints: [
      'Look at the thermometer printed on each block, and at the box of particles under it with the same name.',
      'Join a pair and watch which particles change first, then compare where the two readings end with where each began.',
      'The four blocks are the same metal and the same size, so compare the heat one block loses with the heat the other gains.'
    ],
    check(state) {
      const t = state.table;
      const groups = new Map();
      for (const id of ['a', 'b', 'c', 'd']) {
        const r = blockRead(t, id);
        if (r.joined) groups.set([...r.cluster].sort().join(), r);
      }
      if (!groups.size) return { ok: false, notYet: true, msg: 'Join two blocks, then read their thermometers.' };
      for (const r of groups.values()) if (r.cluster.length === 2 && Math.abs(r.T - 50) < 0.5) return { ok: true };
      const r = [...groups.values()][0];
      const began = r.cluster.map(id => t.pieces[id].props.T).sort((x, y) => y - x);
      return r.cluster.length === 2
        ? { ok: false, msg: `Those two blocks began at ${began[0]} °C and ${began[1]} °C, and both finished at ${fixed(r.T, 1)} °C.` }
        : { ok: false, msg: `The group you joined holds ${r.cluster.length} blocks, and they all finished at ${fixed(r.T, 1)} °C.` };
    },
    reward: {
      log: 'Two blocks met at one reading.',
      title: 'Thermal Equilibrium',
      body: 'Heat passed from the hotter block to the colder one until both were at one temperature. Two equal blocks reach thermal equilibrium halfway between their starting temperatures.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Spark or Tank?',
    // A PREDICT STAGE: the blocks are not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which will warm the frozen valve more: the welding spark or the warm tank?',
    widget,
    table: heatTable({
      pieces: [
        note('spark', 'Welding spark: 1200 °C, one speck of iron', { x: 24, y: 16 }),
        note('tank', 'Warm tank: 40 °C, a tankful of water', { x: 70, y: 16 }),
        note('same', 'They warm the valve the same', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'meet', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 118, y: 46 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Read what each card gives: a temperature, and how much material there is.',
      'The clip shows two equal blocks, but here the spark is one speck and the tank is a tankful.',
      'Think about how much energy each source can pass on before it and the valve are at one temperature.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, join the frozen valve to each source and see how far it warms.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-spark-tank',
    title: 'The Spark and the Tank',
    prompt: 'Which source warms the frozen valve more: the welding spark or the warm tank?',
    widget,
    table: heatTable({
      pieces: [
        block('spark', 'Welding spark', { x: 24, y: 16 }, { m: 0.001, c: FE, T: 1200, mat: 'Fe', mass: '0.001 g iron' }),
        block('tank', 'Warm tank', { x: 126, y: 16 }, { m: 2000, c: WATER, T: 40, mat: 'H₂O', mass: '2000 g water' }),
        block('valve', 'Frozen valve', { x: 75, y: 16 }, { m: 500, c: FE, T: 0, mat: 'Fe', mass: '500 g iron' })
      ],
      fixtures: [latticeFixture('atoms', { x: 70, y: 44 }, { blocks: ['spark', 'valve', 'tank'], w: 128, h: 20 })]
    }),
    hints: [
      'Look at the thermometer on the frozen valve, and at the named box of particles under each block.',
      'Compare how many particles are in the box of the welding spark and in the box of the warm tank.',
      'A source stops passing heat on once it and the valve are at one temperature, so think about how much energy each source can lose before then.'
    ],
    check(state) {
      const r = blockRead(state.table, 'valve');
      if (!r.joined) return { ok: false, notYet: true, msg: 'Join the frozen valve to a source, then read its thermometer.' };
      if (r.T >= 30) return { ok: true };
      return { ok: false, msg: `Joined to the welding spark, the frozen valve reads ${fixed(r.T, 1)} °C: the spark fell to that reading almost at once.` };
    },
    reward: {
      log: 'The tank warmed the valve; the spark barely did.',
      title: 'Temperature Is Not Amount',
      body: 'Temperature tells how fast the particles move, not how much energy there is. The tank is cooler than the spark but holds far more material, so it passed on far more energy as heat.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const c = cupFixture('cup', { x: 30, y: 32 }, { title: 'Cup', boundary: true, water: 100, T0: 22 });
    return {
      id: 's4-tins',
      title: 'Warmers, Packs and Tablets',
      briefing: { speaker: SPEAKER, body: 'The sample inside the dashed line is the system, and the water around it, called the bath, is the surroundings. A change that gives heat out to the surroundings is exothermic; one that takes heat in from them is endothermic.' },
      prompt: 'Which samples are exothermic and which are endothermic?',
      widget,
      table: heatTable({
        pieces: [
          charge('warmer', 'Hand warmer', { x: 70, y: 18 }, { moles: 0.04, dH: -165 }),
          charge('cold', 'Cold pack', { x: 92, y: 18 }, { moles: 0.08, dH: 26 }),
          charge('fizz', 'Fizzing tablet', { x: 70, y: 40 }, { moles: 0.05, dH: 28 }),
          charge('lime', 'Quicklime', { x: 92, y: 40 }, { moles: 0.05, dH: -65 })
        ],
        fixtures: [c.fixture],
        zones: {
          slots: [c.slot],
          trays: [
            { id: 'out', label: 'Exothermic', at: { x: 125, y: 20 }, size: { w: 44, h: 22 }, cell: 22, cellH: 14 },
            { id: 'in', label: 'Endothermic', at: { x: 125, y: 47 }, size: { w: 44, h: 22 }, cell: 22, cellH: 14 }
          ]
        }
      }),
      hints: [
        'Look at the thermometer, which sits in the bath outside the dashed line.',
        'Drop each sample in the cup and compare the reading of the bath before and after.',
        'A bath that warmed was given energy by the sample, and a bath that cooled gave energy to it.'
      ],
      check(state) {
        const t = state.table;
        const want = { warmer: 'out', lime: 'out', cold: 'in', fizz: 'in' };
        if (Object.keys(want).some(k => !['out', 'in'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every sample needs a tray.' };
        const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
        if (!wrong) return { ok: true };
        const tin = t.pieces[wrong[0]];
        const tray = t.zones.trays[whereIs(t, wrong[0])];
        if (tin.props.rise == null) return { ok: false, msg: 'Not every sample has been in the cup yet.' };
        return { ok: false, msg: `The bath ${tin.props.rise > 0 ? 'warmed' : 'cooled'} around a sample you put in the "${tray.label}" tray.` };
      },
      reward: {
        log: 'Two baths warmed and two cooled.',
        title: 'Exothermic and Endothermic',
        body: 'Exothermic means the system gives heat out, so the surroundings warm. Endothermic means it takes heat in, so they cool.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag one block onto another to join them;', 'tap the gap between them to pull them apart.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Drag the frozen valve onto a source.'],
  4: ['Drag a sample onto the cup, then drag each sample into a tray.']
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
      body: 'Heat passes from hotter things to colder ones until they reach thermal equilibrium. Temperature tells how fast the particles move; how much energy a thing can pass on as heat also depends on how much of it there is.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by direct actions,
   by drag and by two taps. Nothing here says what a reading is.
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const join = (a, b) => put(a, `piece:${b}`);
const sort = spec => Object.entries(spec).map(([id, tray]) => put(id, `tray:${tray}`));
const trials = ['warmer', 'cold', 'fizz', 'lime'].map(id => put(id, MOUTH));

export const SOLUTIONS = [
  [join('a', 'b')],
  [put('tank', 'slot:guess')],
  [join('valve', 'tank')],
  [...trials, ...sort({ warmer: 'out', lime: 'out', cold: 'in', fizz: 'in' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [join('a', 'c')],
  [],
  [join('valve', 'spark')],
  [...trials, ...sort({ warmer: 'out', lime: 'in', cold: 'in', fizz: 'out' })]
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
