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
  if (r.added === 0) return { ok: false, notYet: true, msg: `Press "Add ${LIGANDS[lig].sym}" to attach ligands.` };
  if (r.bonded >= fit) return { ok: true };
  return { ok: false, msg: `There is still room around the ion for another ${LIGANDS[lig].sym}.` };
}

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-ammonia',
    title: 'Ammonia on Copper',
    briefing: { speaker: SPEAKER, body: 'In water, each copper(II) ion (Cu²⁺) has six water molecules bonded around it. Press "Add Ammonia" and watch what changes around the ion.' },
    prompt: 'What happens to the copper(II) ions when ammonia is added?',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        beakerFixture('flask', { x: 52, y: 29 }, { w: 100, h: 50 }),
        lchoiceFixture('pick', 'What happens', { x: 126, y: 29 }, { list: true, w: 44, options: ['Ammonia replaces water on each ion', 'Copper turns into solid metal', 'The two liquids simply mix'] })
      ]
    }),
    hints: [
      'Watch the magnified copper ion in the window as you add ammonia.',
      'Compare the molecules around the copper ion before and after each press.',
      'If the liquids only mixed, the copper ion would keep the same water molecules around it.'
    ],
    check(state) {
      const t = state.table;
      const c = chosen(t, 'pick');
      if (!c) return { ok: false, notYet: true, msg: 'Tap the option that matches what you saw.' };
      if (c === 'Ammonia replaces water on each ion') return { ok: true };
      const r = beakerRead(t, 'flask');
      if (!r.added) return { ok: false, msg: 'Press "Add Ammonia" first to see what changes.' };
      return { ok: false, msg: `The window shows ${r.added} NH₃ molecule${r.added > 1 ? 's' : ''} bonded to the copper ion where water molecules used to be.` };
    },
    reward: {
      log: 'Ammonia bonded to each Cu²⁺.',
      title: 'Ligands and Complex Ions',
      body: 'Ammonia replaced water on each Cu²⁺ ion. A molecule or ion bonded to a metal ion is a ligand, and the metal ion with its ligands is a complex ion.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 's2-predict',
    title: 'Whose Electrons',
    predict: true,
    prompt: 'Which electrons form the bond between ammonia and a copper(II) ion?',
    widget,
    table: lodeTable({
      pieces: [
        note('g-each', 'One electron from ammonia, one from copper', { x: 32, y: 14 }),
        note('g-nh3', 'Both electrons from ammonia', { x: 32, y: 33 }),
        note('g-cu', 'Both electrons from copper', { x: 32, y: 52 })
      ],
      fixtures: [lodeLeadFixture('lead', { x: 112, y: 44 }, { scene: 'h2-bond', w: 62, h: 30 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 112, y: 14 }, size: { w: 54, h: 18 } }] }
    }),
    hints: [
      'Watch the clip showing a normal covalent bond forming between two atoms.',
      'Cu²⁺ has already lost electrons, while ammonia\'s nitrogen has a lone pair of unshared electrons.',
      'Think about which particle already has a free pair of electrons to share.'
    ],
    check(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (!card) return { ok: false, notYet: true, msg: 'Place a prediction card in the slot.' };
      return { ok: true };
    },
    onClear(state) {
      const card = Object.values(state.table.pieces).find(p => p.zone === 'slot:guess');
      if (card) remember(QUEST_KEY, card.id);
    },
    reward: { log: 'Prediction recorded.', title: 'Prediction Recorded', body: 'Your prediction is saved. Now watch the bond form on the bench.' }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const guess = () => GUESS[recall(QUEST_KEY)];
    return {
      id: 's3-bond',
      title: 'Counting Electrons',
      get prompt() { const g = guess(); return `Which electrons form the bond between ammonia and copper${g ? ` (you predicted ${g})` : ''}?`; },
      widget,
      table: lodeTable({
        pieces: [],
        fixtures: [
          cplxFixture('cx', { x: 52, y: 29 }, { metal: 'Cu', q: 2, mode: 'bond', title: 'Ammonia meets Cu²⁺', w: 100, h: 50 }),
          lchoiceFixture('pick', 'The two bond electrons', { x: 126, y: 22 }, { list: true, w: 44, options: ['Ammonia\'s lone pair', 'One from each', 'Copper\'s electrons'] })
        ]
      }),
      hints: [
        'Press "Bond" and watch copper\'s 3d electron count and the colour of the two bonding electrons.',
        'Compare copper\'s electron count before and after bonding, and check the colour of the electrons in the bond.',
        'Each electron keeps the colour of the atom it came from.'
      ],
      check(state) {
        const t = state.table;
        const c = chosen(t, 'pick');
        if (!c) return { ok: false, notYet: true, msg: 'Tap your answer.' };
        if (c === 'Ammonia\'s lone pair') return { ok: true };
        if (!cplxRead(t, 'cx').bonded2) return { ok: false, msg: 'Press "Bond" first to see the bond form.' };
        return { ok: false, msg: 'Copper\'s 3d count stays at 9 before and after, and both electrons in the bond have nitrogen\'s colour.' };
      },
      get reward() {
        const g = guess();
        return {
          log: 'Both bond electrons came from nitrogen.',
          title: 'Coordinate Bond',
          body: `Both bonding electrons came from nitrogen's lone pair${g ? ` (you predicted ${g})` : ''}, while copper kept all nine of its own. A bond formed from one atom's lone pair is a coordinate bond.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    id: 's4-water',
    title: 'Water Around Iron',
    briefing: { speaker: SPEAKER, body: 'Press "Add H₂O" to bond water molecules around Fe³⁺ until no more fit, then submit.' },
    prompt: 'How many water molecules can bond to one Fe³⁺ ion?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Fe', q: 3, mode: 'supply', lig: 'h2o', geom: 'oct', title: 'Fe³⁺ in water', w: 92, h: 54 })] }),
    hints: [
      'Watch the dashed space around Fe³⁺ fill up as each water molecule bonds.',
      'Notice how much room remains around the ion after each water molecule settles.',
      'Ligands keep bonding until there is no space left around the metal ion.'
    ],
    check(state) { return supplyCheck(state.table, 'cx', 'h2o'); },
    reward: {
      log: 'Six water molecules bond to Fe³⁺.',
      title: 'Coordination Number',
      body: 'Six water molecules bond to Fe³⁺, forming [Fe(H₂O)₆]³⁺. The number of atoms bonded directly to the metal ion is its coordination number (here 6).'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 's5-chloride',
    title: 'Chloride Around Copper',
    prompt: 'How many chloride ions can bond to one Cu²⁺ ion?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Cu', q: 2, mode: 'supply', lig: 'cl', geom: 'tet', title: 'Cu²⁺ in strong salt solution', w: 92, h: 54 })] }),
    hints: [
      'Watch how much space around Cu²⁺ each larger chloride ion takes up.',
      'Compare the size of a chloride ion with the smaller water molecules from the last stage.',
      'Larger ligands fill up the space around a metal ion sooner.'
    ],
    check(state) { return supplyCheck(state.table, 'cx', 'cl'); },
    reward: {
      log: 'Four chloride ions bond to Cu²⁺.',
      title: 'Size Sets the Count',
      body: 'Only four chloride ions fit around Cu²⁺, forming [CuCl₄]²−. Because chloride ions are larger than water molecules, fewer can bond, so coordination number depends on ligand size too.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    id: 's6-charge',
    title: 'Overall Charge',
    briefing: { speaker: SPEAKER, body: 'Tap the dotted rings around Fe³⁺ to switch between water (H₂O, charge 0) and chloride (Cl−, charge −1). Watch how the charge meter updates.' },
    prompt: 'Build an Fe³⁺ complex with six ligands that has an overall charge of 0.',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Fe', q: 3, mode: 'cycle', palette: ['h2o', 'cl'], meter: true, title: 'Fe³⁺ with water and chloride', w: 92, h: 54 })] }),
    hints: [
      'Watch the charge meter as you switch each ring between H₂O and Cl−.',
      'Compare how one H₂O and one Cl− affect the total charge.',
      'The overall charge equals the metal ion\'s charge plus the charges of all its ligands.'
    ],
    check(state) {
      const r = cplxRead(state.table, 'cx');
      if (r.atoms < 6) return { ok: false, notYet: true, msg: `${6 - r.atoms} ligand spot${6 - r.atoms > 1 ? 's are' : ' is'} still empty.` };
      if (r.charge === 0) return { ok: true };
      return { ok: false, msg: `The charge meter reads ${signed(r.charge)}, not 0.` };
    },
    reward: {
      log: 'Three Cl− cancel Fe³⁺: no charge.',
      title: 'Adding Charges',
      body: 'Three Cl− ions (−1 each) cancel Fe³⁺ (+3), giving [Fe(H₂O)₃Cl₃] with an overall charge of 0. Neutral water ligands do not change the charge.'
    }
  },

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-chelate',
    title: 'Two Attachment Points',
    briefing: { speaker: SPEAKER, body: 'Ethylenediamine (en) is a chain with a nitrogen atom at each end, and both nitrogens have a lone pair: H₂N-CH₂-CH₂-NH₂.' },
    prompt: 'How many ethylenediamine (en) molecules can bond to one Ni²⁺ ion?',
    widget,
    table: lodeTable({ pieces: [], fixtures: [cplxFixture('cx', { x: 75, y: 31 }, { metal: 'Ni', q: 2, mode: 'supply', lig: 'en', geom: 'oct', title: 'Ni²⁺ with en', w: 92, h: 54 })] }),
    hints: [
      'Watch how many nitrogen atoms each en molecule bonds to the nickel ion.',
      'Count both the total nitrogen atoms bonded to nickel and the number of en molecules added.',
      'Each en molecule uses both of its lone pairs to bond at two spots at once.'
    ],
    check(state) { return supplyCheck(state.table, 'cx', 'en'); },
    reward: {
      log: 'Three en bond to Ni²⁺.',
      title: 'Chelate',
      body: 'Three en molecules form six nitrogen bonds to Ni²⁺, so the coordination number is still 6. A ligand that bonds through two or more atoms at once is a chelate.'
    }
  },

  /* ---------------------------------------------------------------- 8 */
  {
    id: 's8-drum',
    title: 'The Sealed Drum',
    prompt: 'Build the chromium complex described on the sealed drum.',
    widget,
    table: lodeTable({
      pieces: [],
      fixtures: [
        cplxFixture('cx', { x: 60, y: 31 }, { metal: 'Cr', q: 3, mode: 'cycle', palette: ['h2o', 'cl'], title: 'Cr³⁺ with water and chloride', w: 88, h: 54 }),
        plaqueFixture('drum', 'The sealed drum', { x: 126, y: 22 }, ['Cr³⁺ with six ligands', 'only H₂O (0) and Cl− (−1)', 'overall charge: +1'], { w: 42 })
      ]
    }),
    hints: [
      'Count how many Cl− ions (−1 each) bring Cr³⁺ (+3) down to +1.',
      'Compare the charge of each ligand with the drum\'s overall +1 charge.',
      'Start at +3 for Cr³⁺ and find how many −1 ligands leave a total charge of +1.'
    ],
    check(state) {
      const r = cplxRead(state.table, 'cx');
      if (r.atoms < 6) return { ok: false, notYet: true, msg: `${6 - r.atoms} ligand spot${6 - r.atoms > 1 ? 's are' : ' is'} still empty.` };
      if (r.charge === 1) return { ok: true };
      return { ok: false, msg: 'Add +3 for Cr³⁺ and −1 for each Cl− (H₂O adds 0). Your build does not add up to +1.' };
    },
    reward: {
      log: 'The drum holds [Cr(H₂O)₄Cl₂]⁺.',
      title: 'Reading the Charge',
      body: 'Two Cl− and four H₂O give +3 − 2 = +1, so the drum holds [Cr(H₂O)₄Cl₂]⁺. The overall charge reveals how many chloride ions are attached.'
    }
  }
];


export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [{ heading: 'What You Found', body: 'Ligands bond to a metal ion by donating lone pairs, filling as many spots as fit. The overall charge of the complex is the metal ion\'s charge plus the charges of its ligands.' }]
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
