/**
 * Unit 5 · Bench 1 — Heat and Temperature (q1-flow)
 *
 * The wellhead's heat exchanger, and Ember Reach's first TABLETOP on the heat kit (`table/kits/heat.js`). Two benches' worth of
 * blocks and a cup, four stages, and ONE click: the belief that a hotter thing always has more heat to give.
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
import { heatTable, block, charge, note, cupFixture, blockRead, cupRead, shelvesRead, whereIs, fixed } from '../../table/kits/heat.js';

export const meta = { stageCount: 5 };

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
    prompt: 'Join two blocks so that both finish at 50 °C.',
    widget,
    table: heatTable({
      pieces: [
        block('a', 'Block A', { x: 20, y: 24 }, { m: 100, c: FE, T: 80, mat: 'Fe' }),
        block('b', 'Block B', { x: 52, y: 24 }, { m: 100, c: FE, T: 20, mat: 'Fe' }),
        block('c', 'Block C', { x: 84, y: 24 }, { m: 100, c: FE, T: 60, mat: 'Fe' }),
        block('d', 'Block D', { x: 116, y: 24 }, { m: 100, c: FE, T: 30, mat: 'Fe' })
      ]
    }),
    hints: [
      'Use the four blocks and the thermometer printed on each.',
      'Compare each block\'s starting reading with the 50 °C you want a pair to end at.',
      'Two blocks of one metal and one weight finish halfway between their starting readings.'
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
      return r.cluster.length === 2
        ? { ok: false, msg: `Those two blocks both read ${fixed(r.T, 1)} °C.` }
        : { ok: false, msg: `The group you joined holds ${r.cluster.length} blocks, and they read ${fixed(r.T, 1)} °C.` };
    },
    reward: {
      log: 'Two blocks met at one reading.',
      title: 'Thermal Equilibrium',
      body: 'Touching blocks transfer energy until they reach the same temperature, which is thermal equilibrium. The energy transferred from the hotter block to the colder one is heat (q), measured in joules (J).'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Which Would Thaw It?',
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
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 70, y: 44 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Compare the temperature on each card with how much material it holds.',
      'Commit to the card you expect to deliver more heat.'
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
      body: 'Next, test each source on the frozen valve and observe the temperature change.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-spark-tank',
    title: 'The Spark and the Tank',
    prompt: 'Warm the frozen valve as far as you can by joining it to a source.',
    widget,
    table: heatTable({
      pieces: [
        block('spark', 'Welding spark', { x: 24, y: 20 }, { m: 0.001, c: FE, T: 1200, mat: 'Fe', mass: '0.001 g iron' }),
        block('tank', 'Warm tank', { x: 126, y: 20 }, { m: 2000, c: WATER, T: 40, mat: 'H₂O', mass: '2000 g water' }),
        block('valve', 'Frozen valve', { x: 75, y: 44 }, { m: 500, c: FE, T: 0, mat: 'Fe', mass: '500 g iron' })
      ]
    }),
    hints: [
      'Use the three blocks and the thermometer printed on each.',
      'Compare how far the valve\'s reading rises after each source, and how much of each source there is.',
      'Heat transferred depends on the total mass of the source as well as its temperature.'
    ],
    check(state) {
      const r = blockRead(state.table, 'valve');
      if (!r.joined) return { ok: false, notYet: true, msg: 'Join the frozen valve to a source, then read its thermometer.' };
      if (r.T >= 30) return { ok: true };
      return { ok: false, msg: `The frozen valve reads ${fixed(r.T, 1)} °C.` };
    },
    reward: {
      log: 'The tank warmed the valve; the spark barely did.',
      title: 'Temperature Is Not Amount',
      body: 'Temperature (T) measures average particle motion, not total heat. Heat transferred (q) depends on mass (m) as well as temperature: the tank has vast mass, delivering far more heat than a tiny spark.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const c = cupFixture('cup', { x: 30, y: 32 }, { title: 'Cup', boundary: true, water: 100, T0: 22 });
    return {
      id: 's4-tins',
      title: 'Warmers, Packs and Tablets',
      prompt: 'Sort each tin by whether heat left the chemicals or entered them.',
      widget,
      table: heatTable({
        pieces: [
          charge('warmer', 'Hand warmer', { x: 70, y: 18 }, { moles: 0.04, dH: -165 }),
          charge('cold', 'Cold pack', { x: 92, y: 18 }, { moles: 0.08, dH: 26 }),
          charge('fizz', 'Fizzing tablet', { x: 70, y: 40 }, { moles: 0.05, dH: 28 }),
          charge('lime', 'Quicklime in water', { x: 92, y: 40 }, { moles: 0.05, dH: -65 })
        ],
        fixtures: [c.fixture],
        zones: {
          slots: [c.slot],
          trays: [
            { id: 'out', label: 'Heat leaves the chemicals', at: { x: 125, y: 20 }, size: { w: 44, h: 22 }, cell: 22, cellH: 14 },
            { id: 'in', label: 'Heat enters the chemicals', at: { x: 125, y: 47 }, size: { w: 44, h: 22 }, cell: 22, cellH: 14 }
          ]
        }
      }),
      hints: [
        'Use the cup, the four tins and the two trays.',
        'Compare the bath thermometer before and after each tin, and note that it sits in the water outside the dashed line.',
        'Water that warmed was given energy by the chemicals, and water that cooled gave energy to them.'
      ],
      check(state) {
        const t = state.table;
        const want = { warmer: 'out', lime: 'out', cold: 'in', fizz: 'in' };
        if (Object.keys(want).some(k => !['out', 'in'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Every tin needs a tray.' };
        const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
        if (!wrong) return { ok: true };
        const tin = t.pieces[wrong[0]];
        const tray = t.zones.trays[whereIs(t, wrong[0])];
        if (tin.props.rise == null) return { ok: false, msg: 'Not every tin has been in the cup yet.' };
        return { ok: false, msg: `The "${tray.label}" tray holds a tin whose bath ${tin.props.rise > 0 ? 'warmed' : 'cooled'}.` };
      },
      reward: {
        log: 'Two baths warmed and two cooled.',
        title: 'Exothermic and Endothermic',
        body: 'An exothermic process releases heat (q < 0), warming surroundings with a positive temperature change (ΔT > 0). An endothermic process absorbs heat (q > 0), cooling surroundings (negative ΔT). The chemicals are the system; the bath is the surroundings.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-unequal',
    title: 'Unequal Blocks',
    prompt: 'Join two blocks so that both finish at 27 °C.',
    widget,
    table: heatTable({
      pieces: [
        block('p', 'Water', { x: 20, y: 24 }, { m: 300, c: WATER, T: 20, mat: 'H₂O' }),
        block('q', 'Iron', { x: 52, y: 24 }, { m: 300, c: FE, T: 90, mat: 'Fe' }),
        block('r', 'Water', { x: 84, y: 24 }, { m: 100, c: WATER, T: 80, mat: 'H₂O' }),
        block('s', 'Iron', { x: 116, y: 24 }, { m: 100, c: FE, T: 20, mat: 'Fe' })
      ]
    }),
    hints: [
      'Use the four blocks and the thermometer printed on each.',
      'Compare each block\'s weight and material as well as its starting reading.',
      'The pair settles nearer the block that takes more energy to change its temperature, which is its mass times its specific heat capacity.'
    ],
    check(state) {
      const t = state.table;
      const groups = new Map();
      for (const id of ['p', 'q', 'r', 's']) {
        const r = blockRead(t, id);
        if (r.joined) groups.set([...r.cluster].sort().join(), r);
      }
      if (!groups.size) return { ok: false, notYet: true, msg: 'Join two blocks, then read their thermometers.' };
      for (const r of groups.values()) if (r.cluster.length === 2 && Math.abs(r.T - 27) < 0.6) return { ok: true };
      const r = [...groups.values()][0];
      return r.cluster.length === 2
        ? { ok: false, msg: `Those two blocks both read ${fixed(r.T, 1)} °C.` }
        : { ok: false, msg: `The group you joined holds ${r.cluster.length} blocks, and they read ${fixed(r.T, 1)} °C.` };
    },
    reward: {
      log: 'The pair settled nearer the block with more m × c.',
      title: 'Unequal Blocks',
      body: 'Joined blocks settle where the heat one loses equals the heat the other gains. Water holds far more energy per degree than iron, so 300 g of water at 20 °C and 300 g of iron at 90 °C settle at about 27 °C, not at the average.'
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag one block onto another to join them;', 'tap the gap between them to pull them apart.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Drag the frozen valve onto a source.'],
  4: ['Drag a tin onto the cup, then drag each tin into a tray.'],
  5: ['Drag one block onto another to join them;', 'tap the gap between them to pull them apart.']
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
      body: 'Heat (q) flows from hotter objects to colder ones until both reach thermal equilibrium. Temperature (T) measures average particle motion, whereas total heat transferred depends on mass (m) and temperature change (ΔT).'
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
  [...trials, ...sort({ warmer: 'out', lime: 'out', cold: 'in', fizz: 'in' })],
  [join('p', 'q')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [join('a', 'c')],
  [],
  [join('valve', 'spark')],
  [...trials, ...sort({ warmer: 'out', lime: 'in', cold: 'in', fizz: 'out' })],
  [join('r', 's')]
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
