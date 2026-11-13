/**
 * quicklight/host-plan.js — What each of Quicklight's six hosts is, where it stands, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, `QuicklightWorld`, and `verify:quicklight` all stand on this one table.
 */

export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };
export const APPROACH = 4.6;

export const HOST_PLAN = {
  'site-1': {
    questId: 'q1-watch', label: 'Bench 1 - Watching the Speed', title: 'Watching the Speed',
    structure: 'watch-tower', kind: 'vessel', skin: 'deck', plate: 'QKL-01',
    pos: [-42, 62], face: [1, 0],
    extent: [-6.0, 6.0, -8.5, 0.8]
  },
  'site-2': {
    questId: 'q2-law', label: 'Bench 2 - Feed Manifold', title: 'Feed Manifold',
    structure: 'manifold-desk', kind: 'board', skin: 'desk', plate: 'QKL-02',
    pos: [42, 46], face: [-1, 0],
    extent: [-6.5, 6.5, -8.5, 0.8]
  },
  'site-3': {
    questId: 'q3-time', label: 'Bench 3 - Concentration Over Time', title: 'Concentration Over Time',
    structure: 'decay-tank', kind: 'plotter', skin: 'shelf', plate: 'QKL-03',
    pos: [-42, 28], face: [1, 0],
    extent: [-6.5, 6.5, -8.5, 0.8]
  },
  'site-4': {
    questId: 'q4-collide', label: 'Bench 4 - Collisions and the Hill', title: 'Collisions and the Hill',
    structure: 'collision-rig', kind: 'profile', skin: 'desk', plate: 'QKL-04',
    pos: [42, 12], face: [-1, 0],
    extent: [-6.5, 6.5, -8.5, 0.8]
  },
  'site-5': {
    questId: 'q5-steps', label: 'Bench 5 - Steps', title: 'Steps',
    structure: 'step-reactor', kind: 'stack', skin: 'shelf', plate: 'QKL-05',
    pos: [-42, -6], face: [1, 0],
    extent: [-6.5, 6.5, -8.5, 0.8]
  },
  'site-6': {
    questId: 'q6-shortcut', label: 'Bench 6 - Catalysts', title: 'Catalysts',
    structure: 'catalyst-bed', kind: 'catalyst', skin: 'deck', plate: 'QKL-06',
    pos: [42, -22], face: [-1, 0],
    extent: [-6.5, 6.5, -8.5, 0.8]
  }
};
