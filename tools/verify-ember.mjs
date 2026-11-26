#!/usr/bin/env node
/**
 * verify-ember.mjs — Integrity and world-shape check of Ember Reach, Learn world 05's caldera switchback.
 *
 * Holds the rebuilt site (`docs/plans/ember-reach-world.md` section "Site rebuild") to every safety rule
 * and to `docs/plans/world-distinction-plan.md` section 3 via `tools/lib/world-shape-checks.mjs`:
 *
 *  - NO TWO THINGS OCCUPY THE SAME SPACE (`overlap.mjs`, 0.06 m tolerance)
 *  - NO BODY IS BURIED under the ground it stands on
 *  - WORLD SHAPE: bench ground spans >= 3 m (actual 18 m), >= 5 of 7 benches housed `R4+` (actual 7/7),
 *    no cloned coordinates, not one circle, not two columns, <= 2 plates in view from spawn (actual 0),
 *    single floor (zero `lowBodies` over reachable ground)
 *  - THE WALK: flood-fill from spawn reaches every bench approach, the pad, the boss arena and the
 *    caldera overlook with zero ledges; nobody can climb cliffs or drop off into the caldera floor
 *  - COVER & LAMPS: every room is under the shared cover mask (`lib/cover.js`); only lamps and the
 *    far lava lake are emissive; lamps share the 3-light `LampPool` and hang over every plate
 *  - GUIDE ROUTING: `routeTo` routes from spawn through doorways to every bench
 *  - BOSS ARENA: agrees with `BOSS_ARENA_SPOTS['boss-crucible']` and keeps 7 m clear around the Crucible
 *  - UNIT 5 BENCH DOCTRINE: all 7 benches + Crucible keep their stages, predictions, tours and animations
 */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { HOST_PLAN, LANE } from '../src/three/ember/host-plan.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const world = JSON.parse(readFileSync(join(root, 'src/three/world-data/ember.json'), 'utf8'));

let failures = 0;
const ok = msg => console.log(`  ok   ${msg}`);
const fail = msg => { failures++; console.log(`  FAIL ${msg}`); };
const check = (cond, okMsg, failMsg) => cond ? ok(okMsg) : fail(failMsg || okMsg);
const dist = (a, b) => Math.hypot(a[0] - b[0], a[2] - b[2]);

console.log(`Ember Reach — ${world.name}, ${world.place}\n`);

/* ------------------------------------------------------------ declarations */

{
  const L = world.landmarks;
  const clashes = [];
  for (let i = 0; i < L.length; i++) {
    for (let j = i + 1; j < L.length; j++) {
      const need = L[i].radius + L[j].radius;
      const d = dist(L[i].pos, L[j].pos);
      if (d < need) {
        clashes.push(`${L[i].asset}@[${L[i].pos[0]},${L[i].pos[2]}] and ${L[j].asset}@[${L[j].pos[0]},${L[j].pos[2]}] overlap by ${(need - d).toFixed(2)}u`);
      }
    }
  }
  check(clashes.length === 0, `${L.length} landmarks, every footprint disjoint`, `landmark footprints overlap:\n         ${clashes.join('\n         ')}`);
}

{
  const clashes = [];
  for (let i = 0; i < world.sites.length; i++) {
    for (let j = i + 1; j < world.sites.length; j++) {
      const d = dist(world.sites[i].pos, world.sites[j].pos);
      if (d < 8) clashes.push(`${world.sites[i].id} and ${world.sites[j].id} are ${d.toFixed(1)}u apart`);
    }
  }
  check(clashes.length === 0, 'no two sites are within 8u of each other', `sites crowd each other:\n         ${clashes.join('\n         ')}`);
}

{
  const main = world.pipes.find(r => r.id === 'caldera-main');
  check(Boolean(main), 'the caldera main is declared', 'no caldera-main pipe run');
  const loop = main?.points.filter(p => p[1] > 6) || [];
  check(loop.length >= 2, 'the caldera main lifts into a 7.4 m expansion loop across the arena entrance', 'the caldera main has no expansion loop');
}

/* -------------------------------------------------------------------- sites */

const chart = readFileSync(join(root, 'src/learn/worlds/unit05-thermodynamics.js'), 'utf8');
const chartQuests = [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)',\s*title:\s*["']([^"']+)["']/g)]
  .map(m => ({ id: m[1], title: m[2] }));

{
  const questIds = chartQuests.map(q => q.id);
  const live = new Set(
    [...chart.matchAll(/id:\s*'(q\d+-[a-z]+)'[\s\S]*?status:\s*'(\w+)'/g)]
      .map(m => [m[1], m[2]]).filter(([, st]) => st === 'live').map(([id]) => id)
  );
  check(questIds.length === 7, `unit05 charts ${questIds.length} benches`, `unit05 charts ${questIds.length} benches, not seven`);

  const siteQuests = world.sites.map(s => s.questId);
  const missing = questIds.filter(q => live.has(q) && !siteQuests.includes(q));
  check(missing.length === 0, 'every built unit05 bench has a site on the ground', `quests with no site: ${missing.join(', ')}`);

  const invented = siteQuests.filter(q => !questIds.includes(q));
  check(invented.length === 0, 'every site names a quest the chart actually declares', `unknown quests: ${invented.join(', ')}`);

  const wrong = world.sites.filter(s => s.built !== live.has(s.questId));
  check(wrong.length === 0, 'built sites agree with the chart', `built flag mismatch: ${wrong.map(s => s.id).join(', ')}`);

  const stem = w => w.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  const off = [];
  for (const s of world.sites) {
    const q = chartQuests.find(x => x.id === s.questId);
    const prefix = `Bench ${s.stage} - `;
    if (!s.label.startsWith(prefix)) { off.push(`${s.id} reads "${s.label}"`); continue; }
    const words = s.label.slice(prefix.length).split(/\s+/).map(stem).filter(w => w.length >= 3);
    const title = new Set((q?.title || '').split(/\s+/).map(stem));
    if (!words.some(w => title.has(w))) off.push(`${s.id} reads "${s.label}", shares no word with "${q?.title}"`);
  }
  check(off.length === 0, 'every site label names its bench by what it teaches', off.join('\n         '));

  const stages = world.sites.map(s => s.stage);
  check(new Set(stages).size === stages.length, 'site stage numbers are unique', 'duplicate stage numbers');
  const bad = world.sites.filter(s => { const d = dist(s.pos, s.approachPos); return d < 1.5 || d > 8; });
  check(bad.length === 0, 'every site has a usable approach mark', `approach marks out of range: ${bad.map(s => s.id).join(', ')}`);
}

/* -------------------------------------------------------------- tier parity */

{
  const t4Only = world.landmarks.filter(l => l.minTier === 'T4');
  check(t4Only.length > 0, `${t4Only.length} landmarks are T4 decoration`, 'no T4 decoration declared');
  check(world.sites.every(s => world.t2.stillCamera[s.id]), 'every site has a T2 still camera', 'a site has no T2 still camera');
}

/* ---------------------------------------------------------------- the words */

{
  const WITHHELD = ['nucleophile', 'electrophile', 'carbonyl', 'carbocation', 'alkyl', 'ester', 'epoxide', 'isopropyl'];
  const strings = [world.name, world.place, world.oneLine, ...world.sites.map(s => s.label)];
  const bad = [];
  for (const str of strings) {
    for (const word of WITHHELD) if (new RegExp(`\\b${word}s?\\b`, 'i').test(str)) bad.push(`"${str}" contains "${word}"`);
  }
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
  check(nearest < 60, `the nearest site is ${nearest.toFixed(0)}u from the spawn`, `nearest site is ${nearest.toFixed(0)}u away`);
  check(world.landmarks.some(l => l.asset === 'landing-pad'), 'the Avalon has a landing pad on the rim shelf', 'no landing-pad landmark');
  const lanterns = world.landmarks.filter(l => l.asset === 'lamp-post').length;
  check(lanterns >= 20, `${lanterns} work lamps mark the switchback road`, `only ${lanterns} work lamps`);
}

/* ------------------------------------------- the boss's ground agrees */

{
  const src = readFileSync(join(root, 'src/learn/engine/boss-arena.js'), 'utf8');
  const m = src.match(/'boss-crucible':\s*\{([\s\S]*?)\}/);
  const num = re => (m?.[1].match(re)?.[1] || '').split(',').map(Number);
  const player = num(/playerPos:\s*\[([^\]]+)\]/), boss = num(/bossPos:\s*\[([^\]]+)\]/);
  const same = (a, b) => a.length === 3 && a.every((v, i) => Math.abs(v - b[i]) < 1e-6);
  check(Boolean(m) && same(player, world.arena.player) && same(boss, world.arena.boss),
    `the Crucible is fought where the world keeps its ground open (${world.arena.boss.join(', ')})`,
    `boss-arena.js puts the Crucible at ${boss.join(',')} / player ${player.join(',')}, but world opens ${world.arena.boss.join(',')} / ${world.arena.player.join(',')}`);
}

/* --------------------------------------------- the world as it is built */

{
  const { installDomShim } = await import('./lib/dom-shim.mjs');
  installDomShim({ tier: 'T4' });
  const THREE = await import('three');
  const { EmberReachWorld } = await import('../src/three/ember.js');
  const { findOverlaps } = await import('./lib/overlap.mjs');
  const { geyserPhase } = await import('../src/three/ember/effects.js');
  const S = await import('./lib/world-shape-checks.mjs');

  let built = null;
  try {
    built = new EmberReachWorld(null);
  } catch (err) {
    check(false, 'the world builds', `EmberReachWorld threw: ${err.stack || err.message}`);
  }

  if (built) {
    let meshes = 0;
    built.scene.traverse(o => { if (o.isMesh) meshes++; });
    check(meshes > 200, `the world builds — ${meshes} meshes`, `only ${meshes} meshes were built`);

    built.terrainMesh.geometry.computeBoundingBox();
    const tb = built.terrainMesh.geometry.boundingBox;
    const r = Math.min(-tb.min.x, tb.max.x, -tb.min.z, tb.max.z);
    check(r > 800, `the ground runs ${Math.round(r)} m to the horizon`, `ground ends ${Math.round(r)} m out`);
    check(built.lakeMesh?.userData.phys === 'ground' && built.lakeMesh.position.y < -18,
      `the lava lake lies ${(-built.lakeMesh.position.y).toFixed(1)} m below Level 4, as ground`,
      'the lava lake is missing or not below the overlook');
    check(tb.max.y > 120, `the caldera walls and cone stand ${Math.round(tb.max.y)} m high`, 'no caldera walls or cone');

    /* WORLD SHAPE (world-distinction-plan.md section 3) */
    {
      const bg = S.benchGround(built);
      check(bg.span >= 3, `bench ground spans ${bg.span.toFixed(2)} m (${bg.lo.toFixed(2)} to ${bg.hi.toFixed(2)} m)`,
        `bench ground spans only ${bg.span.toFixed(2)} m (< 3 m)`);
      const hs = S.housing(built, THREE);
      const housedCount = hs.filter(h => h.housed).length;
      check(housedCount >= 5, `${housedCount}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`,
        `only ${housedCount}/${hs.length} benches housed (${hs.map(h => h.code).join(' ')})`);
      const clones = S.sharedLayout(world);
      check(clones.length === 0, 'no bench coordinates shared with any other world', `shares layout with: ${clones.join(', ')}`);
      check(!S.oneCircle(world), 'benches are not arranged on one circle', 'benches lie on one circle');
      check(!S.twoColumns(world), 'benches are not arranged in two straight columns', 'benches lie in two straight columns');
      const seen = S.platesInView(built, THREE, world.spawn.pos);
      check(seen.length <= 2, `${seen.length} plate(s) in view from the spawn (<= 2)`, `too many plates in view from spawn: ${seen.join(', ')}`);
    }

    /* THE VENT FIELD BREATHES */
    {
      check(built.vents.length >= 10, `${built.vents.length} steam plumes rise off vents and plant`, `only ${built.vents.length} plumes`);
      check(Boolean(built.geyserVent), 'the geyser has a vent to erupt from', 'the geyser has no vent');
      let erupts = 0;
      for (let t = 0; t < 200; t += 0.5) if (geyserPhase(t) >= 0) erupts++;
      check(erupts > 0 && erupts < 120, `the geyser erupts for ${(erupts * 0.5).toFixed(0)} s of every 200`, 'geyser cycle broken');
      const fans = built.movers.filter(o => o.userData.mover.kind === 'yaw').length;
      const bubbles = built.movers.filter(o => o.userData.mover.kind === 'bubble').length;
      check(fans >= 3 && bubbles >= 6, `${fans} cooling fans turn and ${bubbles} bubbles swell in the mud`, `movers missing (${fans} fans, ${bubbles} bubbles)`);
    }

    /* FRAME UPDATE */
    {
      const eye = new THREE.Vector3(...world.spawn.pos);
      let threw = null;
      try { for (let f = 0; f < 3; f++) built.update(1 / 60, eye); } catch (err) { threw = err; }
      check(!threw, 'a frame updates with the eye handed in as a position', `update threw: ${threw?.message}`);
      check(!threw && built.sky.position.distanceTo(eye) < 1e-6, 'the sky dome follows the eye', 'sky dome did not follow eye');
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
        if (box.max.y < ground - 0.3 && buried.length < 10) {
          buried.push(`${ownerName(o)}: tops out at ${box.max.y.toFixed(2)}u under ground at ${ground.toFixed(2)}u`);
        }
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

    /* ONLY LAMPS AND LAVA LAKE ARE LIT + COVER MASK */
    {
      const lit = new Set();
      built.scene.traverse(o => {
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) if (m && m.emissive && m.emissiveIntensity > 0 && m.emissive.getHex() !== 0) lit.add(m);
      });
      const allowed = new Set([built.M.lantern, built.M.magma]);
      const strangers = [...lit].filter(m => !allowed.has(m));
      check(strangers.length === 0, `${lit.size} emissive materials: work lamps and the lava lake; nothing else is lit`,
        `${strangers.length} unexpected emissive material(s)`);
      let realLights = 0;
      built.scene.traverse(o => { if (o.isPointLight) realLights++; });
      check(realLights === 3 && built.lamps.length >= 30,
        `${built.lamps.length} lamps share ${realLights} pooled PointLights`,
        `${built.lamps.length} lamps and ${realLights} PointLights`);

      const uncovered = world.sites.filter(s => {
        const cv = built.cover.at(s.pos[0], s.pos[1] + 1.0, s.pos[2]);
        return cv.sun < 0.9 || cv.sky < 0.5;
      });
      check(uncovered.length === 0, `all ${world.sites.length} rooms are covered by the shared cover mask`,
        `uncovered rooms: ${uncovered.map(s => s.id).join(', ')}`);
    }

    /* EVERY SITE FACES ITS APPROACH, IS LEVEL, HAS A BENCH ANCHOR, EXTENT, LAMP, AND GUIDE ROUTE */
    for (const site of world.sites.filter(s => s.built)) {
      const anchor = built.benchAnchor(site.questId);
      check(Boolean(anchor), `${site.id}: reports a working surface`, `${site.id} has no bench anchor`);
      if (!anchor) continue;
      const want = Math.atan2(site.approachPos[0] - site.pos[0], site.approachPos[2] - site.pos[2]);
      const diff = Math.abs(Math.atan2(Math.sin(anchor.rotationY - want), Math.cos(anchor.rotationY - want)));
      check(diff < 0.01, `${site.id}: faces its approach`, `${site.id}: wrong facing`);
      const ground = built.getTerrainHeight(anchor.position[0], anchor.position[2]);
      check(Math.abs(anchor.topY - (ground + 0.995)) < 0.05,
        `${site.id}: plate at ${anchor.topY.toFixed(2)}u on floor ${ground.toFixed(2)}u`,
        `${site.id}: plate ${anchor.topY.toFixed(2)} vs floor ${ground.toFixed(2)}`);
      check(Boolean(anchor.dormant), `${site.id}: has dormant cabinet`, `${site.id}: missing dormant cabinet`);

      const route = built.routeTo(site.id, world.spawn.pos);
      check(route.length >= 3, `${site.id}: guide routes through ${route.length - 2} waypoints`, `${site.id}: guide route has no waypoints`);
    }

    /* HOST EXTENTS & LEVEL GROUND */
    {
      const off = [], uneven = [];
      for (const site of world.sites) {
        const g = built.siteMarkers.get(site.questId)?.group;
        const plan = HOST_PLAN[site.id];
        if (!g || !plan) { off.push(`${site.id}: missing`); continue; }
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

    /* LAMP OVER EVERY TABLETOP PLATE */
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

    /* FIELD POINTS RETIRED */
    {
      const { fieldPointsOf } = await import('../src/three/field-points.js');
      const points = fieldPointsOf(built);
      check(points.length === 0, 'no field point is registered', `unexpected field points: ${points.map(p => p.id).join(', ')}`);
    }

    /* FLOOD FILL, SINGLE FLOOR, REACHABILITY, AND ARENA CLEARANCE */
    {
      const f = S.flood(built, { bound: 100, cell: 0.5, radius: 0.25, step: 0.6 });
      check(f.ledges.length === 0, `${f.reached} cells of ground are walkable with zero ledges`, `walkable ledges:\n         ${f.ledges.join('\n         ')}`);
      const lows = f.cells.map(c => c[2]);
      const minH = Math.min(...lows), maxH = Math.max(...lows);
      check(minH >= -0.25 && maxH <= 24.5, `reachable elevation spans ${minH.toFixed(2)} to ${maxH.toFixed(2)} m (nobody reaches cliffs or the drop)`,
        `reachable elevation leaked: ${minH.toFixed(2)} to ${maxH.toFixed(2)} m`);

      const low = S.lowBodies(built, THREE, f.cells);
      check(low.length === 0, 'single floor: zero bodies below 2.4 m over reachable ground', `low bodies:\n         ${low.join('\n         ')}`);

      for (const site of world.sites) {
        check(f.reachable(site.approachPos[0], site.approachPos[2], 1.2), `${site.id}: approach reachable from spawn`, `${site.id}: unreachable`);
      }
      const pad = world.landmarks.find(l => l.asset === 'landing-pad');
      check(f.reachable(pad.pos[0], pad.pos[2], 6), 'the landing pad is joined to the walk', 'landing pad unreachable');
      const A = world.arena;
      check(f.reachable(A.player[0], A.player[2], 1.0) && f.reachable(A.boss[0], A.boss[2], 1.0),
        "the Crucible's arena and player mark are reachable", "boss arena unreachable");
      check(f.reachable(0, -70, 1.5), 'the north caldera overlook is reachable', 'overlook unreachable');
      const pastDrop = built.getTerrainHeight(0, -94);
      check(pastDrop < -18, `past the north rail the caldera floor lies at ${pastDrop.toFixed(1)} m`, `drop past rail is only ${pastDrop.toFixed(1)} m`);

      let clear = true;
      for (let a = 0; a < 16; a++) {
        const x = A.boss[0] + Math.cos(a / 16 * Math.PI * 2) * 7, z = A.boss[2] + Math.sin(a / 16 * Math.PI * 2) * 7;
        for (let t = 0; t <= 1; t += 0.1) if (f.blocked(A.boss[0] + (x - A.boss[0]) * t, A.boss[2] + (z - A.boss[2]) * t)) clear = false;
      }
      check(clear, 'seven metres all round the Crucible are open ground', 'something stands within 7 m of the Crucible');
    }
  }
}

/* ------------------------------------------------------------ Unit 5 bench doctrine checks */

console.log('\nEmber Reach — the benches and the boss, held to the rules of the rework\n');
{
  const MODEL = await import('../src/learn/table/model.js');
  const { tourSteps } = await import('../src/learn/table/tour.js');
  const MP = await import('../src/learn/engine/model-parts.js');
  const { QUEST_STORY } = await import('../src/story/quest-story.js');
  const { SCENES } = await import('../src/ui/story-scenes.js');
  const { WORLDS } = await import('../src/learn/curriculum.js');
  const world5 = WORLDS.find(w => w.id === 'unit05');
  const mods = new Map();
  for (const q of world5.quests) mods.set(q.id, await q.module());
  const counts = { stages: 0, predicts: 0, tours: 0, models: 0 };
  const bad0 = failures;
  for (const [id, mod] of mods) {
    const stages = mod.STAGES;
    const isBoss = id.startsWith('boss-');
    if (stages.length < 3 || stages.length > 9) fail(`unit05/${id} has ${stages.length} stages, not 3 to 9`);
    let predicts = 0;
    stages.forEach((st, i) => {
      counts.stages++;
      const label = `unit05/${id} stage ${i + 1}`;
      const t = MODEL.createTable(st.table, st.title);
      if (Object.keys(t.fetch).length) fail(`${label}: unexpected field fetch`);
      if (t.prediction) fail(`${label}: prediction token on non-predict stage`);
      if (st.predict) {
        predicts++;
        counts.predicts++;
        if (isBoss) fail(`${label}: boss phase asks for prediction`);
        if (Object.values(t.fixtures).some(f => !f.noRun || Object.keys(f.dials).length)) fail(`${label}: predict stage has runnable instrument`);
        if (t.tools.length) fail(`${label}: predict stage carries a tool`);
        const next = stages[i + 1];
        if (!next) fail(`${label}: predict stage has no test stage after it`);
        else {
          const nt = MODEL.createTable(next.table, next.title);
          if (next.predict || !Object.values(nt.fixtures).length && !Object.values(nt.pieces).some(p => ['block', 'charge', 'eqn', 'bond', 'phase'].includes(p.kind))) fail(`${label}: next stage must bring instrument`);
          if (typeof next.prompt !== 'string') fail(`${label}: test stage has no prompt`);
        }
        if (!Object.values(t.zones.slots).length) fail(`${label}: predict stage has no slot`);
        if (typeof st.onClear !== 'function') fail(`${label}: predict stage missing onClear`);
      }
      const steps = tourSteps(t, {});
      counts.tours++;
      for (const f of Object.values(t.fixtures)) {
        if (f.props?.backdrop || f.kind === 'plaque' || f.kind === 'plate' || f.kind === 'marker' || f.kind === 'selector' || f.kind === 'tally' || f.kind === 'stamp' || f.kind === 'choice' || f.kind === 'tchoice' || f.kind === 'lchoice') continue;
        if (!steps.some(s => s.flag.startsWith(`tour_${t.kit}_fx_${f.kind}`))) fail(`${label}: "${f.label}" missing from Tour`);
      }
      for (const v of mod.VOCABULARY || []) {
        if (v.introducedAt > i) for (const s of steps) if (v.term.test(`${s.name} ${s.desc}`)) fail(`${label}: Tour leaks "${v.term}"`);
      }
      const r = (() => { try { return st.reward; } catch { return null; } })();
      if (r?.model) {
        counts.models++;
        try { const parts = MP.modelParts(r.model); if (!parts.spheres.length) fail(`${label}: empty reward model`); } catch (e) { fail(`${label}: reward model failed (${e.message})`); }
        if (!MP.captionOf(r.model)) fail(`${label}: reward model has no caption`);
      }
    });
    if (!isBoss && !predicts) fail(`unit05/${id} has no predict stage`);
    if (predicts > 2) fail(`unit05/${id} has ${predicts} predict stages`);
  }
  for (const key of ['unit05/q1-flow', 'unit05/q5-hess', 'unit05/q7-gibbs', 'unit05/boss-crucible']) {
    const st = QUEST_STORY[key];
    if (!st) fail(`${key} has no story animation`);
    else if (!SCENES[st.scene]) fail(`${key} names missing painter "${st.scene}"`);
  }
  for (const key of Object.keys(QUEST_STORY)) if (key.startsWith('unit05/') && !mods.has(key.replace('unit05/', ''))) fail(`${key} is a story animation for no quest`);
  check(failures === bad0, `${counts.stages} stages in ${mods.size} quests: 3 to 9 each, predict-first, Tour coverage, ${counts.models} reward models, four story animations`);
}

console.log('');
if (failures) {
  console.log(`EMBER REACH FAILED — ${failures} problem${failures === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log('EMBER REACH OK');
