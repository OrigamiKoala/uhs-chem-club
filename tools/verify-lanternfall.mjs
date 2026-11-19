#!/usr/bin/env node
/**
 * verify-lanternfall.mjs — Integrity and world-shape check of Lanternfall, Learn world 02: the glacier, the lake loop
 * and the ten rooms.
 *
 * Holds the rebuilt site (`docs/plans/lanternfall-world.md`, "Site rebuild (2026-11-18)") to every safety rule the
 * old script held (archived in `archive/2026-11-18/site-lanternfall/tools/`) and to `docs/plans/world-distinction-plan.md`
 * section 3 through `tools/lib/world-shape-checks.mjs`:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE: the declaration (every landmark footprint disjoint) and the world as built
 *    (`overlap.mjs`, 0.06 m); no body is buried under the ground it stands on
 *  - THE SITES: every unit02 quest has a site, every site a real quest, labels name their bench, stages unique, every
 *    bench faces its approach along an axis, T4 decoration strands nothing, T2 cameras and the T1 order agree
 *  - WORLD SHAPE: bench ground spans >= 3 m (spec: 15.4 m), >= 7 of 10 benches housed R4 or better (spec: 10), no
 *    bench coordinates shared with another world, not one circle, not two columns, <= 2 plates in view from the spawn
 *    (spec: 0), single floor (no body under 2.4 m over reachable ground)
 *  - THE WALK: flood fill from the spawn reaches every approach, the pad and the boss's ground with no ledge; every
 *    reachable cell is in a walk volume, so nobody reaches the lake, the glacier, a moraine, a roof or a hill top
 *  - THE LAND: a lake of level ice at 0 m, a glacier whose snout is a cliff of 12 m and more standing on it, the
 *    ground to the horizon
 *  - ROOMS: every room is under the shared cover mask; every host's machinery stands inside its room; the floor under
 *    every plate and its lane is dead level; a lamp hangs over every plate; the guide routes through the doors
 *  - ONLY LAMPS ARE LIT, three pooled lights; the Lantern-Eater's ground agrees with `boss-arena.js` and is open
 *  - No player-facing string carries withheld vocabulary, emoji or a long label
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/lanternfall/host-plan.js';
import { ROOMS, LAKE, GLACIER, DOME, WALL_T, lakeE } from '../src/three/lanternfall/glacier-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/lanternfall.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Lanternfall — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) {
      const need = L[i].radius + L[j].radius, d = dist(L[i].pos, L[j].pos);
      if (d < need) clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}] overlap by ${(need - d).toFixed(2)}u`);
    }
  }
  check(clashes.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);
  const near = [];
  for (let i = 0; i < world.sites.length; i++) for (let j = i + 1; j < world.sites.length; j++) {
    const d = dist(world.sites[i].pos, world.sites[j].pos);
    if (d < 8) near.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
  }
  check(near.length === 0, 'no two sites are within 8u of each other', `sites crowd each other:\n         ${near.join('\n         ')}`);
  const noPlan = world.sites.filter(s => HOST_PLAN[s.id]?.structure !== s.structure);
  check(noPlan.length === 0, 'every site names the structure host-plan.js builds for it', `sites whose structure disagrees with host-plan.js: ${noPlan.map(s => s.id).join(', ')}`);
  const roomless = world.sites.filter(s => !ROOMS.some(r => r.site === s.id && r.questId === s.questId && r.id === s.roomId));
  check(roomless.length === 0, 'every site stands in the room glacier-plan.js gives it', `sites with no room: ${roomless.map(s => s.id).join(', ')}`);
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit02-quantum.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*'([^']+)'/g)].map(m => ({ id: m[1], title: m[2] }));

{
  const questIds = chartQuests.map(q => q.id);
  const live = new Set([...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)]
    .map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id));
  check(questIds.length === 10, `unit02 charts ${questIds.length} quests`, `the unit02 chart lists ${questIds.length} quests, not ten`);
  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => live.has(q) && !siteQuests.includes(q));
  check(missing.length === 0, 'every built unit02 quest has a site on the ground', `quests with no site: ${missing.join(', ')}`);
  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `sites naming quests that do not exist: ${invented.join(', ')}`);
  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0, 'built sites are exactly the quests with a module', `built flag disagrees: ${wrong.map(s => s.id).join(', ')}`);
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
  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique', 'two sites claim the same stage number');
  const bad = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(bad.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${bad.map(s => s.id).join(', ')}`);
  const askew = world.sites.filter(s => Math.min(Math.abs(s.approachPos[0] - s.pos[0]), Math.abs(s.approachPos[2] - s.pos[2])) > 1e-6);
  check(askew.length === 0, 'every bench faces along an axis', `benches that do not face along an axis: ${askew.map(s => s.id).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  check(t4Only.length > 0, `${t4Only.length} landmarks are T4 decoration`, 'no T4 decoration declared');
  const blocked = [];
  for (const s of world.sites) for (const l of t4Only) if (dist(s.approachPos, l.pos) < l.radius + 1.5) blocked.push(`${s.id} by ${l.asset}`);
  check(blocked.length === 0, 'no T4 decoration stands near an approach (removing it strands nothing)', `approach marks crowded by T4 decoration:\n         ${blocked.join('\n         ')}`);
  check(JSON.stringify(world.t1.siteOrder) === JSON.stringify(world.sites.map(s => s.id)), 'the T1 site order is the bench order', 'the T1 site order disagrees with the sites');
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a still framing for the baked tier', 'a site has no T2 still camera');
}

/* ---------------------------------------------------------------- the words */

{
  const WITHHELD = ['nucleophile', 'electrophile', 'carbonyl', 'carbocation', 'alkyl', 'ester', 'epoxide', 'isopropyl'];
  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  const bad = [];
  for (const str of strings) for (const word of WITHHELD) if (new RegExp(`\\b${word}s?\\b`, 'i').test(str)) bad.push(`"${str}" contains "${word}"`);
  check(bad.length === 0, `${strings.length} player-facing strings withhold the vocabulary`, bad.join('\n         '));
  const emoji = strings.filter(s => /\p{Extended_Pictographic}/u.test(s));
  check(emoji.length === 0, 'the world is emoji-free', `emoji in: ${emoji.join(', ')}`);
  const tooLong = world.sites.filter(s => s.label.split(/\s+/).length > 6).map(s => s.label);
  check(tooLong.length === 0, 'every site label is short enough to read at a glance', `long labels: ${tooLong.join(', ')}`);
}

/* -------------------------------------------------------------------- spawn */

{
  const spawn = world.spawn;
  const inProp = world.landmarks.find(l => l.asset !== 'landing-pad' && dist(spawn.pos, l.pos) < l.radius + 0.5);
  check(!inProp, 'the player does not spawn inside anything', `spawn is inside ${inProp?.asset}`);
  const nearest = Math.min(...world.sites.map(s => dist(spawn.pos, s.pos)));
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the spawn`, `the nearest site is ${nearest.toFixed(0)}u away`);
  const [sx, sz] = world.terrain.size;
  const outside = world.landmarks.filter(l => Math.abs(l.pos[0]) > sx / 2 || Math.abs(l.pos[2]) > sz / 2);
  check(outside.length === 0, 'every landmark stands on the terrain', `landmarks off the edge: ${outside.map(l => l.asset).join(', ')}`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a pad to land on', 'no landing-pad landmark');
  const lanterns = world.landmarks.filter(l => l.asset === 'lantern-post').length;
  check(lanterns >= 30, `${lanterns} lantern posts light the loop and its spurs`, `only ${lanterns} lantern posts`);
}

/* ------------------------------------------- the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-eater':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && same(player, world.arena.player) && same(boss, world.arena.boss),
    `the Lantern-Eater is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Lantern-Eater at ${boss.join(',')} / player ${player.join(',')}, the world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { LanternfallWorld } = await import('../src/three/lanternfall.js');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const S = await import('./lib/world-shape-checks.mjs');

  let built = null;
  try {
    built = new LanternfallWorld(null);
  } catch (err) {
    check(false, 'the world builds', `LanternfallWorld threw: ${err.stack || err.message}`);
  }

  if (built) {
    const plan = built.plan;
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 150, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built`);

    /* THE LAND */
    {
      built.terrainMesh.geometry.computeBoundingBox();
      const tb = built.terrainMesh.geometry.boundingBox;
      const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
      check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `the ground ends ${Math.round(r)} m out`);
      const lp = built.lakeMesh?.geometry.attributes.position;
      let lo = Infinity, hi = -Infinity;
      for (let i = 0; i < (lp?.count || 0); i++) { lo = Math.min(lo, lp.getY(i)); hi = Math.max(hi, lp.getY(i)); }
      check(built.lakeMesh?.userData.phys === 'ground' && lp?.count > 100 && hi - lo < 1e-6 && Math.abs(hi - LAKE.ice) < 1e-6,
        `the lake is level ice at ${LAKE.ice.toFixed(1)} m, laid as ground (${lp?.count} vertices)`, 'the lake is missing, a body, or not level');
      const snoutTop = plan.landHeight((GLACIER.west + GLACIER.east) / 2, GLACIER.snout - 1);
      const snoutFoot = plan.landHeight((GLACIER.west + GLACIER.east) / 2, GLACIER.snout + 3);
      check(snoutTop - snoutFoot > 12, `the glacier ends in a cliff ${(snoutTop - snoutFoot).toFixed(1)} m high on the lake`, `the snout stands only ${(snoutTop - snoutFoot).toFixed(1)} m`);
      const faces = built.scene.getObjectByName('lanternfall-cut-faces');
      check(Boolean(faces) && faces.children.length >= 2, 'the walk is cut through moraine and through ice (faces of both)', 'no cut faces, or only one kind');
    }

    /* WORLD SHAPE (world-distinction-plan.md section 3) */
    {
      const bg = S.benchGround(built);
      check(bg.span >= 3, `bench ground spans ${bg.span.toFixed(2)} m (${bg.lo.toFixed(2)} to ${bg.hi.toFixed(2)} m)`, `bench ground spans only ${bg.span.toFixed(2)} m`);
      const hs = S.housing(built, THREE);
      const housed = hs.filter(h => h.housed).length;
      check(housed >= 7 && hs.every(h => h.roof && h.closed >= 3), `${housed}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`,
        `only ${housed}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`);
      const clones = S.sharedLayout(world);
      check(clones.length === 0, 'no bench coordinates shared with any other world', `shares layout with: ${clones.join(', ')}`);
      check(!S.oneCircle(world), 'benches are not on one circle', 'benches lie on one circle');
      check(!S.twoColumns(world), 'benches are not in two straight columns', 'benches lie in two columns');
      const seen = S.platesInView(built, THREE, world.spawn.pos);
      check(seen.length <= 2, `${seen.length} plate(s) in view from the spawn (<= 2)`, `too many plates in view from the spawn: ${seen.join(', ')}`);
    }

    /* FRAME UPDATE */
    {
      const eye = new THREE.Vector3(...world.spawn.pos);
      let threw = null;
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
        if (box.max.y < ground - 0.3 && buried.length < 10) buried.push(`${ownerName(o)}: tops out at ${box.max.y.toFixed(2)}u under ground at ${ground.toFixed(2)}u`);
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

    /* ONLY LAMPS ARE LIT, AND THE ROOMS ARE COVERED */
    {
      const lit = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
      });
      const strangers = [...lit].filter(m => m !== built.M.lantern);
      check(strangers.length === 0, `${lit.size} emissive material: the lanterns; nothing else is lit`, `${strangers.length} unexpected emissive material(s)`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 40, `${built.lamps.length} lamps share ${realLights} pooled PointLights`, `${built.lamps.length} lamps and ${realLights} PointLights`);
      const uncovered = world.sites.filter(s => {
        const cv = built.cover.at(s.pos[0], s.pos[1] + 1.0, s.pos[2]);
        const cvA = built.cover.at(s.approachPos[0], s.pos[1] + 1.6, s.approachPos[2]);
        return cv.sun < 0.9 || cv.sky < 0.5 || cvA.sun < 0.9;
      });
      check(uncovered.length === 0, `all ${world.sites.length} rooms are under the shared cover mask, at the plate and where the player stands`,
        `uncovered rooms: ${uncovered.map(s => s.id).join(', ')}`);
    }

    /* EVERY SITE: FACING, PLATE ON ITS FLOOR, A CASED INSTRUMENT, A GUIDE ROUTE THROUGH ITS DOOR */
    for (const site of world.sites.filter(s => s.built)) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: reports a working surface`, `${site.id} has no bench anchor`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces its approach`, `${site.id}: faces ${anchor.rotationY.toFixed(2)}, its approach is at ${want.toFixed(2)}`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05, `${site.id}: plate at ${anchor.topY.toFixed(2)}u on floor ${ground.toFixed(2)}u`, `${site.id}: plate ${anchor.topY.toFixed(2)} vs floor ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: the cased instrument can be opened`, `${site.id}: no dormant cabinet`);
      const route = built.routeTo(site.id, world.spawn.pos);
      const room = ROOMS.find(r => r.site === site.id);
      const throughDoor = route.some(([x, z]) => { const v = plan.volumeAt(x + 1e-3, z + 1e-3) || plan.volumeAt(x - 1e-3, z - 1e-3); return v && (v.kind === 'door' || v.id === room.id); });
      check(route.length >= 3 && throughDoor, `${site.id}: the guide routes through ${route.length - 2} doorway point(s) into the room`, `${site.id}: the guide route does not go through the room's door`);
    }

    /* HOSTS INSIDE THEIR ROOMS, AND LEVEL FLOORS */
    {
      const off = [], uneven = [];
      for (const site of world.sites) {
        const mk = built.siteMarkers.get(site.questId);
        const room = ROOMS.find(r => r.site === site.id);
        if (!mk || !room) { off.push(`${site.id}: missing`); continue; }
        const g = mk.group;
        g.updateMatrixWorld(true);
        // Every body of the host that is not its shell stands inside the room (the dome's inside the dome's ring).
        g.traverse(o => {
          if (!o.isMesh || !o.geometry) return;
          for (let n = o; n && n !== g; n = n.parent) if (n === mk.shell) return;
          // Vertex by vertex: the bake merges a host's parts, and a merged mesh's box spans the room.
          const pos = o.geometry.attributes.position, v = new THREE.Vector3();
          const r = room.rect, pad = 0.3;
          for (let i = 0; i < pos.count; i++) {
            v.fromBufferAttribute(pos, i).applyMatrix4(o.matrixWorld);
            const outside = room.shell === 'dome'
              ? Math.hypot(v.x - DOME.x, v.z - DOME.z) > DOME.r + pad
              : v.x < r.minX - pad || v.x > r.maxX + pad || v.z < r.minZ - pad || v.z > r.maxZ + pad;
            if (outside) {
              if (off.length < 12) off.push(`${site.id}: ${o.name || o.type} has a vertex at (${v.x.toFixed(1)}, ${v.y.toFixed(1)}, ${v.z.toFixed(1)}), outside its room`);
              break;
            }
          }
        });
        // The floor under the plate, its lane and the room is dead level.
        const a = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
        const c = Math.cos(a), sn = Math.sin(a);
        const hs = [];
        for (let lx = -LANE.hw; lx <= LANE.hw; lx += 0.7) for (let lz = -1.6; lz <= LANE.to; lz += 0.7) {
          hs.push(built.getTerrainHeight(site.pos[0] + lx * c + lz * sn, site.pos[2] - lx * sn + lz * c));
        }
        if (Math.max(...hs) - Math.min(...hs) > 0.02) uneven.push(`${site.id} floor varies by ${(Math.max(...hs) - Math.min(...hs)).toFixed(2)} m`);
        // A room is at least 12 m by 12 m: the lean-in camera has air on both sides and behind the player.
        const w = room.rect.maxX - room.rect.minX, d = room.rect.maxZ - room.rect.minZ;
        if (Math.min(w, d) < 11.2 || room.top < 5.0) off.push(`${site.id}: room is ${w.toFixed(1)} x ${d.toFixed(1)} m, ${room.top} m high`);
      }
      check(off.length === 0, "every host's machinery stands inside its room, and every room is at least 11.2 m across and 5 m high", off.join('\n         '));
      check(uneven.length === 0, 'the floor under every plate and its lane is dead level', uneven.join('\n         '));
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

    /* THE ICE HOLE IS CUT THROUGH THE LAKE */
    {
      const g = built.siteMarkers.get('q9-absorb').group;
      let hole = null;
      g.traverse(o => { if (!hole && o.isMesh && o.material === built.M.water) hole = o; });
      const p = new THREE.Vector3();
      hole?.getWorldPosition(p);
      check(Boolean(hole) && lakeE(p.x, p.z) < 1, `bench 9's hole is cut through the lake's ice (${hole ? lakeE(p.x, p.z).toFixed(2) : '-'} of the way to the shore)`, "bench 9's hole is not on the lake");
    }

    /* FIELD POINTS RETIRED */
    {
      const { fieldPointsOf } = await import('../src/three/field-points.js');
      const points = fieldPointsOf(built);
      check(points.length === 0, 'Lanternfall registers no field point (no stage fetches)', `unexpected field point(s): ${points.map(p => p.id).join(', ')}`);
    }

    /* THE WALK: FLOOD FILL, SINGLE FLOOR, REACHABILITY AND THE BOSS'S GROUND */
    {
      const f = S.flood(built, { bound: 100, cell: 0.5, radius: 0.25, step: 0.6 });
      check(f.ledges.length === 0, `${f.reached} cells of ground are walkable with no ledge`, `walkable ledges:\n         ${f.ledges.join('\n         ')}`);
      const stray = f.cells.filter(([x, z]) => !plan.volumeAt(x, z));
      check(stray.length === 0, 'every reachable cell is in the walk: nobody reaches the lake, the glacier, a moraine, a roof or a hill top',
        `reachable cells outside the walk: ${stray.slice(0, 4).map(c => `(${c[0].toFixed(1)}, ${c[1].toFixed(1)})`).join(' ')}`);
      const onLake = f.cells.filter(([x, z]) => lakeE(x, z) < 1 && !['room', 'door', 'ramp'].includes(plan.volumeAt(x, z)?.kind));
      check(onLake.length === 0, 'nobody walks out onto the lake except into the two caves on its ice', `${onLake.length} reachable cells on the open lake`);
      const lows = f.cells.map(c => c[2]);
      check(Math.min(...lows) >= -0.05 && Math.max(...lows) <= 15.45, `reachable ground spans ${Math.min(...lows).toFixed(2)} to ${Math.max(...lows).toFixed(2)} m`, 'reachable ground leaves the walk\'s levels');
      const low = S.lowBodies(built, THREE, f.cells);
      check(low.length === 0, 'single floor: no body under 2.4 m over reachable ground', `low bodies:\n         ${low.join('\n         ')}`);
      for (const site of world.sites) check(f.reachable(site.approachPos[0], site.approachPos[2], 1.2), `${site.id}: approach reachable from the spawn`, `${site.id}: unreachable`);
      const pad = world.landmarks.find(l => l.asset === 'landing-pad');
      check(f.reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the walk', 'the landing pad is walled off');
      const A = world.arena;
      check(f.reachable(A.player[0], A.player[2], 1.0) && f.reachable(A.boss[0], A.boss[2], 1.0), "the Lantern-Eater's ground and the player's mark are reachable", 'boss ground unreachable');
      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (f.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      let level = true;
      for (let a = 0; a < 16; a++) for (let rr = 0; rr <= 7; rr += 1) {
        const h = built.getTerrainHeight(A.boss[0] + Math.cos(a / 8 * Math.PI) * rr, A.boss[2] + Math.sin(a / 8 * Math.PI) * rr);
        if (Math.abs(h - built.getTerrainHeight(A.boss[0], A.boss[2])) > 0.02) level = false;
      }
      check(clear && level, 'seven metres all round the Lantern-Eater are open, level ground', 'something stands within 7 m of the Lantern-Eater, or the ground there is not level');
    }

    /* THE ROOMS ARE NOT ONE ROOM */
    {
      const shells = new Set(ROOMS.map(r => r.shell));
      const sizes = new Set(ROOMS.map(r => `${r.rect.maxX - r.rect.minX}x${r.rect.maxZ - r.rect.minZ}x${r.top}x${r.floor}`));
      check(shells.size === ROOMS.length, `${shells.size} different room shells for ${ROOMS.length} benches`, 'two benches share a room shell');
      check(sizes.size >= 8, `${sizes.size} different room sizes and floor levels`, 'the rooms are copies of each other');
      const thick = ROOMS.every(r => WALL_T >= 0.6);
      check(thick, 'every room has walls 0.6 m or more thick', 'a room has paper walls');
    }
  }
}

console.log('');
if (failures) {
  console.log(`LANTERNFALL FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('LANTERNFALL OK');
