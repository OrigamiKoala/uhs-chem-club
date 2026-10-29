/**
 * q9-orbitals.js — Ligar, bench nine: MOLECULAR ORBITALS. Beyond a first course, and the bench says so.
 *
 * The ninth bench on the world and its seventh TABLETOP (plan `bench-tabletop.md`, phase T3c). The magnet and the box rack, worked
 * with the hands. The magnet measures the REAL molecule, never the player's arrangement; the rack's boxes stand at the sides (the
 * atoms') and in the middle (the boxes the atoms make between them), lowest energy at the bottom, and each box is a container that
 * electrons are poured into from a jar by a drag (or a tap on the jar and then the box) and that takes one arrow of each direction and
 * no more. A rack is a ladder of energy, so it is drawn flat, square-on.
 *
 * THE CLICK (2026-10-23 rollout). Nobody expects a gas to be pulled by a magnet. So the quest asks whether a magnet pulls oxygen (the
 * expected answer is a card), then sorts four gases by what a magnet does, and oxygen and diboron are pulled. Only then does the rack
 * explain it: pour oxygen's electrons into the boxes until the rack pulls on the magnet as hard as the real sample does, which only
 * happens when two electrons stand alone in separate boxes.
 *
 *   1  PREDICT: does a magnet pull on oxygen?                      (no instrument; the expected answer is a card)
 *   2  sort four gases by whether the magnet pulls on them          -> some gases are pulled, which a drawing of pairs cannot say
 *   3  fill oxygen's boxes until the rack pulls like the sample     -> molecular orbitals: bonding and antibonding
 *
 * Re-pitched and cut (2026-10-23): the bond-order marker for H2, He2 and N2, the three oxygens ranked by length, fluorine's weak link,
 * and diboron's other order of boxes. They are AP bookkeeping about WHICH numbers a bond has; this bench keeps the one thing a
 * first-course student can not get from a Lewis drawing and can see for themselves, a gas that a magnet pulls. The rack names no row
 * until the last reward earns "bonding" and "antibonding"; it prints one count, UNPAIRED.
 *
 * EVERY COUNT IS `mo.readMO`; every unpaired figure the magnet gives is the real one in `mo.DIATOMICS`, every ground state is
 * `mo.fillMO`, and `verify:learn` checks the graded fills against all three.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { DIATOMICS } from '../../engine/mo.js';
import {
  moTable, moRack, moSupply, magnet, moCard, fillSteps, readOf, matchesGround, magnetRead
} from '../../table/kits/mo.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 3 };

export const VOCABULARY = [
  { term: /\bantibonding\b/i, introducedAt: 3 },
  { term: /\bbonding orbitals?\b/i, introducedAt: 3 },
  { term: /\bmolecular orbitals?\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit03/q8-hybrid', 'unit02/q6-filling', 'unit03/q3-distance'];

const SPEAKER = 'Vess';

/** The key the player's guess is kept under (`engine/predict.js`), and the cards it is chosen from. */
const QUEST_KEY = 'unit03/q9-orbitals';
const GUESSES = [
  ['pulled', 'the magnet pulls the oxygen', ['The magnet pulls', 'the oxygen', 'toward it']],
  ['nothing', 'the magnet does nothing to the oxygen', ['The magnet does', 'nothing to', 'the oxygen']],
  ['pushed', 'the magnet pushes the oxygen away', ['The magnet pushes', 'the oxygen', 'away']]
];

/** Every key on this bench says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RACK_AT = { x: 74, y: 32 };
const JAR_AT = { x: 15, y: 40 };

/** The gases of stage 2: a sample card each, in a row along the bottom. */
const GASES = [['n2', 'N₂', 'N2'], ['o2', 'O₂', 'O2'], ['f2', 'F₂', 'F2'], ['b2', 'B₂', 'B2']];

/* ------------------------------------------------------------------
   THE THREE STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'A Magnet and a Gas',
    prompt: 'Does an external magnetic field attract oxygen gas, O2?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Consider whether all electrons in molecular oxygen are truly paired in reality.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Your prediction is recorded. Test each diatomic gas sample beside the magnet on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Four Gases',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'sort each gas by whether it is attracted to the magnet.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: GASES.map(([id, label, mol], i) => moCard(id, label, { x: 20 + i * 34, y: 52 }, { mol })),
      zones: {
        slots: [{ id: 'test', label: 'Gas to test', at: { x: 30, y: 21 }, size: { w: 36, h: 22 } }],
        trays: [
          { id: 'pulled', label: 'Pulled', at: { x: 118, y: 14 }, size: { w: 44, h: 14 }, cell: 22 },
          { id: 'ignored', label: 'Not pulled', at: { x: 118, y: 34 }, size: { w: 44, h: 14 }, cell: 22 }
        ]
      },
      fixtures: [magnet('magnet', { x: 76, y: 22 }, { slot: 'test', size: { w: 34, h: 30 }, label: 'Magnet' })]
    }),
    hints: [
      'Use the gas cards, the test slot, "Test Sample" and the two trays.',
      'Test each diatomic gas to observe its magnetic behavior.',
      'Sort gases attracted to the magnetic field into "Pulled" and the others into "Not pulled".'
    ],
    check(state) {
      const t = state.table;
      const ids = GASES.map(g => g[0]);
      const where = Object.fromEntries(ids.map(id => [id, ['pulled', 'ignored'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all four gases into trays.' };
      const wrong = ids.find(id => where[id] !== (DIATOMICS[t.pieces[id].props.mol].unpaired > 0 ? 'pulled' : 'ignored'));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is under a heading the magnet did not show.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Oxygen and diboron were pulled. Nitrogen and fluorine were not.',
        title: 'Paramagnetism in Diatomic Gases',
        body: `${verdictLine(QUEST_KEY, 'pulled')}Liquid and gaseous oxygen are paramagnetic and attracted to a magnetic field. Standard Lewis structures show only paired electrons and fail to explain this paramagnetism, requiring molecular orbital theory.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rack = moRack('a', 'O2', RACK_AT, { plain: true });
    return {
      title: 'Oxygen\'s Boxes',
      prompt: 'Pour oxygen\'s twelve valence electrons into the boxes so that the rack pulls on the magnet like the real sample.',
      widget: { type: 'table', label: 'The bench' },
      table: moTable({
        zones: { containers: [moSupply('supply', 'Electrons', JAR_AT, DIATOMICS.O2.e), ...rack.containers] },
        fixtures: [rack.fixture, magnet('magnet', { x: 134, y: 36 }, { mol: 'O2' })]
      }),
      hints: [
        'Use the jar of electrons, the boxes and the magnet.',
        'Compare the rack\'s UNPAIRED count with the pull the magnet gives the real sample.',
        'Fill from the lowest box upward, and give each box of a level one electron before pairing any.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'a');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the rack.' };
        if (r.total !== DIATOMICS.O2.e) return { ok: false, msg: 'The rack holds a different number of electrons than the molecule has.' };
        if (r.unpaired !== magnetRead(t, 'magnet').real) return { ok: false, msg: 'The rack and the magnet do not agree about how many electrons stand alone.' };
        if (matchesGround(t, 'a', DIATOMICS.O2.e)) return { ok: true };
        return { ok: false, msg: 'An electron is sitting higher on the ladder than it needs to be.' };
      },
      reward: {
        log: 'Two electrons stand alone.',
        title: 'Molecular Orbital Theory and Paramagnetism',
        body: 'Atomic orbitals combine into bonding orbitals and higher-energy antibonding orbitals. In O2, Hund\'s rule places the last two valence electrons unpaired into separate degenerate antibonding orbitals, explaining its paramagnetism.',
        last: true
      }
    };
  })()
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'Summary',
      body: 'Molecular orbital theory describes bonding through combinations of atomic orbitals into bonding and antibonding molecular orbitals. Oxygen possesses two unpaired electrons in antibonding orbitals, accounting for its paramagnetism.'
    },
    {
      heading: 'Bond Order and Stability',
      body: 'Bond order equals half the difference between bonding and antibonding electrons, providing quantitative predictions of bond stability.'
    },
    {
      heading: 'Next',
      body: 'Apply concepts of chemical bonding, molecular geometry, and electron structure in the unit assessment.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'What is the bond order of N₂?',
    options: [
      { id: 'a', label: '3' },
      { id: 'b', label: '2' },
      { id: 'c', label: '1' },
      { id: 'd', label: '2.5' }
    ],
    answer: 'a',
    explanation: 'N₂ has 8 electrons in bonding orbitals and 2 in antibonding orbitals: (8 − 2)/2 = 3.'
  },
  {
    question: 'Why does He₂ not exist as a stable molecule?',
    options: [
      { id: 'a', label: 'Its bonding and antibonding orbitals are both filled, so its bond order is zero' },
      { id: 'b', label: 'Helium atoms repel each other electrically' },
      { id: 'c', label: 'Helium has no electrons' },
      { id: 'd', label: 'Helium atoms are too big' }
    ],
    answer: 'a',
    explanation: 'Two electrons in the bonding orbital and two in the antibonding orbital cancel: (2 − 2)/2 = 0.'
  },
  {
    question: 'Which statement about O₂ does a molecular orbital diagram explain, but a Lewis structure does not?',
    options: [
      { id: 'a', label: 'It is attracted to a magnet because it has two unpaired electrons' },
      { id: 'b', label: 'It has a double bond' },
      { id: 'c', label: 'It is a gas at room temperature' },
      { id: 'd', label: 'It has 12 valence electrons' }
    ],
    answer: 'a',
    explanation: 'The last two electrons go one each into two degenerate π* orbitals, so O₂ is paramagnetic.'
  },
  {
    question: 'Put O₂⁺, O₂ and O₂⁻ in order of increasing bond length.',
    options: [
      { id: 'a', label: 'O₂⁺ < O₂ < O₂⁻' },
      { id: 'b', label: 'O₂⁻ < O₂ < O₂⁺' },
      { id: 'c', label: 'O₂ < O₂⁺ < O₂⁻' },
      { id: 'd', label: 'All the same' }
    ],
    answer: 'a',
    explanation: 'Bond orders are 2.5, 2 and 1.5. The higher the bond order, the shorter the bond.'
  },
  {
    question: '(Beyond the exam.) Why is B₂ paramagnetic?',
    options: [
      { id: 'a', label: 'Its last two electrons occupy separate π orbitals, since π lies below σ in B₂' },
      { id: 'b', label: 'It has an odd number of electrons' },
      { id: 'c', label: 'Its bond order is zero' },
      { id: 'd', label: 'It has a triple bond' }
    ],
    answer: 'a',
    explanation: 'For B₂ the two π2p orbitals are filled before σ2p, so the last two electrons enter them singly.'
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. A gas card is put in the test slot and the magnet run, then filed; electrons are
   poured from the jar into boxes (`fillSteps` pours a ground state, one box at a time). Nothing here says what a rack reads.
   ------------------------------------------------------------------ */

const pour = (to, n = 1, from = 'supply') => ({ pour: { from, to: `a.${to}`, what: 'electron', amount: n } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });
const test = id => [{ place: { piece: id, to: 'slot:test' } }, { run: 'magnet' }];
const file = (id, zone) => ({ place: { piece: id, to: `tray:${zone}` } });

/** The bench state that solves each stage, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [guess('pulled')],
  [...test('n2'), file('n2', 'ignored'), ...test('o2'), file('o2', 'pulled'), ...test('f2'), file('f2', 'ignored'), ...test('b2'), file('b2', 'pulled')],
  [...fillSteps('a', DIATOMICS.O2.order, DIATOMICS.O2.e), { run: 'magnet' }]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [file('n2', 'pulled'), file('o2', 'ignored'), file('f2', 'ignored'), file('b2', 'pulled')],
  [pour('g2s:0', 2), pour('u2s:0', 2), pour('g2p:0', 2), pour('p2p:0', 2), pour('p2p:1', 2), pour('q2p:0', 2), { run: 'magnet' }]
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

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { DIATOMICS };
