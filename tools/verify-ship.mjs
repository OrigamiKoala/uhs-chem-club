/**
 * tools/verify-ship.mjs — The ship and Erebus, as graph, as deck plan, and as
 * geometry.
 *
 * Three halves, now that the Avalon has walls.
 *
 * The first asserts the traversal graph invariants from
 * 3d-conversion-prompts.md §3.2 & §4.3 — connectivity, the three-hop limit,
 * hatch markers, spline bounds — rewritten where a spine corridor made the old
 * hub-and-spoke assumptions untrue. Each rewrite says so where it stands.
 *
 * The second is the one that matters most: it builds the REAL `ShipInterior`
 * in Node and FLOOD-FILLS the deck against its colliders from the spawn. Every
 * room's centre, every station, every doorway marker and every spline point
 * has to come back reachable. A room you cannot walk into is worse than no
 * room, and a wall with a hole drawn in it but collided as one slab looks
 * perfect from the outside.
 *
 * The third builds the REAL `ShipInterior` and the REAL `WorldScene` and
 * measures every pair of separate objects in them. Nothing may occupy the same
 * space as anything else: a locker standing in a doorway, a pipe run drawn
 * through a frame gusset, a container stacked across a hatch. That is a claim
 * about the world that is actually built, so it is checked against the world
 * that is actually built rather than against a table kept beside it — a table
 * drifts the first time somebody nudges a crate.
 *
 * Parts INSIDE one object are expected to interpenetrate: a jamb post that
 * merely touched the plate it is welded to would be holding nothing. So the
 * hull (which now includes every interior bulkhead and doorway frame), the
 * corridor services and each prop are each one object, and the check runs
 * strictly between them.
 */

import { SHIP_GRAPH } from '../src/three/ship-graph.js';
import {
  HULL, SHIP_BOUNDS, SHIP_SPAWN, ROOMS, WALLS, DOOR_CLEAR, WALL_T,
  wallSegments, doorways, roomAt
} from '../src/three/ship-rooms.js';

let failed = false;
function assert(cond, msg) {
  if (!cond) {
    console.error(`  fail ${msg}`);
    failed = true;
  } else {
    console.log(`  ok   ${msg}`);
  }
}

console.log('Ship Traversal Graph Invariant Check\n');

const nodes = SHIP_GRAPH.nodes;
const nodeKeys = Object.keys(nodes);
const DOORS = doorways();

// 1. Graph is undirected: if A lists B, B lists A
for (const [aKey, aNode] of Object.entries(nodes)) {
  for (const bKey of aNode.adjacent) {
    const bNode = nodes[bKey];
    assert(bNode && bNode.adjacent.includes(aKey), `undirected: ${aKey} <-> ${bKey}`);
  }
}

/*
 * 2. WHAT THE AIRLOCK IS ALLOWED TO TOUCH — rewritten.
 *
 * This used to read "airlock adjacent strictly to bridge and cargo", which was
 * true of a ship whose compartments all opened onto one another. They no
 * longer do: every room opens off the spine, so adjacency means "one corridor
 * run apart", and the bridge is four rooms forward of the airlock.
 *
 * The invariant that replaces it is the general form of what that check was
 * protecting — the departure hatch must not be somewhere a player can wander
 * into by accident, and must not claim a shortcut that the deck plan does not
 * have. So: the airlock is adjacent ONLY to the two compartments that share
 * the aft stretch of corridor with it, and to nothing forward of them.
 */
const airlockAdj = [...nodes.airlock.adjacent].sort();
assert(
  JSON.stringify(airlockAdj) === JSON.stringify(['cargo', 'comms']),
  `airlock adjacent strictly to the two compartments on its stretch of the spine (is: ${airlockAdj.join(', ')})`
);

// 3. Reachable from bridge in <= 3 hops (BFS)
const queue = [['bridge', 0]];
const dist = { bridge: 0 };
while (queue.length > 0) {
  const [curr, d] = queue.shift();
  for (const nxt of nodes[curr].adjacent) {
    if (dist[nxt] === undefined) {
      dist[nxt] = d + 1;
      queue.push([nxt, d + 1]);
    }
  }
}
for (const key of nodeKeys) {
  assert(dist[key] !== undefined && dist[key] <= 3, `node ${key} within 3 hops of bridge (hops: ${dist[key]})`);
}

// 4. lookLimits yaw <= 100, pitch <= 35
for (const [key, node] of Object.entries(nodes)) {
  assert(
    node.lookLimits.yaw <= 100 && node.lookLimits.pitch <= 35,
    `lookLimits for ${key} within [100, 35] (is ${node.lookLimits.yaw}°, ${node.lookLimits.pitch}°)`
  );
}

function yawBetween(a, b) {
  const dot = a[0] * b[0] + a[1] * b[1];
  const m1 = Math.hypot(a[0], a[1]);
  const m2 = Math.hypot(b[0], b[1]);
  if (m1 < 1e-6 || m2 < 1e-6) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * (180 / Math.PI);
}

/*
 * 5. HATCH MARKERS — rewritten, and made stricter.
 *
 * The old check asked whether `hatchPos` fell inside the node's yaw cone
 * measured from its resting `target`. On a hub that was the whole story. On a
 * ship with a spine it is unsatisfiable by construction: a compartment's
 * neighbours lie fore AND aft of it, so no single resting heading can hold all
 * of its hatch markers inside 100 degrees, and widening the cone until it
 * could would have made the assertion vacuous.
 *
 * What the check was really protecting is that a hatch marker is a thing you
 * can SEE as you set off towards it. That is preserved, against the heading
 * the dolly actually departs on — the first segment of that edge's walkPath —
 * rather than against a heading nobody is facing by the time they leave.
 *
 * And a stricter claim is added that the old layout could not make: a marker
 * for an edge that crosses a bulkhead must sit in a REAL DOORWAY, one that
 * `ship-rooms.js` declares, within 0.75 m of its centre. A view-cone marker
 * floating in the middle of a wall is now a failure rather than a matter of
 * taste.
 */
for (const [aKey, aNode] of Object.entries(nodes)) {
  const aRoom = roomAt(aNode.pos[0], aNode.pos[2]);
  for (const bKey of aNode.adjacent) {
    const hPos = aNode.hatchPos[bKey];
    assert(!!hPos, `hatchPos present for edge ${aKey} -> ${bKey}`);
    if (!hPos) continue;

    const wp = aNode.walkPath[bKey];
    if (wp && wp.length >= 2) {
      const depart = [wp[1][0] - aNode.pos[0], wp[1][2] - aNode.pos[2]];
      const toHatch = [hPos[0] - aNode.pos[0], hPos[2] - aNode.pos[2]];
      const ang = yawBetween(depart, toHatch);
      assert(
        ang <= aNode.lookLimits.yaw + 5,
        `hatchPos ${aKey}->${bKey} inside the departure yaw cone (${ang.toFixed(1)}° <= ${aNode.lookLimits.yaw}°)`
      );
    }

    const bRoom = roomAt(nodes[bKey].pos[0], nodes[bKey].pos[2]);
    if (aRoom && bRoom && aRoom !== bRoom) {
      const near = DOORS.reduce((best, d) => {
        const dist = Math.hypot(hPos[0] - d.pos[0], hPos[2] - d.pos[1]);
        return (!best || dist < best.dist) ? { d, dist } : best;
      }, null);
      assert(
        near && near.dist <= 0.75,
        `hatchPos ${aKey}->${bKey} sits in a real doorway (nearest opening ${near ? near.dist.toFixed(2) : '—'} m away)`
      );
    }
  }
}

// 6. walkPath splines
for (const [aKey, aNode] of Object.entries(nodes)) {
  for (const bKey of aNode.adjacent) {
    const wp = aNode.walkPath[bKey];
    assert(Array.isArray(wp) && wp.length >= 3 && wp.length <= 6, `walkPath ${aKey}->${bKey} has 3..6 points (${wp?.length})`);
    if (wp && wp.length >= 2) {
      const bNode = nodes[bKey];
      const startDist = Math.hypot(wp[0][0] - aNode.pos[0], wp[0][1] - aNode.pos[1], wp[0][2] - aNode.pos[2]);
      const endDist = Math.hypot(wp[wp.length - 1][0] - bNode.pos[0], wp[wp.length - 1][1] - bNode.pos[1], wp[wp.length - 1][2] - bNode.pos[2]);
      assert(startDist < 0.01, `walkPath ${aKey}->${bKey} starts at ${aKey}.pos`);
      assert(endDist < 0.01, `walkPath ${aKey}->${bKey} ends at ${bKey}.pos`);

      const yOk = wp.every(pt => pt[1] >= 1.4 && pt[1] <= 1.85);
      assert(yOk, `walkPath ${aKey}->${bKey} Y coords within [1.4, 1.85]`);

      /*
       * Clearance against the NEW hull. The beam was narrowed from ±8.0 to
       * ±5.6 and the ship lengthened aft to −11.0 for the furnace room, so the
       * old box would have passed a spline drawn straight through the plating.
       * Measured against the walkable clamp box, which is the hull inset to
       * the frames — the same box `stage.setMode` gives the controls.
       */
      const boundsOk = wp.every(pt =>
        pt[0] >= SHIP_BOUNDS.minX && pt[0] <= SHIP_BOUNDS.maxX &&
        pt[2] >= SHIP_BOUNDS.minZ && pt[2] <= SHIP_BOUNDS.maxZ);
      assert(boundsOk, `walkPath ${aKey}->${bKey} stays inside the hull frames`);
    }
  }
}

// 7. Route binding
const expectedRoutes = [
  '#/bridge',
  '#/starmap',
  '#/quarters',
  '#/inventory',
  '#/leaderboard',
  '#/settings',
  '#/quest'
];
const boundRoutes = Object.keys(SHIP_GRAPH.routeBinding).sort();
assert(
  JSON.stringify(boundRoutes) === JSON.stringify(expectedRoutes.sort()),
  `routeBinding covers exactly the 7 canonical routes`
);
for (const [r, nKey] of Object.entries(SHIP_GRAPH.routeBinding)) {
  assert(nodes[nKey] !== undefined, `routeBinding ${r} points to valid node ${nKey}`);
}

/* ============================================================ DECK PLAN */

console.log('\nDeck plan — every compartment is a compartment\n');

for (const wall of WALLS) {
  const segs = wallSegments(wall);
  const total = segs.reduce((s, [a, b]) => s + (b - a), 0);
  const span = wall.to - wall.from;
  assert(total <= span + 1e-6, `${wall.id}: plate never exceeds the run it is welded into`);
  for (const [a, b] of wall.openings || []) {
    assert(b - a >= 1.3, `${wall.id}: opening at ${((a + b) / 2).toFixed(2)} gives >= 1.3 m clear (${(b - a).toFixed(2)} m)`);
    assert(a >= wall.from - 1e-6 && b <= wall.to + 1e-6, `${wall.id}: opening lies inside the wall run`);
  }
}
assert(DOOR_CLEAR >= 1.3, `every declared doorway is at least 1.3 m clear (${DOOR_CLEAR} m)`);

/*
 * A door's leaves slide into the bulkhead, half the opening each way. A leaf
 * that runs off the end of its partition sticks out into the next room, so
 * every opening keeps that much wall between it and the end of its run (the
 * end is allowed to be buried in the perpendicular bulkhead it meets).
 */
for (const wall of WALLS) {
  for (const [a, b] of wall.openings || []) {
    const travel = (b - a) / 2 + 0.015;
    const lo = a - travel, hi = b + travel;
    assert(lo >= wall.from - WALL_T / 2 && hi <= wall.to + WALL_T / 2,
      `${wall.id}: the door at ${((a + b) / 2).toFixed(2)} has pocket for both leaves (${lo.toFixed(2)}..${hi.toFixed(2)} within ${wall.from}..${wall.to})`);
  }
}

for (const [id, r] of Object.entries(ROOMS)) {
  assert(r.maxX > r.minX && r.maxZ > r.minZ, `room ${id} has positive extent`);
  assert(
    r.minX >= HULL.minX - 1e-6 && r.maxX <= HULL.maxX + 1e-6 &&
    r.minZ >= HULL.minZ - 1e-6 && r.maxZ <= HULL.maxZ + 1e-6,
    `room ${id} lies inside the hull`
  );
  assert(
    r.centre[0] > r.minX && r.centre[0] < r.maxX &&
    r.centre[1] > r.minZ && r.centre[1] < r.maxZ,
    `room ${id}'s declared centre is inside it`
  );
}

/*
 * One DOM shim for the whole file.
 *
 * There used to be a hand-rolled context mock here with about a dozen of the
 * canvas methods on it, which worked right up until a texture generator used a
 * thirteenth. `tools/lib/dom-shim.mjs` is the single stand-in every verifier
 * that has to BUILD something shares, so a new drawing call is handled once.
 */
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
const { ShipInterior, CLUB_BOARD_POS, BRIDGE_STAND } = await import('../src/three/ship.js');
const ship = new ShipInterior(new THREE.Scene());

/* ====================================================== REACHABILITY */

console.log('\nReachability — flood-filled from the spawn against the real colliders\n');

const { floodFill } = await import('./lib/reach.mjs');
const reach = floodFill(
  ship.colliders, SHIP_BOUNDS, [SHIP_SPAWN.pos[0], SHIP_SPAWN.pos[2]],
  { step: 0.15, radius: 0.25 }
);

assert(reach.spawnFree, `the spawn at (${SHIP_SPAWN.pos[0]}, ${SHIP_SPAWN.pos[2]}) is standable`);
assert(reach.cells > 800, `the walkable deck is a deck, not a cupboard (${reach.cells} cells of ${reach.step} m)`);

for (const [id, r] of Object.entries(ROOMS)) {
  const [x, z] = r.centre;
  assert(reach.reachable(x, z),
    `${id}: you can walk to the middle of it${reach.reachable(x, z) ? '' : ` — ${reach.explain(x, z)}`}`);
}

for (const [key, node] of Object.entries(nodes)) {
  const [x, , z] = node.pos;
  assert(reach.reachable(x, z),
    `station ${key} is standable and reachable${reach.reachable(x, z) ? '' : ` — ${reach.explain(x, z)}`}`);
}

for (const d of DOORS) {
  const [x, z] = d.pos;
  assert(reach.reachable(x, z),
    `doorway on ${d.wall} at (${x.toFixed(2)}, ${z.toFixed(2)}) is walkable${reach.reachable(x, z) ? '' : ` — ${reach.explain(x, z)}`}`);
}

/*
 * A ROOM YOU CAN REACH THE MIDDLE OF IS NOT A ROOM YOU CAN WALK AROUND.
 *
 * The furnace room passed "you can walk to the middle of it" while a slag bin
 * sealed the whole starboard half behind a 0.4 m gap and the firebox's ash
 * pans left 0.38 m in front of its door. So every standable cell inside a
 * room must be reachable: deck a body fits on but cannot get to is a pocket
 * the layout has walled off by accident.
 */
{
  const { isFree: free } = await import('./lib/reach.mjs');
  const r = 0.25;
  for (const [id, room] of Object.entries(ROOMS)) {
    const sealed = [];
    for (let x = room.minX + 0.2; x <= room.maxX - 0.2; x += 0.15) {
      for (let z = room.minZ + 0.2; z <= room.maxZ - 0.2; z += 0.15) {
        if (x < SHIP_BOUNDS.minX + r || x > SHIP_BOUNDS.maxX - r) continue;
        if (z < SHIP_BOUNDS.minZ + r || z > SHIP_BOUNDS.maxZ - r) continue;
        if (free(ship.colliders, x, z, r) && !reach.reachable(x, z)) sealed.push([x, z]);
      }
    }
    assert(sealed.length === 0,
      `${id}: every standable spot in it can be walked to${sealed.length
        ? ` — ${sealed.length} sealed, e.g. (${sealed[0][0].toFixed(2)}, ${sealed[0][1].toFixed(2)})` : ''}`);
  }
}

/*
 * THE WALK IS CLAMPED TO THE SAME BOX THIS FILE FLOOD-FILLS.
 *
 * `stage.js` once clamped the ship walk to a hand-written box ending at
 * z -8.5, written before the hull was lengthened aft to -11.0 for the furnace
 * room. Every check above passed and the player hit an invisible wall half a
 * metre inside the furnace doorway. So every ship `setMode` must pass
 * `SHIP_BOUNDS` itself, never a literal.
 */
{
  const { readFileSync } = await import('node:fs');
  const src = readFileSync(new URL('../src/three/stage.js', import.meta.url), 'utf8');
  const calls = [...src.matchAll(/setMode\(\s*"ship"\s*,\s*[^,]+,\s*([^,]+),/g)];
  assert(calls.length > 0, 'stage.js puts the walk into ship mode somewhere');
  assert(calls.every(m => m[1].trim() === 'SHIP_BOUNDS'),
    `every ship setMode in stage.js clamps the walk to SHIP_BOUNDS (${calls.map(m => m[1].trim()).join(', ')})`);
}

/*
 * THE NAV BAR TELEPORTS, SO WHERE IT LANDS YOU IS A COLLIDER QUESTION.
 *
 * `CameraRig.moveTo` sets the camera position outright — pressing INVENTORY
 * puts the player in the cargo hold with no walk in between — and the walk
 * takes over from wherever it was left. So every anchor has to be deck a body
 * fits on, and reachable deck at that: a standable pocket sealed behind the
 * furniture is a room with the player locked in it. Four of the seven anchors
 * were inside a collider when this check was written, and the cargo one sat in
 * a 0.25 m pinch between two of them, where the push-out fights itself and the
 * player cannot move at all.
 *
 * The anchors are derived from `SHIP_GRAPH` now, and the nodes are measured
 * above — but a derivation is only as good as what it derives from, and this is
 * the thing the player actually gets teleported to, so it is measured itself.
 */
const { SHIP_ANCHORS } = await import('../src/three/camera-rig.js');
const { isFree } = await import('./lib/reach.mjs');
for (const [id, a] of Object.entries(SHIP_ANCHORS)) {
  const x = a.pos.x, z = a.pos.z;
  const clear = isFree(ship.colliders, x, z, 0.25);
  const boxes = ship.colliders
    .filter(b => x + 0.25 > b.minX && x - 0.25 < b.maxX && z + 0.25 > b.minZ && z - 0.25 < b.maxZ)
    .map(b => `[x ${b.minX}..${b.maxX}, z ${b.minZ}..${b.maxZ}]`);
  assert(clear && reach.reachable(x, z),
    `nav anchor "${id}" at (${x}, ${z}) is deck the player can stand on and walk off${
      clear ? (reach.reachable(x, z) ? '' : ` — ${reach.explain(x, z)}`) : ` — inside ${boxes.join(' and ')}`}`);
}

let splineBad = [];
for (const [aKey, aNode] of Object.entries(nodes)) {
  for (const bKey of aNode.adjacent) {
    const wp = aNode.walkPath[bKey] || [];
    wp.forEach((pt, i) => {
      if (!reach.reachable(pt[0], pt[2])) {
        splineBad.push(`${aKey}->${bKey}[${i}] (${pt[0]}, ${pt[2]}): ${reach.explain(pt[0], pt[2])}`);
      }
    });
  }
}
if (splineBad.length) splineBad.forEach(m => console.error(`       ${m}`));
assert(splineBad.length === 0, `every walkPath point stands on walkable deck (a spline through a bulkhead is a camera through a bulkhead)`);

let hatchBad = [];
for (const [aKey, aNode] of Object.entries(nodes)) {
  for (const bKey of aNode.adjacent) {
    const h = aNode.hatchPos[bKey];
    if (h && !reach.reachable(h[0], h[2])) {
      hatchBad.push(`${aKey}->${bKey} (${h[0]}, ${h[2]}): ${reach.explain(h[0], h[2])}`);
    }
  }
}
if (hatchBad.length) hatchBad.forEach(m => console.error(`       ${m}`));
assert(hatchBad.length === 0, `every hatch marker stands on walkable deck`);

/*
 * The club board sightline. `buildDoorways` used to search for somewhere to
 * put a frame that was not between the bridge standing position and the board;
 * the frames are architecture now, so the guarantee is made here instead — and
 * made against the built colliders rather than against the placer's intent.
 */
const sight = ship.assertClearSightline(BRIDGE_STAND, CLUB_BOARD_POS);
assert(sight.clear,
  `nothing stands between the bridge standing position and the club board${sight.clear ? '' : ` (blocked at ${sight.at?.join(', ')})`}`);

/*
 * EVERY COMPARTMENT IS LIT BY WHAT IS IN IT.
 *
 * The light pool no longer carries a table of its own: the rooms declare the
 * fixtures they built. So a room whose builder forgot is a dark room, and
 * nothing else would notice until somebody walked into it.
 */
for (const [id, r] of Object.entries(ROOMS)) {
  const lit = ship.lightSources.filter(l =>
    l.pos.x >= r.minX && l.pos.x <= r.maxX && l.pos.z >= r.minZ && l.pos.z <= r.maxZ);
  assert(lit.length > 0, `${id}: declares at least one light (${lit.length})`);
}

/* ============================================================ DOORWAYS */

/*
 * A DOOR THAT OPENS IS A HOLE WHEN IT HAS. Each portal used to be extruded
 * from a shape whose "hole" ran down past the frame's own bottom edge, which
 * the triangulator does not read as a hole: every doorway was a solid plate,
 * the leaves slid open unseen behind it, and the player walked through what
 * looked like a shut door. So a line is drawn through every doorway at knee,
 * chest and head height: with the leaves parted it must meet NOTHING aboard,
 * and with them shut it must stop on a leaf.
 */
console.log('\nDoorways — open is a hole, shut is a door\n');
{
  const root = ship.group.parent || ship.group;
  const through = (d, y) => {
    const t = d.doorway.through;
    const o = new THREE.Vector3(d.pos[0] - t[0] * 0.6, y, d.pos[1] - t[1] * 0.6);
    const rc = new THREE.Raycaster(o, new THREE.Vector3(t[0], 0, t[1]).normalize(), 0, 1.2);
    return rc.intersectObject(root, true).filter(h => h.object.isMesh && h.object.visible);
  };
  const leafSet = new Set();
  for (const d of ship.doors) for (const l of d.leaves) l.carrier.traverse(o => leafSet.add(o));
  const settle = () => { for (let i = 0; i < 40; i++) ship.update(0.05, i * 0.05, null); root.updateMatrixWorld(true); };
  for (const d of ship.doors) { d.held = true; d.isOpen = true; }
  settle();
  for (const d of ship.doors) {
    const hits = [0.6, 1.2, 1.8].flatMap(y => through(d, y));
    assert(hits.length === 0, `${d.id}: open, the doorway is clear`);
  }
  for (const d of ship.doors) { d.held = false; d.isOpen = false; }
  settle();
  for (const d of ship.doors) {
    const hits = through(d, 1.2);
    assert(hits.length > 0 && leafSet.has(hits[0].object), `${d.id}: shut, the first thing in the doorway is a leaf`);
  }
  for (const d of ship.doors) d.held = null;
  settle();
}

/* ================================================= HOLO PROJECTIONS */

console.log('\nHolographic Projection Controls Invariant Check\n');

assert(typeof ship.openClubHolo === 'function', 'ShipInterior has openClubHolo');
assert(typeof ship.closeClubHolo === 'function', 'ShipInterior has closeClubHolo');
assert(typeof ship.toggleClubHolo === 'function', 'ShipInterior has toggleClubHolo');
assert(typeof ship.isClubHoloVisible === 'function', 'ShipInterior has isClubHoloVisible');

assert(typeof ship.openStarmapHolo === 'function', 'ShipInterior has openStarmapHolo');
assert(typeof ship.closeStarmapHolo === 'function', 'ShipInterior has closeStarmapHolo');
assert(typeof ship.toggleStarmapHolo === 'function', 'ShipInterior has toggleStarmapHolo');
assert(typeof ship.isStarmapHoloVisible === 'function', 'ShipInterior has isStarmapHoloVisible');

ship.openClubHolo();
assert(ship.isClubHoloVisible() === true, 'openClubHolo sets visible to true');
ship.closeClubHolo();
assert(ship.isClubHoloVisible() === false, 'closeClubHolo sets visible to false');
ship.toggleClubHolo();
assert(ship.isClubHoloVisible() === true, 'toggleClubHolo re-opens closed club hologram');
ship.toggleClubHolo();
assert(ship.isClubHoloVisible() === false, 'toggleClubHolo closes open club hologram');

ship.openStarmapHolo();
assert(ship.isStarmapHoloVisible() === true, 'openStarmapHolo sets visible to true');
ship.closeStarmapHolo();
assert(ship.isStarmapHoloVisible() === false, 'closeStarmapHolo sets visible to false');
ship.toggleStarmapHolo();
assert(ship.isStarmapHoloVisible() === true, 'toggleStarmapHolo re-opens closed starmap hologram');
ship.toggleStarmapHolo();
assert(ship.isStarmapHoloVisible() === false, 'toggleStarmapHolo closes open starmap hologram');

/* ============================================================== GEOMETRY */

console.log('\nPhysical occupancy — nothing shares space with anything else\n');

{
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const worldModule = await import('../src/three/world.js');

  const label = owner => owner.name || `${owner.type}#${owner.id}`;

  /** Build one place and assert nothing in it is drawn through anything else. */
  const measure = async (name, build) => {
    let root = null;
    try {
      root = build(THREE);
    } catch (err) {
      assert(false, `${name}: builds without throwing (${err.message})`);
      console.error(err.stack.split('\n').slice(0, 6).join('\n'));
      return;
    }

    let meshes = 0;
    root.traverse(o => { if (o.isMesh) meshes++; });
    assert(meshes > 100, `${name}: builds — ${meshes} meshes`);

    const hits = findOverlaps(root, { tolerance: 0.06, label });
    const pairs = new Map();
    for (const h of hits) {
      const key = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
    }
    if (pairs.size) {
      for (const [key, h] of pairs) {
        console.error(`       ${h.depth.toFixed(2)}m  ${key}  at ${h.at.join(', ')}`);
      }
    }
    assert(pairs.size === 0,
      `${name}: every pair of separate objects is disjoint`);
  };

  // The ship built above, not a second one: the object under test is the one
  // every other assertion in this file has already been made about.
  await measure('the Avalon', () => ship.group);

  await measure('Erebus', () => new worldModule.WorldScene(null).scene);

  /*
   * Erebus is walked, not just looked at: the rocks, the arch, the bones and
   * the derelict all carry colliders, and a landmark dropped in the wrong
   * place would wall a pylon off from the player. Flood-fill the walk from
   * the spawn against the real colliders (with the player's own radius) and
   * require every pylon's approach mark, and the lander's, to be reached.
   */
  console.log('\nErebus — every pylon can be walked to\n');
  const erebus = new worldModule.WorldScene(null);
  const B = 85, STEP = 0.5, R = 0.25;
  const N = Math.round((2 * B) / STEP) + 1;
  const idx = (x, z) => Math.round((z + B) / STEP) * N + Math.round((x + B) / STEP);
  const blocked = (x, z) => erebus.colliders.some(c => c.radius !== undefined
    ? Math.hypot(x - c.x, z - c.z) < c.radius + R
    : x > c.minX - R && x < c.maxX + R && z > c.minZ - R && z < c.maxZ + R);
  const seen = new Uint8Array(N * N);
  const spawn = erebus.data.spawn.pos;
  const queue = [[spawn[0], spawn[2]]];
  assert(!blocked(spawn[0], spawn[2]), 'Erebus: the spawn stands on open ground');
  seen[idx(spawn[0], spawn[2])] = 1;
  while (queue.length) {
    const [x, z] = queue.pop();
    for (const [dx, dz] of [[STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const nx = x + dx, nz = z + dz;
      if (Math.abs(nx) > B || Math.abs(nz) > B) continue;
      const k = idx(nx, nz);
      if (seen[k] || blocked(nx, nz)) continue;
      seen[k] = 1;
      queue.push([nx, nz]);
    }
  }
  const reached = (x, z) => {
    // The nearest grid cell to a mark, or any of its neighbours, flooded.
    for (const [dx, dz] of [[0, 0], [STEP, 0], [-STEP, 0], [0, STEP], [0, -STEP]]) {
      const gx = Math.round((x + dx) / STEP) * STEP, gz = Math.round((z + dz) / STEP) * STEP;
      if (seen[idx(gx, gz)]) return true;
    }
    return false;
  };
  const cut = erebus.data.sites.filter(s => !reached(s.approachPos[0], s.approachPos[2]));
  assert(cut.length === 0, `Erebus: all ${erebus.data.sites.length} pylon approach marks are reachable from the spawn`
    + (cut.length ? ` — cut off: ${cut.map(s => s.id).join(', ')}` : ''));
  let open = 0;
  for (let i = 0; i < seen.length; i++) open += seen[i];
  assert(open * STEP * STEP > 0.8 * (2 * B) * (2 * B) * 0.7,
    `Erebus: the walk is open country (${Math.round(open * STEP * STEP)} m² reachable)`);
}

if (failed) {
  console.error('\nSHIP GRAPH VERIFY FAILED');
  process.exit(1);
} else {
  console.log('\nSHIP GRAPH OK');
  process.exit(0);
}
