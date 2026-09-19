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
  HULL, SHIP_BOUNDS, SHIP_SPAWN, ROOMS, WALLS, DOOR_CLEAR,
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
}

if (failed) {
  console.error('\nSHIP GRAPH VERIFY FAILED');
  process.exit(1);
} else {
  console.log('\nSHIP GRAPH OK');
  process.exit(0);
}
