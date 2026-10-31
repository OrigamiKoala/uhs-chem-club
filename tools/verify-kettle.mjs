#!/usr/bin/env node
/**
 * verify-kettle.mjs — Integrity check of Kettle, Learn world 07's ground: the foundry works on the soda flat.
 *
 * Every rule `verify:ember` and the other worlds' checks hold their worlds to, held to this one:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (every footprint disjoint, every host's extent and
 *    lane clear of every free prop) AND from the world as built: the real `KettleWorld` is constructed in Node and
 *    every pair of bodies measured; nothing is buried under the ground it stands on.
 *  - All eight benches have a host, every site names a quest the chart declares, and every LIVE quest has a site and
 *    a bench anchor (a quest that is not live yet already has its host, so the bench lands in it the day it goes live).
 *  - A SITE LABEL IS A SIGNPOST: `Bench N - <what it teaches>`, six words at most, sharing a word with its quest.
 *  - Every site FACES ITS APPROACH, stands on level ground, and its bench deploys onto a real plate under a work lamp.
 *  - THE PLAYER CAN WALK TO EVERY BENCH, to the pad and to the Golem's ground. The ground is flood-filled from the
 *    spawn against the real colliders, with no ledge anywhere.
 *  - A LANE OF LAMPS runs from the spawn to every approach: no stretch of the way is more than 12 m from a lamp.
 *  - ONLY LAMPS ARE LIT: every emissive material is a work lamp; the lamps share a fixed handful of real lights.
 *  - A HOST STANDS INSIDE THE EXTENT `host-plan.js` declares, and the declaration is tight.
 *  - THE GOLEM'S GROUND IS THE ONE `boss-arena.js` NAMES, and it is open (the corridor from the table to the boss too).
 *  - T4-only landmarks are decoration: removing them strands nothing. No player-facing string carries emoji.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/kettle/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/kettle.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Kettle — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

const rectOf = (site, [x0, x1, z0, z1]) => {
  const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
  const c = Math.cos(a), sn = Math.sin(a);
  const pts = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c]);
  return { minX: Math.min(...pts.map(p => p[0])), maxX: Math.max(...pts.map(p => p[0])), minZ: Math.min(...pts.map(p => p[1])), maxZ: Math.max(...pts.map(p => p[1])) };
};
const rd = (x, z, r) => Math.hypot(Math.max(r.minX - x, 0, x - r.maxX), Math.max(r.minZ - z, 0, z - r.maxZ));

{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const need = L[i].radius + L[j].radius, d = dist(L[i].pos, L[j].pos);
    if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}] overlap by ${(need - d).toFixed(2)}u`);
  }
  check(clashes.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);
}

{
  const clashes = [];
  for (const s of world.sites) {
    const plan = HOST_PLAN[s.id];
    if (!plan || plan.structure !== s.structure || plan.questId !== s.questId) { clashes.push(`${s.id}: no host plan, or it names a different structure or quest than the layout`); continue; }
    for (const [name, r] of [['host', rectOf(s, plan.extent)], ['lane', rectOf(s, [-LANE.hw, LANE.hw, LANE.from, LANE.to])]]) {
      for (const l of world.landmarks) if (rd(l.pos[0], l.pos[2], r) < l.radius) clashes.push(`${s.id}'s ${name} is inside ${l.asset}@${l.pos[0]},${l.pos[2]}`);
    }
  }
  check(clashes.length === 0, `${world.sites.length} hosts and their lanes stand clear of every free prop`, `hosts clash with props:\n         ${clashes.join('\n         ')}`);
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 8) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two sites are within 8u of each other', near.join('; '));
  const walkBound = world.landmarks.filter(l => l.asset !== 'chimney' && l.asset !== 'furnace' && l.asset !== 'conveyor' && (Math.abs(l.pos[0]) + l.radius > 100 || Math.abs(l.pos[2]) + l.radius > 100));
  check(walkBound.length === 0, 'every free prop stands inside the walk (100 m) or is the furnace works', `props past the walk: ${walkBound.map(l => l.asset).join(', ')}`);
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit07-stoichiometry.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'((?:q\d+|boss)-[a-z]+)',\s*title:\s*["']([^"']+)["'][\s\S]*?status:\s*'(\w+)'/g)].map(m => ({ id: m[1], title: m[2], status: m[3] }));
{
  const benches = chartQuests.filter(q => !q.id.startsWith('boss'));
  check(benches.length === 8, `unit07 charts ${benches.length} benches`, `the unit07 chart lists ${benches.length} benches, not eight`);
  const siteQuests = world.sites.map(s => s.questId);
  const missing = benches.filter(q => !siteQuests.includes(q.id));
  check(missing.length === 0, 'every charted bench has a host on the ground, live or not', `charted benches with no site: ${missing.map(q => q.id).join(', ')}`);
  const invented = siteQuests.filter(q => !benches.some(b => b.id === q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `sites naming quests that do not exist: ${invented.join(', ')}`);
  check(world.sites.every(s => s.built), 'every host is built (a bench lands in it when its quest goes live)', 'a site is not built');

  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  const off = [];
  for (const s of world.sites) {
    const q = chartQuests.find(x => x.id === s.questId);
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) { off.push(`${s.id} reads "${s.label}", which does not start "${prefix}"`); continue; }
    const words = s.label.slice(prefix.length).split(/\s+/).map(stem).filter(w => w.length >= 3);
    const title = new Set((q?.title || '').split(/\s+/).map(stem));
    if (!words.some(w => title.has(w))) off.push(`${s.id} reads "${s.label}", which shares no word with "${q?.title}"`);
    if (s.label.split(/\s+/).length > 6) off.push(`${s.id}: "${s.label}" is longer than six words`);
  }
  check(off.length === 0, 'every site label names its bench by what it teaches, in six words or fewer', off.join('\n         '));
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique', 'two sites claim the same stage number');
  const badA = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(badA.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${badA.map(s => s.id).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity, words, spawn */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  const t3World = world.landmarks.filter(l => l.minTier !== 'T4');
  check(t4Only.length > 0, `${t4Only.length} landmarks are T4 decoration`, 'no T4 decoration declared');
  const blocked = [];
  for (const s of world.sites) for (const l of t3World) if (dist(s.approachPos, l.pos) < l.radius + 0.5) blocked.push(`${s.id}'s approach is blocked by ${l.asset}`);
  check(blocked.length === 0, 'every site is reachable with all T4 decoration removed', blocked.join('\n         '));
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');

  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  check(!strings.some(s => /\p{Extended_Pictographic}/u.test(s)), 'the world is emoji-free', 'emoji in a player-facing string');

  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(world.spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp, 'the player does not spawn inside anything', `spawn is inside ${inProp?.asset}`);
  const nearest = Math.min(...world.sites.map(s => dist(world.spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the spawn`, `the nearest site is ${nearest.toFixed(0)}u away: too far to find`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark');
  const lamps = world.landmarks.filter(l => l.asset === 'lamp-post').length;
  check(lamps >= 18, `${lamps} work lamps line the road and the spurs`, `only ${lamps} work lamps`);

  // THE LANE OF LAMPS: from the spawn up the road, then out along the spur, no stretch more than 12 m from a lamp.
  const posts = world.landmarks.filter(l => l.asset === 'lamp-post').map(l => l.pos);
  const dark = [];
  for (const s of world.sites) {
    const az = s.approachPos[2], ax = s.approachPos[0];
    const pts = [];
    for (let z = world.spawn.pos[2]; z >= az; z -= 1) pts.push([0, 0, z]);
    for (let x = 0; x <= Math.abs(ax); x += 1) pts.push([Math.sign(ax) * x, 0, az]);
    const gap = pts.find(p => !posts.some(l => dist(p, l) <= 12));
    if (gap) dark.push(`${s.id}: dark at (${gap[0]}, ${gap[2]})`);
  }
  check(dark.length === 0, 'a lane of lamps runs from the spawn to every approach', `unlit stretches:\n         ${dark.join('\n         ')}`);
}

/* ------------------------------------------------ the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-golem':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const worldId = m?.[1].match(/worldId:\s*'(\w+)'/)?.[1];
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && worldId === 'unit07' && same(player, world.arena.player) && same(boss, world.arena.boss),
    `the Recipe Golem is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Golem at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const { KettleWorld } = await import('../src/three/kettle.js');

  let built = null;
  try { built = new KettleWorld(null); } catch (err) { fail(`KettleWorld threw while building: ${err.stack || err.message}`); }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 250, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    check(tb.max.y > 15 && tb.max.y < 80, `the mesas stand ${Math.round(tb.max.y)} m over the flat`, `the horizon is flat or absurd (${tb.max.y.toFixed(1)} m)`);

    {
      const eye = new THREE.Vector3(3, 1.7, 80);
      let threw = null;
      try { for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'a frame updates with the eye handed in as a position, and the sky follows it', `update(delta, cameraPos) failed: ${threw?.message || 'the sky did not follow'}`);
    }

    const hits = findOverlaps(built.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
    const pairs = new Map();
    for (const h of hits) {
      const key = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
    }
    check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
      `bodies occupy the same space:\n${[...pairs.entries()].map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);

    /* NOTHING IS BURIED. */
    {
      const buried = [];
      const EXEMPT = new Set(['ground', 'ambient']);
      const tagOf = o => { for (let n = o; n; n = n.parent) if (n.userData?.phys) return n.userData.phys; return null; };
      const ownerName = o => { let n = o; while (n.parent && n.parent !== built.scene) n = n.parent; return n.name || n.type; };
      const test = (box, o) => {
        if (box.isEmpty() || box.getSize(new THREE.Vector3()).lengthSq() < 1e-8) return;
        const c = box.getCenter(new THREE.Vector3());
        const ground = built.getTerrainHeight(c.x, c.z);
        if (box.max.y < ground - 0.3 && buried.length < 10) buried.push(`${ownerName(o)}: a part at (${c.x.toFixed(1)}, ${c.y.toFixed(1)}, ${c.z.toFixed(1)}) tops out at ${box.max.y.toFixed(2)}u, under ground at ${ground.toFixed(2)}u`);
      };
      built.scene.traverse(o => {
        if (!o.isMesh || EXEMPT.has(tagOf(o))) return;
        if (o.userData.partBoxes?.length) { for (const pb of o.userData.partBoxes) test(pb.clone().applyMatrix4(o.matrixWorld), o); return; }
        if (o.parent?.userData?.partBoxes?.length && o.userData.ownGeometry) { for (const pb of o.parent.userData.partBoxes) test(pb.clone().applyMatrix4(o.parent.matrixWorld), o); return; }
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the ground it stands on', `bodies buried under the ground:\n         ${buried.join('\n         ')}`);
    }

    /* ONLY LAMPS ARE LIT. */
    {
      const lit = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
      });
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material: the work lamps; nothing else in the world is lit`, `${strangers.length} emissive material(s) that are not a work lamp`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30, `${built.lamps.length} lamps share ${realLights} real lights`, `${built.lamps.length} lamps and ${realLights} real lights: the lamp pool is not what keeps the frame cheap`);
    }

    /* EVERY SITE FACES ITS APPROACH, and its bench deploys onto a real plate. */
    for (const site of world.sites) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`, `${site.id} has no bench anchor to deploy onto`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces the ground the player walks in from`, `${site.id}: faces ${anchor.rotationY.toFixed(2)} rad, but its approach is at ${want.toFixed(2)}`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05, `${site.id}: the plate is at ${anchor.topY.toFixed(2)}u, standing on ground at ${ground.toFixed(2)}u`, `${site.id}: bench top at ${anchor.topY.toFixed(2)}, but the ground under it is ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
    }

    /* A TABLE IS WORKED BY ITS LAMP: a work lamp over every plate, a `lampMark` in the pool. */
    {
      const bad = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId).group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const over = built.lamps.some(m => { const p = new THREE.Vector3(); m.getWorldPosition(p); p.applyMatrix4(inv); return Math.abs(p.x) < 2.4 && p.z > -1.4 && p.z < 1.0 && p.y > 2.4 && p.y < 4.2; });
        if (!over) bad.push(`${site.id}: no lamp hangs over the plate`);
      }
      check(bad.length === 0, `every one of the ${world.sites.length} plates has a lamp over it`, bad.join('\n         '));
    }

    /* THE WALK. Flood-fill the ground from the spawn against the real colliders, with the player's own radius. */
    const R = 0.25, CELL = 0.5, MIN = -100, N = Math.round(200 / CELL), BUCK = 4;
    const buckets = new Map();
    const bkey = (i, j) => `${i}|${j}`;
    for (const c of built.colliders) {
      for (let i = Math.floor((c.x - c.radius - R) / BUCK); i <= Math.floor((c.x + c.radius + R) / BUCK); i++) {
        for (let j = Math.floor((c.z - c.radius - R) / BUCK); j <= Math.floor((c.z + c.radius + R) / BUCK); j++) {
          if (!buckets.has(bkey(i, j))) buckets.set(bkey(i, j), []);
          buckets.get(bkey(i, j)).push(c);
        }
      }
    }
    const blocked = (x, z) => (buckets.get(bkey(Math.floor(x / BUCK), Math.floor(z / BUCK))) || []).some(c => Math.hypot(x - c.x, z - c.z) < c.radius + R);
    const idx = (i, j) => i * N + j;
    const at = i => MIN + (i + 0.5) * CELL;
    const seen = new Uint8Array(N * N);
    const si = Math.floor((world.spawn.pos[0] - MIN) / CELL), sj = Math.floor((world.spawn.pos[2] - MIN) / CELL);
    const queue = [[si, sj]];
    seen[idx(si, sj)] = 1;
    const ledges = [];
    while (queue.length) {
      const [i, j] = queue.pop();
      const x = at(i), z = at(j), h = built.getTerrainHeight(x, z);
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj;
        if (ni < 0 || nj < 0 || ni >= N || nj >= N || seen[idx(ni, nj)]) continue;
        const nx = at(ni), nz = at(nj);
        if (blocked(nx, nz)) continue;
        const nh = built.getTerrainHeight(nx, nz);
        if (Math.abs(nh - h) > 0.6 && ledges.length < 8) ledges.push(`(${x.toFixed(1)}, ${z.toFixed(1)}) ${h.toFixed(2)}u -> (${nx.toFixed(1)}, ${nz.toFixed(1)}) ${nh.toFixed(2)}u`);
        seen[idx(ni, nj)] = 1;
        queue.push([ni, nj]);
      }
    }
    let reached = 0;
    for (let k = 0; k < seen.length; k++) if (seen[k]) reached++;
    check(ledges.length === 0, `${reached} cells of ground are walkable, and none of them drops off a ledge`, `the player can walk off a drop:\n         ${ledges.join('\n         ')}`);
    const reachable = (px, pz, within) => {
      for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) if (seen[idx(i, j)] && Math.hypot(at(i) - px, at(j) - pz) <= within) return true;
      return false;
    };
    for (const site of world.sites) check(reachable(site.approachPos[0], site.approachPos[2], 1.6), `${site.id}: a player can walk from the spawn to the bench's approach`, `${site.id}: its approach mark is sealed off from the spawn`);

    /* A HOST STANDS INSIDE THE EXTENT IT DECLARES, and the declaration is tight. */
    {
      const off = [];
      for (const site of world.sites) {
        const marker = built.siteMarkers.get(site.questId);
        const plan = HOST_PLAN[site.id];
        if (!marker || !plan) { off.push(`${site.id}: no host group`); continue; }
        const g = marker.group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const total = new THREE.Box3();
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          total.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
        });
        const [x0, x1, z0, z1] = plan.extent;
        for (const [name, got, want, dir] of [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['front', total.max.z, z1, 1]]) {
          if (dir * (got - want) > 0.25) off.push(`${site.id} (${plan.structure}) stands ${(dir * (got - want)).toFixed(2)} m outside its declared extent on the ${name}`);
          else if (dir * (want - got) > 2.5) off.push(`${site.id} (${plan.structure}) declares ${(dir * (want - got)).toFixed(2)} m more than it builds on the ${name}`);
        }
      }
      check(off.length === 0, 'every host stands inside the extent host-plan.js declares, and the declaration is tight', `hosts out of step with host-plan.js:\n         ${off.join('\n         ')}`);
    }

    /* THE LEVEL GROUND UNDER EVERY HOST AND ITS LANE. */
    {
      const bad = [];
      for (const site of world.sites) {
        const plan = HOST_PLAN[site.id];
        const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
        const c = Math.cos(a), sn = Math.sin(a);
        const hs = [];
        const [x0, x1, z0] = plan.extent;
        for (let lx = x0; lx <= x1; lx += 1.5) for (let lz = z0; lz <= LANE.to; lz += 1.5) hs.push(built.getTerrainHeight(site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c));
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread > 0.35) bad.push(`${site.id}: the ground under its host and lane varies by ${spread.toFixed(2)} m`);
      }
      check(bad.length === 0, 'the ground under every host and its lane is level', bad.join('\n         '));
    }

    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    check(reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');

    /* THE GOLEM'S GROUND. */
    {
      const A = world.arena;
      check(reachable(A.player[0], A.player[2], 1.0) && reachable(A.boss[0], A.boss[2], 1.0), "the Golem's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Golem are open ground', 'something stands within seven metres of the Golem');
      const furnace = world.landmarks.find(l => l.asset === 'furnace');
      check(Boolean(furnace) && furnace.pos[2] < A.boss[2] - 20, `the Golem is fought in front of the furnace (${(A.boss[2] - furnace.pos[2]).toFixed(0)} m off)`, 'the arena is not in front of the furnace');
    }
  }
}

/* ------------------------------------------------ the registry and the rooms */

{
  const { world3dFor, canWalk } = await import('../src/learn/worlds3d.js');
  const w3d = world3dFor('unit07');
  check(Boolean(w3d) && w3d.worldName === 'Kettle' && w3d.key === 'kettle', 'worlds3d.js registers unit07 as Kettle', 'unit07 is not a walkable world in worlds3d.js');
  check(w3d && world.sites.every(s => w3d.siteForQuest(s.questId)?.id === s.id), 'every quest of the plan resolves to its site, live or not', 'a quest does not resolve to its site');
  check(w3d && w3d.siteForQuest('q9-nothing') === null && w3d.siteForQuest('boss-golem') === null, 'a quest with no site (the boss, or one not charted) resolves to null, not an error', 'siteForQuest is not tolerant of a quest with no site');
  void canWalk;
  const { getRoom } = await import('../src/learn/engine/rooms.js');
  check(typeof getRoom('foundry') === 'function', 'the foundry room is still there for a quest played off-world', 'the foundry room is gone');
}

console.log('');
if (failures) {
  console.log(`KETTLE FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('KETTLE OK');
