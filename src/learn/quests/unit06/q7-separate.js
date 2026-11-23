/**
 * Unit 6 · Bench 7 — Pulling Apart (q7-separate)
 *
 * A distillery bay on the matter kit (`table/kits/matter.js`, with the bench's own instruments in `matter-strip.js`): a filter, a paper
 * strip, a still, a boiling flask and a plan board. Seven stages (CED 3.9) and ONE click: the belief that filtering separates any mixture.
 * Stage 1 asks what salty water leaves in the cup after the paper; stage 2 pours four mixtures through it and the dried drop of the cup
 * answers; the rest take the three ways round it (a strip, a still, a boil) and end on a sealed plan.
 *
 *   1  PREDICT: salty water through filter paper
 *   2  TEST: four mixtures poured, filed under filtering or boiling off                -> filtrate
 *   3  the black ink on the strip, the red spot's fraction of the wet edge, typed        -> chromatography, solvent front, Rf
 *   4  the same ink in a nonpolar liquid: the dyes in order of travel                    -> polarity read from a chromatogram
 *   5  three liquids in a still, ranked by when each comes over                           -> distillation
 *   6  a salted pot's boiling point, typed                                                -> boiling point elevation, colligative property
 *   7  sand, salt and water: lay steps on the plan board until each part is alone
 *
 * THE STRIP IS A SIMULATION and the bench says so. The still treats the liquids as an ideal mixture and says so. This quest pays no XP,
 * writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { matterTable, molCard, fixed, whereIs, note, tag, mleadFixture } from '../../table/kits/matter.js';
import {
  stripFixture, filterFixture, stillFixture, boilerFixture, planFixture, inkCard, dyeCard, mixCard, soluteCard,
  stripRead, filterRead, stillRead, boilerRead, planRead, planSteps
} from '../../table/kits/matter-strip.js';
import {
  FRONT_CM, rfOf, spotCm, dyesByTravel, DYE_NAME, SOLVENT_LABEL, MIXTURES, methodFor, pourThrough, STILL_LIQUIDS, STILL_NAME,
  STILL_CUTS, comesOverOrder, richestCut, boilingRise, BOIL_AMOUNTS, KB_WATER
} from '../../engine/matterdata-strip.js';

export const meta = { stageCount: 7 };


export const VOCABULARY = [
  { term: /\bfiltrate\b/i, introducedAt: 2 },
  { term: /\bchromatograph/i, introducedAt: 3 },
  { term: /\bsolvent front\b/i, introducedAt: 3 },
  { term: /\bretention factor\b|\bRf\b/, introducedAt: 3 },
  { term: /\bdistill/i, introducedAt: 5 },
  { term: /\bboiling point elevation\b/i, introducedAt: 6 },
  { term: /\bcolligative\b/i, introducedAt: 6 }
];

/** Polarity is Ligar's; the grips behind boiling points are this world's second bench. */
export const BUILDS_ON = ['unit03/q7-polarity', 'unit06/q2-grip'];

const SPEAKER = 'Vess';
/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit06/q7-separate';
const GUESS_LABEL = { clean: 'clean water in the cup', same: 'the same salty water in the cup', less: 'less salty water in the cup' };

const MIXES = ['sand', 'sawdust', 'salt', 'dye'];
const TRAY_LABEL = { filter: 'Filter it', boil: 'Boil the water off' };
const RF_RED = rfOf('red', 'water');
const RF_TOL = 0.03;
const HEXANE_ORDER = dyesByTravel('hexane');
const WATER_ORDER = dyesByTravel('water');
const STILL_ORDER = comesOverOrder();
const RISE_ANSWER = boilingRise('CaCl2', 3, 2);
const RISE_TOL = 0.05;
const STEP_LABEL = { filter: 'Pour through the paper', boil: 'Boil the water off', strip: 'Run a paper strip' };

const joinWords = list => (list.length < 2 ? list.join('') : `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`);
const cm1 = v => v.toFixed(1);

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Through the Paper',
    // A PREDICT STAGE: the filter is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'If you pour salty water through filter paper into a clean cup, what ends up in the cup?',
    widget,
    table: matterTable({
      pieces: [
        note('clean', 'Clean water, with the salt left on the paper', { x: 30, y: 14 }),
        note('same', 'Salty water, just as salty as before', { x: 30, y: 34 }),
        note('less', 'Water that is less salty than before', { x: 74, y: 14 })
      ],
      fixtures: [mleadFixture('lead', { x: 117, y: 52 }, { scene: 'sieve', w: 44, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 40, h: 15 } }] }
    }),
    hints: [
      'Read the three prediction cards and drag your choice into the slot.',
      'Think about what filter paper can trap and whether dissolved salt is small enough to pass through.',
      'Pick what you expect to find in the cup after filtering.'
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
      body: 'Next, pour four mixtures through filter paper and inspect what stays on the paper and what goes into the cup.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const fil = filterFixture('filter', { x: 36, y: 29 });
    const at = [14, 36, 58, 80].map(x => ({ x, y: 62.5 }));
    const cards = MIXES.map((m, i) => mixCard(m, m, at[i]));
    const tray = (id, x) => ({ id, label: TRAY_LABEL[id], at: { x, y: 29 }, size: { w: 38, h: 44 }, cell: 19, cellH: 19 });
    return {
      id: 's2-filter',
      title: 'Four Mixtures',
      prompt: 'Which mixtures can be separated by filtering, and which need the water boiled off?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [fil.fixture],
        zones: { slots: [fil.slot], trays: [tray('filter', 88), tray('boil', 129)] }
      }),
      hints: [
        'Pour each mixture through the filter with "Pour Through", then sort each card into a tray.',
        'Compare what stays on the filter paper with what is left when a drop from the cup dries.',
        'Put a mixture under "Filter it" when the paper traps the solid, and under "Boil the water off" when it passes into the cup.'
      ],
      check(state) {
        const t = state.table;
        const placed = MIXES.map(m => whereIs(t, m));
        if (placed.some(w => !t.zones.trays[w])) return { ok: false, notYet: true, msg: 'Sort every mixture into a tray.' };
        const unpoured = MIXES.find(m => t.pieces[m].props.poured == null);
        if (unpoured) return { ok: false, msg: `Pour ${MIXTURES[unpoured].name} through the filter first.` };
        const wrong = MIXES.filter(m => whereIs(t, m) !== methodFor(m));
        if (!wrong.length) return { ok: true };
        const m = wrong[0];
        const res = pourThrough(m);
        const tray = TRAY_LABEL[whereIs(t, m)];
        return { ok: false, msg: res.onPaper
          ? `${MIXTURES[m].name} is in "${tray}", but the filter paper trapped its grains while the drop from the cup dried clean.`
          : `${MIXTURES[m].name} is in "${tray}", but nothing stayed on the paper while the drop from the cup dried to a ${res.dried}.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g === 'same' ? 'The test matched your prediction. ' : g && GUESS_LABEL[g] ? 'The test overturned your prediction. ' : '';
        return {
          log: 'Salt and dye passed through the filter paper with the water.',
          title: 'The Filtrate',
          body: `${verdict}The liquid that passes through filter paper is the filtrate. Paper traps large grains like sand and sawdust, while dissolved salt and dye pass through and need the water boiled off.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const strip = stripFixture('strip', { x: 30, y: 31 });
    return {
      id: 's3-rf',
      title: 'Black Ink',
      briefing: 'In chromatography, a liquid climbs paper and carries each dye a different distance. Retention factor (Rf) = dye distance ÷ solvent-front distance.',
      prompt: 'What is the red dye\'s retention factor (Rf = spot distance ÷ wet-edge distance)?',
      entry: { id: 'rf', label: 'Rf (0 to 1)', unit: '' },
      widget,
      table: matterTable({
        pieces: [inkCard('ink', { x: 100, y: 30 })],
        fixtures: [strip.fixture],
        zones: { slots: [strip.slot] }
      }),
      hints: [
        'Place the ink on the strip, press "Run Strip", and enter your answer below.',
        'Measure both the red spot and the wet edge (solvent front) from the start line on the ruler.',
        'Compare how far the red spot climbed as a fraction of how far the wet edge climbed.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'rf');
        if (!(v >= 0)) return { ok: false, notYet: true, msg: 'Enter your answer in the field at the bottom.' };
        if (Math.abs(v - RF_RED) <= RF_TOL) return { ok: true };
        const r = stripRead(t, 'strip');
        if (!r.item || r.ran.water == null) return { ok: false, msg: 'Run the paper strip first.' };
        if (v > 1) return { ok: false, msg: `${fixed(v, 2)} is greater than 1, meaning the dye climbed past the wet edge.` };
        return { ok: false, msg: v > RF_RED ? `${fixed(v, 2)} places the red spot farther from the start line than the ruler shows.` : `${fixed(v, 2)} places the red spot closer to the start line than the ruler shows.` };
      },
      reward: {
        log: 'Black ink split into three dyes, and the red dye climbed about half as far as the water.',
        title: 'Chromatography',
        body: 'Chromatography separates a mixture as a liquid climbs paper that holds each dye differently. A dye\'s retention factor (Rf) is its distance divided by the solvent front distance; black ink contains three dyes.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const strip = stripFixture('strip', { x: 38, y: 32 }, { solvents: ['water', 'hexane'] });
    const cards = ['yellow', 'red', 'blue'].map((d, i) => dyeCard(d, d, { x: 96 + i * 22, y: 56 }));
    return {
      id: 's4-solvent',
      title: 'Another Liquid',
      prompt: 'In hexane and acetone, order the three dyes from least distance traveled to farthest.',
      widget,
      table: matterTable({
        pieces: [inkCard('ink', { ...strip.slot.at }, { ran: { water: FRONT_CM } }, { zone: `slot:${strip.slotId}` }), ...cards],
        fixtures: [strip.fixture],
        zones: {
          slots: [strip.slot],
          rail: { at: { x: 112, y: 34 }, size: { w: 74, h: 16 }, labelLift: 3.2, first: 'Traveled least', last: 'Traveled farthest', items: cards.map(c => c.id) }
        }
      }),
      hints: [
        'Set the "Solvent" dial to Hexane and acetone, press "Run Strip", then order the dyes on the rail.',
        'Compare where each colored spot ends on the ruler with where it ended in water.',
        'Order the dyes by how far their spots traveled in hexane and acetone, closest to the start line first.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Place all 3 dyes on the rail.' };
        const r = stripRead(t, 'strip');
        if (!r.item || r.ran.hexane == null) return { ok: false, msg: 'Run the ink in hexane and acetone first.' };
        if (order.join() === HEXANE_ORDER.join()) return { ok: true };
        const k = order.findIndex((d, i) => i > 0 && spotCm(order[i - 1], 'hexane') > spotCm(d, 'hexane'));
        const a = DYE_NAME[order[k - 1]]; const b = DYE_NAME[order[k]];
        return { ok: false, msg: `${a} is left of ${b} on the rail, but on the hexane and acetone strip the ${a.toLowerCase()} spot climbed higher than the ${b.toLowerCase()} spot.` };
      },
      reward: {
        log: 'Blue led in water and trailed in hexane and acetone, while yellow did the opposite.',
        title: 'Reading Polarity',
        body: 'The order reversed: polar water carries polar dyes farthest, while nonpolar hexane and acetone carry nonpolar dyes farthest. Comparing the two strips reveals each dye\'s polarity.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const still = stillFixture('still', { x: 43, y: 32 });
    const cards = [['acetone', 'acetone'], ['ethanol', 'ethanol'], ['h2o', 'H2O']].map(([id, sub], i) => molCard(id, sub, STILL_NAME[sub], { x: 96 + i * 22, y: 56 }));
    return {
      id: 's5-still',
      title: 'Three Liquids',
      prompt: 'Order the three liquids from the first to boil off in the still to the last.',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [still.fixture],
        zones: { rail: { at: { x: 115, y: 34 }, size: { w: 68, h: 16 }, labelLift: 3.2, first: 'Comes over first', last: 'Comes over last', items: cards.map(c => c.id) } }
      }),
      hints: [
        'Press "Collect Cut" until all three vials fill, then order the liquids on the rail.',
        'Check which liquid dominates each vial and note the column temperature as it fills.',
        'Order the liquids by which vial holds the most of each, from vial 1 to vial 3.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Place all 3 liquids on the rail.' };
        const s = stillRead(t, 'still');
        if (s.cuts < STILL_CUTS) return { ok: false, msg: `You have collected ${s.cuts} of ${STILL_CUTS} vials so far; press "Collect Cut" until all three fill.` };
        const want = STILL_ORDER.map(id => (id === 'H2O' ? 'h2o' : id));
        if (order.join() === want.join()) return { ok: true };
        const sub = id => (id === 'h2o' ? 'H2O' : id);
        const k = order.findIndex((id, i) => i > 0 && richestCut(sub(order[i - 1])) > richestCut(sub(id)));
        const a = order[k - 1]; const b = order[k];
        return { ok: false, msg: `${STILL_NAME[sub(a)][0].toUpperCase()}${STILL_NAME[sub(a)].slice(1)} is left of ${STILL_NAME[sub(b)]}, but ${STILL_NAME[sub(a)]} is richest in vial ${richestCut(sub(a)) + 1} while ${STILL_NAME[sub(b)]} is richest in vial ${richestCut(sub(b)) + 1}.` };
      },
      reward: {
        log: 'Each vial was richest in one liquid, though none was completely pure.',
        title: 'Distillation',
        body: 'Distillation heats a mixture so the liquid with the weakest attractions boils off first and cools into a vial. Each vial is enriched in one liquid rather than pure; a taller column separates them better.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const boil = boilerFixture('boil', { x: 42, y: 30 });
    const cards = [soluteCard('sugar', 'sugar', { x: 110, y: 12 }), soluteCard('nacl', 'NaCl', { x: 110, y: 32 }), soluteCard('cacl2', 'CaCl2', { x: 110, y: 52 })];
    return {
      id: 's6-colligative',
      title: 'A Salted Flask',
      briefing: {
        speaker: 'Vess',
        body: 'Test sugar, NaCl, and CaCl₂ in the boiling flask to see how the boiling-point rise depends on the number of dissolved particles.'
      },
      prompt: 'How many degrees above 100 °C does 2.00 kg of water boil when 3.00 mol of CaCl₂ is dissolved in it?',
      entry: { id: 'rise', label: 'Rise in boiling point', unit: '°C' },
      widget,
      table: matterTable({ pieces: cards, fixtures: [boil.fixture], zones: { slots: [boil.slot] } }),
      hints: [
        'Drag a solute card into the boiling flask, set the "Dissolved" dial, press "Boil", then enter your answer below.',
        'Compare the boiling-point rise for sugar, NaCl, and CaCl₂ at the same moles, and count the ions on each card.',
        'Scale the boiling-point rise from 1.00 kg of water to 3.00 mol of CaCl₂ in 2.00 kg of water.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'rise');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Enter your answer in the field at the bottom.' };
        if (Math.abs(v - RISE_ANSWER) <= RISE_TOL) return { ok: true };
        const near = x => Math.abs(v - x) <= RISE_TOL;
        if (near(boilingRise('NaCl', 3, 2)) || near(boilingRise('sugar', 3, 2))) return { ok: false, msg: `${fixed(v, 2)} °C matches a different solute at this amount, not CaCl₂.` };
        if (near(boilingRise('CaCl2', 3, 1))) return { ok: false, msg: `${fixed(v, 2)} °C is the rise for 3.00 mol in 1.00 kg of water, but this flask holds 2.00 kg.` };
        return { ok: false, msg: `${fixed(v, 2)} °C does not match the boiling-point rises shown for CaCl₂ in 1.00 kg of water.` };
      },
      reward: {
        log: 'Dissolved solute raised the boiling point in proportion to the number of dissolved particles.',
        title: 'Boiling Point Elevation',
        body: 'Dissolving 3.00 mol of CaCl₂ in 2.00 kg of water gives 1.50 mol/kg, or 4.50 mol of ions per kg, raising the boiling point by 2.3 °C. Properties that depend only on particle count are colligative properties.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const board = planFixture('plan', { x: 34, y: 24 });
    const card = (id, step, x) => tag(id, STEP_LABEL[step], { x, y: 52 }, { props: { step } });
    const cards = [card('s-strip', 'strip', 76), card('s-boil', 'boil', 106), card('s-filter', 'filter', 136)];
    return {
      id: 's7-plan',
      title: 'Sand, Salt and Water',
      prompt: 'Which steps, in what order, separate a mixture of sand, salt, and water into three pure parts?',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [board],
        zones: { rail: { at: { x: 108, y: 24 }, size: { w: 80, h: 16 }, first: 'First step', last: 'Last step', items: [] } }
      }),
      hints: [
        'Drag step cards onto the rail in order, then press Submit to see where each part ends up.',
        'Decide which step traps the sand and which step separates dissolved salt from liquid water.',
        'Notice which step only works while the water is still there.'
      ],
      check(state) {
        const t = state.table;
        const steps = planSteps(t);
        if (!steps.length) return { ok: false, notYet: true, msg: 'Place at least one step card on the rail.' };
        const r = planRead(t);
        const idle = r.moved.findIndex(m => !m);
        if (r.separated && idle < 0) return { ok: true };
        if (r.separated) return { ok: false, msg: `The "${STEP_LABEL[steps[idle]]}" step did nothing: the result is the same without it.` };
        const where = { paper: 'the paper', flask: 'the flask', receiver: 'the receiver' };
        const crowded = ['paper', 'flask', 'receiver'].filter(k => r[k].length > 1);
        if (!crowded.length) return { ok: false, msg: 'The three parts are not separated yet.' };
        const k = crowded[0];
        const text = `${where[k]} still holds ${joinWords(r[k])} together.`;
        return { ok: false, msg: text[0].toUpperCase() + text.slice(1) };
      },
      reward: {
        log: 'Filtering first, then boiling the water off, separated all three parts.',
        title: 'Choosing a Method',
        body: 'Filtering first traps the sand grains, and boiling the water off next leaves the salt behind while collecting clean water. Match each separation step to how the parts differ.'
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
      body: 'Filter paper traps undissolved solids but lets dissolved solutes pass through in the filtrate. Chromatography separates dyes by polarity, distillation separates liquids by boiling point, and boiling off the solvent recovers a dissolved solid.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const rail = order => order.map((id, i) => put(id, `rail:${i}`));
const pourAll = place => MIXES.flatMap(m => [put(m, 'slot:filter.mix'), { run: 'filter' }, put(m, `tray:${place(m)}`)]);

export const SOLUTIONS = [
  [put('same', 'slot:guess')],
  pourAll(methodFor),
  [put('ink', 'slot:strip.ink'), { run: 'strip' }, typed('rf', RF_RED)],
  [dial('strip', 'solvent', 2), { run: 'strip' }, ...rail(HEXANE_ORDER)],
  [...Array.from({ length: STILL_CUTS }, () => ({ run: 'still' })), ...rail(STILL_ORDER.map(id => (id === 'H2O' ? 'h2o' : id)))],
  [put('cacl2', 'slot:boil.pot'), dial('boil', 'amount', 3), { run: 'boil' }, dial('boil', 'amount', 2), { run: 'boil' }, typed('rise', RISE_ANSWER.toFixed(2))],
  [put('s-filter', 'rail:0'), put('s-boil', 'rail:1')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  pourAll(m => (m === 'salt' ? 'filter' : methodFor(m))),
  [put('ink', 'slot:strip.ink'), { run: 'strip' }, typed('rf', (spotCm('red', 'water') ).toFixed(1))],
  [dial('strip', 'solvent', 2), { run: 'strip' }, ...rail(WATER_ORDER)],
  [...Array.from({ length: STILL_CUTS }, () => ({ run: 'still' })), ...rail(['h2o', 'ethanol', 'acetone'])],
  [put('cacl2', 'slot:boil.pot'), dial('boil', 'amount', 3), { run: 'boil' }, typed('rise', boilingRise('NaCl', 3, 2).toFixed(2))],
  [put('s-boil', 'rail:0'), put('s-filter', 'rail:1')]
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
export const CHECKS = {
  RF_RED, RF_TOL, HEXANE_ORDER, WATER_ORDER, STILL_ORDER, RISE_ANSWER, RISE_TOL, KB_WATER, MIXES, FRONT_CM, SOLVENT_LABEL, STILL_LIQUIDS
};
export { stripRead, filterRead, stillRead, boilerRead, planRead };
