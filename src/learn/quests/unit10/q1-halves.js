/**
 * Unit 10 · Bench 1 — Half-Reactions (q1-halves)
 *
 * Brinewire's first bench, on the cell kit (`table/kits/cell.js`: the redox beaker and number probe in `cell-redox.js`, the half-reaction
 * ledger and electron tally in `cell-ledger.js`). Eight stages and ONE click: the belief that the electrons a metal loses vanish into the
 * water or float free in it. The ledger shows the other picture: the copper ions take exactly as many electrons as the zinc gave.
 *
 *   1  sort four cards by whether the number probe reads the same number in the Before and After windows   -> oxidation number
 *   2  PREDICT: each zinc atom loses two electrons; where do they end up?
 *   3  write the zinc half and the copper half so each one's charge balances                               -> half-reaction, oxidation, reduction, redox
 *   4  scale the aluminium half and the copper half until the electrons given equal the electrons taken
 *   5  (beyond the exam) lay the species that gives up electrons in each of two beakers                    -> reducing agent, oxidizing agent
 *   6  balance the permanganate half in acid with hydrogen ions, water and electrons
 *   7  join the permanganate half and the iron(II) half so no electrons are left over
 *   8  sealed: sort four reactions into redox and not redox with the probe
 *
 * THE WRONG MODEL IS ON THE TABLE. The zinc half leaves charge 2+ on its right until two electrons stand there, and the copper half needs
 * the same two on its left: a number that must match cannot have vanished.
 *
 * Every figure is `engine/celldata.js` and `engine/celldata-q1.js`: the numbers the probe prints, the counts in the ledger rows, the tally.
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { cellTable, note, pieceIn, plaqueFixture } from '../../table/kits/cell.js';
import { probeFixture, probeCard, beakerFixture } from '../../table/kits/cell-redox.js';
import { ledgerFixture, tallyFixture, halfOf } from '../../table/kits/cell-ledger.js';
import {
  CARDS, SORT, WINDOWS, HALF, bare, cardReading, cardChanged, reactionStates, isRedox, movers, oxText, firstOff, matchedHalves, overall, equationText
} from '../../engine/celldata-q1.js';
import { oxNumber } from '../../engine/celldata.js';

import { attachScenes } from '../../table/kits/cell-attach.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\boxidation numbers?\b/i, introducedAt: 1 },
  { term: /\bhalf-reactions?\b/i, introducedAt: 3 },
  { term: /\boxidation\b(?! numbers?)/i, introducedAt: 3 },
  { term: /\breduction\b/i, introducedAt: 3 },
  { term: /\bredox\b/i, introducedAt: 3 },
  { term: /\boxidi[sz]ing agents?\b/i, introducedAt: 5 },
  { term: /\breducing agents?\b/i, introducedAt: 5 }
];

/** Built quests whose words this bench uses: none. */
export const BUILDS_ON = [];

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit10/q1-halves';
const GUESS = {
  free: 'Free in the water',
  gone: 'Gone, they disappear',
  same: 'On the copper ions, exactly as many',
  fewer: 'On the copper ions, fewer'
};

const guessLine = (sentence, g) => (g && GUESS[g] ? `You predicted "${GUESS[g]}". ${sentence}` : sentence);
const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });

/* ---------------------------------------------------------------- what each stage puts on the table (inputs; every figure shown is the planner's) */

const S1_CARDS = ['zinc', 'copper', 'sulfur', 'oxygen'];
const S5_CARDS = ['cu', 'ag', 'mg', 'fe'];
const S5_SLOT = { s5a: 'cu', s5b: 'mg' };
const S8_CARDS = ['a', 'b', 'c', 'd'];
const SEAT = 'slot:probe.seat';
const FIRST = n => (n === 1 ? 'first' : 'second');

/** The four tags that stand for the ledger rows of stage 6. */
const S6_ROWS = ['Mn', 'O', 'H', 'charge'];

/* ---------------------------------------------------------------- stages */

const SPEAKER = 'Vess';

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-number',
    title: 'Before and After',
    briefing: { speaker: SPEAKER, body: 'An oxidation number is the charge an atom has, or would have if its shared electrons went to the atom that pulls them harder. An uncombined element is 0; a lone ion is its charge.' },
    prompt: 'Which particles change oxidation number when zinc meets copper(II) sulfate?',
    widget,
    // The answer is given to the particles: each of the four kinds in the beaker is tapped to read its oxidation number before and after
    // (a grey sphere), and tapped again to mark a change (amber). The marks are hidden dials of the model (`own`, below).
    table: cellTable({
      fixtures: [beakerFixture('beaker', { x: 57, y: 31 }, 'zncu', { title: 'Zinc in copper(II) sulfate' })]
    }, { w: 114, h: 60 }),
    hints: [
      'Tap a particle once to read its oxidation number before and after.',
      'Compare the two numbers of each particle you read.',
      'Tap a particle a second time to mark it when its two numbers are not equal.'
    ],
    check(state) {
      const f = state.table.fixtures.scene;
      const vals = S1_CARDS.map((c, i) => Math.round(f.dials[`m${i}`].value));
      if (vals.some(v => !v)) return { ok: false, notYet: true, msg: 'Tap every particle to read it.' };
      for (let i = 0; i < S1_CARDS.length; i++) {
        const c = S1_CARDS[i];
        if (vals[i] === (cardChanged(c) ? 2 : 1)) continue;
        const r = cardReading(c);
        return { ok: false, msg: `${CARDS[c].short} reads ${oxText(r.before)} before and ${oxText(r.after)} after.` };
      }
      return { ok: true };
    },
    get reward() {
      const z = cardReading('zinc'); const c = cardReading('copper'); const s = cardReading('sulfur'); const o = cardReading('oxygen');
      return {
        log: 'Zinc and copper changed their numbers; the sulfate did not.',
        title: 'Oxidation Number',
        body: `Zinc went from ${oxText(z.before)} to ${oxText(z.after)} and copper from ${oxText(c.before)} to ${oxText(c.after)}; sulfur stayed ${oxText(s.before)} and oxygen ${oxText(o.before)}. An oxidation number counts electrons lost (plus) or gained (minus).`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Where They Go',
    // A PREDICT STAGE: no beaker, no probe, no ledger. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'Where do the two electrons that each zinc atom loses end up?',
    widget,
    table: cellTable({
      pieces: [
        note('free', GUESS.free, { x: 30, y: 12 }),
        note('gone', GUESS.gone, { x: 80, y: 12 }),
        note('same', GUESS.same, { x: 30, y: 32 }),
        note('fewer', GUESS.fewer, { x: 80, y: 32 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 128, y: 22 }, size: { w: 36, h: 14 } }] }
    }, { w: 150, h: 48 }),
    hints: [
      'Use the four cards and the slot.',
      'Picture the zinc strip in the "Before" and "After" windows and ask what in the After window could hold electrons the strip lost.',
      'Ask whether the electrons can end up anywhere that is not a particle.'
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
      body: 'Next, the zinc half and the copper half are written out on two cards that count charge.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-halves',
    title: 'Writing the Halves',
    briefing: { speaker: SPEAKER, body: 'Losing electrons is oxidation, gaining electrons is reduction, and together they make a redox reaction. Each is written as a half-reaction that shows the electrons.' },
    get prompt() { return guessLine('How many electrons does each half-reaction need, and on which side?', recall(QUEST_KEY)); },
    widget,
    table: cellTable({
      fixtures: [
        ledgerFixture('hz', { x: 44, y: 24 }, {
          title: 'Zinc half', base: bare(HALF.zn()), rows: ['charge'], w: 70, hide: true,
          free: [{ dial: 'eL', kind: 'e', side: 'left', max: 4 }, { dial: 'eR', kind: 'e', side: 'right', max: 4 }]
        }),
        ledgerFixture('hc', { x: 128, y: 24 }, {
          title: 'Copper half', base: bare(HALF.cu()), rows: ['charge'], w: 70, hide: true,
          free: [{ dial: 'eL', kind: 'e', side: 'left', max: 4 }, { dial: 'eR', kind: 'e', side: 'right', max: 4 }]
        })
      ]
    }, { w: 172, h: 50 }),
    hints: [
      'Tap the rings beside each strip to put electrons on it, and watch the charge row.',
      'Compare the charge on the left and on the right of the arrow for the zinc card and for the copper card.',
      'An electron carries one unit of negative charge, so place electrons on the side that has too much positive charge to cancel it.'
    ],
    check(state) {
      const t = state.table;
      const hz = halfOf(t.fixtures.hz); const hc = halfOf(t.fixtures.hc);
      if (!hz.eLeft && !hz.eRight && !hc.eLeft && !hc.eRight) return { ok: false, notYet: true, msg: 'Set the electron dials.' };
      const cards = [['Zinc', hz, 'right', 'left'], ['Copper', hc, 'left', 'right']];
      for (const [name, h, good, bad] of cards) {
        const row = firstOff(h, ['charge']);
        if (row) return { ok: false, msg: `The ${name.toLowerCase()} half reads charge ${oxText(row.left)} on the left and ${oxText(row.right)} on the right.` };
        const e = { left: h.eLeft, right: h.eRight };
        if (e[bad]) return { ok: false, msg: `The ${name.toLowerCase()} half has ${e[bad]} electron${e[bad] === 1 ? '' : 's'} on its ${bad} side; its charge only balances because it also has ${e[good]} on its ${good}.` };
      }
      return { ok: true };
    },
    get reward() {
      const zn = HALF.zn(); const cu = HALF.cu();
      const g = recall(QUEST_KEY);
      const verdict = g === 'same' ? 'As you predicted, the' : g ? 'Not as you predicted, the' : 'The';
      return {
        log: 'The zinc half lost two electrons and the copper half gained two.',
        title: 'Half-Reactions',
        body: `${verdict} electrons landed on the copper ions: ${equationText(zn.left, zn.right, zn.eLeft, zn.eRight)} is oxidation and ${equationText(cu.left, cu.right, cu.eLeft, cu.eRight)} is reduction, together a redox reaction.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-scale',
    title: 'Matching the Electrons',
    prompt: 'How many aluminium atoms react with how many copper(II) ions?',
    widget,
    table: cellTable({
      fixtures: [
        ledgerFixture('ha', { x: 40, y: 22 }, { title: 'Aluminium half', base: HALF.al(), mult: 4, w: 70, hide: true }),
        ledgerFixture('hb', { x: 122, y: 22 }, { title: 'Copper half', base: HALF.cu(), mult: 4, w: 70, hide: true }),
        tallyFixture('tl', { x: 81, y: 56 }, ['ha', 'hb'])
      ]
    }, { w: 162, h: 72 }),
    hints: [
      'Tap the atoms or ions over each strip to change how many are written, and watch the tally.',
      'Compare the electrons lost with the electrons gained for each pair of settings.',
      'Scale each half-reaction until both halves handle the same number of electrons.'
    ],
    check(state) {
      const t = state.table;
      const a = halfOf(t.fixtures.ha); const b = halfOf(t.fixtures.hb);
      if (a.eRight === b.eLeft) return { ok: true };
      return { ok: false, msg: `Aluminium loses ${a.eRight} electrons and copper gains ${b.eLeft} in this setting.` };
    },
    get reward() {
      const al = HALF.al(); const cu = HALF.cu();
      const m = matchedHalves(al, cu);
      const o = overall(al, m.a, cu, m.b);
      return {
        log: 'Aluminium and copper balanced when each half was written enough times.',
        title: 'Matching Electrons',
        body: `Written ${m.a} and ${m.b} times, the halves lose and gain ${m.electrons} electrons each: ${equationText(o.left, o.right)}.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-agents',
    title: 'Who Loses',
    briefing: { speaker: SPEAKER, body: 'The particle that loses electrons makes the other one gain them, so it is called the reducing agent. The particle that gains them is the oxidizing agent.' },
    prompt: 'Which particle is the reducing agent in each beaker?',
    widget,
    // The answer is given to the particles: in each beaker, the metal or its ion is tapped (hidden dials `g1`, `g2` of the model: 1 metal, 2 ion).
    table: cellTable({
      fixtures: [
        beakerFixture('b1', { x: 57, y: 31 }, 'cuag', { title: 'Copper in silver nitrate' }),
        beakerFixture('b2', { x: 57, y: 91 }, 'mgfe', { title: 'Magnesium in iron(II) sulfate' })
      ]
    }, { w: 114, h: 122 }),
    hints: [
      'Tap the metal or the ion in each beaker.',
      'Compare the "Before" and "After" counts of each beaker\'s windows with what the model shows.',
      'The reducing agent is the particle that loses electrons to the other particle.'
    ],
    check(state) {
      const d = state.table.fixtures.scene.dials;
      const g = [Math.round(d.g1.value), Math.round(d.g2.value)];
      if (g.some(v => !v)) return { ok: false, notYet: true, msg: 'Tap a particle in each beaker.' };
      for (let n = 0; n < 2; n++) {
        if (g[n] === 1) continue;
        const id = n === 0 ? 'ag' : 'fe';
        const c = CARDS[id];
        const w = WINDOWS[n === 0 ? 'cuag' : 'mgfe'];
        const r = cardReading(id);
        return { ok: false, msg: `In the windows the ${c.short} ions became ${w.coat} atoms: their oxidation number went from ${oxText(r.before)} to ${oxText(r.after)}.` };
      }
      return { ok: true };
    },
    get reward() {
      return {
        log: 'The species whose oxidation number rose lost the electrons.',
        title: 'Reducing and Oxidizing Agents',
        body: 'Copper and magnesium lost electrons: they are the reducing agents. Silver and iron(II) ions gained them: the oxidizing agents.'
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-permanganate',
    title: 'Permanganate in Acid',
    briefing: { speaker: SPEAKER, body: 'In acid solution there is plenty of H⁺ and H₂O, and a half-reaction may use them to balance its oxygen, hydrogen, and charge.' },
    prompt: 'What balances the permanganate half-reaction in acid?',
    widget,
    table: cellTable({
      fixtures: [
        ledgerFixture('hm', { x: 48, y: 41 }, {
          title: 'Permanganate half', base: { left: { MnO4: 1 }, right: { 'Mn2+': 1 }, eLeft: 0, eRight: 0 }, rows: S6_ROWS, w: 82,
          free: [
            { dial: 'hL', kind: 'sp', species: 'H+', side: 'left', max: 10 },
            { dial: 'hR', kind: 'sp', species: 'H+', side: 'right', max: 10 },
            { dial: 'wL', kind: 'sp', species: 'H2O', side: 'left', max: 6 },
            { dial: 'wR', kind: 'sp', species: 'H2O', side: 'right', max: 6 },
            { dial: 'eL', kind: 'e', side: 'left', max: 6 },
            { dial: 'eR', kind: 'e', side: 'right', max: 6 }
          ]
        }),
        plaqueFixture('plate', 'The solution', { x: 118, y: 20 }, ['It is acidic.', 'H⁺ ions and H₂O are on hand.'], { w: 52 })
      ]
    }, { w: 150, h: 84 }),
    hints: [
      'Turn the dials for hydrogen ions, water and electrons on the left and the right of the arrow.',
      'Compare the left count with the right count in each row of the card, one row at a time.',
      'Settle the oxygen row with water, then the hydrogen row with hydrogen ions, then the charge row with electrons.'
    ],
    check(state) {
      const h = halfOf(state.table.fixtures.hm);
      const off = firstOff(h, S6_ROWS);
      if (!off) return { ok: true };
      const n = v => (off.label === 'charge' ? oxText(v) : String(v));
      return { ok: false, msg: `The ${off.label} row reads ${n(off.left)} on the left and ${n(off.right)} on the right.` };
    },
    get reward() {
      const h = HALF.mn();
      return {
        log: 'Water, hydrogen ions and electrons balanced the permanganate half-reaction.',
        title: 'Balancing in Acid',
        body: `${equationText(h.left, h.right, h.eLeft, h.eRight)}. In acid, oxygen is balanced with H₂O, hydrogen with H⁺, and charge with electrons.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-join',
    title: 'Joining Two Halves',
    prompt: 'How many iron(II) ions react with one permanganate ion?',
    widget,
    table: cellTable({
      fixtures: [
        ledgerFixture('hm', { x: 46, y: 22 }, { title: 'Permanganate half', base: HALF.mn(), mult: 3, w: 80, hide: true }),
        ledgerFixture('hf', { x: 140, y: 22 }, { title: 'Iron(II) half', base: HALF.fe(), mult: 6, w: 80, hide: true }),
        tallyFixture('tl', { x: 93, y: 56 }, ['hm', 'hf'])
      ]
    }, { w: 186, h: 72 }),
    hints: [
      'Tap the atoms or ions over each strip to change how many are written, and watch the tally.',
      'Compare how many electrons one copy of each half-reaction handles with the tally at each setting.',
      'Scale the halves until the electrons lost equal the electrons gained.'
    ],
    check(state) {
      const t = state.table;
      const m = halfOf(t.fixtures.hm); const f = halfOf(t.fixtures.hf);
      if (m.eLeft === f.eRight) return { ok: true };
      return { ok: false, msg: `The two halves gain ${m.eLeft} electrons and lose ${f.eRight} in this setting.` };
    },
    get reward() {
      const mn = HALF.mn(); const fe = HALF.fe();
      const m = matchedHalves(mn, fe);
      const o = overall(fe, m.b, mn, m.a);
      return {
        log: 'Five iron(II) ions matched one permanganate ion.',
        title: 'The Overall Equation',
        body: `With the electrons matched, the overall equation has none in it: ${equationText(o.left, o.right)}. The charge is ${o.charge.left} on each side.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Four Sealed Reactions',
    prompt: 'Which of the four reactions are redox?',
    widget,
    // Four sealed beakers side by side in the model; tapping one marks its reaction as redox (hidden dials `r0` to `r3`).
    table: cellTable({ fixtures: [] }, { w: 150, h: 6 }),
    hints: [
      'Tap each beaker whose reaction is redox.',
      'Watch what the particles do in each beaker.',
      'In these reactions, look for an atom that goes from a lone element to an ion, or back.'
    ],
    check(state) {
      const d = state.table.fixtures.scene.dials;
      const marks = S8_CARDS.map((c, i) => Math.round(d[`r${i}`].value) === 1);
      if (!marks.some(Boolean)) return { ok: false, notYet: true, msg: 'Tap the beakers whose reaction is redox.' };
      for (let i = 0; i < S8_CARDS.length; i++) {
        const c = S8_CARDS[i];
        const redox = isRedox(c);
        if (marks[i] === redox) continue;
        if (redox) {
          const m = movers(c)[0];
          return { ok: false, msg: `In ${SORT[c].label}, ${m.el} goes from ${oxText(m.before)} to ${oxText(m.after)}.` };
        }
        const r = reactionStates(c)[0];
        return { ok: false, msg: `In ${SORT[c].label} every element keeps the same number, ${r.el} at ${oxText(r.before)} among them.` };
      }
      return { ok: true };
    },
    get reward() {
      const rx = id => SORT[id].text;
      const mv = id => movers(id).map(m => m.el).join(' and ');
      return {
        log: 'Only the reactions whose oxidation numbers changed were redox.',
        title: 'Redox or Not',
        body: `Reactions A and C changed an oxidation number (${mv('a')} in A; ${mv('c')} in C); B and D changed none. A reaction is redox only when an oxidation number changes.`
      };
    }
  }
];

/** Every stage gets its mechanism view (3D at 3D On, flat otherwise); predict stages get a lead-in. */
attachScenes(STAGES, {
  compact: [], inside: [], demos: { 1: 'zn-in-cu' },
  own: {
    0: { sitesKey: 'q1marks', dials: Object.fromEntries(S1_CARDS.map((c, i) => [`m${i}`, { min: 0, max: 2, step: 1, value: 0, label: `Mark ${i + 1}` }])) },
    2: { sitesKey: 'ledger' }, 3: { sitesKey: 'ledger' }, 6: { sitesKey: 'ledger' },
    4: { sitesKey: 'q1gives', extra: { specName: 'two-displace' }, dials: { g1: { min: 0, max: 2, step: 1, value: 0, label: 'First beaker' }, g2: { min: 0, max: 2, step: 1, value: 0, label: 'Second beaker' } } },
    7: { sitesKey: 'q1redox', extra: { specName: 'four-reactions' }, dials: Object.fromEntries(S8_CARDS.map((c, i) => [`r${i}`, { min: 0, max: 1, step: 1, value: 0, label: `Reaction ${'ABCD'[i]}` }])) }
  }
});

export const DEBRIEF = {
  title: 'Half-Reactions',
  body: 'A redox reaction is two half-reactions joined by electrons: one half loses what the other gains, so the electrons lost equal the electrons gained. The oxidation numbers tell which atoms moved electrons.'
};

export const SOLUTIONS = [
  S1_CARDS.map((c, i) => dial('scene', `m${i}`, cardChanged(c) ? 2 : 1)),
  [put('same', 'slot:guess')],
  [dial('hz', 'eR', 2), dial('hc', 'eL', 2)],
  [dial('ha', 'k', matchedHalves(HALF.al(), HALF.cu()).a), dial('hb', 'k', matchedHalves(HALF.al(), HALF.cu()).b)],
  [dial('scene', 'g1', 1), dial('scene', 'g2', 1)],
  (() => {
    const h = HALF.mn();
    return [dial('hm', 'hL', h.left['H+']), dial('hm', 'wR', h.right.H2O), dial('hm', 'eL', h.eLeft)];
  })(),
  [dial('hf', 'k', matchedHalves(HALF.mn(), HALF.fe()).b)],
  S8_CARDS.map((c, i) => (isRedox(c) ? dial('scene', `r${i}`, 1) : null)).filter(Boolean)
];

export const MISSES = [
  S1_CARDS.map((c, i) => dial('scene', `m${i}`, c === 'sulfur' || cardChanged(c) ? 2 : 1)),
  [],
  [dial('hz', 'eR', 1), dial('hc', 'eL', 2)],
  [],
  [dial('scene', 'g1', 2), dial('scene', 'g2', 1)],
  [dial('hm', 'eL', 5)],
  [],
  [dial('scene', 'r1', 1)]
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

export const CHECKS = { S1_CARDS, S5_CARDS, S5_SLOT, S8_CARDS, S6_ROWS, GUESS };
