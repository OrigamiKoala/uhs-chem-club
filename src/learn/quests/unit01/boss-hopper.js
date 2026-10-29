/**
 * boss-hopper.js — Learn world 1 Boss Encounter: The Hopper.
 *
 * The refinery's ore hopper, risen in the salt. A multi-phase synthesis boss that tests every bench
 * on Tallow with fresh samples, and (plan `bench-tabletop.md`, phase T2) on the TABLETOP: five phases
 * on one table, each with the kit its bench uses.
 *   Phase 1: Sort hull plates into element, compound and mixture    (atom kit, the dish pictures · q1)
 *   Phase 2: Build a neutral atom to match the sealed core          (atom kit, particles · q2, q4)
 *   Phase 3: Slot the card that belongs in the open place           (card kit · q3)
 *   Phase 4: Balance the slag on the beam and name its element      (mass kit, the assay · q5)
 *   Phase 5: Balance a sealed drum of carbon with scoops            (mass kit, the balance · q6)
 *
 * The foe is the hopper itself, watching the table from its corner (`table/layout.js` `FOE_PAD`):
 * it only observes. Scouting is free, a committed miss costs one of three Integrity, a correct commit
 * wins at any Integrity, and nothing in a phase's answer is changed by the fight. A boss phase never
 * declares a field stage: the walk is suspended while the hopper stands.
 *
 * Awards Case File clue: clue_tallow_slag.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { atomTable, piecesIn } from '../../table/kits/atoms.js';
import { cardTable, cardSlot, elementCard, slotCard } from '../../table/kits/cards.js';
import { massTable, balanceTable, crate, pourSteps, balanceRead } from '../../table/kits/mass.js';
import { CARDS } from './q3-catalogue.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit01/q1-grain', 'unit01/q2-core', 'unit01/q3-catalogue',
  'unit01/q4-ledger', 'unit01/q5-assay', 'unit01/q6-weigh'
];

/** Every key on these benches says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The hopper, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const HOPPER_FOE = [{ id: 'hopper', label: 'The Hopper' }];

/* ------------------------------------------------------------------
   THE TABLES
   Each phase keeps the top-right corner clear for the foe (`FOE_PAD`).
   ------------------------------------------------------------------ */

const to = (piece, target) => ({ place: { piece, to: target } });
const trayOf = (t, id) => (t.pieces[id].zone || '').replace('tray:', '');
const dishTray = (id, label, x, y = 38, w = 38) => ({ id, label, at: { x, y }, size: { w, h: 22 }, cell: 19 });
const trayAt = (id, label, x, y, w, h, cap) => ({ id, label, at: { x, y }, size: { w, h }, ...(cap != null ? { cap } : {}) });

/** A dish of hull plating, open at the power where atoms resolve: the picture is the evidence. */
const plate = (id, label, particles, x, y) => ({
  id, kind: 'dish', label, at: { x, y },
  props: { sample: { id: `hull-${id}`, floorPower: 4, particles }, view: 4 }
});

/** The pieces of a built atom: a heap of protons and electrons, the middle and outside trays and the needle. */
const part = (id, kind, label, x, y) => ({ id, kind, label, at: { x, y } });
const heap = () => [
  ...Array.from({ length: 7 }, (_, i) => part(`p${i + 1}`, 'proton', 'Proton', 52 + i * 10, 49)),
  ...Array.from({ length: 7 }, (_, i) => part(`e${i + 1}`, 'electron', 'Electron', 52 + i * 10, 59))
];
const count = (t, zone, kind) => piecesIn(t, zone, kind).length;

/** The chart's second row as it stands, loose cards under it: He, Ne and Ar are all noble gases, and only one fits. */
const ELEMENT_OF = { c01: 'H', c02: 'He', c03: 'Li', c04: 'Be', c05: 'B', c06: 'C', c07: 'N', c08: 'O', c09: 'F', c10: 'Ne', c18: 'Ar' };
const card = (id, at) => elementCard(id, ELEMENT_OF[id], at, { mass: CARDS[id].mass });
const COL_X = c => 13.5 + 15 * c;
const ROW_Y = 33;

export const STAGES = [
  /* ---------------------------------------------------------------- Phase 1 */
  {
    id: 'phase1',
    title: 'Phase 1 · Hull Plates',
    briefing: {
      speaker: 'Vess',
      body: 'Each phase reviews a bench from this world. Three mistakes reset the encounter.'
    },
    prompt: 'Sort each hull plate as an element, a compound, or a mixture.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        plate('plate1', 'SAMPLE A', [{ kinds: ['k06'], n: 36 }], 22, 12),
        plate('plate2', 'SAMPLE B', [{ kinds: ['k11', 'k17'], pairs: [{ a: 0, b: 1 }, { a: 2, b: 3 }, { a: 4, b: 5 }, { a: 6, b: 7 }], n: 24 }], 46, 12),
        plate('plate3', 'SAMPLE C', [{ kinds: ['k06'], n: 16 }, { kinds: ['k16'], n: 16 }], 70, 12)
      ],
      zones: {
        trays: [
          dishTray('element', 'Element', 21, 38),
          dishTray('compound', 'Compound', 60, 38),
          dishTray('mixture', 'Mixture', 99, 38)
        ]
      }
    }),
    foes: HOPPER_FOE,
    encounter: {
      species: 'the hopper',
      act: 'Strike Hull',
      intent: 'The hopper braces three composite plates against your survey beam.'
    },
    check(state) {
      const t = state.table;
      const names = { plate1: 'A', plate2: 'B', plate3: 'C' };
      const want = { plate1: 'element', plate2: 'compound', plate3: 'mixture' };
      for (const id of Object.keys(want)) {
        if (!['element', 'compound', 'mixture'].includes(trayOf(t, id))) return { ok: false, notYet: true, msg: 'Put all three plates in a tray before committing your strike.' };
      }
      const wrong = Object.keys(want).filter(id => trayOf(t, id) !== want[id]).map(id => names[id]);
      if (wrong.length) return { ok: false, msg: `Sample ${wrong[0]}\'s tray does not match its picture.` };
      return { ok: true };
    },
    hints: [
      'Use the three trays.',
      'For each sample, check how many different kinds of atom it holds and whether any of them are joined.',
      'Settle how many kinds of atom a plate holds first, and only then whether any are joined.'
    ],
    reward: {
      title: 'Hull Shattered',
      body: 'A single element stays whole, a compound is bonded atoms of different elements, and a mixture is only blended. Telling them apart is how you read what a surface is made of.',
      log: 'Three samples sorted by their atoms.'
    }
  },

  /* ---------------------------------------------------------------- Phase 2 */
  {
    id: 'phase2',
    title: 'Phase 2 · Core Readout',
    prompt: 'Build a neutral atom with the same atomic number as the sealed core.',
    widget: { type: 'table', label: 'The bench' },
    table: atomTable({
      pieces: [
        { id: 'refc', kind: 'nucleus', label: 'CORE MIDDLE', at: { x: 14, y: 11 }, fixed: true, props: { p: 6, n: 6 } },
        { id: 'refe', kind: 'specimen', label: 'CORE OUTSIDE', at: { x: 36, y: 11 }, fixed: true, props: { p: 6, n: 6, rings: [2, 4], needle: true } },
        ...heap()
      ],
      zones: {
        trays: [
          { ...trayAt('core', 'The middle', 36, 33, 12, 12), spot: true },
          { ...trayAt('out', '', 36, 33, 30, 20), orbit: { rings: [2, 8], radii: [10, 15] } }
        ]
      },
      fixtures: [
        { id: 'needle', kind: 'needle', label: 'Charge', at: { x: 80, y: 31 }, size: { w: 22, h: 14 }, noRun: true, props: { zones: ['tray:core', 'tray:out'], range: 4 } },
        { id: 'mass', kind: 'mass', label: 'Mass', at: { x: 104, y: 31 }, size: { w: 22, h: 14 }, noRun: true, props: { zones: ['tray:core', 'tray:out'], range: 12 } }
      ]
    }),
    foes: HOPPER_FOE,
    encounter: {
      species: 'the hopper',
      act: 'Probe Core',
      intent: 'An electromagnetic pulse surges from the central core chamber.'
    },
    check(state) {
      const t = state.table;
      const p = count(t, 'tray:core', 'proton');
      const e = count(t, 'tray:out', 'electron');
      if (p + e === 0) return { ok: false, notYet: true, msg: 'The atom is still empty. Drag protons into the middle and electrons outside.' };
      if (p !== 6) return { ok: false, msg: 'Your protons do not match the sealed core\'s.' };
      if (e !== p) return { ok: false, msg: 'Your needle does not read 0.' };
      return { ok: true };
    },
    hints: [
      'Use the heap, the two trays and the needle.',
      'Count the discs with a + in the middle of the sealed core and the electrons on its rings, then compare the two counts.',
      'A neutral atom balances its charge, and the atomic number is the count of protons.'
    ],
    reward: {
      title: 'Core Locked',
      body: 'The atomic number sets the identity of every element. Six protons make an atom carbon.',
      log: 'Core tuned to six protons.'
    }
  },

  /* ---------------------------------------------------------------- Phase 3 */
  {
    id: 'phase3',
    title: 'Phase 3 · Cooling Manifold',
    prompt: 'Slot the card that belongs in the open place on the chart.',
    widget: { type: 'table', label: 'The bench' },
    table: cardTable({
      pieces: [
        ...[['c03', 0], ['c04', 1], ['c05', 3], ['c06', 4], ['c07', 5], ['c08', 6], ['c09', 7]].map(([id, c]) => ({ ...card(id, { x: COL_X(c), y: ROW_Y }), fixed: true })),
        card('c02', { x: 28, y: 54 }),
        card('c10', { x: 58, y: 54 }),
        card('c18', { x: 88, y: 54 })
      ],
      zones: { slots: [cardSlot('gap', { x: COL_X(8), y: ROW_Y }, { label: '18' })] }
    }),
    foes: HOPPER_FOE,
    encounter: {
      species: 'the hopper',
      act: 'Vent Coils',
      intent: 'Cooling coils hiss as pressurized gas fills the manifolds.'
    },
    check(state) {
      const held = slotCard(state.table, 'gap');
      if (!held) return { ok: false, notYet: true, msg: 'The open place is still empty. Drag a loose card onto it.' };
      if (held === 'c02') return { ok: false, msg: 'That card sits in a different row from the open place.' };
      if (held === 'c18') return { ok: false, msg: 'That card sits in a different row from the open place.' };
      if (held !== 'c10') return { ok: false, msg: 'That card\'s proton count does not fit between the neighbours of the open place.' };
      return { ok: true };
    },
    hints: [
      'Use the loose cards and the open place.',
      'Read the proton count on the card just left of the open place and on each loose card.',
      'The open place takes the card with one more proton than the card on its left.'
    ],
    reward: {
      title: 'Manifolds Quenched',
      body: 'Atoms along a row step up one proton at a time, so a missing card can be found by counting from its neighbours. The last card in each row belongs to group 18, whose atoms have full outer shells.',
      log: 'Cooling manifolds flooded with neon gas.'
    }
  },

  /* ---------------------------------------------------------------- Phase 4 */
  {
    id: 'phase4',
    title: 'Phase 4 · Slag Assay',
    prompt: 'Sort the core slag under the element whose listed mass it balances at.',
    widget: { type: 'table', label: 'The bench' },
    table: massTable({
      pieces: [{
        id: 'slag', kind: 'sample', label: 'CORE SLAG', at: { x: 14, y: 34 },
        props: { bins: [{ mass: 10, n: 8 }, { mass: 11, n: 32 }], note: '40 atoms' }
      }],
      zones: {
        slots: [{ id: 'chute', label: 'Chute', at: { x: 14, y: 12 }, size: { w: 20, h: 17 } }],
        trays: [
          { id: 'boron', label: 'Boron 10.8', at: { x: 51, y: 60 }, size: { w: 38, h: 22 }, cell: 19 },
          { id: 'neon', label: 'Neon 20.2', at: { x: 91, y: 60 }, size: { w: 38, h: 22 }, cell: 19 },
          { id: 'chlorine', label: 'Chlorine 35.5', at: { x: 131, y: 60 }, size: { w: 38, h: 22 }, cell: 19 }
        ]
      },
      fixtures: [{
        id: 'assay', kind: 'assay', label: 'Assay', runLabel: 'Tip Sample', at: { x: 78, y: 24 }, size: { w: 96, h: 40 },
        props: { slot: 'chute' }, dials: { pivot: { min: 9.5, max: 11.5, step: 0.1, value: 10.5, label: 'Fulcrum' } }
      }]
    }),
    foes: HOPPER_FOE,
    encounter: {
      species: 'the hopper',
      act: 'Assay Slag',
      intent: 'Pulverized isotope slag rattles down the sorting chute.'
    },
    check(state) {
      const here = trayOf(state.table, 'slag');
      if (!['boron', 'neon', 'chlorine'].includes(here)) return { ok: false, notYet: true, msg: 'The slag has no tray yet.' };
      if (here !== 'boron') return { ok: false, msg: 'The slag does not balance at that tray\'s listed mass.' };
      return { ok: true };
    },
    hints: [
      'Use "Tip Sample" and the "Fulcrum" dial.',
      'Read the tally over each bin, then compare where the beam balances with the listed masses on the trays.',
      'The point where the slag balances is its average weight, and only one tray lists that mass.'
    ],
    reward: {
      title: 'Slag Identified',
      body: 'The average of an element\'s isotopes, weighted by how common each is, matches its listed atomic mass. That is how a sample can be named from its atoms alone.',
      log: 'Slag identified as boron by average atomic mass.'
    }
  },

  /* ---------------------------------------------------------------- Phase 5 */
  {
    id: 'phase5',
    title: 'Phase 5 · Swarm Weight',
    prompt: 'Balance the sealed drum of carbon with scoops of one mole each.',
    widget: { type: 'table', label: 'The bench' },
    table: balanceTable({
      unit: 'g',
      counters: { R: { label: 'ATOMS' } },
      refCrate: crate('drum', 'DRUM', { x: 0, y: 0 }, { species: 'carbon', grams: 24, sealed: true, note: 'carbon' }),
      drum: { label: 'Carbon scoops', what: 'carbon', amount: 60 },
      steps: { carbon: 12 },
      capacity: 36,
      balanceAt: { x: 65, y: 16 },
      balanceW: 110
    }),
    foes: HOPPER_FOE,
    encounter: {
      species: 'the hopper',
      act: 'Weigh Drum',
      intent: 'The hopper ejects a sealed drum of carbon soot.'
    },
    check(state) {
      const t = state.table;
      const bal = balanceRead(t, 'balance');
      const scoops = (t.zones.containers['pan-r'].contents.carbon || 0) / 12;
      if (scoops === 0) return { ok: false, notYet: true, msg: 'The right pan is empty. Pour a scoop of carbon onto it.' };
      if (!bal.level) {
        return { ok: false, msg: bal.lean < 0
          ? 'The drum is the heavier pan.'
          : 'The scoops on the right are the heavier pan.' };
      }
      return { ok: true };
    },
    hints: [
      'Use the scoops and the right pan.',
      'Each scoop is one mole of carbon, and the beam lies level when the pans weigh the same.',
      'Count the scoops on the right pan at the moment the beam lies level.'
    ],
    reward: {
      title: 'The Hopper Falls',
      body: 'Dividing a mass by the molar mass gives the moles, so 24 grams of carbon is two moles. The mole links a weighed amount to a count of atoms.',
      log: 'The Hopper dispersed. Foreign slag recovered from the chute.'
    }
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   ------------------------------------------------------------------ */

const protons = n => Array.from({ length: n }, (_, i) => to(`p${i + 1}`, 'tray:core'));
const electrons = n => Array.from({ length: n }, (_, i) => to(`e${i + 1}`, 'tray:out'));
const tipSlag = [to('slag', 'slot:chute'), { run: 'assay' }];

export const SOLUTIONS = [
  [to('plate1', 'tray:element'), to('plate2', 'tray:compound'), to('plate3', 'tray:mixture')],
  [...protons(6), ...electrons(6)],
  [to('c10', 'slot:gap')],
  [...tipSlag, { setDial: { fixture: 'assay', dial: 'pivot', value: 10.8 } }, to('slag', 'tray:boron')],
  pourSteps('carbon', 12, 2)
];

export const MISSES = [
  [to('plate1', 'tray:mixture'), to('plate2', 'tray:element'), to('plate3', 'tray:compound')],
  [...protons(7), ...electrons(7)],
  [to('c02', 'slot:gap')],
  [...tipSlag, to('slag', 'tray:neon')],
  pourSteps('carbon', 12, 1)
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export const DEBRIEF = {
  speaker: 'Vess',
  clueAwarded: 'clue_tallow_slag',
  sections: [
    {
      heading: 'What You Found',
      body: 'The Hopper has collapsed into cold slag, leaving a sample of bismuth.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase reviewed core principles from this world: matter, atomic structure, periodic trends, charge, and mass.'
    }
  ]
};

export const PRACTICE = [
  {
    id: 'p1',
    question: 'Which of the following describes a pure chemical compound?',
    options: [
      { id: 'a', label: 'Two or more elements chemically bonded in a fixed ratio' },
      { id: 'b', label: 'A physical blend of substances that can be separated by filtration' },
      { id: 'c', label: 'A substance consisting of only one type of atom' }
    ],
    answer: 'a',
    explanation: 'A compound consists of two or more elements chemically bonded in fixed proportions, unlike a mixture or an element.'
  },
  {
    id: 'p2',
    question: 'An atom has 8 protons, 8 neutrons, and 10 electrons. What is its net charge?',
    options: [
      { id: 'a', label: '-2' },
      { id: 'b', label: '+2' },
      { id: 'c', label: '0' }
    ],
    answer: 'a',
    explanation: 'Eight protons (+8) plus ten electrons (-10) gives a net charge of -2.'
  },
  {
    id: 'p3',
    question: 'Which column of the periodic table contains the unreactive noble gases?',
    options: [
      { id: 'a', label: 'Group 18' },
      { id: 'b', label: 'Group 1' },
      { id: 'c', label: 'Group 17' }
    ],
    answer: 'a',
    explanation: 'Group 18 contains helium, neon, argon, and the other noble gases with complete valence shells.'
  },
  {
    id: 'p4',
    question: 'What does the atomic number of an element represent?',
    options: [
      { id: 'a', label: 'The number of protons in the nucleus' },
      { id: 'b', label: 'The total count of protons and neutrons' },
      { id: 'c', label: 'The mass of one mole in grams' }
    ],
    answer: 'a',
    explanation: 'The atomic number (Z) uniquely identifies an element and equals the number of protons in its nucleus.'
  },
  {
    id: 'p5',
    question: 'How many atoms are in one mole of any pure substance?',
    options: [
      { id: 'a', label: '6.02 × 10²³' },
      { id: 'b', label: '1.00 × 10¹²' },
      { id: 'c', label: '3.00 × 10⁸' }
    ],
    answer: 'a',
    explanation: 'Avogadro\'s number defines one mole as exactly 6.022 × 10²³ particles.'
  }
];

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
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });

  runner.start();
  return { dispose: () => runner.dispose() };
}

