/**
 * brinewire/host-plan.js — What each of Brinewire's six hosts is, where it stands, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:brinewire` all stand on this one table.
 * `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right, z toward the
 * player (the bench's plate is at the origin, so a host's machinery has negative z). It is the bounding rectangle
 * of every body the builder stands on the ground, measured by `verify:brinewire` against the real build, so the
 * generator can keep everything else out of it without building anything.
 *
 * A host is the piece of the marsh's power works a bench belongs to: the rotting pylon base, the dip pool, the pair of
 * pools with a bridge, the metering shed, the battery bank and the plating works. They stand on the heads of six
 * boardwalk spurs that run out from the spine, the odd benches on the west and the even on the east, each with its
 * plate turned to the spine. A host exists for every quest id below whether or not that quest is built yet.
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
    questId: 'q1-halves', label: 'Bench 1 - Half-Reactions', title: 'Half-Reactions', structure: 'pylon-base', kind: 'beaker', skin: 'deck', plate: 'BRW-01',
    pos: [-42, 62], face: [1, 0],
    // A pylon leg anchored in a concrete footing that stands in a rusting brine sump, with a flaking splash band and a bolted foot plate.
    extent: [-6.0, 6.0, -9.0, 0.8]
  },
  'site-2': {
    questId: 'q2-activity', label: 'Bench 2 - Which Metal Gives', title: 'Which Metal Gives', structure: 'dip-pool', kind: 'rack', skin: 'desk', plate: 'BRW-02',
    pos: [42, 46], face: [-1, 0],
    // A long dip pool under a gantry that hangs a row of metal strips over it on chains, with a drying rack beside it.
    extent: [-7.0, 7.0, -8.6, 0.8]
  },
  'site-3': {
    questId: 'q3-galvanic', label: 'Bench 3 - Galvanic Cells', title: 'Galvanic Cells', structure: 'pool-pair', kind: 'rig', skin: 'shelf', plate: 'BRW-03',
    pos: [-42, 28], face: [1, 0],
    // Two lined pools side by side, an arched pipe bridge between them, an electrode post in each and a cable strung from post to post.
    extent: [-7.0, 7.0, -8.6, 0.8]
  },
  'site-4': {
    questId: 'q4-potential', label: 'Bench 4 - Cell Potential', title: 'Cell Potential', structure: 'metering-shed', kind: 'meter', skin: 'desk', plate: 'BRW-04',
    pos: [42, 12], face: [-1, 0],
    // An open-fronted metering shed: a row of dial meters on the back wall, a recorder drum on a plinth and a rack of spare electrode strips.
    extent: [-7.0, 7.0, -8.0, 0.8]
  },
  'site-5': {
    questId: 'q5-load', label: 'Bench 5 - Under Load', title: 'Under Load', structure: 'battery-bank', kind: 'load', skin: 'shelf', plate: 'BRW-05',
    pos: [-42, -6], face: [1, 0],
    // A battery bank: two tiers of big glass-sided cells on a steel rack, a busbar along the top and a row of load lamps.
    extent: [-7.0, 7.0, -8.6, 0.8]
  },
  'site-6': {
    questId: 'q6-electrolysis', label: 'Bench 6 - Electrolysis', title: 'Electrolysis', structure: 'plating-works', kind: 'supply', skin: 'deck', plate: 'BRW-06',
    pos: [42, -22], face: [-1, 0],
    // The plating works: two plating tanks with anode bars across them, a rectifier cabinet, a hoist gantry and a rack of finished plates.
    extent: [-7.4, 7.4, -9.0, 0.8]
  }
};
