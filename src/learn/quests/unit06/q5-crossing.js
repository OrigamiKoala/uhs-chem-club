/**
 * Unit 6 · Bench 5 — The Crossing (q5-crossing)
 *
 * A harbour boiler house on the matter kit (`table/kits/matter.js`, instruments in `matter-curve.js`): a cup on a heater and a recorder whose
 * pen plots temperature against heat added. Eight stages (CED 6.5; the last is beyond the exam and says so) and ONE click: the belief
 * that heat added always raises the temperature. Stage 1 draws the line and it stands still; stage 2 predicts where the heat went; stage 3
 * tests it with a window on twelve molecules; stages 4 to 6 are the sums; stage 7 applies them to a burn; stage 8 is a phase diagram.
 *
 *   1  warm ice, set a marker where the level stretch of the line ends         -> heating curve
 *   2  PREDICT: where does the heat go while the thermometer stands still?
 *   3  TEST: warm the ice with a window on twelve molecules                    -> heat spent against the pull between molecules
 *   4  type the heat to melt 36.0 g of ice (past the cup's 18.0 g)             -> heat of fusion, q = n × ΔH
 *   5  type the heat from ice at −10 °C to steam at 110 °C                     -> heat of vaporization, the whole curve
 *   6  cool the steam back; type the heat change                               -> condensation and freezing, the negative
 *   7  four 1 g samples cooled to 37 °C and ranked by the heat each gave       -> why steam burns worse than boiling water
 *   8  (beyond the exam) warm ice at six pressures, find one with no liquid    -> phase diagram, triple point, critical point
 *
 * THE WRONG MODEL IS ON THE TABLE. The recorder's pen is honest about every stretch, so a student who believes heat always warms
 * sees the line stand still twice. The stage 2 cards offer the beliefs students hold; the window of stage 3 contradicts them.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { matterTable, note, plaqueFixture, markerFixture, markerRead, fixed } from '../../table/kits/matter.js';
import {
  heatCurveFixture, coolerFixture, phaseMapFixture, sampleCard, heatRead, coolRead, mapRead, sweptWithoutLiquid, pressureText
} from '../../table/kits/matter-curve.js';
import { PHASE_WATER } from '../../engine/matterdata.js';
import { startOf, planThermal, heatBetween, heatOf, flatsOf, WATER_TRIPLE } from '../../engine/matterdata-curve.js';

export const meta = { stageCount: 8 };


export const VOCABULARY = [
  { term: /\bheating curve\b/i, introducedAt: 1 },
  { term: /\bheat of fusion\b/i, introducedAt: 4 },
  { term: /\bheat of vaporization\b/i, introducedAt: 5 },
  { term: /\bcondensation\b/i, introducedAt: 6 },
  { term: /\bfreezing\b/i, introducedAt: 6 },
  { term: /\bphase diagram\b/i, introducedAt: 8 },
  { term: /\btriple point\b/i, introducedAt: 8 },
  { term: /\bcritical point\b/i, introducedAt: 8 }
];

/** q = m c ΔT is Ember Reach's calorimetry, ΔH per mole its enthalpy bench, and the grip between molecules is bench 2 of this world. */
export const BUILDS_ON = ['unit05/q2-calorimetry', 'unit05/q3-enthalpy', 'unit06/q2-grip'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit06/q5-crossing';
const GUESS_LABEL = { lost: 'that it leaks into the room', apart: 'that it fights the pull between molecules', other: 'that it warms the cup and the air' };

/* ---- the figures every stage grades against, from the planners ---- */
const M = PHASE_WATER.M;
const ICE_20 = startOf(-20, 'solid');
/** Stage 1: 18.015 g of ice at −20 °C. The line stands level from the heat that warms the ice to 0 °C to that plus the heat of fusion. */
const FLAT_START = heatBetween(M, ICE_20, startOf(0, 'solid')) / 1000;
const FLAT_END = (heatBetween(M, ICE_20, startOf(0, 'solid')) + flatsOf(M).fus) / 1000;
/** Stage 4: 36.0 g at 0 °C is 36.0 / 18.015 mol of 6.01 kJ. */
const MELT_36 = flatsOf(36.0).fus / 1000;
/** Stages 5 and 6: 18.0 g from ice at −10 °C to steam at 110 °C and back. */
const ICE_10 = startOf(-10, 'solid');
const STEAM_110 = startOf(110, 'gas');
const UP = heatBetween(18.0, ICE_10, STEAM_110) / 1000;
const DOWN = heatBetween(18.0, STEAM_110, ICE_10) / 1000;
/** Stage 7: 1.00 g of each, cooled to 37 °C. */
const HAND = [
  { id: 'w60', label: 'Water 60 °C', T: 60, phase: 'liquid' },
  { id: 'w100', label: 'Water 100 °C', T: 100, phase: 'liquid' },
  { id: 's100', label: 'Steam 100 °C', T: 100, phase: 'gas' },
  { id: 's120', label: 'Steam 120 °C', T: 120, phase: 'gas' }
];
const gaveOf = s => -heatBetween(1, startOf(s.T, s.phase), startOf(37, 'liquid')) / 1000;
const HAND_BY_HEAT = [...HAND].sort((a, b) => gaveOf(a) - gaveOf(b)).map(s => s.id);

const kj2 = v => (Math.round(v * 100) / 100).toFixed(2);

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

/** The rank check for the cooler's cards (a card keeps the heat it gave). */
const heldReading = p => p.props.gave;
function rankMiss(t, order) {
  const cards = order.map(id => t.pieces[id]);
  if (cards.some(p => heldReading(p) == null)) return { ok: false, msg: 'Not every card on the rail has been through the cooler yet.' };
  const k = cards.findIndex((p, i) => i > 0 && heldReading(cards[i - 1]) > heldReading(p));
  const a = cards[k - 1]; const b = cards[k];
  return { ok: false, msg: `${a.label} sits left of ${b.label}, and the cooler read ${kj2(heldReading(a))} kJ for the one and ${kj2(heldReading(b))} kJ for the other.` };
}

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
      prompt: 'Warm the ice until its temperature stands still, then set the marker at the heat where it rises again.',
      widget,
      table: matterTable({
        fixtures: [rec, markerFixture('mk', 'Marker', { x: 126, y: 14 }, { min: 0, max: 10, step: 0.5, start: 0, unit: 'kJ' })]
      }),
      hints: [
        'Use the "Heat per press" dial and the "Heat" key, then drag the marker along its groove.',
        'Watch the thermometer and the pen as the heat added grows.',
        'Read the heat on the bottom axis where the line leaves its level stretch, and set the marker to it.'
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
        return { ok: false, msg: `The marker stands at ${v} kJ, and the line there ${where}.` };
      },
      reward: {
        log: 'Ice at −20 °C stood at 0 °C while about 6 kJ went in.',
        title: 'The Heating Curve',
        body: 'A heating curve plots temperature against the heat added. It climbs while heat warms a sample, yet for this ice it stood still at 0 °C while about 6 kJ went in. Heat added does not always raise the temperature.'
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
        note('lost', 'It leaks out of the cup into the room', { x: 30, y: 14 }),
        note('apart', 'It works against the pull between the molecules', { x: 78, y: 14 }),
        note('other', 'It warms the cup and the air, not the ice', { x: 30, y: 34 })
      ],
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
          ? `You guessed ${GUESS_LABEL[guess]}: heat the ice until the window shows all twelve molecules flying free.`
          : 'Heat the ice until the window shows all twelve molecules flying free of one another.';
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
          title: 'Heat Against the Pull',
          body: `${verdict}While the thermometer stood still, the molecules were being freed: first from their places in the ice, then from one another as steam. The heat did not make them move faster, it worked against the pull between them.`
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
      prompt: 'Type the heat needed to melt 36.0 g of ice at 0 °C, in kilojoules.',
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
        body: 'Melting one mole of ice at 0 °C takes 6.01 kJ: the heat of fusion, ΔH. The heat is the number of moles times that figure, so 36.0 g, which is 2.00 mol, takes 12.0 kJ.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const rec = REC({
      title: 'Ice at −10 °C · 18.0 g', T0: -10, phase0: 'solid', pulses: [4, 12, 40], pulseStart: 2, window: true, showHeat: false,
      plot: { xMin: 0, xMax: 70, yMin: -20, yMax: 120, xStep: 10, yStep: 20 }
    });
    return {
      id: 's5-whole',
      title: 'Ice to Steam',
      prompt: 'Type the heat needed to take 18.0 g of ice at −10 °C to steam at 110 °C, in kilojoules.',
      entry: { id: 'kj', label: 'Heat needed', unit: 'kJ' },
      widget,
      table: matterTable({
        fixtures: [rec, plaqueFixture('ref', 'What you may use', { x: 126, y: 22 }, [
          'Ice: 2.09 J/(g·°C)', 'Water: 4.184 J/(g·°C)', 'Steam: 1.97 J/(g·°C)', 'Melting: 6.01 kJ/mol', 'Boiling: 40.65 kJ/mol', '1 mol of water is 18.0 g'
        ], { w: 44 })]
      }),
      hints: [
        'Use the recorder to see the path, the plate for the figures, and the field for your answer.',
        'Follow the sample from ice at −10 °C to steam at 110 °C and count every stretch the line has, level or sloping.',
        'Find the heat for each stretch on its own, mass × c × ΔT for a slope and moles × ΔH for a level stretch, then add them.'
      ],
      check(state) {
        const v = typed(state.table, 'kj');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the heat in kilojoules.' };
        if (Math.abs(v - UP) <= 0.4) return { ok: true };
        return { ok: false, msg: `${fixed(v, 1)} kJ would leave the 18.0 g ${leftAs(18.0, ICE_10, v)}.` };
      },
      reward: {
        log: 'Ice at −10 °C to steam at 110 °C took about 54.9 kJ.',
        title: 'Heat of Vaporization',
        body: 'Each slope costs m × c × ΔT and each level stretch n × ΔH: 0.4, 6.0, 7.5, 40.6 and 0.4 kJ add to 54.9 kJ. Boiling a mole takes 40.65 kJ, the heat of vaporization, almost seven times the heat of fusion.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const rec = REC({
      title: 'Steam at 110 °C · 18.0 g', T0: 110, phase0: 'gas', pulses: [-4, -12, -40], pulseStart: 2, window: true, showHeat: false,
      plot: { xMin: -70, xMax: 0, yMin: -20, yMax: 120, xStep: 10, yStep: 20 }
    });
    return {
      id: 's6-back',
      title: 'The Way Back',
      prompt: 'Type the heat change when 18.0 g of steam at 110 °C is cooled to ice at −10 °C, in kilojoules.',
      entry: { id: 'kj', label: 'Heat change', unit: 'kJ' },
      widget,
      table: matterTable({ fixtures: [rec] }),
      hints: [
        'Use the "Heat per press" dial and the "Cool" key to run the sample down, then type in the field.',
        'Compare the line the pen draws on the way down with the way up you worked out.',
        'Decide which way the heat moves in each stretch of the cooling, and give a figure that says so.'
      ],
      check(state) {
        const v = typed(state.table, 'kj');
        if (Number.isNaN(v)) return { ok: false, notYet: true, msg: 'Type the heat change in kilojoules.' };
        if (Math.abs(v - DOWN) <= 1.0) return { ok: true };
        if (Math.abs(v + DOWN) <= 1.0) return { ok: false, msg: 'That figure puts heat into the sample, and the pen for this sample runs to the left of zero.' };
        if (v > 0) return { ok: false, msg: `${fixed(v, 1)} kJ would put heat into the steam, and the pen for this sample runs to the left of zero.` };
        return { ok: false, msg: `${fixed(v, 1).replace('-', '−')} kJ would leave the 18.0 g ${leftAs(18.0, STEAM_110, v)}.` };
      },
      reward: {
        log: 'Cooling steam to ice at −10 °C changed its heat by −54.9 kJ.',
        title: 'Condensing and Freezing',
        body: 'Condensation and freezing are boiling and melting run backwards: they give out the same heat that was taken in. Cooling this sample from steam to ice changes its heat by −54.9 kJ, a negative amount of heat added.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const cool = coolerFixture('cooler', { x: 51, y: 28 });
    const at = [{ x: 116, y: 9 }, { x: 138, y: 9 }, { x: 116, y: 26 }, { x: 138, y: 26 }];
    const cards = HAND.map((s, i) => sampleCard(s.id, s.label, at[i], { grams: 1, T: s.T, phase: s.phase }));
    return {
      id: 's7-burn',
      title: 'A Burn',
      prompt: 'Order the four samples by the heat each gives a hand as it cools to body temperature.',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [cool.fixture],
        zones: { slots: [cool.slot], rail: { at: { x: 75, y: 63 }, size: { w: 100, h: 14 }, first: 'Gives least heat', last: 'Gives most heat', items: cards.map(c => c.id), start: ['s100', 'w60', 's120', 'w100'] } }
      }),
      hints: [
        'Use the cooler and its "Cool" key, then lay the cards on the rail.',
        'Compare each card\'s reading with the line the pen drew for it, and with the other cards.',
        'Rank the cards by the heat each gave, from the least to the most.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all 4 cards on the rail.' };
        if (order.join() === HAND_BY_HEAT.join()) return { ok: true };
        return rankMiss(t, order);
      },
      reward: {
        log: 'Steam at 100 °C gave a hand about ten times the heat of water at 100 °C.',
        title: 'Why Steam Burns',
        body: 'Steam at 100 °C gave 2.52 kJ a gram and water at 100 °C only 0.26 kJ. Most of the steam\'s heat comes out as it condenses, before it cools at all, so a little more heat in the steam hardly matters.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const map = phaseMapFixture('map', { x: 51, y: 28 });
    return {
      id: 's8-diagram',
      title: 'Skipping the Liquid',
      prompt: 'Beyond the exam: find a pressure at which warming ice never makes liquid water.',
      widget,
      table: matterTable({
        fixtures: [map, plaqueFixture('exam', 'Beyond the AP exam', { x: 126, y: 14 }, ['Phase diagrams are', 'not on the AP exam.'], { w: 44 })]
      }),
      hints: [
        'Use the "Pressure" dial and the "Heat" key.',
        'Compare the states listed for sweeps at low pressure and at high pressure.',
        'Sweep at several pressures and find where the liquid stretch of the line shrinks to nothing; go below that.'
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
        body: 'Beyond the exam. A phase diagram maps the state of water by pressure and temperature. Below the triple point (0.01 °C, 0.611 kPa) ice turns straight to vapour; above the critical point (373.95 °C, 22.06 MPa) liquid and vapour become one fluid.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Press "Heat" to draw the line, then set the marker.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Set the dial, press "Heat" and watch the window.'],
  4: ['Heat the cup to see its line, then type your answer.'],
  5: ['Type your answer in the field at the bottom.'],
  6: ['Press "Cool" to run the sample down, then type your answer.'],
  7: ['Drag a card into the', 'cooler, press "Cool", then', 'lay it on the rail.'],
  8: ['Turn the "Pressure" dial and press "Heat".']
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
      body: 'A heating curve climbs while heat warms a sample and stands still while it changes state, spending the heat against the pull between molecules. Each flat costs moles times the heat of fusion or vaporization, and the way back gives the same heat out.'
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
const rail = order => order.map((id, i) => put(id, `rail:${i}`));

export const SOLUTIONS = [
  [...heat(3), dial('mk', 'value', 7)],
  [put('apart', 'slot:guess')],
  [dial('rec', 'heat', 3), ...heat(3)],
  [...heat(3), typedAns('12.0')],
  [typedAns('54.9')],
  [...heat(2), typedAns('-54.9')],
  [...cookAll(HAND.map(s => s.id)), ...rail(HAND_BY_HEAT)],
  [dial('map', 'pressure', 1), { run: 'map' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...heat(3), dial('mk', 'value', 1)],
  [],
  [...heat(1)],
  [typedAns('6.0')],
  [typedAns('48.9')],
  [...heat(2), typedAns('54.9')],
  [...cookAll(HAND.map(s => s.id)), ...rail(['w60', 's100', 'w100', 's120'])],
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
export const CHECKS = { FLAT_START, FLAT_END, MELT_36, UP, DOWN, HAND, HAND_BY_HEAT, gaveOf, WATER_TRIPLE };
export { heatRead, coolRead, heatOf };
