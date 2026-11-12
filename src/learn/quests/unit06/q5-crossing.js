/**
 * Unit 6 · Bench 5 — The Crossing (q5-crossing)
 *
 * A harbour boiler house on the matter kit (`table/kits/matter.js`, instruments in `matter-curve.js`): a cup on a heater and a recorder whose
 * pen plots temperature against heat added. Seven stages (CED 6.5) and ONE click: the belief that heat added always raises the temperature.
 * Stage 1 draws the line and it stands still; stage 2 predicts where the heat went; stage 3 tests it with a window on twelve molecules;
 * stages 4 and 5 are the sums; stage 6 applies them to a burn; stage 7 is a phase diagram.
 *
 *   1  warm ice, set a marker where the level stretch of the line ends         -> heating curve
 *   2  PREDICT: where does the heat go while the thermometer stands still?
 *   3  TEST: warm the ice with a window on twelve molecules                    -> heat spent against the attraction between molecules
 *   4  type the heat to melt 36.0 g of ice (past the cup's 18.0 g)             -> heat of fusion
 *   5  type the heat from water at 0 °C to steam at 100 °C                     -> heat of vaporization, worked case
 *   6  water 100 °C and steam 100 °C in the cooler; why steam burns worse      -> condensation gives out heat
 *   7  warm ice at six pressures, find one with no liquid                      -> phase diagram, triple point, critical point
 *
 * THE WRONG MODEL IS ON THE TABLE. The recorder's pen is honest about every stretch, so a student who believes heat always warms
 * sees the line stand still twice. The stage 2 cards offer the beliefs students hold; the window of stage 3 contradicts them.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { matterTable, note, stmt, plaqueFixture, markerFixture, markerRead, fixed, mleadFixture } from '../../table/kits/matter.js';
import {
  heatCurveFixture, coolerFixture, phaseMapFixture, sampleCard, heatRead, coolRead, mapRead, sweptWithoutLiquid, pressureText
} from '../../table/kits/matter-curve.js';
import { PHASE_WATER } from '../../engine/matterdata.js';
import { startOf, planThermal, heatBetween, heatOf, flatsOf, WATER_TRIPLE } from '../../engine/matterdata-curve.js';

export const meta = { stageCount: 7 };


export const VOCABULARY = [
  { term: /\bheating curve\b/i, introducedAt: 1 },
  { term: /\bheat of fusion\b/i, introducedAt: 4 },
  { term: /\bheat of vaporization\b/i, introducedAt: 5 },
  { term: /\bphase diagram\b/i, introducedAt: 7 },
  { term: /\btriple point\b/i, introducedAt: 7 },
  { term: /\bcritical point\b/i, introducedAt: 7 }
];

/** q = m c ΔT is Ember Reach's calorimetry, ΔH per mole its enthalpy bench, and the attraction between molecules is bench 2 of this world. */
export const BUILDS_ON = ['unit05/q2-calorimetry', 'unit05/q3-enthalpy', 'unit06/q2-grip'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit06/q5-crossing';
const GUESS_LABEL = { lost: 'that it leaks into the air', apart: 'that it separates the molecules', other: 'that it warms the cup and the air' };

/* ---- the figures every stage grades against, from the planners ---- */
const M = PHASE_WATER.M;
const ICE_20 = startOf(-20, 'solid');
/** Stage 1: 18.015 g of ice at −20 °C. The line stands level from the heat that warms the ice to 0 °C to that plus the heat of fusion. */
const FLAT_START = heatBetween(M, ICE_20, startOf(0, 'solid')) / 1000;
const FLAT_END = (heatBetween(M, ICE_20, startOf(0, 'solid')) + flatsOf(M).fus) / 1000;
/** Stage 4: 36.0 g at 0 °C is 36.0 / 18.015 mol of 6.01 kJ. */
const MELT_36 = flatsOf(36.0).fus / 1000;
/** Stage 5: 18.0 g from water at 0 °C to steam at 100 °C. */
const WATER_0 = startOf(0, 'liquid');
const STEAM_100 = startOf(100, 'gas');
const UP = heatBetween(18.0, WATER_0, STEAM_100) / 1000;
/** Stage 6: 1.00 g of water at 100 °C and steam at 100 °C, cooled to 37 °C. */
const HAND = [
  { id: 'w100', label: 'Water 100 °C', T: 100, phase: 'liquid' },
  { id: 's100', label: 'Steam 100 °C', T: 100, phase: 'gas' }
];
const gaveOf = s => -heatBetween(1, startOf(s.T, s.phase), startOf(37, 'liquid')) / 1000;

/** What `kJ` of heat leaves 18.0 g that starts as `start`, in words the bench could show. */
function leftAs(grams, start, kJ) {
  const p = planThermal(grams, start, kJ * 1000);
  const T = Math.round(p.T);
  if (p.phase === 'melting') return `melting at 0 °C with ${Math.round((1 - p.melted) * 100)}% of it still ice`;
  if (p.phase === 'boiling') return `boiling at 100 °C with ${Math.round(p.boiled * 100)}% of it turned to steam`;
  return p.phase === 'solid' ? `as ice at ${fixed(p.T, 0).replace('-', '−')} °C` : p.phase === 'liquid' ? `as water at ${T} °C` : `as steam at ${T} °C`;
}

/** The text of the answer field as a number, a true minus accepted. */
function typed(table, id) {
  const t = String(table.entries?.[id] ?? '').trim().replace('−', '-');
  return t === '' ? NaN : entryNumber({ entries: { [id]: t } }, id);
}

/* ---- a stage's recorder ---- */
const REC = (o = {}) => heatCurveFixture('rec', { x: 51, y: 29 }, o);

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const rec = REC({
      title: 'Ice · 18.0 g', T0: -20, phase0: 'solid', pulses: [1, 3, 8], pulseStart: 2, window: false, cursor: 'mk',
      plot: { xMin: 0, xMax: 10, yMin: -30, yMax: 40, xStep: 2, yStep: 10 }
    });
    return {
      id: 's1-curve',
      title: 'Ice on the Heater',
      briefing: 'A heating curve plots a sample\'s temperature against the heat added to it.',
      prompt: 'How much heat does this ice take in while its temperature stays at 0 °C?',
      widget,
      table: matterTable({
        fixtures: [rec, markerFixture('mk', 'Number dial', { x: 126, y: 14 }, { min: 0, max: 10, step: 0.5, start: 0, unit: 'kJ' })]
      }),
      hints: [
        'Use the "Heat per press" dial and the "Heat" key, then drag the number dial along its groove.',
        'Watch the thermometer and the pen as the heat added grows.',
        'Read the heat on the bottom axis where the line leaves its level stretch, and set the number dial to it.'
      ],
      check(state) {
        const t = state.table;
        const r = heatRead(t, 'rec');
        if (!r.presses) return { ok: false, notYet: true, msg: 'Press "Heat" to start the line.' };
        const have = r.q / 1000;
        if (have < FLAT_END) return { ok: false, msg: `The pen has drawn to ${fixed(have, 1)} kJ, and the line has not yet stood still and climbed again.` };
        const v = markerRead(t, 'mk');
        if (Math.abs(v - FLAT_END) <= 0.6) return { ok: true };
        const where = v < FLAT_START ? 'is still on its first climb' : v < FLAT_END ? 'is level' : 'is already climbing again';
        return { ok: false, msg: `The number dial stands at ${v} kJ, and the line there ${where}.` };
      },
      reward: {
        log: 'Ice at −20 °C stood at 0 °C while about 6 kJ went in.',
        title: 'The Heating Curve',
        body: 'A heating curve is a graph of temperature against the heat added. This ice stood still at 0 °C while about 6 kJ went in, so heat added does not always raise the temperature.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Where Did It Go?',
    // A PREDICT STAGE: the recorder is not on the table. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'The temperature stood still while the ice took in heat: where did that heat go?',
    widget,
    table: matterTable({
      pieces: [
        note('lost', 'It leaks out of the cup into the air', { x: 30, y: 14 }),
        note('apart', 'It works against the attraction between molecules', { x: 78, y: 14 }),
        note('other', 'It warms the cup and the air, not the ice', { x: 30, y: 34 })
      ],
      fixtures: [mleadFixture('lead', { x: 117, y: 52 }, { scene: 'pull', w: 44, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Drag the card you choose into the slot.',
      'Think about what the thermometer read and what else the heat could be doing.',
      'Commit to the card you would bet on; the next part tests it.'
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
      body: 'Next, warm the ice again with a window on twelve of its molecules, and watch what the heat does while the thermometer stands still.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rec = REC({
      title: 'Ice · 18.0 g', T0: -20, phase0: 'solid', pulses: [2, 8, 20], pulseStart: 2, window: true,
      plot: { xMin: 0, xMax: 70, yMin: -40, yMax: 120, xStep: 10, yStep: 20 }
    });
    return {
      id: 's3-window',
      title: 'Twelve Molecules',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You guessed ${GUESS_LABEL[guess]}: what does the heat do to the molecules while the thermometer stands still?`
          : 'What does the heat do to the molecules while the thermometer stands still?';
      },
      widget,
      table: matterTable({ fixtures: [rec] }),
      hints: [
        'Use the "Heat per press" dial and the "Heat" key, and watch the window.',
        'Compare the window with the thermometer while the line is level, and again after it climbs.',
        'Keep adding heat through both level stretches until no molecule is left near another.'
      ],
      check(state) {
        const r = heatRead(state.table, 'rec');
        if (!r.presses) return { ok: false, notYet: true, msg: 'Press "Heat" to start the line.' };
        if (r.crowd.gas >= 12) return { ok: true };
        return { ok: false, msg: `At ${fixed(r.q / 1000, 1)} kJ the window shows ${r.crowd.gas} of the twelve molecules flying free.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = guess === 'apart' ? 'You guessed this, and the window agrees. ' : guess && GUESS_LABEL[guess] ? 'The window does not agree with your guess, which is how a guess gets better. ' : '';
        return {
          log: 'The molecules were freed from each other while the temperature stood still.',
          title: 'Heat Against the Attraction',
          body: `${verdict}While the thermometer stood still, the molecules were being freed: first from their places in the ice, then from one another as steam. The heat did not make them move faster; it worked against the attraction between them.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const rec = REC({
      title: 'Ice at 0 °C · 18.0 g', T0: 0, phase0: 'solid', pulses: [1, 2, 4], pulseStart: 2, window: true,
      plot: { xMin: 0, xMax: 10, yMin: -10, yMax: 40, xStep: 2, yStep: 10 }
    });
    return {
      id: 's4-melt',
      title: 'More Ice',
      briefing: 'The heat needed to melt one mole of a solid at its melting point is its heat of fusion.',
      prompt: 'How much heat melts 36.0 g of ice at 0 °C, in kilojoules?',
      entry: { id: 'kj', label: 'Heat to melt', unit: 'kJ' },
      widget,
      table: matterTable({ fixtures: [rec, plaqueFixture('ref', 'What you may use', { x: 126, y: 14 }, ['1 mol of water is 18.0 g'], { w: 44 })] }),
      hints: [
        'Use the "Heat per press" dial and the "Heat" key on the cup, then type in the field.',
        'Watch the window and the line to see how much heat melts the ice in the cup, and what that ice weighs.',
        'Find the heat for one mole from the cup, then scale it to the number of moles in 36.0 g.'
      ],
      check(state) {
        const v = typed(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
        if (Math.abs(v - MELT_36) <= 0.8) return { ok: true };
        const grams = v / (flatsOf(1).fus / 1000);
        return { ok: false, msg: `${fixed(v, 1)} kJ melts about ${fixed(grams, 1)} g of ice at the rate the cup showed, not 36.0 g.` };
      },
      reward: {
        log: 'Melting a mole of ice takes 6.01 kJ.',
        title: 'Heat of Fusion',
        body: 'Melting one mole of ice at 0 °C takes 6.01 kJ: its heat of fusion. The heat is the number of moles times that figure, so 36.0 g, which is 2.00 mol, takes 12.0 kJ.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rec = REC({
      title: 'Water at 0 °C · 18.0 g', T0: 0, phase0: 'liquid', pulses: [4, 12, 40], pulseStart: 2, window: true, showHeat: false,
      plot: { xMin: 0, xMax: 60, yMin: -10, yMax: 120, xStep: 10, yStep: 20 }
    });
    return {
      id: 's5-whole',
      title: 'Water to Steam',
      briefing: {
        body: 'A sloping stretch takes mass × c × ΔT. A level stretch takes moles × the heat of fusion or of vaporization, the heat to boil one mole.',
        worked: [
          '18.0 g of ice at 0 °C to water at 100 °C:',
          'melt: 1.00 mol × 6.01 = 6.01 kJ',
          'warm: 18.0 g × 4.18 × 100 = 7.52 kJ',
          'total 13.5 kJ'
        ]
      },
      prompt: 'How much heat takes 18.0 g of water at 0 °C to steam at 100 °C, in kilojoules?',
      entry: { id: 'kj', label: 'Heat needed', unit: 'kJ' },
      widget,
      table: matterTable({
        fixtures: [rec, plaqueFixture('ref', 'What you may use', { x: 126, y: 18 }, [
          'Water: 4.184 J/(g·°C)', 'Boiling: 40.65 kJ/mol', '1 mol of water is 18.0 g'
        ], { w: 44 })]
      }),
      hints: [
        'Use the recorder to see the path, the plate for the figures, and the field for your answer.',
        'Follow the sample from water at 0 °C to steam at 100 °C and count both stretches: one slope and one level stretch.',
        'Find the heat for the slope (mass × c × ΔT) and the level stretch (moles × heat of vaporization), then add them.'
      ],
      check(state) {
        const v = typed(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
        if (Math.abs(v - UP) <= 0.4) return { ok: true };
        return { ok: false, msg: `${fixed(v, 1)} kJ would leave the 18.0 g ${leftAs(18.0, WATER_0, v)}.` };
      },
      reward: {
        log: 'Water at 0 °C to steam at 100 °C took 48.1 kJ.',
        title: 'Heat of Vaporization',
        body: 'Warming the water takes 7.53 kJ and boiling it takes 40.6 kJ, adding to 48.1 kJ. Boiling a mole takes 40.65 kJ, the heat of vaporization, almost seven times the heat of fusion.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const cool = coolerFixture('cooler', { x: 51, y: 26 });
    const cards = [
      sampleCard('w100', 'Water 100 °C', { x: 20, y: 59 }, { grams: 1, T: 100, phase: 'liquid' }),
      sampleCard('s100', 'Steam 100 °C', { x: 44, y: 59 }, { grams: 1, T: 100, phase: 'gas' })
    ];
    const choices = [
      stmt('condense', 'From condensing to liquid water', { x: 126, y: 8 }),
      stmt('cool', 'From cooling the liquid to body temperature', { x: 126, y: 22 }),
      stmt('hotter', 'From being hotter than the water', { x: 126, y: 36 })
    ];
    return {
      id: 's6-burn',
      title: 'A Burn',
      prompt: 'Steam at 100 °C gives a hand far more heat than water at 100 °C: where does the extra come from?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: [...cards, ...choices],
        fixtures: [cool.fixture],
        zones: { slots: [cool.slot, { id: 'answer', label: 'Extra heat comes', at: { x: 126, y: 50 }, size: { w: 38, h: 14 } }] }
      }),
      hints: [
        'Use the cooler and its "Cool" key on both samples, then put a card in the slot.',
        'Compare the two lines on the cooler plot: steam starts with a long level stretch before it cools.',
        'Ask what happens to steam at 100 °C along that level stretch before its temperature drops.'
      ],
      check(state) {
        const t = state.table;
        const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card.id === 'condense') return { ok: true };
        if (t.pieces.w100.props.gave == null || t.pieces.s100.props.gave == null) {
          return { ok: false, msg: 'Cool both samples first to compare how much heat each gives.' };
        }
        if (card.id === 'hotter') return { ok: false, msg: 'Both samples start at 100 °C, yet steam gives 2.52 kJ and water gives 0.26 kJ.' };
        return { ok: false, msg: 'Both samples cool from 100 °C to 37 °C, which gives only 0.26 kJ; look at the long level stretch on steam\'s line.' };
      },
      reward: {
        log: 'Steam at 100 °C gave a hand about ten times the heat of water at 100 °C.',
        title: 'Why Steam Burns',
        body: 'Steam at 100 °C gave 2.52 kJ a gram, water at 100 °C only 0.26 kJ. Most of the steam\'s heat comes out as it condenses to liquid water, before it cools at all.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const map = phaseMapFixture('map', { x: 51, y: 28 });
    return {
      id: 's7-diagram',
      title: 'Skipping the Liquid',
      briefing: 'The state of water depends on pressure as well as temperature. A phase diagram maps the state at each pressure and temperature.',
      prompt: 'At what pressure does warming ice never make liquid water?',
      widget,
      table: matterTable({
        fixtures: [map, plaqueFixture('exam', 'Water\'s states', { x: 126, y: 14 }, ['Phase diagrams map', 'state by pressure and T.'], { w: 44 })]
      }),
      hints: [
        'Use the "Pressure" dial and the "Heat" key.',
        'Compare the states listed for sweeps at low pressure and at high pressure.',
        'Sweep at several pressures and find where the liquid stretch of the line shrinks to nothing.'
      ],
      check(state) {
        const t = state.table;
        const r = mapRead(t, 'map');
        if (!r.rows.length) return { ok: false, notYet: true, msg: 'Press "Heat" to warm the ice at the pressure the dial shows.' };
        if (sweptWithoutLiquid(t, 'map')) return { ok: true };
        const last = r.rows[r.rows.length - 1].y;
        return { ok: false, msg: `At ${pressureText(last)} the ice melted to liquid water before it went further.` };
      },
      reward: {
        log: 'Below 0.611 kPa ice turned straight to vapour.',
        title: 'Phase Diagrams',
        body: 'On water\'s phase diagram, below 0.611 kPa (the triple point) ice turns straight to vapor. Far above it, past the critical point, liquid and vapor are no longer different.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Press "Heat" to draw the line, then set the number dial.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Set the dial, press "Heat" and watch the window.'],
  4: ['Heat the cup to see its line, then type your answer.'],
  5: ['Type your answer in the field at the bottom.'],
  7: ['Turn the "Pressure" dial and press "Heat".']
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
      body: 'A heating curve climbs while heat warms a sample and stands still while it changes state, spending the heat against the attraction between molecules. Each flat costs moles times the heat of fusion or vaporization, and condensing gives that heat back out.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const heat = n => Array.from({ length: n }, () => ({ run: 'rec' }));
const typedAns = value => ({ type: { entry: 'kj', value } });
const cookAll = ids => ids.flatMap(id => [put(id, 'slot:cooler.slot'), { run: 'cooler' }]);

export const SOLUTIONS = [
  [...heat(3), dial('mk', 'value', 7)],
  [put('apart', 'slot:guess')],
  [dial('rec', 'heat', 3), ...heat(3)],
  [...heat(3), typedAns('12.0')],
  [typedAns('48.1')],
  [...cookAll(HAND.map(s => s.id)), put('condense', 'slot:answer')],
  [dial('map', 'pressure', 1), { run: 'map' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...heat(3), dial('mk', 'value', 1)],
  [],
  [...heat(1)],
  [typedAns('6.0')],
  [typedAns('40.6')],
  [...cookAll(HAND.map(s => s.id)), put('hotter', 'slot:answer')],
  [{ run: 'map' }]
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
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = { FLAT_START, FLAT_END, MELT_36, UP, HAND, gaveOf, WATER_TRIPLE };
export { heatRead, coolRead, heatOf };
