/**
 * q5-resonance.js — Ligar, bench five: RESONANCE.
 *
 * The Lewis slate again (`q4-dots`), and its third TABLETOP (plan `bench-tabletop.md`, phase T3a), with one reader that deals nothing: a
 * BOND GAUGE that clamps across a bond and reads how long it measures in the real molecule. The gauge reads the molecule and not the
 * drawing, which is what makes ozone a discovery: the drawing says one double bond and one single, and the gauge says both are the same.
 * (A drawing is flat, so the bench stays flat; the reward cards hold the solid shapes.)
 *
 * THE CLICK (2026-10-23 rollout). Students treat a drawing as the molecule: a double bond is short and a single one is long. The quest
 * asks how the two bonds of ozone will measure (the drawing-is-the-molecule idea is two of the three cards), then lets the gauge answer.
 * Only then is the word "resonance" given, and the player draws ozone both ways to see that no single drawing is the molecule.
 *
 *   1  PREDICT: how will ozone's drawn double and single bond measure?     (no instrument; the wrong idea is a card)
 *   2  gauge ozone's bonds and set the dial to the second bond's length    -> resonance
 *   3  draw every different way to light all of ozone's lamps              -> resonance structures
 *
 * Re-pitched and cut (2026-10-23): formal charge, the minus on the stronger puller, nitrate's three drawings and its fractional bond
 * order, carbonate's delocalized electrons and water's single drawing. They are AP bookkeeping about WHICH drawing to prefer; this bench
 * keeps the one idea a first course needs: a drawing is a way to count electrons, and the real molecule can sit between drawings.
 *
 * THE TABLE (`table/`, `kits/atoms.js`). The slate is the one `q4-dots` deals on: the dealing is `lewis.js` `addBond` / `addLone` /
 * `addDot` / `removeOne`, the reading is `planLewis` (`slateOf`), and a measured length is `lewis.js` `gaugeLength`, so the picture and
 * the grade are one function. A skeleton may stand on a slate when a stage begins (`slateParts` `prefill`), and a drawing may be fixed
 * on it to be read. Nothing here authors an outcome: `SOLUTIONS` and `MISSES` are scripts of the player's own drops, replayed by
 * `verify:table` by drag and by two taps.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import { atomTable, slateOf, slateParts, slateLayout } from '../../table/kits/atoms.js';
import { EN } from '../../engine/vsepr.js';
import { MOLECULES, DRAWINGS, allLit, drawing, drawingKey, gaugeLength, linkKey, planLewis } from '../../engine/lewis.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bformal charges?\b/i, introducedAt: 4 },
  { term: /\bresonance structures?\b/i, introducedAt: 3 },
  { term: /\bresonance\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit03/q4-dots', 'unit03/q3-distance'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q5-resonance';
const GUESSES = [
  ['double', 'the double bond measures shorter', ['The double bond', 'measures shorter', 'than the single']],
  ['same', 'the two bonds measure the same', ['The two bonds', 'measure', 'the same']],
  ['single', 'the single bond measures shorter', ['The single bond', 'measures shorter', 'than the double']]
];

/** Every piece says what it is, and the gauge is a tool with a caption under it. Kept so the quest contract holds. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES (120 x 64 units)
   The tray's pieces stand along the top (every stage: the ones it uses), the slates in the middle, the scratch corner
   bottom left. A slate's atoms and joints are fixed (they are targets, never grabbed); the pieces are the only things that move.
   ------------------------------------------------------------------ */

const OPTS = { words: 'shells', slate: true };
/** What each tool does, printed under the place it hangs. */
const CAPTION = { pairs: 'Adds a pair', lift: 'Takes one back', fcstamp: 'Formal charge', mark: 'Marks an atom', gauge: 'Measures a bond' };
const tile = (kind, label, [x, y]) => ({ id: kind, kind, label, at: { x, y }, caption: CAPTION[kind] });
const PAIR = (at) => tile('pairs', 'Pair', at);
const LIFT = (at) => tile('lift', 'Lift Out', at);
const GAUGE = (at) => tile('gauge', 'Length Meter', at);
const STAMP = (at) => tile('fcstamp', 'Charge Reader', at);
const MARK = (at) => tile('mark', 'Mark', at);

/** One stage's table: its slates (`[id, molecule, cx, cy, size, prefill?]`), the pieces on top and any extra furniture. */
function slateTable(slates, { pieces = [], fixtures = [], markable = null, layout } = {}) {
  const all = [...pieces];
  const boards = [];
  for (const [id, mol, cx, cy, size, prefill] of slates) {
    const part = slateParts(id, mol, slateLayout(mol, cx, cy, size, null), { prefill: prefill || null });
    if (markable) {
      for (const p of part.pieces) {
        if (p.kind === 'atom') p.props = { ...p.props, markable: true, radio: markable };
      }
    }
    all.push(...part.pieces);
    boards.push(part.fixture);
  }
  return atomTable({ opts: OPTS, ...(layout ? { layout } : {}), pieces: all, fixtures: [...boards, ...fixtures] });
}

/** The skeleton of a molecule: one shared pair on every link and nothing else. */
const skeleton = mol => drawing(Object.fromEntries(MOLECULES[mol].links.map(([i, j]) => [linkKey(i, j), 1])));

/** A slate's reading as a drawing: whether it is finished, which drawing it is, and what has been dealt on top of the skeleton. */
function drawn(t, id, base = 0) {
  const sl = slateOf(t, id);
  return { sl, lit: allLit(sl.read), key: drawingKey(sl.mol, sl.placed), fcs: sl.read.atoms.map(a => a.fc), dealt: sl.used - base, empty: sl.used - base === 0 };
}
const markedAtoms = (t, id) => slateOf(t, id).atoms.filter(a => t.pieces[a].props.marked);

/* ------------------------------------------------------------------
   THE SEVEN STAGES
   ------------------------------------------------------------------ */
/** Stage 2's answer dial: how the two measured bonds compare. The first setting is no answer. */
const COMPARE = ['?', 'Double is shorter', 'Both the same', 'Single is shorter'];
/** The valence electrons each atom brings, for the misses that count a formal charge. */
const BROUGHT = { C: 4, N: 5, O: 6, S: 6 };
const ELEMENT = { C: 'Carbon', N: 'Nitrogen', O: 'Oxygen', S: 'Sulfur' };

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Drawn Two Ways',
    prompt: 'Ozone\'s Lewis structure shows one single bond and one double bond: how will their measured lengths compare?',
    cards: GUESSES,
    hints: [
      'Drag one of the three prediction cards into the slot.',
      'On the bond-energy bench, carbon atoms sharing more pairs sat closer together.',
      'Predictions are never graded, so pick the card you think is most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage measures both bonds of a real ozone molecule.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Same Length',
    briefing: {
      speaker: SPEAKER,
      body: 'Measure both bonds on ozone\'s structure, then set the dial to match what the length meter shows.'
    },
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'how do ozone\'s two measured bond lengths compare?');
    },
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'O3', 46, 32, 44, DRAWINGS.O3]], {
      pieces: [GAUGE([12, 10])],
      fixtures: [{
        id: 'len', kind: 'tally', label: 'The two bonds', at: { x: 96, y: 32 }, size: { w: 40, h: 16 }, noRun: true,
        dials: { len: { min: 0, max: 3, step: 1, value: 0, label: 'Measured', labels: COMPARE } }
      }]
    }),
    hints: [
      'Drag the Length Meter onto each bond; it prints the bond length measured in the real molecule.',
      'Compare the two measured lengths with each other, and with what a single and a double bond would give.',
      'A measurement shows the real molecule, so think about what it means when both bonds measure the same.'
    ],
    check(state) {
      const t = state.table;
      const v = t.fixtures.len.dials.len.value;
      const measured = ['aj01', 'aj02'].filter(id => t.pieces[id]?.props.measured).length;
      if (measured < 2) return { ok: false, notYet: true, msg: 'Measure both bonds with the length meter first.' };
      if (v === 0) return { ok: false, notYet: true, msg: 'Set the dial to how the two lengths compare.' };
      if (v === 2) return { ok: true };
      return { ok: false, msg: 'The dial does not match the two lengths printed on the bonds.' };
    },
    get reward() {
      return {
        log: 'Both bonds measured 128 pm.',
        title: 'One Structure Is Not Enough',
        body: `${verdictLine(QUEST_KEY, 'same')}Both bonds measure 128 pm, halfway between a single bond and a double bond. One Lewis structure cannot describe ozone.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Both Ways',
    briefing: {
      speaker: SPEAKER,
      body: 'When a molecule has more than one valid Lewis structure that differs only in where electrons are placed, those drawings are resonance structures. The real molecule is their average, called a resonance hybrid.'
    },
    prompt: 'What are ozone\'s two resonance structures?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([
      ['a', 'O3', 34, 42, 42, skeleton('O3')],
      ['b', 'O3', 86, 42, 42, skeleton('O3')]
    ], { pieces: [PAIR([40, 11]), LIFT([80, 11])], layout: 'as-drawn' }),
    hints: [
      'Both structures already have their single bonds; drag the Pair piece onto gaps or atoms to place the remaining electrons.',
      'Compare your two finished structures: the atoms stay in the same places, and only the electrons move.',
      'Ozone needs one double bond so every atom gets an octet, so think about the two places that double bond can go.'
    ],
    check(state) {
      const t = state.table;
      const slates = ['a', 'b'].map(id => drawn(t, id, 4));
      if (slates.every(s => s.empty)) return { ok: false, notYet: true, msg: 'Place the electrons on a structure.' };
      if (slates.some(s => !s.empty && !s.lit)) return { ok: false, msg: 'In one structure an atom\'s light is still off, so it does not have an octet yet.' };
      const lit = slates.filter(s => s.lit);
      if (lit.length < 2) return { ok: false, notYet: true, msg: 'One structure is still unfinished.' };
      if (new Set(lit.map(s => s.key)).size === 2) return { ok: true };
      return { ok: false, msg: 'The two structures are identical: draw the double bond on the other side in the second structure.' };
    },
    reward: {
      log: 'The same molecule, two structures.',
      title: 'Resonance Structures',
      body: 'The double bond can be drawn on either side, giving two resonance structures. The real molecule is their average, which is why both bonds are equal.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Formal Charge',
    briefing: {
      speaker: SPEAKER,
      body: 'Formal charge equals an atom\'s normal valence electrons minus the electrons assigned to it in a structure (counting 2 for each lone pair and 1 for each bond). Here is an example for oxygen in water:',
      worked: [
        'Oxygen normally has 6 valence electrons.',
        'In water, it has 2 lone pairs (4) and 2 bonds (2): 4 + 2 = 6.',
        'Formal charge = 6 − 6 = 0.'
      ]
    },
    prompt: 'Which atom in this structure of carbon monoxide has a formal charge of +1?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO', 60, 29, 56, DRAWINGS.CO]], { markable: 'co-mark', layout: 'as-drawn' }),
    hints: [
      'Click an atom to select it; the structure shows each atom\'s lone pair and the triple bond between them.',
      'Compare each atom\'s normal valence electrons with its assigned count (2 per lone pair, 1 per bond).',
      'An atom with fewer assigned electrons than it normally brings has a positive formal charge.'
    ],
    check(state) {
      const t = state.table;
      const sl = slateOf(t, 'a');
      const marked = markedAtoms(t, 'a');
      if (!marked.length) return { ok: false, notYet: true, msg: 'Click an atom to select it.' };
      const plus = sl.atoms.filter((id, i) => sl.read.atoms[i].fc > 0);
      if (marked.length === plus.length && marked.every(id => plus.includes(id))) return { ok: true };
      if (marked.length > 1) return { ok: false, msg: 'Only one atom here has a formal charge of +1.' };
      const i = sl.atoms.indexOf(marked[0]);
      const sym = sl.mol.syms[i];
      const a = sl.read.atoms[i];
      return { ok: false, msg: `${ELEMENT[sym]} normally has ${BROUGHT[sym]} valence electrons and is assigned ${BROUGHT[sym] - a.fc} here, so its formal charge is not +1.` };
    },
    reward: {
      log: 'Brought, less what it has.',
      title: 'Formal Charge',
      body: 'Oxygen brings 6 valence electrons and is assigned 5 here (formal charge +1). Carbon brings 4 and is assigned 5 (formal charge −1).'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Do the Count',
    prompt: 'What is the formal charge of the middle oxygen in this structure of ozone?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'O3', 46, 32, 44, DRAWINGS.O3]], {
      fixtures: [{
        id: 'fc', kind: 'tally', label: 'Middle oxygen', at: { x: 96, y: 32 }, size: { w: 40, h: 16 }, noRun: true,
        dials: { fc: { min: -3, max: 3, step: 1, value: -3, label: 'Formal charge' } }
      }]
    }),
    hints: [
      'Use the dial to set your answer; look at the middle oxygen\'s lone pair and its bonds.',
      'Compare oxygen\'s 6 normal valence electrons with the electrons assigned to the middle oxygen.',
      'Count 2 for each lone pair and 1 for each shared bond pair (so a double bond counts as 2).'
    ],
    check(state) {
      const v = state.table.fixtures.fc.dials.fc.value;
      if (v === -3) return { ok: false, notYet: true, msg: 'Set the dial to a formal charge.' };
      const want = planLewis('O3', DRAWINGS.O3).atoms[0].fc;
      if (v === want) return { ok: true };
      return { ok: false, msg: `A formal charge of ${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)} would mean the middle oxygen is assigned ${6 - v} electrons: recount its lone pair and bonds.` };
    },
    reward: {
      log: 'Six brought, five by the count.',
      title: 'Counting Formal Charge',
      body: 'The middle oxygen brings 6 valence electrons and is assigned 2 + 3 = 5, giving +1. All formal charges in a neutral molecule add up to 0.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Two Structures',
    briefing: {
      speaker: SPEAKER,
      body: 'Carbon dioxide has two valid structures where every atom has an octet. Between valid structures, the more stable one has formal charges closest to zero.'
    },
    prompt: 'Which Lewis structure of carbon dioxide is more stable?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([
      ['a', 'CO2', 32, 42, 46, DRAWINGS.CO2_double],
      ['b', 'CO2', 88, 42, 46, DRAWINGS.CO2_triple]
    ], { pieces: [STAMP([60, 12])], markable: 'co2-pick', layout: 'as-drawn' }),
    hints: [
      'Drag the Charge Reader onto the atoms of both structures to compare their formal charges, then click the better structure.',
      'Compare the formal charges on the oxygens in the two-double-bond structure with those in the triple-and-single-bond structure.',
      'Every atom has an octet in both structures, so the one whose formal charges are all zero is more stable.'
    ],
    check(state) {
      const t = state.table;
      const pickA = markedAtoms(t, 'a').length > 0;
      const pickB = markedAtoms(t, 'b').length > 0;
      if (!pickA && !pickB) return { ok: false, notYet: true, msg: 'Click one of the two structures to choose it.' };
      if (pickA) return { ok: true };
      const d = drawn(t, 'b');
      return { ok: false, msg: `This structure is valid, but its formal charges are ${d.fcs.map(q => (q > 0 ? '+' : q < 0 ? '−' : '') + Math.abs(q)).join(', ')}; the other structure leaves every formal charge at zero.` };
    },
    reward: {
      log: 'Formal charges of zero.',
      title: 'Closest to Zero',
      body: 'With two double bonds, every atom has a formal charge of 0. The triple-and-single structure puts +1 on one oxygen and −1 on the other, making it less stable.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Where the Minus Goes',
    briefing: {
      speaker: SPEAKER,
      body: 'An ion\'s formal charges add up to its overall charge, so thiocyanate (SCN⁻) must have a −1 somewhere. When structures have equally small formal charges, the more stable one puts the negative charge on the more electronegative atom.'
    },
    prompt: 'Which Lewis structure of SCN⁻ is most stable?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'SCN', 60, 44, 62]], { pieces: [PAIR([30, 11]), LIFT([60, 11]), STAMP([90, 11])], layout: 'as-drawn' }),
    hints: [
      'Finish a valid structure with the Pair piece, then drag the Charge Reader onto each atom to see where the −1 sits.',
      'Try a second valid arrangement of bonds and compare which atom gets the −1 formal charge.',
      'Check the electronegativities printed on the plate: the more electronegative atom should carry the −1.'
    ],
    check(state) {
      const d = drawn(state.table, 'a');
      if (d.empty) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      if (!d.lit) return { ok: false, msg: 'An atom\'s light is still off or electrons remain: finish a valid structure first.' };
      const syms = d.sl.mol.syms;
      const minus = d.fcs.map((q, i) => [q, i]).filter(([q]) => q < 0).map(([, i]) => i);
      const pullers = Math.max(...syms.map(x => EN[x]));
      if (minus.length === 1 && d.fcs.every(q => Math.abs(q) <= 1) && EN[syms[minus[0]]] === pullers) return { ok: true };
      if (d.fcs.some(q => Math.abs(q) > 1)) return { ok: false, msg: 'This structure is valid, but one atom has a formal charge of 2; another valid structure keeps every charge within ±1.' };
      return { ok: false, msg: `This structure is valid, but it puts the −1 on ${ELEMENT[syms[minus[0]]].toLowerCase()}, which is not the most electronegative atom here.` };
    },
    reward: {
      log: 'The minus on nitrogen.',
      title: 'The Negative Charge',
      body: 'Nitrogen is more electronegative than sulfur, so the structure with the −1 formal charge on nitrogen is the better description of thiocyanate.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    title: 'A Bond Order Between',
    briefing: {
      speaker: SPEAKER,
      body: 'In a resonance hybrid, shared electron pairs are spread evenly across the equivalent bonds, so bond order can be a fraction. Here is the example for ozone:',
      worked: [
        'Ozone has 3 shared pairs spread across 2 bonds.',
        'Bond order = 3 ÷ 2 = 1.5.'
      ]
    },
    prompt: 'What is the bond order of each N–O bond in the nitrate ion?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'NO3', 44, 30, 44, DRAWINGS.NO3_a]], {
      pieces: [GAUGE([100, 46])],
      fixtures: [{
        id: 'order', kind: 'tally', label: 'Each N–O bond', at: { x: 94, y: 24 }, size: { w: 40, h: 16 }, noRun: true,
        dials: { order: { min: 1, max: 2, step: 1 / 12, value: 1, label: 'Bond order', labels: Array.from({ length: 13 }, (_, k) => (1 + k / 12).toFixed(2)) } }
      }]
    }),
    hints: [
      'Drag the Length Meter onto each of the three bonds, then set the bond order on the dial.',
      'Notice that all three measured lengths are equal, even though the drawing shows one double bond and two single bonds.',
      'Divide the total number of shared pairs across the N–O bonds by the number of N–O bonds, just like in the ozone example.'
    ],
    check(state) {
      const t = state.table;
      const v = t.fixtures.order.dials.order.value;
      if (v === 1) return { ok: false, notYet: true, msg: 'Set the dial to a bond order.' };
      const sl = slateOf(t, 'a');
      const bonds = Object.values(sl.placed.bonds).filter(n => n > 0);
      const order = bonds.reduce((a, n) => a + n, 0) / bonds.length;
      if (Math.abs(v - order) <= 0.02) return { ok: true };
      return { ok: false, msg: `A bond order of ${v.toFixed(2)} across three bonds would require ${(v * 3).toFixed(1).replace('.0', '')} shared pairs total: recount the shared pairs in the structure.` };
    },
    reward: {
      log: 'Four pairs over three bonds.',
      title: 'Bond Order in a Hybrid',
      body: 'Four shared pairs are spread evenly across three equal N–O bonds, giving each bond a bond order of 4/3 (about 1.33).',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  4: ['Carbon brings 4 valence electrons;', 'oxygen brings 6.'],
  7: ['Electronegativity:', 'S 2.6, C 2.6, N 3.0']
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
      body: 'Some molecules cannot be shown by a single Lewis structure. Their valid drawings are resonance structures, and the real molecule is their average, with equal bonds that can have fractional bond order.'
    },
    {
      heading: 'Formal Charge',
      body: 'Formal charge is an atom\'s normal valence electrons minus the electrons assigned to it. The most stable structure keeps formal charges closest to zero and puts any negative charge on the more electronegative atom.'
    },
    {
      heading: 'Next',
      body: 'The next bench turns Lewis structures into three-dimensional shapes.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN DROPS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the
   reducer by direct actions, by drag and by two taps. A deal is a tray piece dropped on a joint (`<slate>j<i><j>`) or on
   an atom (`<slate><i>`); a reader is dropped on the atom or the joint it reads.
   ------------------------------------------------------------------ */

const deal = (target, n = 1, tool = 'pairs') => Array.from({ length: n }, () => ({ join: [tool, target] }));
const use = (tool, target) => ({ join: [tool, target] });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [guess('same')],
  [use('gauge', 'aj01'), use('gauge', 'aj02'), { setDial: { fixture: 'len', dial: 'len', value: 2 } }],
  // Ozone two ways: the second shared pair on the first link and three lone pairs where they are needed, then on the second link.
  [
    ...deal('aj01'), ...deal('a0'), ...deal('a1', 2), ...deal('a2', 3),
    ...deal('bj02'), ...deal('b0'), ...deal('b2', 2), ...deal('b1', 3)
  ],
  [{ flip: 'a1' }],
  [{ setDial: { fixture: 'fc', dial: 'fc', value: 1 } }],
  [use('fcstamp', 'a0'), use('fcstamp', 'b0'), { flip: 'a1' }],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2), use('fcstamp', 'a0'), use('fcstamp', 'a2')],
  [use('gauge', 'aj01'), use('gauge', 'aj02'), use('gauge', 'aj03'), { setDial: { fixture: 'order', dial: 'order', value: 4 / 3 } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [use('gauge', 'aj01'), use('gauge', 'aj02'), { setDial: { fixture: 'len', dial: 'len', value: 1 } }],
  [...deal('a0', 2), ...deal('b0', 2)],
  [{ flip: 'a0' }],
  [{ setDial: { fixture: 'fc', dial: 'fc', value: 0 } }],
  [{ flip: 'b1' }],
  [...deal('aj01'), ...deal('aj12', 3), ...deal('a0', 3), ...deal('a2')],
  [use('gauge', 'aj01'), { setDial: { fixture: 'order', dial: 'order', value: 1.5 } }]
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
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { planLewis, drawingKey, linkKey, gaugeLength };
