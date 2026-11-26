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
  free: 'They float free in the water',
  gone: 'They disappear',
  same: 'The copper ions take all of them',
  fewer: 'The copper ions take only some of them'
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
    briefing: { speaker: SPEAKER, body: 'An oxidation number tracks electrons lost (+) or gained (−). A neutral atom is 0, and a simple ion\'s number equals its charge (like +2 for Cu²⁺).' },
    prompt: 'Tap each particle (Zn, Cu²⁺, S, O) on the Model to check its oxidation number, then tap again to mark which ones change.',
    widget,
    // The answer is given to the particles: each of the four kinds in the beaker is tapped to read its oxidation number before and after
    // (a grey sphere), and tapped again to mark a change (amber). The marks are hidden dials of the model (`own`, below).
    table: cellTable({
      fixtures: [beakerFixture('beaker', { x: 57, y: 31 }, 'zncu', { title: 'Zinc in copper(II) sulfate' })]
    }, { w: 114, h: 60 }),
    hints: [
      'Tap each particle on the Model to show its before and after numbers.',
      'Compare each particle\'s before and after numbers on the Model to see which ones change.',
      'Mark a particle CHANGED (amber ring) only when its before and after numbers are different.'
    ],
    check(state) {
      const f = state.table.fixtures.scene;
      const vals = S1_CARDS.map((c, i) => Math.round(f.dials[`m${i}`].value));
      if (vals.some(v => !v)) return { ok: false, notYet: true, msg: 'Tap every particle on the Model to read it first.' };
      for (let i = 0; i < S1_CARDS.length; i++) {
        const c = S1_CARDS[i];
        const changed = cardChanged(c);
        if (vals[i] === (changed ? 2 : 1)) continue;
        const r = cardReading(c);
        return {
          ok: false,
          msg: changed
            ? `${CARDS[c].short} reads ${oxText(r.before)} before and ${oxText(r.after)} after, so it changed—tap it again to mark CHANGED.`
            : `${CARDS[c].short} reads ${oxText(r.before)} before and ${oxText(r.after)} after, so it did not change—tap it to clear the CHANGED mark.`
        };
      }
      return { ok: true };
    },
    get reward() {
      const z = cardReading('zinc'); const c = cardReading('copper'); const s = cardReading('sulfur'); const o = cardReading('oxygen');
      return {
        log: 'Zinc and copper changed their numbers; sulfate (S and O) did not.',
        title: 'Oxidation Number',
        body: `Zinc went from ${oxText(z.before)} to ${oxText(z.after)} and copper from ${oxText(c.before)} to ${oxText(c.after)}; in sulfate (SO₄²⁻), sulfur stayed ${oxText(s.before)} and oxygen ${oxText(o.before)}. An oxidation number counts electrons lost (+) or gained (−).`
      };
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Where They Go',
    // A PREDICT STAGE: no beaker, no probe, no ledger. The guess is made here and comes back with the test.
    predict: true,
    prompt: 'When each zinc atom loses two electrons, where do they go?',
    widget,
    table: cellTable({
      pieces: [
        note('free', GUESS.free, { x: 30, y: 12 }),
        note('gone', GUESS.gone, { x: 80, y: 12 }),
        note('same', GUESS.same, { x: 30, y: 32 }),
        note('fewer', GUESS.fewer, { x: 80, y: 32 })
      ],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 132, y: 22 }, size: { w: 46, h: 16 } }] }
    }, { w: 160, h: 48 }),
    hints: [
      'Drag one prediction card into the My prediction slot, then press Submit.',
      'Think about what else is in the beaker when zinc loses its electrons.',
      'Can free electrons float loose in water, or must another particle take them?'
    ],
    check(state) {
      const card = pieceIn(state.table, 'guess');
      if (!card) return { ok: false, notYet: true, msg: 'Drop a prediction card in the slot first.' };
      return { ok: true };
    },
    onClear(state) {
      const card = pieceIn(state.table, 'guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: {
      log: 'Prediction saved.',
      title: 'Prediction Saved',
      body: 'Prediction saved. Next, track the electrons on the zinc and copper cards.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 's3-halves',
    title: 'Writing the Halves',
    briefing: { speaker: SPEAKER, body: 'Losing electrons is oxidation, and gaining electrons is reduction. Each is written separately as a half-reaction showing the electrons.' },
    prompt: 'Tap the electron dots on the Model to balance the charge on both sides of each half-reaction card.',
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
      'Tap the amber electron dots labeled "in" or "out" on the Model and watch the charge row on each card.',
      'Compare the charge on the left and on the right of the arrow for the zinc card and for the copper card.',
      'Each electron carries a −1 charge, so add electrons to the more positive side until both sides match.'
    ],
    check(state) {
      const t = state.table;
      const hz = halfOf(t.fixtures.hz); const hc = halfOf(t.fixtures.hc);
      if (!hz.eLeft && !hz.eRight && !hc.eLeft && !hc.eRight) return { ok: false, notYet: true, msg: 'Tap the electron dots on the Model to add electrons.' };
      const cards = [['Zinc', hz, 'right', 'left'], ['Copper', hc, 'left', 'right']];
      for (const [name, h, good, bad] of cards) {
        const row = firstOff(h, ['charge']);
        if (row) return { ok: false, msg: `The ${name.toLowerCase()} half reads charge ${oxText(row.left)} on the left and ${oxText(row.right)} on the right.` };
        const e = { left: h.eLeft, right: h.eRight };
        if (e[bad]) return { ok: false, msg: `The ${name.toLowerCase()} half has ${e[bad]} electron${e[bad] === 1 ? '' : 's'} on its ${bad} side and ${e[good]} on its ${good} side; remove the extras.` };
      }
      return { ok: true };
    },
    get reward() {
      const zn = HALF.zn(); const cu = HALF.cu();
      const g = recall(QUEST_KEY);
      const verdict = g === 'same' ? 'As you predicted, the' : g ? 'Unlike your prediction, the' : 'The';
      return {
        log: 'The zinc half lost two electrons and the copper half gained two.',
        title: 'Half-Reactions',
        body: `${verdict} electrons went to the copper ions: ${equationText(zn.left, zn.right, zn.eLeft, zn.eRight)} (oxidation) and ${equationText(cu.left, cu.right, cu.eLeft, cu.eRight)} (reduction). Together they form a redox reaction.`
      };
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-scale',
    title: 'Matching the Electrons',
    prompt: 'Tap the atoms on the Model to scale each half-reaction until electrons given equal electrons taken.',
    widget,
    table: cellTable({
      fixtures: [
        ledgerFixture('ha', { x: 40, y: 22 }, { title: 'Aluminium half', base: HALF.al(), mult: 4, w: 70, hide: true }),
        ledgerFixture('hb', { x: 122, y: 22 }, { title: 'Copper half', base: HALF.cu(), mult: 4, w: 70, hide: true }),
        tallyFixture('tl', { x: 81, y: 56 }, ['ha', 'hb'])
      ]
    }, { w: 162, h: 72 }),
    hints: [
      'Tap the grey circles over each strip on the Model to scale each half-reaction and watch the Electron tally.',
      'Compare the electrons given (3 per Al) with the electrons taken (2 per Cu²⁺).',
      'Scale both halves until the Electron tally shows the same number given and taken.'
    ],
    check(state) {
      const t = state.table;
      const a = halfOf(t.fixtures.ha); const b = halfOf(t.fixtures.hb);
      if (a.eRight === b.eLeft) return { ok: true };
      return { ok: false, msg: `Aluminium loses ${a.eRight} electrons and copper gains ${b.eLeft}.` };
    },
    get reward() {
      const al = HALF.al(); const cu = HALF.cu();
      const m = matchedHalves(al, cu);
      const o = overall(al, m.a, cu, m.b);
      return {
        log: 'Aluminium and copper balanced when each half was scaled to match electrons.',
        title: 'Matching Electrons',
        body: `Scaling aluminium by ${m.a} and copper by ${m.b} matches ${m.electrons} electrons on both sides: ${equationText(o.left, o.right)}.`
      };
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-agents',
    title: 'Who Loses',
    briefing: { speaker: SPEAKER, body: 'The reducing agent gives electrons away, causing the other particle to be reduced. The oxidizing agent is the particle that takes those electrons.' },
    prompt: 'Tap the reducing agent in each beaker on the Model.',
    widget,
    // The answer is given to the particles: in each beaker, the metal or its ion is tapped (hidden dials `g1`, `g2` of the model: 1 metal, 2 ion).
    table: cellTable({
      fixtures: [
        beakerFixture('b1', { x: 57, y: 31 }, 'cuag', { title: 'Copper in silver nitrate' }),
        beakerFixture('b2', { x: 57, y: 91 }, 'mgfe', { title: 'Magnesium in iron(II) sulfate' })
      ]
    }, { w: 114, h: 122 }),
    hints: [
      'Tap the metal or the ion in each beaker on the Model.',
      'Compare each particle\'s Before and After oxidation numbers on the Model.',
      'The reducing agent is the particle that loses electrons to the other particle.'
    ],
    check(state) {
      const d = state.table.fixtures.scene.dials;
      const g = [Math.round(d.g1.value), Math.round(d.g2.value)];
      if (g.some(v => !v)) return { ok: false, notYet: true, msg: 'Tap a particle in each beaker on the Model.' };
      for (let n = 0; n < 2; n++) {
        if (g[n] === 1) continue;
        const id = n === 0 ? 'ag' : 'fe';
        const c = CARDS[id];
        const w = WINDOWS[n === 0 ? 'cuag' : 'mgfe'];
        const r = cardReading(id);
        return { ok: false, msg: `${c.short} ions became ${w.coat} atoms (${oxText(r.before)} to ${oxText(r.after)}), so they gained electrons. Pick the particle that lost electrons.` };
      }
      return { ok: true };
    },
    get reward() {
      return {
        log: 'The particle whose oxidation number rose lost the electrons.',
        title: 'Reducing and Oxidizing Agents',
        body: 'Copper and magnesium lost electrons, so they are the reducing agents. Silver and iron(II) ions gained those electrons, so they are the oxidizing agents.'
      };
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-permanganate',
    title: 'Permanganate in Acid',
    briefing: { speaker: SPEAKER, body: 'In acid, plenty of H⁺ and H₂O are available. Use the dials to add H⁺, H₂O, and electrons to either side until every row balances.' },
    prompt: 'Balance Mn, O, H, and charge for the permanganate half-reaction in acid.',
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
        plaqueFixture('plate', 'The solution', { x: 118, y: 20 }, ['Acidic solution.', 'H⁺ ions and H₂O are available.'], { w: 52 })
      ]
    }, { w: 150, h: 84 }),
    hints: [
      'Turn the dials for hydrogen ions, water and electrons on the left and the right of the arrow.',
      'Compare the left count with the right count in each row of the card, one row at a time.',
      'Balance oxygen with H₂O first, then hydrogen with H⁺, then charge with electrons.'
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
        body: `${equationText(h.left, h.right, h.eLeft, h.eRight)}. In acid, balance oxygen with H₂O, hydrogen with H⁺, and charge with electrons.`
      };
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-join',
    title: 'Joining Two Halves',
    prompt: 'Tap the ions on the Model to scale the iron(II) half until electrons lost equal electrons gained.',
    widget,
    table: cellTable({
      fixtures: [
        ledgerFixture('hm', { x: 46, y: 22 }, { title: 'Permanganate half', base: HALF.mn(), mult: 3, w: 80, hide: true }),
        ledgerFixture('hf', { x: 140, y: 22 }, { title: 'Iron(II) half', base: HALF.fe(), mult: 6, w: 80, hide: true }),
        tallyFixture('tl', { x: 93, y: 56 }, ['hm', 'hf'])
      ]
    }, { w: 186, h: 72 }),
    hints: [
      'Look at the Electron tally and the number of electrons on each half-reaction card.',
      'Compare the electrons needed by one permanganate ion with the electrons given by iron(II).',
      'Scale the iron(II) half until electrons lost equal electrons gained.'
    ],
    check(state) {
      const t = state.table;
      const m = halfOf(t.fixtures.hm); const f = halfOf(t.fixtures.hf);
      if (m.eLeft === f.eRight) return { ok: true };
      return { ok: false, msg: `The two halves gain ${m.eLeft} electrons and lose ${f.eRight}.` };
    },
    get reward() {
      const mn = HALF.mn(); const fe = HALF.fe();
      const m = matchedHalves(mn, fe);
      const o = overall(fe, m.b, mn, m.a);
      return {
        log: 'Five iron(II) ions matched one permanganate ion.',
        title: 'The Overall Equation',
        body: `${m.electrons} e⁻ on each side cancel out: ${equationText(o.left, o.right)}. Both sides have total charge +${o.charge.left}.`
      };
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-sealed',
    title: 'Four Sealed Reactions',
    prompt: 'Check the four equations, then tap the letters (A–D) on the Model for the reactions that are redox.',
    widget,
    // Four sealed beakers side by side in the model; tapping one marks its reaction as redox (hidden dials `r0` to `r3`).
    table: cellTable({
      fixtures: [
        plaqueFixture('eqs', 'The four reactions', { x: 75, y: 15 }, [
          'A: Zn + CuSO₄ → ZnSO₄ + Cu',
          'B: AgNO₃ + NaCl → AgCl + NaNO₃',
          'C: Mg + 2 HCl → MgCl₂ + H₂',
          'D: NaOH + HCl → NaCl + H₂O'
        ], { w: 144 })
      ]
    }, { w: 150, h: 38 }),
    hints: [
      'Read the four equations above the Model and look for any pure element (oxidation number 0) becoming a compound or ion.',
      'Check each element\'s Before and After oxidation numbers in each reaction.',
      'A reaction is redox only if at least one element\'s oxidation number changes.'
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
        return { ok: false, msg: `In ${SORT[c].label}, every element keeps the same number (${r.el} stays at ${oxText(r.before)}).` };
      }
      return { ok: true };
    },
    get reward() {
      const rx = id => SORT[id].text;
      const mv = id => movers(id).map(m => m.el).join(' and ');
      return {
        log: 'Reactions A and C logged as redox.',
        title: 'Redox or Not',
        body: `Reactions A and C changed oxidation numbers (${mv('a')} in A; ${mv('c')} in C), while B and D did not. A reaction is redox only when an oxidation number changes.`
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
  body: 'A redox reaction pairs two half-reactions: one loses electrons and the other gains the exact same number. Oxidation numbers show which atoms gained or lost them.'
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
