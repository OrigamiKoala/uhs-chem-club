/**
 * boss-golem.js — Learn world 7 Elite Encounter: Recipe Golem.
 *
 * An automaton bound by strict stoichiometry. Five phases on the TABLETOP, each a fresh case of an idea a bench of Kettle worked out and
 * none introducing one (`docs/plans/kettle-world.md` section 3.9):
 *   Phase 1: limiting feed on two heaps         (`q1-recipe`, the heap kit's maker)
 *   Phase 2: the golem's recipe board           (`q4-balance`)
 *   Phase 3: the golem's sealed pot             (`q3-change`)
 *   Phase 4: limiting feed and yield in grams   (`q6-stoich`, the pot)
 *   Phase 5: the forged ledger                  (`q6-stoich`, grams to tons)
 *
 * The foe is the golem itself, watching the table from its corner (`table/layout.js` `FOE_PAD`): it only observes. Scouting is free, a
 * committed miss costs one of three Integrity, a correct commit wins at any Integrity, and nothing in a phase's answer is changed by the
 * fight. A boss phase never declares a field stage and carries no lead line. The golem stands at the furnace (`boss-arena.js`).
 *
 * Awards Case File clue: clue_kettle_ledger.
 */

import { createRunner, stateFromScript, entryNumber } from '../../engine/stagerunner.js';
import { heapTable, heap, dock, product, limitOf, tallyOf } from '../../table/kits/heap.js';
import { potTable, jar, reactorFixture, weighFixture, weighRead, plaqueFixture, fixed, chip } from '../../table/kits/pot.js';
import { crate, labelerFixture, labelWords, windowFixture as saltWindowFixture } from '../../table/kits/pot-names.js';
import { eqBench, boardRead, ledgerRead } from '../../table/kits/pot-balance.js';
import { molarMass, parseEquation, reactPlan, nameIonic, pretty, IONS } from '../../engine/reactdata.js';
import { saltInWater } from '../../engine/reactdata-names.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = ['unit07/q2-names', 'unit07/q4-balance', 'unit07/q6-stoich'];

/** The room this boss's tables stand in until the walkable world carries them (`rooms.js`). */
export const ROOM = 'foundry';

/** Every key on these benches says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The golem, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const GOLEM_FOE = [{ id: 'golem', label: 'The Recipe Golem' }];

/* ------------------------------------------------------------------
   THE TABLES
   Each phase keeps the top-right corner clear for the foe (`FOE_PAD`).
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const joinTo = (a, b) => ({ join: [a, b] });
const atomAt = (id, el, x, y) => ({ id, kind: 'atom', label: el, at: { x, y }, props: { el } });

/** What one unit of sodium chloride takes: the recipe the briefing states, for the check's own arithmetic. */
const UNIT_NEED = { Na: 1, Cl: 1 };

const widget = { type: 'table', label: 'The bench' };

/* Phase 2: copper(II) nitrate drum. */
const GOLEM_DRUM = { cat: 'Cu2', an: 'NO3' };
const DRUM_TOKS = ['iron', 'copper', '(II)', '(III)', 'sulfate', 'nitrate'];
const trayOf = (id, label, x, y, cols, rows, cell = 14, cellH = cell) => ({ id, label, at: { x, y }, size: { w: cols * cell, h: rows * cellH }, cell, cellH });
const inTray = (c, tray) => ({ ...c, zone: `tray:${tray}` });
const cardsTray = (n = 'Cards') => trayOf('cards', n, 98, 16, 3, 2, 19, 12.6);

/* Phase 3: ethane burning (2 C2H6 + 7 O2 -> 4 CO2 + 6 H2O). */
const EQ_ETHANE = 'C2H6 + O2 -> CO2 + H2O';
const board = t => boardRead(t, 'bd');
const untouched = r => r.coefs.every(n => n === 1) && !Object.keys(r.subs).length;
function ledgerMiss(t, lid = 'led') {
  const row = ledgerRead(t, lid).rows.find(r => r.left !== r.right);
  return row ? `The ledger counts ${pretty(row.el)}: ${row.left} on the left and ${row.right} on the right.` : null;
}

/* Phase 4: aluminium frees iron from its ore (Fe2O3 + 2 Al -> Al2O3 + 2 Fe); the furnace keeps 80 % of the iron its limit allows. */
const EQ_THERMITE = 'Fe2O3 + 2 Al -> Al2O3 + 2 Fe';
const ORE_G = 79.8;
const AL_G = 10.8;
const GOLEM_KEEPS = 0.8;
const THERMITE_PLAN = reactPlan(parseEquation(EQ_THERMITE), { Fe2O3: ORE_G / molarMass('Fe2O3'), Al: AL_G / molarMass('Al') });
const POSSIBLE_FE = THERMITE_PLAN.made.Fe * molarMass('Fe');
const GOLEM_PCT = Math.round(POSSIBLE_FE * GOLEM_KEEPS * 10) / 10 / POSSIBLE_FE * 100;

/* Phase 5: the ledger. The furnace turns 79.8 g of ore into 55.8 g of iron; the ledger's ore is 39.9 tons. */
const EQ_ORE = 'Fe2O3 + 3 CO -> 2 Fe + 3 CO2';
const LEDGER = { oreTons: 39.9, claimTons: 50.0, possibleTons: 39.9 * (reactPlan(parseEquation(EQ_ORE), { Fe2O3: ORE_G / molarMass('Fe2O3') }).made.Fe * molarMass('Fe')) / ORE_G };

export const STAGES = [
  /* ---------------------------------------------------------------- Phase 1 */
  {
    id: 'phase1',
    title: 'Limiting Feed',
    briefing: {
      speaker: 'Vess',
      body: 'This golem builds each unit of sodium chloride from one sodium atom and one chlorine atom, using whatever its two hoppers hold.'
    },
    prompt: 'How many sodium chloride units can the golem build from these two supplies?',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      pieces: [
        ...[['na1', 'Na'], ['cl1', 'Cl'], ['na2', 'Na'], ['cl2', 'Cl']].map(([id, el], i) => atomAt(id, el, 10 + i * 12, 31))
      ],
      zones: {
        containers: [
          heap('heap-na', 'Sodium supply', 'Na', 9, { x: 17, y: 14 }),
          heap('heap-cl', 'Chlorine supply', 'Cl', 14, { x: 49, y: 14 }),
          product('made', 'Built', { x: 80, y: 14 }, 16, { w: 28, h: 20 }),
          dock('dock', 'Unit pattern', { x: 17, y: 51 })
        ]
      },
      fixtures: [
        {
          id: 'maker', kind: 'maker', label: 'Maker', runLabel: 'Make Unit', at: { x: 54, y: 50 }, size: { w: 36, h: 20 },
          props: { dock: 'container:dock', heaps: { Na: 'heap-na', Cl: 'heap-cl' }, product: 'made' }
        },
        { id: 'tally', kind: 'tally', label: 'Tally', at: { x: 96, y: 50 }, size: { w: 36, h: 16 }, noRun: true, dials: { n: { min: 0, max: 14, step: 1, value: 0, label: 'Units built' } } }
      ]
    }),
    foes: GOLEM_FOE,
    encounter: {
      species: 'recipe golem',
      act: 'Meter Intake',
      intent: 'The golem opens its twin hopper gates to draw in feed.'
    },
    check(state) {
      const t = state.table;
      const n = tallyOf(t, 'tally');
      const want = limitOf({ Na: t.zones.containers['heap-na'].capacity, Cl: t.zones.containers['heap-cl'].capacity }, UNIT_NEED).made;
      if (n === 0) return { ok: false, notYet: true, msg: 'The tally is on zero. Set it to a count of units.' };
      if (n !== want) return { ok: false, msg: 'Count the atoms in each supply: the unit stops building as soon as one of them is used up.' };
      return { ok: true };
    },
    hints: [
      'Build one unit by joining a sodium atom to a chlorine atom, put it in the unit pattern, and press "Make Unit" to copy it from the supplies.',
      'Count the atoms in each supply, or watch them shrink as the maker draws on them.',
      'Every unit takes one atom from each supply, so ask which supply runs out first.'
    ],
    reward: {
      title: 'First Ingredient Runs Out',
      body: 'The supply that ran out first set the count: it was the limiting reactant. Whatever is left of the other supply is the excess.',
      log: 'Intake metered by the smaller supply.'
    }
  },

  /* ---------------------------------------------------------------- Phase 2 */
  (() => {
    const win = saltWindowFixture('win', { x: 35, y: 16 }, { mode: 'salt', w: 66, h: 30 });
    const lab = labelerFixture('lab', { x: 58, y: 49 }, { parts: [null, null, null], slotW: 22, slotH: 10.5, pad: 3, title: 'Label' });
    return {
      id: 'phase2',
      title: "The Golem's Label",
      prompt: "What is the compound in the golem's drum called?",
      widget,
      table: potTable({
        pieces: [
          crate('crx', 'Drum', { x: 10, y: 49 }, { content: { type: 'salt', ...GOLEM_DRUM, hide: [GOLEM_DRUM.cat] } }),
          ...DRUM_TOKS.map((n, i) => inTray(chip(`k_${i}`, n, { x: 0, y: 0 }), 'cards'))
        ],
        fixtures: [win.fixture, lab.fixture, plaqueFixture('names', 'Ion names', { x: 135, y: 44 }, ['NO₃⁻ nitrate', 'SO₄²⁻ sulfate'], { w: 28 })],
        zones: { trays: [cardsTray()], slots: [win.slot, ...lab.slots] }
      }),
      foes: GOLEM_FOE,
      encounter: { species: 'recipe golem', act: 'Seal Drum', intent: 'The golem stamps a blank drum and sets it on the belt.' },
      hints: [
        'Dissolve the drum in the particle view, then look at the ion-name plate and the label.',
        'Compare the pieces in the water with the ion names on the plate, and count each kind.',
        'The ions together have no charge, and only the nitrate\'s charge is printed.'
      ],
      check(state) {
        const w = labelWords(state.table, 'lab');
        if (w.some(x => !x)) return { ok: false, notYet: true, msg: 'Lay a card in each slot of the label.' };
        const text = `${w[0]}${w[1]} ${w[2]}`;
        if (text === nameIonic(GOLEM_DRUM.cat, GOLEM_DRUM.an)) return { ok: true };
        const water = saltInWater(GOLEM_DRUM.cat, GOLEM_DRUM.an);
        const metal = water.pieces[0]; const anion = water.pieces[1];
        return { ok: false, msg: `The label reads "${text}"; the particle view drew ${metal.count} Cu with no charge printed and ${anion.count} joined groups printing ${IONS[anion.ion].q < 0 ? '' : '+'}${String(IONS[anion.ion].q).replace('-', '−')}.` };
      },
      reward: {
        title: "The Golem's Label",
        body: 'Two NO₃⁻ carry −2, so the single copper ion is 2+: copper(II) nitrate, Cu(NO₃)₂.',
        log: 'The golem\'s drum is copper(II) nitrate.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- Phase 3 */
  (() => {
    const b = eqBench({ eq: EQ_ETHANE, dialed: 'all', lex: 2, ledger: 'atoms', boardTitle: 'Equation', coefMax: 8 });
    return {
      id: 'phase3',
      title: "The Golem's Board",
      prompt: "What coefficients balance the equation on the golem's board?",
      widget,
      table: potTable({ fixtures: b.fixtures, zones: { slots: [] } }, { w: 175 }),
      foes: GOLEM_FOE,
      encounter: { species: 'recipe golem', act: 'Set Dials', intent: 'The golem resets the equation dials on its furnace.' },
      hints: [
        'Turn the four dials on the board and read the atom ledger.',
        'Compare the two columns of the ledger one atom at a time, and see which rows move when each dial turns.',
        'Balance the atoms that appear in only one substance on each side first, leaving oxygen for last.'
      ],
      check(state) {
        const t = state.table;
        const r = board(t);
        if (untouched(r)) return { ok: false, notYet: true, msg: 'Turn a dial on the board.' };
        const miss = ledgerMiss(t);
        return miss ? { ok: false, msg: miss } : { ok: true };
      },
      reward: {
        title: 'Balanced Equation',
        body: '2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O. Carbon and hydrogen are each in one product, so oxygen is set last.',
        log: '2 C₂H₆ + 7 O₂ → 4 CO₂ + 6 H₂O.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- Phase 4 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_THERMITE, seats: 2, out: 'Fe', yieldFrac: GOLEM_KEEPS, window: false, title: 'Furnace' });
    const b = weighFixture('bal', { x: 108, y: 32 });
    return {
      id: 'phase4',
      title: 'What the Furnace Kept',
      prompt: 'What is the percent yield of iron from this furnace?',
      entry: { id: 'pct', label: 'Percent made', unit: '%' },
      widget,
      table: potTable({
        pieces: [
          jar('ore', 'Iron ore', { x: 136, y: 36 }, { species: 'Fe2O3', grams: ORE_G, shown: `${ORE_G.toFixed(1)} g` }),
          jar('al', 'Aluminium', { x: 136, y: 52 }, { species: 'Al', grams: AL_G, shown: `${AL_G.toFixed(1)} g` }),
          jar('catch', 'Catch jar', { x: 120, y: 52 }, { catchFor: 'Fe' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('eq', 'Equation and listed masses', { x: 48, y: 56 }, ['Fe₂O₃ + 2 Al → Al₂O₃ + 2 Fe', 'Fe₂O₃ 159.6 · Al 27.0 · Fe 55.8 g/mol'], { w: 80 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      foes: GOLEM_FOE,
      encounter: { species: 'recipe golem', act: 'Charge Furnace', intent: 'The golem feeds its furnace from two hoppers.' },
      hints: [
        'Use the furnace, the two jars, the catch jar and the balance.',
        'Compare the iron on the balance with the iron the equation allows from the reactant that runs out first.',
        'Find which jar runs out first, work out the iron it allows, then compare the iron on the balance as a percent of that.'
      ],
      check(state) {
        const v = entryNumber(state.table, 'pct');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the percent.' };
        if (Math.abs(v - GOLEM_PCT) <= 1) return { ok: true };
        const w = weighRead(state.table, 'bal');
        const note = w.item && w.grams > 0 ? ` The balance read ${fixed(w.grams, 1)} g of iron.` : ' Run the furnace and weigh the catch jar.';
        return { ok: false, msg: `${fixed(v, 1)} % does not follow from the table.${note}` };
      },
      reward: {
        title: 'Yield From the Limit',
        body: 'The aluminium gave out first, so the iron it allows is 22.3 g. The 17.9 g on the balance is 80 % of that.',
        log: 'The furnace kept 80 % of the iron its limit allowed.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- Phase 5 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_ORE, seats: 1, plenty: ['CO'], out: 'Fe', window: false, title: 'Furnace' });
    const b = weighFixture('bal', { x: 108, y: 32 });
    return {
      id: 'phase5',
      title: 'The Ledger',
      prompt: `What is the most iron, in tons, that ${LEDGER.oreTons.toFixed(1)} tons of ore can give?`,
      entry: { id: 't', label: 'Iron possible', unit: 't' },
      widget,
      table: potTable({
        pieces: [
          jar('ore', 'Iron ore', { x: 136, y: 36 }, { species: 'Fe2O3', grams: ORE_G, shown: `${ORE_G.toFixed(1)} g` }),
          jar('catch', 'Catch jar', { x: 136, y: 52 }, { catchFor: 'Fe' })
        ],
        fixtures: [
          r.fixture, b.fixture,
          plaqueFixture('led', 'The golem\'s ledger', { x: 48, y: 56 }, [`Ore in: ${LEDGER.oreTons.toFixed(1)} t   Metal out: ${LEDGER.claimTons.toFixed(1)} t`, 'Fe₂O₃ + 3 CO → 2 Fe + 3 CO₂'], { w: 80 })
        ],
        zones: { slots: [...r.slots, b.slot] }
      }),
      foes: GOLEM_FOE,
      encounter: { species: 'recipe golem', act: 'Log Output', intent: 'The golem writes its output into the ledger.' },
      hints: [
        'Use the furnace, the ore jar, the catch jar and the balance.',
        'Compare the grams of ore fed with the grams of iron on the balance, and the ledger with what a furnace can make.',
        'Weigh what the furnace makes from the ore jar, then scale that ratio of iron to ore up to the tons of ore in the ledger.'
      ],
      check(state) {
        const v = entryNumber(state.table, 't');
        if (!(v > 0)) return { ok: false, notYet: true, msg: 'Type the tons of iron.' };
        if (Math.abs(v - LEDGER.possibleTons) <= 0.3) return { ok: true };
        const w = weighRead(state.table, 'bal');
        const note = w.item && w.grams > 0 ? ` The furnace made ${fixed(w.grams, 1)} g of iron from ${ORE_G.toFixed(1)} g of ore.` : ' Run the furnace and weigh the catch jar.';
        return { ok: false, msg: `${fixed(v, 1)} t does not follow from the furnace.${note}` };
      },
      reward: {
        title: 'The Ledger Cannot Be True',
        body: 'The ore in the ledger can give at most 27.9 tons of iron. The ledger claims 50.0 tons: more metal than the equation allows from that ore.',
        log: 'The ledger claims 50.0 t of metal from ore that can give 27.9 t.'
      }
    };
  })()
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const makes = n => Array.from({ length: n }, () => ({ run: 'maker' }));
const put = (piece, target) => ({ place: { piece, to: target } });
const typed = (entry, value) => ({ type: { entry, value: String(value) } });
const weighed = [put('catch', 'slot:pot.out'), { run: 'pot' }, put('catch', 'slot:bal.pan')];

export const SOLUTIONS = [
  [joinTo('na1', 'cl1'), to('na1', 'container:dock'), ...makes(9), { setDial: { fixture: 'tally', dial: 'n', value: 9 } }],
  [put('crx', 'slot:win.seat'), { run: 'win' }, put('k_1', 'slot:lab.s1'), put('k_2', 'slot:lab.s2'), put('k_5', 'slot:lab.s3')],
  [{ setDial: { fixture: 'bd', dial: 'c0', value: 2 } }, { setDial: { fixture: 'bd', dial: 'c1', value: 7 } }, { setDial: { fixture: 'bd', dial: 'c2', value: 4 } }, { setDial: { fixture: 'bd', dial: 'c3', value: 6 } }],
  [put('ore', 'slot:pot.in1'), put('al', 'slot:pot.in2'), ...weighed, typed('pct', '80')],
  [put('ore', 'slot:pot.in1'), ...weighed, typed('t', '27.9')]
];

export const MISSES = [
  [joinTo('na1', 'cl1'), to('na1', 'container:dock'), ...makes(9), { setDial: { fixture: 'tally', dial: 'n', value: 14 } }],
  [put('crx', 'slot:win.seat'), { run: 'win' }, put('k_1', 'slot:lab.s1'), put('k_3', 'slot:lab.s2'), put('k_5', 'slot:lab.s3')],
  [{ setDial: { fixture: 'bd', dial: 'c0', value: 1 } }, { setDial: { fixture: 'bd', dial: 'c1', value: 3 } }, { setDial: { fixture: 'bd', dial: 'c2', value: 2 } }, { setDial: { fixture: 'bd', dial: 'c3', value: 3 } }],
  [put('ore', 'slot:pot.in1'), put('al', 'slot:pot.in2'), ...weighed, typed('pct', '100')],
  [put('ore', 'slot:pot.in1'), ...weighed, typed('t', '50')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export const DEBRIEF = {
  speaker: 'Vess',
  clueAwarded: 'clue_kettle_ledger',
  sections: [
    {
      heading: 'What You Found',
      body: 'The golem vents its boiler and freezes. In its log vault we found a ledger: fifty tons of metal logged out against forty tons of ore logged in. No furnace can do that.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase asked what an equation allows: which ingredient runs out, what compound sits in the drum, how the atoms balance, and how much metal can be made. That was enough to freeze the golem.'
    },
    {
      heading: 'Next',
      body: 'The ledger goes into the Case File. Something in the foundry is writing metal that the ore cannot give.'
    }
  ]
};

/* ------------------------------------------------------------------
   MOUNT
   ------------------------------------------------------------------ */

export function mount(container, ctx) {
  const bossCtx = {
    ...ctx,
    reportComplete() {
      ctx.reportComplete();
      session.recordClue?.(DEBRIEF.clueAwarded);
    }
  };

  const runner = createRunner(container, bossCtx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    room: ROOM,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

export const CHECKS = { EQ_THERMITE, ORE_G, AL_G, GOLEM_KEEPS, GOLEM_PCT, POSSIBLE_FE, LEDGER };
