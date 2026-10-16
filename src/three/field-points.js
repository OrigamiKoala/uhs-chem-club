/**
 * field-points.js — The world-side half of a field stage (plan §2.5).
 *
 * A field stage sends the player out to a spot on the plant, the camp or the
 * mine to take a sample or a reading, and back to the bench with it. The spot is
 * the WORLD's: a real piece of one of its hosts (the conveyor tail, the wave
 * flume, the sump), registered here by id. The tabletop's stage names the id it
 * fetches from (`table.fetch: [{id, label}]`, pieces with `fetchFrom: id`); the
 * built table matches the two.
 *
 * `[E]` on a point is an aim-target like every other: it acts on the point the
 * camera is POINTED at, within its reach, never on whatever stands nearest
 * (`aim-target.js`). The item then rides in the carry slot (a HUD chip) until
 * the player leans in at the bench, where it appears on the table.
 *
 * Pure registration: no three.js, no DOM. A world calls `registerFieldPoint`
 * when it builds a host; `verify:<world>` holds every point to "walkable ground,
 * a clear approach, and a host or a named landmark, never a free-standing marker".
 * No world registers any yet; T1 brings the first (Tallow's conveyor tail).
 */

import { aimBox } from './aim-target.js';

/**
 * @typedef {object} FieldPoint
 * @property {string} id        what a table stage's `fetch` entry names
 * @property {string} siteId    the bench site the item is carried back to
 * @property {string} label     what the prompt calls it, e.g. "Sample Scoop"
 * @property {number[]} pos     world position of the point's centre [x, y, z]
 * @property {string} host      the host or landmark id it belongs to (never a free marker)
 * @property {number[]} [half]  half extents of the aim box, default [0.5, 0.9, 0.5]
 * @property {number} [rotY]    the box's turn about Y
 * @property {number} [reach]   metres [E] works from, default 3
 */

/** The registry rides on the world object, so a world rebuild takes its points with it. */
function table(world) {
  return world._fieldPoints || (world._fieldPoints = new Map());
}

/** Register a point. A point with no host is refused: nothing in a world floats free. */
export function registerFieldPoint(world, p) {
  if (!world || !p || typeof p.id !== 'string' || !p.id) throw new Error('registerFieldPoint: a point needs an id');
  if (!p.host || typeof p.host !== 'string') throw new Error(`registerFieldPoint "${p.id}": a point belongs to a host or a landmark (host: <id>)`);
  if (!Array.isArray(p.pos) || p.pos.length !== 3 || p.pos.some(n => !Number.isFinite(n))) throw new Error(`registerFieldPoint "${p.id}": pos must be [x, y, z]`);
  if (!p.label) throw new Error(`registerFieldPoint "${p.id}": a point needs a label`);
  const rec = { half: [0.5, 0.9, 0.5], rotY: 0, reach: 3, ...p };
  table(world).set(p.id, rec);
  return rec;
}

export function unregisterFieldPoint(world, id) { table(world).delete(id); }
export function clearFieldPoints(world) { table(world).clear(); }

/** Every registered point, optionally only those that feed one bench site. */
export function fieldPointsOf(world, siteId = null) {
  if (!world) return [];
  return [...table(world).values()].filter(p => !siteId || p.siteId === siteId);
}

export function fieldPointById(world, id) {
  return world ? table(world).get(id) || null : null;
}

/**
 * The points as candidates for `pickAimTarget`: each is the box it occupies and
 * the distance [E] works from. `ids` narrows to the points the live table fetches
 * from, so a point for another stage is not offered.
 */
export function fieldAimTargets(world, { ids = null } = {}) {
  return fieldPointsOf(world)
    .filter(p => !ids || ids.includes(p.id))
    .map(p => ({ kind: 'field', point: p, reach: p.reach, boxes: [aimBox(p.pos, p.half, p.rotY)] }));
}
