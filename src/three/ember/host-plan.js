/**
 * ember/host-plan.js — What each of Ember Reach's seven hosts is, and how much room it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:ember` all stand on this one table
 * and on `caldera-plan.js` (`ROOMS`).
 * `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the player's right, z toward
 * the player (the bench's plate is at the origin, so a host's machinery has negative z).
 */

import { ROOMS, PLATE_FROM_BACK } from './caldera-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open ground in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.2 };

/**
 * Each host sits inside its declared room in `caldera-plan.js`. `extent` stays inside the room's interior
 * walls (`minX/maxX/minZ/maxZ` with 0.25 m clearance) so no host machinery pokes through a rock wall.
 */
export const HOST_PLAN = Object.fromEntries(ROOMS.map(rm => {
  const w = rm.rect.maxX - rm.rect.minX;
  const d = rm.rect.maxZ - rm.rect.minZ;
  const spanX = rm.facing === 'north' ? w : d;
  const halfX = Math.round((spanX / 2 - 0.35) * 100) / 100;
  const backZ = -Math.round((PLATE_FROM_BACK - 0.2) * 100) / 100;
  return [rm.site, {
    roomId: rm.id,
    structure: rm.structure,
    kind: rm.kind,
    skin: rm.skin,
    plate: rm.plate,
    shell: rm.shell,
    extent: [-halfX, halfX, backZ, 0.85]
  }];
}));
