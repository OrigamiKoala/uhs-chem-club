/**
 * boss-golem.js — Learn world 7 Elite Encounter: Recipe Golem.
 *
 * An automaton bound by strict stoichiometry. Two phases on the TABLETOP (plan `bench-tabletop.md`, phase T2c),
 * each a fresh pair of ingredients, and neither prompt carries a figure the bench has to give:
 *   Phase 1: Limiting feed on two heaps (the heap kit's maker · q1)
 *   Phase 2: The same feed by weight on two drums (the mass kit's scale, grams to moles · Tallow q6)
 *
 * The foe is the golem itself, watching the table from its corner (`table/layout.js` `FOE_PAD`): it only
 * observes. Scouting is free, a committed miss costs one of three Integrity, a correct commit wins at any
 * Integrity, and nothing in a phase's answer is changed by the fight. A boss phase never declares a field
 * stage. Kettle has no walkable world, so the golem is fought across a table in the foundry room
 * (`rooms.js`), the same room as the quest before it.
 *
 * Awards Case File clue: clue_kettle_ledger.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { heapTable, heap, dock, product, limitOf, tallyOf } from '../../table/kits/heap.js';
import { crate } from '../../table/kits/mass.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 2 };

export const BUILDS_ON = ['unit07/q1-recipe'];

/** The room this boss's tables stand in at T4: Kettle has no world to stand in (`rooms.js`). */
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

  /* ---------------------------------------------------------------- Phase 2 */
  {
    id: 'phase2',
    title: 'Phase 2 · Feed by Weight',
    prompt: 'How many moles of sodium chloride can the golem make from the two drums?',
    widget: { type: 'table', label: 'The bench' },
    table: heapTable({
      pieces: [
        crate('dna', 'SODIUM', { x: 16, y: 13 }, { species: 'sodium', grams: 69, note: 'drum' }),
        crate('dcl', 'CHLORINE', { x: 38, y: 13 }, { species: 'chlorine', grams: 71, note: 'drum' })
      ],
      zones: { slots: [{ id: 'weigh', label: 'Scale pan', at: { x: 22, y: 46 }, size: { w: 22, h: 18 } }] },
      fixtures: [
        { id: 'scale', kind: 'scale', label: 'Scale', at: { x: 56, y: 44 }, size: { w: 38, h: 28 }, noRun: true, props: { pan: 'slot:weigh', unit: 'g' } },
        { id: 'listed', kind: 'plate', label: 'Listed', at: { x: 68, y: 13 }, size: { w: 40, h: 20 }, noRun: true, props: { lines: ['molar mass', 'sodium 23.0 g/mol', 'chlorine 35.5 g/mol'] } },
        { id: 'tally', kind: 'tally', label: 'Tally', at: { x: 96, y: 50 }, size: { w: 36, h: 16 }, noRun: true, dials: { n: { min: 0, max: 6, step: 1, value: 0, label: 'Moles' } } }
      ]
    }),
    foes: GOLEM_FOE,
    encounter: {
      species: 'recipe golem',
      act: 'Seal Valves',
      intent: 'Steam builds behind the valves while the golem waits for its feed.'
    },
    check(state) {
      const n = tallyOf(state.table, 'tally');
      if (n === 0) return { ok: false, notYet: true, msg: 'The tally is on zero. Set it to a count of moles.' };
      if (n !== 2) return { ok: false, msg: 'Turn each drum\'s weight into moles with the molar masses on the plate, then see which drum runs out first.' };
      return { ok: true };
    },
    hints: [
      'Drag each drum onto the scale\'s pan and read what it weighs.',
      'Use the molar masses on the plate to turn each drum\'s weight into moles.',
      'Each mole of the compound takes one mole of each element, so compare the two mole counts.'
    ],
    reward: {
      title: 'The Same Limit, by Weight',
      body: 'Dividing a mass by a molar mass gives moles, and moles can be compared the way atoms were. The smaller number of moles still sets how much compound can form.',
      log: 'Yield set by the drum with fewer moles.'
    }
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const makes = n => Array.from({ length: n }, () => ({ run: 'maker' }));

export const SOLUTIONS = [
  [joinTo('na1', 'cl1'), to('na1', 'container:dock'), ...makes(9), { setDial: { fixture: 'tally', dial: 'n', value: 9 } }],
  [to('dna', 'slot:weigh'), to('dcl', 'slot:weigh'), { setDial: { fixture: 'tally', dial: 'n', value: 2 } }]
];

export const MISSES = [
  [joinTo('na1', 'cl1'), to('na1', 'container:dock'), ...makes(9), { setDial: { fixture: 'tally', dial: 'n', value: 14 } }],
  [to('dna', 'slot:weigh'), { setDial: { fixture: 'tally', dial: 'n', value: 3 } }]
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
      body: 'The golem vents its boiler and freezes. In its log vault we found a ledger: fifty tons of metal logged out against forty tons of ore logged in. No chemistry can do that.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Both phases asked the same question, once by counting atoms and once by weighing drums: which ingredient runs out first. That is all of Kettle so far, and it was enough to freeze the golem.'
    },
    {
      heading: 'Next',
      body: 'The ledger goes into the Case File. Something in the foundry is making mass from nothing, and no balance allows that.'
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
    // No world under Kettle: the golem is fought across a table in the foundry room.
    room: ROOM,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}
