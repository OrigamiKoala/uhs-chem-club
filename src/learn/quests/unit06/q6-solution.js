/**
 * Unit 6 · Bench 6 — Taken Into Solution (q6-solution)
 *
 * A dosing station on the matter kit (`table/kits/matter.js`, the flask bench in `matter-flask.js`): a balance pan, a volumetric flask with a
 * mark on its neck, and a window that draws a small drop of what is in the flask, particle by particle. Seven stages and ONE click: the
 * belief that a mole of anything dissolved puts a mole of particles in the water.
 *
 *   1  four white powders into water, filed by what the window shows         -> solution, solute, solvent
 *   2  5.85 g of salt made up to 400 mL, a volume the dial lacks, typed      -> molarity
 *   3  2.00 M stock poured in, topped up to 100 mL, typed between the steps  -> dilution
 *   4  PREDICT: 0.100 mol of salt, of calcium chloride, of sugar: which puts the most particles in the water?
 *   5  TEST: the window for each, then the moles of particles in 0.100 mol of CaCl2, typed -> dissolving into ions
 *   6  salt, sugar, wax and acetone into water and into oil                  -> like dissolves like, miscible
 *   7  three sealed flasks with the same crowd of particles, ranked by molarity
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction's first card is "the same number from all three, 0.100 mol each". The window's drop
 * shows 4 formula units of each, and 8, 12 and 4 particles.
 *
 * Mass percent (CED 3.8, outside the exam) has no stage: it is logged as a gap in `docs/plans/mirrowen-world.md`.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { matterTable, note, plaqueFixture, fixed, whereIs, leadFixture } from '../../table/kits/matter.js';
import { flaskFixture, sample, flaskRead, dropFor } from '../../table/kits/matter-flask.js';
import { SOLUTES } from '../../engine/matterdata.js';
import {
  STUFF, molarityOf, countsOf, dropOf, unitsFor
} from '../../engine/matterdata-flask.js';

export const meta = { stageCount: 7 };


export const VOCABULARY = [
  { term: /\bsolutions?\b/i, introducedAt: 1 },
  { term: /\bsolutes?\b/i, introducedAt: 1 },
  { term: /\bsolvents?\b/i, introducedAt: 1 },
  { term: /\bmolarity\b/i, introducedAt: 2 },
  { term: /\bdilut/i, introducedAt: 3 },
  { term: /\blike dissolves like\b/i, introducedAt: 6 },
  { term: /\bmiscible\b/i, introducedAt: 6 },
  { term: /\bsolub/i, introducedAt: 6 }
];

/** Moles and molar mass are Tallow's; the grip between molecules is bench 2's. */
export const BUILDS_ON = ['unit01/q6-weigh', 'unit06/q2-grip'];

const SPEAKER = 'Vess';

/** Every control on this bench says what it does on its face, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit06/q6-solution';
const MOUTH = 'slot:flask.mouth';
const PAN = 'slot:flask.pan';
const GUESS_LABEL = { same: 'all three the same', salt: 'table salt', cacl2: 'calcium chloride', sugar: 'sugar' };

const CARD_Y = 62;
const cardAt = (i, x0 = 11, pitch = 19) => ({ x: x0 + i * pitch, y: CARD_Y });

/* ---- figures worked here (independent values are re-derived in tools/lib/mirrowen/q6-solution.mjs) ---- */
// Stage 1: four white powders, each as many units as the drop holds.
const POWDERS = [
  { id: 'a', sub: 'NaCl', tray: 'spread' },
  { id: 'b', sub: 'chalk', tray: 'lumps' },
  { id: 'c', sub: 'sugar', tray: 'spread' },
  { id: 'd', sub: 'sand', tray: 'lumps' }
];
const POWDER_UNITS = 6;
// Stage 2: 5.85 g of salt made up to 400 mL.
const SALT_G = 5.85;
const ASKED_ML = 400; // not a step of the Flask dial (100, 250, 500): the figure is worked past it
const FILLS = [100, 250, 500];
const M_ASKED = molarityOf('NaCl', SALT_G, ASKED_ML);
// Stage 3: 2.00 M stock, 100 mL of 0.500 M wanted.
const STOCK_M = 2.0;
const WANT_M = 0.5;
const FLASK_ML = 100;
const STOCKS = [10, 20, 30, 40, 50];
const V_ASKED = (WANT_M * FLASK_ML) / STOCK_M;
const stockM = ml => (STOCK_M * ml) / FLASK_ML;
// Stage 5: 0.100 mol of each in a 500 mL flask -> moles of particles in water.
const MOLES = 0.1;
const FIVE_ML = 500;
const N_ASKED = MOLES * 3;
// Stage 6: four samples, two liquids.
const LIKE = [
  { id: 'salt', sub: 'NaCl', label: 'Salt', tray: 'water' },
  { id: 'wax', sub: 'wax', label: 'Wax', tray: 'hexane' },
  { id: 'acetone', sub: 'acetone', label: 'Acetone', tray: 'both' },
  { id: 'sugar', sub: 'sugar', label: 'Sugar', tray: 'water' }
];
const LIKE_UNITS = 4;
// Stage 7: three sealed flasks of 250 mL with the same crowd of particles.
const SEALED = [
  { id: 'x', label: 'X', sub: 'NaCl', M: 0.3 },
  { id: 'y', label: 'Y', sub: 'sugar', M: 0.6 },
  { id: 'z', label: 'Z', sub: 'CaCl2', M: 0.2 }
].map(s => ({ ...s, grams: s.M * 0.25 * STUFF[s.sub].M, mL: 250 }));
const SEALED_BY_M = [...SEALED].sort((a, b) => a.M - b.M).map(s => s.id);

const describeDrop = s => {
  const c = countsOf(dropOf({ sub: s.sub, units: unitsFor(s.M), spreads: true })).by;
  return c.molecule ? `${c.molecule} whole molecules` : `${c.cation} positive and ${c.anion} negative particles`;
};

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */

/** A sorting tray: two columns of the 16-wide cards. */
const tray = (id, label, x, w = 34, cell = 17, view = null) => ({ id, label, ...(view ? { view } : {}), at: { x, y: 27 }, size: { w, h: 42 }, cell, cellH: 19.5 });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const fl = flaskFixture('flask', 2, 2, { keep: true });
    const cards = POWDERS.map((s, i) => sample(s.id, s.sub, `Sample ${s.id.toUpperCase()}`, cardAt(i), { units: POWDER_UNITS, shown: 'white powder' }));
    return {
      id: 's1-powders',
      title: 'Four White Powders',
      briefing: 'A solution is a mixture that is the same all the way through: the solute is spread through the solvent.',
      prompt: 'Which powders dissolve in water?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [fl.fixture],
        zones: { slots: [fl.mouth], trays: [tray('spread', 'Dissolves', 94, 34, 17, 'apart'), tray('lumps', 'Does not dissolve', 131, 34, 17, 'together')] }
      }),
      hints: [
        'Use the flask: drag each sample onto its mouth, look at the window, then drag the sample into a tray.',
        'Look at whether the particles in the window sit apart from one another or packed together.',
        'File the samples whose particles move apart through the water in one tray, and those whose particles stay together in the other.'
      ],
      check(state) {
        const t = state.table;
        const unfiled = POWDERS.filter(s => !t.zones.trays[whereIs(t, s.id)]);
        if (unfiled.length === POWDERS.length) return { ok: false, notYet: true, msg: 'Drag the samples into the trays.' };
        if (unfiled.length) return { ok: false, notYet: true, msg: `${t.pieces[unfiled[0].id].label} still needs a tray.` };
        const unseen = POWDERS.find(s => t.pieces[s.id].props.saw_water == null);
        if (unseen) return { ok: false, msg: `${t.pieces[unseen.id].label} has not been in the flask yet.` };
        const wrong = POWDERS.find(s => whereIs(t, s.id) !== s.tray);
        if (!wrong) return { ok: true };
        const p = t.pieces[wrong.id];
        return { ok: false, msg: `${p.label} sits in the "${t.zones.trays[whereIs(t, wrong.id)].label}" tray, and in the window its particles ${p.props.saw_water === 'spreads' ? 'sat apart from one another' : 'stayed packed together'}.` };
      },
      reward: {
        log: 'Salt and sugar spread out in the water; chalk and sand stayed in lumps.',
        title: 'Solutions',
        body: 'A solution is a mixture that is the same all the way through. The solute spreads out as separate particles through the solvent, so dissolved salt is not gone: it is still there, in pieces.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const fl = flaskFixture('flask', 2, 2, { pan: true, fills: FILLS, fillStart: 1 });
    const plate = plaqueFixture('mass', 'Molar mass', { x: 120, y: 14 }, [STUFF.NaCl.name, `${SOLUTES.NaCl.M} g per mole`], { w: 46 });
    return {
      id: 's2-molarity',
      title: 'Salt in a Flask',
      briefing: {
        body: 'Molarity, M, is the moles of solute in each litre of solution.',
        worked: ['11.7 g ÷ 58.5 g/mol = 0.200 mol', 'in 0.500 L: 0.200 ÷ 0.500 = 0.400 M']
      },
      prompt: 'What is the molarity when this salt is made up to 400 mL?',
      entry: { id: 'm', label: 'Moles per litre', unit: 'mol/L' },
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: [sample('salt', 'NaCl', 'Salt', cardAt(0), { grams: SALT_G })],
        fixtures: [fl.fixture, plate],
        zones: { slots: [fl.mouth, fl.pan] }
      }),
      hints: [
        'Use the balance, the flask and its "Flask" dial: weigh the salt, then drag it into the flask.',
        'Compare how crowded the window is at each flask size, and read the molar mass off the plate.',
        'Turn the grams on the balance into moles with the plate, then share those moles over each litre of the flask.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'm');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - M_ASKED) <= 0.01) return { ok: true };
        if (t.pieces.salt.props.weighed == null) return { ok: false, msg: 'The salt has not been on the balance yet.' };
        const moles = SALT_G / SOLUTES.NaCl.M;
        if (Math.abs(v - moles) <= 0.003) return { ok: false, msg: `${fixed(v, 3)} is the amount of salt on the balance alone, and the solution is ${ASKED_ML} mL.` };
        return { ok: false, msg: `${v} does not fit ${fixed(SALT_G, 2)} g of salt made up to ${ASKED_ML} mL.` };
      },
      reward: {
        log: '5.85 g of salt made up to 400 mL is 0.250 mol in every litre.',
        title: 'Molarity',
        body: 'The moles of solute in each litre of solution is its molarity, written M. Here 5.85 g is 0.100 mol, so 250 mL is 0.400 M and 500 mL is 0.200 M, and 400 mL, between them, is 0.250 M.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const fl = flaskFixture('flask', 2, 2, { stocks: STOCKS, volume: FLASK_ML, showM: true });
    const plate = plaqueFixture('target', 'Target', { x: 110, y: 14 }, [`${FLASK_ML} mL of ${WANT_M.toFixed(3)} M`], { w: 44 });
    return {
      id: 's3-dilute',
      title: 'Stock to a Flask',
      prompt: 'How many mL of 2.00 M stock, topped up to 100 mL, make a 0.500 M solution?',
      entry: { id: 'ml', label: 'Stock needed', unit: 'mL' },
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: [sample('stock', 'NaCl', 'Stock', cardAt(0), { made: true, stock: true, M: STOCK_M, shown: '2.00 M' })],
        fixtures: [fl.fixture, plate],
        zones: { slots: [fl.mouth] }
      }),
      hints: [
        'Drag the stock into the flask and turn the "Stock poured in" dial, reading the molarity under the window.',
        'Compare the molarity at the two steps of the dial either side of the 0.500 M target.',
        'The moles poured in from the stock are the moles that end up in the flask, so the molarity grows in step with the volume poured.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'ml');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - V_ASKED) <= 0.5) return { ok: true };
        if (v > FLASK_ML) return { ok: false, msg: `${v} mL is more than the ${FLASK_ML} mL flask holds.` };
        const lo = [...STOCKS].reverse().find(s => s <= v) ?? STOCKS[0];
        const hi = STOCKS.find(s => s >= v) ?? STOCKS[STOCKS.length - 1];
        const m = ml => (stockM(ml) >= 1 ? stockM(ml).toFixed(2) : stockM(ml).toFixed(3));
        const where = lo === hi ? `the dial reads ${m(lo)} M at ${lo} mL` : `the dial reads ${m(lo)} M at ${lo} mL and ${m(hi)} M at ${hi} mL`;
        return { ok: false, msg: `${v} mL does not give 0.500 M: ${where}.` };
      },
      reward: {
        log: '25.0 mL of 2.00 M stock, topped up to 100 mL, is 0.500 M.',
        title: 'Dilution',
        body: 'Adding water changes the litres the moles share, not the moles. So M₁V₁ = M₂V₂: 25.0 mL of 2.00 M stock topped up to 100 mL makes 0.500 M, a dilution.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
    title: 'Which Puts More In?',
    // A PREDICT STAGE: the flask is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: 'Which puts the most particles in the water: 0.100 mol of table salt, of calcium chloride, or of sugar?',
    widget,
    table: matterTable({
      pieces: [
        note('same', 'All three put the same number in', { x: 30, y: 14 }),
        note('salt', 'Table salt, NaCl', { x: 78, y: 14 }),
        note('cacl2', 'Calcium chloride, CaCl₂', { x: 30, y: 34 }),
        note('sugar', 'Sugar, C₁₂H₂₂O₁₁', { x: 78, y: 34 })
      ],
      fixtures: [leadFixture('lead', { x: 123, y: 52 }, { scene: 'salt', w: 38, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what each sample is made of before it goes into the water.',
      'Commit to the sample you expect to end as the most separate particles.'
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
      body: 'Next, put each sample in the flask and count what the window shows.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const fl = flaskFixture('flask', 2, 2, { volume: FIVE_ML });
    const subs = [['nacl', 'NaCl', 'Table salt'], ['cacl2', 'CaCl2', 'Calcium chloride'], ['sugar', 'sugar', 'Sugar']];
    return {
      id: 's5-ions',
      title: 'Particles in the Water',
      get prompt() {
        const guess = recall(QUEST_KEY);
        const ask = 'how many moles of particles does 0.100 mol of calcium chloride put in the water?';
        return guess && GUESS_LABEL[guess] ? `You guessed ${GUESS_LABEL[guess]}: ${ask}` : 'How many moles of particles does 0.100 mol of calcium chloride put in the water?';
      },
      entry: { id: 'n', label: 'Moles of particles', unit: 'mol' },
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: subs.map(([id, sub, label], i) => sample(id, sub, label, cardAt(i), { moles: MOLES, shown: '0.100 mol' })),
        fixtures: [fl.fixture],
        zones: { slots: [fl.mouth] }
      }),
      hints: [
        'Drag each sample into the flask and look at the window.',
        'Count how many separate particles one formula unit of each sample becomes in the window.',
        'Multiply the 0.100 mol of calcium chloride by the number of particles each unit becomes.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'n');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - N_ASKED) <= 0.01) return { ok: true };
        if (Math.abs(v - MOLES) <= 0.01) return { ok: false, msg: `${v} mol is one particle for each calcium chloride, and the window shows more than one in the water.` };
        return { ok: false, msg: `${v} mol does not follow from the 0.100 mol on the card and the particles the window shows.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = guess === 'cacl2' ? 'You expected calcium chloride to put the most in, and the window agreed. '
          : guess && GUESS_LABEL[guess] ? 'The window did not agree with your prediction, which is how a guess gets better. ' : '';
        return {
          log: '0.100 mol of calcium chloride put 0.300 mol of particles in the water.',
          title: 'Dissolving Into Ions',
          body: `${verdict}A salt that dissolves in water separates into its ions, each wrapped in water. A mole of CaCl₂ puts three moles of particles in, a mole of NaCl two, and sugar one, since its molecules stay whole.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const fl = flaskFixture('flask', 2, 2, { liquids: ['water', 'hexane'], keep: true });
    return {
      id: 's6-like',
      title: 'Water and Oil',
      prompt: 'Which samples dissolve in water, which in oil, and which in both?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: LIKE.map((s, i) => sample(s.id, s.sub, s.label, cardAt(i), { units: LIKE_UNITS })),
        fixtures: [fl.fixture],
        zones: {
          slots: [fl.mouth],
          trays: [
            { id: 'water', label: 'Water', at: { x: 88, y: 27 }, size: { w: 23, h: 42 }, cell: 23, cellH: 19.5 },
            { id: 'hexane', label: 'Oil', at: { x: 112, y: 27 }, size: { w: 23, h: 42 }, cell: 23, cellH: 19.5 },
            { id: 'both', label: 'Both', at: { x: 136, y: 27 }, size: { w: 23, h: 42 }, cell: 23, cellH: 19.5 }
          ]
        }
      }),
      hints: [
        'Drag each sample into the flask, turn the "Liquid" dial between water and oil, then drag the sample into a tray.',
        'Compare the water line and the oil line on each card, which the card keeps from the window.',
        'File a sample under each liquid in which its line says it spreads out.'
      ],
      check(state) {
        const t = state.table;
        const unfiled = LIKE.filter(s => !t.zones.trays[whereIs(t, s.id)]);
        if (unfiled.length === LIKE.length) return { ok: false, notYet: true, msg: 'Drag the samples into the trays.' };
        if (unfiled.length) return { ok: false, notYet: true, msg: `${unfiled[0].label} still needs a tray.` };
        const unseen = LIKE.find(s => t.pieces[s.id].props.saw_water == null || t.pieces[s.id].props.saw_hexane == null);
        if (unseen) return { ok: false, msg: `${unseen.label} has not been in both liquids yet.` };
        const wrong = LIKE.find(s => whereIs(t, s.id) !== s.tray);
        if (!wrong) return { ok: true };
        const p = t.pieces[wrong.id];
        return { ok: false, msg: `${p.label} sits in the "${t.zones.trays[whereIs(t, wrong.id)].label}" tray, and its card reads water: ${p.props.saw_water}, oil: ${p.props.saw_hexane}.` };
      },
      reward: {
        log: 'Salt and sugar spread in water, wax in oil, and acetone in both.',
        title: 'Like Dissolves Like',
        body: 'Substances whose particles pull on each other in similar ways tend to dissolve in each other: like dissolves like. Salt and sugar are soluble in water, wax in oil, and acetone, which is miscible with both, in either.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const fl = flaskFixture('flask', 2, 2, { volume: 250, count: true });
    const cards = SEALED.map((s, i) => sample(s.id, s.sub, s.label, cardAt(i), { made: true, grams: s.grams, mL: s.mL, shown: 'sealed' }));
    return {
      id: 's8-sealed',
      title: 'Three Sealed Flasks',
      prompt: 'Which sealed flask has the lowest molarity and which the highest?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [fl.fixture],
        zones: {
          slots: [fl.mouth],
          rail: { at: { x: 112, y: 34 }, size: { w: 66, h: 16 }, first: 'Lowest molarity', last: 'Highest molarity', items: SEALED.map(s => s.id), start: ['y', 'x', 'z'] }
        }
      }),
      hints: [
        'Drag each flask card onto the flask\'s mouth, then put it on the strip.',
        'Count the particles of each kind in the window, and compare them with what each sample breaks into.',
        'Molarity counts what was dissolved, so work back from the particles in each drop to how many of the dissolved things made them.'
      ],
      check(state) {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 3) return { ok: false, notYet: true, msg: 'Put all three flasks on the strip.' };
        if (order.join() === SEALED_BY_M.join()) return { ok: true };
        const k = order.findIndex((id, i) => i > 0 && SEALED.find(s => s.id === order[i - 1]).M > SEALED.find(s => s.id === id).M);
        const a = SEALED.find(s => s.id === order[k - 1]);
        const b = SEALED.find(s => s.id === order[k]);
        return { ok: false, msg: `${a.label} sits left of ${b.label}, and the drop of ${a.label} shows ${describeDrop(a)} against ${describeDrop(b)} for ${b.label}.` };
      },
      get reward() {
        const same = countsOf(dropOf({ sub: SEALED[0].sub, units: unitsFor(SEALED[0].M), spreads: true })).total;
        return {
          log: `Every drop held ${same} particles, and the molarities were 0.600, 0.300 and 0.200.`,
          title: 'Same Crowd, Different Molarity',
          body: `Every drop held ${same} particles, yet the molarities differ: sugar gives one particle for each molecule, sodium chloride two and calcium chloride three. Molarity counts what was dissolved, not the pieces it breaks into.`
        };
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag a sample onto the flask, then into a tray.'],
  2: ['Drag the salt onto the balance, then into the flask, then type your answer.'],
  3: ['Drag the stock into the flask, turn the dial, then type your answer.'],
  4: ['Drag the card you choose into the slot.'],
  5: ['Drag a sample into the flask, then type your answer.'],
  6: ['Drag a sample in, turn the dial, then file it.'],
  7: ['Drag a flask card onto the flask, then put it on the strip.']
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
      body: 'A solute spreads through a solvent as separate particles, and a salt breaks into its ions. Molarity is moles per litre of solution, a dilution keeps the moles, and like dissolves like.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });

const filePowders = tray => POWDERS.flatMap(s => [put(s.id, MOUTH), put(s.id, `tray:${tray(s)}`)]);

export const SOLUTIONS = [
  filePowders(s => s.tray),
  [put('salt', PAN), put('salt', MOUTH), dial('flask', 'fill', 2), typed('m', '0.250')],
  [put('stock', MOUTH), dial('flask', 'stock', 2), typed('ml', '25')],
  [put('same', 'slot:guess')],
  [put('cacl2', MOUTH), typed('n', '0.300')],
  LIKE.flatMap(s => [dial('flask', 'solvent', 1), put(s.id, MOUTH), dial('flask', 'solvent', 2), put(s.id, `tray:${s.tray}`)]),
  [...SEALED.map(s => put(s.id, MOUTH)), ...SEALED_BY_M.map((id, i) => put(id, `rail:${i}`))]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  POWDERS.flatMap(s => [put(s.id, MOUTH), put(s.id, `tray:${s.id === 'a' ? 'lumps' : s.tray}`)]),
  [put('salt', PAN), put('salt', MOUTH), typed('m', '0.100')],
  [put('stock', MOUTH), typed('ml', '50')],
  [],
  [put('cacl2', MOUTH), typed('n', '0.100')],
  LIKE.flatMap(s => [dial('flask', 'solvent', 1), put(s.id, MOUTH), dial('flask', 'solvent', 2), put(s.id, `tray:${s.id === 'salt' ? 'both' : s.tray}`)]),
  [...SEALED.map(s => put(s.id, MOUTH)), ...['y', 'x', 'z'].map((id, i) => put(id, `rail:${i}`))]
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
  POWDERS, SALT_G, M_ASKED, ASKED_ML, STOCK_M, WANT_M, FLASK_ML, V_ASKED, STOCKS, MOLES, N_ASKED, LIKE, SEALED, SEALED_BY_M, FIVE_ML, POWDER_UNITS, LIKE_UNITS
};
export { flaskRead, dropFor };
