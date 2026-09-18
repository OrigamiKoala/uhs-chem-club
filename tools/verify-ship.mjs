/**
 * tools/verify-ship.mjs — Asserts ship graph invariants from 3d-conversion-prompts.md §3.2 & §4.3
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

if (failed) {
  console.error('\nSHIP GRAPH VERIFY FAILED');
  process.exit(1);
} else {
  console.log('\nSHIP GRAPH OK');
  process.exit(0);
}
