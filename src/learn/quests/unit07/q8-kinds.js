/**
 * Unit 7 · Bench 8 — Kinds of Reaction (q8-kinds)
 *
 * The furnace tapping floor, on the pot kit (`table/kits/pot.js`) with the instruments of `pot-kinds.js`: a particle view that draws a
 * reaction's atoms before and after, a burner and a rig of gas tests, and a board of reaction cards. Every reading is a planner's answer
 * (`engine/reactdata.js`, `engine/reactdata-kinds.js`); nothing is authored.
 *
 *   1  a particle view shows what joins and what splits; file six reactions        -> synthesis, decomposition
 *   2  three unlabelled gas jars, four tests; name each gas                        -> gas tests (before combustion)
 *   3  burn a fuel, try four tests on the gas jar, file what the burning made      -> combustion
 *   4  a particle view rings the hydrogen ion that passes; file five reactions     -> acid-base reaction
 *   5  zinc in copper sulfate: which particle was oxidised, which reduced          -> oxidation, reduction, redox
 *   6  three species worked out; type the oxidation number of Mn in MnO4-          -> oxidation number
 *   7  PREDICT: what kind is burning magnesium?                                    (the held model: one kind only)
 *   8  five reaction cards, a "Look for" dial: light each card under every kind it belongs to
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { remember, recall } from '../../engine/predict.js';
import { applyNotes } from '../../table/notes.js';
import { potTable, jar, plaqueFixture, stmt, tag, chip, seatedIn } from '../../table/kits/pot.js';
import {
  windowFixture, windowRead, burnerFixture, burnerRead, gasrigFixture, rigRead, gjar, rxn, kboardFixture, lookFixture,
  boardRead, filedKinds, kindsOfCard, readingFor, equationOf, workedRows, KINDS, KIND_LABEL
} from '../../table/kits/pot-kinds.js';
import { parseEquation, chargeText, pretty } from '../../engine/reactdata.js';
import { kindsFull, shapeOf, protonTransfer, oxNumbers, electronFlow, gasTest, GAS_TESTS, GAS_TEST_ORDER } from '../../engine/reactdata-kinds.js';

export const meta = { stageCount: 8 };

export const VOCABULARY = [
  { term: /\bsynthesis\b/i, introducedAt: 1 },
  { term: /\bdecomposition\b/i, introducedAt: 1 },
  { term: /\bcombustion\b/i, introducedAt: 3 },
  { term: /\bacid-base\b/i, introducedAt: 4 },
  { term: /\boxidi[sz](?:ation|ed|e)\b/i, introducedAt: 5 },
  { term: /\breduction\b|\breduced\b/i, introducedAt: 5 },
  { term: /\bredox\b/i, introducedAt: 5 },
  { term: /\boxidation numbers?\b/i, introducedAt: 6 }
];

/** The moles of an equation are the stoichiometry bench's. */
export const BUILDS_ON = ['unit07/q6-stoich'];

export const ROOM = 'foundry';

const SPEAKER = 'Vess';
export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const QUEST_KEY = 'unit07/q8-kinds';

/* ------------------------------------------------------------------
   THE CASES
   ------------------------------------------------------------------ */

const eqOf = text => equationOf(text);

// Stage 1: six reactions. Two join, two split, two do neither.
const S1_POTS = [
  { id: 'pa', name: 'Vessel A', eq: '2 H2 + O2 -> 2 H2O' },
  { id: 'pb', name: 'Vessel B', eq: 'CaCO3 -> CaO + CO2' },
  { id: 'pc', name: 'Vessel C', eq: 'Zn + CuSO4 -> ZnSO4 + Cu' },
  { id: 'pd', name: 'Vessel D', eq: '2 H2O -> 2 H2 + O2' },
  { id: 'pe', name: 'Vessel E', eq: 'N2 + 3 H2 -> 2 NH3' },
  { id: 'pf', name: 'Vessel F', eq: 'CH4 + 2 O2 -> CO2 + 2 H2O' }
];
const SHAPE_TRAY = { 'many-to-one': 'join', 'one-to-many': 'split', neither: 'neither' };
const S1_TRAYS = [
  { id: 'join', label: 'Synthesis' },
  { id: 'split', label: 'Decomposition' },
  { id: 'neither', label: 'Neither' }
];

// Stage 2: three unlabelled gases, and a name that matches none.
const S2_SAMPLES = [
  { id: 'ga', name: 'Sample A', gas: 'CO2' },
  { id: 'gb', name: 'Sample B', gas: 'H2' },
  { id: 'gc', name: 'Sample C', gas: 'O2' }
];
const S2_NAMES = [
  { id: 'nO2', label: 'Oxygen', gas: 'O2' },
  { id: 'nH2', label: 'Hydrogen', gas: 'H2' },
  { id: 'nCO2', label: 'Carbon dioxide', gas: 'CO2' },
  { id: 'nN2', label: 'Nitrogen', gas: 'N2' }
];

// Stage 3: methane burns in plenty of oxygen.
const FUEL = 'CH4';
const BURN_FILES = [
  { id: 'co2', label: 'Carbon dioxide', gas: 'CO2' },
  { id: 'water', label: 'Water', gas: 'H2O' },
  { id: 'carbon', label: 'Carbon', gas: 'C' },
  { id: 'hydrogen', label: 'Hydrogen', gas: 'H2' }
];

// Stage 4: five reactions. A hydrogen ion passes in two of them.
const S4_POTS = [
  { id: 'pa', name: 'Vessel A', eq: 'HCl + NaOH -> NaCl + H2O' },
  { id: 'pb', name: 'Vessel B', eq: '2 Na + Cl2 -> 2 NaCl' },
  { id: 'pc', name: 'Vessel C', eq: 'NH3 + HCl -> NH4Cl' },
  { id: 'pd', name: 'Vessel D', eq: 'CH4 + 2 O2 -> CO2 + 2 H2O' },
  { id: 'pe', name: 'Vessel E', eq: 'Mg + 2 HCl -> MgCl2 + H2' }
];
const S4_TRAYS = [
  { id: 'ring', label: 'Acid-base' },
  { id: 'none', label: 'Not acid-base' }
];

// Stage 5: zinc in copper sulfate.
const S5_EQ = 'Zn + CuSO4 -> ZnSO4 + Cu';
const S5_PARTS = [
  { id: 'zn', label: 'Zn', el: 'Zn' },
  { id: 'cu', label: `Cu${chargeText(2)}`, el: 'Cu' },
  { id: 'so4', label: `SO₄${chargeText(-2)}`, el: 'SO4' }
];

// Stage 6: three worked species, one asked.
const S6_WORKED = [
  { name: 'CO₂', species: 'CO2', charge: 0 },
  { name: `NO₃${chargeText(-1)}`, species: 'NO3', charge: -1 },
  { name: `SO₄${chargeText(-2)}`, species: 'SO4', charge: -2 }
];
const S6_ASKED = { species: 'MnO4', charge: -1, element: 'Mn' };
const MN_NUMBER = oxNumbers(S6_ASKED.species, S6_ASKED.charge)[S6_ASKED.element];

// Stage 7 and 8: five reaction cards on the furnace log.
const S8_CARDS = [
  { id: 'zn', eq: 'Zn(s) + CuSO4(aq) -> ZnSO4(aq) + Cu(s)' },
  { id: 'mg', eq: '2 Mg(s) + O2(g) -> 2 MgO(s)' },
  { id: 'acid', eq: 'HCl(aq) + NaOH(aq) -> NaCl(aq) + H2O(l)' },
  { id: 'lime', eq: 'CaCO3(s) -> CaO(s) + CO2(g)' },
  { id: 'ch4', eq: 'CH4(g) + 2 O2(g) -> CO2(g) + 2 H2O(g)' }
];
const GUESS = { one_syn: 'Synthesis only', one_comb: 'Combustion only', one_redox: 'Redox only', many: 'More than one kind' };

/* ------------------------------------------------------------------
   HELPERS
   ------------------------------------------------------------------ */

const trayOf = (t, id) => (t.pieces[id]?.zone || '').replace(/^tray:/, '') || null;
const slotOf = (t, id) => (t.pieces[id]?.zone || '').replace(/^slot:/, '') || null;
const ranPot = (t, fid, idx) => t.recorder.rows.some(r => r.label === `${fid}|${idx}`);
const count = (eq, side) => (side === 'lhs' ? eq.lhs.length : eq.rhs.length);
const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;
const sgn = v => (v > 0 ? `+${v}` : String(v).replace('-', '−'));

/** A sort of reactions into trays by what the particle view showed: shared check of stages 1 and 4. */
function sortCheck(state, pots, trays, truthOf, why) {
  const t = state.table;
  const where = pots.map(p => ({ p, tray: trayOf(t, p.id) }));
  if (where.every(w => !w.tray)) return { ok: false, notYet: true, msg: 'Put each card in a tray.' };
  const loose = where.find(w => !w.tray);
  const wrong = where.find(w => w.tray && w.tray !== truthOf(w.p));
  if (!wrong && !loose) return { ok: true };
  if (wrong) return { ok: false, msg: why(wrong.p, wrong.tray, pots.indexOf(wrong.p), t) };
  return { ok: false, notYet: true, msg: `${loose.p.name} is not in a tray yet.` };
}
const trayLabel = (trays, id) => trays.find(x => x.id === id)?.label || id;

const trayZone = (trays, at0, step, size) => trays.map((tr, i) => ({ id: tr.id, label: tr.label, at: { x: at0.x, y: at0.y + i * step }, size, cell: size.cell, cellH: size.cellH }));

/* ------------------------------------------------------------------
   THE EIGHT STAGES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const w = windowFixture('win', { x: 44, y: 26 }, { mode: 'pieces', cases: S1_POTS.map(p => ({ name: p.name, eq: p.eq })), dialLabel: 'Vessel', title: 'Particle view' });
    return {
      id: 's1-pieces',
      title: 'Join or Split',
      briefing: {
        title: 'Synthesis and Decomposition',
        body: 'In a synthesis, two or more substances join into one. In a decomposition, one substance breaks into two or more.'
      },
      prompt: 'Which reactions are a synthesis, which a decomposition and which neither?',
      widget,
      table: potTable({
        pieces: S1_POTS.map((p, i) => chip(p.id, p.name, { x: 10.5 + i * 18.6, y: 57.6 })),
        fixtures: [w],
        zones: { trays: trayZone(S1_TRAYS, { x: 131.2, y: 12 }, 20, { w: 36, h: 14, cell: 18, cellH: 10 }) }
      }),
      hints: [
        'Use the "Vessel" dial and the "Run" key to look at each reaction, then drag the cards into the trays.',
        'Compare how many different substances stand on the left of the particle view with how many stand on the right.',
        'Reactions belong together when their left and right groups change in the same way.'
      ],
      check(state) {
        return sortCheck(state, S1_POTS, S1_TRAYS, p => SHAPE_TRAY[shapeOf(eqOf(p.eq))], (p, tray, i, t) => {
          const eq = eqOf(p.eq);
          if (!ranPot(t, 'win', i)) return `${p.name} has not been run in the particle view yet.`;
          return `${p.name} showed ${plural(count(eq, 'lhs'), 'substance')} before and ${count(eq, 'rhs')} after, and it is in the tray "${trayLabel(S1_TRAYS, tray)}".`;
        });
      },
      reward: {
        log: 'Some reactions join, some split, some do neither.',
        title: 'Synthesis and Decomposition',
        body: 'Counting the substances on each side sorts them into synthesis and decomposition. Many reactions are neither: their atoms change partners.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const g = gasrigFixture('rig', { x: 40, y: 27 });
    return {
      id: 's2-gases',
      title: 'Three Gas Jars',
      briefing: {
        title: 'Testing Unknown Gases',
        body: 'Each gas reacts differently to a glowing splint, a lit splint and limewater. Run the tests on each jar to tell them apart.'
      },
      prompt: 'Which gas is in each sample jar?',
      widget,
      table: potTable({
        pieces: [
          ...S2_SAMPLES.map((s, i) => gjar(s.id, s.name, { x: 14 + i * 21, y: 56.4 }, { gas: [s.gas] })),
          ...S2_NAMES.map((n, i) => tag(n.id, n.label, { x: 97, y: 9 + i * 15 }))
        ],
        fixtures: [g.fixture],
        zones: {
          slots: [
            g.slot,
            ...S2_SAMPLES.map((s, i) => ({ id: `n${s.id}`, label: s.name, at: { x: 132, y: 12 + i * 20 }, size: { w: 28, h: 13 } }))
          ]
        }
      }),
      hints: [
        'Drag a sample jar onto the seat, turn the "Test" dial and press "Test", then drag a name onto each sample.',
        'Compare which tests change in each jar and which stay as they were.',
        'Use as few tests on a jar as it takes to tell it from the other gases.'
      ],
      check(state) {
        const t = state.table;
        const named = S2_SAMPLES.map(s => ({ s, name: S2_NAMES.find(n => slotOf(t, n.id) === `n${s.id}`) }));
        if (named.every(x => !x.name)) return { ok: false, notYet: true, msg: 'Drag a name onto each sample.' };
        const open = named.find(x => !x.name);
        const wrong = named.find(x => x.name && x.name.gas !== x.s.gas);
        if (!wrong && !open) return { ok: true };
        if (wrong) {
          const done = GAS_TEST_ORDER.filter(k => t.recorder.rows.some(r => r.label === `rig|${wrong.s.id}|${k}`));
          if (!done.length) return { ok: false, msg: `${wrong.s.name} has not had a test yet.` };
          const seen = done.map(k => `${GAS_TESTS[k].label}: ${gasTest([wrong.s.gas], k).text.toLowerCase()}`).join('; ');
          return { ok: false, msg: `${wrong.s.name} is named ${wrong.name.label}, but its tests gave ${seen}.` };
        }
        return { ok: false, notYet: true, msg: `${open.s.name} has no name yet.` };
      },
      reward: {
        log: 'Each gas has a test that only it answers.',
        title: 'Gas Tests',
        body: 'Oxygen relights a glowing splint, hydrogen pops with a lit one and carbon dioxide turns limewater cloudy. Nitrogen changes none of them.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const b = burnerFixture('burn', { x: 25, y: 19.5 });
    const g = gasrigFixture('rig', { x: 87, y: 27 });
    return {
      id: 's3-burn',
      title: 'Burn a Fuel',
      prompt: 'What does methane make when it burns in oxygen?',
      widget,
      table: potTable({
        pieces: [
          jar('fuel', 'Methane', { x: 12, y: 43.5 }, { species: FUEL, mol: 1 }),
          gjar('gas', 'Gas jar', { x: 34, y: 43.5 }, { empty: true }),
          ...BURN_FILES.map((f, i) => tag(f.id, f.label, { x: 14 + i * 28, y: 57.6 }))
        ],
        fixtures: [b.fixture, g.fixture],
        zones: {
          slots: [...b.slots, g.slot],
          trays: [{ id: 'made', label: 'Made by the burning', at: { x: 136, y: 34 }, size: { w: 28, h: 46 }, cell: 28, cellH: 12 }]
        }
      }),
      hints: [
        'Use the burner and its "Burn" key, then the gas tests with the "Test" dial and the "Test" key, then the tray.',
        'Compare how each test changes in the jar after the burner has run, and what that test is for.',
        'File only what a test found in the jar; a test that changes nothing shows nothing.'
      ],
      check(state) {
        const t = state.table;
        const filed = BURN_FILES.filter(f => trayOf(t, f.id) === 'made');
        if (!filed.length) return { ok: false, notYet: true, msg: 'Drag what the burning made into the tray.' };
        const want = new Set(burnerGases());
        const extra = filed.find(f => !want.has(f.gas));
        const missing = BURN_FILES.find(f => want.has(f.gas) && trayOf(t, f.id) !== 'made');
        if (!extra && !missing) return { ok: true };
        const jarOn = Object.values(t.pieces).find(p => p.kind === 'gjar');
        const tested = GAS_TEST_ORDER.filter(k => t.recorder.rows.some(r => r.label === `rig|${jarOn?.id}|${k}`));
        if (!jarOn?.props.filled || !tested.length) return { ok: false, msg: 'Burn the fuel into the gas jar and try a test in it first.' };
        if (extra) return { ok: false, msg: `${extra.label} is in the tray, but none of the tests tried in the jar found it.` };
        return { ok: false, msg: 'A test tried in the jar changed, and nothing in the tray stands for it.' };
      },
      reward: {
        log: 'Methane burns to carbon dioxide and water.',
        title: 'Combustion',
        body: 'The tests found carbon dioxide and water. Burning a fuel in oxygen is combustion.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const w = windowFixture('win', { x: 44, y: 26 }, { mode: 'proton', cases: S4_POTS.map(p => ({ name: p.name, eq: p.eq })), dialLabel: 'Vessel', title: 'Particle view' });
    return {
      id: 's4-proton',
      title: 'A Proton Moves',
      briefing: {
        title: 'Acid-Base Reactions',
        body: 'A hydrogen ion, H⁺, is a single proton. In an acid-base reaction a proton passes from one molecule, the acid, to another, the base.'
      },
      prompt: 'In which reactions does a proton pass from one molecule to another?',
      widget,
      table: potTable({
        pieces: S4_POTS.map((p, i) => chip(p.id, p.name, { x: 10.5 + i * 18.6, y: 57.6 })),
        fixtures: [w],
        zones: { trays: trayZone(S4_TRAYS, { x: 128, y: 17 }, 28, { w: 44, h: 18, cell: 22, cellH: 10 }) }
      }),
      hints: [
        'Use the "Vessel" dial and the "Run" key to look at each reaction, then drag the cards into the two trays.',
        'Look for an amber ring on a hydrogen atom, and see whether it sits on a different molecule after the reaction.',
        'An acid being present is not enough; the ringed hydrogen has to change molecules.'
      ],
      check(state) {
        return sortCheck(state, S4_POTS, S4_TRAYS, p => (protonTransfer(eqOf(p.eq)) ? 'ring' : 'none'), (p, tray, i, t) => {
          if (!ranPot(t, 'win', i)) return `${p.name} has not been run in the particle view yet.`;
          const ringed = Boolean(protonTransfer(eqOf(p.eq)));
          return `${p.name} is in the tray "${trayLabel(S4_TRAYS, tray)}", and its particle view after Run shows ${ringed ? 'an amber ring' : 'no amber ring'}.`;
        });
      },
      reward: {
        log: 'A hydrogen ion passes from an acid to a base.',
        title: 'Acid-Base Reaction',
        body: 'Where the ringed hydrogen changed molecules, the reaction is acid-base. An acid being present is not enough.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const w = windowFixture('win', { x: 44, y: 26 }, { mode: 'electrons', cases: [{ name: 'Zinc strip', eq: S5_EQ }], title: 'Particle view' });
    return {
      id: 's5-electrons',
      title: 'Zinc in Copper Sulfate',
      briefing: {
        title: 'Oxidation and Reduction',
        body: 'Losing electrons is oxidation and gaining electrons is reduction.'
      },
      prompt: 'Which particle is oxidised and which is reduced?',
      widget,
      table: potTable({
        pieces: S5_PARTS.map((p, i) => tag(p.id, p.label, { x: 14 + i * 28, y: 57.6 })),
        fixtures: [w],
        zones: {
          slots: [
            { id: 'gave', label: 'Oxidised', at: { x: 122, y: 16 }, size: { w: 30, h: 14 } },
            { id: 'took', label: 'Reduced', at: { x: 122, y: 40 }, size: { w: 30, h: 14 } }
          ]
        }
      }),
      hints: [
        'Press "Run", then drag one particle into each slot.',
        'Compare the amber dots on each atom before the reaction with the dots after it.',
        'The particle that has the dots before and not after lost them, and the one that has them after gained them.'
      ],
      check(state) {
        const t = state.table;
        const gave = S5_PARTS.find(p => slotOf(t, p.id) === 'gave');
        const took = S5_PARTS.find(p => slotOf(t, p.id) === 'took');
        if (!gave && !took) return { ok: false, notYet: true, msg: 'Drag a particle into each slot.' };
        if (!gave || !took) return { ok: false, notYet: true, msg: 'Fill both slots.' };
        if (gave.el === 'Zn' && took.el === 'Cu') return { ok: true };
        if (!ranPot(t, 'win', 0)) return { ok: false, msg: 'The particle view has not been run yet.' };
        if (gave.el === 'SO4' || took.el === 'SO4') return { ok: false, msg: `${S5_PARTS[2].label} has no dots before the reaction or after it.` };
        if (gave.el === 'Cu') return { ok: false, msg: `${gave.label} has no dots before the reaction.` };
        return { ok: false, msg: `${took.label} has dots before the reaction already.` };
      },
      reward: {
        log: 'Zinc lost 2 electrons; copper gained them.',
        title: 'Oxidation and Reduction',
        body: 'Zinc lost two electrons and was oxidised; Cu²⁺ gained them and was reduced. A reaction in which electrons move is a redox reaction.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 6 */
  (() => {
    const w = windowFixture('win', { x: 44, y: 28 }, { mode: 'numbers', cases: S6_WORKED, dialLabel: 'Worked', title: 'Worked out', picture: 30 });
    return {
      id: 's6-numbers',
      title: 'Oxidation Number',
      briefing: {
        title: 'Oxidation Number',
        body: 'An oxidation number is the charge an atom would have if every shared electron went to the atom that pulls harder. Oxygen is usually −2.'
      },
      prompt: `What is the oxidation number of manganese in MnO₄${chargeText(-1)}?`,
      entry: { id: 'on', label: 'Oxidation number of Mn', unit: '' },
      widget,
      table: potTable({
        fixtures: [
          w,
          plaqueFixture('rules', 'Oxidation number rules', { x: 122, y: 18 }, ['A lone atom: 0', 'Oxygen: −2', 'Hydrogen: +1', 'Sum = overall charge'], { w: 48 })
        ],
        zones: { slots: [] }
      }),
      hints: [
        'Use the "Worked" dial to see three examples worked out, then type your answer.',
        'Compare how the oxygen atoms and the charge decide the oxidation number on the other atom in each worked species.',
        'Use the oxygen rule and the ion’s overall charge to find manganese’s oxidation number.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'on');
        if (!(Number.isFinite(v)) || state.table.entries.on === undefined || state.table.entries.on === '') return { ok: false, notYet: true, msg: 'Type the oxidation number of manganese.' };
        if (v === MN_NUMBER) return { ok: true };
        const total = v + 4 * -2;
        return { ok: false, msg: `With ${sgn(v)} on manganese and −2 on each of four oxygens, the total is ${sgn(total)}, and the ion's charge is ${sgn(S6_ASKED.charge)}.` };
      },
      reward: {
        log: 'Manganese has oxidation number +7 in MnO₄⁻.',
        title: 'Oxidation Number',
        body: 'Four oxygens at −2 make −8, and the ion’s charge is −1, so manganese has oxidation number +7. A rising oxidation number means electrons were lost.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 7 */
  {
    id: 's7-predict',
    title: 'Burning Magnesium',
    predict: true,
    prompt: 'What kind of reaction is magnesium burning in oxygen?',
    widget,
    table: potTable({
      pieces: Object.entries(GUESS).map(([id, label], i) => stmt(id, label, { x: 24 + (i % 2) * 38, y: 10 + Math.floor(i / 2) * 16 })),
      fixtures: [plaqueFixture('eq', 'Equation', { x: 116, y: 12 }, ['2 Mg + O₂ → 2 MgO'], { w: 50 })],
      zones: { slots: [{ id: 'guess', label: 'My prediction', at: { x: 116, y: 38 }, size: { w: 36, h: 14 } }] }
    }),
    hints: [
      'Use the four cards and the slot.',
      'Think about what is happening to the magnesium, to the oxygen, and to the electrons.',
      'Commit to the answer you expect, then check it against the readings on the next bench.'
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
    reward: { log: 'Prediction locked in.', title: 'Now Test It', body: 'Next, check the furnace log reaction by reaction.' }
  },

  /* ---------------------------------------------------------------- 8 */
  (() => {
    const rows = S8_CARDS.map((c, i) => ({ card: c.id, x: i < 3 ? 28 : 84, y: 12 + (i % 3) * 16 }));
    const board = kboardFixture('board', { x: 56, y: 32 }, { rows });
    const look = lookFixture('look', { x: 130, y: 12 });
    return {
      id: 's8-sort',
      title: 'The Furnace Log',
      get prompt() {
        const g = recall(QUEST_KEY);
        const guess = g && GUESS[g] ? `You guessed "${GUESS[g].toLowerCase()}". ` : '';
        return `${guess}Which kind of reaction is each of these?`;
      },
      widget,
      table: potTable({
        pieces: S8_CARDS.map((c, i) => rxn(c.id, c.eq, { x: rows[i].x, y: rows[i].y })),
        fixtures: [board, look],
        zones: { slots: [] }
      }),
      hints: [
        'Turn the "Look for" dial to a kind, then tap the cards that belong to it.',
        'Compare each card\'s reading with what that kind of reaction needs, and check the same card under every kind.',
        'A card lit under one kind says nothing about the others, so go through all five kinds.'
      ],
      check(state) {
        const t = state.table;
        const filed = filedKinds(t);
        const cards = Object.values(t.pieces).filter(p => p.kind === 'rxn');
        if (cards.every(c => !filed[c.id].size)) return { ok: false, notYet: true, msg: 'Light the cards that belong to a kind.' };
        for (const c of cards) {
          const want = kindsOfCard(c);
          const eq = equationOf(c.props.eq);
          for (const k of KINDS) {
            const has = filed[c.id].has(k);
            if (want.has(k) && !has) return { ok: false, msg: `${c.label}: the ${KIND_LABEL[k]} reading is "${readingFor(k, eq)}", and the card is not lit under ${KIND_LABEL[k]}.` };
            if (!want.has(k) && has) return { ok: false, msg: `${c.label} is lit under ${KIND_LABEL[k]}, whose reading is "${readingFor(k, eq)}".` };
          }
        }
        return { ok: true };
      },
      get reward() {
        const g = recall(QUEST_KEY);
        const verdict = g && GUESS[g]
          ? (g === 'many' ? 'The board agreed with your guess. ' : 'The board did not agree with your guess, which is how a guess gets better. ')
          : '';
        return {
          log: 'Magnesium burning is a synthesis, a combustion and a redox reaction.',
          title: 'A Reaction Has Many Kinds',
          body: `${verdict}Burning magnesium is a synthesis, a combustion and a redox reaction at once. Each kind looks at something different: substances, oxygen, protons or electrons.`
        };
      }
    };
  })()
];

/** The gases a burn of the fuel leaves. */
function burnerGases() { return ['CO2', 'H2O']; }

/** How-to lines printed on the plate (`table/notes.js` places each block clear of everything else on the table). */
const NOTES = {
  5: ['Press Run, then drag a particle into each slot.'],
  6: ['Type your answer in the box below.'],
  7: ['Drag the card you choose into the slot.'],
  8: ['Tap a card to light it,', 'tap again to put it out.']
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
      body: 'A reaction can join, split, burn, pass a proton or move electrons, and most do more than one. A reaction can belong to several kinds at once because each looks at something different.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const run = id => ({ run: id });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const tap = id => ({ flip: id });

const filePots = (pots, trayOfPot) => pots.flatMap((p, i) => [dial('win', 'pot', i + 1), run('win'), put(p.id, `tray:${trayOfPot(p)}`)]);

const FILL_BURNER = [put('fuel', 'slot:burn.fuel'), put('gas', 'slot:burn.out'), run('burn')];
const TEST_JAR = [put('gas', 'slot:rig.seat'), dial('rig', 'test', 3), run('rig'), dial('rig', 'test', 4), run('rig')];

const testSample = (s, tests) => [put(s.id, 'slot:rig.seat'), ...tests.flatMap(k => [dial('rig', 'test', GAS_TEST_ORDER.indexOf(k) + 1), run('rig')])];
const S2_SOLVE = [
  ...testSample(S2_SAMPLES[0], ['limewater']), ...testSample(S2_SAMPLES[1], ['lit']), ...testSample(S2_SAMPLES[2], ['glowing']),
  ...S2_SAMPLES.map(s => put(S2_NAMES.find(n => n.gas === s.gas).id, `slot:n${s.id}`))
];

const lightKinds = pick => KINDS.flatMap((k, i) => [dial('look', 'look', i + 1), ...S8_CARDS.filter(c => pick(c, k)).map(c => tap(c.id))]);

export const SOLUTIONS = [
  filePots(S1_POTS, p => SHAPE_TRAY[shapeOf(eqOf(p.eq))]),
  S2_SOLVE,
  [...FILL_BURNER, ...TEST_JAR, put('co2', 'tray:made'), put('water', 'tray:made')],
  filePots(S4_POTS, p => (protonTransfer(eqOf(p.eq)) ? 'ring' : 'none')),
  [run('win'), put('zn', 'slot:gave'), put('cu', 'slot:took')],
  [dial('win', 'pot', 1), dial('win', 'pot', 2), dial('win', 'pot', 3), typed('on', '7')],
  [put('many', 'slot:guess')],
  lightKinds((c, k) => kindsFull(eqOf(c.eq)).has(k))
];

/** A plausible wrong answer per stage. Each must be refused, and must say why. */
export const MISSES = [
  [...filePots(S1_POTS, p => SHAPE_TRAY[shapeOf(eqOf(p.eq))]).slice(0, 15), dial('win', 'pot', 6), run('win'), put('pf', 'tray:join')],
  [...testSample(S2_SAMPLES[0], ['limewater']), put('nH2', 'slot:nga')],
  [...FILL_BURNER, put('gas', 'slot:rig.seat'), dial('rig', 'test', 4), run('rig'), put('carbon', 'tray:made'), put('water', 'tray:made')],
  [...filePots(S4_POTS, p => (protonTransfer(eqOf(p.eq)) ? 'ring' : 'none')).slice(0, 12), dial('win', 'pot', 5), run('win'), put('pe', 'tray:ring')],
  [run('win'), put('cu', 'slot:gave'), put('zn', 'slot:took')],
  [typed('on', '8')],
  [],
  [dial('look', 'look', 1), tap('mg'), dial('look', 'look', 5), tap('zn')]
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
  S1_POTS, S4_POTS, S5_EQ, S6_WORKED, S6_ASKED, S2_SAMPLES, S2_NAMES, S8_CARDS, GUESS, FUEL,
  answers: { mn: MN_NUMBER }
};
export { windowRead, burnerRead, rigRead, boardRead, filedKinds, seatedIn, workedRows, electronFlow, pretty, parseEquation };
