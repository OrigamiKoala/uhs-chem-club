/**
 * bellows/host-plan.js — What each of Bellows' six hosts is, and how much room it takes.
 *
 * Pure data, no THREE: the layout generator, the world and `verify:bellows` all stand on this table and on
 * `works-plan.js` (`ROOMS`). `extent` is the host's footprint in ITS OWN frame, `[x0, x1, z0, z1]`: x to the
 * player's right, z toward the player (the plate is at the origin, so machinery has negative z). Every extent
 * stays inside its room's walls with 0.35 m to spare, so no host stands through a wall.
 */

import { ROOMS, PLATE_FROM_BACK } from './works-plan.js';

/** The bench's own plate and the two feet round it that are always the bench's (host frame). */
export const BENCH_RECT = [-2.5, 2.5, -0.7, 0.7];

/** The open floor in front of a plate, where the camera stands and the player walks in (host frame). */
export const LANE = { hw: 2.8, from: 0.65, to: 5.2 };

export const HOST_PLAN = Object.fromEntries(ROOMS.map(rm => {
  const w = rm.rect.maxX - rm.rect.minX;
  const d = rm.rect.maxZ - rm.rect.minZ;
  const spanX = rm.facing === 'north' || rm.facing === 'south' ? w : d;
  const halfX = Math.round((spanX / 2 - 0.35) * 100) / 100;
  const backZ = -Math.round((PLATE_FROM_BACK - 0.35) * 100) / 100;
  return [rm.site, {
    roomId: rm.id,
    structure: rm.structure,
    kind: rm.kind,
    skin: rm.skin,
    plate: rm.plate,
    shell: rm.shell,
    extent: [-halfX, halfX, backZ, 3.0]
  }];
}));
