#!/usr/bin/env node
/**
 * verify:brinewire — Brinewire (unit10), Learn world 10: the electrochemistry planners, and the tidal barrage as a place
 * (`docs/plans/brinewire-world.md` section 9). The first build's script, which held the old field of pools, is in
 * `archive/2026-11-17/site-brinewire/tools/`.
 *
 * THE PLANNERS (kept): `checkBrinewireData` holds the cell planners (`engine/celldata.js`) to independent values.
 *
 * THE SAFETY RULES every walkable world is held to, held to this one:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE: the real `BrinewireWorld` is built in Node and every pair of bodies measured
 *    (tolerance 0.06 m); nothing is buried under the floor it stands on; the landmarks' footprints are disjoint.
 *  - All six benches have a host, every site names a quest the plan declares, says truly whether it is built, and its label
 *    is a signpost (`Bench N - <what it teaches>`, six words at most).
 *  - Every site FACES ITS APPROACH, stands on a level floor with its lane, and its bench deploys onto a real plate under a
 *    lamp; every room has at least two lamps of its own.
 *  - THE PLAYER CAN WALK TO EVERY BENCH, to the pad and to the Clamp's ground, and nowhere they should not: the ground is
 *    flood-filled from the spawn against the real colliders; no reachable cell drops off a ledge; every reachable cell is
 *    inside the walk (never the lagoon, the tailwater, the deck, a parapet or a headland); nothing is higher than the crest.
 *  - ONLY LAMPS ARE LIT: every emissive material is a lamp's filament; no opaque material leaves the depth buffer unwritten.
 *  - A HOST STANDS INSIDE ITS OWN ROOM, under its roof, and furnishes it; the floor under it is level.
 *  - EVERY BENCH HOST HOLDS THE BAY and the leaned-in view at seven viewports (also measured by `verify:bench`).
 *  - THE CLAMP'S GROUND IS THE ONE `boss-arena.js` NAMES, on the apron at the foot; it is open and level, the boss in view.
 *  - What moves is the outfalls' water, and it is kept out of the bake.
 *  - Every landmark is built at T3; no player-facing string carries emoji; no sign stands on the barrage.
 *
 * THE SHAPE, which replaces the checks that held the old template (two columns of hosts either side of a plank spine, props
 * inside a 100 m disc, the largest pool by the court, a lamp lane down one road, the cable spans and the rotor piers). These
 * hold the numbers the site spec declares, through `tools/lib/world-shape-checks.mjs`:
 *
 *  - three walk levels 6 m apart (crest, gallery, foot); bench ground spans 12 m on three levels, in bench order along the
 *    crest and down the ramp; all six benches housed, each R5 or better; every room at least 11.2 x 11 m inside with 4.4 m
 *    over the plate, no two the same size or roofed alike;
 *  - no bench stands on another world's bench coordinates; the benches are not on one circle and not in two columns;
 *  - NO PLATE CAN BE SEEN FROM THE SPAWN, and from each bench's mark no other plate;
 *  - ONE FLOOR: no reachable cell has a body less than 2.4 m over it; the gallery and its chambers lie only under the deck;
 *  - THE BARRAGE: the lagoon stands against the west face, the tailwater 12 m lower at the east; the headlands close both ends;
 *  - INSIDE IS COVERED: at every bench the sun and at least half the sky are taken away; on the road, the yards, the ramp and
 *    the apron nothing is; the low sun reaches the gate houses' floors through their windows;
 *  - THE WAY IS LED AND LIT: the guide's route to every bench stays on the walk, goes in by the room's door, and no metre of
 *    it is more than 12 m from a lamp;
 *  - the world costs at most 566 draws and 900k triangles.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { checkBrinewireData } from './lib/brinewire-data-checks.mjs';
import { HOST_PLAN, LANE, APPROACH, hostExtent, toWorld } from '../src/three/brinewire/host-plan.js';
import {
  makeBarragePlan, WALK, ARENA, ROOMS, SPAWN, CREST, GALLERY, FOOT, DECK, WALL, LAGOON, BASIN, YARD_N
} from '../src/three/brinewire/barrage-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/brinewire.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log('Brinewire data (the planners)\n');
{
  const found = checkBrinewireData();
  check(found.length === 0, 'celldata.js agrees with every independent value', `celldata.js disagrees:\n         ${found.join('\n         ')}`);
}

console.log(`\nBrinewire — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

const plan = makeBarragePlan();
/** How far along the guide's way from the spawn a point is. */
const wayLength = (x, z) => {
  const way = plan.routeTo(SPAWN[0], SPAWN[2], x, z);
  let L = 0;
  for (let i = 0; i < way.length - 1; i++) L += Math.hypot(way[i + 1][0] - way[i][0], way[i + 1][1] - way[i][1]);
  return L;
};
{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    const need = L[i].radius + L[j].radius, d = dist(L[i].pos, L[j].pos);
    if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}]`);
  }
  check(clashes.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);

  const p = plan.problems();
  check(p.length === 0, `the barrage plan is sound: ${plan.volumes.length} volumes, every room's door on its walk, every chamber under the deck, no two volumes overlapping`, p.join('\n         '));
  const stale = world.barrage?.rooms?.length !== ROOMS.length || world.barrage.rooms.some((r, i) => r.id !== ROOMS[i].id || JSON.stringify(r.rect) !== JSON.stringify(plan.rooms[i].vol.rect));
  check(!stale, 'world-data/brinewire.json is in step with barrage-plan.js', 'world-data/brinewire.json is out of step with barrage-plan.js: run tools/gen-brinewire-layout.mjs');

  const small = [];
  const shapes = new Set();
  for (const s of world.sites) {
    const hp = HOST_PLAN[s.id];
    if (!hp || hp.structure !== s.structure || hp.questId !== s.questId || hp.room !== s.room || hp.label !== s.label) { small.push(`${s.id}: the host plan names a different structure, quest, label or room than the layout`); continue; }
    const room = plan.roomById.get(hp.room);
    const r = room.vol.rect, across = r.maxZ - r.minZ, deep = r.maxX - r.minX;
    if (Math.min(across, deep) < 11 || Math.max(across, deep) < 11.2 || room.top < 4.4) small.push(`${s.id}: ${room.id} is ${across} x ${deep} m with ${room.top} m over its floor, under 11.2 x 11 x 4.4`);
    if (Math.abs(s.pos[1] - room.level) > 1e-6) small.push(`${s.id}: declared at ${s.pos[1]} m, but ${room.id}'s floor is ${room.level}`);
    for (const [lx, lz] of [[-2.5, -0.7], [2.5, -0.7], [-LANE.hw, LANE.to], [LANE.hw, LANE.to], [0, APPROACH]]) {
      const [x, z] = toWorld(hp, lx, lz);
      if (plan.volumeAt(x, z) !== room.vol) small.push(`${s.id}: its plate or lane leaves ${room.id} at (${x.toFixed(1)}, ${z.toFixed(1)})`);
    }
    shapes.add(room.shell);
  }
  if (new Set(world.sites.map(s => s.room)).size !== world.sites.length) small.push('two benches share a room');
  if (shapes.size !== world.sites.length) small.push('two rooms have the same kind of roof');
  const sizes = new Set(plan.rooms.map(r => `${(r.vol.rect.maxZ - r.vol.rect.minZ).toFixed(1)}x${(r.vol.rect.maxX - r.vol.rect.minX).toFixed(1)}x${r.top}`));
  if (sizes.size !== plan.rooms.length) small.push('two rooms have the same size');
  check(small.length === 0, `${world.sites.length} benches, each in a room of its own (no two the same size or roofed alike), at least 11.2 x 11 m with 4.4 m over the plate, its plate and lane inside it`, small.join('\n         '));
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 20) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two benches are within 20 m of each other', near.join('; '));
  const b = plan.bounds;
  check(b.minX >= -WALK + 4 && b.maxX <= WALK - 4 && b.minZ >= -WALK + 4 && b.maxZ <= WALK - 4, `the walk stands inside the stage's square (x ${b.minX} to ${b.maxX}, z ${b.minZ} to ${b.maxZ})`, 'the walk reaches past the stage\'s bound');
  // THE BARRAGE: the crest, the gallery and the foot, 6 m apart; the lagoon under the crest, the tailwater under the foot.
  check(CREST - GALLERY === 6 && GALLERY - FOOT === 6 && LAGOON.water < CREST - 1 && LAGOON.water > GALLERY + 3 && BASIN.water < FOOT - 1 && DECK > CREST,
    `three walk levels, ${CREST}, ${GALLERY} and ${FOOT} m; the lagoon ${(CREST - LAGOON.water).toFixed(1)} m under the crest, the tailwater ${(LAGOON.water - BASIN.water).toFixed(1)} m under the lagoon`,
    'the barrage\'s levels are wrong');
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit10-electrochemistry.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'((?:q\d+|boss)-[a-z]+)',\s*title:\s*["']([^"']+)["'][\s\S]*?status:\s*'(\w+)'/g)].map(m => ({ id: m[1], title: m[2], status: m[3] }));
const PLAN_QUESTS = ['q1-halves', 'q2-activity', 'q3-galvanic', 'q4-potential', 'q5-load', 'q6-electrolysis'];
{
  const siteQuests = world.sites.map(s => s.questId);
  check(world.sites.length === 6 && PLAN_QUESTS.every((q, i) => siteQuests[i] === q), 'six sites, one per bench of the plan, in teaching order', `sites name ${siteQuests.join(', ')}`);
  const missing = chartQuests.filter(q => !q.id.startsWith('boss') && !siteQuests.includes(q.id));
  check(missing.length === 0, 'every charted bench has a host on the ground, live or not', `charted benches with no site: ${missing.map(q => q.id).join(', ')}`);
  const invented = siteQuests.filter(q => !PLAN_QUESTS.includes(q));
  check(invented.length === 0, 'every site names a quest the plan declares', `sites naming quests that do not exist: ${invented.join(', ')}`);
  const stale = world.sites.filter(s => s.built !== existsSync(join(root, 'src/learn/quests/unit10', `${s.questId}.js`)));
  check(stale.length === 0, 'a site is built exactly when its quest has a module (rerun tools/gen-brinewire-layout.mjs when one lands)', `sites whose built flag disagrees with src/learn/quests/unit10: ${stale.map(s => s.id).join(', ')}`);
  const stateless = chartQuests.filter(q => q.status === 'live' && !q.id.startsWith('boss') && !world.sites.find(s => s.questId === q.id)?.built);
  check(stateless.length === 0, 'every live chart quest has its site built', `live quests whose site is sealed: ${stateless.map(q => q.id).join(', ')}`);

  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  const off = [];
  for (const s of world.sites) {
    const hp = HOST_PLAN[s.id];
    const title = chartQuests.find(x => x.id === s.questId)?.title || hp.title;
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) { off.push(`${s.id} reads "${s.label}", which does not start "${prefix}"`); continue; }
    const words = s.label.slice(prefix.length).split(/\s+/).map(stem).filter(w => w.length >= 1);
    const have = new Set(title.split(/\s+/).map(stem));
    if (!words.some(w => have.has(w))) off.push(`${s.id} reads "${s.label}", which shares no word with "${title}"`);
    if (s.label.split(/\s+/).length > 6) off.push(`${s.id}: "${s.label}" is longer than six words`);
  }
  check(off.length === 0, 'every site label names its bench by what it teaches, in six words or fewer', off.join('\n         '));
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length && stages.every((v, i) => v === i + 1), 'site stage numbers run 1 to 6', 'site stage numbers are out of order');
  const badA = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(badA.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${badA.map(s => s.id).join(', ')}`);
  // Bench order is the walk's order: along the crest from the north yard, down the ramp, into the gallery, on to the foot.
  const order = world.sites.map(s => wayLength(s.approachPos[0], s.approachPos[2]));
  const gallery = world.sites.filter(s => Math.abs(s.pos[1] - GALLERY) < 1e-6).map(s => s.id);
  const inOrder = order.every((v, i) => i === 0 || v > order[i - 1] || (gallery.includes(world.sites[i].id) && gallery.includes(world.sites[i - 1].id)));
  check(inOrder, `the benches stand in bench order along the way (${order.map(v => v.toFixed(0)).join(', ')} m from the spawn; the gallery's three off one corridor)`, `bench order and walk order differ: ${order.map(v => v.toFixed(0)).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity, words, spawn */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  check(t4Only.length === 0, 'every landmark is built at T3 as at T4: no ground or lamp depends on decoration', `${t4Only.length} landmarks are T4 only`);
  const blocked = [];
  for (const s of world.sites) for (const l of world.landmarks) if (dist(s.approachPos, l.pos) < l.radius + 0.5) blocked.push(`${s.id}'s approach is blocked by ${l.asset}`);
  check(blocked.length === 0, 'no landmark stands on a bench\'s approach mark', blocked.join('\n         '));
  check(world.sites.every(s => world.t2?.stillCamera?.[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');
  const offStill = world.sites.filter(s => { const c = world.t2.stillCamera[s.id]; return plan.volumeAt(c.pos[0], c.pos[2])?.id !== s.room || Math.abs(c.pos[1] - (s.pos[1] + 1.6)) > 0.01; });
  check(offStill.length === 0, 'every still stands in its bench\'s own room, at the eye, on its floor', `stills out of their rooms: ${offStill.map(s => s.id).join(', ')}`);
  check(world.t1?.siteOrder?.join() === world.sites.map(s => s.id).join(), 'the list tier keeps the benches in order', 'the T1 site order is out of step');

  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  check(!strings.some(s => /\p{Extended_Pictographic}/u.test(s)), 'the world is emoji-free', 'emoji in a player-facing string');
  const lettered = ['brinewire.js', 'brinewire/terrain.js', 'brinewire/stations.js', 'brinewire/plant.js', 'brinewire/barrage-plan.js'].filter(f => /placard\s*\(/.test(readFileSync(join(root, 'src/three', f), 'utf8')));
  check(lettered.length === 0, 'no sign stands on the barrage (no module letters a placard)', `placards in: ${lettered.join(', ')}`);

  const sp = world.spawn.pos;
  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(sp, l.pos) < l.radius + 0.5);
  check(!inProp && plan.volumeAt(sp[0], sp[2])?.id === 'yard-n' && Math.abs(sp[1] - (CREST + 1.6)) < 1e-6, 'the player spawns on the north yard, at the eye, inside nothing', `spawn is inside ${inProp?.asset || 'something other than the north yard'}`);
  const nearest = Math.min(...world.sites.map(s => dist(sp, s.pos)));
  check(nearest < 60, `the first bench is ${nearest.toFixed(0)} m from the spawn`, `the nearest bench is ${nearest.toFixed(0)} m away: too far to find`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark');
}

/* ------------------------------------------------ the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-clamp':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const worldId = m?.[1].match(/worldId:\s*'(\w+)'/)?.[1];
  const species = m?.[1].match(/species:\s*'([^']+)'/)?.[1];
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && worldId === 'unit10' && species === 'the clamp' && same(player, world.arena.player) && same(boss, world.arena.boss) && same(boss, ARENA.boss),
    `the Clamp is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Clamp at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  // The bench checks run above stub a bare `document`/`window` for themselves; the world needs the real canvas shim.
  delete globalThis.document;
  delete globalThis.window;
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { findOverlaps, collectBoxes, findBayIntrusions } = await import('./lib/overlap.mjs');
  const SHAPE = await import('./lib/world-shape-checks.mjs');
  const { consolidateStatic } = await import('../src/three/materials/pbr-kit.js');
  const { BrinewireWorld } = await import('../src/three/brinewire.js');
  const { OUTFALLS } = await import('../src/three/brinewire/plant.js');

  let built = null;
  try { built = new BrinewireWorld(null); } catch (err) { fail(`BrinewireWorld threw while building: ${err.stack || err.message}`); }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 250, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);
    const kinds = new Set(built.landmarkNodes.map(n => n.lm.asset));
    check(world.landmarks.every(l => kinds.has(l.asset)), `every declared landmark kind is built (${[...kinds].join(', ')})`, 'a declared landmark was not built');

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    // THE BARRAGE IN ITS LAND: the lagoon's bed under its water against the west face, the basin's under the tailwater at the
    // east, the headlands standing over both ends of the walk.
    {
      const bedW = built.getTerrainHeight(WALL.west - 12, 0), bedE = built.getTerrainHeight(30, 0);
      const north = built.getTerrainHeight(-20, WALL.north - 20) - CREST, south = built.getTerrainHeight(-20, 100) - CREST;
      check(bedW < LAGOON.water - 3 && bedE < BASIN.water - 1 && north > 6 && south > 6,
        `the lagoon is ${(LAGOON.water - bedW).toFixed(1)} m deep at the west face, the basin ${(BASIN.water - bedE).toFixed(1)} m at the east; the headlands stand ${north.toFixed(0)} and ${south.toFixed(0)} m over the crest`,
        `the land round the barrage is wrong: lagoon bed ${bedW.toFixed(1)}, basin bed ${bedE.toFixed(1)}, headlands ${north.toFixed(1)} / ${south.toFixed(1)}`);
    }
    {
      const eye = new THREE.Vector3(SPAWN[0], SPAWN[1], SPAWN[2]);
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
      check(strangers.length === 0, `${lit.size} emissive material(s): the lamps' filament; nothing else on the barrage is lit`, `${strangers.length} emissive material(s) that are not a lamp's filament`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight || o.isSpotLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30, `${built.lamps.length} lamps share ${realLights} real lights`, `${built.lamps.length} lamps and ${realLights} real lights: the lamp pool is not what keeps the frame cheap`);
      check(opaqueNoDepth.size === 0, 'no opaque material leaves the depth buffer unwritten', `${opaqueNoDepth.size} opaque material(s) set depthWrite false`);
      check([built.M.lagoon, built.M.tail].every(m => m.transparent && !m.emissive.getHex()), 'the lagoon and the tailwater are translucent and not lit', 'the water is solid or lit');
    }

    /* EVERY SITE FACES ITS DOOR, and its bench deploys onto a real plate. */
    for (const site of world.sites) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: the bench reports a working surface`, `${site.id} has no bench anchor to deploy onto`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces its door, where the player walks in`, `${site.id}: faces ${anchor.rotationY.toFixed(2)} rad, but its approach is at ${want.toFixed(2)}`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05 && Math.abs(ground - site.pos[1]) < 0.001, `${site.id}: the plate is at ${anchor.topY.toFixed(2)}u, on ${site.room}'s floor at ${ground.toFixed(2)}u`, `${site.id}: bench top at ${anchor.topY.toFixed(2)}, but the floor under it is ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet, so deploying would draw two instruments in one place`);
      built.setBenchDeployed(site.questId, true); built.setBenchDeployed(site.questId, false);
      built.setSiteComplete(site.questId, true); built.setSiteComplete(site.questId, false);
    }

    /* A TABLE IS WORKED BY ITS LAMP: a lamp over every plate, and at least two in every room. */
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
      check(lo >= FOOT - 0.01 && hi <= CREST + 0.2, `the walk runs from ${lo.toFixed(2)} to ${hi.toFixed(2)} m: the foot to the crest (and the pad's plate), nothing above or below`, `walkable ground at ${lo.toFixed(2)} to ${hi.toFixed(2)} m, outside the barrage's levels`);
      const off = walk.cells.filter(c => !plan.volumeAt(c[0], c[1]));
      check(off.length === 0, `every reachable cell is on the walk: no water, no deck, no parapet, no roof, no headland can be stood on (the walk's walls are ${built.edgeColliders.length} colliders)`, `${off.length} reachable cell(s) off the walk, first at (${off[0]?.[0]}, ${off[0]?.[1]})`);
      const wet = walk.cells.filter(c => { const v = plan.volumeAt(c[0], c[1]); return !v || (c[0] < WALL.west && !['yard-n'].includes(v.id) && v.kind !== 'room' && v.kind !== 'passage'); });
      check(wet.length === 0, 'no reachable cell is over the lagoon or the tailwater: brine is never waded', `${wet.length} reachable cells are over water, first at (${wet[0]?.[0]}, ${wet[0]?.[1]})`);
      const under = walk.cells.filter(c => plan.volumeAt(c[0], c[1])?.floor.y0 === GALLERY && !(c[0] > WALL.deckW + 0.6 && c[0] < WALL.east + 6.01));
      check(under.length === 0, 'the gallery level is walked only under the deck and on the landing outside it', `${under.length} gallery-level cells outside the wall`);
      const lost = plan.rooms.filter(r => !walk.reachable((r.vol.rect.minX + r.vol.rect.maxX) / 2, (r.vol.rect.minZ + r.vol.rect.maxZ) / 2, 4));
      check(lost.length === 0, `all ${plan.rooms.length} rooms are reached on foot`, `rooms nobody can walk into: ${lost.map(v => v.id).join(', ')}`);
    }
    const pad = world.landmarks.find(l => l.asset === 'landing-pad');
    check(walk.reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the rest of the ground', 'the landing pad is walled off from the spawn');

    /* A HOST STANDS INSIDE ITS OWN ROOM, under its roof, and furnishes it: its machinery reaches both side walls and the back. */
    {
      const off = [];
      for (const site of world.sites) {
        const marker = built.siteMarkers.get(site.questId);
        const p = HOST_PLAN[site.id];
        if (!marker || !p) { off.push(`${site.id}: no host group`); continue; }
        const g = marker.group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const room = plan.roomById.get(p.room);
        const total = new THREE.Box3();
        let through = null;
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bx = o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
          total.union(bx);
          const roofTop = room.level + (room.ridge ?? room.top + 0.45);
          if (bx.max.y + g.position.y > roofTop + 0.05 && !through) through = `${o.name || 'a part'} reaches ${(bx.max.y).toFixed(2)} m over the floor, through its roof`;
        });
        const [x0, x1, z0, z1] = hostExtent(p);
        let touched = 0;
        for (const [name, got, want, dir] of [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['door', total.max.z, z1, 1]]) {
          if (dir * (got - want) > 0.1) off.push(`${site.id} (${p.room}) stands ${(dir * (got - want)).toFixed(2)} m past its ${name}`);
          if (name !== 'door' && dir * (want - got) < 2.5) touched++;
        }
        if (touched < 3) off.push(`${site.id} (${p.room}) reaches only ${touched} of its room's three walls: the room is not furnished, the bench is standing in it`);
        if (through) off.push(`${site.id}: ${through}`);
      }
      check(off.length === 0, 'every host stands inside its own room, under its roof, and reaches both side walls and the back', `hosts out of step with their rooms:\n         ${off.join('\n         ')}`);
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
        if (spread > 0.01) bad.push(`${site.id}: the floor of its room varies by ${spread.toFixed(2)} m`);
      }
      check(bad.length === 0, 'the floor of every room is level, wall to wall and out to its door', bad.join('\n         '));
    }

    /* THE CLAMP'S GROUND. */
    {
      const A = world.arena;
      check(walk.reachable(A.player[0], A.player[2], 1.0) && walk.reachable(A.boss[0], A.boss[2], 1.0), "the Clamp's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (walk.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Clamp are open floor', 'something stands within seven metres of the Clamp');
      const heights = [];
      for (let dx = -7; dx <= 7; dx += 1) for (let dz = -7; dz <= 7; dz += 1) heights.push(built.getTerrainHeight(A.boss[0] + dx, A.boss[2] + dz));
      check(plan.volumeAt(A.boss[0], A.boss[2])?.id === 'apron' && plan.volumeAt(A.player[0], A.player[2])?.id === 'apron' && Math.max(...heights) - Math.min(...heights) < 1e-6,
        'the Clamp is fought on the apron at the foot, level for seven metres round', 'the arena is not on the apron, or not level');
      const bodies = SHAPE.bodiesOf(built);
      const ray = new THREE.Raycaster();
      const from = new THREE.Vector3(A.player[0], A.player[1], A.player[2]);
      const to = new THREE.Vector3(A.boss[0], A.boss[1] + 3, A.boss[2]);
      ray.set(from, to.clone().sub(from).normalize());
      ray.far = from.distanceTo(to) - 1;
      check(ray.intersectObjects(bodies, false).length === 0, 'nothing stands between the player\'s mark and the Clamp', 'something blocks the view of the Clamp');
    }

    /* WHAT MOVES: the water out of the outfalls, kept out of the bake. */
    {
      const node = built.scene.getObjectByName('outfalls');
      const sheets = [];
      node?.traverse(o => { if (o.isMesh && o.material === built.M.fall) sheets.push(o); });
      const before = built.M.fall?.map?.offset.y;
      built.update(0.5, null);
      const after = built.M.fall?.map?.offset.y;
      check(sheets.length === OUTFALLS.length && sheets.every(s => s.userData.noMerge && s.userData.phys === 'ambient') && before !== after,
        `${OUTFALLS.length} outfalls run into the basin, their water sliding (${built.movers.length} mover)`, `the outfalls' water is missing, baked or still (${sheets.length} sheets)`);
    }

    /* EVERY BENCH HOST HOLDS THE BAY, and the leaned-in view from each (plan bench-tabletop.md section 2.6). */
    {
      const BAY = await import('../src/three/bench-bay.js');
      const { planLeanIn, PLATE_ZONE } = await import('../src/learn/engine/lean.js');
      const { sightBlockers, behindCover } = await import('./lib/lean-check.mjs');
      const VIEWPORTS = [['ultrawide', 2560, 1080], ['16:9', 1920, 1080], ['16:10', 1680, 1050], ['3:2', 1440, 960], ['4:3', 1280, 960], ['phone landscape', 812, 375], ['small phone', 667, 375]];
      const proto = BrinewireWorld.prototype;
      const baked = proto.bakeStatics;
      proto.bakeStatics = function () { /* bodies stay identifiable for this check */ };
      let w;
      try { w = new BrinewireWorld(null); } finally { proto.bakeStatics = baked; }
      w.scene.updateMatrixWorld(true);
      const volumes = BAY.bayBoxes();
      const lift = BAY.PLATE_TOP - 0.895;
      const poses = VIEWPORTS.map(([name, vw, vh]) => [name, vw, vh, planLeanIn({ viewport: { w: vw, h: vh } })]);
      const problems = [];
      let rays = 0;
      for (const [questId, anchor] of w.benchAnchors) {
        const node = new THREE.Group();
        node.position.set(anchor.position[0], anchor.topY - BAY.PLATE_TOP, anchor.position[2]);
        node.rotation.y = anchor.rotationY;
        node.updateMatrixWorld(true);
        const frame = new THREE.Matrix4().copy(node.matrixWorld).invert();
        const own = anchor.dormant?.parent;
        if (!own) { problems.push(`${questId}: the anchor has no bench to exempt`); continue; }
        const bodies = collectBoxes(w.scene, { frame, skip: o => o === own });
        for (const h of findBayIntrusions(w.scene, frame, volumes, { skip: o => o === own, bodies })) problems.push(`${questId}: ${h.body} stands ${h.depth.toFixed(2)} m inside the bay's ${h.volume} volume at (${h.at.join(', ')})`);
        for (const [name, vw, vh, pose] of poses) {
          const cam = [pose.position[0], pose.position[1] + lift, pose.position[2]];
          const sb = sightBlockers(bodies, cam, PLATE_ZONE, BAY.PLATE_TOP);
          if (sb.blocked) problems.push(`${questId}: ${sb.first.name} stands between the leaned-in camera and the plate (${name})`);
          const camera = new THREE.PerspectiveCamera(55, vw / vh, 0.05, 80);
          camera.position.set(...cam);
          camera.lookAt(pose.target[0], pose.target[1] + lift, pose.target[2]);
          const bc = behindCover({ bodies, camera, plateY: BAY.PLATE_TOP, farZ: -BAY.BENCH_BAY.depth / 2, toWorld: node.matrixWorld, terrain: (x, z) => w.getTerrainHeight(x, z), safe: pose.safe });
          rays += bc.total;
          if (bc.covered < bc.total) problems.push(`${questId}: ${bc.total - bc.covered} of ${bc.total} rays past the plate reach no host and no ground (${name})`);
        }
      }
      check(problems.length === 0, `all ${w.benchAnchors.size} hosts hold the bay's volumes clear, have nothing between the camera and the plate and a host or ground behind it at ${VIEWPORTS.length} viewports (${rays} rays)`, `bay or lean-in problems:\n         ${problems.slice(0, 12).join('\n         ')}`);
      w.dispose();
    }

    /* ================================================================ THE SHAPE */
    console.log('');
    {
      const g = SHAPE.benchGround(built);
      check(g.span >= 12 - 1e-6, `bench ground runs from ${g.lo.toFixed(2)} to ${g.hi.toFixed(2)} m: a span of ${g.span.toFixed(2)} m`, `bench ground spans only ${g.span.toFixed(2)} m (the spec holds 12)`);
      const levels = new Set(g.heights.map(h => h.toFixed(1)));
      check(levels.size >= 3, `the benches stand on ${levels.size} different levels`, `the benches stand on only ${levels.size} levels`);
      const rows = SHAPE.housing(built, THREE);
      const housed = rows.filter(r2 => r2.housed).length;
      check(housed === rows.length && rows.every(r2 => r2.closed >= 5), `${housed} of ${rows.length} benches are housed, each R5 or better (${rows.map(r2 => r2.code).join(' ')})`, `the spec holds every bench at R5 or better: ${rows.map(r2 => r2.code).join(' ')}`);
      const shared = SHAPE.sharedLayout(world);
      check(shared.length === 0, 'no bench stands on another world\'s bench coordinates', `the layout is shared with: ${shared.join(', ')}`);
      check(!SHAPE.oneCircle(world), 'the benches are not on one circle', 'every bench stands on one circle: the ring template');
      check(!SHAPE.twoColumns(world), 'the benches are not in two columns or two rows', 'the benches stand on two lines: the road template');
      const seen = SHAPE.platesInView(built, THREE, world.spawn.pos);
      check(seen.length === 0, 'no plate can be seen from the spawn', `plates in view from the spawn: ${seen.join(', ')}`);
      const others = [];
      for (const s of world.sites) {
        const v = SHAPE.platesInView(built, THREE, s.approachPos).filter(id => id !== s.id);
        if (v.length) others.push(`${s.id} sees ${v.join(', ')}`);
      }
      check(others.length === 0, 'from each bench no other bench\'s plate can be seen', others.join('; '));
      const low = SHAPE.lowBodies(built, THREE, walk.cells, { every: 3, skip: o => o === built.terrainMesh });
      check(low.length === 0, 'one floor: no reachable cell has a body less than 2.4 m over it', `bodies low over the walk:\n         ${low.join('\n         ')}`);
    }

    /* INSIDE IS COVERED. */
    {
      const spec = plan.coverSpec();
      const bad = [];
      if (!built.cover || built.cover.boxes.length !== spec.boxes.length) bad.push('the world did not set its cover mask from the plan');
      if (spec.boxes.filter(b => plan.roomById.has(b.id)).length !== plan.rooms.length) bad.push('a room has no box in the cover mask');
      for (const site of world.sites) {
        const c = built.cover.at(site.approachPos[0], site.approachPos[1], site.approachPos[2]);
        if (c.sun < 0.99 || c.sky < 0.5) bad.push(`${site.id}: at its mark the sun is ${(1 - c.sun).toFixed(2)} and the sky ${(1 - c.sky).toFixed(2)} of full`);
      }
      // In the gallery the sky is all but gone.
      {
        const g = plan.byId.get('gallery').rect;
        const c = built.cover.at((g.minX + g.maxX) / 2, GALLERY + 1.6, 0);
        if (c.sun < 0.99 || c.sky < 0.85) bad.push(`the gallery keeps ${(1 - c.sky).toFixed(2)} of the sky`);
      }
      // Out on the open walk nothing is taken away: the middle of every open volume, and a few metres outside every door.
      for (const v of plan.openVols) {
        const r = v.rect, x = (r.minX + r.maxX) / 2, z = (r.minZ + r.maxZ) / 2;
        const c = built.cover.at(x, built.getTerrainHeight(x, z) + 1.6, z);
        if (c.sun > 0 || c.sky > 0) bad.push(`${v.id} is covered at its middle`);
      }
      for (const r of plan.rooms.filter(m => m.onto !== 'gallery')) {
        const d = r.door.rect, z = (d.minZ + d.maxZ) / 2;
        const c = built.cover.at(d.maxX + 3, r.level + 1.6, z);
        if (c.sun > 0 || c.sky > 0) bad.push(`${r.id}: the walk outside its door is covered`);
      }
      // THE LOW SUN COMES IN AT THE GATE HOUSES' WINDOWS: on the floor where the light from the window's middle lands.
      const sun = new THREE.Vector3(...[built.cover.uniforms.uCvSun.value.x, built.cover.uniforms.uCvSun.value.y, built.cover.uniforms.uCvSun.value.z]);
      for (const o of spec.openings) {
        const room = plan.roomById.get(o.id.replace('-window', ''));
        // A window in a south wall: its plane is z = at, its spans x then y.
        const x0 = (o.lo[0] + o.hi[0]) / 2, y0 = (o.lo[1] + o.hi[1]) / 2;
        const t = (y0 - room.level - 0.3) / sun.y;
        const p = [x0 - sun.x * t, room.level + 0.3, o.at - sun.z * t];
        const inside = plan.volumeAt(p[0], p[2]) === room.vol;
        const c = built.cover.at(...p);
        if (!inside) bad.push(`${room.id}: its window's light lands outside the room at (${p[0].toFixed(1)}, ${p[2].toFixed(1)})`);
        else if (c.sun > 0.6) bad.push(`${room.id}: no sun reaches the floor from its window`);
      }
      const sp = world.spawn.pos;
      const out = built.cover.at(sp[0], sp[1], sp[2]);
      if (out.sun > 0 || out.sky > 0) bad.push('the spawn, on the north yard, is covered');
      let unpatched = 0;
      built.scene.traverse(o => { if (o.isMesh && o.material?.isMeshStandardMaterial && !o.material.userData.worldCover) unpatched++; });
      if (unpatched) bad.push(`${unpatched} meshes' materials never had the cover mask`);
      check(bad.length === 0, `the sun and at least half the sky are taken out of every room, passage, the adit and the gallery (${spec.boxes.length} boxes); the low sun lands on the gate houses' floors through ${spec.openings.length} windows; the open walk keeps all of it`, bad.join('\n         '));
    }

    /* THE WAY IS LED AND LIT. */
    {
      const edge = built.edgeColliders;
      const inEdge = (x, z) => edge.some(b => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
      const bad = [];
      for (const site of world.sites) {
        const way = built.routeTo(site.id, { x: world.spawn.pos[0], z: world.spawn.pos[2] });
        if (!way || way.length < 3) { bad.push(`${site.id}: the guide has no way along the barrage`); continue; }
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
        const d = plan.roomById.get(site.room).door.rect;
        if (!way.some(p => p[0] >= d.minX - 1 && p[0] <= d.maxX + 1 && p[1] >= d.minZ && p[1] <= d.maxZ)) bad.push(`${site.id}: the way does not go in by the room's door`);
      }
      // And back: from each bench to the next, and from the last up to the shelf.
      for (let i = 0; i < world.sites.length; i++) {
        const s = world.sites[i], next = world.sites[i + 1];
        const way = next ? built.routeTo(next.id, { x: s.approachPos[0], z: s.approachPos[2] }) : built.plan.routeTo(s.approachPos[0], s.approachPos[2], SPAWN[0], SPAWN[2]);
        for (let j = 0; j < way.length - 1; j++) {
          const [ax, az] = way[j], [bx, bz] = way[j + 1];
          const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az)));
          let off = null;
          for (let k = 0; k <= n && !off; k++) { const x = ax + (bx - ax) * (k / n), z = az + (bz - az) * (k / n); if (!walk.reachable(x, z, 0.5) || inEdge(x, z)) off = [x, z]; }
          if (off) { bad.push(`from ${s.id} ${next ? `to ${next.id}` : 'back to the north yard'}: the way leaves the walk at (${off.map(v => v.toFixed(1))})`); break; }
        }
      }
      check(bad.length === 0, 'the guide\'s way to every bench (and on to the next, and back to the north yard) stays on the walk, goes in by the room\'s door, and no metre of it is more than 12 m from a lamp', bad.join('\n         '));
    }

    /* THE COST, as `tools/perf-worlds.mjs` counts it. */
    {
      const again = new BrinewireWorld(null);
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
  const w3d = world3dFor('unit10');
  check(Boolean(w3d) && w3d.worldName === 'Brinewire' && w3d.key === 'brinewire', 'worlds3d.js registers unit10 as Brinewire', 'unit10 is not a walkable world in worlds3d.js');
  check(w3d && world.sites.every(s => w3d.siteForQuest(s.questId)?.id === s.id), 'every quest of the plan resolves to its site, live or not', 'a quest does not resolve to its site');
  check(w3d && w3d.siteForQuest('q9-nothing') === null && w3d.siteForQuest('boss-clamp') === null, 'a quest with no site (the boss, or one not charted) resolves to null, not an error', 'siteForQuest is not tolerant of a quest with no site');
  const voyageSrc = readFileSync(join(root, 'src/three/voyage.js'), 'utf8');
  check(/key:\s*'brinewire',\s*name:\s*'Brinewire',\s*hash:\s*'#\/learn\/unit10'/.test(voyageSrc), 'the voyage has a destination for Brinewire, landing on its Learn road', 'voyage.js has no Brinewire destination');
  const stageSrc = readFileSync(join(root, 'src/three/stage.js'), 'utf8');
  check(/key === "brinewire"/.test(stageSrc) && /enterBrinewireScene/.test(stageSrc) && /setBrinewireSiteComplete/.test(stageSrc) && /w === this\.brinewireWorld/.test(stageSrc), 'stage.js builds, enters, lights and recognises Brinewire', 'stage.js is missing part of Brinewire');
}

console.log(failures ? `\nBRINEWIRE FAILED (${failures})` : '\nBRINEWIRE OK');
process.exit(failures ? 1 : 0);
