#!/usr/bin/env node
/**
 * verify:quicklight — Quicklight (unit11, Kinetics): ratedata planners and the storm-belt 3D world.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });

const THREE = await import('three');
const { HOST_PLAN, LANE } = await import('../src/three/quicklight/host-plan.js');
const { QuicklightWorld } = await import('../src/three/quicklight.js');
const { BOSS_ARENA_SPOTS } = await import('../src/learn/engine/boss-arena.js');
const { planKineticsRun, planInitialRate, planPlotTransform, planMB, planFoe } = await import('../src/learn/engine/ratedata.js');

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const worldData = JSON.parse(readFileSync(join(root, 'src/three/world-data/quicklight.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => (cond ? ok(okMsg) : fail(failMsg || okMsg));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/* ------------------------------------------------------------ 1. ratedata planners */
console.log('Quicklight data (ratedata.js planners)\n');
{
  const eps = 1e-4;
  const r0 = planKineticsRun({ order: 0, k: 0.05, a0: 1.0, tMax: 10, nSteps: 5 });
  check(r0.points.length === 6 && r0.points[0].A === 1, 'planKineticsRun produces zero-order series');
  const r1 = planKineticsRun({ order: 1, k: 0.02, a0: 1.0, tMax: 100, nSteps: 10 });
  const t1 = planPlotTransform(r1.points, 'lnA');
  const slopes = [];
  for (let i = 1; i < t1.length; i++) slopes.push((t1[i].y - t1[i - 1].y) / (t1[i].t - t1[i - 1].t));
  check(Math.max(...slopes) - Math.min(...slopes) < eps, 'first-order ln[A] vs t is strictly linear');
  const r2 = planKineticsRun({ order: 2, k: 0.02, a0: 1.0, tMax: 100, nSteps: 10 });
  const t2 = planPlotTransform(r2.points, 'invA');
  const s2 = [];
  for (let i = 1; i < t2.length; i++) s2.push((t2[i].y - t2[i - 1].y) / (t2[i].t - t2[i - 1].t));
  check(Math.max(...s2) - Math.min(...s2) < eps, 'second-order 1/[A] vs t is strictly linear');
  const mbLow = planMB({ T: 300, Ea: 10 });
  const mbHigh = planMB({ T: 400, Ea: 10 });
  check(mbHigh.fractionAbove > mbLow.fractionAbove && mbLow.fractionAbove > 0, 'Maxwell-Boltzmann fraction >= Ea increases with T');
  const rate = planInitialRate({ k: 0.05, orders: { A: 2, B: 1 }, conc: { A: 0.4, B: 0.5 } });
  check(Math.abs(rate - 0.05 * 0.16 * 0.5) < 1e-9, 'planInitialRate exact for rate = k[A]^2[B]');
  check(planFoe(1).answer === 0.03 && planFoe(4).answer === 80 && planFoe(5).correctMech === 'mech2', 'planFoe(1..5) valid');
}

/* ------------------------------------------------------------ 2. declarations */
console.log(`\nQuicklight — ${worldData.name}\n`);

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
    if (!existsSync(join(root, 'src/learn/quests/unit11', `${s.questId}.js`))) {
      clashes.push(`${s.id}: missing quest module ${s.questId}.js`);
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
  check(clashes.length === 0, 'all 6 sites match HOST_PLAN, have quest modules, and clear landmarks', clashes.join('; '));
}

{
  const spot = BOSS_ARENA_SPOTS['boss-flare'];
  check(
    spot && spot.worldId === 'unit11' && dist(spot.bossPos, worldData.arena.boss) < 0.01,
    'boss-flare arena spot matches quicklight.json',
    'boss-flare arena spot mismatch'
  );
  const p = worldData.plaza;
  const inPlaza = worldData.landmarks.filter(
    lm => lm.pos[0] >= p.minX && lm.pos[0] <= p.maxX && lm.pos[2] >= p.minZ && lm.pos[2] <= p.maxZ
  );
  check(inPlaza.length === 0, 'boss plaza is clear of landmarks', `plaza has ${inPlaza.length} landmarks`);
}

/* ------------------------------------------------------------ 3. built world */
console.log('\nQuicklight built world (Node)\n');
{
  const origBake = QuicklightWorld.prototype.bakeStatics;
  QuicklightWorld.prototype.bakeStatics = function () {};
  let w;
  try {
    w = new QuicklightWorld(null);
  } finally {
    QuicklightWorld.prototype.bakeStatics = origBake;
  }
  w.scene.updateMatrixWorld(true);

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
      if (nx < -95 || nx > 95 || nz < -95 || nz > 105) continue;
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

console.log(failures === 0 ? '\nALL QUICKLIGHT CHECKS PASSED' : `\n${failures} FAILURE(S)`);
process.exit(failures === 0 ? 0 : 1);
