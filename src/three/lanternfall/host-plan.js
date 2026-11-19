/**
 * host-plan.js — What each of Lanternfall's ten hosts is.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:lanternfall` all stand on this table. A host is a
 * room in the ice or the land round the lake (`glacier-plan.js` ROOMS gives its walls, floor and door) together with the
 * working machinery of that place and its bench, built as one object by `stations.js`. Where a host's machinery may
 * stand is the room's own floor: `verify:lanternfall` holds every body that is not the room's shell inside it.
 */

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.6 };

export const HOST_PLAN = {
  'site-1': { structure: 'flume-cave', kind: 'light', skin: 'shelf', plate: 'BN-01' },
  'site-2': { structure: 'mast-vault', kind: 'light', skin: 'desk', plate: 'BN-02' },
  'site-3': { structure: 'melt-cave', kind: 'light', skin: 'shelf', plate: 'BN-03' },
  'site-4': { structure: 'drill-hall', kind: 'cloud', skin: 'desk', plate: 'BN-04' },
  'site-5': { structure: 'records-tent', kind: 'rack', skin: 'desk', plate: 'BN-05' },
  'site-6': { structure: 'records-annexe', kind: 'rack', skin: 'desk', plate: 'BN-06' },
  'site-7': { structure: 'nunatak-chamber', kind: 'electron', skin: 'deck', plate: 'BN-07' },
  'site-8': { structure: 'erratic-store', kind: 'electron', skin: 'shelf', plate: 'BN-08' },
  'site-9': { structure: 'hole-cave', kind: 'light', skin: 'shelf', plate: 'BN-09' },
  'site-10': { structure: 'dome', kind: 'cloud', skin: 'desk', plate: 'BN-10' }
};
