/**
 * verdigris/host-plan.js — What each of Verdigris's eight hosts is, where it stands, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:verdigris` all stand on this one table.
 * `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right, z toward the
 * player (the bench's plate is at the origin, so a host's machinery has negative z). It is the bounding rectangle
 * of every body the builder stands on the ground, measured by `verify:verdigris` against the real build, so the
 * generator can keep everything else out of it without building anything.
 *
 * A host is the piece of the flooded fortress's machinery a bench belongs to: the sluice gate between two cells, the
 * gauge house with its tide staff, a pair of equal tanks, the valve gallery, the settling basin, the dosing tower,
 * the surge tank and the reserve vats. They stand on the heads of eight boardwalk spurs that run out from the spine,
 * the odd benches on the west and the even on the east, each with its plate turned to the spine.
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/**
 * `pos` is where the plate stands (world x, z); `face` is the way the plate looks, toward the spine.
 * `structure` names the host in the layout, `kind` dresses the cased instrument on the plate, `skin` its frame.
 * Site ids are `site-N`, as in every other world; `questId` is the bench's quest, live or not.
 */
export const HOST_PLAN = {
  'site-1': {
    questId: 'q1-handover', label: 'Bench 1 - The Handover', title: 'The Handover', structure: 'sluice-gate', kind: 'flask', skin: 'deck', plate: 'VDG-01',
    pos: [-42, 62], face: [1, 0],
    // Two flooded cells either side of a masonry wall with a lift gate in it, a gantry over the gate and a counterweight.
    extent: [-7.0, 7.0, -9.4, 0.8]
  },
  'site-2': {
    questId: 'q2-scale', label: 'Bench 2 - Reading the Scale', title: 'Reading the Scale', structure: 'gauge-house', kind: 'meter', skin: 'desk', plate: 'VDG-02',
    pos: [42, 48], face: [-1, 0],
    // A gauge house: a tall graduated staff in a stilling well, a scale board on the back wall and a stone plinth.
    extent: [-7.0, 7.0, -8.0, 0.8]
  },
  'site-3': {
    questId: 'q3-weak', label: 'Bench 3 - Weak Acids', title: 'Weak Acids and Bases', structure: 'twin-tanks', kind: 'flask', skin: 'shelf', plate: 'VDG-03',
    pos: [-42, 34], face: [1, 0],
    // Two equal copper-clad tanks side by side on a timber stage, a manifold between them and a dial on each.
    extent: [-7.0, 7.0, -8.6, 0.8]
  },
  'site-4': {
    questId: 'q4-structure', label: 'Bench 4 - Acid Structure', title: 'Acid Strength and Structure', structure: 'valve-gallery', kind: 'race', skin: 'desk', plate: 'VDG-04',
    pos: [42, 20], face: [-1, 0],
    // A valve gallery: a long header pipe on a timber gantry with six branches, each with a handwheel, and a drum at the end.
    extent: [-7.2, 7.2, -8.0, 0.8]
  },
  'site-5': {
    questId: 'q5-salts', label: 'Bench 5 - Salts', title: 'Neutralization and Salts', structure: 'settling-basin', kind: 'dish', skin: 'shelf', plate: 'VDG-05',
    pos: [-42, 6], face: [1, 0],
    // A walled settling basin with a salt-bloomed rim, a rake bridge over it and an outfall weir at one end.
    extent: [-7.0, 7.0, -9.2, 0.8]
  },
  'site-6': {
    questId: 'q6-titrate', label: 'Bench 6 - Titration Curves', title: 'Titration Curves', structure: 'dosing-tower', kind: 'burette', skin: 'deck', plate: 'VDG-06',
    pos: [42, -8], face: [-1, 0],
    // A dosing tower: a header tank high on a steel frame feeding a metering pipe down to a receiving vat, with a ladder.
    extent: [-7.0, 7.0, -8.6, 0.8]
  },
  'site-7': {
    questId: 'q7-buffer', label: 'Bench 7 - Buffers', title: 'Buffers', structure: 'surge-tank', kind: 'flask', skin: 'deck', plate: 'VDG-07',
    pos: [-42, -22], face: [1, 0],
    // A surge tank: a domed standpipe that takes a shock and gives it back, an overflow weir and a catch channel.
    extent: [-7.0, 7.0, -9.0, 0.8]
  },
  'site-8': {
    questId: 'q8-capacity', label: 'Bench 8 - pKa and Capacity', title: 'pKa, Protonation and Capacity', structure: 'reserve-vats', kind: 'plot', skin: 'desk', plate: 'VDG-08',
    pos: [42, -34], face: [-1, 0],
    // A row of four reserve vats, each larger than the last, on a masonry stage with a level staff on each.
    extent: [-7.2, 7.2, -8.4, 0.8]
  }
};
