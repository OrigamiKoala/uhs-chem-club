/**
 * q9-orbitals.js — Ligar, bench nine: MOLECULAR ORBITALS. Beyond a first course, and the bench says so.
 *
 * The ninth bench on the world and its seventh TABLETOP (plan `bench-tabletop.md`, phase T3c).
 * Comprehensive multi-stage exploration of molecular orbital (MO) theory:
 *   1  PREDICT: does an external magnetic field attract oxygen gas, O2?
 *   2  TEST: sort four gases by whether the magnet pulls on them -> paramagnetism vs diamagnetism
 *   3  MO DIAGRAM: pour oxygen's electrons into the MO ladder -> Hund's rule and unpaired electrons
 *   4  CONSTRUCTIVE VS DESTRUCTIVE: in-phase AO addition (bonding) vs out-of-phase subtraction (antibonding)
 *   5  SYMMETRY & TRANSITION: sigma vs pi symmetry, nodal planes, free atoms to bonded MOs
 *   6  BOND ORDER: calculate bond orders and determine molecular stability
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { DIATOMICS, fillMO, boxKeyMO } from '../../engine/mo.js';
import {
  moTable, moRack, moSupply, magnet, moCard, fillSteps, readOf, matchesGround, magnetRead
} from '../../table/kits/mo.js';
import { predictStage, testPrompt, verdictLine } from './_ligar.js';

export const meta = { stageCount: 6 };

export const VOCABULARY = [
  { term: /\bdiamagnetic\b/i, introducedAt: 2 },
  { term: /\bparamagnetic\b/i, introducedAt: 2 },
  { term: /\bantibonding\b/i, introducedAt: 3 },
  { term: /\bbonding orbitals?\b/i, introducedAt: 3 },
  { term: /\bmolecular orbitals?\b/i, introducedAt: 3 }
];

export const BUILDS_ON = ['unit03/q8-hybrid', 'unit02/q6-filling', 'unit03/q3-distance'];

const SPEAKER = 'Vess';

const QUEST_KEY = 'unit03/q9-orbitals';
const GUESSES = [
  ['pulled', 'the magnet pulls the oxygen', ['The magnet pulls', 'the oxygen', 'toward it']],
  ['nothing', 'the magnet does nothing to the oxygen', ['The magnet does', 'nothing to', 'the oxygen']],
  ['pushed', 'the magnet pushes the oxygen away', ['The magnet pushes', 'the oxygen', 'away']]
];

export function toolNoteFor() { return null; }

/* ------------------------------------------------------------------
   THE TABLES
   ------------------------------------------------------------------ */

const RACK_AT = { x: 74, y: 32 };
const SEATED = 10;
const JAR_AT = { x: 15, y: 40 };

const GASES = [['n2', 'N₂', 'N2'], ['o2', 'O₂', 'O2'], ['f2', 'F₂', 'F2'], ['b2', 'B₂', 'B2']];

const tray = (id, label, at, size, cell = 20) => ({ id, label, at, size, cell });
const card = (id, label, at, props = {}) => ({ id, kind: 'card', label, at, r: 7, props });
const where = (t, id) => (t.pieces[id]?.zone || '').replace(/^(tray|slot):/, '');
const inTray = (t, id) => (t.pieces[id]?.zone || '').startsWith('tray:');

/* ------------------------------------------------------------------
   THE SIX STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  predictStage({
    key: QUEST_KEY,
    title: 'A Magnet and a Gas',
    prompt: 'Does an external magnetic field attract oxygen gas, O2?',
    cards: GUESSES,
    hints: [
      'Use the three cards and the slot.',
      'Consider whether all electrons in molecular oxygen are truly paired in reality.',
      'Select the card matching your prediction.'
    ],
    reward: {
      title: 'Prediction Recorded',
      body: 'Your prediction is recorded. Test each diatomic gas sample beside the magnet on the bench.'
    }
  }),

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Four Gases',
    get prompt() {
      return testPrompt(QUEST_KEY, GUESSES, 'sort each gas by whether it is attracted to the magnet.');
    },
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: GASES.map(([id, label, mol], i) => moCard(id, label, { x: 20 + i * 26, y: 52 }, { mol })),
      zones: {
        slots: [{ id: 'test', label: 'Gas to test', at: { x: 30, y: 21 }, size: { w: 32, h: 20 } }],
        trays: [
          { id: 'pulled', label: 'Pulled', at: { x: 118, y: 13 }, size: { w: 48, h: 14 }, cell: 22 },
          { id: 'ignored', label: 'Not pulled', at: { x: 118, y: 36 }, size: { w: 48, h: 14 }, cell: 22 }
        ]
      },
      fixtures: [magnet('magnet', { x: 76, y: 22 }, { slot: 'test', size: { w: 34, h: 30 }, label: 'Magnet' })]
    }),
    hints: [
      'Use the gas cards, the test slot, "Test Sample" and the two trays.',
      'Test each diatomic gas to observe its magnetic behavior.',
      'Sort gases attracted to the magnetic field into "Pulled" and the others into "Not pulled".'
    ],
    check(state) {
      const t = state.table;
      const ids = GASES.map(g => g[0]);
      const where = Object.fromEntries(ids.map(id => [id, ['pulled', 'ignored'].find(z => t.pieces[id].zone === `tray:${z}`) || null]));
      if (Object.values(where).some(z => !z)) return { ok: false, notYet: true, msg: 'Sort all four gases into trays.' };
      const wrong = ids.find(id => where[id] !== (DIATOMICS[t.pieces[id].props.mol].unpaired > 0 ? 'pulled' : 'ignored'));
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is under a heading the magnet did not show.` };
      return { ok: true };
    },
    get reward() {
      return {
        log: 'Oxygen and diboron were pulled. Nitrogen and fluorine were not.',
        title: 'Paramagnetism in Diatomic Gases',
        body: `${verdictLine(QUEST_KEY, 'pulled')}Gases with unpaired electrons are paramagnetic and attracted to a magnetic field, whereas gases with all electrons paired are diamagnetic and unpulled. Standard Lewis structures show only paired electrons and fail to explain this paramagnetism, requiring molecular orbital theory.`
      };
    }
  },

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const rack = moRack('a', 'O2', RACK_AT, { plain: true });
    const seated = fillMO(DIATOMICS.O2.order, SEATED);
    for (const c of rack.containers) c.contents = { electron: (seated[boxKeyMO(c.props.mo.row, c.props.mo.idx)] || '').length };
    return {
      title: 'Oxygen\'s Boxes',
      prompt: 'Pour the two electrons left in the jar into the boxes so that the rack pulls on the magnet like the real sample.',
      widget: { type: 'table', label: 'The bench' },
      table: moTable({
        zones: { containers: [moSupply('supply', 'Electrons', JAR_AT, DIATOMICS.O2.e - SEATED), ...rack.containers] },
        fixtures: [rack.fixture, magnet('magnet', { x: 134, y: 36 }, { mol: 'O2' })]
      }),
      hints: [
        'Use the jar of electrons, the boxes and the magnet.',
        'Compare the rack\'s UNPAIRED count with the pull the magnet gives the real sample.',
        'Electrons settle in the lowest box with room, and boxes of equal energy each take one before any takes a second.'
      ],
      check(state) {
        const t = state.table;
        const r = readOf(t, 'a');
        if (r.total === 0) return { ok: false, notYet: true, msg: 'Place the electrons on the rack.' };
        if (r.total !== DIATOMICS.O2.e) return { ok: false, msg: 'The rack holds a different number of electrons than the molecule has.' };
        if (r.unpaired !== magnetRead(t, 'magnet').real) return { ok: false, msg: 'The rack and the magnet do not agree about how many electrons stand alone.' };
        if (matchesGround(t, 'a', DIATOMICS.O2.e)) return { ok: true };
        return { ok: false, msg: 'An electron is sitting higher on the ladder than it needs to be.' };
      },
      reward: {
        log: 'Two electrons stand alone.',
        title: 'Hund\'s Rule in Molecular Orbitals',
        body: 'Atomic orbitals combine into lower-energy bonding orbitals and higher-energy antibonding orbitals. In O2, Hund\'s rule places the last two valence electrons unpaired into separate degenerate antibonding molecular orbitals, explaining why liquid oxygen is paramagnetic.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Interference of Orbitals',
    prompt: 'Sort each orbital combination into whether in-phase addition forms a bonding orbital or out-of-phase subtraction forms an antibonding orbital.',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: [
        card('ao1', '1s + 1s', { x: 26, y: 15 }, { type: 'bonding' }),
        card('ao2', '1s − 1s', { x: 58, y: 15 }, { type: 'antibonding' }),
        card('ao3', '2pz + 2pz', { x: 92, y: 15 }, { type: 'bonding' }),
        card('ao4', '2pz − 2pz', { x: 124, y: 15 }, { type: 'antibonding' })
      ],
      zones: {
        trays: [
          tray('bonding', 'Bonding (In-Phase)', { x: 44, y: 40 }, { w: 58, h: 14 }),
          tray('antibonding', 'Antibonding (Out-of-Phase)', { x: 106, y: 40 }, { w: 58, h: 14 })
        ]
      }
    }),
    hints: [
      'In-phase combinations (sum) add wave amplitudes constructively between nuclei.',
      'Out-of-phase combinations (difference) cancel between nuclei, leaving a nodal plane.',
      'Place addition combinations into "Bonding" and subtraction combinations into "Antibonding".'
    ],
    check(state) {
      const t = state.table;
      const ids = ['ao1', 'ao2', 'ao3', 'ao4'];
      if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Sort all four combinations into trays.' };
      const wrong = ids.find(id => where(t, id) !== t.pieces[id].props.type);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is placed in the wrong interference tray.` };
      return { ok: true };
    },
    reward: {
      log: 'In-phase overlap forms bonding orbitals; out-of-phase forms antibonding.',
      title: 'Constructive and Destructive Overlap',
      body: 'When atomic orbitals add in-phase, constructive interference concentrates electron density between nuclei, forming a lower-energy bonding orbital. Out-of-phase subtraction creates a nodal plane between the nuclei where density is zero, forming a higher-energy antibonding orbital.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Sigma and Pi Symmetry',
    prompt: 'Sort each molecular orbital into whether it exhibits cylindrical sigma symmetry or side-by-side pi symmetry.',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: [
        card('m1', 'σ (1s + 1s)', { x: 26, y: 15 }, { sym: 'cylindrical' }),
        card('m2', 'σ* (1s − 1s)', { x: 58, y: 15 }, { sym: 'cylindrical' }),
        card('m3', 'π (2px + 2px)', { x: 92, y: 15 }, { sym: 'sidebyside' }),
        card('m4', 'π* (2px − 2px)', { x: 124, y: 15 }, { sym: 'sidebyside' })
      ],
      zones: {
        trays: [
          tray('cylindrical', 'Sigma symmetry (σ / σ*)', { x: 44, y: 40 }, { w: 58, h: 14 }),
          tray('sidebyside', 'Pi symmetry (π / π*)', { x: 106, y: 40 }, { w: 58, h: 14 })
        ]
      }
    }),
    hints: [
      'Head-on overlap along the internuclear axis produces cylindrical sigma symmetry.',
      'Parallel overlap perpendicular to the bond axis produces pi symmetry with lobes above and below.',
      'Sort σ and σ* into Sigma symmetry, and π and π* into Pi symmetry.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['m1', 'm2', 'm3', 'm4'];
      if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Sort all four molecular orbitals into trays.' };
      const wrong = ids.find(id => where(t, id) !== t.pieces[id].props.sym);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} belongs in the other symmetry tray.` };
      return { ok: true };
    },
    reward: {
      log: 'Head-on overlap forms sigma symmetry; parallel overlap forms pi symmetry.',
      title: 'Symmetry of Molecular Orbitals',
      body: 'Head-on overlap of s or pz orbitals produces cylindrical sigma (σ) and sigma-star (σ*) orbitals symmetric about the bond axis. Side-by-side overlap of parallel p orbitals produces pi (π) and pi-star (π*) orbitals with electron density above and below the internuclear axis.'
    }
  },

  /* ---------------------------------------------------------------- 6 */
  {
    title: 'Bond Order and Stability',
    prompt: 'Sort each diatomic molecule into the tray matching its bond order calculated as bonding minus antibonding electrons divided by two.',
    widget: { type: 'table', label: 'The bench' },
    table: moTable({
      pieces: [
        card('b_he2', 'He₂ (2 b, 2 ab)', { x: 24, y: 15 }, { bo: 'bo0' }),
        card('b_h2', 'H₂ (2 b, 0 ab)', { x: 58, y: 15 }, { bo: 'bo1' }),
        card('b_o2', 'O₂ (8 b, 4 ab)', { x: 92, y: 15 }, { bo: 'bo2' }),
        card('b_n2', 'N₂ (8 b, 2 ab)', { x: 126, y: 15 }, { bo: 'bo3' })
      ],
      zones: {
        trays: [
          tray('bo0', 'Bond order 0 (Unbound)', { x: 24, y: 40 }, { w: 38, h: 14 }),
          tray('bo1', 'Bond order 1 (Single)', { x: 62, y: 40 }, { w: 34, h: 14 }),
          tray('bo2', 'Bond order 2 (Double)', { x: 97, y: 40 }, { w: 34, h: 14 }),
          tray('bo3', 'Bond order 3 (Triple)', { x: 132, y: 40 }, { w: 34, h: 14 })
        ]
      }
    }),
    hints: [
      'Use the formula: Bond Order = (Bonding electrons - Antibonding electrons) / 2.',
      'He2 has (2 - 2)/2 = 0; H2 has (2 - 0)/2 = 1; O2 has (8 - 4)/2 = 2; N2 has (8 - 2)/2 = 3.',
      'Sort each diatomic molecule into its corresponding bond order tray.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['b_he2', 'b_h2', 'b_o2', 'b_n2'];
      if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Classify all four molecules into trays.' };
      const wrong = ids.find(id => where(t, id) !== t.pieces[id].props.bo);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} has a different bond order.` };
      return { ok: true };
    },
    reward: {
      log: 'Bond order = (Bonding - Antibonding) / 2.',
      title: 'Bond Order and Molecular Stability',
      body: 'Bond order = (Bonding - Antibonding) / 2. He2 has equal bonding and antibonding electrons, yielding bond order 0 so it cannot form a stable molecule. O2 has bond order 2, forming a stable double bond with two unpaired electrons.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   THE DEBRIEF
   ------------------------------------------------------------------ */
export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'Summary',
      body: 'Molecular orbital theory describes bonding through combinations of atomic orbitals into bonding and antibonding molecular orbitals. Oxygen possesses two unpaired electrons in antibonding orbitals, accounting for its paramagnetism.'
    },
    {
      heading: 'Bond Order and Stability',
      body: 'Bond order equals half the difference between bonding and antibonding electrons, providing quantitative predictions of bond stability.'
    },
    {
      heading: 'Next',
      body: 'Apply concepts of chemical bonding, molecular geometry, and electron structure in the unit assessment.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES
   ------------------------------------------------------------------ */

const pour = (to, n = 1, from = 'supply') => ({ pour: { from, to: `a.${to}`, what: 'electron', amount: n } });
const guess = id => ({ place: { piece: id, to: 'slot:guess' } });
const test = id => [{ place: { piece: id, to: 'slot:test' } }, { run: 'magnet' }];
const file = (id, zone) => ({ place: { piece: id, to: `tray:${zone}` } });
const put = (piece, to) => ({ place: { piece, to } });

function lastSteps() {
  const full = fillMO(DIATOMICS.O2.order, DIATOMICS.O2.e);
  const seated = fillMO(DIATOMICS.O2.order, SEATED);
  return Object.entries(full).map(([k, v]) => [k, v.length - (seated[k] || '').length]).filter(([, n]) => n > 0)
    .map(([k, n]) => ({ pour: { from: 'supply', to: `a.${k}`, what: 'electron', amount: n } }));
}

export const SOLUTIONS = [
  [guess('pulled')],
  [...test('n2'), file('n2', 'ignored'), ...test('o2'), file('o2', 'pulled'), ...test('f2'), file('f2', 'ignored'), ...test('b2'), file('b2', 'pulled')],
  [...lastSteps(), { run: 'magnet' }],
  [put('ao1', 'tray:bonding'), put('ao2', 'tray:antibonding'), put('ao3', 'tray:bonding'), put('ao4', 'tray:antibonding')],
  [put('m1', 'tray:cylindrical'), put('m2', 'tray:cylindrical'), put('m3', 'tray:sidebyside'), put('m4', 'tray:sidebyside')],
  [put('b_he2', 'tray:bo0'), put('b_h2', 'tray:bo1'), put('b_o2', 'tray:bo2'), put('b_n2', 'tray:bo3')]
];

export const MISSES = [
  [],
  [file('n2', 'pulled'), file('o2', 'ignored'), file('f2', 'ignored'), file('b2', 'pulled')],
  [pour('q2p:0', 2), { run: 'magnet' }],
  [put('ao1', 'tray:antibonding'), put('ao2', 'tray:bonding'), put('ao3', 'tray:bonding'), put('ao4', 'tray:antibonding')],
  [put('m1', 'tray:sidebyside'), put('m2', 'tray:cylindrical'), put('m3', 'tray:sidebyside'), put('m4', 'tray:sidebyside')],
  [put('b_he2', 'tray:bo1'), put('b_h2', 'tray:bo0'), put('b_o2', 'tray:bo2'), put('b_n2', 'tray:bo3')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() {}
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}

export { DIATOMICS };
