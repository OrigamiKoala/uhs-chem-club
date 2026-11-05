/**
 * Unit 8 · Bench 2 — The Number That Holds (q2-k)
 *
 * Teeter's salt pans, on the pans kit (`table/kits/pans.js`, the ratio instruments in `pans-ratio.js`). A pan is a vessel with a bar for
 * every substance; "Settle" lets it reach equilibrium. Eight stages and ONE click: the belief that equilibrium means equal amounts.
 *
 *   1  PREDICT: where do three pans that began differently settle?
 *   2  TEST: lay tiles on the ratio rig so it reads the same on all three pans   -> the ratio holds; K (A and B)
 *   3  the same, for H₂ + I₂ ⇌ 2 HI, where a coefficient becomes a power         -> Kc
 *   4  the same, for CaCO₃(s) ⇌ CaO(s) + CO₂(g), where the amount of solid varies -> solids are left out; Kp
 *   5  typed: K to two significant figures for 2 NO₂ ⇌ N₂O₄ from its bars
 *   6  pick the pan that goes nearly to completion                                -> large K
 *   7  pick the pan that will make the least product (K is printed on each pan)   -> small K
 *   8  lay the K card that belongs to each of three pans (two cards are slips)
 *
 * THE WRONG MODEL IS ON THE TABLE. Pan 3 begins with equal amounts of A and B and settles with twice as much B; no arrangement of tiles that
 * says "equal amounts" ever reads the same on the three pans.
 *
 * The rig prints a reading for whatever is laid on it and never says which arrangement is the one to look for; the planner is
 * `engine/eqdata.js` (`rigReading`, `settleAmounts`). Both arrangements that give a steady number are accepted (a ratio and its inverse).
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { pansTable, selectorFixture, note, tag, pieceIn, dialValue } from '../../table/kits/pans.js';
import { vesselFixture, rigParts, tile, rigRead, vslRead } from '../../table/kits/pans-ratio.js';
import { K_SYSTEMS, readingsAgree, fmtNum, kSlips, settleAmounts } from '../../engine/eqdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bK\b/, introducedAt: 2 },
  { term: /\bequilibrium constant\b/i, introducedAt: 2 },
  { term: /\bKc\b/, introducedAt: 3 },
  { term: /\bKp\b/, introducedAt: 4 },
  { term: /\blarge K\b/i, introducedAt: 6 },
  { term: /\bsmall K\b/i, introducedAt: 7 }
];

/** The pans' words are q1's: equilibrium, reversible reaction, double arrow. */
export const BUILDS_ON = ['unit08/q1-both'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit08/q2-k';
const GUESS = {
  equal: 'In every pan, A and B settle at equal amounts',
  same: 'All three pans settle with the same amount of A and the same of B',
  diff: 'Every pan settles somewhere different, with nothing in common',
  gone: 'In every pan, all the A is used up'
};

const AB = K_SYSTEMS.ab;
const HI = K_SYSTEMS.hi;
const CA = K_SYSTEMS.caco3;
const NO = K_SYSTEMS.n2o4;

/* ---------------------------------------------------------------- the data each stage's pans start from (inputs; every figure shown is the planner's) */

const AB_PANS = [{ start: { A: 1.2 } }, { start: { B: 1.8 } }, { start: { A: 0.3, B: 0.3 } }];
const HI_PANS = [{ start: { H2: 1, I2: 1 } }, { start: { HI: 1 } }, { start: { H2: 0.6, I2: 1.4, HI: 0.5 } }];
const CA_PANS = [{ start: { CaCO3: 1, CaO: 0 } }, { start: { CaCO3: 0.6, CaO: 0.4 } }, { start: { CaCO3: 0.2, CaO: 0.8 } }];
const NO_PAN = [{ start: { NO2: 0.736 } }];
/** Four pans of A ⇌ B that begin with 1.00 mol/L of A alone; only K differs. */
const K_BIG = [0.7, 2e5, 6e-4, 5];
const K_SMALL = [7e4, 0.3, 3e-6, 4];
const BIG_PICK = 2;
const SMALL_PICK = 3;
const levelPans = Ks => Ks.map(K => ({ start: { A: 1 }, K }));

/** Sealed pans: three different reactions, already settled, each with its K card. */
const SEALED = [
  { system: 'ab', start: { A: 1 } },
  { system: 'a2b', start: { A: 1.1 } },
  { system: 'abc', start: { A: 0.5, B: 0.8 } }
];
const sealedEq = i => settleAmounts(K_SYSTEMS[SEALED[i].system], Object.fromEntries(Object.keys(K_SYSTEMS[SEALED[i].system].species).map(s => [s, SEALED[i].start[s] ?? 0])));

/* ---------------------------------------------------------------- shared pieces of a stage */

const X_TILES = 137;
const tileAt = i => ({ x: X_TILES, y: 9 + i * 13.5 });
const TABLE_H = 72;
const PANS_AT = { x: 62, y: 22 };
const RIG_AT = { x: 62, y: 57 };

/** The vessels, the rig and its tiles for a stage that reads the rig on three pans. */
function rigTable(system, pans, tiles, { top = 1, bottom = 1 } = {}) {
  const rig = rigParts('rig', RIG_AT, { vsl: 'pans', top, bottom });
  return pansTable({
    pieces: tiles.map(([sp, p], i) => tile(`t-${sp}${p}`, system, sp, p, tileAt(i))),
    fixtures: [vesselFixture('pans', PANS_AT, { system, pans }), rig.fixture],
    zones: { slots: rig.slots }
  }, { h: TABLE_H });
}

/** What the rig reads on the three pans, as a sentence. */
const readingsText = r => {
  const v = r.readings.map(x => fmtNum(x, 3));
  return `${v.slice(0, -1).join(', ')} and ${v[v.length - 1]}`;
};

/** The check of the three rig stages: the pans must have settled, something laid, and the three readings must agree. */
function rigCheck(state) {
  const r = rigRead(state.table, 'rig');
  if (!r.laid) return { ok: false, notYet: true, msg: 'Lay a tile on the rig.' };
  if (!r.settled) return { ok: false, notYet: true, msg: 'The rig prints nothing until the pans have settled.' };
  if (readingsAgree(r.readings)) return { ok: true };
  return { ok: false, msg: `The rig reads ${readingsText(r)} on the three pans.` };
}

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);

const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const put = (piece, to) => ({ place: { piece, to } });

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Where Do They End?',
    // A PREDICT STAGE: the pans are not on the table. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Which best describes the three pans once each has settled?',
    widget,
    table: pansTable({
      pieces: [
        tag('st1', 'Pan 1 begins with only A', { x: 30, y: 12 }),
        tag('st2', 'Pan 2 begins with only B', { x: 76, y: 12 }),
        tag('st3', 'Pan 3 begins with equal amounts of A and B', { x: 122, y: 12 }),
        note('equal', GUESS.equal, { x: 30, y: 36 }),
        note('same', GUESS.same, { x: 78, y: 36 }),
        note('diff', GUESS.diff, { x: 30, y: 58 }),
        note('gone', GUESS.gone, { x: 78, y: 58 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 126, y: 48 }, size: { w: 36, h: 14 } }] }
    }, { h: TABLE_H }),
    hints: [
      'Use the four cards and the slot.',
      'Picture each pan from its card, and ask what it would look like once it has settled.',
      'Compare what the three pans began with, and ask whether where they end should depend on that.'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Lay a card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction locked in.',
      title: 'Prediction',
      body: 'Next, the three pans are settled and measured.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-ratio',
    title: 'The Ratio Rig',
    get prompt() { return guessLine('Lay tiles on the rig so that it reads the same number on all three settled pans.', recall(QUEST_KEY)); },
    widget,
    table: rigTable('ab', AB_PANS, [['A', 1], ['B', 1]]),
    hints: [
      'Use the "Settle" key and the two tiles.',
      'Compare the three numbers the rig prints under the pans for each arrangement you try.',
      'Try each tile alone, then both together, and keep the arrangement whose three numbers match.'
    ],
    check: rigCheck,
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = g === 'equal' ? 'Pan 3 began with equal amounts and moved away from them. ' : g === 'same' ? 'The amounts differed from pan to pan, but the ratio did not. ' : g === 'gone' ? 'Some A was left in every pan. ' : '';
      return {
        log: 'B over A held at the same number on every pan.',
        title: 'The Equilibrium Constant',
        body: `${verdict}B over A came out at ${fmtNum(AB.K, 2)} on every pan, and A over B at ${fmtNum(1 / AB.K, 2)}, whatever the pan began with. The ratio of products over reactants at equilibrium is the equilibrium constant, K.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-powers',
    title: 'Two of the Same',
    prompt: 'Lay tiles on the rig so that it reads the same number on all three settled pans of this reaction.',
    widget,
    table: rigTable('hi', HI_PANS, [['H2', 1], ['I2', 1], ['HI', 1], ['HI', 2]], { top: 2, bottom: 2 }),
    hints: [
      'Use the "Settle" key and the four tiles.',
      'Compare the three readings for each arrangement; a tile with a small 2 counts its amount multiplied by itself.',
      'Check the readings for each arrangement you try; the equation printed on the pans says how many of each substance take part.'
    ],
    check: rigCheck,
    reward: {
      log: 'HI squared over H₂ times I₂ held at one number.',
      title: 'Coefficients Become Powers',
      body: `The 2 in front of HI in the equation became a power: HI² over H₂ times I₂ came out at ${fmtNum(HI.K, 2)} on every pan. With amounts in mol/L, the constant is written Kc.`
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-solids',
    title: 'A Pan With Solids',
    prompt: 'Lay tiles on the rig so that it reads the same number on all three settled pans of this reaction.',
    widget,
    table: rigTable('caco3', CA_PANS, [['CaCO3', 1], ['CaO', 1], ['CO2', 1]], { top: 2, bottom: 2 }),
    hints: [
      'Use the "Settle" key and the three tiles.',
      'Compare the readings for an arrangement that includes the solids with one that leaves them off.',
      'Test arrangements one tile at a time, and add a tile only while the three numbers still agree.'
    ],
    check: rigCheck,
    reward: {
      log: 'Only the gas stayed the same from pan to pan.',
      title: 'Solids Are Left Out',
      body: 'The amounts of CaCO₃ and CaO changed from pan to pan, but the pressure of CO₂ did not, so only the gas is in the ratio. A pure solid\'s concentration is set by what it is, not by how much there is. With pressures the constant is written Kp.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-typed',
    title: 'Find K',
    prompt: 'Find K for this pan, to two significant figures.',
    widget,
    entry: { id: 'k', label: 'K', unit: '' },
    table: pansTable({
      fixtures: [vesselFixture('pans', { x: 38, y: 22 }, { system: 'n2o4', pans: NO_PAN, settled: true, w: 70, titles: ['The pan at equilibrium'] })]
    }, { h: 46 }),
    hints: [
      'Type the figure in the field.',
      'Read the amount of each substance from the bars and take the reaction from the equation printed beside them.',
      'Write the ratio the way you found it on the rig, put the bar amounts in, and round to two figures.'
    ],
    check(state) {
      const v = entryNumber(state.table, 'k');
      if (!Number.isFinite(v)) return { ok: false, notYet: true, msg: 'Type a number in the field.' };
      const pan = vslRead(state.table, 'pans').pans[0];
      if (Math.abs(v - pan.K) / pan.K <= 0.03) return { ok: true };
      const sl = kSlips(NO, pan.eq);
      const near = x => Math.abs(v - x) / x <= 0.03;
      const eq = `NO₂ at ${fmtNum(pan.eq.NO2, 3)} atm and N₂O₄ at ${fmtNum(pan.eq.N2O4, 3)} atm`;
      if (near(sl.inverted)) return { ok: false, msg: `That figure is the ratio turned upside down: ${eq} puts N₂O₄ on the products side of the equation.` };
      if (near(sl.noPower)) return { ok: false, msg: `That figure counts NO₂ once; the equation has a 2 in front of NO₂.` };
      if (near(sl.multiplied)) return { ok: false, msg: `That figure multiplies the NO₂ pressure by 2; the 2 in the equation does not multiply it.` };
      return { ok: false, msg: `With ${eq}, that is not the figure the ratio of this pan comes to.` };
    },
    reward: {
      log: 'K for 2 NO₂ ⇌ N₂O₄ came from the bars.',
      title: 'K From a Pan',
      body: `Putting the settled pressures into products over reactants, with the 2 as a power, gave K = ${fmtNum(NO.K, 2)}. Any pan of this reaction at this temperature settles to the same figure.`
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-large',
    title: 'Nearly All the Way',
    prompt: 'Set the dial to the pan whose reaction goes nearly to completion.',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('pans', PANS_AT, { system: 'ab', pans: levelPans(K_BIG), lw: 12, legend: false }),
        selectorFixture('pick', 'Goes nearly to completion', { x: 62, y: 55 }, { options: ['Pan 1', 'Pan 2', 'Pan 3', 'Pan 4', ' '], start: 5, w: 60 })
      ]
    }, { h: 66 }),
    hints: [
      'Use the "Settle" key and the answer dial.',
      'Compare how much A is left in each pan after it settles.',
      'A pan that goes nearly to completion has almost none of the substance it began with left.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === BIG_PICK) return { ok: true };
      const eq = vslRead(state.table, 'pans').pans[v - 1].eq;
      return { ok: false, msg: `On Pan ${v}, ${fmtNum(eq.A, 3)} mol/L of A is still left once it has settled.` };
    },
    reward: {
      log: 'Pan 2 went nearly to completion.',
      title: 'Large K',
      body: `Pan 2 settled with almost no A left; its K is ${fmtNum(K_BIG[BIG_PICK - 1], 2)}. A K far above 1 means the reaction goes nearly to completion, with almost no reactant left. This is a large K.`
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-small',
    title: 'Hardly Started',
    prompt: 'Set the dial to the pan that will have made the least B once it has settled.',
    widget,
    table: pansTable({
      fixtures: [
        vesselFixture('pans', PANS_AT, { system: 'ab', pans: levelPans(K_SMALL), lw: 12, legend: false, showK: true }),
        selectorFixture('pick', 'Makes the least B', { x: 62, y: 55 }, { options: ['Pan 1', 'Pan 2', 'Pan 3', 'Pan 4', ' '], start: 5, w: 60 })
      ]
    }, { h: 66 }),
    hints: [
      'Use the answer dial, and the "Settle" key if you want to check.',
      'Compare the K printed on each pan.',
      'Think back to the pan that went nearly all the way, and the K it had.'
    ],
    check(state) {
      const v = dialValue(state.table, 'pick');
      if (v === 5) return { ok: false, notYet: true, msg: 'Set the dial.' };
      if (v === SMALL_PICK) return { ok: true };
      const eq = vslRead(state.table, 'pans').pans[v - 1].eq;
      return { ok: false, msg: `On Pan ${v}, ${fmtNum(eq.B, 3)} mol/L of B forms from the 1.00 mol/L of A once it has settled.` };
    },
    reward: {
      log: 'Pan 3 barely started.',
      title: 'Small K',
      body: `Pan 3, with K = ${fmtNum(K_SMALL[SMALL_PICK - 1], 2)}, settled with almost no B. A K far below 1 means the reaction barely starts, with almost no product formed. This is a small K.`
    }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const eqs = [0, 1, 2].map(sealedEq);
    const Ks = [0, 1, 2].map(i => K_SYSTEMS[SEALED[i].system].K);
    const sl = [0, 1, 2].map(i => kSlips(K_SYSTEMS[SEALED[i].system], eqs[i]));
    // Three right cards and two slips (the figure with no powers for pans 2 and 3).
    const cards = [
      ['k-a', Ks[0]], ['k-b', Ks[1]], ['k-c', Ks[2]], ['k-x', sl[1].noPower], ['k-y', sl[2].noPower]
    ];
    return {
      id: 's8-sealed',
      title: 'Three Sealed Pans',
      prompt: 'Lay on each pan the card with the K that belongs to it.',
      widget,
      table: pansTable({
        pieces: cards.map(([id, v], i) => tag(id, `K = ${fmtNum(v, 2)}`, { x: 136.5, y: 8 + i * 13 }, { props: { value: v } })),
        fixtures: [vesselFixture('pans', PANS_AT, { system: 'ab', pans: SEALED.map(s => ({ system: s.system, start: s.start })), settled: true, showEq: true, lw: 10, legend: false })],
        zones: {
          slots: [0, 1, 2].map(i => ({ id: `s${i + 1}`, label: `K of Pan ${i + 1}`, at: { x: 10 + (118 - 10 - 1.5) / 3 * (i + 0.5), y: 52 }, size: { w: 27, h: 12 } }))
        }
      }, { h: 70 }),
      hints: [
        'Use the cards and the slots under the pans.',
        'Compare each card with what the bars of one pan give for the reaction printed on it.',
        'For each pan, work out the ratio for its own equation from its bars, and match the card.'
      ],
      check(state) {
        const t = state.table;
        const got = [1, 2, 3].map(i => pieceIn(t, `s${i}`));
        if (got.some(c => !c)) return { ok: false, notYet: true, msg: 'Lay a card on each pan.' };
        for (let i = 0; i < 3; i++) {
          const v = got[i].props.value;
          if (Math.abs(v - Ks[i]) / Ks[i] <= 0.015) continue;
          const sys = K_SYSTEMS[SEALED[i].system];
          const bars = Object.keys(sys.species).map(s => `${s === 'A' || s === 'B' || s === 'C' ? s : s} ${fmtNum(eqs[i][s], 3)}`).join(', ');
          if (Math.abs(v - sl[i].noPower) / sl[i].noPower <= 0.015) return { ok: false, msg: `Pan ${i + 1} (${bars}): that figure counts every substance once, and the equation on this pan does not.` };
          if (Math.abs(v - sl[i].inverted) / sl[i].inverted <= 0.015) return { ok: false, msg: `Pan ${i + 1} (${bars}): that figure is the ratio the other way up.` };
          return { ok: false, msg: `Pan ${i + 1} has ${bars}, and its ratio does not come to that figure.` };
        }
        return { ok: true };
      },
      reward: {
        log: 'Each K matched its pan.',
        title: 'Reading K Anywhere',
        body: 'Whatever the reaction, K is products over reactants at equilibrium, each amount raised to its coefficient and the solids left out. A card that ignored the coefficients matched no pan.'
      }
    };
  })()
];

/** The quest's closing card, shown only where a quest has no story animation yet. */
export const DEBRIEF = {
  title: 'The Number That Holds',
  body: 'From any start, a pan settles at amounts whose ratio, products over reactants, is the same number. That number is K.'
};

/** Every settled-pan stage presses "Settle" on its own pans. */
const settle = [{ run: 'pans' }];
const slotT = i => `slot:rig.t${i}`;
const slotB = i => `slot:rig.b${i}`;

export const SOLUTIONS = [
  [put('same', 'slot:guess')],
  [...settle, put('t-B1', slotT(1)), put('t-A1', slotB(1))],
  [...settle, put('t-HI2', slotT(1)), put('t-H21', slotB(1)), put('t-I21', slotB(2))],
  [...settle, put('t-CO21', slotT(1))],
  [{ type: { entry: 'k', value: '6.7' } }],
  [dial('pick', 'value', BIG_PICK)],
  [dial('pick', 'value', SMALL_PICK)],
  [put('k-a', 'slot:s1'), put('k-b', 'slot:s2'), put('k-c', 'slot:s3')]
];

export const MISSES = [
  [],
  [...settle, put('t-A1', slotT(1))],
  [...settle, put('t-HI1', slotT(1)), put('t-H21', slotB(1)), put('t-I21', slotB(2))],
  [...settle, put('t-CaO1', slotT(1)), put('t-CO21', slotT(2)), put('t-CaCO31', slotB(1))],
  [{ type: { entry: 'k', value: '1.3' } }],
  [dial('pick', 'value', 4)],
  [dial('pick', 'value', 1)],
  [put('k-a', 'slot:s1'), put('k-x', 'slot:s2'), put('k-c', 'slot:s3')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { AB_PANS, HI_PANS, CA_PANS, NO_PAN, K_BIG, K_SMALL, BIG_PICK, SMALL_PICK, SEALED };
