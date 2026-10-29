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

export const meta = { stageCount: 7 };

export const VOCABULARY = [
  { term: /\bformal charges?\b/i, introducedAt: 4 },
  { term: /\bresonance structures?\b/i, introducedAt: 3 },
  { term: /\bresonance\b/i, introducedAt: 2 }
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
const CAPTION = { pairs: 'Adds a pair', lift: 'Takes one back', fcstamp: 'Prints charge', mark: 'Marks an atom', gauge: 'Measures a bond' };
const tile = (kind, label, [x, y]) => ({ id: kind, kind, label, at: { x, y }, caption: CAPTION[kind] });
const PAIR = (at) => tile('pairs', 'Pair', at);
const LIFT = (at) => tile('lift', 'Lift Out', at);
const GAUGE = (at) => tile('gauge', 'Gauge', at);
const STAMP = (at) => tile('fcstamp', 'Stamp', at);
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
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'Drawn Two Ways',
    prompt: 'How will the two oxygen-oxygen bond lengths in ozone compare when measured experimentally?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Recall the difference in length between single and double bonds, and whether ozone might behave differently.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Your prediction is recorded. Use the bond gauge to measure both bonds of ozone on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Same Length',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'set the dial to the measured length of ozone\'s second bond in picometers.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'O3', 46, 32, 44, DRAWINGS.O3]], {
      pieces: [GAUGE([12, 10])],
      fixtures: [{
        id: 'len', kind: 'tally', label: 'Second bond', at: { x: 96, y: 32 }, size: { w: 40, h: 16 }, noRun: true,
        dials: { len: { min: 100, max: 160, step: 1, value: 100, label: 'Length' } }
      }]
    }),
    hints: [
      'Use the gauge and the dial.',
      'Measure both bonds with the gauge and compare the values.',
      'Clamp the gauge onto the second bond and set the dial to its measured length.'
    ],
    check(state) {
      const t = state.table;
      const v = t.fixtures.len.dials.len.value;
      if (v === 100) return { ok: false, notYet: true, msg: 'Set the dial to a length.' };
      const real = gaugeLength(MOLECULES.O3, DRAWINGS.O3, '0-2');
      if (Math.abs(v - real) <= 1.5) return { ok: true };
      return { ok: false, msg: 'The dial does not match the length the gauge reads on the second bond.' };
    },
    get reward() {
      return {
        log: 'Both bonds measured 128 pm.',
        title: 'Resonance Hybrid',
        body: `${verdictLine(QUEST_KEY, 'same')}Although a single Lewis structure depicts one double bond and one single bond, both bonds measure an identical 128 pm, between a single and a double bond. The true molecule is a blend of structures called a resonance hybrid.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Both Ways',
    prompt: 'Draw both valid resonance structures of ozone, with one structure on each slate.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([
      ['a', 'O3', 52, 40, 36, skeleton('O3')],
      ['b', 'O3', 98, 40, 36, skeleton('O3')]
    ], { pieces: [PAIR([12, 8]), LIFT([34, 8])] }),
    hints: [
      'Use the Pair tile, "Lift Out" and the two slates.',
      'Complete the octet on each atom for both structures by placing the double bond on different sides.',
      'Draw one resonance structure with the double bond on the left and the second with the double bond on the right.'
    ],
    check(state) {
      const t = state.table;
      const slates = ['a', 'b'].map(id => drawn(t, id, 4));
      if (slates.every(s => s.empty)) return { ok: false, notYet: true, msg: 'Deal the electrons onto a slate.' };
      if (slates.some(s => !s.empty && !s.lit)) return { ok: false, msg: 'A slate does not light every lamp.' };
      const lit = slates.filter(s => s.lit);
      if (lit.length < 2) return { ok: false, notYet: true, msg: 'One slate is still empty.' };
      if (new Set(lit.map(s => s.key)).size === 2) return { ok: true };
      return { ok: false, msg: 'Two slates hold the same drawing.' };
    },
    reward: {
      log: 'The same molecule, two drawings.',
      title: 'Resonance Structures',
      body: 'Resonance structures are two or more valid Lewis structures that differ only in the placement of electrons. Ozone is a resonance hybrid that averages both structures, explaining why experimental bond lengths are alike.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Who Owns What',
    briefing: {
      speaker: SPEAKER,
      body: 'Drop the stamp on an atom and it prints the charge that atom carries; a mark stays on the atom you put it on.'
    },
    prompt: 'Mark the atom in carbon monoxide that carries a positive charge.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO', 84, 26, 52, DRAWINGS.CO]], { pieces: [STAMP([13, 10]), MARK([37, 10])] }),
    hints: [
      'Drop the stamp on each atom of the drawing and read the number it prints.',
      'Compare the electrons each atom brings with the electrons it owns, counting a bond as one and a lone pair as two.',
      'An atom that owns one electron fewer than it brought reads positive, so put the mark on that one.'
    ],
    check(state) {
      const t = state.table;
      const sl = slateOf(t, 'a');
      const marked = markedAtoms(t, 'a');
      if (!marked.length) return { ok: false, notYet: true, msg: 'Put the mark on an atom.' };
      const plus = sl.atoms.filter((id, i) => sl.read.atoms[i].fc > 0);
      if (marked.length === plus.length && marked.every(id => plus.includes(id))) return { ok: true };
      return { ok: false, msg: 'The mark is on an atom that owns as many electrons as it brought, or more: stamp both atoms and compare what they print.' };
    },
    reward: {
      log: 'Brought minus owned.',
      title: 'Formal Charge',
      body: 'An atom\'s formal charge is the electrons it brings minus the electrons it owns, counting each bond as one and each lone pair as two. In this drawing oxygen is +1 and carbon is −1.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Do the Count',
    prompt: 'Set the dial to the formal charge of the middle oxygen in this drawing of ozone.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'O3', 46, 32, 44, DRAWINGS.O3]], {
      fixtures: [{
        id: 'fc', kind: 'tally', label: 'Middle oxygen', at: { x: 96, y: 32 }, size: { w: 40, h: 16 }, noRun: true,
        dials: { fc: { min: -3, max: 3, step: 1, value: -3, label: 'Charge' } }
      }]
    }),
    hints: [
      'Set the dial to the charge you worked out.',
      'Count the lone-pair electrons on the middle oxygen, then the bonds it holds, counting a double bond as two.',
      'Subtract those two counts from the six electrons an oxygen atom brings.'
    ],
    check(state) {
      const v = state.table.fixtures.fc.dials.fc.value;
      if (v === -3) return { ok: false, notYet: true, msg: 'Set the dial to a charge.' };
      const want = planLewis('O3', DRAWINGS.O3).atoms[0].fc;
      if (v === want) return { ok: true };
      return { ok: false, msg: 'The dial does not match six minus the electrons this atom owns in the drawing.' };
    },
    reward: {
      log: 'Six brought, five owned.',
      title: 'Counting It Yourself',
      body: 'Formal charge = valence electrons − (lone-pair electrons + bonds). The middle oxygen brings 6 and owns 2 + 3 = 5, so it is +1; the single-bonded end owns 7 and is −1, and the charges sum to the molecule\'s charge of 0.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Two Drawings',
    prompt: 'Draw carbon dioxide in the most stable way it can be drawn.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'CO2', 84, 26, 52]], { pieces: [PAIR([12, 10]), LIFT([12, 28]), STAMP([12, 46])] }),
    hints: [
      'Deal pairs onto the slate until every lamp is lit, then drop the stamp on each atom.',
      'Light the lamps a second way, stamp the atoms again, and compare the charges the two drawings give.',
      'Prefer the drawing whose stamped charges sit closest to zero.'
    ],
    check(state) {
      const d = drawn(state.table, 'a');
      if (d.empty) return { ok: false, notYet: true, msg: 'Deal the electrons onto the slate.' };
      if (!d.lit) return { ok: false, msg: 'A lamp is still dark, or electrons are still left to place: light every lamp first.' };
      if (d.fcs.every(q => q === 0)) return { ok: true };
      return { ok: false, msg: 'Every lamp is lit, but the lamps cannot choose between drawings. Stamp the atoms: another way of lighting them leaves the charges nearer zero.' };
    },
    reward: {
      log: 'Charges near zero win.',
      title: 'Charges Near Zero',
      body: 'Between two drawings of the same molecule, prefer the one whose atoms carry formal charges closest to zero. A +1 and a −1 on neighbouring atoms cost the drawing stability.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    title: 'Where the Minus Goes',
    prompt: 'Draw thiocyanate with its negative charge on the atom that pulls electrons harder.',
    widget: { type: 'table', label: 'The bench' },
    table: slateTable([['a', 'SCN', 84, 26, 52]], { pieces: [PAIR([12, 10]), LIFT([12, 28]), STAMP([12, 46])] }),
    hints: [
      'Deal pairs onto the slate until every lamp is lit, and stamp the atoms to see where the minus sits.',
      'Light the lamps a second way and compare which atom carries the negative charge in each drawing.',
      'Choose the drawing that puts the negative charge on the atom that pulls electrons harder.'
    ],
    check(state) {
      const d = drawn(state.table, 'a');
      if (d.empty) return { ok: false, notYet: true, msg: 'Deal the electrons onto the slate.' };
      if (!d.lit) return { ok: false, msg: 'A lamp is still dark, or electrons are still left to place: light every lamp first.' };
      const syms = d.sl.mol.syms;
      const minus = d.fcs.map((q, i) => [q, i]).filter(([q]) => q < 0).map(([, i]) => i);
      const pullers = Math.max(...syms.map(x => EN[x]));
      if (minus.length === 1 && d.fcs.every(q => Math.abs(q) <= 1) && EN[syms[minus[0]]] === pullers) return { ok: true };
      return { ok: false, msg: 'Every lamp is lit, but the minus sits on the atom that pulls less. Stamp the atoms and compare which atom each drawing puts it on.' };
    },
    reward: {
      log: 'The minus goes where the pull is.',
      title: 'The Stronger Puller Takes the Minus',
      body: 'When two drawings have similar charges, the better one puts the negative charge on the atom that pulls electrons harder. Nitrogen pulls harder than sulfur, so it takes the minus here.',
      last: true
    }
  }
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {};
applyNotes(STAGES, NOTES);

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'Summary',
      body: 'When a single Lewis structure cannot adequately describe electron delocalization, multiple resonance structures represent the molecule. The true electronic structure is a resonance hybrid with identical intermediate bond lengths.'
    },
    {
      heading: 'Resonance Hybrids',
      body: 'Molecules such as ozone, nitrate, and carbonate possess equivalent bonds whose bond lengths and strengths lie between single and double bonds.'
    },
    {
      heading: 'Next',
      body: 'The next bench uses Valence Shell Electron Pair Repulsion (VSEPR) theory to predict three-dimensional molecular geometries from electron pair arrangements.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Ozone is drawn with one double bond and one single bond, but the gauge reads the same length for both. What does that tell you?',
    options: [
      { id: 'a', label: 'The real molecule is a blend of two drawings, so both bonds are alike' },
      { id: 'b', label: 'The gauge is broken' },
      { id: 'c', label: 'Ozone has two double bonds' },
      { id: 'd', label: 'Ozone has two single bonds' }
    ],
    answer: 'a',
    explanation: 'Either drawing alone predicts one short bond and one long one. The measured equal lengths show the electrons are shared across both, which resonance describes.'
  },
  {
    question: 'Two Lewis structures of the same molecule differ only in their formal charges. Which is usually the better?',
    options: [
      { id: 'a', label: 'The one whose formal charges are closest to zero' },
      { id: 'b', label: 'The one with the most charges' },
      { id: 'c', label: 'The one with a positive charge on the most electronegative atom' },
      { id: 'd', label: 'The one with the most lone pairs' }
    ],
    answer: 'a',
    explanation: 'Structures with formal charges near zero are more stable, and a negative charge belongs on the more electronegative atom.'
  },
  {
    question: 'An atom brings 6 valence electrons. In a drawing it has two lone pairs and one double bond. What is its formal charge?',
    options: [
      { id: 'a', label: '0' },
      { id: 'b', label: '+1' },
      { id: 'c', label: '−1' },
      { id: 'd', label: '+2' }
    ],
    answer: 'a',
    explanation: 'Formal charge is 6 − (4 lone-pair electrons + 2 bonds) = 0.'
  },
  {
    question: 'What is the bond order of each N–O bond in the nitrate ion, NO₃⁻?',
    options: [
      { id: 'a', label: '1⅓' },
      { id: 'b', label: '1' },
      { id: 'c', label: '2' },
      { id: 'd', label: '1½' }
    ],
    answer: 'a',
    explanation: 'Nitrate has four shared pairs spread over three equivalent bonds, so each has a bond order of 4/3.'
  },
  {
    question: 'How many resonance structures does the carbonate ion have?',
    options: [
      { id: 'a', label: 'Three' },
      { id: 'b', label: 'Two' },
      { id: 'c', label: 'One' },
      { id: 'd', label: 'Four' }
    ],
    answer: 'a',
    explanation: 'The double bond can sit on any of the three oxygens, giving three equivalent structures.'
  }
];

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
  [use('gauge', 'aj01'), use('gauge', 'aj02'), { setDial: { fixture: 'len', dial: 'len', value: 128 } }],
  // Ozone two ways: the second shared pair on the first link and three lone pairs where they are needed, then on the second link.
  [
    ...deal('aj01'), ...deal('a0'), ...deal('a1', 2), ...deal('a2', 3),
    ...deal('bj02'), ...deal('b0'), ...deal('b2', 2), ...deal('b1', 3)
  ],
  [use('fcstamp', 'a0'), use('fcstamp', 'a1'), use('mark', 'a1')],
  [{ setDial: { fixture: 'fc', dial: 'fc', value: 1 } }],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2), use('fcstamp', 'a0'), use('fcstamp', 'a1'), use('fcstamp', 'a2')],
  [...deal('aj01', 2), ...deal('aj12', 2), ...deal('a0', 2), ...deal('a2', 2), use('fcstamp', 'a0'), use('fcstamp', 'a2')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [use('gauge', 'aj01'), { setDial: { fixture: 'len', dial: 'len', value: 120 } }],
  [...deal('a0', 2), ...deal('b0', 2)],
  [use('fcstamp', 'a0'), use('mark', 'a0')],
  [{ setDial: { fixture: 'fc', dial: 'fc', value: 0 } }],
  [...deal('aj01', 3), ...deal('aj12'), ...deal('a0'), ...deal('a2', 3)],
  [...deal('aj01'), ...deal('aj12', 3), ...deal('a0', 3), ...deal('a2')]
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
