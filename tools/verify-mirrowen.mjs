#!/usr/bin/env node
/**
 * verify-mirrowen.mjs — Integrity and world-shape check of Mirrowen, Learn world 06's harbour.
 *
 * Holds the rebuilt site (`docs/plans/mirrowen-world.md`, "Site rebuild (2026-11-18)") to every safety
 * rule the world had and to `docs/plans/world-distinction-plan.md` section 3 through
 * `tools/lib/world-shape-checks.mjs`:
 *
 *  - THE PLAN: volumes do not overlap, every doorway is declared from both sides on one plane with one floor,
 *    every room is at least 11.2 x 11 m with 5.2 m of headroom, the ground volumes' floors span 7 m and more
 *  - NO TWO THINGS OCCUPY THE SAME SPACE (`overlap.mjs`, 0.06 m), NO BODY IS BURIED, no round landmark turned
 *  - WORLD SHAPE: bench ground spans >= 3 m (spec 8.2), >= 6 of 7 benches housed, no cloned coordinates, not
 *    one circle, not two columns, <= 2 plates in view from the spawn (spec none), a single floor
 *  - THE WALK: flood fill from the spawn reaches every approach, the pad and the Undertow's ground with no
 *    ledge; every reachable cell is inside a declared walk volume (nobody reaches the water, the ice, a roof,
 *    the bank or a hull's closed deck); the lowest reachable ground is the dry dock's floor
 *  - THE WATER: one level sheet, never inside a hull or the dock; the canal and the sea are ice
 *  - COVER AND LAMPS: every room under the shared cover mask; only lamps lit; three pooled lights; a lamp over
 *    every plate; the guide routes from the spawn through the doorways to every bench
 *  - THE BOSS: agrees with `BOSS_ARENA_SPOTS['boss-undertow']`, seven metres clear, the frozen sea behind it
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/mirrowen/host-plan.js';
import {
  makeHarbourPlan, ROOMS, sitePlacement, ARENA, SPAWN, DOCK, ICE, WATER, HULLS, DOCK_PIT
} from '../src/three/mirrowen/harbour-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { installDomShim } = await import('./lib/dom-shim.mjs');
installDomShim({ tier: 'T4' });
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/mirrowen.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Mirrowen — ${world.name}, the harbour\n`);

/* ------------------------------------------------------------------ the plan */

const plan = makeHarbourPlan();
{
  const V = plan.volumes;
  const clash = [];
  for (let i = 0; i < V.length; i++) for (let j = i + 1; j < V.length; j++) {
    const a = V[i].rect, b = V[j].rect;
    if (a.minX < b.maxX - 1e-6 && a.maxX > b.minX + 1e-6 && a.minZ < b.maxZ - 1e-6 && a.maxZ > b.minZ + 1e-6) clash.push(`${V[i].id} / ${V[j].id}`);
  }
  check(clash.length === 0, `${V.length} walk volumes, none overlapping another`, `volumes overlap: ${clash.join(', ')}`);

  const plane = (v, side) => v.rect[side];
  const opp = { minX: 'maxX', maxX: 'minX', minZ: 'maxZ', maxZ: 'minZ' };
  const bad = [];
  let doors = 0;
  for (const v of V) for (const o of v.openings) {
    if (!o.to) continue;
    doors++;
    const w = plan.byId.get(o.to);
    if (!w) { bad.push(`${v.id} opens onto missing ${o.to}`); continue; }
    const back = w.openings.find(q => q.to === v.id && q.side === opp[o.side] && Math.abs(q.lo - o.lo) < 1e-6 && Math.abs(q.hi - o.hi) < 1e-6);
    if (!back) bad.push(`${v.id} -> ${o.to} is not declared back`);
    if (Math.abs(plane(v, o.side) - plane(w, opp[o.side])) > 1e-6) bad.push(`${v.id} -> ${o.to} on two planes`);
    const mid = (o.lo + o.hi) / 2, p = plane(v, o.side);
    const [x, z] = o.side === 'minX' || o.side === 'maxX' ? [p, mid] : [mid, p];
    if (Math.abs(plan.floorOf(v, x, z) - plan.floorOf(w, x, z)) > 0.05) bad.push(`${v.id} -> ${o.to} steps at the doorway`);
    if (o.hi - o.lo < 3.9) bad.push(`${v.id} -> ${o.to} is only ${(o.hi - o.lo).toFixed(1)} m wide`);
  }
  check(bad.length === 0, `${doors / 2} doorways, each declared from both sides on one plane, level across, at least 3.9 m wide`, bad.join('\n         '));

  const small = ROOMS.filter(r => r.rect.maxX - r.rect.minX < 11.2 || r.rect.maxZ - r.rect.minZ < 11 || r.top < 5.2);
  check(small.length === 0, 'every room is at least 11.2 x 11 m with 5.2 m to its roof', `rooms too small: ${small.map(r => r.id).join(', ')}`);
  const hulled = ROOMS.filter(r => r.hull).map(r => r.id);
  check(hulled.length === 4, `${hulled.length} rooms are aboard ships (${hulled.join(', ')})`, `${hulled.length} rooms aboard ships, not four`);
  const shells = new Set(ROOMS.map(r => r.shell));
  check(shells.size === ROOMS.length, `${shells.size} rooms, no two built alike`, 'two rooms share a shell');
  const floors = plan.groundVols.map(v => v.floor.y0).concat(plan.groundVols.filter(v => v.floor.y1 !== undefined).map(v => v.floor.y1));
  check(Math.max(...floors) - Math.min(...floors) >= 7, `the ground volumes run from ${Math.min(...floors)} to ${Math.max(...floors)} m`, 'the ground is flat');
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit06-states-of-matter.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*["']([^"']+)["']/g)].map(m => ({ id: m[1], title: m[2] }));
{
  const questIds = chartQuests.map(q => q.id);
  check(questIds.length === 7, `unit06 charts ${questIds.length} benches`, `the unit06 chart lists ${questIds.length} benches, not seven`);
  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => !siteQuests.includes(q));
  check(missing.length === 0, 'every unit06 bench has a site on the ground', `quests with no site: ${missing.join(', ')}`);
  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `unknown quests: ${invented.join(', ')}`);
  check(world.sites.every(s => s.built === true), 'every site is built', 'a site is not built');
  const order = world.sites.every((s, i) => s.stage === i + 1 && s.questId === questIds[i] && s.id === `site-${i + 1}`);
  check(order, 'sites are keyed by bench order: site-N is Bench N', 'a site is out of bench order');
  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  const off = [];
  for (const s of world.sites) {
    const q = chartQuests.find(x => x.id === s.questId);
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) { off.push(`${s.id} reads "${s.label}"`); continue; }
    const words = s.label.slice(prefix.length).split(/\s+/).map(stem).filter(w => w.length >= 3);
    const title = new Set((q?.title || '').split(/\s+/).map(stem));
    if (!words.some(w => title.has(w))) off.push(`${s.id} reads "${s.label}", which shares no word with "${q?.title}"`);
  }
  check(off.length === 0, 'every site label names its bench by what it teaches', off.join('\n         '));
  const hosts = ['deckhouse', 'pump-room', 'pump-well', 'hold', 'thaw-shed', 'salt-store', 'evaporator-flat'];
  check(world.sites.every((s, i) => s.structure === hosts[i]), 'the seven hosts are the deckhouse, pump room, pump well, hold, thaw shed, salt store and evaporator flat', 'a site names the wrong host');
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique', 'two sites claim the same stage number');
  const bad = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(bad.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${bad.map(s => s.id).join(', ')}`);
  const placed = world.sites.filter((s, i) => JSON.stringify(sitePlacement(ROOMS[i]).pos) !== JSON.stringify(s.pos));
  check(placed.length === 0, 'every site stands where its room in harbour-plan.js puts it', `sites off their rooms: ${placed.map(s => s.id).join(', ')}`);
  const crowd = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) if (dist(world.sites[i].pos, world.sites[j].pos) < 8) crowd.push(`${world.sites[i].id}/${world.sites[j].id}`);
  check(crowd.length === 0, 'no two sites are within 8 m of each other', crowd.join(', '));
}

/* -------------------------------------------------------------- tier parity */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  check(t4Only.length > 0, `${t4Only.length} landmarks are T4 decoration`, 'no T4 decoration declared');
  const blocked = [];
  for (const s of world.sites) for (const l of world.landmarks) if (l.asset !== 'landing-pad' && dist(s.approachPos, l.pos) < l.radius + 0.5) blocked.push(`${s.id} by ${l.asset}`);
  check(blocked.length === 0, 'no landmark stands on an approach mark', blocked.join(', '));
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a T2 still camera', 'a site has no T2 still camera');
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) for (let j = i + 1; j < L.length; j++) {
    if (L[i].asset === 'landing-pad' || L[j].asset === 'landing-pad') continue;
    const d = dist(L[i].pos, L[j].pos), need = L[i].radius + L[j].radius;
    if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] / ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}]`);
  }
  check(clashes.length === 0, `${L.length} landmarks, every footprint disjoint`, clashes.join('\n         '));
}

/* ---------------------------------------------------------------- the words */

{
  const WITHHELD = ['dispersion', 'dipole', 'hydrogen bond', 'molarity', 'dilution', 'chromatography', 'miscible', 'heating curve', 'vaporization', 'fusion', 'polarizab'];
  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  const bad = [];
  for (const str of strings) for (const word of WITHHELD) if (new RegExp(word, 'i').test(str)) bad.push(`"${str}" contains "${word}"`);
  check(bad.length === 0, `${strings.length} player-facing strings withhold the vocabulary`, bad.join('\n         '));
  check(!strings.some(s => /\p{Extended_Pictographic}/u.test(s)), 'the world is emoji-free', 'emoji in a world string');
  const tooLong = world.sites.filter(s => s.label.split(/\s+/).length > 6).map(s => s.label);
  check(tooLong.length === 0, 'every site label is short enough to read at a glance', tooLong.join(', '));
  const files = ['mirrowen.js', 'mirrowen/plant.js', 'mirrowen/stations.js', 'mirrowen/kit.js', 'mirrowen/effects.js', 'mirrowen/terrain.js', 'mirrowen/harbour-plan.js'];
  const signs = files.filter(f => /\bplacard\b|\bsign\(/.test(readFileSync(join(root, 'src/three', f), 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')));
  check(signs.length === 0, 'no builder stands a sign in the world', `a sign is built in: ${signs.join(', ')}`);
}

/* -------------------------------------------------------------------- spawn */

{
  const spawn = world.spawn;
  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp, 'the player does not spawn inside anything', `spawn is inside ${inProp?.asset}`);
  const nearest = Math.min(...world.sites.map(s => dist(spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)} m from the spawn`, `the nearest site is ${nearest.toFixed(0)} m away`);
  const [sx, sz] = world.terrain.size;
  const outside = world.landmarks.filter(l => Math.abs(l.pos[0]) > sx / 2 || Math.abs(l.pos[2]) > sz / 2);
  check(outside.length === 0, 'every landmark stands on the terrain', outside.map(l => l.asset).join(', '));
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on, on the town terrace', 'no landing-pad landmark');
  const lanterns = world.landmarks.filter(l => l.asset === 'lamp-post').length;
  check(lanterns >= 20, `${lanterns} work lamps mark the quays`, `only ${lanterns} work lamps`);
}

/* ------------------------------------------------------- the registration */

{
  const { world3dFor } = await import('../src/learn/worlds3d.js');
  const w = world3dFor('unit06');
  check(Boolean(w) && w.key === 'mirrowen' && w.worldName === 'Mirrowen' && Boolean(w.data), 'worlds3d.js registers unit06 as Mirrowen', 'worlds3d.js does not register unit06 as Mirrowen');
  check(w && world.sites.every(s => w.siteForQuest(s.questId)?.id === s.id), 'every quest finds its site through worlds3d.js', 'a quest cannot find its site');
  const voyage = readFileSync(join(root, 'src/three/voyage.js'), 'utf8');
  check(/mirrowen:\s*\{\s*key: 'mirrowen', name: 'Mirrowen', hash: '#\/learn\/unit06'/.test(voyage), 'the voyage flies to Mirrowen and lands on #/learn/unit06', 'voyage.js has no Mirrowen destination');
  const stage = readFileSync(join(root, 'src/three/stage.js'), 'utf8');
  check(/new MirrowenWorld\(this\.renderer\)/.test(stage) && /enterMirrowenScene/.test(stage) && /w === this\.mirrowenWorld/.test(stage) && /setMirrowenSiteComplete/.test(stage) && /key === "mirrowen"\) return MIRROWEN_EXPOSURE/.test(stage),
    'stage.js builds, enters, warms and lights Mirrowen like the other Learn worlds', 'stage.js is missing a Mirrowen hook');
  const inst = readFileSync(join(root, 'src/learn/engine/instruments.js'), 'utf8');
  const need = [...chartQuests.map(q => q.id), 'boss-undertow'].filter(id => !inst.includes(`'${id}'`));
  check(need.length === 0, 'every Mirrowen bench and the Undertow are on the built-bench list', `instruments.js does not list: ${need.join(', ')}`);
}

/* ------------------------------------------- the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-undertow':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && same(player, world.arena.player) && same(boss, world.arena.boss) && same(boss, ARENA.boss) && /worldId:\s*'unit06'/.test(m[1]) && /species:\s*'the undertow'/.test(m[1]),
    `the Undertow is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Undertow at ${boss.join(',')} / ${player.join(',')}, the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const THREE = await import('three');
  const { MirrowenWorld } = await import('../src/three/mirrowen.js');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const S = await import('./lib/world-shape-checks.mjs');

  let built = null;
  try {
    built = new MirrowenWorld(null);
  } catch (err) {
    check(false, 'the world builds', `MirrowenWorld threw: ${err.stack || err.message}`);
  }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 250, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out`);
    check(tb.max.y > 40, `the hills round the harbour stand ${Math.round(tb.max.y)} m high`, 'no hills round the harbour');

    /* THE WATER: one level sheet over the sea bed; never in a hull or the dock. The canal and the sea are ice. */
    {
      const wm = built.waterMesh;
      check(wm?.userData.phys === 'ground' && Math.abs(wm.position.y - WATER) < 1e-6, `the water lies level at ${WATER} m`, 'the water is missing or not level');
      const p = wm.geometry.attributes.position;
      const idx = wm.geometry.index;
      let inside = 0;
      for (let t = 0; t < idx.count; t += 3) {
        let cx = 0, cz = 0;
        for (let k = 0; k < 3; k++) { cx += p.getX(idx.getX(t + k)) / 3; cz += p.getZ(idx.getX(t + k)) / 3; }
        if (HULLS.some(h => cx > h.rect.minX && cx < h.rect.maxX && cz > h.rect.minZ && cz < h.rect.maxZ) || (cx > DOCK_PIT.minX && cx < DOCK_PIT.maxX && cz > DOCK_PIT.minZ && cz < DOCK_PIT.maxZ)) inside++;
      }
      check(inside === 0, `${idx.count / 3} water triangles, none inside a hull's body or the dry dock`, `${inside} water triangles lie inside a hull or the dock`);
      check(Math.abs(built.getTerrainHeight(-80, -38) - ICE) < 0.05 && Math.abs(built.getTerrainHeight(-200, -50) - ICE) < 2.5, 'the canal behind the lock is frozen', 'the canal is not ice');
      check(built.getTerrainHeight(0, -20) < WATER - 5, 'the basin is deep water', 'the basin is shallow');
      check(Math.abs(built.getTerrainHeight(62, -100) - ICE) < 0.05, 'the frozen sea lies behind the Undertow', 'no sea ice behind the boss');
      check(built.getTerrainHeight(20, -80) === DOCK && DOCK < WATER - 4, `the dry dock's floor lies ${(WATER - DOCK).toFixed(1)} m below the water`, 'the dry dock is not below the water');
      for (const h of HULLS) {
        const c = [(h.rect.minX + h.rect.maxX) / 2, (h.rect.minZ + h.rect.maxZ) / 2];
        const out = [[h.rect.minX - 2, c[1]], [h.rect.maxX + 2, c[1]], [c[0], h.rect.minZ - 2], [c[0], h.rect.maxZ + 2]].filter(([x, z]) => !plan.volumeAt(x, z) && !plan.hullAt(x, z));
        const wet = out.every(([x, z]) => built.getTerrainHeight(x, z) <= ICE + 0.05);
        check(wet, `the ${h.id} lies in the water or the ice`, `the ${h.id} stands on land`);
      }
    }

    /* WORLD SHAPE (world-distinction-plan.md section 3) */
    {
      const bg = S.benchGround(built);
      check(bg.span >= 3, `bench ground spans ${bg.span.toFixed(2)} m (${bg.lo.toFixed(2)} to ${bg.hi.toFixed(2)} m)`, `bench ground spans only ${bg.span.toFixed(2)} m`);
      const hs = S.housing(built, THREE);
      const housed = hs.filter(h => h.housed).length;
      check(housed >= 6, `${housed}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`, `only ${housed}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`);
      const clones = S.sharedLayout(world);
      check(clones.length === 0, 'no bench coordinates shared with any other world', `shares layout with: ${clones.join(', ')}`);
      check(!S.oneCircle(world), 'the benches are not on one circle', 'the benches lie on one circle');
      check(!S.twoColumns(world), 'the benches are not in two straight columns', 'the benches lie in two columns');
      const seen = S.platesInView(built, THREE, world.spawn.pos);
      check(seen.length <= 2, `${seen.length} plate(s) in view from the spawn (at most 2)`, `plates in view from the spawn: ${seen.join(', ')}`);
    }

    /* THE AIR MOVES */
    {
      check(built.vents.length + built.hostVents.length + (world.vents || []).length >= 4, `${built.hostVents.length + (world.vents || []).length} plumes rise off the funnels, the chimney and the thaw shed`, 'the harbour breathes fewer than four plumes');
      const scanners = built.movers.filter(o => o.userData.mover.kind === 'yaw');
      check(scanners.length >= 1, `${scanners.length} radar scanner turns over the ice-breaker`, 'nothing turns in the harbour');
      const before = scanners[0]?.rotation.y;
      built.update(0.5, new THREE.Vector3(...world.spawn.pos));
      check(scanners[0] && scanners[0].rotation.y !== before, 'the scanner turns when the world updates', 'the scanner did not turn');
      let threw = null;
      const eye = new THREE.Vector3(...world.spawn.pos);
      try { for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw, 'a frame updates with the eye handed in as a position', `update threw: ${threw?.message}`);
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'the sky dome follows the eye', 'the sky dome did not follow the eye');
    }

    /* OVERLAPS */
    {
      const hits = findOverlaps(built.scene, { tolerance: 0.06, label: owner => owner.name || `${owner.type}#${owner.id}` });
      const pairs = new Map();
      for (const h of hits) {
        const key = [h.a, h.b].sort().join(' <-> ');
        if (!pairs.has(key) || pairs.get(key).depth < h.depth) pairs.set(key, h);
      }
      check(pairs.size === 0, `no two bodies share space — ${meshes} meshes measured`,
        `bodies occupy the same space:\n${[...pairs.entries()].map(([k, h]) => `         ${h.depth.toFixed(2)}m  ${k}  at ${h.at.join(', ')}`).join('\n')}`);
      const turned = built.landmarkNodes.filter(({ lm, node }) => ['ice-wall', 'bollard'].includes(lm.asset) && Math.abs(node.rotation.y) > 1e-9);
      check(turned.length === 0, 'no round landmark is turned as a group', `${turned.length} round landmarks are turned as a group`);
    }

    /* NOTHING IS BURIED */
    {
      const buried = [];
      const EXEMPT = new Set(['ground', 'ambient']);
      const tagOf = o => { for (let n = o; n; n = n.parent) if (n.userData?.phys) return n.userData.phys; return null; };
      const ownerName = o => { let n = o; while (n.parent && n.parent !== built.scene) n = n.parent; return n.name || n.type; };
      const test = (box, o) => {
        if (box.isEmpty() || box.getSize(new THREE.Vector3()).lengthSq() < 1e-8) return;
        const c = box.getCenter(new THREE.Vector3());
        const ground = built.getTerrainHeight(c.x, c.z);
        if (box.max.y < ground - 0.3 && buried.length < 10) buried.push(`${ownerName(o)}: tops out at ${box.max.y.toFixed(2)} under ground at ${ground.toFixed(2)}`);
      };
      built.scene.traverse(o => {
        if (!o.isMesh || EXEMPT.has(tagOf(o))) return;
        if (o.userData.partBoxes?.length) { for (const pb of o.userData.partBoxes) test(pb.clone().applyMatrix4(o.matrixWorld), o); return; }
        if (o.parent?.userData?.partBoxes?.length && o.userData.ownGeometry) { for (const pb of o.parent.userData.partBoxes) test(pb.clone().applyMatrix4(o.parent.matrixWorld), o); return; }
        if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
        test(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld), o);
      });
      check(buried.length === 0, 'no body is buried under the ground it stands on', buried.join('\n         '));
    }

    /* ONLY LAMPS ARE LIT; EVERY ROOM IS COVERED; NO OPAQUE MATERIAL SKIPS THE DEPTH BUFFER */
    {
      const lit = new Set();
      const noDepth = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh || o === built.sky) return;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
          if (m && !m.transparent && m.depthWrite === false) noDepth.add(m);
        }
      });
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material: the work lamps; nothing else is lit`, `${strangers.length} other emissive material(s)`);
      check(noDepth.size === 0, 'no opaque material sets depthWrite: false', `${noDepth.size} opaque material(s) skip the depth buffer`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30, `${built.lamps.length} lamps share ${realLights} pooled lights`, `${built.lamps.length} lamps and ${realLights} PointLights`);
      const uncovered = world.sites.filter(s => { const cv = built.cover.at(s.pos[0], s.pos[1] + 1.0, s.pos[2]); return cv.sun < 0.9 || cv.sky < 0.5; });
      check(uncovered.length === 0, `all ${world.sites.length} rooms are under the shared cover mask`, `uncovered rooms: ${uncovered.map(s => s.id).join(', ')}`);
      const passages = plan.roofedVols.filter(v => v.kind === 'passage').filter(v => {
        const cx = (v.rect.minX + v.rect.maxX) / 2, cz = (v.rect.minZ + v.rect.maxZ) / 2;
        const cv = built.cover.at(cx, plan.floorOf(v, cx, cz) + 1.0, cz);
        return cv.sun < 0.9;
      });
      check(passages.length === 0, 'every companionway down into a hull is covered', `uncovered passages: ${passages.map(v => v.id).join(', ')}`);
    }

    /* EVERY SITE: FACES ITS APPROACH, PLATE ON ITS FLOOR, CASED INSTRUMENT, GUIDE ROUTE THROUGH ITS DOOR */
    for (const site of world.sites) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: reports a working surface`, `${site.id} has no bench anchor`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces its approach`, `${site.id}: wrong facing`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05, `${site.id}: plate at ${anchor.topY.toFixed(2)} on floor ${ground.toFixed(2)}`, `${site.id}: plate ${anchor.topY.toFixed(2)} vs floor ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet`);
      const route = built.routeTo(site.id, world.spawn.pos);
      const room = ROOMS.find(r => r.site === site.id);
      const door = plan.doorPoint(plan.byId.get(room.id), plan.byId.get(room.id).openings.find(o => o.to === room.door.to));
      const through = route.some(p => Math.hypot(p[0] - door[0], p[1] - door[1]) < 0.01);
      check(route.length >= 3 && through, `${site.id}: the guide routes through ${route.length - 2} doorways to the bench`, `${site.id}: the guide's route does not pass the room's door`);
    }

    /* HOST EXTENTS AND LEVEL FLOOR */
    {
      const off = [], uneven = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId)?.group;
        const hp = HOST_PLAN[site.id];
        if (!g || !hp) { off.push(`${site.id}: missing`); continue; }
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const total = new THREE.Box3();
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          if (o.userData.mover || o.parent?.userData?.mover) return;
          if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
          total.union(o.geometry.boundingBox.clone().applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld)));
        });
        const [x0, x1, z0, z1] = hp.extent;
        for (const [name, got, want, dir] of [['left', total.min.x, x0, -1], ['right', total.max.x, x1, 1], ['back', total.min.z, z0, -1], ['front', total.max.z, z1, 1]]) {
          if (dir * (got - want) > 0.25) off.push(`${site.id} outside ${name} by ${(dir * (got - want)).toFixed(2)} m`);
        }
        const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
        const c = Math.cos(a), sn = Math.sin(a);
        const at = (lx, lz) => [site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c];
        const hs = [];
        for (let lx = x0; lx <= x1; lx += 1.5) for (let lz = z0; lz <= LANE.to; lz += 1.5) { const [x, z] = at(lx, lz); hs.push(built.getTerrainHeight(x, z)); }
        if (Math.max(...hs) - Math.min(...hs) > 0.05) uneven.push(`${site.id} floor varies by ${(Math.max(...hs) - Math.min(...hs)).toFixed(2)} m`);
      }
      check(off.length === 0, 'every host stands inside its declared extent in host-plan.js', off.join('\n         '));
      check(uneven.length === 0, 'the floor under every host and its lane is dead level', uneven.join('\n         '));
    }

    /* A LAMP OVER EVERY PLATE */
    {
      const bad = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId).group;
        g.updateMatrixWorld(true);
        const inv = new THREE.Matrix4().copy(g.matrixWorld).invert();
        const over = built.lamps.some(m => {
          const p = new THREE.Vector3();
          m.getWorldPosition(p);
          p.applyMatrix4(inv);
          return Math.abs(p.x) < 2.4 && p.z > -1.4 && p.z < 1.0 && p.y > 2.4 && p.y < 4.2;
        });
        if (!over) bad.push(site.id);
      }
      check(bad.length === 0, `every bench (${world.sites.length}) has a pooled lamp over its plate`, `no lamp over: ${bad.join(', ')}`);
    }

    /* NO FIELD POINTS */
    {
      const { fieldPointsOf } = await import('../src/three/field-points.js');
      const points = fieldPointsOf(built);
      check(points.length === 0, 'no field point is registered', `field points: ${points.map(p => p.id).join(', ')}`);
    }

    /* THE WALK: FLOOD FILL, ONE FLOOR, NOBODY LEAVES THE QUAYS */
    {
      const f = S.flood(built, { bound: 100, cell: 0.5, radius: 0.25, step: 0.6 });
      check(f.ledges.length === 0, `${f.reached} cells of ground are walkable with no ledge`, `walkable ledges:\n         ${f.ledges.join('\n         ')}`);
      const lows = f.cells.map(c => c[2]);
      const minH = Math.min(...lows), maxH = Math.max(...lows);
      check(Math.abs(minH - DOCK) < 0.01 && maxH <= 5.2, `reachable ground spans ${minH.toFixed(2)} (the dock floor) to ${maxH.toFixed(2)} m (the terrace)`, `reachable ground leaked: ${minH.toFixed(2)} to ${maxH.toFixed(2)} m`);
      const strays = f.cells.filter(([x, z]) => !plan.volumeAt(x, z));
      check(strays.length === 0, 'every reachable cell is inside a declared walk volume: nobody reaches the water, the ice, a roof or a closed deck',
        `${strays.length} reachable cells lie outside the walk, first at (${strays[0]?.[0]}, ${strays[0]?.[1]})`);
      const low = S.lowBodies(built, THREE, f.cells, { every: 2 });
      check(low.length === 0, 'one floor: no body less than 2.4 m over reachable ground', `low bodies:\n         ${low.join('\n         ')}`);
      for (const site of world.sites) check(f.reachable(site.approachPos[0], site.approachPos[2], 1.2), `${site.id}: approach reachable from the spawn`, `${site.id}: unreachable`);
      const pad = world.landmarks.find(l => l.asset === 'landing-pad');
      check(f.reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the walk', 'the landing pad is walled off');
      const A = world.arena;
      check(f.reachable(A.player[0], A.player[2], 1.0) && f.reachable(A.boss[0], A.boss[2], 1.0), "the Undertow's ground and the player's mark are reachable", "the boss's ground is sealed off");
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (f.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Undertow are open ground', 'something stands within seven metres of the Undertow');
      const sp = world.spawn.pos;
      check(Math.abs(built.getTerrainHeight(sp[0], sp[2]) + 1.6 - sp[1]) < 0.05 && f.reachable(sp[0], sp[2], 0.5), 'the spawn stands on the terrace at eye height', 'the spawn is off the ground');
      check(SPAWN[0] === sp[0] && SPAWN[2] === sp[2], 'the spawn is the plan\'s', 'the JSON spawn and the plan disagree');
    }
  }
}

console.log('');
if (failures) {
  console.log(`MIRROWEN FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('MIRROWEN OK');
