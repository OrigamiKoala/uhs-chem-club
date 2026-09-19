/**
 * ship-rooms.js — The Avalon's deck plan (pure data).
 *
 * THE SHIP IS A SET OF COMPARTMENTS, NOT A HALL.
 *
 * Everything about the interior — where a bulkhead stands, how wide its
 * doorway is, how high the deckhead is in each room, which collider splits
 * around which opening — comes from this file. `ship.js` builds the plate from
 * it, `verify-ship.mjs` flood-fills the deck against it, and a doorway frame is
 * raised at a real architectural opening rather than invented at runtime from
 * the traversal graph.
 *
 * CONVENTION. +Z is the bow, −Z the stern, −X port, +X starboard, deck at
 * y = 0. The forward canopy stands at the bow face; the blast wall closes the
 * stern behind the furnace.
 *
 * THE BEAM IS NARROW ON PURPOSE. A compartment on a working ship is a place
 * you can touch both walls of. Rooms are 2.4–3.4 m deep with a 2.75 m
 * deckhead; only the bridge (a canopy to see out of) and the furnace room (a
 * firebox with a flue) are taller. What keeps it walkable is not space, it is
 * that every doorway is a genuine 1.5 m clear opening and every route between
 * two of them is a straight line down the spine.
 */

/** Outer hull: `min/max` are the INNER faces of the plating. */
export const HULL = {
  minX: -5.6, maxX: 5.6,
  minZ: -11.0, maxZ: 4.6,
  plate: 0.5,
  /**
   * Frames stand proud of the plating, so the deck a player can actually
   * stand on stops short of the plate face. The hull colliders are drawn to
   * THIS line, which is where the frames are, not to the plate.
   */
  frame: 0.16
};

/** The walkable box the camera is clamped to (hull inset to the frames). */
export const SHIP_BOUNDS = {
  minX: HULL.minX + HULL.frame,
  maxX: HULL.maxX - HULL.frame,
  minZ: HULL.minZ + HULL.frame,
  maxZ: HULL.maxZ - HULL.frame
};

/** Where a player standing on the bridge starts, and what they are looking at. */
export const SHIP_SPAWN = { pos: [0, 1.55, 1.3], look: [0, 1.55, 20] };

/** Deckhead heights. A compartment is low; the bridge and the furnace are not. */
export const CEIL = { room: 2.75, bridge: 3.5, furnace: 3.2 };

/** Interior bulkhead thickness, and the clear opening every doorway gives. */
export const WALL_T = 0.22;
export const DOOR_CLEAR = 1.5;
export const DOOR_H = 2.15;

/**
 * The compartments. `minX/maxX/minZ/maxZ` are the bulkhead CENTRE lines, so a
 * room's usable deck is inset by half a wall on every side that has one.
 * `centre` is the clear middle of the room — the point `verify:ship` walks to.
 * `route` is the hash route the station in it binds to, or null for a place
 * that is only a place.
 */
export const ROOMS = {
  bridge: {
    name: 'COMMAND BRIDGE', minX: -5.6, maxX: 5.6, minZ: 0.5, maxZ: 4.6,
    ceil: CEIL.bridge, centre: [0, 2.55], route: '#/bridge'
  },
  corridor: {
    name: 'SPINE', minX: -1.15, maxX: 1.15, minZ: -7.8, maxZ: 0.5,
    ceil: CEIL.room, centre: [0, -3.6], route: null
  },
  quarters: {
    name: 'CREW BERTH A', minX: -5.6, maxX: -1.15, minZ: -2.3, maxZ: 0.5,
    ceil: CEIL.room, centre: [-3.375, -0.9], route: '#/quarters'
  },
  berth_b: {
    name: 'CREW BERTH B', minX: -5.6, maxX: -1.15, minZ: -5.1, maxZ: -2.3,
    ceil: CEIL.room, centre: [-3.375, -3.7], route: null
  },
  comms: {
    name: 'COMMS', minX: -5.6, maxX: -1.15, minZ: -7.8, maxZ: -5.1,
    ceil: CEIL.room, centre: [-3.375, -6.45], route: '#/leaderboard'
  },
  cargo: {
    name: 'STORAGE', minX: 1.15, maxX: 5.6, minZ: -2.9, maxZ: 0.5,
    ceil: CEIL.room, centre: [3.375, -1.2], route: '#/inventory'
  },
  stairwell: {
    name: 'STAIRWELL', minX: 1.15, maxX: 5.6, minZ: -5.4, maxZ: -2.9,
    ceil: CEIL.room, centre: [3.375, -4.15], route: null
  },
  airlock: {
    name: 'AIRLOCK', minX: 1.15, maxX: 5.6, minZ: -7.8, maxZ: -5.4,
    ceil: CEIL.room, centre: [3.375, -6.6], route: '#/quest'
  },
  furnace: {
    name: 'FURNACE ROOM', minX: -5.6, maxX: 5.6, minZ: -11.0, maxZ: -7.8,
    ceil: CEIL.furnace, centre: [0, -9.4], route: null
  }
};

/**
 * THE BULKHEADS.
 *
 * `axis` is the axis the wall's PLANE is perpendicular to; `at` is where that
 * plane sits; `from`/`to` bracket it along the other horizontal axis. Each
 * entry in `openings` is a CLEAR span — the plate stops there and the doorway
 * frame's posts stand on the ends of the plate, so the opening a player walks
 * through is exactly `DOOR_CLEAR` wide.
 *
 * The rule that makes this worth writing down: colliders come from the SOLID
 * SEGMENTS computed here, never from the whole wall. A wall collided as one
 * box with a hole drawn in the mesh is a doorway you can see through and walk
 * into.
 */
export const WALLS = [
  // Bridge / spine. One opening: the mouth of the corridor.
  { id: 'bulk-bridge', axis: 'z', at: 0.5, from: -5.6, to: 5.6,
    top: CEIL.bridge, openings: [[-0.75, 0.75]] },

  // Spine / furnace room, across the beam at the aft end of the corridor.
  { id: 'bulk-furnace', axis: 'z', at: -7.8, from: -5.6, to: 5.6,
    top: CEIL.furnace, openings: [[-0.75, 0.75]] },

  // Port side of the spine: berth A, berth B, comms.
  { id: 'spine-port', axis: 'x', at: -1.15, from: -7.8, to: 0.5,
    top: CEIL.room, openings: [[-1.65, -0.15], [-4.45, -2.95], [-7.2, -5.7]] },

  // Starboard side of the spine: storage, the stairwell vestibule, the airlock.
  { id: 'spine-stbd', axis: 'x', at: 1.15, from: -7.8, to: 0.5,
    top: CEIL.room, openings: [[-1.95, -0.45], [-4.9, -3.4], [-7.35, -5.85]] },

  // Room-to-room bulkheads. No openings: every room is entered off the spine.
  { id: 'bulk-berths', axis: 'z', at: -2.3, from: -5.6, to: -1.15,
    top: CEIL.room, openings: [] },
  { id: 'bulk-berthb-comms', axis: 'z', at: -5.1, from: -5.6, to: -1.15,
    top: CEIL.room, openings: [] },
  { id: 'bulk-storage-stair', axis: 'z', at: -2.9, from: 1.15, to: 5.6,
    top: CEIL.room, openings: [] },
  { id: 'bulk-stair-airlock', axis: 'z', at: -5.4, from: 1.15, to: 5.6,
    top: CEIL.room, openings: [] }
];

/**
 * The solid stretches of a wall: everything between `from` and `to` that an
 * opening does not take out. This is what gets plate and what gets a collider.
 */
export function wallSegments(wall) {
  const cuts = [...(wall.openings || [])].sort((a, b) => a[0] - b[0]);
  const out = [];
  let cursor = wall.from;
  for (const [a, b] of cuts) {
    if (a > cursor) out.push([cursor, a]);
    cursor = Math.max(cursor, b);
  }
  if (cursor < wall.to) out.push([cursor, wall.to]);
  return out.filter(([a, b]) => b - a > 0.001);
}

/**
 * Every architectural opening in the ship, as the frames and the graph both
 * need to know it: where its centre is, which way you walk through it, and
 * how wide it is.
 */
export function doorways() {
  const out = [];
  for (const wall of WALLS) {
    for (const [a, b] of wall.openings || []) {
      const mid = (a + b) / 2;
      out.push({
        wall: wall.id,
        axis: wall.axis,
        // The direction a player walks through it.
        through: wall.axis === 'x' ? [1, 0] : [0, 1],
        pos: wall.axis === 'x' ? [wall.at, mid] : [mid, wall.at],
        clear: b - a,
        top: wall.top
      });
    }
  }
  return out;
}

/** Is this point inside a room (or the corridor), ignoring furniture? */
export function roomAt(x, z) {
  for (const [id, r] of Object.entries(ROOMS)) {
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) return id;
  }
  return null;
}
