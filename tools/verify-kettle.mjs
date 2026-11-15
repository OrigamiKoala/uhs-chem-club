#!/usr/bin/env node
/**
 * verify-kettle.mjs — Integrity check of Kettle, Learn world 07's site: one ironworks building, entered at the charge
 * end and walked through to the furnace (`docs/plans/kettle-world.md` section 11).
 *
 * THE SAFETY RULES every walkable world is held to, held to this one:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE, from the declaration (no two rooms overlap, every door is on a plane two rooms
 *    share and level across its threshold) AND from the world as built: the real `KettleWorld` is constructed in Node
 *    and every pair of bodies measured (tolerance 0.06 m); nothing is buried under the floor it stands on.
 *  - All eight benches have a host, every site names a quest the chart declares, and every LIVE quest has a site and a
 *    bench anchor. A SITE LABEL IS A SIGNPOST: `Bench N - <what it teaches>`, six words at most.
 *  - Every site FACES ITS APPROACH, stands on a level floor, and its bench deploys onto a real plate under a lamp.
 *  - THE PLAYER CAN WALK TO EVERY BENCH, to the pad and to the Golem's ground, and nowhere they should not: the ground is
 *    flood-filled from the spawn against the real colliders; no reachable cell drops off a ledge; neither heap can be
 *    stood on; nothing reachable is lower than the cellar or higher than the charge bank.
 *  - ONLY LAMPS ARE LIT: every emissive material is a lamp's filament or the furnace's iron (the one declared fire);
 *    the lamps and the fire share three real lights and there is no other point light.
 *  - A HOST STANDS INSIDE ITS OWN ROOM. THE GOLEM'S GROUND IS THE ONE `boss-arena.js` NAMES, and it is open.
 *  - No player-facing string carries emoji; no sign stands in the works.
 *
 * THE SHAPE, which replaces the three checks that held the old template (two columns of sites, props inside a 100 m
 * disc, one lamp lane down one road). These hold the numbers the site spec declares, through
 * `tools/lib/world-shape-checks.mjs`:
 *
 *  - bench ground spans at least 5 m; at least six of eight benches are housed (a roof and four of eight directions
 *    closed) and every bench has a roof and three; a bench's room is at least 11.2 x 11 m with 4.4 m over the floor;
 *  - no bench stands on another world's bench coordinates; the benches are not on one circle and not in two columns;
 *  - NO PLATE CAN BE SEEN FROM THE SPAWN;
 *  - ONE FLOOR: no reachable cell has a body less than 2.4 m over it;
 *  - INSIDE IS COVERED: every room has a box in the cover mask, a player at every bench has the sun and at least 0.7 of
 *    the sky taken away, and a player at the spawn has neither;
 *  - THE WAY IS LIT AND LED: the guide's route to every bench goes through doorways (never through a wall), and no
 *    metre of it is more than 12 m from a lamp;
 *  - the world costs at most 900k triangles and 566 draws.
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, hostExtent, toWorld } from '../src/three/kettle/host-plan.js';
import { makeWorksPlan, ROOMS, WALK } from '../src/three/kettle/works-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/kettle.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Kettle — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

const plan = makeWorksPlan(world);
{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const need = L[i].radius + L[j].radius, d = dist(L[i].pos, L[j].pos);
    if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}] overlap by ${(need - d).toFixed(2)}u`);
  }
  check(clashes.length === 0, `${L.length} yard landmarks, every footprint disjoint`, `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);

  // THE ROOMS, as declared: the JSON is the plan module's own, on the grid, disjoint, and joined level at every door.
  const bad = [];
  if (world.works.volumes.length !== ROOMS.length || ROOMS.some(r => !plan.byId.get(r.id))) bad.push('world-data/kettle.json is out of step with works-plan.js: run tools/gen-kettle-layout.mjs');
  const over = (a, b) => a.minX < b.maxX && a.maxX > b.minX && a.minZ < b.maxZ && a.maxZ > b.minZ;
  const V = plan.volumes;
  for (const v of V) for (const k of ['minX', 'maxX', 'minZ', 'maxZ']) if (v.rect[k] % 2 !== 0) bad.push(`${v.id}: ${k} is off the 2 m grid (the terrain's hole would not meet its wall)`);
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) if (over(V[i].rect, V[j].rect)) bad.push(`${V[i].id} and ${V[j].id} overlap`);
  const OPP = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };
  let doors = 0;
  for (const v of V) for (const o of v.openings) {
    if (!o.to) continue;
    doors++;
    const other = plan.byId.get(o.to);
    if (!other || other.rect[OPP[o.side]] !== v.rect[o.side]) { bad.push(`${v.id} -> ${o.to}: no shared plane`); continue; }
    if (!other.openings.some(p => p.to === v.id && p.lo === o.lo && p.hi === o.hi)) bad.push(`${v.id} -> ${o.to}: the door is not opened on both sides`);
    if (o.pass === false) continue;
    if (o.hi - o.lo < 3.5) bad.push(`${v.id} -> ${o.to}: a door ${o.hi - o.lo} m wide leaves under 2.5 m between its jambs' colliders`);
    const e = 0.01, alongZ = o.side === 'minX' || o.side === 'maxX';
    const sgn = o.side === 'minX' || o.side === 'minZ' ? 1 : -1;
    for (const s of [o.lo + e, o.hi - e]) {
      const mine = alongZ ? plan.floorOf(v, v.rect[o.side] + sgn * e, s) : plan.floorOf(v, s, v.rect[o.side] + sgn * e);
      const theirs = alongZ ? plan.floorOf(other, v.rect[o.side] - sgn * e, s) : plan.floorOf(other, s, v.rect[o.side] - sgn * e);
      if (Math.abs(mine - theirs) > 0.02) bad.push(`${v.id} -> ${o.to}: the floor steps ${Math.abs(mine - theirs).toFixed(2)} m at the door`);
    }
  }
  check(bad.length === 0, `${V.length} rooms on the 2 m grid, none overlapping, ${doors / 2} doors each on a shared plane and level across its threshold`, bad.join('\n         '));

  const small = [];
  for (const s of world.sites) {
    const p = HOST_PLAN[s.id];
    if (!p || p.structure !== s.structure || p.questId !== s.questId || p.room !== s.room) { small.push(`${s.id}: no host plan, or it names a different structure, quest or room than the layout`); continue; }
    const v = plan.byId.get(p.room);
    if (v.floor.y1 !== undefined) small.push(`${s.id}: stands on a ramp`);
    if (v.rect.maxX - v.rect.minX < 11.2 || v.rect.maxZ - v.rect.minZ < 11 || v.roof < 4.4) small.push(`${s.id}: ${p.room} is under 11.2 x 11 m or has under 4.4 m of headroom`);
    if (Math.abs(s.pos[1] - v.floor.y0) > 0.001) small.push(`${s.id}: declared at ${s.pos[1]} m, but ${p.room}'s floor is ${v.floor.y0}`);
    for (const [lx, lz] of [[-2.5, -0.7], [2.5, -0.7], [-LANE.hw, LANE.to], [LANE.hw, LANE.to]]) {
      const [x, z] = toWorld(p, lx, lz);
      if (plan.volumeAt(x, z)?.id !== p.room) small.push(`${s.id}: its plate or lane leaves ${p.room} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
  }
  const rooms = new Set(world.sites.map(s => s.room));
  if (rooms.size !== world.sites.length) small.push('two benches share a room');
  check(small.length === 0, `${world.sites.length} benches, each in a room of its own at least 11.2 x 11 m with 4.4 m of headroom, its plate and lane inside it`, small.join('\n         '));
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 8) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two sites are within 8u of each other', near.join('; '));
  const b = plan.bounds;
  check(b.minX > -WALK + 8 && b.maxX < WALK - 8 && b.minZ > -WALK + 8 && b.maxZ < WALK - 8, `the works stands inside the walk (x ${b.minX} to ${b.maxX}, z ${b.minZ} to ${b.maxZ})`, 'a room reaches the edge of the walk');
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
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');
  const off = world.sites.filter(s => { const c = world.t2.stillCamera[s.id]; const v = plan.volumeAt(c.pos[0], c.pos[2]); return v?.id !== s.room || Math.abs(c.pos[1] - (v.floor.y0 + 1.6)) > 0.01; });
  check(off.length === 0, 'every still stands in its bench\'s own room, at the eye, on that room\'s floor', `stills out of their rooms: ${off.map(s => s.id).join(', ')}`);
  check(world.t1.siteOrder.join() === world.sites.map(s => s.id).join(), 'the list tier keeps the benches in order', 'the T1 site order is out of step');

  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  check(!strings.some(s => /\p{Extended_Pictographic}/u.test(s)), 'the world is emoji-free', 'emoji in a player-facing string');
  // NO SIGN STANDS IN THE WORKS: nothing in the world's own modules letters a placard.
  const lettered = ['kettle.js', 'kettle/works.js', 'kettle/stations.js', 'kettle/plant.js', 'kettle/kit.js'].filter(f => /placard\s*\(/.test(readFileSync(join(root, 'src/three', f), 'utf8')));
  check(lettered.length === 0, 'no sign stands in the works (no module letters a placard)', `placards in: ${lettered.join(', ')}`);

  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(world.spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp && plan.volumeAt(world.spawn.pos[0], world.spawn.pos[2]) === null, 'the player spawns on open yard, inside nothing', `spawn is inside ${inProp?.asset || 'the works'}`);
  const nearest = Math.min(...world.sites.map(s => dist(world.spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the spawn`, `the nearest site is ${nearest.toFixed(0)}u away: too far to find`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark');
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
  const SHAPE = await import('./lib/world-shape-checks.mjs');
  const { consolidateStatic } = await import('../src/three/materials/pbr-kit.js');
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
    // The terrain mesh is the yard's only: it is cut away under every room, and whole everywhere else in the walk.
    {
      const ray = new THREE.Raycaster();
      const down = new THREE.Vector3(0, -1, 0);
      const hit = (x, z) => { ray.set(new THREE.Vector3(x, 60, z), down); ray.far = 200; return ray.intersectObject(built.terrainMesh, false).length > 0; };
      const wrong = [];
      for (const v of plan.volumes) { const c = [(v.rect.minX + v.rect.maxX) / 2 + 0.3, (v.rect.minZ + v.rect.maxZ) / 2 + 0.3]; if (hit(...c)) wrong.push(`${v.id}: the yard's ground is drawn under its floor`); }
      for (const [x, z] of [[0, 76], [56, 78], [-70, 0], [70, 60], [0, 60]]) if (!hit(x, z)) wrong.push(`a hole in the yard at (${x}, ${z})`);
      check(wrong.length === 0, 'the yard\'s ground is cut away under every room and whole everywhere else', wrong.join('; '));
    }

    {
      const eye = new THREE.Vector3(3, 1.7, 80);
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
        if (!o.isMesh || o.isInstancedMesh || EXEMPT.has(tagOf(o))) return;
        if (o.userData.partBoxes?.length) { for (const pb of o.userData.partBoxes) test(pb.clone().applyMatrix4(o.matrixWorld), o); return; }
        if (o.parent?.userData?.partBoxes?.length && o.userData.ownGeometry) { for (const pb of o.parent.userData.partBoxes) test(pb.clone().applyMatrix4(o.parent.matrixWorld), o); return; }
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the floor it stands on', `bodies buried under the ground:\n         ${buried.join('\n         ')}`);
    }

    /* ONLY LAMPS ARE LIT, and the one fire. */
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
      const strangers = [...lit].filter(m => m !== built.M.lantern && m !== built.M.iron);
      check(strangers.length === 0 && lit.has(built.M.iron), `${lit.size} emissive materials: the lamps' filament and the furnace's iron; nothing else in the world is lit`, `${strangers.length} emissive material(s) that are neither a lamp nor the furnace's iron`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      const { FURNACE_FIRE } = await import('../src/three/kettle/plant.js');
      const fires = built.lamps.filter(m => m.userData.lamp.color === FURNACE_FIRE).length;
      check(realLights === 3 && built.lamps.length >= 40 && fires === 1, `${built.lamps.length} lamps and one fire share ${realLights} real lights`, `${built.lamps.length} lamps, ${fires} fires and ${realLights} real lights: the lamp pool is not what keeps the frame cheap`);
      check(opaqueNoDepth.size === 0, 'no opaque material leaves the depth buffer unwritten', `${opaqueNoDepth.size} opaque material(s) set depthWrite false`);
    }

    /* EVERY SITE FACES ITS APPROACH, and its bench deploys onto a real plate. */
    for (const site of world.sites) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`, `${site.id} has no bench anchor to deploy onto`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces the floor the player walks in on`, `${site.id}: faces ${anchor.rotationY.toFixed(2)} rad, but its approach is at ${want.toFixed(2)}`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05 && Math.abs(ground - site.pos[1]) < 0.001, `${site.id}: the plate is at ${anchor.topY.toFixed(2)}u, standing on ${site.room}'s floor at ${ground.toFixed(2)}u`, `${site.id}: bench top at ${anchor.topY.toFixed(2)}, but the floor under it is ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
    }

    /* A TABLE IS WORKED BY ITS LAMP: a lamp over every plate, and at least two in every bench's room. */
    {
      const bad = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId).group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const over = lampAt.some(q => { const p = q.clone().applyMatrix4(inv); return Math.abs(p.x) < 2.4 && p.z > -1.4 && p.z < 1.0 && p.y > 2.4 && p.y < 4.2; });
        if (!over) bad.push(`${site.id}: no lamp hangs over the plate`);
        const inRoom = lampAt.filter(q => plan.volumeAt(q.x, q.z)?.id === site.room).length;
        if (inRoom < 2) bad.push(`${site.id}: ${site.room} has ${inRoom} lamp(s) of its own`);
      }
      check(bad.length === 0, `every one of the ${world.sites.length} plates has a lamp over it, and its room at least two`, bad.join('\n         '));
    }

    /* THE WALK. Flood the ground from the spawn against the real colliders, with the player's own radius. */
    const walk = SHAPE.flood(built, { bound: WALK });
    check(walk.ledges.length === 0, `${walk.reached} cells of ground are walkable, and none of them drops off a ledge`, `the player can walk off a drop:\n         ${walk.ledges.join('\n         ')}`);
    for (const site of world.sites) check(walk.reachable(site.approachPos[0], site.approachPos[2], 1.2), `${site.id}: a player can walk from the spawn to the bench's approach`, `${site.id}: its approach mark is sealed off from the spawn`);
    {
      const hs = walk.cells.map(c => c[2]);
      const lo = Math.min(...hs), hi = Math.max(...hs);
      const [flo, fhi] = [Math.min(...plan.volumes.map(v => plan.floorRange(v)[0])), Math.max(...plan.volumes.map(v => plan.floorRange(v)[1]))];
      check(lo >= flo - 0.01 && hi <= fhi + 0.01, `the walk runs from ${lo.toFixed(2)} to ${hi.toFixed(2)} m: the cellar's floor to the charge bank's, and nothing above or below`, `walkable ground at ${lo.toFixed(2)} to ${hi.toFixed(2)} m, outside the floors (${flo} to ${fhi})`);
      const onHeap = plan.hills.filter(h => walk.cells.some(c => plan.hillsHeight(c[0], c[1]) > 0.6 && c[0] > h.rect.minX && c[0] < h.rect.maxX && c[1] > h.rect.minZ && c[1] < h.rect.maxZ));
      check(onHeap.length === 0, 'neither heap can be stood on: the ring round each is closed', `the walk reaches ${onHeap.map(h => h.id).join(', ')}`);
      // Every reachable cell is either a room's floor or open yard: never the solid between rooms' walls is fine, but a
      // room that cannot be reached is a room the plan got wrong.
      const lost = plan.volumes.filter(v => !walk.reachable((v.rect.minX + v.rect.maxX) / 2, (v.rect.minZ + v.rect.maxZ) / 2, 3));
      check(lost.length === 0, `all ${plan.volumes.length} rooms are reached on foot`, `rooms nobody can walk into: ${lost.map(v => v.id).join(', ')}`);
    }
    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    check(walk.reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');

    /* A HOST STANDS INSIDE ITS OWN ROOM, and fills it: its machinery reaches three of the four walls. */
    {
      const off = [];
      for (const site of world.sites) {
        const marker = built.siteMarkers.get(site.questId);
        const p = HOST_PLAN[site.id];
        if (!marker || !p) { off.push(`${site.id}: no host group`); continue; }
        const g = marker.group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const total = new THREE.Box3();
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          total.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
        });
        const [x0, x1, z0, z1] = hostExtent(p);
        const v = plan.byId.get(p.room);
        let touched = 0;
        for (const [name, got, want, dir] of [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['front', total.max.z, z1, 1]]) {
          if (dir * (got - want) > 0.1) off.push(`${site.id} (${p.room}) stands ${(dir * (got - want)).toFixed(2)} m through its ${name} wall`);
          if (dir * (want - got) < 2.5) touched++;
        }
        if (touched < 3) off.push(`${site.id} (${p.room}) reaches only ${touched} of its room's walls: the room is not furnished, the bench is standing in it`);
        if (total.max.y > v.top - v.floor.y0 + 0.05) off.push(`${site.id} (${p.room}) stands ${(total.max.y - (v.top - v.floor.y0)).toFixed(2)} m through its roof`);
      }
      check(off.length === 0, 'every host stands inside its own room, under its roof, and reaches at least three of its walls', `hosts out of step with their rooms:\n         ${off.join('\n         ')}`);
    }

    /* THE LEVEL FLOOR UNDER EVERY HOST AND ITS LANE. */
    {
      const bad = [];
      for (const site of world.sites) {
        const p = HOST_PLAN[site.id];
        const [x0, x1, z0, z1] = hostExtent(p);
        const hs = [];
        for (let lx = x0 + 0.1; lx <= x1 - 0.1; lx += 1.5) for (let lz = z0 + 0.1; lz <= z1 - 0.1; lz += 1.5) hs.push(built.getTerrainHeight(...toWorld(p, lx, lz)));
        const spread = Math.max(...hs) - Math.min(...hs);
        if (spread > 0.01) bad.push(`${site.id}: the floor of its room varies by ${spread.toFixed(2)} m`);
      }
      check(bad.length === 0, 'the floor of every bench\'s room is level, wall to wall', bad.join('\n         '));
    }

    /* THE GOLEM'S GROUND. */
    {
      const A = world.arena;
      check(walk.reachable(A.player[0], A.player[2], 1.0) && walk.reachable(A.boss[0], A.boss[2], 1.0), "the Golem's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (walk.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Golem are open floor', 'something stands within seven metres of the Golem');
      const F = world.works.furnace;
      const cast = plan.byId.get('cast');
      check(plan.volumeAt(A.boss[0], A.boss[2]) === cast && plan.volumeAt(A.player[0], A.player[2]) === cast && F.z < A.boss[2] - 10 && Math.abs(F.x - A.boss[0]) < 1,
        `the Golem is fought on the cast house floor, the furnace ${(A.boss[2] - F.z).toFixed(1)} m behind it`, 'the arena is not in the cast house in front of the furnace');
      check(cast.top - cast.floor.y0 >= 12, `the cast house's roof is ${cast.top} m over the Golem's ground`, 'the cast house is too low for the fight to be seen');
    }

    /* ================================================================ THE SHAPE */
    console.log('');
    {
      const g = SHAPE.benchGround(built);
      check(g.span >= 5, `bench ground runs from ${g.lo.toFixed(2)} to ${g.hi.toFixed(2)} m: a span of ${g.span.toFixed(2)} m`, `bench ground spans only ${g.span.toFixed(2)} m (the spec holds 5)`);
      const levels = new Set(g.heights.map(h => h.toFixed(1)));
      check(levels.size >= 4, `the benches stand on ${levels.size} different levels`, `the benches stand on only ${levels.size} levels`);
      const rows = SHAPE.housing(built, THREE);
      const housed = rows.filter(r2 => r2.housed).length;
      check(housed >= 6, `${housed} of ${rows.length} benches are housed (${rows.map(r2 => r2.code).join(' ')})`, `only ${housed} of ${rows.length} benches are housed (${rows.map(r2 => r2.code).join(' ')}); the spec holds 6`);
      const open = rows.filter(r2 => !r2.roof || r2.closed < 3);
      check(open.length === 0, 'every bench has a roof and at least three directions closed', `benches standing in the open: ${open.map(r2 => `${r2.id} ${r2.code}`).join(', ')}`);
      const shared = SHAPE.sharedLayout(world);
      check(shared.length === 0, 'no bench stands on another world\'s bench coordinates', `the layout is shared with: ${shared.join(', ')}`);
      check(!SHAPE.oneCircle(world), 'the benches are not on one circle', 'every bench stands on one circle: the ring template');
      check(!SHAPE.twoColumns(world), 'the benches are not in two columns or two rows', 'the benches stand on two lines: the road template');
      const seen = SHAPE.platesInView(built, THREE, world.spawn.pos);
      check(seen.length === 0, 'no plate can be seen from the spawn', `plates in view from the spawn: ${seen.join(', ')}`);
      // From just inside the charge door, looking up the nave: still none (the benches are in the bays, not the aisle).
      const inside = SHAPE.platesInView(built, THREE, [0, 1.6, 44]);
      check(inside.length <= 1, `from just inside the charge door ${inside.length} plate(s) can be seen`, `plates in view from the charge door: ${inside.join(', ')}`);
      const low = SHAPE.lowBodies(built, THREE, walk.cells, { every: 3 });
      check(low.length === 0, 'one floor: no reachable cell has a body less than 2.4 m over it', `bodies low over the walk:\n         ${low.join('\n         ')}`);
    }

    /* INSIDE IS COVERED. */
    {
      const spec = plan.coverSpec();
      const bad = [];
      if (spec.boxes.length !== plan.volumes.length) bad.push(`${spec.boxes.length} cover boxes for ${plan.volumes.length} rooms`);
      if (!built.cover || built.cover.boxes.length !== spec.boxes.length) bad.push('the world did not set its cover mask from the plan');
      for (const site of world.sites) {
        const c = built.cover.at(site.approachPos[0], site.approachPos[1], site.approachPos[2]);
        if (c.sky < 0.7) bad.push(`${site.id}: only ${c.sky.toFixed(2)} of the sky is taken away at its mark`);
        // A bench may stand in a shaft of sun for part of its floor; the plate itself must not be in one.
        const a = built.benchAnchor(site.questId);
        const p = built.cover.at(a.position[0], a.topY + 0.1, a.position[2]);
        if (p.sun < 0.95) bad.push(`${site.id}: the sun reaches its plate (${p.sun.toFixed(2)} taken away)`);
      }
      const out = built.cover.at(world.spawn.pos[0], world.spawn.pos[1], world.spawn.pos[2]);
      if (out.sun > 0 || out.sky > 0) bad.push('the spawn, in the open yard, is covered');
      const lit = spec.openings.filter(o => {
        // Each opening lets the sun onto something: a point two metres along the light from its middle is in its shaft.
        const s = built.cover.uniforms.uCvSun.value;
        const mid = o.axis === 'x' ? [o.at, (o.lo[0] + o.hi[0]) / 2, (o.lo[1] + o.hi[1]) / 2] : [(o.lo[0] + o.hi[0]) / 2, (o.lo[1] + o.hi[1]) / 2, o.at];
        const q = [mid[0] - s.x * 2, mid[1] - s.y * 2, mid[2] - s.z * 2];
        return built.cover.at(...q).sun < 0.2;
      });
      if (lit.length !== spec.openings.length) bad.push(`${spec.openings.length - lit.length} opening(s) let no sun in: the sun is on the wrong side of the wall`);
      let unpatched = 0;
      built.scene.traverse(o => { if (o.isMesh && o.material?.isMeshStandardMaterial && !o.material.userData.worldCover) unpatched++; });
      if (unpatched) bad.push(`${unpatched} meshes' materials never had the cover mask`);
      check(bad.length === 0, `every room is covered (${spec.boxes.length} boxes); the sun comes in through ${spec.openings.length} openings; the yard is in the open`, bad.join('\n         '));
    }

    /* THE WAY IS LED AND LIT. */
    {
      const walls = plan.wallColliders();
      const inWall = (x, z) => walls.some(b => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
      const bad = [];
      for (const site of world.sites) {
        const way = built.routeTo(site.id, [world.spawn.pos[0], world.spawn.pos[2]]);
        if (!way || way.length < 3) { bad.push(`${site.id}: the guide has no way through the works`); continue; }
        let through = null, dark = null;
        for (let i = 0; i < way.length - 1; i++) {
          const [ax, az] = way[i], [bx, bz] = way[i + 1];
          const n = Math.ceil(Math.hypot(bx - ax, bz - az));
          for (let k = 0; k <= n; k++) {
            const x = ax + (bx - ax) * (k / n), z = az + (bz - az) * (k / n);
            if (!through && inWall(x, z)) through = [x, z];
            if (!dark && !lampAt.some(q => Math.hypot(q.x - x, q.z - z) <= 12)) dark = [x, z];
          }
        }
        if (through) bad.push(`${site.id}: the guide's way goes through a wall at (${through.map(v => v.toFixed(1))})`);
        if (dark) bad.push(`${site.id}: dark at (${dark.map(v => v.toFixed(1))}): no lamp within 12 m of the way`);
        const end = way[way.length - 1];
        if (Math.hypot(end[0] - site.approachPos[0], end[1] - site.approachPos[2]) > 0.01) bad.push(`${site.id}: the way does not end at its approach mark`);
      }
      check(bad.length === 0, 'the guide\'s way to every bench goes through doorways, and no metre of it is more than 12 m from a lamp', bad.join('\n         '));
    }

    /* THE COST, as `tools/perf-worlds.mjs` counts it. */
    {
      const again = new KettleWorld(null);
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
