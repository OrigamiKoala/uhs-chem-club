#!/usr/bin/env node
/**
 * verify:lodestone — Lodestone (unit12, the transition metals): the canyon world built in Node and measured: declarations, landmark footprints,
 * host extents, overlap of bodies, buried bodies, lamps only lit, the canyon walls closed, and a walk from the spawn to every bench and the Coil.
 * The planners are checked in `verify:learn` (`tools/lib/lodestone/`).
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
const { HOST_PLAN, LANE, CANYON } = await import('../src/three/lodestone/host-plan.js');
const { LodestoneWorld } = await import('../src/three/lodestone.js');
const { findOverlaps } = await import('./lib/overlap.mjs');
const { BOSS_ARENA_SPOTS } = await import('../src/learn/engine/boss-arena.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const worldData = JSON.parse(readFileSync(join(root, 'src/three/world-data/lodestone.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => (cond ? ok(okMsg) : fail(failMsg || okMsg));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/* ------------------------------------------------------------ 2. declarations */
console.log(`Lodestone — ${worldData.name}\n`);

const rectOf = (site, [x0, x1, z0, z1]) => {
  const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
  const c = Math.cos(a), sn = Math.sin(a);
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => [
    site.pos[0] + lx * c + lz * sn,
    site.pos[2] - lx * sn + lz * c,
  ]);
  return {
    minX: Math.min(...pts.map(p => p[0])),
    maxX: Math.max(...pts.map(p => p[0])),
    minZ: Math.min(...pts.map(p => p[1])),
    maxZ: Math.max(...pts.map(p => p[1])),
  };
};
const rd = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));

{
  const L = worldData.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) {
      const need = (L[i].radius || 1) + (L[j].radius || 1);
      const d = dist(L[i].pos, L[j].pos);
      if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}]`);
    }
  }
  check(clashes.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark overlaps:\n  ${clashes.join('\n  ')}`);
}

{
  const clashes = [];
  for (const s of worldData.sites) {
    const plan = HOST_PLAN[s.id];
    if (!plan || plan.structure !== s.structure || plan.questId !== s.questId) {
      clashes.push(`${s.id}: mismatch with HOST_PLAN`);
      continue;
    }
    // A site is marked built by the generator exactly when its quest module exists (re-run the generator after building a bench).
    if (Boolean(s.built) !== existsSync(join(root, 'src/learn/quests/unit12', `${s.questId}.js`))) {
      clashes.push(`${s.id}: built is ${s.built} but the quest module ${s.questId}.js ${s.built ? 'is missing' : 'exists'} (re-run tools/gen-lodestone-layout.mjs)`);
    }
    const hostRect = rectOf(s, plan.extent);
    const laneRect = rectOf(s, [-LANE.hw, LANE.hw, LANE.from, LANE.to]);
    for (const lm of worldData.landmarks) {
      if (lm.asset === 'lamp-post') continue;
      const r = lm.radius || 1;
      if (rd(lm.pos[0], lm.pos[2], hostRect) < r) clashes.push(`${s.id} host overlaps ${lm.asset}`);
      if (rd(lm.pos[0], lm.pos[2], laneRect) < r) clashes.push(`${s.id} lane overlaps ${lm.asset}`);
    }
  }
  check(clashes.length === 0, 'all 6 sites match HOST_PLAN, say truly whether their bench is built, and clear landmarks', clashes.join('; '));
}

{
  const spot = BOSS_ARENA_SPOTS['boss-coil'];
  check(
    !spot || (spot.worldId === 'unit12' && dist(spot.bossPos, worldData.arena.boss) < 0.01),
    spot ? 'boss-coil arena spot matches lodestone.json' : 'boss-coil has no arena spot yet (the boss is not built)',
    'boss-coil arena spot mismatch'
  );
  const p = worldData.plaza;
  const inPlaza = worldData.landmarks.filter(
    lm => lm.pos[0] >= p.minX && lm.pos[0] <= p.maxX && lm.pos[2] >= p.minZ && lm.pos[2] <= p.maxZ
  );
  check(inPlaza.length === 0, 'boss plaza is clear of landmarks', `plaza has ${inPlaza.length} landmarks`);
}

/* ------------------------------------------------------------ 3. built world */
console.log('\nLodestone built world (Node)\n');
{
  const origBake = LodestoneWorld.prototype.bakeStatics;
  LodestoneWorld.prototype.bakeStatics = function () {};
  let w;
  try {
    w = new LodestoneWorld(null);
  } finally {
    LodestoneWorld.prototype.bakeStatics = origBake;
  }
  w.scene.updateMatrixWorld(true);
  let meshes = 0;
  w.scene.traverse(o => { if (o.isMesh) meshes++; });
  check(meshes > 200, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built`);
  const built = new Set(w.landmarkNodes.map(n => n.lm.asset));
  const declared = new Set(worldData.landmarks.map(l => l.asset));
  check([...declared].every(a => built.has(a)), `every declared landmark kind is built (${[...declared].join(', ')})`, `declared but not built: ${[...declared].filter(a => !built.has(a)).join(', ')}`);
  w.terrainMesh.geometry.computeBoundingBox();
  const tb = w.terrainMesh.geometry.boundingBox;
  check(Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z) > 800, 'the ground runs to the horizon on every side', 'the ground ends short of the horizon');
  const wallTop = w.getTerrainHeight(CANYON.wallX + 16, 20);
  check(wallTop > 20, `the canyon walls stand ${wallTop.toFixed(0)} m over the floor`, 'the canyon walls are low');
  {
    const ring = w.wallColliders || [];
    check(ring.length > 300, `the wall feet are a chain of ${ring.length} colliders`, 'the canyon walls are open to walk up');
  }
  {
    const hits = findOverlaps(w.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
    const pairs = new Map();
    for (const h of hits) {
      const k = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(k) || pairs.get(k).depth < h.depth) pairs.set(k, h);
    }
    check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
      `bodies occupy the same space:\n${[...pairs.entries()].slice(0, 12).map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);
  }
  {
    const buried = [];
    const EXEMPT = new Set(['ground', 'ambient']);
    const tagOf = o => { for (let n = o; n; n = n.parent) if (n.userData?.phys) return n.userData.phys; return null; };
    const ownerName = o => { let n = o; while (n.parent && n.parent !== w.scene) n = n.parent; return n.name || n.type; };
    w.scene.traverse(o => {
      if (!o.isMesh || EXEMPT.has(tagOf(o))) return;
      if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
      const box = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
      if (box.isEmpty()) return;
      const c = box.getCenter(new THREE.Vector3());
      const ground = w.getTerrainHeight(c.x, c.z);
      if (box.max.y < ground - 0.3 && buried.length < 10) buried.push(`${ownerName(o)} at (${c.x.toFixed(1)}, ${c.z.toFixed(1)}) tops out at ${box.max.y.toFixed(2)} under ground ${ground.toFixed(2)}`);
    });
    check(buried.length === 0, 'no body is buried under the ground it stands on', `buried:\n         ${buried.join('\n         ')}`);
  }
  {
    let threw = null;
    try { for (let f = 0; f < 3; f++) w.update(1 / 60, new THREE.Vector3(0, 1.7, 80)); } catch (err) { threw = err; }
    check(!threw, 'a frame updates with the eye handed in', `update threw: ${threw?.message}`);
  }

  let totalPointLights = 0;
  w.scene.traverse(o => {
    if (o.isPointLight || o.isSpotLight) totalPointLights++;
  });
  check(totalPointLights <= 3, 'only pooled lamps are lit (<= 3 PointLights)', `${totalPointLights} lights`);

  let hostErrors = 0;
  for (const s of worldData.sites) {
    const anchor = w.benchAnchor(s.questId);
    if (!anchor) { hostErrors++; console.log(`  FAIL missing benchAnchor for ${s.questId}`); continue; }
    w.setBenchDeployed(s.questId, true);
    w.setBenchDeployed(s.questId, false);
    w.setSiteComplete(s.questId, true);
    w.setSiteComplete(s.questId, false);

    // Check host group bounds inside HOST_PLAN extent
    const plan = HOST_PLAN[s.id];
    const marker = w.siteMarkers.get(s.questId);
    if (marker?.group) {
      const box = new THREE.Box3().setFromObject(marker.group);
      // Transform world box corners into host-local frame
      const inv = new THREE.Matrix4().copy(marker.group.matrixWorld).invert();
      const corners = [
        [box.min.x, box.min.y, box.min.z], [box.max.x, box.min.y, box.min.z],
        [box.min.x, box.min.y, box.max.z], [box.max.x, box.min.y, box.max.z],
        [box.min.x, box.max.y, box.min.z], [box.max.x, box.max.y, box.min.z],
        [box.min.x, box.max.y, box.max.z], [box.max.x, box.max.y, box.max.z],
      ].map(([x, y, z]) => new THREE.Vector3(x, y, z).applyMatrix4(inv));
      const lx0 = Math.min(...corners.map(c => c.x)), lx1 = Math.max(...corners.map(c => c.x));
      const lz0 = Math.min(...corners.map(c => c.z)), lz1 = Math.max(...corners.map(c => c.z));
      const [ex0, ex1, ez0, ez1] = plan.extent;
      if (lx0 < ex0 - 0.15 || lx1 > ex1 + 0.15 || lz0 < ez0 - 0.15 || lz1 > ez1 + 0.15) {
        hostErrors++;
        console.log(`  FAIL ${s.id} exceeds extent [${lx0.toFixed(2)},${lx1.toFixed(2)},${lz0.toFixed(2)},${lz1.toFixed(2)}] vs [${ex0},${ex1},${ez0},${ez1}]`);
      }
    }
  }
  check(hostErrors === 0, 'all 6 hosts have anchors, toggle cleanly, and stay inside extent');

  // Flood-fill walkability on 1 m grid from spawn
  const blocked = (x, z) => {
    for (const c of w.colliders) {
      if (c.radius !== undefined) {
        if (Math.hypot(x - c.x, z - c.z) < c.radius + 0.45) return true;
      } else if (x > c.minX - 0.45 && x < c.maxX + 0.45 && z > c.minZ - 0.45 && z < c.maxZ + 0.45) {
        return true;
      }
    }
    return false;
  };
  const key = (ix, iz) => `${ix},${iz}`;
  const sx = Math.round(worldData.spawn[0]), sz = Math.round(worldData.spawn[2]);
  const seen = new Set([key(sx, sz)]);
  const q = [[sx, sz]];
  while (q.length) {
    const [cx, cz] = q.shift();
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = cx + dx, nz = cz + dz;
      if (nx < -60 || nx > 60 || nz < -90 || nz > 110) continue;
      const k = key(nx, nz);
      if (seen.has(k) || blocked(nx, nz)) continue;
      seen.add(k);
      q.push([nx, nz]);
    }
  }
  const targets = [
    ['landing pad', Math.round(worldData.pad.pos[0]), Math.round(worldData.pad.pos[2])],
    ['boss arena', Math.round(worldData.arena.player[0]), Math.round(worldData.arena.player[2])],
    ...worldData.sites.map(s => [s.id, Math.round(s.approachPos[0]), Math.round(s.approachPos[2])]),
  ];
  const missed = targets.filter(([, tx, tz]) => !seen.has(key(tx, tz))).map(([label]) => label);
  check(missed.length === 0, 'walkable from spawn to pad, boss arena, and all 6 bench approaches', `unreachable: ${missed.join(', ')}`);

  w.dispose();
}

console.log(failures === 0 ? '\nALL LODESTONE CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
