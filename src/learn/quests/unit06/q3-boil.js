/**
 * Unit 6 · Bench 3 — Liquids and Vapour (q3-boil)
 *
 * A pumping station on the matter kit (`table/kits/matter.js` and its vapour part `matter-vapour.js`): the FLASK seals a liquid with a
 * pressure gauge that rises and levels off, a Heater dial and an Outside dial. Eight stages and ONE click: the belief that water boils at
 * 100 °C, always. The prediction offers it, and the flask's own plot of pressure against temperature overturns it.
 *
 *   1  ether in a sealed flask with leaving/returning counters                         -> vapor pressure, equal rates
 *   2  ether, ethanol and water sealed at 25 °C, ranked by vapor pressure              -> weaker attractions, higher vapor pressure
 *   3  four samples at different temperatures, ranked the same way                     -> heat raises it
 *   4  PREDICT: at what temperature does water boil where the air pressure is 65 kPa?
 *   5  TEST: the plot of the flask's readings, the outside line, a typed figure        -> boiling point
 *   6  butane, n-pentane, acetone and water ranked by boiling point, from the probe    -> attraction sets it
 *   7  surface tension against the attraction of three liquids                         -> surface tension
 *   8  an equal cube of ice and of water, weighed, and two pictures of molecules       -> why ice floats
 *
 * THE WRONG MODEL IS ON THE TABLE. The prediction's first card is "it still boils at 100 °C"; stage 3 is the stage where a strong-attracting
 * liquid out-pushes a weak one because it is hot. A card that has been in the flask keeps what the pressure settled at.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { matterTable, molCard, probeFixture, selectorFixture, dialAt, whereIs, note, stmt, fixed, probeRead, mleadFixture } from '../../table/kits/matter.js';
import { flaskFixture, flaskRead, liquidCard, packCard, surfaceFixture, surfaceRows, cellFixture, fmtP } from '../../table/kits/matter-vapour.js';
import { SUBSTANCES, vaporPressure, boilingPoint, LIQUID_PROPS } from '../../engine/matterdata.js';
import {
  HEATER_STEPS, OUTSIDE_STEPS, MOUNTAIN_KPA, surfacePull, BOX_MASS, PICTURE_COUNT
} from '../../engine/matterdata-vapour.js';

export const meta = { stageCount: 8 };


export const VOCABULARY = [
  { term: /\bvapou?r pressure\b/i, introducedAt: 1 },
  { term: /\bboiling point\b/i, introducedAt: 5 },
  { term: /\bsurface tension\b/i, introducedAt: 7 }
];

/** Attractions are q2's; pressure in kPa is Bellows'; the lattice is Ligar's. */
export const BUILDS_ON = ['unit06/q2-grip', 'unit04/q1-knocks', 'unit03/q2-lattice'];

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

const gripText = id => `attraction ${(SUBSTANCES[id].grip + 1e-9).toFixed(1)} kJ`;
const mass = id => `${SUBSTANCES[id].M.toFixed(SUBSTANCES[id].M < 100 ? 1 : 0)} g/mol`;
/** A row of `n` cards along the bottom of the table. */
const at = (n, y = 54, x0 = 24, pitch = 22) => Array.from({ length: n }, (_, i) => ({ x: x0 + i * pitch, y }));
/** Where a card returns to when the flask is given another: a shelf at the right, clear of the bottom rail. */
const shelf = n => Array.from({ length: n }, (_, i) => ({ x: 104 + (i % 2) * 24, y: 12 + Math.floor(i / 2) * 22 }));
const RAIL = (n, first, last) => ({ at: { x: 75, y: 60 }, size: { w: 24 * n + 8, h: 16 }, first, last });

/* ------------------------------------------------------------------
   THE FIGURES THE STAGES GRADE AGAINST (each recomputed in tools/lib/mirrowen/q3-boil.mjs from the CRC)
   ------------------------------------------------------------------ */

/** Stage 2: three liquids sealed at 25 °C. */
const S2_LIQ = ['ether', 'ethanol', 'H2O'];
const idOf = id => id.toLowerCase();
const byVp25 = ids => [...ids].sort((a, b) => vaporPressure(a, 25) - vaporPressure(b, 25));
export const VP25_ORDER = byVp25(S2_LIQ);

/** Stage 3: four samples, each held at its own temperature (the card's). */
const S3 = [
  { id: 'h2o', sub: 'H2O', label: 'water', T: 80 },
  { id: 'ether', sub: 'ether', label: 'ether', T: 0 },
  { id: 'ethanol', sub: 'ethanol', label: 'ethanol', T: 40 },
  { id: 'acetone', sub: 'acetone', label: 'acetone', T: 25 }
];
export const WARM_ORDER = [...S3].sort((a, b) => vaporPressure(a.sub, a.T) - vaporPressure(b.sub, b.T)).map(s => s.id);
/** What the order would be if every sample were at 25 °C (the slip). */
const WARM_SLIP = [...S3].sort((a, b) => vaporPressure(a.sub, 25) - vaporPressure(b.sub, 25)).map(s => s.id);

/** Stage 5: water where the outside pressure is 65 kPa. */
export const BP_MOUNTAIN = boilingPoint('H2O', MOUNTAIN_KPA);
export const BP_TOL = 3;

/** Stage 6: boiling points of four molecules, ranked by what the probe reads. */
const S6 = ['C4H10', 'C5H12', 'acetone', 'H2O'];
export const BP_ORDER = [...S6].sort((a, b) => SUBSTANCES[a].bp - SUBSTANCES[b].bp);
const MASS_ORDER = [...S6].sort((a, b) => SUBSTANCES[a].M - SUBSTANCES[b].M);

/** Stage 7: three liquids; water has the highest attraction and the highest surface tension. */
const S7 = ['H2O', 'ethanol', 'hexane'];
const S7_OPTIONS = ['Water', 'Ethanol', 'Hexane', '—'];
const rankIds = (ids, f) => [...ids].sort((a, b) => f(a) - f(b));
export const GRIP_ORDER = rankIds(S7, id => SUBSTANCES[id].grip);
export const PULL_ORDER = rankIds(S7, surfacePull);
export const FOLLOWS = 1;

/** Stage 8: the open lattice holds fewer molecules in the same space; the lighter cube is the ice. */
export const ICE_PICTURE = 'pb';

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
    const flask = flaskFixture('flask', { x: 52, y: 22 }, { rates: true });
    const ether = liquidCard('ether', 'ether', 'ether', { x: 18, y: 53.5 });
    const choices = [
      stmt('none', 'None are leaving any more', { x: 126, y: 8 }),
      stmt('equal', 'As many return as leave', { x: 126, y: 22 }),
      stmt('more', 'More leave than return', { x: 126, y: 36 })
    ];
    return {
      id: 's1-equilibrium',
      title: 'Leaving and Returning',
      prompt: 'When the pressure stops rising, what are the molecules at the surface doing?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: [ether, ...choices],
        fixtures: [flask.fixture],
        zones: { slots: [flask.slot, { id: 'answer', label: 'At steady pressure', at: { x: 126, y: 50 }, size: { w: 38, h: 14 } }] }
      }),
      hints: [
        'Use ether, the flask, its "Settle" key and the slot.',
        'Watch the LEAVING and RETURNING counters after you press "Settle".',
        'Compare the LEAVING and RETURNING numbers once the pressure levels off: they tell you what the molecules are doing.'
      ],
      check(state) {
        const t = state.table;
        const card = Object.values(t.pieces).find(p => p.zone === 'slot:answer');
        if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
        if (card.id === 'equal') return { ok: true };
        if (!flaskRead(t, 'flask').valid) return { ok: false, msg: 'Put ether in the flask and press "Settle" to see the two counters.' };
        if (card.id === 'none') return { ok: false, msg: 'Look at the LEAVING counter after the flask settles: molecules are still leaving the surface.' };
        return { ok: false, msg: 'Look at both counters after the flask settles; if more left than came back, the pressure would still be climbing.' };
      },
      reward: {
        log: 'Molecules still leave and return at equal rates.',
        title: 'Vapor Pressure',
        body: 'Molecules still leave and return, at equal rates. The steady pressure of the vapor is the liquid\'s vapor pressure.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const flask = flaskFixture('flask', { x: 41, y: 22 });
    flask.fixture.props.gate = { railChanged: ['ethanol', 'ether', 'h2o'] };
    flask.fixture.props.gateMsg = 'Rank the liquids on the rail first, then settle each in the flask.';
    const pos = shelf(3);
    const cards = S2_LIQ.map((s, i) => liquidCard(idOf(s), s, SUBSTANCES[s].name.replace('diethyl ', ''), pos[i]));
    return {
      id: 's2-sealed',
      title: 'Sealed Liquids',
      prompt: 'Which liquid has the lowest vapor pressure and which the highest?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [flask.fixture],
        zones: { slots: [flask.slot], rail: { ...RAIL(3, 'Lowest vapor pressure', 'Highest vapor pressure'), items: cards.map(c => c.id), start: ['ethanol', 'ether', 'h2o'] } }
      }),
      hints: [
        'Rank the liquids on the rail first, then use the flask and its "Settle" key.',
        'Compare the vapor pressure each card settled at with the attractions you measured on the second bench.',
        'Think which liquid\'s molecules leave the surface most easily.'
      ],
      check: railCheck(VP25_ORDER.map(idOf), vpOf, fmtP, 'kPa', 'flask'),
      reward: {
        log: 'Weak attractions gave a high vapor pressure.',
        title: 'Attractions Set Vapor Pressure',
        body: 'The weaker the attraction between molecules, the more easily they leave the liquid, so the higher the vapor pressure.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const flask = flaskFixture('flask', { x: 41, y: 22 });
    flask.fixture.props.gate = { railChanged: ['ether', 'acetone', 'h2o', 'ethanol'] };
    flask.fixture.props.gateMsg = 'Rank the samples on the rail first, then settle each in the flask.';
    const pos = shelf(4);
    const cards = S3.map((s, i) => liquidCard(s.id, s.sub, s.label, pos[i], { shown: `${s.T} °C`, T: s.T }));
    return {
      id: 's3-warm',
      title: 'Warm and Cold',
      prompt: 'Which sample has the lowest vapor pressure and which the highest?',
      widget,
      table: matterTable({
        bounds: { w: 150, h: 72 },
        pieces: cards,
        fixtures: [flask.fixture],
        zones: { slots: [flask.slot], rail: { ...RAIL(4, 'Lowest vapor pressure', 'Highest vapor pressure'), items: cards.map(c => c.id), start: ['ether', 'acetone', 'h2o', 'ethanol'] } }
      }),
      hints: [
        'Rank the samples on the rail first, then use the flask and its "Settle" key.',
        'Compare the vapor pressure each card settled at with the temperature printed on it.',
        'Rank the cards by the vapor pressure each one settled at, from the lowest to the highest, whatever the liquid.'
      ],
      check: railCheck(WARM_ORDER, vpOf, fmtP, 'kPa', 'flask'),
      reward: {
        log: 'Warm water had a higher vapor pressure than cold ether.',
        title: 'Heat Raises It',
        body: 'Warming a liquid sends more of its molecules into the vapor, so its vapor pressure climbs steeply with temperature. Warm water settled above cold ether, though water\'s attraction is far stronger.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-predict',
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
      fixtures: [mleadFixture('lead', { x: 117, y: 52 }, { scene: 'sealed', w: 44, h: 24 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 124, y: 24 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the three cards and the slot.',
      'Think about what the last two stages showed vapor pressure doing as a liquid was warmed.',
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

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const flask = flaskFixture('flask', { x: 51, y: 27 }, { temps: HEATER_STEPS, outsides: OUTSIDE_STEPS, plot: true, w: 98 });
    const water = liquidCard('h2o', 'H2O', 'water', { x: 128, y: 24 });
    return {
      id: 's5-boil',
      title: 'Where It Boils',
      briefing: 'Bubbles of vapor can form inside a liquid only when its vapor pressure equals the pressure pressing on it. That is boiling.',
      get prompt() {
        const guess = recall(QUEST_KEY);
        return guess && GUESS_LABEL[guess]
          ? `You guessed ${GUESS_LABEL[guess]}: at what temperature does water boil when the outside pressure is ${MOUNTAIN_KPA} kPa?`
          : `At what temperature does water boil when the outside pressure is ${MOUNTAIN_KPA} kPa?`;
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

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const probe = probeFixture('probe', { x: 34, y: 23 });
    const pos = at(4);
    const names = { C4H10: 'butane', C5H12: 'n-pentane', acetone: 'acetone', H2O: 'water' };
    const cards = S6.map((s, i) => molCard(idOf(s), s, names[s], pos[i], { dipoles: SUBSTANCES[s].polar, shown: mass(s) }));
    return {
      id: 's6-rank',
      title: 'Four Boiling Points',
      prompt: 'Which liquid has the lowest boiling point and which the highest?',
      widget,
      table: matterTable({
        pieces: cards,
        fixtures: [probe.fixture],
        zones: { slots: [probe.slot], rail: { at: { x: 107, y: 34 }, size: { w: 84, h: 16 }, first: 'Boils lowest', last: 'Boils highest', items: cards.map(c => c.id), start: ['h2o', 'c4h10', 'acetone', 'c5h12'] } }
      }),
      hints: [
        'Use the probe, its key and the rail.',
        'Compare each reading with the mass on its card, and look at which cards are drawn with + and − marks.',
        'Rank the cards by boiling point, using what the probe read for each and what the flask showed about liquids with weak attractions.'
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
        title: 'The Attraction Sets the Boiling Point',
        body: 'Boiling pulls molecules away from their neighbours, so the stronger the attraction, the more heat it takes and the higher the boiling point. Light water boils far hotter than heavier butane.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const plate = surfaceFixture('plate', { x: 38, y: 23 });
    const answer = selectorFixture('answer', 'Highest surface tension', { x: 118, y: 24 }, { options: S7_OPTIONS, start: S7_OPTIONS.length, w: 46 });
    const pos = at(3);
    const names = { H2O: 'water', ethanol: 'ethanol', hexane: 'hexane' };
    const cards = S7.map((s, i) => liquidCard(idOf(s), s, names[s], pos[i], { shown: gripText(s) }));
    return {
      id: 's7-surface',
      title: 'Surface Tension',
      prompt: 'Which of the three liquids has the highest surface tension?',
      widget,
      table: matterTable({ pieces: cards, fixtures: [plate.fixture, answer], zones: { slots: [plate.slot] } }),
      hints: [
        'Use the plate, its "Test" key and the answer dial.',
        'Compare the surface tension of each liquid with the attraction printed on its card.',
        'A stronger attraction between molecules pulls the surface inward more strongly.'
      ],
      check(state) {
        const t = state.table;
        const v = dialAt(t, 'answer', 'value');
        if (v === S7_OPTIONS.length) return { ok: false, notYet: true, msg: 'Point the answer dial at one of the three liquids.' };
        if (v === FOLLOWS) return { ok: true };
        const rows = surfaceRows(t, 'plate');
        if (rows.length < S7.length) return { ok: false, msg: `The table has a row for ${rows.length} of the 3 liquids; test all three on the plate to compare them.` };
        const line = id => `${SUBSTANCES[id].name} ${fixed(surfacePull(id), 1)} mN/m on attraction ${(SUBSTANCES[id].grip + 1e-9).toFixed(1)} kJ`;
        return { ok: false, msg: `The table reads ${S7.map(line).join('; ')}.` };
      },
      reward: {
        log: 'Water had the highest surface tension.',
        title: 'Surface Tension',
        body: 'Water: its molecules attract each other most strongly, so its surface resists being broken. That resistance is surface tension.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
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
      id: 's8-ice',
      title: 'Two Pictures',
      prompt: 'Which picture shows ice and which liquid water?',
      widget,
      table: matterTable({
        pieces: [...samples, ...pics],
        fixtures: [cell.fixture],
        zones: { slots: [cell.slot], trays: [tray('ice', 'Ice', 96), tray('water', 'Water at 0 °C', 132)] }
      }),
      hints: [
        'Use the equal cubes and its "Weigh" key, and drag each picture into a tray.',
        'Compare the two masses, and count the molecules in each picture.',
        'Fewer molecules in the same space means less mass in one cubic centimetre.'
      ],
      check(state) {
        const t = state.table;
        const inTray = id => whereIs(t, id);
        if (!t.zones.trays[inTray('pa')] || !t.zones.trays[inTray('pb')]) return { ok: false, notYet: true, msg: 'Every picture needs a tray.' };
        if (inTray('pb') === 'ice' && inTray('pa') === 'water') return { ok: true };
        const bad = inTray('pb') !== 'ice' ? 'pb' : 'pa';
        const other = bad === 'pb' ? 'pa' : 'pb';
        const n = id => t.pieces[id].props.n;
        return { ok: false, msg: `Picture ${t.pieces[bad].label} holds ${n(bad)} molecules and picture ${t.pieces[other].label} holds ${n(other)}, and picture ${t.pieces[bad].label} sits in the "${t.zones.trays[inTray(bad)].label}" tray.` };
      },
      reward: {
        log: 'Ice weighs less than water in the same space.',
        title: 'Why Ice Floats',
        body: 'Hydrogen bonds hold the molecules of ice in an open lattice with more space between them than in liquid water. The same molecules take more space, so ice is less dense than water and floats.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag ether into the flask,', 'press "Settle", then put', 'one card in the slot.'],
  2: ['Drag a card into the flask,', 'press its key, then put the', 'card on the rail.'],
  3: ['Drag a card into the flask,', 'press its key, then put the', 'card on the rail.'],
  4: ['Drag the card you choose', 'into the slot.'],
  5: ['Drag the water into the flask,', 'set the dials, press its key', 'at a heater step, then type', 'your answer.'],
  6: ['Drag a card into the probe,', 'press its key, then put the', 'card on the rail.'],
  7: ['Drag a card into the plate,', 'press its key, then turn', 'the answer dial.'],
  8: ['Drag a sample into the cube,', 'press its key, then drag', 'each picture into a tray.']
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
      body: 'A liquid in a sealed flask settles at its vapor pressure, which rises with temperature and falls with a stronger attraction. It boils where its vapor pressure meets the pressure outside, so its boiling point is not fixed at 100 °C.'
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
  [put('ether', FLASK_WELL), settle, put('equal', 'slot:answer')],
  [...rail(VP25_ORDER.map(idOf)), ...settleAll(SEALED_ALL), ...rail(VP25_ORDER.map(idOf))],
  [...rail(WARM_ORDER), ...settleAll(S3.map(s => s.id)), ...rail(WARM_ORDER)],
  [put('lower', 'slot:guess')],
  [put('h2o', FLASK_WELL), dial('flask', 'outside', 3), ...heatSteps(HEATER_STEPS, [60, 70, 80, 90, 100]), typed('bp', '88')],
  [...S6.flatMap(s => [put(idOf(s), PROBE_WELL), { run: 'probe' }]), ...rail(BP_ORDER.map(idOf))],
  [...S7.flatMap(s => [put(idOf(s), PLATE_WELL), { run: 'plate' }]), dial('answer', 'value', FOLLOWS)],
  [put('ice', CELL_WELL), { run: 'cell' }, put('water', CELL_WELL), { run: 'cell' }, put(ICE_PICTURE, 'tray:ice'), put('pa', 'tray:water')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [put('ether', FLASK_WELL), settle, put('more', 'slot:answer')],
  [...rail([...VP25_ORDER].reverse().map(idOf)), ...settleAll(SEALED_ALL), ...rail([...VP25_ORDER].reverse().map(idOf))],
  [...rail(WARM_SLIP), ...settleAll(S3.map(s => s.id)), ...rail(WARM_SLIP)],
  [],
  [put('h2o', FLASK_WELL), dial('flask', 'outside', 3), ...heatSteps(HEATER_STEPS, [60, 80, 100]), typed('bp', '100')],
  [...S6.flatMap(s => [put(idOf(s), PROBE_WELL), { run: 'probe' }]), ...rail(MASS_ORDER.map(idOf))],
  [...S7.flatMap(s => [put(idOf(s), PLATE_WELL), { run: 'plate' }]), dial('answer', 'value', 2)],
  [put('ice', CELL_WELL), { run: 'cell' }, put('water', CELL_WELL), { run: 'cell' }, put('pa', 'tray:ice'), put(ICE_PICTURE, 'tray:water')]
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
  VP25_ORDER, WARM_ORDER, WARM_SLIP, BP_MOUNTAIN, BP_TOL, BP_ORDER, MASS_ORDER, GRIP_ORDER, PULL_ORDER, FOLLOWS, S7_OPTIONS,
  BOX_MASS, PICTURE_COUNT, S3, HEATER_STEPS, OUTSIDE_STEPS, LIQUID_PROPS
};
export { probeRead };
