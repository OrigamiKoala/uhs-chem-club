/**
 * kettle/host-plan.js — What each of Kettle's nine hosts is, where it stands, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:kettle` all stand on this one table.
 * `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right, z toward the
 * player (the bench's plate is at the origin, so a host's machinery has negative z). It is the bounding rectangle
 * of every body the builder stands on the ground, measured by `verify:kettle` against the real build, so the
 * generator can keep everything else out of it without building anything.
 *
 * A host is the piece of the foundry works a bench belongs to: the assay yard, the labelling shed, a sealed charging
 * pot on a weighbridge, the furnace control room, the effluent sump, the blast-furnace charge floor, the pickling
 * line and the furnace tapping floor. They stand in two columns either side of the works road, the odd benches on
 * the west and the even on the east, each with its plate turned to the road.
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/**
 * `pos` is where the plate stands (world x, z); `face` is the way the plate looks, toward the works road.
 * `structure` names the host in the layout, `kind` dresses the cased instrument on the plate, `skin` its frame.
 * Site ids are `site-N`, as in every other world; `questId` is the bench's quest, live or not.
 */
export const HOST_PLAN = {
  'site-1': {
    questId: 'q1-recipe', label: 'Bench 1 - The Same Recipe', title: 'The Same Recipe', structure: 'assay-yard', kind: 'heap', skin: 'shelf', plate: 'KET-01',
    pos: [-42, 60], face: [1, 0],
    // Three ore bays divided by push walls, their heaps in them, the ore tubs on the right and a grizzly hopper on the left.
    extent: [-7.1, 7.6, -8.2, 0.8]
  },
  'site-2': {
    questId: 'q2-names', label: 'Bench 2 - Names and Formulas', title: 'Names and Formulas', structure: 'labelling-shed', kind: 'cards', skin: 'desk', plate: 'KET-02',
    pos: [42, 46], face: [-1, 0],
    // An open-fronted shed with crate racks along its back wall and pallets in front of them.
    extent: [-6.9, 6.9, -7.6, 0.8]
  },
  'site-3': {
    questId: 'q3-change', label: 'Bench 3 - Physical or Chemical', title: 'Physical or Chemical', structure: 'charging-pot', kind: 'pot', skin: 'deck', plate: 'KET-03',
    pos: [-42, 30], face: [1, 0],
    // A sealed charging pot on a weighbridge, its indicator column and a chain hoist on an A-frame.
    extent: [-6.5, 6.5, -8.6, 0.8]
  },
  'site-4': {
    questId: 'q4-balance', label: 'Bench 4 - Balancing Equations', title: 'Balancing Equations', structure: 'control-room', kind: 'board', skin: 'desk', plate: 'KET-04',
    pos: [42, 14], face: [-1, 0],
    // The furnace control room: a cabin with a window on the furnace and the recipe board on its front wall.
    extent: [-7.0, 6.6, -8.0, 0.8]
  },
  'site-5': {
    questId: 'q5-ionic', label: 'Bench 5 - Net Ionic Equations', title: 'Net Ionic Equations', structure: 'effluent-sump', kind: 'ionic', skin: 'deck', plate: 'KET-05',
    pos: [-42, 0], face: [1, 0],
    // A walled effluent sump with two settling tanks over it, a launder channel and a pump.
    extent: [-7.4, 7.4, -9.4, 0.8]
  },
  'site-6': {
    questId: 'q6-stoich', label: 'Bench 6 - What Is Made', title: 'How Much Is Made', structure: 'charge-floor', kind: 'pot', skin: 'shelf', plate: 'KET-06',
    pos: [42, -16], face: [-1, 0],
    // The blast furnace's charge floor: three bunkers, a weigh hopper on a load cell and the skip rail up to the furnace top.
    extent: [-7.6, 7.2, -10.2, 0.8]
  },
  'site-7': {
    questId: 'q7-titrate', label: 'Bench 7 - Titration', title: 'Titration', structure: 'pickling-line', kind: 'burette', skin: 'desk', plate: 'KET-07',
    pos: [-42, -32], face: [1, 0],
    // A long acid tank under a burette gantry, a rinse tank beside it and a hoist.
    extent: [-7.2, 7.2, -9.0, 0.8]
  },
  'site-8': {
    questId: 'q8-kinds', label: 'Bench 8 - Kinds of Reaction', title: 'Kinds of Reaction', structure: 'tapping-floor', kind: 'tests', skin: 'deck', plate: 'KET-08',
    pos: [42, -40], face: [-1, 0],
    // The furnace's tapping floor: the tap hole and its runner, a ladle on rails and a pair of flues with a hood.
    extent: [-7.0, 7.0, -9.4, 0.8]
  },
  'site-9': {
    questId: 'q9-hsab', label: 'Bench 9 - Hard and Soft', title: 'Hard and Soft', structure: 'refining-vat', kind: 'ionic', skin: 'deck', plate: 'KET-09',
    pos: [-42, -48], face: [1, 0],
    // The refining bay: two precipitation vats, an overhead reagent feed manifold, and carboys.
    extent: [-7.0, 7.0, -8.6, 0.8]
  }
};
