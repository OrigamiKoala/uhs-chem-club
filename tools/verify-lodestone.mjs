#!/usr/bin/env node
/**
 * verify-lodestone.mjs — Integrity check of Lodestone, Learn world 12's site: a slot canyon in banded iron, walked from
 * the hollow at its head down to the pothole at its foot, its benches in alcoves at the bends
 * (`docs/plans/lodestone-world.md` section 7). The planners are checked in `verify:learn` (`tools/lib/lodestone/`).
 *
 * THE SAFETY RULES every walkable world is held to, held to this one:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE: the real `LodestoneWorld` is built in Node and every pair of bodies measured
 *    (tolerance 0.06 m); nothing is buried under the floor it stands on; the landmarks' footprints are disjoint.
 *  - All six benches have a host, every site names a quest the chart declares, says truly whether it is built, and its
 *    label is a signpost (`Bench N - <what it teaches>`, six words at most).
 *  - Every site FACES ITS APPROACH, stands on a level floor with its lane, and its bench deploys onto a real plate under
 *    a lamp.
 *  - THE PLAYER CAN WALK TO EVERY BENCH, to the pad and to the Coil's ground, and nowhere they should not: the ground is
 *    flood-filled from the spawn against the real colliders; no reachable cell drops off a ledge; no reachable cell is
 *    off the walk (the tableland, a wall top, an alcove's roof).
 *  - ONLY LAMPS ARE LIT: every emissive material is a lamp's filament; the lamps share three real lights.
 *  - A HOST STANDS INSIDE ITS OWN ALCOVE, under its roof, and furnishes it. THE COIL'S GROUND IS THE ONE `boss-arena.js`
 *    NAMES, in the pothole, and it is open.
 *  - No player-facing string carries emoji; no sign stands in the canyon.
 *
 * THE SHAPE, which replaces the checks that held the old template (two columns of sites either side of a haul road,
 * props inside the canyon's straight walls, a lamp lane down one road). These hold the numbers the site spec declares,
 * through `tools/lib/world-shape-checks.mjs`:
 *
 *  - bench ground spans at least 10 m on at least five levels; all six benches are housed, each R5 or better; each
 *    alcove is at least 11.2 x 11 m with 4.4 m over its floor, no two alike;
 *  - no bench stands on another world's bench coordinates; the benches are not on one circle and not in two columns;
 *  - NO PLATE CAN BE SEEN FROM THE SPAWN; the walls are shallow at the head and over 25 m deep at the pothole;
 *  - ONE FLOOR: no reachable cell has a body less than 2.4 m over it;
 *  - THE SUN IS ONLY ON THE UPPER WALLS: at every bench the sun and at least 0.7 of the sky are taken away, on the
 *    canyon floor the sun is, at the spawn and on the rim nothing is;
 *  - THE WAY IS LED AND LIT: the guide's route to every bench stays on the walk, goes in by the alcove's mouth, and no
 *    metre of it is more than 12 m from a lamp;
 *  - the world costs at most 566 draws and 900k triangles.
 */

import { readFileSync } from 'node:fs';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, APPROACH, hostExtent, toWorld } from '../src/three/lodestone/host-plan.js';
import { makeCanyonPlan, WALK, POTHOLE, HOLLOW, ARENA, ALCOVES } from '../src/three/lodestone/canyon-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/lodestone.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Lodestone — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

const plan = makeCanyonPlan();
{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const need = L[i].radius + L[j].radius, d = dist(L[i].pos, L[j].pos);
    if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}]`);
  }
  check(clashes.length === 0, `${L.length} landmarks in the hollow, every footprint disjoint`, `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);

  const p = plan.problems();
  check(p.length === 0, `the canyon plan is sound: ${plan.runs.length} runs ${plan.length.toFixed(0)} m long, every alcove's mouth on its bend's level floor`, p.join('\n         '));
  const stale = world.canyon?.alcoves?.length !== ALCOVES.length || world.canyon.alcoves.some((a, i) => a.id !== ALCOVES[i].id || JSON.stringify(a.rect) !== JSON.stringify(ALCOVES[i].rect));
  check(!stale, 'world-data/lodestone.json is in step with canyon-plan.js', 'world-data/lodestone.json is out of step with canyon-plan.js: run tools/gen-lodestone-layout.mjs');

  const small = [];
  const shapes = new Set();
  for (const s of world.sites) {
    const hp = HOST_PLAN[s.id];
    if (!hp || hp.structure !== s.structure || hp.questId !== s.questId || hp.alcove !== s.alcove || hp.label !== s.label) { small.push(`${s.id}: the host plan names a different structure, quest, label or alcove than the layout`); continue; }
    const al = plan.alcoveById.get(hp.alcove);
    const r = al.rect, across = al.face[0] ? r.maxZ - r.minZ : r.maxX - r.minX, deep = al.face[0] ? r.maxX - r.minX : r.maxZ - r.minZ;
    if (across < 11.2 || deep < 11 || al.roof < 4.4) small.push(`${s.id}: ${al.id} is ${across} x ${deep} m with ${al.roof} m of roof, under 11.2 x 11 x 4.4`);
    if (Math.abs(s.pos[1] - al.floor) > 1e-6) small.push(`${s.id}: declared at ${s.pos[1]} m, but ${al.id}'s floor is ${al.floor}`);
    for (const [lx, lz] of [[-2.5, -0.7], [2.5, -0.7], [-LANE.hw, LANE.to], [LANE.hw, LANE.to], [0, APPROACH]]) {
      const [x, z] = toWorld(hp, lx, lz);
      if (plan.alcoveAt(x, z) !== al) small.push(`${s.id}: its plate or lane leaves ${al.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
    shapes.add(`${across}x${deep}x${al.roof}x${al.roofBack || 0}x${al.chimney ? 1 : 0}`);
  }
  if (new Set(world.sites.map(s => s.alcove)).size !== world.sites.length) small.push('two benches share an alcove');
  if (shapes.size !== world.sites.length) small.push('two alcoves have the same size and roof');
  check(small.length === 0, `${world.sites.length} benches, each in an alcove of its own (no two alike), at least 11.2 x 11 m with 4.4 m of roof, its plate and lane inside it`, small.join('\n         '));
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 20) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two benches are within 20 m of each other', near.join('; '));
  const b = plan.bounds;
  check(b.minX >= -WALK && b.maxX <= WALK && b.minZ >= -WALK && b.maxZ <= WALK, `the walk stands inside the stage's square (x ${b.minX} to ${b.maxX}, z ${b.minZ} to ${b.maxZ})`, 'the walk reaches past the stage\'s bound');
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit12-transition-metals.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'((?:q\d+|boss)-[a-z]+)',\s*title:\s*["']([^"']+)["'][\s\S]*?status:\s*'(\w+)'/g)].map(m => ({ id: m[1], title: m[2], status: m[3] }));
{
  const benches = chartQuests.filter(q => !q.id.startsWith('boss'));
  check(benches.length === 6, `unit12 charts ${benches.length} benches`, `the unit12 chart lists ${benches.length} benches, not six`);
  const siteQuests = world.sites.map(s => s.questId);
  const missing = benches.filter(q => !siteQuests.includes(q.id));
  check(missing.length === 0, 'every charted bench has a host in the canyon', `charted benches with no site: ${missing.map(q => q.id).join(', ')}`);
  const invented = siteQuests.filter(q => !benches.some(x => x.id === q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `sites naming quests that do not exist: ${invented.join(', ')}`);
  const wrongBuilt = world.sites.filter(s => Boolean(s.built) !== existsSync(join(root, 'src/learn/quests/unit12', `${s.questId}.js`)));
  check(wrongBuilt.length === 0, 'every site says truly whether its quest is built', `built flags out of step: ${wrongBuilt.map(s => s.id).join(', ')} (re-run tools/gen-lodestone-layout.mjs)`);

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
  check(new Set(stages).size === stages.length && stages.every((v, i) => v === i + 1), 'site stage numbers run 1 to 6 down the canyon', 'site stage numbers are out of order');
  const badA = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(badA.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${badA.map(s => s.id).join(', ')}`);
  // Bench order is canyon order: each bench is further down the canyon than the last.
  const order = world.sites.map(s => plan.sAt(...plan.mouthOf(plan.alcoveById.get(s.alcove)).out));
  check(order.every((v, i) => i === 0 || v > order[i - 1]), 'the benches stand in bench order down the canyon', `bench order and canyon order differ: ${order.map(v => v.toFixed(0)).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity, words, spawn */

{
  check(world.sites.every(s => world.t2?.stillCamera?.[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');
  const off = world.sites.filter(s => { const c = world.t2.stillCamera[s.id]; return plan.alcoveAt(c.pos[0], c.pos[2])?.id !== s.alcove || Math.abs(c.pos[1] - (s.pos[1] + 1.6)) > 0.01; });
  check(off.length === 0, 'every still stands in its bench\'s own alcove, at the eye, on its floor', `stills out of their alcoves: ${off.map(s => s.id).join(', ')}`);
  check(world.t1?.siteOrder?.join() === world.sites.map(s => s.id).join(), 'the list tier keeps the benches in order', 'the T1 site order is out of step');

  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  check(!strings.some(s => /\p{Extended_Pictographic}/u.test(s)), 'the world is emoji-free', 'emoji in a player-facing string');
  const lettered = ['lodestone.js', 'lodestone/terrain.js', 'lodestone/stations.js', 'lodestone/plant.js', 'lodestone/rock.js'].filter(f => /placard\s*\(/.test(readFileSync(join(root, 'src/three', f), 'utf8')));
  check(lettered.length === 0, 'no sign stands in the canyon (no module letters a placard)', `placards in: ${lettered.join(', ')}`);

  const sp = world.spawn.pos;
  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(sp, l.pos) < l.radius + 0.5);
  check(!inProp && plan.sample(sp[0], sp[2]).shape === 'hollow', 'the player spawns in the hollow, inside nothing', `spawn is inside ${inProp?.asset || 'something other than the hollow'}`);
  const nearest = Math.min(...world.sites.map(s => dist(sp, s.pos)));
  check(nearest < 80, `the first bench is ${nearest.toFixed(0)} m from the spawn`, `the nearest bench is ${nearest.toFixed(0)} m away: too far to find`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark');
}

/* ------------------------------------------------ the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-coil':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const worldId = m?.[1].match(/worldId:\s*'(\w+)'/)?.[1];
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && worldId === 'unit12' && same(player, world.arena.player) && same(boss, world.arena.boss) && same(boss, ARENA.boss),
    `the Coil is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Coil at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const SHAPE = await import('./lib/world-shape-checks.mjs');
  const { consolidateStatic } = await import('../src/three/materials/pbr-kit.js');
  const { LodestoneWorld } = await import('../src/three/lodestone.js');

  let built = null;
  try { built = new LodestoneWorld(null); } catch (err) { fail(`LodestoneWorld threw while building: ${err.stack || err.message}`); }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 150, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);
    const kinds = new Set(built.landmarkNodes.map(n => n.lm.asset));
    check(world.landmarks.every(l => kinds.has(l.asset)), `every declared landmark kind is built (${[...kinds].join(', ')})`, 'a declared landmark was not built');

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    // The walls deepen down the canyon: shallow at the head, over 25 m round the pothole.
    {
      const depthAt = (x, z, out) => plan.tableland(x + out[0], z + out[1]) - plan.sample(x, z).floor;
      const head = depthAt(32, 74, [0, 9]);
      let foot = Infinity;
      for (let a = 0; a < 16; a++) foot = Math.min(foot, depthAt(POTHOLE.x, POTHOLE.z, [Math.cos(a / 16 * Math.PI * 2) * (POTHOLE.r + 4), Math.sin(a / 16 * Math.PI * 2) * (POTHOLE.r + 4)]));
      check(head < 7 && foot > 25, `the walls stand ${head.toFixed(1)} m at the canyon's head and at least ${foot.toFixed(1)} m round the pothole`, `the canyon does not deepen: ${head.toFixed(1)} m at the head, ${foot.toFixed(1)} m at the pothole`);
    }

    {
      const eye = new THREE.Vector3(44, 1.7, 86);
      let threw = null;
      try { for (let f = 0; f < 12; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'a frame updates with the eye handed in as a position, and the sky follows it', `update(delta, cameraPos) failed: ${threw?.message || 'the sky did not follow'}`);
    }

    const hits = findOverlaps(built.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
    const pairs = new Map();
    for (const h of hits) {
      const key = [h.a, h.b].sort().join(' <-> ');
      if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
    }
    check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
      `bodies occupy the same space:\n${[...pairs.entries()].slice(0, 16).map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);

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
        if (!o.isMesh || o.isInstancedMesh || EXEMPT.has(tagOf(o))) return;
        if (o.userData.partBoxes?.length) { for (const pb of o.userData.partBoxes) test(pb.clone().applyMatrix4(o.matrixWorld), o); return; }
        if (o.parent?.userData?.partBoxes?.length && o.userData.ownGeometry) { for (const pb of o.parent.userData.partBoxes) test(pb.clone().applyMatrix4(o.parent.matrixWorld), o); return; }
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the floor it stands on', `bodies buried under the ground:\n         ${buried.join('\n         ')}`);
    }

    /* ONLY LAMPS ARE LIT. */
    const lampAt = built.lamps.map(m => m.getWorldPosition(new THREE.Vector3()));
    {
      const lit = new Set();
      const opaqueNoDepth = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
          if (m && !m.transparent && m.depthWrite === false && o !== built.sky) opaqueNoDepth.add(m);
        }
      });
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material(s): the lamps' filament; nothing else in the canyon is lit`, `${strangers.length} emissive material(s) that are not a lamp's filament`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight || o.isSpotLight) realLights++; });
      check(realLights === 0 && built.lamps.length >= 36, `${built.lamps.length} lamps add no real lights to the scene`, `${built.lamps.length} lamps and ${realLights} real lights: a lamp is its emissive mesh only (lamp-pool.js)`);
      check(opaqueNoDepth.size === 0, 'no opaque material leaves the depth buffer unwritten', `${opaqueNoDepth.size} opaque material(s) set depthWrite false`);
    }

    /* EVERY SITE FACES ITS APPROACH, and its bench deploys onto a real plate. */
    for (const site of world.sites) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`, `${site.id} has no bench anchor to deploy onto`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces the canyon, where the player walks in`, `${site.id}: faces ${anchor.rotationY.toFixed(2)} rad, but its approach is at ${want.toFixed(2)}`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05 && Math.abs(ground - site.pos[1]) < 0.001, `${site.id}: the plate is at ${anchor.topY.toFixed(2)}u, on ${site.alcove}'s floor at ${ground.toFixed(2)}u`, `${site.id}: bench top at ${anchor.topY.toFixed(2)}, but the floor under it is ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
      built.setBenchDeployed(site.questId, true); built.setBenchDeployed(site.questId, false);
      built.setSiteComplete(site.questId, true); built.setSiteComplete(site.questId, false);
    }

    /* A TABLE IS WORKED BY ITS LAMP: a lamp over every plate, and at least two in every alcove. */
    {
      const bad = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId).group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const over = lampAt.some(q => { const p = q.clone().applyMatrix4(inv); return Math.abs(p.x) < 2.4 && p.z > -1.4 && p.z < 1.0 && p.y > 2.4 && p.y < 4.2; });
        if (!over) bad.push(`${site.id}: no lamp hangs over the plate`);
        const inRoom = lampAt.filter(q => plan.alcoveAt(q.x, q.z)?.id === site.alcove).length;
        if (inRoom < 2) bad.push(`${site.id}: ${site.alcove} has ${inRoom} lamp(s) of its own`);
      }
      check(bad.length === 0, `every one of the ${world.sites.length} plates has a lamp over it, and its alcove at least two`, bad.join('\n         '));
    }

    /* THE WALK. Flood the ground from the spawn against the real colliders, with the player's own radius. */
    const walk = SHAPE.flood(built, { bound: WALK });
    check(walk.ledges.length === 0, `${walk.reached} cells of ground are walkable, and none of them drops off a ledge`, `the player can walk off a drop:\n         ${walk.ledges.join('\n         ')}`);
    for (const site of world.sites) check(walk.reachable(site.approachPos[0], site.approachPos[2], 1.2), `${site.id}: a player can walk from the spawn to the bench's approach`, `${site.id}: its approach mark is sealed off from the spawn`);
    {
      const hs = walk.cells.map(c => c[2]);
      const lo = Math.min(...hs), hi = Math.max(...hs);
      check(lo >= POTHOLE.floor - 0.2 && hi <= HOLLOW.floor + 0.2, `the walk runs from ${lo.toFixed(2)} to ${hi.toFixed(2)} m: the pothole's floor to the hollow's, and nothing above or below`, `walkable ground at ${lo.toFixed(2)} to ${hi.toFixed(2)} m, outside the canyon's floors`);
      const off = walk.cells.filter(c => plan.sample(c[0], c[1]).depth < 0);
      check(off.length === 0, `every reachable cell is on the walk: no wall top, no tableland, no roof can be stood on (the edge is ${built.edgeColliders.length} colliders)`, `${off.length} reachable cell(s) off the walk, first at (${off[0]?.[0]}, ${off[0]?.[1]})`);
      const lost = plan.alcoves.filter(al => !walk.reachable((al.rect.minX + al.rect.maxX) / 2, (al.rect.minZ + al.rect.maxZ) / 2, 4));
      check(lost.length === 0, `all ${plan.alcoves.length} alcoves are reached on foot`, `alcoves nobody can walk into: ${lost.map(v => v.id).join(', ')}`);
    }
    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    check(walk.reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');

    /* A HOST STANDS INSIDE ITS OWN ALCOVE, under its roof, and furnishes it: its machinery reaches both side walls and the back. */
    {
      const off = [];
      for (const site of world.sites) {
        const marker = built.siteMarkers.get(site.questId);
        const p = HOST_PLAN[site.id];
        if (!marker || !p) { off.push(`${site.id}: no host group`); continue; }
        const g = marker.group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const al = plan.alcoveById.get(p.alcove);
        const total = new THREE.Box3();
        let through = null;
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bx = o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
          total.union(bx);
          // Under the roof where it stands (the roof steps; the chimney is open).
          const wb = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
          const c = wb.getCenter(new THREE.Vector3());
          const roof = plan.roofOver(c.x, c.z);
          if (roof !== null && roof !== Infinity && wb.max.y > al.floor + roof + 0.05 && !through) through = `${o.name || 'a part'} at (${c.x.toFixed(1)}, ${c.z.toFixed(1)}) reaches ${(wb.max.y - al.floor).toFixed(2)} m under a ${roof} m roof`;
        });
        const [x0, x1, z0, z1] = hostExtent(p);
        let touched = 0;
        for (const [name, got, want, dir] of [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['mouth', total.max.z, z1, 1]]) {
          if (dir * (got - want) > 0.1) off.push(`${site.id} (${p.alcove}) stands ${(dir * (got - want)).toFixed(2)} m past its ${name}`);
          if (name !== 'mouth' && dir * (want - got) < 2.5) touched++;
        }
        if (touched < 3) off.push(`${site.id} (${p.alcove}) reaches only ${touched} of its alcove's three walls: the alcove is not furnished, the bench is standing in it`);
        if (through) off.push(`${site.id}: ${through}`);
      }
      check(off.length === 0, 'every host stands inside its own alcove, under its roof, and reaches both side walls and the back', `hosts out of step with their alcoves:\n         ${off.join('\n         ')}`);
    }

    /* THE LEVEL FLOOR UNDER EVERY HOST AND ITS LANE. */
    {
      const bad = [];
      for (const site of world.sites) {
        const p = HOST_PLAN[site.id];
        const [x0, x1, z0, z1] = hostExtent(p);
        const hs = [];
        for (let lx = x0 + 0.1; lx <= x1 - 0.1; lx += 1.0) for (let lz = z0 + 0.1; lz <= z1 - 0.1; lz += 1.0) hs.push(built.getTerrainHeight(...toWorld(p, lx, lz)));
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread > 0.01) bad.push(`${site.id}: the floor of its alcove varies by ${spread.toFixed(2)} m`);
      }
      check(bad.length === 0, 'the floor of every alcove is level, wall to wall and out to its mouth', bad.join('\n         '));
    }

    /* THE COIL'S GROUND. */
    {
      const A = world.arena;
      check(walk.reachable(A.player[0], A.player[2], 1.0) && walk.reachable(A.boss[0], A.boss[2], 1.0), "the Coil's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (walk.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Coil are open floor', 'something stands within seven metres of the Coil');
      check(plan.sample(A.boss[0], A.boss[2]).shape === 'pothole' && plan.sample(A.player[0], A.player[2]).shape === 'pothole' && Math.abs(built.getTerrainHeight(A.boss[0], A.boss[2]) - A.boss[1]) < 1e-6,
        'the Coil is fought on the pothole\'s floor, at the canyon\'s foot', 'the arena is not on the pothole\'s floor');
    }

    /* ================================================================ THE SHAPE */
    console.log('');
    {
      const g = SHAPE.benchGround(built);
      check(g.span >= 10, `bench ground runs from ${g.lo.toFixed(2)} to ${g.hi.toFixed(2)} m: a span of ${g.span.toFixed(2)} m`, `bench ground spans only ${g.span.toFixed(2)} m (the spec holds 10)`);
      const levels = new Set(g.heights.map(h => h.toFixed(1)));
      check(levels.size >= 5, `the benches stand on ${levels.size} different levels`, `the benches stand on only ${levels.size} levels`);
      const rows = SHAPE.housing(built, THREE);
      const housed = rows.filter(r2 => r2.housed).length;
      check(housed === rows.length && rows.every(r2 => r2.closed >= 5), `${housed} of ${rows.length} benches are housed, each R5 or better (${rows.map(r2 => r2.code).join(' ')})`, `the spec holds every bench at R5 or better: ${rows.map(r2 => r2.code).join(' ')}`);
      const shared = SHAPE.sharedLayout(world);
      check(shared.length === 0, 'no bench stands on another world\'s bench coordinates', `the layout is shared with: ${shared.join(', ')}`);
      check(!SHAPE.oneCircle(world), 'the benches are not on one circle', 'every bench stands on one circle: the ring template');
      check(!SHAPE.twoColumns(world), 'the benches are not in two columns or two rows', 'the benches stand on two lines: the road template');
      const seen = SHAPE.platesInView(built, THREE, world.spawn.pos);
      check(seen.length === 0, 'no plate can be seen from the spawn', `plates in view from the spawn: ${seen.join(', ')}`);
      // From each bench's mark, only its own plate (the next is round a bend).
      const others = [];
      for (const s of world.sites) {
        const v = SHAPE.platesInView(built, THREE, s.approachPos).filter(id => id !== s.id);
        if (v.length) others.push(`${s.id} sees ${v.join(', ')}`);
      }
      check(others.length === 0, 'from each bench no other bench\'s plate can be seen', others.join('; '));
      const low = SHAPE.lowBodies(built, THREE, walk.cells, { every: 3, skip: o => o === built.terrainMesh });
      check(low.length === 0, 'one floor: no reachable cell has a body less than 2.4 m over it', `bodies low over the walk:\n         ${low.join('\n         ')}`);
    }

    /* THE SUN IS ONLY ON THE UPPER WALLS. */
    {
      const spec = plan.coverSpec();
      const bad = [];
      if (!built.cover || built.cover.boxes.length !== spec.boxes.length) bad.push('the world did not set its cover mask from the plan');
      if (spec.boxes.filter(b => plan.alcoveById.has(b.id)).length !== plan.alcoves.length) bad.push('an alcove has no box in the cover mask');
      for (const site of world.sites) {
        const c = built.cover.at(site.approachPos[0], site.approachPos[1], site.approachPos[2]);
        if (c.sun < 0.99 || c.sky < 0.7) bad.push(`${site.id}: at its mark the sun is ${(1 - c.sun).toFixed(2)} and the sky ${(1 - c.sky).toFixed(2)} of full`);
      }
      // Mid-run on the floor: no sun. On the rim above it: all of it.
      for (const r of plan.runs.slice(2)) {
        const x = r.A.x + r.dx * r.L / 2, z = r.A.z + r.dz * r.L / 2;
        const floor = built.cover.at(x, plan.sample(x, z).floor + 1.6, z);
        if (floor.sun < 0.99) bad.push(`run ${r.i}: the sun reaches its floor`);
        const rx = x - r.dz * (r.hw + 1), rz = z + r.dx * (r.hw + 1);
        const rim = built.cover.at(rx, plan.tableland(rx, rz) - 0.5, rz);
        if (rim.sun > 0) bad.push(`run ${r.i}: the sun is taken off the top of its wall`);
      }
      const sp = world.spawn.pos;
      const out = built.cover.at(sp[0], sp[1], sp[2]);
      if (out.sun > 0 || out.sky > 0) bad.push('the spawn, in the hollow, is covered');
      let unpatched = 0;
      built.scene.traverse(o => { if (o.isMesh && o.material?.isMeshStandardMaterial && !o.material.userData.worldCover) unpatched++; });
      if (unpatched) bad.push(`${unpatched} meshes' materials never had the cover mask`);
      check(bad.length === 0, `the sun is taken out of the canyon, the pothole and the alcoves below the rims (${spec.boxes.length} boxes); the rims and the hollow keep it`, bad.join('\n         '));
    }

    /* THE WAY IS LED AND LIT. */
    {
      const edge = built.edgeColliders;
      const inEdge = (x, z) => edge.some(b => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
      const bad = [];
      for (const site of world.sites) {
        const way = built.routeTo(site.id, { x: world.spawn.pos[0], z: world.spawn.pos[2] });
        if (!way || way.length < 3) { bad.push(`${site.id}: the guide has no way down the canyon`); continue; }
        let off = null, dark = null;
        for (let i = 0; i < way.length - 1; i++) {
          const [ax, az] = way[i], [bx, bz] = way[i + 1];
          const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az)));
          for (let k = 0; k <= n; k++) {
            const x = ax + (bx - ax) * (k / n), z = az + (bz - az) * (k / n);
            if (!off && (!walk.reachable(x, z, 0.5) || inEdge(x, z))) off = [x, z];
            if (!dark && !lampAt.some(q => Math.hypot(q.x - x, q.z - z) <= 12)) dark = [x, z];
          }
        }
        if (off) bad.push(`${site.id}: the guide's way leaves the walk at (${off.map(v => v.toFixed(1))})`);
        if (dark) bad.push(`${site.id}: dark at (${dark.map(v => v.toFixed(1))}): no lamp within 12 m of the way`);
        const end = way[way.length - 1];
        if (Math.hypot(end[0] - site.approachPos[0], end[1] - site.approachPos[2]) > 0.01) bad.push(`${site.id}: the way does not end at its approach mark`);
        const m = plan.mouthOf(plan.alcoveById.get(site.alcove));
        if (!way.some(p => Math.hypot(p[0] - m.mid[0], p[1] - m.mid[1]) < 2)) bad.push(`${site.id}: the way does not go in by the alcove's mouth`);
      }
      check(bad.length === 0, 'the guide\'s way to every bench stays on the walk, goes in by the alcove\'s mouth, and no metre of it is more than 12 m from a lamp', bad.join('\n         '));
    }

    /* THE COST, as `tools/perf-worlds.mjs` counts it. */
    {
      const again = new LodestoneWorld(null);
      consolidateStatic(again.scene);
      let draws = 0, tris = 0;
      again.scene.traverse(o => {
        if (!(o.isMesh || o.isLine || o.isPoints)) return;
        for (let n = o; n; n = n.parent) if (!n.visible) return;
        draws += Array.isArray(o.material) && o.geometry?.groups?.length ? o.geometry.groups.length : 1;
        const g = o.geometry;
        if (g) tris += (g.index ? g.index.count : g.attributes.position.count) / 3 * (o.isInstancedMesh ? o.count : 1);
      });
      check(draws <= 566 && tris <= 900000, `the world costs ${draws} draws and ${Math.round(tris / 1000)}k triangles (the budget is 566 and 900k)`, `over budget: ${draws} draws, ${Math.round(tris / 1000)}k triangles`);
      again.dispose();
    }
    built.dispose();
  }
}

/* ------------------------------------------------ the registry */

{
  const { world3dFor } = await import('../src/learn/worlds3d.js');
  const w3d = world3dFor('unit12');
  check(Boolean(w3d) && w3d.worldName === 'Lodestone' && w3d.key === 'lodestone', 'worlds3d.js registers unit12 as Lodestone', 'unit12 is not a walkable world in worlds3d.js');
  check(w3d && world.sites.every(s => w3d.siteForQuest(s.questId)?.id === s.id), 'every quest of the plan resolves to its site', 'a quest does not resolve to its site');
  check(w3d && w3d.siteForQuest('boss-coil') === null, 'the boss has no bench site (it is fought in the pothole)', 'the boss resolves to a bench site');
}

console.log('');
if (failures) {
  console.log(`LODESTONE FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('LODESTONE OK');
