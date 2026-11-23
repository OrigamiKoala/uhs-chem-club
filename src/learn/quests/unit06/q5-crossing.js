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
      title: 'Ice · 18.0 g', T0: -20, phase0: 'solid', pulses: [1, 3, 8], pulseStart: 1, window: false, cursor: 'mk',
      plot: { xMin: 0, xMax: 10, yMin: -30, yMax: 40, xStep: 2, yStep: 10 }
    });
    rec.props.gate = { fixtureDial: 'mk', dial: 'value', start: 0 };
    rec.props.gateMsg = 'Set your guess on the Answer dial first, then press "Heat".';
    return {
      id: 's1-curve',
      title: 'Ice on the Heater',
      briefing: 'A heating curve graphs a sample\'s temperature against the heat added to it.',
      prompt: 'At what total heat added (kJ) does this ice finish melting at 0 °C?',
      widget,
      table: matterTable({
        fixtures: [rec, markerFixture('mk', 'Answer (kJ)', { x: 126, y: 14 }, { min: 0, max: 10, step: 0.5, start: 0, unit: 'kJ' })]
      }),
      hints: [
        'Set your prediction on the Answer dial first, then press "Heat" to trace the curve.',
        'Watch the thermometer and the curve as more heat is added.',
        'Read the heat on the bottom axis where the flat stretch ends, and set the Answer dial there.'
      ],
      check(state) {
        const t = state.table;
        const r = heatRead(t, 'rec');
        if (!r.presses) return { ok: false, notYet: true, msg: 'Press "Heat" to start tracing the curve.' };
        const have = r.q / 1000;
        if (have < FLAT_END) return { ok: false, msg: `You have added ${fixed(have, 1)} kJ so far. Keep pressing "Heat" until the curve flattens out and starts climbing again.` };
        const v = markerRead(t, 'mk');
        if (Math.abs(v - FLAT_END) <= 0.6) return { ok: true };
        const where = v < FLAT_START ? 'is still warming the solid ice' : v < FLAT_END ? 'is still on the flat melting stretch' : 'is already climbing again as liquid water';
        return { ok: false, msg: `At ${v} kJ, the curve ${where}. Set the dial to where the flat stretch ends.` };
      },
      reward: {
        log: 'Ice stayed at 0 °C while about 6 kJ melted it.',
        title: 'The Heating Curve',
        body: 'A heating curve graphs temperature against heat added. The temperature stayed flat at 0 °C while 6 kJ melted the ice, showing that added heat does not always raise temperature.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Where Did It Go?',
    // A PREDICT STAGE: the recorder is not on the table. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Where did the added heat go while the ice stayed at 0 °C?',
    widget,
    table: matterTable({
      pieces: [
        note('lost', 'It leaks out of the cup into the air', { x: 30, y: 14 }),
        note('apart', 'It frees the molecules from each other', { x: 74, y: 14 }),
        note('other', 'It warms the cup walls instead of the ice', { x: 30, y: 34 })
      ],
      fixtures: [mleadFixture('lead', { x: 117, y: 52 }, { scene: 'pull', w: 44, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 40, h: 15 } }] }
    }),
    hints: [
      'Drag your chosen prediction card into the slot.',
      'Think about what the thermometer showed and what else the heat could be doing to the ice.',
      'Pick the explanation you expect to see when you look inside the ice next.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Now Test It',
      body: 'Next, heat the ice again with a particle window to see what happens while the temperature stays flat.'
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
      prompt: 'Watch the 12 molecules as you heat the ice until all 12 are flying free as steam.',
      widget,
      table: matterTable({ fixtures: [rec] }),
      hints: [
        'Use the "Heat per press" dial and "Heat" button, and watch the particle window.',
        'Compare the particle window with the thermometer while the curve is flat and while it climbs.',
        'Keep adding heat through both flat stretches until all 12 molecules are moving freely as gas.'
      ],
      check(state) {
        const r = heatRead(state.table, 'rec');
        if (!r.presses) return { ok: false, notYet: true, msg: 'Press "Heat" to start tracing the curve.' };
        if (r.crowd.gas >= 12) return { ok: true };
        return { ok: false, msg: `At ${fixed(r.q / 1000, 1)} kJ, only ${r.crowd.gas} of the 12 molecules are flying free. Keep heating.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = guess === 'apart' ? 'The particle window matched your prediction. ' : guess && GUESS_LABEL[guess] ? 'The particle window disagreed with your prediction. ' : '';
        return {
          log: 'The molecules broke free from each other while the temperature stayed flat.',
          title: 'Heat Against the Attraction',
          body: `${verdict}While the temperature stayed flat, the heat overcame attractions between molecules: first freeing them from ice, then separating them into steam.`
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
      prompt: 'How many kilojoules of heat does it take to melt 36.0 g of ice at 0 °C?',
      entry: { id: 'kj', label: 'Heat to melt', unit: 'kJ' },
      widget,
      table: matterTable({ fixtures: [rec, plaqueFixture('ref', 'What you may use', { x: 126, y: 14 }, ['1 mol of water = 18.0 g', '36.0 g = 2.00 mol'], { w: 44 })] }),
      hints: [
        'Use the "Heat" button to melt the 18.0 g cup of ice, then enter your answer below.',
        'Check how much heat melted the 18.0 g (1.00 mol) cup of ice on the heating curve.',
        'Scale the heat needed for 1.00 mol of ice to the number of moles in 36.0 g.'
      ],
      check(state) {
        const v = typed(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat in kilojoules.' };
        if (Math.abs(v - MELT_36) <= 0.8) return { ok: true };
        const grams = v / (flatsOf(1).fus / 1000);
        return { ok: false, msg: `${fixed(v, 1)} kJ only melts about ${fixed(grams, 1)} g of ice, not 36.0 g.` };
      },
      reward: {
        log: 'Melting one mole of ice takes 6.01 kJ.',
        title: 'Heat of Fusion',
        body: 'Melting one mole of ice at 0 °C takes 6.01 kJ (its heat of fusion). Because 36.0 g is 2.00 mol, melting it takes 12.0 kJ.'
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
        body: 'A sloped stretch takes mass × specific heat (c) × temperature change (ΔT). A flat stretch takes moles × heat of fusion or vaporization.',
        worked: [
          'Example: 9.0 g (0.50 mol) of ice at 0 °C to water at 50 °C:',
          'melt: 0.50 mol × 6.01 = 3.01 kJ',
          'warm: 9.0 g × 4.184 × 50 = 1.88 kJ',
          'total 4.89 kJ'
        ]
      },
      prompt: 'How many kilojoules of heat turn 18.0 g of liquid water at 0 °C into steam at 100 °C?',
      entry: { id: 'kj', label: 'Heat needed', unit: 'kJ' },
      widget,
      table: matterTable({
        fixtures: [rec, plaqueFixture('ref', 'What you may use', { x: 126, y: 18 }, [
          'Water: 4.184 J/(g·°C)', 'Boiling: 40.65 kJ/mol', '1 mol of water is 18.0 g'
        ], { w: 44 })]
      }),
      hints: [
        'Use the heating curve to trace the path, the plate for the constants, and the field below for your answer.',
        'Break the path from liquid water at 0 °C to steam at 100 °C into two parts: one slope and one flat stretch.',
        'Find the heat for warming the liquid and the heat for boiling it, then combine them.'
      ],
      check(state) {
        const v = typed(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter the heat in kilojoules.' };
        if (Math.abs(v - UP) <= 0.4) return { ok: true };
        return { ok: false, msg: `${fixed(v, 1)} kJ would leave the 18.0 g ${leftAs(18.0, WATER_0, v)}.` };
      },
      reward: {
        log: 'Water at 0 °C to steam at 100 °C took 48.2 kJ.',
        title: 'Heat of Vaporization',
        body: 'Warming the water takes 7.53 kJ and boiling it takes 40.65 kJ, totaling 48.2 kJ. Boiling a mole of water takes 40.65 kJ (heat of vaporization), nearly seven times its heat of fusion.'
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
      prompt: 'Why does 100 °C steam release far more heat onto a hand than 100 °C liquid water?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: [...cards, ...choices],
        fixtures: [cool.fixture],
        zones: { slots: [cool.slot, { id: 'answer', label: 'Extra heat comes', at: { x: 126, y: 50 }, size: { w: 38, h: 14 } }] }
      }),
      hints: [
        'Cool both samples in the cooler with "Cool", then place a card in the slot.',
        'Compare the two cooling curves: steam starts with a long flat stretch before its temperature drops.',
        'Think about what phase change steam undergoes at 100 °C during that flat stretch.'
      ],
      check(state) {
        const t = state.table;
        const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Place a card in the slot.' };
        if (card.id === 'condense') return { ok: true };
        if (t.pieces.w100.props.gave == null || t.pieces.s100.props.gave == null) {
          return { ok: false, msg: 'Cool both samples first to compare how much heat each releases.' };
        }
        if (card.id === 'hotter') return { ok: false, msg: 'Both samples start at 100 °C, yet steam releases 2.52 kJ while water releases 0.26 kJ.' };
        return { ok: false, msg: 'Both samples cool from 100 °C to 37 °C, releasing only 0.26 kJ as liquid. Look at the long flat stretch on steam\'s curve.' };
      },
      reward: {
        log: 'Steam at 100 °C released about ten times more heat than liquid water at 100 °C.',
        title: 'Why Steam Burns',
        body: 'Steam at 100 °C released 2.52 kJ per gram, while liquid water at 100 °C released only 0.26 kJ. Most of steam\'s heat comes from condensing into liquid water before it even cools.'
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
      prompt: 'At which pressure does warming ice turn straight into vapor without ever forming liquid water?',
      widget,
      table: matterTable({
        fixtures: [map, plaqueFixture('exam', 'Water\'s states', { x: 126, y: 14 }, ['Phase diagrams map state', 'by pressure & temperature.'], { w: 46 })]
      }),
      hints: [
        'Pick a pressure on the "Pressure" dial and press "Heat" to test it.',
        'Compare the phases listed as you heat ice at low pressure versus high pressure.',
        'Find a pressure where the liquid phase disappears and ice turns straight into vapor.'
      ],
      check(state) {
        const t = state.table;
        const r = mapRead(t, 'map');
        if (!r.rows.length) return { ok: false, notYet: true, msg: 'Press "Heat" to warm the ice at the selected pressure.' };
        if (sweptWithoutLiquid(t, 'map')) return { ok: true };
        const last = r.rows[r.rows.length - 1].y;
        return { ok: false, msg: `At ${pressureText(last)}, the ice melted into liquid water before turning to vapor. Try a lower pressure.` };
      },
      reward: {
        log: 'Below 0.611 kPa, ice turned straight to vapor.',
        title: 'Phase Diagrams',
        body: 'On water\'s phase diagram, ice turns straight to vapor below 0.611 kPa (the triple point). Above the critical point, liquid and vapor merge into one phase.'
      }
    };
  })()
];

/** How-to lines removed from the plate. */
applyNotes(STAGES, {});

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A heating curve rises while heat warms a sample and stays flat during a phase change, when heat overcomes attractions between molecules. Each flat stretch takes moles × heat of fusion or vaporization, and condensing or freezing releases that same heat back.'
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
  [dial('mk', 'value', 7), ...heat(8)],
  [put('apart', 'slot:guess')],
  [dial('rec', 'heat', 3), ...heat(3)],
  [...heat(3), typedAns('12.0')],
  [typedAns('48.2')],
  [...cookAll(HAND.map(s => s.id)), put('condense', 'slot:answer')],
  [dial('map', 'pressure', 1), { run: 'map' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [dial('mk', 'value', 1), ...heat(8)],
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
