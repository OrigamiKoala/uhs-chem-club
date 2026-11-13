/**
 * q10-wavefunctions.js — Lanternfall, bench ten: WAVEFUNCTIONS AND NODES.
 *
 * Visual introduction to quantum wavefunctions, probability density, and orbital shapes.
 * Electrons are standing waves described by mathematical wavefunctions (psi) that have
 * positive and negative phase amplitudes. The Born interpretation establishes that the
 * physical probability density is |psi|², which is always non-negative. Where the wave
 * passes through zero, nodes occur: radial spherical nodes and angular planar nodes.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { cloudTable } from '../../table/kits/cloud.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\btotal nodes?\b/i, introducedAt: 5 },
  { term: /\bangular nodes?\b/i, introducedAt: 4 },
  { term: /\bradial nodes?\b/i, introducedAt: 3 },
  { term: /\bprobability densit(?:y|ies)\b/i, introducedAt: 2 },
  { term: /\bwavefunctions?\b/i, introducedAt: 1 },
  { term: /\bphases?\b/i, introducedAt: 1 }
];

export const BUILDS_ON = ['unit02/q4-cloud', 'unit02/q5-numbers'];

const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };

const tray = (id, label, at, size, cell = 20) => ({ id, label, at, size, cell });
const card = (id, label, at, props = {}) => ({ id, kind: 'card', label, at, r: 7, props });
const where = (t, id) => (t.pieces[id]?.zone || '').replace(/^(tray|slot):/, '');
const inTray = (t, id) => (t.pieces[id]?.zone || '').startsWith('tray:');

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  {
    title: 'The Sign of Psi',
    prompt: 'Place the token into the slot naming what the plus and minus signs of a wavefunction describe.',
    widget,
    table: cloudTable({
      pieces: [
        card('charge', 'Electric charge', { x: 36, y: 38 }),
        card('phase', 'Wave phase', { x: 75, y: 38 }),
        card('spin', 'Electron spin', { x: 114, y: 38 })
      ],
      fixtures: [],
      zones: {
        slots: [{ id: 'choice', label: 'Wave property', at: { x: 75, y: 16 }, size: { w: 34, h: 14 } }]
      }
    }),
    hints: [
      'Drag one of the three tokens into the slot.',
      'Consider whether an electron has positive and negative electrical charges or wave amplitudes.',
      'Select the token representing wave phase.'
    ],
    check(state) {
      const t = state.table;
      const inSlot = Object.values(t.pieces).find(p => p.zone === 'slot:choice');
      if (!inSlot) return { ok: false, notYet: true, msg: 'Put a token in the slot.' };
      if (inSlot.id === 'phase') return { ok: true };
      if (inSlot.id === 'charge') return { ok: false, msg: 'An electron carries negative electric charge; psi signs indicate wave phase.' };
      return { ok: false, msg: 'Electron spin is intrinsic angular momentum, not spatial wave phase.' };
    },
    reward: {
      log: 'Wavefunction signs indicate wave phase crests and troughs.',
      title: 'Wave Amplitude and Phase',
      body: 'A wavefunction psi is an amplitude function with crests (+) and troughs (-), just like acoustic or water waves. The plus and minus signs signify opposite phases of the standing wave, not electric charges.'
    }
  },

  /* ---------------------------------------------------------------- 2 */
  {
    title: 'Probability Density',
    prompt: 'Sort each card into whether it represents a wavefunction with phase or a non-negative probability density.',
    widget,
    table: cloudTable({
      pieces: [
        card('c1', '1s |ψ|²', { x: 26, y: 15 }, { type: 'density' }),
        card('c2', '2s ψ (Phase ±)', { x: 58, y: 15 }, { type: 'wave' }),
        card('c3', '2p ψ (Phase ±)', { x: 92, y: 15 }, { type: 'wave' }),
        card('c4', '2s |ψ|²', { x: 124, y: 15 }, { type: 'density' })
      ],
      fixtures: [],
      zones: {
        trays: [
          tray('density', 'Probability density (|ψ|²)', { x: 44, y: 40 }, { w: 58, h: 14 }),
          tray('wave', 'Wavefunction (ψ)', { x: 106, y: 40 }, { w: 58, h: 14 })
        ]
      }
    }),
    hints: [
      'Drag each card into the corresponding category tray.',
      'Remember that squaring any real amplitude produces an exclusively non-negative probability density.',
      'Wavefunctions have positive and negative signs, while probability density is strictly squared.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['c1', 'c2', 'c3', 'c4'];
      if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Sort all four cards into trays.' };
      const wrong = ids.find(id => where(t, id) !== t.pieces[id].props.type);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} is placed in the incorrect tray.` };
      return { ok: true };
    },
    reward: {
      log: 'Squaring the wavefunction yields probability density.',
      title: 'The Born Interpretation',
      body: 'Max Born demonstrated that squaring the wavefunction, |psi|², gives the probability density of finding an electron. Because any real number squared is non-negative, probability density is always zero or positive.'
    }
  },

  /* ---------------------------------------------------------------- 3 */
  {
    title: 'Radial Nodes',
    prompt: 'Sort each spherical s orbital by its number of radial nodes where electron probability drops to zero.',
    widget,
    table: cloudTable({
      pieces: [
        card('s1', '1s Orbital', { x: 38, y: 15 }, { nodes: 'zero' }),
        card('s2', '2s Orbital', { x: 75, y: 15 }, { nodes: 'one' }),
        card('s3', '3s Orbital', { x: 112, y: 15 }, { nodes: 'two' })
      ],
      fixtures: [],
      zones: {
        trays: [
          tray('zero', '0 Radial nodes', { x: 26, y: 40 }, { w: 40, h: 14 }),
          tray('one', '1 Radial node', { x: 74, y: 40 }, { w: 40, h: 14 }),
          tray('two', '2 Radial nodes', { x: 122, y: 40 }, { w: 40, h: 14 })
        ]
      }
    }),
    hints: [
      'Use the radial node formula: Radial nodes = n - l - 1.',
      'For s orbitals, l = 0, so radial nodes = n - 1.',
      'Place 1s in 0, 2s in 1, and 3s in 2 radial nodes.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['s1', 's2', 's3'];
      if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Place all three orbitals into trays.' };
      const wrong = ids.find(id => where(t, id) !== t.pieces[id].props.nodes);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} does not have that number of radial nodes.` };
      return { ok: true };
    },
    reward: {
      log: '1s has 0 radial nodes, 2s has 1, and 3s has 2.',
      title: 'Radial Nodes in Shells',
      body: 'A radial node is a spherical shell where psi = 0 and |psi|² = 0. An electron in a 2s orbital has an inner sphere of density, a node of zero probability, and an outer shell of density.'
    }
  },

  /* ---------------------------------------------------------------- 4 */
  {
    title: 'Angular Nodes',
    prompt: 'Sort each orbital into the tray naming its number of angular nodal planes passing through the nucleus.',
    widget,
    table: cloudTable({
      pieces: [
        card('oa', '2s Orbital', { x: 24, y: 15 }, { l: 'n0' }),
        card('ob', '2px Orbital', { x: 58, y: 15 }, { l: 'n1' }),
        card('oc', '3dxy Orbital', { x: 92, y: 15 }, { l: 'n2' }),
        card('od', '2py Orbital', { x: 126, y: 15 }, { l: 'n1' })
      ],
      fixtures: [],
      zones: {
        trays: [
          tray('n0', '0 Nodal planes (s)', { x: 26, y: 40 }, { w: 40, h: 14 }),
          tray('n1', '1 Nodal plane (p)', { x: 74, y: 40 }, { w: 40, h: 14 }),
          tray('n2', '2 Nodal planes (d)', { x: 122, y: 40 }, { w: 40, h: 14 })
        ]
      }
    }),
    hints: [
      'The number of angular nodal planes equals the azimuthal quantum number l.',
      's orbitals have l = 0, p orbitals have l = 1, and d orbitals have l = 2.',
      'Sort 2s into 0, 2px and 2py into 1, and 3dxy into 2 nodal planes.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['oa', 'ob', 'oc', 'od'];
      if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Sort all four orbitals into trays.' };
      const wrong = ids.find(id => where(t, id) !== t.pieces[id].props.l);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} has a different number of angular nodal planes.` };
      return { ok: true };
    },
    reward: {
      log: 's orbitals have 0 angular nodes, p have 1, and d have 2.',
      title: 'Angular Nodes and Shapes',
      body: 'The angular quantum number l equals the count of angular nodal planes. Spherically symmetric s orbitals have 0 angular nodes, dumbbell p orbitals have 1 nodal plane, and cloverleaf d orbitals have 2.'
    }
  },

  /* ---------------------------------------------------------------- 5 */
  {
    title: 'Total Node Count',
    prompt: 'Classify each orbital by its total node count calculated from the principal quantum number minus one.',
    widget,
    table: cloudTable({
      pieces: [
        card('t1', '1s Orbital', { x: 24, y: 15 }, { total: 'tot0' }),
        card('t2', '2p Orbital', { x: 58, y: 15 }, { total: 'tot1' }),
        card('t3', '3s Orbital', { x: 92, y: 15 }, { total: 'tot2' }),
        card('t4', '3d Orbital', { x: 126, y: 15 }, { total: 'tot2' })
      ],
      fixtures: [],
      zones: {
        trays: [
          tray('tot0', '0 Total nodes', { x: 26, y: 40 }, { w: 40, h: 14 }),
          tray('tot1', '1 Total node', { x: 74, y: 40 }, { w: 40, h: 14 }),
          tray('tot2', '2 Total nodes', { x: 122, y: 40 }, { w: 40, h: 14 })
        ]
      }
    }),
    hints: [
      'Total nodes for any orbital is given by n - 1.',
      'Check: 1s has 1 - 1 = 0; 2p has 2 - 1 = 1; 3s and 3d each have 3 - 1 = 2 total nodes.',
      'Place each orbital into the tray matching its total node count.'
    ],
    check(state) {
      const t = state.table;
      const ids = ['t1', 't2', 't3', 't4'];
      if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Classify all four orbitals into trays.' };
      const wrong = ids.find(id => where(t, id) !== t.pieces[id].props.total);
      if (wrong) return { ok: false, msg: `${t.pieces[wrong].label} has a different total node count.` };
      return { ok: true };
    },
    reward: {
      log: 'Total nodes = n - 1 = Radial nodes + Angular nodes.',
      title: 'The Complete Node Relationship',
      body: 'For any atomic orbital, Total Nodes = n - 1 = (Radial Nodes) + (Angular Nodes). Higher energy shells have more wave nodes, corresponding to shorter de Broglie wavelengths and higher electron kinetic energy.',
      last: true
    }
  }
];

/* ------------------------------------------------------------------
   DEBRIEF
   ------------------------------------------------------------------ */

export const DEBRIEF = {
  speaker: SPEAKER,
  sections: [
    {
      heading: 'Wavefunctions',
      body: 'The electron is described by a wave equation whose solutions are wavefunctions (psi). Signs represent wave phase rather than charge.'
    },
    {
      heading: 'Probability Density and Nodes',
      body: 'Squaring the wavefunction gives the probability density |psi|². Radial and angular nodes represent boundaries where the chance of finding the electron is zero.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });

export const SOLUTIONS = [
  [put('phase', 'slot:choice')],
  [put('c1', 'tray:density'), put('c2', 'tray:wave'), put('c3', 'tray:wave'), put('c4', 'tray:density')],
  [put('s1', 'tray:zero'), put('s2', 'tray:one'), put('s3', 'tray:two')],
  [put('oa', 'tray:n0'), put('ob', 'tray:n1'), put('oc', 'tray:n2'), put('od', 'tray:n1')],
  [put('t1', 'tray:tot0'), put('t2', 'tray:tot1'), put('t3', 'tray:tot2'), put('t4', 'tray:tot2')]
];

export const MISSES = [
  [put('charge', 'slot:choice')],
  [put('c1', 'tray:wave'), put('c2', 'tray:density'), put('c3', 'tray:wave'), put('c4', 'tray:density')],
  [put('s1', 'tray:one'), put('s2', 'tray:zero'), put('s3', 'tray:two')],
  [put('oa', 'tray:n1'), put('ob', 'tray:n0'), put('oc', 'tray:n2'), put('od', 'tray:n1')],
  [put('t1', 'tray:tot1'), put('t2', 'tray:tot0'), put('t3', 'tray:tot2'), put('t4', 'tray:tot2')]
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
