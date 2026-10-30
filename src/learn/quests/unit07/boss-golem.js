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
import { potTable, jar, reactorFixture, weighFixture, weighRead, plaqueFixture, fixed } from '../../table/kits/pot.js';
import { molarMass, parseEquation, reactPlan } from '../../engine/reactdata.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 3 };

export const BUILDS_ON = ['unit07/q1-recipe', 'unit07/q6-stoich'];

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
    title: 'Phase 1 · Limiting Feed',
    briefing: {
      speaker: 'Vess',
      body: 'This golem builds each unit of sodium chloride from one sodium atom and one chlorine atom, using whatever its two hoppers hold.'
    },
    prompt: 'How many sodium chloride units can the golem build from these two heaps?',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      pieces: [
        ...[['na1', 'Na'], ['cl1', 'Cl'], ['na2', 'Na'], ['cl2', 'Cl']].map(([id, el], i) => atomAt(id, el, 10 + i * 12, 31))
      ],
      zones: {
        containers: [
          heap('heap-na', 'Sodium heap', 'Na', 9, { x: 17, y: 14 }),
          heap('heap-cl', 'Chlorine heap', 'Cl', 14, { x: 49, y: 14 }),
          product('made', 'Built', { x: 80, y: 14 }, 16, { w: 28, h: 20 }),
          dock('dock', 'Recipe', { x: 17, y: 51 })
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
      if (n !== want) return { ok: false, msg: 'Count the atoms in each heap: the recipe stops as soon as one of them is used up.' };
      return { ok: true };
    },
    hints: [
      'Build one unit by joining a sodium atom to a chlorine atom, put it in the dock, and press "Make Unit" to copy it from the heaps.',
      'Count the atoms in each heap, or watch them shrink as the maker draws on them.',
      'Every unit takes one atom from each heap, so ask which heap runs out first.'
    ],
    reward: {
      title: 'First Ingredient Runs Out',
      body: 'The recipe stops when its first ingredient runs out, and that ingredient is the limiting reactant. Whatever is left of the other ingredient is the excess.',
      log: 'Intake metered by the smaller heap.'
    }
  },

  /* ---------------------------------------------------------------- Phase 4 */
  (() => {
    const r = reactorFixture('pot', { x: 47, y: 24 }, { eq: EQ_THERMITE, seats: 2, out: 'Fe', yieldFrac: GOLEM_KEEPS, window: false, title: 'Furnace' });
    const b = weighFixture('bal', { x: 108, y: 32 });
    return {
      id: 'phase4',
      title: 'Phase 4 · What the Furnace Kept',
      prompt: 'Type the percent of its possible iron that this furnace made.',
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
        'Find which jar gives out first, work out the iron it allows, then divide what was made by that and multiply by 100.'
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
      title: 'Phase 5 · The Ledger',
      prompt: `Type the most iron, in tons, that ${LEDGER.oreTons.toFixed(1)} tons of ore can give.`,
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
        'The furnace turns each gram of ore into the same mass of iron, so scale that by the tons of ore in the ledger.'
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
  [put('ore', 'slot:pot.in1'), put('al', 'slot:pot.in2'), ...weighed, typed('pct', '80')],
  [put('ore', 'slot:pot.in1'), ...weighed, typed('t', '27.9')]
];

export const MISSES = [
  [joinTo('na1', 'cl1'), to('na1', 'container:dock'), ...makes(9), { setDial: { fixture: 'tally', dial: 'n', value: 14 } }],
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
      body: 'Every phase asked what a recipe allows: which ingredient runs out, how much of it can be made, and how much was. That was enough to freeze the golem.'
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
