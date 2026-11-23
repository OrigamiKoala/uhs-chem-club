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
import { heatTable, block, charge, note, tag, cupFixture, latticeFixture, leadFixture, blockRead, cupRead, shelvesRead, whereIs, fixed } from '../../table/kits/heat.js';

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
    briefing: { speaker: SPEAKER, body: 'Temperature measures how fast particles move on average, while heat is energy flowing from a hotter object to a colder one. When two blocks touch, heat flows until both reach the same temperature, called thermal equilibrium.' },
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
      'Check the thermometer on each block and the matching particle box directly below it.',
      'Join a pair of blocks and compare their final temperature with their starting temperatures.',
      'All four blocks have the same mass and metal, so the heat one block loses equals the heat the other gains.'
    ],
    check(state) {
      const t = state.table;
      const groups = new Map();
      for (const id of ['a', 'b', 'c', 'd']) {
        const r = blockRead(t, id);
        if (r.joined) groups.set([...r.cluster].sort().join(), r);
      }
      if (!groups.size) return { ok: false, notYet: true, msg: 'Join two blocks first, then check their thermometers.' };
      for (const r of groups.values()) if (r.cluster.length === 2 && Math.abs(r.T - 50) < 0.5) return { ok: true };
      const r = [...groups.values()][0];
      const began = r.cluster.map(id => t.pieces[id].props.T).sort((x, y) => y - x);
      return r.cluster.length === 2
        ? { ok: false, msg: `Those two blocks started at ${began[0]} °C and ${began[1]} °C, and settled at ${fixed(r.T, 1)} °C.` }
        : { ok: false, msg: `You joined ${r.cluster.length} blocks, and they settled at ${fixed(r.T, 1)} °C.` };
    },
    reward: {
      log: 'Two blocks met at the same temperature.',
      title: 'Thermal Equilibrium',
      body: 'Heat flowed from the hotter block to the colder one until both reached the same temperature. Two identical blocks reach thermal equilibrium halfway between their starting temperatures.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Spark or Tank?',
    // A PREDICT STAGE: the blocks are not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which warms a frozen pipe valve more: a welding spark or a warm water tank?',
    widget,
    table: heatTable({
      pieces: [
        note('spark', 'Welding spark: 1200 °C, tiny speck of iron', { x: 24, y: 16 }),
        note('tank', 'Warm tank: 40 °C, full tank of water', { x: 70, y: 16 }),
        note('same', 'Both warm the valve the same', { x: 116, y: 16 })
      ],
      fixtures: [leadFixture('lead', { x: 36, y: 44 }, { scene: 'meet', asymmetric: true, w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 114, y: 46 }, size: { w: 48, h: 20 } }] }
    }),
    hints: [
      'Notice both numbers on each card: the temperature and the amount of material.',
      'Watch the clip showing a tiny hot speck meeting a large cold valve, and compare how much material each source has.',
      'Think about how much total energy each source can transfer before it cools to the valve\'s temperature.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction recorded.',
      title: 'Hypothesis Recorded',
      body: 'Your prediction for the spark and the tank is saved. Test it on the bench.'
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
        block('spark', 'Welding spark', { x: 24, y: 14 }, { m: 0.001, c: FE, T: 1200, mat: 'Fe', mass: '0.001 g iron' }),
        block('tank', 'Warm tank', { x: 126, y: 14 }, { m: 2000, c: WATER, T: 40, mat: 'H₂O', mass: '2000 g water' }),
        block('valve', 'Frozen valve', { x: 75, y: 14 }, { m: 500, c: FE, T: 0, mat: 'Fe', mass: '500 g iron' }),
        tag('pick-spark', 'Welding spark', { x: 24, y: 55 }),
        tag('pick-tank', 'Warm tank', { x: 54, y: 55 })
      ],
      fixtures: [latticeFixture('atoms', { x: 75, y: 36 }, { blocks: ['spark', 'valve', 'tank'], w: 122, h: 16, gate: { slot: 'answer' }, gateMsg: 'Place your answer in the slot before joining the blocks.' })],
      zones: { slots: [{ id: 'answer', label: 'My answer', at: { x: 118, y: 51 }, size: { w: 32, h: 14 } }] }
    }),
    hints: [
      'Check the thermometer on the frozen valve and the particle boxes under the spark and the tank.',
      'Compare how many particles are in the welding spark\'s box versus the warm tank\'s box.',
      'Heat stops flowing once the source and valve reach the same temperature, so compare how much total energy each can transfer before then.'
    ],
    check(state) {
      const pick = Object.values(state.table.pieces).find(p => p.zone === 'slot:answer');
      if (!pick) return { ok: false, notYet: true, msg: 'Place your answer in the slot first.' };
      const r = blockRead(state.table, 'valve');
      if (!r.joined) return { ok: false, notYet: true, msg: 'Now join the frozen valve to a source and read its thermometer.' };
      if (pick.id === 'pick-tank' && r.T >= 30) return { ok: true };
      if (pick.id === 'pick-spark' && r.T >= 30) return { ok: false, msg: `The frozen valve warmed to ${fixed(r.T, 1)} °C against the warm tank, so check which card is in your answer slot.` };
      return { ok: false, msg: `Joined to the welding spark, the frozen valve reads ${fixed(r.T, 1)} °C because the spark cooled almost instantly.` };
    },
    reward: {
      log: 'The tank warmed the valve; the spark barely did.',
      title: 'Temperature Is Not Total Energy',
      body: 'Temperature measures average particle speed, not total energy. Although cooler than the spark, the tank holds far more water and transfers far more heat.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const c = cupFixture('cup', { x: 30, y: 32 }, { title: 'Cup', boundary: true, water: 100, T0: 22 });
    return {
      id: 's4-tins',
      title: 'Warmers, Packs, and Tablets',
      briefing: {
        speaker: SPEAKER,
        body: [
          'The sample inside the dashed line is the system.',
          'The water bath around it, where the thermometer sits, is the surroundings.',
          'An exothermic change releases heat to the surroundings; an endothermic change absorbs heat from them.'
        ]
      },
      prompt: 'Which samples are exothermic and which are endothermic?',
      widget,
      table: heatTable({
        pieces: [
          charge('warmer', 'Hand warmer', { x: 64, y: 18 }, { moles: 0.04, dH: -165, shown: '' }),
          charge('cold', 'Cold pack', { x: 86, y: 18 }, { moles: 0.08, dH: 26, shown: '' }),
          charge('fizz', 'Fizzing tablet', { x: 64, y: 40 }, { moles: 0.05, dH: 28, shown: '' }),
          charge('lime', 'Quicklime', { x: 86, y: 40 }, { moles: 0.05, dH: -65, shown: '' })
        ],
        fixtures: [c.fixture],
        zones: {
          slots: [c.slot],
          trays: [
            { id: 'out', label: 'Exothermic', at: { x: 124, y: 17 }, size: { w: 48, h: 22 }, cell: 22, cellH: 11 },
            { id: 'in', label: 'Endothermic', at: { x: 124, y: 48 }, size: { w: 48, h: 22 }, cell: 22, cellH: 11 }
          ]
        }
      }),
      hints: [
        'Watch the thermometer in the water bath outside the dashed line.',
        'Drop each sample into the cup and compare the bath temperature before and after.',
        'If the bath warms up, the sample released energy to it; if the bath cools down, the sample absorbed energy from it.'
      ],
      check(state) {
        const t = state.table;
        const want = { warmer: 'out', lime: 'out', cold: 'in', fizz: 'in' };
        if (Object.keys(want).some(k => !['out', 'in'].includes(whereIs(t, k)))) return { ok: false, notYet: true, msg: 'Sort all four samples into the trays.' };
        const wrong = Object.entries(want).find(([k, v]) => whereIs(t, k) !== v);
        if (!wrong) return { ok: true };
        const tin = t.pieces[wrong[0]];
        const tray = t.zones.trays[whereIs(t, wrong[0])];
        if (tin.props.rise == null) return { ok: false, msg: 'Test every sample in the cup first.' };
        return { ok: false, msg: `The bath ${tin.props.rise > 0 ? 'warmed' : 'cooled'} around the ${tin.label}, which you placed in the "${tray.label}" tray.` };
      },
      reward: {
        log: 'Two baths warmed and two cooled.',
        title: 'Exothermic and Endothermic',
        body: 'Exothermic means the system releases heat, warming the surroundings. Endothermic means the system absorbs heat, cooling the surroundings, even when a tablet fizzes vigorously.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag one block onto another to join them;', 'tap the gap between them to separate.'],
  2: ['Drag your prediction into the slot.'],
  3: ['Place an answer card in the slot, then drag the valve onto a source.'],
  4: ['Drag each sample onto the cup, then sort it into a tray.']
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
      body: 'Heat flows from hotter objects to colder ones until they reach thermal equilibrium. Temperature measures average particle motion, but total heat transfer also depends on how much material is present.'
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
  [put('pick-tank', 'slot:answer'), join('valve', 'tank')],
  [...trials, ...sort({ warmer: 'out', lime: 'out', cold: 'in', fizz: 'in' })]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [join('a', 'c')],
  [],
  [put('pick-spark', 'slot:answer'), join('valve', 'spark')],
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
    onLoad(r) {
      if (r.index === 2) {
        const g = recall(QUEST_KEY);
        if (g && GUESS_LABEL[g]) r.frame.note(`You predicted: ${GUESS_LABEL[g]}. Test it on the bench.`);
      }
    }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { cupRead, shelvesRead, blockRead };
