/**
 * boss-warden.js — Learn world 3 elite: THE BASALT WARDEN.
 *
 * The world's last guard, made of everything Ligar measured. Five phases, each on the TABLETOP of a bench the player has
 * worked (plan `bench-tabletop.md`, phase T3c), with a new molecule or a new set of salts on the table and the warden
 * standing in the table's corner, watching it:
 *
 *   1  the hotplate        three lattices, and which needs the most heat        (bench 3 · bonds kit)
 *   2  the pair slate      SF4, every lamp lit, sulfur past eight               (bench 4 · atom kit)
 *   3  the domain hub      XeF4's hub, and the angle between neighbours         (bench 6 · domain kit)
 *   4  the charged plates  which of three molecules turns                       (bench 7 · domain kit)
 *   5  the magnet          which of three gases it draws in                     (bench 9 · orbital kit)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung
 * is one sentence and never the answer. Nothing blocks a correct commit. A miss costs one point of Integrity and three
 * knock the table back, with every reading and hint still kept. The foe is the warden itself, in the corner pad of each
 * table (`table/layout.js` `FOE_PAD`): it only observes, and a boss phase never declares a field stage (the walk is
 * suspended while the warden stands).
 *
 * Clearing it files the Case File clue `clue_ligar_scorch`. The boss pays no XP: the main story never does.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { LATTICES, byLatticeEnergy } from '../../engine/bonddata.js';
import { MOLECULES, allLit } from '../../engine/lewis.js';
import { planDomains, planDipole, bondAngles, angleBetween } from '../../engine/vsepr.js';
import { DIATOMICS } from '../../engine/mo.js';
import { bondsTable, saltPiece, hotplate, piecesIn } from '../../table/kits/bonds.js';
import { atomTable, slateParts, slateLayout, slateOf } from '../../table/kits/atoms.js';
import {
  domainTable, hubSet, armPiece, balloonPiece, protractorPiece, marker, markerValue, hubRead, molCard, molRead, plates, arrowsTool
} from '../../table/kits/domain.js';
import { moTable, magnet, moCard } from '../../table/kits/mo.js';
import { session } from '../../../session.js';

export const meta = { stageCount: 5 };

export const BUILDS_ON = [
  'unit03/q3-distance', 'unit03/q4-dots', 'unit03/q6-shape', 'unit03/q7-polarity', 'unit03/q9-orbitals'
];

const SPEAKER = 'Vess';

/** Every key on these tables says what it does on its cap, so none carries a legend. */
export function toolNoteFor() { return null; }

/** The warden, as every phase's foe: one body, watching the table. It reads no probe, it only observes. */
const WARDEN_FOE = [{ id: 'warden', label: 'The Basalt Warden' }];

/* ------------------------------------------------------------------
   THE TABLES
   Each phase keeps the top-right corner clear for the foe (`FOE_PAD`).
   ------------------------------------------------------------------ */

const into = (id, zone, kind = 'slot') => ({ place: { piece: id, to: `${kind}:${zone}` } });

/** The three plating blocks, as the lattices of Ligar's third bench. */
const PLATING = [['a', 'Plate A', 'NaCl'], ['b', 'Plate B', 'MgO'], ['c', 'Plate C', 'KCl']];

/** Phase 2's table: the tray's tiles down the left and the SF4 slate beside them (the atom kit's, with its scratch corner). */
function ventTable() {
  const part = slateParts('a', 'SF4', slateLayout('SF4', 70, 29, 46));
  const tile = (kind, label, [x, y]) => ({ id: kind, kind, label, at: { x, y } });
  return atomTable({
    opts: { words: 'shells', slate: true },
    pieces: [tile('pairs', 'Pair', [10, 10]), tile('lift', 'Lift Out', [26, 10]), tile('three', '3 Pairs', [10, 26]), ...part.pieces],
    fixtures: [part.fixture]
  });
}

/** Phase 3's table: the xenon hub with its tray of four fluorine atoms, two lone pairs and the protractor, and the angle marker. */
const HUB_AT = { x: 38, y: 32 };
function hubTable() {
  const hs = hubSet('hub', 'Xe', HUB_AT, { label: 'Hub Xe', turner: { x: 100, y: 12 } });
  const at0 = { x: 0, y: 0 };
  const inTray = [
    ...[1, 2, 3, 4].map(i => armPiece(`f${i}`, 'F', at0, 1, 'F')),
    balloonPiece('l1', at0), balloonPiece('l2', at0),
    protractorPiece('pr', at0)
  ].map(p => ({ ...p, zone: 'tray:bin' }));
  return domainTable({
    pieces: [hs.piece, ...inTray],
    zones: { trays: [{ id: 'bin', label: 'Arms', at: { x: 112, y: 51 }, size: { w: 52, h: 26 }, cell: 13 }] },
    fixtures: [hs.fixture, hs.turner, marker('mark', { x: 100, y: 28 }, { label: 'Angle' })]
  });
}

const FIELD_AT = { x: 37, y: 22 };

/** Phase 5's gases: three sealed canisters, the magnet that tests the one in its slot, and the place the gas it draws in goes. */
const GASES = [['n2', 'N₂', 'N2'], ['o2', 'O₂', 'O2'], ['f2', 'F₂', 'F2']];

/* ------------------------------------------------------------------
   THE FIVE PHASES
   ------------------------------------------------------------------ */
export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    id: 'phase1',
    title: 'Phase 1 · The Plating',
    briefing: {
      speaker: SPEAKER,
      body: 'This is the warden Ligar guards itself with, and each phase puts one of the benches in front of it again. A miss costs the table a point of Integrity; three knock it back, and nothing you have read is lost.'
    },
    prompt: 'Put the plating block that takes the most heat to melt in the marked place.',
    widget: { type: 'table', label: 'The bench' },
    table: bondsTable({
      pieces: PLATING.map(([id, label, lat], i) => saltPiece(id, label, lat, { x: 22 + i * 34, y: 56 })),
      zones: { slots: [{ id: 'most', label: 'Needs the most heat', at: { x: 122, y: 40 }, size: { w: 26, h: 20 } }] },
      fixtures: [hotplate('hp', { x: 49, y: 19 }, { w: 92, h: 32, max: 3000, step: 25 })]
    }),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Name Plate',
      intent: 'A basalt warden stands over three blocks of its own plating.'
    },
    hints: [
      'Read the ions printed on each plate, or slide one onto the hotplate and turn the dial up until it gives way.',
      'Compare the charges on the ions of the three plates, and then the distance between their centres.',
      'The lattice held hardest by charge and by closeness is the one that takes the most heat.'
    ],
    check(state) {
      const t = state.table;
      const held = piecesIn(t, 'slot:most', 'salt')[0];
      if (!held) return { ok: false, notYet: true, msg: 'Put a plate in the marked place.' };
      const hot = byLatticeEnergy(PLATING.map(p => p[2]))[0];
      if (held.props.lattice === hot) return { ok: true };
      return { ok: false, msg: 'A plate that is held less tightly gives its ions up at a lower temperature. Read the ions again.' };
    },
    reward: {
      title: 'Plating Cracked',
      body: 'The lattice with the larger charges on smaller ions is held hardest, and it takes the most heat to melt. The warden\'s plating gives where it is held least.',
      log: 'The most tightly held lattice found.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'phase2',
    title: 'Phase 2 · The Vent',
    prompt: 'Place all valence electrons for sulfur tetrafluoride until every lamp lights.',
    widget: { type: 'table', label: 'The bench' },
    table: ventTable(),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Seal Vent',
      intent: 'The warden vents a thin stream and its seams stand shut.'
    },
    hints: [
      'Drag a pair from the tray onto the joint between two atoms, or onto one atom.',
      'Compare the lamps on the fluorine atoms with the lamp on sulfur as the tray runs down.',
      'Put the pairs that are left after the bonds and the fluorine atoms are done onto sulfur.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the tray\'s electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still in the tray, and a lamp is still dark.' };
      return { ok: false, msg: 'The tray is empty but a lamp is still dark, or an atom has more round it than it can hold.' };
    },
    reward: {
      title: 'Vent Sealed',
      body: 'Sulfur takes four bonds and keeps a lone pair, ten electrons in all. Atoms on the third ring and below can hold more than eight.',
      log: 'SF4 drawn with sulfur past eight.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'phase3',
    title: 'Phase 3 · The Joints',
    prompt: 'Set the angle marker to the angle between neighbouring fluorine atoms on the xenon hub.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable(),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Read Angle',
      intent: 'The warden stands with its columns held square.'
    },
    hints: [
      'Drop the four fluorine atoms and both lone pairs on the hub, then lay the protractor on two neighbours.',
      'Compare where the lone pairs settle with where the fluorine atoms settle.',
      'The fluorine atoms lie in a flat square once the lone pairs are opposite each other.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      const fs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      if (r.lone < 2 || fs.length < 4) return { ok: false, msg: 'Build the hub with everything in the tray on it, then read the protractor between two fluorine atoms that sit next to each other.' };
      let near = Infinity;
      for (let i = 0; i < fs.length; i++) for (let j = i + 1; j < fs.length; j++) near = Math.min(near, angleBetween(r.plan, fs[i][1], fs[j][1]));
      if (Math.abs(v - near) <= 1.5) return { ok: true };
      return { ok: false, msg: 'Lay the protractor across two fluorine atoms that sit next to each other on the finished hub, and read it again.' };
    },
    reward: {
      title: 'Joints Locked',
      body: 'Six domains with two lone pairs opposite leave the four atoms in a flat square, 90 degrees apart. XeF₄ is square planar.',
      log: 'XeF4 built square.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'phase4',
    title: 'Phase 4 · The Coolant',
    prompt: 'Put every molecule that turns in the electric field into the tray.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'CO2', { x: 14, y: 54 }, { field: true }),
        molCard('b', 'SF4', { x: 44, y: 54 }, { field: true }),
        molCard('c', 'NH3', { x: 74, y: 54 }, { field: true }),
        arrowsTool('ar', { x: 100, y: 10 })
      ],
      zones: { trays: [{ id: 'turns', label: 'Turns in the field', at: { x: 112, y: 44 }, size: { w: 62, h: 26 }, cell: 20 }] },
      fixtures: [plates('pl', FIELD_AT, { size: { w: 70, h: 38 } })]
    }),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Pick Turners',
      intent: 'The warden stands between the plates, with a coolant line to each molecule.'
    },
    hints: [
      'Put each molecule between the plates, switch the field on and lay the arrows on it.',
      'Compare the net arrow on each plate once the bond arrows are added.',
      'A molecule turns when its bond arrows add to a net arrow and stays still when they cancel.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c'];
      const got = ids.filter(id => t.pieces[id].zone === 'tray:turns');
      if (!got.length) return { ok: false, notYet: true, msg: 'Put the molecules that turn in the tray.' };
      const want = ids.filter(id => molRead(t.pieces[id]).polar);
      if (got.join() === want.join()) return { ok: true };
      return { ok: false, msg: 'Switch the field on and watch which molecules do not move, then check the tray against them.' };
    },
    reward: {
      title: 'Coolant Grounded',
      body: 'Sulfur tetrafluoride and ammonia have a net pull because their shapes are lopsided, so they turn. Carbon dioxide\'s pulls cancel in a straight line, so it does not.',
      log: 'Two polar molecules and one nonpolar one found.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'phase5',
    title: 'Phase 5 · The Core',
    prompt: 'Put the gas the magnet draws in the marked place.',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: GASES.map(([id, label, mol], i) => moCard(id, label, { x: 20 + i * 34, y: 52 }, { mol })),
      zones: {
        slots: [
          { id: 'test', label: 'Gas to test', at: { x: 36, y: 22 }, size: { w: 36, h: 22 } },
          { id: 'drawn', label: 'Drawn in', at: { x: 118, y: 42 }, size: { w: 36, h: 22 } }
        ]
      },
      fixtures: [magnet('magnet', { x: 76, y: 22 }, { slot: 'test', size: { w: 34, h: 30 }, label: 'Magnet' })]
    }),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Pick Gas',
      intent: 'The warden stands over three gas lines, none of them marked.'
    },
    hints: [
      'Put each gas in the test slot and press "Test Sample".',
      'Compare how hard the magnet pulls on each of the three gases.',
      'Electrons that stand alone in a box are the ones a magnet pulls.'
    ],
    check(state) {
      const t = state.table;
      const held = piecesIn(t, 'slot:drawn', 'mocard')[0];
      if (!held) return { ok: false, notYet: true, msg: 'Put a gas in the marked place.' };
      if (DIATOMICS[held.props.mol].unpaired > 0) return { ok: true };
      return { ok: false, msg: 'Test all three gases with the magnet and compare what each does.' };
    },
    reward: {
      title: 'Core Exposed',
      body: 'Only oxygen has electrons standing alone, in two separate antibonding boxes, so only oxygen is pulled by the magnet. Nitrogen and fluorine have every electron paired.',
      log: 'The paramagnetic gas found.'
    }
  }
];

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES — SCRIPTS OF THE PLAYER'S OWN ACTIONS
   A solution is what a player does, not what the table ends as: `verify:table` replays each one through the reducer by
   direct actions, by drag and by two taps. A block or a gas is put in a place, a tray piece is dropped on a joint or an
   atom, an arm on the hub, a molecule in a tray, a marker is a dial. Nothing here says which block is held hardest or where
   an arm settles.
   ------------------------------------------------------------------ */

const deal = (target, n = 1, tool = 'pairs') => Array.from({ length: n }, () => ({ join: [tool, target] }));
const on = (...ids) => ids.map(id => ({ join: [id, 'hub'] }));
const read = (a, b) => [{ join: ['pr', a] }, { join: ['pr', b] }];
const set = value => ({ setDial: { fixture: 'mark', dial: 'value', value } });
const field = { run: 'pl' };
const free = (id, x, y) => ({ place: { piece: id, to: `free:${x},${y}` } });
const between = id => free(id, 37, 22);
const test = (id) => [into(id, 'test'), { run: 'magnet' }];

/** The bench state that solves each phase, in order. Checked by verify:learn and verify:table. */
export const SOLUTIONS = [
  [into('b', 'most')],
  [...['aj01', 'aj02', 'aj03', 'aj04'].flatMap(j => deal(j)), ...['a1', 'a2', 'a3', 'a4'].flatMap(a => deal(a, 1, 'three')), ...deal('a0')],
  [...on('f1', 'f2', 'f3', 'f4', 'l1', 'l2'), ...read('f1', 'f2'), set(90)],
  [between('a'), field, free('a', 14, 54), between('b'), into('b', 'turns', 'tray'), between('c'), into('c', 'turns', 'tray')],
  [...test('n2'), ...test('o2'), ...test('f2'), into('o2', 'drawn')]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [into('a', 'most')],
  [...['aj01', 'aj02', 'aj03', 'aj04'].flatMap(j => deal(j))],
  [...on('f1', 'f2', 'f3', 'f4', 'l1', 'l2'), ...read('f1', 'f2'), set(120)],
  [into('a', 'turns', 'tray'), into('b', 'turns', 'tray')],
  [into('n2', 'drawn')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  clueAwarded: 'clue_ligar_scorch',
  sections: [
    {
      heading: 'What You Found',
      body: 'The warden settles back into quarry stone. Look at the cut behind it: that face was sliced clean through ionic and covalent rock alike, with heat no refinery torch the Guilds ever chartered could make.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'Every phase was a bench you had already worked: a lattice, a Lewis structure, a shape, a field and a magnet. That is all of Ligar, and it was enough to read the guard.'
    },
    {
      heading: 'Next',
      body: 'The slab behind the warden goes into the Case File. Whoever made that cut was not working with bonds at all.'
    }
  ]
};

/* ------------------------------------------------------------------
   PRACTICE PROBLEMS
   ------------------------------------------------------------------ */
export const PRACTICE = [
  {
    question: 'Which of these ionic solids would you expect to have the highest melting point?',
    options: [
      { id: 'a', label: 'MgO' },
      { id: 'b', label: 'NaCl' },
      { id: 'c', label: 'KCl' },
      { id: 'd', label: 'NaI' }
    ],
    answer: 'a',
    explanation: 'Lattice energy rises with ion charge and falls with ion size. MgO has 2+ and 2− ions that are small, so it is held hardest and melts highest.'
  },
  {
    question: 'In the Lewis structure of SF₄, how many lone pairs are on sulfur?',
    options: [
      { id: 'a', label: 'One' },
      { id: 'b', label: 'None' },
      { id: 'c', label: 'Two' },
      { id: 'd', label: 'Three' }
    ],
    answer: 'a',
    explanation: 'SF₄ has 34 valence electrons. Four bonds and twelve lone pairs on the fluorine atoms use 32, leaving one lone pair on sulfur.'
  },
  {
    question: 'What is the F–Xe–F angle between neighbouring fluorine atoms in XeF₄?',
    options: [
      { id: 'a', label: '90°' },
      { id: 'b', label: '109.5°' },
      { id: 'c', label: '120°' },
      { id: 'd', label: '180°' }
    ],
    answer: 'a',
    explanation: 'XeF₄ is square planar: six domains, with the two lone pairs opposite, so neighbouring atoms are 90 degrees apart.'
  },
  {
    question: 'Which of these molecules is polar?',
    options: [
      { id: 'a', label: 'NH₃' },
      { id: 'b', label: 'CO₂' },
      { id: 'c', label: 'XeF₄' },
      { id: 'd', label: 'BF₃' }
    ],
    answer: 'a',
    explanation: 'Ammonia is trigonal pyramidal, so its bond dipoles add. The other three are symmetrical and their dipoles cancel.'
  },
  {
    question: 'Which diatomic molecule is paramagnetic?',
    options: [
      { id: 'a', label: 'O₂' },
      { id: 'b', label: 'N₂' },
      { id: 'c', label: 'F₂' },
      { id: 'd', label: 'H₂' }
    ],
    answer: 'a',
    explanation: 'O₂ has two unpaired electrons in separate π* orbitals. N₂, F₂ and H₂ have every electron paired.'
  }
];


/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  // Clearing the last phase files the clue. The boss pays no XP, so this is not a rail.
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

/* Exported for `verify:learn`, which holds every graded figure to the planners. */
export { planDomains, planDipole, bondAngles, LATTICES, MOLECULES };
