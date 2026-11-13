/**
 * kettle/plant.js — What the works has besides its building and its hosts: the blast furnace and its stoves behind the
 * cast house, the yard, and the far country.
 *
 * Each builder takes the world and returns a Group with its origin on the ground and `userData.colliders =
 * [{ x, z, r }]` (discs, in the group's own frame, where a body can actually touch it). The lamp post and the landing
 * pad are Ember Reach's own generic builders: they ask only for the materials `lantern`, `concrete`, `rusted` and
 * `darkSteel`.
 */

export { buildLampPost, buildLandingPad } from '../ember/plant.js';

/** The colour of iron running from the tap hole: the one fire in the works. Hotter and redder than a lamp. */
export const FURNACE_FIRE = 0xc1521c;

/** What `kettle.js` builds, in order: each is `(world) => Group`. */
export const PLANT_BUILDERS = [];
