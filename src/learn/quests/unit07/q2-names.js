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
  { term: /\bionic formulas?\b/i, introducedAt: 2 },
  { term: /\bnaming ionic compounds?\b/i, introducedAt: 3 },
  { term: /\broman numerals?\b/i, introducedAt: 4 },
  { term: /\bpolyatomic\b/i, introducedAt: 5 },
  { term: /\bmolecular prefix(es)?\b/i, introducedAt: 6 },
  { term: /\bacid names?\b/i, introducedAt: 7 }
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

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 's1-predict',
    title: 'What Magnesium and Chlorine Make',
    predict: true,
    prompt: 'Choose the formula you expect for the compound that Mg²⁺ and Cl⁻ ions make.',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => tagAt(id, label, 20 + (i % 3) * 30, 14 + Math.floor(i / 3) * 16)),
      fixtures: [plaqueFixture('ions', 'The two ions', { x: 116, y: 12 }, ['Mg²⁺ and Cl⁻'], { w: 40 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 116, y: 40 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the five cards and the slot.',
      'Compare the charge on one magnesium ion with the charge on one chlorine ion.',
      'A compound has no charge overall, so the ions have to be counted until their charges cancel.'
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
    reward: { log: 'Prediction locked in.', title: 'Now Test It', body: 'Next, build the compound out of ion chips in a cell and read the charge needle.' }
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
        return `${guess}Build the smallest group of Mg²⁺ and Cl⁻ chips in the cell that has no charge.`;
      },
      widget,
      table: potTable({
        pieces: chips,
        fixtures: [needleFixture('needle', { x: 138, y: 36 }, { tray: 'cell' })],
        zones: { trays: [trayOf('bin', 'Ions', 32, 36, 4, 2), trayOf('cell', 'Cell', 94, 36, 4, 2)] }
      }),
      hints: [
        'Use the supply tray, the cell and the charge needle.',
        'Compare the needle reading after you add each kind of chip to the cell.',
        'Add chips until the charges cancel, then check that the cell does not hold a smaller group that would also cancel.'
      ],
      check(state) {
        const t = state.table;
        const chips = inCell(t, 'cell');
        if (!chips.length) return { ok: false, notYet: true, msg: 'Move chips into the cell.' };
        const c = countsOf(chips);
        const q = needleRead(t, 'needle').charge;
        const mg = c.Mg || 0; const cl = c.Cl || 0;
        if (mg === MG_CL.nCat && cl === MG_CL.nAn && Object.keys(c).length === 2) return { ok: true };
        if (q !== 0) return { ok: false, msg: `The needle reads ${signed(q)} with ${mg} Mg and ${cl} Cl in the cell.` };
        return { ok: false, msg: `The needle reads 0, and the cell holds one group twice over: ${mg} Mg and ${cl} Cl.` };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS[g] ? (g === GUESS_RIGHT ? 'The needle agreed with your guess. ' : 'The needle did not agree with your guess, which is how a guess gets better. ') : '';
        return {
          log: 'The needle rests on 0 for 1 Mg and 2 Cl.',
          title: 'The Ionic Formula',
          body: `${verdict}The needle rests on 0 when the charges cancel: Mg²⁺ with two Cl⁻. The ionic formula MgCl₂ counts the ions of the smallest group that has no charge.`
        };
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const lab = labelerFixture('lab', { x: 114, y: 45 }, { title: 'Label' });
    const names = ['sodium', 'magnesium', 'chlorine', 'chloride', 'oxygen', 'oxide'];
    return {
      id: 's3-ide',
      title: 'Name the Compound',
      prompt: 'Write the name of the compound in the cell on the label.',
      widget,
      table: potTable({
        pieces: [
          { ...ionChip('mg', 'Mg', { x: 0, y: 0 }), zone: 'tray:cell', fixed: true },
          { ...ionChip('ox', 'O', { x: 0, y: 0 }), zone: 'tray:cell', fixed: true },
          ...names.map((n, i) => tagAt(`w_${n}`, n, 17 + (i % 3) * 30, 44 + Math.floor(i / 3) * 14))
        ],
        fixtures: [lab.fixture, plaqueFixture('example', 'Example', { x: 120, y: 13 }, ['K⁺ with Br⁻ is called', 'potassium bromide'], { w: 52 })],
        zones: { trays: [trayOf('cell', 'Cell', 28, 18, 2, 1)], slots: lab.slots }
      }),
      hints: [
        'Use the name cards and the two slots on the label.',
        'Compare each chip in the cell with the example on the plate.',
        'Name the metal first, then the other ion the way the example names its second ion.'
      ],
      check(state) {
        const w = labelWords(state.table, 'lab');
        if (!w[0] && !w[1]) return { ok: false, notYet: true, msg: 'Lay a name card in each slot of the label.' };
        if (!w[0] || !w[1]) return { ok: false, notYet: true, msg: 'Lay a name card in each slot of the label.' };
        if (wordsText(w) === NAME_MGO) return { ok: true };
        return { ok: false, msg: `The label reads "${wordsText(w)}". The cell holds a Mg chip printing 2+ and an O chip printing 2−.` };
      },
      reward: {
        log: 'Mg²⁺ with O²⁻ is magnesium oxide.',
        title: 'Naming Ionic Compounds',
        body: 'Naming ionic compounds follows one pattern: the metal keeps its name, and the other ion takes the ending -ide. Mg²⁺ with O²⁻ is magnesium oxide; oxygen is the name of the element, oxide the name of its ion.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const A = groupIons(FE_A); const B = groupIons(FE_B);
    const mk = (prefix, ions, tray) => ions.map((ion, i) => ({ ...ionChip(`${prefix}${i + 1}`, ion, { x: 0, y: 0 }, { hide: ion.startsWith('Fe') }), zone: `tray:${tray}`, fixed: true }));
    const la = labelerFixture('la', { x: 96, y: 17 }, { parts: ['iron(', null, ') oxide'], slotW: 22, slotH: 10.5, gap: 0.4, pad: 3, title: 'Label A' });
    const lb = labelerFixture('lb', { x: 104, y: 47 }, { parts: ['iron(', null, ') oxide'], slotW: 22, slotH: 10.5, gap: 0.4, pad: 3, title: 'Label B' });
    const numerals = ['I', 'II', 'III', 'IV'];
    return {
      id: 's4-numeral',
      title: 'Name the Iron Oxides',
      prompt: 'Write the name of the compound in each cell on its label.',
      widget,
      table: potTable({
        pieces: [
          ...mk('a', A, 'ca'), ...mk('b', B, 'cb'),
          ...numerals.map((n, i) => chipAt(`n${n}`, `(${n})`, 140, 9 + i * 15))
        ],
        fixtures: [
          needleFixture('na', { x: 50, y: 15 }, { tray: 'ca' }), needleFixture('nb', { x: 62, y: 46 }, { tray: 'cb' }),
          la.fixture, lb.fixture,
          plaqueFixture('how', 'The number in brackets', { x: 36, y: 58 }, ['It is the charge of one iron ion.'], { w: 56 })
        ],
        zones: { trays: [trayOf('ca', 'Cell A', 20, 16, 2, 1), trayOf('cb', 'Cell B', 27, 46, 3, 2)], slots: [...la.slots, ...lb.slots] }
      }),
      hints: [
        'Use the numeral cards and the slot in each label.',
        'Compare each needle reading with the number of iron chips in its cell, which print no charge.',
        'A cell has no charge overall, so its irons must cancel the needle, and the numeral is the charge of one iron.'
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
        return { ok: false, msg: `Cell ${bad} holds ${nFe} Fe, and its needle reads ${signed(needleRead(t, bad === 'A' ? 'na' : 'nb').charge)}; its label says ${bad === 'A' ? wa : wb}.` };
      },
      reward: {
        log: 'FeO is iron(II) oxide; Fe₂O₃ is iron(III) oxide.',
        title: 'The Roman Numeral',
        body: 'A Roman numeral in a name is the charge of one metal ion, not a count of atoms. The needle read −2 over one iron in FeO and −6 over two in Fe₂O₃, so the irons are 2+ and 3+: iron(II) oxide and iron(III) oxide.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const win = windowFixture('win', { x: 40, y: 20 }, { mode: 'salt', w: 76, h: 34 });
    const fm = labelerFixture('fm', { x: 75, y: 50 }, { parts: [null, null, null, null, null, null], slotW: 20, slotH: 10.5, pad: 2.5, title: 'Formula' });
    const toks = ['Ca', 'NO₃', '(', ')', '₂', '₃'];
    return {
      id: 's5-dissolve',
      title: 'Write the Formula',
      prompt: 'Write the formula of the compound in Sample B on the formula strip.',
      widget,
      table: potTable({
        pieces: [
          crate('cra', 'Sample A', { x: 104, y: 9 }, { content: { type: 'salt', ...SALT_A, charges: 'none' } }),
          crate('crb', 'Sample B', { x: 130, y: 9 }, { content: { type: 'salt', ...SALT_B, charges: 'none' } }),
          ...toks.map((n, i) => chipAt(`f_${i}`, n, 100 + (i % 3) * 21, 24 + Math.floor(i / 3) * 10))
        ],
        fixtures: [win.fixture, fm.fixture],
        zones: { slots: [win.slot, ...fm.slots] }
      }),
      hints: [
        'Use the window with its "Dissolve" key on each crate, then the formula cards and the six slots.',
        'Compare what is in the water for Sample A with what is in the water for Sample B, and look at which atoms stay joined.',
        'Write each kind of piece once, put a group of atoms in brackets when it appears more than once, and write how many after it.'
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
        return { ok: false, msg: `The strip holds ${atomsText(atoms)}; the window drew ${atomsText(want)} in Sample B.` };
      },
      reward: {
        log: 'Sample B is calcium nitrate, Ca(NO₃)₂.',
        title: 'Polyatomic Ions',
        body: 'A polyatomic ion is a group of atoms that stays together and carries one charge, like NO₃⁻. When there is more than one in a formula it goes in brackets, so calcium nitrate is Ca(NO₃)₂ and not CaNO₃₂.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const win = windowFixture('win', { x: 38, y: 19 }, { mode: 'molecule', w: 64, h: 34 });
    const lab = labelerFixture('lab', { x: 100, y: 49 }, { parts: [null, 'nitrogen', null, 'oxide'], slotW: 22, slotH: 10.5, pad: 3, title: 'Label' });
    const nums = ['mono', 'di', 'tri', 'tetra', 'penta'];
    return {
      id: 's6-prefix',
      title: 'Name the Molecule',
      prompt: 'Write the name of the compound in Sample B on the label.',
      widget,
      table: potTable({
        pieces: [
          crate('cra', 'Sample A', { x: 84, y: 9 }, { shown: nameMolecular(MOL_A), content: { type: 'molecule', formula: MOL_A } }),
          crate('crb', 'Sample B', { x: 110, y: 9 }, { content: { type: 'molecule', formula: MOL_B } }),
          ...nums.map((n, i) => chipAt(`p_${n}`, n, 82 + (i % 3) * 21, 23 + Math.floor(i / 3) * 10))
        ],
        fixtures: [win.fixture, lab.fixture, plaqueFixture('counts', 'Words for a count', { x: 134, y: 29 }, ['mono 1', 'di 2', 'tri 3', 'tetra 4', 'penta 5'], { w: 24 })],
        zones: { slots: [win.slot, ...lab.slots] }
      }),
      hints: [
        'Use the window with its "Look" key on each crate, then the cards and the two slots on the label.',
        'Compare the atoms drawn in the window with the words for a count on the plate.',
        'Each word for a count says how many atoms of that element the molecule holds.'
      ],
      check(state) {
        const t = state.table;
        const w = labelWords(t, 'lab');
        if (!w[0] && !w[1]) return { ok: false, notYet: true, msg: 'Lay a card in each slot of the label.' };
        if (!w[0] || !w[1]) return { ok: false, notYet: true, msg: 'Lay a card in each slot of the label.' };
        const text = `${w[0]}nitrogen ${w[1]}oxide`;
        if (squashName(text) === squashName(nameMolecular(MOL_B))) return { ok: true };
        const drawn = countDrawn(moleculeAtoms(MOL_B));
        return { ok: false, msg: `The label reads "${text}"; the window draws ${atomsText(drawn)} in Sample B.` };
      },
      reward: {
        log: 'N₂O₄ is dinitrogen tetroxide.',
        title: 'Molecular Prefixes',
        body: 'Molecular prefixes count atoms: di is 2 and tetra is 4, so N₂O₄ is dinitrogen tetroxide. A molecule has no ions and no charges to cancel, so its name counts the atoms instead.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  (() => {
    const la = labelerFixture('aa', { x: 80, y: 16 }, { parts: [null, 'acid'], title: 'Label A', pad: 3, slotH: 12.5 });
    const lb = labelerFixture('ab', { x: 80, y: 46 }, { parts: [null, 'acid'], title: 'Label B', pad: 3, slotH: 12.5 });
    const names = ['hydrochloric', 'nitric', 'chloric', 'hydronitric'];
    return {
      id: 's7-acid',
      title: 'Name the Acids',
      prompt: 'Write the name of the acid made of the ions in each cell on its label.',
      widget,
      table: potTable({
        pieces: [
          { ...ionChip('ha', 'H', { x: 0, y: 0 }), zone: 'tray:ca', fixed: true }, { ...ionChip('cl', 'Cl', { x: 0, y: 0 }), zone: 'tray:ca', fixed: true },
          { ...ionChip('hb', 'H', { x: 0, y: 0 }), zone: 'tray:cb', fixed: true }, { ...ionChip('no', 'NO3', { x: 0, y: 0 }), zone: 'tray:cb', fixed: true },
          ...names.map((n, i) => tagAt(`a_${n}`, n, 134, 9 + i * 15))
        ],
        fixtures: [la.fixture, lb.fixture, plaqueFixture('ex', 'Examples', { x: 36, y: 58 }, ['HBr: hydrobromic acid', 'H₂SO₄: sulfuric acid'], { w: 52 })],
        zones: { trays: [trayOf('ca', 'Cell A', 22, 14, 2, 1), trayOf('cb', 'Cell B', 22, 40, 2, 1)], slots: [...la.slots, ...lb.slots] }
      }),
      hints: [
        'Use the acid cards and the slot in each label.',
        'Compare the negative ion in each cell with the examples on the plate.',
        'The first word comes from the name of the negative ion, changed the way the examples change theirs.'
      ],
      check(state) {
        const t = state.table;
        const wa = labelWords(t, 'aa')[0]; const wb = labelWords(t, 'ab')[0];
        if (!wa && !wb) return { ok: false, notYet: true, msg: 'Lay a card in the slot of each label.' };
        if (!wa || !wb) return { ok: false, notYet: true, msg: 'Lay a card in the slot of each label.' };
        const want = [acidWord('HCl'), acidWord('HNO3')];
        if (wa === want[0] && wb === want[1]) return { ok: true };
        const bad = wa !== want[0] ? 'A' : 'B';
        return { ok: false, msg: `Cell ${bad} holds H and ${bad === 'A' ? 'Cl' : 'NO₃'} chips; its label starts with ${bad === 'A' ? wa : wb}.` };
      },
      reward: {
        log: 'HCl is hydrochloric acid; HNO₃ is nitric acid.',
        title: 'Acid Names',
        body: 'Acid names come from the negative ion that goes with H⁺: Cl⁻ gives hydrochloric acid, and NO₃⁻ (nitrate) gives nitric acid. In water each of these acids releases H⁺.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const win = windowFixture('win', { x: 40, y: 20 }, { mode: 'salt', w: 76, h: 34 });
    const lab = labelerFixture('lab', { x: 75, y: 50 }, { parts: [null, null, null], slotW: 22, slotH: 10.5, pad: 3, title: 'Label' });
    const toks = ['iron', 'copper', '(II)', '(III)', 'sulfate', 'nitrate'];
    return {
      id: 's8-sealed',
      title: 'The Unmarked Crate',
      prompt: 'Write the name of the compound in the unmarked crate on its label.',
      widget,
      table: potTable({
        pieces: [
          crate('crx', 'Crate', { x: 100, y: 9 }, { content: { type: 'salt', ...SEALED, hide: [SEALED.cat] } }),
          ...toks.map((n, i) => chipAt(`k_${i}`, n, 94 + (i % 3) * 21, 25 + Math.floor(i / 3) * 10))
        ],
        fixtures: [win.fixture, lab.fixture, plaqueFixture('names', 'Ion names', { x: 130, y: 9 }, ['NO₃⁻ nitrate', 'SO₄²⁻ sulfate'], { w: 30 })],
        zones: { slots: [win.slot, ...lab.slots] }
      }),
      hints: [
        'Use the window with its "Dissolve" key on the crate, then the cards and the three slots.',
        'Compare the pieces in the water with the ion names on the plate, and count the pieces of each kind.',
        'The pieces have no charge together, so the metal ions must cancel the printed charges, and the numeral is the charge of one metal ion.'
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
        return { ok: false, msg: `The label reads "${text}"; the window drew ${metal.count} Fe with no charge printed and ${anion.count} joined groups printing ${IONS[anion.ion].q < 0 ? '' : '+'}${String(IONS[anion.ion].q).replace('-', '−')}.` };
      },
      reward: {
        log: 'The unmarked crate is iron(III) sulfate.',
        title: 'The Unmarked Crate',
        body: 'The window drew 2 Fe and 3 SO₄ groups of 2−. Six units of negative charge need 6 positive, so each iron is 3+: iron(III) sulfate, Fe₂(SO₄)₃.'
      }
    };
  })()
];

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  1: ['Drag the card you choose into the slot.'],
  2: ['Drag chips from the supply tray into the cell.'],
  3: ['Drag a name card into each slot of the label.'],
  4: ['Drag a numeral card into the slot of each label.'],
  5: ['Seat a crate in the window, press Dissolve, then fill the formula strip.'],
  6: ['Seat a crate in the window, press Look, then fill the label.'],
  7: ['Drag an acid card into the slot of each label.'],
  8: ['Seat the crate in the window, press Dissolve, then fill the label.']
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
