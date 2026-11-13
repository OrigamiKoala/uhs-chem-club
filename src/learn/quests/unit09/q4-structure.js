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

export const meta = { stageCount: 7 };

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
const WEAK = 'Weakest acid';
const STRONG = 'Strongest acid';

/** The cards of each stage: [acid id, structure facts]. Facts are structure only. */
const S2 = [['hf', ['bond 92 pm', '565 kJ/mol']], ['hcl', ['bond 127 pm', '431 kJ/mol']], ['hbr', ['bond 141 pm', '366 kJ/mol']]];
const S3 = [['ch4', ['on carbon', 'electroneg. 2.55']], ['nh3', ['on nitrogen', 'electroneg. 3.04']], ['h2o', ['on oxygen', 'electroneg. 3.44']], ['hf', ['on fluorine', 'electroneg. 3.98']]];
const S4 = [['hclo', ['H–O–Cl', '0 extra O']], ['hclo2', ['H–O–Cl', '1 extra O']], ['hclo3', ['H–O–Cl', '2 extra O']], ['hclo4', ['H–O–Cl', '3 extra O']]];
const S5 = [['ethanol', ['CH₃CH₂–OH', 'no C=O']], ['acetic', ['CH₃C(=O)–OH', 'has C=O']], ['formic', ['HC(=O)–OH', 'has C=O']]];
const S6 = [['hcl', 'left by HCl'], ['hf', 'left by HF'], ['hclo', 'left by HClO'], ['h2o', 'left by H₂O']];
const S7 = [
  { id: 'x1', label: 'A', acid: 'acetic', rows: ['CH₃C(=O)–OH'] },
  { id: 'x2', label: 'B', acid: 'nh3', rows: ['H–NH₂', 'electroneg. 3.04'] },
  { id: 'x3', label: 'C', acid: 'hbr', rows: ['H–Br', 'bond 141 pm'] },
  { id: 'x4', label: 'D', acid: 'hclo3', rows: ['H–O–Cl', '2 extra O'] },
  { id: 'x5', label: 'E', acid: 'hclo', rows: ['H–O–Cl', '0 extra O'] }
];

/** The rank each stage wants: ids of cards, weakest acid first (stages 2-5, 7); weakest base first (stage 6). */
const WANT = {
  2: raceOrder(S2.map(c => c[0])).reverse(),
  3: raceOrder(S3.map(c => c[0])).reverse(),
  4: raceOrder(S4.map(c => c[0])).reverse(),
  5: raceOrder(S5.map(c => c[0])).reverse(),
  6: raceOrder(S6.map(c => c[0])),
  7: raceOrder(S7.map(c => c.acid)).reverse().map(a => S7.find(c => c.acid === a).id)
};
const acidOf = (t, id) => t.pieces[id].props.acid;

function raceTable(cards, start, first = WEAK, last = STRONG, extra = {}) {
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
  if (!t.fixtures?.[RF]) return null;
  const st = { fixtures: t.fixtures, pieces: t.pieces, recorder: t.recorder };
  return raceRead(st, RF).log.find(l => (l.a === a && l.b === b) || (l.a === b && l.b === a)) || null;
}

/** The refusal for a wrong rank: the first neighbours the wrong way round, with the race that compared them (or the lack of one). */
function rankMiss(t, order, rank) {
  const k = order.findIndex((id, i) => i > 0 && rank(order[i - 1]) > rank(id));
  const a = t.pieces[order[k - 1]]; const b = t.pieces[order[k]];
  const sits = `${a.label} sits left of ${b.label}.`;
  if (!t.fixtures?.[RF]) return { ok: false, msg: `${sits} Look again at the structure and charge drawing on each card.` };
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
  const rank = stage === 7 ? (() => { const m = Object.fromEntries(want.map((id, i) => [id, i])); return id => m[id]; })() : null;
  return state => {
    const t = state.table;
    const order = t.zones.rail.order;
    if (order.length < want.length) return { ok: false, notYet: true, msg: `Put all ${want.length} cards on the rail.` };
    if (order.join() === want.join()) return { ok: true };
    return rankMiss(t, order, rank || (id => -RACE[acidOf(t, id)].pKa));
  };
}

const RACE_HINT1 = 'Put an acid card in the first place and another card in the second, press "Race", then drag the cards back to the rail.';

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'Which Is Strongest?',
    predict: true,
    prompt: 'Which of HF, HCl and HBr is the weakest acid and which the strongest?',
    widget,
    table: phTable({
      pieces: [['hf', 'HF'], ['hcl', 'HCl'], ['hbr', 'HBr']].map(([id], i) => acidCard(id, id, { x: 40 + i * 45, y: 14 }, { conj: false })),
      zones: { rail: { at: { x: 85, y: 46 }, size: { w: 130, h: 14 }, first: WEAK, last: STRONG, items: [], start: [] } }
    }, { w: 170, h: 66 }),
    hints: [
      'Drag each card onto the rail and arrange them from weakest on the left to strongest on the right.',
      'Think about what it means for an acid to donate a proton, and which bond breaks more easily.',
      'Ask what would make the atom left behind keep the extra charge better.'
    ],
    check(state) {
      if (state.table.zones.rail.order.length < 3) return { ok: false, notYet: true, msg: 'Put all 3 cards on the rail.' };
      return { ok: true };
    },
    onClear(state) {
      const last = state.table.zones.rail.order.at(-1);
      if (last) remember(QUEST_KEY, last);
    },
    reward: { log: 'Prediction locked in.', title: 'Prediction', body: 'Your ranking is locked in. Next, the three acids are raced against each other to test it.' }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-halides',
    title: 'Racing the Halides',
    briefing: 'In a race two acids compete to donate their protons to a base; the stronger acid ends with fewer protons. Each card also draws the conjugate base left behind.',
    get prompt() { return guessLine('Which of the three acids is weakest and which strongest?', recall(QUEST_KEY)); },
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
      const verdict = g === 'hf' ? 'You put HF strongest; it came last. ' : g === 'hbr' ? 'You put HBr strongest, and it was. ' : g === 'hcl' ? 'You put HCl strongest; HBr beat it. ' : '';
      return {
        log: 'HBr gave up protons most readily, then HCl, then HF.',
        title: 'Down the Group',
        body: `${verdict}HF is the weakest. Bromide is the largest ion and spreads its negative charge over the most space, so HBr donates its proton most easily. The base left behind is the conjugate base.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-period',
    title: 'Across a Row',
    briefing: 'Electronegativity measures how strongly an atom pulls on the electrons it shares.',
    prompt: 'Which of CH₄, NH₃, H₂O and HF is the weakest acid and which the strongest?',
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
    prompt: 'Which of the four chlorine acids is weakest and which strongest?',
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
    briefing: 'Sharing negative charge over two oxygens (resonance) spreads out the charge on the conjugate base.',
    prompt: 'Which of ethanol, acetic acid and formic acid is the weakest acid and which the strongest?',
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
      body: 'When acetic acid or formic acid donates its proton, the charge of the conjugate base is shared over two oxygens by resonance. Ethoxide keeps it on one oxygen, so ethanol is by far the weakest.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const ref = acidCard('ref', 'acetic', { x: 0, y: 0 }, { rows: ['CH₃C(=O)–OH'] });
    ref.zone = `slot:${RF}.a`;
    const bases = S6.map(([id, row], i) => acidCard(id, id, { x: 20 + i * 25, y: 91 }, { face: 'base', rows: [row] }));
    return {
      id: 's6-bases',
      title: 'Bases from Acids',
      prompt: 'Which base accepts the fewest protons from acetic acid and which the most?',
      widget,
      table: raceTable([ref, ...bases], ['h2o', 'hcl', 'hclo', 'hf'], 'Takes the fewest', 'Takes the most'),
      hints: [
        'Put a base card in the second place, press "Race", then drag it back to the rail.',
        'Compare how many of the 100 protons each base took from the same acid.',
        'Race each base against acetic acid in turn and order the cards by the counts.'
      ],
      check: rankCheck(6),
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

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-sealed',
    title: 'Five Unlabelled Acids',
    briefing: {
      speaker: 'Vess',
      body: 'Resonance across two oxygens stabilizes a conjugate base strongly, and an electronegative chlorine atom pulls charge away to stabilize it further. Without resonance or chlorine, an OH group holds its proton tightest.'
    },
    prompt: 'Order these five acids from weakest to strongest.',
    widget,
    table: phTable({
      pieces: S7.map((c, i) => acidCard(c.id, c.acid, { x: 25 + i * 30, y: 20 }, { rows: c.rows, label: c.label, anon: true })),
      zones: { rail: { at: { x: 85, y: 54 }, size: RAIL_SIZE, first: WEAK, last: STRONG, items: S7.map(c => c.id), start: ['x1', 'x2', 'x3', 'x4', 'x5'] } }
    }, { w: 170, h: 72 }),
    hints: [
      'Compare the structure facts and the shaded base drawing on each card.',
      'Look at the atom holding the hydrogen, any extra oxygens, and whether the charge spreads over two oxygens.',
      'Drag the five cards onto the rail with the weakest acid on the left and the strongest on the right.'
    ],
    check: rankCheck(7),
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
  [...baseRaces(WANT[6]), ...rail(WANT[6])],
  rail(WANT[7])
];

export const MISSES = [
  [],
  [...races([['hbr', 'hcl']]), ...rail(['hbr', 'hcl', 'hf'])],
  [...races([['hf', 'h2o']]), ...rail(['hf', 'h2o', 'nh3', 'ch4'])],
  [...races([['hclo4', 'hclo3']]), ...rail(['hclo4', 'hclo3', 'hclo2', 'hclo'])],
  rail(['formic', 'acetic', 'ethanol']),
  [...baseRaces(['h2o']), ...rail(['h2o', 'hcl', 'hf', 'hclo'])],
  rail(['x1', 'x2', 'x3', 'x4', 'x5'])
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

export const CHECKS = { WANT, S2, S3, S4, S5, S6, S7, RF };
