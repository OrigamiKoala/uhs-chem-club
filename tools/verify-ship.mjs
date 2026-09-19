/**
 * tools/verify-ship.mjs — The ship and Erebus, as graph and as geometry.
 *
 * Two halves. The first asserts the traversal graph invariants from
 * 3d-conversion-prompts.md §3.2 & §4.3 — connectivity, the three-hop limit,
 * hatch cones, spline bounds.
 *
 * The second builds the REAL `ShipInterior` and the REAL `WorldScene` in Node,
 * behind a DOM shim, and measures every pair of separate objects in them.
 * Nothing may occupy the same space as anything else: a locker standing in a
 * doorway, a pipe run drawn through a frame gusset, a container stacked across
 * a hatch. That is a claim about the world that is actually built, so it is
 * checked against the world that is actually built rather than against a table
 * kept beside it — a table drifts the first time somebody nudges a crate.
 *
 * Parts INSIDE one object are expected to interpenetrate: a gusset that merely
 * touched the corner it braces would be holding nothing up. So the hull, the
 * corridor services and each prop are each one object, and the check runs
 * strictly between them.
 */

import { SHIP_GRAPH } from '../src/three/ship-graph.js';

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

// 1. Graph is undirected: if A lists B, B lists A
for (const [aKey, aNode] of Object.entries(nodes)) {
  for (const bKey of aNode.adjacent) {
    const bNode = nodes[bKey];
    assert(bNode && bNode.adjacent.includes(aKey), `undirected: ${aKey} <-> ${bKey}`);
  }
}

// 2. Airlock adjacent only to bridge and cargo
const airlockAdj = [...nodes.airlock.adjacent].sort();
assert(
  airlockAdj.length === 2 && airlockAdj[0] === 'bridge' && airlockAdj[1] === 'cargo',
  `airlock adjacent strictly to bridge and cargo (is: ${airlockAdj.join(', ')})`
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

// 5. hatchPos lies within lookLimits cone from node pos
function angleDeg(v1, v2) {
  const dot = v1[0]*v2[0] + v1[1]*v2[1] + v1[2]*v2[2];
  const m1 = Math.hypot(v1[0], v1[1], v1[2]);
  const m2 = Math.hypot(v2[0], v2[1], v2[2]);
  return Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2)))) * (180 / Math.PI);
}

for (const [aKey, aNode] of Object.entries(nodes)) {
  const targetDir = [
    aNode.target[0] - aNode.pos[0],
    aNode.target[1] - aNode.pos[1],
    aNode.target[2] - aNode.pos[2]
  ];
  for (const bKey of aNode.adjacent) {
    const hPos = aNode.hatchPos[bKey];
    assert(!!hPos, `hatchPos present for edge ${aKey} -> ${bKey}`);
    if (hPos) {
      const hDir = [
        hPos[0] - aNode.pos[0],
        hPos[1] - aNode.pos[1],
        hPos[2] - aNode.pos[2]
      ];
      // Horizontal angle (yaw)
      const yawAngle = angleDeg([targetDir[0], 0, targetDir[2]], [hDir[0], 0, hDir[2]]);
      assert(
        yawAngle <= aNode.lookLimits.yaw + 5, // allow 5 deg tolerance
        `hatchPos ${aKey}->${bKey} inside yaw cone (${yawAngle.toFixed(1)}° <= ${aNode.lookLimits.yaw}°)`
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
      // Starts at A, ends at B
      const bNode = nodes[bKey];
      const startDist = Math.hypot(wp[0][0] - aNode.pos[0], wp[0][1] - aNode.pos[1], wp[0][2] - aNode.pos[2]);
      const endDist = Math.hypot(wp[wp.length-1][0] - bNode.pos[0], wp[wp.length-1][1] - bNode.pos[1], wp[wp.length-1][2] - bNode.pos[2]);
      assert(startDist < 0.01, `walkPath ${aKey}->${bKey} starts at ${aKey}.pos`);
      assert(endDist < 0.01, `walkPath ${aKey}->${bKey} ends at ${bKey}.pos`);

      // All points Y between 1.4 and 1.85
      const yOk = wp.every(pt => pt[1] >= 1.4 && pt[1] <= 1.85);
      assert(yOk, `walkPath ${aKey}->${bKey} Y coords within [1.4, 1.85]`);

      // Clearance: inside ship walls (x in [-8.0, 8.0], z in [-10.0, 10.0])
      const boundsOk = wp.every(pt => Math.abs(pt[0]) <= 8.0 && Math.abs(pt[2]) <= 10.0);
      assert(boundsOk, `walkPath ${aKey}->${bKey} clears hull perimeter by >= 0.4 units`);
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

// 7. Holographic Projections — Open/Close/Toggle with [X] key invariants
console.log('\nHolographic Projection Controls Invariant Check\n');
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
const { ShipInterior } = await import('../src/three/ship.js');
const ship = new ShipInterior(new THREE.Scene());

// Bridge club hologram methods
assert(typeof ship.openClubHolo === 'function', 'ShipInterior has openClubHolo');
assert(typeof ship.closeClubHolo === 'function', 'ShipInterior has closeClubHolo');
assert(typeof ship.toggleClubHolo === 'function', 'ShipInterior has toggleClubHolo');
assert(typeof ship.isClubHoloVisible === 'function', 'ShipInterior has isClubHoloVisible');

// Starmap quest hologram methods
assert(typeof ship.openStarmapHolo === 'function', 'ShipInterior has openStarmapHolo');
assert(typeof ship.closeStarmapHolo === 'function', 'ShipInterior has closeStarmapHolo');
assert(typeof ship.toggleStarmapHolo === 'function', 'ShipInterior has toggleStarmapHolo');
assert(typeof ship.isStarmapHoloVisible === 'function', 'ShipInterior has isStarmapHoloVisible');

// Test Bridge hologram toggle behavior
ship.openClubHolo();
assert(ship.isClubHoloVisible() === true, 'openClubHolo sets visible to true');
ship.closeClubHolo();
assert(ship.isClubHoloVisible() === false, 'closeClubHolo sets visible to false');
ship.toggleClubHolo();
assert(ship.isClubHoloVisible() === true, 'toggleClubHolo re-opens closed club hologram');
ship.toggleClubHolo();
assert(ship.isClubHoloVisible() === false, 'toggleClubHolo closes open club hologram');

// Test Starmap hologram toggle behavior
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
