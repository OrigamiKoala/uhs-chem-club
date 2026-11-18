#!/usr/bin/env node
/**
 * verify:quicklight — Quicklight (unit11), Learn world 11: the kinetics planners, and the refinery as a place
 * (`docs/plans/quicklight-world.md` section 7). The first build's script, which held the old flat plate of rigs, is in
 * `archive/2026-11-17/site-quicklight/tools/`.
 *
 * THE PLANNERS (kept from the first build): `ratedata.js` against values worked independently here.
 *
 * THE SAFETY RULES every walkable world is held to, held to this one (every check the first build had is here):
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE: the real `QuicklightWorld` is built in Node and every pair of bodies measured
 *    (tolerance 0.06 m); nothing is buried under the floor it stands on; the landmarks' footprints are disjoint.
 *  - All six benches have a host, every site names a quest the plan declares and has a quest module, says truly whether it
 *    is built, and its label is a signpost (`Bench N - ...`, six words at most).
 *  - Every site FACES ITS APPROACH, stands on a level floor with its lane, and its bench deploys onto a real plate under a
 *    lamp; every room has at least two lamps of its own.
 *  - THE PLAYER CAN WALK TO EVERY BENCH, to the pad and to the Flare's ground, and nowhere they should not: the ground is
 *    flood-filled from the spawn against the real colliders; no reachable cell drops off a ledge; every reachable cell is
 *    inside the walk (never a unit, a roof, a heap of earth, the bund's floor among the tanks or the lava outside the fence).
 *  - ONLY LAMPS ARE LIT (at most three real lights): every emissive material is a lamp's filament; the one other thing that
 *    gives light is the lightning, declared; no opaque material leaves the depth buffer unwritten.
 *  - A HOST STANDS INSIDE ITS OWN ROOM (its declared extent), under its roof, and furnishes it; the floor under it is level.
 *  - EVERY BENCH HOST HOLDS THE BAY and the leaned-in view at seven viewports (also measured by `verify:bench`).
 *  - THE FLARE'S GROUND IS THE ONE `boss-arena.js` NAMES, in the flare yard: open and level, the boss in view.
 *  - What moves (the lightning) is kept out of the bake; every landmark is built at T3; no player-facing string carries emoji;
 *    no sign stands in the refinery.
 *
 * THE SHAPE, which replaces the checks that held the old template (two columns of rigs either side of a spine road, the props
 * inside a 100 m disc, one lamp lane down one road, the open boss plaza at the road's end). These hold the numbers the site
 * spec declares, through `tools/lib/world-shape-checks.mjs`:
 *
 *  - two flows 5 m apart and three sunk floors under them; bench ground spans at least 8 m on at least four levels, in bench
 *    order along the way; all six benches housed, each R6 or better; every room at least 11.2 x 11 m with 4.4 m over the
 *    plate, no two the same size or built alike;
 *  - no bench stands on another world's bench coordinates; the benches are not on one circle and not in two columns;
 *  - NO PLATE CAN BE SEEN FROM THE SPAWN, and from each bench's mark no other plate;
 *  - ONE FLOOR: no reachable cell has a body less than 2.4 m over it;
 *  - A GRID OF ALLEYS UNDER PIPE RACKS: at least nine alleys meeting at at least eight junctions; most of every alley has a
 *    rack over it; from every alley at least three in five sightlines into the blocks beside it meet plant within 25 m at
 *    the eye (packed, not a plain; the rest pass under fin-fan banks and over pump rows);
 *  - INSIDE IS COVERED: at every bench the sun and at least half the sky are taken away; on the open walk nothing is;
 *  - THE WAY IS LED AND LIT: the guide's route to every bench stays on the walk, goes in by the room's door, and no metre of
 *    it is more than 12 m from a lamp;
 *  - the world costs at most 566 draws and 900k triangles.
 */

import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE, APPROACH, hostExtent, toWorld } from '../src/three/quicklight/host-plan.js';
import {
  makeRefineryPlan, WALK, ARENA, ROOMS, SPAWN, GRADE, PLOT, CELLAR, PIT, CAT, BUND, SCARP, land
} from '../src/three/quicklight/refinery-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/quicklight.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

/* ------------------------------------------------------------ the planners (kept) */

console.log('Quicklight data (ratedata.js planners)\n');
{
  const { planKineticsRun, planInitialRate, planPlotTransform, planMB, planFoe } = await import('../src/learn/engine/ratedata.js');
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

console.log(`\nQuicklight — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

const plan = makeRefineryPlan();
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
  check(p.length === 0, `the refinery plan is sound: ${plan.volumes.length} volumes, every door on its walk with a metre each side, every ramp 1 in 6 or gentler, no two volumes overlapping, every opening answered`, p.join('\n         '));
  const stale = world.refinery?.rooms?.length !== ROOMS.length || world.refinery.rooms.some((r, i) => r.id !== ROOMS[i].id || JSON.stringify(r.rect) !== JSON.stringify(plan.rooms[i].vol.rect))
    || world.refinery.volumes.length !== plan.volumes.length;
  check(!stale, 'world-data/quicklight.json is in step with refinery-plan.js', 'world-data/quicklight.json is out of step with refinery-plan.js: run tools/gen-quicklight-layout.mjs');

  const small = [];
  const shells = new Set();
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
    shells.add(room.shell);
  }
  if (new Set(world.sites.map(s => s.room)).size !== world.sites.length) small.push('two benches share a room');
  if (shells.size !== world.sites.length) small.push('two rooms are built alike');
  const sizes = new Set(plan.rooms.map(r => `${(r.vol.rect.maxZ - r.vol.rect.minZ).toFixed(1)}x${(r.vol.rect.maxX - r.vol.rect.minX).toFixed(1)}x${r.top}`));
  if (sizes.size !== plan.rooms.length) small.push('two rooms have the same size');
  check(small.length === 0, `${world.sites.length} benches, each in a room of its own (no two the same size or built alike), at least 11.2 x 11 m with 4.4 m over the plate, its plate and lane inside it`, small.join('\n         '));
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 20) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two benches are within 20 m of each other', near.join('; '));
  const b = plan.bounds;
  check(b.minX >= -WALK + 4 && b.maxX <= WALK - 4 && b.minZ >= -WALK + 4 && b.maxZ <= WALK - 4, `the walk stands inside the stage's square (x ${b.minX} to ${b.maxX}, z ${b.minZ} to ${b.maxZ})`, 'the walk reaches past the stage\'s bound');
  // THE LAND: the lower flow at grade, the upper flow 5 m over it beyond its front, three floors sunk under them.
  check(PLOT - GRADE === 5 && CELLAR < GRADE - 3 && PIT < GRADE - 3 && CAT < PLOT - 2.5 && land(0, SCARP.z0 - 3) === GRADE && Math.abs(land(40, SCARP.z1 + 3) - PLOT) < 1e-6,
    `two flows, the plot ${PLOT - GRADE} m over grade beyond the front at z ${SCARP.z0} to ${SCARP.z1}; floors sunk to ${CELLAR}, ${PIT} and ${CAT} m`,
    'the refinery\'s levels are wrong');
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit11-kinetics.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'((?:q\d+|boss)-[a-z]+)',\s*title:\s*["']([^"']+)["'][\s\S]*?status:\s*'(\w+)'/g)].map(m => ({ id: m[1], title: m[2], status: m[3] }));
const PLAN_QUESTS = ['q1-watch', 'q2-law', 'q3-time', 'q4-collide', 'q5-steps', 'q6-shortcut'];
{
  const siteQuests = world.sites.map(s => s.questId);
  check(world.sites.length === 6 && PLAN_QUESTS.every((q, i) => siteQuests[i] === q), 'six sites, one per bench of the plan, in teaching order', `sites name ${siteQuests.join(', ')}`);
  const missing = chartQuests.filter(q => !q.id.startsWith('boss') && !siteQuests.includes(q.id));
  check(missing.length === 0, 'every charted bench has a host on the ground, live or not', `charted benches with no site: ${missing.map(q => q.id).join(', ')}`);
  const invented = siteQuests.filter(q => !PLAN_QUESTS.includes(q));
  check(invented.length === 0, 'every site names a quest the plan declares', `sites naming quests that do not exist: ${invented.join(', ')}`);
  const stale = world.sites.filter(s => s.built !== existsSync(join(root, 'src/learn/quests/unit11', `${s.questId}.js`)));
  check(stale.length === 0, 'a site is built exactly when its quest has a module (rerun tools/gen-quicklight-layout.mjs when one lands)', `sites whose built flag disagrees with src/learn/quests/unit11: ${stale.map(s => s.id).join(', ')}`);
  const stateless = chartQuests.filter(q => q.status === 'live' && !q.id.startsWith('boss') && !world.sites.find(s => s.questId === q.id)?.built);
  check(stateless.length === 0, 'every live chart quest has its site built', `live quests whose site is sealed: ${stateless.map(q => q.id).join(', ')}`);
  // The labels are the first build's, unchanged: each names its bench, in six words or fewer.
  const off = [];
  for (const s of world.sites) {
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) off.push(`${s.id} reads "${s.label}", which does not start "${prefix}"`);
    if (s.label.split(/\s+/).length > 6 + 2) off.push(`${s.id}: "${s.label}" is longer than six words after its number`);
  }
  check(off.length === 0, 'every site label is a signpost, "Bench N - ...", in six words or fewer', off.join('\n         '));
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length && stages.every((v, i) => v === i + 1), 'site stage numbers run 1 to 6', 'site stage numbers are out of order');
  const badA = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(badA.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${badA.map(s => s.id).join(', ')}`);
  const order = world.sites.map(s => wayLength(s.approachPos[0], s.approachPos[2]));
  const inOrder = order.every((v, i) => i === 0 || v > order[i - 1]);
  check(inOrder, `the benches stand in bench order along the way (${order.map(v => v.toFixed(0)).join(', ')} m from the spawn)`, `bench order and walk order differ: ${order.map(v => v.toFixed(0)).join(', ')}`);
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
  const files = ['quicklight.js', 'quicklight/terrain.js', 'quicklight/stations.js', 'quicklight/plant.js', 'quicklight/refinery-plan.js', 'quicklight/atmosphere.js'];
  const lettered = files.filter(f => /placard\s*\(/.test(readFileSync(join(root, 'src/three', f), 'utf8')));
  check(lettered.length === 0, 'no sign stands in the refinery (no module letters a placard)', `placards in: ${lettered.join(', ')}`);

  const sp = world.spawn.pos;
  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(sp, l.pos) < l.radius + 0.5);
  check(!inProp && plan.volumeAt(sp[0], sp[2])?.id === 'yard' && Math.abs(sp[1] - (GRADE + 1.6)) < 1e-6, 'the player spawns on the laydown yard, at the eye, inside nothing', `spawn is inside ${inProp?.asset || 'something other than the laydown yard'}`);
  const nearest = Math.min(...world.sites.map(s => dist(sp, s.pos)));
  check(nearest < 60, `the first bench is ${nearest.toFixed(0)} m from the spawn`, `the nearest bench is ${nearest.toFixed(0)} m away: too far to find`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark');
}

/* ------------------------------------------------ the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-flare':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const worldId = m?.[1].match(/worldId:\s*'(\w+)'/)?.[1];
  const species = m?.[1].match(/species:\s*'([^']+)'/)?.[1];
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && worldId === 'unit11' && species === 'the flare' && same(player, world.arena.player) && same(boss, world.arena.boss) && same(boss, ARENA.boss),
    `the Flare is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Flare at ${boss.join(',')} / player ${player.join(',')}, but the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  delete globalThis.document;
  delete globalThis.window;
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { findOverlaps, collectBoxes, findBayIntrusions } = await import('./lib/overlap.mjs');
  const SHAPE = await import('./lib/world-shape-checks.mjs');
  const { consolidateStatic } = await import('../src/three/materials/pbr-kit.js');
  const { QuicklightWorld } = await import('../src/three/quicklight.js');

  let built = null;
  try { built = new QuicklightWorld(null); } catch (err) { fail(`QuicklightWorld threw while building: ${err.stack || err.message}`); }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 200, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built: something failed silently`);
    const kinds = new Set(built.landmarkNodes.map(n => n.lm.asset));
    check(world.landmarks.every(l => kinds.has(l.asset)), `every declared landmark kind is built (${[...kinds].join(', ')})`, 'a declared landmark was not built');

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out: there is an edge to fall off the world`);
    // THE REFINERY IN ITS LAND: the bund's floor 4 m down, the earth over both bunkers a metre and more over their roofs.
    {
      const bund = built.getTerrainHeight((BUND.minX + BUND.maxX) / 2 + 12, BUND.minZ + 1.5);
      const heaps = plan.rooms.filter(r2 => r2.mound).map(r2 => land((r2.vol.rect.minX + r2.vol.rect.maxX) / 2, (r2.vol.rect.minZ + r2.vol.rect.maxZ) / 2) - (r2.level + r2.top + 0.7));
      check(Math.abs(bund - PIT) < 1e-6 && heaps.every(h => h >= 1.0),
        `the bund's floor is ${(GRADE - bund).toFixed(1)} m down; the earth over the two bunkers stands ${heaps.map(h => h.toFixed(1)).join(' and ')} m over their roofs`,
        `the land round the rooms is wrong: bund ${bund.toFixed(2)}, earth over roofs ${heaps.map(h => h.toFixed(2)).join(', ')}`);
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

    /* ONLY LAMPS ARE LIT, and the lightning is the one declared source besides them. */
    const lampAt = built.lamps.map(m => m.getWorldPosition(new THREE.Vector3()));
    {
      const lit = new Set();
      const opaqueNoDepth = new Set();
      const basic = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
          if (m && !m.transparent && m.depthWrite === false && o !== built.sky) opaqueNoDepth.add(m);
          if (m && m.isMeshBasicMaterial && o !== built.sky) basic.add(m);
        }
      });
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material(s): the lamps' filament; nothing else in the refinery is lit`, `${strangers.length} emissive material(s) that are not a lamp's filament`);
      const weather = [...basic].filter(m => m.userData.weather === 'lightning');
      check(basic.size === weather.length && weather.length === 1, 'the lightning is the one unlit-bright body, and it is declared', `${basic.size} unlit materials, ${weather.length} of them the lightning`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight || o.isSpotLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30, `${built.lamps.length} lamps share ${realLights} real lights`, `${built.lamps.length} lamps and ${realLights} real lights: the lamp pool is not what keeps the frame cheap`);
      check(opaqueNoDepth.size === 0, 'no opaque material leaves the depth buffer unwritten', `${opaqueNoDepth.size} opaque material(s) set depthWrite false`);
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
      check(lo >= PIT - 0.01 && hi <= PLOT + 0.2, `the walk runs from ${lo.toFixed(2)} to ${hi.toFixed(2)} m: the bund's floor to the plot, nothing above or below`, `walkable ground at ${lo.toFixed(2)} to ${hi.toFixed(2)} m, outside the refinery's levels`);
      const off = walk.cells.filter(c => !plan.volumeAt(c[0], c[1]));
      check(off.length === 0, `every reachable cell is on the walk: no unit, roof, heap of earth, tank bund or lava can be stood on (the walk's walls are ${built.edgeColliders.length} colliders)`, `${off.length} reachable cell(s) off the walk, first at (${off[0]?.[0]}, ${off[0]?.[1]})`);
      const lost = plan.rooms.filter(r2 => !walk.reachable((r2.vol.rect.minX + r2.vol.rect.maxX) / 2, (r2.vol.rect.minZ + r2.vol.rect.maxZ) / 2, 4));
      check(lost.length === 0, `all ${plan.rooms.length} rooms are reached on foot`, `rooms nobody can walk into: ${lost.map(v => v.id).join(', ')}`);
      const unwalked = plan.openVols.filter(v => !walk.reachable((v.rect.minX + v.rect.maxX) / 2, (v.rect.minZ + v.rect.maxZ) / 2, 2));
      check(unwalked.length === 0, `every alley, ramp, court and yard (${plan.openVols.length}) is reached on foot`, `open walk nobody reaches: ${unwalked.map(v => v.id).join(', ')}`);
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
        const roofTop = { arch: room.top + 0.4, block: room.top + 1.0, cellar: room.top, skirt: 8.0, table: room.top + 0.5, magazine: room.top + 0.2 }[room.shell];
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          const bx = o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld));
          total.union(bx);
          if (bx.max.y > roofTop + 0.05 && !through) through = `${o.name || 'a part'} reaches ${(bx.max.y).toFixed(2)} m over the floor, through its roof`;
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

    /* THE FLARE'S GROUND. */
    {
      const A = world.arena;
      check(walk.reachable(A.player[0], A.player[2], 1.0) && walk.reachable(A.boss[0], A.boss[2], 1.0), "the Flare's ground and the player's mark in front of it are walkable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (walk.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Flare are open floor', 'something stands within seven metres of the Flare');
      const heights = [];
      for (let dx = -7; dx <= 7; dx += 1) for (let dz = -7; dz <= 7; dz += 1) heights.push(built.getTerrainHeight(A.boss[0] + dx, A.boss[2] + dz));
      check(plan.volumeAt(A.boss[0], A.boss[2])?.id === 'flare' && plan.volumeAt(A.player[0], A.player[2])?.id === 'flare' && Math.max(...heights) - Math.min(...heights) < 1e-6,
        'the Flare is fought in the flare yard, level for seven metres round', 'the arena is not in the flare yard, or not level');
      const bodies = SHAPE.bodiesOf(built);
      const ray = new THREE.Raycaster();
      const from = new THREE.Vector3(A.player[0], A.player[1], A.player[2]);
      const to = new THREE.Vector3(A.boss[0], A.boss[1] + 3, A.boss[2]);
      ray.set(from, to.clone().sub(from).normalize());
      ray.far = from.distanceTo(to) - 1;
      check(ray.intersectObjects(bodies, false).length === 0, 'nothing stands between the player\'s mark and the Flare', 'something blocks the view of the Flare');
    }

    /* WHAT MOVES: the lightning, kept out of the bake; it strikes, and the sky and the fill rise with it. */
    {
      const L = built.lightning;
      const bolts = L.group.children.filter(o => o.isMesh);
      let shown = 0, peak = 0;
      const base = built.hemi.intensity;
      for (let t = 0; t < 60; t += 0.02) {
        L.update(t);
        if (bolts.some(b => b.visible)) shown++;
        peak = Math.max(peak, built.hemi.intensity - base);
      }
      L.update(0);
      check(bolts.length >= 6 && L.group.userData.noMerge && L.group.userData.phys === 'ambient' && shown > 0 && peak > 0.3 && Math.abs(built.hemi.intensity - base) < 1e-6,
        `${bolts.length} bolts to the rod pylons, ${Math.round(shown * 0.02 / 60 * 100)}% of the time one is showing; the fill rises ${peak.toFixed(2)} with a strike and falls back`,
        `the lightning is missing, baked or never strikes (${bolts.length} bolts, ${shown} frames shown, peak ${peak.toFixed(2)})`);
    }

    /* EVERY BENCH HOST HOLDS THE BAY, and the leaned-in view from each. */
    {
      const BAY = await import('../src/three/bench-bay.js');
      const { planLeanIn, PLATE_ZONE } = await import('../src/learn/engine/lean.js');
      const { sightBlockers, behindCover } = await import('./lib/lean-check.mjs');
      const VIEWPORTS = [['ultrawide', 2560, 1080], ['16:9', 1920, 1080], ['16:10', 1680, 1050], ['3:2', 1440, 960], ['4:3', 1280, 960], ['phone landscape', 812, 375], ['small phone', 667, 375]];
      const proto = QuicklightWorld.prototype;
      const baked = proto.bakeStatics;
      proto.bakeStatics = function () { /* bodies stay identifiable for this check */ };
      let w;
      try { w = new QuicklightWorld(null); } finally { proto.bakeStatics = baked; }
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
      check(g.span >= 8 - 1e-6, `bench ground runs from ${g.lo.toFixed(2)} to ${g.hi.toFixed(2)} m: a span of ${g.span.toFixed(2)} m`, `bench ground spans only ${g.span.toFixed(2)} m (the spec holds 8)`);
      const levels = new Set(g.heights.map(h => h.toFixed(1)));
      check(levels.size >= 4, `the benches stand on ${levels.size} different levels`, `the benches stand on only ${levels.size} levels (the spec holds 4)`);
      const rows = SHAPE.housing(built, THREE);
      const housed = rows.filter(r2 => r2.housed).length;
      check(housed === rows.length && rows.every(r2 => r2.closed >= 6), `${housed} of ${rows.length} benches are housed, each R6 or better (${rows.map(r2 => r2.code).join(' ')})`, `the spec holds every bench at R6 or better: ${rows.map(r2 => r2.code).join(' ')}`);
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

    /* A GRID OF ALLEYS UNDER PIPE RACKS, PACKED TIGHT. */
    {
      const alleys = plan.openVols.filter(v => v.kind === 'alley');
      const ids = new Set(alleys.map(v => v.id));
      let junctions = 0;
      for (const v of alleys) for (const o of v.openings) if (ids.has(o.to) && v.id < o.to) junctions++;
      check(alleys.length >= 9 && junctions >= 8, `${alleys.length} alleys meet at ${junctions} junctions: a grid, not a road`, `${alleys.length} alleys and ${junctions} junctions: not a grid`);
      const bodies = SHAPE.bodiesOf(built);
      const ray = new THREE.Raycaster();
      const covered = [], packed = [];
      for (const v of alleys) {
        const r2 = v.rect, alongX = r2.maxX - r2.minX > r2.maxZ - r2.minZ;
        const [a0, a1] = alongX ? [r2.minX, r2.maxX] : [r2.minZ, r2.maxZ];
        const mid = alongX ? (r2.minZ + r2.maxZ) / 2 : (r2.minX + r2.maxX) / 2;
        let n = 0, over = 0, sides = 0, closed = 0;
        // From 2.5 m in from each end: a sightline along a block's very corner skims its kerb, not into it.
        for (let a = a0 + 2.5; a < a1 - 2.4; a += 2) {
          const [x, z] = alongX ? [a, mid] : [mid, a];
          if (plan.volumeAt(x, z) !== v) continue;
          const y = built.getTerrainHeight(x, z);
          n++;
          ray.set(new THREE.Vector3(x, y + 2.5, z), new THREE.Vector3(0, 1, 0));
          ray.far = 9;
          if (ray.intersectObjects(bodies, false).length) over++;
          for (const s of [-1, 1]) {
            const d = alongX ? new THREE.Vector3(0, 0, s) : new THREE.Vector3(s, 0, 0);
            // A sightline out through a junction, a ramp's mouth or a door is down another walk, not into a block: not counted.
            const half = (alongX ? r2.maxZ - r2.minZ : r2.maxX - r2.minX) / 2;
            if (plan.volumeAt(x + d.x * (half + 1.0), z + d.z * (half + 1.0))) continue;
            ray.set(new THREE.Vector3(x, y + 1.8, z), d);
            ray.far = 25;
            sides++;
            if (ray.intersectObjects(bodies, false).length) closed++;
          }
        }
        covered.push([v.id, over / Math.max(1, n)]);
        packed.push([v.id, closed / Math.max(1, sides)]);
      }
      const bare = covered.filter(([, f]) => f < 0.6);
      check(bare.length === 0, `every alley runs under a rack (${covered.map(([id, f]) => `${id} ${Math.round(f * 100)}%`).join(', ')})`, `alleys with no rack over most of them: ${bare.map(([id, f]) => `${id} ${Math.round(f * 100)}%`).join(', ')}`);
      const open = packed.filter(([, f]) => f < 0.6);
      check(open.length === 0, `the units stand close along both sides of every alley (${packed.map(([id, f]) => `${id} ${Math.round(f * 100)}%`).join(', ')} of the sightlines from each alley into the blocks beside it meet plant within 25 m at the eye)`, `alleys with open ground along them: ${open.map(([id, f]) => `${id} ${Math.round(f * 100)}%`).join(', ')}`);
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
      for (const v of plan.openVols) {
        const r2 = v.rect, x = (r2.minX + r2.maxX) / 2, z = (r2.minZ + r2.maxZ) / 2;
        const c = built.cover.at(x, built.getTerrainHeight(x, z) + 1.6, z);
        if (c.sun > 0 || c.sky > 0) bad.push(`${v.id} is covered at its middle`);
      }
      const sp = world.spawn.pos;
      const out = built.cover.at(sp[0], sp[1], sp[2]);
      if (out.sun > 0 || out.sky > 0) bad.push('the spawn, on the laydown yard, is covered');
      let unpatched = 0;
      built.scene.traverse(o => { if (o.isMesh && o.material?.isMeshStandardMaterial && !o.material.userData.worldCover) unpatched++; });
      if (unpatched) bad.push(`${unpatched} meshes' materials never had the cover mask`);
      check(bad.length === 0, `the sun and at least half the sky are taken out of every room and passage (${spec.boxes.length} boxes); the open walk keeps all of it`, bad.join('\n         '));
    }

    /* THE WAY IS LED AND LIT. */
    {
      const edge = built.edgeColliders;
      const inEdge = (x, z) => edge.some(b => x > b.minX && x < b.maxX && z > b.minZ && z < b.maxZ);
      const bad = [];
      for (const site of world.sites) {
        const way = built.routeTo(site.id, { x: world.spawn.pos[0], z: world.spawn.pos[2] });
        if (!way || way.length < 3) { bad.push(`${site.id}: the guide has no way through the refinery`); continue; }
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
        const d = plan.roomById.get(site.room).doorVol.rect;
        if (!way.some(p2 => p2[0] >= d.minX - 1 && p2[0] <= d.maxX + 1 && p2[1] >= d.minZ - 1 && p2[1] <= d.maxZ + 1)) bad.push(`${site.id}: the way does not go in by the room's door`);
      }
      for (let i = 0; i < world.sites.length; i++) {
        const s = world.sites[i], next = world.sites[i + 1];
        const way = next ? built.routeTo(next.id, { x: s.approachPos[0], z: s.approachPos[2] }) : built.plan.routeTo(s.approachPos[0], s.approachPos[2], ARENA.player[0], ARENA.player[2]);
        for (let j = 0; j < way.length - 1; j++) {
          const [ax, az] = way[j], [bx, bz] = way[j + 1];
          const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az)));
          let off = null, dark = null;
          for (let k = 0; k <= n; k++) {
            const x = ax + (bx - ax) * (k / n), z = az + (bz - az) * (k / n);
            if (!off && (!walk.reachable(x, z, 0.5) || inEdge(x, z))) off = [x, z];
            if (!dark && !lampAt.some(q => Math.hypot(q.x - x, q.z - z) <= 12)) dark = [x, z];
          }
          if (off) { bad.push(`from ${s.id} ${next ? `to ${next.id}` : 'to the flare yard'}: the way leaves the walk at (${off.map(v => v.toFixed(1))})`); break; }
          if (dark) { bad.push(`from ${s.id} ${next ? `to ${next.id}` : 'to the flare yard'}: dark at (${dark.map(v => v.toFixed(1))})`); break; }
        }
      }
      check(bad.length === 0, 'the guide\'s way to every bench (and on to the next, and on to the flare yard) stays on the walk, goes in by the room\'s door, and no metre of it is more than 12 m from a lamp', bad.join('\n         '));
    }

    /* THE COST, as `tools/perf-worlds.mjs` counts it. */
    {
      const again = new QuicklightWorld(null);
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
  const w3d = world3dFor('unit11');
  check(Boolean(w3d) && w3d.worldName === 'Quicklight' && w3d.key === 'quicklight', 'worlds3d.js registers unit11 as Quicklight', 'unit11 is not a walkable world in worlds3d.js');
  check(w3d && world.sites.every(s => w3d.siteForQuest(s.questId)?.id === s.id), 'every quest of the plan resolves to its site, live or not', 'a quest does not resolve to its site');
  check(w3d && w3d.siteForQuest('q9-nothing') === null && w3d.siteForQuest('boss-flare') === null, 'a quest with no site (the boss, or one not charted) resolves to null, not an error', 'siteForQuest is not tolerant of a quest with no site');
  const voyageSrc = readFileSync(join(root, 'src/three/voyage.js'), 'utf8');
  check(/key:\s*'quicklight',\s*name:\s*'Quicklight',\s*hash:\s*'#\/learn\/unit11'/.test(voyageSrc), 'the voyage has a destination for Quicklight, landing on its Learn road', 'voyage.js has no Quicklight destination');
  const stageSrc = readFileSync(join(root, 'src/three/stage.js'), 'utf8');
  check(/key === "quicklight"/.test(stageSrc) && /enterQuicklightScene/.test(stageSrc) && /setQuicklightSiteComplete/.test(stageSrc) && /w === this\.quicklightWorld/.test(stageSrc), 'stage.js builds, enters, lights and recognises Quicklight', 'stage.js is missing part of Quicklight');
}

console.log(failures ? `\nQUICKLIGHT FAILED (${failures})` : '\nQUICKLIGHT OK');
process.exit(failures ? 1 : 0);
