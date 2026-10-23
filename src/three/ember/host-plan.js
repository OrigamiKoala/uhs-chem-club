/**
 * ember/host-plan.js — What each of Ember Reach's seven hosts is, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:ember` all stand on this one table.
 * `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right, z toward
 * the player (the bench's plate is at the origin, so a host's machinery has negative z). It is the bounding
 * rectangle of every body the builder stands on the ground, measured by `verify:ember` against the real
 * build, so the generator can keep everything else out of it without building anything.
 *
 * A host is the piece of the geothermal field a bench belongs to (`docs/plans/bench-integration.md` §7): the
 * heat-exchanger plates on a wellhead, a sampling shelf at the hot spring's edge, the habitat's boiler room, a
 * sampling coil over a fumarole, the separator and its two routes for steam, the silencer pair where steam
 * expands, and the turbine hall's control room.
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/**
 * `at` says where the layout generator stands the host: `ring` hosts stand on the bench ring (`angle` degrees from the
 * south, toward the east, at the ring's radius, or at `radius` when one is given); the plate faces the player, who comes
 * in from the ring road. `structure` names the host in the layout, `kind` dresses the cased instrument on the plate.
 */
export const HOST_PLAN = {
  'site-1': {
    structure: 'wellhead-exchanger', kind: 'contact', skin: 'shelf', plate: 'CAL-01',
    angle: 34,
    // A wellhead on its slab with its flowline, a plate heat exchanger on the same line, and a tap on the right.
    extent: [-7.1, 7.0, -6.3, 0.8]
  },
  'site-2': {
    structure: 'spring-shelf', kind: 'cup', skin: 'deck', plate: 'CAL-02',
    angle: 74, radius: 24.5, faceOut: true,
    // A railed sampling shelf at the spring's edge, a davit with a basket, a lagged bath and a platform scale.
    extent: [-7.0, 7.0, -5.2, 0.8]
  },
  'site-3': {
    structure: 'boiler-room', kind: 'cup', skin: 'desk', plate: 'CAL-03',
    angle: 112,
    // A brick boiler on saddles, its flue, a fuel cage and a hopper.
    extent: [-5.3, 5.2, -7.4, 0.8]
  },
  'site-4': {
    structure: 'fumarole-coil', kind: 'bonds', skin: 'deck', plate: 'CAL-04',
    angle: 146,
    // A vent cone with a copper sampling coil over it, a hood and flue, and a gauge board on the right.
    extent: [-6.2, 7.0, -7.2, 0.8]
  },
  'site-5': {
    structure: 'separator-manifold', kind: 'hess', skin: 'shelf', plate: 'CAL-05',
    angle: 214,
    // A cyclone separator, a header and the two routes steam can take from it.
    extent: [-6.3, 7.5, -7.2, 0.8]
  },
  'site-6': {
    structure: 'silencer-pair', kind: 'cell', skin: 'desk', plate: 'CAL-06',
    angle: 250,
    // Two glass bulbs and a stopcock on a stand, a vacuum pump, and the silencer pair standing behind them.
    extent: [-5.8, 5.8, -12.7, 0.8]
  },
  'site-7': {
    structure: 'control-room', kind: 'plot', skin: 'desk', plate: 'CAL-07',
    angle: 288,
    // The turbine hall's control room: a booth with a window on the hall, a furnace and a balance outside it.
    extent: [-7.1, 6.3, -5.7, 0.8]
  }
};
