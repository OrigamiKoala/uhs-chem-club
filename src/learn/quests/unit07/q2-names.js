/**
 * Unit 7 · Bench 2 — Names and Formulas (q2-names)
 *
 * The labelling shed of the foundry, on the pot kit (`table/kits/pot.js`, the bench's own instruments in `pot-names.js`): ion chips, a cell
 * (a tray) with a charge needle, a label strip with slots for name cards, and a window that shows what is inside a crate. Every reading is
 * `reactdata.js` / `reactdata-names.js`; nothing on the table is authored. Not a CED topic: every AP unit assumes it (the chart says so).
 *
 *   1  PREDICT: the formula Mg2+ and Cl- make                                   (the held model: one of each, side by side)
 *   2  TEST: build the smallest group with no charge in a cell                   -> ionic formula
 *   3  name the group of Mg2+ and O2-                                            -> naming ionic compounds (-ide)
 *   4  name FeO and Fe2O3 (the iron chips print no charge)                       -> Roman numeral = charge of one metal ion
 *   5  dissolve two crates; write the formula of the second                      -> polyatomic ion, brackets
 *   6  look into a crate of molecules; write the prefixes                        -> molecular prefixes
 *   7  name the acid made of H+ with Cl- and with NO3-                           -> acid names
 *   8  an unmarked crate: dissolve it, name it                                   -> everything at once (sealed)
 *
 * THE TEACHING STANCE. Naming is a convention, so the convention is printed on the object (an example, a list of prefixes, a list of
 * ion names). What is never printed is what to apply it to: the charge the oxide chips add up to, the number of atoms the window draws,
 * which atoms the window shows joined. This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, plaqueFixture, tag, chip, piecesInTray } from '../../table/kits/pot.js';
import { ionChip, crate, needleFixture, needleRead, labelerFixture, labelWords, windowFixture, windowRead } from '../../table/kits/pot-names.js';
import { nameIonic, nameMolecular, nameAcid, ionicFormula, parseFormula, IONS } from '../../engine/reactdata.js';
import { romanOf, metalChargeFrom, printedCharge, spell, atomsOfSpelled, squashName, acidWord, saltInWater, moleculeAtoms, countDrawn } from '../../engine/reactdata-names.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bionic compounds?\b/i, introducedAt: 1 },
  { term: /\bionic formulas?\b/i, introducedAt: 2 },
  { term: /\broman numerals?\b/i, introducedAt: 4 },
  { term: /\bpolyatomic ions?\b/i, introducedAt: 5 },
  { term: /\bmolecular prefix(es)?\b/i, introducedAt: 6 }
];

/** The charge needle is Tallow's; the rest is new to this bench. */
export const BUILDS_ON = ['unit01/q4-ledger'];

export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q2-names';

/* ------------------------------------------------------------------
   THE CASES
   ------------------------------------------------------------------ */

const GUESS = { g1: 'MgCl', g2: 'MgCl₂', g3: 'Mg₂Cl', g4: 'Mg₂Cl₂', g5: 'Mg₃Cl₂' };
const GUESS_RIGHT = 'g2'; // the formula `ionicFormula('Mg', 'Cl')` writes, as the card spells it

const MG_CL = ionicFormula('Mg', 'Cl');          // { nCat: 1, nAn: 2 }
const NAME_MGO = nameIonic('Mg', 'O');           // magnesium oxide
const FE_A = { cat: 'Fe2', an: 'O' };            // FeO
const FE_B = { cat: 'Fe3', an: 'O' };            // Fe2O3
const SALT_A = { cat: 'Na', an: 'Cl' };
const SALT_B = { cat: 'Ca', an: 'NO3' };
const FORMULA_B = ionicFormula(SALT_B.cat, SALT_B.an).formula; // Ca(NO3)2
const MOL_A = 'CO2';
const MOL_B = 'N2O4';
const SEALED = { cat: 'Fe3', an: 'SO4' };

/** The chips of a salt's smallest group, in order, for a cell: `n` of the cation then `n` of the anion. */
const groupIons = ({ cat, an }) => { const f = ionicFormula(cat, an); return [...Array(f.nCat).fill(cat), ...Array(f.nAn).fill(an)]; };

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const inCell = (t, tray) => piecesInTray(t, tray).filter(p => p.kind === 'ionchip');
const countsOf = chips => chips.reduce((c, p) => { c[p.props.ion] = (c[p.props.ion] || 0) + 1; return c; }, {});
const signed = q => (q === 0 ? '0' : `${q > 0 ? '+' : '−'}${Math.abs(q)}`);
const lower = s => String(s).toLowerCase();
const wordsText = ws => ws.filter(Boolean).join(' ');
const atomsText = atoms => Object.entries(atoms).map(([el, n]) => `${el} ${n}`).join(', ');

const tagAt = (id, label, x, y) => tag(id, label, { x, y });
const chipAt = (id, label, x, y) => chip(id, label, { x, y });
const trayOf = (id, label, x, y, cols, rows, cell = 14, cellH = cell) => ({ id, label, at: { x, y }, size: { w: cols * cell, h: rows * cellH }, cell, cellH });
const inTray = (c, tray) => ({ ...c, zone: `tray:${tray}` });
/** The tray a stage's cards lie in at the start: three across, two down. */
const cardsTray = (n = 'Cards') => trayOf('cards', n, 115, 18, 3, 2, 19, 12.6);

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'What Magnesium and Chlorine Make',
    predict: true,
    briefing: {
      speaker: SPEAKER,
      body: 'An ionic compound is made of positive and negative ions held together. Taken as a whole it has no charge, and a small number in a formula counts how many of that ion are in one group.'
    },
    prompt: 'Which formula do you expect for the compound of Mg²⁺ and Cl⁻?',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => tagAt(id, label, 20 + (i % 3) * 30, 14 + Math.floor(i / 3) * 16)),
      fixtures: [plaqueFixture('ions', 'The two ions', { x: 116, y: 12 }, ['Mg²⁺ and Cl⁻'], { w: 40 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 116, y: 40 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Look at the five formula cards and the prediction slot.',
      'Compare the 2+ charge on one magnesium ion with the 1− charge on one chlorine ion.',
      'Think about how many 1− charges balance one 2+ charge.'
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
    reward: { log: 'Prediction locked in.', title: 'Now Test It', body: 'Next, build the ionic compound from its ions and read the charge meter.' }
  },

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const chips = [
      ...[1, 2, 3].map(i => inTray(ionChip(`m${i}`, 'Mg', { x: 0, y: 0 }), 'bin')),
      ...[1, 2, 3, 4, 5].map(i => inTray(ionChip(`c${i}`, 'Cl', { x: 0, y: 0 }), 'bin'))
    ];
    return {
      id: 's2-group',
      title: 'Build the Group',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `You guessed ${GUESS[g]}. ` : '';
        return `${guess}What is the smallest group of Mg²⁺ and Cl⁻ ions that has no charge?`;
      },
      widget,
      table: potTable({
        pieces: chips,
        fixtures: [needleFixture('needle', { x: 138, y: 36 }, { tray: 'cell' })],
        zones: { trays: [trayOf('bin', 'Ions', 32, 36, 4, 2), trayOf('cell', 'Tray', 94, 36, 4, 2)] }
      }),
      hints: [
        'Look at the ions tray, the sample tray and the charge meter.',
        'Compare the charge meter reading after you add each ion to the tray.',
        'The charges must add to zero, with no extra copy of the whole group.'
      ],
      check(state) {
        const t = state.table;
        const chips = inCell(t, 'cell');
        if (!chips.length) return { ok: false, notYet: true, msg: 'Move ions into the tray.' };
        const c = countsOf(chips);
        const q = needleRead(t, 'needle').charge;
        const mg = c.Mg || 0; const cl = c.Cl || 0;
        if (mg === MG_CL.nCat && cl === MG_CL.nAn && Object.keys(c).length === 2) return { ok: true };
        if (q !== 0) return { ok: false, msg: `The charge meter reads ${signed(q)} with ${mg} Mg and ${cl} Cl in the tray.` };
        return { ok: false, msg: `The charge meter reads 0, and the tray holds one group twice over: ${mg} Mg and ${cl} Cl.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS[g] ? (g === GUESS_RIGHT ? 'The charge meter agreed with your guess. ' : 'The charge meter did not agree with your guess, which is how a guess gets better. ') : '';
        return {
          log: 'The charge meter rests on 0 for 1 Mg and 2 Cl.',
          title: 'The Ionic Formula',
          body: `${verdict}One Mg²⁺ and two Cl⁻ add up to zero, so the ionic formula is MgCl₂.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const lab = labelerFixture('lab', { x: 116, y: 45 }, { parts: [null, null], title: 'Label' });
    const names = ['sodium', 'magnesium', 'chlorine', 'chloride', 'oxygen', 'oxide'];
    return {
      id: 's3-ide',
      title: 'Name the Compound',
      briefing: {
        speaker: SPEAKER,
        body: 'To name a two-element ionic compound, write the metal ion first and change the nonmetal ion\'s ending to -ide.'
      },
      prompt: 'What is the compound of Mg²⁺ and O²⁻ called?',
      widget,
      table: potTable({
        pieces: [
          { ...ionChip('mg', 'Mg', { x: 0, y: 0 }), zone: 'tray:cell', fixed: true },
          { ...ionChip('ox', 'O', { x: 0, y: 0 }), zone: 'tray:cell', fixed: true },
          ...names.map((n, i) => tagAt(`w_${n}`, n, 15 + (i % 3) * 27, 40 + Math.floor(i / 3) * 14))
        ],
        fixtures: [lab.fixture, plaqueFixture('example', 'Example', { x: 120, y: 13 }, ['K⁺ with Br⁻ is called', 'potassium bromide'], { w: 52 })],
        zones: { trays: [trayOf('cell', 'Tray', 28, 18, 2, 1)], slots: lab.slots }
      }),
      hints: [
        'Look at the name cards, the example plate and the label slots.',
        'Compare the ions in the tray with the example on the plate.',
        'Name the metal first, then change the nonmetal\'s ending the way the example does.'
      ],
      check(state) {
        const w = labelWords(state.table, 'lab');
        if (!w[0] && !w[1]) return { ok: false, notYet: true, msg: 'Lay a name card in each slot of the label.' };
        if (!w[0] || !w[1]) return { ok: false, notYet: true, msg: 'Lay a name card in each slot of the label.' };
        if (wordsText(w) === NAME_MGO) return { ok: true };
        return { ok: false, msg: `The label reads "${wordsText(w)}". The tray holds Mg²⁺ and O²⁻.` };
      },
      reward: {
        log: 'Mg²⁺ with O²⁻ is magnesium oxide.',
        title: 'Naming Ionic Compounds',
        body: 'The metal keeps its name and the nonmetal ion ends in -ide: magnesium oxide.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const A = groupIons(FE_A); const B = groupIons(FE_B);
    const mk = (prefix, ions, tray) => ions.map((ion, i) => ({ ...ionChip(`${prefix}${i + 1}`, ion, { x: 0, y: 0 }, { hide: ion.startsWith('Fe') }), zone: `tray:${tray}`, fixed: true }));
    const la = labelerFixture('la', { x: 92, y: 14 }, { parts: ['iron(', null, ') oxide'], slotW: 22, slotH: 10.5, gap: 0.4, pad: 3, title: 'Label A' });
    const lb = labelerFixture('lb', { x: 104, y: 46 }, { parts: ['iron(', null, ') oxide'], slotW: 22, slotH: 10.5, gap: 0.4, pad: 3, title: 'Label B' });
    const numerals = ['I', 'II', 'III', 'IV'];
    return {
      id: 's4-numeral',
      title: 'Name the Iron Oxides',
      briefing: {
        speaker: SPEAKER,
        body: 'Some metals form ions with more than one charge. The name then gives the charge of one metal ion as a Roman numeral in brackets.'
      },
      prompt: 'What is the iron oxide in each tray called?',
      widget,
      table: potTable({
        pieces: [
          ...mk('a', A, 'ca'), ...mk('b', B, 'cb'),
          ...numerals.map((n, i) => chipAt(`n${n}`, `(${n})`, 140, 9 + i * 15))
        ],
        fixtures: [
          needleFixture('na', { x: 47, y: 13 }, { tray: 'ca' }), needleFixture('nb', { x: 62, y: 46 }, { tray: 'cb' }),
          la.fixture, lb.fixture
        ],
        zones: { trays: [trayOf('ca', 'Tray A', 20, 14, 2, 1), trayOf('cb', 'Tray B', 27, 46, 3, 2)], slots: [...la.slots, ...lb.slots] }
      }),
      hints: [
        'Look at the numeral cards and the slot in each label.',
        'Each iron ion prints no charge, so the charge meter shows only the oxide ions\' total.',
        'Each tray has no charge overall, so its iron ions must cancel that negative total.'
      ],
      check(state) {
        const t = state.table;
        const wa = labelWords(t, 'la')[0]; const wb = labelWords(t, 'lb')[0];
        if (!wa && !wb) return { ok: false, notYet: true, msg: 'Lay a numeral card in the slot of each label.' };
        if (!wa || !wb) return { ok: false, notYet: true, msg: 'Lay a numeral card in the slot of each label.' };
        const want = ['ca', 'cb'].map(tray => {
          const chips = inCell(t, tray);
          const nFe = chips.filter(p => p.props.hide).length;
          return `(${romanOf(metalChargeFrom(needleRead(t, tray === 'ca' ? 'na' : 'nb').charge, nFe))})`;
        });
        if (wa === want[0] && wb === want[1]) return { ok: true };
        const bad = wa !== want[0] ? 'A' : 'B';
        const tray = bad === 'A' ? 'ca' : 'cb';
        const chips = inCell(t, tray);
        const nFe = chips.filter(p => p.props.hide).length;
        return { ok: false, msg: `Tray ${bad} holds ${nFe} Fe, and its charge meter reads ${signed(needleRead(t, bad === 'A' ? 'na' : 'nb').charge)}; its label says ${bad === 'A' ? wa : wb}.` };
      },
      reward: {
        log: 'FeO is iron(II) oxide; Fe₂O₃ is iron(III) oxide.',
        title: 'The Roman Numeral',
        body: 'One iron cancels −2 in FeO and two irons cancel −6 in Fe₂O₃, so they are iron(II) oxide and iron(III) oxide.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const win = windowFixture('win', { x: 40, y: 17 }, { mode: 'salt', w: 76, h: 32 });
    const fm = labelerFixture('fm', { x: 95, y: 47 }, { parts: [null, null, null, null, null], slotW: 19, slotH: 10.5, pad: 2.5, title: 'Formula' });
    const toks = ['Ca', 'NO₃', '(', ')', '₂', '₃'];
    return {
      id: 's5-dissolve',
      title: 'Write the Formula',
      briefing: {
        speaker: SPEAKER,
        body: 'A polyatomic ion is a group of atoms that stays together and carries one charge. Put brackets around it when there is more than one.'
      },
      prompt: 'What is the formula of the compound in Sample B?',
      widget,
      table: potTable({
        pieces: [
          crate('cra', 'Sample A', { x: 14, y: 41 }, { content: { type: 'salt', ...SALT_A, charges: 'none' } }),
          crate('crb', 'Sample B', { x: 14, y: 55 }, { content: { type: 'salt', ...SALT_B, charges: 'none' } }),
          ...toks.map((n, i) => inTray(chipAt(`f_${i}`, n, 0, 0), 'cards'))
        ],
        fixtures: [win.fixture, fm.fixture],
        zones: { trays: [cardsTray()], slots: [win.slot, ...fm.slots] }
      }),
      hints: [
        'Dissolve each sample in the particle view, then look at the formula cards.',
        'Compare what is in the water for Sample A with Sample B, and notice which atoms stay joined.',
        'Count how many Ca and NO₃ pieces are in Sample B, then write each kind of ion once with its count.'
      ],
      check(state) {
        const t = state.table;
        const row = labelWords(t, 'fm');
        if (row.every(x => !x)) return { ok: false, notYet: true, msg: 'Lay cards in the slots to write a formula.' };
        const text = spell(row);
        if (text === FORMULA_B) return { ok: true };
        const atoms = atomsOfSpelled(text);
        const want = saltInWater(SALT_B.cat, SALT_B.an).atoms;
        if (!atoms) return { ok: false, msg: `The strip reads "${row.join('')}", which does not read as a formula.` };
        return { ok: false, msg: `The strip holds ${atomsText(atoms)}; the particle view drew ${atomsText(want)} in Sample B.` };
      },
      reward: {
        log: 'Sample B is calcium nitrate, Ca(NO₃)₂.',
        title: 'Polyatomic Ions',
        body: 'Each NO₃⁻ ion stays whole, and one Ca²⁺ needs two of them: Ca(NO₃)₂.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const win = windowFixture('win', { x: 34, y: 17 }, { mode: 'molecule', w: 64, h: 32 });
    const lab = labelerFixture('lab', { x: 67, y: 47 }, { parts: [null, 'nitrogen', null, 'oxide'], slotW: 22, slotH: 10.5, pad: 3, title: 'Label' });
    const nums = ['mono', 'di', 'tri', 'tetra', 'penta'];
    return {
      id: 's6-prefix',
      title: 'Name the Molecule',
      briefing: {
        speaker: SPEAKER,
        body: 'Two nonmetals form molecules, not ions, so there are no charges to cancel. The name counts the atoms of each element with a prefix.'
      },
      prompt: 'What is the compound in Sample B called?',
      widget,
      table: potTable({
        pieces: [
          crate('cra', 'Sample A', { x: 14, y: 41 }, { shown: nameMolecular(MOL_A), content: { type: 'molecule', formula: MOL_A } }),
          crate('crb', 'Sample B', { x: 14, y: 55 }, { content: { type: 'molecule', formula: MOL_B } }),
          ...nums.map((n, i) => inTray(chipAt(`p_${n}`, n, 0, 0), 'cards'))
        ],
        fixtures: [win.fixture, lab.fixture, plaqueFixture('counts', 'Prefixes', { x: 128, y: 41 }, ['mono 1 · di 2 · tri 3', 'tetra 4 · penta 5'], { w: 40 })],
        zones: { trays: [cardsTray()], slots: [win.slot, ...lab.slots] }
      }),
      hints: [
        'Look at each sample in the particle view, then at the prefix cards.',
        'Compare the atoms drawn in the particle view with the prefix plate.',
        'Each molecular prefix says how many atoms of that element are in one molecule.'
      ],
      check(state) {
        const t = state.table;
        const w = labelWords(t, 'lab');
        if (!w[0] && !w[1]) return { ok: false, notYet: true, msg: 'Lay a card in each slot of the label.' };
        if (!w[0] || !w[1]) return { ok: false, notYet: true, msg: 'Lay a card in each slot of the label.' };
        const text = `${w[0]}nitrogen ${w[1]}oxide`;
        if (squashName(text) === squashName(nameMolecular(MOL_B))) return { ok: true };
        const drawn = countDrawn(moleculeAtoms(MOL_B));
        return { ok: false, msg: `The label reads "${text}"; the particle view draws ${atomsText(drawn)} in Sample B.` };
      },
      reward: {
        log: 'N₂O₄ is dinitrogen tetroxide.',
        title: 'Molecular Prefixes',
        body: 'Two nitrogens and four oxygens: dinitrogen tetroxide (dropping the a before oxide).'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const la = labelerFixture('aa', { x: 26, y: 35 }, { parts: [null, 'acid'], title: 'Label A', pad: 2, slotH: 12.5 });
    const lb = labelerFixture('ab', { x: 74, y: 35 }, { parts: [null, 'acid'], title: 'Label B', pad: 2, slotH: 12.5 });
    const names = ['hydrochloric', 'nitric', 'chloric', 'hydronitric'];
    return {
      id: 's7-acid',
      title: 'Name the Acids',
      briefing: {
        speaker: SPEAKER,
        body: 'An acid releases H⁺ in water. When the negative ion ends in -ide, the acid name starts with hydro- and ends in -ic; when it ends in -ate, there is no hydro-.'
      },
      prompt: 'What is the acid made of the ions in each tray called?',
      widget,
      table: potTable({
        pieces: [
          { ...ionChip('ha', 'H', { x: 0, y: 0 }), zone: 'tray:ca', fixed: true }, { ...ionChip('cl', 'Cl', { x: 0, y: 0 }), zone: 'tray:ca', fixed: true },
          { ...ionChip('hb', 'H', { x: 0, y: 0 }), zone: 'tray:cb', fixed: true }, { ...ionChip('no', 'NO3', { x: 0, y: 0 }), zone: 'tray:cb', fixed: true },
          ...names.map((n, i) => tagAt(`a_${n}`, n, 112, 9 + i * 13))
        ],
        fixtures: [la.fixture, lb.fixture, plaqueFixture('ex', 'Examples', { x: 50, y: 55.7 }, ['HBr: hydrobromic acid', 'H₂SO₄: sulfuric acid'], { w: 56 })],
        zones: { trays: [trayOf('ca', 'Tray A', 26, 12.5, 2, 1), trayOf('cb', 'Tray B', 74, 12.5, 2, 1)], slots: [...la.slots, ...lb.slots] }
      }),
      hints: [
        'Look at the acid cards and the slot in each label.',
        'Compare the negative ion in each tray with the examples on the plate.',
        'The first word comes from the negative ion\'s name, changed the way the examples change theirs.'
      ],
      check(state) {
        const t = state.table;
        const wa = labelWords(t, 'aa')[0]; const wb = labelWords(t, 'ab')[0];
        if (!wa && !wb) return { ok: false, notYet: true, msg: 'Lay a card in the slot of each label.' };
        if (!wa || !wb) return { ok: false, notYet: true, msg: 'Lay a card in the slot of each label.' };
        const want = [acidWord('HCl'), acidWord('HNO3')];
        if (wa === want[0] && wb === want[1]) return { ok: true };
        const bad = wa !== want[0] ? 'A' : 'B';
        return { ok: false, msg: `Tray ${bad} holds H⁺ and ${bad === 'A' ? 'Cl⁻' : 'NO₃⁻'}; its label starts with ${bad === 'A' ? wa : wb}.` };
      },
      reward: {
        log: 'HCl is hydrochloric acid; HNO₃ is nitric acid.',
        title: 'Acid Names',
        body: 'H⁺ with Cl⁻ is hydrochloric acid, and H⁺ with nitrate, NO₃⁻, is nitric acid.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const win = windowFixture('win', { x: 40, y: 17 }, { mode: 'salt', w: 76, h: 32 });
    const lab = labelerFixture('lab', { x: 82, y: 47 }, { parts: [null, null, null], slotW: 22, slotH: 10.5, pad: 3, title: 'Label' });
    const toks = ['iron', 'copper', '(II)', '(III)', 'sulfate', 'nitrate'];
    return {
      id: 's8-sealed',
      title: 'The Unmarked Drum',
      prompt: 'What is the compound in the unmarked drum called?',
      widget,
      table: potTable({
        pieces: [
          crate('crx', 'Drum', { x: 14, y: 46 }, { content: { type: 'salt', ...SEALED, hide: [SEALED.cat] } }),
          ...toks.map((n, i) => inTray(chipAt(`k_${i}`, n, 0, 0), 'cards'))
        ],
        fixtures: [win.fixture, lab.fixture, plaqueFixture('names', 'Ion names', { x: 135, y: 47 }, ['NO₃⁻ nitrate', 'SO₄²⁻ sulfate'], { w: 28 })],
        zones: { trays: [cardsTray()], slots: [win.slot, ...lab.slots] }
      }),
      hints: [
        'Dissolve the drum in the particle view, then look at the ion-name plate and the label.',
        'Compare the pieces in the water with the ion names on the plate, and count each kind.',
        'The ions together have no charge, and only the sulfate\'s charge is printed.'
      ],
      check(state) {
        const t = state.table;
        const w = labelWords(t, 'lab');
        if (w.every(x => !x)) return { ok: false, notYet: true, msg: 'Lay a card in each slot of the label.' };
        if (w.some(x => !x)) return { ok: false, notYet: true, msg: 'Lay a card in each slot of the label.' };
        const text = `${w[0]}${w[1]} ${w[2]}`;
        if (text === nameIonic(SEALED.cat, SEALED.an)) return { ok: true };
        const water = saltInWater(SEALED.cat, SEALED.an);
        const metal = water.pieces[0]; const anion = water.pieces[1];
        return { ok: false, msg: `The label reads "${text}"; the particle view drew ${metal.count} Fe with no charge printed and ${anion.count} joined groups printing ${IONS[anion.ion].q < 0 ? '' : '+'}${String(IONS[anion.ion].q).replace('-', '−')}.` };
      },
      reward: {
        log: 'The unmarked drum is iron(III) sulfate.',
        title: 'The Unmarked Drum',
        body: 'Three SO₄²⁻ carry −6, so each of the two irons is 3+: iron(III) sulfate, Fe₂(SO₄)₃.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Drag ions from the supply tray into the tray.'],
  3: ['Drag a name card into each slot of the label.'],
  4: ['The Roman numeral in brackets is the charge of one iron ion.', 'Drag a numeral card into the slot of each label.'],
  5: ['Seat a sample in the particle view, press Dissolve, then fill the formula strip.'],
  6: ['Seat a sample in the particle view, press Look, then fill the label.'],
  7: ['Drag an acid card into the slot of each label.'],
  8: ['Seat the drum in the particle view, press Dissolve, then fill the label.']
};
applyNotes(STAGES, NOTES);

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'What You Found',
      body: 'A formula counts the ions in the smallest group with no charge, and a Roman numeral in a name is the charge of one metal ion. The foundry ore is iron(III) oxide, Fe₂O₃.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const run = id => ({ run: id });

export const SOLUTIONS = [
  [put('g2', 'slot:guess')],
  [put('m1', 'tray:cell'), put('c1', 'tray:cell'), put('c2', 'tray:cell')],
  [put('w_magnesium', 'slot:lab.s1'), put('w_oxide', 'slot:lab.s2')],
  [put('nII', 'slot:la.s1'), put('nIII', 'slot:lb.s1')],
  [put('crb', 'slot:win.seat'), run('win'), put('f_0', 'slot:fm.s1'), put('f_2', 'slot:fm.s2'), put('f_1', 'slot:fm.s3'), put('f_3', 'slot:fm.s4'), put('f_4', 'slot:fm.s5')],
  [put('crb', 'slot:win.seat'), run('win'), put('p_di', 'slot:lab.s1'), put('p_tetra', 'slot:lab.s2')],
  [put('a_hydrochloric', 'slot:aa.s1'), put('a_nitric', 'slot:ab.s1')],
  [put('crx', 'slot:win.seat'), run('win'), put('k_0', 'slot:lab.s1'), put('k_3', 'slot:lab.s2'), put('k_4', 'slot:lab.s3')]
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [],
  [put('m1', 'tray:cell'), put('c1', 'tray:cell')],
  [put('w_magnesium', 'slot:lab.s1'), put('w_oxygen', 'slot:lab.s2')],
  [put('nI', 'slot:la.s1'), put('nII', 'slot:lb.s1')],
  [put('crb', 'slot:win.seat'), run('win'), put('f_0', 'slot:fm.s1'), put('f_1', 'slot:fm.s2'), put('f_4', 'slot:fm.s3')],
  [put('crb', 'slot:win.seat'), run('win'), put('p_mono', 'slot:lab.s1'), put('p_tetra', 'slot:lab.s2')],
  [put('a_chloric', 'slot:aa.s1'), put('a_nitric', 'slot:ab.s1')],
  [put('crx', 'slot:win.seat'), run('win'), put('k_0', 'slot:lab.s1'), put('k_2', 'slot:lab.s2'), put('k_4', 'slot:lab.s3')]
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
    STAGES, DEBRIEF, blankState, toolNoteFor, room: ROOM,
    onLoad() { /* the table is the stage */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

/* Exported for `verify:learn`, which holds every graded figure to the real tables. */
export const CHECKS = {
  GUESS, GUESS_RIGHT, MG_CL, NAME_MGO, FE_A, FE_B, SALT_A, SALT_B, FORMULA_B, MOL_A, MOL_B, SEALED,
  answers: {
    mgcl: [MG_CL.nCat, MG_CL.nAn], mgo: NAME_MGO, feo: nameIonic(FE_A.cat, FE_A.an), fe2o3: nameIonic(FE_B.cat, FE_B.an), caNo3: FORMULA_B,
    n2o4: nameMolecular(MOL_B), hcl: nameAcid('HCl'), hno3: nameAcid('HNO3'), sealed: nameIonic(SEALED.cat, SEALED.an)
  }
};
export { windowRead, needleRead, labelWords, printedCharge, parseFormula, lower };
