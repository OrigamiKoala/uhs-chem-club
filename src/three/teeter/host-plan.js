/**
 * teeter/host-plan.js — What each of Teeter's eight hosts is, where it stands, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:teeter` all stand on this one table.
 * `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right, z toward the
 * player (the bench's plate is at the origin, so a host's machinery has negative z). It is the bounding rectangle
 * of every body the builder stands on the ground, measured by `verify:teeter` against the real build, so the
 * generator can keep everything else out of it without building anything.
 *
 * A host is the piece of the pan works a bench belongs to: the sluice gate between two pans, the weigh house, the
 * tilting gauge, the card-sorting house, the ledger desk, the pump station with its beam pump, the settling pond
 * and the plotting hut. They stand on the heads of eight dikes that run out from the causeway, the odd benches on
 * the west and the even on the east, each with its plate turned to the causeway.
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/** How far in front of a plate the player is asked to stand. */
export const APPROACH = 4.6;

/**
 * `pos` is where the plate stands (world x, z); `face` is the way the plate looks, toward the causeway.
 * `structure` names the host in the layout, `kind` dresses the cased instrument on the plate, `skin` its frame.
 * Site ids are `site-N`, as in every other world; `questId` is the bench's quest, live or not.
 */
export const HOST_PLAN = {
  'site-1': {
    questId: 'q1-both', label: 'Bench 1 - Running Both Ways', title: 'Running Both Ways', structure: 'sluice-gate', kind: 'pan', skin: 'deck', plate: 'TTR-01',
    pos: [-42, 62], face: [1, 0],
    // Two brine basins either side of a gated dividing wall, a gantry over the gate and a handwheel on its stem.
    extent: [-7.0, 7.0, -9.4, 0.8]
  },
  'site-2': {
    questId: 'q2-k', label: 'Bench 2 - The Number K', title: 'The Number That Holds', structure: 'weigh-house', kind: 'scale', skin: 'desk', plate: 'TTR-02',
    pos: [42, 48], face: [-1, 0],
    // A weigh house open to the front: a platform scale on its pit, a steelyard beam on the back wall and sacks on pallets.
    extent: [-7.0, 7.0, -8.0, 0.8]
  },
  'site-3': {
    questId: 'q3-q', label: 'Bench 3 - Which Way', title: 'Which Way It Goes', structure: 'tilting-gauge', kind: 'gauge', skin: 'shelf', plate: 'TTR-03',
    pos: [-42, 34], face: [1, 0],
    // A long trough on a pivot with a graduated gauge post and a pointer, over a catch basin.
    extent: [-7.0, 7.0, -8.6, 0.8]
  },
  'site-4': {
    questId: 'q4-properties', label: 'Bench 4 - Combining K', title: 'Combining K', structure: 'sorting-house', kind: 'cards', skin: 'desk', plate: 'TTR-04',
    pos: [42, 20], face: [-1, 0],
    // A shed with a wall of pigeonholes, a sorting table and crates waiting to be filed.
    extent: [-7.0, 7.0, -7.8, 0.8]
  },
  'site-5': {
    questId: 'q5-ice', label: 'Bench 5 - Equilibrium Concentrations', title: 'Equilibrium Concentrations', structure: 'ledger-desk', kind: 'ledger', skin: 'shelf', plate: 'TTR-05',
    pos: [-42, 6], face: [1, 0],
    // A clerk's hut with a sloped ledger desk, a column board on the wall and a stack of record books.
    extent: [-7.0, 7.0, -7.4, 0.8]
  },
  'site-6': {
    questId: 'q6-lean', label: 'Bench 6 - Le Chatelier', title: "Le Chatelier's Principle", structure: 'pump-station', kind: 'beam', skin: 'deck', plate: 'TTR-06',
    pos: [42, -8], face: [-1, 0],
    // The pump station: a beam pump rocking on its A-frame over a wellhead, a pump house and the brine main.
    extent: [-7.4, 7.4, -9.6, 0.8]
  },
  'site-7': {
    questId: 'q7-dissolve', label: 'Bench 7 - Solubility Equilibria', title: 'Solubility Equilibria', structure: 'settling-pond', kind: 'dish', skin: 'deck', plate: 'TTR-07',
    pos: [-42, -22], face: [1, 0],
    // A walled settling pond with a salt rim, a cone-bottomed settling tank on legs and drums of reagent.
    extent: [-7.2, 7.2, -9.2, 0.8]
  },
  'site-8': {
    questId: 'q8-free', label: 'Bench 8 - Free Energy', title: 'Free Energy and K', structure: 'plotting-hut', kind: 'plot', skin: 'desk', plate: 'TTR-08',
    pos: [42, -34], face: [-1, 0],
    // A plotting hut: a gridded board on the wall, a drafting table, a rule on a rail and a rack of rolled charts.
    extent: [-7.0, 7.0, -7.8, 0.8]
  }
};
