/**
 * Unit 12 · Bench 3 — Complex Ions (q3-complex)
 *
 * The leach vats, on the lode kit. A metal ion and the molecules that bond round it. Eight stages and ONE click: the belief that every
 * bond is one electron from each atom. Ammonia meeting Cu²⁺ is drawn with each electron in its owner's colour, and copper's nine 3d
 * electrons stay nine: both electrons of the bond are ammonia's lone pair.
 *
 *   1  ammonia into copper(II) solution: what happens to the ions?           -> ligand, complex ion
 *   2  PREDICT: whose electrons make the bond?
 *   3  TEST: ammonia meets Cu²⁺, electrons coloured by owner                  -> coordinate bond
 *   4  water round Fe³⁺: how many bond?                                       -> coordination number
 *   5  chloride round Cu²⁺: how many bond?                                    -> it depends on the ligand's size
 *   6  build Fe³⁺ with no overall charge (a meter reads the whole)             -> charge = metal's + ligands'
 *   7  en round Ni²⁺: how many bond?                                           -> chelate
 *   8  SEALED: the drum's chromium complex has a measured charge of +1       -> [Cr(H₂O)₄Cl₂]⁺
 *
 * This quest pays no XP.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { lodeTable, beakerFixture, beakerRead, cplxFixture, cplxRead, lchoiceFixture, chosen, note, plaqueFixture, lodeLeadFixture } from '../../table/kits/lode.js';
import { LIGANDS, fitCount } from '../../engine/lodedata.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bligands?\b/i, introducedAt: 1 },
  { term: /\bcomplex ions?\b/i, introducedAt: 1 },
  { term: /\bcoordinate bonds?\b/i, introducedAt: 3 },
  { term: /\bcoordination numbers?\b/i, introducedAt: 4 },
  { term: /\bchelates?\b/i, introducedAt: 7 }
];

/** Ions and charges are this world's first two benches; a lone pair and a covalent bond are Ligar's. */
export const BUILDS_ON = ['unit12/q2-charges', 'unit03/q1-joins'];

const SPEAKER = 'Vess';
const QUEST_KEY = 'unit12/q3-complex';
const GUESS = { 'g-each': 'one from each', 'g-nh3': 'both from ammonia', 'g-cu': 'both from copper' };
const widget = { type: 'table', label: 'The bench' };
const signed = q => (q > 0 ? `+${q}` : q < 0 ? `−${-q}` : '0');

export function toolNoteFor() { return null; }

/** The refusal for a supply stage: the space left, or the count the ion holds. */
function supplyCheck(t, id, lig) {
  const r = cplxRead(t, id);
  const fit = fitCount(lig);
  if (r.added === 0) return { ok: false, notYet: true, msg: `Press "Add ${LIGANDS[lig].sym}".` };
  if (r.bonded >= fit) return { ok: true };
  return { ok: false, msg: `There is space beside the ion for another ${LIGANDS[lig].sym}.` };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-ammonia',
    title: 'Ammonia on Copper',
    briefing: { speaker: SPEAKER, body: 'In water, each copper(II) ion has six water molecules bonded round it. Watch what changes round one ion as ammonia is added.' },
    prompt: 'What happens to the copper(II) ions when ammonia is added?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        beakerFixture('flask', { x: 52, y: 29 }, { w: 100, h: 50 }),
        lchoiceFixture('pick', 'What happens', { x: 126, y: 22 }, { list: true, w: 44, options: ['Ammonia bonds to each ion', 'The ions turn to copper metal', 'Nothing: the two colours mix'] }),
        plaqueFixture('note', 'Large excess of ammonia', { x: 126, y: 50 }, ['A little ammonia first', 'gives a pale solid;', 'more dissolves it.'], { w: 44 })
      ]
    }),
    hints: [
      'Press "Add Ammonia" a few times and watch the window.',
      'Compare the molecules round the copper ion before and after each press.',
      'Two liquids that only mixed would leave the ion with the same neighbours as before.'
    ],
    check(state) {
      const t = state.table;
      const c = chosen(t, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap what you think happens.' };
      if (c === 'Ammonia bonds to each ion') return { ok: true };
      const r = beakerRead(t, 'flask');
      if (!r.added) return { ok: false, msg: 'No ammonia has been added yet.' };
      return { ok: false, msg: `The window shows ${r.added} NH₃ molecule${r.added > 1 ? 's' : ''} next to the copper ion, where water molecules were.` };
    },
    reward: {
      log: 'Ammonia bonded to each Cu²⁺.',
      title: 'Ligands and Complex Ions',
      body: 'Ammonia bonded to each Cu²⁺ in place of water. A molecule or ion bonded to a metal ion is a ligand, and the ion with its ligands is a complex ion.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Whose Electrons',
    predict: true,
    prompt: 'Which electrons make the bond between an ammonia molecule and a copper(II) ion?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-each', 'One from ammonia, one from copper, as in H₂', { x: 32, y: 14 }),
        note('g-nh3', 'Both from ammonia\'s lone pair', { x: 32, y: 33 }),
        note('g-cu', 'Both from copper', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'h2-bond', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 46, h: 16 } }] }
    }),
    hints: [
      'The clip shows an ordinary bond between two atoms forming.',
      'Cu²⁺ has already lost electrons, and ammonia\'s nitrogen has a lone pair, two electrons not in a bond.',
      'Think about which particle has a pair of electrons free to share.'
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
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is recorded. Test it on the bench.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-bond',
      title: 'Counting Electrons',
      get prompt() { const g = guess(); return `Which electrons make the bond between ammonia and copper?${g ? ` You predicted ${g}.` : ''}`; },
      widget,
      table: lodeTable({
        pieces: [],
        fixtures: [
          cplxFixture('cx', { x: 52, y: 29 }, { metal: 'Cu', q: 2, mode: 'bond', title: 'Ammonia meets Cu²⁺', w: 100, h: 50 }),
          lchoiceFixture('pick', 'The two bond electrons', { x: 126, y: 22 }, { list: true, w: 44, options: ['Ammonia\'s lone pair', 'One from each', 'Copper\'s electrons'] })
        ]
      }),
      hints: [
        'Press "Bond" and watch the coloured electrons.',
        'Count copper\'s electrons before and after, and look at the colour of the two in the gap.',
        'Each electron keeps the colour of the particle it came from.'
      ],
      check(state) {
        const t = state.table;
        const c = chosen(t, 'pick');
        if (!c) return { ok: false, notYet: true, msg: 'Tap your answer.' };
        if (c === 'Ammonia\'s lone pair') return { ok: true };
        if (!cplxRead(t, 'cx').bonded2) return { ok: false, msg: 'The bond has not formed yet.' };
        return { ok: false, msg: 'Copper\'s 3d count reads 9 before and after, and both electrons in the gap are nitrogen\'s colour.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Both bond electrons came from nitrogen.',
          title: 'Coordinate Bond',
          body: `Both electrons came from nitrogen's lone pair, and copper kept all nine of its own. A bond made from one particle's pair is a coordinate bond.${g ? ` You predicted ${g}.` : ''}`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-water',
    title: 'Water Round Iron',
    prompt: 'How many water molecules can bond to one Fe³⁺ ion?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Fe', q: 3, mode: 'supply', lig: 'h2o', geom: 'oct', title: 'Fe³⁺ in water', w: 92, h: 54 })] }),
    hints: [
      'Press "Add H₂O" until no more bond.',
      'Watch how much space is left round the ion as each one settles.',
      'Ligands bond until there is no space left beside the ion for another lone pair to reach it.'
    ],
    check(state) { return supplyCheck(state.table, 'cx', 'h2o'); },
    reward: {
      log: 'Six water molecules bond to Fe³⁺.',
      title: 'Coordination Number',
      body: 'Six. The number of atoms bonded directly to the metal ion is its coordination number, here six: the complex ion [Fe(H₂O)₆]³⁺.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-chloride',
    title: 'Chloride Round Copper',
    prompt: 'How many chloride ions can bond to one Cu²⁺ ion?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Cu', q: 2, mode: 'supply', lig: 'cl', geom: 'tet', title: 'Cu²⁺ in strong salt solution', w: 92, h: 54 })] }),
    hints: [
      'Press "Add Cl⁻" until no more bond.',
      'Compare the size of a chloride ion with the water molecules round iron.',
      'Bigger ligands use up the space round the ion sooner.'
    ],
    check(state) { return supplyCheck(state.table, 'cx', 'cl'); },
    reward: {
      log: 'Four chloride ions bond to Cu²⁺.',
      title: 'Size Sets the Count',
      body: 'Four: [CuCl₄]²⁻. Chloride ions are larger than water molecules, so fewer fit, and the coordination number depends on the ligand as well as the metal.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-charge',
    title: 'The Charge of the Whole',
    prompt: 'Build a complex of Fe³⁺ with six ligands whose overall charge is zero.',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Fe', q: 3, mode: 'cycle', palette: ['h2o', 'cl'], meter: true, title: 'Fe³⁺ with water and chloride', w: 92, h: 54 })] }),
    hints: [
      'Tap a ring round the ion to choose what bonds there, and watch the meter.',
      'Compare what one H₂O and one Cl⁻ each do to the meter.',
      'The charge of the whole is the metal ion\'s charge plus the charge of each ligand.'
    ],
    check(state) {
      const r = cplxRead(state.table, 'cx');
      if (r.atoms < 6) return { ok: false, notYet: true, msg: `${6 - r.atoms} place${6 - r.atoms > 1 ? 's are' : ' is'} still empty.` };
      if (r.charge === 0) return { ok: true };
      return { ok: false, msg: `The meter reads ${signed(r.charge)}.` };
    },
    reward: {
      log: 'Three Cl⁻ cancel Fe³⁺: no charge.',
      title: 'Adding Charges',
      body: 'Three Cl⁻ cancel the +3: [Fe(H₂O)₃Cl₃] has no overall charge. A complex\'s charge is the metal ion\'s plus each ligand\'s, and water adds nothing.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-chelate',
    title: 'Two Grips',
    briefing: { speaker: SPEAKER, body: 'Ethylenediamine, called en, is a chain with a nitrogen at each end, and each nitrogen has a lone pair: H₂N–CH₂–CH₂–NH₂.' },
    prompt: 'How many en molecules can bond to one Ni²⁺ ion?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Ni', q: 2, mode: 'supply', lig: 'en', geom: 'oct', title: 'Ni²⁺ with en', w: 92, h: 54 })] }),
    hints: [
      'Press "Add en" until no more bond.',
      'Count the nitrogen atoms bonded to nickel, and the en molecules added.',
      'Each en can reach the ion with both of its lone pairs.'
    ],
    check(state) { return supplyCheck(state.table, 'cx', 'en'); },
    reward: {
      log: 'Three en bond to Ni²⁺.',
      title: 'Chelate',
      body: 'Three en molecules, six nitrogen atoms bonded: the coordination number is still six. A ligand that bonds through two or more atoms is a chelate.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-drum',
    title: 'The Sealed Drum',
    prompt: 'Build the chromium complex that is in the sealed drum.',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        cplxFixture('cx', { x: 60, y: 31 }, { metal: 'Cr', q: 3, mode: 'cycle', palette: ['h2o', 'cl'], title: 'Cr³⁺ with water and chloride', w: 88, h: 54 }),
        plaqueFixture('drum', 'The sealed drum', { x: 126, y: 22 }, ['Cr³⁺ and six ligands', 'only H₂O and Cl⁻', 'measured charge +1'], { w: 42 })
      ]
    }),
    hints: [
      'Tap the rings round the ion to choose the six ligands.',
      'Compare the charge each ligand brings with the drum\'s measured +1.',
      'Start from the metal ion\'s +3 and work out how many −1 ligands bring it to +1.'
    ],
    check(state) {
      const r = cplxRead(state.table, 'cx');
      if (r.atoms < 6) return { ok: false, notYet: true, msg: `${6 - r.atoms} place${6 - r.atoms > 1 ? 's are' : ' is'} still empty.` };
      if (r.charge === 1) return { ok: true };
      return { ok: false, msg: `That build has a charge of ${signed(r.charge)}; the drum measured +1.` };
    },
    reward: {
      log: 'The drum holds [Cr(H₂O)₄Cl₂]⁺.',
      title: 'Read From the Charge',
      body: 'Two Cl⁻ and four H₂O: +3 − 2 = +1, so the drum holds [Cr(H₂O)₄Cl₂]⁺. The charge alone told you how many chloride ions it carries.'
    }
  }
];

const NOTES = {
  1: ['Press "Add Ammonia", then tap your answer.'],
  2: ['Drag the card you choose into the slot.'],
  3: ['Press "Bond", then tap your answer.'],
  4: ['Press the "Add" key on the bench.'],
  5: ['Press the "Add" key on the bench.'],
  6: ['Tap a ring to choose what bonds there.'],
  7: ['Press the "Add" key on the bench.'],
  8: ['Tap a ring to choose what bonds there.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Ligands bond to a metal ion through their lone pairs, as many as there is space for, and the complex\'s charge is the metal\'s plus the ligands\'.' }]
};

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const site = (i, v) => dial('cx', `s${i}`, v);

export const SOLUTIONS = [
  [{ run: 'flask' }, { run: 'flask' }, dial('pick', 'value', 1)],
  [put('g-each', 'slot:guess')],
  [{ run: 'cx' }, dial('pick', 'value', 1)],
  [dial('cx', 'add', 6)],
  [dial('cx', 'add', 4)],
  [site(0, 2), site(1, 2), site(2, 2), site(3, 1), site(4, 1), site(5, 1)],
  [dial('cx', 'add', 3)],
  [site(0, 2), site(1, 2), site(2, 1), site(3, 1), site(4, 1), site(5, 1)]
];

export const MISSES = [
  [{ run: 'flask' }, dial('pick', 'value', 3)],
  [],
  [{ run: 'cx' }, dial('pick', 'value', 2)],
  [dial('cx', 'add', 5)],
  [dial('cx', 'add', 3)],
  [site(0, 2), site(1, 2), site(2, 1), site(3, 1), site(4, 1), site(5, 1)],
  [dial('cx', 'add', 2)],
  [site(0, 2), site(1, 2), site(2, 2), site(3, 1), site(4, 1), site(5, 1)]
];

function blankState() { return {}; }
export function stateFor(i, overrides) { return stateFromScript(STAGES[i], overrides); }

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, { STAGES, DEBRIEF, blankState, toolNoteFor, onLoad() {} });
  runner.start();
  return { dispose: () => runner.dispose() };
}
