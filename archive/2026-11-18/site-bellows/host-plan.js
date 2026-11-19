/**
 * bellows/host-plan.js — What each of Bellows' six hosts is, and how much deck it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:bellows` all stand on this one table.
 * `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right, z toward
 * the player (the bench's plate is at the origin, so a host's machinery has negative z). It is the bounding
 * rectangle of every body the builder stands on the deck, measured by `verify:bellows` against the real build,
 * so the generator can keep everything else out of it without building anything.
 *
 * A host is the piece of the gas works a bench belongs to (`docs/plans/bench-integration.md` §6): a gauge
 * gallery on a gasholder, the compressor tower's piston deck, a metering skid, a blending manifold, a leak-test
 * station at a vent stack, and the liquefier's cold box.
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open deck in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/**
 * `anchor` says what the host is built against: the free-standing works (`'free'`) or the Compressor at the
 * middle of the deck (`'tower'`), in which case the generator stands the plate this far from the tower's centre,
 * facing away from it, and the tower itself is the machinery behind the plate.
 */
export const HOST_PLAN = {
  'site-1': {
    structure: 'gauge-gallery', kind: 'cylinder', skin: 'shelf', plate: 'BN-01', anchor: 'free',
    // A gasholder on its legs behind the plate, the gallery's pressure gauges at either side.
    extent: [-6.4, 6.6, -14.9, 0.7]
  },
  'site-2': {
    structure: 'piston-deck', kind: 'piston', skin: 'deck', plate: 'BN-02', anchor: 'tower', towerGap: 14.7,
    // Two glass piston cylinders flanking the plate and the pipework to the Compressor's plinth.
    extent: [-6.2, 6.8, -2.4, 0.7]
  },
  'site-3': {
    structure: 'metering-skid', kind: 'scale', skin: 'desk', plate: 'BN-03', anchor: 'free',
    // A gasholder, the skid that weighs gas out of it, and the platform scale beside the plate.
    extent: [-6.8, 9.8, -16.0, 0.7]
  },
  'site-4': {
    structure: 'blending-manifold', kind: 'tanks', skin: 'shelf', plate: 'BN-04', anchor: 'free',
    // A pipe rack on trestles behind the plate, its manifold, and two storage tanks at the ends.
    extent: [-8.5, 8.5, -8.4, 0.7]
  },
  'site-5': {
    structure: 'leak-station', kind: 'pinhole', skin: 'deck', plate: 'BN-05', anchor: 'free',
    // A sight tube along the back of the plate, the bubbler jar and the vessel, and the vent stack standing at the right of the bay.
    extent: [-7.0, 7.4, -9.0, 0.7]
  },
  'site-6': {
    structure: 'cold-box', kind: 'cold', skin: 'desk', plate: 'BN-06', anchor: 'tower', towerGap: 16.0,
    // The liquefier's frosted cold box, its coil and a dewar, standing between the plate and the Compressor.
    extent: [-5.8, 5.8, -3.7, 0.7]
  }
};
