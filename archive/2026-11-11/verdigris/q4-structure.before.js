/**
 * Unit 9 · Bench 4 — Acid Strength and Structure (q4-structure)
 *
 * Verdigris's structure bench, on the ph kit: the PROTON RACE (`table/kits/ph-race.js`) and acid cards that print structure facts only,
 * never a pKa. An acid card goes in the first place, another card in the second (it stands for the base that acid leaves); 100 protons
 * start on the acid and "Race" shows how many end on the base (`phdata.js` `raceCount`). Ranking is dragging the cards into order on the
 * rail. ONE click: "fluorine is the most electronegative, so HF is the strongest of the hydrogen halides".
 *
 *   1  PREDICT: rank HF, HCl and HBr (no instrument)
 *   2  TEST: race the three; bond length and energy are printed                         -> conjugate base
 *   3  CH4, NH3, H2O, HF: the atom that holds the hydrogen, with its electronegativity
 *   4  HClO to HClO4: extra oxygen atoms                                                -> inductive effect
 *   5  ethanol, acetic acid, formic acid                                                 (resonance, from Ligar)
 *   6  acetic acid and its chlorinated forms
 *   7  rank four bases against one acid                                                  (strong acid, weak base)
 *   8  sealed: five unlabelled acids
 *
 * The race prints no pKa; every count is the planner's. This quest pays no XP and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { phTable, raceParts, acidCard, raceRead, nameAcid, nameBase } from '../../table/kits/ph.js';
import { RACE, raceCount, raceOrder } from '../../engine/phdata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bconjugate bases?\b/i, introducedAt: 2 },
  { term: /\binductive effect\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit03/q5-resonance', 'unit03/q7-polarity', 'unit09/q3-weak'];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit09/q4-structure';
const GUESS = { hf: 'HF strongest', hcl: 'HCl strongest', hbr: 'HBr strongest' };
const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);

const RF = 'race';
const RAIL_AT = { x: 85, y: 91 };
const RAIL_SIZE = { w: 150, h: 14 };
const STRONG = 'Strongest acid';
const WEAK = 'Weakest acid';

/** The cards of each stage: [acid id, structure facts]. Facts are structure only. */
const S2 = [['hf', ['bond 92 pm', '565 kJ/mol']], ['hcl', ['bond 127 pm', '431 kJ/mol']], ['hbr', ['bond 141 pm', '366 kJ/mol']]];
const S3 = [['ch4', ['on carbon', 'electroneg. 2.55']], ['nh3', ['on nitrogen', 'electroneg. 3.04']], ['h2o', ['on oxygen', 'electroneg. 3.44']], ['hf', ['on fluorine', 'electroneg. 3.98']]];
const S4 = [['hclo', ['H–O–Cl', '0 extra O']], ['hclo2', ['H–O–Cl', '1 extra O']], ['hclo3', ['H–O–Cl', '2 extra O']], ['hclo4', ['H–O–Cl', '3 extra O']]];
const S5 = [['ethanol', ['CH₃CH₂–OH', 'no C=O']], ['acetic', ['CH₃C(=O)–OH', 'has C=O']], ['formic', ['HC(=O)–OH', 'has C=O']]];
const S6 = [['acetic', ['Cl on carbon', '0']], ['cl1', ['Cl on carbon', '1']], ['cl2', ['Cl on carbon', '2']], ['cl3', ['Cl on carbon', '3']]];
const S7 = [['hcl', 'left by HCl'], ['hf', 'left by HF'], ['hclo', 'left by HClO'], ['h2o', 'left by H₂O']];
const S8 = [
  { id: 'x1', label: 'A', acid: 'acetic', rows: ['CH₃C(=O)–OH'] },
  { id: 'x2', label: 'B', acid: 'nh3', rows: ['H–NH₂', 'electroneg. 3.04'] },
  { id: 'x3', label: 'C', acid: 'hbr', rows: ['H–Br', 'bond 141 pm'] },
  { id: 'x4', label: 'D', acid: 'hclo3', rows: ['H–O–Cl', '2 extra O'] },
  { id: 'x5', label: 'E', acid: 'hclo', rows: ['H–O–Cl', '0 extra O'] }
];

/** The rank each stage wants: ids of cards, strongest acid first (lowest pKa). */
const WANT = {
  2: raceOrder(S2.map(c => c[0])), 3: raceOrder(S3.map(c => c[0])), 4: raceOrder(S4.map(c => c[0])), 5: raceOrder(S5.map(c => c[0])),
  6: raceOrder(S6.map(c => c[0])), 7: raceOrder(S7.map(c => c[0])),
  8: raceOrder(S8.map(c => c.acid)).map(a => S8.find(c => c.acid === a).id)
};
const acidOf = (t, id) => t.pieces[id].props.acid;

function raceTable(cards, start, first = STRONG, last = WEAK, extra = {}) {
  const race = raceParts(RF, { x: 85, y: 37 });
  return phTable({
    pieces: cards,
    fixtures: [race.fixture],
    zones: { slots: race.slots, rail: { at: RAIL_AT, size: RAIL_SIZE, first, last, items: cards.filter(c => !c.zone).map(c => c.id), start } },
    ...extra
  }, { w: 170, h: 104 });
}

const cardsOf = (list, at0 = 20) => list.map(([id, rows], i) => acidCard(id, id, { x: at0 + i * 25, y: 91 }, { rows }));

/** What the race log holds for a pair of cards (either way round), or null. */
function loggedPair(t, a, b) {
  const st = { fixtures: t.fixtures, pieces: t.pieces, recorder: t.recorder };
  return raceRead(st, RF).log.find(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)) || null;
}

/** The refusal for a wrong rank: the first neighbours the wrong way round, with the race that compared them (or the lack of one). */
function rankMiss(t, order, rank) {
  const k = order.findIndex((id, i) => i > 0 && rank(order[i - 1]) > rank(id));
  const a = t.pieces[order[k - 1]]; const b = t.pieces[order[k]];
  const sits = `${a.label} sits left of ${b.label}.`;
  if (t.pieces[order[0]].props.face === 'base') {
    const ref = Object.values(t.pieces).find(p => p.id === 'ref');
    const says = c => { const l = raceRead({ fixtures: t.fixtures, pieces: t.pieces, recorder: t.recorder }, RF).log.find(x => x.a === ref.id && x.b === c.id); return l ? `${nameAcid(ref)} with ${c.label}: ${l.n} of 100 protons ended on the base` : null; };
    const sa = says(a); const sb = says(b);
    if (sa && sb) return { ok: false, msg: `${sits} Races: ${sa}; ${sb}.` };
    return { ok: false, msg: `${sits} No race has been run for ${sa ? b.label : a.label} yet.` };
  }
  const l = loggedPair(t, a.id, b.id);
  if (!l) return { ok: false, msg: `${sits} No race has put the two against each other yet.` };
  const x = t.pieces[l.a]; const y = t.pieces[l.b];
  return { ok: false, msg: `${sits} In the race of ${nameAcid(x)} with ${nameBase(y)}, ${l.n} of 100 protons ended on the base.` };
}

function rankCheck(stage) {
  const want = WANT[stage];
  const rank = stage === 8 ? (() => { const m = Object.fromEntries(want.map((id, i) => [id, i])); return id => m[id]; })() : null;
  return state => {
    const t = state.table;
    const order = t.zones.rail.order;
    if (order.length < want.length) return { ok: false, notYet: true, msg: `Put all ${want.length} cards on the rail.` };
    if (order.join() === want.join()) return { ok: true };
    return rankMiss(t, order, rank || (id => RACE[acidOf(t, id)].pKa));
  };
}

const RACE_HINT1 = 'Put an acid card in the first place and another card in the second, press "Race", then drag the cards back to the rail.';

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Which Is Strongest?',
    predict: true,
    prompt: 'Rank hydrogen fluoride, hydrogen chloride and hydrogen bromide from the strongest acid to the weakest.',
    widget,
    table: phTable({
      pieces: [['hf', 'HF'], ['hcl', 'HCl'], ['hbr', 'HBr']].map(([id], i) => acidCard(id, id, { x: 40 + i * 45, y: 14 })),
      zones: { rail: { at: { x: 85, y: 46 }, size: { w: 130, h: 14 }, first: STRONG, last: WEAK, items: [], start: [] } }
    }, { w: 170, h: 66 }),
    hints: [
      'Drag each card onto the rail and arrange them from left to right.',
      'Think about what it means for an acid to let go of its proton, and which atom holds on harder.',
      'Ask what would make the atom left behind keep the extra charge better.'
    ],
    check(state) {
      if (state.table.zones.rail.order.length < 3) return { ok: false, notYet: true, msg: 'Put all 3 cards on the rail.' };
      return { ok: true };
    },
    onClear(state) {
      const first = state.table.zones.rail.order[0];
      if (first) remember(QUEST_KEY, first);
    },
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Your ranking is locked in. Next, the three acids are raced against each other to test it.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-halides',
    title: 'Racing the Halides',
    get prompt() { return guessLine('Race the three acids and rank them from strongest to weakest.', recall(QUEST_KEY)); },
    widget,
    table: raceTable(cardsOf(S2), ['hcl', 'hf', 'hbr']),
    hints: [
      RACE_HINT1,
      'Compare how many of the 100 protons ended on the base in each race you ran.',
      'Each race compares two acids, so run neighbouring pairs until every pair on the rail has been compared.'
    ],
    check: rankCheck(2),
    get reward() {
      const g = recall(QUEST_KEY);
      const verdict = g === 'hf' ? 'You put HF first; it came last. ' : g === 'hbr' ? 'You put HBr first, and it was the strongest. ' : g === 'hcl' ? 'You put HCl first; HBr beat it. ' : '';
      return {
        log: 'HBr gave up protons most readily, then HCl, then HF.',
        title: 'Down the Group',
        body: `${verdict}HF has the shortest, strongest bond to hydrogen and was the weakest of the three. When an acid gives up its proton, the base left behind is its conjugate base, and the larger bromide holds the charge best.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-period',
    title: 'Across a Row',
    prompt: 'Rank methane, ammonia, water and hydrogen fluoride from strongest acid to weakest.',
    widget,
    table: raceTable(cardsOf(S3, 20), ['nh3', 'hf', 'ch4', 'h2o']),
    hints: [
      RACE_HINT1,
      'Compare the races with the electronegativity printed on each card.',
      'Race neighbouring pairs and rank the cards by which side of each race kept the protons.'
    ],
    check: rankCheck(3),
    reward: {
      log: 'Across a row, the more electronegative atom made the stronger acid.',
      title: 'Across a Period',
      body: 'From CH₄ to HF the atom holding the hydrogen is more electronegative each time, and the acid is stronger each time. A more electronegative atom holds the charge of the conjugate base better.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-oxygens',
    title: 'Extra Oxygens',
    prompt: 'Rank the four chlorine acids from strongest to weakest.',
    widget,
    table: raceTable(cardsOf(S4, 20), ['hclo3', 'hclo', 'hclo4', 'hclo2']),
    hints: [
      RACE_HINT1,
      'Compare the races with the number of extra oxygen atoms printed on each card.',
      'Race neighbouring pairs and order the cards by which side of each race kept the protons.'
    ],
    check: rankCheck(4),
    reward: {
      log: 'Each extra oxygen made a stronger acid.',
      title: 'The Inductive Effect',
      body: 'Every extra oxygen on the chlorine pulls charge toward itself through the bonds, so the conjugate base holds its charge better and the acid is stronger. That pull is the inductive effect.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-resonance',
    title: 'Sharing the Charge',
    prompt: 'Rank ethanol, acetic acid and formic acid from strongest to weakest.',
    widget,
    table: raceTable(cardsOf(S5, 30), ['acetic', 'ethanol', 'formic']),
    hints: [
      RACE_HINT1,
      'Compare the races with whether each card has a C=O beside its O–H.',
      'Race neighbouring pairs and order the cards by which side of each race kept the protons.'
    ],
    check: rankCheck(5),
    reward: {
      log: 'Both carboxylic acids beat ethanol.',
      title: 'Resonance',
      body: 'When acetic acid or formic acid gives up its proton, the charge of the conjugate base is shared over two oxygens by resonance. Ethoxide keeps it on one oxygen, so ethanol is by far the weakest.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-chlorine',
    title: 'Chlorine Nearby',
    prompt: 'Rank acetic acid and its three chlorinated forms from strongest to weakest.',
    widget,
    table: raceTable(cardsOf(S6, 20), ['cl1', 'acetic', 'cl3', 'cl2']),
    hints: [
      RACE_HINT1,
      'Compare the races with the number of chlorine atoms printed on each card.',
      'Race neighbouring pairs and order the cards by which side of each race kept the protons.'
    ],
    check: rankCheck(6),
    reward: {
      log: 'The more chlorine near the acid group, the stronger the acid.',
      title: 'Chlorine Nearby',
      body: 'Chlorine pulls charge toward itself, the inductive effect again, and the closer and more numerous the chlorines, the better the conjugate base holds its charge. Trichloroacetic acid beat acetic acid by a wide margin.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const ref = acidCard('ref', 'acetic', { x: 0, y: 0 }, { rows: ['CH₃C(=O)–OH'] });
    ref.zone = `slot:${RF}.a`;
    const bases = S7.map(([id, row], i) => acidCard(id, id, { x: 20 + i * 25, y: 91 }, { face: 'base', rows: [row] }));
    return {
      id: 's7-bases',
      title: 'Bases from Acids',
      prompt: 'Rank these four bases from the one that takes the fewest protons from acetic acid to the one that takes the most.',
      widget,
      table: raceTable([ref, ...bases], ['h2o', 'hcl', 'hclo', 'hf'], 'Takes the fewest', 'Takes the most'),
      hints: [
        'Put a base card in the second place, press "Race", then drag it back to the rail.',
        'Compare how many of the 100 protons each base took from the same acid.',
        'Race each base against acetic acid in turn and order the cards by the counts.'
      ],
      check: rankCheck(7),
      get reward() {
        const lo = raceCount('acetic', 'hcl'); const hi = raceCount('acetic', 'h2o');
        return {
          log: 'The stronger the acid, the weaker the base it leaves.',
          title: 'Strong Acid, Weak Base',
          body: `Cl⁻, left by the strongest acid, took ${lo} of 100 protons from acetic acid, and OH⁻, left by the weakest, took ${hi}. The stronger an acid, the weaker its conjugate base.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Five Unlabelled Acids',
    prompt: 'Rank the five unlabelled acids from strongest to weakest.',
    widget,
    table: raceTable(S8.map((c, i) => acidCard(c.id, c.acid, { x: 15 + i * 25, y: 91 }, { rows: c.rows, label: c.label, anon: true })), ['x1', 'x2', 'x3', 'x4', 'x5']),
    hints: [
      RACE_HINT1,
      'Compare the races with the structure printed on each card.',
      'Race neighbouring pairs and order the cards by which side of each race kept the protons.'
    ],
    check: rankCheck(8),
    reward: {
      log: 'Bond size, electronegativity, extra oxygen and resonance each changed how strong the acid is.',
      title: 'What Sets Strength',
      body: 'An acid is strong when its conjugate base holds the charge well: by a larger atom, a more electronegative atom, electron-pulling neighbours or resonance. Each factor you raced works through the conjugate base.'
    }
  }
];

export const DEBRIEF = {
  title: 'Acid Strength and Structure',
  body: 'An acid is as strong as its conjugate base is stable. Atom size, electronegativity, extra oxygen and resonance all help the base hold its charge.'
};

const put = (piece, to) => ({ place: { piece, to } });
const rail = order => order.map((id, i) => put(id, `rail:${i}`));
const A = `slot:${RF}.a`; const B = `slot:${RF}.b`;
const races = pairs => pairs.flatMap(([a, b]) => [put(a, A), put(b, B), { run: RF }, put(a, 'rail:0'), put(b, 'rail:0')]);
const neighbours = ids => ids.slice(1).map((id, i) => [ids[i], id]);
const baseRaces = ids => ids.flatMap(b => [put(b, B), { run: RF }, put(b, 'rail:0')]);

export const SOLUTIONS = [
  rail(['hf', 'hcl', 'hbr']),
  [...races(neighbours(WANT[2])), ...rail(WANT[2])],
  [...races(neighbours(WANT[3])), ...rail(WANT[3])],
  [...races(neighbours(WANT[4])), ...rail(WANT[4])],
  [...races(neighbours(WANT[5])), ...rail(WANT[5])],
  [...races(neighbours(WANT[6])), ...rail(WANT[6])],
  [...baseRaces(WANT[7]), ...rail(WANT[7])],
  [...races(neighbours(WANT[8])), ...rail(WANT[8])]
];

export const MISSES = [
  [],
  [...races([['hf', 'hcl']]), ...rail(['hf', 'hcl', 'hbr'])],
  [...races([['hf', 'h2o']]), ...rail(['ch4', 'nh3', 'h2o', 'hf'])],
  [...races([['hclo', 'hclo2']]), ...rail(['hclo', 'hclo2', 'hclo3', 'hclo4'])],
  [...rail(['ethanol', 'acetic', 'formic'])],
  [...races([['acetic', 'cl1']]), ...rail(['acetic', 'cl1', 'cl2', 'cl3'])],
  [...baseRaces(['hcl']), ...rail(['hcl', 'hf', 'h2o', 'hclo'])],
  [...rail(['x1', 'x2', 'x3', 'x4', 'x5'])]
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

export const CHECKS = { WANT, S2, S3, S4, S5, S6, S7, S8, RF };
