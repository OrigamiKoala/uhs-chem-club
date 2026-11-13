/**
 * q10-wavefunctions.js — Lanternfall, bench ten: WAVEFUNCTIONS AND NODES.
 *
 * Rebuilt in the teaching pass of 2026-11-12 (the bench before it is `archive/2026-11-11/lanternfall/q10-wavefunctions.before.js`).
 * Five card sorts with formula hints are replaced by five stages on the cloud plate and the wavefunction strip (`cloud-draw.js`
 * `paintWaveStrip`):
 *
 *   1  2s cloud plate with the counting ring: find the empty shell at ~110 pm                  -> node
 *   2  2s wavefunction strip: probe both + and − sides of ψ and compare the ψ² dot band         -> wavefunction ψ, probability density
 *   3  1s / 2s / 3s plate with the counting ring: count the spherical nodes of 3s               -> radial node
 *   4  2p wavefunction strip and 2s, 2p, 3d cards: sort by number of planar nodes               -> angular node
 *   5  3d plate with the counting ring: given 2 angular nodes, find how many radial nodes 3d has
 *
 * Every curve and dot comes from `orbitals.js` (`psiAt` and `sampleOrbital`). No formula appears anywhere in this bench.
 *
 * This quest pays no XP, writes no Submission and never reaches Standings.
 */

import { createRunner, stateFromScript } from '../../engine/stagerunner.js';
import { applyNotes } from '../../table/notes.js';
import {
  cloudTable, cloudPlate, cloudCard, waveStrip,
  plateRead, ringRead, waveStripRead
} from '../../table/kits/cloud.js';

export const meta = { stageCount: 5 };

export const VOCABULARY = [
  { term: /\bwavefunctions?\b/i, introducedAt: 2 },
  { term: /\bprobability densit(?:y|ies)\b/i, introducedAt: 2 },
  { term: /\bradial nodes?\b/i, introducedAt: 3 },
  { term: /\bangular nodes?\b/i, introducedAt: 4 }
];

export const BUILDS_ON = ['unit02/q4-cloud', 'unit02/q5-numbers'];

const SPEAKER = 'Vess';

export function toolNoteFor() { return null; }

const widget = { type: 'table', label: 'The bench' };
const ENOUGH_SHOTS = 500;

const tray = (id, label, at, size, cell = 20) => ({ id, label, at, size, cell });
const card = (id, label, at, props = {}) => ({ id, kind: 'card', label, at, r: 7, props });
const where = (t, id) => (t.pieces[id]?.zone || '').replace(/^(tray|slot):/, '');
const inTray = (t, id) => (t.pieces[id]?.zone || '').startsWith('tray:');
const answered = t => Object.values(t.pieces).find(p => p.zone === 'slot:answer') || null;

/* ------------------------------------------------------------------
   THE STAGES
   ------------------------------------------------------------------ */

export const STAGES = [
  /* ---------------------------------------------------------------- 1 */
  (() => {
    const p = cloudPlate('p', '2s ORBITAL', { x: 42, y: 31 }, '2s', { ring: 'band', ringMax: 240, ringStep: 10, extent: 6 });
    return {
      title: 'A Gap in the Cloud',
      briefing: {
        speaker: SPEAKER,
        body: 'The dots show where the electron was found in many measurements. The ring counts the dots in a thin shell at the distance you set.'
      },
      prompt: 'At what distance from the nucleus is the 2s electron never found?',
      widget,
      table: cloudTable({ pieces: [], fixtures: [p.fixture] }),
      hints: [
        'Set Measurements to 500 and press Measure, then turn the Ring dial outward from the nucleus.',
        'Watch how the ring count rises and falls as you sweep outward across the cloud.',
        'Stop the ring where the shell around the nucleus holds almost no dots.'
      ],
      check(state) {
        const t = state.table;
        const r = ringRead(t, 'p');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Take 500 measurements first so the gap in the cloud is clear.' };
        if (r.rpm === 0) return { ok: false, notYet: true, msg: 'Turn the Ring dial outward from the nucleus.' };
        if (r.rpm >= 100 && r.rpm <= 110) return { ok: true };
        return { ok: false, msg: `At ${r.rpm} pm the ring still catches ${r.count} of the ${r.total} dots.` };
      },
      reward: {
        log: '2s has an empty shell near 106 pm.',
        title: 'Node',
        body: 'The cloud has an inner part and an outer part with an empty shell between. A place where the electron is never found is a node.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 2 */
  (() => {
    const strip = waveStrip('strip', '2s WAVEFUNCTION', { x: 42, y: 27 }, '2s');
    return {
      title: 'The Wave Behind the Cloud',
      briefing: {
        speaker: SPEAKER,
        body: 'The cloud comes from a wave called the wavefunction, ψ. Like a water wave it has crests, marked +, and troughs, marked −; these are not electric charges.'
      },
      prompt: 'Is the electron found where its wavefunction is negative?',
      widget,
      table: cloudTable({
        pieces: [
          card('never', 'Never (only +)', { x: 26, y: 53 }),
          card('same', 'Just as often', { x: 75, y: 53 }),
          card('more', 'More often (−)', { x: 124, y: 53 })
        ],
        fixtures: [strip],
        zones: { slots: [{ id: 'answer', label: 'Answer', at: { x: 114, y: 22 }, size: { w: 46, h: 14 } }] }
      }),
      hints: [
        'Drag the Probe dial along the wavefunction strip and watch both the curve above and the dot band below.',
        'Compare the dot band where ψ is + with where ψ is − by the same amount.',
        'The dot band shows how often the electron is found at each point, whether ψ is + or −.'
      ],
      check(state) {
        const t = state.table;
        const r = waveStripRead(t, 'strip');
        if (Math.abs(r.probePm) < 120) return { ok: false, notYet: true, msg: 'Move the Probe dial past the crossing into the − part of the wave first.' };
        const pick = answered(t);
        if (!pick) return { ok: false, notYet: true, msg: 'Put a card in the slot.' };
        if (pick.id === 'same') return { ok: true };
        return { ok: false, msg: 'Look at the dot band below the curve on the − side: the dots are just as dense where ψ is − as where it is +.' };
      },
      reward: {
        log: 'The chance of finding the electron is the same for + and −.',
        title: 'Wavefunction Sign',
        body: 'The chance of finding the electron depends on the square of ψ (its probability density), which is positive for both + and −. Where ψ passes through zero, the chance is zero: the node.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 3 */
  (() => {
    const p = cloudPlate('p', 's ORBITALS', { x: 40, y: 32 }, '1s', {
      orbitals: ['1s', '2s', '3s'],
      ring: 'band', ringMax: 420, ringStep: 20, extent: 10
    });
    return {
      title: 'Counting Radial Nodes',
      briefing: {
        speaker: SPEAKER,
        body: 'A node shaped like a sphere round the nucleus is a radial node.'
      },
      prompt: 'How many radial nodes does the 3s orbital have?',
      widget,
      table: cloudTable({
        pieces: ['0', '1', '2', '3'].map((n, i) => card(`n${n}`, n, { x: 88 + i * 16, y: 48 })),
        fixtures: [p.fixture],
        zones: { slots: [{ id: 'answer', label: 'Radial nodes in 3s', at: { x: 112, y: 20 }, size: { w: 40, h: 14 } }] }
      }),
      hints: [
        'Turn the Orbital dial to 3s, set Measurements to 500, and press Measure.',
        'Sweep the Ring dial outward from 0 to 420 pm and count the empty shells where the ring count drops.',
        'Compare 1s, 2s and 3s to see how many empty shells each higher s orbital has.'
      ],
      check(state) {
        const t = state.table;
        const r = plateRead(t, 'p');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Take 500 measurements on the plate first.' };
        const pick = answered(t);
        if (!pick) return { ok: false, notYet: true, msg: 'Put a number card in the slot.' };
        if (pick.id === 'n2') return { ok: true };
        return { ok: false, msg: 'Sweep the Ring dial on 3s from 0 to 420 pm and count how many times the dot count drops to near zero.' };
      },
      reward: {
        log: '1s has 0 radial nodes, 2s has 1, 3s has 2.',
        title: 'Radial Nodes',
        body: '1s has none, 2s one and 3s two. Each step up in n adds a radial node.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 4 */
  (() => {
    const p = cloudPlate('p', 'ORBITAL SLICE', { x: 34, y: 32 }, '2s', { orbitals: ['2s', '2px', '3dxy'], slice: true, extent: 10, pic: 26 });
    return {
      title: 'Nodes That Are Planes',
      briefing: {
        speaker: SPEAKER,
        body: 'A node that is a flat plane through the nucleus is an angular node. Switch on Slice and step through 2s, 2px and 3dxy (where x and xy mark how the lobes point) to see the empty planes cut through the nucleus.'
      },
      prompt: 'How many angular nodes does each orbital have?',
      widget,
      table: cloudTable({
        pieces: [
          cloudCard('c2s', '2s', { x: 78, y: 12 }, '2s', { extent: 8 }),
          cloudCard('c2p', '2p', { x: 78, y: 32 }, '2px', { extent: 8 }),
          cloudCard('c3d', '3d', { x: 78, y: 52 }, '3dxy', { extent: 14 })
        ],
        fixtures: [p.fixture],
        zones: {
          trays: [
            tray('zero', 'No angular node', { x: 119, y: 12 }, { w: 50, h: 14 }),
            tray('one', 'One', { x: 119, y: 32 }, { w: 50, h: 14 }),
            tray('two', 'Two', { x: 119, y: 52 }, { w: 50, h: 14 })
          ]
        }
      }),
      hints: [
        'Press Measure, turn Slice on, and step the Orbital dial through 2s, 2px and 3dxy.',
        'Count how many flat empty planes cut through the nucleus of each sliced orbital.',
        'Compare the number of empty planes through the nucleus for s, p and d.'
      ],
      check(state) {
        const t = state.table;
        const pr = plateRead(t, 'p');
        if (pr.fired === 0 || !pr.slice) {
          return { ok: false, notYet: true, msg: 'Press Measure and turn Slice on to see the empty planes through the nucleus.' };
        }
        const want = { c2s: 'zero', c2p: 'one', c3d: 'two' };
        const ids = Object.keys(want);
        if (!ids.every(id => inTray(t, id))) return { ok: false, notYet: true, msg: 'Put all three orbital cards in a tray.' };
        const wrong = ids.find(id => where(t, id) !== want[id]);
        if (!wrong) return { ok: true };
        const label = t.pieces[wrong].label;
        return { ok: false, msg: `Slice ${label} on the plate and count the empty planes through its nucleus; its tray does not match.` };
      },
      reward: {
        log: 's has 0 angular nodes, p has 1, d has 2.',
        title: 'Angular Nodes',
        body: 's orbitals have none, p orbitals one and d orbitals two. The number of angular nodes is the quantum number l.'
      }
    };
  })(),

  /* ---------------------------------------------------------------- 5 */
  (() => {
    const p = cloudPlate('p', '3d ORBITAL', { x: 40, y: 31 }, '3dxy', { ring: 'band', ringMax: 420, ringStep: 20, extent: 12 });
    return {
      title: 'All the Nodes',
      prompt: 'A 3d orbital has two angular nodes: how many radial nodes does it have?',
      widget,
      table: cloudTable({
        pieces: ['0', '1', '2', '3'].map((n, i) => card(`n${n}`, n, { x: 88 + i * 16, y: 48 })),
        fixtures: [p.fixture],
        zones: { slots: [{ id: 'answer', label: 'Radial nodes in 3d', at: { x: 112, y: 20 }, size: { w: 40, h: 14 } }] }
      }),
      hints: [
        'Set Measurements to 500 and press Measure on the 3d plate, then sweep the Ring dial outward.',
        'Check whether the ring finds any empty spherical shell in the 3d cloud.',
        'Compare the total nodes of 3s (2) and 2p (1) with their shell number n.'
      ],
      check(state) {
        const t = state.table;
        const r = plateRead(t, 'p');
        if (r.fired < ENOUGH_SHOTS) return { ok: false, notYet: true, msg: 'Take 500 measurements on the 3d plate first.' };
        const pick = answered(t);
        if (!pick) return { ok: false, notYet: true, msg: 'Put a number card in the slot.' };
        if (pick.id === 'n0') return { ok: true };
        return { ok: false, msg: 'The 3d plate shows no empty spherical shell; its two nodes are both angular.' };
      },
      reward: {
        log: 'Total nodes = n − 1.',
        title: 'Total Nodes',
        body: 'None: every orbital in shell n has n − 1 nodes in all, so 3d\'s two angular nodes leave no radial ones.',
        last: true
      }
    };
  })()
];

const NOTES = {
  1: ['Set Measurements to 500 and press Measure,', 'then turn Ring (pm).'],
  2: ['Drag Probe (pm) past 0 to see', 'where ψ changes sign.']
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
      body: 'An orbital comes from a wavefunction ψ with + and − parts, and the chance of finding the electron goes as ψ². Where ψ crosses zero is a node: radial nodes are spheres, angular nodes are planes, and an orbital in shell n has n − 1 nodes in all.'
    },
    {
      heading: 'Why It Is Worth It',
      body: 'The + and − signs of an orbital\'s lobes decide whether two orbitals add or cancel when atoms come together to bond.'
    }
  ]
};

/* ------------------------------------------------------------------
   SOLUTIONS AND MISSES
   ------------------------------------------------------------------ */

const put = (piece, to) => ({ place: { piece, to } });
const dial = (fixture, name, value) => ({ setDial: { fixture, dial: name, value } });
const fire = id => [dial(id, 'burst', 3), { run: id }];

export const SOLUTIONS = [
  [...fire('p'), dial('p', 'ring', 110)],
  [dial('strip', 'probe', -150), put('same', 'slot:answer')],
  [dial('p', 'orbital', 3), ...fire('p'), dial('p', 'ring', 100), put('n2', 'slot:answer')],
  [...fire('p'), dial('p', 'orbital', 2), dial('p', 'slice', 1), put('c2s', 'tray:zero'), put('c2p', 'tray:one'), put('c3d', 'tray:two')],
  [...fire('p'), dial('p', 'ring', 140), put('n0', 'slot:answer')]
];

export const MISSES = [
  [...fire('p'), dial('p', 'ring', 50)],
  [dial('strip', 'probe', -150), put('never', 'slot:answer')],
  [dial('p', 'orbital', 3), ...fire('p'), put('n3', 'slot:answer')],
  [...fire('p'), dial('p', 'orbital', 2), dial('p', 'slice', 1), put('c2s', 'tray:one'), put('c2p', 'tray:one'), put('c3d', 'tray:two')],
  [...fire('p'), put('n1', 'slot:answer')]
];

function blankState() { return {}; }

export function stateFor(i, overrides) {
  return stateFromScript(STAGES[i], overrides);
}

/* ==================================================================
   THE GAME
   ================================================================== */

export function mount(container, ctx) {
  const runner = createRunner(container, ctx, {
    STAGES, DEBRIEF, blankState, toolNoteFor,
    onLoad() { /* the table is the stage; there are no keys or readouts to lay out */ }
  });
  runner.start();
  return { dispose: () => runner.dispose() };
}
