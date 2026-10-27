/**
 * boss-warden.js — Learn world 3 elite: THE BASALT WARDEN.
 *
 * The world's last guard, made of everything Ligar measured. Five phases, each on the TABLETOP of a bench the player has worked (plan
 * `bench-tabletop.md`, phase T3c), each a NEW CASE of an idea that bench taught (a different salt, a different molecule), with the
 * warden standing in the table's corner, watching it. One decision a phase, and no two phases ask the same kind of thing:
 *
 *   1  the hotplate        three salts, and which needs the most heat           (bench 3 · bonds kit)
 *   2  the pair slate      hydrogen cyanide, every lamp lit (a triple bond)     (bench 4 · atom kit)
 *   3  the domain hub      ammonia's hub, and the angle between its hydrogens   (bench 6 · domain kit)
 *   4  the charged plates  which of three molecules swings round                (bench 7 · domain kit)
 *   5  the magnet          which of three gases it draws in                     (bench 9 · orbital kit)
 *
 * (2026-10-23 rollout: sulfur tetrafluoride and xenon tetrafluoride, which asked for an expanded octet and a six-arm hub that the
 * benches no longer teach, were replaced by hydrogen cyanide and ammonia; boron trifluoride replaces sulfur tetrafluoride at the
 * plates, where the same idea, a symmetrical molecule with polar bonds, is a new case.)
 *
 * The fight keeps every rule a bench stage keeps. A phase prompt states the objective and never the route. A hint rung is one
 * sentence and never the answer. Nothing blocks a correct commit. A miss costs one point of Integrity and three knock the table back,
 * with every reading and hint still kept. The foe is the warden itself, in the corner pad of each table (`table/layout.js`
 * `FOE_PAD`): it only observes, and a boss phase never declares a field stage (the walk is suspended while the warden stands).
 *
 * Clearing it files the Case File clue `clue_ligar_scorch` and plays the quest's one story animation. The boss pays no XP: the main
 * story never does.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { LATTICES, byLatticeEnergy } from '../../engine/bonddata.js';
import { allLit } from '../../engine/lewis.js';
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

/** The three plating blocks, as the salts of Ligar's third bench. */
const PLATING = [['a', 'Plate A', 'NaCl'], ['b', 'Plate B', 'MgO'], ['c', 'Plate C', 'KCl']];

/** Phase 2's table: the tray's tiles down the left and the hydrogen cyanide slate beside them (the atom kit's, with its scratch corner). */
function ventTable() {
  const part = slateParts('a', 'HCN', slateLayout('HCN', 70, 29, 46));
  const CAPTION = { pairs: 'Adds a pair', lift: 'Takes one back' };
  const tile = (kind, label, [x, y]) => ({ id: kind, kind, label, at: { x, y }, caption: CAPTION[kind] });
  return atomTable({
    opts: { words: 'shells', slate: true },
    pieces: [tile('pairs', 'Pair', [12, 10]), tile('lift', 'Lift Out', [34, 10]), ...part.pieces],
    fixtures: [part.fixture]
  });
}

/** Phase 3's table: the nitrogen hub with its tray of three hydrogen atoms, a lone pair and the protractor, and the angle marker. */
const HUB_AT = { x: 38, y: 32 };
function hubTable() {
  const hs = hubSet('hub', 'N', HUB_AT, { label: 'Hub N', turner: { x: 100, y: 10.5 } });
  const at0 = { x: 0, y: 0 };
  const inTray = [
    ...[1, 2, 3].map(i => armPiece(`h${i}`, 'H', at0, 1, 'H')),
    balloonPiece('l1', at0),
    protractorPiece('pr', at0)
  ].map(p => ({ ...p, zone: 'tray:bin' }));
  return domainTable({
    pieces: [hs.piece, ...inTray],
    zones: { trays: [{ id: 'bin', label: 'Arms', at: { x: 112, y: 51 }, size: { w: 52, h: 26 }, cell: 13 }] },
    fixtures: [hs.fixture, hs.turner, marker('mark', { x: 100, y: 25.5 }, { label: 'Angle', size: { w: 44, h: 14 } })]
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
      body: 'Apply the bonding and structural concepts learned across Ligar to analyze each property of the warden.'
    },
    prompt: 'Place the ionic block with the highest melting point into the marked slot.',
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
      'Use the hotplate, its heat dial and the marked place.',
      'Compare lattice energies based on ionic charges and internuclear distances.',
      'Heat each ionic block to observe its melting point, then place the highest melting block into the slot.'
    ],
    check(state) {
      const t = state.table;
      const held = piecesIn(t, 'slot:most', 'salt')[0];
      if (!held) return { ok: false, notYet: true, msg: 'Put a plate in the marked place.' };
      const hot = byLatticeEnergy(PLATING.map(p => p[2]))[0];
      if (held.props.lattice === hot) return { ok: true };
      return { ok: false, msg: 'A plate gives way on the hotplate at a higher setting than the one in the marked place.' };
    },
    reward: {
      title: 'Lattice Energy and Melting Point',
      body: 'The ionic solid with smaller, higher-charge ions exhibits the highest lattice energy and melting point. Magnesium oxide (Mg2+, O2-) is held hardest and requires the most heat to melt.',
      log: 'The most tightly held salt found.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    id: 'phase2',
    title: 'Phase 2 · The Vent',
    prompt: 'Distribute all valence electrons for hydrogen cyanide until every atom satisfies the octet rule.',
    widget: { type: 'table', label: 'The bench' },
    table: ventTable(),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Seal Vent',
      intent: 'The warden vents a thin stream and its seams stand shut.'
    },
    hints: [
      'Use the Pair tile and the slate.',
      'Place a single bond between H and C, then share enough electron pairs between C and N to satisfy both octets.',
      'Form a triple bond between carbon and nitrogen, leaving one lone pair on nitrogen.'
    ],
    check(state) {
      const sl = slateOf(state.table, 'a');
      if (sl.used === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the slate.' };
      if (allLit(sl.read)) return { ok: true };
      if (sl.left > 0) return { ok: false, msg: 'Electrons are still left to place, and a lamp is still dark.' };
      return { ok: false, msg: 'Every electron is placed, and a lamp is still dark.' };
    },
    reward: {
      title: 'Triple Covalent Bond',
      body: 'Carbon and nitrogen share three electron pairs, forming a triple bond, while nitrogen retains one lone pair. This gives both carbon and nitrogen complete octets in hydrogen cyanide.',
      log: 'HCN drawn with a triple bond.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    id: 'phase3',
    title: 'Phase 3 · The Joints',
    prompt: 'Set the angle marker to the angle between two hydrogen atoms on the nitrogen hub.',
    widget: { type: 'table', label: 'The bench' },
    table: hubTable(),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Read Angle',
      intent: 'The warden stands with its columns held square.'
    },
    hints: [
      'Use the hydrogen atoms, the balloon, the protractor and the angle marker.',
      'Attach three hydrogen atoms and one lone pair to nitrogen, then measure the H-N-H angle.',
      'Lone pair repulsion compresses the tetrahedral angle from 109.5 degrees to 107 degrees in ammonia.'
    ],
    check(state) {
      const t = state.table;
      const r = hubRead(t, 'hub');
      const v = markerValue(t, 'mark');
      if (!v) return { ok: false, notYet: true, msg: 'Set the marker to an angle you have read.' };
      const hs = r.arms.map((a, i) => [a, i]).filter(([a]) => a.kind === 'arm');
      if (r.lone < 1 || hs.length < 3) return { ok: false, msg: 'Not everything from the Arms tray is on the hub yet.' };
      const real = angleBetween(r.plan, hs[0][1], hs[1][1]);
      if (Math.abs(v - real) <= 1.5) return { ok: true };
      return { ok: false, msg: 'The marker does not match the angle the protractor reads between two hydrogen atoms on the finished hub.' };
    },
    reward: {
      title: 'Trigonal Pyramidal Angle',
      body: 'Three bonding pairs and one nonbonding lone pair form a trigonal pyramidal molecular geometry. Repulsion from the lone pair compresses the H-N-H bond angles to 107 degrees.',
      log: 'NH3 built as a pyramid.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    id: 'phase4',
    title: 'Phase 4 · The Coolant',
    prompt: 'Place every molecule with a net dipole moment that aligns in the electric field into the tray.',
    widget: { type: 'table', label: 'The bench' },
    table: domainTable({
      pieces: [
        molCard('a', 'CO2', { x: 14, y: 53 }, { field: true }),
        molCard('b', 'BF3', { x: 42, y: 53 }, { field: true }),
        molCard('c', 'NH3', { x: 70, y: 53 }, { field: true }),
        arrowsTool('ar', { x: 100, y: 10 })
      ],
      zones: { trays: [{ id: 'turns', label: 'Swings round', at: { x: 114, y: 44 }, size: { w: 58, h: 26 }, cell: 20 }] },
      fixtures: [plates('pl', FIELD_AT, { size: { w: 70, h: 38 } })]
    }),
    foes: WARDEN_FOE,
    encounter: {
      species: 'basalt warden',
      act: 'Pick Turners',
      intent: 'The warden stands between the plates, with a coolant line to each molecule.'
    },
    hints: [
      'Use the molecules, the arrows, the plates and "Switch Field".',
      'Evaluate molecular geometry to determine whether polar bond dipoles cancel out.',
      'Ammonia has an asymmetrical trigonal pyramidal geometry that aligns in the field, while CO2 and BF3 cancel their dipoles.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['a', 'b', 'c'];
      const got = ids.filter(id => t.pieces[id].zone === 'tray:turns');
      if (!got.length) return { ok: false, notYet: true, msg: 'Put the molecules that swing round into the tray.' };
      const want = ids.filter(id => molRead(t.pieces[id]).polar);
      if (got.some(id => !want.includes(id))) return { ok: false, msg: 'The tray holds a molecule that did not swing round.' };
      if (want.some(id => !got.includes(id))) return { ok: false, msg: 'A molecule that swung round is not in the tray.' };
      return { ok: true };
    },
    reward: {
      title: 'Dipole Cancellation and Polarity',
      body: 'Ammonia has a net dipole moment due to its trigonal pyramidal shape and aligns in an electric field. Linear carbon dioxide and trigonal planar boron trifluoride are symmetrical, so their bond dipoles cancel.',
      log: 'One polar molecule and two nonpolar ones found.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    id: 'phase5',
    title: 'Phase 5 · The Core',
    prompt: 'Place the paramagnetic gas attracted to the magnet into the marked slot.',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: GASES.map(([id, label, mol], i) => moCard(id, label, { x: 20 + i * 34, y: 52 }, { mol })),
      zones: {
        slots: [
          { id: 'test', label: 'Gas to test', at: { x: 36, y: 22 }, size: { w: 36, h: 22 } },
          { id: 'drawn', label: 'Drawn in', at: { x: 124, y: 42 }, size: { w: 36, h: 22 } }
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
      'Use the gas cards, the test slot and "Test Sample".',
      'Test each gas with the magnet to identify which one exhibits paramagnetism.',
      'Select oxygen, whose molecular orbital configuration contains two unpaired electrons.'
    ],
    check(state) {
      const t = state.table;
      const held = piecesIn(t, 'slot:drawn', 'mocard')[0];
      if (!held) return { ok: false, notYet: true, msg: 'Put a gas in the marked place.' };
      if (DIATOMICS[held.props.mol].unpaired > 0) return { ok: true };
      return { ok: false, msg: 'The magnet did not pull the gas in the marked place.' };
    },
    reward: {
      title: 'Paramagnetism and Unpaired Electrons',
      body: 'Molecular orbital theory shows that oxygen has two unpaired electrons in degenerate antibonding pi-star orbitals, making it paramagnetic. Nitrogen and fluorine have all electrons paired and are diamagnetic.',
      log: 'The magnetic gas found.'
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
  [...deal('aj01'), ...deal('aj12', 3), ...deal('a2')],
  [...on('h1', 'h2', 'h3', 'l1'), ...read('h1', 'h2'), set(107)],
  [between('a'), field, free('a', 14, 53), between('b'), free('b', 42, 53), between('c'), into('c', 'turns', 'tray')],
  [...test('n2'), ...test('o2'), ...test('f2'), into('o2', 'drawn')]
];

/** A plausible wrong answer per phase. Each must be refused, and must say why. */
export const MISSES = [
  [into('a', 'most')],
  [...deal('aj01'), ...deal('aj12')],
  [...on('h1', 'h2', 'h3', 'l1'), ...read('h1', 'h2'), set(120)],
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
      heading: 'Summary',
      body: 'The warden is cleared. Analysis confirms distinct ionic and covalent mineral phases, reflecting bonding principles across different chemical structures.'
    },
    {
      heading: 'Bonding Review',
      body: 'Solving each phase required evaluating lattice energy, Lewis structure octets, VSEPR molecular geometry, dipole symmetry, and molecular orbital configurations.'
    },
    {
      heading: 'Next',
      body: 'The mineral sample from the site is recorded in the Case File for the investigation.'
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
    question: 'In the Lewis structure of hydrogen cyanide, HCN, how many pairs are shared between the carbon and the nitrogen?',
    options: [
      { id: 'a', label: 'Three' },
      { id: 'b', label: 'One' },
      { id: 'c', label: 'Two' },
      { id: 'd', label: 'Four' }
    ],
    answer: 'a',
    explanation: 'HCN has 10 valence electrons. Carbon shares one pair with hydrogen and three with nitrogen, and nitrogen keeps one lone pair, so every atom has a full outer shell.'
  },
  {
    question: 'Why is the angle between the hydrogen atoms in ammonia a little less than 109.5°?',
    options: [
      { id: 'a', label: 'Its lone pair pushes the bonding pairs closer together' },
      { id: 'b', label: 'Nitrogen is larger than hydrogen' },
      { id: 'c', label: 'The N–H bonds are double bonds' },
      { id: 'd', label: 'Ammonia has no lone pair' }
    ],
    answer: 'a',
    explanation: 'The lone pair on nitrogen takes more room than a bonding pair, squeezing the angle between the three hydrogen atoms to about 107 degrees.'
  },
  {
    question: 'Which molecule is polar?',
    options: [
      { id: 'a', label: 'NH₃' },
      { id: 'b', label: 'CO₂' },
      { id: 'c', label: 'BF₃' },
      { id: 'd', label: 'CCl₄' }
    ],
    answer: 'a',
    explanation: 'Ammonia is a pyramid, so its bond dipoles add. The other three are symmetrical and their dipoles cancel.'
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
export { planDomains, planDipole, bondAngles, LATTICES };
