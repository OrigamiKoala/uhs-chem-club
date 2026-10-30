/**
 * Unit 6 · Bench 3 — Liquids and Vapour (q3-boil)
 *
 * A pumping station on the matter kit (`table/kits/matter.js` and its vapour part `matter-vapour.js`): the FLASK seals a liquid with a
 * gauge that rises and levels off, a Heater dial and an Outside dial. Eight stages and ONE click: the belief that water boils at 100 °C,
 * always. The prediction offers it, and the flask's own plot of pressure against temperature overturns it.
 *
 *   1  ether, ethanol and water sealed at 25 °C, ranked by where the gauge settles        -> vapor pressure
 *   2  four samples at different temperatures, ranked the same way                          -> heat raises it
 *   3  PREDICT: at what temperature does water boil where the air pressure is 65 kPa?
 *   4  TEST: the plot of the flask's readings, the outside line, a typed figure             -> boiling point
 *   5  butane, n-pentane, acetone and water ranked by boiling point, from the probe         -> the grip sets it
 *   6  surface pull and pour time against the grip of three liquids                        -> surface tension, viscosity
 *   7  an equal cube of ice and of water, weighed, and two boxes of molecules               -> why ice floats
 *   8  a gas collected over water at 35 °C: the gas alone, typed                             -> gas over water
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction's first card is "it still boils at 100 °C"; stage 2 is the stage where a strong-gripping
 * liquid out-pushes a weak one because it is hot. A card that has been in the flask keeps what the gauge settled at.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { matterTable, molCard, probeFixture, selectorFixture, dialAt, whereIs, note, fixed, probeRead } from '../../table/kits/matter.js';
import { flaskFixture, liquidCard, packCard, surfaceFixture, surfaceRows, cellFixture, jarFixture, fmtP } from '../../table/kits/matter-vapour.js';
import { SUBSTANCES, vaporPressure, boilingPoint, LIQUID_PROPS } from '../../engine/matterdata.js';
import {
  HEATER_STEPS, OUTSIDE_STEPS, MOUNTAIN_KPA, JAR, gasAlone, surfacePull, pourTime, BOX_MASS, PICTURE_COUNT
} from '../../engine/matterdata-vapour.js';

export const meta = { stageCount: 8 };


export const VOCABULARY = [
  { term: /\bvapou?r pressure\b/i, introducedAt: 1 },
  { term: /\bboiling point\b/i, introducedAt: 4 },
  { term: /\bsurface tension\b/i, introducedAt: 6 },
  { term: /\bviscosity\b/i, introducedAt: 6 }
];

/** The grip is q2's; pressure in kPa and gas over water are Bellows'; the lattice is Ligar's. */
export const BUILDS_ON = ['unit06/q2-grip', 'unit04/q1-knocks', 'unit04/q4-mixtures', 'unit03/q2-lattice'];

const SPEAKER = 'Vess';

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const FLASK_WELL = 'slot:flask.well';
const PLATE_WELL = 'slot:plate.well';
const CELL_WELL = 'slot:cell.well';
const PROBE_WELL = 'slot:probe.well';
const QUEST_KEY = 'unit06/q3-boil';
const GUESS_LABEL = { always: 'that it still boils at 100 °C', lower: 'below 100 °C', higher: 'above 100 °C' };

const gripText = id => `grip ${(SUBSTANCES[id].grip + 1e-9).toFixed(1)} kJ`;
const mass = id => `${SUBSTANCES[id].M.toFixed(SUBSTANCES[id].M < 100 ? 1 : 0)} g/mol`;
/** A row of `n` cards along the bottom of the table. */
const at = (n, y = 54, x0 = 24, pitch = 22) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * pitch, y }));
/** Where a card returns to when the flask is given another: a shelf at the right, clear of the bottom rail. */
const shelf = n => Array.from({ length: n }, (_, i) => ({ x: 104 + (i % 2) * 24, y: 12 + Math.floor(i / 2) * 22 }));
const RAIL = (n, first, last) => ({ at: { x: 75, y: 60 }, size: { w: 24 * n + 8, h: 16 }, first, last });

/* ------------------------------------------------------------------
   THE FIGURES THE STAGES GRADE AGAINST (each recomputed in tools/lib/mirrowen/q3-boil.mjs from the CRC)
   ------------------------------------------------------------------ */

/** Stage 1: three liquids sealed at 25 °C. */
const S1 = ['ether', 'ethanol', 'H2O'];
const idOf = id => id.toLowerCase();
const byVp25 = ids => [...ids].sort((a, b) => vaporPressure(a, 25) - vaporPressure(b, 25));
export const VP25_ORDER = byVp25(S1);

/** Stage 2: four samples, each held at its own temperature (the card's). */
const S2 = [
  { id: 'h2o', sub: 'H2O', label: 'water', T: 80 },
  { id: 'ether', sub: 'ether', label: 'ether', T: 0 },
  { id: 'ethanol', sub: 'ethanol', label: 'ethanol', T: 40 },
  { id: 'acetone', sub: 'acetone', label: 'acetone', T: 25 }
];
export const WARM_ORDER = [...S2].sort((a, b) => vaporPressure(a.sub, a.T) - vaporPressure(b.sub, b.T)).map(s => s.id);
/** What the order would be if every sample were at 25 °C (the slip). */
const WARM_SLIP = [...S2].sort((a, b) => vaporPressure(a.sub, 25) - vaporPressure(b.sub, 25)).map(s => s.id);

/** Stage 4: water where the outside pressure is 65 kPa. */
export const BP_MOUNTAIN = boilingPoint('H2O', MOUNTAIN_KPA);
export const BP_TOL = 3;

/** Stage 5: boiling points of four molecules, ranked by what the probe reads. */
const S5 = ['C4H10', 'C5H12', 'acetone', 'H2O'];
export const BP_ORDER = [...S5].sort((a, b) => SUBSTANCES[a].bp - SUBSTANCES[b].bp);
const MASS_ORDER = [...S5].sort((a, b) => SUBSTANCES[a].M - SUBSTANCES[b].M);

/** Stage 6: three liquids; the grip and the surface pull rank them alike, the pour time does not. */
const S6 = ['H2O', 'ethanol', 'hexane'];
const S6_OPTIONS = ['Surface pull', 'Pour time', 'Both', 'Neither', '—'];
const rankIds = (ids, f) => [...ids].sort((a, b) => f(a) - f(b));
export const GRIP_ORDER = rankIds(S6, id => SUBSTANCES[id].grip);
export const PULL_ORDER = rankIds(S6, surfacePull);
export const POUR_ORDER = rankIds(S6, pourTime);
export const FOLLOWS = (() => {
  const a = PULL_ORDER.join() === GRIP_ORDER.join(); const b = POUR_ORDER.join() === GRIP_ORDER.join();
  return a && b ? 3 : a ? 1 : b ? 2 : 4;
})();

/** Stage 7: the open lattice holds fewer molecules in the same box; the lighter cube is the ice. */
export const ICE_PICTURE = 'pb';

/** Stage 8: the gas alone in a jar at 35 °C whose gauge reads 101.3 kPa. */
export const GAS_ALONE = gasAlone();
export const GAS_TOL = 0.4;

/* ------------------------------------------------------------------
   MESSAGES
   ------------------------------------------------------------------ */

/** The refusal for a rank: the first neighbours that read the wrong way round, with what each read. */
function rankMiss(t, order, read, fmt, unit, instrument, name = id => t.pieces[id].label) {
  const cards = order.map(id => t.pieces[id]);
  if (cards.some(p => read(p) == null)) return { ok: false, msg: `Not every card on the rail has been through the ${instrument} yet.` };
  const k = cards.findIndex((p, i) => i > 0 && read(cards[i - 1]) > read(p));
  const a = cards[k - 1]; const b = cards[k];
  return { ok: false, msg: `${name(a.id)} sits left of ${name(b.id)}, and the ${instrument} read ${fmt(read(a))} ${unit} for the one and ${fmt(read(b))} ${unit} for the other.` };
}

function railCheck(want, read, fmt, unit, instrument) {
  return state => {
    const t = state.table;
    const order = t.zones.rail.order;
    if (order.length < want.length) return { ok: false, notYet: true, msg: `Put all ${want.length} cards on the rail.` };
    if (order.join() === want.join()) return { ok: true };
    return rankMiss(t, order, read, fmt, unit, instrument);
  };
}

const vpOf = p => p.props.vp;
const gripOf = p => p.props.grip;
const kj = v => (v < 1 ? (v + 1e-9).toFixed(2) : (v + 1e-9).toFixed(1));

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const flask = flaskFixture('flask', { x: 41, y: 22 });
    const pos = shelf(3);
    const cards = S1.map((s, i) => liquidCard(idOf(s), s, SUBSTANCES[s].name.replace('diethyl ', ''), pos[i]));
    return {
      id: 's1-sealed',
      title: 'Sealed Liquids',
      prompt: 'Order ether, ethanol and water by the pressure the gauge settles at in a sealed flask.',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [flask.fixture],
        zones: { slots: [flask.slot], rail: { ...RAIL(3, 'Settles lowest', 'Settles highest'), items: cards.map(c => c.id), start: ['ethanol', 'ether', 'h2o'] } }
      }),
      hints: [
        'Use the flask, its "Settle" key and the rail.',
        'Compare the pressure the gauge settled at for each card, and with the grips you measured on the second bench.',
        'Rank the cards by the pressure each one settled at, from the lowest to the highest.'
      ],
      check: railCheck(VP25_ORDER.map(idOf), vpOf, fmtP, 'kPa', 'flask'),
      reward: {
        log: 'Every liquid made a pressure and then stopped rising.',
        title: 'Vapor Pressure',
        body: 'Molecules leave a liquid\'s surface and return to it, and the gauge stops rising when the two flows match. That steady pressure is the liquid\'s vapor pressure. Ether, whose grip is the weakest of the three, settled highest, and water, whose grip is the strongest, lowest.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const flask = flaskFixture('flask', { x: 41, y: 22 });
    const pos = shelf(4);
    const cards = S2.map((s, i) => liquidCard(s.id, s.sub, s.label, pos[i], { shown: `${s.T} °C`, T: s.T }));
    return {
      id: 's2-warm',
      title: 'Warm and Cold',
      prompt: 'Order the four samples by the pressure the gauge settles at.',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [flask.fixture],
        zones: { slots: [flask.slot], rail: { ...RAIL(4, 'Settles lowest', 'Settles highest'), items: cards.map(c => c.id), start: ['ether', 'acetone', 'h2o', 'ethanol'] } }
      }),
      hints: [
        'Use the flask, its "Settle" key and the rail.',
        'Compare what the gauge settled at for each card with the temperature printed on it.',
        'Rank the cards by the pressure each one settled at, from the lowest to the highest, whatever the liquid.'
      ],
      check: railCheck(WARM_ORDER, vpOf, fmtP, 'kPa', 'flask'),
      reward: {
        log: 'Warm water out-pushed cold ether.',
        title: 'Heat Raises It',
        body: 'Warming a liquid sends more of its molecules into the vapor, so its vapor pressure climbs steeply with temperature. Warm water settled above cold ether, though water\'s grip is far stronger.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-predict',
    title: 'On the Mountain',
    // A PREDICT STAGE: the flask is not on the table yet. The guess is made first, here, and comes back with the test.
    predict: true,
    prompt: `Where the outside air pressure is only ${MOUNTAIN_KPA} kPa, as on a high mountain, at what temperature will water boil?`,
    widget,
    table: matterTable({
      pieces: [
        note('always', 'It still boils at 100 °C', { x: 30, y: 14 }),
        note('lower', 'It boils below 100 °C', { x: 78, y: 14 }),
        note('higher', 'It boils above 100 °C', { x: 30, y: 34 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Think about what the last two stages showed the gauge doing as a liquid was warmed.',
      'Commit to the card you believe, and the next bench tests it.'
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
      body: 'Next, find where water boils at that pressure with the flask.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const flask = flaskFixture('flask', { x: 51, y: 27 }, { temps: HEATER_STEPS, outsides: OUTSIDE_STEPS, plot: true, w: 98 });
    const water = liquidCard('h2o', 'H2O', 'water', { x: 128, y: 24 });
    return {
      id: 's4-boil',
      title: 'Where It Boils',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You guessed ${GUESS_LABEL[guess]}: type the temperature at which water boils when the outside pressure is ${MOUNTAIN_KPA} kPa.`
          : `Type the temperature at which water boils when the outside pressure is ${MOUNTAIN_KPA} kPa.`;
      },
      entry: { id: 'bp', label: 'Water boils at', unit: '°C' },
      widget,
      table: matterTable({ pieces: [water], fixtures: [flask.fixture], zones: { slots: [flask.slot] } }),
      hints: [
        'Use the water card, the Heater and Outside dials, the "Settle" key and the number field.',
        'Compare the line of readings on the plot with the amber line for the outside pressure, and see which heater step the flask boils at.',
        'Read the temperature where the plotted line meets the amber line, between two heater steps, and type it.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'bp');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - BP_MOUNTAIN) <= BP_TOL) return { ok: true };
        return { ok: false, msg: `At ${fixed(v, 0)} °C the flask's pressure is ${fmtP(vaporPressure('H2O', v))} kPa, and the outside pressure is ${MOUNTAIN_KPA} kPa.` };
      },
      get reward() {
        const guess = recall(QUEST_KEY);
        const verdict = guess === 'lower' ? 'The flask agreed with your guess. ' : guess && GUESS_LABEL[guess] ? 'The flask did not agree with your guess. ' : '';
        return {
          log: 'Water reached the outside pressure well below 100 °C.',
          title: 'Boiling Point',
          body: `${verdict}A liquid boils when its vapor pressure reaches the pressure outside it, and that temperature is its boiling point. Water gets there below 100 °C on a mountain.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const probe = probeFixture('probe', { x: 34, y: 23 });
    const pos = at(4);
    const names = { C4H10: 'butane', C5H12: 'n-pentane', acetone: 'acetone', H2O: 'water' };
    const cards = S5.map((s, i) => molCard(idOf(s), s, names[s], pos[i], { dipoles: SUBSTANCES[s].polar, shown: mass(s) }));
    return {
      id: 's5-rank',
      title: 'Four Boiling Points',
      prompt: 'Order butane, n-pentane, acetone and water by boiling point.',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], rail: { at: { x: 107, y: 34 }, size: { w: 84, h: 16 }, first: 'Boils lowest', last: 'Boils highest', items: cards.map(c => c.id), start: ['h2o', 'c4h10', 'acetone', 'c5h12'] } }
      }),
      hints: [
        'Use the probe, its key and the rail.',
        'Compare each reading with the mass on its card, and look at which cards are drawn with + and − marks.',
        'Rank the cards by boiling point, using what the probe read for each and what the flask showed about liquids that hold on weakly.'
      ],
      check: state => {
        const t = state.table;
        const order = t.zones.rail.order;
        if (order.length < 4) return { ok: false, notYet: true, msg: 'Put all 4 cards on the rail.' };
        const want = BP_ORDER.map(idOf);
        if (order.join() === want.join()) return { ok: true };
        const cards = order.map(id => t.pieces[id]);
        if (cards.some(p => gripOf(p) == null)) return { ok: false, msg: 'Not every card on the rail has been through the probe yet.' };
        const rank = p => want.indexOf(p.id);
        const k = cards.findIndex((p, i) => i > 0 && rank(cards[i - 1]) > rank(p));
        const a = cards[k - 1]; const b = cards[k];
        return { ok: false, msg: `${a.label} sits left of ${b.label}, and the probe read ${kj(gripOf(a))} kJ for the one and ${kj(gripOf(b))} kJ for the other.` };
      },
      reward: {
        log: 'Light water boiled hotter than heavier butane.',
        title: 'The Grip Sets the Boiling Point',
        body: 'Boiling pulls molecules away from their neighbours, so the harder they hold on, the more heat it takes and the higher the boiling point. Light water boils far hotter than heavier butane.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const plate = surfaceFixture('plate', { x: 41, y: 23 });
    const answer = selectorFixture('answer', 'The grip is followed by', { x: 122, y: 24 }, { options: S6_OPTIONS, start: S6_OPTIONS.length, w: 46 });
    const pos = at(3);
    const names = { H2O: 'water', ethanol: 'ethanol', hexane: 'hexane' };
    const cards = S6.map((s, i) => liquidCard(idOf(s), s, names[s], pos[i], { shown: gripText(s) }));
    return {
      id: 's6-surface',
      title: 'Surface and Pour',
      prompt: 'Which reading follows the grip across the three liquids: surface pull, pour time, both or neither?',
      widget,
      table: matterTable({ pieces: cards, fixtures: [plate.fixture, answer], zones: { slots: [plate.slot] } }),
      hints: [
        'Use the plate, its "Test" key and the answer dial.',
        'Compare each column of the table with the grip printed on the cards.',
        'Line the liquids up by grip, then see which column keeps that order.'
      ],
      check(state) {
        const t = state.table;
        const v = dialAt(t, 'answer', 'value');
        if (v === S6_OPTIONS.length) return { ok: false, notYet: true, msg: 'Point the answer dial at one of its positions.' };
        if (v === FOLLOWS) return { ok: true };
        const rows = surfaceRows(t, 'plate');
        if (rows.length < S6.length) return { ok: false, msg: `The table has a row for ${rows.length} of the 3 liquids.` };
        const line = id => `${SUBSTANCES[id].name} ${fixed(surfacePull(id), 1)} mN/m and ${fixed(pourTime(id), 1)} s on grip ${(SUBSTANCES[id].grip + 1e-9).toFixed(1)} kJ`;
        return { ok: false, msg: `The table reads ${S6.map(line).join('; ')}.` };
      },
      reward: {
        log: 'The surface pull followed the grip; the pour time did not.',
        title: 'Surface Tension and Viscosity',
        body: 'Molecules at a surface are pulled inward by their neighbours, which gives surface tension, and a stronger grip makes it higher. How slowly a liquid pours is its viscosity, and the grip is not all that sets it: ethanol grips less than water yet pours slower.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const cell = cellFixture('cell', { x: 35, y: 23 });
    const pos = at(2, 54, 14);
    const samples = [
      liquidCard('ice', 'H2O', 'ice', pos[0], { shown: '0 °C', phase: 'ice' }),
      liquidCard('water', 'H2O', 'water', pos[1], { shown: '0 °C', phase: 'water' })
    ];
    const pics = [packCard('pa', 'A', { x: 68, y: 54 }, 'packed'), packCard('pb', 'B', { x: 96, y: 54 }, 'open')];
    const tray = (id, label, x) => ({ id, label, at: { x, y: 26 }, size: { w: 30, h: 36 }, cell: 26, cellH: 21 });
    return {
      id: 's7-ice',
      title: 'Two Boxes',
      prompt: 'File each picture box under the sample it shows.',
      widget,
      table: matterTable({
        pieces: [...samples, ...pics],
        fixtures: [cell.fixture],
        zones: { slots: [cell.slot], trays: [tray('ice', 'Ice', 96), tray('water', 'Water at 0 °C', 132)] }
      }),
      hints: [
        'Use the equal boxes and its "Weigh" key, and drag each picture box into a tray.',
        'Compare the two masses, and count the molecules in each picture box.',
        'Put the picture box with fewer molecules in the same space under the sample that weighs less.'
      ],
      check(state) {
        const t = state.table;
        const inTray = id => whereIs(t, id);
        if (!t.zones.trays[inTray('pa')] || !t.zones.trays[inTray('pb')]) return { ok: false, notYet: true, msg: 'Every picture box needs a tray.' };
        if (inTray('pb') === 'ice' && inTray('pa') === 'water') return { ok: true };
        const bad = inTray('pb') !== 'ice' ? 'pb' : 'pa';
        const other = bad === 'pb' ? 'pa' : 'pb';
        const n = id => t.pieces[id].props.n;
        return { ok: false, msg: `Box ${t.pieces[bad].label} holds ${n(bad)} molecules and box ${t.pieces[other].label} holds ${n(other)}, and box ${t.pieces[bad].label} sits in the "${t.zones.trays[inTray(bad)].label}" tray.` };
      },
      reward: {
        log: 'Ice weighs less than water in the same space.',
        title: 'Why Ice Floats',
        body: 'Hydrogen bonds hold the molecules of ice in an open lattice with more room between them than in liquid water. The same molecules take more space, so ice is less dense than water and floats.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const flask = flaskFixture('flask', { x: 51, y: 27 }, { temps: [20, 30, 40, 50], plot: true, w: 98 });
    const jar = jarFixture('jar', { x: 126, y: 22 }, { w: 46 });
    const water = liquidCard('h2o', 'H2O', 'water', { x: 126, y: 52 });
    return {
      id: 's8-jar',
      title: 'Gas Over Water',
      prompt: `Type the pressure of the gas alone in the jar, whose gauge reads ${JAR.total} kPa.`,
      entry: { id: 'gas', label: 'Gas alone', unit: 'kPa' },
      widget,
      table: matterTable({ pieces: [water], fixtures: [flask.fixture, jar], zones: { slots: [flask.slot] } }),
      hints: [
        'Use the water card, the Heater dial, the "Settle" key and the number field.',
        'Compare the jar\'s temperature with the heater steps either side of it on the plot.',
        'Read the water\'s own pressure at the jar\'s temperature from between those steps, then work out how much of the gauge is left for the gas.'
      ],
      check(state) {
        const t = state.table;
        const v = entryNumber(t, 'gas');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type your answer in the field at the bottom.' };
        if (Math.abs(v - GAS_ALONE) <= GAS_TOL) return { ok: true };
        if (Math.abs(v - JAR.total) <= 0.3) return { ok: false, msg: `The jar's gauge reads ${JAR.total} kPa, and the gauge counts everything inside the jar.` };
        return { ok: false, msg: `The gas and the water vapor make up the gauge's ${JAR.total} kPa between them, and ${fixed(v, 1)} kPa of gas leaves a different share for the vapor than the plot shows at ${JAR.T} °C.` };
      },
      reward: {
        log: 'The gauge was the gas plus the water vapor.',
        title: 'Gas Over Water',
        body: 'A gas collected over water is mixed with water vapor, and each pushes with its own pressure. The gas alone is the gauge less the vapor pressure of water at the jar\'s temperature.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag a card into the flask,', 'press its key, then put the', 'card on the rail.'],
  2: ['Drag a card into the flask,', 'press its key, then put the', 'card on the rail.'],
  3: ['Drag the card you choose', 'into the slot.'],
  4: ['Drag the water into the flask,', 'set the dials, press its key', 'at a heater step, then type', 'your answer.'],
  5: ['Drag a card into the probe,', 'press its key, then put the', 'card on the rail.'],
  6: ['Drag a card into the plate,', 'press its key, then turn', 'the answer dial.'],
  7: ['Drag a sample into the box,', 'press its key, then drag', 'each picture box into a tray.'],
  8: ['Drag the water into the flask,', 'press its key at a heater step,', 'then type your answer.']
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
      body: 'A liquid in a sealed flask settles at its vapor pressure, which rises with temperature and falls with a stronger grip. It boils where its vapor pressure meets the pressure outside, so its boiling point is not fixed at 100 °C.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const settle = { run: 'flask' };
const rail = order => order.map((id, i) => put(id, `rail:${i}`));
const settleAll = ids => ids.flatMap(id => [put(id, FLASK_WELL), settle]);
const heatSteps = (list, wanted) => wanted.flatMap(T => [dial('flask', 'heat', list.indexOf(T) + 1), settle]);
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const SEALED_ALL = ['ether', 'ethanol', 'h2o'];

export const SOLUTIONS = [
  [...settleAll(SEALED_ALL), ...rail(VP25_ORDER.map(idOf))],
  [...settleAll(S2.map(s => s.id)), ...rail(WARM_ORDER)],
  [put('lower', 'slot:guess')],
  [put('h2o', FLASK_WELL), dial('flask', 'outside', 3), ...heatSteps(HEATER_STEPS, [60, 70, 80, 90, 100]), typed('bp', '88')],
  [...S5.flatMap(s => [put(idOf(s), PROBE_WELL), { run: 'probe' }]), ...rail(BP_ORDER.map(idOf))],
  [...S6.flatMap(s => [put(idOf(s), PLATE_WELL), { run: 'plate' }]), dial('answer', 'value', FOLLOWS)],
  [put('ice', CELL_WELL), { run: 'cell' }, put('water', CELL_WELL), { run: 'cell' }, put(ICE_PICTURE, 'tray:ice'), put('pa', 'tray:water')],
  [put('h2o', FLASK_WELL), ...heatSteps([20, 30, 40, 50], [30, 40]), typed('gas', '95.5')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...settleAll(SEALED_ALL), ...rail([...VP25_ORDER].reverse().map(idOf))],
  [...settleAll(S2.map(s => s.id)), ...rail(WARM_SLIP)],
  [],
  [put('h2o', FLASK_WELL), dial('flask', 'outside', 3), ...heatSteps(HEATER_STEPS, [60, 80, 100]), typed('bp', '100')],
  [...S5.flatMap(s => [put(idOf(s), PROBE_WELL), { run: 'probe' }]), ...rail(MASS_ORDER.map(idOf))],
  [...S6.flatMap(s => [put(idOf(s), PLATE_WELL), { run: 'plate' }]), dial('answer', 'value', 3)],
  [put('ice', CELL_WELL), { run: 'cell' }, put('water', CELL_WELL), { run: 'cell' }, put('pa', 'tray:ice'), put(ICE_PICTURE, 'tray:water')],
  [put('h2o', FLASK_WELL), ...heatSteps([20, 30, 40, 50], [30, 40]), typed('gas', '97.1')]
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
  VP25_ORDER, WARM_ORDER, WARM_SLIP, BP_MOUNTAIN, BP_TOL, BP_ORDER, MASS_ORDER, GRIP_ORDER, PULL_ORDER, POUR_ORDER, FOLLOWS, S6_OPTIONS,
  GAS_ALONE, GAS_TOL, MOUNTAIN_KPA, JAR, BOX_MASS, PICTURE_COUNT, S2, HEATER_STEPS, OUTSIDE_STEPS, LIQUID_PROPS
};
export { probeRead };
