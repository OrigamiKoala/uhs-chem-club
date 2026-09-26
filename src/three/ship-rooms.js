/**
 * ship-rooms.js — The Avalon's deck plan (pure data).
 *
 * THE SHIP IS A SET OF COMPARTMENTS, NOT A HALL.
 *
 * Everything about the interior — where a bulkhead stands, how wide its
 * doorway is, how high the deckhead is in each room, which collider splits
 * around which opening — comes from this file. `ship/hull.js` builds the plate
 * from it, `verify-ship.mjs` flood-fills the deck against it, and a doorway
 * frame is raised at a real architectural opening rather than invented at
 * runtime from the traversal graph.
 *
 * CONVENTION. +Z is the bow, −Z the stern, −X port, +X starboard, deck at
 * y = 0. The canopy stands at the tip of the nose; the blast wall closes the
 * stern behind the engine room.
 *
 * THE SHIP HAS A SHAPE. The bridge is not a box with a window in one face: its
 * forward corners are raked shoulders that close in to a faceted nose, and the
 * flight pods sit in that nose under a five-pane canopy. `BRIDGE_OUTLINE` is
 * the walkable floor of the bridge; everything in the bridge's bounding box
 * outside it is filled by stepped colliders, so the flood-fill in
 * `verify:ship` sees exactly the deck the plating encloses.
 *
 * THE BEAM IS NARROW ON PURPOSE. A compartment on a working ship is a place
 * you can touch both walls of. What keeps it walkable is not space, it is
 * that every doorway is a genuine 1.5 m clear opening and every route between
 * two of them is a straight line down the spine.
 */

/** Outer hull: `min/max` are the INNER faces of the plating. */
export const HULL = {
  minX: -5.6, maxX: 5.6,
  minZ: -11.0, maxZ: 6.8,
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

/**
 * Deckhead heights. A compartment is low; the bridge is taller, and the
 * engine room is the tallest space aboard because the reactor stands in it.
 */
export const CEIL = { room: 3.0, bridge: 3.4, furnace: 4.0 };

/** Interior bulkhead thickness, and the clear opening every doorway gives. */
export const WALL_T = 0.22;
export const DOOR_CLEAR = 1.5;
export const DOOR_H = 2.15;

/**
 * THE COMPARTMENTS. `minX/maxX/minZ/maxZ` are the bulkhead CENTRE lines (or
 * the plating's inner face, for a side that is hull), so a room's usable deck
 * is inset by half a wall on every side that has one. `centre` is the clear
 * middle of the room — the point `verify:ship` walks to. `route` is the hash
 * route the station in it binds to, or null for a place that is only a place.
 */
export const ROOMS = {
  bridge: {
    name: 'COMMAND BRIDGE', minX: -5.6, maxX: 5.6, minZ: 0.5, maxZ: 6.8,
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
    name: 'CARGO HOLD', minX: 1.15, maxX: 5.6, minZ: -2.9, maxZ: 0.5,
    ceil: CEIL.room, centre: [3.375, -1.2], route: '#/inventory'
  },
  stairwell: {
    name: 'LADDERWELL', minX: 1.15, maxX: 5.6, minZ: -5.4, maxZ: -2.9,
    ceil: CEIL.room, centre: [2.4, -4.15], route: null
  },
  airlock: {
    name: 'AIRLOCK', minX: 1.15, maxX: 5.6, minZ: -7.8, maxZ: -5.4,
    ceil: CEIL.room, centre: [3.375, -6.6], route: '#/quest'
  },
  furnace: {
    name: 'ENGINE ROOM', minX: -5.6, maxX: 5.6, minZ: -11.0, maxZ: -7.8,
    ceil: CEIL.furnace, centre: [0, -9.4], route: null
  }
};

/**
 * THE BRIDGE FLOOR, as the plating encloses it (inner faces, counter-
 * clockwise seen from above). Aft edge on the bridge bulkhead, straight sides
 * to z 3.2, raked shoulders in to the nose, and the nose itself closing on the
 * canopy in three facets. It is convex, which `outlineSpan` relies on.
 */
export const BRIDGE_OUTLINE = [
  [-5.6, 0.5], [5.6, 0.5],
  [5.6, 3.2], [2.6, 5.2], [1.7, 6.3], [0.6, 6.8],
  [-0.6, 6.8], [-1.7, 6.3], [-2.6, 5.2], [-5.6, 3.2]
];

/**
 * The glazed facets of the canopy — the last five edges of the nose, port to
 * starboard, as index pairs into `BRIDGE_OUTLINE`. Each pane rakes back from
 * its sill; `CANOPY` says by how much.
 */
export const CANOPY = {
  facets: [[8, 7], [7, 6], [6, 5], [5, 4], [4, 3]],
  sill: 0.92,     // top of the solid coaming under the glass
  top: 2.85,      // head of the glass
  rake: 0.9       // how far aft the head sits of the sill, measured square to each pane
};

/** The x-interval of a convex outline at depth z, or null outside it. */
export function outlineSpan(outline, z) {
  const xs = [];
  for (let i = 0; i < outline.length; i++) {
    const [x1, z1] = outline[i];
    const [x2, z2] = outline[(i + 1) % outline.length];
    if ((z >= Math.min(z1, z2)) && (z <= Math.max(z1, z2)) && Math.abs(z2 - z1) > 1e-9) {
      xs.push(x1 + (x2 - x1) * ((z - z1) / (z2 - z1)));
    }
  }
  if (xs.length < 2) return null;
  return [Math.min(...xs), Math.max(...xs)];
}

/**
 * Viewports cut through the outer plating: `side` −1 port / +1 starboard,
 * `z` the centre along the hull, `y` the centre height. `r` makes a round
 * port; `w`/`h` a slot with radiused ends. The rooms keep them clear.
 */
export const HULL_WINDOWS = [
  { room: 'quarters', side: -1, z: -0.35, y: 1.55, r: 0.3 },
  { room: 'berth_b', side: -1, z: -3.15, y: 1.55, r: 0.3 },
  { room: 'comms', side: -1, z: -6.45, y: 1.85, w: 1.3, h: 0.34 }
];

/**
 * The viewports in the bridge's raked shoulders: `t` is how far along the
 * shoulder (0 at the straight side, 1 at the nose), each a slot `w` × `h`
 * centred at height `y`.
 */
export const SHOULDER_PORTS = [
  { t: 0.3, y: 1.75, w: 0.9, h: 0.34 },
  { t: 0.64, y: 1.75, w: 0.9, h: 0.34 }
];

/**
 * A hatch in the deck: the ladder in the ladderwell goes down through it to
 * the lower deck. The deck plate is built round it and the railing that
 * guards it is the collider.
 */
export const FLOOR_HATCH = { room: 'stairwell', minX: 3.75, maxX: 4.95, minZ: -4.75, maxZ: -3.55 };

/**
 * THE BULKHEADS.
 *
 * `axis` is the axis the wall's PLANE is perpendicular to; `at` is where that
 * plane sits; `from`/`to` bracket it along the other horizontal axis. Each
 * entry in `openings` is a CLEAR span — the plate stops there and the doorway
 * portal's jambs stand on the ends of the plate, so the opening a player walks
 * through is exactly `DOOR_CLEAR` wide.
 *
 * THE OPENINGS ARE PLACED FOR THE DOORS. A door is two leaves that slide into
 * the bulkhead, each travelling half the opening, so every opening keeps at
 * least that much solid wall between it and the END of its run — a leaf
 * sliding off the end of a partition would stick out into the next room. Two
 * openings in one run may share pocket length, because a door's two leaves
 * ride at different depths inside the wall (see `ship/doors.js`).
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

  // Spine / engine room, across the beam at the aft end of the corridor.
  { id: 'bulk-furnace', axis: 'z', at: -7.8, from: -5.6, to: 5.6,
    top: CEIL.furnace, openings: [[-0.75, 0.75]] },

  // Port side of the spine: berth A, berth B, comms.
  { id: 'spine-port', axis: 'x', at: -1.15, from: -7.8, to: 0.5,
    top: CEIL.room, openings: [[-1.95, -0.45], [-4.45, -2.95], [-7.0, -5.5]] },

  // Starboard side of the spine: cargo, the ladderwell, the airlock.
  { id: 'spine-stbd', axis: 'x', at: 1.15, from: -7.8, to: 0.5,
    top: CEIL.room, openings: [[-1.95, -0.45], [-4.7, -3.2], [-7.13, -5.63]] },

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
        span: [a, b],
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
    if (x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ) {
      if (id === 'bridge') {
        const span = outlineSpan(BRIDGE_OUTLINE, z);
        if (!span || x < span[0] || x > span[1]) continue;
      }
      return id;
    }
  }
  return null;
}
