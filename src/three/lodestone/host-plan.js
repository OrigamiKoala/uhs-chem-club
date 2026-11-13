/**
 * lodestone/host-plan.js — What each of Lodestone's six hosts is, where it stands, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, `LodestoneWorld` and `verify:lodestone` all stand on this one table. The canyon runs north to
 * south along x = 0; the hosts stand on its floor either side of the haul road, facing it, in bench order from the head of the canyon down
 * to the Coil's bowl at its foot.
 */

export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };
export const APPROACH = 4.6;

/** The canyon: the walk is the floor between the wall feet; the walls rise beyond them. */
export const CANYON = Object.freeze({ wallX: 46, north: 100, south: -78, floorW: 40 });

export const HOST_PLAN = {
  'site-1': {
    questId: 'q1-dblock', label: 'Bench 1 - The d-Block Assay', title: 'The d-Block',
    structure: 'assay-hut', kind: 'assay', skin: 'desk', plate: 'LDS-01',
    pos: [-24, 64], face: [1, 0], extent: [-6.0, 6.0, -8.5, 0.8]
  },
  'site-2': {
    questId: 'q2-charges', label: 'Bench 2 - Many Charges', title: 'Many Charges',
    structure: 'ore-crusher', kind: 'crusher', skin: 'deck', plate: 'LDS-02',
    pos: [24, 46], face: [-1, 0], extent: [-6.0, 6.0, -8.5, 0.8]
  },
  'site-3': {
    questId: 'q3-complex', label: 'Bench 3 - Complex Ions', title: 'Complex Ions',
    structure: 'leach-vats', kind: 'vats', skin: 'shelf', plate: 'LDS-03',
    pos: [-24, 28], face: [1, 0], extent: [-6.0, 6.0, -8.5, 0.8]
  },
  'site-4': {
    questId: 'q4-shapes', label: 'Bench 4 - Shapes and Isomers', title: 'Shapes and Isomers',
    structure: 'drum-gantry', kind: 'gantry', skin: 'desk', plate: 'LDS-04',
    pos: [24, 10], face: [-1, 0], extent: [-6.0, 6.0, -8.5, 0.8]
  },
  'site-5': {
    questId: 'q5-colour', label: 'Bench 5 - Colour Booth', title: 'Colour',
    structure: 'colour-booth', kind: 'booth', skin: 'shelf', plate: 'LDS-05',
    pos: [-24, -8], face: [1, 0], extent: [-6.0, 6.0, -8.5, 0.8]
  },
  'site-6': {
    questId: 'q6-spin', label: 'Bench 6 - Magnetism', title: 'Magnetism',
    structure: 'coil-shed', kind: 'coil', skin: 'deck', plate: 'LDS-06',
    pos: [24, -26], face: [-1, 0], extent: [-6.0, 6.0, -8.5, 0.8]
  }
};
