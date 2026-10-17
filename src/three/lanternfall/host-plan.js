/**
 * host-plan.js — What each of Lanternfall's nine hosts is, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, the world, and `verify:lanternfall` all stand on this one
 * table. `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right,
 * z toward the player (the bench's plate is at the origin, so a host's machinery has negative z). It is
 * the bounding rectangle of every body the builder stands on the ground, measured by `verify:lanternfall`
 * against the real build, so the generator can keep everything else out of it without building anything.
 *
 * A host is the piece of the observatory expedition a bench belongs to (docs/plans/bench-integration.md §5).
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

export const HOST_PLAN = {
  'site-1': {
    structure: 'wave-tank', kind: 'light', skin: 'shelf', plate: 'BN-01',
    // A flume along the lake's edge, the paddle at one end and the strobe gantry over it.
    extent: [-7.6, 7.6, -9.9, 0.7]
  },
  'site-2': {
    structure: 'photocell-mast', kind: 'light', skin: 'desk', plate: 'BN-02',
    // The housing at the foot of an aurora mast, its battery cabinet and a photometer on a tripod.
    extent: [-5.4, 5.4, -5.9, 0.7]
  },
  'site-3': {
    structure: 'spectrograph-sled', kind: 'light', skin: 'shelf', plate: 'BN-03',
    // The sled with its tailgate down, and the camp round it.
    extent: [-3.4, 12.4, -7.2, 0.7]
  },
  'site-4': {
    structure: 'crawler-lab', kind: 'cloud', skin: 'desk', plate: 'BN-04',
    // The crawler stands tail-on, its lab module's doors open onto the bench.
    extent: [-3.4, 3.4, -11.3, 0.7]
  },
  'site-5': {
    structure: 'records-tent', kind: 'rack', skin: 'desk', plate: 'BN-05',
    // The south half of the records tent: canopy, walls and the board's front face (the eave stops at the plate's line, z 0.5).
    extent: [-5.7, 5.7, -3.6, 0.7]
  },
  'site-6': {
    structure: 'records-tent', kind: 'rack', skin: 'desk', plate: 'BN-06',
    // The north half, the same tent turned round: it shares the board and the ridge with bench 5.
    extent: [-5.7, 5.7, -3.6, 0.7]
  },
  'site-7': {
    structure: 'detector-mast', kind: 'electron', skin: 'deck', plate: 'BN-07',
    // The detector arc on its platform at an aurora mast's foot, and the work lamp's post.
    extent: [-5.2, 8.0, -6.9, 1.3]
  },
  'site-8': {
    structure: 'tile-store', kind: 'electron', skin: 'shelf', plate: 'BN-08',
    // The tile racks under their tarpaulin, and camp 3 beside the store.
    extent: [-6.6, 12.2, -9.0, 0.7]
  },
  'site-9': {
    structure: 'water-hole', kind: 'light', skin: 'shelf', plate: 'BN-09',
    // The cuvette sled, the tripod over the hole cut through the lake ice.
    extent: [-4.4, 5.3, -7.7, 0.7]
  }
};

/** Where a host's water hole is, in the host's frame (bench 9): the generator checks it lands in the lake. */
export const WATER_HOLE = { lx: -2.2, lz: -5.5, r: 1.0 };

/** The two halves of the records tent stand this far apart, bench to bench (they meet at the ridge). */
export const TENT_SPAN = 7.0;
