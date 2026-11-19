/**
 * mirrowen/host-plan.js — What each of Mirrowen's seven hosts is, and how much ground it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:mirrowen` all stand on this one
 * table. `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's
 * right, z toward the player (the bench's plate is at the origin, so a host's machinery has negative
 * z). It is the bounding rectangle of every body the builder stands on the ground, measured by
 * `verify:mirrowen` against the real build, so the generator can keep everything else out of it
 * without building anything.
 *
 * A host is the piece of the harbour a bench belongs to (`docs/plans/bench-integration.md` §7): an
 * ice-breaker's chart house, a bay of the tank farm, a pumping station, the yard where canal ice is
 * cut, the boiler house, a dosing station and the distillery.
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

/**
 * `at` says where the layout generator stands the host: hosts stand on the bench ring (`angle` degrees
 * from the south, toward the east, at `radius`); the plate faces the middle of the harbour, where the
 * player comes in from the ring road. `structure` names the host in the layout, `kind` dresses the
 * cased instrument on the plate.
 */
export const HOST_PLAN = {
  'site-1': {
    structure: 'chart-house', kind: 'window', skin: 'desk', plate: 'MW-01',
    angle: 34, radius: 44,
    // The ice-breaker's chart house: a steel wheelhouse with a window band, a radar mast, an anchor and a heap of survey buoys.
    extent: [-6.3, 6.5, -6.1, 0.8]
  },
  'site-2': {
    structure: 'tank-bay', kind: 'probe', skin: 'deck', plate: 'MW-02',
    angle: 74, radius: 44,
    // A bay of the tank farm: three storage tanks in a bund, a manifold of valves across their feet and a pump skid.
    extent: [-8.4, 8.4, -9.6, 0.8]
  },
  'site-3': {
    structure: 'pump-house', kind: 'flask', skin: 'desk', plate: 'MW-03',
    angle: 112, radius: 44,
    // The pumping station: a pump house, two pump casings on a skid, a standpipe and the discharge header.
    extent: [-6.6, 7.2, -7.9, 0.8]
  },
  'site-4': {
    structure: 'cutting-yard', kind: 'tester', skin: 'deck', plate: 'MW-04',
    angle: 146, radius: 44,
    // The ice-cutting yard: a portal crane over a stack of cut blocks, a saw table and a conveyor.
    extent: [-7.5, 7.5, -11.6, 0.8]
  },
  'site-5': {
    structure: 'boiler-house', kind: 'curve', skin: 'shelf', plate: 'MW-05',
    angle: 214, radius: 44,
    // The harbour boiler house: a brick-set boiler drum under a lean-to, its stack, a fuel day tank and a steam header.
    extent: [-5.4, 7.0, -10.0, 0.8]
  },
  'site-6': {
    structure: 'dosing-station', kind: 'volumetric', skin: 'shelf', plate: 'MW-06',
    angle: 250, radius: 44,
    // The dosing station: a hopper over a mixing tank on a railed platform, a dosing pump and a cage of chemical totes.
    extent: [-6.7, 6.4, -8.4, 0.8]
  },
  'site-7': {
    structure: 'distillery', kind: 'strip', skin: 'desk', plate: 'MW-07',
    angle: 288, radius: 44,
    // The distillery: a copper pot still on its firebox, a column, a condenser and the receivers.
    extent: [-5.6, 6.2, -9.2, 0.8]
  }
};
