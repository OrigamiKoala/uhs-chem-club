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
function slateTable(slates, { pieces = [], fixtures = [] } = {}) {
  const all = [...pieces];
  const boards = [];
  for (const [id, mol, cx, cy, size, prefill] of slates) {
    const part = slateParts(id, mol, slateLayout(mol, cx, cy, size, null), { prefill: prefill || null });
    all.push(...part.pieces);
    boards.push(part.fixture);
  }
  return atomTable({ opts: OPTS, pieces: all, fixtures: [...boards, ...fixtures] });
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
    prompt: 'Ozone\'s Lewis structure has one single and one double bond: how will the two measured bond lengths compare?',
    cards: GUESSES,
    hints: [
      'Lay one of the three cards in the slot.',
      'On the bond-energy bench, carbon atoms that shared more pairs sat closer together.',
      'A prediction is never graded, so lay the card you think most likely.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'The next stage measures both bonds of a real ozone molecule.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Same Length',
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
      'Drag the length meter onto each bond of the structure; it prints the length measured in the real molecule.',
      'Compare the two lengths with each other, and with what one single and one double bond should give.',
      'A measurement is of the real molecule, so ask what it means when it disagrees with the structure drawn.'
    ],
    check(state) {
      const t = state.table;
      const v = t.fixtures.len.dials.len.value;
      const measured = ['aj01', 'aj02'].filter(id => t.pieces[id]?.props.measured).length;
      if (measured < 2) return { ok: false, notYet: true, msg: 'Measure both bonds with the length meter first.' };
      if (v === 0) return { ok: false, notYet: true, msg: 'Set the dial to how the two lengths compare.' };
      if (v === 2) return { ok: true };
      return { ok: false, msg: 'The dial does not agree with the two lengths the meter printed on the bonds.' };
    },
    get reward() {
      return {
        log: 'Both bonds measured 128 pm.',
        title: 'One Structure Is Not Enough',
        body: `${verdictLine(QUEST_KEY, 'same')}Both bonds are 128 pm, between the length of a single and a double bond. One Lewis structure cannot describe ozone.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Both Ways',
    briefing: {
      speaker: SPEAKER,
      body: 'When a molecule can be drawn in more than one valid way, differing only in where the electrons are placed, the drawings are resonance structures. The real molecule is their average, called a resonance hybrid.'
    },
    prompt: 'What are ozone\'s two resonance structures?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([
      ['a', 'O3', 52, 40, 36, skeleton('O3')],
      ['b', 'O3', 98, 40, 36, skeleton('O3')]
    ], { pieces: [PAIR([12, 8]), LIFT([34, 8])] }),
    hints: [
      'Each of the two structures already has its single bonds; drag the Pair piece onto a gap or an atom to place the rest.',
      'Compare the two finished structures: the atoms must be in the same places, and only the electrons may differ.',
      'Ozone needs one double bond for every atom to have an octet, so ask how many places that double bond could be drawn.'
    ],
    check(state) {
      const t = state.table;
      const slates = ['a', 'b'].map(id => drawn(t, id, 4));
      if (slates.every(s => s.empty)) return { ok: false, notYet: true, msg: 'Place the electrons on a structure.' };
      if (slates.some(s => !s.empty && !s.lit)) return { ok: false, msg: 'In one structure an atom\'s light is still off: it does not have its octet.' };
      const lit = slates.filter(s => s.lit);
      if (lit.length < 2) return { ok: false, notYet: true, msg: 'One structure is still unfinished.' };
      if (new Set(lit.map(s => s.key)).size === 2) return { ok: true };
      return { ok: false, msg: 'The two structures place every electron in the same position, so they are one structure drawn twice.' };
    },
    reward: {
      log: 'The same molecule, two structures.',
      title: 'Resonance Structures',
      body: 'The double bond can be drawn on either side: two resonance structures. The real molecule is their average, which is why its two bonds are equal.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Formal Charge',
    briefing: {
      speaker: SPEAKER,
      body: 'Formal charge is the valence electrons an atom brought minus the electrons it has in the structure, counting two for each lone pair and one for each shared pair in its bonds. Here it is worked for the oxygen atom in water.',
      worked: [
        'Oxygen brought 6 valence electrons.',
        'In water it has 2 lone pairs (count 4) and 2 shared pairs in its bonds (count 2): 6.',
        'Formal charge = 6 − 6 = 0.'
      ]
    },
    prompt: 'Which atom in this structure of carbon monoxide has a formal charge of +1?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO', 84, 26, 52, DRAWINGS.CO]], { pieces: [MARK([13, 10])] }),
    hints: [
      'Drag the Mark piece onto an atom to mark it; the structure shows each atom\'s lone pairs and the three shared pairs between them.',
      'Compare what each atom brought with what it has here, counting lone-pair electrons and bonds as the worked case does.',
      'An atom with fewer electrons by this count than it brought has a positive formal charge.'
    ],
    check(state) {
      const t = state.table;
      const sl = slateOf(t, 'a');
      const marked = markedAtoms(t, 'a');
      if (!marked.length) return { ok: false, notYet: true, msg: 'Put the mark on an atom.' };
      const plus = sl.atoms.filter((id, i) => sl.read.atoms[i].fc > 0);
      if (marked.length === plus.length && marked.every(id => plus.includes(id))) return { ok: true };
      if (marked.length > 1) return { ok: false, msg: 'Only one atom here has a formal charge of +1: take the mark off one of them.' };
      const i = sl.atoms.indexOf(marked[0]);
      const sym = sl.mol.syms[i];
      const a = sl.read.atoms[i];
      return { ok: false, msg: `${ELEMENT[sym]} brought ${BROUGHT[sym]} and has ${BROUGHT[sym] - a.fc} in this structure by the count, so it is not short of electrons.` };
    },
    reward: {
      log: 'Brought, less what it has.',
      title: 'Formal Charge',
      body: 'Oxygen has one electron fewer by the count than it brought, so its formal charge is +1. Carbon has one more than it brought, so it is −1.'
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
      'The dial sets your answer; the structure shows the middle oxygen\'s lone pair and its bonds.',
      'Compare the six valence electrons an oxygen atom brings with what the middle oxygen has by the count.',
      'Count two for each lone pair and one for each shared pair in a bond, so a double bond counts two.'
    ],
    check(state) {
      const v = state.table.fixtures.fc.dials.fc.value;
      if (v === -3) return { ok: false, notYet: true, msg: 'Set the dial to a formal charge.' };
      const want = planLewis('O3', DRAWINGS.O3).atoms[0].fc;
      if (v === want) return { ok: true };
      return { ok: false, msg: `A formal charge of ${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v)} would mean the middle oxygen has ${6 - v} electrons by the count: count its lone-pair electrons and its bonds again.` };
    },
    reward: {
      log: 'Six brought, five by the count.',
      title: 'Counting Formal Charge',
      body: 'The middle oxygen brought 6 and has 2 + 3 = 5, so it is +1. The formal charges of all the atoms add up to the charge of the molecule, here 0.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Two Structures',
    briefing: {
      speaker: SPEAKER,
      body: 'Carbon dioxide can be completed in more than one way that gives every atom an octet. Of two valid structures, the better description is the one whose formal charges are closest to zero.'
    },
    prompt: 'Which structure of carbon dioxide is the better one?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO2', 84, 26, 52]], { pieces: [PAIR([12, 10]), LIFT([12, 28]), STAMP([12, 46])] }),
    hints: [
      'Complete the structure with the Pair piece, then drag the charge reader onto each atom to see its formal charge.',
      'Complete it a second way, with a different number of pairs in each bond, and compare the formal charges with the first.',
      'Every atom\'s light is on in both, so the formal charges are what tell the two structures apart.'
    ],
    check(state) {
      const d = drawn(state.table, 'a');
      if (d.empty) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      if (!d.lit) return { ok: false, msg: 'An atom\'s light is still off, or electrons are still left to place: finish a valid structure first.' };
      if (d.fcs.every(q => q === 0)) return { ok: true };
      return { ok: false, msg: `This structure is valid, but its formal charges are ${d.fcs.map(q => (q > 0 ? '+' : q < 0 ? '−' : '') + Math.abs(q)).join(', ')}: another way of placing the pairs leaves them nearer zero.` };
    },
    reward: {
      log: 'Formal charges of zero.',
      title: 'Closest to Zero',
      body: 'With two double bonds every atom has a formal charge of 0. A triple and a single bond put +1 on one oxygen and −1 on the other, so that structure describes the molecule less well.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Where the Minus Goes',
    briefing: {
      speaker: SPEAKER,
      body: 'An ion\'s formal charges add up to its charge, so thiocyanate, SCN⁻, must have a −1 somewhere. Where two structures have formal charges equally close to zero, the better one puts the negative formal charge on the more electronegative atom.'
    },
    prompt: 'Which structure of thiocyanate, SCN⁻, is the better one?',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'SCN', 84, 26, 52]], { pieces: [PAIR([12, 10]), LIFT([12, 28]), STAMP([12, 46])] }),
    hints: [
      'Complete the structure with the Pair piece, then drag the charge reader onto each atom to see where the −1 sits.',
      'Complete it a second way and compare which atom carries the −1 in each structure.',
      'The electronegativities are printed on the plate, so ask which of the atoms carrying the −1 pulls electrons more strongly.'
    ],
    check(state) {
      const d = drawn(state.table, 'a');
      if (d.empty) return { ok: false, notYet: true, msg: 'Place the electrons on the structure.' };
      if (!d.lit) return { ok: false, msg: 'An atom\'s light is still off, or electrons are still left to place: finish a valid structure first.' };
      const syms = d.sl.mol.syms;
      const minus = d.fcs.map((q, i) => [q, i]).filter(([q]) => q < 0).map(([, i]) => i);
      const pullers = Math.max(...syms.map(x => EN[x]));
      if (minus.length === 1 && d.fcs.every(q => Math.abs(q) <= 1) && EN[syms[minus[0]]] === pullers) return { ok: true };
      if (d.fcs.some(q => Math.abs(q) > 1)) return { ok: false, msg: 'This structure is valid, but one atom has a formal charge of 2 and another way keeps every charge within 1.' };
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
      body: 'In a resonance hybrid the shared pairs are spread evenly over the bonds they can be drawn in, so a bond order need not be a whole number. Here it is worked for ozone.',
      worked: [
        'Ozone has 3 shared pairs, drawn in 2 bonds.',
        'Bond order of each bond = 3 ÷ 2 = 1.5.'
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
      'Drag the length meter onto each of the three bonds, then set the bond order on the dial.',
      'Compare the three measured lengths with the one double and two single bonds this structure draws.',
      'The worked case for ozone shows where the shared pairs and the bonds go in the division.'
    ],
    check(state) {
      const t = state.table;
      const v = t.fixtures.order.dials.order.value;
      if (v === 1) return { ok: false, notYet: true, msg: 'Set the dial to a bond order.' };
      const sl = slateOf(t, 'a');
      const bonds = Object.values(sl.placed.bonds).filter(n => n > 0);
      const order = bonds.reduce((a, n) => a + n, 0) / bonds.length;
      if (Math.abs(v - order) <= 0.02) return { ok: true };
      return { ok: false, msg: `A bond order of ${v.toFixed(2)} in each of the three bonds would need ${(v * 3).toFixed(1).replace('.0', '')} shared pairs in all: count the shared pairs in the structure.` };
    },
    reward: {
      log: 'Four pairs over three bonds.',
      title: 'Bond Order in a Hybrid',
      body: 'Four shared pairs spread over three equal bonds: each N–O bond has a bond order of one and a third.',
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
      body: 'Some molecules cannot be described by one Lewis structure. Their valid drawings are resonance structures, and the real molecule is the average, with equal bonds whose order can be a fraction.'
    },
    {
      heading: 'Formal Charge',
      body: 'Formal charge is the electrons an atom brought less those it has by the count. The better structure keeps formal charges closest to zero and puts a negative one on the more electronegative atom.'
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
  [use('mark', 'a1')],
  [{ setDial: { fixture: 'fc', dial: 'fc', value: 1 } }],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2), use('fcstamp', 'a0'), use('fcstamp', 'a1'), use('fcstamp', 'a2')],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2), use('fcstamp', 'a0'), use('fcstamp', 'a2')],
  [use('gauge', 'aj01'), use('gauge', 'aj02'), use('gauge', 'aj03'), { setDial: { fixture: 'order', dial: 'order', value: 4 / 3 } }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [use('gauge', 'aj01'), use('gauge', 'aj02'), { setDial: { fixture: 'len', dial: 'len', value: 1 } }],
  [...deal('a0', 2), ...deal('b0', 2)],
  [use('mark', 'a0')],
  [{ setDial: { fixture: 'fc', dial: 'fc', value: 0 } }],
  [...deal('aj01', 3), ...deal('aj12'), ...deal('a0'), ...deal('a2', 3)],
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
